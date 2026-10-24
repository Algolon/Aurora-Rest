import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {makeUnderstoryGeometry,measure,SPECIMENS,type UnderstoryKind} from './specimens.ts';
import './style.css';
const host=document.querySelector('#app');if(!host)throw Error('Missing container');
host.innerHTML=`<div class="world"><canvas id="view"></canvas><div class="header"><span class="eyebrow">AURORA REST — ASSET-UNDERSTORY-R01</span><h1>Nordic forest floor</h1><p>Botanical form study · original WebGL · not production approved</p></div>
 <nav><button data-view="overview" class="active">Overview</button><button data-view="walking">Walking height</button><button data-view="bilberry">Bilberry detail</button><button data-view="lingonberry">Lingonberry detail</button><button data-view="moss">Moss detail</button><button data-view="top">Top-down</button></nav>
 <div class="legend"><section><b>01 · BILBERRY</b><span>Vaccinium myrtillus</span></section><section><b>02 · LINGONBERRY</b><span>Vaccinium vitis-idaea</span></section><section><b>03 · FEATHER MOSS</b><span>Hylocomium / Pleurozium type</span></section></div>
 <div class="foot">Scale: metres · one reference-first specimen group per type · AUR-R01 study only</div></div>`;
const canvas=document.querySelector<HTMLCanvasElement>('#view')!;
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,alpha:false});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;renderer.shadowMap.enabled=false;
const scene=new T.Scene();scene.background=new T.Color('#bcc9b8');scene.fog=new T.Fog('#bcc9b8',9,25);
const camera=new T.PerspectiveCamera(46,innerWidth/innerHeight,.04,30);
const controls=new OrbitControls(camera,canvas);controls.enableDamping=false;controls.minDistance=.35;controls.maxDistance=10;
scene.add(new T.HemisphereLight('#e4f0dc','#6b6655',2.2));
const key=new T.DirectionalLight('#fff1db',2.35);key.position.set(-3,7,4);scene.add(key);
const fill=new T.DirectionalLight('#cbd9d0',.65);fill.position.set(5,3,-4);scene.add(fill);
const samples:{kind:UnderstoryKind;variant:0|1|2;mesh:T.Mesh;geo:T.BufferGeometry}[]=[];
const material=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
const groundY=(x:number,z:number)=>.023*Math.sin(x*1.74+z*.63)*Math.cos(z*1.35)+.008*Math.sin(x*6.3-z*2.7);
const ground=new T.PlaneGeometry(9,6,96,68);ground.rotateX(-Math.PI/2);
const pos=ground.getAttribute('position') as T.BufferAttribute,colors:number[]=[];
for(let i=0;i<pos.count;i++){
 const x=pos.getX(i),z=pos.getZ(i),y=groundY(x,z);pos.setY(i,y);
 const hue=.50+.16*Math.sin(x*.95+z*1.1)+.07*Math.sin(x*4.3-z*3.8);
 const c=new T.Color().setRGB(.24*hue,.28*hue,.19*hue);colors.push(c.r,c.g,c.b);
}
ground.setAttribute('color',new T.Float32BufferAttribute(colors,3));ground.computeVertexNormals();
const groundMesh=new T.Mesh(ground,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));scene.add(groundMesh);
const placement:Record<UnderstoryKind,number>={bilberry:-2.4,lingonberry:0,feathermoss:2.4};
const offsets=[[0,0],[-.36,-.44],[.43,.28]] as const;
for(const kind of Object.keys(placement) as UnderstoryKind[])for(let variant=0;variant<3;variant++){
 const g=makeUnderstoryGeometry(kind,variant as 0|1|2),m=new T.Mesh(g,material);
 const [dx,dz]=offsets[variant];const x=placement[kind]+dx,z=dz;
 m.position.set(x,groundY(x,z)+.008,z);m.rotation.y=variant*.86;m.scale.setScalar(kind==='feathermoss'?1.38:variant===1?.88:variant===2?1.07:1);
 m.name=kind+'.'+variant;scene.add(m);samples.push({kind,variant:variant as 0|1|2,mesh:m,geo:g});
}
const camViews={
 overview:{eye:[0,2.4,5.45],target:[0,.12,0],fov:45},
 walking:{eye:[0,1.64,5.0],target:[0,.17,0],fov:51},
 bilberry:{eye:[-2.08,.74,1.21],target:[-2.4,.18,0],fov:40},
 lingonberry:{eye:[.25,.53,1.08],target:[0,.11,0],fov:40},
 moss:{eye:[2.6,.43,1.08],target:[2.4,.05,0],fov:40},
 top:{eye:[0,6.2,.001],target:[0,0,0],fov:42}
} as const;
let current:keyof typeof camViews='overview',disposed=false;
function setView(id:string){
 if(!(id in camViews))throw Error('Unknown view '+id);current=id as keyof typeof camViews;
 const view=camViews[current];camera.fov=view.fov;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 camera.position.set(...view.eye);camera.up.set(0,current==='top'?0:1,current==='top'?-1:0);controls.target.set(...view.target);camera.lookAt(controls.target);controls.update();
 for(const btn of document.querySelectorAll('button[data-view]'))btn.classList.toggle('active',btn.getAttribute('data-view')===current);
 render();
}
function render(){if(disposed)return;renderer.render(scene,camera);renderer.getContext().finish();}
for(const btn of document.querySelectorAll<HTMLButtonElement>('button[data-view]'))btn.onclick=()=>setView(btn.dataset.view!);
canvas.addEventListener('pointerup',()=>render());
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);render()});
function snapshot(){return{ready:!disposed,view:current,count:samples.length,types:SPECIMENS,render:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},source:samples.map(s=>measure(s.kind,s.variant)),protectedSourceFilesUnmodified:true,artApproved:false};}
function dispose(){if(disposed)return;disposed=true;for(const s of samples){s.mesh.removeFromParent();s.geo.dispose();}samples.length=0;groundMesh.removeFromParent();ground.dispose();(groundMesh.material as T.Material).dispose();material.dispose();renderer.renderLists.dispose();renderer.dispose();}
Object.assign(window,{__understory:{setView,snapshot,dispose,render}});
setView('overview');
