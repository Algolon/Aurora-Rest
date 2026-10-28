/** MAT-ART-R01 "Soft Sculpted Nordic Ground": one stylized direction for forest-floor and meadow-turf.
 * Isolated review variant. The original MAT-01 definitions, generators and synthesis are not modified; coastal-sand
 * and bedrock pass through the original synthesizeMaterial unchanged. Output format (albedo + height, surface
 * normal/AO/roughness) and the shader that reads it are identical to MAT-01, so only texture content and
 * per-material uniforms differ. Deterministic: fixed seeds, integer hash noise, mulberry32 placement.
 *
 * R4 (same follow-up): R3's ≈1 m mats repeated visibly on the 2.6 m tile at 10–30 m, so mats shrink to ≈20–40 cm
 * with a softer base; metre-scale moss carpets are left to the shader's world-space patch layer.
 *
 * R3 (same follow-up): forest moss only — R2's lit lobe clusters read as clover/lily pads at 2–6 m, so moss becomes
 * irregular low mats of tiny short tufts (the meadow's vocabulary at moss scale) over a soft moss base. Meadow is R2.
 *
 * R2 (owner-authorised follow-up resolving the R1 ART CONDITIONAL item): close-range shape vocabulary only — meadow
 * clumps become fans of tapered, pointed blades (`tuft`/`blade`) instead of soft ellipses (forest moss was tried as
 * lobed mound clusters, superseded by R3), and meadow accents move toward the tuft tone. Palette, tints, synthesis
 * and shader inputs are unchanged from R1.
 *
 * R1 (single refinement after the first A/B comparison): colour hierarchy only — meadow palette desaturated ≈20% and
 * warmed ≈7° toward olive moss, macro/exposure hue swing and meso amount restored, forest moss slightly muted and its
 * patch tint greener to narrow the family hue gap. Shapes and synthesis are unchanged from the first comparison.
 *
 * Design (docs/mat-art-r01/MATERIAL_SPEC.md): shapes are sculpted clumps and cushions 6–30 cm across with a soft
 * dome light gradient, carrying only a restrained number of wide, low-contrast strokes. Value contrast lives at
 * clump scale and above, not at blade/grain scale, so the 3D grass and trees carry silhouette detail. */
import {clamp,fbm,hash2,lerp,mulberry32,smoothstep} from '../terrain-material/noise.ts';
import {MATERIALS,type MaterialDefinition} from '../terrain-material/materials.ts';
import {boxBlurWrap,linearToSrgb,paletteLut,srgbToLinear,synthesizeMaterial,type SynthesizedTexture} from '../terrain-material/textures.ts';

/** Synthesis parameters that MAT-01 hard-codes per generator; the variant owns its own values. */
interface StylizedSynthesis {
 /** Height range (m) represented by 0..1 in the height channel; drives detail-normal slope. */
 reliefM:number;
 /** Strength and radius (fraction of tile) of the low-frequency luminance equalisation. MAT-01: 0.9 at 1/8. */
 equalise:number;equaliseRadius:number;
 /** Cavity AO gain and floor. MAT-01: 2.6 and 0.35. */
 cavityGain:number;cavityFloor:number;
}
export const SYNTHESIS:Record<'forest-floor'|'meadow-turf',StylizedSynthesis>={
 'forest-floor':{reliefM:.022,equalise:.65,equaliseRadius:1/4,cavityGain:1.6,cavityFloor:.55},
 'meadow-turf':{reliefM:.02,equalise:.65,equaliseRadius:1/4,cavityGain:1.6,cavityFloor:.55},
};

