// Baseline and A/B diagnostic in genuine Chromium WebGL — never generated concept imagery.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdir,writeFile } from 'node:fs/promises';
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
 await writeFile(resolve(out,`${phase}-metrics.json`),JSON.stringify({phase,rows,errors},null,2));
 if(errors.length)throw Error(errors.join('\n'));
 if(rows.some(x=>!x.shadowEnabled||!x.depthExists||!x.geometryShared))throw Error('Shadow pipeline incomplete');
 console.log(JSON.stringify({phase,frames:rows.length,gl:rows[0].gl,modes:rows.slice(0,3),errors}));
}finally{await browser?.close();await server.close()}
