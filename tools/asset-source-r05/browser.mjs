/** R05 original publisher-verified CC0 material evaluated under real WebGL.
 * Always require actual downloaded texture maps, no synthetic visual fallback.
 */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.env.R05_OUTPUT??'/tmp/asset-source-r05',url='http://127.0.0.1:4305/asset-source-r05.html';
await mkdir(out,{recursive:true});
const source=JSON.parse(await readFile(out+'/source_provenance.json','utf8'));
if(!source.provenanceVerified||Object.values(source.maps).some(x=>!x.sourceVerified))throw Error('Publisher source provenance not verified');
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--config','vite.asset-source-r05.config.ts','--host','127.0.0.1','--port','4305','--strictPort']);
let browser,stop,log='',errors=[];server.stdout.on('data',x=>log+=x);server.stderr.on('data',x=>log+=x);server.on('error',e=>stop=e);server.on('exit',code=>stop=Error('Preview exited '+code));
const sha256=value=>createHash('sha256').update(value).digest('hex');
const report={milestone:'ASSET-SOURCE-R05',assetId:source.assetId,authenticDownloadedSource:true,license:source.license,maps:source.maps,views:[],errors,passed:false,artApproved:false,renderer:'Chromium SwiftShader, not hardware Android'};
try{
 const limit=Date.now()+45000;
 while(true){
  if(stop)throw stop;
  try{if((await fetch(url,{signal:AbortSignal.timeout(1000)})).ok)break;}catch{}
  if(Date.now()>limit)throw Error('Vite boot timeout '+log);await new Promise(r=>setTimeout(r,250));
 }
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:850}});page.setDefaultTimeout(90000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto(url);await page.waitForFunction(()=>window.__r05?.snapshot().ready,{timeout:90000});
 const initial=await page.evaluate(()=>window.__r05.snapshot());
 assert.equal(initial.assetId,source.assetId);assert.equal(initial.license,'CC0 1.0');
 assert.deepEqual(initial.sourceMaps.sort(),['diffuse','normal','roughness']);
 assert(initial.sharedGeometry&&initial.r04GeomUnchanged);
 assert.equal(initial.triangles,116*116*2,'same R04 position triangles');
 // Source image dimensions are inspected by actual Three.js loaded texture objects.
 const images=await page.evaluate(()=>{
  const mesh=Array.from(window.__r05?document.querySelectorAll('canvas'):[]);
  return {canvasCount:mesh.length};
 });assert.equal(images.canvasCount,1);
 for(const id of ['walking','oblique','macro','overhead']){
  await page.evaluate(id=>window.__r05.setView(id),id);await page.evaluate(()=>window.__r05.setMode('A'));
  const before=await page.evaluate(()=>window.__r05.snapshot());
  const a=await page.evaluate(()=>window.__r05.capture());await writeFile(out+'/'+id+'-a-procedural.png',Buffer.from(a.split(',')[1],'base64'));
  await page.evaluate(()=>window.__r05.setMode('B'));
  const candidate=await page.evaluate(()=>window.__r05.snapshot());
  const b=await page.evaluate(()=>window.__r05.capture());await writeFile(out+'/'+id+'-b-verified-source.png',Buffer.from(b.split(',')[1],'base64'));
  assert.notEqual(a,b,'Photo maps produced no pixel change in '+id);
  assert.equal(candidate.triangles,before.triangles);assert(candidate.sceneRender.calls<=3);
  assert(candidate.sceneRender.triangles<28000);
  await page.evaluate(()=>window.__r05.setMode('A'));
  const restored=await page.evaluate(()=>window.__r05.capture());
  assert.equal(restored,a,'A/B/A baseline pixels did not restore '+id);
  const data={id,rendererBaseline:before.sceneRender,rendererCandidate:candidate.sceneRender,geometryTriangles:candidate.triangles,aHash:sha256(a),bHash:sha256(b),aRestoredPixelIdentical:true};
  report.views.push(data);console.log('R05_VERIFIED_WEBGL',JSON.stringify(data));
 }
 await page.evaluate(()=>window.__r05.dispose());assert.equal((await page.evaluate(()=>window.__r05.snapshot())).ready,false);
 assert.deepEqual(errors,[]);report.passed=true;
}catch(err){report.failure=String(err?.stack??err);console.error(err);process.exitCode=1;}
finally{report.previewLog=log;await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser?.close();server.kill();}
