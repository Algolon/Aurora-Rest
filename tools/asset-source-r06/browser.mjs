import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
const out=process.env.R06_OUTPUT??'/tmp/asset-source-r06',url='http://127.0.0.1:4306/asset-source-r06.html';
await mkdir(out,{recursive:true});
const original=JSON.parse(await readFile(out+'/moss_source_provenance.json','utf8'));
const forest=JSON.parse(await readFile(out+'/source_provenance.json','utf8'));
if(!original.publisherIntegrityPASS||!original.files.every(f=>f.verifiedMD5===f.publisherMD5.toLowerCase()))throw Error('Moss MD5 provenance not valid');
if(!forest.provenanceVerified||Object.values(forest.maps).some(m=>!m.sourceVerified))throw Error('Forest PBR not publisher validated');
let browser,err,logs='',errors=[];
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--config','vite.asset-source-r06.config.ts','--host','127.0.0.1','--port','4306','--strictPort']);
server.stdout.on('data',b=>logs+=b.toString());server.stderr.on('data',b=>logs+=b.toString());server.on('error',e=>err=e);server.on('exit',code=>err=Error('Vite preview exit '+code));
const sha=data=>createHash('sha256').update(data).digest('hex');
const report={milestone:'ASSET-SOURCE-R06',sourceMoss:original.assetId,sourceGround:forest.assetId,
 firstPartySourceMD5Passed:true,renderer:'Chromium SwiftShader',genuineWebGL:true,
 artApproval:'NOT APPROVED pending owner visual review',views:[],errors,passed:false};
try{
 const deadline=Date.now()+40000;
 while(true){if(err)throw err;try{if((await fetch(url,{signal:AbortSignal.timeout(1200)})).ok)break;}catch{}if(Date.now()>deadline)throw Error('Vite boot timeout '+logs);await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:850}});page.setDefaultTimeout(90000);
 page.on('pageerror',e=>errors.push('PAGE '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text())});
 page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url());});
 await page.goto(url);await page.waitForFunction(()=>window.__r06?.snapshot().ready,{timeout:90000});
 const initial=await page.evaluate(()=>window.__r06.snapshot());
 assert.equal(initial.sourceMoss,'moss_01');assert.equal(initial.sourceR05,'forest_leaves_02');
 assert.equal(initial.verifiedMossFiles,6);assert.equal(initial.verifiedGroundMaps,3);
 assert(initial.trueSourceMesh&&initial.sameGroundMaterialAndGeometry);
 assert.equal(initial.frondPrototypes,12);assert.equal(initial.originalSourceTriangles,204);
 assert.equal(initial.instanceCount,576);assert(initial.instancedMoss>=5000&&initial.instancedMoss<=15000);
 assert.equal(initial.terrainSourceTriangles,26912);
 for(const id of ['walking','oblique','macro','overhead']){
  await page.evaluate(v=>window.__r06.setView(v),id);
  await page.evaluate(()=>window.__r06.setMode('A'));
  const a=await page.evaluate(()=>window.__r06.capture());
  const base=await page.evaluate(()=>window.__r06.snapshot());
  await writeFile(out+'/'+id+'-a-R05-verified-pbr.png',Buffer.from(a.split(',')[1],'base64'));
  await page.evaluate(()=>window.__r06.setMode('B'));
  const b=await page.evaluate(()=>window.__r06.capture());
  const cand=await page.evaluate(()=>window.__r06.snapshot());
  await writeFile(out+'/'+id+'-b-R06-genuine-moss.png',Buffer.from(b.split(',')[1],'base64'));
  assert.notEqual(a,b,'Original glTF fronds did not visibly affect view '+id);
  assert.equal(base.terrainSourceTriangles,cand.terrainSourceTriangles);
  assert(cand.renderer.calls<=18,'Unexpected moss instancing draw calls: '+id);
  assert(cand.renderer.triangles<=42000,'Moss exceeds mobile-first pilot source triangle budget '+id);
  assert(cand.renderer.triangles>base.renderer.triangles,'Moss has no real triangles in '+id);
  await page.evaluate(()=>window.__r06.setMode('A'));
  const restored=await page.evaluate(()=>window.__r06.capture());
  assert.equal(restored,a,'Baseline pixels changed after moss toggle: '+id);
  report.views.push({id,baseline:base.renderer,candidate:cand.renderer,
   baseSha256:sha(a),candidateSha256:sha(b),pixelIdenticalRestore:true});
  console.log('R06_REAL_WEBGL',JSON.stringify(report.views.at(-1)));
 }
 await page.evaluate(()=>window.__r06.dispose());
 assert.equal((await page.evaluate(()=>window.__r06.snapshot())).ready,false);
 assert.deepEqual(errors,[]);
 report.snapshot=initial;report.passed=true;
}catch(e){report.error=String(e?.stack??e);console.error(e);process.exitCode=1;}
finally{report.viteLogs=logs;await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser?.close();server.kill();}
