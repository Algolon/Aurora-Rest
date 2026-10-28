import {chromium} from 'playwright';
import {writeFile,mkdir,readFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.argv[2]??'docs/env-nature-r02/evidence';
const base=process.argv[3]??'http://127.0.0.1:4362/env-nature-r02.html';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const sha=x=>createHash('sha256').update(x).digest('hex');
const report={milestone:'ENV-NATURE-R02',evidence:'Unretouched Three.js WebGL canvas PNG readback',viewport:{width:1100,height:700,dpr:1},fov:57,eyeHeight:1.75,seed:73129,records:[],matched:[],errors:[],limits:'Software WebGL. Timing is diagnostic, not a hardware desktop or Android pass. GPU VRAM unavailable; renderer geometry/texture counts are recorded.'};
const expectedManifest=JSON.parse(await readFile('docs/env-nature-r02/manifest.json','utf8'));
const save=()=>writeFile(out+'/review.json',JSON.stringify(report,null,2)+'\n');
let page;
try{
 page=await browser.newPage({viewport:{width:1100,height:700},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await page.goto(base,{waitUntil:'domcontentloaded'});
 const settle=async()=>{await page.waitForFunction(()=>window.__pop02Failure||window.__pop02?.snapshot().ready,null,{timeout:180000});assert.equal(await page.evaluate(()=>window.__pop02Failure),undefined);await page.evaluate(()=>window.__pop02.pause(true));};
 await settle();
 report.gl=await page.evaluate(()=>{const g=document.querySelector('canvas').getContext('webgl2'),e=g.getExtension('WEBGL_debug_renderer_info');return {version:g.getParameter(g.VERSION),renderer:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'unknown'}});
 const sourceFrom=process.argv[4];
 if(sourceFrom){const earlier=JSON.parse(await readFile(sourceFrom+'/review.json','utf8'));for(const old of earlier.records.filter(r=>r.mode==='source')){const placements=JSON.parse(await readFile(`${sourceFrom}/source-${old.view}-descriptors.json`,'utf8')).sort((a,b)=>a.id.localeCompare(b.id));const row={...old,sourceHash:sha(JSON.stringify(placements)),reusedFrom:sourceFrom};report.records.push(row);await copyFile(`${sourceFrom}/${old.file}`,`${out}/${old.file}`);}report.reusedSource='Original raw source PNGs preserved from first capture; complete sorted descriptors compared against final runtime';}
 for(const mode of sourceFrom?['authored']:['source','authored']){
  await page.evaluate(mode=>{window.__pop02.setComposition(mode);window.__pop02.pause(false)},mode);await settle();
  for(const view of ['shelter','discovery','breathing','reveal','overview']){
   await page.evaluate(view=>{window.__pop02.setView(view);window.__pop02.pause(false)},view);await settle();
   const data=await page.evaluate(()=>({snapshot:window.__pop02.snapshot(),placements:window.__pop02.placements(),combined:window.__pop02.combined(),authored:window.__pop02.authored(),ground:window.__pop02.groundArrays()}));
   assert.deepEqual(data.authored.placements,expectedManifest.placements,'Stale or divergent browser composition');
   data.placements.sort((a,b)=>a.id.localeCompare(b.id));
   const references=await page.evaluate(()=>{const api=window.__pop02;return [...new Set(api.placements().map(p=>p.chunk))].flatMap(key=>api.singleChunkReference(key))});references.sort((a,b)=>a.id.localeCompare(b.id));assert.deepEqual(data.placements,references,'Complete worker descriptors differ from independent source generator');
   const originals=new Map(data.placements.map(p=>[p.id,p]));
   for(const p of data.combined)if(!p.id.startsWith('env-r02:'))assert.deepEqual(p,originals.get(p.id),'Source descriptor mutated');
   assert.equal(data.combined.filter(p=>!p.id.startsWith('env-r02:')).length,data.placements.length);
   assert.equal(data.snapshot.ground.mode,'material');assert.equal(data.snapshot.error,null);
   if(view!=='overview')assert.ok(Math.abs(data.snapshot.camera[1]-data.snapshot.terrainY-1.75)<1e-7);
   const started=Date.now(),url=await page.evaluate(()=>window.__pop02.capture()),pixels=Buffer.from(url.split(',')[1],'base64');
   await writeFile(`${out}/${mode}-${view}.png`,pixels);
   const timing=await page.evaluate(()=>{const api=window.__pop02;api.resetTimings();const t=[];for(let i=0;i<8;i++){const start=performance.now();api.renderOnce();document.querySelector('canvas').getContext('webgl2').finish();t.push(performance.now()-start)}return t});
   const record={mode,view,file:`${mode}-${view}.png`,sha256:sha(pixels),readbackMs:Date.now()-started,sourceHash:sha(JSON.stringify(data.placements)),groundHash:sha(JSON.stringify(data.ground)),snapshot:data.snapshot,synchronousRenderMs:timing};
   report.records.push(record);await save();console.log(mode,view,JSON.stringify({source:data.placements.length,overlay:data.snapshot.overlayCount,renderer:data.snapshot.renderer}));
   if(mode==='source')await writeFile(`${out}/source-${view}-descriptors.json`,JSON.stringify(data.placements));
   if(mode==='authored'&&view==='overview')await writeFile(`${out}/runtime-manifest.json`,JSON.stringify(data.authored,null,2));
  }
 }
 for(const view of ['shelter','discovery','breathing','reveal','overview']){
  const a=report.records.find(r=>r.mode==='source'&&r.view===view),b=report.records.find(r=>r.mode==='authored'&&r.view===view);
  for(const key of ['sourceHash','groundHash'])assert.equal(a[key],b[key],view+' '+key);
  for(const key of ['camera','cameraQuaternion'])assert.deepEqual(a.snapshot[key].map(v=>v===0?0:v),b.snapshot[key].map(v=>v===0?0:v));
  assert.deepEqual(a.snapshot.scene,b.snapshot.scene);
  assert.equal(a.snapshot.ground.hash,b.snapshot.ground.hash);
  report.matched.push({view,fullOriginalDescriptorIdentity:true,groundGeometryIdentity:true,materialClassificationIdentity:true,cameraAndLightingIdentity:true,pixelIdentical:a.sha256===b.sha256});
 }
 assert.equal(report.errors.length,0,'Browser console/page errors');
 report.status='CAPTURED: art review required';
}catch(e){report.status='FAIL';report.failure=String(e);process.exitCode=1;console.error(e)}
finally{await save();await browser.close();}
