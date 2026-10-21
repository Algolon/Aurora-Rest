import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {rockModel,PRODUCTION_ROCK_SEEDS,createRockFamily} from '../src/rocks/index.ts';
import {buildHeroR04} from '../src/rocks/experimental/rockSculptR04Core.ts';
import {rockR04Geometry} from '../src/rocks/experimental/r04HeroBoulder.ts';
import {rockMaterialOwners} from '../src/rocks/rockMaterials.ts';
const hash=(g:THREE.BufferGeometry)=>{
 const h=createHash('sha256');
 for(const key of ['position','normal','uv','color']){
  const a=g.getAttribute(key);
  assert.ok(a,key+' missing');h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));
  for(const x of a.array)assert.ok(Number.isFinite(x),key+' nonfinite');
 }
 if(g.index)h.update(Buffer.from(g.index.array.buffer,g.index.array.byteOffset,g.index.array.byteLength));
 return h.digest('hex');
};
test('Source rocks 11,23,37,53 deterministic and independently varied',()=>{
 const distinct=new Set<string>();
 for(const seed of PRODUCTION_ROCK_SEEDS){
  const a=rockModel(seed),b=rockModel(seed);
  assert.equal(hash(a),hash(b));distinct.add(hash(a));
  assert.ok(a.getAttribute('position').count>=12);
  assert.ok(a.getAttribute('position').count%3===0);
  assert.equal(a.getAttribute('position').count,a.getAttribute('color').count);
  assert.equal(a.getAttribute('position').count,a.getAttribute('normal').count);
  assert.equal(a.getAttribute('position').count,a.getAttribute('uv').count);
  assert.ok(a.boundingBox&&a.boundingSphere&&a.boundingSphere.radius>0);
  assert.ok(a.boundingBox.max.y<1.7&&a.boundingBox.min.y>-.9);
  a.dispose();b.dispose();
 }
 assert.equal(distinct.size,4,'All four source seeds should be distinct');
 assert.equal(rockMaterialOwners(),0,'Node geometry tests allocate no canvas materials');
});
test('Experimental R04 remains distinct and deterministic, 128 triangles / 2 independent solids',()=>{
 const a=buildHeroR04({seed:37,detail:'refined'}),b=buildHeroR04({seed:37,detail:'refined'});
 assert.deepEqual(a,b);assert.equal(a.triangles,128);
 assert.deepEqual(a.pieces.map(p=>p.name),['main','frontSlab']);
 assert.equal(a.positions.length,a.triangles*9);
 assert.equal(a.uv.length,a.triangles*6);
 for(const numbers of [a.positions,a.normals,a.colors,a.uv])assert.ok(numbers.every(Number.isFinite));
 assert.ok(a.colors.every(v=>v>=0&&v<=1));
 const geometry=rockR04Geometry({seed:37});
 assert.equal(geometry.getAttribute('position').count/3,128);
 assert.equal(geometry.userData.rockR04.artApproved,false);
 assert.ok(geometry.boundingSphere&&geometry.boundingSphere.radius>0);
 geometry.dispose();
});
test('R04 polyhedral pieces have outward-facing nondegenerate triangles and closed piece edges',()=>{
 const d=buildHeroR04({seed:37});let offset=0;
 const q=(v:number)=>Math.round(v*1e5);
 for(const piece of d.pieces){
  const edges=new Map<string,number>();
  for(let t=0;t<piece.triangles;t++){
   const j=(offset+t)*9,p=d.positions,n=d.normals;
   const v=[[p[j],p[j+1],p[j+2]],[p[j+3],p[j+4],p[j+5]],[p[j+6],p[j+7],p[j+8]]];
   const u=v[1].map((x,i)=>x-v[0][i]),w=v[2].map((x,i)=>x-v[0][i]);
   const cr=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];
   assert.ok(cr.reduce((sum,x,i)=>sum+x*n[j+i],0)>1e-8);
   for(let e=0;e<3;e++){
    const k=[v[e].map(q).join(','),v[(e+1)%3].map(q).join(',')].sort().join('|');
    edges.set(k,(edges.get(k)||0)+1);
   }
  }
  assert.ok([...edges.values()].every(n=>n===2),'Each *individual* piece must be closed');
  offset+=piece.triangles;
 }
 assert.equal(offset,128);
 // This does not assert a Boolean union or the absence of piece intersections.
});
