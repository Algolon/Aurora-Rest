/** ASSET-SOURCE-R06: identical Poly Haven R05 forest floor A/B/A with true supplier moss fronds.
 * Source 1K glTF, textures, alpha mask and original forest floor are publisher hash-verified in CI.
 * The scene does not embed or alter game world files.
 */
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createMossHumusSubstrate} from '../understory-asset-r04/substrate.ts';
import {buildMossVolume,getSourceProtoMeshes} from './source-volume.ts';
import './style.css';
type Provenance={assetId:string;license:string;publisherIntegrityPASS:boolean;files:{path:string;sha256:string}[]};
type R05Source={assetId:string;license:string;maps:Record<'diffuse'|'normal'|'roughness',{localUrl:string;sha256:string}>};
async function json<T>(url:string):Promise<T>{
 const r=await fetch(url);if(!r.ok)throw Error('Missing original verified source manifest: '+url);
 return r.json() as Promise<T>;
}
const [originalMoss,forest]=await Promise.all([
 json<Provenance>('/asset-source-r06/source_provenance.json'),
 json<R05Source>('/asset-source-r05/source_provenance.json')
]);
if(originalMoss.assetId!=='moss_01'||originalMoss.license!=='CC0'||!originalMoss.publisherIntegrityPASS)throw Error('Original source not verified');
if(forest.assetId!=='forest_leaves_02'||forest.license!=='CC0 1.0')throw Error('R05 original supplier provenance mismatch');
if(originalMoss.files.length!==6||Object.keys(forest.maps).length!==3)throw Error('Full supplier texture/geometry dependency list incomplete');

const textureLoader=new T.TextureLoader();
async function loadImage(url:string,type:'diffuse'|'normal'|'rough'){
 const value=await textureLoader.loadAsync(url);value.colorSpace=type==='diffuse'?T.SRGBColorSpace:T.NoColorSpace;
 value.anisotropy=4;value.wrapS=T.ClampToEdgeWrapping;value.wrapT=T.ClampToEdgeWrapping;return value;
}
const [color,normal,rough]=await Promise.all([
 loadImage(forest.maps.diffuse.localUrl,'diffuse'),
 loadImage(forest.maps.normal.localUrl,'normal'),
 loadImage(forest.maps.roughness.localUrl,'rough')
]);
const gltf=await new GLTFLoader().loadAsync('/asset-source-r06/moss_01_1k.gltf');
const prototypes=getSourceProtoMeshes(gltf.scene);
const alpha=await textureLoader.loadAsync('/asset-source-r06/textures/moss_01_alpha_1k.png');
// glTFLoader sets flipY=false on all original glTF textures. Match the official separate alpha mask.
alpha.flipY=false;alpha.colorSpace=T.NoColorSpace;alpha.needsUpdate=true;
const volume=buildMossVolume(gltf.scene,alpha);

