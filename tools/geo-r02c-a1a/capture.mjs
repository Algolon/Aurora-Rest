// GEO-R02C-A1a matched browser captures of the actual Three.js viewer (unretouched screenshots of real terrain geometry).
// Usage: node tools/geo-r02c-a1a/capture.mjs --url http://127.0.0.1:4311/geo-r02b.html --out <dir>
//        [--variants m0,v1,v2,v3] [--modes clayA,clayB,standard] [--views id,id|all] [--size 1280x800] [--skip-existing]
// Every variant uses the same cameras (?presets=a1a), sun presets and viewport; the page verifies the composed
// terrain SHA-256 against the manifest before any capture.
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const arg=(n,f)=>{const i=process.argv.indexOf('--'+n);return i>0?process.argv[i+1]:f;};
const url=arg('url','http://127.0.0.1:4311/geo-r02b.html'),out=arg('out','docs/geo-r02c-a1a/captures');
const variants=arg('variants','m0,v1,v2,v3').split(','),modes=arg('modes','clayA,clayB,standard').split(','),viewArg=arg('views','all'),[width,height]=arg('size','1280x800').split('x').map(Number);
const QUERY={standard:'?presets=a1a',clayA:'?review=clay&sun=A&presets=a1a',clayB:'?review=clay&sun=B&presets=a1a'};
const executablePath=process.env.CHROME||(existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);
const sha=b=>createHash('sha256').update(b).digest('hex');let head='unknown';try{head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{}
const browser=await chromium.launch({headless:true,executablePath,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const mf=`${out}/capture-manifest-${variants.join('-')}-${modes.join('-')}.json`;const manifest=existsSync(mf)?JSON.parse(await readFile(mf,'utf8')):{tool:'tools/geo-r02c-a1a/capture.mjs',captures:[]};
Object.assign(manifest,{gitHead:head,url,viewport:{width,height,dpr:1},browser:browser.version(),evidence:'Actual WebGL screenshots of the Three.js viewer rendering the composed variant terrain; UI overlay hidden by CSS; no retouching.'});
let failed=false;
try{
 for(const v of variants)for(const mode of modes){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1}),errors=[];page.setDefaultTimeout(600000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.location().url?.includes('favicon'))errors.push(m.text());});
  await page.goto(`${url}${QUERY[mode]}&terrain=a1a-${v}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__auroraR02B?.ready,null,{timeout:600000});
  const variant=await page.evaluate(()=>window.__auroraVariant??null);if(!variant?.verified)throw new Error('variant not verified: '+v);
  await page.addStyleTag({content:'#ui,#crosshair{display:none!important}'});
  const all=await page.evaluate(()=>window.__auroraR02B.views.filter(x=>x.id.startsWith('a1a-')).map(x=>x.id));
  const views=viewArg==='all'?all:viewArg.split(',').filter(x=>all.includes(x));await mkdir(`${out}/${v}/${mode}`,{recursive:true});
  for(const id of views){
   if(process.argv.includes('--skip-existing')&&existsSync(`${out}/${v}/${mode}/${id}.jpg`)&&manifest.captures.some(c=>c.variant===v&&c.mode===mode&&c.view===id))continue;
   const t=Date.now();await page.evaluate(x=>window.__auroraR02B.setView(x),id);await page.waitForTimeout(400);
   await page.evaluate(()=>new Promise(r=>{let n=0;(function tick(){if(++n>=4)r();else requestAnimationFrame(tick);})();}));
   const file=`${out}/${v}/${mode}/${id}.jpg`;const img=await page.screenshot({path:file,type:'jpeg',quality:88});
   const snap=await page.evaluate(()=>{const s=window.__auroraR02B.snapshot();delete s.frameTimes;return s;});
   manifest.captures=manifest.captures.filter(c=>!(c.variant===v&&c.mode===mode&&c.view===id));
   manifest.captures.push({variant:v,mode,view:id,file:file.split('/').slice(-3).join('/'),sha256:sha(img),terrainSha256:variant.terrainSha256,secondsToCapture:(Date.now()-t)/1000,
    player:snap.player,camera:snap.camera,yaw:snap.yaw,pitch:snap.pitch,eyeHeight:snap.eyeHeight,renderer:snap.renderer});
   console.log(v,mode,id,((Date.now()-t)/1000).toFixed(1)+' s');await writeFile(mf,JSON.stringify(manifest,null,1)+'\n');
  }
  if(errors.length){failed=true;manifest.errors=(manifest.errors??[]).concat(errors.map(e=>({variant:v,mode,error:e})));}
  await page.close();
 }
}catch(e){failed=true;manifest.failure=String(e);console.error('CAPTURE FAILURE',e);}
finally{await writeFile(mf,JSON.stringify(manifest,null,1)+'\n');await browser.close();}
if(failed)process.exitCode=1;
