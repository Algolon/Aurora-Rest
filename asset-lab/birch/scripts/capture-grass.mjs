import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {PNG} from 'pngjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),out=resolve(root,'grass-evidence');
await mkdir(out,{recursive:true});
let browser;const errors=[],images=[];
const server=await createServer({root,server:{host:'127.0.0.1',port:4191,strictPort:true},logLevel:'error'});
const assert=(condition,message)=>{if(!condition)throw Error(message)};
try{
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:1100,height:720},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('pageerror '+String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text())});
 await page.goto('http://127.0.0.1:4191/grass.html',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__grassLab?.frame()>3,{timeout:60000});
 const configure=async o=>{
  const result=await page.evaluate(o=>window.__grassLab.configure(o),o);
  assert(!result.error,'Showroom error: '+result.error);
  return result;
 };
 const shot=async name=>{
  const url=await page.evaluate(()=>window.__grassLab.capture());
  assert(url.startsWith('data:image/png;base64,'),'Not a WebGL canvas readback');
  await writeFile(resolve(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));images.push(name+'.png');
 };
 const metadata=await page.evaluate(()=>{
  const l=window.__grassLab,gl=l.renderer.getContext();
  return {ua:navigator.userAgent,version:String(gl.getParameter(gl.VERSION)),
   renderer:String(gl.getParameter(gl.RENDERER)),drawcalls:l.renderer.info.render.calls,
   atlas:l.family().material.map?.image?.width,atlasHeight:l.family().material.map?.image?.height,
   shaderName:l.family().material.customProgramCacheKey(),surface:l.family().material.userData.surface,
   frontSide:l.family().material.side===0,vertexColors:l.family().material.vertexColors,
   shadowDepth:l.meshes().some(m=>m.customDepthMaterial!==undefined),
   materialDefines:l.family().material.defines};
 });
 assert(metadata.atlas===1024&&metadata.atlasHeight===512,'Original source leaf texture atlas dimensions lost');
 assert(metadata.frontSide&&metadata.vertexColors&&metadata.surface==='foliage','Not original material configuration');
 assert(!metadata.shadowDepth,'Grass erroneously uses tree vegetationDepth');
 await configure({variant:'all',view:'overview',light:'nordic',preset:'flw-production-reference',zoom:100});await shot('production-all-four-nordic');
 await configure({light:'neutral'});await shot('production-all-four-neutral');
 for(const variant of ['0','1','2','3']){
  await configure({variant,view:'threequarter',light:'nordic',zoom:100});await shot('production-variant-'+variant+'-threequarter');
  await configure({view:'low',zoom:115});await shot('production-variant-'+variant+'-low-angle');
  await configure({view:'top',zoom:115});await shot('production-variant-'+variant+'-top');
  await configure({view:'blade',zoom:140});await shot('production-variant-'+variant+'-blade-close');
 }
 for(const [view,variant] of [['seed','2'],['sedge','3'],['blade','0']]){
  await configure({variant,view,zoom:160,light:'neutral'});await shot('production-'+view+'-detail');
 }
 await configure({variant:'all',view:'overview',preset:'refined-ground-r05',light:'nordic'});await shot('diagnostic-ground-r05-not-production');
 await configure({preset:'basic-grass-model'});await shot('diagnostic-basic-grassModel-not-production');
 await configure({preset:'flw-production-reference'});await shot('production-return-after-switch');
 const checks=await page.evaluate(async()=>{
  const l=window.__grassLab;
  const {createGrassFamily}=await import('/src/grass/index.ts');
  const a=createGrassFamily(),b=createGrassFamily();
  const source=l.family().material,tex=source.map;let texDisposed=0,matDisposed=0;
  tex.addEventListener('dispose',()=>texDisposed++);
  source.addEventListener('dispose',()=>matDisposed++);
  if(a.material!==b.material||a.material!==source)throw Error('Production material not shared');
  if(a.getGeometry(2)===b.getGeometry(2))throw Error('Family geometry incorrectly shared across owners');
  for(const f of [a,b])for(const v of [0,1,2,3]){
   const mesh=f.createMesh(v);if(mesh.material!==source||mesh.customDepthMaterial)throw Error('Grass material invalid');
  }
  a.dispose();a.dispose();b.dispose();
  if(texDisposed||matDisposed)throw Error('Other grass owners prematurely disposed');
  const old=l.family();
  const counts=[0,1,2,3].map(v=>{
   const g=old.getGeometry(v),p=g.getAttribute('position');
   g.computeBoundingBox();
   return {variant:v,triangles:g.index?g.index.count/3:p.count/3,
     vertices:p.count,indexed:!!g.index,height:g.boundingBox.max.y,
     bytes:Object.values(g.attributes).reduce((sum,a)=>sum+a.array.byteLength,0)+(g.index?.array.byteLength||0)};
  });
  old.dispose();
  if(texDisposed!==1||matDisposed!==1)throw Error('Last-owner resource lifecycle error '+texDisposed+'/'+matDisposed);
  const fresh=createGrassFamily();if(fresh.material===source||fresh.material.map===tex)throw Error('Disposed resources reused');
  const tree=fresh.createMesh(2);tree.position.set(0,0,0);l.scene.add(tree);
  l.renderer.render(l.scene,l.camera);l.scene.remove(tree);
  fresh.dispose();
  return {counts,ownerSharing:true,lastOwnerDisposeOnce:true,recreatedFreshTextureAndMaterial:true,
   successfulRecreatedBrowserRender:true};
 });
 if(errors.length)throw Error(errors.join('\n'));
 const evidence={metadata,images,checks,errors};
 await writeFile(resolve(out,'grass-browser-metrics.json'),JSON.stringify(evidence,null,2));
 console.log('GRASS REAL WEBGL PASS '+JSON.stringify({metadata,checks,shots:images.length,errors}));
}finally{await browser?.close();await server.close()}
