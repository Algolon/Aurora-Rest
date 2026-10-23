import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {applyPatch,applyVariantRoutes,variantId,variantRef,type VariantEntry} from '../src/geo-r02c-a1a/variants.ts';
// GEO-R02C-B2a candidate guards: B2a corrects D1-D4 of the protected B1.1 massif. The R1 and B01 tests stay untouched. These tests check
// exact composition, preserved geography, the North Peak summit equal to B1.1, no dry closed depressions, the primary approach within the
// 0.30 hiking grade on the rendered surface, the optional scramble reaching the summit, and the recorded validation gates.
const root=new URL('../',import.meta.url),read=(p:string)=>readFileSync(new URL(p,root)),sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const f32=(p:string)=>{const b=read(p);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const W=1501,Hn=2001,R1_SHA='fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a',B11_SHA='86e89c1e955ef44b252111d87cfce1194eae55efac479bb1a3b069966ce7323d';
type Man={baseTerrainSha256:string;variants:Record<string,VariantEntry&{referenceTerrainSha256?:string;designSha256?:string}>};
const man=(f:string)=>JSON.parse(read(`public/${f}/manifest.json`).toString()) as Man,b2a=man('geo-r02c-b2a'),b01=man('geo-r02c-b01');
const design=JSON.parse(read('tools/geo-r02c-b2a/design/north-massif-b2a.json').toString());
const water=f32('public/geo-r02b/water-surface.f32'),features=JSON.parse(read('public/geo-r02b/features.json').toString());
const routes=JSON.parse(read('public/geo-r02c-b2a/routes.json').toString()) as {routes:{id:string;replaces?:string;adds?:boolean;points2:number[][]}[]};
function compose(fam:string,m:Man,id:string){
 const h=f32('public/geo-r02b/terrain.f32'),e=m.variants[id];
 if(e.patch){const raw=read(`public/${fam}/`+e.patch.file);assert.equal(sha(raw),e.patch.sha256,id+' patch');applyPatch(h,W,e.patch,new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)));}
 return h;
}
function surface(h:Float32Array,x:number,z:number){
 const gx=Math.min(Math.max((x+3000)/4,0),W-1-1e-8),gz=Math.min(Math.max((4000-z)/4,0),Hn-1-1e-8),i=Math.floor(gx),j=Math.floor(gz),u=gx-i,v=gz-j;
 const a=h[j*W+i],b=h[(j+1)*W+i],c=h[j*W+i+1],d=h[(j+1)*W+i+1];return u+v<=1?a+(c-a)*u+(b-a)*v:d+(b-d)*(1-u)+(c-d)*(1-v);
}
function inside(p:number[],ring:number[][]){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
function spillDepths(h:Float32Array){ // same 8-connected priority flood and drains as the P0 / A1 / B01 guards
 const n=W*Hn,filled=new Float32Array(h),done=new Uint8Array(n),heap=new Int32Array(n);let size=0;
 const less=(a:number,b:number)=>filled[a]<filled[b];
 const push=(k:number)=>{let i=size++;heap[i]=k;while(i>0){const p=(i-1)>>1;if(!less(heap[i],heap[p]))break;[heap[i],heap[p]]=[heap[p],heap[i]];i=p;}};
 const pop=()=>{const top=heap[0];heap[0]=heap[--size];let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<size&&less(heap[l],heap[m]))m=l;if(r<size&&less(heap[r],heap[m]))m=r;if(m===i)break;[heap[i],heap[m]]=[heap[m],heap[i]];i=m;}return top;};
 for(let j=0;j<Hn;j++)for(let i=0;i<W;i++){const k=j*W+i,v=h[k],w=water[k];if(j===0||i===0||j===Hn-1||i===W-1||v<=0||(Number.isFinite(w)&&v<w)){done[k]=1;push(k);}}
 while(size){const k=pop(),j=(k/W)|0,i=k-j*W;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!dj&&!di)continue;const a=j+dj,b=i+di;if(a<0||b<0||a>=Hn||b>=W)continue;const q=a*W+b;if(done[q])continue;done[q]=1;if(filled[q]<filled[k])filled[q]=filled[k];push(q);}}
 const d=new Float32Array(n);for(let k=0;k<n;k++)d[k]=filled[k]-h[k];return d;
}
function walkBlockedAt(h:Float32Array,pts:number[][]){ // stepWalk / walkRouteForTest: sub-steps <= 0.65 m, refused when |dh| / step > 0.7
 for(let k=1;k<pts.length;k++){const [x0,z0]=pts[k-1],[x1,z1]=pts[k],d=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.ceil(d/.65));let old=surface(h,x0,z0);
  for(let s=1;s<=n;s++){const x=x0+(x1-x0)*s/n,z=z0+(z1-z0)*s/n,v=surface(h,x,z);if(d>0&&Math.abs(v-old)/(d/n)>.7)return k;old=v;}}
 return -1;
}
function maxHikingGrade(h:Float32Array,pts:number[][],win=10){ // grade over a moving 10 m window along the path, on the rendered surface
 const s=[0];for(let k=1;k<pts.length;k++)s.push(s[k-1]+Math.hypot(pts[k][0]-pts[k-1][0],pts[k][1]-pts[k-1][1]));
 const hs=pts.map(p=>surface(h,p[0],p[1]));const at=(t:number)=>{let k=1;while(k<s.length-1&&s[k]<t)k++;const f=(t-s[k-1])/((s[k]-s[k-1])||1);return hs[k-1]+(hs[k]-hs[k-1])*f;};
 let max=0;for(let t=win/2;t<=s.at(-1)!-win/2;t+=1)max=Math.max(max,Math.abs(at(t+win/2)-at(t-win/2))/win);return max;
}

