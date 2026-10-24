import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sampleClimate,windAt,weatherIsValid,CYCLE_SECONDS} from '../src/env-feel-r01/weather.ts';
test('weather modes have physically coherent directional wind and bounded responses',()=>{
 for(const mode of ['cycle','still','breeze','squall','clearing'] as const){
  for(const time of [0,2.5,34,61,110,148,300]){
   const state=sampleClimate(time,mode);
   assert.ok(weatherIsValid(state),JSON.stringify(state));
   assert.ok(Number.isFinite(windAt(-20,5,time,state)));
   assert.ok(windAt(-20,5,time,state)>=0);
  }
 }
});
test('storm really affects precipitation, fog, light, wetness, wind simultaneously',()=>{
 const still=sampleClimate(1,'still'),storm=sampleClimate(1,'squall');
 assert.ok(storm.rain>still.rain);
 assert.ok(storm.windSpeed>still.windSpeed);
 assert.ok(storm.wetness>still.wetness);
 assert.ok(storm.fog>still.fog);
 assert.ok(storm.sun<still.sun);
 assert.equal(still.rain,0);
});
test('cycle sequence transitions continuously and reproducibly',()=>{
 const delta=0.01;
 for(const t of [7,30,60,103,130,160]){
  const a=sampleClimate(t-delta),b=sampleClimate(t+delta);
  assert.ok(Math.abs(a.rain-b.rain)<.05,`rain discontinuity at ${t}`);
  assert.ok(Math.abs(a.windSpeed-b.windSpeed)<.05,`wind discontinuity at ${t}`);
 }
 assert.deepEqual(sampleClimate(73.45),sampleClimate(73.45));
 assert.ok(sampleClimate(73).rain>.95);
 assert.equal(CYCLE_SECONDS,160);
});
test('local gust field varies spatially, remains deterministic',()=>{
 const state=sampleClimate(68),a=windAt(0,0,68,state);
 assert.equal(a,windAt(0,0,68,state));
 assert.notEqual(a,windAt(47,7,68,state));
});
test('invalid time input cannot poison shader-driving state',()=>{
 assert.ok(weatherIsValid(sampleClimate(Number.NaN)));
 assert.ok(weatherIsValid(sampleClimate(Number.POSITIVE_INFINITY)));
 assert.ok(weatherIsValid(sampleClimate(-100)));
});