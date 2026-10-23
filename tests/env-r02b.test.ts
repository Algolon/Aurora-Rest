import test from 'node:test';
import assert from 'node:assert/strict';
import {composeChunk,thinningAt,PLAN,WoodlandCompositionSink} from '../src/env-r02b/composition.ts';
import type {ChunkPopulation,Placement} from '../src/pop-01/contracts.ts';
function sample(id:string,family:Placement['family'],x:number,z:number):Placement {
 return {id,family,variant:0,x,y:100,z,rotation:0,scale:1,normal:[0,1,0],alignment:'upright',burial:0,tint:1,renderClass:'tree-lod',chunk:'0,0',
  metadata:{community:'birch-woodland',patch:.7,region:'forest',slope:.1,source:'fixture'}};
}
function fixture():ChunkPopulation{
 const instances:Placement[]=[];let id=0;
 for(let x=-90;x<=120;x+=4)for(let z=-90;z<=90;z+=4)instances.push(sample('tree'+id++,'birch',x,z));
 instances.push(sample('grass-test','grass',35,-12),sample('rock-test','rock',35,-12),sample('far-tree','pine',900,900));
 return {key:'0,0',instances,candidates:instances.length,rejected:{},generationMs:0,serializedBytes:0};
}
test('spatial mask is localized, bent and keeps both review-camera foregrounds',()=>{
 assert.equal(thinningAt(500,500,0,0),0);
 assert.equal(thinningAt(-25,25,0,0),0);
 assert.equal(thinningAt(85,-40,0,0),0);
 assert(thinningAt(...PLAN.center,0,0)>.5);
 assert(thinningAt(35,70,0,0)===0);
});
test('candidate never mutates source placements, IDs, transforms or non-tree families',()=>{
 const p=fixture(),serialized=JSON.stringify(p),off=composeChunk(p,false,0,0),on=composeChunk(p,true,0,0);
 assert.equal(off.chunk,p);assert(on.removed.length>0);assert(on.removed.length<p.instances.length);
 assert.equal(JSON.stringify(p),serialized);
 assert.deepEqual(on.chunk.instances.filter(p=>p.family==='grass'||p.family==='rock'),p.instances.filter(p=>p.family==='grass'||p.family==='rock'));
 assert(on.chunk.instances.every(item=>item===p.instances.find(q=>q.id===item.id)));
 assert(on.chunk.instances.some(p=>p.id==='far-tree'));
 assert(on.removed.every(id=>p.instances.some(p=>p.id===id&&p.family==='birch')));
 assert.deepEqual(composeChunk(p,true,0,0).removed,on.removed);
});
test('render sink permits A/B/A restoration and never edits stream-owned chunks',()=>{
 const p=fixture(),renderer=new Map<string,ChunkPopulation>(),backend={attach:(q:ChunkPopulation)=>{if(renderer.has(q.key))throw Error('duplicate');renderer.set(q.key,q);},detach:(key:string)=>{renderer.delete(key);}};
 const sink=new WoodlandCompositionSink(backend,0,0);sink.attach(p);
 const baseline=JSON.stringify(renderer.get(p.key)!.instances);
 sink.setEnabled(true);assert(sink.snapshot().hiddenCount>0);
 assert.notEqual(JSON.stringify(renderer.get(p.key)!.instances),baseline);assert.equal(sink.snapshot().originalCount,p.instances.length);
 sink.setEnabled(false);assert.equal(JSON.stringify(renderer.get(p.key)!.instances),baseline);
 assert.equal(renderer.get(p.key),p);sink.detach(p.key);assert.equal(renderer.size,0);
});
