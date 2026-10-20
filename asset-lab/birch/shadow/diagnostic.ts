// Isolated ASSET-01B1R diagnosis — separate runtime, no Aurora island changes.
// "natural" uses the actual factory; "forced-default" removes custom depth
// and "manual-alpha" explicitly attaches the original source depth material.
// All conditions use identical geometry, camera, lighting, gamma and shadow map.
import * as THREE from 'three';
import {createBirchFamily,type BirchVariant,type BirchLod} from '../src/index.ts';
const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
renderer.setSize(1280,900); renderer.setPixelRatio(1);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.NoToneMapping;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.BasicShadowMap;
renderer.setClearColor('#ced7db');
renderer.info.autoReset=true;
document.body.append(renderer.domElement);
const scene=new THREE.Scene();
scene.background=new THREE.Color('#ced7db');
const camera=new THREE.OrthographicCamera(-19,19,13.36,-13.36,.1,130);
camera.position.set(21,25,24);camera.lookAt(-2.5,2.5,-2.5);camera.updateProjectionMatrix();
const hemi=new THREE.HemisphereLight('#ffffff','#ffffff',.24);scene.add(hemi);
const sun=new THREE.DirectionalLight('#ffffff',3);
sun.position.set(11,24,9);sun.target.position.set(0,4,0);
sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);
sun.shadow.camera.left=-24;sun.shadow.camera.right=24;
sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;
sun.shadow.camera.near=.5;sun.shadow.camera.far=80;
sun.shadow.bias=-.0001;sun.shadow.normalBias=.015;
sun.shadow.radius=1;
scene.add(sun,sun.target);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshLambertMaterial({color:'#bababa'}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.025;ground.receiveShadow=true;
scene.add(ground);
const family=createBirchFamily();
type ShadowMode='natural'|'manual-alpha'|'forced-default';
let variant:BirchVariant=0,lod:BirchLod='near',mode:ShadowMode='natural',mesh:THREE.Mesh|null=null,frames=0;
let lastError:string|null=null;
function rebuild() {
 if(mesh){scene.remove(mesh);}
 mesh=family.createMesh(variant,lod);
 if(mode==='manual-alpha'){
  mesh.customDepthMaterial=family.material.userData.vegetationDepth as THREE.MeshDepthMaterial;
 }else if(mode==='forced-default'){
  mesh.customDepthMaterial=undefined;
 }
 scene.add(mesh);
 // mark light's shadow map for regeneration.
 sun.shadow.needsUpdate=true;
}
function tick(){
 try{
  renderer.render(scene,camera);frames++;
 }catch(e){lastError=String(e);throw e}
 requestAnimationFrame(tick);
}
rebuild();tick();
const test={
 setConfig(next:{variant?:BirchVariant,lod?:BirchLod,mode?:ShadowMode}){
  variant=next.variant??variant;lod=next.lod??lod;mode=next.mode??mode;
  rebuild();return this.inspect();
 },
 inspect(){
  return {variant,lod,mode,frame:frames,
   colorMaterialUuid:family.material.uuid,
   depthExists:!!family.material.userData.vegetationDepth,
   depthAssigned:mesh?.customDepthMaterial===family.material.userData.vegetationDepth,
   depthPacking:(family.material.userData.vegetationDepth as THREE.MeshDepthMaterial).depthPacking,
   leafAlphaThreshold:0.4,castShadow:mesh?.castShadow,
   gl:renderer.getContext().getParameter(renderer.getContext().VERSION),
   shadowEnabled:renderer.shadowMap.enabled,
   geometryShared:family.getGeometry(variant,'far')===family.getGeometry(variant,'xfar'),
   triangles:(mesh?.geometry.index?.count??0)/3,
   calls:renderer.info.render.calls,renderedTriangles:renderer.info.render.triangles,
   shadowTextureSize:sun.shadow.map?.texture.image?.width??null,
   error:lastError};
 },
 family,renderer,scene,camera,ground,sun,get frame(){return frames},get mesh(){return mesh}
};
Object.assign(window,{__shadowLab:test});
addEventListener('pagehide',()=>{family.dispose();ground.geometry.dispose();(ground.material as THREE.Material).dispose();renderer.dispose();});
