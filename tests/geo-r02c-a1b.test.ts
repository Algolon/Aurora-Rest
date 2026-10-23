import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {applyPatch,variantId,variantRef,terrainIdentity,type VariantEntry,type VariantInfo} from '../src/geo-r02c-a1a/variants.ts';
// GEO-R02C-A1b-alpha regression guards: the visible-face variant is an exact patch on the immutable R1 grid, built with the
// unchanged A1a protection mask, composes to its manifest SHA-256, leaves routes, summit and A1a variants untouched, adds no
// dry closed depressions and is opt-in; the viewer reports the active terrain hash next to the R1 baseline.
const root=new URL('../',import.meta.url),read=(p:string)=>readFileSync(new URL(p,root)),sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const f32=(p:string)=>{const b=read(p);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const W=1501,Hn=2001,R1_SHA='fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a';
const manifest=JSON.parse(read('public/geo-r02c-a1b/manifest.json').toString()) as {baseTerrainSha256:string;variants:Record<string,VariantEntry>};
const water=f32('public/geo-r02b/water-surface.f32'),features=JSON.parse(read('public/geo-r02b/features.json').toString());
function compose(id:string){
 const h=f32('public/geo-r02b/terrain.f32'),e=manifest.variants[id];
 if(e.patch){const raw=read('public/geo-r02c-a1b/'+e.patch.file);assert.equal(sha(raw),e.patch.sha256,id+' patch');applyPatch(h,W,e.patch,new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)));}
 return h;
}
function surface(h:Float32Array,x:number,z:number){ // the viewer's SW-diagonal triangles (src/geo-r02b/terrain.ts)
 const gx=Math.min(Math.max((x+3000)/4,0),W-1-1e-8),gz=Math.min(Math.max((4000-z)/4,0),Hn-1-1e-8),i=Math.floor(gx),j=Math.floor(gz),u=gx-i,v=gz-j;
 const a=h[j*W+i],b=h[(j+1)*W+i],c=h[j*W+i+1],d=h[(j+1)*W+i+1];return u+v<=1?a+(c-a)*u+(b-a)*v:d+(b-d)*(1-u)+(c-d)*(1-v);
}
function spillDepths(h:Float32Array){ // same 8-connected priority flood and drains as the P0 / A1a guards
 const n=W*Hn,filled=new Float32Array(h),done=new Uint8Array(n),heap=new Int32Array(n);let size=0;
 const less=(a:number,b:number)=>filled[a]<filled[b];
 const push=(k:number)=>{let i=size++;heap[i]=k;while(i>0){const p=(i-1)>>1;if(!less(heap[i],heap[p]))break;[heap[i],heap[p]]=[heap[p],heap[i]];i=p;}};
 const pop=()=>{const top=heap[0];heap[0]=heap[--size];let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<size&&less(heap[l],heap[m]))m=l;if(r<size&&less(heap[r],heap[m]))m=r;if(m===i)break;[heap[i],heap[m]]=[heap[m],heap[i]];i=m;}return top;};
 for(let j=0;j<Hn;j++)for(let i=0;i<W;i++){const k=j*W+i,v=h[k],w=water[k];if(j===0||i===0||j===Hn-1||i===W-1||v<=0||(Number.isFinite(w)&&v<w)){done[k]=1;push(k);}}
 while(size){const k=pop(),j=(k/W)|0,i=k-j*W;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!dj&&!di)continue;const a=j+dj,b=i+di;if(a<0||b<0||a>=Hn||b>=W)continue;const q=a*W+b;if(done[q])continue;done[q]=1;if(filled[q]<filled[k])filled[q]=filled[k];push(q);}}
 const d=new Float32Array(n);for(let k=0;k<n;k++)d[k]=filled[k]-h[k];return d;
}

test('A1b variants are opt-in and do not change A1a variant ids',()=>{
 assert.equal(variantRef(''),null);assert.equal(variantRef('?terrain=r1'),null);assert.equal(variantRef('?terrain=a1b-beta'),null);
 assert.deepEqual(variantRef('?terrain=a1b-alpha'),{family:'a1b',id:'alpha'});assert.deepEqual(variantRef('?review=clay&terrain=a1b-m0'),{family:'a1b',id:'m0'});
 assert.equal(variantId('?terrain=a1b-alpha'),null);assert.equal(variantId('?terrain=a1a-v1'),'v1');
});

test('viewer reports the active terrain hash and the R1 baseline separately',()=>{
 assert.deepEqual(terrainIdentity(null,R1_SHA),{terrainSha256:R1_SHA,baselineTerrainSha256:R1_SHA,activeTerrain:'r1'});
 const v={id:'alpha',family:'a1b',key:'a1b-alpha',label:'',terrainSha256:manifest.variants.alpha.terrainSha256,expectedSha256:manifest.variants.alpha.terrainSha256,baselineSha256:R1_SHA,verified:true,changedCells:1} as VariantInfo;
 assert.deepEqual(terrainIdentity(v,R1_SHA),{terrainSha256:manifest.variants.alpha.terrainSha256,baselineTerrainSha256:R1_SHA,activeTerrain:'a1b-alpha'});
});

