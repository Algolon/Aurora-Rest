/** ENV-R02D SwiftShader proof: compare R02C-A2 (A) to A2 + cohesion (B), then restore A pixel-identically. */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.env.ENV_R02D_OUTPUT??'/tmp/aurora-env-r02d';await mkdir(out,{recursive:true});
const url='http://127.0.0.1:4296/env-r02d.html',server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--config','vite.env-r02d.config.ts','--host','127.0.0.1','--port','4296','--strictPort']);
let browser,err,logs='',errors=[];server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);server.on('error',e=>err=e);server.on('exit',n=>err=Error('Preview '+n));
const sha=b=>createHash('sha256').update(b).digest('hex'),report={milestone:'ENV-R02D A1',comparedTo:'ENV-R02C A2',cameras:[],errors,softwareWebGL:true,art:'NOT APPROVED'};
try{
 const deadline=Date.now()+40000;while(true){if(err)throw err;try{if((await fetch(url,{signal:AbortSignal.timeout(1000)})).ok)break;}catch{}if(Date.now()>deadline)throw Error('Server boot '+logs);await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(240000);
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
 await page.goto(url);
 const settle=async()=>{await page.waitForFunction(()=>window.__pop02Failure||window.__pop02?.snapshot().ready);const fail=await page.evaluate(()=>window.__pop02Failure);assert.equal(fail,undefined);await page.evaluate(()=>window.__pop02.pause(true));};
 await settle();await page.locator('#ground').selectOption('material');
 for(const id of ['gateway-approach','gateway-trail','gateway-reveal']){
  await page.evaluate(id=>{window.__pop02.setView(id);window.__pop02.pause(false)},id);await settle();
  await page.locator('#composition').check();await page.evaluate(()=>window.__pop02.pause(false));await settle();
  await page.locator('#cohesion').uncheck();await page.evaluate(()=>window.__pop02.renderOnce());
  const base=await page.evaluate(()=>window.__pop02.capture()),a=await page.evaluate(()=>window.__pop02.snapshot()),groundHash=sha(JSON.stringify(await page.evaluate(()=>window.__pop02.groundArrays())));
  await writeFile(out+'/'+id+'-a-r02c.png',Buffer.from(base.split(',')[1],'base64'));
  await page.locator('#cohesion').check();await page.evaluate(()=>window.__pop02.pause(false));await settle();
  const b=await page.evaluate(()=>window.__pop02.capture()),candidate=await page.evaluate(()=>window.__pop02.snapshot());
  await writeFile(out+'/'+id+'-b-r02d.png',Buffer.from(b.split(',')[1],'base64'));
  assert.equal(a.authored.originalCount,candidate.authored.originalCount);
  assert.deepEqual(a.authored.canonicalIds,candidate.authored.canonicalIds);
  assert.deepEqual(a.authored.addedIds,candidate.authored.addedIds);
  assert(candidate.cohesion.enabled&&candidate.cohesion.lowCoverCount>70);
  assert(candidate.cohesion.routeLengthM>=70&&candidate.cohesion.routeLengthM<=94);
  assert.equal(sha(JSON.stringify(await page.evaluate(()=>window.__pop02.groundArrays()))),groundHash);
  assert.equal(a.ground.hash,candidate.ground.hash);
  assert.notEqual(base,b,'Cohesion made no visible difference '+id);
  assert(candidate.renderer.triangles<750000,'R02D provisional budget exceeded '+id);
  await page.locator('#cohesion').uncheck();await page.evaluate(()=>window.__pop02.pause(false));await settle();
  const restored=await page.evaluate(()=>window.__pop02.capture()),c=await page.evaluate(()=>window.__pop02.snapshot());
  assert.equal(restored,base,'A2 baseline NOT pixel-identical after A/B/A '+id);
  assert(!c.cohesion.enabled);
  report.cameras.push({id,sourceCount:a.authored.originalCount,authoredTrees:a.authored.addedTrees,sourceGrass:a.authored.addedGrass,cover:candidate.cohesion.lowCoverCount,pathLengthM:candidate.cohesion.routeLengthM,
    before:{calls:a.renderer.calls,triangles:a.renderer.triangles},after:{calls:candidate.renderer.calls,triangles:candidate.renderer.triangles},aSha:sha(base),bSha:sha(b),originalHeroRouteUnmodified:true});
  console.log('CAPTURE',id,JSON.stringify(report.cameras.at(-1)));
 }
 await page.evaluate(()=>window.__pop02.dispose());assert.deepEqual(errors,[]);report.passed=true;
}catch(e){report.passed=false;report.failure=String(e?.stack??e);console.error(e);process.exitCode=1;}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser?.close();server.kill();}
