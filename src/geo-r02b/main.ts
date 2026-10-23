import * as THREE from 'three';
import {HeightGrid,Terrain,contains,waterAt,type Data,type V3} from './terrain.ts';
import {reviewOptions,reviewCameras,applyClay} from './review.ts';
import {applyVariant,applyVariantRoutes,terrainIdentity} from '../geo-r02c-a1a/variants.ts';
import {a1aCameras} from '../geo-r02c-a1a/cameras.ts';
import {a1bCameras} from '../geo-r02c-a1b/cameras.ts';
import {a1cCameras} from '../geo-r02c-a1c/cameras.ts';
import {b01Cameras} from '../geo-r02c-b01/cameras.ts';
import './style.css';
const app=document.querySelector('#app')!;
app.innerHTML=`<canvas id="world"></canvas><section id="ui"><h1>AURORA REST</h1><small>GEO-R02B-R1 · terrain integrity review</small><div id="controls"><select id="view" aria-label="Viewpoint"><option>Loading terrain…</option></select><button id="mode">Fly / walk [F]</button><button id="top">Top-down [O]</button></div><div><label><input id="ridges" type="checkbox"> Ridges / valleys</label> <label><input id="routes" type="checkbox"> Hiking reservations</label> <label><input id="catchments" type="checkbox"> Catchments</label></div><div><select id="diagnostic" aria-label="Terrain diagnostic"><option value="neutral">Neutral terrain</option><option value="height">Elevation · 0–900 m</option><option value="slope">Slope · 12 / 25 / 35 / 60%</option><option value="drainage">Measured downhill directions</option><option value="depressions">Closed depressions · before / after</option><option value="water">River / terrain alignment</option><option value="failures">Route width / grade conflicts</option></select></div><div id="status">Loading A-R1 terrain…</div><div class="legend">WASD move · drag/mouse look · Q/E fly · Shift faster<br>Neutral terrain; no vegetation or environment assets.</div><div class="note">Design constraint prototype. Art acceptance and Android validation remain open.</div><div id="error"></div></section><div id="crosshair">·</div><div id="loading">Loading 4 m authored terrain grid…</div>`;
const canvas=document.querySelector<HTMLCanvasElement>('#world')!,renderer=new THREE.WebGLRenderer({canvas,antialias:true,logarithmicDepthBuffer:true,powerPreference:'high-performance'});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(1.5,devicePixelRatio));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new THREE.Scene();scene.scale.x=-1;scene.background=new THREE.Color(0xc6d2d6);scene.fog=new THREE.FogExp2(0xc6d2d6,.000025);const hemisphere=new THREE.HemisphereLight(0xe3ebee,0x7c8175,1.25);scene.add(hemisphere);const sun=new THREE.DirectionalLight(0xfff2d8,2);sun.position.set(-2500,4300,-2000);scene.add(sun);
const perspective=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.2,24000),ortho=new THREE.OrthographicCamera(-6000,6000,4500,-4500,20,24000);let camera:THREE.Camera=perspective;
const gridResponse=await fetch('/geo-r02b/terrain.f32'),data:Data=await (await fetch('/geo-r02b/features.json')).json();if(!gridResponse.ok)throw new Error('Generate the GEO-R02B terrain files first.');const buffer=await gridResponse.arrayBuffer();const heights=new Float32Array(buffer);
// GEO-R02C-A1a review variants are opt-in (?terrain=a1a-v1 ...); without the parameter the R1 heights are untouched.
const variant=await applyVariant(location.search,heights,data.meta.grid.width,data.meta.terrainSha256);if(variant)document.querySelector('#ui small')!.textContent+=' · '+variant.label;
// A variant may realign routes on its terrain (B01: peak-ascent); the R1 alignment stays available as '<id>-r1' for reference.
if(variant?.routes)applyVariantRoutes(data.routes,variant.routes);
const grid=new HeightGrid(heights,data.meta.grid.width,data.meta.grid.height,4);const terrain=new Terrain(grid,scene);
function line(points:V3[],color:number,offset=2){const geo=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p[0],p[1]+offset,p[2])));return new THREE.Line(geo,new THREE.LineBasicMaterial({color,depthTest:false,transparent:true,opacity:.8}));}
const diagnostics={ridges:new THREE.Group(),routes:new THREE.Group(),catchments:new THREE.Group()};for(const [id,g] of Object.entries(diagnostics)){g.visible=false;scene.add(g);document.querySelector<HTMLInputElement>('#'+id)!.onchange=e=>{g.visible=(e.target as HTMLInputElement).checked;};}
for(const r of data.ridges)diagnostics.ridges.add(line(r.points,0x694d35));for(const v of data.valleys)diagnostics.ridges.add(line(v.axis,0x507251));
for(const r of data.routes)diagnostics.routes.add(line(r.points2.map(p=>[p[0],grid.surface(p[0],p[1]),p[1]]),0xc97143));
for(const c of data.catchments)for(const ring of c.rings)diagnostics.catchments.add(line(ring.map(p=>[p[0],grid.surface(p[0],p[1]),p[1]]),0x8e5e85));
// Water geometry shares the same A-R1 samples and levels used for terrain carving.
const waterMaterial=new THREE.MeshLambertMaterial({color:0x467c8c,side:THREE.DoubleSide});
const ocean=new THREE.Mesh(new THREE.PlaneGeometry(40000,40000),new THREE.MeshLambertMaterial({color:0x3c6471,side:THREE.DoubleSide}));ocean.rotation.x=-Math.PI/2;ocean.position.y=0;scene.add(ocean);
if(data.waterMesh){
 const [meshBuffer,waterBuffer]=await Promise.all([fetch('/geo-r02b/'+data.waterMesh.file).then(r=>r.arrayBuffer()),fetch('/geo-r02b/'+data.waterMesh.surfaceFile).then(r=>r.arrayBuffer())]);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(meshBuffer),3));g.computeVertexNormals();scene.add(new THREE.Mesh(g,waterMaterial));data.waterSurface=new HeightGrid(new Float32Array(waterBuffer),grid.width,grid.height);
}else{
for(const lake of data.lakes){const shape=new THREE.Shape(lake.boundary.map(p=>new THREE.Vector2(p[0],-p[1]))),geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);geometry.translate(0,lake.level+.02,0);scene.add(new THREE.Mesh(geometry,waterMaterial));}
for(const river of data.channels){const pos:number[]=[],idx:number[]=[];for(let i=0;i<river.points.length;i++){const p=river.points[i],a=river.points[Math.max(0,i-1)],b=river.points[Math.min(river.points.length-1,i+1)],dx=b[0]-a[0],dz=b[2]-a[2],l=Math.hypot(dx,dz)||1,w=river.widthsM[i]/2;for(const sign of [-1,1])pos.push(p[0]-dz/l*w*sign,p[1]+.03,p[2]+dx/l*w*sign);if(i){const k=i*2;idx.push(k-2,k,k-1,k-1,k,k+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();scene.add(new THREE.Mesh(g,waterMaterial));}
}
// Named crossings are explicit diagnostic decks; no environment assets are introduced.
interface Deck {id:string;a:THREE.Vector2;b:THREE.Vector2;level:number;halfWidth:number;ramp:number;ends:number[];}
const decks:Deck[]=[];
for(const d of data.decks??[]){
 const A=new THREE.Vector2(...d.a as [number,number]),B=new THREE.Vector2(...d.b as [number,number]),dir=B.clone().sub(A).normalize(),length=A.distanceTo(B),normal=new THREE.Vector2(-dir.y,dir.x),pos:number[]=[],idx:number[]=[];
 const stations=[0,d.rampM,length-d.rampM,length],levels=[d.endLevelsM[0],d.levelM,d.levelM,d.endLevelsM[1]];
 stations.forEach((v,i)=>{for(const sign of [-1,1]){const q=A.clone().addScaledVector(dir,v).addScaledVector(normal,d.halfWidthM*sign);pos.push(q.x,levels[i],q.y);}if(i){const k=i*2;idx.push(k-2,k,k-1,k-1,k,k+1);}});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();scene.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0x706f65,side:THREE.DoubleSide})));
 decks.push({id:d.id,a:A,b:B,level:d.levelM,halfWidth:d.halfWidthM,ramp:d.rampM,ends:d.endLevelsM});
}
function deckAt(x:number,z:number){for(const d of decks){const dx=d.b.x-d.a.x,dz=d.b.y-d.a.y,length=Math.hypot(dx,dz),t=((x-d.a.x)*dx+(z-d.a.y)*dz)/(length*length);if(t<0||t>1||Math.hypot(x-d.a.x-t*dx,z-d.a.y-t*dz)>d.halfWidth)continue;const along=t*length;if(along<d.ramp)return THREE.MathUtils.lerp(d.ends[0],d.level,along/d.ramp);if(along>length-d.ramp)return THREE.MathUtils.lerp(d.level,d.ends[1],(along-length+d.ramp)/d.ramp);return d.level;}return -Infinity;}
// Diagnostic overlays are actual measurements of this heightfield.
const diagnosticData=await fetch('/geo-r02b/diagnostics.json').then(r=>r.ok?r.json():({arrows:[],sinks:[],routeFailures:[],summary:{}}));
const diagnosticLayer=new THREE.Group();scene.add(diagnosticLayer);
function segments(points:number[],color:number){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));return new THREE.LineSegments(g,new THREE.LineBasicMaterial({color,depthTest:false}));}
function mark(x:number,y:number,z:number,color:number,r=18){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x-r,y+3,z-r),new THREE.Vector3(x+r,y+3,z+r),new THREE.Vector3(x-r,y+3,z+r),new THREE.Vector3(x+r,y+3,z-r)]);return new THREE.LineSegments(g,new THREE.LineBasicMaterial({color,depthTest:false}));}
function setDiagnostic(id:string){
 const select=document.querySelector<HTMLSelectElement>('#diagnostic')!;select.value=id;
 for(const child of [...diagnosticLayer.children]){diagnosticLayer.remove(child);const o=child as THREE.Line;o.geometry.dispose();(o.material as THREE.Material).dispose();}
 terrain.material.vertexColors=id==='height'||id==='slope';terrain.material.color.setHex(terrain.material.vertexColors?0xffffff:0xb4b6b0);terrain.material.needsUpdate=true;
 if(terrain.material.vertexColors){for(const tile of terrain.tiles){const g=tile.mesh.geometry as THREE.BufferGeometry,p=g.getAttribute('position'),colors=new Float32Array(p.count*3),c=new THREE.Color();for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=p.getY(i);if(id==='height')c.setHSL(.64-Math.max(0,Math.min(1,h/900))*.6,.52,.45);else{const grade=Math.hypot((grid.node(x+4,z)-grid.node(x-4,z))/8,(grid.node(x,z+4)-grid.node(x,z-4))/8);c.setHex(grade<.12?0x91bb90:grade<.25?0xd9d57d:grade<.35?0xe7aa60:grade<.6?0xca6a53:0x6c365d);}c.toArray(colors,i*3);}g.setAttribute('color',new THREE.BufferAttribute(colors,3));}}
 if(id==='drainage'){const p:number[]=[];for(const [x,y,z,dx,dz] of diagnosticData.arrows){const ex=x+dx*23,ez=z+dz*23;p.push(x,y+4,z,ex,y+4,ez,ex,y+4,ez,ex-dx*8-dz*5,y+4,ez-dz*8+dx*5,ex,y+4,ez,ex-dx*8+dz*5,y+4,ez-dz*8-dx*5);}diagnosticLayer.add(segments(p,0x164d7c));}
 if(id==='depressions'){for(const [x,z] of [[800,1040],[340,1120],[-400,820],[160,-1220],[1160,-900],[580,-1880],[1160,-1920]])diagnosticLayer.add(mark(x,grid.surface(x,z),z,0xdcaa43,38));for(const [x,y,z] of diagnosticData.sinks)diagnosticLayer.add(mark(x,y,z,0xdd245c,40));}
 if(id==='water'){for(const c of data.channels){diagnosticLayer.add(line(c.points,0x288fc4,2));diagnosticLayer.add(line(c.points.map(p=>[p[0],grid.surface(p[0],p[2]),p[2]]),0xc97c43,.1));}}
 if(id==='failures'){for(const r of data.routes)diagnosticLayer.add(line(r.points2.map(p=>[p[0],grid.surface(p[0],p[1]),p[1]]),0x438a58));for(const [x,y,z,kind] of diagnosticData.routeFailures)diagnosticLayer.add(mark(x,y,z,kind==='width'?0xc046a8:0xce2836,12));}
}
document.querySelector<HTMLSelectElement>('#diagnostic')!.onchange=e=>setDiagnostic((e.target as HTMLSelectElement).value);
const specs=[
 {id:'overview',name:'Orthographic island survey',uv:[300,400],yaw:0,kind:'overview'},
 {id:'island-oblique',name:'Elevated southern oblique',uv:[300,400],yaw:0,kind:'oblique'},
 {id:'home-cove',name:'Home Cove · coastal perspective',uv:[467,590],yaw:2.95,kind:'walk',pitch:-.025},
 {id:'central-valley',name:'Central Valley · ground level',uv:[309,392],yaw:.70,kind:'walk',pitch:.025},
 {id:'cairn-saddle',name:'Cairn Saddle · panorama',uv:[304,308],yaw:1.5,kind:'walk',pitch:-.035},
 {id:'high-tarn',name:'High Tarn · northern massif',uv:[443,207],yaw:-1.13,kind:'walk',pitch:-.035},
 {id:'hidden-fold',name:'Hidden Fold · basin',uv:[446,431],yaw:-.74,kind:'walk',pitch:-.07},
 {id:'mirelands',name:'Mirelands · low river corridor',uv:[381,565],yaw:2.5,kind:'walk',pitch:-.03}
];
// GEO-R02C-P0 review cameras and clay mode are opt-in (?presets=p0, ?review=clay&sun=A|B).
const review=reviewOptions(location.search);specs.push(...reviewCameras(review),...a1aCameras(location.search),...a1bCameras(location.search),...a1cCameras(location.search),...b01Cameras(location.search));
let mode='walk',viewId='home-cove',yaw=0,pitch=0,aerialTarget=new THREE.Vector3(),frames=0,last=performance.now(),frameMs=16.7;const player=new THREE.Vector3();const keys=new Set<string>();let drag=false,savedWalk=2;const sel=document.querySelector<HTMLSelectElement>('#view')!;sel.innerHTML='';for(const s of specs){const o=document.createElement('option');o.value=s.id;o.textContent=s.name;sel.append(o);}
function resize(){renderer.setSize(innerWidth,innerHeight);perspective.aspect=innerWidth/innerHeight;perspective.updateProjectionMatrix();const half=4450,aspect=innerWidth/innerHeight;ortho.left=-half*aspect;ortho.right=half*aspect;ortho.top=half;ortho.bottom=-half;ortho.updateProjectionMatrix();}addEventListener('resize',resize);resize();
function setView(id:string){const spec=specs.find(v=>v.id===id);if(!spec)throw new Error('Unknown view '+id);viewId=id;sel.value=id;keys.clear();yaw=spec.yaw;pitch=spec.pitch??0;mode=spec.kind;camera=mode==='overview'?ortho:perspective;
 player.set(spec.uv[0]*10-3000,0,4000-spec.uv[1]*10);terrain.update(player.x,player.z,mode==='overview'||mode==='oblique',true);
 if(mode==='oblique')player.set(200,5700,-5800);else if(mode==='aerial'){const a=(spec as {aerial?:{pos:number[];target:number[]}}).aerial!;player.set(a.pos[0],a.pos[1],a.pos[2]);aerialTarget.set(a.target[0],a.target[1],a.target[2]);}else player.y=terrain.surface(player.x,player.z)+1.75;
 if(mode==='overview'){ortho.position.set(0,11000,0);ortho.up.set(0,0,1);ortho.lookAt(0,0,0);}document.querySelector('#crosshair')!.classList.toggle('hidden',mode!=='walk');
}
function toggleFly(){if(mode==='overview'||mode==='oblique'||mode==='aerial')setView(specs[savedWalk].id);mode=mode==='walk'?'fly':'walk';if(mode==='walk'){const level=terrain.surface(player.x,player.z),water=waterAt(data,player.x,player.z);if(level<=water+.15){setView('home-cove');return;}player.y=Math.max(level,deckAt(player.x,player.z))+1.75;}}
sel.onchange=()=>{setView(sel.value);savedWalk=Math.max(2,specs.findIndex(v=>v.id===sel.value));};document.querySelector<HTMLButtonElement>('#mode')!.onclick=toggleFly;document.querySelector<HTMLButtonElement>('#top')!.onclick=()=>setView(mode==='overview'?specs[savedWalk].id:'overview');
addEventListener('keydown',e=>{if((e.target as HTMLElement).matches('input,select,button'))return;const k=e.key.toLowerCase();keys.add(k);if(k==='f'&&!e.repeat)toggleFly();if(k==='o'&&!e.repeat)setView(mode==='overview'?specs[savedWalk].id:'overview');});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{keys.clear();drag=false;});
canvas.onpointerdown=e=>{drag=true;canvas.setPointerCapture(e.pointerId);};canvas.onpointerup=()=>{drag=false;};canvas.onpointermove=e=>{if(!drag||mode==='overview'||mode==='oblique'||mode==='aerial')return;yaw+=e.movementX*.003;pitch=Math.max(-1.48,Math.min(1.48,pitch-e.movementY*.003));};
function stepWalk(dx:number,dz:number){const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.65));for(let i=0;i<n;i++){const x=player.x+dx/n,z=player.z+dz/n;if(Math.abs(x)>2998||Math.abs(z)>3998)break;const old=Math.max(terrain.surface(player.x,player.z),deckAt(player.x,player.z)),h=Math.max(terrain.surface(x,z),deckAt(x,z));if(h<waterAt(data,x,z)+.12||Math.abs(h-old)/(Math.hypot(dx,dz)/n||1)>.7)break;player.x=x;player.z=z;}player.y=Math.max(terrain.surface(player.x,player.z),deckAt(player.x,player.z))+1.75;}
const reviewState=applyClay(review,{renderer,scene,hemisphere,sun,terrainMaterial:terrain.material,terrainMeshes:terrain.tiles.map(t=>t.mesh)});
setView(new URLSearchParams(location.search).get('view')??'home-cove');document.querySelector('#loading')!.remove();const status=document.querySelector('#status')!;
const frameTimes:number[]=[];
function animate(now:number){requestAnimationFrame(animate);const ms=Math.max(1,now-last),dt=Math.min(.07,ms/1000);last=now;frameMs=frameMs*.94+ms*.06;frameTimes.push(ms);if(frameTimes.length>240)frameTimes.shift();
 const speed=mode==='fly'?(keys.has('shift')?220:75):(keys.has('shift')?10:4),f=Number(keys.has('w'))-Number(keys.has('s')),r=Number(keys.has('d'))-Number(keys.has('a'));
 if(mode==='walk'||mode==='fly'){const dx=(Math.sin(yaw)*f+Math.cos(yaw)*r)*speed*dt,dz=(Math.cos(yaw)*f-Math.sin(yaw)*r)*speed*dt;if(mode==='walk'&&(dx||dz))stepWalk(dx,dz);else if(mode==='fly'){player.x+=dx;player.z+=dz;player.y+=(Number(keys.has('e'))-Number(keys.has('q')))*speed*dt;player.y=Math.max(grid.surface(player.x,player.z)+2,player.y);}terrain.update(player.x,player.z);perspective.position.set(-player.x,player.y,player.z);perspective.up.set(0,1,0);perspective.lookAt(-player.x-Math.sin(yaw)*Math.cos(pitch)*100,player.y+Math.sin(pitch)*100,player.z+Math.cos(yaw)*Math.cos(pitch)*100);}
 else if(mode==='oblique'){perspective.position.set(-player.x,player.y,player.z);perspective.up.set(0,1,0);perspective.lookAt(0,180,300);}
 else if(mode==='aerial'){perspective.position.set(-player.x,player.y,player.z);perspective.up.set(0,1,0);perspective.lookAt(-aerialTarget.x,aerialTarget.y,aerialTarget.z);}
 renderer.render(scene,camera);if(frames++%12===0){const info=renderer.info.render;status.innerHTML=`<b>${specs.find(v=>v.id===viewId)?.name??viewId}</b> · ${mode}<br>${player.x.toFixed(0)} E / ${player.z.toFixed(0)} N · eye ${player.y.toFixed(1)} m<br>${(1000/frameMs).toFixed(0)} FPS · ${info.calls} draw calls · ${(info.triangles/1000).toFixed(0)}k triangles<br>4 m canonical grid · 4 m matched render/contact mesh`;}
}
requestAnimationFrame(animate);
const qa={ready:true,setView,setDiagnostic,walkRouteForTest(id:string){const r=data.routes.find(r=>r.id===id);if(!r)throw new Error('Unknown route');const start=r.points2[0];player.set(start[0],0,start[1]);player.y=Math.max(terrain.surface(player.x,player.z),deckAt(player.x,player.z))+1.75;let blockedAt=-1;for(let i=1;i<r.points2.length;i++){const p=r.points2[i];stepWalk(p[0]-player.x,p[1]-player.z);if(Math.hypot(player.x-p[0],player.z-p[1])>.1){blockedAt=i;break;}}const end=r.points2.at(-1)!;return {id,blockedAt,endDistanceM:Math.hypot(player.x-end[0],player.z-end[1]),samples:r.points2.length};},diagnosticSummary:diagnosticData.summary,views:specs,snapshot(){const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {mode,viewId,player:player.toArray(),camera:camera.position.toArray(),eyeHeight:player.y-terrain.surface(player.x,player.z),yaw,pitch,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),frameTimes:[...frameTimes],masterSha256:data.meta.masterSha256,...terrainIdentity(variant,data.meta.terrainSha256)};},sample:(x:number,z:number)=>({canonical:grid.surface(x,z),rendered:terrain.surface(x,z),water:waterAt(data,x,z)}),decks:decks.map(d=>({id:d.id,a:d.a.toArray(),b:d.b.toArray(),level:d.level})),moveForTest(dx:number,dz:number){stepWalk(dx,dz);}};
Object.assign(window,{__auroraR02B:qa});if(variant)Object.assign(window,{__auroraVariant:variant});if(review.presets)Object.assign(window,{__auroraReview:{...review,clay:reviewState}});
