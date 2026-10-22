/** ASSET-01E2R-A real Three.js/WebGL review showroom — no production integration. */
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {createRockFamily} from '../src/rocks/index.ts';
import {createBirchFamily} from '../src/index.ts';
import {createPineFamily} from '../src/pine/index.ts';
import {createGrassFamily} from '../src/grass/index.ts';
import {rockR04Material} from '../src/rocks/experimental/r04HeroBoulder.ts';
import {r04StudyGeometry,createR04MaterialStudies,type R04MaterialStudy} from '../src/rocks/experimental/r04MaterialStudies.ts';
import type {R04GeometryStudy} from '../src/rocks/experimental/r04RefinementCore.ts';
type Mode='geometry'|'materials'|'selected'|'context';
type View='front'|'rear'|'left'|'right'|'threequarter'|'top'|'human';
type Light='neutral'|'nordic'|'grazing';
type Config={mode:Mode;geometry:R04GeometryStudy;material:R04MaterialStudy;view:View;light:Light;wireframe:boolean;orbit:number;zoom:number};
const style=document.createElement('style');
style.textContent='*{box-sizing:border-box}body{margin:0;font:13px system-ui;color:#eaf1f5;background:#88939b;overflow:hidden}canvas{display:block;width:100vw;height:100vh}aside{position:absolute;top:12px;left:12px;z-index:2;max-width:282px;background:#15232bec;padding:14px;border-radius:9px;box-shadow:0 5px 25px #17242c88}strong{letter-spacing:.07em}small{display:block;color:#b7cad3;margin:4px 0 12px}label{display:block;margin:8px 0}select,input{margin-top:3px;width:100%;padding:5px}input[type=checkbox]{width:auto}pre{white-space:pre-wrap;font-size:10px;line-height:1.5;max-height:170px;overflow:auto}#legend{position:absolute;bottom:12px;right:16px;background:#14232bdc;border-radius:6px;padding:10px;max-width:660px}';
document.head.appendChild(style);
const panel=document.createElement('aside');
panel.innerHTML='<strong>AURORA REST · E2R-A</strong><small>R04-preserving rock calibration · ART UNAPPROVED</small>'
 +'<label>Comparison <select id="mode"><option value="geometry">G0 / G1 / G2 — neutral geometry</option><option value="materials">M1 / M2 / M3 — same geometry</option><option value="selected">Selected study</option><option value="context">Aurora vegetation context</option></select></label>'
 +'<label>Geometry <select id="geometry"><option value="G1">G1 · structural fractures</option><option value="G2">G2 · selected supporting planes</option><option value="G0">G0 · original R04</option></select></label>'
 +'<label>Material <select id="material"><option value="M1">M1 · clean granite</option><option value="M2">M2 · fractured Nordic</option><option value="M3">M3 · lightly weathered</option></select></label>'
 +'<label>Camera <select id="view"><option value="threequarter">Three-quarter</option><option value="front">Front</option><option value="rear">Rear</option><option value="left">Left</option><option value="right">Right</option><option value="top">Top</option><option value="human">Human height</option></select></label>'
 +'<label>Lighting <select id="light"><option value="neutral">Neutral diagnostic</option><option value="nordic">Nordic daylight</option><option value="grazing">Grazing angle</option></select></label>'
 +'<label><input id="wireframe" type="checkbox">Show actual wireframe</label>'
 +'<label>Orbit <input id="orbit" type="range" min="-180" max="180" value="27"></label>'
 +'<label>Zoom <input id="zoom" type="range" min="45" max="180" value="100"></label><pre id="stats"></pre>';
