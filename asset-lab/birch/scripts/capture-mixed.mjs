// GitHub Actions real Chromium/WebGL evidence; no synthetic art.
// Test modes: FIDELITY=1 or BENCH_MODE=instanced|multidraw, BENCH_MIX=...
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {PNG} from 'pngjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd();
const fidelity=process.env.FIDELITY==='1';
const bm=process.env.BENCH_MODE??'instanced',comp=process.env.BENCH_MIX??'balanced';
const validMode=['instanced','multidraw'],validMix=['birch','pine','balanced','pine70'];
if(!fidelity&&(!validMode.includes(bm)||!validMix.includes(comp)))throw Error('Invalid benchmark matrix');
const out=resolve(root,'mixed-evidence',fidelity?'fidelity':bm+'-'+comp);
await mkdir(out,{recursive:true});
const errors=[],notes=[],data={test:fidelity?'fidelity':'benchmark',mode:bm,mix:comp,
 capabilities:{},baseline:{},pixels:{},rows:[],diagnostics:{},lifecycle:{},errors,notes};
const vite=await createServer({root,server:{host:'127.0.0.1',port:4177,strictPort:true},logLevel:'error'});
let browser;
const assert=(cond,msg)=>{if(!cond)throw Error(msg)};
try{
 await vite.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:960,height:600},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('pageerror '+String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text())});
 await page.goto('http://127.0.0.1:4177/mixed.html',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>Boolean(window.__mixedLab?.frames>3),{timeout:65000});
 const met=await page.evaluate(()=>{
  const l=window.__mixedLab,gl=l.renderer.getContext();
  return {version:String(gl.getParameter(gl.VERSION)),renderer:String(gl.getParameter(gl.RENDERER)),
   ua:navigator.userAgent,multiDraw:!!gl.getExtension('WEBGL_multi_draw'),size:[960,600],
   software:true,shadowMap:[768,768]};
 });
 data.capabilities=met;console.log('ASSET-01C2 CAPABILITIES '+JSON.stringify(met));
 const cfg=async p=>{
  const state=await page.evaluate(p=>window.__mixedLab.configure(p),p);
  assert(!state.error,'configure: '+state.error);
  const start=state.frames;
  await page.waitForFunction(n=>window.__mixedLab.frames>=n+2,start,{timeout:120000});
  const read=await page.evaluate(()=>window.__mixedLab.inspect());
  assert(!read.error,'runtime: '+read.error);return read;
 };
 const capture=async name=>{
  const url=await page.evaluate(()=>window.__mixedLab.capture());
  assert(url.startsWith('data:image/png;base64,'),'WebGL PNG capture missing');
  const dest=resolve(out,name+'.png');
  await writeFile(dest,Buffer.from(url.split(',')[1],'base64'));
  return dest;
 };
 const compare=async (a,b,threshold=12)=>{
  const left=PNG.sync.read(await readFile(resolve(out,a+'.png')));
  const right=PNG.sync.read(await readFile(resolve(out,b+'.png')));
  assert(left.width===right.width&&left.height===right.height,'Mismatch in screenshot sizes');
  let count=0,max=0;
  for(let i=0;i<left.data.length;i+=4){
   const delta=Math.max(Math.abs(left.data[i]-right.data[i]),
    Math.abs(left.data[i+1]-right.data[i+1]),Math.abs(left.data[i+2]-right.data[i+2]));
   if(delta>threshold)count++;max=Math.max(max,delta);
  }
  return {count,max,total:left.width*left.height,threshold};
 };
 const passCalls=()=>page.evaluate(()=>{
  const l=window.__mixedLab,r=l.renderer,s=l.sun,sh=r.shadowMap.enabled,cast=s.castShadow,reset=r.info.autoReset;
  r.info.autoReset=false;r.info.reset();l.capture();const total=r.info.render.calls,triangles=r.info.render.triangles;
  s.castShadow=false;r.shadowMap.enabled=false;r.info.reset();l.capture();
  const camera=r.info.render.calls;
  s.castShadow=cast;r.shadowMap.enabled=sh;r.info.autoReset=reset;
  return {camera,shadow:total-camera,total,renderedTriangles:triangles};
 });
 const sample=async()=>page.evaluate(async()=>{
  const l=window.__mixedLab,stamps=[];
  for(let j=0;j<8;j++)await new Promise(resolve=>requestAnimationFrame(t=>{stamps.push(t);resolve(t)}));
  const gaps=stamps.slice(1).map((v,i)=>v-stamps[i]).sort((a,b)=>a-b);
  const pct=(a,p)=>a[Math.min(a.length-1,Math.ceil(a.length*p)-1)];
  const updates=[];
  const start=l.camera.position.clone(),look=new (l.camera.position.constructor)(0,5,0);
  for(let i=0;i<5;i++){
   l.camera.position.copy(start).addScalar(.013*i);
   l.camera.lookAt(look);l.camera.updateMatrixWorld();
   updates.push(l.forest.update(l.camera).lastUpdateMs);
  }
  l.camera.position.copy(start);l.camera.lookAt(look);l.camera.updateMatrixWorld();l.forest.update(l.camera);
  updates.sort((a,b)=>a-b);
  return {frameIntervalSamples:gaps.length,frameIntervalMedianMs:pct(gaps,.5),frameIntervalP95Ms:pct(gaps,.95),
   visibilitySamples:updates.length,updateMedianMs:pct(updates,.5),updateP95Ms:pct(updates,.95)};
 });
 if(fidelity){
  // Every species uses EXACTLY the same light/camera/material/geometry for its
  // separate reference mesh and both optimized rendering paths.
  for(const species of ['birch','pine']){
   await cfg({mix:species,mode:'instanced',population:1,view:'reference',lod:'near',culling:false,shadows:true,angle:25});
   await capture(species+'-source-reference');
   for(const mode of met.multiDraw?['instanced','multidraw']:['instanced']){
    const state=await cfg({mix:species,mode,population:1,view:'single',lod:'near',culling:false,shadows:true,angle:25});
    await capture(species+'-'+mode+'-single');
    const cmp=await compare(species+'-source-reference',species+'-'+mode+'-single',12);
    data.pixels[species+'-'+mode]=cmp;
    assert(cmp.count<=100,'Source appearance regression '+species+'/'+mode+': '+JSON.stringify(cmp));
    const m=await page.evaluate(()=>window.__mixedLab.forest.getObjects(window.__mixedLab.config.mix)
     .every(o=>o.customDepthMaterial===window.__mixedLab.families[window.__mixedLab.config.mix].material.userData.vegetationDepth));
    assert(m,'Depth material missing '+species+'/'+mode);
   }
   // Reject solid foliage card shadows via the same-mesh depth negative control.
   for(const mode of met.multiDraw?['instanced','multidraw']:['instanced']){
    await cfg({mix:species,mode,population:1,view:'single',lod:'near',culling:false,shadows:true,angle:25});
    await capture(species+'-'+mode+'-shadow-alpha');
    await page.evaluate(s=>{
     const l=window.__mixedLab;l.forest.getObjects(s).forEach(o=>o.customDepthMaterial=undefined);l.sun.shadow.needsUpdate=true;
    },species);
    await capture(species+'-'+mode+'-shadow-opaque-negative');
    const cmp=await compare(species+'-'+mode+'-shadow-alpha',species+'-'+mode+'-shadow-opaque-negative',10);
    data.pixels[species+'-'+mode+'-shadow-negative']=cmp;
    assert(cmp.count>250,'No alpha shadow difference '+species+'/'+mode+': '+JSON.stringify(cmp));
    // Next configure replaces the now-test-only wrong backend material.
   }
  }
  // Compare mixed populations and human-level framing from BOTH paths.
  for(const population of [100,500,1000]){
   for(const mode of met.multiDraw?['instanced','multidraw']:['instanced']){
    const s=await cfg({mix:'balanced',mode,population,view:'overview',lod:'auto',culling:true,shadows:true,angle:25});
    await capture('balanced-'+population+'-'+mode+'-overview');
    assert(s.stats.registered===population,'Registration loss '+population);
    assert(s.stats.species.birch.registered+s.stats.species.pine.registered===population,'Wrong composition count');
   }
   if(met.multiDraw){
    const cmp=await compare('balanced-'+population+'-instanced-overview','balanced-'+population+'-multidraw-overview',12);
    data.pixels['mixed-'+population+'-backend-difference']=cmp;
    assert(cmp.count<6000,'Mixed forest pixel fidelity regression '+population+': '+cmp.count);
   }
  }
  for(const v of ['approach','grove','edge','rotation','lodwalk']){
   await cfg({mode:'instanced',mix:'pine70',population:500,view:v,angle:25,shadows:true,culling:true,lod:'auto'});
   await capture('pine70-500-'+v);
  }
  const rot=await cfg({mode:'instanced',mix:'balanced',population:100,view:'rotation',angle:25});
  const rot2=await cfg({angle:-130});
  data.diagnostics.rotation={before:rot.stats,after:rot2.stats};
  await capture('balanced-100-rotation-negative130');
  // Independent LOD state and reverse transitions on a stable two-species set.
  await cfg({mode:'instanced',mix:'balanced',population:100,view:'lodwalk',angle:0,culling:false});
  const lodPath=[];
  for(const d of [18,24,26,34,40,60,66,60,58,34,20]){
   const s=await page.evaluate(d=>{
    const l=window.__mixedLab;l.moveCamera([0,5,d],[0,5,0]);return l.inspect().stats;
   },d);
   lodPath.push({cameraZ:d,birch:s.species.birch.lodCounts,pine:s.species.pine.lodCounts});
  }
  data.diagnostics.lodPath=lodPath;
  // Multiplexing must not own/dispose either family's original source geometries.
  data.lifecycle=await page.evaluate(async()=>{
   const lab=window.__mixedLab,scene=lab.scene;
   const {createNatureBatch}=await import('/src/rendering/mixedForest.ts');
   const {createPineFamily}=await import('/src/pine/index.ts');
   const {createBirchFamily}=await import('/src/index.ts');
   const before=scene.children.length;
   const depth=lab.families.birch.material.userData.vegetationDepth;
   const atlas=lab.families.birch.material.map;
   const pineColor=lab.families.pine.material.color.clone(),birchColor=lab.families.birch.material.color.clone();
   let depthDisposals=0,atlasDisposals=0;
   depth.addEventListener('dispose',()=>depthDisposals++);
   atlas.addEventListener('dispose',()=>atlasDisposals++);
   for(let run=0;run<5;run++){
    const f=createNatureBatch({scene,renderer:lab.renderer,families:lab.families,mode:'instanced',forcedLod:'near'});
    for(let i=0;i<19;i++)f.add({species:i%2?'pine':'birch',variant:(i%3),position:[i*1.5,0,-i]});
    f.update(lab.camera);f.dispose();
   }
   if(scene.children.length!==before)throw Error('Repeated mixed forests leak scene children');
   if(depthDisposals||atlasDisposals)throw Error('Batch disposed owned shared depth/atlas');
   if(!lab.families.birch.material.color.equals(birchColor)||!lab.families.pine.material.color.equals(pineColor))
    throw Error('Cross-species color material mutated');
   const extraBirch=createBirchFamily(),extraPine=createPineFamily();
   if(extraBirch.material!==lab.families.birch.material||extraPine.material!==lab.families.pine.material)
    throw Error('Material cache not shared across families');
   extraBirch.dispose();extraPine.dispose();
   if(depthDisposals||atlasDisposals)throw Error('Extra owners released existing live cache');
   lab.disposeForest();
   Object.values(lab.references).forEach(m=>m.removeFromParent());
   lab.families.pine.dispose();
   if(depthDisposals||atlasDisposals)throw Error('Pine last owner freed resources while birch still active');
   lab.families.birch.dispose();
   if(depthDisposals!==1||atlasDisposals!==1)throw Error('Shared resources not disposed exactly once');
   const birch=createBirchFamily(),pine=createPineFamily();
   if(birch.material.map===atlas||pine.material.map===atlas||birch.material.userData.vegetationDepth===depth)
    throw Error('Cache reused disposed resources');
   const newForest=createNatureBatch({scene,renderer:lab.renderer,families:{birch,pine},mode:'instanced',culling:false});
   newForest.add({species:'birch',variant:0,position:[0,0,0]});
   newForest.add({species:'pine',variant:0,position:[5,0,0]});
   newForest.update(lab.camera);lab.renderer.render(scene,lab.camera);
   newForest.dispose();pine.dispose();birch.dispose();
   if(scene.children.length!==before-2-18-18&&scene.children.length!==before-2-18)
    throw Error('Rebuilt scene contains leaked objects');
   return {repeatedCycles:5,sceneCountRestored:true,borrowedMaterialsPreserved:true,
    depthDisposedExactlyOnce:true,atlasDisposedExactlyOnce:true,speciesColorsUnchanged:true,
    reallocatedSourceCache:true,recreatedMixedBrowserRender:true};
  });
  // TODO no more captures once showroom families are deliberately disposed.
 }else{
  if(bm==='multidraw'&&!met.multiDraw){
   data.diagnostics.unavailable='WEBGL_multi_draw missing, not tested';
   console.log('MULTIDRAW UNAVAILABLE — not a pass or failure for hardware capability');
  }else{
   for(const population of [100,500,1000]){
    const state=await cfg({mode:bm,mix:comp,population,view:'overview',
     lod:'auto',angle:25,culling:true,shadows:true});
    assert(state.activeMode===bm,'Mode silently substituted');
    assert(state.stats.registered===population,'Instance count mismatch');
    assert(state.stats.species.birch.registered+state.stats.species.pine.registered===population,'Species mismatch');
    const counts=await passCalls();
    const timing=await sample();
    const stats=state.stats;
    const activeSpecies=Number(stats.species.birch.registered>0)+Number(stats.species.pine.registered>0);
    if(bm==='multidraw')assert(stats.renderGroups<=activeSpecies,'Multi-draw uses extra material batches');
    else assert(stats.renderGroups<=18,'Fallback uses too many geometry groups');
    // In both backends, drawcalls are bounded by material/geometry groups.
    assert(counts.total<=2*stats.renderGroups+1,'Unexpected per-instance drawcall fallback');
    data.rows.push({mode:bm,composition:comp,population,activeSpecies,stats,passes:counts,timing});
    console.log('MIXED BENCH ROW '+JSON.stringify({
     mode:bm,mix:comp,n:population,birch:stats.species.birch.registered,pine:stats.species.pine.registered,
     camera:counts.camera,shadow:counts.shadow,total:counts.total,groups:stats.renderGroups,
     frameMedianMs:timing.frameIntervalMedianMs,frameP95Ms:timing.frameIntervalP95Ms}));
    // Real full-resolution evidence on matched settings for each matrix path.
    if(population===500)await capture(bm+'-'+comp+'-500-overview');
   }
  }
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile(resolve(out,'metrics.json'),JSON.stringify(data,null,2));
 console.log('ASSET-01C2 '+(fidelity?'FIDELITY':'BENCHMARK')+' PASS '+JSON.stringify({mode:bm,mix:comp,
  dataRows:data.rows.length,pixels:data.pixels,lifecycle:data.lifecycle}));
}finally{await browser?.close();await vite.close()}
