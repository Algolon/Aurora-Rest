import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.argv[2]??'docs/env-nature-r02/evidence/walking';
const base=process.argv[3]??'http://127.0.0.1:4362/env-nature-r02.html';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const report={evidence:'Continuous canonical path traversal through original in-engine stepWalk, no teleports between stations',eyeHeight:1.75,steps:[],frames:[],reentry:[],errors:[],limitations:'Deterministic approximately 1 m engine steps, not real-time player/input or physical-device performance validation.'};
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const save=()=>writeFile(out+'/walk.json',JSON.stringify(report,null,2)+'\n');
try{
 const page=await browser.newPage({viewport:{width:1100,height:700}});
 page.on('pageerror',e=>report.errors.push(e.message));
 const settle=async()=>{await page.waitForFunction(()=>window.__pop02Failure||window.__pop02?.snapshot().ready,null,{timeout:180000});assert.equal(await page.evaluate(()=>window.__pop02Failure),undefined);await page.evaluate(()=>window.__pop02.pause(true));};
 await page.goto(base);await settle();
 const path=await page.evaluate(()=>window.__pop02.path());
 await page.evaluate(()=>{window.__pop02.setView('shelter');window.__pop02.pause(false)});await settle();
 let walked=0,index=0;
 for(let i=0;i<path.length;i++){
  if(i){const prev=path[i-1],next=path[i],dx=next[0]-prev[0],dz=next[1]-prev[1],distance=Math.hypot(dx,dz),yaw=Math.atan2(-dx,-dz);walked+=distance;
   await page.evaluate(({yaw,distance})=>{window.__pop02.setHeading(yaw,.025);window.__pop02.stepWalk(distance);window.__pop02.pause(false)},{yaw,distance});await settle();
  }
  const s=await page.evaluate(()=>window.__pop02.snapshot());
  assert.ok(Math.hypot(s.camera[0]-path[i][0],s.camera[2]-path[i][1])<1e-5);assert.ok(Math.abs(s.camera[1]-s.terrainY-1.75)<1e-7);assert.equal(s.error,null);
  report.steps.push({i,distance:walked,camera:s.camera,terrainY:s.terrainY,source:s.descriptorCount,overlay:s.overlayCount});
  if(i%12===0||i===path.length-1){
   const file='walk-'+String(index++).padStart(2,'0')+'.png';const url=await page.evaluate(()=>window.__pop02.capture());await writeFile(out+'/'+file,Buffer.from(url.split(',')[1],'base64'));report.frames.push({file,step:i,distance:walked});console.log('walk',i,walked.toFixed(1));await save();
  }
 }
 report.distanceM=walked;
 // Original worker and the overlay must reproduce byte-identical descriptors on re-entry.
 await page.evaluate(()=>{window.__pop02.setView('shelter');window.__pop02.pause(false)});await settle();
 const before=await page.evaluate(()=>({source:window.__pop02.placements(),combined:window.__pop02.combined(),snapshot:window.__pop02.snapshot()}));
 for(let i=0;i<3;i++){
  await page.evaluate(()=>{window.__pop02.regenerate();window.__pop02.pause(false)});await settle();
  const after=await page.evaluate(()=>({source:window.__pop02.placements(),combined:window.__pop02.combined(),snapshot:window.__pop02.snapshot()}));
  assert.equal(hash(before.source),hash(after.source));assert.equal(hash(before.combined),hash(after.combined));
  assert.deepEqual(before.snapshot.renderer.memory,after.snapshot.renderer.memory);assert.equal(before.snapshot.materialCount,after.snapshot.materialCount);
  report.reentry.push({cycle:i+1,sourceHash:hash(after.source),combinedHash:hash(after.combined),memory:after.snapshot.renderer.memory,materials:after.snapshot.materialCount});
 }
 report.disposal=await page.evaluate(()=>{const api=window.__pop02;api.dispose();api.dispose();return api.cleanupSnapshot()});
 assert.equal(report.disposal.chunks,0);assert.equal(report.disposal.pages,0);assert.equal(report.disposal.pending,0);assert.equal(report.disposal.dead,true);assert.equal(report.disposal.listenersAborted,true);assert.equal(report.disposal.animationCancelled,true);
 assert.equal(report.errors.length,0);report.status='PASS: path traversal, three regenerations and idempotent cleanup';
}catch(e){report.status='FAIL';report.failure=String(e);process.exitCode=1;console.error(e)}
finally{await save();await browser.close();}
