/** ROCK-R01-G01: experimental source-owned geometry, no F01 registry mutation. */
import * as THREE from 'three';
import {buildShelteredFaultR01} from './sculptCore.ts';
export function createR01Geometry():THREE.BufferGeometry {
 const src=buildShelteredFaultR01();
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(src.positions,3));
 g.setAttribute('normal',new THREE.Float32BufferAttribute(src.normals,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(src.uv,2));
 g.setAttribute('color',new THREE.Float32BufferAttribute(src.colors,3));
 g.name='R01-The-Sheltered-Fault-G01-ART-UNAPPROVED';
 g.computeBoundingBox();g.computeBoundingSphere();
 g.userData.rockR01={triangles:src.triangles,topology:src.topology,
  design:'ROCK_R01_B1_DESIGN.md',artApproved:false,worldIntegrated:false};
 return g;
}
