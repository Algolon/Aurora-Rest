import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
const out=process.env.UNDERSTORY_R04_OUTPUT??'/tmp/understory-asset-r04';await mkdir(out,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--config','vite.understory-asset-r04.config.ts','--host','127.0.0.1','--port','4299','--strictPort']);
const url='http://127.0.0.1:4299/understory-asset-r04.html';let browser,stop,logs='',errors=[];
server.stdout.on('data',b=>logs+=b);server.stderr.on('data',b=>logs+=b);server.on('error',e=>stop=e);server.on('exit',n=>stop=Error('Preview '+n));
const hash=b=>createHash('sha256').update(b).digest('hex');
const report={milestone:'UNDERSTORY-ASSET-R04 A1',source:'R03 visual target; A is R01 mesh baseline; B is R04 independent original specimens',technicalPass:false,artApproval:'NOT APPROVED pending visual review',views:[],errors};
try{
 const deadline=Date.now()+40000;
 while(true){if(stop)throw stop;try{if((await fetch(url,{signal:AbortSignal.timeout(1200)})).ok)break;}catch{}if(Date.now()>deadline)throw Error('Vite preview failed '+logs);await new Promise(r=>setTimeout(r,300));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:820}});page.setDefaultTimeout(120000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
 await page.goto(url);await page.waitForFunction(()=>window.__r04?.snapshot().ready);
 const before=await page.evaluate(()=>window.__r04.snapshot());
 assert.equal(before.mode,'A');assert.equal(before.sourceMeshes,8);
 assert.equal(before.assets.substrate.drawObjects,4);
 assert.equal(before.assets.bilberry.drawObjects,1);
 assert(before.assets.substrate.triangles<170000);
 assert(before.assets.bilberry.triangles<30000);
 for(const id of ['overview','walking','substrate','bilberry','top']){
  await page.evaluate(v=>window.__r04.setView(v),id);
  await page.evaluate(()=>window.__r04.setMode('A'));
  const a=await page.evaluate(()=>window.__r04.capture());
  const ba=await page.evaluate(()=>window.__r04.snapshot());
  await writeFile(out+'/'+id+'-A-source.png',Buffer.from(a.split(',')[1],'base64'));
  await page.evaluate(()=>window.__r04.setMode('B'));
  const b=await page.evaluate(()=>window.__r04.capture());
  const bb=await page.evaluate(()=>window.__r04.snapshot());
  await writeFile(out+'/'+id+'-B-candidate.png',Buffer.from(b.split(',')[1],'base64'));
  assert.notEqual(a,b,'image must differ '+id);
  assert(bb.render.calls<=11,'single source specimens draw calls exceed budget');
  assert(bb.render.triangles<170000,'actual submitted triangle budget exceeded');
  assert.deepEqual(bb.assets,ba.assets);
  await page.evaluate(()=>window.__r04.setMode('A'));
  const restored=await page.evaluate(()=>window.__r04.capture());
  assert.equal(restored,a,'A/B/A visual reversal failed '+id);
  report.views.push({id,baseline:ba.render,candidate:bb.render,baselineHash:hash(a),candidateHash:hash(b),exactRestoration:true});
  console.log('R04_WEBGL',id,JSON.stringify(report.views.at(-1)));
 }
 await page.evaluate(()=>window.__r04.dispose());
 assert.equal((await page.evaluate(()=>window.__r04.snapshot())).ready,false);
 assert.deepEqual(errors,[]);
 report.assets=before.assets;report.technicalPass=true;
}catch(err){report.error=String(err?.stack??err);console.error(err);process.exitCode=1;}
finally{report.viteOutput=logs;await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser?.close();server.kill();}
