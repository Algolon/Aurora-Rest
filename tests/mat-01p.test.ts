import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as shader from '../src/terrain-material/render/shader.ts';
import {synthesizeNoiseTexture,synthesizeMaterial} from '../src/terrain-material/textures.ts';
import {MATERIALS} from '../src/terrain-material/materials.ts';
import {TerrainMaterialResources,createTerrainMaterial,PROFILES} from '../src/terrain-material/render/terrain-material.ts';
import type {MaterialClassification} from '../src/terrain-material/types.ts';

// MAT-01P experimental baked-noise candidate. The candidate is opt-in; these tests guard that MAT-01's default path is
// unchanged and that the baked noise is statistically equivalent where art direction depends on it (patch coverage).

/** SHA-256 of the seven GLSL chunks at MAT-01 ae8a9c1 (NUL-joined), recorded from `git show ae8a9c1:src/terrain-material/render/shader.ts`. */
const MAT01_SHADER_SHA256='21fa34d078590158abd4da4c0ac3affacdcf09ceb004bd01828909d13b784a76';
const stripCandidate=(s:string)=>s.replace(/#ifdef TM_BAKED_NOISE\n[\s\S]*?#else\n([\s\S]*?)\n#endif/g,'$1').replace(/#ifdef TM_BAKED_NOISE\n[\s\S]*?#endif\n/g,'');

test('default shader path is byte-identical to MAT-01 once the opt-in candidate branches are removed',()=>{
 const chunks=[shader.VERTEX_PARS,shader.VERTEX_MAIN,shader.FRAGMENT_PARS,shader.FRAGMENT_MATERIAL,shader.FRAGMENT_ROUGHNESS,shader.FRAGMENT_NORMAL,shader.FRAGMENT_DEBUG];
 assert.equal(createHash('sha256').update(chunks.map(stripCandidate).join('\u0000')).digest('hex'),MAT01_SHADER_SHA256);
 // Every procedural call site the candidate replaces still exists, exactly once, in the #else branches.
 for(const site of ['tmFbm(tmXZ*uAntiTile.y+','tmFbm(tmXZ*ms+','tmFbm(tmXZ*.31+','.62*tmFbm(tmXZ*uMatPatch[m].w+'])
  assert.equal(shader.FRAGMENT_MATERIAL.split(site).length-1,1,site);
});

test('no MAT-01 profile enables the candidate; baked noise only via explicit opt-in',()=>{
 const tiny:MaterialClassification={schema:'aurora-rest-terrain-material/1',lattice:{width:8,height:8,cellM:4,west:0,north:0},materials:MATERIALS.map(m=>m.id),weights:new Uint8Array(8*8*4).fill(63),attributes:new Uint8Array(8*8*4),rulesVersion:'test',sourceId:'test'};
 const tex=MATERIALS.map(d=>synthesizeMaterial(d,16));
 for(const p of Object.keys(PROFILES) as (keyof typeof PROFILES)[]){
  const r=new TerrainMaterialResources(tiny,tex,p),m=createTerrainMaterial(r);
  assert.equal(r.noise,null);assert.equal(r.textures.length,4);assert.equal(r.memoryBytes.noise,0);
  assert.ok(!('TM_BAKED_NOISE' in (m.defines??{})));assert.equal(m.customProgramCacheKey(),`aurora-terrain-material-v1-${p}-4`);
 }
 const noise=synthesizeNoiseTexture(32,8);
 const r=new TerrainMaterialResources(tiny,tex,'mobile',noise).acquire(),m=createTerrainMaterial(r);
 assert.ok('TM_BAKED_NOISE' in (m.defines??{}));assert.equal(m.customProgramCacheKey(),'aurora-terrain-material-v1-mobile-4-baked');
 assert.equal(r.textures.length,5);assert.equal(r.memoryBytes.noise,Math.round(32*32*4*4/3));
 let disposed=0;for(const t of r.textures)t.addEventListener('dispose',()=>disposed++);
 r.release();assert.equal(disposed,5);assert.equal(r.disposed,true);
});

test('baked noise is deterministic, tileable and has four decorrelated channels',()=>{
 const a=synthesizeNoiseTexture(),b=synthesizeNoiseTexture(),S=a.size;
 assert.deepEqual(Buffer.from(a.data),Buffer.from(b.data));assert.equal(S,512);assert.equal(a.period,32);
 for(let c=0;c<4;c++){let edge=0,inner=0;
  for(let y=0;y<S;y++){edge+=Math.abs(a.data[(y*S+S-1)*4+c]-a.data[(y*S)*4+c]);inner+=Math.abs(a.data[(y*S+S/2)*4+c]-a.data[(y*S+S/2-1)*4+c]);}
  assert.ok(edge<=inner*1.5+S,`channel ${c} wrap seam ${edge} vs interior ${inner}`);}
 const ch=(c:number)=>Array.from({length:S*S},(_,i)=>a.data[i*4+c]/255);
 const corr=(x:number[],y:number[])=>{const mx=x.reduce((s,v)=>s+v,0)/x.length,my=y.reduce((s,v)=>s+v,0)/y.length;let n=0,dx=0,dy=0;
  for(let i=0;i<x.length;i++){n+=(x[i]-mx)*(y[i]-my);dx+=(x[i]-mx)**2;dy+=(y[i]-my)**2;}return n/Math.sqrt(dx*dy);};
 const cs=[0,1,2,3].map(ch);for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)assert.ok(Math.abs(corr(cs[i],cs[j]))<.15,`channels ${i}/${j} correlated`);
});

