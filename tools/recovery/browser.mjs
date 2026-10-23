import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.env.RECOVERY_OUTPUT??'docs/recovery/validation/browser';
await mkdir(out,{recursive:true});
const report={url:'http://127.0.0.1:4220/env-p01.html',errors:[],cycles:[],profiles:[],checks:[],limits:'Software WebGL; no physical Android or art acceptance claim.'};
const sha=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4220','--strictPort']);
let browser;
let previewOutput = '';
let previewFailure;
server.stdout.on('data', b => { previewOutput += b.toString(); });
server.stderr.on('data', b => { previewOutput += b.toString(); });
server.on('error', e => { previewFailure = e; });
server.on('exit', code => { previewFailure = Error('Preview exited ' + code); });
try {
 // Readiness is an HTTP property; CI log formatting is not a server contract.
 const deadline = Date.now() + 30000;
 while (true) {
  if (previewFailure) throw previewFailure;
  try {
   const response = await fetch(report.url, {signal:AbortSignal.timeout(1000)});
   if (response.ok) break;
  } catch {}
  if (Date.now() >= deadline) throw Error('Preview HTTP startup timeout: ' + previewOutput);
  await new Promise(resolve => setTimeout(resolve, 200));
 }

 browser=await chromium.launch({executablePath:process.env.CHROME,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 report.browser=browser.version();const p=await browser.newPage({viewport:{width:1280,height:900}});p.setDefaultTimeout(240000);
 p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 await p.goto(report.url);
 const settle=async()=>{await p.waitForFunction(()=>window.__pop02Failure||window.__pop02?.snapshot().ready);assert.equal(await p.evaluate(()=>window.__pop02Failure),undefined);await p.evaluate(()=>window.__pop02.pause(true));};
 await settle();report.gl=await p.evaluate(()=>{const g=document.querySelector('canvas').getContext('webgl2'),e=g.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'unknown';});console.log('READY',report.browser,report.gl);
 const placementHash=async()=>sha(await p.evaluate(()=>window.__pop02.placements().sort((a,b)=>a.id.localeCompare(b.id))));
 const view=async id=>{await p.locator('#ground').selectOption('neutral');await p.evaluate(id=>{window.__pop02.setView(id);window.__pop02.pause(false);},id);await settle();console.log('VIEW',id);};
 for(let i=0;i<3;i++){
  await view('valley-landscape');await view('forest-interior');await p.locator('#ground').selectOption('material');
  const image=await p.evaluate(()=>window.__pop02.capture());
  if(i===0)await writeFile(out+'/forest-interior.png',Buffer.from(image.split(',')[1],'base64'));
  const snapshot=await p.evaluate(()=>window.__pop02.snapshot());
  assert.equal(snapshot.visibleTerrainSurfaces,1);assert.equal(snapshot.error,null);assert.equal(snapshot.ground.hash,'bc2ce096df2672080f08ec6c92ed8f288e5d079a91db9855470ca1d56cee63a1');
  report.cycles.push({placementHash:await placementHash(),snapshot});
 }
 for(const c of report.cycles.slice(1)){assert.equal(c.placementHash,report.cycles[0].placementHash);assert.deepEqual(c.snapshot.renderer.memory,report.cycles[0].snapshot.renderer.memory);}
 report.checks.push('Three forest/valley re-entry cycles preserve full sorted descriptors, ground classification and GPU resource counters.');
 const before=await placementHash();const geometry=sha(await p.evaluate(()=>window.__pop02.groundArrays()));
 for(const mode of ['neutral','weights','material']){await p.locator('#ground').selectOption(mode);await p.evaluate(()=>window.__pop02.renderOnce());assert.equal(await placementHash(),before);assert.equal(sha(await p.evaluate(()=>window.__pop02.groundArrays())),geometry);}
 report.checks.push('Material toggles preserve full placement descriptors and terrain geometry.');
 for(let cycle=0;cycle<2;cycle++)for(const profile of ['balanced','mobile','high']){
  await p.locator('#profile').selectOption(profile);const s=await p.evaluate(()=>window.__pop02.renderOnce());assert.equal(s.ground.owners,1);assert.equal(await placementHash(),before);report.profiles.push({cycle,profile,memory:s.renderer.memory});
 }
 assert.deepEqual(report.profiles[2].memory,report.profiles[5].memory);report.checks.push('Six profile recreate operations retain placements, one owner and stable high-profile GPU counters.');
 for(const id of ['forest-landscape','valley-landscape']){await view(id);await p.locator('#ground').selectOption('material');const png=await p.evaluate(()=>window.__pop02.capture());await writeFile(out+'/'+id+'.png',Buffer.from(png.split(',')[1],'base64'));}
 await p.evaluate(()=>window.__pop02.dispose());report.checks.push('Viewer teardown completes without exception.');assert.deepEqual(report.errors,[]);report.passed=true;console.log('RECOVERY WEBGL PASS');
} catch(e){report.failure=String(e.stack??e);process.exitCode=1;console.error(e);}
finally {report.previewOutput=previewOutput;await writeFile(out+'/result.json',JSON.stringify(report,null,2)+'\n');await browser?.close();server.kill();}
