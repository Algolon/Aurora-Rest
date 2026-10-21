/** Genuine isolated Three.js ASSET-01E2A visual study, not production-world integration. */
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {makeE2Geometry,makeStudyMaterial,STUDIES} from '../src/rocks/experimental/e2/studyMaterials.ts';
import {rockR04Geometry,rockR04Material} from '../src/rocks/experimental/r04HeroBoulder.ts';
import {createBirchFamily} from '../src/index.ts';
import {createPineFamily} from '../src/pine/index.ts';
import {createGrassFamily} from '../src/grass/index.ts';
import type {RockId} from '../src/rocks/experimental/e2/heroRockStudies.ts';
type Choice=RockId|'R04'|'overview'|'nature';
type View='front'|'rear'|'left'|'right'|'threequarter'|'top'|'human';
type Mode='clay'|'silhouette'|'wire'|'nordic';
type Light='neutral'|'nordic';
type Config={choice:Choice;view:View;mode:Mode;light:Light;shadows:boolean;orbit:number;zoom:number};
const style=document.createElement('style');
style.textContent=`*{box-sizing:border-box}body{margin:0;font:13px system-ui;background:#e2e4e5;color:#e8eef4;overflow:hidden}
canvas{display:block;width:100vw;height:100vh}aside{position:absolute;z-index:3;top:12px;left:12px;background:#14232be8;padding:14px;border-radius:8px;max-width:260px;box-shadow:0 8px 24px #1f2c3555}
strong{font-size:14px;letter-spacing:.04em;display:block}small{display:block;margin:4px 0 9px;color:#c0cad0}
label{display:block;margin:7px 0}select,input{font:inherit;width:100%;padding:4px;margin-top:3px}
input[type=checkbox]{width:auto}pre{font:11px/1.4 monospace;max-height:34vh;overflow:auto;white-space:pre-wrap;color:#d5dfe6}
#note{position:absolute;right:14px;bottom:14px;padding:9px;background:#172730e9;font-size:12px;border-radius:6px}`;
document.head.appendChild(style);
const panel=document.createElement('aside');panel.innerHTML=`<strong>ASSET-01E2A · SILHOUETTES</strong><small>All candidates experimental · NOT APPROVED</small>
<label>Design<select id="choice"><option value="overview">All three + R04</option><option value="A">A — Fractured granite</option><option value="B">B — Glacial erratic</option><option value="C">C — Nordic outcrop</option><option value="R04">R04 source benchmark</option><option value="nature">All rocks + approved vegetation</option></select></label>
<label>Camera<select id="view"><option value="threequarter">Three-quarter</option><option value="front">Front</option><option value="rear">Rear</option><option value="left">Left</option><option value="right">Right</option><option value="top">Top</option><option value="human">Human walking height</option></select></label>
<label>Geometry material<select id="mode"><option value="clay">Matte grey geometry</option><option value="silhouette">Flat silhouette</option><option value="wire">Wireframe</option><option value="nordic">Diagnostic stone (NOT approved)</option></select></label>
<label>Lighting<select id="light"><option value="neutral">Neutral</option><option value="nordic">Nordic daylight</option></select></label>
<label><input type="checkbox" id="shadows" checked> Shadows</label><label>Orbit<input id="orbit" type="range" min="-180" max="180" value="28"></label>
<label>Zoom<input id="zoom" type="range" min="60" max="160" value="100"></label><pre id="stats"></pre>`;
document.body.appendChild(panel);
const note=document.createElement('div');note.id='note';note.textContent='ART STUDIES ONLY · A / B / C vs unchanged R04';document.body.appendChild(note);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,130);
scene.background=new THREE.Color('#dedfe0');
const hemi=new THREE.HemisphereLight('#ffffff','#5d6369',2.05);scene.add(hemi);
const key=new THREE.DirectionalLight('#fff9ee',2.6);key.position.set(-7,10,6);key.castShadow=true;
key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-23;key.shadow.camera.right=23;
key.shadow.camera.top=23;key.shadow.camera.bottom=-23;key.shadow.bias=-.00035;scene.add(key);
const backlight=new THREE.DirectionalLight('#c7d4df',.45);backlight.position.set(8,5,-7);scene.add(backlight);
const floorMat=new THREE.MeshStandardMaterial({color:'#c0c3c5',roughness:1});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(130,130),floorMat);
floor.rotation.x=-Math.PI/2;floor.position.y=-.21;floor.receiveShadow=true;scene.add(floor);
const geometries=new Map<RockId,THREE.BufferGeometry>();
const builds:Record<string,number>={};
for(const id of ['A','B','C'] as const){const s=performance.now();geometries.set(id,makeE2Geometry(id));builds[id]=performance.now()-s;}
const geoR04=rockR04Geometry({seed:37,detail:'refined'}),refMaterial=rockR04Material();
const mat=makeStudyMaterial('clay'),silhouetteMat=makeStudyMaterial('silhouette'),wireMat=makeStudyMaterial('wire'),nordicMat=makeStudyMaterial('nordic');
const basePositions={A:-7.8,B:-2.6,C:2.6,R04:7.8};
const rocks=new Map<string,THREE.Mesh>();
for(const id of ['A','B','C','R04'] as const){
 const mesh=new THREE.Mesh(id==='R04'?geoR04:geometries.get(id)!,mat);
 mesh.name=id==='R04'?'R04-unchanged-benchmark':STUDIES[id].name+'-ART-STUDY-NOT-APPROVED';
 mesh.castShadow=true;mesh.receiveShadow=true;mesh.position.set(basePositions[id],0,0);rocks.set(id,mesh);scene.add(mesh);
}
const scaleGroup=new THREE.Group(),scalePole=new THREE.Mesh(new THREE.CylinderGeometry(.027,.027,1.8),new THREE.MeshBasicMaterial({color:'#39474d'}));
scalePole.position.y=.9-.21;scaleGroup.add(scalePole);
const scaleHead=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),scalePole.material);
scaleHead.position.y=1.8-.21;scaleGroup.add(scaleHead);scene.add(scaleGroup);
const birchFamily=createBirchFamily(),pineFamily=createPineFamily(),grassFamily=createGrassFamily();
const birch=birchFamily.createMesh(0,'near'),pine=pineFamily.createMesh(0,'near');
birch.position.set(-9,-.21,-2.8);pine.position.set(9,-.21,-3.1);
scene.add(birch,pine);
const grasses=[[-7,-1],[-3,1],[2,-1],[6,.8]].map(([x,z],i)=>{
 const g=grassFamily.createMesh((i%4) as 0|1|2|3);g.position.set(x,-.21,z);g.scale.setScalar(.85);scene.add(g);return g;
});
const context=[birch,pine,...grasses];
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
controls.minDistance=2;controls.maxDistance=40;
let cfg:Config={choice:'overview',view:'threequarter',mode:'clay',light:'neutral',shadows:true,orbit:28,zoom:100};
let frame=0,problem:string|null=null;
const input=(id:string)=>document.getElementById(id) as HTMLInputElement|HTMLSelectElement;
function cameraPose(){
 const multiple=cfg.choice==='overview'||cfg.choice==='nature';
 const center=multiple?0:basePositions[cfg.choice];
 const targetY=multiple?1.28:cfg.choice==='C'?1.78:1.24;
 const dist=(multiple?23:8.1)*(100/cfg.zoom);
 const a=cfg.orbit*Math.PI/180;
 const poses:Record<View,[number,number,number]>={
  front:[0,dist*.18,dist],rear:[0,dist*.18,-dist],
  left:[-dist,dist*.18,0],right:[dist,dist*.18,0],
  threequarter:[Math.sin(a)*dist,dist*.33,Math.cos(a)*dist],
  top:[.01,dist,.01],human:[.06,1.69,dist]
 };
 const p=poses[cfg.view];camera.position.set(center+p[0],cfg.view==='human'?1.69:targetY+p[1],p[2]);
 controls.target.set(center,cfg.view==='human'?1.12:targetY,0);
 controls.update();camera.lookAt(controls.target);camera.updateMatrixWorld();
}
function apply(){
 cfg={choice:input('choice').value as Choice,view:input('view').value as View,
 mode:input('mode').value as Mode,light:input('light').value as Light,
 shadows:(input('shadows') as HTMLInputElement).checked,
 orbit:Number(input('orbit').value),zoom:Number(input('zoom').value)};
 const multiple=cfg.choice==='overview'||cfg.choice==='nature';
 for(const [id,mesh] of rocks){mesh.visible=multiple||id===cfg.choice;
  mesh.position.x=multiple?basePositions[id as keyof typeof basePositions]:0;
  mesh.material=cfg.mode==='silhouette'?silhouetteMat:cfg.mode==='wire'?wireMat:cfg.mode==='nordic'?nordicMat:mat;
 }
 const ctx=cfg.choice==='nature';for(const o of context)o.visible=ctx;
 scaleGroup.visible=cfg.mode!=='silhouette';
 scaleGroup.position.x=multiple?10.55:2.8;
 renderer.shadowMap.enabled=cfg.shadows&&cfg.mode!=='silhouette';key.castShadow=renderer.shadowMap.enabled;
 hemi.intensity=cfg.light==='neutral'?2.05:1.7;key.intensity=cfg.light==='neutral'?2.6:3.05;
 backlight.intensity=cfg.light==='neutral'?.45:.58;
 scene.background=new THREE.Color(cfg.mode==='silhouette'?'#ffffff':cfg.light==='neutral'?'#dedfe0':'#c9dce4');
 floor.visible=cfg.mode!=='silhouette';
 floorMat.color.set(cfg.light==='neutral'?'#c0c3c5':'#8b9a89');
 note.textContent=multiple?'A / B / C / unchanged R04 — all source-scale':'Candidate '+cfg.choice+' · ART STUDY / NOT APPROVED';
 cameraPose();
}
function inspect(){
 const gl=renderer.getContext();
 const ids=['A','B','C','R04'];
 const geometry=ids.map(id=>{const g=rocks.get(id)!.geometry;g.computeBoundingBox();g.computeBoundingSphere();
  const dim=g.boundingBox!.getSize(new THREE.Vector3());
  return {id,triangles:(g.index?.count??g.getAttribute('position').count)/3,
   vertices:g.getAttribute('position').count,dimensions:dim.toArray().map(v=>+v.toFixed(3)),
   radius:g.boundingSphere!.radius,components:id==='R04'?2:1,generationMs:builds[id]??null,
   productionApproved:false};});
 return {config:cfg,frame,error:problem,geometry,
  actualGPU:false,renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},
  webgl:{version:String(gl.getParameter(gl.VERSION)),renderer:String(gl.getParameter(gl.RENDERER)),error:gl.getError()}};
}
for(const id of ['choice','view','mode','light','shadows','orbit','zoom']){
 input(id).addEventListener(id==='orbit'||id==='zoom'?'input':'change',()=>{try{apply();problem=null}catch(e){problem=String(e);console.error(e)}});
}
function draw(){controls.update();renderer.render(scene,camera);}
function animate(){try{draw();frame++;if(frame%40===0)input('stats').textContent=JSON.stringify(inspect(),null,2)}
 catch(e){problem=String(e);console.error(e)}requestAnimationFrame(animate);}
apply();animate();
Object.assign(window,{__e2Lab:{renderer,scene,camera,rocks,frame:()=>frame,
 get error(){return problem},
 configure(o:Partial<Config>){for(const [id,v]of Object.entries(o)){const el=input(id);
  if(typeof v==='boolean')(el as HTMLInputElement).checked=v;else el.value=String(v)}
  apply();draw();return inspect();},
 inspect,capture(){draw();return renderer.domElement.toDataURL('image/png')},
 dispose(){birchFamily.dispose();pineFamily.dispose();grassFamily.dispose();geoR04.dispose();refMaterial.dispose();
  for(const g of geometries.values())g.dispose();
  for(const m of [mat,silhouetteMat,wireMat,nordicMat])m.dispose();renderer.dispose();}}});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
addEventListener('pagehide',()=>{(window as unknown as {__e2Lab:{dispose:()=>void}}).__e2Lab.dispose()});
