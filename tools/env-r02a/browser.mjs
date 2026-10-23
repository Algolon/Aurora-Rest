/** Genuine WebGL A/B diagnostic; does not claim artistic approval or hardware FPS. */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.env.ENV_R02A_OUTPUT??'/tmp/aurora-env-r02a';
await mkdir(out,{recursive:true});
const url='http://127.0.0.1:4293/env-r02a.html';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--config','vite.env-r02a.config.ts','--host','127.0.0.1','--port','4293','--strictPort']);
let browser,serverError,logs='',errors=[];
server.stdout.on('data',b=>logs+=b.toString());server.stderr.on('data',b=>logs+=b.toString());
server.on('error',e=>serverError=e);server.on('exit',code=>serverError=Error('Preview exit '+code));
const report={source:'ENV-R02A isolated sidecar',url,cameras:[],errors,renderer:'Software WebGL SwiftShader, not device benchmark',artApproval:'NOT APPROVED'};
const sha=x=>createHash('sha256').update(x).digest('hex');
try{
 const until=Date.now()+40000;for(;;){if(serverError)throw serverError;try{const r=await fetch(url,{signal:AbortSignal.timeout(1000)});if(r.ok)break;}catch{}if(Date.now()>until)throw Error('Preview startup '+logs);await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await browser.newPage({viewport:{width:1280,height:900}});p.setDefaultTimeout(240000);
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.goto(url);
 const settled=async()=>{await p.waitForFunction(()=>window.__pop02Failure||window.__pop02?.snapshot().ready);assert.equal(await p.evaluate(()=>window.__pop02Failure),undefined);await p.evaluate(()=>window.__pop02.pause(true));};
 await settled();await p.locator('#ground').selectOption('material');
 const geom=sha(JSON.stringify(await p.evaluate(()=>window.__pop02.groundArrays())));
 for(const id of ['forest-edge','forest-interior','forest-landscape']){
  await p.evaluate(id=>{window.__pop02.setView(id);window.__pop02.pause(false);},id);await settled();
  await p.locator('#pilot').uncheck();await p.evaluate(()=>window.__pop02.renderOnce());
  const baseline=await p.evaluate(()=>window.__pop02.capture()),before=await p.evaluate(()=>window.__pop02.snapshot()),ids=await p.evaluate(()=>window.__pop02.ids());
  await writeFile(out+'/'+id+'-a-canonical.png',Buffer.from(baseline.split(',')[1],'base64'));
  await p.locator('#pilot').check();await p.evaluate(()=>window.__pop02.renderOnce());
  const candidate=await p.evaluate(()=>window.__pop02.capture()),after=await p.evaluate(()=>window.__pop02.snapshot()),afterIds=await p.evaluate(()=>window.__pop02.ids());
  await writeFile(out+'/'+id+'-b-pilot.png',Buffer.from(candidate.split(',')[1],'base64'));
  assert.deepEqual(afterIds,ids,'population descriptors changed');
  assert.equal(sha(JSON.stringify(await p.evaluate(()=>window.__pop02.groundArrays()))),geom);
  assert.equal(before.renderer.calls,after.renderer.calls);assert.equal(before.renderer.triangles,after.renderer.triangles);
  assert.equal(after.ground.owners,1);assert.equal(after.ground.pilotEnabled,true);assert(after.ground.pilotAudit.changedNodes>0);
  report.cameras.push({id,baselineSha:sha(baseline),candidateSha:sha(candidate),visuallyDifferent:baseline!==candidate,descriptors:ids.length,calls:after.renderer.calls,triangles:after.renderer.triangles,changedNodes:after.ground.pilotAudit.changedNodes,pilotAudit:after.ground.pilotAudit});
  await p.locator('#pilot').uncheck();await p.evaluate(()=>window.__pop02.renderOnce());
  const restored=await p.evaluate(()=>window.__pop02.capture()),snapshot=await p.evaluate(()=>window.__pop02.snapshot());
  assert.equal(restored,baseline,'canonical A/B/A restoration not pixel-identical');
  assert.equal(snapshot.ground.pilotEnabled,false);assert.equal(snapshot.ground.owners,1);
 }
 assert(report.cameras.some(c=>c.visuallyDifferent),'Pilot did not visibly affect any selected image');
 assert.deepEqual(errors,[]);
 await p.evaluate(()=>window.__pop02.dispose());report.passed=true;console.log('ENV-R02A REAL WEBGL A/B/A PASS',JSON.stringify(report.cameras));
}catch(e){report.passed=false;report.failure=String(e?.stack??e);process.exitCode=1;console.error(e);}
finally{report.previewLogs=logs;await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser?.close();server.kill();}
