// Baseline and A/B diagnostic in genuine Chromium WebGL — never generated concept imagery.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdir,writeFile,readFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { resolve } from 'node:path';
const root=process.cwd(),out=resolve(root,'shadow-evidence');
const phase=process.env.SHADOW_PHASE??'before';
if(!['before','after'].includes(phase))throw Error('SHADOW_PHASE must be before or after');
await mkdir(out,{recursive:true});
const server=await createServer({root,logLevel:'error',server:{port:4174,host:'127.0.0.1',strictPort:true}});
let browser;
try{
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push('pageerror: '+String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
 await page.goto('http://127.0.0.1:4174/shadow.html',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>Boolean(window.__shadowLab?.frame>3),{timeout:30000});
 const rows=[];
 for(const variant of [0,1,2]){
  for(const lod of ['near','mid','far','xfar']){
   for(const mode of ['natural','forced-default','manual-alpha']){
    await page.evaluate(({variant,lod,mode})=>window.__shadowLab.setConfig({variant,lod,mode}),{variant,lod,mode});
    const n=await page.evaluate(()=>window.__shadowLab.frame);
    await page.waitForFunction(v=>window.__shadowLab.frame>=v+4,n,{timeout:90000});
    const row=await page.evaluate(()=>window.__shadowLab.inspect());
    rows.push(row);
    // identical canvas region, same camera and lighting for every setting.
    await page.locator('canvas').screenshot({path:resolve(out,`${phase}-birch${variant}-${lod}-${mode}.png`)});
   }
  }
 }
 // Negative control: default depth must differ from alpha-aware shadow output.
 // Positive control: once corrected, natural and manual-alpha must be identical.
 const pixelComparisons=[];
 const readPng=async name=>PNG.sync.read(await readFile(resolve(out,name)));
 for(const variant of [0,1,2]){
  for(const lod of ['near','mid','far','xfar']){
   const prefix=`${phase}-birch${variant}-${lod}-`;
   const normal=await readPng(prefix+'natural.png');
   const control=await readPng(prefix+'forced-default.png');
   const manual=await readPng(prefix+'manual-alpha.png');
   const changed=(a,b)=>{if(a.width!==b.width||a.height!==b.height)throw Error('Dimension mismatch');let n=0;for(let i=0;i<a.data.length;i+=4){if(Math.abs(a.data[i]-b.data[i])>10||Math.abs(a.data[i+1]-b.data[i+1])>10||Math.abs(a.data[i+2]-b.data[i+2])>10)n++}return n;};
   const controlDifference=changed(normal,control),referenceDifference=changed(normal,manual);
   const shadowEffect=changed(manual,control);
   if(shadowEffect<3000)throw Error(`Shadow alpha does not materially alter render: ${variant}/${lod}, changed pixels=${shadowEffect}`);
   if(phase==='before'&&controlDifference!==0)throw Error('Original natural path differs from default negative control');
   if(phase==='after'&&(controlDifference<3000||referenceDifference!==0))throw Error(`Depth assignment not effective for ${variant}/${lod}, default diff=${controlDifference}, manual diff=${referenceDifference}`);
   pixelComparisons.push({variant,lod,defaultVsNatural:controlDifference,manualVsNatural:referenceDifference,manualVsDefault:shadowEffect});
  }
 }
 const lifecycle=await page.evaluate(async()=>{
  const {createBirchFamily}=await import('/src/index.ts');
  const original=window.__shadowLab.family;
  const depth=original.material.userData.vegetationDepth;
  const map=original.material.map;
  let depthDisposals=0,mapDisposals=0;
  depth.addEventListener('dispose',()=>depthDisposals++);
  map.addEventListener('dispose',()=>mapDisposals++);
  const companion=createBirchFamily();
  if(companion.material!==original.material)throw Error('Material cache not shared');
  for(const variant of [0,1,2])for(const lod of ['near','mid','far','xfar']){
   const m=companion.createMesh(variant,lod);
   if(m.customDepthMaterial!==depth)throw Error('Depth not shared: '+variant+'/'+lod);
  }
  companion.dispose();
  if(depthDisposals||mapDisposals)throw Error('Shared materials disposed while retained');
  original.dispose();
  if(depthDisposals!==1||mapDisposals!==1)throw Error('Last owner did not dispose depth+atlas exactly once');
  const fresh=createBirchFamily();
  if(fresh.material===original.material||fresh.material.userData.vegetationDepth===depth)throw Error('Reused disposed material after recreation');
  const rebuilt=fresh.createMesh(0,'near');
  if(rebuilt.customDepthMaterial!==fresh.material.userData.vegetationDepth)throw Error('Recreated family lost depth contract');
  window.__shadowLab.scene.remove(window.__shadowLab.mesh);
  window.__shadowLab.scene.add(rebuilt);
  window.__shadowLab.renderer.render(window.__shadowLab.scene,window.__shadowLab.camera);
  fresh.dispose();
  return {depthAndAtlasReleasedOnce:true,sharedWhileOwned:true,recreatedNewDepth:true,renderedRecreatedTree:true};
 });
 await writeFile(resolve(out,`${phase}-metrics.json`),JSON.stringify({phase,rows,pixelComparisons,lifecycle,errors},null,2));
 if(errors.length)throw Error(errors.join('\n'));
 if(rows.some(x=>!x.shadowEnabled||!x.depthExists||!x.geometryShared))throw Error('Shadow pipeline incomplete');
 console.log(JSON.stringify({phase,frames:rows.length,gl:rows[0].gl,modes:rows.slice(0,3),errors}));
}finally{await browser?.close();await server.close()}
