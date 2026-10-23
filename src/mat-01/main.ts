/** MAT-01 review environment: the terrain-material system on the real GEO-R02B-R1 terrain.
 * Isolated entry point (mat-01.html); does not alter the GEO-R02B viewer, terrain data, water or routes. */
import * as THREE from 'three';
import {TerrainMaterialQuery} from '../terrain-material/query.ts';
import {MATERIALS} from '../terrain-material/materials.ts';
import {synthesizeMaterial,synthesizeNoiseTexture,type BakedNoiseTexture,type SynthesizedTexture} from '../terrain-material/textures.ts';
import type {MaterialClassification} from '../terrain-material/types.ts';
import {TerrainMaterialResources,createTerrainMaterial,PROFILES,type QualityProfile} from '../terrain-material/render/terrain-material.ts';
import {DEBUG_VIEWS,type DebugView} from '../terrain-material/render/shader.ts';
import {TerrainTiles,applyVertexColors,nodeHeight,type TileLayout} from '../terrain-material/render/terrain-tiles.ts';
import {CAMERAS,type Camera} from './cameras.ts';
import './style.css';

type Surface='material'|'vertex'|'plain';type NoiseMode='procedural'|'baked';type Lighting='neutral'|'nordic'|'grazing';type Layout='canonical'|'tile200'|'lod';
const app=document.querySelector('#app')!;
const opt=(v:string,l=v)=>`<option value="${v}">${l}</option>`;
app.innerHTML=`<canvas id="world"></canvas><section id="ui"><h1>AURORA REST</h1><small>MAT-01 · terrain material review · GEO-R02B-R1 terrain</small>
<label>View <select id="view">${CAMERAS.map(c=>opt(c.id,c.name)).join('')}</select></label>
<label>Surface <select id="surface">${opt('material','MAT-01 hybrid material')}${opt('vertex','Option A · vertex colour')}${opt('plain','Existing plain GEO-R02B')}</select></label>
<label>Material <select id="force">${opt('-1','Blended (classification)')}${MATERIALS.map((m,i)=>opt(String(i),m.code+' '+m.name+' only')).join('')}</select></label>
<label>Debug <select id="debug">${DEBUG_VIEWS.map(v=>opt(v)).join('')}</select></label>
<label>Lighting <select id="lighting">${opt('nordic','Nordic daylight')}${opt('neutral','Neutral')}${opt('grazing','Low grazing sun')}</select></label>
<label>Profile <select id="profile">${opt('high')}${opt('balanced')}${opt('mobile')}</select></label>
<label>Noise <select id="noise">${opt('procedural','Procedural fBm (MAT-01)')}${opt('baked','Baked noise texture (MAT-01P candidate)')}</select></label>
<label>Tiling <select id="layout">${opt('canonical','400 m tiles · 4 m (canonical)')}${opt('tile200','200 m tiles · 4 m')}${opt('lod','LOD 4/8/16 m by distance')}</select></label>
<div class="toggles"><label><input id="heightBlend" type="checkbox" checked> height blend</label><label><input id="normals" type="checkbox" checked> detail normals</label><label><input id="triplanar" type="checkbox" checked> triplanar rock</label><label><input id="wireframe" type="checkbox"> wireframe</label><label><input id="water" type="checkbox" checked> water</label></div>
<div id="status">Loading…</div><div class="note">Review prototype. Software-rendered measurements are not GPU performance. Art approval is a separate owner decision.</div><div id="error"></div></section><div id="loading">Classifying terrain and synthesising materials…</div>`;
const $=<T extends HTMLElement>(id:string)=>document.querySelector<T>('#'+id)!;
const errors:string[]=[];const fail=(e:unknown)=>{errors.push(String(e));$('error').textContent=String(e);};
addEventListener('error',e=>fail(e.message));addEventListener('unhandledrejection',e=>fail(e.reason));

