import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {PNG} from 'pngjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),out=resolve(root,'rock-e2-evidence');await mkdir(out,{recursive:true});
const server=await createServer({root,server:{host:'127.0.0.1',port:4196,strictPort:true},logLevel:'error'});
let browser;const errors=[],shots=[],metrics={};
const assert=(cond,msg)=>{if(!cond)throw Error(msg)};
try{
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1360,height:850},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('pageerror '+String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text())});
 await page.goto('http://127.0.0.1:4196/rock-e2.html',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__e2Lab?.frame()>6,{timeout:60000});
 async function shot(name,cfg){
  const data=await page.evaluate(o=>window.__e2Lab.configure(o),cfg);
  assert(!data.error,name+': '+data.error);assert(data.webgl.error===0,name+' WebGL error '+data.webgl.error);
  const image=await page.evaluate(()=>window.__e2Lab.capture());
  assert(image.startsWith('data:image/png;base64,'),name+' not WebGL readback');
  const buf=Buffer.from(image.split(',')[1],'base64');
  const png=PNG.sync.read(buf);
  let occupied=0;const base=png.data.slice(0,3);
  for(let i=0;i<png.data.length;i+=4)if(Math.abs(png.data[i]-base[0])+Math.abs(png.data[i+1]-base[1])+Math.abs(png.data[i+2]-base[2])>55)occupied++;
  assert(occupied>3000,name+' appears empty/blank');
  await writeFile(resolve(out,name+'.png'),buf);shots.push(name+'.png');metrics[name]={...data,occupiedPixels:occupied};
 }
 await shot('overview-neutral',{choice:'overview',view:'threequarter',mode:'clay',light:'neutral',zoom:100});
 await shot('overview-silhouette',{mode:'silhouette'});
 for(const id of ['A','B','C']){
  for(const view of ['front','rear','left','right','threequarter','top','human']){
   await shot(id+'-'+view+'-clay',{choice:id,view,mode:'clay',light:'neutral',zoom:100});
  }
  await shot(id+'-front-silhouette',{view:'front',mode:'silhouette'});
  await shot(id+'-rear-silhouette',{view:'rear',mode:'silhouette'});
  await shot(id+'-side-silhouette',{view:'left',mode:'silhouette'});
  await shot(id+'-wireframe',{view:'threequarter',mode:'wire'});
  await shot(id+'-nordic',{view:'threequarter',mode:'nordic',light:'nordic'});
  await shot('R04-matched-'+id+'-neutral',{choice:'R04',view:'threequarter',mode:'clay',light:'neutral',zoom:100});
 }
 await shot('A-B-C-R04-nature',{choice:'nature',view:'threequarter',mode:'clay',light:'nordic',zoom:100});
 await shot('A-B-C-R04-matched-neutral',{choice:'overview',view:'front',mode:'clay',light:'neutral'});
 assert(errors.length===0,'Unexpected browser errors: '+errors.join('; '));
 await writeFile(resolve(out,'metrics.json'),JSON.stringify({date:'2026-10-21',method:'Actual Chromium Three.js WebGL, headless SwiftShader only',
  physicalAndroidGpuVerified:false,shots,metrics,errors},null,2));
 console.log('E2A WEBGL PASS '+JSON.stringify({shots:shots.length,errors,models:metrics['overview-neutral'].geometry}));
}finally{await browser?.close();await server.close()}
