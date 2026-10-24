import test from 'node:test';import assert from 'node:assert/strict';
import {authoredLayout,spatialAudit,STUDY,treadDistance,colonyField,groundHeight} from '../src/understory-r02/plan.ts';
test('small site-specific quadrat, deterministic 11 colonies and a preserved winding gap',()=>{
 const a=authoredLayout(),b=authoredLayout();assert.deepEqual(a,b);const audit=spatialAudit();
 assert.equal(audit.colonies,11);assert(a.length>=38&&a.length<=85);
 assert.equal(new Set(a.map(p=>p.id)).size,a.length);
 assert(a.every(p=>Math.abs(p.x)<=STUDY.widthM/2&&Math.abs(p.z)<=STUDY.depthM/2));
 assert(a.every(p=>treadDistance(p.x,p.z)>=STUDY.openTreadWidthM/2+.22));
});
test('continuous low moss field and botanic patch zones, not a global generator',()=>{
 assert(colonyField('feathermoss',-2.56,.08)>.4);
 assert(colonyField('lingonberry',2.45,1.18)>.4);
 assert.equal(colonyField('bilberry',0,0),0);
 assert.equal(colonyField('feathermoss',90,90),0);
 assert(Number.isFinite(groundHeight(-2.5,.5)));
 assert.equal(spatialAudit().bounds[1],STUDY.widthM/2);
});