// Renderer and scene match src/geo-r02b/main.ts (mirrored geographic frame, ACES, log depth) for matched comparisons.
const canvas=$<HTMLCanvasElement>('world'),renderer=new THREE.WebGLRenderer({canvas,antialias:true,logarithmicDepthBuffer:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(1.5,devicePixelRatio));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const shaderErrors:string[]=[];renderer.debug.onShaderError=(gl,program,vs,fs)=>{shaderErrors.push((gl.getProgramInfoLog(program)??'')+(gl.getShaderInfoLog(vs)??'')+(gl.getShaderInfoLog(fs)??''));};
const scene=new THREE.Scene();scene.scale.x=-1;
const hemisphere=new THREE.HemisphereLight(0xffffff,0x808080,1),sun=new THREE.DirectionalLight(0xffffff,2);scene.add(hemisphere,sun,sun.target);
const perspective=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.2,24000),ortho=new THREE.OrthographicCamera(-1,1,1,-1,20,24000);let camera:THREE.Camera=perspective;

const LIGHTING:Record<Lighting,{sky:number;ground:number;hemi:number;sun:number;sunI:number;az:number;el:number;bg:number;fog:number}>={
 neutral:{sky:0xf2f4f5,ground:0x8b8a83,hemi:1.15,sun:0xffffff,sunI:1.6,az:160,el:50,bg:0xc6d2d6,fog:.000025},
 nordic:{sky:0xd3e2ec,ground:0x6a6450,hemi:.9,sun:0xffe4c2,sunI:2.7,az:215,el:30,bg:0xbfd1db,fog:.00009},
 grazing:{sky:0xc9d6e2,ground:0x5a5446,hemi:.5,sun:0xffd6a0,sunI:3.1,az:290,el:8,bg:0xb7c4cc,fog:.00007},
};
function setLighting(id:Lighting){const L=LIGHTING[id];hemisphere.color.setHex(L.sky);hemisphere.groundColor.setHex(L.ground);hemisphere.intensity=L.hemi;sun.color.setHex(L.sun);sun.intensity=L.sunI;
 const az=L.az*Math.PI/180,el=L.el*Math.PI/180;sun.position.set(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)).multiplyScalar(7000);
 scene.background=new THREE.Color(L.bg);scene.fog=new THREE.FogExp2(L.bg,L.fog);state.lighting=id;$<HTMLSelectElement>('lighting').value=id;}

// Data (read-only canonical artifacts).
const t0=performance.now();
const [terrainBuf,waterBuf,meshBuf,features]=await Promise.all(['/geo-r02b/terrain.f32','/geo-r02b/water-surface.f32','/geo-r02b/water-mesh.f32'].map(u=>fetch(u).then(r=>{if(!r.ok)throw new Error('Missing '+u);return r.arrayBuffer();})).concat([fetch('/geo-r02b/features.json').then(r=>r.json())]) as [Promise<ArrayBuffer>,Promise<ArrayBuffer>,Promise<ArrayBuffer>,Promise<any>]);
const heights=new Float32Array(terrainBuf.slice(0));
const loadMs=Math.round(performance.now()-t0);
const worker=new Worker(new URL('./worker.ts',import.meta.url),{type:'module'});
const result:any=await new Promise((resolve,reject)=>{worker.onmessage=e=>e.data.ok?resolve(e.data):reject(new Error(e.data.error));worker.onerror=e=>reject(new Error(e.message));
 worker.postMessage({terrain:terrainBuf,water:waterBuf,features,textureSizes:[512]},[terrainBuf,waterBuf]);});
worker.terminate();
const classification:MaterialClassification=result.classification,query=new TerrainMaterialQuery(classification);
const textureCache:Record<number,SynthesizedTexture[]>={512:result.textures[512]};
const lattice=classification.lattice,heightSrc={lattice,heights};