const base=(id:string)=>{const d=MATERIALS.find(m=>m.id===id);if(!d)throw Error(id);return d;};
/** MAT-ART-R01 definitions. Only forest-floor and meadow-turf differ from MAT-01; changed fields are listed in the spec. */
export const MAT_ART_R01_DEFINITIONS:readonly MaterialDefinition[]=MATERIALS.map(d=>{
 if(d.id==='forest-floor')return {...d,name:'Nordic Forest Floor · MAT-ART-R01',tileM:2.6,
  palette:[[0,'#2c2a20'],[.16,'#3b3728'],[.26,'#4a4231'],[.36,'#5a4c39'],[.46,'#50583b'],[.56,'#5c6743'],[.66,'#6b764c'],[.76,'#7c8657'],[.84,'#857452'],[.92,'#9c8656'],[1,'#b09a66']],
  normalStrength:.6,macroTint:[[1.1,1.0,.86],[.84,1.04,.88]],exposureTint:[1.06,1.02,.92],
  patch:{tint:[.84,1.12,.82],scaleM:11,coverage:.5},mesoAmount:.36};
 if(d.id==='meadow-turf')return {...d,name:'Meadow Turf · MAT-ART-R01',tileM:3.0,
  palette:[[0,'#2e3324'],[.14,'#38402c'],[.28,'#454e35'],[.4,'#505b3b'],[.52,'#5c6743'],[.64,'#6a754a'],[.74,'#778153'],[.84,'#89905d'],[.92,'#989569'],[1,'#ac9e7a']],
  normalStrength:.5,macroTint:[[1.2,1.07,.78],[.84,1.0,.9]],exposureTint:[1.14,1.02,.8],
  patch:{tint:[1.12,1.03,.78],scaleM:8,coverage:.34},mesoAmount:.45};
 return d;
});

class Plane {
 readonly S:number;readonly c:Float32Array;readonly h:Float32Array;readonly r:Float32Array;private readonly lut:Float32Array;
 constructor(S:number,lut:Float32Array){this.S=S;this.lut=lut;this.c=new Float32Array(S*S*3);this.h=new Float32Array(S*S);this.r=new Float32Array(S*S);}
 idx(x:number,y:number){const S=this.S;x=Math.round(x);y=Math.round(y);return (((y%S)+S)%S)*S+(((x%S)+S)%S);}
 paint(k:number,t:number,amount=1){const li=Math.round(clamp(t)*1023)*3;for(let q=0;q<3;q++)this.c[k*3+q]=lerp(this.c[k*3+q],this.lut[li+q],amount);}
 noise(period:number,seed:number,octaves=4){const S=this.S,out=new Float32Array(S*S);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++)out[y*S+x]=fbm(x/S*period,y/S*period,seed,octaves,period);return out;}
 /** Soft sculpted blob: anti-aliased ragged rim, domed height, palette tone lit from one side so every clump has a
  * light shoulder and a shaded foot — the hand-painted cue — instead of per-pixel speckle. */
 blob(cx:number,cy:number,rx:number,ry:number,angle:number,t:number,o:{dome:number;lit:number;opacity:number;rough:number;ragged:number;seed:number;soft?:number;axis?:number}){
  const R=Math.ceil(Math.max(rx,ry)*1.15)+1,co=Math.cos(angle),si=Math.sin(angle),soft=o.soft??.35,LX=-.62,LY=-.78;
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){
   const u=(dx*co+dy*si)/rx,v=(-dx*si+dy*co)/ry,a=Math.atan2(v,u),q=Math.hypot(u,v);
   const edge=1+o.ragged*(fbm(Math.cos(a)*1.6+cx*.37,Math.sin(a)*1.6+cy*.37,o.seed,2)*.9);
   if(q>edge)continue;const k=this.idx(cx+dx,cy+dy),f=1-smoothstep(edge*(1-soft),edge,q),qq=Math.min(1,q/edge);
   // Dome normal in texture space → simple Lambert-like gradient across the clump.
   const nx=u/edge*.9,ny=v/edge*.9,shade=-(nx*LX+ny*LY)*(1-qq*qq*.4);
   this.paint(k,t+o.lit*shade-.05*qq*qq+(o.axis??0)*u/edge,f*o.opacity);
   this.h[k]=Math.max(this.h[k],lerp(this.h[k],this.h[k]*.5+.35+o.dome*Math.sqrt(Math.max(0,1-qq*qq)),f));
   this.r[k]=lerp(this.r[k],o.rough,f);}
 }
 /** Tapered, pointed blade with a 1 px anti-aliased edge: root darker, tip lighter, one side catching the light. */
 blade(x0:number,y0:number,angle:number,len:number,width:number,t:number,o:{opacity:number;axis:number;side:number;lift:number;curve:number}){
  const steps=Math.max(3,Math.ceil(len*1.5));let x=x0,y=y0,a=angle;
  for(let s=0;s<=steps;s++){const along=s/steps,half=Math.max(.7,width/2*Math.pow(1-along,.8)),nx=-Math.sin(a),ny=Math.cos(a);
   for(let w=-half-1;w<=half+1;w+=.5){const cov=clamp(half+.5-Math.abs(w));if(cov<=0)continue;const k=this.idx(x+nx*w,y+ny*w),side=w/half;
    this.paint(k,t+o.axis*(along-.35)+o.side*side,cov*o.opacity);
    this.h[k]=Math.max(this.h[k],lerp(this.h[k],.36+o.lift*(1-.4*along)*(1-.5*side*side),cov));this.r[k]=lerp(this.r[k],.9,cov);}
   x+=Math.cos(a)*len/steps;y+=Math.sin(a)*len/steps;a+=o.curve/steps;}
 }
 /** Grass tuft: 3–5 blades fanned around the sward lean from one root. */
 tuft(cx:number,cy:number,lean:number,size:number,t:number,rng:()=>number){
  const n=3+Math.floor(rng()*3);
  for(let b=0;b<n;b++){const f=n>1?b/(n-1)-.5:0;
   this.blade(cx+(rng()-.5)*size*.5,cy+(rng()-.5)*size*.3,lean+f*.95+(rng()-.5)*.25,size*(1.6+rng()*.9),size*(.42+rng()*.16),t+(rng()-.5)*.07,
    {opacity:.93,axis:.17,side:.045,lift:.3,curve:(rng()-.5)*.6+f*.25});}
 }
 /** Wide, soft stroke (≥ 2 px) with partial opacity; `t` is a palette offset applied to the existing colour region. */
 stroke(x0:number,y0:number,angle:number,len:number,width:number,t:number,opacity:number,lift:number,curve=0){
  const steps=Math.max(2,Math.ceil(len*1.5));let x=x0,y=y0,a=angle;
  for(let s=0;s<=steps;s++){const along=s/steps,taper=1-.55*along;
   for(let w=-width/2;w<=width/2;w+=.5){const k=this.idx(x-Math.sin(a)*w*taper,y+Math.cos(a)*w*taper);this.paint(k,t+.04*along,opacity*(1-.35*Math.abs(w)/(width/2+.01)));this.h[k]=Math.max(this.h[k],this.h[k]+lift*(1-along*.5)*.5);}
   x+=Math.cos(a)*len/steps;y+=Math.sin(a)*len/steps;a+=curve/steps;}
 }
}

