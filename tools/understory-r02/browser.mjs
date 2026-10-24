/** Genuine headless WebGL matched A/B/A at 5 views: existing source specimens vs authored quadrat. */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const output=process.env.UNDERSTORY_R02_OUTPUT??'/tmp/understory-r02';
await mkdir(output,{recursive:true});
const url='http://127.0.0.1:4298/understory-r02.html';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--config','vite.understory-r02.config.ts','--host','127.0.0.1','--port','4298','--strictPort']);
let browser,serverError,logs='',errors=[];
server.stdout.on('data',b=>logs+=b.toString());
server.stderr.on('data',b=>logs+=b.toString());
server.on('error',e=>serverError=e);server.on('exit',code=>serverError=Error('Preview exit '+code));
const sha=v=>createHash('sha256').update(v).digest('hex');
const report={milestone:'UNDERSTORY-R02 A1',status:'NOT ART APPROVED',renderer:'Actual Chromium SwiftShader WebGL',views:[],errors,pass:false};
try{
 const end=Date.now()+40000;
 while(true){if(serverError)throw serverError;try{if((await fetch(url,{signal:AbortSignal.timeout(1000)})).ok)break;}catch{}if(Date.now()>end)throw Error('Preview did not start: '+logs);await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:850}});page.setDefaultTimeout(120000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto(url);await page.waitForFunction(()=>window.__understoryR02?.snapshot().ready);
 const initial=await page.evaluate(()=>window.__understoryR02.snapshot());
 assert.equal(initial.mode,'A');assert.equal(initial.sourceSpecimens,9);
 assert(initial.candidateInstances>=38&&initial.candidateInstances<=85,'bounded quadrat population count');
 for(const id of ['walking','overview','bilberry','moss','top']){
  await page.evaluate(id=>window.__understoryR02.setView(id),id);
  await page.evaluate(()=>window.__understoryR02.setMode('A'));
  const before=await page.evaluate(()=>window.__understoryR02.snapshot());
  const a=await page.evaluate(()=>window.__understoryR02.capture());
  await writeFile(output+'/'+id+'-A-uncomposed.png',Buffer.from(a.split(',')[1],'base64'));
  await page.evaluate(()=>window.__understoryR02.setMode('B'));
  const next=await page.evaluate(()=>window.__understoryR02.snapshot());
  const b=await page.evaluate(()=>window.__understoryR02.capture());
  await writeFile(output+'/'+id+'-B-authored.png',Buffer.from(b.split(',')[1],'base64'));
  assert.equal(next.mode,'B');assert.equal(next.candidateInstances,before.candidateInstances);
  assert.deepEqual(next.spatialIds,before.spatialIds,'site layout not deterministic');
  assert(next.render.calls<=20,'draw call ceiling');
  assert(next.render.triangles<=650000,'quadrat triangle ceiling');
  assert.notEqual(a,b,'no visible change '+id);
  await page.evaluate(()=>window.__understoryR02.setMode('A'));
  const restored=await page.evaluate(()=>window.__understoryR02.capture());
  assert.equal(restored,a,'A/B/A exact source restoration '+id);
  report.views.push({id,before:before.render,after:next.render,plantCount:next.candidateInstances,byKind:next.byKind,originalHash:sha(a),candidateHash:sha(b),restored:true});
  console.log('WEBGL VALIDATED',id,next.render);
 }
 await page.evaluate(()=>window.__understoryR02.dispose());assert.equal((await page.evaluate(()=>window.__understoryR02.snapshot())).ready,false);
 assert.deepEqual(errors,[]);report.pass=true;
}catch(err){report.error=String(err?.stack??err);console.error(err);process.exitCode=1;}
finally{report.previewLogs=logs;await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');await browser?.close();server.kill();}
