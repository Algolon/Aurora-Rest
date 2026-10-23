/** Self-authored procedural detail textures (no third-party sources, no licences required).
 * Each material synthesises one tileable square with two RGBA8 planes:
 *   albedo  = sRGB colour (gradient-mapped through the material palette) + height in A
 *   surface = tangent normal x/z in R/G, cavity AO in B, roughness in A
 * Pure TypeScript, deterministic per (definition, size); runs once at load. */
import {clamp,fbm,hash2,lerp,mulberry32,smoothstep,valueNoise} from './noise.ts';
import type {MaterialDefinition} from './materials.ts';

export interface SynthesizedTexture {size:number;albedo:Uint8Array;surface:Uint8Array;meanLinear:[number,number,number];meanHeight:number}

export const srgbToLinear=(c:number)=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
export const linearToSrgb=(c:number)=>c<=.0031308?c*12.92:1.055*c**(1/2.4)-.055;
const EQUALISE=.9;
/** Separable wrapped box blur of a square field. */
export function boxBlurWrap(src:Float32Array,S:number,r:number):Float32Array{
 const a=new Float32Array(S*S),b=new Float32Array(S*S),n=2*r+1;
 for(let y=0;y<S;y++){let sum=0;for(let d=-r;d<=r;d++)sum+=src[y*S+((d%S)+S)%S];for(let x=0;x<S;x++){a[y*S+x]=sum/n;sum+=src[y*S+(x+r+1)%S]-src[y*S+((x-r)%S+S)%S];}}
 for(let x=0;x<S;x++){let sum=0;for(let d=-r;d<=r;d++)sum+=a[(((d%S)+S)%S)*S+x];for(let y=0;y<S;y++){b[y*S+x]=sum/n;sum+=a[((y+r+1)%S)*S+x]-a[(((y-r)%S+S)%S)*S+x];}}
 return b;
}
const hex=(s:string)=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255) as [number,number,number];

/** 1024-entry sRGB lookup table for a palette of [t, hex] stops. */
export function paletteLut(stops:[number,string][]):Float32Array{
 const lut=new Float32Array(1024*3),cols=stops.map(([t,h])=>[t,...hex(h)]);
 for(let i=0;i<1024;i++){const t=i/1023;let k=0;while(k<cols.length-2&&t>cols[k+1][0])k++;
  const a=cols[k],b=cols[k+1],f=clamp((t-a[0])/((b[0]-a[0])||1));for(let c=0;c<3;c++)lut[i*3+c]=lerp(a[c+1],b[c+1],f);}
 return lut;
}

class Plane {
 readonly S:number;readonly c:Float32Array;readonly h:Float32Array;readonly r:Float32Array;private readonly lut:Float32Array;
 constructor(S:number,lut:Float32Array){this.S=S;this.lut=lut;this.c=new Float32Array(S*S*3);this.h=new Float32Array(S*S);this.r=new Float32Array(S*S);}
 idx(x:number,y:number){const S=this.S;x=Math.round(x);y=Math.round(y);return (((y%S)+S)%S)*S+(((x%S)+S)%S);}
 /** Paint palette position t at pixel k, blended in sRGB by `amount` (composites, never interpolates the palette). */
 paint(k:number,t:number,amount=1){const li=Math.round(clamp(t)*1023)*3;for(let q=0;q<3;q++)this.c[k*3+q]=lerp(this.c[k*3+q],this.lut[li+q],amount);}
 shade(k:number,f:number){for(let q=0;q<3;q++)this.c[k*3+q]*=f;}
 /** Tileable fbm sampled per pixel; `period` lattice cells per tile. */
 noise(period:number,seed:number,octaves=4){const S=this.S,out=new Float32Array(S*S);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++)out[y*S+x]=fbm(x/S*period,y/S*period,seed,octaves,period);return out;}
 /** Line stroke; `paint(along)` returns [t, height] for 0..1 along its length. */
 stroke(x0:number,y0:number,angle:number,len:number,width:number,paint:(a:number)=>[number,number],curve=0){
  const steps=Math.max(2,Math.ceil(len*2));let x=x0,y=y0,a=angle;
  for(let s=0;s<=steps;s++){const along=s/steps,[t,dh]=paint(along);
   for(let w=0;w<width;w++){const k=this.idx(x-Math.sin(a)*w,y+Math.cos(a)*w);this.paint(k,t);this.h[k]=Math.max(this.h[k],dh);}
   x+=Math.cos(a)*len/steps;y+=Math.sin(a)*len/steps;a+=curve/steps;}
 }
 /** Filled rotated ellipse with a domed height profile and optional ragged edge. */
 ellipse(cx:number,cy:number,rx:number,ry:number,angle:number,t:number,base:number,dome:number,rough:number,ragged=0,seed=0,amount=1){
  const R=Math.ceil(Math.max(rx,ry))+1,co=Math.cos(angle),si=Math.sin(angle);
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){
   const u=(dx*co+dy*si)/rx,v=(-dx*si+dy*co)/ry,q=u*u+v*v,edge=1+(ragged?ragged*(hash2(Math.round(cx+dx),Math.round(cy+dy),seed)-.5):0);
   if(q>edge)continue;const k=this.idx(cx+dx,cy+dy);this.paint(k,t,amount);this.h[k]=Math.max(this.h[k],base+dome*(1-q));this.r[k]=rough;}
 }
}

