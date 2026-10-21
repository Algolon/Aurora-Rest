import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {makeE2Geometry,STUDIES} from '../src/rocks/experimental/e2/studyMaterials.ts';
import {sculptRock} from '../src/rocks/experimental/e2/heroRockStudies.ts';
import {buildHeroR04} from '../src/rocks/experimental/rockSculptR04Core.ts';
import {createHash} from 'node:crypto';
const ids=['A','B','C'] as const;
const digest=(a:THREE.BufferGeometry)=>{const h=createHash('sha256');
 for(const name of ['position','normal','uv']){const x=a.getAttribute(name);assert.ok(x);h.update(Buffer.from(x.array.buffer,x.array.byteOffset,x.array.byteLength));}
 return h.digest('hex')};
const key=(a:number[])=>a.map(x=>Math.round(x*10000)).join(':');
test('Three genuinely independent deterministic authored silhouette constructions',()=>{
 const signatures=new Set();
 for(const id of ids){
  const a=makeE2Geometry(id),b=makeE2Geometry(id);
  assert.equal(digest(a),digest(b),id+' deterministic');
  assert.equal(a.userData.e2.artApproved,false);assert.equal(a.userData.e2.components,1);
  assert.ok(a.getAttribute('position').count>=30);
  assert.equal(a.index,null);
  assert.ok(a.boundingBox&&a.boundingSphere&&a.boundingSphere.radius>0);
  assert.equal(a.getAttribute('position').count,a.getAttribute('normal').count);
  assert.equal(a.getAttribute('position').count,a.getAttribute('uv').count);
  const p=a.getAttribute('position'),n=a.getAttribute('normal');
  assert.ok([...p.array,...n.array].every(Number.isFinite));
  const size=a.boundingBox!.getSize(new THREE.Vector3());
  assert.ok(size.x>2&&size.y>1.4&&size.z>1.3,id+' adequate scale');
  signatures.add(digest(a));
  a.dispose();b.dispose();
 }
 assert.equal(signatures.size,3);
});
test('Every E2A candidate is one closed, outward-wound solid without degenerate triangles',()=>{
 for(const id of ids){
  const g=makeE2Geometry(id),a=g.getAttribute('position'),n=g.getAttribute('normal');
  const edges=new Map<string,number>();let signedVolume=0;
  for(let t=0;t<a.count;t+=3){
   const v=[0,1,2].map(i=>[a.getX(t+i),a.getY(t+i),a.getZ(t+i)]);
   const e1=v[1].map((x,i)=>x-v[0][i]),e2=v[2].map((x,i)=>x-v[0][i]);
   const cross=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
   const area=Math.hypot(...cross)*.5;
   assert.ok(area>1e-8,id+' tiny/degen triangle '+t/3);
   assert.ok(cross.reduce((sum,x,i)=>sum+x*[n.getX(t),n.getY(t),n.getZ(t)][i],0)>0,
      id+' incorrect normals/winding '+t/3);
   const cp=[v[1][1]*v[2][2]-v[1][2]*v[2][1],v[1][2]*v[2][0]-v[1][0]*v[2][2],v[1][0]*v[2][1]-v[1][1]*v[2][0]];
   signedVolume+=v[0].reduce((sum,x,i)=>sum+x*cp[i],0)/6;
   for(let i=0;i<3;i++){
    const aa=key(v[i]),bb=key(v[(i+1)%3]),edge=[aa,bb].sort().join('|');
    edges.set(edge,(edges.get(edge)??0)+1);
   }
  }
  assert.ok(signedVolume>1,id+' expected positive oriented volume');
  const bad=[...edges].filter(([,count])=>count!==2);
  assert.equal(bad.length,0,id+' non-manifold edge count: '+JSON.stringify(bad.slice(0,4)));
  g.dispose();
 }
});
test('Distinct proportions are intentional; positive width/height and fracture axes vary',()=>{
 const geometry=ids.map(id=>sculptRock(STUDIES[id]));
 const size=geometry.map(d=>d.bounds.max.map((v,i)=>v-d.bounds.min[i]));
 const hwr=size.map(d=>d[1]/d[0]);
 assert.ok(hwr[1]<hwr[0],'Erratic should be lower in profile than granite mass');
 assert.ok(hwr[2]>hwr[0]*1.4,'Outcrop should have more vertical silhouette');
 assert.equal(new Set(ids.map(id=>STUDIES[id].fractureAxis.join(':'))).size,3);
 for(const d of geometry)assert.ok(d.triangleCount>=20&&d.faceCount>=12);
});
test('Authored proportion controls are editable and bounded without opaque procedural noise',()=>{
 const initial=makeE2Geometry('A'),other=makeE2Geometry('A',{widthScale:1.12,heightScale:.95,lean:.10});
 assert.notEqual(digest(initial),digest(other));
 assert.throws(()=>makeE2Geometry('A',{widthScale:0.1}),RangeError);
 assert.throws(()=>makeE2Geometry('A',{lean:Infinity}),RangeError);
 initial.dispose();other.dispose();
});
test('E2 has not altered the original R04 benchmark',()=>{
 const r=buildHeroR04({seed:37,detail:'refined'});
 assert.equal(r.triangles,128);assert.deepEqual(r.pieces.map(x=>x.name),['main','frontSlab']);
});
