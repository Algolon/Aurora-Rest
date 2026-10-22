/** ASSET-01E2R-B1R — isolated true Three.js, G1 style anchor + A/B V0/V1/V2.
 * Same scene, lighting, scale, material and fixed cameras between version studies.
 */
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {buildB1R,b1rMetrics,type MultiMassArchetype,type MultiMassVersion,type MultiMassAsset} from '../src/rocks/experimental/b1r/multiMassRocks.ts';
import {r04StudyGeometry} from '../src/rocks/experimental/r04MaterialStudies.ts';
import {createRockLookdevFactory} from '../src/rocks/experimental/a2/rockTextureLookdev.ts';
import {createRockFamily} from '../src/rocks/index.ts';
import {createBirchFamily} from '../src/index.ts';
import {createPineFamily} from '../src/pine/index.ts';
import {createGrassFamily} from '../src/grass/index.ts';
type Mode='trio'|'single'|'g1'|'context'|'component';
type Light='neutral'|'nordic'|'grazing';
type Surface='neutral'|'T1'|'silhouette'|'diagnostic';
type View='threequarter'|'front'|'rear'|'left'|'right'|'top'|'human';
type State={rock:MultiMassArchetype;version:MultiMassVersion;mode:Mode;light:Light;surface:Surface;view:View;
 orbit:number;zoom:number;wireframe:boolean;scaleMarker:boolean};
