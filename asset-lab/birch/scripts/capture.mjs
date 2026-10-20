// Genuine Three.js WebGL screenshot harness. Intended to run in browser CI or locally.
// This is not a concept render; fail instead of generating placeholder imagery.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),out=path.join(root,'screenshots');
await mkdir(out,{recursive:true});
const server=await createServer({root,server:{port:4173,host:'127.0.0.1',strictPort:true}});
let browser=null;
try {
 await server.listen();
 const chrome=process.env.CHROME_PATH||'/usr/bin/google-chrome';
 browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const failures=[];
 page.on('pageerror',e=>failures.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')failures.push('console: '+m.text())});
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>Boolean(window.__auroraBirchLab),{timeout:20000});
 await page.waitForTimeout(1500);
 const set=async(id,value)=>{
  await page.locator('#'+id).selectOption(value);
  await page.waitForTimeout(350);
 };
 const view=async(name)=>{await page.locator('[data-view="'+name+'"]').click();await page.waitForTimeout(350)};
 const capture=async(name)=>{await page.screenshot({path:path.join(out,name+'.png')});};
 await set('light','day');
 await set('variant','all');await view('threequarter');await capture('00-all-variants-daylight');
 await set('light','neutral');await capture('01-all-neutral');
 for(const variant of ['0','1','2']){
  await set('variant',variant);
  await set('lod','near');
  for(const v of ['front','side','threequarter']){await view(v);await capture('birch-'+variant+'-near-'+v);}
  await view('close');await capture('birch-'+variant+'-bark-close');
  for(const lod of ['mid','far','xfar']){await set('lod',lod);await view('threequarter');await capture('birch-'+variant+'-'+lod+'-threequarter');}
 }
 const result=await page.evaluate(()=>{
  const lab=window.__auroraBirchLab;
  const geos=[0,1,2].flatMap(v=>['near','mid','far'].map(l=>lab.family.getGeometry(v,l)));
  return {triangleCounts:geos.map(g=>(g.index?.count??g.attributes.position.count)/3),farXfarSame:[0,1,2].map(v=>lab.family.getGeometry(v,'far')===lab.family.getGeometry(v,'xfar')),gl:lab.renderer.getContext().getParameter(lab.renderer.getContext().VERSION),renderer:lab.renderer.getContext().getParameter(lab.renderer.getContext().RENDERER),calls:lab.renderer.info.render.calls};
 });
 await writeFile(path.join(out,'render-metrics.json'),JSON.stringify(result,null,2));
 if(failures.length)throw new Error(failures.join('\n'));
 if(!result.farXfarSame.every(Boolean))throw new Error('xfar alias parity failed');
 console.log('Browser screenshots captured; metrics:',JSON.stringify(result));
} finally {await browser?.close();await server.close();}
