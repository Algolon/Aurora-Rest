// GEO-R02C-P0 matched browser captures of the actual Three.js viewer (unretouched screenshots).
// Usage: node tools/geo-r02c/capture.mjs --url http://127.0.0.1:4310/geo-r02b.html --out <dir> [--modes default,standard,clayA,clayB] [--views id,id|all|r1]
// Modes: default = no query (R1 viewer path); standard = ?presets=p0; clayA/clayB = ?review=clay&sun=A|B.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const arg=(name,fallback)=>{const i=process.argv.indexOf('--'+name);return i>0?process.argv[i+1]:fallback;};
const url=arg('url','http://127.0.0.1:4310/geo-r02b.html'),out=arg('out','docs/geo-r02c-p0/captures');
const modes=arg('modes','standard,clayA,clayB').split(','),viewArg=arg('views','all'),[width,height]=arg('size','1600x1200').split('x').map(Number);
const QUERY={default:'',standard:'?presets=p0',clayA:'?review=clay&sun=A',clayB:'?review=clay&sun=B'};
const R1_VIEWS=['overview','island-oblique','home-cove','central-valley','cairn-saddle','high-tarn','hidden-fold','mirelands'];
const executablePath=process.env.CHROME||(existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);
const sha=b=>createHash('sha256').update(b).digest('hex');
let head='unknown';try{head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{}
const browser=await chromium.launch({headless:true,executablePath,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const manifest={tool:'tools/geo-r02c/capture.mjs',gitHead:head,url,viewport:{width,height,dpr:1},browser:browser.version(),
 evidence:'Actual WebGL browser screenshots of the Three.js viewer, unretouched. Clay modes are opt-in review renders; default mode is the unchanged R1 viewer path.',captures:[]};
let failed=false;
try{
 for(const mode of modes){
  if(!(mode in QUERY))throw new Error('unknown mode '+mode);
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1}),errors=[];page.setDefaultTimeout(300000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.location().url?.includes('favicon'))errors.push(m.text());});
  await page.goto(url+QUERY[mode],{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__auroraR02B?.ready,null,{timeout:300000});
  // The status panel refreshes every 12 frames and can show the previous view; review captures hide the UI
  // overlay (CSS only, recorded in the manifest). Default-mode captures keep it so both builds compare identically.
  if(mode!=='default')await page.addStyleTag({content:'#ui,#crosshair{display:none!important}'});
  const all=await page.evaluate(()=>window.__auroraR02B.views.map(v=>v.id));
  const views=viewArg==='all'?all:viewArg==='r1'?R1_VIEWS:viewArg.split(',').filter(v=>all.includes(v));
  await mkdir(`${out}/${mode}`,{recursive:true});
  for(const id of views){
   const started=Date.now();await page.evaluate(v=>window.__auroraR02B.setView(v),id);await page.waitForTimeout(600);
   await page.evaluate(()=>new Promise(r=>{let n=0;(function tick(){if(++n>=4)r();else requestAnimationFrame(tick);})();}));
   const file=`${out}/${mode}/${id}.png`;const png=await page.screenshot({path:file});
   const snap=await page.evaluate(()=>{const s=window.__auroraR02B.snapshot();delete s.frameTimes;return s;});const review=await page.evaluate(()=>window.__auroraReview??null);
   manifest.captures.push({mode,view:id,file:file.split('/').slice(-2).join('/'),sha256:sha(png),secondsToCapture:(Date.now()-started)/1000,uiOverlayHidden:mode!=='default',review,
    player:snap.player,camera:snap.camera,yaw:snap.yaw,pitch:snap.pitch,eyeHeight:snap.eyeHeight,calls:snap.calls,triangles:snap.triangles,renderer:snap.renderer});
   console.log(mode,id,((Date.now()-started)/1000).toFixed(1)+' s');
   await writeFile(`${out}/capture-manifest.json`,JSON.stringify(manifest,null,1)+'\n');
  }
  if(errors.length){failed=true;manifest.errors=(manifest.errors??[]).concat(errors.map(e=>({mode,error:e})));}
  await page.close();
 }
}catch(e){failed=true;manifest.failure=String(e);console.error('CAPTURE FAILURE',e);}
finally{await writeFile(`${out}/capture-manifest.json`,JSON.stringify(manifest,null,1)+'\n');await browser.close();}
if(failed)process.exitCode=1;
