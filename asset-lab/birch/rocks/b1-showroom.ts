/** B1 family review. Actual native Three.js/WebGL from authored rock geometry. */
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {ROCK_ARCHETYPES,ROCK_DEFINITIONS,buildRockArchetype,rockShapeMetrics,type RockArchetype} from '../src/rocks/experimental/b1/rockArchetypes.ts';
import {r04StudyGeometry} from '../src/rocks/experimental/r04MaterialStudies.ts';
import {createRockLookdevFactory,type RockLookdevStudy,type RockProjection} from '../src/rocks/experimental/a2/rockTextureLookdev.ts';
import {createRockFamily} from '../src/rocks/index.ts';
import {createBirchFamily} from '../src/index.ts';
import {createPineFamily} from '../src/pine/index.ts';
import {createGrassFamily} from '../src/grass/index.ts';

type Choice=RockArchetype|'G1';
type Mode='gallery'|'normalized'|'single'|'context'|'geometry-pair';
type View='threequarter'|'front'|'rear'|'left'|'right'|'top'|'human';
type Light='neutral'|'nordic'|'grazing';
type Surface='clay'|'T1'|'T2'|'T3'|'silhouette';
type Config={mode:Mode;choice:Choice;detail:'primary'|'refined';surface:Surface;projection:RockProjection;
 view:View;light:Light;zoom:number;orbit:number;wireframe:boolean;showScale:boolean};
