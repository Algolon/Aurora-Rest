/** Genuine Chromium/Three.js WebGL evidence. Not VTK, imagegen or generated concept art. */
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),out=resolve(root,'rock-evidence');await mkdir(out,{recursive:true});
const server=await createServer({root,server:{host:'127.0.0.1',port:4193,strictPort:true},logLevel:'error'});
let browser;const errors=[],shots=[],stats={};
const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
try{
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('pageerror '+String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text())});
 await page.goto('http://127.0.0.1:4193/rocks.html',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__rockLab?.frame()>5,{timeout:45000});
 async function shot(name,configuration){
  const report=await page.evaluate(o=>window.__rockLab.configure(o),configuration);
  assert(!report.error,name+': '+report.error);stats[name]=report;
  const url=await page.evaluate(()=>window.__rockLab.capture());
  assert(url.startsWith('data:image/png;base64,'),'Invalid real WebGL readback');
  await writeFile(resolve(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));shots.push(name+'.png');
 }
 await shot('production-all-nordic',{choice:'production-all',view:'threequarter',light:'nordic'});
 await shot('production-all-neutral',{light:'neutral'});
 for(const seed of [11,23,37,53]){
  await shot('source-'+seed+'-threequarter',{choice:'source-'+seed,view:'threequarter',light:'nordic'});
 }
 await shot('source-11-material-detail',{choice:'source-11',view:'threequarter',zoom:165,light:'neutral'});
 for(const view of ['front','rear','left','right','threequarter','top','human']){
  await shot('r04-'+view+'-neutral',{choice:'experimental-rock-r04',view,light:'neutral',wireframe:false,zoom:100});
 }
 await shot('r04-threequarter-wireframe',{choice:'experimental-rock-r04',view:'threequarter',wireframe:true});
 await shot('r04-threequarter-nordic',{wireframe:false,light:'nordic'});
 await shot('comparison-same-neutral',{choice:'comparison',view:'threequarter',light:'neutral'});
 await shot('comparison-same-nordic',{light:'nordic'});
 await shot('r04-approved-aurora-nature-neutral',{choice:'nature-context',view:'threequarter',light:'neutral',zoom:90});
 await shot('r04-approved-aurora-nature-nordic',{light:'nordic'});
 const parity=await page.evaluate(()=>{
  const l=window.__rockLab,f=l.family,m=f.material;
  return {mapWidth:m.map?.image?.width,mapHeight:m.map?.image?.height,vertexColors:m.vertexColors,
   surface:m.userData.surface,stoneDefine:m.defines.FLW_SURFACE,wrapS:m.map?.wrapS,wrapT:m.map?.wrapT,
   anisotropy:m.map?.anisotropy,shadowDepth:l.hero.customDepthMaterial!==undefined,
   geometryAccepted:l.hero.geometry.userData.rockR04?.artApproved};
 });
 assert(parity.mapWidth===128&&parity.mapHeight===128&&parity.surface==='stone'&&parity.stoneDefine===3,
   'Production material did not recreate source stone shader and strata dimensions');
 assert(parity.geometryAccepted===false,'R04 must remain art-unapproved');
 assert(errors.length===0,errors.join('\n'));
 await writeFile(resolve(out,'metrics.json'),JSON.stringify({method:'real Chromium Three.js WebGL / SwiftShader',
  actualAndroidVerified:false,materialConfiguration:parity,shots,stats,errors},null,2));
 console.log('ASSET-01E1 REAL WEBGL PASS '+JSON.stringify({shots:shots.length,parity,errors}));
}finally{await browser?.close();await server.close();}
