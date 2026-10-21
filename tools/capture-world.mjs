import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import {WORLD} from '../src/world/config.ts';

// Instrument the served development module only. No capture API ships in the app.
const phase = process.argv[2] ?? 'after';
const url = process.env.WORLD_URL ?? 'http://127.0.0.1:4192';
const output = `docs/evidence/world-01b/${phase}`;
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME || undefined,
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [], warnings = [];
page.on('pageerror', error => {errors.push(error.message);console.error(error.message);});
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text());
  if (message.type() === 'warning') warnings.push(message.text());
});
await page.route(/\/src\/main\.ts(?:\?|$)/, async route => {
  const response = await route.fetch();
  let source=await response.text();
  source=source.replace('renderer.render(scene, camera);',`if(window.__surveyCamera){const v=window.__surveyCamera;camera.near=25;camera.updateProjectionMatrix();camera.position.set(-v.x,v.y,v.z);camera.lookAt(0,130,300);}renderer.render(scene, camera);`);
  await route.fulfill({ response, body: source + `
window.__worldQA = {
  view(v) {
    window.__surveyCamera=v.survey?v:null;
    setMode(v.overview ? 'overview' : v.survey ? 'fly' : 'walk');
    if(v.survey)(scene.fog).density=.000035;
    player.set(v.x, v.overview ? 6800 : heightAt(v.x,v.z)+1.75, v.z);
    yaw=v.yaw; pitch=v.pitch ?? -.035;
    terrain.update(player.x,player.z,true);
  },
  snapshot() {
    const gl=renderer.getContext(), info=gl.getExtension('WEBGL_debug_renderer_info');
    return {position:player.toArray(), mode, yaw, pitch, calls:renderer.info.render.calls,
      triangles:renderer.info.render.triangles, geometries:renderer.info.memory.geometries,
      nearTiles:terrain.nearCount, camera:camera.position.toArray(),
      renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)};
  }
};` });
});
await page.goto(url);
await page.waitForFunction(() => window.__worldQA && document.querySelector('#readout').textContent.includes('FPS'),null,{timeout:30000}).catch(async error=>{console.error(errors,await page.evaluate(()=>({qa:typeof window.__worldQA,text:document.body.innerText})));await browser.close();throw error;});
const baselineViews = [
  {name:'overview',x:0,z:0,yaw:0,overview:true},
  {name:'home-cove',x:1730,z:-2646,yaw:2.55},
  {name:'birchwood',x:1050,z:-1742,yaw:2.8},
  {name:'central-valley',x:450,z:-292,yaw:3.0},
  {name:'cairn-saddle',x:0,z:928,yaw:3.0},
  {name:'high-tarn',x:400,z:2338,yaw:-2.3},
  {name:'windward-coast',x:-2460,z:198,yaw:2.8},
];
const names=['home-cove','birchwood','central-valley','cairn-saddle','high-tarn','windward-coast','south-shoulder','hidden-fold','dune-fields'];
const views=phase==='before'?baselineViews:[
 {name:'overview',x:0,z:0,yaw:0,overview:true},
 {name:'island-oblique',x:0,y:5200,z:-6200,yaw:Math.PI,survey:true},
 ...WORLD.viewpoints.map((p,i)=>({name:names[i],x:p.x,z:p.z+18,yaw:[2.55,3.0,3.0,3.0,-2.3,1.8,3.0,-1.57,1.5][i]})),
];
const measurements = [];
for (const view of views.filter(v=>!process.env.VIEWS||process.env.VIEWS.split(',').includes(v.name))) {
  await page.evaluate(v => window.__worldQA.view(v), view);
  await page.waitForTimeout(1200);
  const frameTimes = await page.evaluate(() => new Promise(resolve => {
    const times=[]; let last=performance.now();
    function frame(now) {times.push(now-last);last=now;if(times.length<180)requestAnimationFrame(frame);else resolve(times.slice(1));}
    requestAnimationFrame(frame);
  }));
  frameTimes.sort((a,b)=>a-b);
  const snapshot = await page.evaluate(() => window.__worldQA.snapshot());
  await page.screenshot({path:`${output}/${view.name}.png`});
  measurements.push({view,...snapshot,frameMs:{median:frameTimes[Math.floor(frameTimes.length*.5)],p95:frameTimes[Math.floor(frameTimes.length*.95)],max:frameTimes.at(-1)}});
}
await writeFile(`${output}/runtime.json`,JSON.stringify({phase,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  sourceNote:'Dev module instrumented only for repeatable camera placement and measurement. Ground views use local terrain eye height. Working tree may include uncommitted changes.',
  browser:browser.version(),platform:process.platform,viewport:{width:1440,height:900,dpr:1},measurements,errors,warnings},null,2)+'\n');
await browser.close();
console.log(JSON.stringify({phase,views:measurements.length,errors,warnings}));
if(errors.length)process.exitCode=1;
