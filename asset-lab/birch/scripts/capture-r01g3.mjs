import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve('r01g3-evidence');await mkdir(out,{recursive:true});
const server=await createServer({root:process.cwd(),configFile:false,server:{host:'127.0.0.1',port:4258,strictPort:true,hmr:false},logLevel:'error'});
let browser;const errors=[],shots={};
try{
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1380,height:840},deviceScaleFactor:1});
 await page.route('**/favicon.ico',r=>r.fulfill({status:204}));
 page.on('pageerror',e=>errors.push('page '+String(e)));
 page.on('console',e=>{if(e.type()==='error')errors.push('console '+e.text());});
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto('http://127.0.0.1:4258/rock-r01g3.html',{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>{const x=window.__r01g3?.inspect();return !!x&&(x.loaded===true||!!x.errors);},null,{timeout:45000});
 const diagnostic=await page.evaluate(()=>window.__r01g3?.inspect());
 if(diagnostic?.errors)throw Error('Source asset loader failed: '+JSON.stringify(diagnostic)+'; recent page errors '+errors.join(' | '));
 const inspect=await page.evaluate(()=>window.__r01g3.inspect());
 if(!inspect.browser.isWebGL2||inspect.candidates.length<2||inspect.errors)throw Error('Bad real GLTF/WebGL init '+JSON.stringify(inspect));
 async function snap(name,config){
  await page.evaluate(c=>window.__r01g3.configure(c),config);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const info=await page.evaluate(()=>window.__r01g3.inspect());if(info.errors||!info.browser.isWebGL2)throw Error(name+' '+JSON.stringify(info));
  const data=await page.evaluate(()=>window.__r01g3.capture());if(!data.startsWith('data:image/png;base64,'))throw Error('Invalid PNG');
  const raw=Buffer.from(data.slice(data.indexOf(',')+1),'base64');
  if(raw.length<12000)throw Error('Empty canvas '+name);
  await writeFile(resolve(out,name+'.png'),raw);shots[name]=info;
 }
 for(let i=0;i<Math.min(inspect.candidates.length,10);i++){
  await snap('candidate-'+String(i).padStart(2,'0')+'-clay',{index:i,mode:'single',surface:'clay',wireframe:false,view:'frontThreeQuarter'});
 }
 for(let i=0;i<Math.min(inspect.candidates.length,4);i++){
  await snap('candidate-'+i+'-G1-comparison',{index:i,mode:'comparison',surface:'clay',wireframe:false,view:'frontThreeQuarter'});
  await snap('candidate-'+i+'-rear',{index:i,mode:'single',surface:'clay',wireframe:false,view:'rearThreeQuarter'});
  await snap('candidate-'+i+'-right',{index:i,mode:'single',surface:'clay',wireframe:false,view:'right'});
 }
 await snap('candidate-00-T1-context',{index:0,mode:'context',surface:'T1',wireframe:false,view:'human'});
 await snap('candidate-00-wireframe',{index:0,mode:'single',surface:'clay',wireframe:true,view:'frontThreeQuarter'});
 if(errors.length)throw Error('Browser errors '+errors.join('\n'));
 await writeFile(resolve(out,'metrics.json'),JSON.stringify({method:'Genuine Chromium/Three.js WebGL2 on SwiftShader; unmodified original source geometry',errors,source:inspect,shots,artApproved:false},null,2));
 console.log('ROCK-R01G genuine Three.js WebGL PASS',Object.keys(shots).length,'images',inspect.candidates.length,'actual geometry meshes');
} finally{await browser?.close();await server.close();}
