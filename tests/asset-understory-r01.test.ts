import test from 'node:test';import assert from 'node:assert/strict';
import {SPECIMENS,makeUnderstoryGeometry,measure} from '../src/asset-understory-r01/specimens.ts';
const kinds=['bilberry','lingonberry','feathermoss'] as const;
test('three botanically differentiated species and exactly three deterministic variants each',()=>{
 assert.equal(Object.keys(SPECIMENS).length,3);
 for(const kind of kinds)for(const variant of [0,1,2] as const){
  const a=makeUnderstoryGeometry(kind,variant),b=makeUnderstoryGeometry(kind,variant);
  assert.deepEqual(Array.from(a.getAttribute('position').array),Array.from(b.getAttribute('position').array));
  assert(a.getAttribute('color').count===a.getAttribute('position').count);
  assert(a.getAttribute('position').count>1000);
  assert(a.getAttribute('position').count/3<13000);
  for(const item of Array.from(a.getAttribute('position').array as Float32Array))assert(Number.isFinite(item));
  a.dispose();b.dispose();
 }
});
test('models are intentionally low and species have distinct canopy silhouette scales',()=>{
 const b=measure('bilberry',0),l=measure('lingonberry',0),m=measure('feathermoss',0);
 assert(b.heightM>.22&&b.heightM<.45,'bilberry should be a low airy shrub');
 assert(l.heightM>.05&&l.heightM<.19,'lingonberry should form evergreen mats');
 assert(m.heightM>.02&&m.heightM<.12,'moss feathery carpet should be low');
 assert(b.heightM>l.heightM&&l.heightM>m.heightM);
 assert(l.diameterM>.24&&m.diameterM>.4);
});
test('invalid variants are rejected',()=>{assert.throws(()=>makeUnderstoryGeometry('bilberry',4 as any),RangeError)});
