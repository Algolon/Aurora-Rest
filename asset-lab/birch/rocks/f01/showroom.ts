import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {loadNordicRockFamily,ROCK_ARCHETYPES,ROCK_ASSETS,type RockArchetype} from './rockFamily.ts';
import {createPilotLayout,demoGroundHeight,trailX,ZONES,type ZoneId} from './pilotLayout.ts';
import {createBirchFamily} from '../../src/index.ts';
import {createPineFamily} from '../../src/pine/index.ts';
import {createGrassFamily} from '../../src/grass/index.ts';
import {generateNaturalGrassPlacement} from '../../src/grass/naturalGroundCover.ts';
import {createMeadowGroundTexture} from '../../src/grass/meadowGround.ts';
import {mulberry32} from '../../src/rng.ts';
const css=document.createElement('style');css.textContent=`*{box-sizing:border-box}body{margin:0;overflow:hidden;background:#bacbd1;color:#e8eeeb;font:13px system-ui}canvas{display:block}header{position:absolute;left:24px;top:22px;background:#20332fc9;border:1px solid #ffffff24;border-radius:4px;padding:13px 17px;pointer-events:none}h1{font-size:16px;letter-spacing:.14em;margin:0 0 5px}header small{font-size:10px;letter-spacing:.1em;color:#c7d7ce}nav{position:absolute;right:24px;top:22px;display:flex;gap:7px}select{color:#e7efe9;background:#23382fe8;border:1px solid #bccdc16b;border-radius:4px;padding:8px}footer{position:absolute;bottom:22px;left:24px;right:24px;display:flex;justify-content:space-between;align-items:end;pointer-events:none}#caption,#stats{background:#20332fdd;border:1px solid #ffffff24;border-radius:4px;padding:12px 16px;white-space:pre-line}#caption{font-size:14px}#stats{font:10px/1.5 monospace;text-align:right}body[data-capture=true] nav{display:none}`;document.head.append(css);
document.body.insertAdjacentHTML('beforeend','<header><h1>AURORA REST / NORDIC ROCKS</h1><small>F01 · THREE REAL GLB ARCHETYPES · GOOD-ENOUGH ENVIRONMENT PILOT</small></header><nav><select id="mode"><option>overview</option><option>woodland</option><option>glacial</option><option>foothill</option><option>family</option><option>R2</option><option>R3</option><option>performance</option></select><select id="view"><option>elevated</option><option>human</option><option>front</option><option>rear</option><option>left</option><option>right</option><option>top</option></select><select id="surface"><option>T1</option><option>neutral</option></select><select id="renderMode"><option>instanced</option><option>meshes</option></select></nav><footer><div id="caption"></div><div id="stats"></div></footer>');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.body.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#b7cbd2');scene.fog=new THREE.Fog('#b7cbd2',65,125);
const camera=new THREE.PerspectiveCamera(46,innerWidth/innerHeight,.1,240);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=2;controls.maxDistance=125;
scene.add(new THREE.HemisphereLight('#e1edf1','#657157',1.8));
const sun=new THREE.DirectionalLight('#fff1d4',2.7);sun.position.set(-30,45,24);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-63,right:63,top:48,bottom:-48,near:.1,far:140});sun.shadow.normalBias=.025;sun.shadow.bias=-.00008;scene.add(sun);
const fill=new THREE.DirectionalLight('#c0d9e2',.45);fill.position.set(30,16,-25);scene.add(fill);
const family=await loadNordicRockFamily();
const neutral=new THREE.MeshStandardMaterial({color:'#a6adb1',roughness:.95});
const layout=createPilotLayout();
const world=new THREE.Group(),rockInstances=new THREE.Group(),rockMeshes=new THREE.Group(),studio=new THREE.Group();scene.add(world,studio);world.add(rockInstances,rockMeshes);
for(const id of ROCK_ARCHETYPES){const rows=layout.filter(p=>p.archetype===id);rockInstances.add(family.createInstances(id,rows));for(const row of rows)rockMeshes.add(family.createMesh(id,row));}
const single:Record<'R2'|'R3',THREE.Mesh>={R2:family.createMesh('broadGlacial'),R3:family.createMesh('sculptural')};studio.add(single.R2,single.R3);
const trio=new THREE.Group();studio.add(trio);
for(const [i,id] of ROCK_ARCHETYPES.entries()){const m=family.createMesh(id,{position:[[-6.2,0,6.3][i],0,0]});m.receiveShadow=false;trio.add(m);}
const studioFloorMaterial=new THREE.MeshStandardMaterial({color:'#929c9f',roughness:1});const studioFloor=new THREE.Mesh(new THREE.PlaneGeometry(250,250),studioFloorMaterial);studioFloor.rotation.x=-Math.PI/2;studioFloor.position.y=-.008;studioFloor.receiveShadow=true;studio.add(studioFloor);
const groundTexture=createMeadowGroundTexture(10101);groundTexture.wrapS=groundTexture.wrapT=THREE.RepeatWrapping;groundTexture.repeat.set(4,3);
const terrainGeometry=new THREE.PlaneGeometry(140,110,140,110);terrainGeometry.rotateX(-Math.PI/2);const pos=terrainGeometry.getAttribute('position');const colors=[];
for(let i=0;i<pos.count;i++){
 const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,demoGroundHeight(x,z));let path=0;
 for(const [id,def] of Object.entries(ZONES) as [ZoneId,typeof ZONES[ZoneId]][]){if(Math.abs(x-def.center[0])<14&&Math.abs(z-def.center[1])<14){const d=Math.abs(x-trailX(id,z));path=Math.max(path,THREE.MathUtils.smoothstep(1.8-d,0,.8));}}
 const base=new THREE.Color('#a6b494'),earth=new THREE.Color('#c8baa0');base.lerp(earth,path*.90);colors.push(base.r,base.g,base.b);
}
terrainGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrainGeometry.computeVertexNormals();const terrainMaterial=new THREE.MeshStandardMaterial({map:groundTexture,color:'#e6e4cb',roughness:1,vertexColors:true});const terrain=new THREE.Mesh(terrainGeometry,terrainMaterial);terrain.receiveShadow=true;world.add(terrain);
const birches=createBirchFamily(),pines=createPineFamily(),grass=createGrassFamily();
const scenery=new THREE.Group();world.add(scenery);let treeCount=0;
const trees:Record<ZoneId,readonly (readonly [number,number,'birch'|'pine'])[]>={woodland:[[-11,-8,'birch'],[-6,-10,'pine'],[6,-9,'birch'],[12,-6,'pine'],[-12,2,'birch'],[-10,9,'pine'],[-5,11,'birch'],[7,10,'birch'],[12,4,'pine'],[9,0,'birch'],[-8,-2,'birch'],[5,6,'pine']],glacial:[[-12,-9,'pine'],[-10,10,'birch'],[11,11,'pine'],[13,-4,'birch']],foothill:[[-12,-9,'pine'],[-11,7,'pine'],[-5,11,'birch'],[7,11,'pine'],[12,5,'pine'],[11,-9,'birch'],[5,-12,'pine']]};
const random=mulberry32(10101);
for(const [zone,anchors] of Object.entries(trees) as [ZoneId,typeof trees[ZoneId]][]){for(const [dx,dz,kind] of anchors){const x=ZONES[zone].center[0]+dx+(random()-.5),z=ZONES[zone].center[1]+dz+(random()-.5);if(layout.some(p=>Math.hypot(p.position[0]-x,p.position[2]-z)<p.radius+.65))continue;const mesh=kind==='birch'?birches.createMesh((treeCount%3) as 0|1|2,'near'):pines.createMesh((treeCount%3) as 0|1|2,'near');mesh.position.set(x,demoGroundHeight(x,z)-.035,z);mesh.rotation.y=random()*Math.PI*2;mesh.scale.setScalar(.82+random()*.15);mesh.castShadow=mesh.receiveShadow=true;scenery.add(mesh);treeCount++;}}
const grassRows:{variant:0|1|2|3;matrix:THREE.Matrix4}[]=[];const transform=new THREE.Object3D();
for(const [j,zone] of (Object.keys(ZONES) as ZoneId[]).entries()){
 const placements=generateNaturalGrassPlacement({seed:10101+j*53,count:zone==='woodland'?360:300});
 for(const p of placements){const x=p.position[0]+ZONES[zone].center[0],z=p.position[2]+ZONES[zone].center[1];if(Math.abs(x-trailX(zone,z))<1.15)continue;if(layout.some(r=>Math.hypot(r.position[0]-x,r.position[2]-z)<r.radius*.68))continue;transform.position.set(x,demoGroundHeight(x,z),z);transform.rotation.set(0,p.rotationY,0);transform.scale.setScalar(p.scale*.88);transform.updateMatrix();grassRows.push({variant:p.variant,matrix:transform.matrix.clone()});}
}
const grassBatches:THREE.InstancedMesh[]=[];
for(const variant of [0,1,2,3] as const){const rows=grassRows.filter(r=>r.variant===variant);const batch=new THREE.InstancedMesh(grass.getGeometry(variant),grass.material,rows.length);rows.forEach((r,i)=>batch.setMatrixAt(i,r.matrix));batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();batch.castShadow=false;batch.receiveShadow=true;grassBatches.push(batch);scenery.add(batch);}
let current={mode:'overview',view:'elevated',surface:'T1',renderMode:'instanced'},frames=0;let frameDeltas:number[]=[],renderCpu:number[]=[],lastTime=performance.now();
const byId=(id:string)=>document.getElementById(id)!;
function configure(changes:Partial<typeof current>={}){
 Object.assign(current,changes);for(const key of Object.keys(current) as (keyof typeof current)[])(byId(key) as HTMLSelectElement).value=current[key];
 const standalone=current.mode==='family'||current.mode==='R2'||current.mode==='R3';world.visible=!standalone;studio.visible=standalone;rockInstances.visible=current.renderMode==='instanced';rockMeshes.visible=current.renderMode==='meshes';
 single.R2.visible=current.mode==='R2';single.R3.visible=current.mode==='R3';trio.visible=current.mode==='family';
 for(const group of [rockInstances,rockMeshes,trio])group.traverse(o=>{if(o instanceof THREE.Mesh)o.material=current.surface==='neutral'?neutral:family.material;});single.R2.material=single.R3.material=current.surface==='neutral'?neutral:family.material;
 scene.background=new THREE.Color(standalone?'#c9d0d4':'#b7cbd2');scene.fog=standalone?null:new THREE.Fog('#b7cbd2',current.mode==='overview'||current.mode==='performance'?120:65,current.mode==='overview'||current.mode==='performance'?210:125);
 let eye=new THREE.Vector3(58,38,58),target=new THREE.Vector3(0,1.5,2);
 if(current.mode==='family'){eye.set(8,5.4,18);target.set(0,1.1,0);}
 else if(current.mode==='R2'||current.mode==='R3'){
  const id=current.mode==='R2'?'broadGlacial':'sculptural',d=family.getDimensions(id),distance=Math.max(d.x,d.y,d.z)*1.9;target.set(0,d.y*.45,0);
  const directions:Record<string,number[]>={elevated:[.55,.35,1],front:[0,.03,1],rear:[0,.03,-1],left:[-1,.03,0],right:[1,.03,0],top:[.0001,1,.0001],human:[.3,0,1]};const v=directions[current.view];eye.copy(target).add(new THREE.Vector3(...v as [number,number,number]).multiplyScalar(distance));if(current.view==='human')eye.y=1.7;
 }else if(['woodland','glacial','foothill'].includes(current.mode)){
  const zone=current.mode as ZoneId,[cx,cz]=ZONES[zone].center;target.set(cx,1.3,cz);eye.set(cx+16,18,cz+22);
  if(current.view==='human'){
   const hero=layout.filter(r=>r.zone===zone&&r.position[2]>cz-2).sort((a,b)=>(a.archetype==='compact'?1:0)-(b.archetype==='compact'?1:0))[0];
   const z=cz-13,x=trailX(zone,z);eye.set(x,demoGroundHeight(x,z)+1.7,z);if(hero)target.set(hero.position[0],hero.position[1]+ROCK_ASSETS[hero.archetype].dimensions[1]*.48,hero.position[2]);
  }
 }
 camera.position.copy(eye);controls.target.copy(target);controls.update();camera.updateProjectionMatrix();frameDeltas=[];renderCpu=[];lastTime=performance.now();
 byId('caption').textContent=current.mode==='family'?'R1 COMPACT / R2 BROAD GLACIAL / R3 SCULPTURAL\nThree independently modeled silhouettes · actual metric scale':standalone?`${current.mode} / ${current.surface==='neutral'?'NEUTRAL GEOMETRY REVIEW':'UNCHANGED T1 NORDIC GRANITE'}\n${current.mode==='R2'?'Broad, low glacial mass':'Higher, deeper sculptural erratic'} · ${current.view}`:current.mode==='overview'||current.mode==='performance'?'WOODLAND EDGE / GLACIAL CLEARING / FOOTHILL TRAIL\n34 seeded rocks · approved Aurora birch, Scots pine and ground cover':`${ZONES[current.mode as ZoneId].label.toUpperCase()}\n${current.view==='human'?'Walking height · 1.70 m':'Landscape context'} · shared T1 granite · clear trail`;
 render();updateStats();return stats();
}
function render(){const start=performance.now();renderer.render(scene,camera);renderCpu.push(performance.now()-start);if(renderCpu.length>180)renderCpu.shift();}
function updateStats(){byId('stats').textContent=`${renderer.info.render.calls} whole-frame draws / ${renderer.info.render.triangles.toLocaleString()} triangles\n34 rocks · ${current.renderMode==='instanced'?'3 rock instance groups':'34 ordinary rock meshes'}\n${grassRows.length} grass clumps · ${treeCount} trees · no island integration`;}
function stats(){return {state:{...current},frames,renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures},pack:family.stats(),placedRocks:layout.length,counts:Object.fromEntries(ROCK_ARCHETYPES.map(id=>[id,layout.filter(p=>p.archetype===id).length])),placedRockTriangles:layout.reduce((n,p)=>n+family.stats().uniqueTriangles[p.archetype],0),grassClumps:grassRows.length,trees:treeCount,backend:renderer.getContext().getParameter(renderer.getContext().VERSION),physicalAndroidVerified:false,worldIntegrated:false};}
async function measure(count=45){frameDeltas=[];renderCpu=[];const start=frames;while(frames<start+count)await new Promise(requestAnimationFrame);const sorted=[...frameDeltas].sort((a,b)=>a-b),cpu=[...renderCpu].sort((a,b)=>a-b);return {method:'Headless/browser RAF wall-clock and CPU submission observations; no hardware GPU timer',samples:sorted.length,medianRafMs:sorted[Math.floor(sorted.length/2)],p95RafMs:sorted[Math.floor(sorted.length*.95)],medianRenderSubmissionMs:cpu[Math.floor(cpu.length/2)],...stats()};}
for(const key of Object.keys(current))byId(key).addEventListener('change',()=>configure({[key]:(byId(key) as HTMLSelectElement).value}));
function animate(){const now=performance.now();frameDeltas.push(now-lastTime);lastTime=now;if(frameDeltas.length>180)frameDeltas.shift();controls.update();render();frames++;if(frames%30===0)updateStats();requestAnimationFrame(animate);}
configure();animate();
async function validateResourceLifecycle(){
 const probe=await loadNordicRockFamily();let geometries=0,materials=0,textures=0,instances=0;
 for(const id of ROCK_ARCHETYPES)probe.getGeometry(id).addEventListener('dispose',()=>geometries++);
 probe.material.addEventListener('dispose',()=>materials++);
 for(const texture of new Set([probe.material.map,probe.material.normalMap,probe.material.roughnessMap]))texture?.addEventListener('dispose',()=>textures++);
 const group=new THREE.Group();group.add(probe.createMesh('compact'));
 const batch=probe.createInstances('sculptural',[{position:[0,0,0]}]);batch.addEventListener('dispose',()=>instances++);group.add(batch);
 probe.dispose();probe.dispose();
 return {geometries,materials,textures,instances,remainingChildren:group.children.length,disposed:probe.stats().disposed};
}
Object.assign(window,{__f01Lab:{configure,stats,measure,validateResourceLifecycle,frame:()=>frames,capture(){render();return renderer.domElement.toDataURL('image/png');}}});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
addEventListener('pagehide',()=>{controls.dispose();family.dispose();for(const batch of grassBatches)batch.dispose();birches.dispose();pines.dispose();grass.dispose();terrainGeometry.dispose();terrainMaterial.dispose();groundTexture.dispose();studioFloor.geometry.dispose();studioFloorMaterial.dispose();neutral.dispose();renderer.dispose();});
