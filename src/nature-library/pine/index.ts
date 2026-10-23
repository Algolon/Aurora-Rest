import * as THREE from 'three';
import {makePineGeometry,pineReferenceModel,type PineVariant} from './geometry.ts';
import {acquirePineMaterial,releasePineMaterial} from './materials.ts';
import {geometryLod,type BirchLod} from '../lod.ts';
export {makePineGeometry,pineReferenceModel} from './geometry.ts';
export type {PineVariant} from './geometry.ts';
export type PineLod=BirchLod;
export interface PineFamily{
 readonly material:THREE.MeshLambertMaterial;
 getGeometry(variant:PineVariant,lod:PineLod):THREE.BufferGeometry;
 createMesh(variant:PineVariant,lod:PineLod):THREE.Mesh;
 dispose():void;
}
export function createPineFamily():PineFamily{
 const geometries=new Map<string,THREE.BufferGeometry>();
 for(const v of [0,1,2] as const)for(const lod of ['near','mid','far'] as const)
  geometries.set(v+':'+lod,makePineGeometry(v,lod));
 const material=acquirePineMaterial();
 let disposed=false;
 const getGeometry=(v:PineVariant,lod:PineLod)=>{
  if(disposed)throw Error('Pine family disposed');
  if(![0,1,2].includes(v))throw RangeError('Invalid pine variant');
  const g=geometries.get(v+':'+geometryLod(lod));
  if(!g)throw RangeError('Invalid pine LOD');
  return g;
 };
 return {material,getGeometry,
 createMesh(v,lod){
  const mesh=new THREE.Mesh(getGeometry(v,lod),material);
  mesh.name='scots-pine.'+v+'.'+lod;
  mesh.castShadow=true;mesh.receiveShadow=true;
  const depth:unknown=material.userData.vegetationDepth;
  if(!(depth instanceof THREE.MeshDepthMaterial))throw Error('Pine depth material unavailable');
  mesh.customDepthMaterial=depth;
  return mesh;
 },
 dispose(){
  if(disposed)return;
  disposed=true;for(const g of geometries.values())g.dispose();
  geometries.clear();releasePineMaterial();
 }};
}
