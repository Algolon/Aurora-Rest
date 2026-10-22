/** ASSET-01E2R-A browser evidence. All pixels come from live Three.js/WebGL canvas. */
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),out=resolve(root,'r04-e2r-evidence');
await mkdir(out,{recursive:true});
const server=await createServer({root,server:{host:'127.0.0.1',port:4197,strictPort:true},logLevel:'error'});
const errors=[],shots=[],reports={};
const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
let browser;
try{
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('pageerror '+String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text())});
 await page.goto('http://127.0.0.1:4197/r04-e2r.html',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__r04Lab?.frame()>5,{timeout:45000});
 async function shot(name,config){
  const report=await page.evaluate(o=>window.__r04Lab.configure(o),config);
  assert(!report.errors,name+': '+report.errors);
  reports[name]=report;
  const url=await page.evaluate(()=>window.__r04Lab.capture());
  assert(url.startsWith('data:image/png;base64,'),'Not a genuine Three.js WebGL PNG');
  const data=Buffer.from(url.split(',')[1],'base64');assert(data.byteLength>20000,'Empty WebGL frame');
  await writeFile(resolve(out,name+'.png'),data);shots.push(name+'.png');
 }
 for(const view of ['front','rear','left','right','threequarter','top','human'])
  await shot('g0-original-'+view,{mode:'selected',geometry:'G0',view,light:'neutral',wireframe:false,zoom:100});
 for(const light of ['neutral','nordic','grazing']){
  await shot('g0-g1-g2-geometry-'+light,{mode:'geometry',geometry:'G1',view:'threequarter',light,wireframe:false,zoom:100});
 }
 for(const geometry of ['G1','G2']){
  await shot(geometry.toLowerCase()+'-wireframe',{mode:'selected',geometry,view:'threequarter',light:'neutral',wireframe:true,zoom:130});
  await shot(geometry.toLowerCase()+'-rear',{mode:'selected',geometry,view:'rear',wireframe:false,zoom:110});
  await shot(geometry.toLowerCase()+'-left',{mode:'selected',geometry,view:'left',wireframe:false});
  await shot(geometry.toLowerCase()+'-right',{mode:'selected',geometry,view:'right',wireframe:false});
  await shot(geometry.toLowerCase()+'-front',{mode:'selected',geometry,view:'front',wireframe:false});
  await shot(geometry.toLowerCase()+'-human',{mode:'selected',geometry,view:'human',wireframe:false});
  for(const light of ['neutral','nordic','grazing'])
   await shot(geometry.toLowerCase()+'-materials-'+light,{mode:'materials',geometry,view:'threequarter',light,wireframe:false,zoom:110});
  for(const material of ['M1','M2','M3'])
   await shot(geometry.toLowerCase()+'-'+material.toLowerCase()+'-closeup',{mode:'selected',geometry,material,view:'threequarter',light:'grazing',zoom:160});
 }
 for(const material of ['M1','M2','M3'])
  await shot('aurora-vegetation-'+material.toLowerCase(),{mode:'context',geometry:'G1',material,light:'nordic',view:'threequarter',zoom:100,wireframe:false});
 const lifecycle=await page.evaluate(async()=>{
  const lib=await import('/src/rocks/experimental/r04MaterialStudies.ts');
  const a=lib.createR04MaterialStudies(),expected=a.textureCount;
  a.dispose();a.dispose();
  const b=lib.createR04MaterialStudies(),recreated=b.textureCount;b.dispose();
  return {expected,recreated};
 });
 assert(lifecycle.expected===9&&lifecycle.recreated===9,'Failed material disposal/recreation');
 assert(errors.length===0,errors.join('\n'));
 await writeFile(resolve(out,'metrics.json'),JSON.stringify({
  method:'real Three.js/Chromium WebGL/SwiftShader canvas capture',
  actualAndroidVerified:false,artApproved:false,shots,reports,errors,lifecycle},null,2));
 console.log('ASSET-01E2R-A real WebGL evidence PASS',shots.length,'screenshots',lifecycle);
}finally{await browser?.close();await server.close();}
