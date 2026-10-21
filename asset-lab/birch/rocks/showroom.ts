
/** ASSET-01E1 isolated real Three.js rock calibration showroom.
 * This is evidence for review, not a production-world integration. */
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {createRockFamily,PRODUCTION_ROCK_SEEDS,type RockSeed} from '../src/rocks/index.ts';
import {createBirchFamily} from '../src/index.ts';
import {createPineFamily} from '../src/pine/index.ts';
import {createGrassFamily} from '../src/grass/index.ts';
import {rockR04Geometry,rockR04Material} from '../src/rocks/experimental/r04HeroBoulder.ts';
type View='threequarter'|'front'|'rear'|'left'|'right'|'top'|'human';
type Choice='comparison'|'production-all'|'source-11'|'source-23'|'source-37'|'source-53'|'experimental-rock-r04'|'nature-context';
type Light='neutral'|'nordic';
type Config={choice:Choice;view:View;light:Light;wireframe:boolean;shadows:boolean;orbit:number;zoom:number};
const style=document.createElement('style');
style.textContent=`*{box-sizing:border-box}body{margin:0;font:13px system-ui;color:#eaf1f5;background:#6b7985;overflow:hidden}
canvas{display:block;width:100vw;height:100vh}aside{position:absolute;top:12px;left:12px;z-index:2;max-width:282px;background:#16232ce8;padding:16px;border-radius:9px;box-shadow:0 6px 24px #17252c66}
strong{display:block;letter-spacing:.08em;font-size:15px}small{color:#bdcbd2;display:block;margin:4px 0 13px}
label{display:block;margin:9px 0}select,input{margin-top:4px;width:100%;font:inherit;padding:5px}
input[type=checkbox]{width:auto;margin-right:6px}pre{white-space:pre-wrap;font-size:11px;line-height:1.5;color:#d7e5ee}
#legend{position:absolute;right:16px;bottom:12px;padding:10px;background:#14232ddc;border-radius:6px}`;
document.head.appendChild(style);
const panel=document.createElement('aside');
panel.innerHTML=`<strong>AURORA REST · ASSET-01E1</strong><small>Source-production rocks vs R04 · UNAPPROVED</small>
<label>Family <select id="choice">
<option value="comparison">Source ↔ R04 comparison</option>
<option value="production-all">Production · four source seeds</option><option value="nature-context">R04 with approved birch, pine and grass</option>
<option value="source-11">Source seed 11</option><option value="source-23">Source seed 23</option>
<option value="source-37">Source seed 37</option><option value="source-53">Source seed 53</option>
<option value="experimental-rock-r04">R04 · experimental only</option>
</select></label>
<label>Camera <select id="view">
<option value="threequarter">Three-quarter</option><option value="front">Front</option><option value="rear">Rear</option>
<option value="left">Left side</option><option value="right">Right side</option><option value="top">Elevated / top</option><option value="human">Human eye height</option>
</select></label>
<label>Lighting <select id="light"><option value="nordic">Nordic outdoor</option><option value="neutral">Neutral diagnostic</option></select></label>
<label><input id="wireframe" type="checkbox">Show facet wireframe</label>
<label><input id="shadows" type="checkbox" checked>Cast real shadows</label>
<label>Orbit <input id="orbit" type="range" min="-180" max="180" value="27"></label>
<label>Zoom <input id="zoom" type="range" min="50" max="180" value="100"></label><pre id="stats"></pre>`;
document.body.appendChild(panel);
const legend=document.createElement('div');legend.id='legend';legend.textContent='Left · original Feh Lu We production | Right · experimental ROCK-R01 R04';document.body.appendChild(legend);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,150);
scene.background=new THREE.Color('#c4d0d6');
const ambient=new THREE.HemisphereLight('#dfefff','#384b4c',2.0);scene.add(ambient);
const sun=new THREE.DirectionalLight('#ffeac6',2.5);
sun.position.set(-5,12,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;
sun.shadow.bias=-.0003;scene.add(sun);
const fill=new THREE.DirectionalLight('#a6c6e1',.55);fill.position.set(7,5,-5);scene.add(fill);
const floorMat=new THREE.MeshStandardMaterial({color:'#7b947f',roughness:1});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),floorMat);
floor.rotation.x=-Math.PI/2;floor.position.y=-.49;floor.receiveShadow=true;scene.add(floor);
const family=createRockFamily();
const originalMeshes=PRODUCTION_ROCK_SEEDS.map((seed,i)=>{
 const m=family.createMesh(seed);m.position.set(-4.8+i*1.8,0,0);scene.add(m);return m;
});
const started=performance.now(),heroGeometry=rockR04Geometry({seed:37,detail:'refined'});
const r04GenerationMs=performance.now()-started;
const heroMaterial=rockR04Material(),hero=new THREE.Mesh(heroGeometry,heroMaterial);
hero.name='experimental-rock-r04-UNAPPROVED';hero.position.set(4.15,-.25,0);
hero.castShadow=hero.receiveShadow=true;scene.add(hero);
const heightMarker=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1.8),new THREE.MeshBasicMaterial({color:'#1f333e'}));
pole.position.y=.9-.49;heightMarker.add(pole);
const head=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),new THREE.MeshBasicMaterial({color:'#1f333e'}));
head.position.y=1.9-.49;heightMarker.add(head);heightMarker.position.x=6.6;scene.add(heightMarker);
// Existing approved Aurora assets, used ONLY for art-direction and scale calibration.
const birchFamily=createBirchFamily(),pineFamily=createPineFamily(),grassFamily=createGrassFamily();
const birch=birchFamily.createMesh(0,'near');birch.position.set(-4.2,-.49,-.75);birch.scale.setScalar(.84);scene.add(birch);
const pine=pineFamily.createMesh(0,'near');pine.position.set(5.0,-.49,-.6);pine.scale.setScalar(.84);scene.add(pine);
const grasses=[[-2.5,-.25],[1.6,.5],[2.7,-1.2],[-.3,1.4]].map(([x,z],i)=>{
 const m=grassFamily.createMesh((i%4) as 0|1|2|3);m.position.set(x,-.49,z);m.scale.setScalar(i%2?.8:1.1);scene.add(m);return m;
});
const contextObjects:THREE.Object3D[]=[birch,pine,...grasses];contextObjects.forEach(m=>m.visible=false);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.minDistance=1.4;controls.maxDistance=32;
let cfg:Config={choice:'comparison',view:'threequarter',light:'nordic',wireframe:false,shadows:true,orbit:27,zoom:100};
let frames=0,lastError:string|null=null;
const byId=(id:string)=>document.getElementById(id) as HTMLInputElement|HTMLSelectElement;
function selectedSource():number {return cfg.choice.startsWith('source-')?Number(cfg.choice.slice(7)):-1}
function updateCamera(){
 const sel=selectedSource();
 const context=cfg.choice==='nature-context';
 const isHero=cfg.choice==='experimental-rock-r04';
 const x=context?0:isHero?4.15:sel>0?-4.8+PRODUCTION_ROCK_SEEDS.indexOf(sel as RockSeed)*1.8:
 cfg.choice==='production-all'?-2.1:0;
 const focusY=context?2.15:isHero?0.8:.4;
 const distant=(context?19:cfg.choice==='comparison'?13:cfg.choice==='production-all'?8:isHero?6:3.8)*(100/cfg.zoom);
 const angle=cfg.orbit*Math.PI/180;
 const preset:Record<View,[number,number,number]>={
  threequarter:[Math.sin(angle)*distant,distant*.45,Math.cos(angle)*distant],
  front:[0,distant*.27,distant],rear:[0,distant*.27,-distant],
  left:[-distant,distant*.24,0],right:[distant,distant*.24,0],
  top:[.02,distant,.02],human:[0,1.68,distant]
 };
 const p=preset[cfg.view];camera.position.set(x+p[0],cfg.view==='human'?1.68:p[1]+focusY,p[2]);
 controls.target.set(x,cfg.view==='human'?1.1:focusY,0);controls.update();camera.lookAt(controls.target);camera.updateMatrixWorld();
}
function apply(){
 cfg={choice:byId('choice').value as Choice,view:byId('view').value as View,
 light:byId('light').value as Light,wireframe:(byId('wireframe') as HTMLInputElement).checked,
 shadows:(byId('shadows') as HTMLInputElement).checked,orbit:Number(byId('orbit').value),zoom:Number(byId('zoom').value)};
 const source=selectedSource();
 originalMeshes.forEach((m,i)=>{m.visible=cfg.choice==='comparison'||cfg.choice==='production-all'||PRODUCTION_ROCK_SEEDS[i]===source;});
 const context=cfg.choice==='nature-context';
 hero.visible=cfg.choice==='comparison'||cfg.choice==='experimental-rock-r04'||context;
 hero.position.x=context?0:4.15;
 heightMarker.position.x=context?2.55:6.6;
 heightMarker.visible=hero.visible;
 contextObjects.forEach(m=>m.visible=context);
 for(const m of [family.material,heroMaterial])m.wireframe=cfg.wireframe;
 renderer.shadowMap.enabled=cfg.shadows;sun.castShadow=cfg.shadows;
 sun.intensity=cfg.light==='neutral'?2.0:2.5;ambient.intensity=cfg.light==='neutral'?2.2:2.0;
 fill.intensity=cfg.light==='neutral'?.8:.55;
 scene.background=new THREE.Color(cfg.light==='neutral'?'#d6d9dd':'#bed4de');
 floorMat.color.set(cfg.light==='neutral'?'#9099a0':'#7b947f');
 renderer.toneMappingExposure=cfg.light==='neutral'?1.07:1.15;
 legend.style.display=cfg.choice==='comparison'?'block':'none';updateCamera();
}
for(const k of ['choice','view','light','wireframe','shadows','orbit','zoom']){
 byId(k).addEventListener(k==='orbit'||k==='zoom'?'input':'change',()=>{
 try{apply();lastError=null}catch(e){lastError=String(e);console.error(e)}
 });
}
function draw(){renderer.render(scene,camera);}
function metrics(){
 return {config:cfg,frame:frames,error:lastError,
  source:originalMeshes.map((m,i)=>{const g=m.geometry,p=g.getAttribute('position');g.computeBoundingBox();
   return {seed:PRODUCTION_ROCK_SEEDS[i],triangles:(g.index?.count??p.count)/3,vertices:p.count,
    dimensions:g.boundingBox!.getSize(new THREE.Vector3()).toArray()};}),
  experimental:{triangles:heroGeometry.getAttribute('position').count/3,vertices:heroGeometry.getAttribute('position').count,
   parts:heroGeometry.userData.rockR04?.pieces,firstBuildMs:r04GenerationMs},
  renderer:{drawcalls:renderer.info.render.calls,triangles:renderer.info.render.triangles},
  context:{version:String(renderer.getContext().getParameter(renderer.getContext().VERSION)),
   renderer:String(renderer.getContext().getParameter(renderer.getContext().RENDERER))}};
}
function animate(){try{controls.update();draw();frames++;
 if(frames%45===0)byId('stats').textContent=JSON.stringify(metrics(),null,2)}
 catch(e){lastError=String(e);console.error(e)}requestAnimationFrame(animate);}
apply();animate();
Object.assign(window,{__rockLab:{renderer,scene,camera,family,hero,frame:()=>frames,
 get error(){return lastError},
 configure(o:Partial<Config>){for(const [k,v] of Object.entries(o)){const el=byId(k);if(!el)throw Error('Unknown control '+k);
  if(typeof v==='boolean')(el as HTMLInputElement).checked=v;else el.value=String(v)}
  apply();draw();return metrics();},
 inspect:metrics,capture(){draw();return renderer.domElement.toDataURL('image/png')}}});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
addEventListener('pagehide',()=>{family.dispose();birchFamily.dispose();pineFamily.dispose();grassFamily.dispose();heroGeometry.dispose();heroMaterial.dispose();floor.geometry.dispose();floorMat.dispose();renderer.dispose()});
