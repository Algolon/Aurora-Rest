import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {PNG} from 'pngjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),out=resolve(root,'ground-cover-evidence');
await mkdir(out,{recursive:true});
const errors=[],shots=[],benchmarks=[],pairs=[];
let browser;
const assert=(b,m)=>{if(!b)throw Error(m)};
const server=await createServer({root,server:{host:'127.0.0.1',port:4192,strictPort:true},logLevel:'error'});
try{
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1100,height:720},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('pageerror '+e));
 page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text())});
 await page.goto('http://127.0.0.1:4192/ground-cover.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__groundCoverLab?.frames>0,{timeout:120000});
 const configure=async p=>{
  const result=await page.evaluate(p=>window.__groundCoverLab.configure(p),p);
  assert(!result.error,'Ground-cover showroom failed: '+result.error);return result;
 };
 const snap=async name=>{
  const b64=await page.evaluate(()=>window.__groundCoverLab.capture());
  assert(b64.startsWith('data:image/png;base64,'),'WebGL readback missing');
  await writeFile(resolve(out,name+'.png'),Buffer.from(b64.split(',')[1],'base64'));
  shots.push(name+'.png');
 };
 const meta=await page.evaluate(()=>{
  const l=window.__groundCoverLab,g=l.renderer.getContext();
  return {userAgent:navigator.userAgent,glVersion:String(g.getParameter(g.VERSION)),
   glRenderer:String(g.getParameter(g.RENDERER)),capabilities:l.capabilities,
   sourceShader:l.family.material.customProgramCacheKey(),
   grassSurface:l.family.material.userData.surface,frontSide:l.family.material.side===0,
   vertexColours:l.family.material.vertexColors,atlasSize:[
    l.family.material.map?.image.width,l.family.material.map?.image.height],
   shadowMap:[1024,1024],shadowFilter:'PCFSoftShadowMap'};
 });
 assert(meta.sourceShader.includes('flw-grass')&&meta.frontSide&&meta.vertexColours,'Original material invalid');
 assert(meta.atlasSize[0]===1024&&meta.atlasSize[1]===512,'Original atlas lost');
 const mode=meta.capabilities.multiDraw?'multidraw':'instanced';
 // Eight production perspectives, identical fixed lighting, density and seed.
 for(const view of ['top','walk','short','tall','seed','sedge','transition','approach']){
  await configure({view,mode:'instanced',population:2000,fade:'source',shadows:false,distance:true});
  await snap('2000-'+view);
 }
 for(const fade of ['extended','close']){
  await configure({view:'approach',fade});await snap('approach-'+fade);
 }
 const shadowOn=await configure({view:'walk',population:500,fade:'source',shadows:true});
 await snap('500-shadows-on');
 const shadowOff=await configure({shadows:false});await snap('500-shadows-off');
 const shadowComparison={onCalls:shadowOn.calls,offCalls:shadowOff.calls,
   onTriangles:shadowOn.triangles,offTriangles:shadowOff.triangles,
   shadowOnlyCalls:shadowOn.calls-shadowOff.calls};
 // Deterministic population matrix. At 5,000 use shadow-free walking view only.
 for(const population of [100,500,2000,5000]){
  for(const candidate of [...new Set(['instanced',mode])]){
   const p=await configure({mode:candidate,population,view:'walk',shadows:false,fade:'source',distance:true,culling:true});
   const turn=await page.evaluate(()=>{
    const l=window.__groundCoverLab;
    return {front:l.moveCamera([0,1.68,5],[0,.3,-5]),
      turn:l.moveCamera([0,1.68,5],[6,.3,4]),
      return:l.moveCamera([0,1.68,7.2],[0,.42,-1.5])};
   });
   const renderSamples=await page.evaluate(()=>{
    const l=window.__groundCoverLab,values=[];
    for(let i=0;i<5;i++){l.capture();values.push(l.inspect().renderMs)}
    return values;
   });
   const sorted=[...renderSamples].sort((a,b)=>a-b);
   const row={population,mode:candidate,standing:p,paths:turn,renderSubmissionMs:renderSamples,
    medianSubmissionMs:sorted[2],p95SubmissionMs:sorted[4]};
   benchmarks.push(row);
   assert(turn.return.stats.registered===population,'Lost instances');
   assert(turn.return.stats.renderGroups<=(candidate==='instanced'?4:1),'Unbounded grass groups');
   if(population===500||population===2000){await snap('bench-'+population+'-'+candidate)}
  }
 }
 // Matched one-instance Mesh vs both GPU backends. Sample the shader both
 // at the origin and translated in world space to catch local-coordinate bugs.
 const parity=await page.evaluate(()=>{
  const l=window.__groundCoverLab,T=window.__groundCoverThree,make=window.__groundCoverMakeBatch;
  const originalShadow=l.renderer.shadowMap.enabled;l.renderer.shadowMap.enabled=false;
  const stage=new T.Scene();stage.background=new T.Color('#cfd9d1');
  stage.add(new T.HemisphereLight('#f1f8fc','#687464',2.1));
  const light=new T.DirectionalLight('#fff1d9',2.5);light.position.set(-2,5,4);stage.add(light);
  const camera=new T.PerspectiveCamera(44,1100/720,.02,30);
  const result=[];
  for(const x of [0,4.25])for(const variant of [0,1,2,3]){
   camera.position.set(x,1.0,2.4);camera.lookAt(x,.29,0);camera.updateMatrixWorld();
   const reference=l.family.createMesh(variant);reference.position.set(x,0,0);
   stage.add(reference);l.renderer.render(stage,camera);
   const source=l.renderer.domElement.toDataURL('image/png');reference.removeFromParent();
   for(const mode of ['instanced',...(l.capabilities.multiDraw?['multidraw']:[])]){
    const batch=make({scene:stage,renderer:l.renderer,family:l.family,mode,capacity:1,
      culling:false,distanceCulling:false,shadows:false});
    batch.add({variant,position:[x,0,0]});batch.update(camera);
    l.renderer.render(stage,camera);
    const render=l.renderer.domElement.toDataURL('image/png');
    result.push({x,variant,mode,source,render});
    batch.dispose();
   }
  }
  l.renderer.shadowMap.enabled=originalShadow;
  return result;
 });
 for(const entry of parity){
  const decode=s=>PNG.sync.read(Buffer.from(s.split(',')[1],'base64'));
  const a=decode(entry.source),b=decode(entry.render);
  assert(a.width===b.width&&a.height===b.height,'Parity image size differs');
  let changed=0,maxRgbDelta=0;
  for(let i=0;i<a.data.length;i+=4){
   const d=Math.max(Math.abs(a.data[i]-b.data[i]),Math.abs(a.data[i+1]-b.data[i+1]),Math.abs(a.data[i+2]-b.data[i+2]));
   maxRgbDelta=Math.max(maxRgbDelta,d);
   if(d>12)changed++;
  }
  pairs.push({x:entry.x,variant:entry.variant,mode:entry.mode,
   changedPixelsOver12:changed,maxRgbDelta,pixels:a.width*a.height});
  const slug='parity-'+entry.mode+'-v'+entry.variant+'-worldx'+entry.x;
  await writeFile(resolve(out,slug+'-source.png'),Buffer.from(entry.source.split(',')[1],'base64'));
  await writeFile(resolve(out,slug+'-batched.png'),Buffer.from(entry.render.split(',')[1],'base64'));
  assert(changed<=20,slug+' material/geometry mismatch '+changed+' pixels');
 }
 const lifecycle=await page.evaluate(async()=>{
  const l=window.__groundCoverLab,T=window.__groundCoverThree,make=window.__groundCoverMakeBatch;
  const {createGrassFamily}=await import('/src/grass/index.ts');
  const first=l.family,sourceMaterial=first.material,atlas=sourceMaterial.map;
  let disposeMaterial=0,disposeAtlas=0;
  sourceMaterial.addEventListener('dispose',()=>disposeMaterial++);
  atlas.addEventListener('dispose',()=>disposeAtlas++);
  const extraA=createGrassFamily(),extraB=createGrassFamily();
  if(extraA.material!==sourceMaterial||extraB.material!==sourceMaterial)throw Error('Shared family ownership broken');
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(52,1,.1,50);
  camera.position.set(0,2,5);camera.lookAt(0,0,0);
  const baseline=scene.children.length;
  let reallocationObserved=false;
  for(let n=0;n<6;n++){
   const batch=make({scene,renderer:l.renderer,family:first,
    mode:n%2===0?'instanced':l.capabilities.multiDraw?'multidraw':'instanced',
    capacity:64,culling:false,distanceCulling:false});
   for(let i=0;i<64;i++)batch.add({variant:i%4,position:[i*.22,0,0]});
   const stats=batch.update(camera);
   if(stats.reallocations>0)reallocationObserved=true;
   batch.dispose();batch.dispose();
   if(scene.children.length!==baseline)throw Error('Leaked grass scene object cycle '+n);
  }
  if(!reallocationObserved)throw Error('Instanced buffer growth not exercised');
  extraA.dispose();
  if(disposeMaterial||disposeAtlas)throw Error('Disposed material before last owner');
  extraB.dispose();
  if(disposeMaterial||disposeAtlas)throw Error('Disposed atlas while showroom owner remains');
  l.disposeBatch();first.dispose();
  if(disposeMaterial!==1||disposeAtlas!==1)throw Error('Final owner did not dispose exactly once');
  const fresh=createGrassFamily();
  if(fresh.material===sourceMaterial||fresh.material.map===atlas)throw Error('Reused dead grass resource');
  const batch=make({scene,renderer:l.renderer,family:fresh,mode:'instanced',capacity:4,culling:false,distanceCulling:false});
  batch.add({variant:2,position:[0,0,0]});batch.update(camera);
  scene.add(new T.HemisphereLight('#ffffff','#777777',1));
  l.renderer.render(scene,camera);
  batch.dispose();fresh.dispose();
  return {cycles:6,sceneObjectsReturnToBaseline:true,sharedOwners:true,
   prematureDispose:false,finalOwnerDisposals:{material:disposeMaterial,atlas:disposeAtlas},
   reallocationObserved,recreateAndRender:true};
 });
 assert(errors.length===0,errors.join('\n'));
 await writeFile(resolve(out,'ground-cover-metrics.json'),JSON.stringify({meta,benchmarks,
   shadowComparison,parity:pairs,lifecycle,shots,errors},null,2));
 console.log('ASSET-01D2 WEBGL PASS',JSON.stringify({meta,benchmarks:benchmarks.length,
   parity:pairs,shots:shots.length,shadowComparison,lifecycle}));
 console.log('GROUND COVER BENCHMARK SUMMARY',JSON.stringify(benchmarks.map(b=>({
  population:b.population,mode:b.mode,visible:b.paths.return.stats.visible,
  culled:b.paths.return.stats.culled,fadeZone:b.paths.return.stats.fadeZone,
  triangles:b.paths.return.stats.visibleTriangles,renderGroups:b.paths.return.stats.renderGroups,
  drawcalls:b.paths.return.calls,bufferUpdates:b.paths.return.stats.bufferUpdates,
  reallocations:b.paths.return.stats.reallocations,
  cpuVisibilityUpdateMs:b.paths.return.stats.lastUpdateMs,
  renderSubmissionMedianMs:b.medianSubmissionMs,renderSubmissionP95Ms:b.p95SubmissionMs,
  geometryMemory:b.paths.return.memory.geometries,textureMemory:b.paths.return.memory.textures
 }))));
}finally{await browser?.close();await server.close()}
