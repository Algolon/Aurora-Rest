/** ASSET-01E1: pixel-matched real browser comparison with untouched FLW source.
 * Source is served through an in-memory Vite virtual route, never written to.
 * Diagnostic: renderer/light/pixel differences measured, not normalized away. */
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {PNG} from 'pngjs';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),flw=process.env.FLW_ROOT,pin='17eafb0902833fb1121c77083f9f862eb4ffcd96';
if(!flw)throw Error('FLW_ROOT required for source-versus-Aurora material rendering');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:flw,encoding:'utf8'}).trim(),pin);
const out=resolve(root,'rock-material-parity');await mkdir(out,{recursive:true});
function sourceScript(original){
 const maker=original?
 "const geometry=rockModel(11),material=woodMats().rock;const mesh=new THREE.Mesh(geometry,material);":
 "const family=createRockFamily(),mesh=family.createMesh(11);const geometry=mesh.geometry,material=family.material;";
 const imports=original?
 "import {rockModel,woodMats} from '/src/world/woodkit.ts';":
 "import {createRockFamily} from '/src/rocks/index.ts';";
 return `
 import * as THREE from 'three';
 ${imports}
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(1);renderer.setSize(1100,740);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.07;renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 document.body.style.margin='0';document.body.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#d6d9dd');
 scene.add(new THREE.HemisphereLight('#dfefff','#384b4c',2.2));
 const sun=new THREE.DirectionalLight('#ffeac6',2);sun.position.set(-5,12,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
 sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;sun.shadow.bias=-.0003;scene.add(sun);
 const fill=new THREE.DirectionalLight('#a6c6e1',.8);fill.position.set(7,5,-5);scene.add(fill);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#9099a0',roughness:1}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.49;floor.receiveShadow=true;scene.add(floor);
 ${maker}
 mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
 const camera=new THREE.PerspectiveCamera(42,1100/740,.1,150);
 camera.position.set(2.15,1.54,4.2);camera.lookAt(0,.35,0);
 renderer.render(scene,camera);
 const canvas=document.querySelector('canvas');
 window.__rockParity={
  source:${original},vertices:geometry.getAttribute('position').count,triangles:geometry.getAttribute('position').count/3,
  surface:material.userData.surface,texture:material.map?.image?.width,defines:material.defines,
  capture(){renderer.render(scene,camera);return canvas.toDataURL('image/png')}
 };
 `;
}
function plugin(original){
 return {name:'e1-rock-parity-virtual-page',enforce:'pre',
  configureServer(server){server.middlewares.use((req,res,next)=>{
   if(req.url?.split('?')[0]!=='/__rock_e1_studio.html')return next();
   res.setHeader('Content-Type','text/html; charset=utf-8');
   res.end('<!doctype html><html><body><script type="module" src="/__rock_e1_studio.js"></script></body></html>');
  });},
  resolveId(id){if(id==='/__rock_e1_studio.js')return '\0e1-rock-parity-studio';},
  load(id){if(id==='\0e1-rock-parity-studio')return sourceScript(original);}
 };
}
const servers=[await createServer({root:flw,configFile:false,base:'/',optimizeDeps:{noDiscovery:true,include:[]},plugins:[plugin(true)],logLevel:'error',server:{port:4194,host:'127.0.0.1',strictPort:true}}),
 await createServer({root,plugins:[plugin(false)],logLevel:'error',server:{port:4195,host:'127.0.0.1',strictPort:true}})];
let browser;const errors=[];
try{
 for(const s of servers)await s.listen();
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
 const outputs=[];
 for(const [port,label] of [[4194,'original-flw'],[4195,'aurora-e1']]){
  const page=await browser.newPage({viewport:{width:1100,height:740},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(label+': '+String(e)));
  page.on('console',e=>{if(e.type()==='error')errors.push(label+': '+e.text())});
  await page.goto('http://127.0.0.1:'+port+'/__rock_e1_studio.html',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>!!window.__rockParity?.capture,{timeout:45000}).catch(e=>{throw Error(label+' studio timeout: '+String(e)+'; browser errors '+JSON.stringify(errors));});
  const data=await page.evaluate(()=>({details:window.__rockParity,capture:window.__rockParity.capture()}));
  const bytes=Buffer.from(data.capture.split(',')[1],'base64');
  await writeFile(resolve(out,label+'.png'),bytes);
  outputs.push({label,bytes,meta:{vertices:data.details.vertices,triangles:data.details.triangles,
   surface:data.details.surface,texture:data.details.texture,defines:data.details.defines}});
  await page.close();
 }
 assert.deepEqual(outputs.map(x=>x.meta.vertices),[78,78]);
 const a=PNG.sync.read(outputs[0].bytes),b=PNG.sync.read(outputs[1].bytes);
 assert.equal(a.width,b.width);assert.equal(a.height,b.height);
 const count=a.width*a.height;
 let changed=0,sumAbs=0,maxAbs=0;
 for(let i=0;i<a.data.length;i+=4){
  let perPixel=0;
  for(let c=0;c<3;c++){const d=Math.abs(a.data[i+c]-b.data[i+c]);perPixel+=d;sumAbs+=d;maxAbs=Math.max(maxAbs,d);}
  if(perPixel>0)changed++;
 }
 const report={method:'Original pinned woodkit.ts / woodMats().rock WebGL against local scoped Aurora stone adapter; identical camera, lighting and three version',
  pin,width:a.width,height:a.height,pixels:count,changed,changedFraction:changed/count,
  meanAbsoluteChannelDifference:sumAbs/(count*3),maxAbsoluteChannelDifference:maxAbs,
  meshes:outputs.map(x=>({label:x.label,...x.meta})),errors,shaderCompilationActual:true,actualAndroidVerified:false};
 await writeFile(resolve(out,'material-pixel-comparison.json'),JSON.stringify(report,null,2));
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('ASSET-01E1 SOURCE MATERIAL WEBGL COMPARISON '+JSON.stringify(report));
}finally{await browser?.close();for(const s of servers)await s.close();}
