import * as THREE from 'three';
import {makeBirchGeometry,LEAF_TINT,birchReferenceModel} from './geometry.ts';
import {acquireBirchMaterials,releaseBirchMaterials} from './materials.ts';
import {BIRCH_LODS,geometryLod,selectTreeLod,BIRCH_LOD_PROFILE,type BirchLod} from './lod.ts';
export {birchReferenceModel,makeBirchGeometry} from './geometry.ts';
export {BIRCH_LODS,BIRCH_LOD_PROFILE,selectTreeLod} from './lod.ts';
export type {BirchLod} from './lod.ts';
export type BirchVariant=0|1|2;
export interface BirchFamily {
 readonly material:THREE.MeshLambertMaterial;
 getGeometry(variant:BirchVariant,lod:BirchLod):THREE.BufferGeometry;
 createMesh(variant:BirchVariant,lod:BirchLod):THREE.Mesh;
 dispose():void;
}
export function createBirchFamily():BirchFamily {
 const geos=new Map<string,THREE.BufferGeometry>();
 for(const variant of [0,1,2] as const)for(const lod of ['near','mid','far'] as const)geos.set(`${variant}:${lod}`,makeBirchGeometry(variant,lod));
 const material=acquireBirchMaterials().tree;
 // Reproduce the original batch's single leaf-tint instance colour for showroom Meshes.
 // For a non-instanced Mesh material.color supplies the same linear multiplier.
 material.color.set(LEAF_TINT.birch);
 let disposed=false;
 const getGeometry=(variant:BirchVariant,lod:BirchLod)=>{
  if(disposed)throw Error('Birch family has been disposed');
  if(![0,1,2].includes(variant))throw RangeError('Unknown birch variant');
  return geos.get(`${variant}:${geometryLod(lod)}`)!;
 };
 return {
  material,
  getGeometry,
  createMesh(variant:BirchVariant,lod:BirchLod){
   const m=new THREE.Mesh(getGeometry(variant,lod),material);
   m.name=`birch.${variant}.${lod}`;
   m.castShadow=true;m.receiveShadow=true;
   return m;
  },
  dispose(){if(disposed)return;disposed=true;for(const g of geos.values())g.dispose();geos.clear();releaseBirchMaterials();}
 };
}