function forestFloor(p:Plane,seed:number){
 const S=p.S,rng=mulberry32(seed),area=(S/512)**2;
 const humus=p.noise(5,seed+1),crumb=p.noise(64,seed+2,2),tuft=p.noise(9,seed+3,3),bump=p.noise(48,seed+4,2);
 for(let k=0;k<S*S;k++){
  p.paint(k,.19+.08*humus[k]+.04*crumb[k]);p.h[k]=.32+.12*humus[k]+.06*crumb[k];p.r[k]=.93;
  const m=smoothstep(.28,.46,tuft[k]+.12*bump[k])*.8;// sparse, soft moss tufts; moss carpets are shader meso patches
  if(m>0){p.paint(k,.55+.1*bump[k],m);p.h[k]=lerp(p.h[k],.5+.16*bump[k],m);p.r[k]=lerp(.93,.97,m);}
 }
 for(let i=0,N=Math.round(1700*area);i<N;i++){const x=rng()*S,y=rng()*S;
  const t=rng()<.7?.38+rng()*.06:.29+rng()*.06,base=p.h[p.idx(x,y)];
  p.stroke(x,y,rng()*Math.PI*2,(.01+rng()*.014)*S,1,()=>[t,base+.08]);}
 for(let i=0,N=Math.round(22*area);i<N;i++){const x=rng()*S,y=rng()*S,t=.26+rng()*.05;
  p.stroke(x,y,rng()*Math.PI*2,(.05+rng()*.09)*S,rng()<.4?2:1,a=>[t-.03*a,.62+.1*Math.sin(a*3)],(rng()-.5)*.8);}
 const drift=p.noise(4,seed+6,3);// birch leaves gather in drifts rather than an even scatter
 for(let i=0,N=Math.round(240*area),placed=0;i<N&&placed<110*area;i++){const x=rng()*S,y=rng()*S;if(rng()>smoothstep(-.05,.45,drift[p.idx(x,y)]))continue;placed++;
  const size=rng(),rx=(.006+size*size*.012)*S,kind=rng();
  const t=kind<.5?.79+rng()*.04:kind<.9?.84+rng()*.08:.93+rng()*.05;
  p.ellipse(x,y,rx,rx*(.5+rng()*.18),rng()*Math.PI,t,.55,.14,.85,0,0,.65+rng()*.25);}
}

function meadowTurf(p:Plane,seed:number){
 const S=p.S,rng=mulberry32(seed),area=(S/512)**2,soil=p.noise(10,seed+1,3),cover=p.noise(4,seed+2,3);
 for(let k=0;k<S*S;k++){p.paint(k,.1+.06*soil[k]);p.h[k]=.2+.08*soil[k];p.r[k]=.92;}
 const cov=(x:number,y:number)=>clamp(.66+.5*cover[p.idx(x,y)]);
 for(let i=0,N=Math.round(3400*area);i<N;i++){const x=rng()*S,y=rng()*S;if(rng()>cov(x,y)+.15)continue;
  const t=.26+rng()*.06;p.stroke(x,y,rng()*Math.PI*2,(.01+rng()*.012)*S,1,()=>[t,.32]);}
 const lean=-1.1;
 for(let i=0,N=Math.round(17000*area);i<N;i++){const x=rng()*S,y=rng()*S;if(rng()>cov(x,y))continue;
  const dry=rng()<.06,t0=dry?.74+rng()*.06:.42+rng()*.08,t1=dry?.9+rng()*.08:.64+rng()*.16,g=(rng()+rng()+rng()-1.5)*1.1;
  p.stroke(x,y,lean+g,(.011+rng()*.02)*S,1,a=>[lerp(t0,t1,a),.38+.5*a],(rng()-.5)*.6);}
 for(let i=0,N=Math.round(60*area);i<N;i++){const x=rng()*S,y=rng()*S,r=(.004+rng()*.004)*S;
  for(let l=0;l<5;l++){const a=l/5*Math.PI*2+rng();p.ellipse(x+Math.cos(a)*r,y+Math.sin(a)*r,r*.9,r*.55,a,.58+rng()*.06,.6,.1,.88);}}
}

