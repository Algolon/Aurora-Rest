import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const output='docs/geo-r02b/evidence';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME||(existsSync(`${homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell`)?`${homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell`:undefined)});
const page=await browser.newPage({viewport:{width:1600,height:1200},deviceScaleFactor:1}),errors=[],warnings=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.location().url?.includes('favicon'))errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
try{
 await page.goto(process.env.WORLD_URL||'http://127.0.0.1:4197/geo-r02b.html',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__auroraR02B?.ready,null,{timeout:120000});
 let views=await page.evaluate(()=>window.__auroraR02B.views);if(process.argv.includes('--preview'))views=views.filter(v=>['overview','island-oblique','central-valley'].includes(v.id));const measurements=[];
 for(const view of views){
  await page.evaluate(id=>window.__auroraR02B.setView(id),view.id);await page.waitForTimeout(600);
  await page.evaluate(()=>new Promise(resolve=>{let n=0;function tick(){if(++n>=16)resolve();else requestAnimationFrame(tick);}requestAnimationFrame(tick);}));
  const snapshot=await page.evaluate(()=>window.__auroraR02B.snapshot());const times=snapshot.frameTimes.slice(-16).sort((a,b)=>a-b);delete snapshot.frameTimes;
  await page.screenshot({path:`${output}/${view.id}.png`});measurements.push({view,...snapshot,frameMs:{sampleFrames:times.length,scope:"Last 16 settled frames at this view; software renderer diagnostic only",median:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)],max:times.at(-1)}});console.log(view.id,snapshot.triangles,'triangles',snapshot.renderer);
 }
 const checks=[];
 if(!process.argv.includes('--preview')){
  await page.locator('#view').selectOption('central-valley');await page.locator('#mode').click();await page.evaluate(()=>document.activeElement?.blur());const start=await page.evaluate(()=>window.__auroraR02B.snapshot());
  await page.keyboard.down('w');await page.waitForFunction(([x,z])=>Math.hypot(window.__auroraR02B.snapshot().player[0]-x,window.__auroraR02B.snapshot().player[2]-z)>5,[start.player[0],start.player[2]],{timeout:20000});await page.keyboard.up('w');const moved=await page.evaluate(()=>window.__auroraR02B.snapshot());assert.ok(Math.hypot(moved.player[0]-start.player[0],moved.player[2]-start.player[2])>5);checks.push({name:'actual WASD fly movement',passed:true});
  await page.mouse.move(1100,700);await page.mouse.down();await page.mouse.move(1200,740,{steps:5});await page.mouse.up();const looked=await page.evaluate(()=>window.__auroraR02B.snapshot());assert.notEqual(looked.yaw,moved.yaw);checks.push({name:'actual drag camera look',passed:true});
  await page.locator('#top').click();assert.equal((await page.evaluate(()=>window.__auroraR02B.snapshot())).mode,'overview');await page.locator('#top').click();assert.equal((await page.evaluate(()=>window.__auroraR02B.snapshot())).mode,'walk');checks.push({name:'orthographic survey and return to ground',passed:true});
  await page.locator('#view').selectOption('overview');await page.locator('#ridges').check();await page.locator('#routes').check();await page.locator('#catchments').check();await page.screenshot({path:`${output}/diagnostic-overlays.png`});checks.push({name:'three independent diagnostic overlays',passed:true});
  await page.locator('#ridges').uncheck();await page.locator('#routes').uncheck();await page.locator('#catchments').uncheck();
  await page.locator('#view').selectOption('central-valley');await page.evaluate(()=>document.activeElement?.blur());const a=await page.evaluate(()=>window.__auroraR02B.snapshot());await page.keyboard.down('w');await page.waitForTimeout(500);await page.keyboard.up('w');const b=await page.evaluate(()=>window.__auroraR02B.snapshot());checks.push({name:'ground walking local contact',passed:Math.abs(b.eyeHeight-1.75)<.01,distanceM:Math.hypot(b.player[0]-a.player[0],b.player[2]-a.player[2])});
 }
 assert.deepEqual(errors,[]);
 await writeFile(`${output}/${process.argv.includes('--preview')?'preview':'runtime'}.json`,JSON.stringify({observedHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceState:'GEO-R02B working tree; source hashes in checkpoint manifest',browser:browser.version(),viewport:{width:1600,height:1200,dpr:1},evidence:'Actual WebGL browser screenshots, unretouched; no concept imagery substituted',deviceLimit:'Desktop browser only. No physical Android performance validation.',measurements,checks,errors,warnings,decks:await page.evaluate(()=>window.__auroraR02B.decks)},null,2)+'\n');
}catch(e){console.error('CAPTURE FAILURE',e,errors);await page.screenshot({path:`${output}/failure.png`}).catch(()=>{});process.exitCode=1;}finally{await browser.close();}
