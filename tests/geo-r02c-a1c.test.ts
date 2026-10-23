import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {applyPatch,variantId,variantRef,type VariantEntry} from '../src/geo-r02c-a1a/variants.ts';
// GEO-R02C-A1c regression guards for the R-B trial macro-massing study: S1 is an exact, raise-only patch on the immutable R1
// grid, every changed cell is declared, the summit and all route centrelines are untouched, the maximum stays inside the
// +25 m trial envelope, no dry closed depression appears, and A1c ids do not change A1a / A1b behaviour.
const root=new URL('../',import.meta.url),read=(p:string)=>readFileSync(new URL(p,root)),sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const f32=(p:string)=>{const b=read(p);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const W=1501,Hn=2001,R1_SHA='fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a';
type Entry=VariantEntry&{declared:{file:string;sha256:string;crestCellsRaised:number;shoulderCellsChanged:number;maxRaiseM:number}|null};
const manifest=JSON.parse(read('public/geo-r02c-a1c/manifest.json').toString()) as {baseTerrainSha256:string;variants:Record<string,Entry>};
const water=f32('public/geo-r02b/water-surface.f32'),features=JSON.parse(read('public/geo-r02b/features.json').toString());
function compose(id:string){
 const h=f32('public/geo-r02b/terrain.f32'),e=manifest.variants[id];
 if(e.patch){const raw=read('public/geo-r02c-a1c/'+e.patch.file);assert.equal(sha(raw),e.patch.sha256,id+' patch');applyPatch(h,W,e.patch,new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)));}
 return h;
}
function surface(h:Float32Array,x:number,z:number){
 const gx=Math.min(Math.max((x+3000)/4,0),W-1-1e-8),gz=Math.min(Math.max((4000-z)/4,0),Hn-1-1e-8),i=Math.floor(gx),j=Math.floor(gz),u=gx-i,v=gz-j;
 const a=h[j*W+i],b=h[(j+1)*W+i],c=h[j*W+i+1],d=h[(j+1)*W+i+1];return u+v<=1?a+(c-a)*u+(b-a)*v:d+(b-d)*(1-u)+(c-d)*(1-v);
}
function spillDepths(h:Float32Array){ // same 8-connected priority flood and drains as the P0 / A1a / A1b guards
 const n=W*Hn,filled=new Float32Array(h),done=new Uint8Array(n),heap=new Int32Array(n);let size=0;
 const less=(a:number,b:number)=>filled[a]<filled[b];
 const push=(k:number)=>{let i=size++;heap[i]=k;while(i>0){const p=(i-1)>>1;if(!less(heap[i],heap[p]))break;[heap[i],heap[p]]=[heap[p],heap[i]];i=p;}};
 const pop=()=>{const top=heap[0];heap[0]=heap[--size];let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<size&&less(heap[l],heap[m]))m=l;if(r<size&&less(heap[r],heap[m]))m=r;if(m===i)break;[heap[i],heap[m]]=[heap[m],heap[i]];i=m;}return top;};
 for(let j=0;j<Hn;j++)for(let i=0;i<W;i++){const k=j*W+i,v=h[k],w=water[k];if(j===0||i===0||j===Hn-1||i===W-1||v<=0||(Number.isFinite(w)&&v<w)){done[k]=1;push(k);}}
 while(size){const k=pop(),j=(k/W)|0,i=k-j*W;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!dj&&!di)continue;const a=j+dj,b=i+di;if(a<0||b<0||a>=Hn||b>=W)continue;const q=a*W+b;if(done[q])continue;done[q]=1;if(filled[q]<filled[k])filled[q]=filled[k];push(q);}}
 const d=new Float32Array(n);for(let k=0;k<n;k++)d[k]=filled[k]-h[k];return d;
}

test('A1c variants are opt-in and do not change A1a / A1b ids',()=>{
 assert.deepEqual(variantRef('?terrain=a1c-s1'),{family:'a1c',id:'s1'});assert.equal(variantRef('?terrain=a1c-s2'),null,'S2 was not generated');assert.equal(variantRef('?terrain=a1c-s3'),null);
 assert.equal(variantId('?terrain=a1c-s1'),null);assert.deepEqual(variantRef('?terrain=a1b-alpha'),{family:'a1b',id:'alpha'});assert.equal(variantId('?terrain=a1a-v2'),'v2');
});

test('A1c empty overlay M0 is byte-identical to canonical R1',()=>{
 assert.equal(manifest.baseTerrainSha256,R1_SHA);const m0=manifest.variants.m0;assert.equal(m0.patch,null);assert.equal(m0.changedCells,0);assert.equal(m0.terrainSha256,R1_SHA);
 assert.equal(sha(new Uint8Array(compose('m0').buffer)),R1_SHA);
});

