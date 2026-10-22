/** ASSET-01E2R-A2: capture actual Chromium Three.js WebGL, never synthetic hero renders. */
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),out=resolve(root,'rock-a2-evidence');
await mkdir(out,{recursive:true});
const server=await createServer({root,server:{host:'127.0.0.1',port:4201,strictPort:true},logLevel:'error'});
let browser;const errors=[],shots=[],metrics={};
const assert=(condition,message)=>{if(!condition)throw Error(message);};
try{
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',error=>errors.push('pageerror '+String(error)));
 page.on('console',message=>{if(message.type()==='error')errors.push('console '+message.text());});
 await page.goto('http://127.0.0.1:4201/rock-a2.html',{waitUntil:'networkidle',timeout:60000});
 await page.waitForFunction(()=>window.__rockA2Lab?.frame()>5,{timeout:60000});
 async function capture(name,config){
  const report=await page.evaluate(c=>window.__rockA2Lab.configure(c),config);
  assert(report&&!report.errors,name+': '+report.errors);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const url=await page.evaluate(()=>window.__rockA2Lab.capture());
  assert(url?.startsWith('data:image/png;base64,'),'No rendered WebGL PNG: '+name);
  const png=Buffer.from(url.slice('data:image/png;base64,'.length),'base64');
  assert(png.length>28000,'Possibly blank WebGL render: '+name);
  await writeFile(resolve(out,name+'.png'),png);shots.push(name+'.png');
  const final=await page.evaluate(()=>window.__rockA2Lab.inspect());
  assert(final.meshes.length>0&&final.meshes.every(x=>x.sameGeometry),'G1 geometry identity violation');
  assert(final.meshes.every(x=>x.triangles===136),'G1 changed triangle count');
  assert(!final.errors,'Browser errors for '+name+': '+final.errors);
  metrics[name]=final;
 }
 for(const light of ['neutral','nordic','grazing'])
  await capture('t1-t2-t3-'+light,{mode:'materials',projection:'triplanar',view:'threequarter',light,zoom:104,wireframe:false});
 for(const study of ['T1','T2','T3'])
  for(const light of ['neutral','nordic','grazing'])
   await capture(study.toLowerCase()+'-planar-vs-triplanar-'+light,{mode:'mapping',study,view:'threequarter',light,zoom:102,wireframe:false});
 for(const study of ['T1','T2','T3']){
  for(const view of ['front','rear','left','right','human'])
   await capture(study.toLowerCase()+'-'+view+'-nordic',{mode:'single',study,projection:'triplanar',view,light:'nordic',zoom:115,wireframe:false});
  await capture(study.toLowerCase()+'-fracture-closeup-grazing',{mode:'single',study,projection:'triplanar',view:'threequarter',light:'grazing',zoom:180,wireframe:false});
  await capture(study.toLowerCase()+'-aurora-vegetation',{mode:'context',study,projection:'triplanar',view:'threequarter',light:'nordic',zoom:100,wireframe:false});
 }
 await capture('a1-m1-vs-a2-t1',{mode:'a1-comparison',study:'T1',projection:'triplanar',view:'threequarter',light:'neutral',zoom:100,wireframe:false});
 await capture('g1-wireframe-control',{mode:'single',study:'T1',projection:'triplanar',view:'threequarter',light:'neutral',wireframe:true,zoom:120});
 const texturePngs={};
 for(const study of ['T1','T2','T3'])for(const kind of ['albedo','normal','roughness']){
  const url=await page.evaluate(({study,kind})=>window.__rockA2Lab.mapPreview(study,kind),{study,kind});
  assert(url.startsWith('data:image/png;base64,'),'No PNG map '+study+' '+kind);
  const filename=study.toLowerCase()+'-'+kind+'-512.png';
  const data=Buffer.from(url.slice('data:image/png;base64,'.length),'base64');
  texturePngs[filename]={sha256:createHash('sha256').update(data).digest('hex'),bytes:data.length};
  await writeFile(resolve(out,filename),data);
 }
 const base=await page.evaluate(()=>{
  const g=window.__rockA2Lab.geometry;
  const p=g.getAttribute('position').array,n=g.getAttribute('normal').array;
  return {positions:[...p],normals:[...n],triangles:p.length/9,vertices:p.length/3};
 });
 const geometrySHA256=createHash('sha256').update(Buffer.from(new Float32Array(base.positions).buffer))
  .update(Buffer.from(new Float32Array(base.normals).buffer)).digest('hex');
 const gl=await page.evaluate(()=>{
  const l=window.__rockA2Lab,renderer=window.__rockA2Lab.inspect();
  return {version:renderer.webgl,availableStudies:renderer.textures.statistics};
 });
 assert(base.triangles===136&&base.vertices===408,'Approved G1 geometry not preserved');
 assert(errors.length===0,errors.join('\n'));
 await writeFile(resolve(out,'metrics.json'),JSON.stringify({
  method:'ACTUAL THREE.JS / CHROMIUM WEBGL/SwiftShader from 1440x900 canvas',
  unchangedG1Geometry:true,geometrySHA256,vertexCount:base.vertices,triangles:base.triangles,
  physicalAndroidVerified:false,artApproved:false,
  shots,texturePngs,metrics,webgl:gl,errors},null,2));
 console.log('A2 REAL WEBGL PASS',shots.length,'3D screenshots,',Object.keys(texturePngs).length,'PBR texture PNGs');
}finally{await browser?.close();await server.close();}