function coastalSand(p:Plane,seed:number){
 const S=p.S,base=p.noise(6,seed+1),warp=p.noise(3,seed+2,3),mask=p.noise(2,seed+3,2),rng=mulberry32(seed);
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const k=y*S+x,g=hash2(x,y,seed+9)-.5,g2=hash2(x>>1,y>>1,seed+10)-.5;
  const phase=Math.PI*2*(7*x+3*y)/S+1.6*warp[k],r=Math.pow(.5+.5*Math.sin(phase+.35*Math.sin(phase)),2.2),m=smoothstep(-.2,.4,mask[k]);
  // Darker heavy-mineral grains settle in ripple troughs; crests are paler and drier.
  p.paint(k,.53+.07*base[k]+.12*g+.07*g2+(r-.45)*.08*m);p.h[k]=.45+.1*base[k]+.08*g+r*.14*m;p.r[k]=.95;}
 for(let i=0,N=Math.round(320*(S/512)**2);i<N;i++){const x=rng()*S,y=rng()*S,dark=rng()<.6,r=.7+rng()*1.3;
  p.ellipse(x,y,r,r*(.7+rng()*.3),rng()*3,dark?.06+rng()*.14:.94+rng()*.06,.55,.08,dark?.8:.7);}
}

function bedrock(p:Plane,seed:number){
 // Glacially rounded granite: smooth broad relief, two sparse broken joint sets, faint foliation, mineral speckle, lichen.
 const S=p.S,tone=p.noise(3,seed+1),mid=p.noise(9,seed+2,3),grain=p.noise(48,seed+3,2),warp=p.noise(4,seed+4,3),breakA=p.noise(5,seed+5,3),breakB=p.noise(6,seed+6,3),rng=mulberry32(seed);
 const joint=(x:number,y:number,a:number,b:number,w:number)=>{const ph=(a*x+b*y)/S+.06*w,f=ph-Math.floor(ph);return 1-smoothstep(0,.012,Math.abs(f-.5));};
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const k=y*S+x;
  const jA=joint(x,y,1,3,warp[k])*smoothstep(-.05,.25,breakA[k]),jB=joint(x,y,4,-1,warp[k]+mid[k]*.5)*smoothstep(.1,.35,breakB[k])*.8;
  const crack=Math.max(jA,jB),fol=.5+.5*Math.sin(Math.PI*2*(5*x+2*y)/S+2.2*warp[k]),sp=hash2(x,y,seed+7);
  const t=.5+.08*tone[k]+.05*mid[k]+.03*grain[k]+.035*(fol-.5)+(sp<.05?.15:sp>.94?-.12:0);
  p.paint(k,lerp(t,.12,crack));p.h[k]=.5+.18*tone[k]+.1*mid[k]+.03*grain[k]-.3*crack;p.r[k]=lerp(.8,.95,crack);
  const stain=smoothstep(.25,.6,mid[k]*.6+tone[k]*.6);if(stain>0)p.shade(k,1-.1*stain);// weathering stains
 }
 for(let i=0,N=Math.round(32*(S/512)**2);i<N;i++){const x=rng()*S,y=rng()*S,r=(.008+rng()*.018)*S,grey=rng()<.65;
  p.ellipse(x,y,r,r*(.7+rng()*.3),rng()*3,grey?.8+rng()*.03:.9+rng()*.1,p.h[p.idx(x,y)],.02,.9,.7,seed+i,grey?.45:.6);}
}

const GENERATORS={'forest-floor':forestFloor,'meadow-turf':meadowTurf,'coastal-sand':coastalSand,bedrock} as const;
/** Height range represented by 0..1 in the height channel (m), used to derive normals. */
const RELIEF_M={'forest-floor':.025,'meadow-turf':.03,'coastal-sand':.006,bedrock:.07} as const;