// JavaScript replica of the GLSL tmHash/tmNoise/tmFbm (float64; GPU float32 differs pointwise but not statistically).
const fract=(v:number)=>v-Math.floor(v);
function tmHash(x:number,y:number){let px=fract(x*123.34),py=fract(y*456.21);const d=px*(px+45.32)+py*(py+45.32);px+=d;py+=d;return fract(px*py);}
function tmNoise(x:number,y:number){const ix=Math.floor(x),iy=Math.floor(y);let fx=x-ix,fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
 const a=tmHash(ix,iy),b=tmHash(ix+1,iy),c=tmHash(ix,iy+1),d=tmHash(ix+1,iy+1);return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;}
const tmFbm=(x:number,y:number)=>.6*tmNoise(x,y)+.3*tmNoise(x*2.13+17,y*2.13+17)+.1*tmNoise(x*4.41+31,y*4.41+31);

test('baked noise matches the procedural fBm statistically, including MAT-01 patch coverage per material',()=>{
 const n=synthesizeNoiseTexture(),S=n.size;let seed=12345;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const bil=(u:number,v:number,c:number)=>{const x=fract(u)*S-.5,y=fract(v)*S-.5,i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,w=(a:number)=>((a%S)+S)%S;
  const g=(ii:number,jj:number)=>n.data[(w(jj)*S+w(ii))*4+c]/255;return (g(i,j)*(1-fx)+g(i+1,j)*fx)*(1-fy)+(g(i,j+1)*(1-fx)+g(i+1,j+1)*fx)*fy;};
 const N=20000,proc:number[]=[],baked:number[]=[],procPatch:number[]=[],bakedPatch:number[]=[];
 for(let k=0;k<N;k++){const x=rnd()*800,z=rnd()*800;proc.push(tmFbm(x,z));baked.push(bil(x/n.period,z/n.period,k&3));
  procPatch.push(.62*tmFbm(x,z)+.38*tmFbm(x*.23+3.1,z*.23+9.2));bakedPatch.push(.62*bil(x/n.period,z/n.period,3)+.38*bil(x*.23/n.period,z*.23/n.period,0));}
 const stats=(a:number[])=>{const s=[...a].sort((p,q)=>p-q),m=a.reduce((p,q)=>p+q,0)/a.length;return {mean:m,std:Math.sqrt(a.reduce((p,q)=>p+(q-m)**2,0)/a.length),q10:s[Math.floor(a.length*.1)],q50:s[Math.floor(a.length*.5)],q90:s[Math.floor(a.length*.9)]};};
 const P=stats(proc),B=stats(baked);
 assert.ok(Math.abs(P.mean-B.mean)<.03&&Math.abs(P.q50-B.q50)<.03,`centre ${JSON.stringify({P,B})}`);
 assert.ok(B.std/P.std>.85&&B.std/P.std<1.15,`spread ${P.std} vs ${B.std}`);
 // Patch area fraction is what the eye reads; it must stay within 4 percentage points for every MAT-01 material.
 for(const m of MATERIALS){const cov=m.patch.coverage,mask=(v:number)=>{const t=Math.min(1,Math.max(0,(v-(1-cov-.07))/.14));return t*t*(3-2*t);};
  const fp=procPatch.reduce((s,v)=>s+mask(v),0)/N,fb=bakedPatch.reduce((s,v)=>s+mask(v),0)/N;
  assert.ok(Math.abs(fp-fb)<.04,`${m.id} patch coverage procedural ${fp.toFixed(3)} vs baked ${fb.toFixed(3)}`);}
});
