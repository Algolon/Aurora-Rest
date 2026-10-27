/** ENV-NATURE-R01 — real Three.js WebGL evidence and complete descriptor-delta ledger.
 * No screenshots are synthetic. A/B pages use identical camera, light, density,
 * scene source, seed and MAT-01; only authored tree suppression toggles.
 */
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out=process.argv[2]??'/tmp/env-nature-r01-evidence';
const url=process.argv[3]??'http://127.0.0.1:4353/env-nature-r01.html';
await mkdir(out,{recursive:true});
const sha=x=>createHash('sha256').update(x).digest('hex');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const views=['nature-glade','nature-turn','nature-reveal'];
const report={milestone:'ENV-NATURE-R01',status:'UNVERIFIED',source:'True WebGL, original R1/MAT/POP source, 1100x700 DPR1',matched:[],original:null,authored:null};
try{
 for(const mode of ['source','authored']){
  const page=await browser.newPage({viewport:{width:1100,height:700},deviceScaleFactor:1});
  page.setDefaultTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());});
  await page.goto(url+(mode==='source'?'?composition=source':''),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pop02?.snapshot()?.ready===true,{timeout:240000});
  await page.locator('#ground').selectOption('material');
  const rows=[];
  for(const view of views){
   await page.evaluate(view=>window.__pop02.setView(view),view);
   await page.waitForFunction(()=>window.__pop02?.snapshot()?.ready===true,{timeout:240000});
   await page.waitForTimeout(400);
   const evidence=await page.evaluate(()=>({snap:window.__pop02.snapshot(),instances:window.__pop02.placements()}));
   if(evidence.snap.composition!==mode||evidence.snap.ground?.mode!=='material'||!evidence.snap.sourceAssets||evidence.snap.error)throw Error('Wrong scene configuration: '+JSON.stringify(evidence.snap));
   await page.addStyleTag({content:'aside,.badge,.foot,#inspect{display:none!important}'});
   const img=await page.screenshot({path:out+'/'+mode+'-'+view+'.png',type:'png',timeout:180000,animations:'disabled'});
   rows.push({view,shotSha256:sha(img),camera:evidence.snap.camera,cameraQuaternion:evidence.snap.cameraQuaternion,terrainY:evidence.snap.terrainY,
    terrainSha256:evidence.snap.terrainSha256,materialHash:evidence.snap.ground.hash,render:evidence.snap.renderer,instances:evidence.instances});
   console.log(mode,view,'descriptors',evidence.instances.length,'pngSha',sha(img));
  }
  report[mode==='source'?'original':'authored']=rows;
  if(errors.length)throw Error('WebGL errors '+mode+': '+errors.join('; '));
  await page.close();
 }
 let totalRemoved=0;
 for(let i=0;i<views.length;i++){
  const a=report.original[i],b=report.authored[i];
  if(JSON.stringify(a.camera)!==JSON.stringify(b.camera)||JSON.stringify(a.cameraQuaternion)!==JSON.stringify(b.cameraQuaternion))throw Error('Camera mismatch '+a.view);
  if(a.terrainSha256!==b.terrainSha256||a.materialHash!==b.materialHash)throw Error('Terrain/MAT mismatch '+a.view);
  const baseline=new Map(a.instances.map(p=>[p.id,p]));
  const kept=new Set(b.instances.map(p=>p.id));
  for(const p of b.instances){const original=baseline.get(p.id);if(!original||JSON.stringify(p)!==JSON.stringify(original))throw Error('New or changed placement: '+p.id);}
  const removed=a.instances.filter(p=>!kept.has(p.id));
  if(removed.some(p=>!['birch','pine'].includes(p.family)))throw Error('Non-tree removal at '+a.view);
  totalRemoved+=removed.length;
  report.matched.push({view:a.view,sourceCount:a.instances.length,authoredCount:b.instances.length,removedCount:removed.length,
   removedByFamily:Object.fromEntries(['birch','pine'].map(f=>[f,removed.filter(p=>p.family===f).length])),
   originalSha256:sha(Buffer.from(JSON.stringify(a.instances))),authoredSha256:sha(Buffer.from(JSON.stringify(b.instances))),
   pixelIdentical:a.shotSha256===b.shotSha256,fullDescriptorIdentityForRetained:true,terrainAndMaterialIdentity:true,cameraIdentity:true});
 }
 if(totalRemoved<=0)throw Error('Pilot does not demonstrably remove any tree in review cameras');
 report.status='TECHNICAL PASS: source subset only; art acceptance pending';
 report.totalRemovalObservations=totalRemoved;
}catch(e){report.status='FAIL';report.error=String(e);process.exitCode=1;console.error(e);}
finally{for(const key of ['original','authored'])if(report[key])report[key]=report[key].map(({instances,...rest})=>rest);
 await writeFile(out+'/review.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