test('B2a variants are opt-in and do not change earlier variant ids',()=>{
 assert.deepEqual(variantRef('?terrain=b2a-a'),{family:'b2a',id:'a'});assert.equal(variantRef('?terrain=b2a-b'),null);assert.equal(variantId('?terrain=b2a-a'),null);
 assert.deepEqual(variantRef('?terrain=b01-b1'),{family:'b01',id:'b1'});assert.deepEqual(variantRef('?terrain=a1c-s1'),{family:'a1c',id:'s1'});
});

test('B2a empty variant M0 is byte-identical to canonical R1; B2a references the protected B1.1 terrain',()=>{
 assert.equal(b2a.baseTerrainSha256,R1_SHA);assert.equal(b2a.variants.m0.patch,null);assert.equal(sha(new Uint8Array(compose('geo-r02c-b2a',b2a,'m0').buffer)),R1_SHA);
 assert.equal(b2a.variants.a.referenceTerrainSha256,B11_SHA);assert.equal(b01.variants.b1.terrainSha256,B11_SHA,'B1.1 reference unchanged');
 assert.equal(sha(new Uint8Array(compose('geo-r02c-b01',b01,'b1').buffer)),B11_SHA);
});

test('B2a composes to its SHA-256 and changes nothing outside the study area, on the coast, in the water or at High Tarn',()=>{
 const e=b2a.variants.a,h=compose('geo-r02c-b2a',b2a,'a'),r1=f32('public/geo-r02b/terrain.f32');assert.equal(sha(new Uint8Array(h.buffer)),e.terrainSha256);
 const poly=design.studyArea.polygon as number[][],lake=(features.lakes as {id:string;boundary:number[][]}[]).find(l=>l.id==='high-tarn')!.boundary;let changed=0;
 for(let k=0;k<h.length;k++){if(h[k]===r1[k])continue;changed++;const j=(k/W)|0,i=k-j*W,x=4*i-3000,z=4000-4*j;
  assert.ok(inside([x,z],poly),`change outside the study area at ${x},${z}`);assert.ok(!Number.isFinite(water[k]),`water cell changed at ${x},${z}`);assert.equal(h[k]>0,r1[k]>0,'land/sea sign changed');
  let dmin=Infinity;for(const p of lake)dmin=Math.min(dmin,Math.hypot(p[0]-x,p[1]-z));assert.ok(dmin>150-4,`change within 150 m of High Tarn at ${x},${z}`);}
 assert.equal(changed,e.changedCells);
});

test('B2a keeps the B1.1 North Peak summit: same height and position, island maximum, apex unchanged; only the D2 west shoulder moves',()=>{
 const h=compose('geo-r02c-b2a',b2a,'a'),b=compose('geo-r02c-b01',b01,'b1');let best=-1e9,at=0;for(let k=0;k<h.length;k++)if(h[k]>best){best=h[k];at=k;}
 let bb=-1e9,ab=0;for(let k=0;k<b.length;k++)if(b[k]>bb){bb=b[k];ab=k;}assert.equal(best,bb);assert.equal(at,ab);
 // measured: within 25 m of the summit <= 0.09 m; 50-100 m to the west only <= 2.32 m (the D2 start cap removes B1.1's spill-over cone)
 const j0=(at/W)|0,i0=at-j0*W;for(let dj=-25;dj<=25;dj++)for(let di=-25;di<=25;di++){const r=Math.hypot(dj,di)*4;if(r>100)continue;const k=(j0+dj)*W+i0+di,d=Math.abs(h[k]-b[k]);
  if(r<=25)assert.ok(d<=0.1,`summit apex changed by ${d} m at ${dj},${di}`);else if(d>0.01){assert.ok(d<=2.5,`summit area changed by ${d} m at ${dj},${di}`);assert.ok(di<0,`summit area changed on the protected (non-D2) side at ${dj},${di}`);}}
});

