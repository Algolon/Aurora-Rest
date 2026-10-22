/** Reproducible REAL Chromium/Three.js WebGL A-V3 integrated-transition proof. */
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),out=resolve(root,'rock-b1r2-evidence');
await mkdir(out,{recursive:true});
const server=await createServer({root,server:{host:'127.0.0.1',port:4229,strictPort:true},logLevel:'error'});
const screenshots=[],metrics={},errors=[];
let browser;
const assert=(condition,message)=>{if(!condition)throw Error(message);};
try{
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1680,height:945},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('PAGE '+String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text());});
 await page.goto('http://127.0.0.1:4229/rock-b1r2.html',{waitUntil:'networkidle',timeout:60000});
 await page.waitForFunction(()=>window.__b1r2Lab?.frame()>5,{timeout:60000});
 async function shot(name,config){
  const report=await page.evaluate(c=>window.__b1r2Lab.configure(c),config);
  assert(!report.errors,'Browser runtime error '+name+': '+report.errors);
  assert(report.v3Diagnostics.outputMeshes===1,'A-V3 must render as a single mesh object');
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const img=await page.evaluate(()=>window.__b1r2Lab.capture());
  assert(img?.startsWith('data:image/png;base64,'),'Missing genuine WebGL screenshot '+name);
  const png=Buffer.from(img.slice('data:image/png;base64,'.length),'base64');
  assert(png.byteLength>20000,'Empty screenshot '+name);
  await writeFile(resolve(out,name+'.png'),png);
  screenshots.push(name+'.png');metrics[name]=await page.evaluate(()=>window.__b1r2Lab.stats());
 }
 const base={light:'neutral',surface:'neutral',view:'threequarter',orbit:27,zoom:100,wireframe:false};
 for(const [surface,light] of [['neutral','neutral'],['T1','nordic'],['silhouette','neutral'],['normal','neutral'],['neutral','grazing']])
  await shot('matched-A-v0-v2-v3-'+surface+'-'+light,{...base,mode:'trio',surface,light});
 for(const version of ['V2','V3'])for(const view of ['front','rear','left','right','threequarter','top','human'])
  await shot(version.toLowerCase()+'-'+view+'-neutral',{...base,mode:'single',version,view});
 for(const version of ['V2','V3']){
  await shot(version.toLowerCase()+'-nordic-t1',{...base,mode:'single',version,surface:'T1',light:'nordic'});
  await shot(version.toLowerCase()+'-wireframe',{...base,mode:'single',version,wireframe:true});
  await shot(version.toLowerCase()+'-g1-style',{...base,mode:'g1',version});
  await shot(version.toLowerCase()+'-aurora-nature',{...base,mode:'nature',version,surface:'T1',light:'nordic'});
  await shot(version.toLowerCase()+'-junction-front',{...base,mode:'junction',version,zoom:160,orbit:32});
  await shot(version.toLowerCase()+'-junction-side',{...base,mode:'junction',version,zoom:160,orbit:108});
  await shot(version.toLowerCase()+'-junction-back',{...base,mode:'junction',version,zoom:160,orbit:-114});
 }
 assert(errors.length===0,'WebGL console/shader errors '+errors.join('\n'));
 const json={
  method:'ACTUAL Three.js WebGL/Chromium SwiftShader 1680x945',
  artApproved:false,physicalAndroidVerified:false,
  screenshots,shotCount:screenshots.length,metrics,errors,
  sourceScope:'A-V3 only; original A-V0/V1/V2, B/C/D/E, G1 and A2 protected'
 };
 await writeFile(resolve(out,'metrics.json'),JSON.stringify(json,null,2));
 console.log('B1R2 GENUINE WEBGL PASS',screenshots.length,'real PNG screenshots');
}finally{await browser?.close();await server.close();}
