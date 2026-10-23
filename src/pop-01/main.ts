import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {HeightGrid,terrainGeometry} from '../geo-r02b/terrain.ts';
import {CanonicalEnvironment,type GeoData} from './geography.ts';
import {PopulationGenerator} from './generator.ts';
import {PopulationStream} from './streaming.ts';
import {DiagnosticRenderer} from './proxy-renderer.ts';
import {community} from './ecology.ts';
import type {Family} from './contracts.ts';
import './style.css';
document.querySelector('#app')!.innerHTML=`<canvas></canvas><aside><h1>AURORA REST</h1><h2>POP-01 · ECOLOGICAL PLACEMENT REVIEW</h2><label>Geographic anchor<select id="region"></select></label><label>Camera<select id="view"><option value="landscape">Elevated landscape</option><option value="overhead">Overhead</option><option value="walk">Walking height</option></select></label><label>Chunk edge<select id="chunkSize"><option value="64">64 m · lower generation latency</option><option value="128">128 m · fewer render groups</option><option value="256">256 m · benchmark only</option></select></label><label>Density <output id="densityValue">1</output><input id="density" type="range" min="0" max="2" step=".25" value="1"></label><label>World seed<input id="seed" type="number" min="0" max="4294967295" value="73129"></label><div class="families">${['birch','pine','grass','rock'].map(f=>`<label><input type="checkbox" data-family="${f}" checked>${f}</label>`).join('')}</div><label>Terrain diagnostic<select id="diagnostic"><option value="neutral">Neutral geographic surface</option><option value="community">Provisional communities</option><option value="slope">Slope · green / amber / red</option><option value="water">Water clearance · blue</option><option value="trail">Provisional tread · orange</option></select></label><label><input type="checkbox" id="chunks">Chunk boundaries</label><button id="regenerate">Unload & regenerate active region</button><pre id="metrics">Loading canonical geography…</pre><small>WASD walk · drag to look · orbit in survey views · click a proxy to inspect. No ground materials or water shader.</small></aside><div class="badge"><b>DIAGNOSTIC PROXIES</b>Placement evidence · approved nature assets deferred to POP-02</div><div class="foot" id="location"></div><pre id="inspect"></pre>`;
const el=<E extends HTMLElement>(id:string)=>document.getElementById(id) as E;
const canvas=document.querySelector('canvas')!,renderer=new T.WebGLRenderer({canvas,antialias:true,logarithmicDepthBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
const scene=new T.Scene();scene.background=new T.Color(0xbacbd0);scene.fog=new T.Fog(0xbacbd0,550,1100);scene.add(new T.HemisphereLight(0xe2edf0,0x65715c,2));const sun=new T.DirectionalLight(0xffedce,2.4);sun.position.set(-400,700,100);scene.add(sun);
const camera=new T.PerspectiveCamera(58,innerWidth/innerHeight,.1,6000),controls=new OrbitControls(camera,canvas);controls.enableDamping=false;
async function binary(path:string){const r=await fetch(path);if(!r.ok)throw Error('Missing '+path);return new Float32Array(await r.arrayBuffer());}
const data:GeoData=await (await fetch('/geo-r02b/features.json')).json();const [heights,water]=await Promise.all([binary('/geo-r02b/terrain.f32'),binary('/geo-r02b/water-mesh.f32')]);const geo=new CanonicalEnvironment(data,new HeightGrid(heights,data.meta.grid.width,data.meta.grid.height),water);
const regions=geo.reviewRegions();el<HTMLSelectElement>('region').innerHTML=regions.map(r=>`<option value="${r.id}">${r.name}</option>`).join('');
const proxy=new DiagnosticRenderer(scene);let stream:PopulationStream;
let focus=regions[0],mode='landscape',diagnostic='neutral',ground:T.Mesh|undefined,chunkLines=new T.Group(),dirty=true,ready=false,yaw=0,pitch=0,last=performance.now(),lastStream='',genTime=0;
scene.add(chunkLines);
const waterG=new T.BufferGeometry();waterG.setAttribute('position',new T.BufferAttribute(water,3));waterG.computeVertexNormals();scene.add(new T.Mesh(waterG,new T.MeshLambertMaterial({color:0x5c8c9a,side:T.DoubleSide})));
const sea=new T.Mesh(new T.PlaneGeometry(20000,20000),new T.MeshLambertMaterial({color:0x4a7989,side:T.DoubleSide}));sea.rotation.x=-Math.PI/2;scene.add(sea);
function reset(){ready=false;if(stream)stream.clear();stream=new PopulationStream(new PopulationGenerator(geo,{seed:Number(el<HTMLInputElement>('seed').value),density:Number(el<HTMLInputElement>('density').value),chunkSize:Number(el<HTMLSelectElement>('chunkSize').value)}),proxy,Number(el<HTMLSelectElement>('chunkSize').value)===64?2:1);lastStream='';dirty=true;}
function buildGround(){if(ground){scene.remove(ground);ground.geometry.dispose();(ground.material as T.Material).dispose();}
 const west=Math.max(-3000,Math.floor((focus.x-512)/4)*4),north=Math.min(4000,Math.ceil((focus.z+512)/4)*4),g=terrainGeometry(geo.height,west,north,1024,4);ground=new T.Mesh(g,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));scene.add(ground);paint();}
const communityColors:Record<string,number>={'birch-woodland':0x65856b,'pine-woodland':0x375e55,meadow:0xb0b58a,'alpine-heath':0x9b95aa,'rocky-coast':0x9aa4ae,wetland:0x539b98,dunes:0xd1bf8f};
function paint(){if(!ground)return;const g=ground.geometry,pos=g.getAttribute('position'),out=new Float32Array(pos.count*3),c=new T.Color();
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),h=pos.getY(i);c.setHex(h<0?0x9bada7:0x9fa797);
  if(diagnostic!=='neutral'){const s=geo.sample(x,z);if(diagnostic==='community')c.setHex(communityColors[community(s,Number(el<HTMLInputElement>('seed').value)).id]);if(diagnostic==='slope')c.setHex(s.slope<.25?0x8ca68e:s.slope<.55?0xc3b379:0xbc7d71);if(diagnostic==='water')c.setHex(!s.dry?0x2e6893:s.waterDistance<5?0x75bfd0:0xabb4a7);if(diagnostic==='trail')c.setHex(s.trailDistance<3.3?0xd7995e:0xa5afa0);}
  c.toArray(out,i*3);
 }g.setAttribute('color',new T.BufferAttribute(out,3));dirty=true;
}
function setView(view:string){ready=false;mode=view;el<HTMLSelectElement>('view').value=view;controls.enabled=view!=='walk';const {x,z}=focus,y=geo.elevation(x,z);
 if(view==='overhead'){camera.position.set(x,y+420,z+.01);camera.up.set(0,0,-1);controls.target.set(x,y,z);camera.lookAt(controls.target);}else{camera.up.set(0,1,0);if(view==='walk'){camera.position.set(x,y+1.75,z);yaw=0;pitch=0;camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);}else{camera.position.set(x+150,y+120,z+180);controls.target.set(x,y,z);camera.lookAt(controls.target);}}
 dirty=true;lastStream='';
}
function setRegion(id:string){const r=regions.find(r=>r.id===id);if(!r)throw Error('Unknown region');focus=r;el<HTMLSelectElement>('region').value=id;reset();buildGround();setView(mode);}
function updateLines(){for(const o of [...chunkLines.children]){chunkLines.remove(o);(o as T.Line).geometry.dispose();((o as T.Line).material as T.Material).dispose();}
 for(const p of stream.active.values()){const [cx,cz]=p.key.split(',').map(Number),pts=[];for(let edge=0;edge<4;edge++)for(let i=0;i<32;i++){const t=i/32,x=(cx+(edge===0?t:edge===1?1:edge===2?1-t:0))*stream.generator.config.chunkSize,z=(cz+(edge===0?0:edge===1?t:edge===2?1:1-t))*stream.generator.config.chunkSize;pts.push(new T.Vector3(x,geo.elevation(x,z)+.25,z));}chunkLines.add(new T.LineLoop(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0xeed395})));}chunkLines.visible=el<HTMLInputElement>('chunks').checked;
}
function snapshot(){const populations=[...stream.active.values()],counts:Record<string,number>={},rejected:Record<string,number>={};for(const p of populations){for(const i of p.instances)counts[i.family]=(counts[i.family]??0)+1;for(const [k,v] of Object.entries(p.rejected))rejected[k]=(rejected[k]??0)+v;}
 const count=Object.values(counts).reduce((a,b)=>a+b,0);return {ready:ready&&!stream.queued,region:focus,mode,chunkSize:stream.generator.config.chunkSize,seed:stream.generator.config.seed,density:stream.generator.config.density,activeChunks:stream.active.size,queued:stream.queued,descriptors:count,counts,visibleProxyInstances:proxy.visible,submittedProxyInstances:proxy.submitted,densityPerHa:count/(stream.active.size*stream.generator.config.chunkSize**2/10000||1),rejected,generationMs:populations.reduce((a,p)=>a+p.generationMs,0),lastTickMs:genTime,serializedBytes:populations.reduce((a,p)=>a+p.serializedBytes,0),renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,memory:{...renderer.info.memory}},camera:camera.position.toArray(),terrainY:geo.elevation(camera.position.x,camera.position.z),proxyOnly:true};}
