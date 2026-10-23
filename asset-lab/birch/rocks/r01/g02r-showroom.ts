/** ROCK-R01-G02R genuine WebGL showroom. R01 is ART UNAPPROVED. */
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {createR01Geometry} from './geometry.ts';
import {createG02Geometry} from './g02Geometry.ts';
import {createG02RGeometry} from './g02rGeometry.ts';
import {r04StudyGeometry} from '../../src/rocks/experimental/r04MaterialStudies.ts';
import {createRockLookdevFactory} from '../../src/rocks/experimental/a2/rockTextureLookdev.ts';
import {createBirchFamily} from '../../src/index.ts';
import {createPineFamily} from '../../src/pine/index.ts';
import {createGrassFamily} from '../../src/grass/index.ts';

type View='front'|'rear'|'left'|'right'|'frontThreeQuarter'|'rearThreeQuarter'|'top'|'human';
type Mode='single'|'comparison'|'historical'|'context';
type Surface='neutral'|'T1';
type Lighting='neutral'|'nordic'|'grazing';
type Config={view:View;mode:Mode;surface:Surface;lighting:Lighting;wireframe:boolean};
const initial:Config={view:'frontThreeQuarter',mode:'single',surface:'neutral',lighting:'neutral',wireframe:false};
let current={...initial},frames=0,lastError:string|null=null;
const style=document.createElement('style');
style.textContent='body{margin:0;overflow:hidden;font:13px system-ui;background:#c7d0d6}canvas{display:block}aside{position:absolute;top:14px;left:14px;z-index:2;background:#14232be9;color:#fff;padding:13px;border-radius:10px;max-width:300px;box-shadow:0 8px 22px #152d3c55}label{display:block;margin-top:8px}select{display:block;width:100%;padding:4px;margin-top:4px}small{color:#bed0d8}#legend{position:absolute;bottom:14px;right:16px;z-index:1;color:white;background:#15232bd9;padding:10px;border-radius:7px}';
document.head.appendChild(style);
const panel=document.createElement('aside');
panel.innerHTML='<b>AURORA REST · ROCK-R01-G02R</b><p><small>The Sheltered Fault · geometry study · ART UNAPPROVED</small></p>'
+'<label>Scene<select id="mode"><option value="single">G02R isolated</option><option value="comparison">G1 vs G02R</option><option value="historical">G02 vs G02R</option><option value="context">G02R + Aurora nature</option></select></label>'
+'<label>Surface<select id="surface"><option value="neutral">Neutral clay</option><option value="T1">Existing A2 T1 Nordic Granite</option></select></label>'
+'<label>Camera<select id="view"><option value="frontThreeQuarter">Front three-quarter</option><option value="front">Front</option><option value="rear">Rear</option><option value="left">Left</option><option value="right">Right</option><option value="rearThreeQuarter">Rear three-quarter</option><option value="top">Top</option><option value="human">Human height</option></select></label>'
+'<label>Lighting<select id="lighting"><option value="neutral">Neutral</option><option value="nordic">Nordic daylight</option><option value="grazing">Low grazing</option></select></label>'
+'<label><input type="checkbox" id="wireframe"> Wireframe</label><p><small>Drag to orbit; scroll to zoom. No island integration.</small></p>';
document.body.appendChild(panel);
const legend=document.createElement('div');legend.id='legend';document.body.appendChild(legend);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#cbd2d8');
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,150);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxDistance=45;controls.minDistance=2;
const hemi=new THREE.HemisphereLight('#f0f3f5','#59656b',1.65);scene.add(hemi);
const sun=new THREE.DirectionalLight('#f9eddd',2.3);sun.position.set(-6,12,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;scene.add(sun);
const fill=new THREE.DirectionalLight('#9ab9d1',.48);fill.position.set(5,4,-5);scene.add(fill);
const floorMaterial=new THREE.MeshStandardMaterial({color:'#8d9698',roughness:1});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(180,180),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.y=-.02;floor.receiveShadow=true;scene.add(floor);
const r01=createG02RGeometry(),g1=r04StudyGeometry('G1'),g01r=createG02Geometry();
const neutral=new THREE.MeshStandardMaterial({color:'#abb4bb',roughness:.94,metalness:0});
const lookdev=createRockLookdevFactory(),granite=lookdev.materials.T1.triplanar;
const r01Mesh=new THREE.Mesh(r01,neutral),g1Mesh=new THREE.Mesh(g1,neutral);
r01Mesh.castShadow=r01Mesh.receiveShadow=g1Mesh.castShadow=g1Mesh.receiveShadow=true;
r01Mesh.position.y=-.10;g1Mesh.position.y=.14;scene.add(r01Mesh,g1Mesh);
const birchFamily=createBirchFamily(),pineFamily=createPineFamily(),grassFamily=createGrassFamily();
const birch=birchFamily.createMesh(0,'near');birch.position.set(-4.5,-.02,-1.6);birch.scale.setScalar(.82);scene.add(birch);
const pine=pineFamily.createMesh(0,'near');pine.position.set(5.1,-.02,-2.1);pine.scale.setScalar(.80);scene.add(pine);
const grasses=[[-2.1,.45],[2.1,.6],[3.2,-.6],[-1.1,1.75]].map(([x,z],i)=>{
 const m=grassFamily.createMesh((i%4) as 0|1|2|3);m.position.set(x,-.02,z);scene.add(m);return m;});
const others=[birch,pine,...grasses];
const indicatorMat=new THREE.MeshBasicMaterial({color:'#25343d'});
const person=new THREE.Group();
const pole=new THREE.Mesh(new THREE.CylinderGeometry(.023,.023,1.7),indicatorMat);pole.position.y=.85;person.add(pole);
const head=new THREE.Mesh(new THREE.SphereGeometry(.10,12,8),indicatorMat);head.position.y=1.75;person.add(head);
person.position.set(3.05,-.02,0);scene.add(person);
function preset():void{
 const distance=(current.mode==='comparison'||current.mode==='historical')?12.9:current.mode==='context'?13.4:7.3;
 const yFocus=current.mode==='context'?1.25:1.06;
 const v:Record<View,[number,number,number]>={
  front:[0,.22,1],rear:[0,.22,-1],left:[-1,.22,0],right:[1,.22,0],
  frontThreeQuarter:[.55,.30,1],rearThreeQuarter:[-.6,.30,-1],
  top:[.01,1,.01],human:[0,0,1]};
 const d=v[current.view],len=Math.hypot(...d);
 const scale=distance/len;
 camera.position.set(d[0]*scale,current.view==='human'?1.68:d[1]*scale+yFocus,d[2]*scale);
 controls.target.set(0,current.view==='human'?1.15:yFocus,0);
 controls.update();camera.lookAt(controls.target);camera.updateProjectionMatrix();
}
function apply(c:Partial<Config>={}):ReturnType<typeof inspect>{
 current={...current,...c};
 for(const key of Object.keys(initial) as (keyof Config)[]){
  const el=document.getElementById(key) as HTMLInputElement|HTMLSelectElement;
  if(!el)continue;
  if(key==='wireframe')(el as HTMLInputElement).checked=Boolean(current[key]);
  else el.value=String(current[key]);
 }
 r01Mesh.position.x=(current.mode==='comparison'||current.mode==='historical')?2.45:0;
 g1Mesh.position.x=-2.45;g1Mesh.visible=current.mode==='comparison'||current.mode==='historical';
 g1Mesh.geometry=current.mode==='historical'?g01r:g1;
 const ctx=current.mode==='context';others.forEach(o=>o.visible=ctx);
 person.visible=current.mode!=='comparison'&&current.mode!=='historical';person.position.x=ctx?3.2:2.65;
 neutral.wireframe=current.wireframe;granite.wireframe=current.wireframe;
 const mat=current.surface==='T1'?granite:neutral;r01Mesh.material=mat;g1Mesh.material=mat;
 sun.intensity=current.lighting==='grazing'?2.5:current.lighting==='nordic'?2.6:2.1;
 sun.position.set(current.lighting==='grazing'?-11:-6,current.lighting==='grazing'?3:12,8);
 fill.intensity=current.lighting==='grazing'?.2:.55;
 hemi.intensity=current.lighting==='grazing'?1.2:1.65;
 scene.background=new THREE.Color(current.lighting==='neutral'?'#d2d5d6':'#bccdd7');
 floorMaterial.color.set(current.lighting==='neutral'?'#8e9699':'#829787');
 legend.textContent=current.mode==='historical'?'LEFT: original G02  ·  RIGHT: G02R organic refinement (identical camera/light)':
  current.mode==='comparison'?'LEFT: original R04/G1  ·  RIGHT: G02R organic refinement (identical camera/light)':
  current.mode==='context'?'G02R refinement in existing Aurora birch, Scots pine and grass context':
  'The Sheltered Fault G02R · owner art review pending';
 preset();renderer.render(scene,camera);return inspect();
}
function inspect(){
 return {config:current,geometry:{G02R:{triangles:r01.getAttribute('position').count/3,
  vertices:r01.getAttribute('position').count,bounds:r01.boundingBox?.getSize(new THREE.Vector3()).toArray(),
  topology:r01.userData.rockR01.topology},G1:{triangles:g1.getAttribute('position').count/3},G02:{triangles:g01r.getAttribute('position').count/3}},
  renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},
  browser:{webgl:String(renderer.getContext().getParameter(renderer.getContext().VERSION)),
  isWebGL2:renderer.capabilities.isWebGL2},
  errors:lastError,frames,artApproved:false,physicalGPUVerified:false};
}
function capture(){renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}
for(const key of Object.keys(initial)){
 const el=document.getElementById(key) as HTMLInputElement|HTMLSelectElement;
 el.addEventListener('change',()=>{try{apply({[key]:key==='wireframe'?(el as HTMLInputElement).checked:el.value} as Partial<Config>);lastError=null;}
 catch(e){lastError=String(e);console.error(e);}});
}
function animate(){try{controls.update();renderer.render(scene,camera);frames++;}catch(e){lastError=String(e);console.error(e);}requestAnimationFrame(animate);}
apply();animate();
Object.assign(window,{__g02rLab:{configure:apply,inspect,capture,frame:()=>frames}});
addEventListener('pagehide',()=>{
 r01.dispose();g1.dispose();g01r.dispose();neutral.dispose();floor.geometry.dispose();floorMaterial.dispose();
 pole.geometry.dispose();head.geometry.dispose();indicatorMat.dispose();lookdev.dispose();
 birchFamily.dispose();pineFamily.dispose();grassFamily.dispose();renderer.dispose();
});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
