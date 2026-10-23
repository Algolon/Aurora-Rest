/** Deterministic integer-hash noise shared by classification and texture synthesis.
 * Pure TypeScript: no Math.random, no platform-dependent transcendental calls in the hash path. */
export const clamp=(v:number,lo=0,hi=1)=>v<lo?lo:v>hi?hi:v;
export const smoothstep=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
export const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;

/** 32-bit integer hash of a lattice point → [0,1). */
export function hash2(i:number,j:number,seed:number):number{
 let n=(Math.imul(i|0,374761393)^Math.imul(j|0,668265263)^Math.imul(seed|0,1442695041))|0;
 n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;
 return (n>>>0)/4294967296;
}

/** Value noise in [-1,1]; `period` > 0 wraps the lattice so the result tiles every `period` units. */
export function valueNoise(x:number,z:number,seed:number,period=0):number{
 const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
 let i0=ix,i1=ix+1,j0=iz,j1=iz+1;
 if(period>0){i0=((i0%period)+period)%period;i1=((i1%period)+period)%period;j0=((j0%period)+period)%period;j1=((j1%period)+period)%period;}
 const a=hash2(i0,j0,seed),b=hash2(i1,j0,seed),c=hash2(i0,j1,seed),d=hash2(i1,j1,seed);
 return ((a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v)*2-1;
}

/** Fractal sum of value noise in roughly [-1,1]. With period>0 every octave tiles (period doubles per octave). */
export function fbm(x:number,z:number,seed:number,octaves=4,period=0):number{
 let sum=0,amp=.5,norm=0,f=1;
 for(let o=0;o<octaves;o++){sum+=amp*valueNoise(x*f,z*f,seed+o*101,period?period*f:0);norm+=amp;amp*=.5;f*=2;}
 return sum/norm;
}

/** Tileable cellular noise: distances to the nearest and second-nearest jittered feature point, plus the nearest cell id. */
export function worley(x:number,z:number,period:number,seed:number,jitter=.85):{f1:number;f2:number;id:number}{
 const ix=Math.floor(x),iz=Math.floor(z);let f1=9,f2=9,id=0;
 for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){
  const ci=ix+di,cj=iz+dj,wi=((ci%period)+period)%period,wj=((cj%period)+period)%period;
  const px=ci+.5+(hash2(wi,wj,seed)-.5)*jitter,pz=cj+.5+(hash2(wi,wj,seed+7)-.5)*jitter;
  const d=Math.hypot(x-px,z-pz);
  if(d<f1){f2=f1;f1=d;id=hash2(wi,wj,seed+13);}else if(d<f2)f2=d;
 }
 return {f1,f2,id};
}

/** Small seeded PRNG (mulberry32) for stamp placement during texture synthesis. */
export function mulberry32(seed:number){
 let a=seed>>>0;
 return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