const style=document.createElement('style');
style.textContent='*{box-sizing:border-box}body{font:13px system-ui;background:#c7d0d6;margin:0;color:#e9f1f4;overflow:hidden}canvas{display:block;width:100vw;height:100vh}aside{position:absolute;top:12px;left:12px;z-index:5;padding:13px;border-radius:8px;background:#152630ef;max-width:270px;max-height:96vh;overflow:auto}aside strong{letter-spacing:.07em}aside small{display:block;color:#b6cbd2;margin:4px 0 9px}label{display:block;margin:7px 0}input,select{width:100%;padding:4px;margin-top:3px}input[type=checkbox]{width:auto}pre{font:10px/1.3 monospace;white-space:pre-wrap;max-height:140px;overflow:auto}#legend{position:absolute;right:12px;bottom:12px;background:#192c35dc;border-radius:6px;padding:12px;font-weight:600;pointer-events:none}';
document.head.appendChild(style);
const panel=document.createElement('aside');
panel.innerHTML='<strong>AURORA REST · B1R</strong><small>A/B geological multi-mass art study · ART REVIEW PENDING</small>'+
'<label>Archetype<select id="rock"><option value="A">A · Compact Angular</option><option value="B">B · Broad Glacial</option></select></label>'+
'<label>Compare<select id="mode"><option value="trio">V0 / V1 / V2 · physical scale</option><option value="single">One rock</option><option value="g1">G1 reference / selected</option><option value="component">Component diagnostics</option><option value="context">Approved vegetation context</option></select></label>'+
'<label>Variant<select id="version"><option value="V0">V0 · original B1</option><option value="V1">V1 · subtle shoulder</option><option value="V2">V2 · sculptural integration</option></select></label>'+
'<label>Surface<select id="surface"><option value="neutral">Neutral diagnostic</option><option value="T1">A2 T1 Nordic Granite</option><option value="silhouette">Flat silhouette</option><option value="diagnostic">Component colours (review only)</option></select></label>'+
'<label>Light<select id="light"><option value="neutral">Neutral</option><option value="nordic">Nordic daylight</option><option value="grazing">Grazing</option></select></label>'+
'<label>View<select id="view"><option value="threequarter">Three-quarter</option><option value="front">Front</option><option value="rear">Rear</option><option value="left">Left</option><option value="right">Right</option><option value="top">Top</option><option value="human">Human height</option></select></label>'+
'<label><input id="wireframe" type="checkbox"> Wireframe</label>'+
'<label><input id="scaleMarker" type="checkbox" checked> 1.8m reference height</label>'+
'<label>Orbit<input id="orbit" type="range" min="-180" max="180" value="27"></label>'+
'<label>Zoom<input id="zoom" type="range" min="65" max="180" value="100"></label><pre id="stats"></pre>';
document.body.appendChild(panel);
const legend=document.createElement('div');legend.id='legend';document.body.appendChild(legend);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.04;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#d3d5d7');
const ortho=new THREE.OrthographicCamera(-14,14,7.8,-7.8,.1,150);
const perspective=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,160);
const controls=new OrbitControls(ortho,renderer.domElement);controls.enableDamping=true;
const hemi=new THREE.HemisphereLight('#e3efff','#4a5356',1.8);scene.add(hemi);
const sun=new THREE.DirectionalLight('#f6e8d1',2);sun.position.set(-5,12,7);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-25;sun.shadow.camera.right=25;
sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;scene.add(sun);
const fill=new THREE.DirectionalLight('#9dbfdf',.55);fill.position.set(6,4,-4);scene.add(fill);
const floorMat=new THREE.MeshStandardMaterial({color:'#90999f',roughness:1});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),floorMat);
floor.rotation.x=-Math.PI/2;floor.position.y=-.34;floor.receiveShadow=true;scene.add(floor);
const lookdev=createRockLookdevFactory();
const neutral=new THREE.MeshStandardMaterial({color:'#aab2bb',roughness:.95});
const silhouette=new THREE.MeshBasicMaterial({color:'#253341'});
const primaryColor=new THREE.MeshStandardMaterial({color:'#9daab8',roughness:1});
const secondaryColor=new THREE.MeshStandardMaterial({color:'#ba967b',roughness:1});
const g1=r04StudyGeometry('G1'),g1Mesh=new THREE.Mesh(g1,neutral);
g1Mesh.castShadow=g1Mesh.receiveShadow=true;g1Mesh.visible=false;scene.add(g1Mesh);
const rocks:Record<MultiMassArchetype,Record<MultiMassVersion,MultiMassAsset>>={
 A:{V0:buildB1R('A','V0'),V1:buildB1R('A','V1'),V2:buildB1R('A','V2')},
 B:{V0:buildB1R('B','V0'),V1:buildB1R('B','V1'),V2:buildB1R('B','V2')}
};
const objects:Record<MultiMassArchetype,Record<MultiMassVersion,THREE.Group>>={
 A:{V0:new THREE.Group(),V1:new THREE.Group(),V2:new THREE.Group()},
 B:{V0:new THREE.Group(),V1:new THREE.Group(),V2:new THREE.Group()}
};
for(const rock of ['A','B'] as const)for(const version of ['V0','V1','V2'] as const){
 const group=objects[rock][version];group.name=rock+'-'+version;scene.add(group);
 for(const geo of rocks[rock][version].parts){
  const mesh=new THREE.Mesh<THREE.BufferGeometry,THREE.Material>(geo,neutral);
  mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
 }
}
const production=createRockFamily(),sourceRock=production.createMesh(11);sourceRock.position.set(-5.2,-.2,-1.8);scene.add(sourceRock);
const birchFamily=createBirchFamily(),pineFamily=createPineFamily(),grassFamily=createGrassFamily();
const birch=birchFamily.createMesh(0,'near');birch.position.set(-4.6,-.34,-1.5);birch.scale.setScalar(.83);scene.add(birch);
const pine=pineFamily.createMesh(0,'near');pine.position.set(5.3,-.34,-1.4);pine.scale.setScalar(.85);scene.add(pine);
const grasses=[[-2.2,.3],[-1.6,1.6],[2.4,1.1],[3.2,.4]].map(([x,z],i)=>{
 const mesh=grassFamily.createMesh((i%4) as 0|1|2|3);mesh.position.set(x,-.34,z);
 scene.add(mesh);return mesh;
});
const scenery=[sourceRock,birch,pine,...grasses];
const markerMaterial=new THREE.MeshBasicMaterial({color:'#273846'});
const marker=new THREE.Group();
const pole=new THREE.Mesh(new THREE.CylinderGeometry(.027,.027,1.8),markerMaterial);
pole.position.y=.9;marker.add(pole);scene.add(marker);
const byId=(s:string)=>document.getElementById(s) as HTMLInputElement|HTMLSelectElement;
let current:State={rock:'A',version:'V1',mode:'trio',light:'neutral',surface:'neutral',view:'threequarter',
 orbit:27,zoom:100,wireframe:false,scaleMarker:true};
