/** Genuine software-WebGL A/B/A evidence. No art approval or device performance inference. */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.env.ENV_R02B_OUTPUT??'/tmp/aurora-env-r02b';await mkdir(out,{recursive:true});
const url='http://127.0.0.1:4294/env-r02b.html';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--config','vite.env-r02b.config.ts','--host','127.0.0.1','--port','4294','--strictPort']);
let browser,error,logs='',errors=[];
server.stdout.on('data',b=>logs+=b.toString());server.stderr.on('data',b=>logs+=b.toString());
server.on('error',e=>error=e);server.on('exit',code=>error=Error('Preview exited '+code));
const sha=s=>createHash('sha256').update(s).digest('hex');
const report={source:'ENV-R02B isolated composition',url,cameras:[],errors,renderer:'SwiftShader software WebGL, not physical device',artApproval:'PENDING'};
try{
 const deadline=Date.now()+40000;for(;;){if(error)throw error;try{const r=await fetch(url,{signal:AbortSignal.timeout(1000)});if(r.ok)break;}catch{}if(Date.now()>deadline)throw Error('Preview startup '+logs);await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await browser.newPage({viewport:{width:1280,height:900}});p.setDefaultTimeout(240000);
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.goto(url);
 const settled=async()=>{await p.waitForFunction(()=>window.__pop02Failure||window.__pop02?.snapshot().ready);assert.equal(await p.evaluate(()=>window.__pop02Failure),undefined);await p.evaluate(()=>window.__pop02.pause(true));};
 await settled();await p.locator('#ground').selectOption('material');
 const names=['forest-interior','forest-edge','forest-landscape','forest-corridor'];
 for(const id of names){
  await p.evaluate(id=>{window.__pop02.setView(id);window.__pop02.pause(false);},id);await settled();
  const groundHash=sha(JSON.stringify(await p.evaluate(()=>window.__pop02.groundArrays())));
  await p.locator('#composition').uncheck();await p.evaluate(()=>window.__pop02.renderOnce());
  const a=await p.evaluate(()=>window.__pop02.capture()),before=await p.evaluate(()=>window.__pop02.snapshot());
  const sourceIds=before.composition.originalIds;
  await writeFile(out+'/'+id+'-a-canonical.png',Buffer.from(a.split(',')[1],'base64'));
  await p.locator('#composition').check();await p.evaluate(()=>window.__pop02.pause(false));await settled();
  const b=await p.evaluate(()=>window.__pop02.capture()),after=await p.evaluate(()=>window.__pop02.snapshot());
  await writeFile(out+'/'+id+'-b-composed.png',Buffer.from(b.split(',')[1],'base64'));
  assert.deepEqual(after.composition.originalIds,sourceIds,'source descriptors changed');
  assert(after.composition.hiddenIds.every(x=>sourceIds.includes(x)));
  assert.equal(after.composition.originalCount-after.composition.renderedCount,after.composition.hiddenCount);
  assert.equal(after.renderer.triangles<=before.renderer.triangles,true,'new triangles in removal-only pilot');
  assert.equal(after.ground.hash,before.ground.hash);
  assert.equal(sha(JSON.stringify(await p.evaluate(()=>window.__pop02.groundArrays()))),groundHash);
  await p.locator('#composition').uncheck();await p.evaluate(()=>window.__pop02.pause(false));await settled();
  const restored=await p.evaluate(()=>window.__pop02.capture()),final=await p.evaluate(()=>window.__pop02.snapshot());
  assert.equal(restored,a,'canonical baseline did not pixel-restore');
  assert.equal(final.composition.hiddenCount,0);
  assert.equal(final.composition.renderedCount,final.composition.originalCount);
  report.cameras.push({id,hidden:after.composition.hiddenCount,hiddenBirch:after.composition.hiddenBirch,hiddenPine:after.composition.hiddenPine,
   original:after.composition.originalCount,sourceHash:sha(JSON.stringify(sourceIds)),removedIds:after.composition.hiddenIds,
   imageChanged:a!==b,aSha:sha(a),bSha:sha(b),callsBefore:before.renderer.calls,callsAfter:after.renderer.calls,
   trianglesBefore:before.renderer.triangles,trianglesAfter:after.renderer.triangles});
  console.log('VIEW',id,report.cameras.at(-1).hidden,'hidden','pixel different',a!==b);
 }
 assert(report.cameras.some(x=>x.hidden>0&&x.imageChanged),'candidate invisible in reviewed camera set');
 assert.deepEqual(errors,[]);await p.evaluate(()=>window.__pop02.dispose());report.passed=true;
}catch(e){report.passed=false;report.failure=String(e?.stack??e);process.exitCode=1;console.error(e);}
finally{report.previewLogs=logs;await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser?.close();server.kill();}
