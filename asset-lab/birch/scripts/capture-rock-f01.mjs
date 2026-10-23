import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';
const preview=process.argv.includes('--preview'),out=resolve(preview?'f01-evidence/initial-review':'f01-evidence'),raw=resolve(out,'raw');await mkdir(raw,{recursive:true});
const server=await createServer({root:process.cwd(),configFile:false,server:{host:'127.0.0.1',port:4230,strictPort:true,hmr:false},logLevel:'error'});
let browser;const errors=[],captures={};
try{
 await server.listen();browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});await page.route('**/favicon.ico',r=>r.fulfill({status:204}));page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto('http://127.0.0.1:4230/rock-f01.html',{waitUntil:'networkidle',timeout:90000});await page.waitForFunction(()=>window.__f01Lab?.frame()>3,null,{timeout:90000});await page.evaluate(()=>document.body.dataset.capture='true');
 async function setup(c){await page.evaluate(c=>window.__f01Lab.configure(c),c);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
 async function snap(name,c){await setup(c);captures[name]=await page.evaluate(()=>window.__f01Lab.stats());await page.screenshot({path:resolve(raw,name+'.png')});}
 if(preview){for(const mode of ['R2','R3'])await snap(mode+'-neutral-initial',{mode,view:'elevated',surface:'neutral'});await snap('family-T1-initial',{mode:'family',view:'elevated',surface:'T1'});}
 else{
  for(const mode of ['R2','R3'])for(const view of ['front','rear','left','right','top','human','elevated'])await snap(mode+'-neutral-'+view,{mode,view,surface:'neutral'});
  for(const surface of ['T1','neutral'])await snap('family-'+surface,{mode:'family',view:'elevated',surface});
  for(const mode of ['woodland','glacial','foothill'])for(const view of ['elevated','human'])await snap(mode+'-'+view,{mode,view,surface:'T1',renderMode:'instanced'});
  await snap('overview',{mode:'overview',view:'elevated',surface:'T1',renderMode:'instanced'});
  await setup({mode:'performance',view:'elevated',surface:'T1',renderMode:'instanced'});const instanced=await page.evaluate(()=>window.__f01Lab.measure(60));await page.screenshot({path:resolve(raw,'performance.png')});captures.performance=instanced;
  await setup({mode:'performance',renderMode:'meshes'});const meshes=await page.evaluate(()=>window.__f01Lab.measure(45));
  // Canvas-only comparison excludes changing HTML statistics. Same camera/light/layout.
  await setup({mode:'glacial',view:'elevated',surface:'T1',renderMode:'meshes'});const a=PNG.sync.read(Buffer.from((await page.evaluate(()=>window.__f01Lab.capture())).split(',')[1],'base64'));
  await setup({renderMode:'instanced'});const b=PNG.sync.read(Buffer.from((await page.evaluate(()=>window.__f01Lab.capture())).split(',')[1],'base64'));
  let changed=0,maxDifference=0;for(let i=0;i<a.data.length;i+=4){let max=0;for(let k=0;k<3;k++)max=Math.max(max,Math.abs(a.data[i+k]-b.data[i+k]));if(max>12)changed++;maxDifference=Math.max(maxDifference,max);}
  const parity={method:'Actual ordinary meshes versus instanced GLBs, identical transforms and T1; RGB tolerance 12',changedPixels:changed,totalPixels:a.width*a.height,changedFraction:changed/(a.width*a.height),maxDifference};
  if(parity.changedFraction>.005)throw Error('Instanced T1 render mismatch '+JSON.stringify(parity));
  const lifecycle=await page.evaluate(()=>window.__f01Lab.validateResourceLifecycle());if(lifecycle.geometries!==3||lifecycle.materials!==1||lifecycle.textures!==3||lifecycle.instances!==1||lifecycle.remainingChildren!==0||!lifecycle.disposed)throw Error('Owned family resource disposal failed '+JSON.stringify(lifecycle));
  await writeFile(resolve(out,'performance.json'),JSON.stringify({instanced,ordinaryMeshes:meshes,materialParity:parity,lifecycle},null,2)+'\n');
  const curated=['R2-neutral-elevated','R3-neutral-elevated','family-neutral','family-T1','woodland-elevated','woodland-human','glacial-elevated','glacial-human','foothill-elevated','foothill-human','overview','performance'];
  await mkdir(resolve(out,'review'),{recursive:true});for(const [i,name] of curated.entries())await copyFile(resolve(raw,name+'.png'),resolve(out,'review',String(i+1).padStart(2,'0')+'-'+name+'.png'));
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile(resolve(out,'browser-metrics.json'),JSON.stringify({method:'Genuine Chromium Three.js WebGL2 SwiftShader; all rocks loaded from actual Blender GLBs',errors,captures},null,2)+'\n');console.log('F01 REAL GLB WEBGL PASS',Object.keys(captures).length,'captures',preview?'initial-review':'final-review');
}finally{await browser?.close();await server.close();}