let frames=0,error:string|null=null;
function configureCamera(){
 const wide=current.mode==='trio',g1Compare=current.mode==='g1',context=current.mode==='context';
 const width=(wide?(current.rock==='B'?27:14.5):g1Compare?13.5:context?18:current.rock==='B'?9.2:5.7)*100/current.zoom;
 const focus=current.mode==='context'?1.9:current.rock==='B'?.63:.62;
 const vecs:Record<View,[number,number,number]>={
  threequarter:[Math.sin(current.orbit*Math.PI/180),.37,Math.cos(current.orbit*Math.PI/180)],
  front:[0,.20,1],rear:[0,.20,-1],left:[-1,.20,0],right:[1,.20,0],
  top:[.0001,1,.0001],human:[0,0,1]
 };
 const d=vecs[current.view],human=current.view==='human';
 ortho.left=-width/2;ortho.right=width/2;ortho.top=width*(renderer.domElement.height/renderer.domElement.width)/2;
 ortho.bottom=-ortho.top;ortho.updateProjectionMatrix();
 perspective.aspect=innerWidth/innerHeight;perspective.updateProjectionMatrix();
 const dist=human?(wide?current.rock==='B'?27:15:context?18:8)*100/current.zoom:38;
 const camera=human?perspective:ortho;
 camera.position.set(d[0]*dist,human?1.7:focus+d[1]*dist,d[2]*dist);
 controls.enabled=!human;
 if(!human){controls.target.set(0,focus,0);controls.update();}
 else camera.lookAt(0,1,0);
 camera.updateMatrixWorld();
}
function apply(){
 current={rock:byId('rock').value as MultiMassArchetype,version:byId('version').value as MultiMassVersion,
  mode:byId('mode').value as Mode,light:byId('light').value as Light,surface:byId('surface').value as Surface,
  view:byId('view').value as View,orbit:Number(byId('orbit').value),zoom:Number(byId('zoom').value),
  wireframe:(byId('wireframe') as HTMLInputElement).checked,
  scaleMarker:(byId('scaleMarker') as HTMLInputElement).checked};
 for(const rock of ['A','B'] as const)for(const version of ['V0','V1','V2'] as const){
  const group=objects[rock][version];
  group.visible=rock===current.rock&&(current.mode==='trio'||version===current.version);
  group.position.x=current.mode==='trio'?(current.rock==='B'?7.65:4.20)*(['V0','V1','V2'].indexOf(version)-1):
    current.mode==='g1'?2.8:0;
  for(const [i,m] of group.children.entries()){
   const mesh=m as THREE.Mesh<THREE.BufferGeometry,THREE.Material>;
   mesh.material=current.surface==='silhouette'?silhouette:
    current.surface==='diagnostic'||current.mode==='component'?(i===0?primaryColor:secondaryColor):
    current.surface==='T1'?lookdev.materials.T1.triplanar:neutral;
   mesh.material.wireframe=current.wireframe;
  }
 }
 const context=current.mode==='context';for(const o of scenery)o.visible=context;
 g1Mesh.visible=current.mode==='g1';g1Mesh.position.set(-2.8,0,0);
 g1Mesh.material=current.surface==='T1'?lookdev.materials.T1.triplanar:
  current.surface==='silhouette'?silhouette:neutral;
 marker.visible=current.scaleMarker;
 marker.position.set(current.mode==='trio'?(current.rock==='B'?12:6.5):
  current.mode==='g1'?5.7:context?2.5:current.rock==='B'?3.5:2.7,-.34,0);
 sun.position.set(current.light==='grazing'?-11:-5,current.light==='grazing'?2.4:12,7);
 sun.intensity=current.light==='neutral'?2:current.light==='grazing'?2.3:2.6;
 hemi.intensity=current.light==='grazing'?1.05:current.light==='neutral'?1.8:1.65;
 fill.intensity=current.light==='grazing'?.15:.55;
 scene.background=new THREE.Color(current.light==='neutral'?'#d3d5d7':'#c0d0d9');
 floorMat.color.set(current.light==='neutral'?'#90999f':'#7c9689');
 renderer.toneMappingExposure=current.light==='neutral'?1.04:1.12;
 legend.textContent=current.mode==='trio'?'LEFT V0 · CENTER V1 · RIGHT V2  |  '+current.rock+'  |  SAME SCALE / MATERIAL / LIGHT':
  current.mode==='g1'?'LEFT original G1 · RIGHT '+current.rock+'-'+current.version:
  current.mode==='component'?'COMPONENT DIAGNOSTIC ONLY: MAIN BLUE-GREY · EMBEDDED SHOULDER OCHRE':
  current.mode==='context'?'Original Aurora birch, Scots pine, grass and production rock · '+current.rock+'-'+current.version:
  'ROCK '+current.rock+'-'+current.version+' | '+current.surface+' | '+current.view+' · ART REVIEW PENDING';
 configureCamera();
}
function stats(){
 const active=(['V0','V1','V2'] as const).filter(v=>objects[current.rock][v].visible);
 return {config:current,assets:active.map(v=>({
  ...b1rMetrics(current.rock,v),independentClosedSolids:rocks[current.rock][v].components,
  booleanUnion:false,hasFloatingParts:false
 })),g1SourceTriangles:g1.getAttribute('position').count/3,
 renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,programs:renderer.info.programs?.length??null},
 textures:{count:lookdev.textureCount,size:lookdev.textureSize},frames,errors:error,
 backend:String(renderer.getContext().getParameter(renderer.getContext().VERSION)),androidVerified:false,artApproved:false};
}
for(const k of ['rock','version','mode','surface','light','view','orbit','zoom','wireframe','scaleMarker'])
 byId(k).addEventListener(k==='orbit'||k==='zoom'?'input':'change',()=>{try{apply();error=null;}catch(e){error=String(e);console.error(e)}});