// Water and ocean exactly as the GEO-R02B viewer draws them (context only; unchanged system).
const waterGroup=new THREE.Group();scene.add(waterGroup);
const ocean=new THREE.Mesh(new THREE.PlaneGeometry(40000,40000),new THREE.MeshLambertMaterial({color:0x3c6471,side:THREE.DoubleSide}));ocean.rotation.x=-Math.PI/2;waterGroup.add(ocean);
{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(meshBuf),3));g.computeVertexNormals();waterGroup.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0x467c8c,side:THREE.DoubleSide})));}

const state={surface:'material' as Surface,lighting:'nordic' as Lighting,profile:'high' as QualityProfile,layout:'canonical' as Layout,debug:'off' as DebugView,force:-1,heightBlend:true,normals:true,triplanar:true,wireframe:false,water:true,view:'m01-walk',noise:'procedural' as NoiseMode};
// MAT-01P: the baked noise texture is synthesised on first use only; procedural mode is MAT-01's unchanged path.
let bakedNoise:BakedNoiseTexture|null=null;
function buildResources(p:QualityProfile,noise:NoiseMode){
 const size=PROFILES[p].textureSize;textureCache[size]??=MATERIALS.map(d=>synthesizeMaterial(d,size));
 if(noise==='baked')bakedNoise??=synthesizeNoiseTexture();
 return new TerrainMaterialResources(classification,textureCache[size],p,noise==='baked'?bakedNoise:null).acquire();
}
let resources=buildResources('high','procedural');
let terrainMaterial=createTerrainMaterial(resources);
const plainMaterial=new THREE.MeshLambertMaterial({color:0xb4b6b0,side:THREE.DoubleSide});
const vertexMaterial=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
const layoutFor=(id:Layout,focus:{x:number;z:number}):TileLayout=>id==='tile200'?{spanM:200,stepFor:()=>4,skirtM:0}:id==='lod'?{spanM:400,skirtM:6,stepFor:(x,z)=>{const d=Math.hypot(x-focus.x,z-focus.z);return d<700?4:d<1800?8:16;}}:{spanM:400,stepFor:()=>4,skirtM:0};
const tiles=new TerrainTiles(heightSrc,terrainMaterial,layoutFor('canonical',{x:0,z:0}));scene.add(tiles.group);
let vertexColorsBuilt=false;

function currentMaterial(){return state.surface==='plain'?plainMaterial:state.surface==='vertex'?vertexMaterial:terrainMaterial;}
function applyState(){
 if(state.surface==='vertex'&&!vertexColorsBuilt){applyVertexColors(tiles,query,resources.means);vertexColorsBuilt=true;}
 const m=currentMaterial();tiles.setMaterial(m);for(const mm of [plainMaterial,vertexMaterial,terrainMaterial])mm.wireframe=state.wireframe;
 resources.setDebug(state.debug);resources.forceMaterial(state.force);
 resources.uniforms.uHeightBlend.value=state.heightBlend?1:0;resources.uniforms.uNormalScale.value=state.normals?1:0;
 resources.uniforms.uTriplanarOn.value=state.triplanar&&resources.settings.triplanar?1:0;
 waterGroup.visible=state.water;
}
function rebuild(p:QualityProfile,noise:NoiseMode){
 const old=resources,oldMat=terrainMaterial;resources=buildResources(p,noise);terrainMaterial=createTerrainMaterial(resources);
 oldMat.dispose();old.release();state.profile=p;state.noise=noise;$<HTMLSelectElement>('profile').value=p;$<HTMLSelectElement>('noise').value=noise;applyState();
}
async function setProfile(p:QualityProfile){rebuild(p,state.noise);}
function setNoise(n:NoiseMode){if(n!==state.noise)rebuild(state.profile,n);}
function setLayout(id:Layout,focus:{x:number;z:number}={x:eye.x,z:eye.z}){tiles.relayout(layoutFor(id,focus));state.layout=id;vertexColorsBuilt=false;$<HTMLSelectElement>('layout').value=id;applyState();}

