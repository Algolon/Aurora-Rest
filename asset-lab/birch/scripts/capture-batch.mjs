// Genuine browser visual + quantitative forest checks; retained only as CI artifact.
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {PNG} from 'pngjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),out=resolve(root,'benchmark-evidence');
await mkdir(out,{recursive:true});
const server=await createServer({root,server:{host:'127.0.0.1',port:4175,strictPort:true},logLevel:'error'});
let browser;
const notes=[],failures=[];
const stats={metadata:{},referenceComparison:{},capabilities:{},benchmarks:[],visibility:[],lodWalk:[],lifecycle:{}};
try {
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>failures.push('pageerror: '+String(e)));
 page.on('console',m=>{if(m.type()==='error')failures.push('console: '+m.text())});
 await page.goto('http://127.0.0.1:4175/benchmark.html',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>Boolean(window.__birchB2?.frames>3),{timeout:60000});
 // The diagnostic controls overlay the canvas. Exclude their changing text
 // from pixel-regression captures; the actual 3D view is unchanged.
 await page.locator('#controls').evaluate(el=>{el.style.visibility='hidden'});
 const check=async()=>{const x=await page.evaluate(()=>window.__birchB2.inspect());if(x.error)throw Error('Browser runtime error: '+x.error);return x};
 const config=async o=>{
  const x=await page.evaluate(o=>window.__birchB2.configure(o),o);
  const n=x.frames;await page.waitForFunction(prev=>window.__birchB2.frames>prev+2,n,{timeout:120000});
  return check();
 };
 const capture=async name=>{
  // preserveDrawingBuffer:true — capture the actual WebGL framebuffer directly;
  // Playwright's element screenshot waits for DOM stability and can time out
  // while heavy SwiftShader frame rendering is in flight.
  const uri=await page.evaluate(()=>window.__birchB2.renderer.domElement.toDataURL('image/png'));
  if(!uri.startsWith('data:image/png;base64,'))throw Error('Invalid WebGL capture');
  await writeFile(resolve(out,name+'.png'),Buffer.from(uri.split(',')[1],'base64'));
 };
 const samples=async(count=10)=>{
  return page.evaluate(async count=>{
   const lab=window.__birchB2,ms=[],cpu=[],calls=[],tris=[];
   lab.renderer.info.autoReset=false;
   for(let i=0;i<count+3;i++){
    await new Promise(requestAnimationFrame);
    const start=performance.now();
    const st=lab.forest.update(lab.camera);
    lab.renderer.info.reset();
    lab.renderer.render(lab.scene,lab.camera);
    const delta=performance.now()-start;
    if(i>=3){ms.push(delta);cpu.push(st.lastUpdateMs);calls.push(lab.renderer.info.render.calls);tris.push(lab.renderer.info.render.triangles)}
   }
   lab.renderer.info.autoReset=true;
   const sort=a=>[...a].sort((a,b)=>a-b);
   const pct=(a,p)=>{const s=sort(a);return s[Math.min(s.length-1,Math.ceil(s.length*p)-1)]};
   return {samples:count,frameCpuWallMedianMs:pct(ms,.5),frameCpuWallP95Ms:pct(ms,.95),
    updateCpuMedianMs:pct(cpu,.5),callsMedian:pct(calls,.5),trianglesMedian:pct(tris,.5)};
  },count);
 };
 const meta=await page.evaluate(()=>{const gl=window.__birchB2.renderer.getContext();return {ua:navigator.userAgent,webgl:String(gl.getParameter(gl.VERSION)),renderer:String(gl.getParameter(gl.RENDERER)),multiDraw:!!gl.getExtension('WEBGL_multi_draw'),pixels:[window.innerWidth,window.innerHeight]}});
 stats.metadata=meta;stats.capabilities=(await check()).capabilities;
 console.log('Real browser capabilities:',JSON.stringify(meta));
 // Forced unsupported multi-draw must fail rather than silently run fallback.
 if(!meta.multiDraw){
  let rejected=false;
  try{await page.evaluate(()=>window.__birchB2.configure({mode:'multidraw',population:1}))}catch(e){rejected=String(e).includes('WEBGL_multi_draw unavailable')}
  if(!rejected)throw Error('Forced unsupported multi-draw did not fail');
 }
 // Pixel-faithful single-tree comparison: same geometry, material, camera, sun, ground and tint.
 await config({mode:'instanced',population:1,view:'reference',shadows:true,culling:false,lod:'near',angle:25});
 await capture('reference-single-tree');
 const reference=PNG.sync.read(await readFile(resolve(out,'reference-single-tree.png')));
 await config({mode:'instanced',population:1,view:'overview',shadows:true,culling:false,lod:'near',angle:25});
 // Ensure both captures have *exactly* the same camera; view is a camera preset.
 await page.evaluate(()=>window.__birchB2.moveCamera([Math.sin(25*Math.PI/180)*17,11,Math.cos(25*Math.PI/180)*17]));
 await capture('instanced-single-tree');
 const instanced=PNG.sync.read(await readFile(resolve(out,'instanced-single-tree.png')));
 let changed=0,peak=0;
 for(let k=0;k<reference.data.length;k+=4){
  const diff=Math.max(Math.abs(reference.data[k]-instanced.data[k]),Math.abs(reference.data[k+1]-instanced.data[k+1]),Math.abs(reference.data[k+2]-instanced.data[k+2]));
  if(diff>12)changed++;peak=Math.max(peak,diff);
 }
 stats.referenceComparison={changedPixelsAbove12:changed,totalPixels:reference.width*reference.height,peakChannelDifference:peak};
 if(changed>25000)throw Error('Instanced single-tree visual mismatch: '+changed+' pixels');
 const depth=await page.evaluate(()=>window.__birchB2.getObjects().every(o=>o.customDepthMaterial===window.__birchB2.family.material.userData.vegetationDepth));
 if(!depth)throw Error('Instanced alpha-aware depth material not preserved');
 if(meta.multiDraw){
  await config({mode:'multidraw',population:1,view:'overview',shadows:true,culling:false,lod:'near',angle:25});
  await page.evaluate(()=>window.__birchB2.moveCamera([Math.sin(25*Math.PI/180)*17,11,Math.cos(25*Math.PI/180)*17]));
  await capture('multidraw-single-tree');
  const multi=PNG.sync.read(await readFile(resolve(out,'multidraw-single-tree.png')));
  let changedMulti=0;
  for(let k=0;k<reference.data.length;k+=4){
   if(Math.max(Math.abs(reference.data[k]-multi.data[k]),Math.abs(reference.data[k+1]-multi.data[k+1]),Math.abs(reference.data[k+2]-multi.data[k+2]))>12)changedMulti++;
  }
  stats.referenceComparison.multiDrawChangedPixelsAbove12=changedMulti;
  if(changedMulti>25000)throw Error('Multi-draw single-tree visual mismatch: '+changedMulti+' pixels');
  const depthOK=await page.evaluate(()=>window.__birchB2.getObjects().every(o=>o.customDepthMaterial===window.__birchB2.family.material.userData.vegetationDepth));
  if(!depthOK)throw Error('Multi-draw alpha-aware depth not assigned');
 }
 const instances=[100,500,1000];
 for(const mode of (meta.multiDraw?['instanced','multidraw']:['instanced'])){
  for(const population of instances){
   const x=await config({mode,population,view:'overview',lod:'auto',shadows:true,culling:true,angle:25});
   const measured=await samples(population===1000?7:10);
   // Separate actual renderer-counter submissions for shadow enabled/disabled
   // under identical instance lists. This is not a GPU-timing measurement.
   const passCalls=await page.evaluate(()=>{
    const lab=window.__birchB2,r=lab.renderer,s=lab.sun;
    const oldShadow=r.shadowMap.enabled,oldCast=s.castShadow,oldReset=r.info.autoReset;
    r.info.autoReset=false;r.info.reset();r.render(lab.scene,lab.camera);
    const both=r.info.render.calls;
    s.castShadow=false;r.shadowMap.enabled=false;
    r.info.reset();r.render(lab.scene,lab.camera);
    const cameraOnly=r.info.render.calls;
    s.castShadow=oldCast;r.shadowMap.enabled=oldShadow;r.info.autoReset=oldReset;
    return {combinedCalls:both,cameraPassCalls:cameraOnly,shadowPassCalls:both-cameraOnly};
   });
   const row={mode,population,stats:x.stats,drawMetrics:measured,passCalls};
   if(x.stats.registered!==population)throw Error('Instance registration mismatch');
   if(mode==='instanced'&&x.stats.renderGroups>9)throw Error('Instanced group count exceeds nine');
   stats.benchmarks.push(row);
   await capture(mode+'-'+population+'-overview');
   console.log('Population:',JSON.stringify({mode,population,groups:x.stats.renderGroups,calls:measured.callsMedian,triangles:measured.trianglesMedian}));
  }
 }
 // Explicit forced fallback and deterministic control paths.
 await config({mode:'instanced',population:500,view:'grove',lod:'auto',shadows:true,culling:true});
 await capture('instanced-500-grove');
 await config({mode:'instanced',population:100,view:'approach',lod:'auto',shadows:true,culling:true});
 await capture('instanced-100-approach');
 await config({mode:'instanced',population:100,view:'rotation',lod:'auto',shadows:true,culling:true,angle:25});
 const one=await check();await capture('instanced-100-rotation-25');
 await config({angle:205});const two=await check();await capture('instanced-100-rotation-205');
 stats.visibility.push({case:'rotation',before:one.stats,after:two.stats});
 if(one.stats.cameraVisible===two.stats.cameraVisible&&one.stats.shadowRetained===two.stats.shadowRetained)notes.push('Frustum rotations have same aggregate counts; verify differing visible IDs with dedicated regression.');
 await config({view:'shadow',angle:25});stats.visibility.push({case:'shadow',stats:(await check()).stats});await capture('instanced-100-shadows');
 await config({population:1,view:'boundary',shadows:true,lod:'auto',culling:false,angle:0});
 const waypoints=[30,24,26,40,33,38,66,60,58,34,18];
 for(let i=0;i<waypoints.length;i++){
  const z=waypoints[i];
  await page.evaluate(z=>window.__birchB2.moveCamera([0,6,z]),z);
  const state=await check();
  stats.lodWalk.push({z,lod:state.stats.lodCounts});
  if([0,3,6,9].includes(i))await capture('lod-path-'+i+'-'+z);
 }
 // Shared material ownership remains external to the batch; repeated create/dispose
 // exercises scene resources without disposing the approved family.
 stats.lifecycle=await page.evaluate(async()=>{
  const lab=window.__birchB2;
  const family=lab.family,tree=family.createMesh(0,'near'),depth=family.material.userData.vegetationDepth;
  const {createBirchBatch}=await import('/src/rendering/natureBatch.ts');
  const before=lab.scene.children.length;
  for(let i=0;i<5;i++){
   const b=createBirchBatch({scene:lab.scene,renderer:lab.renderer,family,mode:'instanced'});
   for(let j=0;j<14;j++)b.add({variant:(j%3),position:[j*1.2,0,-j]});
   b.update(lab.camera);
   b.dispose();
  }
  if(lab.scene.children.length!==before)throw Error('Batch scene object leak');
  if(tree.customDepthMaterial!==depth||!family.material.map)throw Error('Batch disposed borrowed family resources');
  return {repeatedCycles:5,sceneChildrenUnchanged:true,borrowedDepthIntact:true,borrowedAtlasIntact:true};
 });
 if(failures.length)throw Error(failures.join('\n'));
 await writeFile(resolve(out,'metrics.json'),JSON.stringify({...stats,notes,failures},null,2));
 console.log('ASSET-01B2 browser benchmark PASS',JSON.stringify({capabilities:meta,benchmarks:stats.benchmarks.map(r=>({mode:r.mode,n:r.population,calls:r.drawMetrics.callsMedian,groups:r.stats.renderGroups})),reference:stats.referenceComparison,lifecycle:stats.lifecycle}));
}finally{await browser?.close();await server.close();}