function meadowTurf(p:Plane,seed:number){
 const S=p.S,rng=mulberry32(seed),area=(S/512)**2,px=S/512;
 const soil=p.noise(6,seed+1,3),broad=p.noise(3,seed+2,3),cover=p.noise(5,seed+3,3),tone=p.noise(4,seed+4,2);
 // Under-layer: soft olive turf, never dark soil — value gaps between clumps stay narrow.
 for(let k=0;k<S*S;k++){p.paint(k,.33+.06*soil[k]+.05*broad[k]);p.h[k]=.28+.06*soil[k];p.r[k]=.92;}
 // Clump-scale soil mottling (not grain): a few low-contrast darker and lighter patches.
 for(let i=0,N=Math.round(90*area);i<N;i++){const x=rng()*S,y=rng()*S,r=(10+rng()*14)*px;
  p.blob(x,y,r,r*(.6+rng()*.3),rng()*Math.PI,rng()<.6?.24+rng()*.04:.4+rng()*.04,{dome:0,lit:0,opacity:.45,rough:.93,ragged:.25,seed:seed+10,soft:.8});}
 const lean=-1.1;
 // Sculpted clumps, overlapping into a sward; a cover field thins them in places so the tile has meso rhythm.
 const clumps:{x:number;y:number;r:number;t:number}[]=[];
 for(let i=0,N=Math.round(3000*area);i<N&&clumps.length<1500*area;i++){const x=rng()*S,y=rng()*S,c=cover[p.idx(x,y)];
  if(rng()>.3+.7*smoothstep(-.6,.3,c))continue;const sz=rng();
  clumps.push({x,y,r:(7+sz*sz*12)*px,t:.5+.1*tone[p.idx(x,y)]+.12*(rng()-.5)+.05*c});}
 // Tapered grass tufts painted back-to-front (top of tile first): each fans around the sward lean from one root,
 // darker at the root and lighter toward pointed tips.
 clumps.sort((a,b)=>a.y-b.y);
 for(const c of clumps)p.tuft(c.x,c.y,lean,c.r*.85,c.t,rng);
 // Restrained blade accents: few, fanned and curved, on clump crowns, close to clump tone.
 for(let i=0,N=Math.round(1500*area);i<N;i++){const x=rng()*S,y=rng()*S,k=p.idx(x,y);if(p.h[k]<.55||rng()>.6)continue;
  const lighter=rng()<.6;p.stroke(x,y,lean+(rng()-.5)*1.6,(6+rng()*7)*px,1.5*px,lighter?.59+rng()*.05:.45+rng()*.05,lighter?.28:.26,.05,(rng()-.5)*1.1);}
 // Sparse dry-straw notes in loose groups.
 const dryField=p.noise(3,seed+5,2);
 for(let i=0,N=Math.round(380*area);i<N;i++){const x=rng()*S,y=rng()*S;if(rng()>smoothstep(.15,.5,dryField[p.idx(x,y)]))continue;
  p.stroke(x,y,lean+(rng()-.5)*1.4,(8+rng()*7)*px,1.5*px,.86+rng()*.06,.4,.04,(rng()-.5)*.9);}
}