// Cameras (same mirrored convention as src/geo-r02b/main.ts).
const ground=(x:number,z:number)=>nodeHeight(heightSrc,x,z);
let yaw=0,pitch=0;const eye=new THREE.Vector3();
function placePerspective(){perspective.position.set(-eye.x,eye.y,eye.z);perspective.up.set(0,1,0);perspective.lookAt(-eye.x-Math.sin(yaw)*Math.cos(pitch)*100,eye.y+Math.sin(pitch)*100,eye.z+Math.cos(yaw)*Math.cos(pitch)*100);}
function setView(id:string){const c=CAMERAS.find(c=>c.id===id) as Camera|undefined;if(!c)throw new Error('Unknown view '+id);state.view=id;$<HTMLSelectElement>('view').value=id;
 // Orthographic surveys sit 11 km above the island; distance fog would wash them out, so it applies to perspective views only.
 scene.fog=('ortho' in c)?null:new THREE.FogExp2(LIGHTING[state.lighting].bg,LIGHTING[state.lighting].fog);
 if('ortho' in c){camera=ortho;const a=innerWidth/innerHeight;Object.assign(ortho,{left:-c.halfHeight*a,right:c.halfHeight*a,top:c.halfHeight,bottom:-c.halfHeight});ortho.updateProjectionMatrix();ortho.position.set(-c.x,11000,c.z);ortho.up.set(0,0,1);ortho.lookAt(-c.x,0,c.z);}
 else{camera=perspective;perspective.fov=c.fov??60;perspective.updateProjectionMatrix();yaw=c.yaw;pitch=c.pitch;eye.set(c.x,ground(c.x,c.z)+c.eye,c.z);placePerspective();}
}
function resize(){renderer.setSize(innerWidth,innerHeight);perspective.aspect=innerWidth/innerHeight;perspective.updateProjectionMatrix();if(camera===ortho)setView(state.view);}
addEventListener('resize',resize);

// UI wiring.
const bindSelect=(id:string,fn:(v:string)=>void)=>{$<HTMLSelectElement>(id).onchange=e=>fn((e.target as HTMLSelectElement).value);};
bindSelect('view',setView);bindSelect('surface',v=>{state.surface=v as Surface;applyState();});bindSelect('force',v=>{state.force=Number(v);applyState();});
bindSelect('debug',v=>{state.debug=v as DebugView;applyState();});bindSelect('lighting',v=>setLighting(v as Lighting));bindSelect('profile',v=>void setProfile(v as QualityProfile));bindSelect('noise',v=>setNoise(v as NoiseMode));bindSelect('layout',v=>setLayout(v as Layout));
for(const k of ['heightBlend','normals','triplanar','wireframe','water'] as const)$<HTMLInputElement>(k).onchange=e=>{(state as any)[k]=(e.target as HTMLInputElement).checked;applyState();};
const keys=new Set<string>();let drag=false;
addEventListener('keydown',e=>{if((e.target as HTMLElement).matches('input,select'))return;keys.add(e.key.toLowerCase());});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
canvas.onpointerdown=e=>{drag=true;canvas.setPointerCapture(e.pointerId);};canvas.onpointerup=()=>{drag=false;};
canvas.onpointermove=e=>{if(!drag||camera!==perspective)return;yaw+=e.movementX*.003;pitch=Math.max(-1.5,Math.min(1.5,pitch-e.movementY*.003));placePerspective();};

// Metrics.
const frameTimes:number[]=[];let last=performance.now(),frames=0;const status=$('status');
function gpuName(){const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return String(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));}
function metrics(){const info=renderer.info,sorted=[...frameTimes].sort((a,b)=>a-b);
 return {renderer:gpuName(),calls:info.render.calls,triangles:info.render.triangles,programs:info.programs?.length??0,geometries:info.memory.geometries,textures:info.memory.textures,
  medianFrameMs:sorted.length?+sorted[Math.floor(sorted.length/2)].toFixed(1):null,terrainTriangles:tiles.triangleCount,tiles:tiles.tiles.length,
  materialMemoryBytes:resources.memoryBytes,profile:state.profile,noise:state.noise,classificationHash:result.hash,classificationTimingsMs:result.timingsMs,synthesisMs:result.synthesisMs,workerTotalMs:result.workerTotalMs,dataLoadMs:loadMs,shaderErrors:[...shaderErrors]};}
