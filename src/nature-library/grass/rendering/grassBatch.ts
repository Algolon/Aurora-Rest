// POP-02A compatibility extension: optional terrain orientation; geometry/material/fade unchanged.
import * as THREE from 'three';
import type {GrassFamily,GrassVariant} from '../index.ts';
import {getBatchCapabilities,resolveBatchMode,type RenderMode,type ActiveMode} from '../../rendering/capabilities.ts';
import {grassScaleFade,GRASS_FADE_PRESETS,type FadePreset,type GrassFadeConfig} from './grassFade.ts';

export interface GrassInstance {
 variant:GrassVariant;position:readonly [number,number,number];rotationY?:number;
 orientation?:readonly [number,number,number,number];fadeOffset?:number;
 scale?:number;brightness?:number;tint?:THREE.ColorRepresentation;visible?:boolean;
}
interface Stored {
 id:number;variant:GrassVariant;position:THREE.Vector3;rotationY:number;scale:number;orientation:THREE.Quaternion;
 color:THREE.Color;visible:boolean;dirty:boolean;lastFade:number;fadeOffset:number;matrix:THREE.Matrix4;
}
interface RecordItem {id:number;variant:GrassVariant;matrix:THREE.Matrix4;color:THREE.Color;active:boolean;dirty:boolean}
interface Backend {
 objects:readonly THREE.Mesh[];
 sync(records:readonly RecordItem[]):void;
 shadow(enabled:boolean):void;
 dispose():void;
 readonly bufferUpdates:number;
 readonly reallocations:number;
 readonly groups:number;
}
interface GrassGroup {mesh:THREE.InstancedMesh;capacity:number;ids:number[];geometry:THREE.BufferGeometry}
class InstancedGrassBackend implements Backend {
 readonly objects:THREE.Mesh[]=[];private readonly groupsByVariant:GrassGroup[]=[];
 bufferUpdates=0;reallocations=0;
 private scene:THREE.Scene;private material:THREE.MeshLambertMaterial;
 constructor(scene:THREE.Scene,geometries:readonly THREE.BufferGeometry[],material:THREE.MeshLambertMaterial,castShadow:boolean){
  this.scene=scene;this.material=material;
  for(const geo of geometries){
   const group:GrassGroup={mesh:null as unknown as THREE.InstancedMesh,capacity:8,ids:[],geometry:geo};
   group.mesh=this.makeMesh(group,8,castShadow);this.groupsByVariant.push(group);
  }
 }
 private makeMesh(group:GrassGroup,capacity:number,castShadow:boolean):THREE.InstancedMesh{
  const mesh=new THREE.InstancedMesh(group.geometry,this.material,capacity);
  mesh.name='grass-instanced';mesh.count=0;mesh.visible=false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(capacity*3),3).setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled=false;mesh.castShadow=castShadow;mesh.receiveShadow=true;
  this.scene.add(mesh);this.objects.push(mesh);return mesh;
 }
 private grow(g:GrassGroup,needed:number){
  const old=g.mesh,index=this.objects.indexOf(old),shadow=old.castShadow;
  old.removeFromParent();old.dispose();this.objects.splice(index,1);
  g.capacity=2**Math.ceil(Math.log2(Math.max(8,needed)));
  g.mesh=this.makeMesh(g,g.capacity,shadow);this.reallocations++;
 }
 sync(records:readonly RecordItem[]){
  const buckets:RecordItem[][]=[[],[],[],[]];
  for(const rec of records)if(rec.active)buckets[rec.variant].push(rec);
  this.groupsByVariant.forEach((g,v)=>{
   const rows=buckets[v],ids=rows.map(r=>r.id);
   const need=ids.length!==g.ids.length||ids.some((id,i)=>id!==g.ids[i])||rows.some(r=>r.dirty);
   const expanding=rows.length>g.capacity;
   if(expanding)this.grow(g,rows.length);
   g.mesh.count=rows.length;g.mesh.visible=rows.length>0;
   if(!need&&!expanding)return;
   g.ids=ids;
   rows.forEach((r,i)=>{g.mesh.setMatrixAt(i,r.matrix);g.mesh.setColorAt(i,r.color)});
   if(rows.length){
    g.mesh.instanceMatrix.clearUpdateRanges();g.mesh.instanceMatrix.addUpdateRange(0,rows.length*16);g.mesh.instanceMatrix.needsUpdate=true;
    g.mesh.instanceColor!.clearUpdateRanges();g.mesh.instanceColor!.addUpdateRange(0,rows.length*3);g.mesh.instanceColor!.needsUpdate=true;
    this.bufferUpdates+=2;
   }
  });
 }
 get groups(){return this.groupsByVariant.filter(g=>g.mesh.visible).length}
 shadow(enabled:boolean){for(const g of this.groupsByVariant)g.mesh.castShadow=enabled}
 dispose(){for(const g of this.groupsByVariant){g.mesh.removeFromParent();g.mesh.dispose()}this.objects.length=0;this.groupsByVariant.length=0}
}
class BatchedGrassBackend implements Backend {
 readonly objects:readonly THREE.Mesh[];
 private mesh:THREE.BatchedMesh;
 private geometryHandles:number[]=[];
 private ids=new Map<number,number>();
 private cache=new Map<number,{variant:number;active:boolean}>();
 bufferUpdates=0;reallocations=0;
 constructor(scene:THREE.Scene,geos:readonly THREE.BufferGeometry[],material:THREE.MeshLambertMaterial,capacity:number,castShadow:boolean){
  const maxVertices=geos.reduce((sum,g)=>sum+g.getAttribute('position').count,0);
  const maxIndices=geos.reduce((sum,g)=>sum+(g.index?.count??0),0);
  // Source production grass is non-indexed; BatchedMesh supports an unindexed geometry store.
  this.mesh=new THREE.BatchedMesh(capacity,maxVertices,maxIndices,material);
  this.mesh.name='grass-multidraw';this.mesh.frustumCulled=false;this.mesh.sortObjects=false;
  this.mesh.castShadow=castShadow;this.mesh.receiveShadow=true;this.mesh.visible=false;
  this.geometryHandles=geos.map(g=>this.mesh.addGeometry(g));
  scene.add(this.mesh);this.objects=[this.mesh];
 }
 sync(records:readonly RecordItem[]){
  this.mesh.visible=records.some(r=>r.active);
  for(const r of records){
   let handle=this.ids.get(r.id);
   if(handle===undefined){
    handle=this.mesh.addInstance(this.geometryHandles[r.variant]);
    this.ids.set(r.id,handle);
    this.mesh.setMatrixAt(handle,r.matrix);this.mesh.setColorAt(handle,r.color);
    this.mesh.setVisibleAt(handle,r.active);
    this.cache.set(r.id,{variant:r.variant,active:r.active});this.bufferUpdates+=3;continue;
   }
   const prev=this.cache.get(r.id)!;
   if(prev.variant!==r.variant){this.mesh.setGeometryIdAt(handle,this.geometryHandles[r.variant]);this.bufferUpdates++}
   if(prev.active!==r.active){this.mesh.setVisibleAt(handle,r.active);this.bufferUpdates++}
   if(r.dirty){this.mesh.setMatrixAt(handle,r.matrix);this.mesh.setColorAt(handle,r.color);this.bufferUpdates+=2}
   prev.variant=r.variant;prev.active=r.active;
  }
 }
 get groups(){return this.mesh.visible?1:0}
 shadow(enabled:boolean){this.mesh.castShadow=enabled}
 dispose(){this.mesh.removeFromParent();this.mesh.dispose();this.ids.clear();this.cache.clear()}
}
export interface GrassBatchOptions {
 scene:THREE.Scene;renderer:THREE.WebGLRenderer;family:GrassFamily;
 mode?:RenderMode;capacity?:number;fade?:GrassFadeConfig|FadePreset;
 shadows?:boolean;culling?:boolean;distanceCulling?:boolean;
}
export interface GrassBatchStats {
 mode:ActiveMode;registered:number;visible:number;culled:number;fadeZone:number;
 renderGroups:number;visibleTriangles:number;lastUpdateMs:number;bufferUpdates:number;
 reallocations:number;geometries:number;
}
const Y=new THREE.Vector3(0,1,0),Q=new THREE.Quaternion();
const S=new THREE.Vector3(),P=new THREE.Vector3(),M=new THREE.Matrix4();
const F=new THREE.Frustum(),SP=new THREE.Sphere(),C=new THREE.Vector3();
export class GrassBatch {
 readonly mode:ActiveMode;readonly objects:readonly THREE.Mesh[];
 private readonly entries:Stored[]=[];
 private readonly geometry:THREE.BufferGeometry[];
 private readonly backend:Backend;
 private readonly capacity:number;
 private nextId=0;private disposed=false;
 private hasPreviousCamera=false;private needsUpdate=true;
 private readonly previousView=new THREE.Matrix4();
 private readonly previousProjection=new THREE.Matrix4();
 private config:GrassFadeConfig;private culling:boolean;private distanceCulling:boolean;private shadows:boolean;
 private stats:GrassBatchStats;
 constructor(opts:GrassBatchOptions){
  if(opts.family.preset!=='flw-production-reference')throw Error('Batching requires validated production grass');
  this.capacity=opts.capacity??10000;
  if(!Number.isInteger(this.capacity)||this.capacity<1)throw RangeError('Invalid grass capacity');
  this.mode=resolveBatchMode(opts.mode??'auto',getBatchCapabilities(opts.renderer));
  this.config=typeof opts.fade==='string'?{...GRASS_FADE_PRESETS[opts.fade]}:{...(opts.fade??GRASS_FADE_PRESETS.source)};
  this.culling=opts.culling??true;this.distanceCulling=opts.distanceCulling??true;this.shadows=opts.shadows??false;
  this.geometry=([0,1,2,3] as const).map(v=>opts.family.getGeometry(v));
  for(const g of this.geometry)if(!g.boundingSphere)g.computeBoundingSphere();
  this.backend=this.mode==='multidraw'
   ?new BatchedGrassBackend(opts.scene,this.geometry,opts.family.material,this.capacity,this.shadows)
   :new InstancedGrassBackend(opts.scene,this.geometry,opts.family.material,this.shadows);
  this.objects=this.backend.objects;
  this.stats=this.empty();
 }
 private empty():GrassBatchStats{return {mode:this.mode,registered:this.entries.length,visible:0,culled:0,fadeZone:0,renderGroups:0,visibleTriangles:0,lastUpdateMs:0,bufferUpdates:0,reallocations:0,geometries:4}}
 private live(){if(this.disposed)throw Error('GrassBatch disposed')}
 private get(id:number){this.live();const e=this.entries[id];if(!e)throw RangeError('Unknown grass ID '+id);return e}
 private configure(e:Stored,value:GrassInstance){
  const scale=value.scale??1,rotationY=value.rotationY??0,brightness=value.brightness??1;
  if(![...value.position,scale,rotationY,brightness].every(Number.isFinite)||scale<=0||brightness<=0||brightness>2)throw RangeError('Invalid grass transform/brightness');
  if(![0,1,2,3].includes(value.variant))throw RangeError('Invalid grass variant');
  if(value.orientation){if(!value.orientation.every(Number.isFinite)||Math.abs(Math.hypot(...value.orientation)-1)>.001)throw RangeError('Invalid grass orientation');e.orientation.fromArray(value.orientation);}
  e.variant=value.variant;e.position.set(...value.position);e.scale=scale;e.rotationY=rotationY;
  e.color.set(value.tint??0xffffff).multiplyScalar(brightness);e.visible=value.visible!==false;e.dirty=true;this.needsUpdate=true;
 }
 add(value:GrassInstance):number{
  this.live();if(this.entries.length>=this.capacity)throw RangeError('GrassBatch capacity exceeded');
  const id=this.nextId++;
  const e:Stored={id,variant:0,position:new THREE.Vector3(),scale:1,rotationY:0,orientation:new THREE.Quaternion(),color:new THREE.Color(),
   visible:true,dirty:true,lastFade:-1,fadeOffset:0,matrix:new THREE.Matrix4()};
  const pseudo=Math.sin((id+1)*78.233+13.41)*43758.5453;
  e.fadeOffset=2*(pseudo-Math.floor(pseudo)) - 1;
  if(value.fadeOffset!==undefined){if(!Number.isFinite(value.fadeOffset)||Math.abs(value.fadeOffset)>1)throw RangeError('Invalid stable grass fade offset');e.fadeOffset=value.fadeOffset;}
  this.configure(e,value);this.entries.push(e);return id;
 }
 setTransform(id:number,patch:Pick<GrassInstance,'position'|'scale'|'rotationY'>){
  const e=this.get(id);
  this.configure(e,{variant:e.variant,position:patch.position,scale:patch.scale??e.scale,
   rotationY:patch.rotationY??e.rotationY,tint:e.color,visible:e.visible});
 }
 setVisible(id:number,visible:boolean){const e=this.get(id);if(e.visible!==visible){e.visible=visible;e.dirty=true;this.needsUpdate=true}}
 setVariant(id:number,variant:GrassVariant){const e=this.get(id);if(![0,1,2,3].includes(variant))throw RangeError('Invalid grass variant');if(e.variant!==variant){e.variant=variant;e.dirty=true;this.needsUpdate=true}}
 setBrightness(id:number,brightness:number){const e=this.get(id);if(!(brightness>0&&brightness<=2))throw RangeError('Invalid brightness');e.color.setRGB(brightness,brightness,brightness);e.dirty=true;this.needsUpdate=true}
 setFade(fade:GrassFadeConfig|FadePreset){this.live();
  const next=typeof fade==='string'?{...GRASS_FADE_PRESETS[fade]}:{...fade};
  if(JSON.stringify(next)===JSON.stringify(this.config))return;
  this.config=next;this.entries.forEach(e=>e.dirty=true);this.needsUpdate=true;
 }
 setCulling(value:boolean){this.live();if(this.culling!==value){this.culling=value;this.needsUpdate=true}}
 setDistanceCulling(value:boolean){this.live();if(this.distanceCulling!==value){this.distanceCulling=value;this.needsUpdate=true}}
 setShadows(value:boolean){this.live();if(this.shadows!==value){this.shadows=value;this.backend.shadow(value);this.needsUpdate=true}}
 update(camera:THREE.Camera):GrassBatchStats{
  this.live();const t0=performance.now();
  camera.updateMatrixWorld();
  if(this.hasPreviousCamera&&!this.needsUpdate
    &&this.previousView.equals(camera.matrixWorldInverse)
    &&this.previousProjection.equals(camera.projectionMatrix)){
    this.stats={...this.stats,lastUpdateMs:0};return {...this.stats};
  }
  this.previousView.copy(camera.matrixWorldInverse);this.previousProjection.copy(camera.projectionMatrix);
  this.hasPreviousCamera=true;this.needsUpdate=false;
  P.setFromMatrixPosition(camera.matrixWorld);
  if(this.culling)F.setFromProjectionMatrix(M.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  const records:RecordItem[]=[],stats=this.empty();
  for(const e of this.entries){
   const distance=P.distanceTo(e.position);
   const k=this.distanceCulling?grassScaleFade(distance,this.config,e.fadeOffset):1;
   const activeScale=e.scale*k;
   const geo=this.geometry[e.variant];const bound=geo.boundingSphere!;
   Q.setFromAxisAngle(Y,e.rotationY).premultiply(e.orientation);
   // Apply every instance transform, including fade, before spatial classification.
   const dirty=e.dirty||k!==e.lastFade;
   if(dirty){e.matrix.compose(e.position,Q,S.setScalar(activeScale));e.lastFade=k}
   const center=C.copy(bound.center).applyMatrix4(e.matrix);
   SP.center.copy(center);SP.radius=bound.radius*activeScale;
   const active=e.visible&&k>0&&(!this.culling||F.intersectsSphere(SP));
   if(active){
    stats.visible++;stats.visibleTriangles+=(geo.index?.count??geo.getAttribute('position').count)/3;
    if(this.distanceCulling&&distance>this.config.visibilityDistance-this.config.fadeDistance)stats.fadeZone++;
   }else stats.culled++;
   records.push({id:e.id,variant:e.variant,matrix:e.matrix,color:e.color,active,dirty});
   e.dirty=false;
  }
  this.backend.sync(records);
  stats.renderGroups=this.backend.groups;stats.bufferUpdates=this.backend.bufferUpdates;
  stats.reallocations=this.backend.reallocations;stats.lastUpdateMs=performance.now()-t0;
  this.stats=stats;return {...stats};
 }
 getStats(){return {...this.stats}}
 dispose(){if(this.disposed)return;this.disposed=true;this.backend.dispose();this.entries.length=0;
  // The caller owns the shared GrassFamily. No source geometries/materials disposed here.
 }
}
export function createGrassBatch(options:GrassBatchOptions){return new GrassBatch(options)}
