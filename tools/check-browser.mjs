import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {WORLD} from '../src/world/config.ts';

const url=process.env.WORLD_URL??'http://127.0.0.1:4192';
const production=process.argv.includes('--production');
const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,headless:true});
const results=[],errors=[];
const output='docs/evidence/world-01b/after';await mkdir(output,{recursive:true});
async function open(options={}){
 const page=await browser.newPage({viewport:{width:1440,height:900},...options});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 if(!production)await page.route(/\/src\/main\.ts(?:\?|$)/,async route=>{
  const response=await route.fetch();await route.fulfill({response,body:await response.text()+`
window.__qa={snapshot:()=>({mode,position:player.toArray(),camera:camera.position.toArray(),yaw,pitch,
 ground:Math.max(terrain.heightAt(player.x,player.z),bridgeHeightAt(player.x,player.z)),fog:scene.fog.density,
 calls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),
 flyOverWater:()=>{setMode('fly');player.set(WORLD.water.tarn.x,600,WORLD.water.tarn.z);}};`});
 });
 await page.goto(url);await page.waitForFunction(()=>document.querySelector('#readout')?.textContent.includes('FPS'));
 return page;
}
async function check(name,run){await run();results.push({name,passed:true});console.log(`PASS ${name}`);}
try{
 const page=await open();
 await check('WebGL boots and records rendered geometry',async()=>{
  assert.match(await page.locator('#readout').innerText(),/triangles/);
  if(!production){const s=await page.evaluate(()=>window.__qa.snapshot());assert.ok(s.calls>0&&s.triangles>1000);}
 });
 await check('all nine landmark teleports leave overview at ground height',async()=>{
  for(let i=0;i<WORLD.viewpoints.length;i++){
   await page.locator('#map').click();await page.locator('#jump').selectOption(String(i));
   await page.waitForFunction(name=>document.querySelector('#readout')?.textContent.startsWith(name),WORLD.viewpoints[i].name);
   if(!production){const s=await page.evaluate(()=>window.__qa.snapshot());assert.equal(s.mode,'walk');assert.ok(Math.abs(s.position[1]-s.ground-1.75)<.001);assert.equal(s.camera[0],-s.position[0]);assert.equal(s.fog,.00011);}
  }
 });
 if(!production){
  await page.locator('#jump').selectOption('2');await page.waitForTimeout(200);
  await check('overview restores position and fly mode without relocating to island centre',async()=>{
   await page.locator('#mode').click();const start=await page.evaluate(()=>window.__qa.snapshot());
   await page.locator('#map').click();await page.locator('#map').click();
   const end=await page.evaluate(()=>window.__qa.snapshot());assert.equal(end.mode,'fly');assert.deepEqual(end.position,start.position);assert.equal(end.yaw,start.yaw);
   await page.locator('#map').click();await page.locator('#mode').click();
   const walk=await page.evaluate(()=>window.__qa.snapshot());assert.equal(walk.mode,'walk');assert.equal(walk.position[0],start.position[0]);assert.equal(walk.position[2],start.position[2]);
  });
  await check('WASD walks, stays on the mesh, and blur clears held input',async()=>{
   await page.evaluate(()=>document.activeElement?.blur());
   const start=await page.evaluate(()=>window.__qa.snapshot());await page.keyboard.down('w');await page.waitForTimeout(1000);
   const moved=await page.evaluate(()=>window.__qa.snapshot());assert.ok(Math.hypot(moved.position[0]-start.position[0],moved.position[2]-start.position[2])>2);
   assert.ok(Math.abs(moved.position[1]-moved.ground-1.75)<.001);
   await page.evaluate(()=>window.dispatchEvent(new Event('blur')));const stopped=await page.evaluate(()=>window.__qa.snapshot());await page.waitForTimeout(300);
   assert.deepEqual((await page.evaluate(()=>window.__qa.snapshot())).position,stopped.position);await page.keyboard.up('w');
  });
  await check('switching from flight above a lake returns to a dry landmark',async()=>{
   await page.evaluate(()=>window.__qa.flyOverWater());await page.locator('#mode').click();await page.waitForTimeout(200);
   const s=await page.evaluate(()=>window.__qa.snapshot());assert.equal(s.mode,'walk');assert.equal(s.position[0],WORLD.viewpoints[2].x);
  });
  const mobile=await open({viewport:{width:412,height:915},deviceScaleFactor:1.75,isMobile:true,hasTouch:true});
  await check('mobile-sized touch movement, touch look and controls operate',async()=>{
   await mobile.locator('#jump').selectOption('2');await mobile.waitForTimeout(300);
   const cdp=await mobile.context().newCDPSession(mobile),start=await mobile.evaluate(()=>window.__qa.snapshot());
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:90,y:720}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:90,y:650}]});await mobile.waitForTimeout(600);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   const moved=await mobile.evaluate(()=>window.__qa.snapshot());assert.ok(Math.hypot(moved.position[0]-start.position[0],moved.position[2]-start.position[2])>.5);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:300,y:720}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:350,y:720}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mobile.waitForTimeout(150);
   assert.notEqual((await mobile.evaluate(()=>window.__qa.snapshot())).yaw,moved.yaw);
   await mobile.locator('#map').click();assert.equal((await mobile.evaluate(()=>window.__qa.snapshot())).mode,'overview');
   await mobile.screenshot({path:`${output}/mobile-emulation.png`});
  });
 }
 assert.deepEqual(errors,[]);results.push({name:'no JavaScript or WebGL console errors',passed:true});
}catch(error){results.push({name:error.message,passed:false});process.exitCode=1;console.error(error);}
finally{await writeFile(`${output}/${production?'production-smoke':'browser-checks'}.json`,JSON.stringify({production,browser:browser.version(),deviceNote:'Desktop Chromium; mobile-sized touch emulation is not a physical Android test.',results,errors},null,2)+'\n');await browser.close();}
