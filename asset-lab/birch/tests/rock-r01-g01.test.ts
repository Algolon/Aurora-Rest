import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildShelteredFaultR01} from '../rocks/r01/sculptCore.ts';
import {createR01Geometry} from '../rocks/r01/geometry.ts';
import {buildRefinedR04} from '../src/rocks/experimental/r04RefinementCore.ts';
type V3=[number,number,number];
const key=(p:V3)=>p.map(n=>Math.round(n*1e6)).join(',');
test('R01 authored shell is repeatable, bounded, complete and original',()=>{
 const a=buildShelteredFaultR01(),b=buildShelteredFaultR01();
 assert.deepEqual(a,b);assert.equal(a.topology.structuralMasses,2);
 assert.equal(a.topology.faultVertices,4);
 assert.ok(a.triangles>=60&&a.triangles<250);
 assert.ok(a.bounds.max[1]>=2.39);
 const size=a.bounds.max.map((x,i)=>x-a.bounds.min[i]);
 size.forEach((v,i)=>assert.ok(Math.abs(v-[3.61,2.32,2.99][i])<.15,'R01 dimension '+i+' '+v));
 assert.ok(a.positions.every(Number.isFinite));
 assert.ok(a.normals.every(Number.isFinite));
 assert.ok(a.uv.every(Number.isFinite));
 assert.ok(a.colors.every(n=>n===1));
 assert.notDeepEqual(a.positions,buildRefinedR04('G1').positions);
});
test('R01 is one oriented, closed, two-manifold exterior without degenerate faces',()=>{
 const mesh=buildShelteredFaultR01(),edge=new Map<string,number[]>(),adj=new Map<string,Set<string>>();
 const p=mesh.positions;let signedVolume=0;
 for(let i=0;i<p.length;i+=9){
  const verts:V3[]=[[p[i],p[i+1],p[i+2]],[p[i+3],p[i+4],p[i+5]],[p[i+6],p[i+7],p[i+8]]];
  const e1=verts[1].map((v,j)=>v-verts[0][j]) as V3;
  const e2=verts[2].map((v,j)=>v-verts[0][j]) as V3;
  const n:V3=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
  assert.ok(Math.hypot(...n)>1e-8,'face area');
  signedVolume+=(verts[0][0]*(verts[1][1]*verts[2][2]-verts[1][2]*verts[2][1])
   +verts[0][1]*(verts[1][2]*verts[2][0]-verts[1][0]*verts[2][2])
   +verts[0][2]*(verts[1][0]*verts[2][1]-verts[1][1]*verts[2][0]))/6;
  const normalLen=Math.hypot(...n);
  for(let j=0;j<3;j++){
   const idx=i/3+j;
   const d=n[0]*mesh.normals[idx*3]+n[1]*mesh.normals[idx*3+1]+n[2]*mesh.normals[idx*3+2];
   assert.ok(Math.abs(d/normalLen-1)<1e-6,'flat normal winding');
   const from=key(verts[j]),to=key(verts[(j+1)%3]),sorted=[from,to].sort().join('|');
   const dir=from===sorted.split('|')[0]?1:-1;
   edge.set(sorted,[...(edge.get(sorted)??[]),dir]);
   if(!adj.has(from))adj.set(from,new Set());adj.get(from)!.add(to);
   if(!adj.has(to))adj.set(to,new Set());adj.get(to)!.add(from);
  }
 }
 for(const v of edge.values()){assert.equal(v.length,2,'nonmanifold boundary');assert.equal(v[0]+v[1],0,'winding mismatch');}
 const unseen=new Set(adj.keys()),stack=[unseen.values().next().value!];
 while(stack.length){const item=stack.pop()!;if(!unseen.delete(item))continue;stack.push(...adj.get(item)!);}
 assert.equal(unseen.size,0,'disconnected pieces');
 assert.equal(adj.size-edge.size+mesh.triangles,2,'Euler characteristic');
 assert.ok(signedVolume>1,'outward positive volume '+signedVolume);
});
test('Three.js adapter has bounds and finites and disposes owned geometry',()=>{
 const g=createR01Geometry();assert.ok(g.boundingBox);
 assert.equal(g.getAttribute('position').count/3,g.userData.rockR01.triangles);
 for(const name of ['position','normal','uv','color'])
  assert.ok(Array.from(g.getAttribute(name).array).every(Number.isFinite));
 let disposed=0;g.addEventListener('dispose',()=>disposed++);g.dispose();assert.equal(disposed,1);
});