test('A1c S1 uses the A1a V1 mask settings and declares a stricter raise policy',()=>{
 const s=JSON.parse(read('tools/geo-r02c-a1c/specs/a1c-s1.json').toString()),v1=JSON.parse(read('tools/geo-r02c-a1a/specs/a1a-v1.json').toString());
 assert.deepEqual(s.mask,v1.mask);assert.equal(s.raise.flowPreserving,true);assert.equal(s.raise.destinationPreserving,true);assert.ok(s.raise.minFadeM>=60);
 for(const op of s.operators)for(const g of op.segments??[])for(const [,dh] of g.profile)assert.ok(dh<=25,`${g.id} exceeds the +25 m trial envelope`);
});

test('A1c S1 composes to its manifest SHA-256, is raise-only, fully declared, and leaves summit and routes untouched',()=>{
 const e=manifest.variants.s1;assert.ok(e.patch&&e.declared);const p=e.patch!;
 assert.ok(p.rows[0]>=0&&p.rows[1]<=575&&p.cols[0]>=250&&p.cols[1]<=1175,'patch outside the A1 window box');
 const h=compose('s1'),r1=f32('public/geo-r02b/terrain.f32');assert.equal(sha(new Uint8Array(h.buffer)),e.terrainSha256);
 const raw=read('public/geo-r02c-a1c/'+e.declared!.file);assert.equal(sha(raw),e.declared!.sha256);
 const decl=JSON.parse(raw.toString()) as {crestRaised:number[][];shoulderChanged:number[][]};const declared=new Set([...decl.crestRaised,...decl.shoulderChanged].map(([j,i])=>j*W+i));
 let changed=0,maxRaise=0,r1max=-1e9,hmax=-1e9;
 for(let k=0;k<h.length;k++){if(r1[k]>r1max)r1max=r1[k];if(h[k]>hmax)hmax=h[k];if(h[k]!==r1[k]){changed++;assert.ok(h[k]>r1[k],'S1 is raise-only');assert.ok(declared.has(k),'undeclared changed cell '+k);maxRaise=Math.max(maxRaise,h[k]-r1[k]);}}
 assert.equal(changed,e.changedCells);assert.equal(declared.size,changed);assert.ok(maxRaise<=25.001,`max raise ${maxRaise}`);assert.equal(hmax,r1max,'island maximum (the summit) unchanged');
 const js=Math.round((4000-2770)/4),is=Math.round((-520+3000)/4);assert.equal(h[js*W+is],r1[js*W+is],'summit cell');
 for(const r of features.routes as {id:string;points2:number[][]}[])for(const [x,z] of r.points2)assert.equal(surface(h,x,z),surface(r1,x,z),r.id);
});

test('A1c S1 adds no dry closed depressions (same flood and limits as the P0, A1a and A1b guards)',()=>{
 const base=spillDepths(compose('m0')),d=spillDepths(compose('s1'));let max=0,over10cm=0,newOver1cm=0;
 for(let k=0;k<d.length;k++){if(d[k]>max)max=d[k];if(d[k]>.1)over10cm++;if(d[k]>.01&&base[k]<=.01)newOver1cm++;}
 assert.equal(over10cm,0);assert.ok(max<.05,`maximum spill depth ${max} m`);assert.equal(newOver1cm,0);
});

test('recorded A1c validation passes under the declared R-B trial',()=>{
 for(const id of ['m0','s1']){
  const v=JSON.parse(read(`docs/geo-r02c-a1c/validation/${id}.json`).toString()),c=v.checks;
  assert.equal(v.terrainSha256,manifest.variants[id].terrainSha256,id);assert.equal(c.pass,true,id);assert.equal(c.protectedUnchangedExceptDeclaredCrest,true);
  assert.equal(c.allChangedCellsDeclared,true);assert.equal(c.crestRelease.crestCellsLowered,0);assert.equal(c.crestCellsBelowBound,0);
  assert.equal(c.newDrySinkCells1cm,0);assert.equal(c.drainageDestinationChangedCells,0);assert.equal(c.wetCellsChanged,0);assert.equal(c.summit.unchanged,true);assert.equal(c.transitions.smooth,true);
  for(const [route,dh] of Object.entries(c.routeCentrelineMaxChangeM as Record<string,number>))assert.equal(dh,0,id+' '+route);
 }
});

test('A1c cameras are player-height walk cameras with consistent coordinates',()=>{
 const cams=JSON.parse(read('tools/geo-r02c-a1c/cameras.json').toString()).cameras as {id:string;uv:number[];xz:number[];kind:string}[];
 for(const c of cams){assert.ok(c.id.startsWith('a1c-'));assert.equal(c.kind,'walk');assert.ok(Math.abs(c.uv[0]-(c.xz[0]+3000)/10)<1e-2&&Math.abs(c.uv[1]-(4000-c.xz[1])/10)<1e-2,c.id);}
});
