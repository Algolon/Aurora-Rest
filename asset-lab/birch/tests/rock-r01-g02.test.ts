import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildShelteredFaultG02,type V3} from '../rocks/r01/g02NonConvexCore.ts';
import {createG02Geometry} from '../rocks/r01/g02Geometry.ts';
const key=(v:V3)=>v.map(a=>Math.round(a*1e6)).join(',');
test('G02 distinct authored nonconvex surface and scale, no generated randomness',()=>{
 const a=buildShelteredFaultG02(),b=buildShelteredFaultG02();
 assert.deepEqual(a,b);
 assert.equal(a.topology.construction,'hand-authored-nonconvex-one-shell');
 assert.equal(a.topology.separateSolids,0);
 assert.equal(a.topology.seamControlPoints,4);
 assert.equal(a.topology.hasAutomaticNoise,false);
 assert.equal(a.topology.ownerArtApproved,false);
 assert.ok(a.triangles>=90&&a.triangles<=150);
 const size=a.bounds.max.map((x,i)=>x-a.bounds.min[i]);
 assert.ok(size[0]>3.4&&size[0]<3.85,'width '+size[0]);
 assert.ok(size[1]>2.30&&size[1]<2.6,'height '+size[1]);
 assert.ok(size[2]>2.7&&size[2]<3.3,'depth '+size[2]);
 assert.ok(a.positions.every(Number.isFinite));
 assert.ok(a.normals.every(Number.isFinite));
 assert.ok(a.uv.every(Number.isFinite));
 assert.ok(a.colors.every(x=>x===1));
});
test('G02 is ONE watertight, consistently oriented triangular manifold',()=>{
 const g=buildShelteredFaultG02(),edges=new Map<string,number[]>(),adj=new Map<string,Set<string>>();
 const p=g.positions;let volume=0;
 for(let i=0;i<p.length;i+=9){
  const vs:V3[]=[[p[i],p[i+1],p[i+2]],[p[i+3],p[i+4],p[i+5]],[p[i+6],p[i+7],p[i+8]]];
  const u=vs[1].map((x,j)=>x-vs[0][j]) as V3,v=vs[2].map((x,j)=>x-vs[0][j]) as V3;
  const n:V3=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const area=Math.hypot(...n);assert.ok(area>1e-7);
  volume+=(vs[0][0]*(vs[1][1]*vs[2][2]-vs[1][2]*vs[2][1])
     +vs[0][1]*(vs[1][2]*vs[2][0]-vs[1][0]*vs[2][2])
     +vs[0][2]*(vs[1][0]*vs[2][1]-vs[1][1]*vs[2][0]))/6;
  for(let k=0;k<3;k++){
   const normal=g.normals.slice(i/3+k*3,i/3+k*3+3);
   assert.ok(n.reduce((a,x,j)=>a+x*normal[j],0)/area>.999,'normal/orientation');
   const a=key(vs[k]),b=key(vs[(k+1)%3]),s=[a,b].sort(),ek=s.join('|');
   edges.set(ek,[...(edges.get(ek)??[]),a===s[0]?1:-1]);
   if(!adj.has(a))adj.set(a,new Set());if(!adj.has(b))adj.set(b,new Set());
   adj.get(a)!.add(b);adj.get(b)!.add(a);
  }
 }
 for(const v of edges.values()){assert.equal(v.length,2,'boundary/nonmanifold edge');assert.equal(v[0]+v[1],0,'oriented adjacency');}
 const unseen=new Set(adj.keys()),pending=[unseen.values().next().value!];
 while(pending.length){const a=pending.pop()!;if(!unseen.delete(a))continue;pending.push(...adj.get(a)!);}
 assert.equal(unseen.size,0,'connected shell');
 assert.equal(adj.size-edges.size+g.triangles,2,'genus zero');
 assert.ok(volume>3,'positive nonzero physical volume: '+volume);
});
test('G02 actual Three.js geometry adapter provides finite instancing compatible attributes',()=>{
 const g=createG02Geometry();assert.ok(g.boundingBox&&g.boundingSphere);
 for(const k of ['position','normal','uv','color'])assert.ok(Array.from(g.getAttribute(k).array).every(Number.isFinite),k);
 assert.equal(g.getAttribute('position').count/3,g.userData.rockR01.triangles);
 assert.equal(g.userData.rockR01.artApproved,false);
 let count=0;g.addEventListener('dispose',()=>count++);g.dispose();assert.equal(count,1);
});
