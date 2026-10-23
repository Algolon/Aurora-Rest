/**
 * WTR-01 real Chromium/WebGL reviewer. Run only after npm ci, npm run build
 * and serving /wtr-01.html. No synthetic screenshots or generated concept art.
 */
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const base=process.env.WTR_URL??'http://127.0.0.1:4173/wtr-01.html';
const folder=process.env.WTR_OUTPUT??'docs/wtr-01/captures';
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
const errors=[],warnings=[];
page.on('pageerror',e=>errors.push('pageerror: '+(e.stack||e.message)));
page.on('console',m=>{
  const location=m.location(),detail=m.text()+' @ '+location.url+':'+location.lineNumber+':'+location.columnNumber;
  if(m.type()==='error')errors.push('console: '+detail);
  if(m.type()==='warning')warnings.push(detail);
});
const frames=[];
try{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__auroraWTR01?.ready,null,{timeout:120000});
  const views=await page.evaluate(()=>window.__auroraWTR01.views);
  await page.addStyleTag({content:'#ui,#loading{display:none!important}'});
  async function capture(id,quality,timeSec,sun='B'){
    await page.evaluate(({id,quality,timeSec,sun})=>{
      const r=window.__auroraWTR01;
      r.setView(id);r.setMode(quality);r.setSun(sun);r.setTime(timeSec);
    },{id,quality,timeSec,sun});

    await page.evaluate(()=>window.__auroraWTR01.freezeForCapture(true));
    const state=await page.evaluate(()=>window.__auroraWTR01.snapshot());
    if(state.shaderErrors.length || errors.length) throw new Error('Runtime/GLSL errors before screenshot '+id+'/'+quality+': '+JSON.stringify({shaderErrors:state.shaderErrors,errors}));
    const file=`${id}-${quality}-sun${sun}-t${String(timeSec).replace('.','_')}.png`;
    const image=await page.screenshot({path:`${folder}/${file}`,animations:'disabled'});
    if(errors.length)throw new Error('Errors during capture '+file+': '+errors.join(' | '));
    frames.push({file,view:id,quality,timeSec,sun,sha256:createHash('sha256').update(image).digest('hex'),state});
    console.log('CAPTURED',file,'calls=',state.calls,'tris=',state.triangles,'programs=',state.programs);
  }
  if(process.argv.includes('--smoke')){
    await capture('home-shore','baseline',0);
    await capture('home-shore','high',0);
    await capture('wind-shore','high',0);
    await capture('tarn-shore','baseline',0);
    await capture('tarn-shore','high',0);
    await capture('tarn-panorama','high',0);
    await capture('tarn-shore','high',1.5);
  }else{
    for(const v of views)for(const q of ['baseline','low','medium','high'])await capture(v.id,q,0);
    for(const v of ['home-shore','wind-shore','tarn-shore'])for(const t of [1.5,3])await capture(v,'high',t);
  }

  if(process.argv.includes('--two-suns'))for(const v of views)await capture(v.id,'high',0,'A');
  // GPU render-target A/B validation: actual same-camera pixel differences
  // between the canonical scene with and without water. A PNG alone is not proof.
  const coverage=[];
  for(const [id,quality] of [['home-shore','baseline'],['home-shore','high'],['wind-shore','high'],['tarn-shore','baseline'],['tarn-shore','high'],['tarn-panorama','high']]){
    const c=await page.evaluate(({id,quality})=>{
      const w=window.__auroraWTR01;w.setView(id);w.setMode(quality);w.setTime(0);
      return w.measureWaterPixels();
    },{id,quality});
    coverage.push({id,quality,...c});
    console.log('WATER PIXELS',id,quality,c.pixels,'/',c.totalPixels);
    // Collect all baselines first; never suppress the final visibility gate.
  }
  const absent=coverage.filter(c=>c.pixels<64);
  if(absent.length)throw new Error('Water-visibility gate failed: '+JSON.stringify(absent));
  if(errors.length)throw new Error('Browser / shader errors: '+errors.join(' | '));
  await writeFile(folder+'/manifest.json',JSON.stringify({
    evidence:'Unretouched real Chromium WebGL screenshots; UI hidden only',
    browser:browser.version(),base,viewport:[1600,900],
    caveat:'Software/GPU renderer is environment-dependent; not Android hardware performance evidence',
    canonicalDataSha256:{
      terrain:'fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a',
      waterMesh:'d216a9be42934440e3b236139f5b8f91a58c358938492f865c6eef174672294d'
    },
    coverage,frames,errors,warnings
  },null,2)+'\n');
  console.log('WTR-01 capture PASS:',frames.length,'actual engine frames');
}catch(e){
  console.error('WTR-01 CAPTURE FAILED',e);
  await writeFile(folder+'/failure.json',JSON.stringify({base,errors,warnings,message:String(e),stack:e?.stack,completedFrames:frames.map(x=>x.file)},null,2)+'\n');
  process.exitCode=1;

}finally{
  // Self-contained browsable review gallery distributed inside Actions artifact.
  const escapeHtml=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const cells=frames.map(f=>`<figure><a href="${escapeHtml(f.file)}"><img loading="lazy" src="${escapeHtml(f.file)}" alt="${escapeHtml(f.view+' '+f.quality+' '+f.timeSec+'s')}"></a><figcaption>${escapeHtml(f.view)} · ${escapeHtml(f.quality)} · sun ${escapeHtml(f.sun)} · t=${escapeHtml(f.timeSec)}s | ${f.state.calls} draws / ${Math.round(f.state.triangles/1000)}k tris</figcaption></figure>`).join('');
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>WTR-01 genuine WebGL review</title><style>body{background:#102124;color:#e3eeee;font:14px system-ui;margin:2rem}h1{margin-bottom:0}.note{color:#b6c8c5}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,480px),1fr));gap:18px}figure{margin:0;border:1px solid #536569;background:#192d31}img{display:block;width:100%}figcaption{padding:12px}</style></head><body><h1>WTR-01 · Actual Three.js/WebGL review</h1><p class="note">Matched viewpoint screenshots from headless Chromium, not generated art. Art approval pending. Hardware performance not validated. Source run: ${escapeHtml(base)}.</p><div class="gallery">${cells}</div></body></html>`;
  await writeFile(folder+'/index.html',html);
  await browser.close();
}
