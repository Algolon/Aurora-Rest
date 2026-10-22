import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {buildRockArchetype} from '../src/rocks/experimental/b1/rockArchetypes.ts';
import {r04StudyGeometry} from '../src/rocks/experimental/r04MaterialStudies.ts';
import {buildB1R,B1R_RECIPES,b1rMetrics} from '../src/rocks/experimental/b1r/multiMassRocks.ts';

const digest=(g:THREE.BufferGeometry)=>{
 const hash=createHash('sha256');
 for(const name of ['position','normal','uv','color']){
  const attr=g.getAttribute(name);
  assert.ok(attr,name);
  hash.update(Buffer.from(attr.array.buffer,attr.array.byteOffset,attr.array.byteLength));
  for(const x of attr.array)assert.ok(Number.isFinite(x),'invalid '+name);
 }
 return hash.digest('hex');
};
const q=(v:THREE.Vector3)=>[v.x,v.y,v.z].map(k=>Math.round(k*100000)).join(',');
function validateClosed(g:THREE.BufferGeometry){
 const p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv'),col=g.getAttribute('color');
 assert.equal(p.count,n.count);assert.equal(p.count,uv.count);assert.equal(p.count,col.count);
 assert.ok(g.boundingBox&&!g.boundingBox.isEmpty());
 assert.ok(g.boundingSphere&&g.boundingSphere.radius>.1);
 const edges=new Map<string,number>();
 let volume=0;
 for(let i=0;i<p.count;i+=3){
  const v=[new THREE.Vector3().fromBufferAttribute(p,i),new THREE.Vector3().fromBufferAttribute(p,i+1),
   new THREE.Vector3().fromBufferAttribute(p,i+2)];
  const cr=new THREE.Vector3().subVectors(v[1],v[0]).cross(new THREE.Vector3().subVectors(v[2],v[0]));
  assert.ok(cr.length()>1e-8,'degenerate triangle');
  const normal=new THREE.Vector3().fromBufferAttribute(n,i);
  assert.ok(cr.dot(normal)>1e-8,'incorrect winding');
  volume+=v[0].dot(cr)/6;
  for(let j=0;j<3;j++){
   const edge=[q(v[j]),q(v[(j+1)%3])].sort().join('|');
   edges.set(edge,(edges.get(edge)||0)+1);
  }
 }
 assert.ok(volume>0,'negative/zero volume '+volume);
 assert.ok([...edges.values()].every(c=>c===2),'open or nonmanifold piece');
}
function inside(g:THREE.BufferGeometry,point:THREE.Vector3):boolean{
 const mat=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(g,mat);mesh.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(point,new THREE.Vector3(.83431,.12637,.53639).normalize(),0,100);
 const hits=ray.intersectObject(mesh).map(x=>x.distance).sort((a,b)=>a-b);
 const unique=hits.filter((v,i)=>i===0||Math.abs(v-hits[i-1])>1e-5);
 mat.dispose();return unique.length%2===1;
}
test('B1R V0 source A and B are byte-identical; G1 and C/D/E remain untouched',()=>{
 for(const id of ['A','B'] as const){
  const src=buildRockArchetype(id,'refined'),v0=buildB1R(id,'V0');
  assert.equal(v0.parts.length,1);assert.equal(digest(src),digest(v0.parts[0]));
  assert.equal(v0.metadata.booleanUnion,false);
  src.dispose();v0.dispose();
 }
 const g1=r04StudyGeometry('G1');assert.equal(g1.getAttribute('position').count/3,136);g1.dispose();
 for(const id of ['C','D','E'] as const){const a=buildRockArchetype(id),b=buildRockArchetype(id);
  assert.equal(digest(a),digest(b));a.dispose();b.dispose();}
});
test('A/B V1 and V2 are deterministic, finite, closed individually, overlapping and safely recreatable',()=>{
 for(const id of ['A','B'] as const)for(const version of ['V1','V2'] as const){
  const a=buildB1R(id,version),b=buildB1R(id,version);
  assert.equal(a.parts.length,2);assert.equal(a.components,2);
  assert.equal(a.metadata.booleanUnion,false);
  assert.ok(a.triangles>b1rMetrics(id,'V0').triangles);
  for(let i=0;i<2;i++){assert.equal(digest(a.parts[i]),digest(b.parts[i]));validateClosed(a.parts[i]);}
  const recipe=B1R_RECIPES[id][version];
  assert.ok(inside(a.parts[0],new THREE.Vector3(...recipe.center)),
   'Secondary must be embedded in primary rather than visibly floating: '+id+version);
  assert.ok(inside(a.parts[1],new THREE.Vector3(...recipe.center)),
   'Secondary center must lie in its own mass: '+id+version);
  const primary=buildRockArchetype(id);
  assert.equal(digest(primary),digest(a.parts[0]),'Primary should be truly identical for every version');
  primary.dispose();a.dispose();a.dispose();b.dispose();
  const again=buildB1R(id,version);assert.ok(again.triangles>50);again.dispose();
 }
});
test('A/B V1/V2 remain close to existing primary proportions (<=15% in each bbox dimension)',()=>{
 for(const id of ['A','B'] as const){
  const base=b1rMetrics(id,'V0');
  for(const version of ['V1','V2'] as const){
   const m=b1rMetrics(id,version);
   assert.equal(m.components,2);assert.equal(m.booleanUnion,false);
   for(let k=0;k<3;k++)assert.ok(Math.abs(m.dimensions[k]/base.dimensions[k]-1)<.15,
    'Too-large silhouette change '+id+version+' axis '+k+' '+m.dimensions[k]/base.dimensions[k]);
   assert.ok(m.groundContactMinY<=base.groundContactMinY+.01);
   assert.ok(m.ratioWidthHeight>(id==='B'?2.0:.87));
  }
 }
});
