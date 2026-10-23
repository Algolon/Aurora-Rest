/** Material classification layer: TerrainDataSource + RULES → canonical MaterialClassification.
 * Pure and deterministic. Runs once per terrain revision, never per frame and never per tile,
 * so mesh resolution and tiling cannot influence the result. Smooth fields (intents, warp, macro and
 * meso noise) are evaluated on a 4× coarser lattice and bilinearly upsampled; slope, curvature and
 * distances stay at the canonical 4 m resolution. */
import {MATERIAL_ORDER,RULES,type AnchorIntent} from './rules.ts';
import {blurField,curvatureField,distanceField,rasterizeRings,slopeField} from './fields.ts';
import {clamp,fbm,smoothstep} from './noise.ts';
import type {Lattice,MaterialClassification,TerrainDataSource} from './types.ts';

export interface ClassificationFields {
 slope:Float32Array;curvature:Float32Array;coastDistance:Float32Array;freshwaterDistance:Float32Array;forestIntent:Float32Array;forestIntentLattice:Lattice;
}
export interface ClassificationResult {classification:MaterialClassification;fields?:ClassificationFields;timingsMs:Record<string,number>}

const COARSE=4;

/** Quantise weights to bytes summing to exactly 255 (largest remainder; ties → lowest index). */
export function quantizeWeights(w:ArrayLike<number>,out:Uint8Array,offset:number){
 let sum=0;for(let k=0;k<w.length;k++)sum+=w[k];
 const n=w.length,scaled=new Array<number>(n),floor=new Array<number>(n);let used=0;
 for(let k=0;k<n;k++){scaled[k]=sum>0?w[k]/sum*255:k===1?255:0;floor[k]=Math.floor(scaled[k]);used+=floor[k];}
 for(let left=255-used;left>0;left--){let best=0,rem=-1;for(let k=0;k<n;k++){const r=scaled[k]-floor[k];if(r>rem){rem=r;best=k;}}floor[best]++;scaled[best]=floor[best];}
 for(let k=0;k<n;k++)out[offset+k]=floor[k];
}

function resolveAnchors(source:TerrainDataSource,intents:readonly AnchorIntent[]){
 return intents.map(it=>{const a=source.anchors.find(a=>a.id===it.anchor);if(!a)throw new Error('Unknown anchor '+it.anchor);return [a.xz[0],a.xz[1],1/it.radiusM[0],1/it.radiusM[1],it.weight];});
}
const anchorField=(list:number[][],x:number,z:number)=>{let v=0;for(const [cx,cz,ix,iz,w] of list)v=Math.max(v,w*Math.exp(-(((x-cx)*ix)**2+((z-cz)*iz)**2)*1.45));return v;};

