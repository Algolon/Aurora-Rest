/** ASSET-01E2R-A2 — real Three.js PBR lookdev showroom. Immutable G1 geometry only. */
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {createRockFamily} from '../src/rocks/index.ts';
import {createBirchFamily} from '../src/index.ts';
import {createPineFamily} from '../src/pine/index.ts';
import {createGrassFamily} from '../src/grass/index.ts';
import {r04StudyGeometry,createR04MaterialStudies} from '../src/rocks/experimental/r04MaterialStudies.ts';
import {createRockLookdevFactory,type RockLookdevStudy,type RockProjection} from '../src/rocks/experimental/a2/rockTextureLookdev.ts';
type Mode='materials'|'mapping'|'single'|'context'|'a1-comparison';
type View='threequarter'|'front'|'rear'|'left'|'right'|'top'|'human';
type Light='neutral'|'nordic'|'grazing';
type Config={mode:Mode;study:RockLookdevStudy;projection:RockProjection;view:View;light:Light;orbit:number;zoom:number;wireframe:boolean};
const style=document.createElement('style');
style.textContent='*{box-sizing:border-box}body{margin:0;color:#e9f2f6;font:13px system-ui;background:#85949d;overflow:hidden}canvas{display:block;width:100vw;height:100vh}aside{position:absolute;top:12px;left:12px;z-index:2;max-width:284px;background:#182731ed;padding:14px;border-radius:8px;box-shadow:0 7px 24px #0004}strong{letter-spacing:.08em}small{display:block;margin:4px 0 12px;color:#c5d2da}label{display:block;margin:8px 0}select,input{width:100%;margin-top:3px;padding:4px}input[type=checkbox]{width:auto}pre{font:10px/1.3 monospace;white-space:pre-wrap;max-height:148px;overflow:auto}#legend{position:absolute;bottom:16px;right:15px;background:#1a2935e9;border-radius:6px;padding:12px;max-width:730px;pointer-events:none}';
document.head.appendChild(style);
const panel=document.createElement('aside');
panel.innerHTML='<strong>AURORA REST · E2R-A2</strong><small>Texture lookdev · G1 preserved · ART REVIEW PENDING</small>'
 +'<label>Compare <select id="mode"><option value="materials">T1 / T2 / T3 · identical G1</option><option value="mapping">Planar vs triplanar · same T</option><option value="single">One material in detail</option><option value="context">Approved Aurora nature context</option><option value="a1-comparison">A1 M1 vs A2 T1 · same G1</option></select></label>'
 +'<label>Texture study <select id="study"><option value="T1">T1 · Handcrafted Nordic Granite</option><option value="T2">T2 · Weathered Fractured Granite</option><option value="T3">T3 · Coastal Weathered Stone</option></select></label>'
 +'<label>Projection <select id="projection"><option value="triplanar">Object-space triplanar</option><option value="planar">Original face-planar UV</option></select></label>'
 +'<label>Camera <select id="view"><option value="threequarter">Three-quarter</option><option value="front">Front</option><option value="rear">Rear</option><option value="left">Left</option><option value="right">Right</option><option value="top">Top</option><option value="human">Human height</option></select></label>'
 +'<label>Light <select id="light"><option value="neutral">Neutral diagnostic</option><option value="nordic">Nordic daylight</option><option value="grazing">Grazing/fracture inspection</option></select></label>'
 +'<label><input type="checkbox" id="wireframe"> Wireframe diagnostic</label>'
 +'<label>Orbit <input type="range" min="-180" max="180" value="27" id="orbit"></label>'
 +'<label>Zoom <input type="range" min="55" max="200" value="100" id="zoom"></label><pre id="stats"></pre>';
