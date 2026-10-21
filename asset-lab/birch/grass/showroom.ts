import * as THREE from 'three';
import {createGrassFamily,type GrassFamily,type GrassPreset,type GrassVariant} from '../src/grass/index.ts';
const q=(id:string)=>document.getElementById(id) as HTMLSelectElement;
const panel=document.createElement('aside');
panel.innerHTML=`<strong>AURORA REST · GRASS R01</strong><small>Source-faithful Feh Lu We asset inspection</small>
<label>Variant <select id="variant"><option value="all">All four</option><option value="0">0 · Short tuft</option><option value="1">1 · Tall wispy</option><option value="2">2 · Seed heads</option><option value="3">3 · Arching sedge</option></select></label>
<label>Route <select id="preset"><option value="flw-production-reference">Production r05 + r09</option><option value="refined-ground-r05">Refined ground only</option><option value="basic-grass-model">Basic grassModel</option></select></label>
<label>View <select id="view"><option value="overview">Full overview</option><option value="threequarter">Three-quarter</option><option value="low">Low-angle side</option><option value="top">Top-down</option><option value="blade">Folded blades</option><option value="seed">Seed heads</option><option value="sedge">Broad sedge</option></select></label>
<label>Light <select id="light"><option value="nordic">Nordic daylight</option><option value="neutral">Neutral studio</option></select></label>
<label>Shadows <input id="shadows" type="checkbox" checked></label>
<label>Orbit <input id="orbit" type="range" min="-180" max="180" value="29"></label>
<label>Zoom <input id="zoom" type="range" min="40" max="180" value="100"></label>
<pre id="stats"></pre>`;
const style=document.createElement('style');style.textContent=`body{margin:0;background:#c7d2ce;color:#fff;font:13px system-ui}aside{position:absolute;z-index:5;left:12px;top:12px;background:#172522df;padding:15px;width:263px;border-radius:12px;box-shadow:0 6px 20px #2236}strong{display:block;margin:0 0 5px}small{display:block;color:#c4d2ca;margin-bottom:11px}label{display:flex;align-items:center;justify-content:space-between;gap:6px;margin:9px 0}select{max-width:145px;font-size:11px}input[type=range]{width:120px}pre{white-space:pre-wrap;font:11px monospace}`;document.head.append(style);document.body.append(panel);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(1100,720);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#cfdbd7');
const cam=new THREE.PerspectiveCamera(48,1100/720,.015,50);
const ambient=new THREE.HemisphereLight('#f1f9fd','#718372',2.05);scene.add(ambient);
const sun=new THREE.DirectionalLight('#fff3da',2.7);sun.position.set(-2.1,4.5,3.5);sun.target.position.set(0,.2,0);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-3.8;sun.shadow.camera.right=3.8;
sun.shadow.camera.top=3.8;sun.shadow.camera.bottom=-3.8;sun.shadow.camera.far=11;sun.shadow.normalBias=.004;scene.add(sun,sun.target);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(12,12),new THREE.MeshLambertMaterial({color:'#b8bbb1'}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.008;floor.receiveShadow=true;scene.add(floor);
const ruler=new THREE.Group();ruler.name='scale-ruler';
const lineMat=new THREE.MeshBasicMaterial({color:'#526b62'});
for(let i=0;i<=4;i++){
 const x=-2.33+i*.15;
 const mark=new THREE.Mesh(new THREE.BoxGeometry(.008,i%2===0?.045:.025,.01),lineMat);
 mark.position.set(x,.016,-.28);ruler.add(mark);
}
const baseLine=new THREE.Mesh(new THREE.BoxGeometry(.61,.005,.01),lineMat);baseLine.position.set(-2.03,.012,-.28);ruler.add(baseLine);
scene.add(ruler);
const spots=[-1.65,-.55,.55,1.65];
let family:GrassFamily=createGrassFamily(),meshes:THREE.Mesh[]=[];
let variant='all',view='overview',preset:GrassPreset='flw-production-reference',light='nordic',orbit=29,zoom=100,shadows=true;
let frame=0,error:string|null=null;
function models(){
 meshes.forEach(m=>m.removeFromParent());meshes=[];
 for(const [v,x] of spots.entries()){
  const m=family.createMesh(v as GrassVariant);
  m.position.set(x,0,0);meshes.push(m);scene.add(m);
 }
}
function camera(){
 let target=new THREE.Vector3(0,.29,0),distance=3.8,alt=.9;
 let selected=variant==='all'?-1:Number(variant);
 if(view==='blade'){selected=selected<0?0:selected;distance=1.05;alt=.24;target.set(spots[selected],.21,0);}
 else if(view==='seed'){selected=2;distance=1.18;alt=.18;target.set(spots[2],.67,0)}
 else if(view==='sedge'){selected=3;distance=1.16;alt=.23;target.set(spots[3],.24,0)}
 else if(view==='low'){distance=selected<0?3.25:1.45;alt=.16;target.set(selected<0?0:spots[selected],.27,0)}
 else if(view==='top'){distance=selected<0?3.1:1.45;alt=distance;target.set(selected<0?0:spots[selected],.15,0)}
 else if(selected>=0){distance=1.62;alt=.42;target.set(spots[selected],.28,0)}
 if(view==='overview'&&selected<0){distance=4.2;alt=1.35}
 distance*=100/zoom;
 const angle=orbit*Math.PI/180;
 cam.position.copy(target).add(new THREE.Vector3(Math.sin(angle)*distance,alt,Math.cos(angle)*distance));
 if(view==='top')cam.position.set(target.x,alt+target.y,.035);
 cam.lookAt(target);cam.updateMatrixWorld();
 meshes.forEach((m,i)=>{m.visible=selected<0||i===selected});
 ruler.visible=view==='overview'&&variant==='all';
}
function apply(){
 const next=q('preset').value as GrassPreset;
 if(preset!==next){meshes.forEach(m=>m.removeFromParent());family.dispose();family=createGrassFamily({preset:next});preset=next;models();}
 variant=q('variant').value;view=q('view').value;light=q('light').value;orbit=Number(q('orbit').value);zoom=Number(q('zoom').value);shadows=(document.getElementById('shadows') as HTMLInputElement).checked;
 sun.castShadow=shadows;renderer.shadowMap.enabled=shadows;
 ambient.intensity=light==='neutral'?2.35:2.05;
 sun.intensity=light==='neutral'?1.85:2.7;
 scene.background=new THREE.Color(light==='neutral'?'#dfdfd9':'#cfdbd7');
 camera();
}
for(const id of ['variant','preset','view','light','orbit','zoom','shadows']){
 const e=document.getElementById(id)!;e.addEventListener(id==='orbit'||id==='zoom'?'input':'change',()=>{try{apply();error=null}catch(err){error=String(err);console.error(err)}});
}
function render(){renderer.render(scene,cam);}
function animate(){
 try{render();frame++;if(frame%40===0)document.getElementById('stats')!.textContent=JSON.stringify({preset,variant,view,
  drawcalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,error},null,2)}
 catch(e){error=String(e);console.error(e)}
 requestAnimationFrame(animate);
}
models();apply();animate();
Object.assign(window,{__grassLab:{renderer,scene,camera:cam,family:()=>family,meshes:()=>meshes,frame:()=>frame,get error(){return error},
 configure(o:Record<string,string|number|boolean>){for(const [id,value] of Object.entries(o)){
  const e=document.getElementById(id) as HTMLInputElement|HTMLSelectElement;if(!e)throw Error('Unknown grass control '+id);
  if(typeof value==='boolean')(e as HTMLInputElement).checked=value;else e.value=String(value);
 }apply();return this.inspect()},
 inspect(){return {variant,view,preset,light,orbit,zoom,shadows,
  frame,mode:'REAL THREE.JS',drawcalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,error}},
 capture(){render();return renderer.domElement.toDataURL('image/png')}
}});
addEventListener('pagehide',()=>{meshes.forEach(m=>m.removeFromParent());family.dispose();renderer.dispose()});