const style=document.createElement('style');
style.textContent='*{box-sizing:border-box}body{margin:0;background:#c9d2d8;color:#e9f1f4;font:13px system-ui;overflow:hidden}canvas{display:block;width:100vw;height:100vh}aside{position:absolute;z-index:2;top:12px;left:12px;background:#152632eb;border-radius:8px;max-width:278px;padding:13px;box-shadow:0 6px 25px #0004}strong{letter-spacing:.08em}small{display:block;color:#bbccd4;margin:3px 0 10px}label{display:block;margin:7px 0}select,input{width:100%;padding:4px;margin-top:2px}input[type=checkbox]{width:auto}pre{max-height:150px;overflow:auto;white-space:pre-wrap;font:10px/1.5 monospace}#legend{position:absolute;bottom:12px;right:12px;padding:12px;background:#152631d9;border-radius:6px;max-width:900px;font-size:13px;pointer-events:none}';
document.head.appendChild(style);
const panel=document.createElement('aside');
panel.innerHTML='<strong>AURORA REST · B1</strong><small>Five real procedural stone archetypes · ART REVIEW PENDING</small>'
+'<label>View mode <select id="mode"><option value="gallery">G1 + five · original scales</option><option value="normalized">G1 + five · normalized height</option><option value="single">Single prototype</option><option value="geometry-pair">Primary vs refined</option><option value="context">Approved nature context</option></select></label>'
+'<label>Rock <select id="choice"><option value="A">A · Compact Angular</option><option value="B">B · Broad Glacial</option><option value="C">C · Sculptural Mid</option><option value="D">D · Fractured Mass</option><option value="E">E · Landmark</option><option value="G1">G1 · protected original</option></select></label>'
+'<label>Geometry <select id="detail"><option value="refined">Refined</option><option value="primary">Primary first pass</option></select></label>'
+'<label>Surface <select id="surface"><option value="clay">Neutral diagnostic</option><option value="T1">T1 · granite</option><option value="T2">T2 · fractured</option><option value="T3">T3 · coastal</option><option value="silhouette">Flat silhouette</option></select></label>'
+'<label>Mapping <select id="projection"><option value="triplanar">Triplanar</option><option value="planar">Original face UV</option></select></label>'
+'<label>Camera <select id="view"><option value="threequarter">Three-quarter</option><option value="front">Front</option><option value="rear">Rear</option><option value="left">Left</option><option value="right">Right</option><option value="top">Top</option><option value="human">Human height</option></select></label>'
+'<label>Lighting <select id="light"><option value="neutral">Neutral</option><option value="nordic">Nordic outdoors</option><option value="grazing">Grazing</option></select></label>'
+'<label><input id="wireframe" type="checkbox"> Wireframe</label>'
+'<label><input id="showScale" type="checkbox" checked> 1.8 m reference pole</label>'
+'<label>Orbit <input id="orbit" type="range" min="-180" max="180" value="27"></label>'
+'<label>Zoom <input id="zoom" type="range" min="60" max="175" value="100"></label><pre id="stats"></pre>';
document.body.appendChild(panel);
const legend=document.createElement('div');legend.id='legend';document.body.appendChild(legend);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#c9d2d8');
const orth=new THREE.OrthographicCamera(-20,20,11.25,-11.25,.1,180);
const perspective=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,180);
const controls=new OrbitControls(orth,renderer.domElement);controls.enableDamping=true;
const hemi=new THREE.HemisphereLight('#e3efff','#515b65',1.5);scene.add(hemi);
const sun=new THREE.DirectionalLight('#f9e7cd',2);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;
sun.position.set(-5,13,8);scene.add(sun);
const fill=new THREE.DirectionalLight('#a5bfdb',.45);fill.position.set(6,4,-3);scene.add(fill);
const floorMat=new THREE.MeshStandardMaterial({color:'#86988a',roughness:1});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),floorMat);
floor.rotation.x=-Math.PI/2;floor.position.y=-.34;floor.receiveShadow=true;scene.add(floor);
const factory=createRockLookdevFactory();
const diag=new THREE.MeshStandardMaterial({color:'#a6aeb5',roughness:1});
const flat=new THREE.MeshBasicMaterial({color:'#1c2935'});
const geos:Record<Choice,{primary:THREE.BufferGeometry;refined:THREE.BufferGeometry}> = {
 A:{primary:buildRockArchetype('A','primary'),refined:buildRockArchetype('A','refined')},
 B:{primary:buildRockArchetype('B','primary'),refined:buildRockArchetype('B','refined')},
 C:{primary:buildRockArchetype('C','primary'),refined:buildRockArchetype('C','refined')},
 D:{primary:buildRockArchetype('D','primary'),refined:buildRockArchetype('D','refined')},
 E:{primary:buildRockArchetype('E','primary'),refined:buildRockArchetype('E','refined')},
 G1:{primary:r04StudyGeometry('G1'),refined:r04StudyGeometry('G1')}
};
const choices:Choice[]=['G1',...ROCK_ARCHETYPES];
const meshes=new Map<Choice,THREE.Mesh<THREE.BufferGeometry,THREE.Material>>();
for(const id of choices){const mesh=new THREE.Mesh<THREE.BufferGeometry,THREE.Material>(geos[id].refined,diag);mesh.castShadow=true;mesh.receiveShadow=true;meshes.set(id,mesh);scene.add(mesh);}
const before=new THREE.Mesh<THREE.BufferGeometry,THREE.Material>(geos.A.primary,diag);before.castShadow=true;before.receiveShadow=true;scene.add(before);
const production=createRockFamily(),productionRock=production.createMesh(11);
productionRock.position.set(-6,-.18,-.2);scene.add(productionRock);
const birchFamily=createBirchFamily(),pineFamily=createPineFamily(),grassFamily=createGrassFamily();
const birch=birchFamily.createMesh(0,'near');birch.position.set(-5.1,-.34,-1.5);birch.scale.setScalar(.84);scene.add(birch);
const pine=pineFamily.createMesh(0,'near');pine.position.set(5.4,-.34,-1.6);pine.scale.setScalar(.86);scene.add(pine);
const grasses=[[-2.8,-.2],[-1.9,1.4],[1.3,.9],[3,1.6]].map(([x,z],i)=>{
 const m=grassFamily.createMesh((i%4) as 0|1|2|3);m.position.set(x,-.34,z);scene.add(m);return m;
});
const context=[productionRock,birch,pine,...grasses];
const scaleMat=new THREE.MeshBasicMaterial({color:'#263946'});
const marker=new THREE.Group();marker.add(new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.8),scaleMat));
marker.position.y=.56;scene.add(marker);
const byId=(s:string)=>document.getElementById(s) as HTMLInputElement|HTMLSelectElement;
let state:Config={mode:'gallery',choice:'A',detail:'refined',surface:'clay',projection:'triplanar',
 view:'threequarter',light:'neutral',zoom:100,orbit:27,wireframe:false,showScale:true};