export function synthesizeMaterial(def:MaterialDefinition,size=512):SynthesizedTexture{
 const S=size,lut=paletteLut(def.palette),p=new Plane(S,lut);GENERATORS[def.generator](p,def.seed);
 const albedo=new Uint8Array(S*S*4),surface=new Uint8Array(S*S*4),texel=def.tileM/S,k=RELIEF_M[def.generator]/(2*texel);
 for(let i=0;i<S*S;i++)p.h[i]=clamp(p.h[i]);
 // Cavity AO: height below its wrapped local mean.
 const r=Math.max(2,Math.round(S/64));let blur=Float32Array.from(p.h);
 for(let pass=0;pass<2;pass++){const tmp=new Float32Array(S*S);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){let s=0;for(let d=-r;d<=r;d++)s+=blur[y*S+(((x+d)%S)+S)%S];tmp[y*S+x]=s/(2*r+1);}
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){let s=0;for(let d=-r;d<=r;d++)s+=tmp[((((y+d)%S)+S)%S)*S+x];blur[y*S+x]=s/(2*r+1);}}
 // Tile equalisation (high-pass): divide out luminance variation larger than S/8 so no low-frequency blotch can
 // repeat on the tile grid. Large-scale variation is the shader's job (world-space, non-repeating).
 const lum=new Float32Array(S*S);let lumMean=0;
 for(let i=0;i<S*S;i++){lum[i]=.2126*srgbToLinear(p.c[i*3])+.7152*srgbToLinear(p.c[i*3+1])+.0722*srgbToLinear(p.c[i*3+2]);lumMean+=lum[i]/(S*S);}
 const lowLum=boxBlurWrap(boxBlurWrap(lum,S,S>>3),S,S>>3);
 for(let i=0;i<S*S;i++){const f=Math.pow(lumMean/Math.max(1e-4,lowLum[i]),EQUALISE);for(let q=0;q<3;q++)p.c[i*3+q]=linearToSrgb(Math.min(1,srgbToLinear(clamp(p.c[i*3+q]))*f));}
 const mean=[0,0,0];let meanH=0;
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=y*S+x,o=i*4;
  const sx=(p.h[y*S+(x+1)%S]-p.h[y*S+(x+S-1)%S])*k,sz=(p.h[((y+1)%S)*S+x]-p.h[((y+S-1)%S)*S+x])*k,l=Math.hypot(sx,sz,1);
  const ao=clamp(1-Math.max(0,blur[i]-p.h[i])*2.6,.35,1);
  for(let c=0;c<3;c++){const v=clamp(p.c[i*3+c]);albedo[o+c]=Math.round(v*255);mean[c]+=srgbToLinear(v)*(.4+.6*ao);}
  albedo[o+3]=Math.round(p.h[i]*255);meanH+=p.h[i];
  surface[o]=Math.round((.5-.5*sx/l)*255);surface[o+1]=Math.round((.5-.5*sz/l)*255);surface[o+2]=Math.round(ao*255);surface[o+3]=Math.round(clamp(p.r[i])*255);
 }
 return {size:S,albedo,surface,meanLinear:mean.map(v=>v/(S*S)) as [number,number,number],meanHeight:meanH/(S*S)};
}

/** MAT-01P candidate (opt-in): baked fBm for the shader's meso, patch, ecotone and anti-tiling masks.
 * Same value-noise basis (smoothstep-interpolated lattice hash) and octave weights (.6/.3/.1) as `tmFbm` in shader.ts,
 * but integer octave ratios (1, 2, 4) so it tiles every `period` lattice cells. Four decorrelated channels; output
 * range 0..1 like tmFbm. Deterministic; synthesised once at load. */
export interface BakedNoiseTexture {size:number;period:number;data:Uint8Array}
export function synthesizeNoiseTexture(size=512,period=32,seed=7331):BakedNoiseTexture{
 const data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=x/size*period,v=y/size*period,o=(y*size+x)*4;
  for(let c=0;c<4;c++){const s=seed+c*977;
   const n=.6*(valueNoise(u,v,s,period)*.5+.5)+.3*(valueNoise(u*2,v*2,s+101,period*2)*.5+.5)+.1*(valueNoise(u*4,v*4,s+202,period*4)*.5+.5);
   data[o+c]=Math.round(clamp(n)*255);}
 }
 return {size,period,data};
}
