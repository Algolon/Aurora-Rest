/**
 * WTR-01A1: independent genuine WebGL wave studies.
 * Run on the isolated art branch only. The original shader is study='original'.
 */
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=process.env.WTR_URL||'http://127.0.0.1:4173/wtr-01.html';
const folder=process.env.WTR_OUTPUT||'docs/wtr-01a/study-captures';
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
const errors=[],warnings=[],frames=[],visibility=[];
page.on('pageerror',e=>errors.push(e.stack||e.message));
page.on('console',m=>{const p=m.location(),s=m.text()+' @ '+p.url+':'+p.lineNumber;if(m.type()==='error')errors.push(s);if(m.type()==='warning')warnings.push(s);});
try{
  await page.goto(root,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__auroraWTR01?.ready,null,{timeout:120000});
  await page.addStyleTag({content:'#ui,#loading{display:none!important}'});
  async function capture(view,quality,study,t=0,sun='B'){
    await page.evaluate(v=>{
      const a=window.__auroraWTR01;
      a.setView(v.view);a.setMode(v.quality);a.setStudy(v.study);a.setSun(v.sun);a.setTime(v.t);a.freezeForCapture(true);
    },{view,quality,study,t,sun});
    const snapshot=await page.evaluate(()=>window.__auroraWTR01.snapshot());
    if(errors.length||snapshot.shaderErrors?.length)throw Error('WebGL error at '+view+'/'+study+': '+JSON.stringify({errors,shader:snapshot.shaderErrors}));
    const file=[view,quality,study,sun,String(t).replace('.','_')].join('--')+'.png';
    const image=await page.screenshot({path:folder+'/'+file,animations:'disabled'});
    if(errors.length)throw Error('Browser error in screenshot: '+errors.join('|'));
    frames.push({file,sha256:createHash('sha256').update(image).digest('hex'),...snapshot});
    console.log('CAPTURED',file,snapshot.calls,'draws',snapshot.triangles,'triangles');
  }
  const views=['home-shore','home-elevated','wind-shore','wind-elevated','tarn-shore','tarn-panorama'];
  const finalReview=process.argv.includes('--final');
  if(finalReview){
    const available=await page.evaluate(()=>window.__auroraWTR01.views.map(v=>v.id));
    for(const view of views){
      for(const [quality,study] of [
        ['baseline','original'],['low','final'],['medium','final'],
        ['high','original'],['high','final']
      ])await capture(view,quality,study,0,'B');
    }
    for(const view of ['home-elevated','wind-elevated','tarn-panorama']){
      await capture(view,'high','original',0,'A');
      await capture(view,'high','final',0,'A');
    }
    for(const view of ['home-shore','wind-shore','tarn-shore']){
      for(const t of [1.5,3])await capture(view,'high','final',t,'B');
    }
    if(available.includes('home-water-walk')){
      await capture('home-water-walk','high','original');
      await capture('home-water-walk','high','final');
    }
  }else{

  for(const study of ['original','A','B','C']){
    for(const view of views)await capture(view,'high',study);
    for(const view of ['wind-elevated','tarn-panorama'])await capture(view,'medium',study);
  }
  for(const study of ['original','A','B','C']){
    for(const view of ['wind-elevated','tarn-panorama']) {
      for(const t of [1.5,3])await capture(view,'high',study,t);
    }
  }
  }
  // Actual GPU scene A/B with and without water; never infer visibility from a PNG.
  for(const study of (finalReview?['original','final']:['original','A','B','C'])){
    for(const view of ['home-elevated','wind-shore','tarn-panorama']){
      const value=await page.evaluate(v=>{
        const a=window.__auroraWTR01;a.setView(v.view);a.setMode('high');a.setStudy(v.study);a.setTime(0);
        return a.measureWaterPixels();
      },{view,study});
      visibility.push({view,study,...value});
      if(value.pixels<64)throw Error('Missing actual water '+view+'/'+study+': '+value.pixels);
    }
  }
  if(errors.length)throw Error('Browser/GLSL errors: '+errors.join(' | '));
  await writeFile(folder+'/manifest.json',JSON.stringify({
    provenance:'Actual unretouched Three.js/Chromium WebGL at WTR-01A1 art branch',
    baseline:'90037110189f5a51d2f4fdad5790b84a05df36fd',
    browser:browser.version(),viewport:[1600,900],
    note:finalReview?'WTR-01A selected final C filtering + calibrated regional shader against untouched WTR-01R original, no device FPS.':'original is unchanged WTR-01R shader path; A/B/C are independent candidate variants. Software renderer, NOT device FPS.',
    phase:finalReview?'A2/A3 matched final look':'A1 isolated wave studies',frames,visibility,errors,warnings
  },null,2)+'\n');
  console.log(finalReview?'FINAL REVIEW PASS:':'STUDY PASS:',frames.length,'genuine frames; water visibility',visibility.length);
}catch(e){
  process.exitCode=1;console.error('STUDY FAILED:',e);
  await writeFile(folder+'/failure.json',JSON.stringify({error:String(e),stack:e.stack,errors,warnings,completed:frames.map(x=>x.file)},null,2));
}finally{
  const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const cells=frames.map(f=>'<figure><a href="'+escape(f.file)+'"><img loading="lazy" src="'+escape(f.file)+'"></a><figcaption>'+escape(f.view)+' • '+escape(f.quality)+' • '+escape(f.study)+' • '+escape(f.timeSec)+'s • '+f.calls+' calls</figcaption></figure>').join('');
  await writeFile(folder+'/index.html','<!doctype html><html><head><meta charset="utf-8"><title>WTR-01A1 WebGL wave studies</title><style>body{font:14px system-ui;background:#15282b;color:#edf4f4;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:16px}figure{margin:0;background:#26383c}img{width:100%}figcaption{padding:12px}</style></head><body><h1>WTR-01A1 — genuine WebGL A/B/C wave studies</h1><p>Original WTR-01R camera positions, unchanged R1 geometry. No generated or retouched images.</p><main>'+cells+'</main></body></html>');
  await browser.close();
}
