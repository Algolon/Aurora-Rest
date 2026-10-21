// ASSET-01C2: mixed, deterministic Scots pine and silver birch WebGL asset lab.
import * as THREE from 'three';
import {createBirchFamily} from '../src/index.ts';
import {createPineFamily} from '../src/pine/index.ts';
import {createNatureBatch,type NatureBatch,type NatureSpecies} from '../src/rendering/mixedForest.ts';
import {getBatchCapabilities,type RenderMode} from '../src/rendering/capabilities.ts';
import {mulberry32} from '../src/rng.ts';
import type {BirchLod} from '../src/lod.ts';
const panel=document.createElement('aside');
panel.innerHTML=`<h2>Aurora Rest · Mixed Forest</h2><small>ASSET-01C2 · Independent rendering benchmark</small>
<label>Renderer <select id="mode"><option>auto</option><option>instanced</option><option>multidraw</option></select></label>
<label>Population <select id="population"><option>1</option><option>100</option><option>500</option><option>1000</option></select></label>
<label>Species mix <select id="mix"><option value="birch">100% birch</option><option value="pine">100% pine</option><option value="balanced">50/50 mixed</option><option value="pine70">70% pine</option></select></label>
<label>View <select id="view"><option>overview</option><option>approach</option><option>grove</option><option>edge</option><option>rotation</option><option>lodwalk</option><option>reference</option><option>single</option></select></label>
<label>LOD <select id="lod"><option>auto</option><option>near</option><option>mid</option><option>far</option><option>xfar</option></select></label>
<label>Shadows <input type="checkbox" id="shadows" checked></label>
<label>Culling <input type="checkbox" id="culling" checked></label>
<label>Angle <input type="range" min="-180" max="180" value="25" id="angle"></label>
<pre id="readout"></pre>`;
const style=document.createElement('style');style.textContent=`body{margin:0;background:#bed0d7;color:white;font-family:system-ui}aside{position:absolute;top:10px;left:10px;z-index:2;width:265px;padding:14px;border-radius:9px;background:#14242de4;font:12px system-ui}h2{font-size:16px;margin:0 0 8px}label{display:block;margin:6px 0}select{width:120px;float:right}pre{font:11px monospace;white-space:pre-wrap;max-height:280px;overflow:auto}`;document.head.append(style);document.body.append(panel);
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
for(const i of ['mode','population','mix','view','lod','shadows','culling','angle']){
 const node=panel.querySelector('#'+i);if(node)node.id=i;
}
const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(960,600);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.BasicShadowMap;
document.body.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#bfd1d6');
const camera=new THREE.PerspectiveCamera(58,960/600,.1,380);
scene.add(new THREE.HemisphereLight('#ecf6fc','#707363',1.7));
const sun=new THREE.DirectionalLight('#fff0d7',2.6);sun.position.set(-26,44,34);
sun.target.position.set(0,3,0);sun.castShadow=true;
sun.shadow.mapSize.set(768,768);sun.shadow.camera.left=-90;sun.shadow.camera.right=90;
sun.shadow.camera.top=90;sun.shadow.camera.bottom=-90;sun.shadow.camera.near=1;sun.shadow.camera.far=165;
sun.shadow.bias=-.00025;sun.shadow.normalBias=.022;scene.add(sun,sun.target);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(260,260),new THREE.MeshLambertMaterial({color:'#8c9d89'}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;ground.position.y=-.03;scene.add(ground);
const families={birch:createBirchFamily(),pine:createPineFamily()};
const references={
 birch:families.birch.createMesh(0,'near'),
 pine:families.pine.createMesh(0,'near')
};Object.values(references).forEach(m=>{scene.add(m);m.visible=false});
const capabilities=getBatchCapabilities(renderer);
export type Composition='birch'|'pine'|'balanced'|'pine70';
export type CameraView='overview'|'approach'|'grove'|'edge'|'rotation'|'lodwalk'|'reference'|'single';
let forest:NatureBatch|null=null,mode:RenderMode='auto',population=1,mix:Composition='balanced',view:CameraView='overview';
let shadows=true,culling=true,lod:BirchLod|null=null,angle=25,frames=0,error:string|null=null;
let firstId=-1;
const mixSpecies=(i:number):NatureSpecies=>{
 if(mix==='birch')return 'birch';if(mix==='pine')return 'pine';
 // deterministic exact 50/50 or 70/30 counts for every population; keeps
 // positions fixed across mix changes and references near the same origin.
 const pineCount=mix==='balanced'?Math.floor(population/2):Math.round(population*.7);
 return (i*37%population)<pineCount?'pine':'birch';
};
function cameraPreset(){
 const y=angle*Math.PI/180;let dist=90,height=58,targetY=5;
 if(view==='approach'){dist=38;height=3.4;targetY=4.6}
 else if(view==='grove'){dist=10;height=2.6;targetY=4}
 else if(view==='edge'){dist=65;height=6;targetY=6}
 else if(view==='reference'||view==='single'){dist=22;height=13;targetY=6}
 else if(view==='lodwalk'){dist=34;height=5;targetY=5}
 else if(view==='rotation'){
  camera.position.set(5,3,5);
  camera.lookAt(5+Math.sin(y)*20,4,5+Math.cos(y)*20);camera.updateMatrixWorld();return;
 }
 camera.position.set(Math.sin(y)*dist,height,Math.cos(y)*dist);
 camera.lookAt(0,targetY,0);camera.updateMatrixWorld();
}
function rebuild(){
 forest?.dispose();forest=null;
 const f=createNatureBatch({scene,renderer,families,mode,capacity:1200,shadows,culling,forcedLod:lod});
 const r=mulberry32(820241);
 for(let i=0;i<population;i++){
  const species=mixSpecies(i);
  const theta=r()*Math.PI*2,rad=i===0?0:3+Math.sqrt(r())*68;
  const pos:[number,number,number]=[Math.cos(theta)*rad,0,Math.sin(theta)*rad];
  firstId=f.add({species,variant:(i%3) as 0|1|2,position:pos,rotationY:i===0?0:r()*6.283,
   scale:i===0?1:.8+r()*.35});
 }
 forest=f;firstId=0;
 Object.values(references).forEach(m=>m.visible=false);
 if(view==='reference'&&population===1){
  const species=mixSpecies(0);
  references[species].visible=true;
  f.setVisible(firstId,false);
 }
 sun.castShadow=shadows;renderer.shadowMap.enabled=shadows;
 cameraPreset();forest.update(camera);
}
function apply(){
 mode=el<HTMLSelectElement>('mode').value as RenderMode;
 population=Number(el<HTMLSelectElement>('population').value);
 mix=el<HTMLSelectElement>('mix').value as Composition;
 view=el<HTMLSelectElement>('view').value as CameraView;
 shadows=el<HTMLInputElement>('shadows').checked;
 culling=el<HTMLInputElement>('culling').checked;
 lod=el<HTMLSelectElement>('lod').value==='auto'?null:el<HTMLSelectElement>('lod').value as BirchLod;
 angle=Number(el<HTMLInputElement>('angle').value);
 rebuild();
}
for(const id of ['mode','population','mix','view','lod','shadows','culling','angle']){
 el<HTMLElement>(id).addEventListener(id==='angle'?'input':'change',()=>{try{apply();error=null}catch(e){error=String(e);el('readout').textContent=error;}});
}
function renderOnce(){if(!forest)return;forest.update(camera);renderer.render(scene,camera)}
function animate(){
 try{renderOnce();frames++;if(frames%25===0)el('readout').textContent=JSON.stringify({
   mode:forest?.mode,capabilities,stats:forest?.getStats(),calls:renderer.info.render.calls,
   triangles:renderer.info.render.triangles,error},null,2)}catch(e){error=String(e);console.error(e)}
 requestAnimationFrame(animate);
}
rebuild();animate();
Object.assign(window,{__mixedLab:{
 renderer,scene,camera,sun,ground,families,references,capabilities,
 get forest(){return forest},get frames(){return frames},get error(){return error},
 get config(){return {mode,population,mix,view,lod,shadows,culling,angle}},
 configure(p:{mode?:RenderMode;population?:number;mix?:Composition;view?:CameraView;lod?:BirchLod|'auto';shadows?:boolean;culling?:boolean;angle?:number}){
  for(const [k,v] of Object.entries(p)){const e=el<HTMLInputElement|HTMLSelectElement>(k);if(typeof v==='boolean')(e as HTMLInputElement).checked=v;else e.value=String(v)}
  apply();return this.inspect();
 },
 inspect(){return {config:this.config,activeMode:forest?.mode,capabilities,
  stats:forest?.getStats(),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,frames,error}},
 moveCamera(position:[number,number,number],target:[number,number,number]){camera.position.set(...position);camera.lookAt(...target);camera.updateMatrixWorld();forest?.update(camera)},
 capture(){renderOnce();return renderer.domElement.toDataURL('image/png')},
 disposeForest(){forest?.dispose();forest=null;Object.values(references).forEach(m=>m.visible=false)},
 createForest(){rebuild()}
}});
addEventListener('pagehide',()=>{forest?.dispose();Object.values(references).forEach(m=>m.removeFromParent());families.pine.dispose();families.birch.dispose();ground.geometry.dispose();(ground.material as THREE.Material).dispose();renderer.dispose()});
