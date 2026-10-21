import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {grassScaleFade,GRASS_FADE_PRESETS} from '../src/grass/rendering/grassFade.ts';
import {generateGrassPlacement} from '../src/grass/groundCoverPlacement.ts';
import {makeGrassGeometry} from '../src/grass/geometry.ts';
test('exact source grass fade quantizes 13 m with a 4 m, 12-step interval',()=>{
 const c=GRASS_FADE_PRESETS.source;
 assert.equal(grassScaleFade(0,c),1);
 assert.equal(grassScaleFade(9,c),1);
 assert.equal(grassScaleFade(11,c),.5);
 assert.equal(grassScaleFade(13,c),0);
 assert.equal(grassScaleFade(30,c),0);
 assert.equal(grassScaleFade(12.8,c),1/12);
 const continuous={...c,steps:0};
 assert.ok(grassScaleFade(12.4,continuous)>0);
 assert.ok(grassScaleFade(12.4,continuous)<1);
 assert.throws(()=>grassScaleFade(1,{...c,fadeDistance:0}));
});
test('ground-cover placements are seeded, diverse, finite and non-colliding',()=>{
 const a=generateGrassPlacement({seed:3102,count:500,minSpacing:.115});
 const b=generateGrassPlacement({seed:3102,count:500,minSpacing:.115});
 assert.deepEqual(a,b);
 assert.notDeepEqual(a,generateGrassPlacement({seed:3103,count:500}));
 const counts=[0,0,0,0];
 const set=new Set<string>();
 for(const p of a){
  counts[p.variant]++;
  assert.ok(p.position.every(Number.isFinite));
  assert.ok(p.scale>.6&&p.scale<1.4);
  assert.ok(p.rotationY>=0&&p.rotationY<=Math.PI*2);
  const hash=p.position[0].toFixed(6)+':'+p.position[2].toFixed(6);
  assert.ok(!set.has(hash));set.add(hash);
 }
 assert.ok(counts.every(n=>n>20),'all four recognizable communities');
 for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){
  const dx=a[i].position[0]-a[j].position[0],dz=a[i].position[2]-a[j].position[2];
  assert.ok(dx*dx+dz*dz>=.115*.115-1e-9,'minimum distance');
 }
});
test('existing source production triangle budgets remain intact',()=>{
 for(const [variant,expected] of [[0,216],[1,264],[2,720],[3,168]] as const){
  const g=makeGrassGeometry(variant);
  assert.equal(g.getAttribute('position').count/3,expected);
  assert.ok(g.getAttribute('normal')&&g.getAttribute('uv')&&g.getAttribute('color'));
  g.dispose();
 }
});
