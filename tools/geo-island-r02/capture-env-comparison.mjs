/** Real WebGL comparison of protected R1 review and opt-in B2a geometry with original ENV assets. */
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out=process.argv[2]??'/tmp/r02-island-review';
const base=process.argv[3]??'http://127.0.0.1:4352/geo-island-r02.html';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const variants=[['r1',''],['b2a-a','?terrain=b2a-a']];
const views=['forest-landscape','forest-edge','valley-landscape'];
const report={milestone:'GEO-ISLAND-R02',evidence:'Original real Three.js ENV WebGL captures; PNG, unretouched',variants:[],cameraParity:[]};
const sha=b=>createHash('sha256').update(b).digest('hex');
try{
 for(const [variant,query] of variants){
  const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(180000);
  await page.goto(base+query,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pop02?.snapshot()?.ready===true,{timeout:180000});
  const variantOut={variant,views:[]};
  for(const id of views){
   const available=await page.evaluate(id=>window.__pop02.views.some(v=>v.id===id),id);
   if(!available)throw Error('Missing ENV camera '+id);
   await page.evaluate(id=>window.__pop02.setView(id),id);
   await page.waitForFunction(()=>window.__pop02?.snapshot()?.ready===true,{timeout:180000});
   await page.waitForTimeout(300);
   const data=await page.evaluate(()=>({snapshot:window.__pop02.snapshot(),ids:window.__pop02.ids()}));
   if(data.snapshot.r02Variant!==variant)throw Error('Wrong active terrain variant: '+JSON.stringify(data.snapshot.r02Variant));
   if(!data.snapshot.sourceAssets||data.snapshot.error)throw Error('Source assets not ready or error: '+JSON.stringify(data.snapshot.error));
   await page.addStyleTag({content:'aside,.badge,.foot,#inspect{display:none!important}'});
   const shot=await page.screenshot({path:out+'/'+variant+'-'+id+'.png',type:'png'});
   variantOut.views.push({id,frameSha256:sha(shot),terrainSha256:data.snapshot.r02TerrainSha256,
    count:data.snapshot.descriptorCount,idsSha256:sha(Buffer.from(JSON.stringify(data.ids))),camera:data.snapshot.camera,
    cameraQuaternion:data.snapshot.cameraQuaternion,terrainY:data.snapshot.terrainY,renderer:data.snapshot.renderer});
   console.log(variant,id,data.snapshot.descriptorCount,data.snapshot.r02TerrainSha256);
  }
  if(errors.length)throw Error('Browser errors in '+variant+': '+errors.join('; '));
  report.variants.push(variantOut);
  await page.close();
 }
 const [a,b]=report.variants;
 for(let i=0;i<a.views.length;i++){
  const x=a.views[i],y=b.views[i];
  const idsMatch=x.idsSha256===y.idsSha256;
  const cameraMatch=x.camera.every((v,j)=>Math.abs(v-y.camera[j])<.001);
  report.cameraParity.push({view:x.id,identicalInstanceIds:idsMatch,identicalCamera:cameraMatch});
  if(!idsMatch||!cameraMatch)throw Error('Birchwood/Valley identity changed at '+x.id);
 }
 report.status='PASS: matched local views preserve camera and population IDs; visual approval still required';
}catch(e){report.status='FAIL';report.error=String(e);console.error(e);process.exitCode=1;}
finally{await writeFile(out+'/integrated-env-review.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