let frames=0,error:string|null=null;
const slotX:Record<Choice,number>={G1:-15,A:-10.5,B:-5.5,C:0.3,D:6,E:12.7};
function setCamera(){
 const group=state.mode==='gallery'||state.mode==='normalized',pair=state.mode==='geometry-pair';
 const contextView=state.mode==='context';
 const extent=(group?41:pair?13:contextView?18:7.9)*100/state.zoom;
 const focusY=contextView?2.0:group?1.3:pair?1.25:1.45;
 const theta=state.orbit*Math.PI/180;
 const view=state.view;
 const vectors:Record<View,[number,number,number]>={
  threequarter:[Math.sin(theta),.35,Math.cos(theta)],
  front:[0,.16,1],rear:[0,.16,-1],left:[-1,.16,0],right:[1,.16,0],
  top:[.0001,1,.0001],human:[0,0,1]
 };
 const dir=vectors[view];
 const isHuman=view==='human';
 const camera=isHuman?perspective:orth;
 orth.left=-extent/2;orth.right=extent/2;orth.top=extent*.5625/2;orth.bottom=-extent*.5625/2;orth.updateProjectionMatrix();
 perspective.aspect=innerWidth/innerHeight;perspective.updateProjectionMatrix();
 const orbitDistance=isHuman?(group?55:pair?18:contextView?19:9)*100/state.zoom:45;
 camera.position.set(dir[0]*orbitDistance, isHuman?1.70:focusY+dir[1]*orbitDistance,dir[2]*orbitDistance);
 camera.lookAt(0,isHuman?1.25:focusY,0);
 camera.updateProjectionMatrix();camera.updateMatrixWorld();
 controls.enabled=!isHuman;if(!isHuman){controls.target.set(0,focusY,0);controls.update();}
 renderer.setRenderTarget(null);
}
function chooseMat(){
 if(state.surface==='clay')return diag;
 if(state.surface==='silhouette')return flat;
 return factory.materials[state.surface][state.projection];
}
function apply(){
 state={mode:byId('mode').value as Mode,choice:byId('choice').value as Choice,
  detail:byId('detail').value as 'primary'|'refined',surface:byId('surface').value as Surface,
  projection:byId('projection').value as RockProjection,view:byId('view').value as View,
  light:byId('light').value as Light,zoom:Number(byId('zoom').value),orbit:Number(byId('orbit').value),
  wireframe:(byId('wireframe') as HTMLInputElement).checked,
  showScale:(byId('showScale') as HTMLInputElement).checked};
 const grouped=state.mode==='gallery'||state.mode==='normalized';
 for(const id of choices){
  const m=meshes.get(id)!;
  m.visible=grouped||id===state.choice;
  m.geometry=geos[id][state.detail];m.material=chooseMat();
  m.scale.setScalar(state.mode==='normalized'?2.5/(m.geometry.boundingBox!.max.y-m.geometry.boundingBox!.min.y):1);
  m.position.set(grouped?slotX[id]:0,0,0);
 }
 const pair=state.mode==='geometry-pair';
 before.visible=pair&&state.choice!=='G1';
 if(pair){
  const m=meshes.get(state.choice)!;
  m.position.x=3;before.geometry=geos[state.choice].primary;before.material=chooseMat();before.position.set(-3,0,0);
 }
 const contextView=state.mode==='context';
 context.forEach(o=>o.visible=contextView);
 marker.visible=state.showScale;
 marker.position.x=grouped?19:pair?6:contextView?2.5:3.0;
 // Match the existing material-lighting calibration, without touching original code.
 sun.intensity=state.light==='neutral'?2:state.light==='grazing'?2.3:2.6;
 sun.position.set(state.light==='grazing'?-11:-5,state.light==='grazing'?2.4:13,8);
 hemi.intensity=state.light==='grazing'?1.05:state.light==='neutral'?1.8:1.65;
 fill.intensity=state.light==='grazing'?.15:.55;
 scene.background=new THREE.Color(state.light==='neutral'?'#d3d5d7':'#c0d0d9');
 floorMat.color.set(state.light==='neutral'?'#90999f':'#7c9689');
 renderer.toneMappingExposure=state.light==='neutral'?1.04:1.12;
 diag.wireframe=state.wireframe;
 for(const m of Object.values(factory.materials).flatMap(t=>Object.values(t)))m.wireframe=state.wireframe;
 flat.wireframe=state.wireframe;
 legend.textContent=grouped?'LEFT TO RIGHT: G1 source · A compact · B glacial · C sculptural · D fractured · E landmark':
 pair?'LEFT primary silhouette — RIGHT authored local refinement · '+state.choice:
 contextView?'Aurora source birch, Scots pine, grass and production rock + B1 '+state.choice:
 'B1 '+state.choice+' — '+(state.choice==='G1'?'protected original':ROCK_DEFINITIONS[state.choice].name)+
 ' | '+state.surface+' | '+state.view+' | ART UNAPPROVED';
 setCamera();
}
function stats(){
 const visible=choices.filter(c=>meshes.get(c)!.visible);
 return {config:state,rocks:visible.map(id=>{
  const m=meshes.get(id)!,g=m.geometry;
  return {id,triangles:g.getAttribute('position').count/3,vertices:g.getAttribute('position').count,
   bbox:g.userData.b1?.boundsMeters??null,geometry:g.name,material:(m.material as THREE.Material).name};
 }),renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,shaderPrograms:renderer.info.programs?.length??null},
 textures:{maps:factory.textureCount,size:factory.textureSize,mipsBytesEstimate:factory.mipEstimateBytes},
 frames,errors:error,artApproved:false,physicalAndroidVerified:false,gl:String(renderer.getContext().getParameter(renderer.getContext().VERSION))};
}
for(const key of ['mode','choice','detail','surface','projection','view','light','zoom','orbit','wireframe','showScale']){
 byId(key).addEventListener(key==='zoom'||key==='orbit'?'input':'change',()=>{try{apply();error=null;}catch(e){error=String(e);console.error(e);}});
}
function draw(){renderer.render(scene, state.view==='human'?perspective:orth);}
function animate(){try{controls.update();draw();frames++;if(frames%60===0)byId('stats').textContent=JSON.stringify(stats(),null,2);}
 catch(e){error=String(e);console.error(e);}requestAnimationFrame(animate);}
apply();animate();
Object.assign(window,{__b1Lab:{frame:()=>frames,configure(config:Partial<Config>){
 for(const [key,v] of Object.entries(config)){
  const el=byId(key);if(!el)throw Error('Unknown B1 control '+key);
  if(typeof v==='boolean')(el as HTMLInputElement).checked=v;else el.value=String(v);
 }
 apply();draw();return stats();
},capture(){draw();return renderer.domElement.toDataURL('image/png');},stats,metrics:ROCK_ARCHETYPES.map(id=>rockShapeMetrics(id))}});
addEventListener('pagehide',()=>{
 for(const entry of Object.values(geos))for(const g of Object.values(entry))g.dispose();
 before.geometry.dispose();factory.dispose();production.dispose();birchFamily.dispose();pineFamily.dispose();grassFamily.dispose();
 diag.dispose();flat.dispose();floorMat.dispose();floor.geometry.dispose();scaleMat.dispose();renderer.dispose();
});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);perspective.aspect=innerWidth/innerHeight;perspective.updateProjectionMatrix();setCamera();});