function render(){renderer.render(scene,current.view==='human'?perspective:ortho);}
function animate(){try{controls.update();render();frames++;if(frames%60===0)byId('stats').textContent=JSON.stringify(stats(),null,2);}
 catch(e){error=String(e);console.error(e);}requestAnimationFrame(animate);}
apply();animate();
Object.assign(window,{__b1rLab:{frame:()=>frames,configure(c:Partial<State>){
 for(const [key,v] of Object.entries(c)){const el=byId(key);if(!el)throw Error('Unknown B1R field '+key);
  if(typeof v==='boolean')(el as HTMLInputElement).checked=v;else el.value=String(v);}
 apply();render();return stats();},
 capture(){render();return renderer.domElement.toDataURL('image/png');},stats}});
addEventListener('pagehide',()=>{
 for(const rock of ['A','B'] as const)for(const version of ['V0','V1','V2'] as const)rocks[rock][version].dispose();
 g1.dispose();lookdev.dispose();production.dispose();birchFamily.dispose();pineFamily.dispose();grassFamily.dispose();
 neutral.dispose();silhouette.dispose();primaryColor.dispose();secondaryColor.dispose();
 markerMaterial.dispose();pole.geometry.dispose();floor.geometry.dispose();floorMat.dispose();renderer.dispose();
});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);configureCamera()});
