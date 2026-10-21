import test from 'node:test';
import assert from 'node:assert/strict';
import {generateNaturalGrassPlacement,meadowDensity,naturalSpeciesWeights} from '../src/grass/naturalGroundCover.ts';
import {GRASS_FADE_PRESETS,grassScaleFade} from '../src/grass/rendering/grassFade.ts';
import {WALK_PHASES,sampleMeadowWalk} from '../src/grass/meadowWalk.ts';

test('V0 D2 fade thresholds and quantization remain exact',()=>{
 const a=GRASS_FADE_PRESETS.source;
 assert.deepEqual(a,{visibilityDistance:13,fadeDistance:4,steps:12});
 assert.equal(grassScaleFade(11,a),.5);
 assert.equal(grassScaleFade(12.8,a),1/12);
 assert.equal(grassScaleFade(13,a),0);
});
test('refined fade stays monotone in distance, bounded and position-staggered',()=>{
 const c=GRASS_FADE_PRESETS.refined;
 assert.equal(c.visibilityDistance,19);
 assert.equal(c.steps,48);
 for(const offset of [-1,0,1]){
  let prev=1;
  for(let i=0;i<=500;i++){
   const val=grassScaleFade(i*.05,c,offset);
   assert.ok(val>=0&&val<=1);
   assert.ok(val<=prev+1e-12,'fade unexpectedly increased');
   prev=val;
  }
 }
 assert.notEqual(grassScaleFade(16.9,c,-1),grassScaleFade(16.9,c,1),'individual instances must avoid synchronous threshold rings');
 assert.throws(()=>grassScaleFade(1,c,2));
});
test('V1 natural meadow layout is deterministic, bounded, clumped, mixed and valid',()=>{
 const opts={seed:120626,count:2000};
 const a=generateNaturalGrassPlacement(opts),b=generateNaturalGrassPlacement(opts);
 assert.deepEqual(a,b);
 assert.notDeepEqual(a,generateNaturalGrassPlacement({...opts,seed:120627}));
 const counts=[0,0,0,0],quadrants=new Set<string>(),positions=new Set<string>();
 for(const p of a){
  counts[p.variant]++;
  assert.ok(p.position.every(Number.isFinite));
  assert.ok(Math.abs(p.position[0])<=16.4&&Math.abs(p.position[2])<=10.3);
  assert.ok(p.scale>.7&&p.scale<1.4);
  assert.ok(p.tint>=.87&&p.tint<=1.07);
  assert.ok(p.rotationY>=0&&p.rotationY<=Math.PI*2);
  const k=p.position.map(n=>n.toFixed(7)).join('/');
  assert.ok(!positions.has(k));positions.add(k);
  quadrants.add((p.position[0]>0?'+':'-')+(p.position[2]>0?'+':'-'));
 }
 assert.ok(quadrants.size===4,'both sides of world have grass');
 assert.ok(counts.every(x=>x>10),'all four source variants present');
 assert.ok(counts[2]<counts[0],'720-triangle seed heads stay selective');
 const low=meadowDensity(50,50,120626),higher=meadowDensity(-9,-1,120626);
 assert.equal(low,0);assert.ok(higher>0);
 assert.equal(naturalSpeciesWeights(4,1,120626).length,4);
});
test('natural placement supports both small and 5000-tuft benchmark populations',()=>{
 assert.equal(generateNaturalGrassPlacement({seed:3,count:0}).length,0);
 for(const n of [100,500,5000])assert.equal(generateNaturalGrassPlacement({seed:7,count:n}).length,n);
 assert.throws(()=>generateNaturalGrassPlacement({count:-1}));
 assert.throws(()=>generateNaturalGrassPlacement({count:5,overlap:.1}));
});
test('seven actual camera-path phases are finite, ordered and continuous',()=>{
 assert.deepEqual(WALK_PHASES,['approach','enter','dense','turn','reverse','lateral','stop-start']);
 for(let frame=0;frame<84;frame++){
  const s=sampleMeadowWalk(frame,12);
  assert.ok(s.position.concat(s.target).every(Number.isFinite));
  assert.equal(s.position[1],1.68);
  if(frame>0){
   const p=sampleMeadowWalk(frame-1,12);
   const dx=s.position[0]-p.position[0],dz=s.position[2]-p.position[2];
   assert.ok(Math.hypot(dx,dz)<1.5,'camera teleports at stage boundary');
  }
 }
});
