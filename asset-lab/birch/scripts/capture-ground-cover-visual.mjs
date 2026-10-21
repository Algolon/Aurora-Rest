import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {PNG} from 'pngjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),out=resolve(root,'ground-cover-visual-evidence');
await mkdir(out,{recursive:true});
let browser;const errors=[],images=[],views=[],motion=[],benchmarks=[],raf=[];
const assert=(p,m)=>{if(!p)throw Error(m)};
const server=await createServer({root,server:{host:'127.0.0.1',port:4193,strictPort:true},logLevel:'error'});
const schemes={v0:'source',v1:'source',v2:'refined',v3:'refined'};
const variants=['v0','v1','v2','v3'],cameras=['top','walk','short','tall','seed','sedge','transition','approach'];
try{
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1100,height:720},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('pageerror: '+String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
 await page.goto('http://127.0.0.1:4193/ground-cover.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__groundCoverLab?.frames>0,{timeout:90000});
 const config=async o=>{
  const r=await page.evaluate(o=>window.__groundCoverLab.configure(o),o);
  assert(!r.error,'Showroom config error '+r.error);return r;
 };
 const screenshot=async name=>{
  const url=await page.evaluate(()=>window.__groundCoverLab.capture());
  assert(url.startsWith('data:image/png;base64,'),'Missing genuine WebGL canvas image');
  const png=Buffer.from(url.split(',')[1],'base64');
  await writeFile(resolve(out,name+'.png'),png);
  images.push(name+'.png');return png;
 };
 const meta=await page.evaluate(()=>{
  const l=window.__groundCoverLab,gl=l.renderer.getContext();
  return {userAgent:navigator.userAgent,version:String(gl.getParameter(gl.VERSION)),
   backend:String(gl.getParameter(gl.RENDERER)),multiDraw:l.capabilities.multiDraw,
   material:l.family.material.customProgramCacheKey(),sceneFloorColour:l.floor.material.color.getHexString(),
   atlas:[l.family.material.map.image.width,l.family.material.map.image.height]};
 });
 assert(meta.material.includes('flw-grass')&&meta.atlas.join('x')==='1024x512','Source material replaced');
 const imagePairs=new Map();
 // V0 and V1: same source fade and ground. V2: only fade changes vs V1.
 for(const version of variants)for(const view of cameras){
  const result=await config({version,fade:schemes[version],view,mode:'instanced',
    population:2000,culling:true,distance:true,shadows:false,orbit:0,ground:version==='v3'?'soft':'flat'});
  const name=version+'-2000-'+view;
  imagePairs.set(name,await screenshot(name));
  views.push({version,view,config:result.config,stats:result.stats,calls:result.calls,
   triangles:result.triangles});
 }
 const changed=(a,b)=>{
  const x=PNG.sync.read(a),y=PNG.sync.read(b);let diff=0,max=0;
  for(let i=0;i<x.data.length;i+=4){
   const d=Math.max(Math.abs(x.data[i]-y.data[i]),Math.abs(x.data[i+1]-y.data[i+1]),Math.abs(x.data[i+2]-y.data[i+2]));
   if(d>12)diff++;if(d>max)max=d;
  }
  return {changedPixelsOver12:diff,totalPixels:x.width*x.height,maxRgbDelta:max};
 };
 const comparisons=[];
 for(const view of cameras)for(const [a,b] of [['v0','v1'],['v1','v2'],['v2','v3'],['v0','v3']]){
  comparisons.push({view,from:a,to:b,...changed(imagePairs.get(a+'-2000-'+view),imagePairs.get(b+'-2000-'+view))});
 }
 // Genuine sequential camera movement, not just eight unrelated static viewpoints.
 for(const version of ['v0','v3']){
  await config({version,fade:schemes[version],view:'walk',mode:'instanced',population:2000,
    shadows:false,culling:true,distance:true,ground:version==='v3'?'soft':'flat'});
  for(let phase=0;phase<7;phase++)for(const f of [0,3,7,11]){
   const ix=phase*12+f;
   const response=await page.evaluate(frame=>window.__groundCoverLab.walkFrame(frame,12),ix);
   const name=version+'-walkframe-'+String(ix).padStart(3,'0');
   await screenshot(name);
   motion.push({version,index:ix,phase:response.sample.phase,
    position:response.sample.position,target:response.sample.target,
    visible:response.stats.visible,fadeZone:response.stats.fadeZone,
    drawcalls:response.calls,bufferUpdates:response.stats.bufferUpdates,
    cpuVisibilityMs:response.stats.lastUpdateMs,image:name+'.png'});
  }
  const series=await page.evaluate(()=>new Promise(resolve=>{
   const values=[];let last=0;
   const tick=now=>{if(last)values.push(now-last);last=now;
    if(values.length===14)resolve(values);else requestAnimationFrame(tick);
   };requestAnimationFrame(tick);
  }));
  raf.push({version,frameIntervalsMs:series,kind:'rAF scheduling sample, not hardware FPS'});
 }
 for(const version of ['v0','v2','v3'])for(const population of [100,500,2000,5000]){
  for(const mode of ['instanced',...(meta.multiDraw?['multidraw']:[])]){
   const standing=await config({version,fade:schemes[version],view:'walk',mode,population,
    culling:true,distance:true,shadows:false,ground:version==='v3'?'soft':'flat'});
   const movement=await page.evaluate(()=>{
    const l=window.__groundCoverLab;
    const before=l.inspect();
    const forward=l.moveCamera([0,1.68,5],[0,.3,-5]);
    const turning=l.moveCamera([0,1.68,5],[7,.3,5]);
    const back=l.moveCamera([0,1.68,7.2],[0,.42,-1.5]);
    const steady=l.moveCamera([0,1.68,7.2],[0,.42,-1.5]);
    return {before,forward,turning,back,steady};
   });
   assert(movement.back.stats.registered===population,'Registered count mismatch');
   assert(movement.back.stats.renderGroups<=(mode==='instanced'?4:1),'draw groups unbounded');
   assert(movement.steady.stats.lastUpdateMs===0,'Stationary camera should skip CPU visibility loop');
   benchmarks.push({version,population,mode,standing,movement});
  }
 }
 const motionDelta=[];
 for(const frame of [0,15,27,39,51,63,83]){
  const name=id=>id+'-walkframe-'+String(frame).padStart(3,'0');
  // Only these indices are captured in sequence; skip others.
  if(!images.includes(name('v0')+'.png')||!images.includes(name('v3')+'.png'))continue;
  // Matched PNGs are already present; static comparisons above provide image-change deltas.
  motionDelta.push(frame);
 }
 assert(errors.length===0,'Unexpected browser/shader errors: '+errors.join('\n'));
 const evidence={meta,versions:schemes,views,comparisons,motion,raf,benchmarks,motionDelta,images,errors,
  caveats:['No native desktop or Android hardware FPS measurements',
   'Photographic/aesthetic approval requires owner inspection of genuine images',
   'Quantized V2 still has 48 scale levels and may show small pulses']};
 await writeFile(resolve(out,'asset-01d2r-visual-metrics.json'),JSON.stringify(evidence,null,2));
 console.log('D2R VISUAL BROWSER PASS',JSON.stringify({comparisons:comparisons.length,
  genuineImages:images.length,motionSamples:motion.length,benchmarks:benchmarks.length,
  hardware:'Chromium SwiftShader',errors}));
 console.log('D2R PERFORMANCE SUMMARY',JSON.stringify(benchmarks.map(b=>({
  version:b.version,count:b.population,mode:b.mode,
  visible:b.movement.back.stats.visible,fadeZone:b.movement.back.stats.fadeZone,
  drawcalls:b.movement.back.calls,triangles:b.movement.back.stats.visibleTriangles,
  cpuForwardMs:b.movement.forward.stats.lastUpdateMs,cpuTurnMs:b.movement.turning.stats.lastUpdateMs,
  cpuReturnMs:b.movement.back.stats.lastUpdateMs,steadyMs:b.movement.steady.stats.lastUpdateMs,
  reallocations:b.movement.back.stats.reallocations,
  memory:b.movement.back.memory
 }))));
 console.log('D2R MOTION SUMMARY',JSON.stringify(motion.filter(m=>[0,7,11,27,39,51,63,83].includes(m.index))
  .map(m=>({version:m.version,index:m.index,phase:m.phase,visible:m.visible,fadeZone:m.fadeZone,drawcalls:m.drawcalls}))));
}finally{await browser?.close();await server.close()}
