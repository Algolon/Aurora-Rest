// MAT-01 diagnostic probe: renders one view under a list of uniform/state experiments (development aid; not evidence).
// Usage: node tools/mat-01/probe.mjs <outDir> <viewId> '<json {name:[[uniformOrSet,value],...]}>'
import {chromium} from 'playwright';
const out=process.argv[2],view=process.argv[3],exps=JSON.parse(process.argv[4]);
const browser=await chromium.launch({headless:true,executablePath:'/opt/pw-browsers/chromium',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:800,height:500}});page.setDefaultTimeout(900000);
page.on('pageerror',e=>console.log('ERR',e.message));
await page.goto('http://127.0.0.1:4320/mat-01.html');await page.waitForFunction(()=>window.__auroraMAT01?.ready,null,{timeout:900000});
await page.addStyleTag({content:'#ui{display:none!important}'});await page.evaluate(()=>window.__auroraMAT01.pause(true));
for(const [name,steps] of Object.entries(exps)){
 await page.evaluate(([v,steps])=>{const q=window.__auroraMAT01;q.set({surface:'material',debug:'off',force:-1,heightBlend:true,normals:true,lighting:'nordic'});q.uniform('uAntiTile',[260,1/9]);
  for(const [k,val] of steps){if(k==='set')q.set(val);else q.uniform(k,val);}q.setView(v);q.snap('x');},[view,steps]);
 await page.screenshot({path:`${out}/${name}.png`});console.log(name);
}
await browser.close();
