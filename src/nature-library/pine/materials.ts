// A species-local display colour without mutating the approved birch material.
// The canonical woodMats() owns all atlas/depth textures; pine owns only its own
// colour material and a counted reference to that canonical cache.
import * as THREE from 'three';
import {LEAF_TINT} from '../geometry.ts';
import {acquireBirchMaterials,releaseBirchMaterials} from '../materials.ts';
let pineMaterial:THREE.MeshLambertMaterial|null=null;
let pineOwners=0;
export function acquirePineMaterial():THREE.MeshLambertMaterial{
 const source=acquireBirchMaterials().tree;
 try{
  if(!pineMaterial){
   const material=new THREE.MeshLambertMaterial({vertexColors:true,map:source.map,color:LEAF_TINT.pine});
   // Explicit callbacks: Three.js Material.copy() does not guarantee that
   // custom onBeforeCompile programs survive clone() unchanged.
   material.onBeforeCompile=source.onBeforeCompile;
   material.customProgramCacheKey=source.customProgramCacheKey;
   material.defines={...source.defines};
   const depth:unknown=source.userData.vegetationDepth;
   if(!(depth instanceof THREE.MeshDepthMaterial))throw Error('Pine foliage depth material missing');
   material.userData.vegetationDepth=depth;
   pineMaterial=material;
  }
  pineOwners++;
  return pineMaterial;
 }catch(e){releaseBirchMaterials();throw e}
}
export function releasePineMaterial(){
 if(pineOwners<1)throw Error('Pine material reference underflow');
 pineOwners--;
 if(pineOwners===0){pineMaterial?.dispose();pineMaterial=null}
 releaseBirchMaterials();
}