let paused=false;
function animate(now:number){requestAnimationFrame(animate);if(paused)return;const dt=Math.min(.07,(now-last)/1000);frameTimes.push(now-last);if(frameTimes.length>120)frameTimes.shift();last=now;
 if(camera===perspective&&keys.size){const sp=keys.has('shift')?120:12,f=Number(keys.has('w'))-Number(keys.has('s')),r=Number(keys.has('d'))-Number(keys.has('a'));
  eye.x+=(Math.sin(yaw)*f+Math.cos(yaw)*r)*sp*dt;eye.z+=(Math.cos(yaw)*f-Math.sin(yaw)*r)*sp*dt;eye.y+=(Number(keys.has('e'))-Number(keys.has('q')))*sp*dt;eye.y=Math.max(ground(eye.x,eye.z)+1.2,eye.y);placePerspective();}
 renderer.render(scene,camera);
 if(frames++%15===0){const m=metrics(),s=query.sample(eye.x,eye.z);status.innerHTML=`<b>${CAMERAS.find(c=>c.id===state.view)?.name}</b><br>${eye.x.toFixed(0)} E / ${eye.z.toFixed(0)} N · ${s.dominant} ${(s.dominantWeight*100).toFixed(0)}% · wet ${(s.wetness*100).toFixed(0)}%<br>${m.medianFrameMs} ms/frame (rAF) · ${m.calls} calls · ${(m.triangles/1e6).toFixed(2)} M tris · ${m.programs} programs<br>material GPU memory ≈ ${(m.materialMemoryBytes.total/1048576).toFixed(1)} MiB · ${state.profile}<br><span class="dim">${m.renderer}</span>`;}
}

