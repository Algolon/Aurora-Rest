// MAT-01 browser gate: real Chromium/WebGL2 assertions against mat-01.html (exit code 1 on failure).
// Checks: page/shader errors, all four materials render distinctly with texture detail, every quality profile compiles,
// GPU weights match the CPU query, resources dispose and recreate, tile re-splitting is pixel-identical, and LOD
// changes do not alter top-down material identity.
// Usage: node tools/mat-01/browser-check.mjs [--url http://127.0.0.1:4320/mat-01.html] [--out docs/mat-01/browser-check.json]
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
const arg=(n,f)=>{const i=process.argv.indexOf('--'+n);return i>0?process.argv[i+1]:f;};
const url=arg('url','http://127.0.0.1:4320/mat-01.html'),out=arg('out','docs/mat-01/browser-check.json'),noise=arg('noise','procedural');
const executablePath=process.env.CHROME||(existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);
const browser=await chromium.launch({headless:true,executablePath,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const results={tool:'tools/mat-01/browser-check.mjs',url,noise,browser:browser.version(),viewport:'640x400',checks:[]};let ok=true;
const check=(name,pass,detail)=>{results.checks.push({name,pass,detail});if(!pass)ok=false;console.log(pass?'PASS':'FAIL',name,JSON.stringify(detail));};
try{
 const page=await browser.newPage({viewport:{width:640,height:400},deviceScaleFactor:1}),errors=[];page.setDefaultTimeout(900000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>window.__auroraMAT01?.ready,null,{timeout:900000});
 await page.addStyleTag({content:'#ui{display:none!important}'});await page.evaluate(n=>{const q=window.__auroraMAT01;q.pause(true);if(n!=='procedural')q.setNoise(n);},noise);
 const stats=()=>page.evaluate(()=>{const src=document.querySelector('#world'),c=document.createElement('canvas');c.width=src.width;c.height=src.height;const x=c.getContext('2d');x.drawImage(src,0,0);
  const d=x.getImageData(0,0,c.width,c.height).data;let n=0,m=[0,0,0],v=0;
  for(let y=Math.floor(c.height*.55);y<c.height;y++)for(let i=0;i<c.width;i++){const o=(y*c.width+i)*4;for(let q=0;q<3;q++)m[q]+=d[o+q];n++;}
  m=m.map(s=>s/n);for(let y=Math.floor(c.height*.55);y<c.height;y++)for(let i=0;i<c.width;i++){const o=(y*c.width+i)*4;v+=((d[o]+d[o+1]+d[o+2])/3-(m[0]+m[1]+m[2])/3)**2;}
  return {mean:m.map(s=>+s.toFixed(1)),lumStd:+Math.sqrt(v/n).toFixed(2)};});
 const m0=await page.evaluate(()=>window.__auroraMAT01.metrics());
 check('no shader compilation errors at load',m0.shaderErrors.length===0,{shaderErrors:m0.shaderErrors.length,renderer:m0.renderer});
 // All four materials, forced on identical terrain and camera (lower half of the frame = ground).
 const means=[];
 for(let i=0;i<4;i++){await page.evaluate(i=>{const q=window.__auroraMAT01;q.set({surface:'material',force:i,debug:'off',lighting:'neutral',water:false});q.setView('m02-walk');q.snap('s');},i);
  const s=await stats();means.push(s.mean);check(`material ${i} renders with texture detail`,s.lumStd>2,s);}
 let minDist=1e9;for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)minDist=Math.min(minDist,Math.hypot(...means[a].map((v,q)=>v-means[b][q])));
 check('the four materials are visually distinct (min mean-RGB distance)',minDist>12,{minDist:+minDist.toFixed(1),means});
 for(const p of ['mobile','balanced','high']){await page.evaluate(async p=>{const q=window.__auroraMAT01;await q.setProfile(p);q.set({force:-1,water:true,lighting:'nordic'});q.setView('valley-walk');q.snap('p');},p);
  const m=await page.evaluate(()=>window.__auroraMAT01.metrics());check(`profile ${p} compiles and renders`,m.shaderErrors.length===0&&m.calls>0,{calls:m.calls,programs:m.programs,memoryMiB:+(m.materialMemoryBytes.total/1048576).toFixed(2)});}
 const pts=[];for(let i=0;i<48;i++)pts.push([-1150+((i*37)%48)/48*600,-500+((i*23)%48)/48*600]);
 const parity=await page.evaluate(p=>window.__auroraMAT01.parity(-850,-200,330,p),pts);
 const err=Math.max(...parity.map(r=>Math.max(...r.gpu.map((g,k)=>Math.abs(g-r.cpu[k])))));
 check('GPU weights match the CPU query (max abs error ≤ 0.02)',err<=.02,{points:parity.length,maxAbsError:+err.toFixed(4)});
 const tile=await page.evaluate(()=>{const q=window.__auroraMAT01;q.set({force:-1,debug:'off',water:true});q.setLayout('canonical');q.setView('tile-seam');q.snap('a');q.setLayout('tile200');q.setView('tile-seam');q.snap('b');const d=q.diff('a','b');delete d.image;q.setLayout('canonical');return d;});
 check('re-tiling (400 m → 200 m) is pixel-identical: no tile seams',tile.maxDelta===0,tile);
 const lod=await page.evaluate(()=>{const q=window.__auroraMAT01;q.set({debug:'weights',water:false});q.setLayout('canonical');q.setView('birchwood-ortho');q.snap('a');q.setLayout('lod',{x:150,z:-1150});q.setView('birchwood-ortho');q.snap('b');const d=q.diff('a','b');delete d.image;q.setLayout('canonical');q.set({debug:'off',water:true});return d;});
 check('LOD (4 → 8/16 m mesh) keeps top-down material identity (≤0.5% pixels Δ>16)',lod.over16/lod.pixels<=.005,{...lod,fractionOver16:+(lod.over16/lod.pixels).toFixed(5)});
 const life=await page.evaluate(()=>window.__auroraMAT01.lifecycle());
 check(`resources dispose (texture count drops by ${life.owned??4}) and recreate (count restored)`,life.afterDispose===life.before-(life.owned??4)&&life.afterRecreate===life.before&&life.resourcesDisposed&&(life.noise??'procedural')===noise,life);
 check('no page errors',errors.length===0,{errors});
}catch(e){ok=false;results.failure=String(e?.stack??e);console.error(e);}
finally{results.pass=ok;await writeFile(out,JSON.stringify(results,null,1)+'\n');await browser.close();}
if(!ok)process.exitCode=1;
