/** Isolated S1R polish. The study mesh is ALWAYS loaded from Blender's real GLB. */
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {createRockLookdevFactory} from '../src/rocks/experimental/a2/rockTextureLookdev.ts';
import {createBirchFamily} from '../src/index.ts';
import {createPineFamily} from '../src/pine/index.ts';
import {createGrassFamily} from '../src/grass/index.ts';
const glbUrl=new URL('../art/blender/s1r-sculptural-polish/aurora-rock-s1r.glb',import.meta.url).href;
const baselineUrl=new URL('../art/blender/s1-geological-sculpt/aurora-rock-s1.glb',import.meta.url).href;
const referenceUrl=new URL('../art/blender/s1-geological-sculpt/references/reference-geometry.json',import.meta.url).href;
const style=document.createElement('style');style.textContent=`body{margin:0;overflow:hidden;font:13px system-ui;color:#25343c;background:#cdd3d6}canvas{display:block}header{position:absolute;left:28px;top:24px;right:28px;pointer-events:none}h1{font-size:17px;font-weight:600;letter-spacing:.12em;margin:0 0 5px}small{font-size:11px;letter-spacing:.08em}nav{position:absolute;right:24px;top:24px;display:flex;gap:8px}select{background:#e9edefcc;border:1px solid #a1afb7;padding:7px;color:#25343c;border-radius:4px}footer{position:absolute;bottom:24px;left:28px;right:28px;display:flex;justify-content:space-between;align-items:end;pointer-events:none}#caption{font-size:14px;white-space:pre-line}#stats{font:10px monospace;color:#435760;text-align:right}body[data-capture=true] nav{display:none}`;document.head.append(style);
document.body.insertAdjacentHTML('beforeend','<header><h1>AURORA REST / S1R</h1><small>S1 / S1R SCULPTURAL POLISH · THREE.JS / ACTUAL GLB · OWNER ART REVIEW PENDING</small></header><nav><select id="asset"><option>S1R</option><option>S1</option></select><select id="light"><option>neutral</option><option>nordic</option><option>grazing</option></select><select id="mode"><option>single</option><option>compare</option><option>context</option><option>context-wide</option></select><select id="reference"><option>S1</option><option>G1</option><option>A-V2</option><option>A-V3</option><option>A-V0</option></select><select id="surface"><option>neutral</option><option>T1</option><option>silhouette</option><option>wireframe</option></select><select id="view"><option>threequarter-front</option><option>threequarter-rear</option><option>front</option><option>rear</option><option>left</option><option>right</option><option>top</option><option>human-height</option><option>shoulder</option><option>ground</option></select></nav><footer><div id="caption"></div><div id="stats"></div></footer>');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.body.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#cdd3d6');
const ortho=new THREE.OrthographicCamera(-2.3,2.3,1.3,-1.3,.05,150),perspective=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.05,150);
const controls=new OrbitControls(ortho,renderer.domElement);controls.enableDamping=false;
const hemi=new THREE.HemisphereLight('#edf2f7','#51565a',1.7);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff4e6',2.5);sun.position.set(-3,7,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-15;sun.shadow.camera.right=15;sun.shadow.camera.top=15;sun.shadow.camera.bottom=-15;sun.shadow.normalBias=.018;scene.add(sun);
const fill=new THREE.DirectionalLight('#cbdcec',.7);fill.position.set(4,3,-4);scene.add(fill);
const floorMat=new THREE.MeshStandardMaterial({color:'#939fa5',roughness:1});const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-.009;floor.receiveShadow=true;scene.add(floor);
const neutral=new THREE.MeshStandardMaterial({color:'#a9b0b7',roughness:.95,side:THREE.FrontSide});
const silhouette=new THREE.MeshBasicMaterial({color:'#23323d',side:THREE.FrontSide});const wire=neutral.clone();wire.wireframe=true;
const lookdev=createRockLookdevFactory();
const gltf=await new GLTFLoader().loadAsync(glbUrl);
const s1=gltf.scene;scene.add(s1);
const baselineGltf=await new GLTFLoader().loadAsync(baselineUrl);const original=baselineGltf.scene;scene.add(original);
const baselineMeshes:THREE.Mesh[]=[];original.traverse(o=>{if(o instanceof THREE.Mesh){baselineMeshes.push(o);o.castShadow=o.receiveShadow=true;}});
const s1Meshes:THREE.Mesh[]=[];
s1.traverse(o=>{if(o instanceof THREE.Mesh){s1Meshes.push(o);o.castShadow=o.receiveShadow=true;}});
if(s1Meshes.length!==1)throw Error('Expected exactly one Blender runtime mesh');
// Exported COLOR_0 is checked by the browser QA. No global A2 shader edits.
const importedMaterials=new Set<THREE.Material>();for(const m of [...s1Meshes,...baselineMeshes])for(const mat of (Array.isArray(m.material)?m.material:[m.material]))importedMaterials.add(mat);for(const m of importedMaterials)m.dispose();
const geom=s1Meshes[0].geometry as THREE.BufferGeometry;
if(!geom.getAttribute('color'))throw Error('Blender export is missing rock color attribute');
const bounds=new THREE.Box3().setFromObject(s1),dims=bounds.getSize(new THREE.Vector3());
if(Math.abs(bounds.min.y)>.0001||Math.abs(dims.y-1.657)>.02)throw Error('Export orientation/scale/pivot mismatch');
type RefPart={position:number[];normal:number[];color:number[];uv:number[];groundY:number};
const refsData=await (await fetch(referenceUrl)).json() as {meshes:Record<string,RefPart[]>};
const refs:Record<string,THREE.Group>={};
for(const [key,parts] of Object.entries(refsData.meshes)){
 const group=new THREE.Group();group.name=key;refs[key]=group;scene.add(group);
 for(const part of parts){const g=new THREE.BufferGeometry();for(const k of ['position','normal','color','uv'] as const)g.setAttribute(k,new THREE.Float32BufferAttribute(part[k],k==='uv'?2:3));const m=new THREE.Mesh(g,neutral);m.position.y=-part.groundY;m.castShadow=m.receiveShadow=true;group.add(m);}
}
const birches=createBirchFamily(),pines=createPineFamily(),grasses=createGrassFamily();
const vegetation=new THREE.Group();scene.add(vegetation);
const birch=birches.createMesh(0,'near');birch.position.set(-3.5,0,-2.0);birch.scale.setScalar(.83);vegetation.add(birch);
const pine=pines.createMesh(0,'near');pine.position.set(3.6,0,-3.0);pine.scale.setScalar(.85);vegetation.add(pine);
for(const [i,[x,z]] of [[-1.4,.5],[1.5,.5],[-2.1,-.2],[2,-.5],[-1.3,1.3],[2.5,1.2]].entries()){const g=grasses.createMesh((i%4) as 0|1|2|3);g.position.set(x,0,z);vegetation.add(g);}
const marker=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,1.8,8),new THREE.MeshBasicMaterial({color:'#394b55'}));marker.position.set(1.5,.9,0);scene.add(marker);
const state={asset:'S1R',mode:'compare',reference:'S1',surface:'neutral',light:'neutral',view:'threequarter-front'};
const byId=(id:string)=>document.getElementById(id)!;
let activeCamera:THREE.Camera=ortho,frames=0;
function configure(next:Partial<typeof state>={}){
 Object.assign(state,next);for(const k of Object.keys(state) as (keyof typeof state)[])(byId(k) as HTMLSelectElement).value=state[k];
 const context=state.mode.startsWith('context'),compare=state.mode==='compare';
 const mat=state.surface==='T1'?lookdev.materials.T1.triplanar:state.surface==='silhouette'?silhouette:state.surface==='wireframe'?wire:neutral;
 sun.position.set(state.light==='grazing'?-8:-3,state.light==='grazing'?1.7:7,5);sun.intensity=state.light==='nordic'?2.8:2.5;hemi.intensity=state.light==='grazing'?.85:1.7;fill.intensity=state.light==='grazing'?.2:.7;
 for(const m of [...s1Meshes,...baselineMeshes]){m.material=mat;m.receiveShadow=!compare;}
 s1.visible=compare||state.asset==='S1R';original.visible=compare?state.reference==='S1':state.asset==='S1';original.position.x=compare?-1.9:0;
 for(const [name,r] of Object.entries(refs)){r.visible=compare&&name===state.reference;r.position.x=-1.9;r.traverse(o=>{if(o instanceof THREE.Mesh){o.material=mat;o.receiveShadow=!compare;}});}
 s1.position.x=compare?1.9:0;vegetation.visible=context;floorMat.color.set(context?'#82927c':'#939fa5');
 marker.visible=state.view!=='shoulder'&&state.view!=='ground';marker.position.x=compare?3.4:context?1.8:1.4;
 const vectors:Record<string,number[]>={'threequarter-front':[3.3,1.82,5],'threequarter-rear':[-3.8,1.92,-4.5],front:[0,.12,6],rear:[0,.12,-6],left:[-6,.12,0],right:[6,.12,0],top:[.0001,7,.0001],'human-height':[2.9,.92,4.4],shoulder:[2.5,1.12,3.4],ground:[2.5,.42,4]};
 const v=vectors[state.view];const screenRight=new THREE.Vector3(v[2],0,-v[0]).normalize();s1.position.copy(screenRight).multiplyScalar(compare?1.9:0);original.position.copy(screenRight).multiplyScalar(compare?-1.9:0);for(const r of Object.values(refs))r.position.copy(screenRight).multiplyScalar(-1.9);if(compare){marker.position.copy(screenRight).multiplyScalar(3.4);marker.position.y=.9;}
 const target=new THREE.Vector3(0,state.mode==='context-wide'?4.5:context?1.6:compare&&state.reference==='G1'?1.1:.78,0);
 let width=compare?(state.reference==='G1'?10.8:8.4):state.mode==='context-wide'?22:context?13.5:4.8;
 if(state.view==='shoulder'){target.set(.43,.87,.30);width=2.9;}if(state.view==='ground'){target.set(.1,.18,.1);width=3.7;}
 ortho.left=-width/2;ortho.right=width/2;ortho.top=width*innerHeight/innerWidth/2;ortho.bottom=-ortho.top;ortho.updateProjectionMatrix();
 activeCamera=state.view==='human-height'?perspective:ortho;
 if(activeCamera===perspective){perspective.aspect=innerWidth/innerHeight;perspective.updateProjectionMatrix();perspective.position.set(compare?6:2.9,1.7,compare?11:4.4);perspective.lookAt(0,.78,0);controls.enabled=false;}
 else{ortho.position.copy(target).add(new THREE.Vector3(...v as [number,number,number]).multiplyScalar(3));controls.enabled=true;controls.target.copy(target);controls.update();}
 byId('caption').textContent=compare?`${state.reference} · protected reference          /          S1R · Blender GLB\nSame metric scale · ${state.surface} · ${state.light} light · ${state.view}`:context?`S1R / ORIGINAL AURORA NATURE LIBRARY\nUnchanged birch · Scots pine · grass / ${state.surface}`:`${state.asset} / ${state.surface.toUpperCase()} / ${state.view} / ${state.light} light\n${state.asset==='S1R'?'2.157 × 1.657 × 1.566':'2.080 × 1.647 × 1.547'} m · 1.8 m scale marker`;
 render();updateStats();return stats();
}
function render(){renderer.render(scene,activeCamera);}
function stats(){return {state:{...state},glb:{meshes:s1Meshes.length,dimensions:dims.toArray(),min:bounds.min.toArray(),max:bounds.max.toArray(),vertices:geom.getAttribute('position').count,triangles:(geom.index?.count??geom.getAttribute('position').count)/3,attributes:Object.keys(geom.attributes),rootScale:s1.scale.toArray()},renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},backend:renderer.getContext().getParameter(renderer.getContext().VERSION),frames,glbIdentity:'S1R target (S1 is immutable comparison)',artApproved:false,glbBytes:12456,resources:{runtimeMeshes:1,materialSlots:1,ownsGeometry:true,sharedT1Factory:true}};}
for(const k of Object.keys(state))byId(k).addEventListener('change',()=>configure({[k]:(byId(k) as HTMLSelectElement).value}));
function updateStats(){byId('stats').textContent=`${renderer.info.render.calls} draws / ${renderer.info.render.triangles} frame triangles\n1 runtime rock mesh / no island integration`;}
function animate(){render();frames++;if(frames%30===0)updateStats();requestAnimationFrame(animate);}
configure();animate();
Object.assign(window,{__s1rLab:{configure,stats,frame:()=>frames,capture:()=>{render();return renderer.domElement.toDataURL('image/png');}}});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);configure();});
addEventListener('pagehide',()=>{controls.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});lookdev.dispose();birches.dispose();pines.dispose();grasses.dispose();neutral.dispose();silhouette.dispose();wire.dispose();floorMat.dispose();(marker.material as THREE.Material).dispose();renderer.dispose();});