document.body.appendChild(panel);
const legend=document.createElement('div');legend.id='legend';document.body.appendChild(legend);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.10;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#d3d5d7');
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,150);
const hemi=new THREE.HemisphereLight('#e3efff','#4a5356',1.5);scene.add(hemi);
const sun=new THREE.DirectionalLight('#f6e8d1',2.1);sun.position.set(-5,12,7);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;scene.add(sun);
const fill=new THREE.DirectionalLight('#9dbfdf',.55);fill.position.set(6,4,-4);scene.add(fill);
const floorMat=new THREE.MeshStandardMaterial({color:'#90999f',roughness:1});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),floorMat);floor.rotation.x=-Math.PI/2;
floor.position.y=-.49;floor.receiveShadow=true;scene.add(floor);
// One and only one immutable geometry object for all three specimens.
const geometry=r04StudyGeometry('G1');
const lookdev=createRockLookdevFactory(),previous=createR04MaterialStudies();
const makeRockMesh=():THREE.Mesh=>new THREE.Mesh(geometry);
const meshes:[THREE.Mesh,THREE.Mesh,THREE.Mesh]=[makeRockMesh(),makeRockMesh(),makeRockMesh()];
for(const mesh of meshes){mesh.castShadow=mesh.receiveShadow=true;mesh.position.y=-.25;scene.add(mesh);}
const rockFamily=createRockFamily(),sourceRock=rockFamily.createMesh(11);
sourceRock.position.set(-5,-.25,-1.9);sourceRock.scale.setScalar(.65);scene.add(sourceRock);
const birchFamily=createBirchFamily(),pineFamily=createPineFamily(),grassFamily=createGrassFamily();
const birch=birchFamily.createMesh(0,'near');birch.position.set(-4.7,-.49,-.4);birch.scale.setScalar(.8);scene.add(birch);
const pine=pineFamily.createMesh(0,'near');pine.position.set(5.1,-.49,-1.4);pine.scale.setScalar(.82);scene.add(pine);
const grasses=[[-2.1,.6],[1.8,.3],[3.1,-1.3],[-.6,1.7]].map(([x,z],i)=>{
 const mesh=grassFamily.createMesh((i%4) as 0|1|2|3);mesh.position.set(x,-.49,z);scene.add(mesh);return mesh;
});
const context:[THREE.Object3D,...THREE.Object3D[]]=[sourceRock,birch,pine,...grasses];context.forEach(o=>o.visible=false);
const poleMat=new THREE.MeshBasicMaterial({color:'#2d404e'});
const marker=new THREE.Group();
const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.8),poleMat);pole.position.y=.9-.49;marker.add(pole);
const head=new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),poleMat);head.position.y=1.8-.49;marker.add(head);scene.add(marker);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=1.6;controls.maxDistance=40;
const byId=(id:string)=>document.getElementById(id) as HTMLInputElement|HTMLSelectElement;
let cfg:Config={mode:'materials',study:'T1',projection:'triplanar',view:'threequarter',light:'neutral',orbit:27,zoom:100,wireframe:false};
let frames=0,lastError:string|null=null;
function updateCamera(){
 const multi=cfg.mode==='materials'||cfg.mode==='mapping'||cfg.mode==='a1-comparison';
 const distance=(cfg.mode==='context'?18:multi?12:6.5)*100/cfg.zoom;
 const focus=cfg.mode==='context'?2:.8;
 const angle=cfg.orbit*Math.PI/180;
 const directions:Record<View,[number,number,number]>={
  threequarter:[Math.sin(angle)*distance,distance*.37,Math.cos(angle)*distance],
  front:[0,distance*.24,distance],rear:[0,distance*.24,-distance],
  left:[-distance,distance*.24,0],right:[distance,distance*.24,0],
  top:[.01,distance,.01],human:[0,1.68,distance]
 };
 const p=directions[cfg.view];
 camera.position.set(p[0],cfg.view==='human'?1.68:p[1]+focus,p[2]);
 controls.target.set(0,cfg.view==='human'?1.05:focus,0);
 controls.update();camera.lookAt(controls.target);camera.updateMatrixWorld();
}
function apply(){
 cfg={mode:byId('mode').value as Mode,study:byId('study').value as RockLookdevStudy,
  projection:byId('projection').value as RockProjection,view:byId('view').value as View,
  light:byId('light').value as Light,orbit:Number(byId('orbit').value),
  zoom:Number(byId('zoom').value),wireframe:(byId('wireframe') as HTMLInputElement).checked};
 const all=cfg.mode==='materials',mapping=cfg.mode==='mapping',a1=cfg.mode==='a1-comparison';
 for(let i=0;i<3;i++){
  const mesh=meshes[i];mesh.visible=all||(mapping&&i!==2)||(a1&&i!==2)||(!mapping&&!a1&&i===1);
  mesh.position.set(all?(i-1)*4.55:(mapping||a1)?(i===0?-2.5:2.5):0,-.25,0);
  mesh.geometry=geometry;
  const study=all?(['T1','T2','T3'] as const)[i]:cfg.study;
  mesh.material=a1&&i===0?previous.materials.M1:
   lookdev.materials[study][mapping?(i===0?'planar':'triplanar'):cfg.projection];
 }
 for(const o of context)o.visible=cfg.mode==='context';
 marker.visible=cfg.mode!=='materials';marker.position.x=cfg.mode==='context'?2.7:cfg.mode==='single'?3.3:5.9;
 const old=[...Object.values(previous.materials)];
 const newM=Object.values(lookdev.materials).flatMap(v=>Object.values(v));
 for(const m of [...old,...newM])m.wireframe=cfg.wireframe;
 sun.intensity=cfg.light==='neutral'?2:cfg.light==='grazing'?2.3:2.6;
 sun.position.set(cfg.light==='grazing'?-11:-5,cfg.light==='grazing'?2.4:12,7);
 hemi.intensity=cfg.light==='grazing'?1.05:cfg.light==='neutral'?1.8:1.65;
 fill.intensity=cfg.light==='grazing'?.15:.55;
 scene.background=new THREE.Color(cfg.light==='neutral'?'#d3d5d7':'#c0d0d9');
 floorMat.color.set(cfg.light==='neutral'?'#90999f':'#7c9689');
 renderer.toneMappingExposure=cfg.light==='neutral'?1.04:1.12;
 legend.textContent=all?'ALL IDENTICAL G1: T1 Handcrafted Granite · T2 Fractured Granite · T3 Coastal Weathered':
 mapping?'LEFT PLANAR UV vs RIGHT TRIPLANAR · same '+cfg.study+' texture bytes · G1 unchanged':
 a1?'LEFT A1 M1 legacy vs RIGHT A2 '+cfg.study+' · exact same G1':
 cfg.mode==='context'?'Aurora birch, Scots pine, grass, original production rock + G1/'+cfg.study+' '+cfg.projection:
 'G1 / '+cfg.study+' / '+cfg.projection+' — texture lookdev only · ART REVIEW PENDING';
 updateCamera();
}
function inspect(){
 return {config:cfg,meshes:meshes.filter(m=>m.visible).map(m=>({
  triangles:m.geometry.getAttribute('position').count/3,
  vertices:m.geometry.getAttribute('position').count,
  geometryName:m.geometry.name,material:(m.material as THREE.Material).name,
  shader:(m.material as THREE.Material).userData.a2ShaderDiagnostics||null,
  sameGeometry:m.geometry===geometry
 })),
 renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
  shaderPrograms:renderer.info.programs?.length??null},
 textures:{size:lookdev.textureSize,count:lookdev.textureCount,baseBytes:lookdev.baseTextureBytes,
  mipEstimateBytes:lookdev.mipEstimateBytes,statistics:lookdev.styleStats},
 errors:lastError,frames,realAndroid:false,artApproved:false,
 webgl:String(renderer.getContext().getParameter(renderer.getContext().VERSION))};
}
function mapPreview(study:RockLookdevStudy,kind:'albedo'|'normal'|'roughness'){
 const tex=lookdev.textures[study][kind],img=tex.image;
 const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
 const c=canvas.getContext('2d');if(!c)throw Error('No 2D canvas for map preview');
 const pixels=c.createImageData(img.width,img.height);pixels.data.set(img.data);c.putImageData(pixels,0,0);
 return canvas.toDataURL('image/png');
}
for(const k of ['mode','study','projection','view','light','wireframe','orbit','zoom'])
 byId(k).addEventListener(k==='orbit'||k==='zoom'?'input':'change',()=>{try{apply();lastError=null}catch(e){lastError=String(e);console.error(e)}});
function draw(){renderer.render(scene,camera);}
function animate(){try{controls.update();draw();frames++;if(frames%60===0)byId('stats').textContent=JSON.stringify(inspect(),null,2);}
 catch(e){lastError=String(e);console.error(e);}requestAnimationFrame(animate);}
apply();animate();
Object.assign(window,{__rockA2Lab:{frame:()=>frames,get error(){return lastError},inspect,geometry,
 configure(o:Partial<Config>){for(const [k,v] of Object.entries(o)){const el=byId(k);if(!el)throw Error('Unknown A2 control '+k);
  if(typeof v==='boolean')(el as HTMLInputElement).checked=v;else el.value=String(v);}
  apply();draw();return inspect();},
 capture(){draw();return renderer.domElement.toDataURL('image/png');},mapPreview}});
addEventListener('pagehide',()=>{geometry.dispose();lookdev.dispose();previous.dispose();
 rockFamily.dispose();birchFamily.dispose();pineFamily.dispose();grassFamily.dispose();
 floor.geometry.dispose();floorMat.dispose();pole.geometry.dispose();head.geometry.dispose();poleMat.dispose();renderer.dispose();});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