let previousCamera='';
function frame(now:number){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;
 if(mode==='walk'){
  const f=(keys.has('w')?1:0)-(keys.has('s')?1:0),r=(keys.has('d')?1:0)-(keys.has('a')?1:0),speed=keys.has('shift')?14:4;
  const x=camera.position.x+(-Math.sin(yaw)*f+Math.cos(yaw)*r)*dt*speed,z=camera.position.z+(-Math.cos(yaw)*f-Math.sin(yaw)*r)*dt*speed;
  if(f||r){const s=geo.sample(x,z);if(s.dry&&s.slope<.7){camera.position.set(x,s.elevation+1.75,z);dirty=true;}}
 }
 if(controls.enabled)controls.update();const target=mode==='walk'?camera.position:focus,key=Math.floor(target.x/stream.generator.config.chunkSize)+','+Math.floor(target.z/stream.generator.config.chunkSize);
 if(key!==lastStream){stream.target(target.x,target.z);lastStream=key;dirty=true;}
 if(stream.queued){const t=performance.now();stream.tick(8);genTime=performance.now()-t;updateLines();dirty=true;}
 const ck=camera.matrixWorld.elements.join(',');if(ck!==previousCamera){dirty=true;previousCamera=ck;}
 if(dirty){proxy.update(camera,mode==='walk'?90:mode==='overhead'?1000:450);dirty=false;}
 renderer.render(scene,camera);ready=true;const s=snapshot();el('metrics').textContent=`ACTIVE ${s.activeChunks} chunks · queued ${s.queued}\nGenerated ${s.descriptors} descriptors\nVisible/submitted proxies ${s.visibleProxyInstances}\n${JSON.stringify(s.counts)}\n${s.densityPerHa.toFixed(0)} objects / ha\nGeneration ${s.generationMs.toFixed(1)} ms\nLast tick ${s.lastTickMs.toFixed(1)} ms (soft budget)\nSerialized ${(s.serializedBytes/1e6).toFixed(2)} MB\nDRAW ${s.renderer.calls} · TRI ${s.renderer.triangles}\nRejected ${JSON.stringify(s.rejected)}`;el('location').textContent=`${focus.name} · x ${camera.position.x.toFixed(1)} / z ${camera.position.z.toFixed(1)} · ${mode}`;
}
const keys=new Set<string>();addEventListener('keydown',e=>{if((e.target as HTMLElement).matches('input,select'))return;keys.add(e.key.toLowerCase());});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());let dragging=false,lx=0,ly=0;
canvas.addEventListener('pointerdown',e=>{dragging=true;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointermove',e=>{if(dragging&&mode==='walk'){yaw-=(e.clientX-lx)*.004;pitch=Math.max(-1.3,Math.min(1.3,pitch-(e.clientY-ly)*.004));camera.rotation.set(pitch,yaw,0);dirty=true;}lx=e.clientX;ly=e.clientY;});
canvas.addEventListener('click',e=>{const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);const h=ray.intersectObjects(proxy.objects())[0];if(h?.instanceId!==undefined){const id=h.object.userData.ids[h.instanceId],p=proxy.find(id);el('inspect').style.display='block';el('inspect').textContent=JSON.stringify(p,null,2);}});
el<HTMLSelectElement>('region').onchange=e=>setRegion((e.target as HTMLSelectElement).value);el<HTMLSelectElement>('view').onchange=e=>setView((e.target as HTMLSelectElement).value);
el<HTMLSelectElement>('chunkSize').onchange=reset;el<HTMLInputElement>('density').onchange=()=>{el('densityValue').textContent=el<HTMLInputElement>('density').value;reset();};el<HTMLInputElement>('seed').onchange=()=>{reset();if(diagnostic==='community')paint();};el('regenerate').onclick=reset;
for(const e of document.querySelectorAll<HTMLInputElement>('[data-family]'))e.onchange=()=>{const f=e.dataset.family as Family;e.checked?proxy.enabled.add(f):proxy.enabled.delete(f);dirty=true;};
el('chunks').onchange=()=>{chunkLines.visible=el<HTMLInputElement>('chunks').checked;};el<HTMLSelectElement>('diagnostic').onchange=e=>{diagnostic=(e.target as HTMLSelectElement).value;paint();};
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);dirty=true;});
setRegion('forest');
Object.assign(window,{__pop01:{snapshot,setRegion,setView,regenerate:reset,inspect:(id:string)=>proxy.find(id),ids:()=>[...stream.active.values()].flatMap(p=>p.instances.map(i=>i.id)).sort(),teleport:(x:number,z:number)=>{ready=false;camera.position.set(x,geo.elevation(x,z)+1.75,z);mode='walk';controls.enabled=false;dirty=true;lastStream='';},dispose:()=>{stream.dispose();},regions}});
requestAnimationFrame(frame);
