import * as THREE from 'three';
import camerasJson from '../../tools/geo-r02c/cameras.json?raw';
import {CLAY,SUN_PRESETS,sunDirection,type ReviewOptions} from './review-options.ts';
export {reviewOptions} from './review-options.ts';
/** GEO-R02C-P0 opt-in review mode. Without ?review=clay or ?presets=p0 nothing here changes the viewer. */
export interface ReviewCamera {id:string;name:string;uv:number[];yaw:number;pitch:number;kind:string;group:string}

export function reviewCameras(options:ReviewOptions):ReviewCamera[]{
 if(!options.presets)return [];
 return (JSON.parse(camerasJson).cameras as ReviewCamera[]).map(c=>({id:c.id,name:c.name,uv:c.uv,yaw:c.yaw,pitch:c.pitch,kind:c.kind,group:c.group}));
}
export function applyClay(options:ReviewOptions,ctx:{renderer:THREE.WebGLRenderer;scene:THREE.Scene;hemisphere:THREE.HemisphereLight;sun:THREE.DirectionalLight;terrainMaterial:THREE.MeshLambertMaterial;terrainMeshes:THREE.Mesh[]}){
 if(!options.clay)return null;
 const {renderer,scene,hemisphere,sun,terrainMaterial,terrainMeshes}=ctx;
 terrainMaterial.color.setHex(CLAY.albedo);terrainMaterial.needsUpdate=true;hemisphere.intensity=CLAY.hemisphere;
 sun.intensity=CLAY.sun;sun.position.set(...sunDirection(options.sun)).multiplyScalar(7000);sun.target.position.set(0,0,0);scene.add(sun.target);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;sun.castShadow=true;
 const size=Math.min(CLAY.shadowMap,renderer.capabilities.maxTextureSize);sun.shadow.mapSize.set(size,size);
 // One orthographic shadow frustum spans the whole 6 x 8 km island (about 1.3 m per texel at 8192).
 Object.assign(sun.shadow.camera,{left:-5600,right:5600,top:5600,bottom:-5600,near:100,far:15000});sun.shadow.camera.updateProjectionMatrix();
 sun.shadow.bias=-.0003;sun.shadow.normalBias=1.5;
 for(const mesh of terrainMeshes){mesh.castShadow=true;mesh.receiveShadow=true;}
 scene.traverse(o=>{if((o as THREE.Mesh).isMesh)o.receiveShadow=true;});
 return {mode:'clay',sun:options.sun,sunPreset:SUN_PRESETS[options.sun],shadowMapSize:size,albedo:'#'+CLAY.albedo.toString(16),hemisphere:CLAY.hemisphere,sunIntensity:CLAY.sun};
}
