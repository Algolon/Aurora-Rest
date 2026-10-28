/** MAT-ART-R01 bounded WebGL capture. One browser session, direct canvas PNG readback, no retouching.
 * Every capture of the same view must share camera pose, ground mesh, POP descriptors and scene settings;
 * only the ground variant, vegetation visibility and debug mask may differ.
 *   node tools/mat-art-r01/capture.mjs <plan: diagnosis|ab|refined> <out-dir> [base-url]
 * CHROME may select a compatible local Chromium/headless shell. */
import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const [plan='diagnosis',out='docs/mat-art-r01/evidence',base='http://127.0.0.1:4371/mat-art-r01.html']=process.argv.slice(2);
const ENV=['birch-interior','birch-edge','meadow-transition','open-grassland','overview'],CLOSE=['close-forest-floor','close-meadow','close-transition'];
const DIAG=['mat-01','diag-normal-off','diag-albedo-lowpass','diag-cavity-off','diag-meso-off','diag-scale-2x'];
/** [view, vegetation, variants[]]; a 'mask' capture (dominant-material debug) is added per view+vegetation. */
const PLANS={
 diagnosis:[...[...CLOSE,...ENV].map(v=>[v,false,DIAG]),...[...CLOSE,...ENV].map(v=>[v,true,['mat-01']])],
 ab:[...CLOSE.map(v=>[v,false,['mat-01','mat-art-r01']]),...ENV.map(v=>[v,true,['mat-01','mat-art-r01']]),...ENV.map(v=>[v,false,['mat-01','mat-art-r01']])],
};
PLANS.refined=PLANS.ab;
const steps=PLANS[plan];if(!steps)throw Error('Unknown plan '+plan);
await mkdir(out,{recursive:true});
const sha=x=>createHash('sha256').update(x).digest('hex');
const report={milestone:'MAT-ART-R01',plan,evidence:'Unretouched Three.js WebGL canvas PNG readback (toDataURL after gl.finish)',viewport:{width:1100,height:700,dpr:1},seed:73129,density:1,
 records:[],matched:[],errors:[],limits:'Software WebGL (SwiftShader). Timings are diagnostic only; no hardware desktop or Android claim.'};
