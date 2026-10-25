/** ROCK-R01G. Three.js native source-geometry comparison, no geometry synthesis. */
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {r04StudyGeometry} from '../../src/rocks/experimental/r04MaterialStudies.ts';
import {createRockLookdevFactory} from '../../src/rocks/experimental/a2/rockTextureLookdev.ts';
import {createBirchFamily} from '../../src/index.ts';
import {createPineFamily} from '../../src/pine/index.ts';
type View='front'|'rear'|'left'|'right'|'frontThreeQuarter'|'rearThreeQuarter'|'top'|'human';
type Mode='single'|'comparison'|'context';
type Surface='clay'|'T1';
type Config={index:number;view:View;mode:Mode;surface:Surface;wireframe:boolean};
let config:Config={index:0,view:'frontThreeQuarter',mode:'single',surface:'clay',wireframe:false};
let frames=0,error:string|null=null,loaded=false;
const assets:{name:string;sourceId:string;group:THREE.Group;originalTriangles:number;dimensions:number[];bounding:THREE.Box3}[]=[];
const style=document.createElement('style');
style.textContent='body{margin:0;overflow:hidden;font:13px system-ui;background:#d1d6d7}canvas{display:block}aside{position:absolute;left:13px;top:13px;z-index:3;background:#15242eeb;color:white;padding:12px;border-radius:10px;width:250px;max-height:90vh;overflow:auto}label{display:block;margin:8px 0}select{display:block;width:100%;margin-top:4px;padding:5px}#status{position:absolute;bottom:12px;right:12px;background:#15242ee0;color:white;padding:10px;border-radius:8px}';
document.head.appendChild(style);
const panel=document.createElement('aside');
panel.innerHTML='<b>AURORA REST · ROCK-R01G-B / NATURAL SOURCE</b><p>Real CC0 geometry · ART UNAPPROVED · no Blender</p><label>Rock<select id="index"></select></label><label>Mode<select id="mode"><option value="single">Source rock</option><option value="comparison">G1 vs source rock</option><option value="context">Source rock + nature</option></select></label><label>Camera<select id="view"><option value="frontThreeQuarter">Front ¾</option><option value="front">Front</option><option value="rear">Rear</option><option value="left">Left</option><option value="right">Right</option><option value="rearThreeQuarter">Rear ¾</option><option value="top">Top</option><option value="human">Human</option></select></label><label>Appearance<select id="surface"><option value="clay">Neutral clay</option><option value="T1">Aurora existing T1</option></select></label><label><input id="wireframe" type="checkbox"> Wireframe</label><small>Drag to orbit. Geometry unmodified. Normalization for review only.</small>';
document.body.appendChild(panel);
const status=document.createElement('div');status.id='status';status.textContent='Loading original published geometry…';document.body.appendChild(status);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#cbd2d4');
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.1,120),orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;
const hemi=new THREE.HemisphereLight('#ebf0f3','#556066',1.7);scene.add(hemi);
const sun=new THREE.DirectionalLight('#ffefd9',2.3);sun.position.set(-5,11,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const clay=new THREE.MeshStandardMaterial({color:'#b6bfbd',roughness:1});
const groundMat=new THREE.MeshStandardMaterial({color:'#909c98',roughness:1});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),groundMat);ground.rotation.x=-Math.PI/2;ground.position.y=-.025;ground.receiveShadow=true;scene.add(ground);
const look=createRockLookdevFactory(),T1=look.materials.T1.triplanar;
const g1geom=r04StudyGeometry('G1'),g1=new THREE.Mesh(g1geom,clay);g1.castShadow=true;g1.receiveShadow=true;g1.position.set(-2.55,.15,0);scene.add(g1);
let birchFamily:ReturnType<typeof createBirchFamily>|null=null,pineFamily:ReturnType<typeof createPineFamily>|null=null;
const nature:THREE.Object3D[]=[];
function initializeNature(){
 birchFamily=createBirchFamily();pineFamily=createPineFamily();
 const birch=birchFamily.createMesh(0,'near');birch.position.set(-4.3,0,-1.2);birch.scale.setScalar(.75);scene.add(birch);
 const pine=pineFamily.createMesh(0,'near');pine.position.set(4.3,0,-2.4);pine.scale.setScalar(.7);scene.add(pine);nature.push(birch,pine);
}
function preset(){
 const dir:Record<View,[number,number,number]>={front:[0,.19,1],rear:[0,.19,-1],left:[-1,.19,0],right:[1,.19,0],frontThreeQuarter:[.55,.31,1],rearThreeQuarter:[-.6,.3,-1],top:[.01,1,.01],human:[0,.02,1]};
 const d=dir[config.view],len=Math.hypot(...d),dist=config.mode==='comparison'?12.8:config.mode==='context'?12.2:7.5;
 const f=dist/len,cY=config.view==='human'?1.65:1.18;
 camera.position.set(d[0]*f,d[1]*f+(config.view==='human'?1.3:cY),d[2]*f);
 orbit.target.set(0,config.view==='human'?1.2:1.15,0);orbit.update();camera.lookAt(orbit.target);camera.updateProjectionMatrix();
}
function show(){
 if(!loaded)return;
 for(let i=0;i<assets.length;i++){
  const e=assets[i];e.group.visible=i===config.index;
  if(e.group.visible)e.group.position.x=config.mode==='comparison'?2.55:0;
  e.group.traverse(o=>{if((o as THREE.Mesh).isMesh){const mesh=o as THREE.Mesh;mesh.material=config.surface==='T1'?T1:clay;mesh.castShadow=true;mesh.receiveShadow=true;}});
 }
 g1.visible=config.mode==='comparison';
 g1.material=config.surface==='T1'?T1:clay;
 nature.forEach(n=>n.visible=config.mode==='context');
 clay.wireframe=config.wireframe;T1.wireframe=config.wireframe;
 status.textContent=(config.mode==='comparison'?'LEFT: Original G1 · RIGHT: real source stone | ':'')+'Source: '+assets[config.index].name+' · ART NOT APPROVED';
 preset();renderer.render(scene,camera);
}
function inspect(){
 const a=assets[config.index];
 return {loaded,config,candidates:assets.map((a,i)=>({index:i,name:a.name,sourceId:a.sourceId,triangles:a.originalTriangles,sourceUnitsDimensions:a.dimensions})),selection:a?{name:a.name,sourceId:a.sourceId,triangles:a.originalTriangles,sourceDimensions:a.dimensions}:null,
  renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},
  browser:{version:String(renderer.getContext().getParameter(renderer.getContext().VERSION)),isWebGL2:renderer.capabilities.isWebGL2},
  errors:error,artApproved:false,sourcePositionIndicesUnchanged:true,stagingWhiteVertexColorsAdded:true,originalSources:['https://polyhaven.com/a/rock_moss_set_01','https://polyhaven.com/a/namaqualand_boulder_02']};
}
function configure(c:Partial<Config>){config={...config,...c};if(config.index<0||config.index>=assets.length)throw Error('Invalid source index');for(const k of Object.keys(config) as (keyof Config)[]){const el=document.getElementById(k) as HTMLInputElement|HTMLSelectElement;if(!el)continue;if(k==='wireframe')(el as HTMLInputElement).checked=Boolean(config[k]);else el.value=String(config[k]);}show();return inspect();}
function capture(){renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}
async function setup(){
 const loader=new GLTFLoader();
 for(const sourceId of ['rock_moss_set_01','namaqualand_boulder_02']){
 const gltf=await loader.loadAsync('/r01gb/'+sourceId+'/'+sourceId+'_1k.gltf');
 gltf.scene.updateMatrixWorld(true);
 let id=0;
 gltf.scene.traverse(o=>{
  if(!(o as THREE.Mesh).isMesh)return;
  const source=o as THREE.Mesh;
  const authored=source.geometry as THREE.BufferGeometry;
  if(!authored.getAttribute('position'))return;
  // R01G bridge: existing A2 T1 has vertexColors:true; scanned glTF lacks COLOR_0.
  // Clone for review and add NEUTRAL WHITE color only; never alter source positions.
  const geom=authored.clone();
  if(!geom.getAttribute('color')){
    const white=new Float32Array(geom.getAttribute('position').count*3);
    white.fill(1);
    geom.setAttribute('color',new THREE.Float32BufferAttribute(white,3));
  }
  const triangles=geom.index?geom.index.count/3:geom.getAttribute('position').count/3;
  if(triangles<300)return;
  const g=new THREE.Group();
  const mesh=new THREE.Mesh(geom,clay);mesh.applyMatrix4(source.matrixWorld);g.add(mesh);
  const bounds=new THREE.Box3().setFromObject(g);
  const size=bounds.getSize(new THREE.Vector3()),centre=bounds.getCenter(new THREE.Vector3());
  // Entire source mesh remains unedited, only rigid scene normalization.
  const stageScale=3.35/Math.max(size.x,size.z);
  g.scale.setScalar(stageScale);g.position.set(-centre.x*stageScale,-bounds.min.y*stageScale,-centre.z*stageScale);
  const holder=new THREE.Group();holder.add(g);scene.add(holder);
  assets.push({name:sourceId+' / '+(source.name||'Stone')+' / '+String(id++),sourceId,group:holder,originalTriangles:triangles,dimensions:size.toArray(),bounding:bounds});
 });
 }
 if(!assets.length)throw Error('No individual identifiable rock mesh in official glTF');
 assets.sort((a,b)=>(a.sourceId==='rock_moss_set_01'?0:1)-(b.sourceId==='rock_moss_set_01'?0:1)||b.originalTriangles-a.originalTriangles);
 const select=document.getElementById('index') as HTMLSelectElement;
 for(let i=0;i<assets.length;i++){const option=document.createElement('option');option.value=String(i);option.textContent=i+' · '+assets[i].name+' ('+assets[i].originalTriangles+' tris)';select.append(option);}
 initializeNature();loaded=true;show();
}
for(const name of ['index','mode','view','surface','wireframe']){const el=document.getElementById(name) as HTMLInputElement|HTMLSelectElement;el.addEventListener('change',()=>{try{configure({[name]:name==='index'?Number(el.value):name==='wireframe'?(el as HTMLInputElement).checked:el.value} as Partial<Config>);}catch(e){error=String(e);console.error(e);}});}
Object.assign(window,{__r01gb:{configure,inspect,capture,frame:()=>frames}});
setup().catch(e=>{error=String(e);status.textContent='SOURCE LOAD ERROR: '+error;console.error(e);});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
function animate(){orbit.update();renderer.render(scene,camera);frames++;requestAnimationFrame(animate);}
animate();
addEventListener('pagehide',()=>{g1geom.dispose();clay.dispose();T1.wireframe=false;look.dispose();birchFamily?.dispose();pineFamily?.dispose();ground.geometry.dispose();groundMat.dispose();renderer.dispose();});
