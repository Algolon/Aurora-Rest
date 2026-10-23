import * as THREE from 'three';
import {makeGrassGeometry,type GrassVariant,type GrassPreset} from './geometry.ts';
import {acquireGrassMaterial,releaseGrassMaterial} from './materials.ts';
export {makeGrassGeometry,grassModel,referenceGrassModel} from './geometry.ts';
export type {GrassPreset,GrassVariant} from './geometry.ts';
export interface GrassFamily {
 readonly material:THREE.MeshLambertMaterial;
 readonly preset:GrassPreset;
 getGeometry(variant:GrassVariant):THREE.BufferGeometry;
 createMesh(variant:GrassVariant):THREE.Mesh;
 dispose():void;
}
export function createGrassFamily({preset='flw-production-reference'}:{preset?:GrassPreset}={}):GrassFamily{
 const geos=([0,1,2,3] as const).map(v=>makeGrassGeometry(v,preset));
 let disposed=false;
 const material=preset==='flw-production-reference'?acquireGrassMaterial():new THREE.MeshLambertMaterial({vertexColors:true});
 const owns= preset==='flw-production-reference';
 const getGeometry=(variant:GrassVariant)=>{
  if(disposed)throw Error('Grass family has been disposed');
  if(![0,1,2,3].includes(variant))throw RangeError('Unknown grass variant');
  return geos[variant];
 };
 return {material,preset,getGeometry,createMesh(variant){
  const m=new THREE.Mesh(getGeometry(variant),material);
  m.name='grass.'+variant+'.'+preset;
  // The Feh Lu We source duplicates the back winding with up-biased normals:
  // a FrontSide material is intentional. Grass is real geometry, no alpha atlas.
  m.castShadow=true;m.receiveShadow=true;
  return m;
 },dispose(){
  if(disposed)return;disposed=true;
  for(const g of geos)g.dispose();
  if(owns)releaseGrassMaterial();else material.dispose();
 }};
}
