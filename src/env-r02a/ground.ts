/** ENV owns the presentation only. Neither classification nor profile changes touch POP. */
import * as T from 'three';
import {createEcotonePilot} from './ecotone.ts';
import {TerrainMaterialResources,createTerrainMaterial,PROFILES,type QualityProfile} from '../terrain-material/render/terrain-material.ts';
import {TerrainMaterialQuery} from '../terrain-material/query.ts';
import type {MaterialClassification} from '../terrain-material/types.ts';
import type {SynthesizedTexture} from '../terrain-material/textures.ts';
import type {GeoR02BFeatures} from '../terrain-material/sources/geo-r02b.ts';
export type GroundMode='neutral'|'material'|'weights';
interface Prepared {classification:MaterialClassification;hash:string;textures:Record<number,SynthesizedTexture[]>;timingsMs:unknown;synthesisMs:number;workerTotalMs:number}
export class GroundIntegration {
 readonly neutral=new T.MeshLambertMaterial({color:0x888d7b,side:T.DoubleSide});
 private readonly canonicalQuery:TerrainMaterialQuery;
 private readonly pilotQuery:TerrainMaterialQuery;
 private readonly pilotClassification:MaterialClassification;
 readonly pilotAudit:ReturnType<typeof createEcotonePilot>['audit'];
 pilotEnabled=false;
 get query(){return this.pilotEnabled?this.pilotQuery:this.canonicalQuery;}
 private get activeClassification(){return this.pilotEnabled?this.pilotClassification:this.prepared.classification;}
 resources!:TerrainMaterialResources; private shaded!:T.MeshStandardMaterial;
 mode:GroundMode='neutral';profile:QualityProfile='high';private dead=false;
 private constructor(readonly prepared:Prepared,readonly loadMs:number,features:GeoR02BFeatures){
  const anchor=features.anchors.find(a=>a.id==='forest');
  if(!anchor)throw Error('Missing verified Birchwood anchor');
  const pilot=createEcotonePilot(prepared.classification,anchor.xzM[0],anchor.xzM[1]);
  this.pilotClassification=pilot.classification;this.pilotAudit=pilot.audit;
  this.canonicalQuery=new TerrainMaterialQuery(prepared.classification);
  this.pilotQuery=new TerrainMaterialQuery(pilot.classification);this.create();
 }
 static async load(heights:Float32Array,features:GeoR02BFeatures){
  const start=performance.now(),response=await fetch('/geo-r02b/water-surface.f32');if(!response.ok)throw Error('Missing MAT water-surface lattice');
  const water=await response.arrayBuffer(),terrain=heights.slice().buffer;
  const worker=new Worker(new URL('../mat-01/worker.ts',import.meta.url),{type:'module'});
  try{const result=await new Promise<Prepared>((resolve,reject)=>{worker.onerror=e=>reject(Error(e.message));worker.onmessage=e=>e.data.ok?resolve(e.data):reject(Error(e.data.error));worker.postMessage({terrain,water,features,textureSizes:[512,256]},[terrain,water]);});return new GroundIntegration(result,performance.now()-start,features);}finally{worker.terminate();}
 }
 private create(){this.resources=new TerrainMaterialResources(this.activeClassification,this.prepared.textures[PROFILES[this.profile].textureSize],this.profile).acquire();this.shaded=createTerrainMaterial(this.resources);this.resources.setDebug(this.mode==='weights'?'weights':'off');}
 get material(){if(this.dead)throw Error('Ground adapter disposed');return this.mode==='neutral'?this.neutral:this.shaded;}
 setMode(mode:GroundMode){if(this.dead)throw Error('Ground adapter disposed');this.mode=mode;this.resources.setDebug(mode==='weights'?'weights':'off');}
 setPilot(enabled:boolean){if(this.dead)throw Error('Ground adapter disposed');if(this.pilotEnabled===enabled)return;
  this.shaded.dispose();this.resources.release();this.pilotEnabled=enabled;this.create();}
 setProfile(profile:QualityProfile){if(this.dead)throw Error('Ground adapter disposed');this.shaded.dispose();this.resources.release();this.profile=profile;this.create();}
 snapshot(){return{mode:this.mode,profile:this.profile,hash:this.prepared.hash,pilotEnabled:this.pilotEnabled,pilotAudit:this.pilotAudit,loadMs:this.loadMs,classificationMs:this.prepared.timingsMs,synthesisMs:this.prepared.synthesisMs,workerTotalMs:this.prepared.workerTotalMs,gpuBytes:this.resources.memoryBytes,owners:this.resources.ownerCount,disposed:this.resources.disposed,materialSlots:this.prepared.classification.materials};}
 dispose(){if(this.dead)return;this.dead=true;this.shaded.dispose();this.resources.release();this.neutral.dispose();}
}
