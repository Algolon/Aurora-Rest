import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {HeightGrid} from '../src/geo-r02b/terrain.ts';
import {reviewOptions,sunDirection} from '../src/geo-r02b/review-options.ts';
// GEO-R02C-P0 regression guards on the committed R1 artifacts. Fast checks only; offline numerical
// diagnostics live in tools/geo-r02c and are not run in CI.
const root=new URL('../',import.meta.url),read=(p:string)=>readFileSync(new URL(p,root)),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const f32=(p:string)=>{const b=read(p);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const W=1501,Hn=2001,terrain=f32('public/geo-r02b/terrain.f32'),water=f32('public/geo-r02b/water-surface.f32');
const manifest=JSON.parse(read('docs/geo-r02c-p0/baseline/baseline-manifest.json').toString());

test('protected R1 files and canonical artifacts are byte-identical to the P0 baseline manifest',()=>{
 const expected={...manifest.protectedFiles} as Record<string,string>;
 for(const [file,hash] of Object.entries(expected))assert.equal(sha(read(file)),hash,file);
 const r1=manifest.canonicalArtifacts as Record<string,string>;
 for(const name of ['terrain.f32','features.json','water-mesh.f32','water-surface.f32','diagnostics.json'])assert.equal(sha(read('public/geo-r02b/'+name)),r1[name],name);
 assert.equal(r1['terrain.f32'],'fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a');
 assert.equal(sha(read('docs/geo-r02b/design-master-A-R1-v1.json')),'62cb154b4ab6473ae7e2507449cea5407774503cdc09fe42f09adbde0a0ec598');
});

test('no dry closed depressions on the canonical 4 m grid (ocean, wet cells and border drain)',()=>{
 // 8-connected priority flood with a typed binary heap; measures spill depth, never edits terrain.
 const n=W*Hn,filled=new Float32Array(terrain),done=new Uint8Array(n),heap=new Int32Array(n);let size=0;
 const less=(a:number,b:number)=>filled[a]<filled[b];
 const push=(k:number)=>{let i=size++;heap[i]=k;while(i>0){const p=(i-1)>>1;if(!less(heap[i],heap[p]))break;[heap[i],heap[p]]=[heap[p],heap[i]];i=p;}};
 const pop=()=>{const top=heap[0];heap[0]=heap[--size];let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<size&&less(heap[l],heap[m]))m=l;if(r<size&&less(heap[r],heap[m]))m=r;if(m===i)break;[heap[i],heap[m]]=[heap[m],heap[i]];i=m;}return top;};
 for(let j=0;j<Hn;j++)for(let i=0;i<W;i++){const k=j*W+i,h=terrain[k],w=water[k];if(j===0||i===0||j===Hn-1||i===W-1||h<=0||(Number.isFinite(w)&&h<w)){done[k]=1;push(k);}}
 while(size){const k=pop(),j=(k/W)|0,i=k-j*W;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!dj&&!di)continue;const a=j+dj,b=i+di;if(a<0||b<0||a>=Hn||b>=W)continue;const q=a*W+b;if(done[q])continue;done[q]=1;if(filled[q]<filled[k])filled[q]=filled[k];push(q);}}
 let max=0,over10cm=0;for(let k=0;k<n;k++){const d=filled[k]-terrain[k];if(d>max)max=d;if(d>.1)over10cm++;}
 assert.equal(over10cm,0,'cells with more than 0.1 m spill depth');
 assert.ok(max<.05,`maximum spill depth ${max} m (R1 baseline 0.033 m)`);
});

test('channel water surfaces descend within the proposed 5 cm tolerance and stay finite along every channel',()=>{
 const features=JSON.parse(read('public/geo-r02b/features.json').toString()),surface=new HeightGrid(water,W,Hn);let worst={rise:0,id:''};
 for(const c of features.channels as {id:string;points:number[][]}[]){let prev=NaN;for(const p of c.points){const h=surface.surface(p[0],p[2]);assert.ok(Number.isFinite(h),`${c.id} non-finite water at ${p}`);if(h-prev>worst.rise)worst={rise:h-prev,id:c.id};prev=h;}}
 assert.ok(worst.rise<=.05,`largest rise ${worst.rise} m in ${worst.id}`);
 assert.ok(worst.rise>.02&&worst.id==='main-upper','R1 documents a 0.027 m rise at the main-upper confluence; a change here must be reviewed');
});

test('review cameras are on dry ground, consistent and do not replace R1 views',()=>{
 const cams=JSON.parse(read('tools/geo-r02c/cameras.json').toString()),grid=new HeightGrid(terrain,W,Hn,4),ws=new HeightGrid(water,W,Hn),ids=new Set<string>();
 assert.equal(cams.terrainSha256,manifest.canonicalArtifacts['terrain.f32']);
 for(const c of cams.cameras){
  assert.ok(!ids.has(c.id)&&!['overview','island-oblique','home-cove','central-valley','cairn-saddle','high-tarn','hidden-fold','mirelands'].includes(c.id),c.id);ids.add(c.id);
  const [x,z]=c.xz;assert.ok(Math.abs(c.uv[0]-(x+3000)/10)<.01&&Math.abs(c.uv[1]-(4000-z)/10)<.01,c.id);
  const h=grid.surface(x,z),w=ws.surface(x,z);assert.ok(h>Math.max(0,Number.isFinite(w)?w:0)+.15,`${c.id} not dry`);assert.ok(Math.abs(h-c.groundM)<.01,c.id);
 }
});

test('review mode is opt-in and the A1 diagnostic window is internally consistent',()=>{
 assert.deepEqual(reviewOptions(''),{clay:false,sun:'A',presets:false});
 assert.deepEqual(reviewOptions('?view=high-tarn'),{clay:false,sun:'A',presets:false});
 assert.deepEqual(reviewOptions('?presets=p0'),{clay:false,sun:'A',presets:true});
 assert.deepEqual(reviewOptions('?review=clay&sun=B'),{clay:true,sun:'B',presets:true});
 for(const s of ['A','B'] as const){const d=sunDirection(s);assert.ok(Math.abs(Math.hypot(...d)-1)<1e-12&&d[1]>0);}
 const m=JSON.parse(read('tools/geo-r02c/masks/A1-window-v1.json').toString());
 assert.ok(m.window.xMin>=-3000&&m.window.xMax<=3000&&m.window.zMin>=-4000&&m.window.zMax<=4000&&m.frozenRingM===8&&m.featherM===200);
 assert.ok(m.window.zMin>920,'A1 window must exclude the Cairn col (z 920), which belongs to A2');
});