const app=document.querySelector('#app')!;
app.innerHTML=[
 '<canvas id="view"></canvas>',
 '<header><span class="eyebrow">AURORA REST · ASSET-SOURCE-R06</span><h1>Real moss volume + verified ground</h1><p>Original Poly Haven geometry · 1K CC0 textures · single 0.85m patch</p></header>',
 '<section class="options"><button id="a" class="active">A · R05 PBR ground</button><button id="b">B · R05 + genuine moss</button></section>',
 '<nav><button data-camera="walking">Walking height</button><button data-camera="oblique">Angled overview</button><button data-camera="macro">Moss close-up</button><button data-camera="overhead">Overhead</button></nav>',
 '<footer>Original author: Rob Tuytel · Powered by Poly Haven · not a production asset · not Android-benchmarked</footer>'
].join('');
const canvas=document.querySelector<HTMLCanvasElement>('#view')!;
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const scene=new T.Scene();scene.background=new T.Color('#a8b6a5');
scene.add(new T.HemisphereLight('#e5eddc','#524b40',2.25));
const sun=new T.DirectionalLight('#fff1dc',2.1);sun.position.set(-2.9,6.3,4.5);scene.add(sun);
const fill=new T.DirectionalLight('#b6c5bd',.55);fill.position.set(3.9,3,-3);scene.add(fill);
const camera=new T.PerspectiveCamera(45,innerWidth/innerHeight,.035,30);
const controls=new OrbitControls(camera,canvas);controls.enableDamping=false;controls.minDistance=.22;controls.maxDistance=10;
const authored=createMossHumusSubstrate(),stageGeom=(authored.group.children[0] as T.Mesh).geometry.clone();
authored.dispose();
if(!stageGeom.getAttribute('uv'))throw Error('R05 test surface missing UV');
const substrate=new T.Mesh(stageGeom,new T.MeshStandardMaterial({map:color,normalMap:normal,roughnessMap:rough,normalScale:new T.Vector2(.70,.70),roughness:1,metalness:0,side:T.DoubleSide}));
substrate.name='EXACT same 2.4m R05 substrate under all views';scene.add(substrate);
const backdrop=new T.Mesh(new T.PlaneGeometry(6,6).rotateX(-Math.PI/2),new T.MeshLambertMaterial({color:'#4d5949'}));
backdrop.position.y=-.035;scene.add(backdrop);
volume.group.visible=false;scene.add(volume.group);
const viewpoints={
 walking:{eye:[-.12,1.65,2.25],target:[-.27,.08,-.17],fov:53},
 oblique:{eye:[1.75,1.30,1.87],target:[-.31,.035,-.13],fov:45},
 macro:{eye:[-.52,.31,.57],target:[-.33,.055,-.14],fov:42},
 overhead:{eye:[0,2.35,.001],target:[-.27,.02,-.14],fov:50}
} as const;
type CameraId=keyof typeof viewpoints;
let mode:'A'|'B'='A',view:CameraId='oblique',disposed=false;
function draw(){if(disposed)return;renderer.render(scene,camera);renderer.getContext().finish();}
function setMode(m:'A'|'B'){
 mode=m;volume.group.visible=m==='B';
 document.querySelector('#a')!.classList.toggle('active',m==='A');
 document.querySelector('#b')!.classList.toggle('active',m==='B');draw();
}
function setView(k:CameraId){
 if(!(k in viewpoints))throw Error('Invalid fixed view '+k);
 view=k;const v=viewpoints[k];camera.fov=v.fov;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 camera.position.set(v.eye[0],v.eye[1],v.eye[2]);camera.up.set(0,k==='overhead'?0:1,k==='overhead'?-1:0);
 controls.target.set(v.target[0],v.target[1],v.target[2]);camera.lookAt(controls.target);controls.update();
 document.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(b=>b.classList.toggle('active',b.dataset.camera===k));draw();
}
document.querySelector('#a')!.addEventListener('click',()=>setMode('A'));
document.querySelector('#b')!.addEventListener('click',()=>setMode('B'));
document.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.camera as CameraId)));
canvas.addEventListener('pointerup',draw);addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();draw();});
function snapshot(){
 return{ready:!disposed,mode,view,sourceMoss:originalMoss.assetId,sourceR05:forest.assetId,verifiedMossFiles:originalMoss.files.length,verifiedGroundMaps:Object.keys(forest.maps).length,
  originalSourceTriangles:volume.metrics.originalSourceTriangles,frondPrototypes:volume.metrics.originalPrototypes,
  instancedMoss:volume.metrics.instancedSourceTriangles,instanceCount:volume.metrics.instanceCount,patchPhysicalWidthM:volume.metrics.physicalWidthM,
  terrainSourceTriangles:stageGeom.index!.count/3,renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},
  trueSourceMesh:true,sameGroundMaterialAndGeometry:true,artApproved:false};
}
function dispose(){
 if(disposed)return;disposed=true;
 volume.dispose();const allTextures=new Set<T.Texture>([alpha,color,normal,rough]);
 for(const p of prototypes){p.geometry.dispose();const materials=Array.isArray(p.material)?p.material:[p.material];for(const m of materials){if(m instanceof T.MeshStandardMaterial){for(const t of [m.map,m.normalMap,m.metalnessMap,m.roughnessMap,m.aoMap,m.alphaMap])if(t)allTextures.add(t);}m.dispose();}}
 for(const t of allTextures)t.dispose();
 substrate.geometry.dispose();(substrate.material as T.Material).dispose();substrate.removeFromParent();
 backdrop.geometry.dispose();(backdrop.material as T.Material).dispose();backdrop.removeFromParent();
 renderer.renderLists.dispose();renderer.dispose();
}
Object.assign(window,{__r06:{setMode,setView,snapshot,capture:()=>{draw();return canvas.toDataURL('image/png')},dispose}});
setView('oblique');setMode('A');
