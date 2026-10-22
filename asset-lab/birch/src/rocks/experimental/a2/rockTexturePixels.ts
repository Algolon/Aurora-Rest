/**
 * ASSET-01E2R-A2 — deterministic authored, tile-safe Nordic granite texture source.
 * No asset service / external image / ML result; no geometry dependency.
 * Three 512px RGBA map sets: albedo (sRGB), tangent-space normal (linear), roughness (linear).
 * The linework is a few manually placed non-repeating, non-periodic fault paths, not a sine grille.
 */
export const ROCK_LOOKDEV_SIZE=512;
export type RockLookdevStudy='T1'|'T2'|'T3';
export interface RockPixels {
 readonly study:RockLookdevStudy;
 readonly size:number;
 readonly albedo:Uint8Array;
 readonly normal:Uint8Array;
 readonly roughness:Uint8Array;
 readonly microFractureCoverage:number;
 readonly meanRoughness:number;
}
type P=readonly [number,number];
type Path={width:number;depth:number;points:readonly P[]};
const T2_PATHS:readonly Path[]=[
 {width:.0036,depth:.115,points:[[.16,.13],[.21,.24],[.29,.33],[.37,.38],[.43,.48],[.48,.58],[.55,.62]]},
 {width:.0028,depth:.082,points:[[.69,.24],[.62,.29],[.57,.41],[.48,.46],[.46,.53]]},
 {width:.0020,depth:.043,points:[[.31,.36],[.26,.49],[.21,.55],[.19,.64]]}
];
const T3_PATHS:readonly Path[]=[
 {width:.0028,depth:.060,points:[[.25,.32],[.37,.36],[.49,.47],[.60,.49],[.68,.58]]}
];
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const hash=(x:number,y:number,seed:number)=>{
 let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed,1274126177);
 n=Math.imul(n^(n>>>13),2246822519);
 return ((n^(n>>>16))>>>0)/4294967295;
};
/** integer cell period = frequency => seamless repeat without line artifacts at tile joins */
function noise(u:number,v:number,freq:number,seed:number):number {
 const x=u*freq,y=v*freq,ix=Math.floor(x),iy=Math.floor(y);
 const fx=smooth(0,1,x-ix),fy=smooth(0,1,y-iy);
 const at=(a:number,b:number)=>hash((a%freq+freq)%freq,(b%freq+freq)%freq,seed);
 return (at(ix,iy)*(1-fx)+at(ix+1,iy)*fx)*(1-fy)
       +(at(ix,iy+1)*(1-fx)+at(ix+1,iy+1)*fx)*fy;
}
function segmentDistance(u:number,v:number,a:P,b:P):number{
 const vx=b[0]-a[0],vy=b[1]-a[1],len=vx*vx+vy*vy;
 const t=clamp(((u-a[0])*vx+(v-a[1])*vy)/len,0,1);
 return Math.hypot(u-(a[0]+t*vx),v-(a[1]+t*vy));
}
function fractures(u:number,v:number,paths:readonly Path[]):number {
 if(!paths.length)return 0;
 const edge=smooth(.02,.09,Math.min(u,v,1-u,1-v));
 let intensity=0;
 for(const p of paths){
  let distance=1;
  for(let i=1;i<p.points.length;i++)distance=Math.min(distance,segmentDistance(u,v,p.points[i-1],p.points[i]));
  const width=p.width*(.85+.32*noise(u,v,19,129)); // small, deterministic irregularity
  const shape=clamp(1-distance/(width*3.0),0,1);
  intensity=Math.max(intensity,p.depth*shape*shape);
 }
 return intensity*edge;
}
const alloc=()=>new Uint8Array(ROCK_LOOKDEV_SIZE*ROCK_LOOKDEV_SIZE*4);
const setRGBA=(buf:Uint8Array,i:number,r:number,g:number,b:number)=>{
 buf[i]=clamp(Math.round(r),0,255);buf[i+1]=clamp(Math.round(g),0,255);
 buf[i+2]=clamp(Math.round(b),0,255);buf[i+3]=255;
};
/** Pure Node-compatible generator (browser uses identical bytes through THREE.DataTexture). */
export function generateRockLookdevPixels(study:RockLookdevStudy):RockPixels {
 if(!(['T1','T2','T3'] as string[]).includes(study))throw RangeError('Unknown rock lookdev study');
 const n=ROCK_LOOKDEV_SIZE;
 const albedo=alloc(),normal=alloc(),roughness=alloc();
 const relief=new Float32Array(n*n),fracture=new Float32Array(n*n);
 const coast=study==='T3',faulted=study==='T2';
 let roughSum=0,coverage=0;
 const paths=study==='T2'?T2_PATHS:study==='T3'?T3_PATHS:[];
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const u=x/n,v=y/n,id=y*n+x,j=id*4;
  const broad=noise(u,v,3,33)-.5;
  const med=noise(u,v,7,97)-.5;
  const fine=noise(u,v,19,119)-.5;
  const tiny=noise(u,v,47,173)-.5;
  // Three unaligned scales; no repeated diagonal mineral lines.
  const base=broad*.45+med*.29+fine*.14+tiny*.045;
  const crack=fractures(u,v,paths);
  const coastStain=coast?Math.pow(Math.max(0,noise(u,v,7,211)-.52),1.35)*1.55:0;
  const speck=noise(u,v,47,431);
  const rareMineral=smooth(.73,.92,speck)*(.10+.18*noise(u,v,19,547));
  const h=base*.042-crack*.90 + (coast?coastStain*.006:0);
  relief[id]=h;fracture[id]=crack;
  if(crack>.018)coverage++;
  const palette=study==='T1'?[231,232,231]:study==='T2'?[224,228,233]:[215,226,232];
  const local=base*31+rareMineral*12;
  const darkCrack=crack*(faulted?128:96);
  const patina=coastStain*23;
  setRGBA(albedo,j,
   palette[0]+local-darkCrack-patina*.30,
   palette[1]+local*.93-darkCrack-patina*.12+patina*.15,
   palette[2]+local*.87-darkCrack-patina*.29);
  const r=clamp(230+base*21+(faulted?crack*105:crack*55)+coastStain*10,204,251);
  roughSum+=r;
  setRGBA(roughness,j,r,r,r);
 }
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const id=y*n+x,j=id*4;
  const left=relief[y*n+(x+n-1)%n],right=relief[y*n+(x+1)%n];
  const up=relief[((y+n-1)%n)*n+x],down=relief[((y+1)%n)*n+x];
  // Source in texel space -> stable normal response at the same physical texel density.
  let nx=-(right-left)*7.2,ny=-(down-up)*7.2,nz=1;
  const inv=1/Math.hypot(nx,ny,nz);nx*=inv;ny*=inv;nz*=inv;
  setRGBA(normal,j,128+nx*127,128+ny*127,128+nz*127);
 }
 return {study,size:n,albedo,normal,roughness,
  microFractureCoverage:coverage/(n*n),meanRoughness:roughSum/(n*n)/255};
}
