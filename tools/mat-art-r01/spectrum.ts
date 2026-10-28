/** MAT-ART-R01 Phase A: world-space spatial-frequency budget of synthesized ground textures.
 * Reads only synthesizeMaterial output; never writes textures. Run:
 *   node --experimental-strip-types tools/mat-art-r01/spectrum.ts [out.json] */
import {writeFileSync} from 'node:fs';
import {MATERIALS,type MaterialDefinition} from '../../src/terrain-material/materials.ts';
import {synthesizeMaterial,srgbToLinear,type SynthesizedTexture} from '../../src/terrain-material/textures.ts';

/** In-place iterative radix-2 complex FFT. */
function fft(re:Float64Array,im:Float64Array){
 const n=re.length;
 for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]];}}
 for(let len=2;len<=n;len<<=1){const a=-2*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a);
  for(let i=0;i<n;i+=len){let cr=1,ci=0;for(let k=0;k<len/2;k++){const p=i+k,q=p+len/2,tr=re[q]*cr-im[q]*ci,ti=re[q]*ci+im[q]*cr;
   re[q]=re[p]-tr;im[q]=im[p]-ti;re[p]+=tr;im[p]+=ti;const nr=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=nr;}}}
}
function fft2(field:Float64Array,S:number){
 const re=Float64Array.from(field),im=new Float64Array(S*S),rr=new Float64Array(S),ri=new Float64Array(S);
 for(let y=0;y<S;y++){rr.set(re.subarray(y*S,y*S+S));ri.fill(0);fft(rr,ri);re.set(rr,y*S);im.set(ri,y*S);}
 for(let x=0;x<S;x++){for(let y=0;y<S;y++){rr[y]=re[y*S+x];ri[y]=im[y*S+x];}fft(rr,ri);for(let y=0;y<S;y++){re[y*S+x]=rr[y];im[y*S+x]=ri[y];}}
 return {re,im};
}
/** Feature wavelength bands (cm). Upper band is bounded by the tile itself. */
export const BANDS:[string,number,number][]=[['grain <2.5 cm',0,2.5],['blade 2.5–6 cm',2.5,6],['tuft 6–15 cm',6,15],['clump 15–40 cm',15,40],['patch ≥40 cm',40,1e9]];
const lstar=(y:number)=>y>.008856?116*Math.cbrt(y)-16:903.3*y;

export function spectrum(tex:SynthesizedTexture,tileM:number){
 const S=tex.size,L=new Float64Array(S*S),slope=new Float64Array(S*S);let mean=0;
 for(let i=0;i<S*S;i++){const o=i*4,y=.2126*srgbToLinear(tex.albedo[o]/255)+.7152*srgbToLinear(tex.albedo[o+1]/255)+.0722*srgbToLinear(tex.albedo[o+2]/255);
  // Albedo as the shader sees it: cavity AO multiplies colour by mix(1, ao, .6) near the camera.
  const ao=tex.surface[o+2]/255;L[i]=lstar(y*(1-.6+.6*ao));mean+=L[i]/(S*S);
  const nx=tex.surface[o]/127.5-1,nz=tex.surface[o+1]/127.5-1;slope[i]=Math.hypot(nx,nz);}
 for(let i=0;i<S*S;i++)L[i]-=mean;
 const {re,im}=fft2(L,S),power=BANDS.map(()=>0);let total=0;
 for(let v=0;v<S;v++)for(let u=0;u<S;u++){if(!u&&!v)continue;const fu=u>S/2?u-S:u,fv=v>S/2?v-S:v,f=Math.hypot(fu,fv),lambdaCm=tileM/f*100,p=(re[v*S+u]**2+im[v*S+u]**2)/(S*S*S*S);
  total+=p;const b=BANDS.findIndex(([,lo,hi])=>lambdaCm>=lo&&lambdaCm<hi);if(b>=0)power[b]+=p;}
 let sMean=0,sSq=0;for(let i=0;i<S*S;i++){sMean+=slope[i]/(S*S);sSq+=slope[i]**2/(S*S);}
 let aoMean=0,aoSq=0;for(let i=0;i<S*S;i++){const a=tex.surface[i*4+2]/255;aoMean+=a/(S*S);aoSq+=a*a/(S*S);}
 return {texelMm:tileM/S*1000,rmsLstar:Math.sqrt(total),bands:Object.fromEntries(BANDS.map(([n],i)=>[n,{rmsLstar:Math.sqrt(power[i]),varianceShare:power[i]/total}])),
  normalSlopeRms:Math.sqrt(sSq),normalSlopeMean:sMean,aoMean,aoStd:Math.sqrt(Math.max(0,aoSq-aoMean*aoMean)),meanLinear:tex.meanLinear};
}

/** Screen footprint of one pixel on flat ground seen from eye height h at horizontal distance d (vertical FOV, image height). */
export function footprint(d:number,h=1.75,fovDeg=57,heightPx=700){
 const a=2*Math.tan(fovDeg*Math.PI/360)/heightPx,ray=Math.hypot(d,h),grazing=h/ray;
 return {distanceM:d,acrossMm:ray*a*1000,alongMm:ray*a/grazing*1000};
}

if(import.meta.url===`file://${process.argv[1]}`){
 const rows=(defs:readonly MaterialDefinition[],synth:(d:MaterialDefinition)=>SynthesizedTexture)=>defs.filter(d=>d.id==='forest-floor'||d.id==='meadow-turf').map(d=>({id:d.id,tileM:d.tileM,normalStrength:d.normalStrength,...spectrum(synth(d),d.tileM)}));
 const report={milestone:'MAT-ART-R01 Phase A',note:'Luminance in CIE L* including the shader near-field cavity-AO factor; 512 px textures; variance share per world wavelength band.',
  footprints:[1,2,3,5,8,12,20,35].map(d=>footprint(d)),
  original:rows(MATERIALS,d=>synthesizeMaterial(d,512)),
  matArtR01:[] as ReturnType<typeof rows>};
 // The variant is optional so the Phase A diagnosis can run before any variant exists.
 try{const v=await import('../../src/mat-art-r01/variant.ts');report.matArtR01=rows(v.MAT_ART_R01_DEFINITIONS,d=>v.synthesizeMatArtR01(d,512));}catch(e){if((e as {code?:string}).code!=='ERR_MODULE_NOT_FOUND')throw e;}
 const out=process.argv[2];if(out)writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 for(const set of ['original','matArtR01'] as const)for(const r of report[set])console.log(set.padEnd(10),r.id.padEnd(13),'tile',r.tileM,'texel',r.texelMm.toFixed(1),'mm  L*rms',r.rmsLstar.toFixed(2),
  Object.entries(r.bands).map(([k,v])=>`${k.split(' ')[0]} ${(v.varianceShare*100).toFixed(0)}%/${v.rmsLstar.toFixed(2)}`).join('  '),' slope',r.normalSlopeRms.toFixed(3),'ao',r.aoMean.toFixed(2),'±',r.aoStd.toFixed(2));
 for(const f of report.footprints)console.log(`d ${f.distanceM} m: pixel ${f.acrossMm.toFixed(1)} mm across × ${f.alongMm.toFixed(1)} mm along`);
}
