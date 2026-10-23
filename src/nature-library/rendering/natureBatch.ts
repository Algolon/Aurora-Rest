import * as THREE from 'three';
import type {BirchFamily,BirchVariant,BirchLod} from '../index.ts';
import {BIRCH_LODS,selectTreeLod} from '../lod.ts';
import {LEAF_TINT} from '../geometry.ts';
import {getBatchCapabilities,resolveBatchMode,type RenderMode,type ActiveMode} from './capabilities.ts';
import {cameraFrustum,classifyVisibility,shadowDirection,DEFAULT_VISIBILITY_DISTANCE} from './visibility.ts';
import {InstancedNatureRenderer,type BatchBackend,type RenderRecord} from './instancedRenderer.ts';
import {BatchedNatureRenderer} from './batchedRenderer.ts';
export interface BirchInstance {
 variant:BirchVariant;position:readonly [number,number,number];
 rotationY?:number;scale?:number;tint?:THREE.ColorRepresentation;visible?:boolean;
}
interface InternalInstance {
 id:number;variant:BirchVariant;position:THREE.Vector3;rotationY:number;scale:number;
 tint:THREE.Color;color:THREE.Color;matrix:THREE.Matrix4;visible:boolean;level:number;changed:boolean;
}
export interface VegetationFamily {
 readonly material:THREE.MeshLambertMaterial;
 getGeometry(variant:BirchVariant,lod:BirchLod):THREE.BufferGeometry;
}
export interface SpeciesBatchOptions {
 scene:THREE.Scene;renderer:THREE.WebGLRenderer;family:VegetationFamily;
 species:string;referenceTint:THREE.ColorRepresentation;
 mode?:RenderMode;capacity?:number;visibilityDistance?:number;
 shadows?:boolean;culling?:boolean;forcedLod?:BirchLod|null;
}
export type BirchBatchOptions=Omit<SpeciesBatchOptions,'species'|'referenceTint'>&{family:BirchFamily};
export interface BirchBatchStats {
 mode:ActiveMode;registered:number;cameraVisible:number;shadowRetained:number;excluded:number;
 lodCounts:Record<BirchLod,number>;renderGroups:number;visibleTriangles:number;
 lastUpdateMs:number;bufferUpdates:number;reallocations:number;geometries:number;
}
const geomLods=['near','mid','far'] as const;
const orientation=new THREE.Quaternion(),axis=new THREE.Vector3(0,1,0),scaleVector=new THREE.Vector3();
const cameraPos=new THREE.Vector3(),worldCenter=new THREE.Vector3(),sphere=new THREE.Sphere();
export function relativeInstanceColor(tint:THREE.Color,refTint:THREE.Color):THREE.Color {
 // ASSET-01B1 already multiplies the bark-compensated mesh geometry by leaf tint
 // at the shared material level. Instances must contribute ONLY the relative tint.
 return new THREE.Color(tint.r/refTint.r,tint.g/refTint.g,tint.b/refTint.b);
}
export class NatureSpeciesBatch {
 readonly mode:ActiveMode;
 readonly objects:readonly THREE.Mesh[];
 private readonly backend:BatchBackend&{setShadowEnabled(value:boolean):void};
 private readonly geometries:THREE.BufferGeometry[];
 private readonly instances:InternalInstance[]=[];
 private readonly baselineMaterial:THREE.MeshLambertMaterial;
 private readonly referenceColor:THREE.Color;
 private nextId=0;private dirty=true;private disposed=false;
 private lastView=new THREE.Matrix4();private lastProjection=new THREE.Matrix4();
 private lastSun=new THREE.Vector3(Number.POSITIVE_INFINITY,0,0);
 private lastShadow=false;private lastCulling=false;private lastDistance=-1;private lastForced:BirchLod|null=null;
 private visibilityDistance:number;private culling:boolean;private shadows:boolean;private forcedLod:BirchLod|null;
 private lastStats:BirchBatchStats;
 private readonly opts:SpeciesBatchOptions;
 constructor(opts:SpeciesBatchOptions){
  this.opts=opts;
  const {scene,renderer,family}=opts;
  if(!opts.species||!opts.referenceTint)throw Error('Species and reference tint required');
  this.mode=resolveBatchMode(opts.mode??'auto',getBatchCapabilities(renderer));
  this.visibilityDistance=opts.visibilityDistance??DEFAULT_VISIBILITY_DISTANCE;
  this.culling=opts.culling??true;this.shadows=opts.shadows??true;this.forcedLod=opts.forcedLod??null;
  this.baselineMaterial=family.material;
  this.referenceColor=new THREE.Color(opts.referenceTint);
  // Material-local colors are immutable throughout batch updates. The only
  // instance color is a multiplier RELATIVE to this species reference tint.
  const depth:unknown=family.material.userData.vegetationDepth;
  if(!(depth instanceof THREE.MeshDepthMaterial))throw new Error('Source-faithful vegetation depth material missing');
  this.geometries=([0,1,2] as const).flatMap(v=>geomLods.map(l=>family.getGeometry(v,l)));
  if(this.geometries.length!==9||this.geometries.some(g=>!g.index))throw new Error('Expected nine indexed source-faithful geometries');
  this.backend=this.mode==='multidraw'
   ? new BatchedNatureRenderer(scene,this.geometries,family.material,depth,opts.capacity??1100,this.shadows)
   : new InstancedNatureRenderer(scene,this.geometries,family.material,depth,this.shadows);
  this.objects=this.backend.objects;
  this.lastStats=this.emptyStats();
 }
 private emptyStats():BirchBatchStats{return {mode:this.mode,registered:0,cameraVisible:0,shadowRetained:0,excluded:0,lodCounts:{near:0,mid:0,far:0,xfar:0},renderGroups:0,visibleTriangles:0,lastUpdateMs:0,bufferUpdates:0,reallocations:0,geometries:9}}
 private assertLive(){if(this.disposed)throw Error('NatureSpeciesBatch disposed')}
 private get(id:number){this.assertLive();const it=this.instances[id];if(!it)throw RangeError('Unknown instance ID '+id);return it}
 private configure(item:InternalInstance,s:BirchInstance){
  if(!Number.isFinite(s.scale??1)||(s.scale??1)<=0)throw RangeError('Tree scale must be positive and finite');
  item.position.set(...s.position);item.rotationY=s.rotationY??0;item.scale=s.scale??1;
  item.variant=s.variant;item.tint=new THREE.Color(s.tint??this.referenceColor);
  item.color=relativeInstanceColor(item.tint,this.referenceColor);
  orientation.setFromAxisAngle(axis,item.rotationY);
  item.matrix.compose(item.position,orientation,scaleVector.setScalar(item.scale));
  item.visible=s.visible!==false;item.changed=true;this.dirty=true;
 }
 add(s:BirchInstance):number{
  this.assertLive();if(![0,1,2].includes(s.variant))throw RangeError('Unknown variant');
  if(this.mode==='multidraw'&&this.instances.length>=(this.opts.capacity??1100))throw RangeError('BatchedMesh instance capacity exceeded');
  const id=this.nextId++;
  const it:InternalInstance={id,variant:s.variant,position:new THREE.Vector3(),rotationY:0,scale:1,tint:new THREE.Color(),color:new THREE.Color(),matrix:new THREE.Matrix4(),visible:true,level:0,changed:true};
  this.configure(it,s);this.instances.push(it);return id;
 }
 setTransform(id:number,s:Pick<BirchInstance,'position'|'rotationY'|'scale'>){
  const it=this.get(id);this.configure(it,{variant:it.variant,position:s.position,rotationY:s.rotationY??it.rotationY,scale:s.scale??it.scale,tint:it.tint,visible:it.visible});
 }
 setTint(id:number,tint:THREE.ColorRepresentation){const it=this.get(id);it.tint.set(tint);it.color=relativeInstanceColor(it.tint,this.referenceColor);it.changed=true;this.dirty=true;}
 setVisible(id:number,visible:boolean){const it=this.get(id);if(it.visible!==visible){it.visible=visible;it.changed=true;this.dirty=true}}
 setVariant(id:number,variant:BirchVariant){const it=this.get(id);if(![0,1,2].includes(variant))throw RangeError('Unknown birch variant');if(it.variant!==variant){it.variant=variant;it.changed=true;this.dirty=true}}
 setForcedLod(lod:BirchLod|null){this.assertLive();this.forcedLod=lod;this.dirty=true}
 setCulling(enabled:boolean){this.assertLive();this.culling=enabled;this.dirty=true}
 setShadows(enabled:boolean){this.assertLive();this.shadows=enabled;this.backend.setShadowEnabled(enabled);this.dirty=true}
 setVisibilityDistance(distance:number){this.assertLive();this.visibilityDistance=distance;this.dirty=true}
 update(camera:THREE.Camera):BirchBatchStats{
  this.assertLive();
  const t0=performance.now();camera.updateMatrixWorld();
  const proj=camera.projectionMatrix,view=camera.matrixWorldInverse;
  const sun=this.shadows?this.findSun():null;
  const dir=shadowDirection(sun);
  const changedSun=!!dir?!dir.equals(this.lastSun):this.lastSun.x!==Number.POSITIVE_INFINITY;
  const changed=this.dirty||!this.lastView.equals(view)||!this.lastProjection.equals(proj)
   ||changedSun||this.lastShadow!==this.shadows||this.lastCulling!==this.culling
   ||this.lastDistance!==this.visibilityDistance||this.lastForced!==this.forcedLod;
  if(!changed)return {...this.lastStats,lastUpdateMs:0};
  this.dirty=false;this.lastView.copy(view);this.lastProjection.copy(proj);
  this.lastSun.copy(dir??new THREE.Vector3(Number.POSITIVE_INFINITY,0,0));this.lastShadow=this.shadows;
  this.lastCulling=this.culling;this.lastDistance=this.visibilityDistance;this.lastForced=this.forcedLod;
  const f=cameraFrustum(camera);cameraPos.setFromMatrixPosition(camera.matrixWorld);
  const stats=this.emptyStats();stats.registered=this.instances.length;
  const records:RenderRecord[]=[];
  for(const it of this.instances){
   const distance=cameraPos.distanceTo(it.position);
   const next=this.forcedLod?BIRCH_LODS.indexOf(this.forcedLod):selectTreeLod(distance,it.level);
   if(next!==it.level){it.level=next;it.changed=true}
   const lod=BIRCH_LODS[it.level];
   const gi=it.variant*3+Math.min(it.level,2);
   const g=this.geometries[gi];if(!g.boundingSphere)g.computeBoundingSphere();
   const local=g.boundingSphere!;worldCenter.copy(local.center).applyMatrix4(it.matrix);
   sphere.radius=local.radius*it.scale;
   const classification=it.visible?classifyVisibility(f,worldCenter,sphere.radius,distance,this.visibilityDistance,dir,this.culling):'excluded';
   const active=classification!=='excluded';
   if(classification==='camera')stats.cameraVisible++;
   if(classification==='shadow')stats.shadowRetained++;
   if(!active)stats.excluded++;
   if(active){stats.lodCounts[lod]++;stats.visibleTriangles+=(g.index?.count??0)/3;}
   records.push({id:it.id,geo:gi,matrix:it.matrix,color:it.color,active,changed:it.changed});
   it.changed=false;
  }
  this.backend.sync(records);
  stats.renderGroups=this.backend.objects.filter(o=>o.visible).length;
  stats.bufferUpdates=this.backend.getBufferUpdates();stats.reallocations=this.backend.getReallocations();
  stats.lastUpdateMs=performance.now()-t0;this.lastStats=stats;return {...stats};
 }
 private findSun():THREE.DirectionalLight|null{
  let sun:THREE.DirectionalLight|null=null;
  this.opts.scene.traverse(o=>{if(!sun&&(o as THREE.DirectionalLight).isDirectionalLight&&(o as THREE.DirectionalLight).castShadow)sun=o as THREE.DirectionalLight});
  return sun;
 }
 getStats(){return {...this.lastStats,lodCounts:{...this.lastStats.lodCounts}}}
 dispose(){if(this.disposed)return;this.backend.dispose();this.instances.length=0;this.disposed=true;
  // Family owns all 9 original geometries and the shared cached colour/depth
  // materials; the batch owns only its buffer allocations and scene objects.
 }
}
// Compatibility: original ASSET-01B2 clients and benchmarks retain the same API.
export {NatureSpeciesBatch as BirchBatch};
export function createBirchBatch(opts:BirchBatchOptions){return new NatureSpeciesBatch({...opts,species:'birch',referenceTint:LEAF_TINT.birch})}
export function createSpeciesBatch(opts:SpeciesBatchOptions){return new NatureSpeciesBatch(opts)}