document.body.appendChild(panel);
const legend=document.createElement('div');legend.id='legend';document.body.appendChild(legend);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.10;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#cbd2d8');
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,150);
const hemi=new THREE.HemisphereLight('#e3efff','#4a5356',1.5);scene.add(hemi);
const sun=new THREE.DirectionalLight('#f6e8d1',2.1);sun.position.set(-5,12,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;scene.add(sun);
const fill=new THREE.DirectionalLight('#9dbfdf',.55);fill.position.set(6,4,-4);scene.add(fill);
const floorMat=new THREE.MeshStandardMaterial({color:'#7b9184',roughness:1});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-.49;floor.receiveShadow=true;scene.add(floor);
const geometries:Record<R04GeometryStudy,THREE.BufferGeometry>={
 G0:r04StudyGeometry('G0'),G1:r04StudyGeometry('G1'),G2:r04StudyGeometry('G2')};
const materials=createR04MaterialStudies(),originalMaterial=rockR04Material();
const neutral=new THREE.MeshStandardMaterial({color:'#aab2bb',roughness:0.94});
const meshes:[THREE.Mesh,THREE.Mesh,THREE.Mesh]=[0,1,2].map(()=>{const m=new THREE.Mesh(geometries.G0,neutral);m.castShadow=m.receiveShadow=true;scene.add(m);return m;}) as [THREE.Mesh,THREE.Mesh,THREE.Mesh];
const production=createRockFamily();const sourceRock=production.createMesh(11);sourceRock.scale.setScalar(.65);sourceRock.position.set(-5,-.25,-1.8);scene.add(sourceRock);
const birchFamily=createBirchFamily(),pineFamily=createPineFamily(),grassFamily=createGrassFamily();
const birch=birchFamily.createMesh(0,'near');birch.position.set(-4.7,-.49,-.4);birch.scale.setScalar(.8);scene.add(birch);
const pine=pineFamily.createMesh(0,'near');pine.position.set(5.1,-.49,-1.4);pine.scale.setScalar(.82);scene.add(pine);
const grasses=[[-2.1,.6],[1.8,.3],[3.1,-1.3],[-.6,1.7]].map(([x,z],i)=>{
 const m=grassFamily.createMesh((i%4) as 0|1|2|3);m.position.set(x,-.49,z);scene.add(m);return m;
});
const contextObjects:THREE.Object3D[]=[sourceRock,birch,pine,...grasses];
const marker=new THREE.Group(),poleMat=new THREE.MeshBasicMaterial({color:'#2d404e'});
const pole=new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,1.8),poleMat);pole.position.y=.9-.49;marker.add(pole);
const head=new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),poleMat);head.position.y=1.8-.49;marker.add(head);scene.add(marker);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=1.8;controls.maxDistance=40;
const byId=(id:string)=>document.getElementById(id) as HTMLInputElement|HTMLSelectElement;
let config:Config={mode:'geometry',geometry:'G1',material:'M1',view:'threequarter',light:'neutral',wireframe:false,orbit:27,zoom:100};
let lastError:string|null=null,frames=0;
function cameraPreset():void{
 const group=config.mode==='geometry'||config.mode==='materials';
 const distance=(config.mode==='context'?18:group?12:6.5)*100/config.zoom;
 const yFocus=config.mode==='context'?2.0:.8;
 const angle=config.orbit*Math.PI/180;
 const directions:Record<View,[number,number,number]>={
  threequarter:[Math.sin(angle)*distance,distance*.37,Math.cos(angle)*distance],
  front:[0,distance*.24,distance],rear:[0,distance*.24,-distance],
  left:[-distance,distance*.24,0],right:[distance,distance*.24,0],
  top:[.01,distance,.01],human:[0,1.68,distance]
 };
 const p=directions[config.view];camera.position.set(p[0],config.view==='human'?1.68:p[1]+yFocus,p[2]);
 controls.target.set(0,config.view==='human'?1.05:yFocus,0);
 controls.update();camera.lookAt(controls.target);camera.updateMatrixWorld();
}
function apply():void{
 config={mode:byId('mode').value as Mode,geometry:byId('geometry').value as R04GeometryStudy,
  material:byId('material').value as R04MaterialStudy,view:byId('view').value as View,
  light:byId('light').value as Light,wireframe:(byId('wireframe') as HTMLInputElement).checked,
  orbit:Number(byId('orbit').value),zoom:Number(byId('zoom').value)};
 const comparison=config.mode==='geometry'||config.mode==='materials';
 const studies:R04GeometryStudy[]=config.mode==='geometry'?['G0','G1','G2']:
   config.mode==='materials'?[config.geometry,config.geometry,config.geometry]:
   config.mode==='context'?['G0',config.geometry,'G0']:[config.geometry,config.geometry,config.geometry];
 for(let i=0;i<meshes.length;i++){
  const m=meshes[i];m.visible=comparison||i===1||(config.mode==='context'&&i===0);
  m.geometry=geometries[studies[i]];
  m.material=config.mode==='geometry'?neutral:config.mode==='materials'?
   materials.materials[(['M1','M2','M3'] as const)[i]]:i===0&&config.mode==='context'?
   originalMaterial:studies[i]==='G0'?originalMaterial:materials.materials[config.material];
  m.position.set(comparison?(i-1)*4.55:config.mode==='context'&&i===0?-2.9:0,-.25,0);
  m.castShadow=m.receiveShadow=true;
 }
 const context=config.mode==='context';contextObjects.forEach(o=>o.visible=context);
 marker.visible=config.mode!=='geometry';marker.position.x=comparison?6.8:3.2;
 for(const mat of [neutral,originalMaterial,...Object.values(materials.materials)])mat.wireframe=config.wireframe;
 sun.intensity=config.light==='neutral'?2.0:config.light==='grazing'?2.3:2.6;
 sun.position.set(config.light==='grazing'?-11:-5,config.light==='grazing'?2.4:12,7);
 hemi.intensity=config.light==='grazing'?1.05:config.light==='neutral'?1.8:1.65;
 fill.intensity=config.light==='grazing'?.15:.55;
 scene.background=new THREE.Color(config.light==='neutral'?'#d3d5d7':'#c0d0d9');
 floorMat.color.set(config.light==='neutral'?'#90999f':'#7c9689');
 renderer.toneMappingExposure=config.light==='neutral'?1.04:1.12;
 legend.textContent=config.mode==='geometry'?'G0: source-locked original R04   |   G1: restrained fractures   |   G2: added secondary planes':
 config.mode==='materials'?'All three use identical '+config.geometry+' geometry: M1 clean | M2 fractured | M3 weathered':
 config.mode==='context'?'Left: unchanged R04 and original production stone. Centre: refined R04. Approved Aurora birch, Scots pine and grass.':
 config.geometry+' with '+config.material+' — one study, NOT artistically approved';
 cameraPreset();
}
function inspect(){
 const study=meshes.filter(m=>m.visible).map(m=>({
  geometry:m.geometry.name,triangles:m.geometry.getAttribute('position').count/3,
  vertices:m.geometry.getAttribute('position').count,material:(m.material as THREE.Material).name,
  metadata:m.geometry.userData.r04Refinement||m.geometry.userData.rockR04
 }));
 return {config,studies:study,errors:lastError,renderer:{
  drawcalls:renderer.info.render.calls,triangles:renderer.info.render.triangles},
  materials:{textures:materials.textureCount,resolution:materials.textureSize},
  webgl:{version:String(renderer.getContext().getParameter(renderer.getContext().VERSION))},
  actualAndroidVerified:false,artApproved:false,frames};
}
for(const k of ['mode','geometry','material','view','light','wireframe','orbit','zoom'])
 byId(k).addEventListener(k==='orbit'||k==='zoom'?'input':'change',()=>{try{apply();lastError=null}catch(e){lastError=String(e);console.error(e)}});
function render(){renderer.render(scene,camera);}
function animate(){try{controls.update();render();frames++;if(frames%45===0)byId('stats').textContent=JSON.stringify(inspect(),null,2);}
 catch(e){lastError=String(e);console.error(e)}requestAnimationFrame(animate);}
apply();animate();
Object.assign(window,{__r04Lab:{frame:()=>frames,get error(){return lastError},inspect,renderer,
 configure(o:Partial<Config>){for(const [k,v] of Object.entries(o)){const el=byId(k);if(!el)throw Error('Unknown E2R control '+k);
 if(typeof v==='boolean')(el as HTMLInputElement).checked=v;else el.value=String(v);}
 apply();render();return inspect();},
 capture(){render();return renderer.domElement.toDataURL('image/png');}}});
addEventListener('pagehide',()=>{for(const g of Object.values(geometries))g.dispose();
 materials.dispose();originalMaterial.dispose();neutral.dispose();floor.geometry.dispose();floorMat.dispose();
 pole.geometry.dispose();head.geometry.dispose();poleMat.dispose();
 production.dispose();birchFamily.dispose();pineFamily.dispose();grassFamily.dispose();renderer.dispose();});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