test('B2a adds no dry closed depressions (same flood and limits as the earlier guards)',()=>{
 const base=spillDepths(compose('geo-r02c-b2a',b2a,'m0')),d=spillDepths(compose('geo-r02c-b2a',b2a,'a'));let max=0,newOver1cm=0;
 for(let k=0;k<d.length;k++){if(d[k]>max)max=d[k];if(d[k]>.01&&base[k]<=.01)newOver1cm++;}
 assert.equal(newOver1cm,0);assert.ok(max<.05,`maximum spill depth ${max} m`);
});

test('B2a primary approach meets the 0.30 hiking grade on the rendered surface; the optional scramble reaches the summit; other routes are unchanged',()=>{
 const h=compose('geo-r02c-b2a',b2a,'a'),r1=f32('public/geo-r02b/terrain.f32'),prim=routes.routes.find(r=>r.id==='peak-ascent')!,scr=routes.routes.find(r=>r.id==='peak-scramble')!;
 assert.equal(prim.replaces,'peak-ascent');assert.equal(scr.adds,true);
 assert.equal(walkBlockedAt(h,prim.points2),-1,'primary blocked');assert.ok(maxHikingGrade(h,prim.points2)<=0.30,'primary hiking grade above 0.30');
 assert.deepEqual(prim.points2.at(-1),scr.points2[0],'scramble starts at the primary viewpoint');assert.equal(walkBlockedAt(h,scr.points2),-1,'scramble blocked');
 const end=scr.points2.at(-1)!;assert.ok(Math.hypot(end[0]+520,end[1]-2772)<=10,'scramble ends at the summit');
 for(const r of features.routes as {id:string;points2:number[][]}[]){if(r.id==='peak-ascent')continue;for(const [x,z] of r.points2)assert.equal(surface(h,x,z),surface(r1,x,z),r.id);assert.equal(walkBlockedAt(h,r.points2),-1,r.id);}
});

test('variant routes can add an optional route without colliding with an existing id',()=>{
 const rs=[{id:'peak-ascent',points2:[[0,0]]}];applyVariantRoutes(rs,[{id:'peak-ascent',replaces:'peak-ascent',points2:[[1,1]]},{id:'peak-scramble',adds:true,points2:[[2,2]]}]);
 assert.deepEqual(rs.map(r=>r.id),['peak-ascent','peak-ascent-r1','peak-scramble']);assert.throws(()=>applyVariantRoutes(rs,[{id:'peak-ascent',adds:true,points2:[]}]));
});

test('recorded B2a gates: seams, Western Col, hydrology, skyline regression, provenance',()=>{
 const v=JSON.parse(read('docs/geo-r02c-b2a/validation/a.json').toString()),f=JSON.parse(read('docs/geo-r02c-b2a/validation/a-final.json').toString()),sk=JSON.parse(read('docs/geo-r02c-b2a/data/skyline-regression.json').toString());
 assert.equal(v.terrainSha256,b2a.variants.a.terrainSha256);assert.equal(v.pass,true);assert.equal(v.preserved.pass,true);assert.equal(v.hydrology.newDrySinkCells1cm,0);
 assert.equal(f.recomposedEqualsCommitted,true);assert.equal(f.A_seams.failingClusters,0,'seam cluster above 0.25 ha');assert.equal(f.C_hydrology.dryHollows.length,0,'dry hollow remains');
 assert.ok(f.B_westernCol.vesttindProminenceAboveColM>=50,'Vesttind prominence');assert.equal(sk.pass,true,'skyline regression');
 assert.equal(design.parentB11.terrainSha256,B11_SHA);assert.equal(sha(read('tools/geo-r02c-b01/design/north-massif-b1.json')),design.parentB11.sha256,'B1.1 design unchanged');
 assert.equal(sha(read('docs/geo-r02b/design-master-A-R1-v1.json')),'62cb154b4ab6473ae7e2507449cea5407774503cdc09fe42f09adbde0a0ec598');
 assert.equal(b2a.variants.a.designSha256,sha(read('tools/geo-r02c-b2a/design/north-massif-b2a.json')));
});