// QA hook for automated capture and tests (development review page only).
const rt=new THREE.WebGLRenderTarget(512,512,{depthBuffer:true}),snaps=new Map<string,{w:number;h:number;px:Uint8Array}>();
function renderSync(){renderer.render(scene,camera);const px=new Uint8Array(4);const gl=renderer.getContext();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);}
const qa={
 ready:true,views:CAMERAS.map(c=>c.id),state,
 /** Experiment hook: set a terrain-material uniform (diagnostics only). */
 uniform(name:string,value:unknown){const u=resources.uniforms[name];if(!u)throw new Error('No uniform '+name);const v=u.value as {set?:(...a:number[])=>void};if(Array.isArray(value)&&v.set)v.set(...value);else u.value=value;},
 /** Stop the continuous render loop (automation renders explicitly via snap/benchmark). */
 pause(p=true){paused=p;},setView,applyState,setLighting,setProfile,setLayout,
 set(patch:Partial<typeof state>){if(patch.lighting)setLighting(patch.lighting);if(patch.noise)setNoise(patch.noise);Object.assign(state,patch);applyState();},setNoise,
 metrics,errors,sample:(x:number,z:number)=>query.sample(x,z),
 /** Synchronous render+readPixels timing. On a software renderer this measures CPU rasterisation, not GPU speed. */
 benchmark(n=5){renderSync();const t=performance.now();for(let i=0;i<n;i++)renderSync();return +((performance.now()-t)/n).toFixed(1);},
 compileMs(){const t=performance.now();renderer.compile(scene,camera);return +(performance.now()-t).toFixed(1);},
 /** GPU vs CPU: render raw weights top-down into a render target and compare with the CPU query at sample points. */
 parity(cx:number,cz:number,half:number,points:[number,number][]){
  const prev={debug:state.debug,force:state.force,water:state.water};state.debug='raw-weights';state.force=-1;state.water=false;applyState();
  const cam=new THREE.OrthographicCamera(-half,half,half,-half,20,24000);cam.position.set(-cx,11000,cz);cam.up.set(0,0,1);cam.lookAt(-cx,0,cz);
  renderer.setRenderTarget(rt);renderer.render(scene,cam);const out=[];
  for(const [x,z] of points){const v=new THREE.Vector3(-x,ground(x,z),z).project(cam),px=Math.floor((v.x*.5+.5)*512),py=Math.floor((v.y*.5+.5)*512),buf=new Uint8Array(4);
   renderer.readRenderTargetPixels(rt,px,py,1,1,buf);
   // Compare at the exact world position the GPU pixel centre shaded (top-down orthographic, mirrored x).
   const w=new THREE.Vector3((px+.5)/512*2-1,(py+.5)/512*2-1,0).unproject(cam),gx=-w.x,gz=w.z,cpu=query.weightsAt(gx,gz);
   out.push({x:gx,z:gz,gpu:[buf[0],buf[1],buf[2]].map(b=>b/255),cpu:[cpu[0],cpu[1],cpu[2]]});}
  renderer.setRenderTarget(null);Object.assign(state,prev);applyState();return out;},
 /** Store the current frame's pixels under a name (after a synchronous render). */
 snap(name:string){renderSync();const gl=renderer.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,px=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);snaps.set(name,{w,h,px});return {w,h};},
 /** Per-pixel RGB difference between two stored frames; returns statistics and an amplified diff image (×8). */
 diff(a:string,b:string){const A=snaps.get(a),B=snaps.get(b);if(!A||!B||A.w!==B.w||A.h!==B.h)throw new Error('diff needs two equal-size snaps');
  const c=document.createElement('canvas');c.width=A.w;c.height=A.h;const ctx=c.getContext('2d')!,img=ctx.createImageData(A.w,A.h);let max=0,sum=0,over4=0,over16=0;
  for(let y=0;y<A.h;y++)for(let x=0;x<A.w;x++){const i=((A.h-1-y)*A.w+x)*4,o=(y*A.w+x)*4;let d=0;for(let q=0;q<3;q++)d=Math.max(d,Math.abs(A.px[i+q]-B.px[i+q]));
   max=Math.max(max,d);sum+=d;if(d>4)over4++;if(d>16)over16++;const v=Math.min(255,d*8);img.data[o]=v;img.data[o+1]=v;img.data[o+2]=v;img.data[o+3]=255;}
  ctx.putImageData(img,0,0);return {pixels:A.w*A.h,maxDelta:max,meanDelta:+(sum/(A.w*A.h)).toFixed(4),over4,over16,image:c.toDataURL('image/png')};},
 /** Dispose every terrain-material GPU resource, verify the texture count drops, recreate, render again. */
 lifecycle(){state.surface='material';applyState();renderSync();const before=renderer.info.memory.textures;const p=state.profile,owned=resources.textures.length;
  terrainMaterial.dispose();resources.release();const disposed={resourcesDisposed:resources.disposed,owners:resources.ownerCount};
  tiles.setMaterial(plainMaterial);renderSync();const afterDispose=renderer.info.memory.textures;
  resources=buildResources(p,state.noise);terrainMaterial=createTerrainMaterial(resources);applyState();renderSync();
  return {owned,noise:state.noise,before,afterDispose,afterRecreate:renderer.info.memory.textures,...disposed,shaderErrors:[...shaderErrors]};},
};
Object.assign(window,{__auroraMAT01:qa});
setLighting('nordic');if(new URLSearchParams(location.search).get('noise')==='baked')setNoise('baked');applyState();setView(new URLSearchParams(location.search).get('view')??'m01-walk');
$('loading').remove();requestAnimationFrame(animate);
