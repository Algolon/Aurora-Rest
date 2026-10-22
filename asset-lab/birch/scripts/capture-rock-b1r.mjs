/** B1R - actual rendered WebGL PNG evidence; exactly same camera/light/scale across version states. */
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),out=resolve(root,'rock-b1r-evidence');
await mkdir(out,{recursive:true});
const server=await createServer({root,server:{host:'127.0.0.1',port:4219,strictPort:true},logLevel:'error'});
const issues=[],files=[],metrics={};
let browser;
const assert=(v,msg)=>{if(!v)throw Error(msg);};
try{
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1680,height:945},deviceScaleFactor:1});
 page.on('pageerror',e=>issues.push('pageerror '+String(e)));
 page.on('console',m=>{if(m.type()==='error')issues.push('console '+m.text());});
 await page.goto('http://127.0.0.1:4219/rock-b1r.html',{waitUntil:'networkidle',timeout:60000});
 await page.waitForFunction(()=>window.__b1rLab?.frame()>5,{timeout:60000});
 async function snap(name,changes){
  const report=await page.evaluate(x=>window.__b1rLab.configure(x),changes);
  assert(!report.errors,'Browser configuration error '+name+': '+report.errors);
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const png=await page.evaluate(()=>window.__b1rLab.capture());
  assert(png.startsWith('data:image/png;base64,'),'Not actual WebGL PNG '+name);
  const data=Buffer.from(png.slice('data:image/png;base64,'.length),'base64');
  assert(data.byteLength>19000,'Blank WebGL capture '+name);
  await writeFile(resolve(out,name+'.png'),data);
  files.push(name+'.png');
  metrics[name]=await page.evaluate(()=>window.__b1rLab.stats());
  assert(metrics[name].assets.length>0,'Missing geometry metrics for '+name);
  assert(metrics[name].assets.every(x=>x.booleanUnion===false),'False union metadata '+name);
 }
 for(const rock of ['A','B']){
  const tag=rock.toLowerCase();
  for(const [surface,light] of [['neutral','neutral'],['T1','nordic'],['silhouette','neutral'],['diagnostic','neutral'],['T1','grazing']]){
   await snap(tag+'-trio-'+surface+'-'+light,{rock,mode:'trio',view:'threequarter',surface,light,
    wireframe:false,zoom:100,scaleMarker:true});
  }
  for(const version of ['V0','V1','V2']){
   for(const view of ['front','rear','left','right','threequarter','top','human']){
    await snap(tag+'-'+version.toLowerCase()+'-'+view+'-neutral',{rock,version,mode:'single',view,surface:'neutral',
     light:'neutral',wireframe:false,zoom:100,scaleMarker:true});
   }
   await snap(tag+'-'+version.toLowerCase()+'-nordic-t1',{rock,version,mode:'single',view:'threequarter',surface:'T1',
    light:'nordic',wireframe:false,zoom:100,scaleMarker:true});
   await snap(tag+'-'+version.toLowerCase()+'-component',{rock,version,mode:'component',view:'threequarter',
    surface:'diagnostic',light:'neutral',wireframe:false,zoom:125,scaleMarker:false});
   await snap(tag+'-'+version.toLowerCase()+'-wireframe',{rock,version,mode:'single',view:'threequarter',
    surface:'neutral',wireframe:true,zoom:125,scaleMarker:false});
  }
  for(const version of ['V1','V2']){
   await snap(tag+'-'+version.toLowerCase()+'-g1-reference',{rock,version,mode:'g1',view:'threequarter',
    surface:'neutral',light:'neutral',wireframe:false,zoom:100,scaleMarker:true});
   await snap(tag+'-'+version.toLowerCase()+'-vegetation',{rock,version,mode:'context',view:'threequarter',
    surface:'T1',light:'nordic',wireframe:false,zoom:100,scaleMarker:true});
   await snap(tag+'-'+version.toLowerCase()+'-overlap-closeup',{rock,version,mode:'single',
    view:'threequarter',surface:'diagnostic',light:'neutral',wireframe:false,zoom:170,scaleMarker:false});
  }
 }
 assert(issues.length===0,'Browser/shader errors: '+issues.join('\n'));
 const report={
  method:'GENUINE Three.js / Chromium WebGL2 / SwiftShader',size:'1680x945',
  screenshots:files,imagesCount:files.length,metrics,
  ownerArtApproved:false,physicalAndroidVerified:false,booleanUnion:false,
  changedCDE:false,changedA2:false,errors:issues
 };
 await writeFile(resolve(out,'metrics.json'),JSON.stringify(report,null,2));
 console.log('B1R genuine WebGL PASS',files.length,'images');
}finally{await browser?.close();await server.close();}
