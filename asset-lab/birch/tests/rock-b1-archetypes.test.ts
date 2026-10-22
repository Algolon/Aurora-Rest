import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {ROCK_ARCHETYPES,ROCK_DEFINITIONS,buildRockArchetype,rockShapeMetrics} from '../src/rocks/experimental/b1/rockArchetypes.ts';
import {r04StudyGeometry} from '../src/rocks/experimental/r04MaterialStudies.ts';
const hash=(g:THREE.BufferGeometry)=>{
 const h=createHash('sha256');
 for(const field of ['position','normal','uv','color']){
  const attr=g.getAttribute(field);
  assert.ok(attr,field+' must exist');
  h.update(Buffer.from(attr.array.buffer,attr.array.byteOffset,attr.array.byteLength));
  for(const x of attr.array)assert.ok(Number.isFinite(x),'Nonfinite '+field);
 }
 return h.digest('hex');
};
const key=(v:number[])=>v.map(x=>Math.round(x*100000)).join(',');
test('Five authored archetypes have distinct primary silhouettes and structural descriptions',()=>{
 const hashes=new Set(),ratios=new Set(),shapes=[];
 for(const id of ROCK_ARCHETYPES){
  const d=ROCK_DEFINITIONS[id];
  assert.ok(d.name&&d.geology&&d.landscape);
  const m=rockShapeMetrics(id);
  assert.ok(m.width>.8&&m.height>.9&&m.depth>.6);
  ratios.add(m.widthHeight.toFixed(2));shapes.push(m);
  const g=buildRockArchetype(id,'primary');
  hashes.add(hash(g));g.dispose();
 }
 assert.equal(hashes.size,5);
 assert.ok(ratios.size>=4,'Silhouettes differ beyond generic sizes');
 assert.ok(shapes.find(x=>x.id==='B')!.widthHeight>2.2,'B should be wide, low');
 assert.ok(shapes.find(x=>x.id==='E')!.height>3.5,'E should be tall');
 assert.ok(shapes.find(x=>x.id==='A')!.width<2,'A should be compact');
});
test('Rock geometry is deterministic, bounds valid, normal orientation finite, and lifecycle safe',()=>{
 for(const id of ROCK_ARCHETYPES){
  for(const detail of ['primary','refined'] as const){
   const a=buildRockArchetype(id,detail),b=buildRockArchetype(id,detail);
   assert.equal(hash(a),hash(b));
   const p=a.getAttribute('position'),n=a.getAttribute('normal'),c=a.getAttribute('color');
   assert.ok(a.boundingBox&&a.boundingSphere?.radius);
   assert.equal(p.count,n.count);assert.equal(p.count,c.count);
   assert.equal(a.getAttribute('uv').count,p.count);
   assert.ok(p.count<850,'Keep B1 prototypes low-poly');
   assert.equal(a.userData.b1.artApproved,false);
   const incidence=new Map<string,number>();
   let volume=0;
   for(let i=0;i<p.count;i+=3){
    const v=[0,1,2].map(j=>[p.getX(i+j),p.getY(i+j),p.getZ(i+j)]);
    const [A,B,C]=v;
    const ux=B[0]-A[0],uy=B[1]-A[1],uz=B[2]-A[2],
          vx=C[0]-A[0],vy=C[1]-A[1],vz=C[2]-A[2];
    const cr=[uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx];
    assert.ok(Math.hypot(...cr)>1e-8,'Zero-area triangle in '+id);
    const dot=cr[0]*n.getX(i)+cr[1]*n.getY(i)+cr[2]*n.getZ(i);
    assert.ok(dot>1e-8,'Wrong winding '+id);
    volume+=(A[0]*cr[0]+A[1]*cr[1]+A[2]*cr[2])/6;
    for(let j=0;j<3;j++){
     const k=[key(v[j]),key(v[(j+1)%3])].sort().join('|');
     incidence.set(k,(incidence.get(k)||0)+1);
    }
   }
   assert.ok(volume>0,'Inverted total winding '+id+' volume '+volume);
   assert.ok([...incidence.values()].every(n=>n===2),'Nonmanifold/open edges '+id);
   a.dispose();b.dispose();
   // Confirm source can be regenerated after resource disposal.
   const recreated=buildRockArchetype(id,detail);assert.equal(hash(recreated),hash(a));recreated.dispose();
  }
 }
});
test('No approved R04/G1 geometry is replaced, the original G1 remains 136 triangles',()=>{
 const g=r04StudyGeometry('G1');
 assert.equal(g.getAttribute('position').count/3,136);
 assert.equal(g.userData.r04Refinement.study,'G1');
 assert.equal(g.userData.r04Refinement.artApproved,false);
 g.dispose();
});
