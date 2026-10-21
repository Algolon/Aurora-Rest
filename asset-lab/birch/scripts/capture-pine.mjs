// ASSET-01C1 genuine Three.js Chromium/WebGL pine visual QA.
// Reuses the validated existing showroom interactions; saves originals, no concept art.
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),out=resolve(root,'pine-evidence');
await mkdir(out,{recursive:true});
const server=await createServer({root,server:{host:'127.0.0.1',port:4176,strictPort:true},logLevel:'error'});
let browser;
try{
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push('pageerror '+String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text())});
 await page.goto('http://127.0.0.1:4176/pine.html',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>Boolean(window.__auroraPineLab?.frame>3),{timeout:40000});
 const wait=async()=>{const f=await page.evaluate(()=>window.__auroraPineLab.frame);await page.waitForFunction(n=>window.__auroraPineLab.frame>=n+3,f,{timeout:90000})};
 const select=async(id,value)=>{await page.locator('#'+id).selectOption(String(value));await wait()};
 const view=async(v)=>{await page.locator('[data-view="'+v+'"]').click();await wait()};
 const capture=async(name)=>{await wait();await page.locator('canvas').screenshot({path:resolve(out,name+'.png'),timeout:90000})};
 const rows=[],comparison={};
 await select('light','day');await select('variant','all');await view('threequarter');await capture('pine-all-three-daylight');
 await select('light','neutral');await capture('pine-all-three-neutral');
 for(const v of ['0','1','2']){
  await select('variant',v);await select('lod','near');
  for(const angle of ['front','side','threequarter']){await view(angle);await capture('pine-'+v+'-near-'+angle)}
  await view('close');await capture('pine-'+v+'-bark-close');
  await view('needles');await capture('pine-'+v+'-needle-close');
  for(const lod of ['mid','far','xfar']){
   await select('lod',lod);await view('threequarter');await capture('pine-'+v+'-'+lod+'-threequarter');
  }
 }
 const result=await page.evaluate(async()=>{
  const lab=window.__auroraPineLab;
  const {createBirchFamily}=await import('/src/index.ts');
  const {createPineFamily}=await import('/src/pine/index.ts');
  const birch=createBirchFamily(),pineA=createPineFamily(),pineB=createPineFamily();
  const originalBirchColor=birch.material.color.clone();
  const pineDepth=lab.family.material.userData.vegetationDepth;
  const pineMap=lab.family.material.map;
  if(pineA.material!==lab.family.material||pineB.material!==lab.family.material)throw Error('Pine cache not shared');
  if(birch.material===pineA.material)throw Error('Pine and birch colour material coupled');
  if(birch.material.map!==pineA.material.map)throw Error('Pine/birch not sharing atlas');
  for(const v of [0,1,2])for(const lod of ['near','mid','far','xfar']){
   const m=pineA.createMesh(v,lod);
   if(m.customDepthMaterial!==pineDepth)throw Error('Depth missing for '+v+'/'+lod);
   if(pineA.getGeometry(v,'far')!==pineA.getGeometry(v,'xfar'))throw Error('far/xfar not shared');
  }
  const originalPine=lab.family.material.color.clone();
  pineA.dispose();pineB.dispose();birch.dispose();
  if(!lab.family.material.map||!lab.family.material.userData.vegetationDepth)throw Error('Premature resource release');
  if(!lab.family.material.color.equals(originalPine))throw Error('Pine shared colour changed');
  if(originalBirchColor.getHexString()!=='97a94c')throw Error('Birch tint changed');
  const gl=lab.renderer.getContext();
  return {gl:String(gl.getParameter(gl.VERSION)),renderer:String(gl.getParameter(gl.RENDERER)),
   pineColor:originalPine.getHexString(),birchColor:originalBirchColor.getHexString(),
   triangles:[0,1,2].map(v=>['near','mid','far'].map(l=>(lab.family.getGeometry(v,l).index?.count??0)/3)),
   farXfarShared:[0,1,2].every(v=>lab.family.getGeometry(v,'far')===lab.family.getGeometry(v,'xfar')),
   sharedAtlas:true,separateSpeciesColourMaterial:true,sharedPineMaterial:true,correctDepthAcrossLods:true,
   pineAtlasStillActive:!!pineMap,lifecycleSafe:true};
 });
 // Real shadow negative control: no custom depth should materially change the
 // projected pine needle shadows on the receiver ground.
 await select('variant','0');await select('lod','near');await select('light','neutral');await view('threequarter');
 await page.evaluate(()=>{
  const lab=window.__auroraPineLab;
  const m=lab.roots[0].meshes[0];m.customDepthMaterial=lab.family.material.userData.vegetationDepth;
  lab.renderer.shadowMap.needsUpdate=true;
 });
 await capture('pine-shadow-alpha-aware');
 await page.evaluate(()=>{
  const lab=window.__auroraPineLab;
  lab.roots[0].meshes[0].customDepthMaterial=undefined;
  lab.renderer.shadowMap.needsUpdate=true;
 });
 await capture('pine-shadow-default-opaque-negative-control');
 await page.evaluate(()=>{
  const lab=window.__auroraPineLab;
  lab.roots[0].meshes[0].customDepthMaterial=lab.family.material.userData.vegetationDepth;
 });
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile(resolve(out,'pine-render-metrics.json'),JSON.stringify({...result,errors},null,2));
 console.log('PINE REAL CHROMIUM WEBGL RENDERS PASS '+JSON.stringify(result));
}finally{await browser?.close();await server.close()}