test('A1b empty overlay M0 is byte-identical to canonical R1',()=>{
 assert.equal(manifest.baseTerrainSha256,R1_SHA);const m0=manifest.variants.m0;assert.equal(m0.patch,null);assert.equal(m0.changedCells,0);assert.equal(m0.terrainSha256,R1_SHA);
 assert.equal(sha(new Uint8Array(compose('m0').buffer)),R1_SHA);
});

test('A1b-alpha uses the A1a V1 protection mask unchanged and only the visibleFaces operator',()=>{
 const a=JSON.parse(read('tools/geo-r02c-a1b/specs/a1b-alpha.json').toString()),v1=JSON.parse(read('tools/geo-r02c-a1a/specs/a1a-v1.json').toString());
 assert.deepEqual(a.mask,v1.mask);assert.deepEqual(a.operators.map((o:{type:string})=>o.type),['visibleFaces']);
 assert.equal(a.mask.corridors['peak-ascent'],75);assert.ok(a.mask.frozenZones.some((z:{id:string})=>z.id==='high-tarn-seam'));
});

test('A1b-alpha composes to its manifest SHA-256, stays in the A1 window, and leaves routes and the summit untouched',()=>{
 const e=manifest.variants.alpha;assert.ok(e.patch);const p=e.patch!;
 assert.ok(p.rows[0]>=0&&p.rows[1]<=575&&p.cols[0]>=250&&p.cols[1]<=1175,'patch outside the A1 window box');
 const h=compose('alpha'),r1=f32('public/geo-r02b/terrain.f32');assert.equal(sha(new Uint8Array(h.buffer)),e.terrainSha256);
 let changed=0;for(let k=0;k<h.length;k++)if(h[k]!==r1[k]){changed++;assert.ok(h[k]<r1[k],'alpha is cut-only');}
 assert.equal(changed,e.changedCells);
 for(const r of features.routes as {id:string;points2:number[][]}[])for(const [x,z] of r.points2)assert.equal(surface(h,x,z),surface(r1,x,z),r.id);
 const js=Math.round((4000-2770)/4),is=Math.round((-520+3000)/4);assert.equal(h[js*W+is],r1[js*W+is],'summit');
});

test('A1b-alpha adds no dry closed depressions (same flood and limits as the P0 and A1a guards)',()=>{
 const base=spillDepths(compose('m0')),d=spillDepths(compose('alpha'));let max=0,over10cm=0,newOver1cm=0;
 for(let k=0;k<d.length;k++){if(d[k]>max)max=d[k];if(d[k]>.1)over10cm++;if(d[k]>.01&&base[k]<=.01)newOver1cm++;}
 assert.equal(over10cm,0);assert.ok(max<.05,`maximum spill depth ${max} m`);assert.equal(newOver1cm,0);
});

test('recorded A1b validation passes, including the mask-edge, summit, crest and seam checks',()=>{
 for(const id of ['m0','alpha']){
  const v=JSON.parse(read(`docs/geo-r02c-a1b-alpha/validation/${id}.json`).toString()),c=v.checks;
  assert.equal(v.terrainSha256,manifest.variants[id].terrainSha256,id);assert.equal(c.pass,true,id);
  assert.equal(c.protectedUnchanged,true);assert.equal(c.wetCellsChanged,0);assert.equal(c.newDrySinkCells1cm,0);assert.equal(c.drainageDestinationChangedCells,0);
  assert.equal(c.coastBand0to150Changed,0);assert.equal(c.landSeaSignChanged,0);assert.equal(c.crestCellsChanged,0);assert.equal(c.seamZoneCellsChanged,0);
  assert.equal(c.summit.unchanged,true);assert.equal(c.maskTransition.noMaskShapedEdge,true);
  for(const [route,dh] of Object.entries(c.routeCentrelineMaxChangeM as Record<string,number>))assert.equal(dh,0,id+' '+route);
 }
});

test('A1a variants and A1b cameras are consistent',()=>{
 const a1a=JSON.parse(read('public/geo-r02c-a1a/manifest.json').toString()).variants;
 assert.deepEqual(Object.fromEntries(Object.entries(a1a).map(([k,v])=>[k,(v as VariantEntry).terrainSha256.slice(0,16)])),{m0:'fc8fd6da0472bc3e',v1:'61b599545d60f9bf',v2:'e012c711a7e9e62b',v3:'8d81f9fca284d69a'});
 const cams=JSON.parse(read('tools/geo-r02c-a1b/cameras.json').toString()).cameras as {id:string;uv:number[];xz:number[];kind:string}[];
 assert.ok(cams.length>=1);for(const c of cams){assert.ok(c.id.startsWith('a1b-'));assert.equal(c.kind,'walk');assert.ok(Math.abs(c.uv[0]-(c.xz[0]+3000)/10)<1e-2&&Math.abs(c.uv[1]-(4000-c.xz[1])/10)<1e-2,c.id);}
});
