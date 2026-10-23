import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {applyPatch,applyVariantRoutes,variantId,variantRef,type VariantEntry} from '../src/geo-r02c-a1a/variants.ts';
// GEO-R02C-B0/B1 candidate guards. B1 replaces the North Peak region with an authored massif (derived design master
// tools/geo-r02c-b01/design/north-massif-b1.json). The R1 tests stay untouched: they encode the canonical R1 terrain, which B1 does
// not modify. These tests check what must hold for the candidate: exact composition, nothing outside the study area, coast, water
// and High Tarn preserved, the summit near its approved position and height, no dry closed depressions, and a walkable realigned route.
const root=new URL('../',import.meta.url),read=(p:string)=>readFileSync(new URL(p,root)),sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const f32=(p:string)=>{const b=read(p);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const W=1501,Hn=2001,R1_SHA='fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a';
const manifest=JSON.parse(read('public/geo-r02c-b01/manifest.json').toString()) as {baseTerrainSha256:string;variants:Record<string,VariantEntry&{routes?:string|null}>};
const design=JSON.parse(read('tools/geo-r02c-b01/design/north-massif-b1.json').toString());
const water=f32('public/geo-r02b/water-surface.f32'),features=JSON.parse(read('public/geo-r02b/features.json').toString());
const routes=JSON.parse(read('public/geo-r02c-b01/routes.json').toString()) as {routes:{id:string;replaces:string;points2:number[][]}[]};
function compose(id:string){
 const h=f32('public/geo-r02b/terrain.f32'),e=manifest.variants[id];
 if(e.patch){const raw=read('public/geo-r02c-b01/'+e.patch.file);assert.equal(sha(raw),e.patch.sha256,id+' patch');applyPatch(h,W,e.patch,new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)));}
 return h;
}
function surface(h:Float32Array,x:number,z:number){
 const gx=Math.min(Math.max((x+3000)/4,0),W-1-1e-8),gz=Math.min(Math.max((4000-z)/4,0),Hn-1-1e-8),i=Math.floor(gx),j=Math.floor(gz),u=gx-i,v=gz-j;
 const a=h[j*W+i],b=h[(j+1)*W+i],c=h[j*W+i+1],d=h[(j+1)*W+i+1];return u+v<=1?a+(c-a)*u+(b-a)*v:d+(b-d)*(1-u)+(c-d)*(1-v);
}
function inside(p:number[],ring:number[][]){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
function spillDepths(h:Float32Array){ // same 8-connected priority flood and drains as the P0 / A1a / A1b / A1c guards
 const n=W*Hn,filled=new Float32Array(h),done=new Uint8Array(n),heap=new Int32Array(n);let size=0;
 const less=(a:number,b:number)=>filled[a]<filled[b];
 const push=(k:number)=>{let i=size++;heap[i]=k;while(i>0){const p=(i-1)>>1;if(!less(heap[i],heap[p]))break;[heap[i],heap[p]]=[heap[p],heap[i]];i=p;}};
 const pop=()=>{const top=heap[0];heap[0]=heap[--size];let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<size&&less(heap[l],heap[m]))m=l;if(r<size&&less(heap[r],heap[m]))m=r;if(m===i)break;[heap[i],heap[m]]=[heap[m],heap[i]];i=m;}return top;};
 for(let j=0;j<Hn;j++)for(let i=0;i<W;i++){const k=j*W+i,v=h[k],w=water[k];if(j===0||i===0||j===Hn-1||i===W-1||v<=0||(Number.isFinite(w)&&v<w)){done[k]=1;push(k);}}
 while(size){const k=pop(),j=(k/W)|0,i=k-j*W;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!dj&&!di)continue;const a=j+dj,b=i+di;if(a<0||b<0||a>=Hn||b>=W)continue;const q=a*W+b;if(done[q])continue;done[q]=1;if(filled[q]<filled[k])filled[q]=filled[k];push(q);}}
 const d=new Float32Array(n);for(let k=0;k<n;k++)d[k]=filled[k]-h[k];return d;
}
/** stepWalk / walkRouteForTest in src/geo-r02b/main.ts: sub-steps of at most 0.65 m, refused when |dh| / step > 0.7. */
function walkBlockedAt(h:Float32Array,pts:number[][]){
 for(let k=1;k<pts.length;k++){const [x0,z0]=pts[k-1],[x1,z1]=pts[k],d=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.ceil(d/.65));let old=surface(h,x0,z0);
  for(let s=1;s<=n;s++){const x=x0+(x1-x0)*s/n,z=z0+(z1-z0)*s/n,v=surface(h,x,z);if(d>0&&Math.abs(v-old)/(d/n)>.7)return k;old=v;}}
 return -1;
}

test('B01 variants are opt-in and do not change A1a / A1b / A1c ids',()=>{
 assert.deepEqual(variantRef('?terrain=b01-b1'),{family:'b01',id:'b1'});assert.equal(variantRef('?terrain=b01-b2'),null);assert.equal(variantId('?terrain=b01-b1'),null);
 assert.deepEqual(variantRef('?terrain=a1c-s1'),{family:'a1c',id:'s1'});assert.deepEqual(variantRef('?terrain=a1b-alpha'),{family:'a1b',id:'alpha'});assert.equal(variantId('?terrain=a1a-v2'),'v2');
});

test('B01 empty variant M0 is byte-identical to canonical R1',()=>{
 assert.equal(manifest.baseTerrainSha256,R1_SHA);const m0=manifest.variants.m0;assert.equal(m0.patch,null);assert.equal(m0.terrainSha256,R1_SHA);assert.equal(sha(new Uint8Array(compose('m0').buffer)),R1_SHA);
});

