/** MAT-ART-R01 isolated ground-material review viewer. Scene, lighting, ground mesh, POP stream and nature assets
 * are configured exactly as the ENV-NATURE-R02 review viewer with its "source" composition; only the ground
 * material variant, vegetation visibility and the debug mask differ between captures. */
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GroundIntegration} from '../env-p01/ground.ts';
import {HeightGrid,terrainGeometry} from '../geo-r02b/terrain.ts';
import {CanonicalEnvironment} from '../pop-01/geography.ts';
import type {Family} from '../pop-01/contracts.ts';
import {LivingRenderer} from '../pop-02a/renderer.ts';
import {WorkerPopulationStream,type WorkerPort} from '../pop-02a/worker-stream.ts';
import {MATERIALS} from '../terrain-material/materials.ts';
import type {QualityProfile} from '../terrain-material/render/terrain-material.ts';
import type {DebugView} from '../terrain-material/render/shader.ts';
import {matArtCameras,type MatArtCamera} from './cameras.ts';
import {GROUND_VARIANTS,GroundVariants,VARIANT_LABELS,type GroundVariant,type VariantSource} from './ground-variant.ts';
import {loadStylized as loadStylizedTextures} from './load-stylized.ts';
import '../pop-02a/style.css';

const FAMILIES:Family[]=['birch','pine','grass','rock'];
document.querySelector('#app')!.innerHTML=`<canvas></canvas><aside><h1>AURORA REST</h1><h2>MAT-ART-R01 · STYLIZED GROUND CALIBRATION</h2><label>Review camera<select id="camera"></select></label><label>Ground material<select id="variant">${GROUND_VARIANTS.map(v=>`<option value="${v}">${VARIANT_LABELS[v]}</option>`).join('')}</select></label><label>Material profile<select id="profile"><option>high</option><option>balanced</option><option>mobile</option></select></label><label><input id="vegetation" type="checkbox" checked> Existing trees, grass and rocks</label><label>Diagnostic<select id="debug"><option value="off">Off</option><option value="dominant">Dominant material mask</option><option value="weights">Classification weights</option><option value="albedo">Unlit albedo</option><option value="detail-normal">Detail normal</option></select></label><pre id="metrics">Loading canonical terrain, MAT classification and source assets…</pre><small>WASD walk · drag to look. Isolated review; no production default changed. Variant A is the faithful MAT-01 material.</small></aside><div class="badge"><b id="badge">A · ORIGINAL MAT-01</b><span>Ground-material review only. Geography, classification and placements are the protected originals.</span></div><div class="foot" id="location"></div>`;
const el=<E extends HTMLElement>(id:string)=>document.getElementById(id) as E,canvas=document.querySelector('canvas')!;
const renderer=new T.WebGLRenderer({canvas,antialias:true,logarithmicDepthBuffer:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
const scene=new T.Scene();scene.background=new T.Color(0xb9ccd2);scene.fog=new T.Fog(0xb9ccd2,230,650);
const hemisphere=new T.HemisphereLight(0xe2edf0,0x69755b,1.15),sun=new T.DirectionalLight(0xffecd0,2.1);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-95,right:95,top:95,bottom:-95,near:1,far:650});sun.shadow.bias=-.0002;sun.shadow.normalBias=.035;scene.add(hemisphere,sun,sun.target);
const camera=new T.PerspectiveCamera(57,innerWidth/innerHeight,.15,6000),controls=new OrbitControls(camera,canvas);controls.enableDamping=false;
const binary=async(p:string)=>{const r=await fetch(p);if(!r.ok)throw Error('Missing '+p);return new Float32Array(await r.arrayBuffer());};
const data=await(await fetch('/geo-r02b/features.json')).json(),[heights,water]=await Promise.all([binary('/geo-r02b/terrain.f32'),binary('/geo-r02b/water-mesh.f32')]);
const geo=new CanonicalEnvironment(data,new HeightGrid(heights,1501,2001),water),cameras=matArtCameras(geo),living=new LivingRenderer(scene,renderer);
const waterGeometry=new T.BufferGeometry();waterGeometry.setAttribute('position',new T.BufferAttribute(water,3));waterGeometry.computeVertexNormals();scene.add(new T.Mesh(waterGeometry,new T.MeshLambertMaterial({color:0x547e8c,side:T.DoubleSide})));
const sea=new T.Mesh(new T.PlaneGeometry(20000,20000),new T.MeshLambertMaterial({color:0x507d8d,side:T.DoubleSide}));sea.rotation.x=-Math.PI/2;scene.add(sea);
el<HTMLSelectElement>('camera').innerHTML=cameras.map(c=>`<option value="${c.id}">${c.label}</option>`).join('');
const groundIntegration=await GroundIntegration.load(heights,data);groundIntegration.setMode('material');
const variants=new GroundVariants(groundIntegration,MATERIALS);
let view:MatArtCamera=cameras[0],stream:WorkerPopulationStream,ground:T.Mesh|undefined,lastTarget='',yaw=0,pitch=0,walking=false,last=performance.now(),ready=false,lastRenderMs=0,dead=false,debug:DebugView='off',stylizedMs=0,stylizedReady=false;
const SEED=73129,DENSITY=1;
function startStream(){ready=false;stream?.dispose();stream=new WorkerPopulationStream(new Worker(new URL('../pop-02a/population-worker.ts',import.meta.url),{type:'module'}) as unknown as WorkerPort,{attach:p=>living.attach(p),detach:key=>living.detach(key)},{chunkSize:64,seed:SEED,density:DENSITY},2);lastTarget='';}
function buildGround(x:number,z:number){if(ground){ground.removeFromParent();ground.geometry.dispose();}ground=new T.Mesh(terrainGeometry(geo.height,Math.floor((x-512)/4)*4,Math.ceil((z+512)/4)*4,1024,4),variants.active);ground.receiveShadow=true;scene.add(ground);}
function applyMaterial(){if(ground)ground.material=variants.active;el('badge').textContent=VARIANT_LABELS[variants.variant].toUpperCase();ready=false;}
function setView(id:string){const next=cameras.find(c=>c.id===id);if(!next)throw Error('Unknown camera '+id);view=next;el<HTMLSelectElement>('camera').value=id;ready=false;walking=view.kind==='walk';controls.enabled=!walking;camera.up.set(0,1,0);const {x,z}=view,y=geo.elevation(x,z);
 if(view.kind==='overhead'){camera.position.set(x,y+145,z+.01);camera.up.set(0,0,-1);controls.target.set(x,y,z);camera.lookAt(controls.target);}
 else{camera.position.set(x,y+1.75,z);yaw=view.heading;pitch=view.pitch;camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);}
 living.settings.treeDistance=view.kind==='overhead'?1000:190;sun.position.set(x-140,y+230,z+110);sun.target.position.set(x,y,z);buildGround(x,z);living.reconfigure();lastTarget='';
}
function setVegetation(on:boolean){el<HTMLInputElement>('vegetation').checked=on;living.settings.enabled=new Set(on?FAMILIES:[]);ready=false;living.reconfigure();}
function setDebug(v:DebugView){debug=v;el<HTMLSelectElement>('debug').value=v;variants.setDebug(v);ready=false;}
function setVariant(v:GroundVariant){variants.set(v);el<HTMLSelectElement>('variant').value=v;variants.setDebug(debug);applyMaterial();}
function setProfile(p:QualityProfile){variants.setProfile(p);el<HTMLSelectElement>('profile').value=p;variants.setDebug(debug);applyMaterial();}
function snapshot(){const all=[...stream.active.values()],counts:Record<string,number>={};for(const p of all)for(const i of p.instances)counts[i.family]=(counts[i.family]??0)+1;
 const materials=new Set<T.Material>();scene.traverse(o=>{const m=(o as T.Mesh).material;if(m)(Array.isArray(m)?m:[m]).forEach(x=>materials.add(x));});
 return {milestone:'MAT-ART-R01',ready:ready&&stream.settled&&!living.pending&&stylizedReady,stylizedReady,error:stream.error,view:view.id,viewSource:view.source,set:view.set,variant:variants.variant,vegetation:living.settings.enabled.size>0,debug,
  descriptorCount:all.reduce((n,p)=>n+p.instances.length,0),counts,activeChunks:stream.active.size,render:living.stats(),
  renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,memory:{...renderer.info.memory},programs:renderer.info.programs?.length},
  sceneMaterials:materials.size,timing:{lastRenderSubmissionMs:lastRenderMs,stylizedSynthesisMs:stylizedMs},
  camera:camera.position.toArray(),cameraQuaternion:camera.quaternion.toArray(),fov:camera.fov,terrainY:geo.elevation(camera.position.x,camera.position.z),
  ground:groundIntegration.snapshot(),groundVariant:variants.snapshot(),settings:{...living.settings,enabled:[...living.settings.enabled]},
  scene:{exposure:renderer.toneMappingExposure,sun:sun.intensity,hemisphere:hemisphere.intensity,fog:[230,650],sunPosition:sun.position.toArray(),pixelRatio:renderer.getPixelRatio(),size:[canvas.width,canvas.height]}};}
