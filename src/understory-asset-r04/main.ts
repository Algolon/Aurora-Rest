import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {makeUnderstoryGeometry} from '../asset-understory-r01/specimens.ts';
import {createMossHumusSubstrate,SUBSTRATE} from './substrate.ts';
import {createDenseBilberry,BILBERRY} from './bilberry.ts';
import './style.css';
document.querySelector('#app')!.innerHTML='<canvas id="scene"></canvas><header><small>AURORA REST / ASSET-R04</small><h1>Moss, humus &amp; bilberry</h1><p>Original Three.js specimens · isolated asset study</p></header><nav><button id="a">A: R01</button><button id="b">B: R04</button><button data-view="overview">Overview</button><button data-view="walking">Walking height</button><button data-view="substrate">Substrate</button><button data-view="bilberry">Bilberry</button><button data-view="top">Overhead</button></nav><footer>Prototype only · not production approved · no external textures</footer>';
const canvas=document.querySelector<HTMLCanvasElement>('#scene')!;
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.17;
const scene=new T.Scene();scene.background=new T.Color('#b4c2b6');scene.fog=new T.Fog('#b4c2b6',8,24);
scene.add(new T.HemisphereLight('#e5eddc','#5b594f',2.1));
const sun=new T.DirectionalLight('#fff0d6',2);sun.position.set(-3,7,4);scene.add(sun);
const camera=new T.PerspectiveCamera(46,innerWidth/innerHeight,.03,30);
const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=false;orbit.minDistance=.45;orbit.maxDistance=12;
const stage=new T.Mesh(new T.PlaneGeometry(8,5).rotateX(-Math.PI/2),new T.MeshLambertMaterial({color:'#53614d'}));stage.position.y=-.024;scene.add(stage);
const source=new T.Group(),candidate=new T.Group();scene.add(source,candidate);
const sourceMaterial=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}),sourceMeshes:T.Mesh[]=[];
for(let i=0;i<7;i++){
 const m=new T.Mesh(makeUnderstoryGeometry('feathermoss',(i%3) as 0|1|2),sourceMaterial),a=i*2.39996,r=.15+.51*Math.sqrt((i+.2)/7);
 m.position.set(-1.95+Math.cos(a)*r,.012,Math.sin(a)*r);m.rotation.y=i*.52;source.add(m);sourceMeshes.push(m);
}
const old=new T.Mesh(makeUnderstoryGeometry('bilberry',1),sourceMaterial);old.position.x=1.95;source.add(old);sourceMeshes.push(old);
const substrate=createMossHumusSubstrate(),bilberry=createDenseBilberry();
substrate.group.position.x=-1.95;bilberry.group.position.x=1.95;candidate.add(substrate.group,bilberry.group);
const views={
 overview:{eye:[0,2.85,6.25],target:[0,.06,0],fov:45},
 walking:{eye:[0,1.65,4.55],target:[0,.10,-.15],fov:53},
 substrate:{eye:[-1.95,.73,1.68],target:[-1.95,.025,0],fov:48},
 bilberry:{eye:[1.95,.85,1.55],target:[1.95,.25,0],fov:43},
 top:{eye:[0,5.7,.001],target:[0,0,0],fov:46}
} as const;
let mode:'A'|'B'='A',view:keyof typeof views='overview',disposed=false;
function render(){if(disposed)return;renderer.render(scene,camera);renderer.getContext().finish();}
function setMode(x:'A'|'B'){mode=x;source.visible=x==='A';candidate.visible=x==='B';document.querySelector('#a')!.classList.toggle('active',x==='A');document.querySelector('#b')!.classList.toggle('active',x==='B');render();}
function setView(id:keyof typeof views){view=id;const v=views[id];camera.fov=v.fov;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();camera.position.set(v.eye[0],v.eye[1],v.eye[2]);camera.up.set(0,id==='top'?0:1,id==='top'?-1:0);orbit.target.set(v.target[0],v.target[1],v.target[2]);camera.lookAt(orbit.target);orbit.update();document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===id));render();}
document.querySelector('#a')!.addEventListener('click',()=>setMode('A'));document.querySelector('#b')!.addEventListener('click',()=>setMode('B'));
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view as keyof typeof views)));
canvas.addEventListener('pointerup',render);addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);render();});
function snapshot(){return{ready:!disposed,mode,view,specs:{substrate:SUBSTRATE,bilberry:BILBERRY},assets:{substrate:substrate.metrics(),bilberry:bilberry.metrics()},sourceMeshes:sourceMeshes.length,render:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles}};}
function dispose(){if(disposed)return;disposed=true;for(const m of sourceMeshes){m.geometry.dispose();m.removeFromParent();}sourceMaterial.dispose();substrate.dispose();bilberry.dispose();stage.geometry.dispose();(stage.material as T.Material).dispose();stage.removeFromParent();renderer.renderLists.dispose();renderer.dispose();}
Object.assign(window,{__r04:{setMode,setView,snapshot,capture:()=>{render();return canvas.toDataURL('image/png')},dispose}});
setView('overview');setMode('A');
