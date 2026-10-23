import * as T from 'three';
import {createBirchFamily,type BirchFamily,type BirchLod} from '../nature-library/index.ts';
import {createPineFamily,type PineFamily} from '../nature-library/pine/index.ts';
import {createGrassFamily,type GrassFamily} from '../nature-library/grass/index.ts';
import {createRockFamily,PRODUCTION_ROCK_SEEDS,type RockFamily} from '../nature-library/rocks/index.ts';
import {createNatureBatch,type NatureBatch} from '../nature-library/rendering/mixedForest.ts';
import {createGrassBatch,type GrassBatch} from '../nature-library/grass/rendering/grassBatch.ts';
import {LEAF_TINT} from '../nature-library/geometry.ts';
import type {RenderMode} from '../nature-library/rendering/capabilities.ts';
import type {Placement,Family} from '../pop-01/contracts.ts';
import type {RenderPage} from './page-store.ts';
export class NatureResources {
 birch:BirchFamily;pine!:PineFamily;grass!:GrassFamily;rock!:RockFamily;private dead=false;
 constructor(){this.birch=createBirchFamily();try{this.pine=createPineFamily();this.grass=createGrassFamily();this.rock=createRockFamily();}catch(e){this.birch.dispose();this.pine!?.dispose();this.grass!?.dispose();throw e;}}
 dispose(){if(this.dead)return;this.dead=true;this.birch.dispose();this.pine.dispose();this.grass.dispose();this.rock.dispose();}
}
export interface SourceSettings {mode:RenderMode;shadows:boolean;forcedLod:BirchLod|null;enabled:ReadonlySet<Family>;grassAlignment:'upright'|'normal';grassFade:'source'|'refined';treeDistance:number}
export function stableFade(id:string){let h=2166136261;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619);return (h>>>0)/4294967295*2-1;}
export function rockSeed(variant:number){const seed=PRODUCTION_ROCK_SEEDS[variant];if(seed===undefined)throw Error('Invalid production rock variant');return seed;}
export function orientation(p:Placement){return new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...p.normal));}
/** Conservative source-geometry footprint suppression; generator descriptors remain immutable. */
export function grassClear(p:Placement,rocks:readonly Placement[],resources:NatureResources){const g=resources.grass.getGeometry(p.variant as 0|1|2|3);if(!g.boundingSphere)g.computeBoundingSphere();return rocks.every(r=>{if(Math.abs(p.x-r.x)>6||Math.abs(p.z-r.z)>6)return true;const geo=resources.rock.getGeometry(rockSeed(r.variant));if(!geo.boundingBox)geo.computeBoundingBox();const box=geo.boundingBox!,rr=Math.hypot(Math.max(Math.abs(box.min.x),Math.abs(box.max.x)),Math.max(Math.abs(box.min.z),Math.abs(box.max.z)))*r.scale;return Math.hypot(p.x-r.x,p.z-r.z)>rr+g.boundingSphere!.radius*p.scale;});}
export class SourcePage implements RenderPage {
 readonly registered:number;readonly scene:T.Scene;private trees?:NatureBatch;private grass?:GrassBatch;private rocks:{mesh:T.InstancedMesh;rows:Placement[]}[]=[];private dead=false;
 readonly rejected={grassSlope:0,grassRockOverlap:0};readonly byFamily:Record<Family,number>={birch:0,pine:0,grass:0,rock:0};private settings:SourceSettings;
 lastUpdateMs=0;visible=0;visibleTriangles=0;renderGroups=0;lodCounts={near:0,mid:0,far:0,xfar:0};backend='';
 constructor(rows:readonly Placement[],scene:T.Scene,renderer:T.WebGLRenderer,resources:NatureResources,settings:SourceSettings,failAfter?:number,obstacleRocks?:readonly Placement[]){
  this.scene=scene;this.settings=settings;this.registered=0;let allocations=0;const checkpoint=()=>{if(failAfter!==undefined&&++allocations>=failAfter)throw Error('Injected partial attach failure');};
  try{
   const trees=rows.filter(p=>(p.family==='birch'||p.family==='pine')&&settings.enabled.has(p.family));
   if(trees.length){this.trees=createNatureBatch({scene,renderer,families:{birch:resources.birch,pine:resources.pine},mode:settings.mode,capacity:Math.max(1,trees.length),shadows:settings.shadows,forcedLod:settings.forcedLod,visibilityDistance:settings.treeDistance});checkpoint();this.backend=this.trees.mode;for(const p of trees){this.trees.add({species:p.family as 'birch'|'pine',variant:p.variant as 0|1|2,position:[p.x,p.y,p.z],rotationY:p.rotation,scale:p.scale,tint:new T.Color(LEAF_TINT[p.family as 'birch'|'pine']).multiplyScalar(p.tint)});this.byFamily[p.family]++;}}
   const rocks=rows.filter(p=>p.family==='rock'),obstacles=obstacleRocks??rocks;
   const cover=rows.filter(p=>p.family==='grass'&&settings.enabled.has('grass')).filter(p=>{if(settings.grassAlignment==='upright'&&p.metadata.slope>.25){this.rejected.grassSlope++;return false;}if(!grassClear(p,obstacles,resources)){this.rejected.grassRockOverlap++;return false;}return true;});
   if(cover.length){this.grass=createGrassBatch({scene,renderer,family:resources.grass,mode:settings.mode,capacity:cover.length,fade:settings.grassFade,shadows:false});checkpoint();this.backend=this.grass.mode;for(const p of cover){const q=orientation(p);this.grass.add({variant:p.variant as 0|1|2|3,position:[p.x,p.y,p.z],rotationY:p.rotation,scale:p.scale,brightness:p.tint,fadeOffset:stableFade(p.id),orientation:settings.grassAlignment==='normal'?[q.x,q.y,q.z,q.w]:undefined});this.byFamily.grass++;}}
   if(settings.enabled.has('rock'))for(let v=0;v<4;v++){const subset=rocks.filter(p=>p.variant===v);if(!subset.length)continue;const mesh=new T.InstancedMesh(resources.rock.getGeometry(rockSeed(v)),resources.rock.material,subset.length);mesh.frustumCulled=false;mesh.castShadow=settings.shadows;mesh.receiveShadow=true;this.rocks.push({mesh,rows:subset});scene.add(mesh);checkpoint();this.byFamily.rock+=subset.length;}
   this.registered=Object.values(this.byFamily).reduce((a,b)=>a+b,0);
  }catch(e){this.dispose();throw e;}
 }
 hide(){for(const o of this.objects())o.visible=false;}
 objects(){return [...(this.trees?.objects??[]),...(this.grass?.objects??[]),...this.rocks.map(r=>r.mesh)];}
 update(camera:unknown){if(this.dead)throw Error('Disposed source page');const t=performance.now(),c=camera as T.Camera;this.visible=0;this.visibleTriangles=0;this.renderGroups=0;
  if(this.trees){const s=this.trees.update(c);this.visible+=s.cameraVisible+s.shadowRetained;this.visibleTriangles+=s.visibleTriangles;this.renderGroups+=s.renderGroups;this.lodCounts=s.lodCounts;}
  if(this.grass){const s=this.grass.update(c);this.visible+=s.visible;this.visibleTriangles+=s.visibleTriangles;this.renderGroups+=s.renderGroups;}
  const eye=new T.Vector3().setFromMatrixPosition(c.matrixWorld),f=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse)),matrix=new T.Matrix4(),yaw=new T.Quaternion(),up=new T.Vector3(0,1,0),p=new T.Vector3(),scale=new T.Vector3(),color=new T.Color();
  for(const r of this.rocks){let n=0;for(const row of r.rows){p.set(row.x,row.y-row.burial,row.z);if(eye.distanceTo(p)>this.settings.treeDistance||!f.intersectsSphere(new T.Sphere(p,3*row.scale)))continue;const q=orientation(row).multiply(yaw.setFromAxisAngle(up,row.rotation));matrix.compose(p,q,scale.setScalar(row.scale));r.mesh.setMatrixAt(n,matrix);r.mesh.setColorAt(n,color.setScalar(row.tint));n++;}r.mesh.count=n;r.mesh.visible=n>0;if(n){r.mesh.instanceMatrix.needsUpdate=true;if(r.mesh.instanceColor)r.mesh.instanceColor.needsUpdate=true;this.renderGroups++;this.visible+=n;this.visibleTriangles+=n*(r.mesh.geometry.index?.count??r.mesh.geometry.getAttribute('position').count)/3;}}
  this.lastUpdateMs=performance.now()-t;
 }
 dispose(){if(this.dead)return;this.dead=true;this.trees?.dispose();this.grass?.dispose();for(const r of this.rocks){r.mesh.removeFromParent();r.mesh.dispose();}this.rocks=[];}
}
