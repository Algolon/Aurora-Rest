/** Genuine WebGL matched A/B/A review; no approval without visual inspection. */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.env.ENV_R02C_OUTPUT??'/tmp/aurora-env-r02c';await mkdir(out,{recursive:true});
const url='http://127.0.0.1:4295/env-r02c.html';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--config','vite.env-r02c.config.ts','--host','127.0.0.1','--port','4295','--strictPort']);
let browser,error,logs='',errors=[];
server.stdout.on('data',b=>logs+=b.toString());server.stderr.on('data',b=>logs+=b.toString());
server.on('error',e=>error=e);server.on('exit',code=>error=Error('Preview exit '+code));
const sha=x=>createHash('sha256').update(x).digest('hex');
const report={source:'ENV-R02C authorship candidate',url,cameras:[],errors,renderer:'Software SwiftShader WebGL, not device benchmark',artApproval:'PENDING'};
try{
 const deadline=Date.now()+40000;for(;;){if(error)throw error;try{const r=await fetch(url,{signal:AbortSignal.timeout(1000)});if(r.ok)break;}catch{}if(Date.now()>deadline)throw Error('Preview startup '+logs);await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await browser.newPage({viewport:{width:1280,height:900}});p.setDefaultTimeout(240000);
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.goto(url);
 const settle=async()=>{await p.waitForFunction(()=>window.__pop02Failure||window.__pop02?.snapshot().ready);assert.equal(await p.evaluate(()=>window.__pop02Failure),undefined);await p.evaluate(()=>window.__pop02.pause(true));};
 await settle();await p.locator('#ground').selectOption('material');
 for(const id of ['gateway-approach','gateway-trail','gateway-reveal']){
  await p.evaluate(id=>{window.__pop02.setView(id);window.__pop02.pause(false);},id);await settle();
  const groundHash=sha(JSON.stringify(await p.evaluate(()=>window.__pop02.groundArrays())));
  await p.locator('#composition').uncheck();await p.evaluate(()=>window.__pop02.renderOnce());
  const original=await p.evaluate(()=>window.__pop02.capture()),before=await p.evaluate(()=>window.__pop02.snapshot());
  await writeFile(out+'/'+id+'-a-canonical.png',Buffer.from(original.split(',')[1],'base64'));
  await p.locator('#composition').check();await p.evaluate(()=>window.__pop02.pause(false));await settle();
  const candidate=await p.evaluate(()=>window.__pop02.capture()),after=await p.evaluate(()=>window.__pop02.snapshot());
  await writeFile(out+'/'+id+'-b-authored.png',Buffer.from(candidate.split(',')[1],'base64'));
  assert.deepEqual(after.authored.canonicalIds,before.authored.canonicalIds,'source placements changed');
  assert(after.authored.addedTrees>=8,'not enough authored trees visible in active chunks');
  assert(after.authored.addedGrass>=20,'not enough existing-source understory instances');
  assert(candidate!==original,'no visible impact');
  assert.equal(before.ground.hash,after.ground.hash);assert.equal(sha(JSON.stringify(await p.evaluate(()=>window.__pop02.groundArrays()))),groundHash);
  await p.locator('#composition').uncheck();await p.evaluate(()=>window.__pop02.pause(false));await settle();
  const restored=await p.evaluate(()=>window.__pop02.capture()),last=await p.evaluate(()=>window.__pop02.snapshot());
  assert.equal(restored,original,'A/B/A did not exactly restore the original image');
  assert.equal(last.authored.addedCount,0);assert.equal(last.authored.hiddenCount,0);
  report.cameras.push({id,camera:before.camera,original:before.authored.originalCount,added:after.authored.addedCount,addedTrees:after.authored.addedTrees,addedGrass:after.authored.addedGrass,hidden:after.authored.hiddenCount,hiddenIds:after.authored.hiddenIds,addedIds:after.authored.addedIds,baselineSha:sha(original),candidateSha:sha(candidate),countsBefore:before.counts,renderBefore:before.renderer,renderAfter:after.renderer});
  console.log('CAPTURED',id,after.authored.addedTrees,after.authored.addedGrass,after.authored.hiddenCount);
 }
 assert.deepEqual(errors,[]);await p.evaluate(()=>window.__pop02.dispose());report.passed=true;
}catch(e){report.passed=false;report.failure=String(e?.stack??e);process.exitCode=1;console.error(e);}
finally{report.previewLogs=logs;await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser?.close();server.kill();}
