// MAT-01P: distribution and patch-coverage statistics, procedural tmFbm (JavaScript replica, float64) vs baked noise.
// Same estimator as tests/mat-01p.test.ts, written out as evidence. Statistical similarity is necessary, not sufficient:
// visual equivalence is judged from matched WebGL captures (docs/mat-01p/VISUAL_REVIEW.md).
// Usage: node --experimental-strip-types tools/mat-01p/noise-stats.ts [out.json]
import {writeFileSync} from 'node:fs';
import {synthesizeNoiseTexture} from '../../src/terrain-material/textures.ts';
import {MATERIALS} from '../../src/terrain-material/materials.ts';
const fract=(v:number)=>v-Math.floor(v);
function tmHash(x:number,y:number){let px=fract(x*123.34),py=fract(y*456.21);const d=px*(px+45.32)+py*(py+45.32);px+=d;py+=d;return fract(px*py);}
function tmNoise(x:number,y:number){const ix=Math.floor(x),iy=Math.floor(y);let fx=x-ix,fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
 const a=tmHash(ix,iy),b=tmHash(ix+1,iy),c=tmHash(ix,iy+1),d=tmHash(ix+1,iy+1);return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;}
const tmFbm=(x:number,y:number)=>.6*tmNoise(x,y)+.3*tmNoise(x*2.13+17,y*2.13+17)+.1*tmNoise(x*4.41+31,y*4.41+31);
const n=synthesizeNoiseTexture(),S=n.size;let seed=12345;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const bil=(u:number,v:number,c:number)=>{const x=fract(u)*S-.5,y=fract(v)*S-.5,i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,w=(a:number)=>((a%S)+S)%S;
 const g=(ii:number,jj:number)=>n.data[(w(jj)*S+w(ii))*4+c]/255;return (g(i,j)*(1-fx)+g(i+1,j)*fx)*(1-fy)+(g(i,j+1)*(1-fx)+g(i+1,j+1)*fx)*fy;};
const N=40000,proc:number[]=[],baked:number[]=[],pp:number[]=[],bp:number[]=[];
for(let k=0;k<N;k++){const x=rnd()*800,z=rnd()*800;proc.push(tmFbm(x,z));baked.push(bil(x/n.period,z/n.period,k&3));
 pp.push(.62*tmFbm(x,z)+.38*tmFbm(x*.23+3.1,z*.23+9.2));bp.push(.62*bil(x/n.period,z/n.period,3)+.38*bil(x*.23/n.period,z*.23/n.period,0));}
const stats=(a:number[])=>{const s=[...a].sort((p,q)=>p-q),m=a.reduce((p,q)=>p+q,0)/a.length,r=(v:number)=>+v.toFixed(4);
 return {mean:r(m),std:r(Math.sqrt(a.reduce((p,q)=>p+(q-m)**2,0)/a.length)),q05:r(s[Math.floor(a.length*.05)]),q50:r(s[Math.floor(a.length*.5)]),q95:r(s[Math.floor(a.length*.95)])};};
const coverage=Object.fromEntries(MATERIALS.map(m=>{const cov=m.patch.coverage,mask=(v:number)=>{const t=Math.min(1,Math.max(0,(v-(1-cov-.07))/.14));return t*t*(3-2*t);};
 return [m.id,{designCoverage:cov,procedural:+(pp.reduce((s,v)=>s+mask(v),0)/N).toFixed(4),baked:+(bp.reduce((s,v)=>s+mask(v),0)/N).toFixed(4)}];}));
const out={tool:'tools/mat-01p/noise-stats.ts',samples:N,texture:{size:S,period:n.period,channels:4},
 note:'Procedural values come from a float64 JavaScript replica of the GLSL tmFbm; the GPU evaluates it in float32 (pointwise different, statistically equivalent).',
 fbm:{procedural:stats(proc),baked:stats(baked)},patchNoise:{procedural:stats(pp),baked:stats(bp)},patchCoverageFraction:coverage};
writeFileSync(process.argv[2]??'docs/mat-01p/profile/noise-statistics.json',JSON.stringify(out,null,1)+'\n');console.log(JSON.stringify(out,null,1));
