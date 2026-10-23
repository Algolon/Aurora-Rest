// GEO-R02C-B2a genuine browser traversal (MEASURED in the running Three.js viewer, not an emulation): loads ?terrain=<variant>,
// confirms the verified variant and the active route set, then runs the viewer's own qa.walkRouteForTest on every route and compares
// the rendered terrain surface with the canonical grid along the candidate route (terrain / player collision consistency).
// Usage: node tools/geo-r02c-b2a/traverse.mjs --url http://127.0.0.1:4351/geo-r02b.html --out docs/geo-r02c-b2a/validation/traversal.json
import {chromium} from 'playwright';import {existsSync} from 'node:fs';import {writeFile} from 'node:fs/promises';
const arg=(n,f)=>{const i=process.argv.indexOf('--'+n);return i>0?process.argv[i+1]:f;};
const url=arg('url','http://127.0.0.1:4351/geo-r02b.html'),out=arg('out','docs/geo-r02c-b2a/validation/traversal.json');
const executablePath=process.env.CHROME||(existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);
const browser=await chromium.launch({headless:true,executablePath,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const result={tool:'tools/geo-r02c-b2a/traverse.mjs',url,browser:browser.version(),variants:{}};
for(const v of ['b01-b1','b2a-a']){
 const page=await browser.newPage({viewport:{width:800,height:500}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${url}?terrain=${v}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__auroraR02B?.ready,null,{timeout:600000});
 const r=await page.evaluate(()=>{const qa=window.__auroraR02B,variant=window.__auroraVariant;const snap=qa.snapshot();
  return {identity:{terrainSha256:snap.terrainSha256,baselineTerrainSha256:snap.baselineTerrainSha256,activeTerrain:snap.activeTerrain,verified:variant?.verified??false},
   routeIds:variant?.routes?variant.routes.map(x=>x.id):[]};});
 const routeIds=await page.evaluate(()=>{const ids=[];for(const id of ['hero','tarn-ascent','peak-ascent','peak-scramble','peak-ascent-r1','hidden-loop','west-cape-spur','south-shoulder-loop']){try{window.__auroraR02B.walkRouteForTest(id);ids.push(id);}catch{}}return ids;});
 const walks={};for(const id of routeIds){const t=Date.now();walks[id]={...(await page.evaluate(x=>window.__auroraR02B.walkRouteForTest(x),id)),seconds:(Date.now()-t)/1000};}
 let collision=null;
 if(v==='b2a-a'){collision=await page.evaluate(async()=>{const routes=await (await fetch('/geo-r02c-b2a/routes.json')).json();const o={};
   for(const R of routes.routes){const p=R.points2;let maxDiff=0,maxWater=-1e9;
    for(let i=0;i<p.length;i+=2){const s=window.__auroraR02B.sample(p[i][0],p[i][1]);maxDiff=Math.max(maxDiff,Math.abs(s.canonical-s.rendered));maxWater=Math.max(maxWater,s.water-s.rendered);}
    o[R.id]={samples:Math.ceil(p.length/2),maxCanonicalVsRenderedM:maxDiff,maxWaterAboveTerrainM:maxWater};}
   return o;});}
 const eye=await page.evaluate(()=>window.__auroraR02B.snapshot().eyeHeight);
 result.variants[v]={...r,walks,collision,eyeHeightAfterLastWalkM:eye,errors};await page.close();
}
await browser.close();await writeFile(out,JSON.stringify(result,null,1)+'\n');console.log(JSON.stringify(result,null,1));
