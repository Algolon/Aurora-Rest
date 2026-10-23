/** Actual S1 and S1R GLBs; matched neutral / Nordic / grazing WebGL review. */
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),out=resolve('art/blender/s1r-sculptural-polish/threejs');await mkdir(out,{recursive:true});
const server=await createServer({root,configFile:false,server:{host:'127.0.0.1',port:4224,strictPort:true},logLevel:'error'});
let browser;const errors=[],captures={};
try{
 await server.listen();browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});await page.route('**/favicon.ico',r=>r.fulfill({status:204}));page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto('http://127.0.0.1:4224/rock-s1r.html',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__s1rLab?.frame()>4,null,{timeout:60000});await page.evaluate(()=>document.body.dataset.capture='true');
 async function snap(name,c){
  await page.evaluate(c=>window.__s1rLab.configure(c),c);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));captures[name]=await page.evaluate(()=>window.__s1rLab.stats());await page.screenshot({path:resolve(out,name+'.png')});
 }
 for(const asset of ['S1','S1R'])for(const view of ['front','rear','left','right','threequarter-front','threequarter-rear','top','human-height'])await snap(asset+'-neutral-'+view,{asset,mode:'single',surface:'neutral',light:'neutral',view});
 for(const view of ['front','rear','left','threequarter-front','threequarter-rear','top'])await snap('S1-S1R-neutral-'+view,{mode:'compare',reference:'S1',surface:'neutral',light:'neutral',view});
 for(const light of ['neutral','nordic','grazing'])for(const surface of ['neutral','T1'])await snap('S1-S1R-'+surface+'-'+light,{mode:'compare',reference:'S1',surface,light,view:'threequarter-front'});
 for(const light of ['neutral','grazing'])await snap('G1-S1R-'+light,{mode:'compare',reference:'G1',surface:'neutral',light,view:'threequarter-front'});
 await snap('G1-S1R-T1',{mode:'compare',reference:'G1',surface:'T1',light:'nordic',view:'threequarter-front'});
 for(const view of ['shoulder','ground'])await snap('S1R-'+view,{asset:'S1R',mode:'single',surface:'neutral',light:'neutral',view});
 for(const surface of ['wireframe','silhouette'])await snap('S1R-'+surface,{asset:'S1R',mode:'single',surface,light:'neutral',view:'threequarter-front'});
 for(const mode of ['context','context-wide'])await snap('aurora-nature-'+mode,{asset:'S1R',mode,surface:'T1',light:'nordic',view:'threequarter-front'});
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile(resolve(out,'browser-metrics.json'),JSON.stringify({method:'Real Chromium / Three.js WebGL2 SwiftShader / actual S1 and S1R Blender GLBs',errors,captures},null,2)+'\n');console.log('S1R REAL GLB WEBGL PASS',Object.keys(captures).length,'images');
}finally{await browser?.close();await server.close();}
