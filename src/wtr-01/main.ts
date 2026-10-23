import * as THREE from 'three';
import {HeightGrid,Terrain,waterAt,type Data} from '../geo-r02b/terrain.ts';
import {sunDirection} from '../geo-r02b/review-options.ts';
import {classifyCanonicalWaterMesh,type Quality} from './config.ts';
import {createCanonicalWaterGeometry,createOceanGeometry,createWaterShader} from './material.ts';
import './style.css';

type Mode=Quality|'baseline';
type Focus='all'|'ocean'|'lakes';
type Daylight='A'|'B';
interface ReviewCamera {id:string;label:string;sourceXZ:[number,number];camera:THREE.Vector3;target:THREE.Vector3;level:number;}
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`<canvas id="world" aria-label="Three.js canonical island water review"></canvas>
<section id="ui"><h1>AURORA REST <span>WTR-01</span></h1><div class="sub">Ocean · lakes · High Tarn | isolated lookdev</div>
<label>Review viewpoint <select id="view" aria-label="Review viewpoint"></select></label>
<label>Material <select id="quality"><option value="baseline">GEO-R02B baseline</option><option value="low">WTR-01 Low</option><option value="medium" selected>WTR-01 Medium</option><option value="high">WTR-01 High</option></select></label>
<label>Water focus <select id="focus"><option value="all">All water</option><option value="ocean">Ocean only</option><option value="lakes">Lakes/tarns only</option></select></label>
<label>Daylight <select id="sun"><option value="B">Sun B · south-east</option><option value="A">Sun A · west-north-west</option></select></label>
<label>Time sequence <select id="time"><option value="live">Live animation</option><option value="0">Fixed 0.00 s</option><option value="1.5">Fixed 1.50 s</option><option value="3">Fixed 3.00 s</option></select></label>
<div class="buttons"><button id="pause">Pause</button><label><input id="wire" type="checkbox"> Wireframe</label></div>
<div id="status" aria-live="polite">Loading canonical GEO-R02B-R1 geometry…</div>
<p class="note">Normals only; no shoreline foam, screen-space reflection or bathymetry. Drag the view to inspect. Fixed times support matched captures.</p>
<div id="error" role="alert"></div></section><div id="loading">Loading R1 canonical terrain + water…</div>`;

const canvas=document.querySelector<HTMLCanvasElement>('#world')!;
const error=document.querySelector<HTMLDivElement>('#error')!;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,logarithmicDepthBuffer:true,powerPreference:'high-performance'});
const shaderErrors:string[]=[];
renderer.debug.checkShaderErrors=true;
renderer.debug.onShaderError=(gl,program,vertexShader,fragmentShader)=>{
  const details=[
    'WTR-01 GLSL compilation/link error',
    gl.getProgramInfoLog(program),
    'VERTEX: '+gl.getShaderInfoLog(vertexShader),
    'FRAGMENT: '+gl.getShaderInfoLog(fragmentShader)
  ].filter(Boolean).join('\\n');
  shaderErrors.push(details);
  console.error(details);
};
renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
const scene=new THREE.Scene();
scene.scale.x=-1; // Same canonical geographic mirroring used by GEO-R02B viewer.
scene.background=new THREE.Color(0xc6d2d6);
scene.fog=new THREE.FogExp2(0xc6d2d6,0.000025);
scene.add(new THREE.HemisphereLight(0xe3ebee,0x7c8175,1.25));
const sun=new THREE.DirectionalLight(0xfff2d8,2);
scene.add(sun);
const camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,.2,24000);
function resize(){
  renderer.setSize(window.innerWidth,window.innerHeight);
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);resize();
function setSun(p:Daylight){
  const v=sunDirection(p);
  sun.position.set(-v[0]*7000,v[1]*7000,v[2]*7000);
  if(currentShader)currentShader.uniforms.uSunDirection.value.copy(sun.position).normalize();
}
let currentShader:THREE.ShaderMaterial|null=null;
let mode:Mode='medium',focus:Focus='all',daylight:Daylight='B',running=true,clockSec=0;
setSun('B');

