import * as T from 'three';
import {sampleClimate,windAt,type WeatherMode,type WeatherState,CYCLE_SECONDS} from './weather.ts';
import '../style.css';

// R01 is a small source-isolated weather and response lab, NOT a replacement for R02D.
document.querySelector<HTMLDivElement>('#app')!.innerHTML=`
<main class="feel-app">
  <canvas id="world" aria-label="Three.js Nordic wind and weather study"></canvas>
  <header class="feel-title"><small>ART / ENGINEERING LAB · ENV-FEEL-R01</small><h1>Aurora Rest</h1><p>THE LIVING WOODLAND</p></header>
  <section class="feel-panel">
    <label>Atmosphere <select id="weatherMode"><option value="cycle">Natural sequence</option>
      <option value="still">Still morning</option><option value="breeze">Passing breeze</option>
      <option value="squall">Rain squall</option><option value="clearing">After the rain</option></select></label>
    <label>Timeline <input id="timeline" type="range" min="0" max="${CYCLE_SECONDS}" step=".5" value="0"></label>
    <div class="feel-actions"><button id="play">Pause</button><button id="sound">Enable ambience</button>
      <button id="quality">Mobile profile: OFF</button></div>
    <div class="feel-readout" id="readout">Preparing woodland...</div>
  </section>
  <footer class="feel-footer">First-person study · drag to look · WASD to move · weather is a prototype, tree assets are review proxies</footer>
  <div id="failure" role="alert"></div>
</main>
<style>
html,body,#app,.feel-app{margin:0;width:100%;height:100%;overflow:hidden;background:#111e1b;font-family:system-ui,Arial,sans-serif}
.feel-app{position:relative;color:#f4f2df}
#world{display:block;width:100%;height:100%;touch-action:none}
.feel-title{position:absolute;top:24px;left:30px;pointer-events:none;text-shadow:0 2px 12px #132724}
.feel-title small{font-size:10px;letter-spacing:.19em;color:#e5dbc2}
.feel-title h1{font-family:Georgia,serif;font-size:clamp(25px,4vw,43px);font-weight:500;margin:4px 0}
.feel-title p{margin:0;font-size:11px;letter-spacing:.21em;color:#e0dbbe}
.feel-panel{position:absolute;right:18px;top:18px;width:min(296px,calc(100vw - 36px));background:rgba(15,31,28,.85);padding:16px;box-sizing:border-box;backdrop-filter:blur(15px);border:1px solid #6683776c;border-radius:12px;box-shadow:0 12px 30px #0005}
.feel-panel label{display:block;font-size:11px;letter-spacing:.075em;color:#d4d5c9;margin-bottom:12px}
.feel-panel select,.feel-panel input{display:block;width:100%;margin-top:7px}
.feel-panel select{background:#20362e;color:#f4f2df;border:1px solid #657e6d;padding:7px;border-radius:5px}
.feel-panel input{accent-color:#9dbf95}
.feel-actions{display:flex;gap:5px;flex-wrap:wrap}
.feel-actions button{background:#334f40;color:#fff9e9;border:1px solid #6b9475;border-radius:5px;padding:6px 8px;font-size:10px;cursor:pointer}
.feel-readout{font-family:monospace;white-space:pre-line;font-size:11px;line-height:1.6;margin-top:12px;color:#c9e3d3}
.feel-footer{position:absolute;bottom:17px;left:26px;right:26px;max-width:650px;pointer-events:none;font-size:11px;text-shadow:1px 1px 8px #000}
#failure{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#ffd9d5}
@media(max-width:640px){.feel-title{top:12px;left:14px}.feel-title h1{font-size:26px}.feel-panel{top:auto;bottom:44px;right:10px;width:min(265px,calc(100vw - 20px));padding:11px}.feel-footer{bottom:8px;left:12px;right:12px;font-size:9px}.feel-title p{display:none}}
</style>`;
const el=<E extends HTMLElement>(id:string)=>document.getElementById(id) as E;
const canvas=el<HTMLCanvasElement>('world');
let renderer:T.WebGLRenderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});}
catch(e){el<HTMLElement>('failure').textContent='WebGL unavailable: '+String(e);throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.18;
const scene=new T.Scene();
const drySky=new T.Color('#b1c9c0'),stormSky=new T.Color('#657b7c');
scene.background=drySky.clone();
scene.fog=new T.FogExp2(drySky.clone(),.012);
const sun=new T.DirectionalLight(0xffe6ad,2.0);
sun.position.set(-24,42,-35);
const hemi=new T.HemisphereLight(0xdbf2e6,0x34472f,1.55);
scene.add(sun,hemi);
const camera=new T.PerspectiveCamera(63,innerWidth/innerHeight,.12,180);
camera.position.set(0,1.75,14);
camera.rotation.order='YXZ';
let yaw=0,pitch=-.04,drag=false,lastX=0,lastY=0;
const keys=new Set<string>();
let mode:WeatherMode='cycle',time=0,paused=false,mobile=false,alive=true,lastFrame=performance.now();
let current=sampleClimate(0),frameTimes:number[]=[];
const groundHeight=(x:number,z:number)=>.23*Math.sin(x*.14+z*.07)+.13*Math.cos(z*.18-x*.065);
const groundGeom=new T.PlaneGeometry(130,130,64,64);
groundGeom.rotateX(-Math.PI/2);
const groundPos=groundGeom.getAttribute('position') as T.BufferAttribute;
for(let i=0;i<groundPos.count;i++)groundPos.setY(i,groundHeight(groundPos.getX(i),groundPos.getZ(i)));
groundGeom.computeVertexNormals();
const groundMat=new T.MeshStandardMaterial({color:'#45614b',roughness:1});
scene.add(new T.Mesh(groundGeom,groundMat));
const pathPositions:number[]=[],pathIndices:number[]=[];
for(let k=0;k<=100;k++){
 const z=25-k*.75,x=Math.sin(z*.11)*1.6;
 for(const side of [-1,1])pathPositions.push(x+side*(.9+.15*Math.sin(z*.13)),groundHeight(x,z)+.018,z);
 if(k<100){const i=k*2;pathIndices.push(i,i+1,i+2,i+1,i+3,i+2);}
}
const pathGeom=new T.BufferGeometry();
pathGeom.setAttribute('position',new T.Float32BufferAttribute(pathPositions,3));
pathGeom.setIndex(pathIndices);pathGeom.computeVertexNormals();
scene.add(new T.Mesh(pathGeom,new T.MeshStandardMaterial({color:'#756b51',roughness:1,transparent:true,opacity:.75,side:T.DoubleSide})));
const rng=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const random=rng(73129);
type Crown={x:number;y:number;z:number;sx:number;sy:number;sz:number;phase:number};
const makeInst=(geo:T.BufferGeometry,mat:T.Material,count:number)=>{
 const o=new T.InstancedMesh(geo,mat,count);o.frustumCulled=false;scene.add(o);return o;
};
const birchTrunks=makeInst(new T.CylinderGeometry(.12,.19,1,8),new T.MeshStandardMaterial({color:'#d2d2bf',roughness:1}),30);
const pineTrunks=makeInst(new T.CylinderGeometry(.15,.27,1,8),new T.MeshStandardMaterial({color:'#76543b',roughness:1}),28);
const birchCrowns=makeInst(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:'#8caa70',roughness:1,flatShading:true}),90);
const pineCrowns=makeInst(new T.ConeGeometry(1,1,9),new T.MeshStandardMaterial({color:'#3c6552',roughness:1,flatShading:true}),84);
const rockMesh=makeInst(new T.DodecahedronGeometry(1,0),new T.MeshStandardMaterial({color:'#7b8274',roughness:1,flatShading:true}),75);
const birchC:Crown[]=[],pineC:Crown[]=[];
const matrix=new T.Matrix4(),p3=new T.Vector3(),q=new T.Quaternion(),s3=new T.Vector3();
const place=(mesh:T.InstancedMesh,i:number,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{
 matrix.compose(p3.set(x,y,z),q,s3.set(sx,sy,sz));mesh.setMatrixAt(i,matrix);
};
function populateTree(trunk:T.InstancedMesh,crown:Crown[],n:number,pine:boolean){
 for(let i=0;i<n;i++){
  const z=9-(i/n)*66+(random()-.5)*9;
  const side=i%2===0?-1:1;
  const x=side*(5+random()*20)+Math.sin(z*.11)*1.6;
  const h=(pine?8:7)*(0.74+random()*.65),w=(pine?2.7:2.6)*(.75+random()*.48);
  const y=groundHeight(x,z);
  place(trunk,i,x,y+h*.5,z,1,h,1);
  for(let j=0;j<3;j++){
    crown.push({x,y:y+(pine?(h*.36+j*h*.19):(h*.60+j*h*.11)),z,
      sx:w*(pine?1.12-j*.23:1.1-j*.12),sy:pine?h*(.32-j*.038):h*(.21-j*.018),
      sz:w*(pine?1.12-j*.23:1.04-j*.10),phase:random()*Math.PI*2});
  }
 }
 trunk.instanceMatrix.needsUpdate=true;
}
populateTree(birchTrunks,birchC,30,false);
populateTree(pineTrunks,pineC,28,true);
for(let i=0;i<75;i++){
 const z=random()*65-50,x=(random()-.5)*57;if(Math.abs(x-Math.sin(z*.11)*1.6)<1.7)continue;
 const y=groundHeight(x,z),scale=.15+random()*.55;
 place(rockMesh,i,x,y+scale*.3,z,scale*1.5,scale*.72,scale);
}
rockMesh.instanceMatrix.needsUpdate=true;

// Shared GPU grass wind: blade bases remain fixed while tips respond to world-space gusts.
const blade=new T.BufferGeometry();
blade.setAttribute('position',new T.Float32BufferAttribute([-.09,0,0,.09,0,0,0,.75,0],3));
blade.setIndex([0,1,2]);blade.computeVertexNormals();
const grassTime={value:0},grassStrength={value:0},grassDir={value:new T.Vector2(1,0)};
const grassMat=new T.MeshLambertMaterial({color:'#9bac75',side:T.DoubleSide,vertexColors:false});
grassMat.onBeforeCompile=shader=>{
 shader.uniforms.envTime=grassTime;shader.uniforms.envStrength=grassStrength;shader.uniforms.envDir=grassDir;
 shader.vertexShader=shader.vertexShader.replace('#include <common>',
  '#include <common>\nuniform float envTime;uniform float envStrength;uniform vec2 envDir;');
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
  `#include <begin_vertex>
  vec2 envRoot=vec2(0.0);
  #ifdef USE_INSTANCING
   envRoot=instanceMatrix[3].xz;
  #endif
  float envAlong=dot(envRoot,envDir)*0.145;
  float envWave=0.65+0.25*sin(envTime*1.35-envAlong)+0.1*sin(envTime*2.72-envAlong*.45);
  transformed.xz += envDir*pow(max(position.y,0.0),1.6)*envStrength*envWave;`);
};
grassMat.customProgramCacheKey=()=> 'env-feel-r01-grass-wind-v1';
const grass=makeInst(blade,grassMat,1500);
for(let i=0;i<1500;i++){
 const x=(random()-.5)*76,z=18-random()*87;
 const y=groundHeight(x,z),h=.6+random()*1.1;
 place(grass,i,x,y,z,h*.8,h,h*.8);
}
grass.instanceMatrix.needsUpdate=true;

