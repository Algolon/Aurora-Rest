/** E2A experimental meshes: isolated from approved rocks, only clay / optional Nordic diagnostic materials. */
import * as THREE from 'three';
import {sculptRock,type RockId,type RockControls} from './heroRockStudies.ts';
import {STUDIES} from './candidateDefinitions.ts';
export {STUDIES,STUDY_IDS} from './candidateDefinitions.ts';
export function makeE2Geometry(id:RockId,controls:Partial<RockControls>={}):THREE.BufferGeometry{
 const data=sculptRock(STUDIES[id],controls);
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));
 geo.setAttribute('normal',new THREE.Float32BufferAttribute(data.normals,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(data.uv,2));
 geo.computeBoundingBox();geo.computeBoundingSphere();
 geo.name='ASSET-E2A-'+id+'-ART-STUDY-NOT-PRODUCTION-APPROVED';
 geo.userData.e2={id,artApproved:false,productionIntegrated:false,components:1,faces:data.faceCount,
  triangles:data.triangleCount,planeIds:data.facePlaneIds,controls:data.controls};
 return geo;
}
export type PreviewMaterial='clay'|'nordic'|'silhouette'|'wire';
export function makeStudyMaterial(kind:PreviewMaterial):THREE.Material{
 if(kind==='silhouette')return new THREE.MeshBasicMaterial({color:'#101315'});
 if(kind==='wire')return new THREE.MeshBasicMaterial({color:'#26383d',wireframe:true});
 if(kind==='nordic')return new THREE.MeshStandardMaterial({color:'#8896a1',roughness:.94,metalness:0,flatShading:true});
 return new THREE.MeshStandardMaterial({color:'#b9bdc0',roughness:1,metalness:0,flatShading:true});
}