test('B1 composes to its SHA-256 and changes nothing outside the study area, on the coast, in the water or at High Tarn',()=>{
 const e=manifest.variants.b1,h=compose('b1'),r1=f32('public/geo-r02b/terrain.f32');assert.equal(sha(new Uint8Array(h.buffer)),e.terrainSha256);
 const poly=design.studyArea.polygon as number[][],lake=(features.lakes as {id:string;boundary:number[][]}[]).find(l=>l.id==='high-tarn')!.boundary;let changed=0;
 for(let k=0;k<h.length;k++){if(h[k]===r1[k])continue;changed++;const j=(k/W)|0,i=k-j*W,x=4*i-3000,z=4000-4*j;
  assert.ok(inside([x,z],poly),`change outside the study area at ${x},${z}`);assert.ok(!Number.isFinite(water[k]),`water cell changed at ${x},${z}`);
  assert.equal(h[k]>0,r1[k]>0,'land/sea sign changed');assert.ok(!inside([x,z],lake),'High Tarn changed');
  let dmin=Infinity;for(const p of lake)dmin=Math.min(dmin,Math.hypot(p[0]-x,p[1]-z));assert.ok(dmin>150-4,`change within 150 m of High Tarn at ${x},${z}`);}
 assert.equal(changed,e.changedCells);
});

test('B1 keeps North Peak at its approved position and about 900 m, as the island maximum',()=>{
 const h=compose('b1');let best=-1e9,at=0;for(let k=0;k<h.length;k++)if(h[k]>best){best=h[k];at=k;}
 const j=(at/W)|0,i=at-j*W;assert.ok(Math.abs(best-900)<=10,`summit ${best} m`);assert.ok(Math.hypot(4*i-3000+520,4000-4*j-2770)<=30,'summit moved');
});

test('B1 adds no dry closed depressions (same flood and limits as the earlier guards)',()=>{
 const base=spillDepths(compose('m0')),d=spillDepths(compose('b1'));let max=0,newOver1cm=0;
 for(let k=0;k<d.length;k++){if(d[k]>max)max=d[k];if(d[k]>.01&&base[k]<=.01)newOver1cm++;}
 assert.equal(newOver1cm,0);assert.ok(max<.05,`maximum spill depth ${max} m`);
});

test('B1 realigned peak-ascent is walkable end to end; all other route centrelines are unchanged and walkable',()=>{
 const h=compose('b1'),r1=f32('public/geo-r02b/terrain.f32'),cand=routes.routes.find(r=>r.id==='peak-ascent')!,ref=(features.routes as {id:string;points2:number[][]}[]).find(r=>r.id==='peak-ascent')!;
 assert.deepEqual(cand.points2[0],ref.points2[0].map(v=>Math.round(v*100)/100));const end=cand.points2.at(-1)!;assert.ok(Math.hypot(end[0]+520,end[1]-2770)<=20,'route ends at the summit');
 assert.equal(walkBlockedAt(h,cand.points2),-1,'candidate route blocked');assert.notEqual(walkBlockedAt(h,ref.points2),-1,'R1 alignment is expected to be superseded on B1');
 for(const r of features.routes as {id:string;points2:number[][]}[]){if(r.id==='peak-ascent')continue;
  for(const [x,z] of r.points2)assert.equal(surface(h,x,z),surface(r1,x,z),r.id);assert.equal(walkBlockedAt(h,r.points2),-1,r.id);}
});

test('variant route override keeps the R1 alignment as reference',()=>{
 const rs=[{id:'hero',points2:[[0,0]]},{id:'peak-ascent',points2:[[1,1],[2,2]]}];applyVariantRoutes(rs,[{id:'peak-ascent',replaces:'peak-ascent',points2:[[3,3]]}]);
 assert.deepEqual(rs.map(r=>r.id),['hero','peak-ascent','peak-ascent-r1']);assert.deepEqual(rs[1].points2,[[3,3]]);assert.deepEqual(rs[2].points2,[[1,1],[2,2]]);
 assert.throws(()=>applyVariantRoutes(rs,[{id:'nope',points2:[]}]));
});

test('B1 design master is a versioned derivation of A-R1, and the recorded validation matches the committed terrain',()=>{
 assert.equal(design.parent.masterSha256,'62cb154b4ab6473ae7e2507449cea5407774503cdc09fe42f09adbde0a0ec598');assert.equal(design.parent.r1TerrainSha256,R1_SHA);
 assert.equal(sha(read('docs/geo-r02b/design-master-A-R1-v1.json')),design.parent.masterSha256,'A-R1 master must stay unchanged');
 assert.equal((manifest.variants.b1 as unknown as {designSha256:string}).designSha256,sha(read('tools/geo-r02c-b01/design/north-massif-b1.json')));
 const v=JSON.parse(read('docs/geo-r02c-b01/validation/b1.json').toString());assert.equal(v.terrainSha256,manifest.variants.b1.terrainSha256);assert.equal(v.pass,true);
 assert.equal(v.preserved.pass,true);assert.equal(v.hydrology.newDrySinkCells1cm,0);assert.equal(v.route.walkTestCandidateOnB1,-1);
 const cams=JSON.parse(read('tools/geo-r02c-b01/cameras.json').toString()).cameras as {id:string;uv:number[];xz:number[]}[];
 for(const c of cams){assert.ok(c.id.startsWith('b01-'));assert.ok(Math.abs(c.uv[0]-(c.xz[0]+3000)/10)<1e-2&&Math.abs(c.uv[1]-(4000-c.xz[1])/10)<1e-2,c.id);}
});
