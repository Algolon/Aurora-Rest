/** Isolated R01 G02 experimental Three.js adapter; G01/G01R remain untouched. */
import * as THREE from 'three';
import {buildShelteredFaultG02} from './g02NonConvexCore.ts';
export function createG02Geometry():THREE.BufferGeometry{
 const m=buildShelteredFaultG02(),geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(m.positions,3));
 geo.setAttribute('normal',new THREE.Float32BufferAttribute(m.normals,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(m.uv,2));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(m.colors,3));
 geo.computeBoundingBox();geo.computeBoundingSphere();
 geo.name='ROCK-R01-G02-NonConvex-Blockout-ART-UNAPPROVED';
 geo.userData.rockR01={triangles:m.triangles,topology:m.topology,
  artApproved:false,worldIntegrated:false,g02:true};
 return geo;
}
