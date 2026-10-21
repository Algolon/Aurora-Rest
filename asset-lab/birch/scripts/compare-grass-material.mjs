// ASSET-01D1 material pixel-parity test using TWO independent real browser
// runtimes: actual pinned Feh Lu We source Vite imports vs Aurora grass module.
// Serve the original source read-only with an in-memory Vite virtual page.
// No cloning/copying of Feh Lu We sources into the Aurora runtime.
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {PNG} from 'pngjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const flw=process.env.FLW_ROOT,aurora=process.cwd();
if(!flw)throw Error('FLW_ROOT must be pinned Feh Lu We checkout');
const out=resolve(aurora,'grass-material-parity');
await mkdir(out,{recursive:true});
const flags='?vegstyle=woodland-r02&vegdetail=r05&gardenart=r09';
function sceneCode(source){
 const imports=source?
  "import {referencePlantModel} from '/src/world/woodkit.ts'; import {indoorLeafMaterial} from '/src/world/indoorPlants.ts';":
  "import {createGrassFamily} from '/src/grass/index.ts';";
 const construct=source?
  "const material=indoorLeafMaterial(); const getGrass=v=>referencePlantModel('grass',v,true,true);":
  "const family=createGrassFamily(); const material=family.material; const getGrass=v=>family.getGeometry(v);";
 return `import * as THREE from 'three';
${imports}
${construct}
const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(960,600);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.20;
renderer.shadowMap.enabled=false;document.body.style.margin='0';document.body.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#cedbd4');
scene.add(new THREE.HemisphereLight('#f1f9fd','#718372',2.05));
const sun=new THREE.DirectionalLight('#fff3da',2.7);sun.position.set(-2.1,4.5,3.5);scene.add(sun);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(4,4),new THREE.MeshLambertMaterial({color:'#b8bbb1'}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.008;scene.add(floor);
const camera=new THREE.PerspectiveCamera(44,960/600,.015,50);
camera.position.set(.6,.66,1.7);camera.lookAt(0,.31,0);
const mesh=new THREE.Mesh(getGrass(0),material);mesh.name='original-flw-reference-grass';scene.add(mesh);
window.__grassReference={
 capture(v){
  mesh.geometry=getGrass(v);
  renderer.render(scene,camera);
  return renderer.domElement.toDataURL('image/png');
 },
 inspect(){return {flags:location.search,material:material.constructor.name,
   surface:material.userData.surface,defines:material.defines,
   color:material.color.getHexString(),vertexColors:material.vertexColors,
   mapWidth:material.map?.image?.width,
   drawcalls:renderer.info.render.calls,version:renderer.getContext().getParameter(renderer.getContext().VERSION)}}
};
renderer.render(scene,camera);
`;
}
function plugin(source){
 const code=sceneCode(source);
 return {name:'grass-parity-virtual-page',
  enforce:'pre',
  resolveId(id){if(id==='/grass-parity-entry.ts'||id==='grass-parity-entry.ts')return '\0grass-parity-entry'},
  load(id){if(id==='\0grass-parity-entry')return code},
  configureServer(s){s.middlewares.use('/grass-parity.html',(req,res)=>{res.setHeader('Content-Type','text/html;charset=UTF-8');
   res.end('<!doctype html><html><head><meta charset="utf-8"/></head><body><script type="module" src="/grass-parity-entry.ts"></script></body></html>')})}
 };
}
const originalServer=await createServer({root:flw,plugins:[plugin(true)],server:{port:4195,strictPort:true,host:'127.0.0.1'},logLevel:'error',optimizeDeps:{noDiscovery:true}});
const auroraServer=await createServer({root:aurora,plugins:[plugin(false)],server:{port:4196,strictPort:true,host:'127.0.0.1'},logLevel:'error',optimizeDeps:{noDiscovery:true}});
let browser;
try{
 await originalServer.listen();await auroraServer.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const results=[],errors=[];
 const pageSource=await browser.newPage({viewport:{width:960,height:600}}),pageAurora=await browser.newPage({viewport:{width:960,height:600}});
 for(const page of [pageSource,pageAurora]){
  page.on('pageerror',e=>errors.push('pageerror '+e));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  page.on('requestfailed',r=>errors.push('requestfail '+r.url()+' '+r.failure()?.errorText));
  page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text())});
 }
 await Promise.all([
  pageSource.goto('http://127.0.0.1:4195/grass-parity.html'+flags,{waitUntil:'networkidle',timeout:75000}),
  pageAurora.goto('http://127.0.0.1:4196/grass-parity.html'+flags,{waitUntil:'networkidle',timeout:75000})
 ]);
 // A first reference import may compile the full Feh Lu We woodland bundle.
// Use the actual waitForFunction(options) position and surface HTTP/JS errors.
 const awaitReady=async(page,name)=>{
  try{await page.waitForFunction(()=>!!window.__grassReference,null,{timeout:110000});}
  catch(e){const diag=await page.evaluate(()=>({
   title:document.title,url:location.href,body:document.body.textContent?.slice(0,300),
   scripts:[...document.scripts].map(x=>x.src),refReady:!!window.__grassReference,
   entries:performance.getEntriesByType('resource').slice(-8).map(x=>x.name)}));
   throw Error(name+' reference failed: '+String(e)+'; '+JSON.stringify({diag,errors}));
  }
 };
 await Promise.all([awaitReady(pageSource,'Original FLW'),awaitReady(pageAurora,'Aurora')]);
 const sourceInfo=await pageSource.evaluate(()=>window.__grassReference.inspect()),
  auroraInfo=await pageAurora.evaluate(()=>window.__grassReference.inspect());
 for(const k of ['surface','color','vertexColors','mapWidth']){
  if(sourceInfo[k]!==auroraInfo[k])throw Error('Original vs Aurora material property mismatch '+k+': '+sourceInfo[k]+'/'+auroraInfo[k]);
 }
 for(const variant of [0,1,2,3]){
  const [a,b]=await Promise.all([pageSource.evaluate(v=>window.__grassReference.capture(v),variant),
   pageAurora.evaluate(v=>window.__grassReference.capture(v),variant)]);
  const im1=PNG.sync.read(Buffer.from(a.split(',')[1],'base64')),im2=PNG.sync.read(Buffer.from(b.split(',')[1],'base64'));
  let changed=0,max=0;
  for(let j=0;j<im1.data.length;j+=4){
   const difference=Math.max(Math.abs(im1.data[j]-im2.data[j]),Math.abs(im1.data[j+1]-im2.data[j+1]),Math.abs(im1.data[j+2]-im2.data[j+2]));
   if(difference>12)changed++;max=Math.max(max,difference);
  }
  results.push({variant,changedPixelsRGB12:changed,maxRGBDifference:max,totalPixels:im1.width*im1.height});
  await Promise.all([writeFile(resolve(out,'source-grass-'+variant+'.png'),Buffer.from(a.split(',')[1],'base64')),
   writeFile(resolve(out,'aurora-grass-'+variant+'.png'),Buffer.from(b.split(',')[1],'base64'))]);
  if(changed>1800)throw Error('Production source-vs-Aurora material regression '+variant+': '+changed+' pixels');
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile(resolve(out,'matched-materials.json'),JSON.stringify({sourceInfo,auroraInfo,results,errors},null,2));
 console.log('GRASS ORIGINAL VS AURORA WEBGL MATERIAL PIXEL PARITY PASS '+JSON.stringify({sourceInfo,auroraInfo,results}));
}finally{await browser?.close();await originalServer.close();await auroraServer.close()}