function forestFloor(p:Plane,seed:number){
 const S=p.S,rng=mulberry32(seed),area=(S/512)**2,px=S/512;
 const humus=p.noise(4,seed+1,3),fine=p.noise(16,seed+2,2),crumb=p.noise(40,seed+7,2),moss=p.noise(3,seed+3,3),drift=p.noise(4,seed+6,3);
 for(let k=0;k<S*S;k++){p.paint(k,.26+.07*humus[k]+.035*fine[k]+.02*crumb[k]);p.h[k]=.3+.08*humus[k]+.04*fine[k];p.r[k]=.93;}
 // Humus clods and hollows: soft clump-scale value shapes instead of flat brown.
 for(let i=0,N=Math.round(220*area);i<N;i++){const x=rng()*S,y=rng()*S,r=(5+rng()*11)*px,dark=rng()<.5;
  p.blob(x,y,r,r*(.6+rng()*.3),rng()*Math.PI,dark?.2+rng()*.03:.34+rng()*.04,{dome:dark?0:.12,lit:.06,opacity:.55,rough:.93,ragged:.25,seed:seed+10,soft:.7});}
 // Needles/crumbs: few, soft, near-base tone (close-range richness without speckle).
 for(let i=0,N=Math.round(700*area);i<N;i++){const x=rng()*S,y=rng()*S;p.stroke(x,y,rng()*Math.PI*2,(5+rng()*7)*px,1.5*px,rng()<.7?.37+rng()*.05:.21+rng()*.03,.38,.03);}
 // Moss mats: irregular low carpets gathered by a broad field, built from many tiny short tufts in random
 // directions (the meadow's tuft vocabulary at moss scale) over a soft darker moss base — no lit lobes.
 // Mats stay ≈20–40 cm inside the 2.6 m tile so no large recognisable shape repeats; metre-scale moss carpets come
 // from the shader's world-space patch layer, which never tiles.
 const mossBase=p.noise(9,seed+15,3),mossFine=p.noise(8,seed+16,3),mat=new Float32Array(S*S);
 for(let k=0;k<S*S;k++)mat[k]=.75*mossFine[k]+.35*moss[k]+.1*mossBase[k];
 for(let k=0;k<S*S;k++){const m=smoothstep(.05,.27,mat[k]);if(m>0)p.paint(k,.5+.04*mossBase[k],m*.65);}
 for(let i=0,N=Math.round(7000*area);i<N;i++){const x=rng()*S,y=rng()*S,k=p.idx(x,y),m=smoothstep(.07,.31,mat[k]);if(rng()>m)continue;
  p.tuft(x,y,rng()*Math.PI*2,(2.2+rng()*2.2)*px,.53+.05*mossBase[k]+.04*(rng()-.5),rng);}
 // Twigs: few, thicker, only slightly darker than humus.
 for(let i=0,N=Math.round(14*area);i<N;i++){const x=rng()*S,y=rng()*S;p.stroke(x,y,rng()*Math.PI*2,(26+rng()*30)*px,2.5*px,.23+rng()*.03,.55,.18,(rng()-.5)*.7);}
 // Birch leaves as simplified ovals in drifts: larger, fewer, muted gold.
 for(let i=0,N=Math.round(260*area),placed=0;i<N&&placed<70*area;i++){const x=rng()*S,y=rng()*S;if(rng()>smoothstep(0,.45,drift[p.idx(x,y)]))continue;placed++;
  const r=(4.5+rng()*4)*px,kind=rng();p.blob(x,y,r,r*(.55+rng()*.15),rng()*Math.PI,kind<.75?.85+rng()*.05:.92+rng()*.04,{dome:.12,lit:.05,opacity:.7,rough:.85,ragged:.08,seed:seed+13,soft:.3});}
}

