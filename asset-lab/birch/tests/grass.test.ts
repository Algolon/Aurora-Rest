import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {makeGrassGeometry,referenceGrassModel} from '../src/grass/geometry.ts';
import {grassMaterialOwnerCount} from '../src/grass/materials.ts';
test('production grass has exactly four deterministic distinct original geometries',()=>{
 const hashes=new Set();
 const heights=[];
 for(const variant of [0,1,2,3] as const){
  const a=makeGrassGeometry(variant),b=makeGrassGeometry(variant);
  const hash=(g:THREE.BufferGeometry)=>{const h=createHash('sha256');for(const key of ['position','normal','color','uv']){
   const v=g.getAttribute(key);assert.ok(v,variant+'/'+key);
   h.update(Buffer.from(v.array.buffer,v.array.byteOffset,v.array.byteLength));
   for(const x of v.array)assert.ok(Number.isFinite(x));
  }return h.digest('hex')};
  assert.equal(hash(a),hash(b),'seeded deterministic '+variant);
  assert.equal(a.index,null,'original strips are deliberately non-indexed');
  assert.ok(a.boundingSphere && a.boundingSphere.radius>0);
  a.computeBoundingBox();heights.push(a.boundingBox!.max.y);
  assert.ok(a.boundingBox!.min.y>=-0.1&&a.boundingBox!.max.y<1);
  hashes.add(hash(a));a.dispose();b.dispose();
 }
 assert.equal(hashes.size,4);assert.ok(heights[2]>heights[0]);
});
test('production garden detail differs from reduced Node fallback and base model',()=>{
 const garden=makeGrassGeometry(2,'flw-production-reference');
 const reduced=referenceGrassModel(2,true,false,false);
 const basic=makeGrassGeometry(2,'basic-grass-model');
 assert.ok(garden.getAttribute('uv').count>0);
 assert.equal(reduced.getAttribute('uv'),undefined);
 assert.notEqual(garden.getAttribute('position').count,reduced.getAttribute('position').count);
 assert.notEqual(garden.getAttribute('position').count,basic.getAttribute('position').count);
 for(const g of [garden,reduced,basic])g.dispose();
});
test('grass source vertex colours/UVs preserve production material compatibility',()=>{
 const v0=makeGrassGeometry(0),v2=makeGrassGeometry(2);
 assert.equal(v0.getAttribute('position').count,v0.getAttribute('color').count);
 assert.equal(v0.getAttribute('position').count,v0.getAttribute('uv').count);
 const uv=v0.getAttribute('uv');
 for(let i=0;i<uv.count;i++){assert.equal(uv.getX(i),.875);assert.equal(uv.getY(i),.25)}
 const seedUv=v2.getAttribute('uv');let mapped=0;
 for(let i=0;i<seedUv.count;i++)if(Math.abs(seedUv.getX(i)-.875)>1e-4)mapped++;
 assert.ok(mapped>0,'variant 2 must retain gardenLeaf seed-head tile 1 UVs');
 v0.dispose();v2.dispose();
});
test('non-production basic fallback does not replace selected production geometry',()=>{
 for(const variant of [0,1,2,3] as const){
  const g=makeGrassGeometry(variant,'basic-grass-model');
  assert.ok(g.getAttribute('position').count>0);
  assert.equal(g.getAttribute('uv'),undefined);
  g.dispose();
 }
 assert.equal(grassMaterialOwnerCount(),0,'no browser-only texture allocated by Node geometry tests');
});
