import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildShelteredFaultR01} from '../rocks/r01/sculptCore.ts';
test('G01R uses deliberate authored planar sculpting rather than G01 spoke tessellation',()=>{
 const m=buildShelteredFaultR01();
 assert.equal(m.topology.construction,'authored-cut-panels');
 assert.ok(m.topology.panelCount>=16,'at least 16 large independent sculpting panels');
 assert.equal(m.topology.fractureCount,1,'exactly one contained geological joint');
 assert.equal(m.topology.structuralMasses,2);
 assert.ok(m.triangles>=60&&m.triangles<220);
 const unique=new Set<string>();
 for(let i=0;i<m.normals.length;i+=3)
  unique.add(m.normals.slice(i,i+3).map(x=>Math.round(x*1000)).join(','));
 assert.ok(unique.size>=13,'independent large-plane normal directions');
 const z=m.normals.filter((_,i)=>i%3===2);
 assert.ok(z.some(v=>v>.38),'meaningful front stone planes');
 assert.ok(z.some(v=>v<-.38),'meaningful rear stone planes');
});
