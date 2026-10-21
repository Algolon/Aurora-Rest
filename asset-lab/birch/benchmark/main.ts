import * as THREE from 'three';
import {createBirchFamily,type BirchLod} from '../src/index.ts';
import {createBirchBatch,type BirchBatch} from '../src/rendering/natureBatch.ts';
import {getBatchCapabilities,type RenderMode} from '../src/rendering/capabilities.ts';
import {mulberry32} from '../src/rng.ts';
const outer=document.createElement('div');document.body.append(outer);
outer.innerHTML=`<aside id="controls" style="position:absolute;z-index:2;top:14px;left:14px;max-width:325px;padding:16px;background:#17232bdc;color:white;font:13px system-ui;border-radius:10px">
<h2 style="margin:0 0 6px">Aurora Rest · Birch Batching</h2><p>ASSET-01B2 · Standalone benchmark, no island</p>
<label>Renderer <select id="mode"><option>auto</option><option>instanced</option><option>multidraw</option></select></label>
<label>Population <select id="population"><option>1</option><option>100</option><option>500</option><option>1000</option></select></label>
<label>LOD <select id="lod"><option>auto</option><option>near</option><option>mid</option><option>far</option><option>xfar</option></select></label>
<label>View <select id="view"><option>overview</option><option>approach</option><option>rotation</option><option>grove</option><option>boundary</option><option>shadow</option><option>reference</option></select></label>
<label>Shadows <input type="checkbox" id="shadows" checked></label>
<label>Culling <input type="checkbox" id="culling" checked></label>
<label>Camera angle <input type="range" min="-180" max="180" value="25" id="angle"></label>
<pre id="readout" style="white-space:pre-wrap;font:12px monospace"></pre></aside>`;
const style=document.createElement('style');style.textContent='label{display:block;margin:7px 0}select{width:128px;background:#edf4f7}input{vertical-align:middle}';document.head.append(style);
const e=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(1280,900);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.BasicShadowMap;
outer.prepend(renderer.domElement);renderer.domElement.style.display='block';
const scene=new THREE.Scene();scene.background=new THREE.Color('#bbced2');
const camera=new THREE.PerspectiveCamera(54,1280/900,.1,350);scene.add(camera);
scene.add(new THREE.HemisphereLight('#e7f4fa','#7c7b6f',1.8));
const sun=new THREE.DirectionalLight('#ffeed1',2.5);sun.position.set(-18,35,22);sun.target.position.set(0,3,0);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-85;sun.shadow.camera.right=85;sun.shadow.camera.top=85;sun.shadow.camera.bottom=-85;
sun.shadow.camera.far=130;sun.shadow.bias=-.00025;sun.shadow.normalBias=.02;
scene.add(sun,sun.target);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(240,240),new THREE.MeshLambertMaterial({color:'#919c88'}));floor.rotation.x=-Math.PI/2;floor.position.y=-.03;floor.receiveShadow=true;scene.add(floor);
const family=createBirchFamily();
const reference=family.createMesh(0,'near');scene.add(reference);
const capabilities=getBatchCapabilities(renderer);
let mode:RenderMode='auto',population=1,view='overview',culling=true,shadows=true,forcedLod:BirchLod|null=null,angle=25;
let forest:BirchBatch|null=null,frames=0,lastError:string|null=null;
let lastStats={};
function rebuild(){
 forest?.dispose();
 forest=createBirchBatch({scene,renderer,family,mode,shadows,culling,capacity:1100});
 const r=mulberry32(952742);
 for(let i=0;i<population;i++){
  const a=r()*Math.PI*2,rad=i===0?0:3+Math.sqrt(r())*58;
  forest.add({variant:(i%3) as 0|1|2,position:[rad*Math.cos(a),0,rad*Math.sin(a)],rotationY:i===0?0:r()*Math.PI*2,scale:i===0?1:.75+r()*.45});
 }
 forest.setForcedLod(forcedLod);reference.visible=view==='reference'&&population===1;
 if(reference.visible)forest.setVisible(0,false);
 updateCamera();lastStats=forest.update(camera);
}
function updateCamera(){
 const yaw=angle*Math.PI/180;
 let dist=population===1?18:72,high=population===1?9:36,targetY=4;
 if(view==='grove'){dist=13;high=7}
 if(view==='approach'){dist=38;high=10}
 if(view==='boundary'){dist=23;high=9}
 if(view==='shadow'){dist=population===1?20:32;high=22}
 if(view==='reference'){dist=17;high=11}
 if(view==='rotation'){dist=13;high=6;targetY=3.5}
 const target=new THREE.Vector3(0,targetY,0);
 camera.position.set(Math.sin(yaw)*dist,high,Math.cos(yaw)*dist);
 camera.lookAt(target);camera.updateMatrixWorld();
}
function apply(){
 mode=e<HTMLSelectElement>('mode').value as RenderMode;
 population=Number(e<HTMLSelectElement>('population').value);
 view=e<HTMLSelectElement>('view').value;
 culling=e<HTMLInputElement>('culling').checked;
 shadows=e<HTMLInputElement>('shadows').checked;
 forcedLod=e<HTMLSelectElement>('lod').value==='auto'?null:e<HTMLSelectElement>('lod').value as BirchLod;
 angle=Number(e<HTMLInputElement>('angle').value);
 sun.castShadow=shadows;renderer.shadowMap.enabled=shadows;
 rebuild();
}
for(const id of ['mode','population','view','lod','shadows','culling','angle']){
 e<HTMLElement>(id).addEventListener(id==='angle'?'input':'change',()=>{
  try{apply();lastError=null}catch(err){lastError=String(err);e('readout').textContent=lastError}
 });
}
function tick(){
 try{
  if(forest){lastStats=forest.update(camera)}
  renderer.render(scene,camera);frames++;
  if(frames%15===0){
   e('readout').textContent=JSON.stringify({mode:forest?.mode,capabilities,stats:lastStats,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,lastError},null,2);
  }
 }catch(e){lastError=String(e);console.error(e)}
 requestAnimationFrame(tick);
}
rebuild();tick();
Object.assign(window,{__birchB2:{
 get renderer(){return renderer},scene,camera,sun,reference,family,
 get forest(){return forest},get frames(){return frames},get error(){return lastError},
 capabilities,
 configure(o:{mode?:RenderMode;population?:number;view?:string;lod?:string;shadows?:boolean;culling?:boolean;angle?:number}){
  for(const [k,v] of Object.entries(o)){const el=e<HTMLInputElement|HTMLSelectElement>(k);if(typeof v==='boolean')(el as HTMLInputElement).checked=v;else el.value=String(v)}
  apply();return this.inspect();
 },
 inspect(){return {mode:forest?.mode,capabilities,population,view,shadows,culling,forcedLod,frames,error:lastError,stats:forest?.getStats(),triangles:renderer.info.render.triangles,calls:renderer.info.render.calls}},
 moveCamera(pos:[number,number,number],target:[number,number,number]=[0,4,0]){camera.position.set(...pos);camera.lookAt(new THREE.Vector3(...target));camera.updateMatrixWorld();forest?.update(camera)},
 getObjects(){return forest?.objects??[]},
 getReference(){return reference}
}});
addEventListener('pagehide',()=>{forest?.dispose();family.dispose();floor.geometry.dispose();(floor.material as THREE.Material).dispose();renderer.dispose()});
