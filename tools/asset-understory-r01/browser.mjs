import {chromium} from 'playwright';import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';import {spawn} from 'node:child_process';
const output=process.env.UNDERSTORY_OUTPUT??'/tmp/asset-understory-r01';await mkdir(output,{recursive:true});
const url='http://127.0.0.1:4297/asset-understory-r01.html';
const srv=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--config','vite.asset-understory-r01.config.ts','--host','127.0.0.1','--port','4297','--strictPort']);
let error,logs='',browser,errors=[];srv.stdout.on('data',b=>logs+=b.toString());srv.stderr.on('data',b=>logs+=b.toString());srv.on('error',e=>error=e);srv.on('exit',n=>error=Error('Preview '+n));
const report={milestone:'ASSET-UNDERSTORY-R01',artApproval:'NOT APPROVED',genuineWebGL:true,views:[],errors,pass:false};
try{
 const until=Date.now()+30000;while(true){if(error)throw error;try{if((await fetch(url,{signal:AbortSignal.timeout(1000)})).ok)break;}catch{}if(Date.now()>until)throw Error('Server timeout: '+logs);await new Promise(r=>setTimeout(r,300));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:850}});page.on('pageerror',e=>errors.push(String(e)));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
 await page.goto(url);await page.waitForFunction(()=>window.__understory?.snapshot().ready);const meta=await page.evaluate(()=>window.__understory.snapshot());
 assert.equal(meta.count,9);assert.equal(meta.source.length,9);assert(meta.source.every(x=>x.triangles>300&&x.triangles<13000));
 for(const view of ['overview','walking','bilberry','lingonberry','moss','top']){
  await page.evaluate(v=>window.__understory.setView(v),view);
  const snap=await page.evaluate(()=>window.__understory.snapshot());
  assert(snap.render.triangles<100000,'Showroom exceeded bounded triangle budget');
  assert(snap.render.calls<=12,'Showroom draw-call budget exceeded');
  await page.screenshot({path:output+'/'+view+'.png'});
  report.views.push({id:view,render:snap.render});
 }
 const before=meta.source.map(x=>x.triangles);
 await page.evaluate(()=>window.__understory.setView('overview'));
 assert.deepEqual((await page.evaluate(()=>window.__understory.snapshot())).source.map(x=>x.triangles),before);
 await page.evaluate(()=>window.__understory.dispose());
 assert.equal((await page.evaluate(()=>window.__understory.snapshot())).count,0);
 assert.deepEqual(errors,[]);report.pass=true;
}catch(e){report.error=String(e?.stack??e);console.error(e);process.exitCode=1;}
finally{report.previewLogs=logs;await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');await browser?.close();srv.kill();}
