/** Aurora Nature Asset Library ASSET-01E1 — production source rocks only. */
import * as THREE from 'three';
import {makeProductionRock,PRODUCTION_ROCK_SEEDS,type RockSeed} from './productionRock.ts';
import {acquireRockMaterial,releaseRockMaterial} from './rockMaterials.ts';
export {rockModel,makeProductionRock,PRODUCTION_ROCK_SEEDS} from './productionRock.ts';
export type {RockSeed} from './productionRock.ts';
export interface RockFamily {
 readonly material:THREE.MeshLambertMaterial;
 getGeometry(seed:RockSeed):THREE.BufferGeometry;
 createMesh(seed:RockSeed):THREE.Mesh;
 dispose():void;
}
export function createRockFamily():RockFamily {
 const geometries=new Map<RockSeed,THREE.BufferGeometry>(
  PRODUCTION_ROCK_SEEDS.map(s=>[s,makeProductionRock(s)]));
 const material=acquireRockMaterial();let disposed=false;
 const getGeometry=(seed:RockSeed)=>{
  if(disposed)throw Error('Disposed rock family');
  const g=geometries.get(seed);if(!g)throw RangeError('Unknown production rock seed');
  return g;
 };
 return {material,getGeometry,
 createMesh(seed){const m=new THREE.Mesh(getGeometry(seed),material);
  m.name='production-rock-'+seed;m.castShadow=true;m.receiveShadow=true;return m;},
 dispose(){if(disposed)return;disposed=true;for(const g of geometries.values())g.dispose();releaseRockMaterial();}
 };
}
