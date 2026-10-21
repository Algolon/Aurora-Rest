import * as THREE from 'three';
export const DEFAULT_VISIBILITY_DISTANCE=175;
export type VisibilityClass='camera'|'shadow'|'excluded';
const view=new THREE.Matrix4(),frustum=new THREE.Frustum(),sp=new THREE.Sphere();
const lightPos=new THREE.Vector3(),targetPos=new THREE.Vector3();
export function cameraFrustum(camera:THREE.Camera):THREE.Frustum {
 camera.updateMatrixWorld();
 frustum.setFromProjectionMatrix(view.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 return frustum;
}
export function shadowDirection(sun:THREE.DirectionalLight|null):THREE.Vector3|null {
 if(!sun||!sun.castShadow)return null;
 sun.updateMatrixWorld();sun.target.updateMatrixWorld();
 const d=targetPos.setFromMatrixPosition(sun.target.matrixWorld).sub(lightPos.setFromMatrixPosition(sun.matrixWorld));
 return d.lengthSq()>1e-9?d.normalize().clone():null;
}
/** Conservative swept-volume retention: a shadow caster outside the camera frustum
 * survives if the sphere swept approximately two canopy radii toward the sun's
 * ground projection intersects the camera. This is deliberately conservative;
 * it is not a receiver-aware shadow-culling solver. */
export function classifyVisibility(f:THREE.Frustum,center:THREE.Vector3,radius:number,
 distance:number,maxDistance:number,castDir:THREE.Vector3|null,culling=true):VisibilityClass {
 if(!culling)return 'camera';
 if(distance>maxDistance+radius)return 'excluded';
 sp.center.copy(center);sp.radius=radius;
 if(f.intersectsSphere(sp))return 'camera';
 if(castDir){
  const sweep=2*radius/Math.max(.25,-castDir.y);
  sp.center.addScaledVector(castDir,sweep*.5);sp.radius+=sweep*.5;
  if(f.intersectsSphere(sp))return 'shadow';
 }
 return 'excluded';
}
