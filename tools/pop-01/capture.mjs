import {chromium} from 'playwright';
import {spawn,execFileSync} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const output='docs/pop-01/evidence';await mkdir(output,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4199','--strictPort'],{stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.on('data',b=>{if(b.toString().includes('Local:'))resolve();});server.on('exit',code=>reject(Error('Vite exit '+code)));server.stderr.on('data',b=>process.stderr.write(b));});
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROME,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1600,height:1100},deviceScaleFactor:1}),errors=[],warnings=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
 page.setDefaultTimeout(90000);await page.goto('http://127.0.0.1:4199/pop-01.html',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__pop01?.snapshot().ready);
 const settle=async()=>{await page.waitForFunction(()=>window.__pop01?.snapshot().ready);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
 const measurements=[];
 const regions=await page.evaluate(()=>window.__pop01.regions);
 for(const region of regions){await page.locator('#region').selectOption(region.id);await settle();
  for(const view of ['overhead','landscape','walk']){await page.locator('#view').selectOption(view);await settle();const s=await page.evaluate(()=>window.__pop01.snapshot());assert.equal(s.region.id,region.id);assert.equal(s.mode,view);assert.ok(s.descriptors>0);assert.ok(s.renderer.calls>0&&s.renderer.triangles>0);assert.equal(s.activeChunks,25);await page.screenshot({path:`${output}/${region.id}-${view}.png`});measurements.push(s);console.log(region.id,view,s.descriptors,s.renderer);}
 }
 await page.locator('#region').selectOption('forest');await page.locator('#view').selectOption('overhead');await settle();
 const first=await page.evaluate(()=>window.__pop01.ids());const memoryBefore=await page.evaluate(()=>window.__pop01.snapshot().renderer.memory);const lifecycle=[];
 for(let i=0;i<4;i++){await page.locator('#region').selectOption(i%2?'valley':'home');await settle();await page.locator('#region').selectOption('forest');await settle();assert.deepEqual(await page.evaluate(()=>window.__pop01.ids()),first);lifecycle.push(await page.evaluate(()=>window.__pop01.snapshot().renderer.memory));}
 const memoryAfter=lifecycle.at(-1);assert.equal(memoryBefore.geometries,memoryAfter.geometries);assert.equal(memoryBefore.textures,memoryAfter.textures);
 await page.locator('#regenerate').click();await settle();assert.deepEqual(await page.evaluate(()=>window.__pop01.ids()),first);
 const id=first[0];assert.equal((await page.evaluate(id=>window.__pop01.inspect(id),id)).id,id);
 const checks=[{name:'four region teleport roundtrips + unload/regenerate preserve IDs and GPU geometry/texture counts',passed:true,memoryBefore,memoryAfter,lifecycle},{name:'instance inspector data resolves stable ID',passed:true}];
 for(const d of ['community','slope','water','trail']){await page.locator('#diagnostic').selectOption(d);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:`${output}/forest-${d}.png`});}
 await page.locator('#diagnostic').selectOption('neutral');await page.locator('#chunks').check();await page.screenshot({path:`${output}/forest-chunks.png`});await page.locator('#chunks').uncheck();
 const before=await page.evaluate(()=>window.__pop01.snapshot());await page.locator('[data-family="grass"]').uncheck();await settle();const off=await page.evaluate(()=>window.__pop01.snapshot());assert.equal(off.descriptors,before.descriptors);assert.ok(off.submittedProxyInstances<before.submittedProxyInstances);await page.locator('[data-family="grass"]').check();checks.push({name:'family visibility affects rendered instances without changing population',passed:true});
 await page.locator('#density').fill('0.5');await page.locator('#density').dispatchEvent('change');await settle();assert.ok((await page.evaluate(()=>window.__pop01.snapshot())).descriptors<before.descriptors);await page.locator('#density').fill('1');await page.locator('#density').dispatchEvent('change');await settle();assert.deepEqual(await page.evaluate(()=>window.__pop01.ids()),first);checks.push({name:'density regeneration deterministic',passed:true});
 await page.locator('#seed').fill('73130');await page.locator('#seed').dispatchEvent('change');await settle();assert.notDeepEqual(await page.evaluate(()=>window.__pop01.ids()),first);await page.locator('#seed').fill('73129');await page.locator('#seed').dispatchEvent('change');await settle();assert.deepEqual(await page.evaluate(()=>window.__pop01.ids()),first);checks.push({name:'seed control changes and restores population',passed:true});
 await page.locator('#view').selectOption('walk');await settle();await page.locator('canvas').click({position:{x:1100,y:600}});await page.evaluate(()=>document.activeElement?.blur());const start=await page.evaluate(()=>window.__pop01.snapshot());await page.keyboard.down('w');await page.waitForTimeout(900);await page.keyboard.up('w');await settle();const moved=await page.evaluate(()=>window.__pop01.snapshot());assert.ok(Math.hypot(moved.camera[0]-start.camera[0],moved.camera[2]-start.camera[2])>.2);assert.ok(Math.abs(moved.camera[1]-moved.terrainY-1.75)<1e-7);checks.push({name:'actual WASD movement uses canonical ground height',passed:true,distanceM:Math.hypot(moved.camera[0]-start.camera[0],moved.camera[2]-start.camera[2])});
 await page.mouse.move(1100,600);await page.mouse.down();await page.mouse.move(1200,650,{steps:4});await page.mouse.up();await settle();await page.screenshot({path:`${output}/forest-walk-interaction.png`});
 const gl=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'unknown',vendor:e?gl.getParameter(e.UNMASKED_VENDOR_WEBGL):'unknown'};});
 assert.deepEqual(errors,[]);
 await writeFile(`${output}/runtime.json`,JSON.stringify({observedParent:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceState:'POP-01 working tree; committed capture source and protected manifest',browser:browser.version(),viewport:{width:1600,height:1100,dpr:1},gl,evidence:'Actual Three.js WebGL screenshots; diagnostic proxies; no concept images',hardwareLimit:'Software WebGL only; no Android FPS or production asset render cost validated',measurements,checks,errors,warnings},null,2)+'\n');
 console.log('Browser checks passed',checks.length);
}catch(e){console.error(e);process.exitCode=1;}finally{await browser?.close();server.kill();}