async function getBinary(file:string){
  const res=await fetch('/geo-r02b/'+file);
  if(!res.ok)throw new Error(file+': HTTP '+res.status);
  const b=await res.arrayBuffer();
  if(b.byteLength%4!==0)throw new Error(file+': invalid Float32 byte length');
  return new Float32Array(b);
}
async function getFeatures():Promise<Data>{
  const r=await fetch('/geo-r02b/features.json');
  if(!r.ok)throw new Error('Missing canonical features.json: '+r.status);
  return r.json() as Promise<Data>;
}
function dryAt(x:number,z:number,grid:HeightGrid,data:Data){
  if(Math.abs(x)>2970||Math.abs(z)>3970)return false;
  const ground=grid.surface(x,z),water=waterAt(data,x,z);
  return Number.isFinite(ground)&&ground>Math.max(0,water)+.6;
}
/** Camera sampling reads immutable R1 geometry; it never carves new terrain. */
function nearbyDry(x:number,z:number,grid:HeightGrid,data:Data):[number,number]{
  if(dryAt(x,z,grid,data))return [x,z];
  for(const radius of [12,25,45,70,110,160,240]){
    for(let i=0;i<48;i++){
      const a=i*Math.PI/24,xx=x+Math.cos(a)*radius,zz=z+Math.sin(a)*radius;
      if(dryAt(xx,zz,grid,data))return [xx,zz];
    }
  }
  throw new Error('No dry R1 location near '+x+','+z);
}
function lakeShore(grid:HeightGrid,data:Data):{position:[number,number];center:[number,number];level:number}{
  const lake=data.lakes.find(l=>/high[\s_-]*tarn/i.test(l.id+' '+l.name));
  if(!lake)throw new Error('High Tarn not found in canonical R1 features.json');
  const ring=lake.boundary,center:[number,number]=[
    ring.reduce((a,p)=>a+p[0],0)/ring.length,
    ring.reduce((a,p)=>a+p[1],0)/ring.length
  ];
  let best:[number,number]|null=null,score=Infinity;
  for(let i=0;i<ring.length;i+=Math.max(1,Math.floor(ring.length/80))){
    const point=ring[i];
    const dx=point[0]-center[0],dz=point[1]-center[1],length=Math.hypot(dx,dz)||1;
    for(const distance of [12,25,45,70,100]){
      const x=point[0]+dx/length*distance,z=point[1]+dz/length*distance;
      if(!dryAt(x,z,grid,data))continue;
      const rise=grid.surface(x,z)-lake.level;
      const s=Math.abs(rise-6)*2+distance*.06;
      if(s<score){score=s;best=[x,z];}
    }
  }
  if(!best)best=nearbyDry(ring[0][0],ring[0][1],grid,data);
  return {position:best,center,level:lake.level};
}
function createCameras(grid:HeightGrid,data:Data):ReviewCamera[]{
  const cove=nearbyDry(1670,-1900,grid,data);
  const wind=nearbyDry(-1608.245,1658.948,grid,data); // R1 documented Windward gully mouth reference.
  const tarn=lakeShore(grid,data);
  function cameraSpec(id:string,label:string,at:[number,number],look:[number,number,number],rise:number):ReviewCamera{
    const y=grid.surface(at[0],at[1])+rise;
    return {id,label,sourceXZ:at,camera:new THREE.Vector3(-at[0],y,at[1]),target:new THREE.Vector3(-look[0],look[1],look[2]),level:y};
  }
  return [
    cameraSpec('home-shore','Home Cove · shore level',cove,[cove[0]+20,0,cove[1]-190],1.75),
    cameraSpec('home-elevated','Home Cove · elevated',cove,[cove[0]+30,0,cove[1]-120],170),
    cameraSpec('wind-shore','Windward Coast · shore level',wind,[wind[0]-240,0,wind[1]+35],1.75),
    cameraSpec('wind-elevated','Windward Coast · elevated',wind,[wind[0]-200,0,wind[1]+35],210),
    cameraSpec('tarn-shore','High Tarn · near water',tarn.position,[tarn.center[0],tarn.level,tarn.center[1]],1.75),
    cameraSpec('tarn-panorama','High Tarn · panorama',tarn.position,[tarn.center[0],tarn.level,tarn.center[1]],155)
  ];
}
try {
  const [data,terrainValues,waterPositions,waterSurface] = await Promise.all([
    getFeatures(),getBinary('terrain.f32'),getBinary('water-mesh.f32'),getBinary('water-surface.f32')
  ]);
  const {width,height,cellM}=data.meta.grid;
  if(cellM!==4||terrainValues.length!==width*height||waterSurface.length!==width*height)
    throw new Error('Unexpected R1 terrain/water raster format');
  if(!data.waterMesh)throw new Error('Canonical R1 clipped water mesh is required, not a procedural replacement');
  if(data.waterMesh.file!=='water-mesh.f32'||data.waterMesh.surfaceFile!=='water-surface.f32')
    throw new Error('Unexpected canonical R1 water source paths');
  const grid=new HeightGrid(terrainValues,width,height,cellM);
  data.waterSurface=new HeightGrid(waterSurface,width,height,cellM);
  const terrain=new Terrain(grid,scene);
  const classified=classifyCanonicalWaterMesh(waterPositions,data.lakes);
  const oceanGeo=createOceanGeometry();
  const canonicalGeo=createCanonicalWaterGeometry(waterPositions,classified.kinds);
  const baselineOcean=new THREE.MeshLambertMaterial({color:0x3c6471,side:THREE.DoubleSide});
  const baselineInland=new THREE.MeshLambertMaterial({color:0x467c8c,side:THREE.DoubleSide});
  const ocean:THREE.Mesh<THREE.BufferGeometry,THREE.Material>=new THREE.Mesh(oceanGeo,baselineOcean);
  ocean.position.y=0;scene.add(ocean);
  const inland:THREE.Mesh<THREE.BufferGeometry,THREE.Material>=new THREE.Mesh(canonicalGeo,baselineInland);
  scene.add(inland);
  const views=createCameras(grid,data);
  const viewControl=document.querySelector<HTMLSelectElement>('#view')!;
  for(const v of views){const option=document.createElement('option');option.value=v.id;option.textContent=v.label;viewControl.append(option);}
  let view=views[0];
  function setView(id:string){
    const spec=views.find(c=>c.id===id);if(!spec)throw new Error('Unknown WTR camera '+id);
    view=spec;viewControl.value=id;
    camera.position.copy(spec.camera);camera.up.set(0,1,0);camera.lookAt(spec.target);
  }
  function setMode(q:Mode){
    if(currentShader){currentShader.dispose();currentShader=null;}
    mode=q;
    if(q==='baseline'){
      ocean.material=baselineOcean;inland.material=baselineInland;
    }else{
      currentShader=createWaterShader(q,sun.position);
      ocean.material=currentShader;inland.material=currentShader;
    }
    setFocus(focus);
    setWireframe(document.querySelector<HTMLInputElement>('#wire')!.checked);
  }
  function setFocus(next:Focus){
    focus=next;
    ocean.visible=next!=='lakes';
    inland.visible=next!=='ocean';
    if(currentShader)currentShader.uniforms.uShowLakesOnly.value=next==='lakes'?1:0;
  }
  function setWireframe(enabled:boolean){
    for(const m of [baselineOcean,baselineInland,currentShader]){
      if(m)m.wireframe=enabled;
    }
    terrain.material.wireframe=enabled;
  }
  viewControl.onchange=()=>setView(viewControl.value);
  document.querySelector<HTMLSelectElement>('#quality')!.onchange=e=>setMode((e.target as HTMLSelectElement).value as Mode);
  document.querySelector<HTMLSelectElement>('#focus')!.onchange=e=>setFocus((e.target as HTMLSelectElement).value as Focus);
  document.querySelector<HTMLSelectElement>('#sun')!.onchange=e=>{daylight=(e.target as HTMLSelectElement).value as Daylight;setSun(daylight);};
  document.querySelector<HTMLInputElement>('#wire')!.onchange=e=>setWireframe((e.target as HTMLInputElement).checked);
  const pauseButton=document.querySelector<HTMLButtonElement>('#pause')!;
  pauseButton.onclick=()=>{running=!running;pauseButton.textContent=running?'Pause':'Play';};
  const stepControl=document.querySelector<HTMLSelectElement>('#time')!;
  stepControl.onchange=()=>{if(stepControl.value!=='live'){clockSec=Number(stepControl.value);running=false;pauseButton.textContent='Play';}};
  canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{
    if(!(e.buttons&1))return;
    camera.rotation.order='YXZ';
    camera.rotation.y-=e.movementX*.003;
    camera.rotation.x=THREE.MathUtils.clamp(camera.rotation.x-e.movementY*.003,-1.48,1.48);
  });
  // Expose fixed, reproducible viewer state for Playwright capture, not a performance guarantee.
  function snapshot(){
    const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
    return {view:view.id,quality:mode,focus,daylight,timeSec:clockSec,
      camera:camera.position.toArray(),canonicalCameraXZ:view.sourceXZ,
      calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
      geometries:renderer.info.memory.geometries,
      programs:renderer.info.programs?.length??0,
      shaderErrors:[...shaderErrors],
      renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),
      canonicalTerrainSha:data.meta.terrainSha256,classified:classified.counts,
      classifiedTriangles:classified.triangles,waterVertexCount:waterPositions.length/3,
      highTarnLevel:data.lakes.find(l=>/high[\s_-]*tarn/i.test(l.id+' '+l.name))?.level};
  }
  // Offscreen pixel-difference test: compare matched canonical terrain with
  // and without water at a fixed viewpoint. No synthetic screenshot accepted.
  // This is a visibility proof, NOT an aesthetic assessment.
  function measureWaterPixels(){
    const width=256,height=144;
    const target=new THREE.WebGLRenderTarget(width,height,{depthBuffer:true,stencilBuffer:false});
    const before=new Uint8Array(width*height*4),after=new Uint8Array(width*height*4);
    const oldOcean=ocean.visible,oldInland=inland.visible;
    try{
      ocean.visible=false;inland.visible=false;
      renderer.setRenderTarget(target);renderer.render(scene,camera);
      renderer.readRenderTargetPixels(target,0,0,width,height,before);
      ocean.visible=oldOcean;inland.visible=oldInland;
      renderer.render(scene,camera);
      renderer.readRenderTargetPixels(target,0,0,width,height,after);
      let pixels=0,deltaSum=0;
      for(let k=0;k<before.length;k+=4){
        const delta=Math.abs(before[k]-after[k])+Math.abs(before[k+1]-after[k+1])+Math.abs(before[k+2]-after[k+2]);
        if(delta>24){pixels++;deltaSum+=delta;}
      }
      return {pixels,totalPixels:width*height,meanChangedDelta:pixels?deltaSum/pixels:0};
    }finally{
      ocean.visible=oldOcean;inland.visible=oldInland;
      renderer.setRenderTarget(null);target.dispose();
    }
  }
  setView(new URLSearchParams(location.search).get('view')??'home-shore');
  setMode('medium');
  document.querySelector('#loading')!.remove();
  const status=document.querySelector<HTMLDivElement>('#status')!;
  const samples:number[]=[];let previous=performance.now(),frame=0;
  function render(now:number){
    requestAnimationFrame(render);
    const ms=Math.max(1,now-previous);previous=now;
    if(running&&stepControl.value==='live')clockSec+=Math.min(ms/1000,.1);
    if(currentShader)currentShader.uniforms.uTime.value=clockSec;
    renderer.render(scene,camera);
    samples.push(ms);if(samples.length>120)samples.shift();
    if(frame++%20===0){
      const info=renderer.info.render;
      status.textContent=`${view.label} · ${mode.toUpperCase()} | t=${clockSec.toFixed(2)}s | ${(1000/(samples.reduce((a,b)=>a+b,0)/samples.length)).toFixed(0)} FPS (local diagnostic) | ${info.calls} calls | ${(info.triangles/1000).toFixed(0)}k tris | ${classified.triangles} R1 wet triangles`;
    }
  }
  Object.assign(window,{__auroraWTR01:{
    ready:true,views:views.map(v=>({id:v.id,label:v.label,xz:v.sourceXZ,level:v.level})),
    setView,setMode,setFocus,setSun,
    setTime(t:number){if(!Number.isFinite(t)||t<0)throw new Error('Invalid fixed time');clockSec=t;running=false;stepControl.value=['0','1.5','3'].includes(String(t))?String(t):'0';pauseButton.textContent='Play';},
    snapshot,measureWaterPixels
  }});
  requestAnimationFrame(render);
  window.addEventListener('beforeunload',()=>{
    currentShader?.dispose();baselineOcean.dispose();baselineInland.dispose();
    oceanGeo.dispose();canonicalGeo.dispose();
    for(const tile of terrain.tiles)tile.mesh.geometry.dispose();
    terrain.material.dispose();renderer.dispose();
  });
}catch(e){
  const message=e instanceof Error?e.stack??e.message:String(e);
  error.textContent=message;
  document.querySelector('#loading')!.textContent='WTR-01 load failed — inspect diagnostics';
  console.error('WTR-01 blocked',e);
}
