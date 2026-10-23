import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildShelteredFaultG02R,type V3} from '../rocks/r01/g02rOrganicCore.ts';
import {createG02RGeometry} from '../rocks/r01/g02rGeometry.ts';
const key=(v:V3)=>v.map(a=>Math.round(a*1e6)).join(',');
test('G02R authored topology is original, deterministic and has genuinely unequal upper panel areas',()=>{
 const a=buildShelteredFaultG02R(),b=buildShelteredFaultG02R();
 assert.deepEqual(a,b);
 assert.equal(a.topology.construction,'irregular-authored-surface-panels');
 assert.equal(a.topology.artApproved,false);
 assert.equal(a.topology.firstOrderMasses,2);
 assert.equal(a.topology.surfacePanels,44);
 assert.equal(a.topology.totalControlVertices,53);
 assert.ok(a.topology.largePlaneRatio>2.5,'large-to-small 90/10 panel areas '+a.topology.largePlaneRatio);
 assert.equal(a.triangles,102);
 const dims=a.bounds.max.map((x,i)=>x-a.bounds.min[i]);
 for(const [i,lo,hi] of [[0,3.45,3.7],[1,2.25,2.55],[2,2.8,3.2]] as const)
  assert.ok(dims[i]>=lo&&dims[i]<=hi,'metric dim '+i+': '+dims[i]);
 assert.ok(a.positions.every(Number.isFinite));
 assert.ok(a.normals.every(Number.isFinite));
 assert.ok(a.uv.every(Number.isFinite));
 assert.ok(a.colors.every(x=>x===1));
});
test('G02R one watertight, connected, consistently outward oriented genus-zero shell',()=>{
 const a=buildShelteredFaultG02R(),edge=new Map<string,number[]>(),
 adjacency=new Map<string,Set<string>>();
 const p=a.positions;let volume=0;
 for(let i=0;i<p.length;i+=9){
  const v:V3[]=[[p[i],p[i+1],p[i+2]],[p[i+3],p[i+4],p[i+5]],[p[i+6],p[i+7],p[i+8]]];
  const cross=(x:V3,y:V3):V3=>[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
  const dif=(x:V3,y:V3)=>x.map((t,j)=>t-y[j]) as V3;
  const n=cross(dif(v[1],v[0]),dif(v[2],v[0]));
  const size=Math.hypot(...n);assert.ok(size>1e-7);
  volume+=v[0].reduce((s,t,j)=>s+t*cross(v[1],v[2])[j],0)/6;
  for(let k=0;k<3;k++){
   const normal=a.normals.slice(i+k*3,i+k*3+3);
   assert.ok(n.reduce((s,t,j)=>s+t*normal[j],0)/size>.99999);
   const from=key(v[k]),to=key(v[(k+1)%3]),sorted=[from,to].sort();
   const e=sorted.join('|');edge.set(e,[...(edge.get(e)??[]),from===sorted[0]?1:-1]);
   if(!adjacency.has(from))adjacency.set(from,new Set());
   if(!adjacency.has(to))adjacency.set(to,new Set());
   adjacency.get(from)!.add(to);adjacency.get(to)!.add(from);
  }
 }
 for(const signs of edge.values()){assert.equal(signs.length,2,'nonmanifold edge');assert.equal(signs[0]+signs[1],0,'winding');}
 const unvisited=new Set(adjacency.keys()),pending=[unvisited.values().next().value!];
 while(pending.length){const x=pending.pop()!;if(!unvisited.delete(x))continue;pending.push(...adjacency.get(x)!);}
 assert.equal(unvisited.size,0,'connected shell');
 assert.equal(adjacency.size-edge.size+a.triangles,2,'Euler');
 assert.ok(volume>5,'positive outward volume '+volume);
});
test('Three.js adapter retains F01/A2 T1-compatible attributes and ownership',()=>{
 const g=createG02RGeometry();assert.ok(g.boundingBox&&g.boundingSphere);
 for(const k of ['position','normal','uv','color'])
  assert.ok(Array.from(g.getAttribute(k).array).every(Number.isFinite));
 assert.equal(g.getAttribute('position').count/3,102);
 assert.equal(g.userData.rockR01.artApproved,false);
 let disposed=0;g.addEventListener('dispose',()=>disposed++);g.dispose();assert.equal(disposed,1);
});
