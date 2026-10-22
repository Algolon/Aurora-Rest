/** B1R2 — genuine Three.js WebGL comparison: original A-V0 / unchanged A-V2 / integrated A-V3 / G1. */
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {buildB1R} from '../src/rocks/experimental/b1r/multiMassRocks.ts';
import {buildIntegratedA} from '../src/rocks/experimental/b1r2/integratedA.ts';
import {r04StudyGeometry} from '../src/rocks/experimental/r04MaterialStudies.ts';
import {createRockLookdevFactory} from '../src/rocks/experimental/a2/rockTextureLookdev.ts';
import {createRockFamily} from '../src/rocks/index.ts';
import {createBirchFamily} from '../src/index.ts';
import {createPineFamily} from '../src/pine/index.ts';
import {createGrassFamily} from '../src/grass/index.ts';
type Version='V0'|'V2'|'V3';
type View='threequarter'|'front'|'rear'|'left'|'right'|'top'|'human';
type Mode='trio'|'single'|'g1'|'junction'|'nature';
type Material='neutral'|'T1'|'silhouette'|'normal';
type State={version:Version;view:View;mode:Mode;surface:Material;light:'neutral'|'nordic'|'grazing';
 orbit:number;zoom:number;wireframe:boolean};
const css=document.createElement('style');
css.textContent='*{box-sizing:border-box}body{margin:0;overflow:hidden;background:#cad4dc;color:#e9f3f5;font:13px system-ui}canvas{width:100vw;height:100vh;display:block}aside{position:absolute;top:12px;left:12px;z-index:10;background:#152832ee;border-radius:8px;padding:14px;max-width:285px;max-height:96vh;overflow:auto;box-shadow:0 7px 22px #0004}strong{letter-spacing:.07em}small{display:block;color:#c2d4da;margin:5px 0 12px}label{display:block;margin:8px 0}select,input{width:100%;margin-top:3px;padding:4px}pre{font:10px/1.3 monospace;max-height:140px;overflow:auto;white-space:pre-wrap}#legend{position:absolute;bottom:14px;right:12px;border-radius:6px;background:#152832dd;padding:12px;max-width:710px;pointer-events:none}';
document.head.appendChild(css);
const panel=document.createElement('aside');
panel.innerHTML='<strong>AURORA REST · B1R2</strong><small>Integrated geological transition · A only · ART REVIEW PENDING</small>'+
'<label>Comparison <select id="mode"><option value="trio">A-V0 / A-V2 / A-V3, same scale</option><option value="single">Single candidate</option><option value="g1">G1 style reference</option><option value="junction">Junction close-up</option><option value="nature">Nature and source rock</option></select></label>'+
'<label>Candidate <select id="version"><option value="V0">V0 · untouched B1</option><option value="V2">V2 · unchanged two-mass</option><option value="V3">V3 · reconstructed one-shell</option></select></label>'+
'<label>Shading <select id="surface"><option value="neutral">Neutral diagnostic</option><option value="T1">Original A2 T1 granite</option><option value="silhouette">Flat silhouette</option><option value="normal">Normal facets diagnostic</option></select></label>'+
'<label>Light <select id="light"><option value="neutral">Neutral</option><option value="nordic">Nordic outdoors</option><option value="grazing">Grazing</option></select></label>'+
'<label>View <select id="view"><option value="threequarter">Three-quarter</option><option value="front">Front</option><option value="rear">Rear</option><option value="left">Left</option><option value="right">Right</option><option value="top">Top</option><option value="human">Human height</option></select></label>'+
'<label><input type="checkbox" id="wireframe"> Wireframe</label>'+
'<label>Orbit <input id="orbit" type="range" min="-180" max="180" value="27"></label>'+
'<label>Zoom <input id="zoom" type="range" min="65" max="180" value="100"></label><pre id="stats"></pre>';
document.body.appendChild(panel);
const legend=document.createElement('div');legend.id='legend';document.body.appendChild(legend);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#d3d5d7');
const cam=new THREE.OrthographicCamera(-7,7,3.9,-3.9,.1,140);
const walking=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,150);
const control=new OrbitControls(cam,renderer.domElement);control.enableDamping=true;
const hemi=new THREE.HemisphereLight('#e3efff','#515a61',1.8);scene.add(hemi);
const sun=new THREE.DirectionalLight('#f8e9d5',2);sun.position.set(-5,12,7);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;
scene.add(sun);
const fill=new THREE.DirectionalLight('#9bbad7',.55);fill.position.set(6,4,-4);scene.add(fill);
const groundMaterial=new THREE.MeshStandardMaterial({color:'#90999f',roughness:1});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(160,160),groundMaterial);
ground.rotation.x=-Math.PI/2;ground.position.y=-.34;ground.receiveShadow=true;scene.add(ground);
const lookdev=createRockLookdevFactory();
const neutral=new THREE.MeshStandardMaterial({color:'#aab2bb',roughness:.95});
const shadowColor=new THREE.MeshBasicMaterial({color:'#253544'});
const normals=new THREE.MeshNormalMaterial({flatShading:true});
const originalV0=buildB1R('A','V0'),originalV2=buildB1R('A','V2'),v3=buildIntegratedA();
const assets={V0:originalV0,V2:originalV2,V3:v3};
const objects:Record<Version,THREE.Group>={V0:new THREE.Group(),V2:new THREE.Group(),V3:new THREE.Group()};
for(const version of ['V0','V2','V3'] as const){
 const meshes=version==='V3'?[v3.geometry]:assets[version].parts;
 for(const geometry of meshes){
  const mesh=new THREE.Mesh<THREE.BufferGeometry,THREE.Material>(geometry,neutral);
  mesh.castShadow=true;mesh.receiveShadow=true;objects[version].add(mesh);
 }
 scene.add(objects[version]);
}
const g1=r04StudyGeometry('G1'),g1Mesh=new THREE.Mesh<THREE.BufferGeometry,THREE.Material>(g1,neutral);
g1Mesh.castShadow=true;g1Mesh.receiveShadow=true;scene.add(g1Mesh);
const production=createRockFamily(),rock=production.createMesh(11);rock.position.set(-4.8,-.25,-1.5);scene.add(rock);
const birchFamily=createBirchFamily(),pineFamily=createPineFamily(),grassFamily=createGrassFamily();
const birch=birchFamily.createMesh(0,'near');birch.position.set(-4.4,-.34,-1.4);birch.scale.setScalar(.8);scene.add(birch);
const pine=pineFamily.createMesh(0,'near');pine.position.set(5,-.34,-1.5);pine.scale.setScalar(.82);scene.add(pine);
const grasses=[[-2.2,.4],[1.9,.8],[-1.4,1.4],[3,.2]].map(([x,z],i)=>{
 const m=grassFamily.createMesh((i%4) as 0|1|2|3);m.position.set(x,-.34,z);scene.add(m);return m;
});
const nature=[rock,birch,pine,...grasses];
const marker=new THREE.Group();
const markMat=new THREE.MeshBasicMaterial({color:'#243847'});
const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.8),markMat);
pole.position.y=.9;marker.add(pole);marker.position.y=-.34;scene.add(marker);
const field=(s:string)=>document.getElementById(s) as HTMLInputElement|HTMLSelectElement;
let state:State={version:'V3',view:'threequarter',mode:'trio',surface:'neutral',light:'neutral',orbit:27,zoom:100,wireframe:false};
let frames=0,error:string|null=null;
function updateCamera(){
 const wide=state.mode==='trio'||state.mode==='g1',natural=state.mode==='nature',junction=state.mode==='junction';
 const width=(wide?13.5:natural?16:junction?3.6:5.6)*100/state.zoom;
 const focusY=natural?1.8:junction?-.01:.64, focusX=junction?.57:0;
 const theta=state.orbit*Math.PI/180;
 const dir:Record<View,[number,number,number]>={
  threequarter:[Math.sin(theta),.31,Math.cos(theta)],front:[0,.15,1],
  rear:[0,.15,-1],left:[-1,.15,0],right:[1,.15,0],
  top:[.001,1,.001],human:[0,0,1]
 };
 const d=dir[state.view];const human=state.view==='human';
 cam.left=-width/2;cam.right=width/2;
 cam.top=width*(innerHeight/innerWidth)/2;cam.bottom=-cam.top;cam.updateProjectionMatrix();
 walking.aspect=innerWidth/innerHeight;walking.updateProjectionMatrix();
 const distance=human?(wide?16:natural?17:8)*100/state.zoom:27;
 const target=new THREE.Vector3(focusX,focusY,junction?.34:0);
 const active=human?walking:cam;
 active.position.set(focusX+d[0]*distance,human?1.7:focusY+d[1]*distance,d[2]*distance+(junction?.34:0));
 if(human)walking.lookAt(target);
 else{control.target.copy(target);control.enabled=true;control.update();}
 active.updateMatrixWorld();
}
function apply(){
 state={mode:field('mode').value as Mode,version:field('version').value as Version,
  surface:field('surface').value as Material,light:field('light').value as State['light'],
  view:field('view').value as View,orbit:Number(field('orbit').value),
  zoom:Number(field('zoom').value),wireframe:(field('wireframe') as HTMLInputElement).checked};
 for(const version of ['V0','V2','V3'] as const){
  const o=objects[version];o.visible=state.mode==='trio'||version===state.version;
  o.position.x=state.mode==='trio'?({V0:-4.0,V2:0,V3:4.0}[version]):state.mode==='g1'?2.7:0;
 }
 const material=state.surface==='T1'?lookdev.materials.T1.triplanar:
  state.surface==='silhouette'?shadowColor:state.surface==='normal'?normals:neutral;
 for(const o of Object.values(objects))for(const mesh of o.children){
  const m=mesh as THREE.Mesh<THREE.BufferGeometry,THREE.Material>;m.material=material;
 }
 for(const m of [neutral,shadowColor,normals,lookdev.materials.T1.triplanar])m.wireframe=state.wireframe;
 g1Mesh.visible=state.mode==='g1';g1Mesh.position.set(-2.7,0,0);
 g1Mesh.material=material;
 for(const obj of nature)obj.visible=state.mode==='nature';
 marker.position.x=state.mode==='trio'?6.5:state.mode==='g1'?5.6:state.mode==='nature'?2.7:2.7;
 marker.visible=state.mode!=='junction';
 sun.position.set(state.light==='grazing'?-11:-5,state.light==='grazing'?2.4:12,7);
 sun.intensity=state.light==='neutral'?2:state.light==='grazing'?2.3:2.6;
 hemi.intensity=state.light==='grazing'?1.05:state.light==='neutral'?1.8:1.65;
 fill.intensity=state.light==='grazing'?.15:.55;
 scene.background=new THREE.Color(state.light==='neutral'?'#d3d5d7':'#c0d0d9');
 groundMaterial.color.set(state.light==='neutral'?'#90999f':'#7c9689');
 renderer.toneMappingExposure=state.light==='neutral'?1.04:1.12;
 legend.textContent=state.mode==='trio'?'LEFT A-V0 • CENTER A-V2 • RIGHT A-V3 · same geometry scale, camera & shading':
  state.mode==='g1'?'LEFT original G1 • RIGHT A-'+state.version:
  state.mode==='junction'?'A-'+state.version+' | LOCALLY RECONSTRUCTED GEOLOGICAL JUNCTION | ART REVIEW PENDING':
  state.mode==='nature'?'Actual Aurora birch, Scots pine, grass and source rock alongside A-'+state.version:
  'A-'+state.version+' | '+state.surface+' | '+state.view+' | owner art review pending';
 updateCamera();
}
function stats(){
 return {state,visible:(['V0','V2','V3'] as const).filter(v=>objects[v].visible).map(v=>{
  const g=v==='V3'?v3.geometry:null;
  const count=v==='V3'?1:assets[v].parts.length;
  const triangles=v==='V3'?g!.getAttribute('position').count/3:assets[v].triangles;
  const box=v==='V3'?v3.bounds:assets[v].bounds;
  return {version:v,triangles,drawObjects:count,dimensions:box.getSize(new THREE.Vector3()).toArray()};
 }),v3Diagnostics:v3.diagnostics,renderer:{calls:renderer.info.render.calls,
 triangles:renderer.info.render.triangles,programs:renderer.info.programs?.length??null},
 webgl:String(renderer.getContext().getParameter(renderer.getContext().VERSION)),
 errors:error,frames,physicalAndroidValidated:false,artApproved:false};
}
for(const name of ['version','view','mode','surface','light','orbit','zoom','wireframe'])
 field(name).addEventListener(name==='orbit'||name==='zoom'?'input':'change',()=>{
  try{apply();error=null;}catch(e){error=String(e);console.error(e);}
 });
function draw(){renderer.render(scene,state.view==='human'?walking:cam);}
function animate(){try{control.update();draw();frames++;if(frames%60===0)field('stats').textContent=JSON.stringify(stats(),null,2);}
 catch(e){error=String(e);console.error(e);}requestAnimationFrame(animate);}
apply();animate();
Object.assign(window,{__b1r2Lab:{frame:()=>frames,configure(update:Partial<State>){
 for(const [k,v] of Object.entries(update)){
  const f=field(k);if(!f)throw Error('Invalid B1R2 control '+k);
  if(typeof v==='boolean')(f as HTMLInputElement).checked=v;else f.value=String(v);
 }
 apply();draw();return stats();},capture(){draw();return renderer.domElement.toDataURL('image/png');},stats}});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);updateCamera();});
addEventListener('pagehide',()=>{
 originalV0.dispose();originalV2.dispose();v3.dispose();g1.dispose();lookdev.dispose();
 production.dispose();birchFamily.dispose();pineFamily.dispose();grassFamily.dispose();
 neutral.dispose();shadowColor.dispose();normals.dispose();markMat.dispose();pole.geometry.dispose();
 ground.geometry.dispose();groundMaterial.dispose();renderer.dispose();
});
