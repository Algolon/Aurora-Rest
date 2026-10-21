// ASSET-01C2: two material-compatible species batches sharing ONE LOD, culling,
// GPU-buffer and renderer-controller implementation. No mixed-material BatchedMesh.
// The caller owns the two families and must dispose this forest before either.
import * as THREE from 'three';
import type {BirchFamily,BirchLod} from '../index.ts';
import type {PineFamily} from '../pine/index.ts';
import {LEAF_TINT} from '../geometry.ts';
import {createSpeciesBatch,type BirchInstance,type BirchBatchStats,type NatureSpeciesBatch} from './natureBatch.ts';
import type {RenderMode,ActiveMode} from './capabilities.ts';
export type NatureSpecies='birch'|'pine';
export interface MixedTreeInstance extends BirchInstance {species:NatureSpecies}
export interface MixedForestOptions {
 scene:THREE.Scene;renderer:THREE.WebGLRenderer;
 families:{birch:BirchFamily;pine:PineFamily};
 mode?:RenderMode;capacity?:number;visibilityDistance?:number;
 shadows?:boolean;culling?:boolean;forcedLod?:BirchLod|null;
}
export interface MixedForestStats {
 mode:ActiveMode;registered:number;cameraVisible:number;shadowRetained:number;excluded:number;
 renderGroups:number;visibleTriangles:number;lastUpdateMs:number;bufferUpdates:number;reallocations:number;
 lodCounts:Record<BirchLod,number>;
 species:Record<NatureSpecies,BirchBatchStats>;
}
const emptyCounts=()=>({near:0,mid:0,far:0,xfar:0});
export class NatureBatch {
 readonly mode:ActiveMode;
 private readonly batches:Record<NatureSpecies,NatureSpeciesBatch>;
 private readonly ids=new Map<number,{species:NatureSpecies;id:number}>();
 private nextId=0;
 private disposed=false;
 constructor(opts:MixedForestOptions){
  const shared={scene:opts.scene,renderer:opts.renderer,mode:opts.mode,capacity:opts.capacity,
   visibilityDistance:opts.visibilityDistance,shadows:opts.shadows,culling:opts.culling,forcedLod:opts.forcedLod};
  const birch=createSpeciesBatch({...shared,species:'birch',family:opts.families.birch,referenceTint:LEAF_TINT.birch});
  let pine:NatureSpeciesBatch;
  try{pine=createSpeciesBatch({...shared,species:'pine',family:opts.families.pine,referenceTint:LEAF_TINT.pine});}
  catch(e){birch.dispose();throw e}
  this.batches={birch,pine};this.mode=birch.mode;
  if(pine.mode!==birch.mode){this.dispose();throw Error('Inconsistent species render mode')}
 }
 private live(){if(this.disposed)throw Error('NatureBatch disposed')}
 private entry(id:number){this.live();const e=this.ids.get(id);if(!e)throw RangeError('Unknown global tree ID '+id);return e}
 add(instance:MixedTreeInstance):number{
  this.live();if(instance.species!=='birch'&&instance.species!=='pine')throw RangeError('Unknown species');
  const {species,...tree}=instance;
  const local=this.batches[species].add(tree);
  const id=this.nextId++;this.ids.set(id,{species,id:local});return id;
 }
 // A tree keeps its species for life. Intentional: moving between different
 // materials/geometries requires a removal/reinsertion API, deferred to a later
 // stage rather than silently leaving old GPU instance handles alive.
 setTransform(id:number,transform:Pick<MixedTreeInstance,'position'|'rotationY'|'scale'>){
  const e=this.entry(id);this.batches[e.species].setTransform(e.id,transform);
 }
 setTint(id:number,tint:THREE.ColorRepresentation){const e=this.entry(id);this.batches[e.species].setTint(e.id,tint)}
 setVisible(id:number,visible:boolean){const e=this.entry(id);this.batches[e.species].setVisible(e.id,visible)}
 setVariant(id:number,variant:0|1|2){const e=this.entry(id);this.batches[e.species].setVariant(e.id,variant)}
 getSpecies(id:number):NatureSpecies{return this.entry(id).species}
 setForcedLod(lod:BirchLod|null){this.live();for(const b of Object.values(this.batches))b.setForcedLod(lod)}
 setCulling(value:boolean){this.live();for(const b of Object.values(this.batches))b.setCulling(value)}
 setShadows(value:boolean){this.live();for(const b of Object.values(this.batches))b.setShadows(value)}
 setVisibilityDistance(value:number){this.live();for(const b of Object.values(this.batches))b.setVisibilityDistance(value)}
 get objects():readonly THREE.Mesh[]{this.live();return [...this.batches.birch.objects,...this.batches.pine.objects]}
 getObjects(species:NatureSpecies):readonly THREE.Mesh[]{this.live();return this.batches[species].objects}
 update(camera:THREE.Camera):MixedForestStats{
  this.live();const b=this.batches.birch.update(camera),p=this.batches.pine.update(camera);
  return this.aggregate(b,p);
 }
 getStats():MixedForestStats{
  this.live();return this.aggregate(this.batches.birch.getStats(),this.batches.pine.getStats());
 }
 private aggregate(b:BirchBatchStats,p:BirchBatchStats):MixedForestStats{
  const lodCounts=emptyCounts();
  for(const l of ['near','mid','far','xfar'] as const)lodCounts[l]=b.lodCounts[l]+p.lodCounts[l];
  return {mode:this.mode,registered:b.registered+p.registered,cameraVisible:b.cameraVisible+p.cameraVisible,
   shadowRetained:b.shadowRetained+p.shadowRetained,excluded:b.excluded+p.excluded,
   renderGroups:b.renderGroups+p.renderGroups,visibleTriangles:b.visibleTriangles+p.visibleTriangles,
   lastUpdateMs:b.lastUpdateMs+p.lastUpdateMs,bufferUpdates:b.bufferUpdates+p.bufferUpdates,
   reallocations:b.reallocations+p.reallocations,lodCounts,
   species:{birch:{...b,lodCounts:{...b.lodCounts}},pine:{...p,lodCounts:{...p.lodCounts}}}};
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.batches?.birch.dispose();this.batches?.pine.dispose();this.ids.clear()}
}
export function createNatureBatch(opts:MixedForestOptions){return new NatureBatch(opts)}
