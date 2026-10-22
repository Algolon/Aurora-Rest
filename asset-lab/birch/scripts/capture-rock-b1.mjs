/** B1 genuine Three.js + Chromium WebGL capture. Source screenshots, not AI pictures. */
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),out=resolve(root,'rock-b1-evidence');await mkdir(out,{recursive:true});
const server=await createServer({root,server:{host:'127.0.0.1',port:4207,strictPort:true},logLevel:'error'});
let browser;const errors=[],files=[],reports={};
const assert=(valid,msg)=>{if(!valid)throw Error(msg);};
try{
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1800,height:1000},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('pageerror '+String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text());});
 await page.goto('http://127.0.0.1:4207/rock-b1.html',{waitUntil:'networkidle',timeout:60000});
 await page.waitForFunction(()=>window.__b1Lab?.frame()>6,{timeout:60000});
 async function snap(name,config){
  const report=await page.evaluate(o=>window.__b1Lab.configure(o),config);
  assert(!report.errors,name+': '+report.errors);
  assert(report.rocks.length>0,'No rock selected: '+name);
  assert(report.rocks.every(v=>v.triangles>10),'Missing actual rock geometry: '+name);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const uri=await page.evaluate(()=>window.__b1Lab.capture());
  assert(uri.startsWith('data:image/png;base64,'),'Missing real rendered PNG '+name);
  const data=Buffer.from(uri.split(',')[1],'base64');
  assert(data.byteLength>25000,'Unexpected small/blank WebGL PNG: '+name);
  await writeFile(resolve(out,name+'.png'),data);
  files.push(name+'.png');reports[name]=await page.evaluate(()=>window.__b1Lab.stats());
 }
 // Five-rock family in physical units and equivalent-height silhouette review.
 for(const [mode,surface,light] of [
  ['gallery','clay','neutral'],['gallery','T1','nordic'],['gallery','silhouette','neutral'],
  ['gallery','T1','grazing'],['normalized','clay','neutral'],['normalized','silhouette','neutral'],
  ['normalized','T1','nordic']
 ])await snap('family-'+mode+'-'+surface+'-'+light,{mode,surface,light,view:'threequarter',wireframe:false,zoom:92,showScale:true});
 for(const choice of ['G1','A','B','C','D','E']){
  for(const view of ['front','rear','left','right','threequarter','top','human']){
   await snap(choice.toLowerCase()+'-'+view+'-clay',
    {mode:'single',choice,view,detail:'refined',surface:'clay',light:'neutral',zoom:105,wireframe:false,showScale:true});
  }
  if(choice==='G1')continue;
  await snap(choice.toLowerCase()+'-wireframe',{mode:'single',choice,view:'threequarter',
   surface:'clay',light:'neutral',zoom:110,wireframe:true});
  await snap(choice.toLowerCase()+'-before-vs-after',{mode:'geometry-pair',choice,view:'threequarter',
   surface:'clay',light:'neutral',zoom:110,wireframe:false});
  await snap(choice.toLowerCase()+'-nordic-t1',{mode:'single',choice,view:'threequarter',
   surface:'T1',light:'nordic',zoom:108,wireframe:false});
  await snap(choice.toLowerCase()+'-grazing-t1',{mode:'single',choice,view:'threequarter',
   surface:'T1',light:'grazing',zoom:108,wireframe:false});
  await snap(choice.toLowerCase()+'-context-t1',{mode:'context',choice,view:'threequarter',
   surface:'T1',light:'nordic',zoom:108,wireframe:false});
 }
 for(const choice of ['C','D','E']){
  for(const surface of ['T2','T3'])await snap(choice.toLowerCase()+'-'+surface.toLowerCase()+'-nordic',
   {mode:'single',choice,view:'threequarter',surface,light:'nordic',zoom:110,wireframe:false});
  await snap(choice.toLowerCase()+'-t1-planar',{mode:'single',choice,view:'threequarter',
   surface:'T1',projection:'planar',light:'nordic',zoom:110,wireframe:false});
  await snap(choice.toLowerCase()+'-t1-triplanar',{mode:'single',choice,view:'threequarter',
   surface:'T1',projection:'triplanar',light:'nordic',zoom:110,wireframe:false});
 }
 assert(errors.length===0,'WebGL browser errors: '+errors.join('\n'));
 const rootMetrics=await page.evaluate(()=>window.__b1Lab.metrics);
 const geometrySignature=createHash('sha256').update(JSON.stringify(rootMetrics)).digest('hex');
 await writeFile(resolve(out,'metrics.json'),JSON.stringify({
  method:'REAL THREE.JS / CHROMIUM WEBGL SwiftShader, no generated concept imagery',
  screenshots:files,perScreenshot:reports,geometryMetrics:rootMetrics,geometrySignature,
  screenshotCount:files.length,artApproved:false,physicalAndroidVerified:false,
  protectedSourceModified:false,errors},null,2));
 console.log('B1 REAL CHROMIUM THREE.JS WEBGL PASS: '+files.length+' actual PNG screenshots');
}finally{await browser?.close();await server.close();}