const save=()=>writeFile(out+'/capture.json',JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:700},deviceScaleFactor:1});page.setDefaultTimeout(300000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto(base,{waitUntil:'domcontentloaded'});
 const settle=async()=>{await page.evaluate(()=>window.__matArt?.pause(false));await page.waitForFunction(()=>window.__matArtFailure||window.__matArt?.snapshot().ready,null,{timeout:300000});
  assert.equal(await page.evaluate(()=>window.__matArtFailure),undefined);await page.evaluate(()=>window.__matArt.pause(true));};
 await page.waitForFunction(()=>window.__matArt,null,{timeout:300000});await settle();
 if(plan!=='diagnosis'){const t=Date.now();await page.evaluate(async()=>{const m=await import('/src/mat-art-r01/load-stylized.ts');await window.__matArt.loadStylized(m.loadStylized);});report.stylizedLoadMs=Date.now()-t;}
 report.gl=await page.evaluate(()=>{const g=document.querySelector('canvas').getContext('webgl2'),e=g.getExtension('WEBGL_debug_renderer_info');return {version:g.getParameter(g.VERSION),renderer:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'unknown'};});
 report.browser=browser.version();console.log('READY',report.browser,report.gl.renderer);
 const shoot=async(file,meta)=>{const started=Date.now(),url=await page.evaluate(()=>window.__matArt.capture()),png=Buffer.from(url.split(',')[1],'base64');await writeFile(`${out}/${file}`,png);
  const snap=await page.evaluate(()=>window.__matArt.snapshot());const rec={...meta,file,sha256:sha(png),readbackMs:Date.now()-started,snapshot:snap};report.records.push(rec);return rec;};
 for(const [view,vegetation,list] of steps){
  await page.evaluate(([v,veg])=>{window.__matArt.setDebug('off');window.__matArt.setVariant('mat-01');window.__matArt.setVegetation(veg);window.__matArt.setView(v);},[view,vegetation]);await settle();
  const identity={placements:sha(JSON.stringify(await page.evaluate(()=>window.__matArt.placements()))),ground:await page.evaluate(()=>window.__matArt.groundHash())};
  const tag=vegetation?'env':'ground';
  for(const variant of list){
   await page.evaluate(v=>window.__matArt.setVariant(v),variant);await settle();
   const timing=await page.evaluate(()=>window.__matArt.timeRender(4));
   const rec=await shoot(`${view}--${tag}--${variant}.png`,{view,vegetation,variant,debug:'off',identity,synchronousRenderMs:timing});
   console.log(view,tag,variant,rec.snapshot.renderer.calls,rec.snapshot.renderer.triangles,timing.map(t=>t.toFixed(0)).join('/'));await save();
  }
  await page.evaluate(()=>{window.__matArt.setVariant('mat-01');window.__matArt.setDebug('dominant');});await settle();
  await shoot(`${view}--${tag}--mask.png`,{view,vegetation,variant:'mat-01',debug:'dominant',identity});
  await page.evaluate(()=>window.__matArt.setDebug('off'));
  // Matched-condition assertions across every capture of this view.
  const group=report.records.filter(r=>r.view===view&&r.vegetation===vegetation),first=group[0].snapshot;
  for(const r of group){const s=r.snapshot;
   assert.deepEqual(s.camera,first.camera,view+' camera');assert.deepEqual(s.cameraQuaternion.map(v=>v===0?0:v),first.cameraQuaternion.map(v=>v===0?0:v),view+' orientation');
   assert.deepEqual(s.scene,first.scene,view+' scene');assert.equal(s.fov,57);assert.equal(s.descriptorCount,first.descriptorCount);assert.deepEqual(s.counts,first.counts);
   assert.equal(s.ground.hash,first.ground.hash,'classification');assert.deepEqual(r.identity,group[0].identity,view+' placements/ground');assert.equal(s.error,null);
   if(s.view!=='overview')assert.ok(Math.abs(s.camera[1]-s.terrainY-1.75)<1e-6,'eye height');}
  const identity2={placements:sha(JSON.stringify(await page.evaluate(()=>window.__matArt.placements()))),ground:await page.evaluate(()=>window.__matArt.groundHash())};
  assert.deepEqual(identity2,identity,view+' identity drifted during variant switching');
  report.matched.push({view,vegetation,captures:group.length,cameraIdentity:true,sceneIdentity:true,placementSha256:identity.placements,groundMesh:identity.ground,classification:first.ground.hash});
 }
 // Lifecycle: repeated variant/profile switching must not leak MAT owners or textures.
 if(plan!=='diagnosis'){
  report.lifecycle=await page.evaluate(()=>{const api=window.__matArt,before=api.snapshot().renderer.memory,rows=[];
   for(let c=0;c<3;c++)for(const p of ['high','balanced','mobile'])for(const v of ['mat-01','mat-art-r01']){api.setProfile(p);api.setVariant(v);const s=api.renderOnce();rows.push({cycle:c,profile:p,variant:v,textures:s.renderer.memory.textures,programs:s.renderer.programs,owners:s.groundVariant.owners,variantOwners:s.groundVariant.variantOwners,gpuBytes:s.groundVariant.gpuBytes.total});}
   api.setProfile('high');api.setVariant('mat-01');return {before,rows,after:api.renderOnce().renderer.memory};});
  report.cleanup=await page.evaluate(()=>{window.__matArt.dispose();return window.__matArt.cleanupSnapshot();});
 }
 assert.deepEqual(report.errors,[],'Browser console/page errors');
 report.status='CAPTURED: art review required';
}catch(e){report.status='FAIL';report.failure=String(e?.stack??e);process.exitCode=1;console.error(e);}
finally{await save();await browser.close();}
