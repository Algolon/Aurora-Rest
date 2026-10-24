import test from 'node:test';import assert from 'node:assert/strict';
import {COHESION,segmentOnHero,coverBank} from '../src/env-r02d/cohesion.ts';
const points=[];for(let i=0;i<=180;i++){let x=-430+i*.8,z=-335+i*.35;points.push([x,z]);}
test('canonical route selection is deterministic, bounded and pure',()=>{
 const centre=points[100],before=JSON.stringify(points);const p=segmentOnHero(points,centre,86),q=segmentOnHero(points,centre,86);
 assert.deepEqual(p,q);assert(p.lengthM>=70&&p.lengthM<=94);assert.equal(JSON.stringify(points),before);
 assert(p.points.includes(centre));assert(p.closestMeters<.001);
});
test('never select an invented parallel route',()=>{assert.throws(()=>segmentOnHero(points,[1000,1000],86),/not on canonical/);});
test('authored understory banks: stable positions, no water/slope violation',()=>{
 const geo={sample(x,z){return{dry:true,slope:.12,waterDistance:20}},elevation(){return 100}};
 const route=segmentOnHero(points,points[100],86);
 const a=coverBank(route.points,geo),b=coverBank(route.points,geo);
 assert.deepEqual(a,b);assert(a.length>70&&a.length<800);assert.equal(new Set(a.map(p=>p.id)).size,a.length);
 assert(a.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.z)&&x.height<.60));
 const underwater={sample(){return{dry:false,slope:0,waterDistance:0}}};
 assert.deepEqual(coverBank(route.points,underwater),[]);
});
test('80m milestone has no automatic world-scale expansion',()=>{assert.equal(COHESION.lengthM,86);assert(COHESION.coverReachM<=12);});
