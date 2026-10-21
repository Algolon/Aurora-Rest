import * as THREE from 'three';
import {createGrassFamily} from '../src/grass/index.ts';
import {createGrassBatch,type GrassBatch} from '../src/grass/rendering/grassBatch.ts';
import {generateGrassPlacement} from '../src/grass/groundCoverPlacement.ts';
import {generateNaturalGrassPlacement} from '../src/grass/naturalGroundCover.ts';
import {sampleMeadowWalk,WALK_PHASES} from '../src/grass/meadowWalk.ts';
import {createMeadowGroundTexture} from '../src/grass/meadowGround.ts';
import {getBatchCapabilities,type RenderMode} from '../src/rendering/capabilities.ts';
import type {FadePreset} from '../src/grass/rendering/grassFade.ts';

type View='top'|'walk'|'short'|'tall'|'seed'|'sedge'|'transition'|'approach';
type Version='v0'|'v1'|'v2'|'v3';
const panel=document.createElement('aside');
panel.innerHTML=`<b>AURORA REST · ASSET-01D2R</b><small>V0 original / V1 placement / V2 placement + fade</small>
<label>Version <select id="version"><option value="v0">V0 — original D2</option><option value="v1">V1 — natural placement</option><option value="v2" selected>V2 — refined fade</option><option value="v3">V3 — subtle ground</option></select></label>
<label>Instances <select id="population"><option>100</option><option>500</option><option selected>2000</option><option>5000</option></select></label>
<label>Backend <select id="mode"><option value="auto">Auto</option><option value="instanced">Instanced fallback</option><option value="multidraw">Multi-draw</option></select></label>
<label>Camera <select id="view"><option>top</option><option selected>walk</option><option>short</option><option>tall</option><option>seed</option><option>sedge</option><option>transition</option><option>approach</option></select></label>
<label>Distance <select id="fade"><option value="source">13m / 4m / 12</option><option value="extended">19m / 6m / 18</option><option value="close">10m / 3m / 12</option><option value="refined" selected>19m / 7m / 48 staggered</option></select></label>
<label>Distance fade <input id="distance" type="checkbox" checked></label>
<label>Ground <select id="ground"><option value="flat" selected>Original neutral</option><option value="soft">Subtle albedo test</option></select></label>
<label>Frustum culling <input id="culling" type="checkbox" checked></label>
<label>Grass shadows <input id="shadows" type="checkbox"></label>
<label>Orbit <input id="orbit" type="range" min="-180" max="180" value="0"></label>
<button id="play-walk" type="button">Play walking route</button><pre id="metrics"></pre>
<p>Four organic, blending meadows. Original variants 0–3 remain intact. Top view disables distance fading for distribution review.</p>`;
const css=document.createElement('style');
css.textContent=`body{margin:0;background:#c9d5d0;color:#fff;font:13px system-ui}aside{position:absolute;top:12px;left:12px;z-index:4;width:258px;padding:16px;background:#152922e8;border-radius:12px;box-shadow:0 5px 20px #0003}b{display:block;letter-spacing:.03em}small{display:block;color:#a9c7b8;margin:5px 0 12px}label{display:flex;align-items:center;justify-content:space-between;margin:10px 0;gap:8px}select{width:135px}input[type=range]{width:120px}pre{font:11px monospace;white-space:pre-wrap;max-height:220px;overflow:auto}p{font-size:11px;line-height:1.4;color:#b9d3c2}button{width:100%;padding:7px;border-radius:6px;cursor:pointer;color:#152922;border:0;background:#cedfd5;font-weight:600}`;
document.head.append(css);document.body.append(panel);
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(1100,720);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
renderer.shadowMap.enabled=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#cad6cf');
const camera=new THREE.PerspectiveCamera(52,1100/720,.06,150);
scene.add(new THREE.HemisphereLight('#f5f9f1','#77846f',2.1));
const sun=new THREE.DirectionalLight('#fff1d9',2.2);
sun.position.set(-16,24,12);sun.target.position.set(0,0,0);
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=16;sun.shadow.camera.bottom=-16;
sun.shadow.camera.near=1;sun.shadow.camera.far=70;sun.shadow.normalBias=.003;sun.castShadow=false;
scene.add(sun,sun.target);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(44,31),new THREE.MeshLambertMaterial({color:'#b3b69d'}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.018;floor.receiveShadow=true;scene.add(floor);
const family=createGrassFamily();
let groundTexture:THREE.CanvasTexture|null=null;
const caps=getBatchCapabilities(renderer);
if(!caps.multiDraw)(el<HTMLSelectElement>('mode').querySelector('[value=multidraw]') as HTMLOptionElement).disabled=true;
let batch:GrassBatch|null=null;
let count=0,mode:RenderMode='auto',view:View='walk',fade:FadePreset='refined',version:Version='v2';
let culling=true,distance=true,shadows=false,orbit=0,frames=0,error:string|null=null;
let groundMode:'flat'|'soft'='flat',groundApplied:'flat'|'soft'='flat';
let lastRenderMs=0,playback=false,walkFrameNumber=0;
const point=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
function aim(v:View,angle=0){
 let eye=point(0,1.68,7.2),target=point(0,.42,-1.5);
 if(v==='top'){eye=point(0,43,.01);target=point(0,0,0)}
 else if(v==='short'){eye=point(-10.5,.92,5.7);target=point(-10.5,.2,0)}
 else if(v==='tall'){eye=point(-3.5,.9,5.7);target=point(-3.5,.3,0)}
 else if(v==='seed'){eye=point(3.5,.83,5.7);target=point(3.5,.35,0)}
 else if(v==='sedge'){eye=point(10.5,.9,5.7);target=point(10.5,.2,0)}
 else if(v==='transition'){eye=point(0,1.3,5.9);target=point(0,.3,-2)}
 else if(v==='approach'){eye=point(0,1.68,18);target=point(0,.3,0)}
 if(v!=='top'&&angle){
  const dx=eye.x-target.x,dz=eye.z-target.z,a=angle*Math.PI/180;
  eye.x=target.x+dx*Math.cos(a)-dz*Math.sin(a);
  eye.z=target.z+dx*Math.sin(a)+dz*Math.cos(a);
 }
 camera.position.copy(eye);camera.lookAt(target);camera.updateMatrixWorld();
}
function rebuild(){
 batch?.dispose();batch=null;
 const newBatch=createGrassBatch({scene,renderer,family,mode,capacity:Math.max(5000,count),fade,
   culling,shadows,distanceCulling:distance&&view!=='top'});
 const placements=version==='v0'?generateGrassPlacement({seed:120626,count}):generateNaturalGrassPlacement({seed:120626,count});
 for(const p of placements){
  newBatch.add({variant:p.variant,position:p.position,rotationY:p.rotationY,scale:p.scale,brightness:p.tint});
 }
 batch=newBatch;
}
function applyGround(){
 if(groundApplied===groundMode)return;
 if(groundMode==='soft'&&!groundTexture)groundTexture=createMeadowGroundTexture(120626);
 floor.material.map=groundMode==='soft'?groundTexture:null;
 floor.material.color.set(groundMode==='soft'?'#ffffff':'#b3b69d');
 floor.material.needsUpdate=true;groundApplied=groundMode;
}
function render(){
 if(!batch)return;
 batch.setDistanceCulling(distance&&view!=='top');batch.update(camera);
 const t=performance.now();renderer.render(scene,camera);lastRenderMs=performance.now()-t;frames++;
 el('metrics').textContent=JSON.stringify({config:{version,count,mode,view,fade,shadows,culling,distance,groundMode},walkFrame:walkFrameNumber,
  capabilities:caps,stats:batch.getStats(),drawcalls:renderer.info.render.calls,
  triangles:renderer.info.render.triangles,renderMs:Math.round(lastRenderMs*100)/100,error},null,2);
}
function apply(){
 const oldCount=count,oldMode=mode,oldVersion=version;
 count=Number(el<HTMLSelectElement>('population').value);version=el<HTMLSelectElement>('version').value as Version;
 mode=el<HTMLSelectElement>('mode').value as RenderMode;
 view=el<HTMLSelectElement>('view').value as View;fade=el<HTMLSelectElement>('fade').value as FadePreset;
 shadows=el<HTMLInputElement>('shadows').checked;culling=el<HTMLInputElement>('culling').checked;
 distance=el<HTMLInputElement>('distance').checked;orbit=Number(el<HTMLInputElement>('orbit').value);
 groundMode=el<HTMLSelectElement>('ground').value as 'flat'|'soft';applyGround();
 if(!batch||count!==oldCount||mode!==oldMode||version!==oldVersion)rebuild();
 batch!.setFade(fade);batch!.setCulling(culling);batch!.setShadows(shadows);
 renderer.shadowMap.enabled=shadows;sun.castShadow=shadows;
 aim(view,orbit);render();
}
for(const key of ['version','population','mode','view','fade','distance','culling','shadows','ground','orbit']){
 el<HTMLElement>(key).addEventListener(key==='orbit'?'input':'change',()=>{
  try{
   if(key==='version'){
    const v=el<HTMLSelectElement>('version').value;
    el<HTMLSelectElement>('fade').value=(v==='v2'||v==='v3')?'refined':'source';
    el<HTMLSelectElement>('ground').value=v==='v3'?'soft':'flat';
   }
   apply();error=null;
  }catch(e){error=String(e);console.error(e);el('metrics').textContent=error}
 });
}
function stepWalk(index:number,framesPerPhase=12){
 const sample=sampleMeadowWalk(index,framesPerPhase);
 walkFrameNumber=index;
 camera.position.set(...sample.position);camera.lookAt(...sample.target);
 camera.updateMatrixWorld();render();return sample;
}
function runWalk(){
 if(!playback)return;
 try{
  stepWalk(walkFrameNumber%(WALK_PHASES.length*12),12);
  walkFrameNumber++;
  if(walkFrameNumber>=WALK_PHASES.length*12){playback=false;el<HTMLButtonElement>('play-walk').textContent='Play walking route';return}
  requestAnimationFrame(runWalk);
 }catch(e){playback=false;error=String(e);console.error(e)}
}
el<HTMLButtonElement>('play-walk').addEventListener('click',()=>{
 playback=!playback;walkFrameNumber=0;
 el<HTMLButtonElement>('play-walk').textContent=playback?'Stop walking':'Play walking route';
 if(playback)requestAnimationFrame(runWalk);
});
const lab={
 renderer,scene,camera,sun,floor,family,capabilities:caps,
 get batch(){return batch},get frames(){return frames},get error(){return error},
 get config(){return {version,count,mode,view,fade,culling,distance,shadows,ground:groundMode,orbit}},
 configure(o:Record<string,string|number|boolean>){
  for(const [key,value] of Object.entries(o)){
   const node=el<HTMLInputElement|HTMLSelectElement>(key);
   if(!node)throw Error('Unknown ground-cover parameter '+key);
   if(typeof value==='boolean')(node as HTMLInputElement).checked=value;else node.value=String(value);
  }
  apply();return this.inspect();
 },
 inspect(){return {config:this.config,capabilities:caps,stats:batch?.getStats(),
   calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
   renderMs:lastRenderMs,memory:{...renderer.info.memory},frames,error}},
 moveCamera(position:[number,number,number],target:[number,number,number]){
  camera.position.set(...position);camera.lookAt(...target);camera.updateMatrixWorld();render();return this.inspect();
 },
 walkFrame(index:number,framesPerPhase=12){return {sample:stepWalk(index,framesPerPhase),stats:batch?.getStats(),calls:renderer.info.render.calls}},
 capture(){render();return renderer.domElement.toDataURL('image/png')},
 disposeBatch(){batch?.dispose();batch=null},
 rebuild(){rebuild();aim(view,orbit);render()}
};
Object.assign(window,{__groundCoverLab:lab,__groundCoverThree:THREE,__groundCoverMakeBatch:createGrassBatch});
try{apply()}catch(e){error=String(e);console.error(e)}
addEventListener('pagehide',()=>{batch?.dispose();family.dispose();floor.geometry.dispose();floor.material.dispose();groundTexture?.dispose();renderer.dispose()});