export function classifyTerrain(source:TerrainDataSource,options:{keepFields?:boolean}={}):ClassificationResult{
 const R=RULES,L:Lattice=source.lattice,{width:W,height:H,cellM:c,west,north}=L,N=W*H,h=source.heights,t0=performance.now(),timings:Record<string,number>={};
 let mark=t0;const lap=(k:string)=>{const now=performance.now();timings[k]=Math.round(now-mark);mark=now;};
 if(h.length!==N)throw new Error('Height array does not match lattice');
 // 1. Water masks from verified water-surface levels.
 const sea=new Uint8Array(N),fresh=new Uint8Array(N);
 for(let k=0;k<N;k++){const w=source.water?source.water[k]:NaN;
  if(Number.isFinite(w)){if(w<=.001)sea[k]=1;else if(w>h[k])fresh[k]=1;}else if(h[k]<0)sea[k]=1;}
 // 2. Derived geometry at canonical resolution.
 const slope=slopeField(h,L),curv=curvatureField(h,L,3);lap('slopeCurvature');
 const coastD=distanceField(sea,L),freshD=distanceField(fresh,L);lap('distances');
 // 3. Smooth fields on the coarse lattice (node (I,J) coincides with fine node (I·4, J·4)).
 const CL:Lattice={width:Math.floor((W-1)/COARSE)+2,height:Math.floor((H-1)/COARSE)+2,cellM:c*COARSE,west,north},CN=CL.width*CL.height;
 const forestRaw=new Float32Array(CN).fill(R.forestOutside);
 for(const region of source.regions){const affinity=R.forestByCatchment[region.id];if(affinity===undefined)continue;
  const m=rasterizeRings(region.rings,CL);for(let k=0;k<CN;k++)if(m[k])forestRaw[k]=affinity;}
 const forestIntent=blurField(forestRaw,CL,Math.max(1,Math.round(R.intentBlurM/CL.cellM/1.6)));
 const dunes=resolveAnchors(source,R.dune),coves=resolveAnchors(source,R.cove),mires=resolveAnchors(source,R.mire),s=R.seed,F=R.forest;
 const NF=8,coarse=new Float32Array(CN*NF);// forest intent (warped), dune, cove, mire, windward, macro, glade, edge noise
 for(let J=0;J<CL.height;J++)for(let I=0;I<CL.width;I++){
  const x=west+I*CL.cellM,z=north-J*CL.cellM,o=(J*CL.width+I)*NF;
  const wx=x+fbm(x/R.warp.scaleM,z/R.warp.scaleM,s+1,3)*R.warp.amplitudeM,wz=z+fbm(x/R.warp.scaleM,z/R.warp.scaleM,s+2,3)*R.warp.amplitudeM;
  const gx=Math.min(CL.width-1.0001,Math.max(0,(wx-west)/CL.cellM)),gz=Math.min(CL.height-1.0001,Math.max(0,(north-wz)/CL.cellM)),ii=Math.floor(gx),jj=Math.floor(gz),u=gx-ii,v=gz-jj,q=jj*CL.width+ii;
  coarse[o]=(forestIntent[q]*(1-u)+forestIntent[q+1]*u)*(1-v)+(forestIntent[q+CL.width]*(1-u)+forestIntent[q+CL.width+1]*u)*v;
  const dune=anchorField(dunes,wx,wz);
  coarse[o+1]=dune;coarse[o+2]=anchorField(coves,wx,wz);coarse[o+3]=anchorField(mires,wx,wz);
  coarse[o+4]=smoothstep(R.windward.fromX,R.windward.toX,wx)*(1-dune);
  coarse[o+5]=fbm(wx/R.macro.scaleM,wz/R.macro.scaleM,s+3,4);
  coarse[o+6]=smoothstep(F.gladeThreshold[0],F.gladeThreshold[1],fbm(wx/F.gladeScaleM,wz/F.gladeScaleM,s+6,3))*F.gladeStrength;
  coarse[o+7]=fbm(wx/F.edgeScaleM,wz/F.edgeScaleM,s+7,2);
 }
 lap('coarseFields');
 // 4. Per-node rules.
 const layers=Math.ceil(MATERIAL_ORDER.length/4),weights=new Uint8Array(N*4*layers),attributes=new Uint8Array(N*4),wv=[0,0,0,0],cf=new Float32Array(NF);
 const K=R.rock,S=R.sand,Wt=R.wet,E=R.exposure;
 for(let j=0;j<H;j++){const z=north-j*c,J=(j/COARSE)|0,v=(j-J*COARSE)/COARSE;
  for(let i=0;i<W;i++){const k=j*W+i,x=west+i*c,hk=h[k],sl=slope[k],cv=curv[k],dC=coastD[k],dF=freshD[k];
   const I=(i/COARSE)|0,u=(i-I*COARSE)/COARSE,a=(J*CL.width+I)*NF,b=a+NF,cc=a+CL.width*NF,d=cc+NF;
   for(let f=0;f<NF;f++)cf[f]=(coarse[a+f]*(1-u)+coarse[b+f]*u)*(1-v)+(coarse[cc+f]*(1-u)+coarse[d+f]*u)*v;
   const fi=cf[0],dune=cf[1],cove=cf[2],mire=cf[3],windward=cf[4],macro=cf[5],glade=cf[6],edge=cf[7];
   const meso=fbm(x/90,z/90,s+4,3);
   // Rock coverage: steep faces, thin alpine soil, summits, convex knolls, exposed coast and sparse outcrops (soft union).
   const steep=smoothstep(K.slope[0]+K.slopeJitter*meso,K.slope[1]+K.slopeJitter*meso,sl);
   const altitude=smoothstep(K.altitudeM[0],K.altitudeM[1],hk+K.altitudeJitterM*macro);
   const alpine=altitude*(.3+.7*smoothstep(.08,.45,sl));
   const summit=smoothstep(K.summitM[0],K.summitM[1],hk+K.altitudeJitterM*meso);
   const convex=smoothstep(K.convexity[0],K.convexity[1],-cv)*smoothstep(K.convexSlope[0],K.convexSlope[1],sl);
   const coastRock=(1-smoothstep(K.coastM[0],K.coastM[1],dC))*smoothstep(K.coastSlope[0]*(1-windward*.5),K.coastSlope[1],sl)*(1-dune*.8)+windward*(1-smoothstep(10,90,dC))*smoothstep(.06,.25,sl);
   const outcrop=smoothstep(K.outcropThreshold[0],K.outcropThreshold[1],fbm(x/K.outcropScaleM,z/K.outcropScaleM,s+5,3)*.5+.5)*smoothstep(K.outcropSlope[0],K.outcropSlope[1],sl)*(.35+.65*altitude);
   let rock=1-(1-steep)*(1-alpine*.85)*(1-summit*.75)*(1-convex*.7)*(1-clamp(coastRock))*(1-outcrop*.8);
   // Sand: low, gentle shore band; widest in the dune and cove intents, suppressed on the windward coast.
   const width=S.baseWidthM+S.duneWidthM*dune+S.coveWidthM*cove+S.widthJitterM*meso;
   const maxH0=S.maxHeightM[0]+(S.duneMaxHeightM[0]-S.maxHeightM[0])*dune,maxH1=S.maxHeightM[1]+(S.duneMaxHeightM[1]-S.maxHeightM[1])*dune;
   const maxS0=S.maxSlope[0]+(S.duneMaxSlope[0]-S.maxSlope[0])*dune,maxS1=S.maxSlope[1]+(S.duneMaxSlope[1]-S.maxSlope[1])*dune;
   let sand=(1-smoothstep(width*.55,width,dC))*(1-smoothstep(maxH0,maxH1,hk))*(1-smoothstep(maxS0,maxS1,sl))*(1-windward*.85);
   if(sea[k]){sand=hk>S.seabedSandM?1:.5;rock=Math.max(rock*.5,1-sand);}
   // Forest share of the vegetated base: intent (+ riparian copses) × treeline × slope × coast buffer, opened by glades.
   const riparian=F.riparianStrength*Math.exp(-dF/F.riparianM)*(1-smoothstep(F.riparianMaxM*.6,F.riparianMaxM,hk))*smoothstep(-.1,.35,meso);
   const treeline=1-smoothstep(F.treelineM[0]+F.treelineJitterM*macro,F.treelineM[1]+F.treelineJitterM*macro,hk);
   const forestRaw=Math.max(fi*(1-glade),riparian)*treeline*(1-smoothstep(F.maxSlope[0],F.maxSlope[1],sl))*smoothstep(F.coastBufferM[0],F.coastBufferM[1],dC)*(1-mire*.6)*(1-dune);
   // Ecotone: within the transition band, ~30 m interleaving so the edge reads as groves and openings, not a contour.
   const f0=smoothstep(F.edge[0],F.edge[1],forestRaw+F.edgeNoise*edge+.04*meso),band=4*f0*(1-f0);
   const forest=band>0?smoothstep(F.edge[0],F.edge[1],forestRaw+F.edgeNoise*edge+.04*meso+F.ecotoneNoise*band*fbm(x/F.ecotoneScaleM,z/F.ecotoneScaleM,s+8,2)):f0;
   rock=clamp(rock);sand=clamp(sand);
   wv[0]=forest*(1-sand)*(1-rock);wv[1]=(1-forest)*(1-sand)*(1-rock);wv[2]=sand*(1-rock);wv[3]=rock;
   quantizeWeights(wv,weights,k*4);
   // Attributes.
   const freshWet=Math.exp(-dF/Wt.freshwaterM)*(1-smoothstep(Wt.freshwaterSlope[0],Wt.freshwaterSlope[1],sl));
   const shoreWet=(1-smoothstep(Wt.shoreBandM[0],Wt.shoreBandM[1],dC))*(1-smoothstep(Wt.shoreHeightM[0],Wt.shoreHeightM[1],hk));
   const mireWet=mire*(1-smoothstep(Wt.mireHeightM[0],Wt.mireHeightM[1],hk))*(.55+.45*smoothstep(-.4,.4,meso));
   const hollowWet=smoothstep(Wt.hollow[0],Wt.hollow[1],cv)*Wt.hollowStrength;
   const wet=sea[k]||fresh[k]?1:clamp(Math.max(freshWet*.85,shoreWet,mireWet*.8,hollowWet));
   const exposure=clamp(.55*smoothstep(E.altitudeM[0],E.altitudeM[1],hk)+.35*smoothstep(E.convexity[0],E.convexity[1],-cv)+.35*windward*(1-smoothstep(0,E.coastM,dC)));
   attributes[k*4]=Math.round(wet*255);attributes[k*4+1]=Math.round(clamp(.5+.5*macro)*255);
   attributes[k*4+2]=Math.round(exposure*255);attributes[k*4+3]=Math.round(clamp(sl/1.5)*255);
  }
 }
 lap('rules');timings.total=Math.round(performance.now()-t0);
 const classification:MaterialClassification={schema:'aurora-rest-terrain-material/1',lattice:{...L},materials:MATERIAL_ORDER,weights,attributes,rulesVersion:R.version,sourceId:source.id};
 return {classification,timingsMs:timings,fields:options.keepFields?{slope,curvature:curv,coastDistance:coastD,freshwaterDistance:freshD,forestIntent,forestIntentLattice:CL}:undefined};
}

/** SHA-256 of the canonical bytes (weights then attributes) via Web Crypto (browser and Node ≥ 20). */
export async function classificationHash(c:MaterialClassification):Promise<string>{
 const bytes=new Uint8Array(c.weights.length+c.attributes.length);bytes.set(c.weights,0);bytes.set(c.attributes,c.weights.length);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
