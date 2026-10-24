/** UNDERSTORY-R02 — authored patch showroom. Source R01 geometry unchanged. */
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {makeUnderstoryGeometry,type UnderstoryKind} from '../asset-understory-r01/specimens.ts';
import {authoredLayout,spatialAudit,groundHeight,STUDY} from './plan.ts';
import {makeStageGround,makeSurfaceLitter} from './ground.ts';
import './style.css';
document.querySelector('#app')!.innerHTML=[
 '<canvas></canvas>',
 '<header><span class="kicker">AURORA REST · UNDERSTORY-R02</span><h1>The woodland floor</h1><p>One 7 × 6 m authored patch — real WebGL design study</p></header>',
 '<div class="switches"><button id="a" class="active">A · isolated specimens</button><button id="b">B · authored patch</button></div>',
 '<div class="views"><button data-view="walking">Walking height</button><button data-view="overview">Composition</button><button data-view="bilberry">Bilberry bank</button><button data-view="moss">Moss / litter</button><button data-view="top">Overhead</button></div>',
 '<div class="explain"><strong>FIELD LAYER STUDY</strong><span>Bilberry · airy branching</span><span>Lingonberry · low trailing colonies</span><span>Feather moss · continuous shaded carpet</span><small>Not a final plant library or MAT surface · original R01 geometry unchanged</small></div>',
 '<div class="foot">A/B images use same camera, lighting and source geometry · no world integration</div>'
].join('');
const canvas=document.querySelector('canvas')!;
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
const scene=new T.Scene();scene.background=new T.Color('#bac8ba');scene.fog=new T.Fog('#bac8ba',8,28);
scene.add(new T.HemisphereLight('#e3eddc','#5c6456',2.2));
const sun=new T.DirectionalLight('#fff1d8',2.0);sun.position.set(-4,8,5);scene.add(sun);
const camera=new T.PerspectiveCamera(49,innerWidth/innerHeight,.03,35);
const controls=new OrbitControls(camera,canvas);controls.enableDamping=false;controls.minDistance=.55;controls.maxDistance=13;
const state={disposed:false,mode:'A' as 'A'|'B',view:'overview'};
const mat=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
const sourceGroup=new T.Group(),candidateGroup=new T.Group();
sourceGroup.name='R01 isolated control';candidateGroup.name='R02 authored patch';
scene.add(sourceGroup,candidateGroup);
sourceGroup.add(makeStageGround(false));candidateGroup.add(makeStageGround(true));
candidateGroup.add(makeSurfaceLitter());
const geometries:T.BufferGeometry[]=[];
const variants:[UnderstoryKind,0|1|2][]=[];
for(const kind of ['bilberry','lingonberry','feathermoss'] as const)for(const variant of [0,1,2] as const){
 variants.push([kind,variant]);geometries.push(makeUnderstoryGeometry(kind,variant));
}
for(const [k,g] of geometries.entries()){
 const kind=variants[k][0],variant=variants[k][1],x=kind==='bilberry'?-2.4:kind==='lingonberry'?0:2.4;
 const z=[-.65,0,.65][variant],m=new T.Mesh(g,mat);
 m.position.set(x+[-.32,0,.36][variant],groundHeight(x,z)+.016,z);
 m.rotation.y=.5*variant;m.scale.setScalar(kind==='feathermoss'?1.25:1);
 sourceGroup.add(m);
}
const plan=authoredLayout();
for(let k=0;k<variants.length;k++){
 const [kind,variant]=variants[k],matching=plan.filter(p=>p.kind===kind&&p.variant===variant);
 if(!matching.length)continue;
 const inst=new T.InstancedMesh(geometries[k],mat,matching.length);
 const dummy=new T.Object3D();inst.frustumCulled=false;
 matching.forEach((p,j)=>{
  dummy.position.set(p.x,groundHeight(p.x,p.z)+.018,p.z);
  dummy.rotation.set(0,p.angle,0);
  dummy.scale.setScalar(kind==='feathermoss'?p.scale*1.13:p.scale);
  dummy.updateMatrix();inst.setMatrixAt(j,dummy.matrix);
  const tint=new T.Color().setRGB(.86+.12*Math.sin(j*2.7),.88+.1*Math.cos(j*1.6),.84+.08*Math.sin(j));
  inst.setColorAt(j,tint);
 });
 inst.instanceMatrix.needsUpdate=true;if(inst.instanceColor)inst.instanceColor.needsUpdate=true;
 inst.name='patch:'+kind+':'+variant;candidateGroup.add(inst);
}
const views={
 walking:{eye:[0,1.65,4.5],target:[.05,.19,-.5],fov:54},
 overview:{eye:[5.2,3.85,6.2],target:[0,.15,0],fov:48},
 bilberry:{eye:[-2.75,.84,2.12],target:[-2.45,.18,.48],fov:47},
 moss:{eye:[-1.9,.44,1.55],target:[-2.45,.045,.12],fov:43},
 top:{eye:[0,8.7,.001],target:[0,0,0],fov:40}
} as const;
function render(){if(state.disposed)return;renderer.render(scene,camera);renderer.getContext().finish();}
function setView(view:string){
 if(!(view in views))throw Error('Unknown view '+view);
 state.view=view;const v=views[view as keyof typeof views];
 camera.fov=v.fov;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 camera.position.set(v.eye[0],v.eye[1],v.eye[2]);camera.up.set(0,view==='top'?0:1,view==='top'?-1:0);
 controls.target.set(v.target[0],v.target[1],v.target[2]);camera.lookAt(controls.target);controls.update();
 document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));render();
}
function setMode(mode:'A'|'B'){
 state.mode=mode;sourceGroup.visible=mode==='A';candidateGroup.visible=mode==='B';
 document.querySelector('#a')!.classList.toggle('active',mode==='A');document.querySelector('#b')!.classList.toggle('active',mode==='B');render();
}
document.querySelector<HTMLButtonElement>('#a')!.onclick=()=>setMode('A');document.querySelector<HTMLButtonElement>('#b')!.onclick=()=>setMode('B');
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view!));
canvas.addEventListener('pointerup',render);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);render();});
function snapshot(){
 const audit=spatialAudit();
 return{ready:!state.disposed,mode:state.mode,view:state.view,patch:STUDY,sourceSpecimens:geometries.length,candidateInstances:plan.length,byKind:audit.counts,spatialIds:audit.ids,materialsPreserved:true,render:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},groups:{sourceVisible:sourceGroup.visible,candidateVisible:candidateGroup.visible}};
}
function dispose(){
 if(state.disposed)return;state.disposed=true;
 for(const g of [sourceGroup,candidateGroup]){g.traverse(obj=>{if(obj instanceof T.Mesh){if(!geometries.includes(obj.geometry))obj.geometry.dispose();if(obj.material!==mat)(obj.material as T.Material).dispose();if(obj instanceof T.InstancedMesh)obj.dispose();}});g.removeFromParent();}
 geometries.forEach(g=>g.dispose());mat.dispose();renderer.renderLists.dispose();renderer.dispose();
}
Object.assign(window,{__understoryR02:{setView,setMode,snapshot,render,capture:()=>{render();return canvas.toDataURL('image/png')},dispose}});
setView('overview');setMode('A');
