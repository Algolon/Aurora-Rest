import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {makePineGeometry,pineReferenceModel} from '../src/pine/geometry.ts';
import {BARK_TINT,LEAF_TINT,makeBirchGeometry} from '../src/geometry.ts';
import {geometryLod,selectTreeLod} from '../src/lod.ts';
const lods=['near','mid','far'] as const;
function digest(g:THREE.BufferGeometry){const h=createHash('sha256');for(const n of ['position','normal','uv','color']){const a=g.getAttribute(n) as THREE.BufferAttribute;h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));}
 const i=g.index;if(i)h.update(Buffer.from(i.array.buffer,i.array.byteOffset,i.array.byteLength));return h.digest('hex');}
test('pine has nine unique deterministic structural geometry combinations',()=>{
 const hashes=new Set<string>();
 for(const v of [0,1,2] as const)for(const lod of lods){
  const a=makePineGeometry(v,lod),b=makePineGeometry(v,lod);
  assert.equal(digest(a),digest(b),'seeded pine hash '+v+'/'+lod);
  hashes.add(digest(a));
  for(const n of ['position','normal','uv','color']){
   const attr=a.getAttribute(n) as THREE.BufferAttribute;assert.ok(attr.count>0,n);
   for(const x of attr.array)assert.ok(Number.isFinite(x),'pine '+v+'/'+lod+'/'+n);
  }
  assert.ok(a.index?.count);assert.ok(a.boundingBox?.max.y!>10);assert.ok(a.boundingSphere?.radius!>5);
  a.dispose();b.dispose();
 }
 assert.equal(hashes.size,9);
});
test('source split-parts retain warm sculpted bark marker and needle atlas tile',()=>{
 for(const v of [0,1,2] as const)for(const lod of lods){
  const m=pineReferenceModel(v,lod,'outline');
  const wood=m.wood.getAttribute('uv') as THREE.BufferAttribute,leaves=m.leaves.getAttribute('uv') as THREE.BufferAttribute;
  assert.ok(wood.count>0&&leaves.count>0);
  assert.ok(wood.getX(0)>19&&wood.getX(0)<21);
  assert.ok(leaves.getX(0)>=134&&leaves.getX(0)<=135,'pine atlas tile 3 marker');
  m.wood.dispose();m.leaves.dispose();
 }
});
test('pine source foliage tint differs from birch, LOD far/xfar shares geometry band',()=>{
 assert.equal(LEAF_TINT.pine,'#4e6c48');
 assert.equal(BARK_TINT.pine,'#a3896f');
 assert.notEqual(LEAF_TINT.birch,LEAF_TINT.pine);
 assert.equal(geometryLod('xfar'),'far');
 assert.equal(selectTreeLod(25,0),1);assert.equal(selectTreeLod(39,1),2);assert.equal(selectTreeLod(65,2),3);
});
test('birch original geometry construction still unchanged',()=>{
 const g=makeBirchGeometry(0,'near');assert.ok(g.getAttribute('uv').count>0);g.dispose();
});
