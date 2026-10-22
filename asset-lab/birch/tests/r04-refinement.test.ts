import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildHeroR04} from '../src/rocks/experimental/rockSculptR04Core.ts';
import {buildRefinedR04} from '../src/rocks/experimental/r04RefinementCore.ts';
import {r04StudyGeometry} from '../src/rocks/experimental/r04MaterialStudies.ts';
const sha=(a:number[])=>createHash('sha256').update(Buffer.from(new Float64Array(a).buffer)).digest('hex');
const q=(v:number)=>Math.round(v*1e5);
test('G0 preserves verbatim R04 geometry, no production design mutated',()=>{
 const original=buildHeroR04({seed:37,detail:'refined'}),g0=buildRefinedR04('G0');
 assert.equal(g0.triangles,128);assert.equal(g0.sourceTriangles,128);
 assert.equal(sha(g0.positions),sha(original.positions));
 assert.equal(sha(g0.normals),sha(original.normals));assert.equal(g0.appliedCuts.length,0);
});
test('G1/G2 are deterministic, local, 2 versus 4 authored fractures',()=>{
 for(const [study,nCuts,triangles] of [['G1',2,136],['G2',4,144]] as const){
  const a=buildRefinedR04(study),b=buildRefinedR04(study);
  assert.deepEqual(a,b);
  assert.equal(a.triangles,triangles);
  assert.equal(a.appliedCuts.length,nCuts);
  assert.ok(a.maximumVertexShiftM<=.051);
  assert.deepEqual(a.pieces.map(p=>p.name),['main','frontSlab']);
  for(const x of [a.positions,a.normals,a.uv,a.colors])assert.ok(x.every(Number.isFinite));
  assert.equal(a.positions.length,a.triangles*9);
  assert.equal(a.uv.length,a.triangles*6);
  assert.ok(a.bounds.max[1]-a.bounds.min[1]>2.0);
  const g=r04StudyGeometry(study);
  assert.equal(g.getAttribute('position').count/3,triangles);
  assert.equal(g.userData.r04Refinement.artApproved,false);
  assert.equal(g.userData.r04Refinement.booleanUnion,false);
  assert.ok(g.boundingSphere&&g.boundingSphere.radius>0);g.dispose();
 }
});
test('R04 refinements have finite, outward-face winding and closed edges for each individual solid',()=>{
 for(const study of ['G1','G2'] as const){
  const m=buildRefinedR04(study),pos=m.positions,n=m.normals;
  let offset=0;
  for(const piece of m.pieces){
   const edges=new Map<string,number>();
   for(let t=0;t<piece.triangles;t++){
    const j=(offset+t)*9;
    const vertices=[0,3,6].map(k=>[pos[j+k],pos[j+k+1],pos[j+k+2]]);
    const [a,b,c]=vertices;
    const u=b.map((v,k)=>v-a[k]),v=c.map((x,k)=>x-a[k]);
    const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    assert.ok(cross.reduce((acc,x,k)=>acc+x*n[j+k],0)>1e-9,'degenerate or incorrectly wound triangle');
    for(let e=0;e<3;e++){
     const key=[vertices[e].map(q).join(','),vertices[(e+1)%3].map(q).join(',')].sort().join('|');
     edges.set(key,(edges.get(key)||0)+1);
    }
   }
   assert.ok([...edges.values()].every(count=>count===2),
    study+' '+piece.name+' open or overlapping local edge');
   offset+=piece.triangles;
  }
  assert.equal(offset,m.triangles);
 }
});
