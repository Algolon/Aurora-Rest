import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve('art/blender/s1-geological-sculpt/threejs');await mkdir(out,{recursive:true});
const server=await createServer({root:process.cwd(),configFile:false,server:{host:'127.0.0.1',port:4221,strictPort:true},logLevel:'error'});
let browser;const errors=[],captures={};
try{
 await server.listen();browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});await page.route('**/favicon.ico',route=>route.fulfill({status:204}));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:4221/rock-s1.html',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__s1Lab?.frame()>4,{timeout:60000});await page.evaluate(()=>document.body.dataset.capture='true');
 async function snap(name,c){
  captures[name]=await page.evaluate(c=>window.__s1Lab.configure(c),c);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.screenshot({path:resolve(out,name+'.png')});
 }
 for(const view of ['front','rear','left','right','threequarter-front','threequarter-rear','top','human-height','shoulder','ground'])await snap('s1-neutral-'+view,{mode:'single',surface:'neutral',view});
 for(const surface of ['T1','wireframe','silhouette'])await snap('s1-'+surface,{mode:'single',surface,view:'threequarter-front'});
 for(const reference of ['A-V0','A-V2','A-V3','G1'])for(const view of ['front','threequarter-front','threequarter-rear'])await snap(reference+'-s1-neutral-'+view,{mode:'compare',reference,surface:'neutral',view});
 await snap('G1-s1-T1',{mode:'compare',reference:'G1',surface:'T1',view:'threequarter-front'});
 await snap('aurora-nature-T1',{mode:'context',surface:'T1',view:'threequarter-front'});
 await snap('aurora-nature-wide-T1',{mode:'context-wide',surface:'T1',view:'threequarter-front'});
 await snap('aurora-nature-neutral',{mode:'context',surface:'neutral',view:'threequarter-front'});
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile(resolve(out,'browser-metrics.json'),JSON.stringify({method:'Real Chromium Three.js WebGL2 / SwiftShader; actual Blender GLB',errors,captures},null,2)+'\n');console.log('S1 real GLB WebGL PASS',Object.keys(captures).length,'images');
}finally{await browser?.close();await server.close();}
