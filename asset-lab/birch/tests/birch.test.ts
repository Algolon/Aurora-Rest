import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {makeBirchGeometry,birchReferenceModel,LEAF_TINT,BARK_TINT} from '../src/geometry.ts';
import {selectTreeLod,geometryLod} from '../src/lod.ts';
const lods=['near','mid','far'] as const;
function digest(g:THREE.BufferGeometry){
 const hash=createHash('sha256');
 for(const key of ['position','normal','uv','color']){
  const a=g.getAttribute(key) as THREE.BufferAttribute;
  hash.update(key);hash.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));
 }
 const idx=g.index;
 if(idx)hash.update(Buffer.from(idx.array.buffer,idx.array.byteOffset,idx.array.byteLength));
 return hash.digest('hex');
}
test('nine unique variant/LOD combinations produce geometries with finite attributes',()=>{
 const seen=new Set<string>();
 for(const v of [0,1,2] as const)for(const lod of lods){
  const g=makeBirchGeometry(v,lod);
  for(const name of ['position','normal','uv','color']){
   const a=g.getAttribute(name) as THREE.BufferAttribute;assert.ok(a.count>0,`${v}/${lod} ${name}`);
   for(let i=0;i<a.array.length;i++)assert.ok(Number.isFinite(a.array[i]),`${v}/${lod}/${name}/${i}`);
  }
  assert.ok(g.index?.count);
  assert.ok(g.boundingSphere?.radius&&g.boundingSphere.radius>1);
  assert.ok(g.boundingBox?.max.y&&g.boundingBox.max.y>6);
  seen.add(digest(g));g.dispose();
 }
 assert.equal(seen.size,9,'three distinct variants, near/mid/far each distinct');
});
test('seeded geometry is deterministic per variant and LOD',()=>{
 for(const v of [0,1,2] as const)for(const lod of lods){
  const a=makeBirchGeometry(v,lod),b=makeBirchGeometry(v,lod);
  assert.equal(digest(a),digest(b),`${v}/${lod}`);
  a.dispose();b.dispose();
 }
});
test('split reference keeps independent original wood and foliage vertex colours and UVs',()=>{
 const model=birchReferenceModel(0,'near');
 for(const g of [model.wood,model.leaves]){
  assert.ok(g.getAttribute('position'));assert.ok(g.getAttribute('normal'));
  assert.ok(g.getAttribute('color'));assert.ok(g.getAttribute('uv'));
 }
 assert.ok((model.leaves.getAttribute('uv') as THREE.BufferAttribute).getX(0)>=128);
 model.wood.dispose();model.leaves.dispose();
});
test('four logical LODs have far/xfar geometry reuse and 3m hysteresis',()=>{
 assert.equal(geometryLod('xfar'),'far');
 assert.equal(selectTreeLod(24.99,0),0);assert.equal(selectTreeLod(25,0),1);
 assert.equal(selectTreeLod(19,1),1);assert.equal(selectTreeLod(18.99,1),0);
 assert.equal(selectTreeLod(39,1),2);assert.equal(selectTreeLod(33,2),2);
 assert.equal(selectTreeLod(32.99,2),1);
});
test('source colors are explicitly declared for linear bark ratio',()=>{
 assert.equal(LEAF_TINT.birch,'#97a94c');assert.equal(BARK_TINT.birch,'#ece8de');
});
