import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {applyPatch,variantId,type VariantEntry} from '../src/geo-r02c-a1a/variants.ts';
import {reviewOptions} from '../src/geo-r02b/review-options.ts';
// GEO-R02C-A1a regression guards: variants are exact patches on the immutable R1 grid, compose to their manifest
// SHA-256 through the same code path as the viewer, stay inside the A1 window, and add no dry closed depressions.
const root=new URL('../',import.meta.url),read=(p:string)=>readFileSync(new URL(p,root)),sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const f32=(p:string)=>{const b=read(p);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const W=1501,Hn=2001,R1_SHA='fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a';
const manifest=JSON.parse(read('public/geo-r02c-a1a/manifest.json').toString()) as {baseTerrainSha256:string;variants:Record<string,VariantEntry>};
const water=f32('public/geo-r02b/water-surface.f32');
const diag:Record<string,{maxSpillM:number;newCellsOver1cm:number}>={};
function compose(id:string){
 const h=f32('public/geo-r02b/terrain.f32'),e=manifest.variants[id];
 if(e.patch){const raw=read('public/geo-r02c-a1a/'+e.patch.file);assert.equal(sha(raw),e.patch.sha256,id+' patch');applyPatch(h,W,e.patch,new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)));}
 return h;
}
function spillDepths(h:Float32Array){
 // 8-connected priority flood (typed binary heap); ocean, wet cells and the grid border drain. Measures only.
 const n=W*Hn,filled=new Float32Array(h),done=new Uint8Array(n),heap=new Int32Array(n);let size=0;
 const less=(a:number,b:number)=>filled[a]<filled[b];
 const push=(k:number)=>{let i=size++;heap[i]=k;while(i>0){const p=(i-1)>>1;if(!less(heap[i],heap[p]))break;[heap[i],heap[p]]=[heap[p],heap[i]];i=p;}};
 const pop=()=>{const top=heap[0];heap[0]=heap[--size];let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<size&&less(heap[l],heap[m]))m=l;if(r<size&&less(heap[r],heap[m]))m=r;if(m===i)break;[heap[i],heap[m]]=[heap[m],heap[i]];i=m;}return top;};
 for(let j=0;j<Hn;j++)for(let i=0;i<W;i++){const k=j*W+i,v=h[k],w=water[k];if(j===0||i===0||j===Hn-1||i===W-1||v<=0||(Number.isFinite(w)&&v<w)){done[k]=1;push(k);}}
 while(size){const k=pop(),j=(k/W)|0,i=k-j*W;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!dj&&!di)continue;const a=j+dj,b=i+di;if(a<0||b<0||a>=Hn||b>=W)continue;const q=a*W+b;if(done[q])continue;done[q]=1;if(filled[q]<filled[k])filled[q]=filled[k];push(q);}}
 const d=new Float32Array(n);for(let k=0;k<n;k++)d[k]=filled[k]-h[k];return d;
}

test('A1a variants are opt-in and leave the default viewer path untouched',()=>{
 assert.equal(variantId(''),null);assert.equal(variantId('?view=high-tarn'),null);assert.equal(variantId('?terrain=a1a-v4'),null);assert.equal(variantId('?terrain=r1'),null);
 assert.equal(variantId('?terrain=a1a-v2'),'v2');assert.equal(variantId('?review=clay&terrain=a1a-m0'),'m0');
 assert.deepEqual(reviewOptions('?terrain=a1a-v1'),{clay:false,sun:'A',presets:false});
});

test('empty overlay M0 is byte-identical to canonical R1',()=>{
 assert.equal(manifest.baseTerrainSha256,R1_SHA);const m0=manifest.variants.m0;
 assert.equal(m0.patch,null);assert.equal(m0.changedCells,0);assert.equal(m0.terrainSha256,R1_SHA);
 const h=compose('m0');assert.equal(sha(new Uint8Array(h.buffer)),R1_SHA);
});

test('V1-V3 compose to their manifest SHA-256 and only touch the A1 window block',()=>{
 for(const id of ['v1','v2','v3']){
  const e=manifest.variants[id];assert.ok(e.patch,id);const p=e.patch!;
  // window v2 bounding box on the canonical grid: rows 0..575 (z 4000..1700), cols 250..1175 (x -2000..1700)
  assert.ok(p.rows[0]>=0&&p.rows[1]<=575&&p.cols[0]>=250&&p.cols[1]<=1175,id+' patch outside the A1 window box');
  const h=compose(id),r1=f32('public/geo-r02b/terrain.f32');assert.equal(sha(new Uint8Array(h.buffer)),e.terrainSha256,id);
  let changed=0,outside=0;for(let k=0;k<h.length;k++)if(h[k]!==r1[k]){changed++;const j=(k/W)|0,i=k-j*W;if(j<p.rows[0]||j>p.rows[1]||i<p.cols[0]||i>p.cols[1])outside++;}
  assert.equal(changed,e.changedCells,id+' changed cells');assert.equal(outside,0,id+' changes outside its patch block');
 }
});

test('A1a variants add no dry closed depressions (same flood and limits as the P0 R1 guard)',()=>{
 const base=spillDepths(compose('m0'));
 for(const id of ['v1','v2','v3']){
  const d=spillDepths(compose(id));let max=0,over10cm=0,newOver1cm=0;
  for(let k=0;k<d.length;k++){if(d[k]>max)max=d[k];if(d[k]>.1)over10cm++;if(d[k]>.01&&base[k]<=.01)newOver1cm++;}
  assert.equal(over10cm,0,id+' cells with more than 0.1 m spill depth');assert.ok(max<.05,`${id} maximum spill depth ${max} m (R1 baseline 0.033 m)`);
  assert.equal(newOver1cm,0,id+' new cells with more than 1 cm spill depth relative to R1');diag[id]={maxSpillM:max,newCellsOver1cm:newOver1cm};
 }
});

test('recorded geographic validation passes for every variant and matches the manifest',()=>{
 for(const id of ['m0','v1','v2','v3']){
  const v=JSON.parse(read(`docs/geo-r02c-a1a/validation/${id}.json`).toString());const c=v.checks;
  assert.equal(v.terrainSha256,manifest.variants[id].terrainSha256,id);assert.equal(c.pass,true,id);
  assert.equal(c.protectedUnchanged,true,id);assert.equal(c.wetCellsChanged,0,id);assert.equal(c.newDrySinkCells1cm,0,id);
  assert.equal(c.drainageDestinationChangedCells,0,id);assert.equal(c.coastBand0to150Changed,0,id);assert.equal(c.landSeaSignChanged,0,id);
  for(const [route,dh] of Object.entries(c.routeCentrelineMaxChangeM as Record<string,number>))assert.equal(dh,0,id+' '+route);
 }
});

test('A1a review cameras are fixed and shared by all variants',()=>{
 const cams=JSON.parse(read('tools/geo-r02c-a1a/cameras.json').toString()).cameras as {id:string;uv:number[];xz:number[];kind:string;aerial?:{pos:number[];target:number[]}}[];
 assert.equal(cams.length,16);assert.equal(new Set(cams.map(c=>c.id)).size,16);
 for(const c of cams){assert.ok(c.id.startsWith('a1a-'));assert.ok(Math.abs(c.uv[0]-(c.xz[0]+3000)/10)<1e-2&&Math.abs(c.uv[1]-(4000-c.xz[1])/10)<1e-2,c.id);if(c.kind==='aerial')assert.ok(c.aerial&&c.aerial.pos.length===3&&c.aerial.target.length===3,c.id);}
});

test.after(()=>{if(Object.keys(diag).length)console.log('A1a spill depths',JSON.stringify(diag));});
