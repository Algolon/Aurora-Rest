/** ROCK-R01-G02R isolated Three.js adapter; no production registration. */
import * as THREE from 'three';
import {buildShelteredFaultG02R} from './g02rOrganicCore.ts';
export function createG02RGeometry():THREE.BufferGeometry{
 const m=buildShelteredFaultG02R(),geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(m.positions,3));
 geometry.setAttribute('normal',new THREE.Float32BufferAttribute(m.normals,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(m.uv,2));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(m.colors,3));
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 geometry.name='ROCK-R01-G02R-Organic-Plane-Refinement-ART-UNAPPROVED';
 geometry.userData.rockR01={triangles:m.triangles,topology:m.topology,
  artApproved:false,worldIntegrated:false,experimental:true};
 return geometry;
}
