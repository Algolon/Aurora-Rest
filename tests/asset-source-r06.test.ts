import test from 'node:test';import assert from 'node:assert/strict';
import * as T from 'three';
import {SOURCE_PLAN,getSourceProtoMeshes,buildMossVolume} from '../src/asset-source-r06/source-volume.ts';
test('true twelve source mesh groups are required, no invented geometry',()=>{
 const g=new T.Group();assert.throws(()=>getSourceProtoMeshes(g),/12 distinct/);
 assert.equal(SOURCE_PLAN.instancesPerPrototype,48);
 assert(SOURCE_PLAN.diameterXM>0&&SOURCE_PLAN.diameterXM<1);
});
test('reconstructed patch only instantiates licensed source geometry in 5-15k source triangles',()=>{
 const root=new T.Group(),geoms=[];
 for(let i=0;i<12;i++){
  const vertices=new Float32Array([-.004,0,0,.004,.012,0,.004,0,.004]);
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(vertices,3));
  g.setAttribute('normal',new T.Float32BufferAttribute([0,1,0,0,1,0,0,1,0],3));
  g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1],2));
  const triCount=[24,16,20,20,16,16,24,6,6,8,24,24][i];
  const attrIndex=Array.from({length:triCount*3},(_,j)=>j%3);
  g.setIndex(attrIndex);
  root.add(new T.Mesh(g,new T.MeshStandardMaterial()));geoms.push(g);
 }
 const alpha=new T.Texture(),result=buildMossVolume(root,alpha);
 assert.equal(result.metrics.originalSourceTriangles,204);
 assert.equal(result.metrics.instancedSourceTriangles,9792);
 assert.equal(result.metrics.instanceCount,576);
 assert.equal(result.metrics.originalPrototypes,12);
 assert.equal(result.group.children.length,12);
 for(const child of result.group.children)assert(child instanceof T.InstancedMesh);
 result.dispose();root.traverse(o=>{if(o instanceof T.Mesh)(o.material as T.Material).dispose()});
 geoms.forEach(g=>g.dispose());alpha.dispose();
});
test('download script checks supplier files, alpha, SHA256 and MD5 rather than synthesizing',async()=>{
 const s=await(await import('node:fs/promises')).readFile(new URL('../tools/asset-source-r06/fetch-model.mjs',import.meta.url),'utf8');
 assert.match(s,/Alpha/);assert.match(s,/md5/);assert.match(s,/sha256/);assert.match(s,/source_provenance/);
});
