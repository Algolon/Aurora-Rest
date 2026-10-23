// GEO-R02C-A1b-alpha passability in the real viewer: walks every route with the viewer's own collision (walkRouteForTest) on
// M0 (= R1) and on A1b-alpha and requires identical results. Also records the viewer's active/baseline terrain identity.
// Usage: node tools/geo-r02c-a1b/passability.mjs --url http://127.0.0.1:4321/geo-r02b.html --out docs/geo-r02c-a1b-alpha/validation/passability.json
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
const arg=(n,f)=>{const i=process.argv.indexOf('--'+n);return i>0?process.argv[i+1]:f;};
const url=arg('url','http://127.0.0.1:4321/geo-r02b.html'),out=arg('out','docs/geo-r02c-a1b-alpha/validation/passability.json');
const browser=await chromium.launch({headless:true,executablePath:existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const res={method:'window.__auroraR02B.walkRouteForTest(route) for every route, the viewer walking collision on the composed terrain',variants:{}};
for(const v of ['a1a-m0','a1b-alpha']){
 const page=await browser.newPage({viewport:{width:640,height:400}});page.setDefaultTimeout(600000);
 await page.goto(`${url}?terrain=${v}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__auroraR02B?.ready,null,{timeout:600000});
 res.variants[v]=await page.evaluate(()=>{const q=window.__auroraR02B,s=q.snapshot();const ids=['hero','tarn-ascent','peak-ascent','hidden-loop','west-cape-spur','south-shoulder-loop'];
  return {identity:{terrainSha256:s.terrainSha256,baselineTerrainSha256:s.baselineTerrainSha256,activeTerrain:s.activeTerrain},routes:Object.fromEntries(ids.map(id=>[id,q.walkRouteForTest(id)]))};});
 await page.close();
}
await browser.close();
const a=res.variants['a1a-m0'].routes,b=res.variants['a1b-alpha'].routes;
res.identical=Object.keys(a).every(k=>JSON.stringify(a[k])===JSON.stringify(b[k]));res.allPassable=Object.values(b).every(r=>r.blockedAt===-1);
await writeFile(out,JSON.stringify(res,null,1)+'\n');console.log(JSON.stringify({identical:res.identical,allPassable:res.allPassable,identity:res.variants['a1b-alpha'].identity}));
if(!res.identical)process.exitCode=1;
