import test from 'node:test';
import assert from 'node:assert/strict';
import {GATEWAY} from '../src/env-r02c/design.ts';
import {authoredPositions,clearance,composeChunk} from '../src/env-r02c/composition.ts';
import type {ChunkPopulation,Placement} from '../src/pop-01/contracts.ts';
const fixture=(id:string,family:Placement['family'],x:number,z:number):Placement=>({id,family,variant:0,x,y:101,z,normal:[0,1,0],rotation:0,scale:1,alignment:'upright',burial:0,tint:1,renderClass:'tree-lod',chunk:'-6,-5',metadata:{community:'birch-woodland',patch:1,region:'forest',slope:0,source:'test'}});
test('genuine corridor anchor is in authored experience ROI and NOT forest anchor',()=>{
 assert.equal(GATEWAY.route[2][0],-350);assert.equal(GATEWAY.route[2][1],-290);
 assert(GATEWAY.groves.length>=5);assert(Math.hypot(-350+740,-290+50)>450);
 assert(clearance(-350,-290));assert(!clearance(-740,-50));assert(!clearance(-200,250));
});
test('authored grove/juvenile/grass data has unique deterministic local IDs and route remains open',()=>{
 const a=authoredPositions(),b=authoredPositions();
 assert.deepEqual(a,b);assert(a.length>130);assert(a.filter(p=>p.family==='grass').length>70);
 assert(a.filter(p=>p.family==='birch'||p.family==='pine').length>35);
 assert.equal(new Set(a.map(p=>p.id)).size,a.length);
 assert(a.every(p=>p.x>=GATEWAY.bounds.west&&p.x<=GATEWAY.bounds.east&&p.z>=GATEWAY.bounds.south&&p.z<=GATEWAY.bounds.north));
 assert(a.every(p=>!clearance(p.x,p.z)),'authored trunk/grass collides with visual route or glade');
});
test('canonical chunk immutable, candidate change only renders authored copies and returns exact source in OFF mode',()=>{
 const tree=fixture('original-tree','birch',-350,-290),grass=fixture('original-grass','grass',-350,-290),other=fixture('original-tree-outside','pine',-430,-290);
 const chunk:ChunkPopulation={key:'-6,-5',instances:[tree,grass,other],candidates:3,rejected:{},generationMs:0,serializedBytes:10};
 const copy=JSON.stringify(chunk),planned=[fixture('env-r02c:copy','birch',-353,-304)];
 const off=composeChunk(chunk,planned,false),on=composeChunk(chunk,planned,true);
 assert.equal(off.chunk,chunk);assert.deepEqual(on.hidden,['original-tree']);
 assert.deepEqual(on.added,['env-r02c:copy']);assert(on.chunk.instances.includes(grass));assert(on.chunk.instances.includes(other));assert(on.chunk.instances.includes(planned[0]));
 assert.equal(JSON.stringify(chunk),copy);assert.equal(composeChunk(chunk,planned,false).chunk,chunk);
});