// Local rain volume: one streamed line batch, not hundreds of draw calls.
const rainCount=550, rainData=new Float32Array(rainCount*6);
const rainGeo=new T.BufferGeometry();
rainGeo.setAttribute('position',new T.BufferAttribute(rainData,3).setUsage(T.DynamicDrawUsage));
const rainMat=new T.LineBasicMaterial({color:0xc5dcdd,transparent:true,opacity:0,depthWrite:false});
const rainfall=new T.LineSegments(rainGeo,rainMat);rainfall.frustumCulled=false;scene.add(rainfall);
function updateRain(state:WeatherState){
 rainfall.visible=state.rain>.015;
 rainMat.opacity=state.rain*.51;
 const n=mobile?180:rainCount;
 rainGeo.setDrawRange(0,n*2);
 for(let i=0;i<n;i++){
   const hash=i*12.9898+41.57;
   const fx=(Math.sin(hash*1.73)*43758.5453)%1;
   const fz=(Math.cos(hash*2.31)*23421.5353)%1;
   const x=camera.position.x+fx*17;
   const z=camera.position.z+fz*17;
   const yf=((i*.6180339887-time*(.78+state.rain*.4))%1+1)%1;
   const y=camera.position.y-3+yf*13;
   const k=i*6;
   rainData[k]=x;rainData[k+1]=y;rainData[k+2]=z;
   rainData[k+3]=x-state.windX*(.12+.28*state.windSpeed);
   rainData[k+4]=y-.40-state.rain*.26;
   rainData[k+5]=z-state.windZ*(.12+.28*state.windSpeed);
 }
 (rainGeo.getAttribute('position') as T.BufferAttribute).needsUpdate=true;
}
function updateCrowns(mesh:T.InstancedMesh,crowns:Crown[],state:WeatherState){
 for(let i=0;i<crowns.length;i++){
  const c=crowns[i],b=windAt(c.x,c.z,time,state)*(.28+.15*Math.sin(time*.47+c.phase));
  place(mesh,i,c.x+state.windX*b,c.y,c.z+state.windZ*b,c.sx,c.sy,c.sz);
 }
 mesh.instanceMatrix.needsUpdate=true;
}
function applyState(state:WeatherState){
 const sky=drySky.clone().lerp(stormSky,state.overcast*.84);
 scene.background=sky;scene.fog!.color.copy(sky);
 (scene.fog as T.FogExp2).density=.008+state.fog*.025;
 sun.intensity=2.0*state.sun+.11;
 hemi.intensity=1.55*state.ambient;
 groundMat.color.set('#4b684d').lerp(new T.Color('#354e43'),state.wetness*.76);
 groundMat.roughness=1-state.wetness*.29;
 grassTime.value=time;grassStrength.value=state.windSpeed*.37;
 grassDir.value.set(state.windX,state.windZ);
 updateCrowns(birchCrowns,birchC,state);
 updateCrowns(pineCrowns,pineC,state);
 updateRain(state);
}
class AtmosphereAudio {
 ctx:AudioContext|null=null; nodes:{wind:GainNode;rain:GainNode}|null=null;
 async start(){
  if(this.ctx){await this.ctx.resume();return;}
  const ctx=new AudioContext(),length=ctx.sampleRate*2,buffer=ctx.createBuffer(1,length,ctx.sampleRate);
  const a=buffer.getChannelData(0),r=rng(11493);
  for(let i=0;i<length;i++)a[i]=r()*2-1;
  const make=(freq:number)=>{const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
   src.buffer=buffer;src.loop=true;filter.type='lowpass';filter.frequency.value=freq;
   gain.gain.value=0;src.connect(filter).connect(gain).connect(ctx.destination);src.start();return gain;};
  this.ctx=ctx;this.nodes={wind:make(360),rain:make(2500)};
 }
 update(s:WeatherState){if(!this.ctx||!this.nodes)return;
  const t=this.ctx.currentTime;this.nodes.wind.gain.setTargetAtTime(s.windSpeed*.12+.01,t,.15);
  this.nodes.rain.gain.setTargetAtTime(s.rain*.16,t,.15);
 }
 async stop(){if(this.ctx){await this.ctx.close();this.ctx=null;this.nodes=null;}}
}
const audio=new AtmosphereAudio();
const onPointerDown=(e:PointerEvent)=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);};
const onPointerUp=()=>{drag=false;};
const onPointerMove=(e:PointerEvent)=>{
 if(drag){yaw-=(e.clientX-lastX)*.0035;pitch=Math.max(-1.18,Math.min(1.18,pitch-(e.clientY-lastY)*.0035));}
 lastX=e.clientX;lastY=e.clientY;
};
const onKeyDown=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.matches('input,button,select'))return;keys.add(e.key.toLowerCase());};
const onKeyUp=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase());
const onBlur=()=>keys.clear();
const onResize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1:1.5));renderer.setSize(innerWidth,innerHeight);};
canvas.addEventListener('pointerdown',onPointerDown);
canvas.addEventListener('pointerup',onPointerUp);
canvas.addEventListener('pointermove',onPointerMove);
addEventListener('keydown',onKeyDown);addEventListener('keyup',onKeyUp);
addEventListener('blur',onBlur);addEventListener('resize',onResize);
el<HTMLSelectElement>('weatherMode').addEventListener('change',e=>{mode=(e.target as HTMLSelectElement).value as WeatherMode;});
el<HTMLInputElement>('timeline').addEventListener('input',e=>{time=Number((e.target as HTMLInputElement).value);paused=true;el<HTMLButtonElement>('play').textContent='Play';});
el<HTMLButtonElement>('play').onclick=()=>{paused=!paused;el<HTMLButtonElement>('play').textContent=paused?'Play':'Pause';};
el<HTMLButtonElement>('sound').onclick=async()=>{if(!audio.ctx){await audio.start();el<HTMLButtonElement>('sound').textContent='Mute ambience';}else{await audio.stop();el<HTMLButtonElement>('sound').textContent='Enable ambience';}};
el<HTMLButtonElement>('quality').onclick=()=>{mobile=!mobile;el<HTMLButtonElement>('quality').textContent='Mobile profile: '+(mobile?'ON':'OFF');onResize();};
function move(dt:number){
 const speed=keys.has('shift')?5:2.35,dx=(Number(keys.has('d'))-Number(keys.has('a')))*speed*dt,dz=(Number(keys.has('s'))-Number(keys.has('w')))*speed*dt;
 camera.position.x+=dx*Math.cos(yaw)-dz*Math.sin(yaw);
 camera.position.z+=dz*Math.cos(yaw)+dx*Math.sin(yaw);
 camera.position.x=Math.max(-32,Math.min(32,camera.position.x));
 camera.position.z=Math.max(-43,Math.min(22,camera.position.z));
 camera.position.y=groundHeight(camera.position.x,camera.position.z)+1.75;
 camera.rotation.set(pitch,yaw,0);
}
function snapshot(){
 return {ready:alive,mode,time,paused,mobile,weather:{...current},
  render:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
   geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures},
  timing:{frameIntervalMeanMs:frameTimes.length?frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length:0,samples:frameTimes.length},
  camera:camera.position.toArray(),prototypeOnly:true};
}
function frame(now:number){
 if(!alive)return;
 const dt=Math.min(.05,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
 frameTimes.push(dt*1000);if(frameTimes.length>120)frameTimes.shift();
 if(!paused)time+=dt;
 current=sampleClimate(time,mode);move(dt);applyState(current);audio.update(current);
 renderer.render(scene,camera);
 if(Math.floor(now/250)!==Math.floor((now-dt*1000)/250)){
  const s=snapshot();
  el<HTMLElement>('readout').textContent=`Wind ${(s.weather.windSpeed*100).toFixed(0)}%  ·  rain ${(s.weather.rain*100).toFixed(0)}%\nWet ground ${(s.weather.wetness*100).toFixed(0)}%  ·  fog ${(s.weather.fog*100).toFixed(0)}%\n${s.render.calls} calls · ${s.render.triangles.toLocaleString()} triangles · ${s.timing.frameIntervalMeanMs.toFixed(1)} ms/frame*`;
  if(mode==='cycle')el<HTMLInputElement>('timeline').value=String(time%CYCLE_SECONDS);
 }
 requestAnimationFrame(frame);
}
function dispose(){
 alive=false;canvas.removeEventListener('pointerdown',onPointerDown);canvas.removeEventListener('pointerup',onPointerUp);canvas.removeEventListener('pointermove',onPointerMove);
 removeEventListener('keydown',onKeyDown);removeEventListener('keyup',onKeyUp);removeEventListener('blur',onBlur);removeEventListener('resize',onResize);
 void audio.stop();
 scene.traverse(obj=>{if(obj instanceof T.Mesh||obj instanceof T.Points||obj instanceof T.LineSegments){
  obj.geometry.dispose();
  const mats=Array.isArray(obj.material)?obj.material:[obj.material];for(const mat of mats)mat.dispose();
 }});
 renderer.dispose();
}
Object.assign(window,{__ENV_FEEL_R01__:{setMode:(m:WeatherMode)=>{mode=m;el<HTMLSelectElement>('weatherMode').value=m;},
 seek:(t:number)=>{time=t;paused=true;},snapshot,dispose,
 setMobile:(v:boolean)=>{mobile=v;onResize();}}});
requestAnimationFrame(frame);
