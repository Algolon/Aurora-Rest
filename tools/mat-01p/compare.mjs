// MAT-01P matched visual regression: identical cameras, lighting and profiles rendered by the pinned MAT-01 baseline
// server and the experimental candidate server. Unretouched Chromium/WebGL2 (SwiftShader) PNG screenshots + SHA-256.
// Pixel statistics and side-by-side composites are produced afterwards by tools/mat-01p/compare-images.py.
// Usage: node tools/mat-01p/compare.mjs --base http://127.0.0.1:4330/mat-01.html --cand http://127.0.0.1:4331/mat-01.html
//        [--out docs/mat-01p/regression] [--size 1280x800] [--views a,b] [--runs a,b]
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const arg=(n,f)=>{const i=process.argv.indexOf('--'+n);return i>0?process.argv[i+1]:f;};
const base=arg('base','http://127.0.0.1:4330/mat-01.html'),cand=arg('cand','http://127.0.0.1:4331/mat-01.html'),out=arg('out','docs/mat-01p/regression');
const [width,height]=arg('size','1280x800').split('x').map(Number);
const VIEWS=arg('views','m01-walk,m01-elevated,m02-walk,m02-elevated,m03-walk,m04-walk,birchwood-overview,birchwood-walk,valley-walk,valley-overview,tr-forest-meadow,cove-elevated,tarn-slope').split(',');
const ALL_RUNS=[
 {id:'base-high',url:base,profile:'high',noise:'procedural',label:'MAT-01 ae8a9c1 · High · procedural fBm'},
 {id:'cand-high-default',url:cand,profile:'high',noise:'procedural',label:'MAT-01P branch · High · default (candidate off)'},
 {id:'cand-high-baked',url:cand,profile:'high',noise:'baked',label:'MAT-01P branch · High · baked noise (candidate)'},
 {id:'base-mobile',url:base,profile:'mobile',noise:'procedural',label:'MAT-01 ae8a9c1 · Mobile · procedural fBm'},
 {id:'cand-mobile-baked',url:cand,profile:'mobile',noise:'baked',label:'MAT-01P branch · Mobile · baked noise (candidate)'},
];
const runs=arg('runs','')?ALL_RUNS.filter(r=>arg('runs','').split(',').includes(r.id)):ALL_RUNS;
const executablePath=process.env.CHROME||(existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);
const sha=b=>createHash('sha256').update(b).digest('hex');
const browser=await chromium.launch({headless:true,executablePath,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const manifest={tool:'tools/mat-01p/compare.mjs',browser:browser.version(),viewport:{width,height,dpr:1},lighting:'nordic',layout:'canonical 400 m tiles · 4 m',
 evidence:'Unretouched Chromium WebGL2 screenshots (SwiftShader software renderer) of the MAT-01 review page served from the pinned baseline worktree and from the MAT-01P experimental branch.',runs:[]};
let failed=false;
try{
 await mkdir(out,{recursive:true});
 for(const r of runs){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1}),errors=[];page.setDefaultTimeout(1800000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(r.url,{waitUntil:'load'});await page.waitForFunction(()=>window.__auroraMAT01?.ready,null,{timeout:1800000});
  await page.addStyleTag({content:'#ui{display:none!important}'});
  const info=await page.evaluate(async r=>{const q=window.__auroraMAT01;q.pause(true);await q.setProfile(r.profile);
   if(r.noise!=='procedural'){if(!q.setNoise)throw new Error('server has no candidate noise mode');q.setNoise(r.noise);}
   q.set({surface:'material',debug:'off',force:-1,heightBlend:true,normals:true,triplanar:true,wireframe:false,water:true,lighting:'nordic'});
   const m=q.metrics();return {profile:m.profile,noise:m.noise??'procedural',materialMemoryBytes:m.materialMemoryBytes,classificationHash:m.classificationHash};},r);
  if(info.profile!==r.profile||info.noise!==r.noise)throw new Error(`run ${r.id} reports ${info.profile}/${info.noise}`);
  await mkdir(`${out}/${r.id}`,{recursive:true});const shots=[];
  for(const v of VIEWS){
   await page.evaluate(v=>{const q=window.__auroraMAT01;q.setView(v);q.snap('s');},v);
   const png=await page.screenshot({path:`${out}/${r.id}/${v}.png`});shots.push({view:v,file:`${r.id}/${v}.png`,sha256:sha(png)});console.log(r.id,v);
  }
  const m=await page.evaluate(()=>window.__auroraMAT01.metrics());
  manifest.runs.push({...r,url:r.url,...info,shaderErrors:m.shaderErrors,pageErrors:errors,shots});if(errors.length||m.shaderErrors.length)failed=true;
  await writeFile(`${out}/manifest.json`,JSON.stringify(manifest,null,1)+'\n');await page.close();
 }
}catch(e){failed=true;manifest.failure=String(e?.stack??e);console.error(e);}
finally{await writeFile(`${out}/manifest.json`,JSON.stringify(manifest,null,1)+'\n');await browser.close();}
if(failed)process.exitCode=1;
