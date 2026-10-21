import * as THREE from 'three';
import {createPineFamily,type PineVariant,type PineLod} from '../src/pine/index.ts';
import {BIRCH_LODS,selectTreeLod} from '../src/lod.ts';
import '../showroom/style.css';
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`<aside class="panel"><h1>Aurora Rest · Scots Pine Lab</h1><p class="subtitle">ASSET-01C1 · Source-faithful tree family · No island integration</p>
<label>Variant<select id="variant"><option value="all">All three</option><option value="0">Pine 0</option><option value="1">Pine 1</option><option value="2">Pine 2</option></select></label>
<label>LOD<select id="lod"><option value="near">near</option><option value="mid">mid</option><option value="far">far</option><option value="xfar">xfar (far geometry)</option><option value="auto">auto (22/36/62 m)</option></select></label>
<label>Lighting<select id="light"><option value="day">Nordic daylight</option><option value="neutral">Neutral diagnostic</option></select></label>
<label>Shadows <input type="checkbox" id="shadows" checked></label>\n<label>Camera distance <input id="distance" type="range" min="5" max="75" step="0.5" value="29"></label>
<label>Orbit angle <input id="angle" type="range" min="-180" max="180" step="1" value="29"></label>
<div class="actions"><button data-view="front">Front</button><button data-view="side">Side</button><button data-view="threequarter">¾ view</button><button data-view="close">Bark close-up</button><button data-view="needles">Needle close-up</button></div>
<p class="hint">Drag over scene to orbit. Mouse wheel to zoom. SCOTS PINE ×3, nine unique meshes; xfar shares far.</p>
<pre id="readout" class="readout"></pre></aside>`;
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
app.prepend(renderer.domElement);
const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,300);
scene.background=new THREE.Color('#aabfc3');scene.fog=new THREE.Fog('#aabfc3',80,170);
const hemi=new THREE.HemisphereLight('#dcecf8','#867763',2.0);
const sun=new THREE.DirectionalLight('#ffe4bd',2.4);sun.position.set(-13,30,19);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-40;sun.shadow.camera.right=40;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;
sun.shadow.bias=-.00015;scene.add(hemi,sun,sun.target);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.MeshLambertMaterial({color:'#7e8b80'}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;ground.position.y=-.02;scene.add(ground);
const family=createPineFamily();
let variant:'all'|'0'|'1'|'2'='all',lod:PineLod|'auto'='near',distance=29,yaw=29*Math.PI/180,pitch=.19;
const roots=[-9,0,9].map((x,i)=>{
 const root=new THREE.Group();root.position.x=x;
 const meshes=BIRCH_LODS.map(l=>family.createMesh(i as PineVariant,l));
 meshes.forEach(m=>{m.visible=false;root.add(m)});
 scene.add(root);
 return {root,meshes,level:0};
});
const e=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const select=e<HTMLSelectElement>('variant'), lodsel=e<HTMLSelectElement>('lod'), light=e<HTMLSelectElement>('light');
e<HTMLInputElement>('shadows').onchange=()=>{renderer.shadowMap.enabled=e<HTMLInputElement>('shadows').checked; sun.castShadow=renderer.shadowMap.enabled;};
select.onchange=()=>{variant=select.value as typeof variant;distance=variant==='all'?29:17;e<HTMLInputElement>('distance').value=String(distance);};
lodsel.onchange=()=>lod=lodsel.value as typeof lod;
light.onchange=()=>{const neutral=light.value==='neutral';hemi.color.set(neutral?'#ffffff':'#dcecf8');hemi.groundColor.set(neutral?'#888888':'#867763');hemi.intensity=neutral?2:2.0;sun.color.set(neutral?'#ffffff':'#ffe4bd');sun.intensity=neutral?1.8:2.4;scene.background=new THREE.Color(neutral?'#b2b2b2':'#aabfc3');ground.material.color.set(neutral?'#969696':'#7e8b80');};
e<HTMLInputElement>('distance').oninput=ev=>distance=Number((ev.target as HTMLInputElement).value);
e<HTMLInputElement>('angle').oninput=ev=>yaw=Number((ev.target as HTMLInputElement).value)*Math.PI/180;
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.onclick=()=>{
 const mode=b.dataset.view;viewMode=mode??'threequarter'; yaw=mode==='front'?0:mode==='side'?Math.PI/2:Math.PI/4;pitch=mode==='close'?.08:mode==='needles'?.26:.19;
 distance=mode==='close'?5:mode==='needles'?7:variant==='all'?29:17;
 e<HTMLInputElement>('angle').value=String(Math.round(yaw*180/Math.PI));
 e<HTMLInputElement>('distance').value=String(distance);
});
let viewMode='threequarter';
let drag=false,lastX=0,lastY=0;
renderer.domElement.addEventListener('pointerdown',ev=>{drag=true;lastX=ev.clientX;lastY=ev.clientY;renderer.domElement.setPointerCapture(ev.pointerId)});
renderer.domElement.addEventListener('pointerup',()=>drag=false);
renderer.domElement.addEventListener('pointermove',ev=>{if(!drag)return;yaw-=(ev.clientX-lastX)*.008;pitch=Math.max(-.18,Math.min(.95,pitch+(ev.clientY-lastY)*.004));lastX=ev.clientX;lastY=ev.clientY});
renderer.domElement.addEventListener('wheel',ev=>{ev.preventDefault();distance=Math.max(4,Math.min(120,distance+ev.deltaY*.025));e<HTMLInputElement>('distance').value=String(Math.min(75,distance))},{passive:false});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
const target=new THREE.Vector3();
let frame=0;
function tick(){
 requestAnimationFrame(tick);
 const idx=variant==='all'?-1:Number(variant);
 target.set(idx<0?0:roots[idx].root.position.x,variant==='all'?5:0,0);
 if(viewMode==='needles')target.y=9;
 if(viewMode==='close')target.y=1.6;
 camera.position.set(target.x+Math.sin(yaw)*distance, target.y+Math.sin(pitch)*distance,Math.cos(yaw)*distance);
 camera.lookAt(target);
 let triangles=0;
 roots.forEach((item,i)=>{
  const visible=idx<0||idx===i;
  const d=camera.position.distanceTo(item.root.position);
  const chosen=lod==='auto'?BIRCH_LODS[selectTreeLod(d,item.level)]:lod;
  item.level=BIRCH_LODS.indexOf(chosen);
  item.meshes.forEach((m,j)=>m.visible=visible&&j===item.level);
  if(visible){const g=family.getGeometry(i as PineVariant,chosen);triangles+=(g.index?.count??g.attributes.position.count)/3;}
 });
 renderer.render(scene,camera);
 frame++;
 e<HTMLElement>('readout').textContent=`Camera: ${distance.toFixed(1)} m | LOD: ${lod}\nGeometry triangles: ${triangles}\nDraw calls: ${renderer.info.render.calls}\nRendered triangles: ${renderer.info.render.triangles}`;
}
tick();
// Diagnostic read for automated browser-based checks; not available on the production island.
Object.assign(window,{__auroraPineLab:{family,roots,renderer,scene,camera,get frame(){return frame},get variant(){return variant},get lod(){return lod}}});
addEventListener('pagehide',()=>{family.dispose();ground.geometry.dispose();(ground.material as THREE.Material).dispose();renderer.dispose()});
