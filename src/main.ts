import * as THREE from 'three';
import {WORLD} from './world/config.ts';
import {heightAt,regionAt} from './world/geography.ts';
import {TerrainRenderer} from './render/terrain.ts';
import {addWater} from './render/water.ts';
import {addLandmarks} from './render/landmarks.ts';
import {addTrails} from './render/trails.ts';
import './style.css';

const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`<canvas id="world"></canvas><section id="ui"><div class="masthead"><strong>AURORA REST</strong> <small>WORLD-01 · macro-terrain prototype</small></div><div id="readout">Initializing…</div><div class="controls"><button id="mode">Fly / walk [F]</button><button id="map">Island overview [O]</button><select id="jump" aria-label="Teleport to landmark"></select><button id="help">Controls [?]</button></div><div id="instructions" hidden><strong>Navigation</strong><p>Click world to capture the mouse. WASD move, mouse look. Shift speeds up; F toggles fly mode (Q/E up/down). O toggles overhead survey, 1–9 teleport between viewpoints. Escape releases pointer lock.</p><p>Mobile: left half drag = walk; right half drag = look. Fly and overview buttons remain available.</p><button id="closeHelp">Close</button></div></section><div id="crosshair">·</div><div id="mobileTip">Drag left to move · right to look</div>`;
const canvas=document.querySelector<HTMLCanvasElement>('#world')!;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
renderer.setSize(innerWidth,innerHeight);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xabc5cc);scene.fog=new THREE.FogExp2(0xadc3c7,.000125);
scene.add(new THREE.HemisphereLight(0xd7e9ef,0x8d8269,2.15));
const sun=new THREE.DirectionalLight(0xffdeb3,2.55);sun.position.set(-1600,3500,1500);scene.add(sun);
const camera=new THREE.PerspectiveCamera(69,innerWidth/innerHeight,.2,16000);
const terrain=new TerrainRenderer(scene);addWater(scene);addTrails(scene);const props=addLandmarks(scene);
const v= WORLD.viewpoints[0];const savedPos=new THREE.Vector3();const player=new THREE.Vector3(v.x,heightAt(v.x,v.z)+1.75,v.z+24);
let yaw=Math.PI*.65,pitch=-.09,mode:'walk'|'fly'|'overview'='walk',last=performance.now(),fps=60;
const keys=new Set<string>(),look={dx:0,dy:0},touches=new Map<number,{startX:number;startY:number;x:number;y:number;side:'left'|'right'}>();
const readout=document.querySelector<HTMLDivElement>('#readout')!,modeBtn=document.querySelector<HTMLButtonElement>('#mode')!,mapBtn=document.querySelector<HTMLButtonElement>('#map')!,jump=document.querySelector<HTMLSelectElement>('#jump')!;
WORLD.viewpoints.forEach((p,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=`${i+1}. ${p.name}`;jump.append(o)});
function teleport(i:number){const p=WORLD.viewpoints[i];if(!p)return;player.set(p.x,heightAt(p.x,p.z)+1.75,p.z+18);terrain.update(player.x,player.z,true);jump.value=String(i);}
function setMode(next:typeof mode){mode=next;modeBtn.textContent=mode==='walk'?'Fly / walk [F]':'Walk mode [F]';mapBtn.textContent=mode==='overview'?'Resume walk [O]':'Island overview [O]';document.querySelector('#crosshair')!.classList.toggle('hidden',mode==='overview');}
function toggleFly(){setMode(mode==='walk'?'fly':'walk');if(mode==='walk')player.y=heightAt(player.x,player.z)+1.75;}
function toggleMap(){if(mode==='overview'){player.copy(savedPos);setMode('walk');}else{savedPos.copy(player);player.set(0,6800,0);setMode('overview');} (scene.fog as THREE.FogExp2).density=mode==='overview'?.000022:.000125;}
modeBtn.onclick=toggleFly;mapBtn.onclick=toggleMap;
jump.onchange=()=>teleport(Number(jump.value));
document.querySelector<HTMLButtonElement>('#help')!.onclick=()=>{(document.querySelector('#instructions') as HTMLElement).hidden=false;};
document.querySelector<HTMLButtonElement>('#closeHelp')!.onclick=()=>{(document.querySelector('#instructions') as HTMLElement).hidden=true;};
addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
 if(k==='f'&&!e.repeat)toggleFly();else if(k==='o'&&!e.repeat)toggleMap();else if(k==='?'&&!e.repeat)(document.querySelector('#instructions') as HTMLElement).hidden=false;else if(/^[1-9]$/.test(k)&&!e.repeat)teleport(Number(k)-1);
 keys.add(k);
});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
canvas.addEventListener('click',()=>{if(matchMedia('(pointer:fine)').matches&&mode!=='overview')canvas.requestPointerLock().catch(()=>{});});
addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas){look.dx+=e.movementX;look.dy+=e.movementY;}});
canvas.addEventListener('touchstart',e=>{e.preventDefault();for(const t of Array.from(e.changedTouches)){const side=t.clientX<innerWidth*.48?'left':'right';touches.set(t.identifier,{startX:t.clientX,startY:t.clientY,x:t.clientX,y:t.clientY,side});}},{passive:false});
canvas.addEventListener('touchmove',e=>{e.preventDefault();for(const t of Array.from(e.changedTouches)){const item=touches.get(t.identifier);if(!item)continue;if(item.side==='right'){look.dx+=(t.clientX-item.x)*1.8;look.dy+=(t.clientY-item.y)*1.8;}item.x=t.clientX;item.y=t.clientY;}},{passive:false});
for(const event of ['touchend','touchcancel'])canvas.addEventListener(event,e=>{for(const t of Array.from((e as TouchEvent).changedTouches))touches.delete(t.identifier);});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));});

