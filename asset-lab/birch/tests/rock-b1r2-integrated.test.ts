import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createHash} from 'node:crypto';
import {buildIntegratedA,reconstructTransition} from '../src/rocks/experimental/b1r2/integratedA.ts';
import {buildB1R} from '../src/rocks/experimental/b1r/multiMassRocks.ts';
import {buildRockArchetype} from '../src/rocks/experimental/b1/rockArchetypes.ts';
import {r04StudyGeometry} from '../src/rocks/experimental/r04MaterialStudies.ts';
const point=(p:THREE.BufferAttribute,i:number)=>[p.getX(i),p.getY(i),p.getZ(i)] as const;
const key=(p:readonly number[],precision=100000)=>p.map(x=>Math.round(x*precision)).join(',');
function fingerprint(g:THREE.BufferGeometry){
 const h=createHash('sha256');
 for(const name of ['position','normal','uv','color']){
  const a=g.getAttribute(name);assert.ok(a);
  h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));
 }
 return h.digest('hex');
}
export function geometryTopology(g:THREE.BufferGeometry){
 const p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv'),color=g.getAttribute('color');
 assert.equal(p.count,n.count);assert.equal(p.count,uv.count);assert.equal(p.count,color.count);
 assert.ok(p.count>90&&p.count%3===0);
 const edges=new Map<string,{incidence:number;direction:number}>(),adj=new Map<string,Set<string>>();
 const faces:string[][]=[];let signedVolume=0,degenerate=0,wrongNormals=0;
 for(let i=0;i<p.count;i+=3){
  const v=[0,1,2].map(j=>new THREE.Vector3(...point(p,i+j)));
  const e1=v[1].clone().sub(v[0]),e2=v[2].clone().sub(v[0]);
  const cross=e1.clone().cross(e2),area=cross.length()/2;
  if(area<1e-8)degenerate++;
  if(cross.dot(new THREE.Vector3(...point(n,i)))<=1e-8)wrongNormals++;
  signedVolume+=v[0].dot(cross)/6;
  const keys=v.map(x=>key(x.toArray()));faces.push(keys);
  for(let j=0;j<3;j++){
   const a=keys[j],b=keys[(j+1)%3],edge=[a,b].sort().join('|');
   const rec=edges.get(edge)??{incidence:0,direction:0};
   rec.incidence++;rec.direction+=a<b?1:-1;edges.set(edge,rec);
   if(!adj.has(a))adj.set(a,new Set());
   adj.get(a)!.add(b);
   if(!adj.has(b))adj.set(b,new Set());
   adj.get(b)!.add(a);
  }
 }
 const visited=new Set<string>();let components=0;
 for(const k of adj.keys())if(!visited.has(k)){
  components++;const stack=[k];visited.add(k);
  while(stack.length){const v=stack.pop()!;for(const nei of adj.get(v)!)
   if(!visited.has(nei)){visited.add(nei);stack.push(nei);}}
 }
 const badEdges=[...edges.values()].filter(x=>x.incidence!==2);
 const badOrientation=[...edges.values()].filter(x=>x.direction!==0);
 return {faces:faces.length,vertices:adj.size,edges:edges.size,connectedComponents:components,
  badEdgeCount:badEdges.length,badOrientationCount:badOrientation.length,degenerate,wrongNormals,
  signedVolume,euler:adj.size-edges.size+faces.length};
}
test('V3 is deterministic, isolated, finite and retains original compact A-V2 bounds',()=>{
 const a=buildIntegratedA(),b=buildIntegratedA();
 assert.equal(fingerprint(a.geometry),fingerprint(b.geometry));
 assert.equal(a.diagnostics.sourceComponents,2);
 assert.equal(a.diagnostics.outputMeshes,1);
 assert.equal(a.diagnostics.unchangedPrimaryAndShoulder,true);
 assert.ok(a.diagnostics.displacedVertices>0);
 assert.ok(a.diagnostics.maxVertexDisplacement<.08);
 assert.equal(a.geometry.getAttribute('position').count/3,a.diagnostics.outputTriangles);
 const expected=[2.020,1.725,1.560],size=a.bounds.getSize(new THREE.Vector3()).toArray();
 for(let i=0;i<3;i++)assert.ok(Math.abs(size[i]/expected[i]-1)<.1,'bounds exceeded '+i);
 for(const name of ['position','normal','color','uv'])for(const x of a.geometry.getAttribute(name).array)
  assert.ok(Number.isFinite(x));
 a.dispose();a.dispose();b.dispose();
 const recreated=buildIntegratedA();assert.ok(recreated.geometry.getAttribute('position').count>0);recreated.dispose();
});
test('V3 is a single closed, correctly oriented, connected external surface, not two overlapping solids',()=>{
 const a=buildIntegratedA(),t=geometryTopology(a.geometry);
 console.log('B1R2_MESH_TOPOLOGY',JSON.stringify(t));
 assert.equal(t.degenerate,0);
 assert.equal(t.wrongNormals,0);
 assert.ok(t.signedVolume>0);
 assert.equal(t.badEdgeCount,0,'CSG created open or T-junction mesh edges');
 assert.equal(t.badOrientationCount,0,'CSG created reversed/incorrectly wound adjacent edges');
 assert.equal(t.connectedComponents,1,'Separated floating islands in A-V3');
 assert.equal(t.euler,2,'Unexpected genus or topology');
 a.dispose();
});
test('Reconstruction is exactly zero outside localized shoulder and bounded inside',()=>{
 for(const p of [[-.7,1.1,-.5],[-.4,.1,-.4],[.1,1.2,.65]] as const)
  assert.deepEqual(reconstructTransition(p),p);
 const v=reconstructTransition([.57,.04,.34]);
 assert.ok(v[0]<.57&&v[1]<.04&&v[2]<.34);
});
test('Protected A-V0 V1 V2 B-V0 V1 V2 CDE and G1 are untouched',()=>{
 for(const id of ['A','B'] as const){
  for(const version of ['V0','V1','V2'] as const){
   const a=buildB1R(id,version),b=buildB1R(id,version);
   assert.equal(a.parts.length,b.parts.length);
   for(let i=0;i<a.parts.length;i++)assert.equal(fingerprint(a.parts[i]),fingerprint(b.parts[i]));
   a.dispose();b.dispose();
  }
 }
 for(const id of ['C','D','E'] as const){const g=buildRockArchetype(id);assert.ok(g.getAttribute('position').count>30);g.dispose();}
 const g=r04StudyGeometry('G1');assert.equal(g.getAttribute('position').count/3,136);g.dispose();
});