el<HTMLSelectElement>('camera').onchange=e=>setView((e.target as HTMLSelectElement).value);
el<HTMLSelectElement>('variant').onchange=e=>setVariant((e.target as HTMLSelectElement).value as GroundVariant);
el<HTMLSelectElement>('profile').onchange=e=>setProfile((e.target as HTMLSelectElement).value as QualityProfile);
el<HTMLSelectElement>('debug').onchange=e=>setDebug((e.target as HTMLSelectElement).value as DebugView);
el<HTMLInputElement>('vegetation').onchange=e=>setVegetation((e.target as HTMLInputElement).checked);
const lifecycle=new AbortController();let animationFrame=0;
function listen<K extends keyof GlobalEventHandlersEventMap>(target:EventTarget,type:K,handler:(event:GlobalEventHandlersEventMap[K])=>void){target.addEventListener(type,handler as EventListener,{signal:lifecycle.signal});}
const keys=new Set<string>();listen(window,'keydown',e=>{if((e.target as HTMLElement).matches('input,select'))return;keys.add(e.key.toLowerCase());});listen(window,'keyup',e=>keys.delete(e.key.toLowerCase()));listen(window,'blur',()=>keys.clear());let drag=false,lx=0,ly=0;
listen(canvas,'pointerdown',e=>{drag=true;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture(e.pointerId);});listen(canvas,'pointerup',()=>drag=false);listen(canvas,'pointermove',e=>{if(drag&&walking){yaw-=(e.clientX-lx)*.004;pitch=Math.max(-1.2,Math.min(1.2,pitch-(e.clientY-ly)*.004));camera.rotation.set(pitch,yaw,0);}lx=e.clientX;ly=e.clientY;});
listen(window,'resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
let lastMetrics=0,paused=false;
function frame(now:number){if(dead)return;animationFrame=requestAnimationFrame(frame);if(paused)return;const dt=Math.min(.05,Math.max(0,now-last)/1000);last=now;
 if(walking){const f=(keys.has('w')?1:0)-(keys.has('s')?1:0),r=(keys.has('d')?1:0)-(keys.has('a')?1:0),speed=keys.has('shift')?10:3.5,x=camera.position.x+(-Math.sin(yaw)*f+Math.cos(yaw)*r)*dt*speed,z=camera.position.z+(-Math.cos(yaw)*f-Math.sin(yaw)*r)*dt*speed;if(f||r){const s=geo.sample(x,z);if(s.dry&&s.slope<.7)camera.position.set(x,s.elevation+1.75,z);}}
 if(controls.enabled)controls.update();const target=walking?camera.position:view,k=Math.floor(target.x/64)+','+Math.floor(target.z/64);if(k!==lastTarget){stream.target(target.x,target.z);lastTarget=k;ready=false;}
 try{living.update(camera,stream.settled&&living.pending>0);const t=performance.now();renderer.render(scene,camera);lastRenderMs=performance.now()-t;ready=true;}
 catch(e){el('metrics').textContent='RENDER FAILURE '+String(e);Object.assign(window,{__matArtFailure:String(e)});return;}
 if(now-lastMetrics>250){lastMetrics=now;const s=snapshot();el('metrics').textContent=`${VARIANT_LABELS[s.variant]}\nGENERATED ${s.descriptorCount} · ${s.activeChunks} chunks\n${Object.entries(s.counts).map(([k,v])=>k+' '+v).join(' · ')}\nCALLS ${s.renderer.calls} · TRI ${s.renderer.triangles}\nGround textures ${(s.groundVariant.gpuBytes.detail/1048576).toFixed(1)} MiB · ${s.groundVariant.textureSize}²×${s.groundVariant.textureLayers}\nRender submission ${lastRenderMs.toFixed(1)} ms`;el('location').textContent=`${view.label} · x ${camera.position.x.toFixed(1)} / z ${camera.position.z.toFixed(1)}`;}
}
async function loadStylized(load:()=>Promise<VariantSource&{synthesisMs:number}>=loadStylizedTextures){const s=await load();stylizedMs=s.synthesisMs;variants.setStylized(s);stylizedReady=true;}
startStream();setView(cameras[0].id);
const stylizedLoad=loadStylized().catch(e=>{Object.assign(window,{__matArtFailure:'Stylized synthesis failed: '+String(e)});});
Object.assign(window,{__matArt:{
 capture:()=>{renderer.render(scene,camera);renderer.getContext().finish();return canvas.toDataURL('image/png');},
 stylizedLoad,snapshot,setView,setVariant,setVegetation,setDebug,setProfile,pause:(v:boolean)=>{paused=v;},views:cameras,variants:GROUND_VARIANTS,loadStylized,
 renderOnce:()=>{renderer.render(scene,camera);return snapshot();},
 timeRender:(n:number)=>{const g=renderer.getContext(),t:number[]=[];for(let i=0;i<n;i++){const s=performance.now();renderer.render(scene,camera);g.finish();t.push(performance.now()-s);}return t;},
 setPose:(heading:number,angle:number)=>{yaw=heading;pitch=angle;camera.rotation.set(pitch,yaw,0);},
 stepWalk:(distance:number)=>{const x=camera.position.x-Math.sin(yaw)*distance,z=camera.position.z-Math.cos(yaw)*distance;if(geo.sample(x,z).dry)camera.position.set(x,geo.elevation(x,z)+1.75,z);lastTarget='';ready=false;},
 groundHash:async()=>{const g=ground!.geometry,hex=async(a:ArrayBufferView)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',a as BufferSource))].map(b=>b.toString(16).padStart(2,'0')).join('');
  return {positions:await hex(g.attributes.position.array as Float32Array),normals:await hex(g.attributes.normal.array as Float32Array),index:await hex(g.index!.array as Uint32Array)};},
 placements:()=>[...stream.active.values()].flatMap(p=>p.instances).sort((a,b)=>a.id.localeCompare(b.id)),
 dispose:()=>{if(dead)return;dead=true;cancelAnimationFrame(animationFrame);animationFrame=0;lifecycle.abort();keys.clear();controls.dispose();stream.dispose();living.dispose();ground?.geometry.dispose();ground?.removeFromParent();variants.dispose();groundIntegration.dispose();waterGeometry.dispose();sea.geometry.dispose();scene.traverse(o=>{if(o instanceof T.Mesh&&o!==ground)(o.material as T.Material).dispose();});sun.shadow.dispose();renderer.renderLists.dispose();renderer.dispose();renderer.forceContextLoss();},
 cleanupSnapshot:()=>({dead,chunks:stream.active.size,pages:living.store.pages.size,listenersAborted:lifecycle.signal.aborted,animationCancelled:animationFrame===0,memory:{...renderer.info.memory},ground:groundIntegration.snapshot()}),
}});
animationFrame=requestAnimationFrame(frame);