const forward=new THREE.Vector3(),right=new THREE.Vector3(),move=new THREE.Vector3();let frames=0;
function animate(now:number){requestAnimationFrame(animate);const dt=Math.min(.065,(now-last)/1000||.016);last=now;
 const responsiveness=.00185;yaw-=look.dx*responsiveness;pitch=Math.max(-1.50,Math.min(1.50,pitch-look.dy*responsiveness));look.dx=look.dy=0;
 let mx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
 let mz=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));
 for(const t of touches.values())if(t.side==='left'){mx+=Math.max(-1,Math.min(1,(t.x-t.startX)/65));mz+=Math.max(-1,Math.min(1,(t.startY-t.y)/65));}
 forward.set(-Math.sin(yaw),0,-Math.cos(yaw));right.set(Math.cos(yaw),0,-Math.sin(yaw));move.copy(forward).multiplyScalar(mz).addScaledVector(right,mx).clampLength(0,1);
 const speed=mode==='walk'?(keys.has('shift')?10:5.0):mode==='fly'?(keys.has('shift')?140:65):(keys.has('shift')?900:420);
 player.addScaledVector(move,dt*speed);
 if(mode==='walk'){
  const ground=heightAt(player.x,player.z)+1.75;player.y+=(ground-player.y)*Math.min(1,dt*12);
 }else if(mode==='fly'){
  player.y+=(Number(keys.has('e')||keys.has(' '))-Number(keys.has('q')))*dt*speed;
  player.y=Math.max(heightAt(player.x,player.z)+1.75,player.y);
 }else{
  player.y+=(Number(keys.has('e'))-Number(keys.has('q')))*dt*speed;
  player.y=Math.max(player.y,heightAt(player.x,player.z)+250);
 }
 player.x=Math.max(-3800,Math.min(3800,player.x));player.z=Math.max(-4750,Math.min(4750,player.z));
 if(mode==='overview'){
  camera.position.set(player.x,Math.max(6800,player.y),player.z);camera.rotation.set(-Math.PI/2,0,0);
 }else{camera.position.copy(player);camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);}
 terrain.update(player.x,player.z);
 renderer.render(scene,camera);
 fps=fps*.95+.05/dt;frames++;
 if(frames%18===0){const r=renderer.info.render;
  readout.innerHTML=`<div><b>${regionAt(player.x,player.z)}</b> · ${mode}</div><div>Position ${player.x.toFixed(0)} E / ${player.z.toFixed(0)} N · ${heightAt(player.x,player.z).toFixed(0)} m elev.</div><div>${fps.toFixed(0)} FPS · ${r.calls} draw calls · ${(r.triangles/1000).toFixed(0)}k triangles</div><div>${terrain.nearCount} high-detail tiles / ${terrain.tiles.length} · ${props.trees} placeholder trees · ${props.rocks} boulders</div>`;
 }
}
terrain.update(player.x,player.z,true);requestAnimationFrame(animate);
