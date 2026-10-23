/** Genuine ROCK-G02R-G02 Three.js/WebGL screenshot evidence; never concept imagery. */
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve('g02r-evidence');await mkdir(out,{recursive:true});
const server=await createServer({root:process.cwd(),configFile:false,
 server:{host:'127.0.0.1',port:4237,strictPort:true,hmr:false},logLevel:'error'});
let browser;const errors=[],reports={};
try{
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',
  headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.route('**/favicon.ico',route=>route.fulfill({status:204}));
 page.on('pageerror',e=>errors.push('pageerror '+String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text());});
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto('http://127.0.0.1:4237/rock-g02r.html',{waitUntil:'networkidle',timeout:90000});
 await page.waitForFunction(()=>window.__g02rLab?.frame()>4,null,{timeout:60000});
 async function snap(name,config){
  await page.evaluate(config=>window.__g02rLab.configure(config),config);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const report=await page.evaluate(()=>window.__g02rLab.inspect());
  if(!report.browser.isWebGL2||report.errors)throw Error('No clean actual WebGL2 capture '+name+': '+JSON.stringify(report));
  reports[name]=report;
  const data=await page.evaluate(()=>window.__g02rLab.capture());
  if(!data.startsWith('data:image/png;base64,'))throw Error('Canvas PNG capture failed');
  const bytes=Buffer.from(data.slice(data.indexOf(',')+1),'base64');
  if(bytes.byteLength<15000)throw Error('Suspicious empty WebGL canvas '+name);
  await writeFile(resolve(out,name+'.png'),bytes);
 }
 for(const view of ['front','rear','left','right','frontThreeQuarter','rearThreeQuarter','top','human']){
  await snap('G02R-neutral-'+view,{mode:'single',surface:'neutral',lighting:'neutral',wireframe:false,view});
 }
 await snap('G02R-neutral-grazing',{mode:'single',surface:'neutral',lighting:'grazing',wireframe:false,view:'frontThreeQuarter'});
 await snap('G02R-neutral-wireframe',{mode:'single',surface:'neutral',lighting:'neutral',wireframe:true,view:'frontThreeQuarter'});
 await snap('G1-versus-G02R-neutral',{mode:'comparison',surface:'neutral',lighting:'neutral',wireframe:false,view:'frontThreeQuarter'});
 await snap('G1-versus-G02R-rear',{mode:'comparison',surface:'neutral',lighting:'neutral',wireframe:false,view:'rearThreeQuarter'});
 await snap('G02-versus-G02R-neutral',{mode:'historical',surface:'neutral',lighting:'neutral',wireframe:false,view:'frontThreeQuarter'});
 await snap('G02-versus-G02R-rear',{mode:'historical',surface:'neutral',lighting:'neutral',wireframe:false,view:'rearThreeQuarter'});
 await snap('G02R-A2-T1',{mode:'single',surface:'T1',lighting:'nordic',wireframe:false,view:'frontThreeQuarter'});
 await snap('G02R-A2-T1-rear',{mode:'single',surface:'T1',lighting:'nordic',wireframe:false,view:'rearThreeQuarter'});
 await snap('G02R-nature-context',{mode:'context',surface:'T1',lighting:'nordic',wireframe:false,view:'human'});
 if(errors.length)throw Error('Browser errors: '+errors.join('\n'));
 await writeFile(resolve(out,'metrics.json'),JSON.stringify({
  method:'Real Chromium/Three.js/WebGL2 via software SwiftShader (not physical GPU)',
  errors,artApproved:false,shots:reports},null,2)+'\n');
 console.log('ROCK-G02R-G02 genuine WebGL PASS',Object.keys(reports).length,'captures');
}finally{await browser?.close();await server.close();}
