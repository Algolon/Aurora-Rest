import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const url=process.env.ENV_FEEL_URL||'http://127.0.0.1:5173/env-feel-r01.html';
const out=process.env.ENV_FEEL_OUT||'docs/env-feel-r01/evidence';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
const cases=[['still',12],['breeze',34],['squall',78],['clearing',130]];
const samples=[];
try{
 await page.goto(url,{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>!!window.__ENV_FEEL_R01__?.snapshot().render.calls,{timeout:45000});
 for(const [mode,t] of cases){
  await page.evaluate(([m,time])=>{window.__ENV_FEEL_R01__.setMode(m);window.__ENV_FEEL_R01__.seek(time);},[mode,t]);
  await page.waitForTimeout(450);
  const sample=await page.evaluate(()=>window.__ENV_FEEL_R01__.snapshot());
  await page.screenshot({path:`${out}/${mode}.png`});
  if(!sample.ready||sample.render.calls<1||!Number.isFinite(sample.render.triangles))throw Error('Invalid render: '+JSON.stringify(sample));
  samples.push(sample);
 }
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await mobile.goto(url,{waitUntil:'networkidle',timeout:120000});
 await mobile.waitForFunction(()=>!!window.__ENV_FEEL_R01__?.snapshot().render.calls,{timeout:45000});
 await mobile.evaluate(()=>{window.__ENV_FEEL_R01__.setMobile(true);window.__ENV_FEEL_R01__.setMode('squall');window.__ENV_FEEL_R01__.seek(77);});
 await mobile.waitForTimeout(550);
 const mobileMetrics=await mobile.evaluate(()=>window.__ENV_FEEL_R01__.snapshot());
 await mobile.screenshot({path:`${out}/mobile-emulation-squall.png`});
 await mobile.close();
 // A/B/A: identical state must restore after a different weather selection.
 await page.evaluate(()=>{window.__ENV_FEEL_R01__.setMode('still');window.__ENV_FEEL_R01__.seek(12);});
 await page.waitForTimeout(350);
 const again=await page.evaluate(()=>window.__ENV_FEEL_R01__.snapshot());
 if(again.weather.rain!==samples[0].weather.rain||again.weather.wetness!==samples[0].weather.wetness)throw Error('Weather state failed A/B/A restoration');
 const report={url,source:'Actual Chromium SwiftShader WebGL execution',notPhysicalAndroid:true,notProductionBirchwood:true,
  scenarios:samples.map(s=>({mode:s.mode,time:s.time,weather:s.weather,render:s.render,timing:s.timing})),
  mobileEmulation:{render:mobileMetrics.render,timing:mobileMetrics.timing},
  restored:true,errors};
 writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify(report,null,2));
}finally{await page.close();await browser.close();}
