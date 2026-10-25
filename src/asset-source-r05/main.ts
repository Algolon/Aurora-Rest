/**
 * R05 isolated exact-geometry PBR evaluation. A and B share R04's SAME position/normal/UV mesh.
 * A = R04 original procedural vertex-colour ground material.
 * B = CC0 Poly Haven Forest Leaves 02 original 1k diffuse + nor_gl + rough maps.
 * Not a reproduction of R03 art; no protected source file is modified.
 */
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createMossHumusSubstrate} from '../understory-asset-r04/substrate.ts';
import './style.css';
type SourceRecord={assetId:string;assetPage:string;license:string;maps:Record<'diffuse'|'normal'|'roughness',{localUrl:string;sha256:string;publisherMd5:string;bytes:number}>};
const response=await fetch('/asset-source-r05/source_provenance.json');
if(!response.ok)throw Error('R05 original publisher-verified asset bytes are missing');
const source:SourceRecord=await response.json();
if(source.assetId!=='forest_leaves_02'||source.license!=='CC0 1.0')throw Error('Source license record is not approved');
const load=new T.TextureLoader();
async function tex(url:string,kind:'color'|'normal'|'rough'){
 const value=await load.loadAsync(url);value.flipY=true;value.colorSpace=kind==='color'?T.SRGBColorSpace:T.NoColorSpace;
 value.anisotropy=4;value.wrapS=T.ClampToEdgeWrapping;value.wrapT=T.ClampToEdgeWrapping;
 return value;
}
const textures=await Promise.all([tex(source.maps.diffuse.localUrl,'color'),tex(source.maps.normal.localUrl,'normal'),tex(source.maps.roughness.localUrl,'rough')]);
const element=document.querySelector('#app');
if(!element)throw Error('Missing app root');
element.innerHTML=[
 '<canvas id="review"></canvas>',
 '<header><span class="eyebrow">AURORA REST · ASSET-SOURCE-R05</span><h1>Verified forest-floor texture</h1><p>Same R04 substrate geometry · source PBR vs procedural colour</p></header>',
 '<div class="switch"><button id="baseline" class="active">A · R04 procedural</button><button id="candidate">B · Poly Haven CC0</button></div>',
 '<nav><button data-camera="walking">Walking height</button><button data-camera="oblique">Surface overview</button><button data-camera="macro">Material close-up</button><button data-camera="overhead">Top-down</button></nav>',
 '<footer>Original 1K diffuse + OpenGL normal + roughness maps · 2.4 × 2.4 m pilot · Powered by Poly Haven · Not production approved</footer>'
].join('');
const canvas=document.querySelector<HTMLCanvasElement>('#review')!;
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const scene=new T.Scene();scene.background=new T.Color('#a8b6a5');
scene.add(new T.HemisphereLight('#e5eddc','#524b40',2.25));
const sun=new T.DirectionalLight('#fff1dc',2.1);sun.position.set(-2.9,6.3,4.5);scene.add(sun);
const fill=new T.DirectionalLight('#b6c5bd',.55);fill.position.set(3.9,3,-3);scene.add(fill);
const camera=new T.PerspectiveCamera(45,innerWidth/innerHeight,.035,30);
const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=false;orbit.minDistance=.32;orbit.maxDistance=10;
const authored=createMossHumusSubstrate();
const originalMesh=authored.group.children[0] as T.Mesh;
const original=originalMesh.geometry.clone();authored.dispose();
if(!original.getAttribute('uv')||!original.getAttribute('normal'))throw Error('R04 original substrate cannot accept source maps');
const aMat=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
const bMat=new T.MeshStandardMaterial({map:textures[0],normalMap:textures[1],roughnessMap:textures[2],normalScale:new T.Vector2(.70,.70),metalness:0,roughness:1,side:T.DoubleSide});
const baseline=new T.Mesh(original,aMat),candidate=new T.Mesh(original,bMat);
baseline.name='R04 procedural colour — same preserved mesh';candidate.name='Poly Haven 1k PBR — exact same mesh';
scene.add(baseline,candidate);candidate.visible=false;
const ground=new T.Mesh(new T.PlaneGeometry(6,6).rotateX(-Math.PI/2),new T.MeshLambertMaterial({color:'#4d5949'}));
ground.position.y=-.035;scene.add(ground);
const cameras={
 walking:{eye:[0,1.65,2.25],target:[0,.03,0],fov:53},
 oblique:{eye:[2.1,2.0,2.7],target:[0,.04,0],fov:47},
 macro:{eye:[.32,.32,.70],target:[.15,.04,-.08],fov:45},
 overhead:{eye:[0,3.0,.001],target:[0,0,0],fov:49}
} as const;
type Cam=keyof typeof cameras;
let mode:'A'|'B'='A',view:Cam='oblique',disposed=false;
function render(){if(disposed)return;renderer.render(scene,camera);renderer.getContext().finish();}
function setMode(m:'A'|'B'){
 mode=m;baseline.visible=m==='A';candidate.visible=m==='B';
 document.querySelector('#baseline')!.classList.toggle('active',m==='A');
 document.querySelector('#candidate')!.classList.toggle('active',m==='B');render();
}
function setView(v:Cam){
 if(!(v in cameras))throw Error('Unknown R05 camera '+v);
 view=v;const def=cameras[v];camera.fov=def.fov;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 camera.position.set(def.eye[0],def.eye[1],def.eye[2]);camera.up.set(0,v==='overhead'?0:1,v==='overhead'?-1:0);
 orbit.target.set(def.target[0],def.target[1],def.target[2]);camera.lookAt(orbit.target);orbit.update();
 document.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(b=>b.classList.toggle('active',b.dataset.camera===v));render();
}
document.querySelector('#baseline')!.addEventListener('click',()=>setMode('A'));
document.querySelector('#candidate')!.addEventListener('click',()=>setMode('B'));
document.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.camera as Cam)));
canvas.addEventListener('pointerup',render);
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();render();});
function snapshot(){
 const g=original;
 return{ready:!disposed,mode,view,assetId:source.assetId,license:source.license,sourceMaps:Object.keys(source.maps),
  totalSourceBytes:Object.values(source.maps).reduce((s,e)=>s+e.bytes,0),
  sharedGeometry:true,vertices:g.getAttribute('position').count,triangles:(g.index?.count??g.getAttribute('position').count)/3,
  samplerResolution:'1k',sceneRender:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},r04GeomUnchanged:true};
}
function dispose(){
 if(disposed)return;disposed=true;
 baseline.removeFromParent();candidate.removeFromParent();original.dispose();aMat.dispose();bMat.dispose();
 for(const texture of textures)texture.dispose();
 ground.geometry.dispose();(ground.material as T.Material).dispose();ground.removeFromParent();
 renderer.renderLists.dispose();renderer.dispose();
}
Object.assign(window,{__r05:{setMode,setView,snapshot,capture:()=>{render();return canvas.toDataURL('image/png')},dispose}});
setView('oblique');setMode('A');