const GENERATORS={'forest-floor':forestFloor,'meadow-turf':meadowTurf} as const;

/** Packs a stylized plane in exactly MAT-01's texture format. */
function pack(p:Plane,def:MaterialDefinition,syn:StylizedSynthesis):SynthesizedTexture{
 const S=p.S,albedo=new Uint8Array(S*S*4),surface=new Uint8Array(S*S*4),texel=def.tileM/S,k=syn.reliefM/(2*texel);
 for(let i=0;i<S*S;i++)p.h[i]=clamp(p.h[i]);
 const blur=boxBlurWrap(boxBlurWrap(p.h,S,Math.max(2,Math.round(S/64))),S,Math.max(2,Math.round(S/64)));
 const lum=new Float32Array(S*S);let lumMean=0;
 for(let i=0;i<S*S;i++){lum[i]=.2126*srgbToLinear(p.c[i*3])+.7152*srgbToLinear(p.c[i*3+1])+.0722*srgbToLinear(p.c[i*3+2]);lumMean+=lum[i]/(S*S);}
 const R=Math.max(1,Math.round(S*syn.equaliseRadius/2)),low=boxBlurWrap(boxBlurWrap(lum,S,R),S,R);
 for(let i=0;i<S*S;i++){const f=Math.pow(lumMean/Math.max(1e-4,low[i]),syn.equalise);for(let q=0;q<3;q++)p.c[i*3+q]=linearToSrgb(Math.min(1,srgbToLinear(clamp(p.c[i*3+q]))*f));}
 const mean=[0,0,0];let meanH=0;
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=y*S+x,o=i*4;
  const sx=(p.h[y*S+(x+1)%S]-p.h[y*S+(x+S-1)%S])*k,sz=(p.h[((y+1)%S)*S+x]-p.h[((y+S-1)%S)*S+x])*k,l=Math.hypot(sx,sz,1);
  const ao=clamp(1-Math.max(0,blur[i]-p.h[i])*syn.cavityGain,syn.cavityFloor,1);
  for(let c=0;c<3;c++){const v=clamp(p.c[i*3+c]);albedo[o+c]=Math.round(v*255);mean[c]+=srgbToLinear(v)*(.4+.6*ao);}
  albedo[o+3]=Math.round(p.h[i]*255);meanH+=p.h[i];
  surface[o]=Math.round((.5-.5*sx/l)*255);surface[o+1]=Math.round((.5-.5*sz/l)*255);surface[o+2]=Math.round(ao*255);surface[o+3]=Math.round(clamp(p.r[i])*255);}
 return {size:S,albedo,surface,meanLinear:mean.map(v=>v/(S*S)) as [number,number,number],meanHeight:meanH/(S*S)};
}

/** Stylized synthesis for the two in-scope materials; every other material is the unchanged MAT-01 synthesis. */
export function synthesizeMatArtR01(def:MaterialDefinition,size=512):SynthesizedTexture{
 if(def.id!=='forest-floor'&&def.id!=='meadow-turf')return synthesizeMaterial(base(def.id),size);
 const p=new Plane(size,paletteLut(def.palette));GENERATORS[def.id](p,def.seed);return pack(p,def,SYNTHESIS[def.id]);
}
