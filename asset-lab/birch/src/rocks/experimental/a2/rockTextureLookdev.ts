/**
 * ASSET-01E2R-A2 — identical PBR map bytes through two projection paths.
 * planar: unchanged G1 per-face UV and standard Three.js shader map sampling.
 * triplanar: LOCAL-SPACE three-axis blended color/roughness + shallow normal relief.
 * No change to geometry and no global ShaderChunk modifications.
 */
import * as THREE from 'three';
import {generateRockLookdevPixels,ROCK_LOOKDEV_SIZE,type RockLookdevStudy} from './rockTexturePixels.ts';
export type RockProjection='planar'|'triplanar';
export {ROCK_LOOKDEV_SIZE};
export type {RockLookdevStudy};
const STUDIES:readonly RockLookdevStudy[]=['T1','T2','T3'];
const SCALE=.38; // Matches original G1 authored face UV scale.
const replace=(shader:string,tag:string,replacement:string)=>{
 if(!shader.includes(tag))throw Error('A2 Three.js shader chunk changed: '+tag);
 return shader.replace(tag,replacement);
};
const glslHeader=[
 'varying vec3 vA2LocalP;',
 'varying vec3 vA2LocalN;',
 'varying vec3 vA2AxisX;',
 'varying vec3 vA2AxisY;',
 'varying vec3 vA2AxisZ;',
 'vec3 a2Weights(){',
 ' vec3 n=pow(abs(normalize(vA2LocalN)),vec3(4.0));',
 ' return n/max(n.x+n.y+n.z,0.00001);',
 '}'
].join('\n');
const mapFragment=[
 '#ifdef USE_MAP',
 ' vec3 a2w=a2Weights();',
 ' vec4 a2Albedo=',
 '    a2w.x*texture2D(map,vA2LocalP.zy*0.38)',
 '  + a2w.y*texture2D(map,vA2LocalP.xz*0.38)',
 '  + a2w.z*texture2D(map,vA2LocalP.xy*0.38);',
 ' diffuseColor *= a2Albedo;',
 '#endif'
].join('\n');
const roughnessFragment=[
 'float roughnessFactor = roughness;',
 '#ifdef USE_ROUGHNESSMAP',
 ' vec3 a2wR=a2Weights();',
 ' float a2Rough=',
 '    a2wR.x*texture2D(roughnessMap,vA2LocalP.zy*0.38).g',
 '  + a2wR.y*texture2D(roughnessMap,vA2LocalP.xz*0.38).g',
 '  + a2wR.z*texture2D(roughnessMap,vA2LocalP.xy*0.38).g;',
 ' roughnessFactor *= a2Rough;',
 '#endif'
].join('\n');
const normalFragment=[
 '#ifdef USE_NORMALMAP_TANGENTSPACE',
 ' vec3 a2wN=a2Weights();',
 ' vec3 a2pN=normalize(vA2LocalN);',
 ' vec3 a2X=texture2D(normalMap,vA2LocalP.zy*0.38).xyz*2.0-1.0;',
 ' vec3 a2Y=texture2D(normalMap,vA2LocalP.xz*0.38).xyz*2.0-1.0;',
 ' vec3 a2Z=texture2D(normalMap,vA2LocalP.xy*0.38).xyz*2.0-1.0;',
 ' vec3 a2Micro=',
 '    a2wN.x*vec3(0.0,a2X.y,a2X.x)*sign(a2pN.x)',
 '  + a2wN.y*vec3(a2Y.x,0.0,a2Y.y)*sign(a2pN.y)',
 '  + a2wN.z*vec3(a2Z.x,a2Z.y,0.0)*sign(a2pN.z);',
 ' vec3 a2ViewMicro=',
 '    a2Micro.x*normalize(vA2AxisX)',
 '  + a2Micro.y*normalize(vA2AxisY)',
 '  + a2Micro.z*normalize(vA2AxisZ);',
 ' normal=normalize(normal+a2ViewMicro*normalScale.x);',
 '#endif'
].join('\n');
const mossFunction=[
 'float a2Hash(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453123);}',
 'float a2SoftNoise(vec2 p){',
 ' vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);',
 ' return mix(mix(a2Hash(i),a2Hash(i+vec2(1,0)),f.x),',
 '            mix(a2Hash(i+vec2(0,1)),a2Hash(i+vec2(1,1)),f.x),f.y);',
 '}'
].join('\n');
const mossColor=[
 'float a2Ground=1.0-smoothstep(-0.18,0.78,vA2LocalP.y);',
 'float a2Patch=smoothstep(0.48,0.69,a2SoftNoise(vA2LocalP.xz*2.0+vec2(17.0,3.0)));',
 'float a2Moss=a2Ground*a2Patch*0.14;',
 'diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.66,.84,.65),a2Moss);'
].join('\n');
function installLocalShader(mat:THREE.MeshStandardMaterial,study:RockLookdevStudy,projection:RockProjection):void{
 mat.onBeforeCompile=shader=>{
  const varyings=[
   'varying vec3 vA2LocalP;','varying vec3 vA2LocalN;',
   'varying vec3 vA2AxisX;','varying vec3 vA2AxisY;','varying vec3 vA2AxisZ;'
  ].join('\n');
  shader.vertexShader=replace(shader.vertexShader,'#include <common>','#include <common>\n'+varyings);
  shader.vertexShader=replace(shader.vertexShader,'#include <begin_vertex>',
   '#include <begin_vertex>\n'+[
    'vA2LocalP=position;vA2LocalN=normal;',
    'vA2AxisX=normalize(normalMatrix*vec3(1.0,0.0,0.0));',
    'vA2AxisY=normalize(normalMatrix*vec3(0.0,1.0,0.0));',
    'vA2AxisZ=normalize(normalMatrix*vec3(0.0,0.0,1.0));'
   ].join('\n'));
  shader.fragmentShader=replace(shader.fragmentShader,'#include <common>',
   '#include <common>\n'+glslHeader+(study==='T3'?'\n'+mossFunction:''));
  if(projection==='triplanar'){
   shader.fragmentShader=replace(shader.fragmentShader,'#include <map_fragment>',mapFragment);
   shader.fragmentShader=replace(shader.fragmentShader,'#include <roughnessmap_fragment>',roughnessFragment);
   shader.fragmentShader=replace(shader.fragmentShader,'#include <normal_fragment_maps>',normalFragment);
  }
  if(study==='T3')shader.fragmentShader=replace(shader.fragmentShader,'#include <color_fragment>',
   '#include <color_fragment>\n'+mossColor);
  mat.userData.a2ShaderDiagnostics={
   vertexChars:shader.vertexShader.length,fragmentChars:shader.fragmentShader.length,
   customTextureCalls:(shader.fragmentShader.match(/texture2D\(/g)||[]).length,
   shaderMode:projection,study
  };
 };
 mat.customProgramCacheKey=()=> 'a2-rock-tex-v1-'+study+'-'+projection;
}
export interface RockLookdevFactory {
 readonly textures:Record<RockLookdevStudy,{albedo:THREE.DataTexture;normal:THREE.DataTexture;roughness:THREE.DataTexture}>;
 readonly materials:Record<RockLookdevStudy,Record<RockProjection,THREE.MeshStandardMaterial>>;
 readonly textureSize:number;
 readonly textureCount:number;
 readonly baseTextureBytes:number;
 readonly mipEstimateBytes:number;
 readonly mappingScale:number;
 readonly styleStats:Record<RockLookdevStudy,{microFractureCoverage:number;meanRoughness:number}>;
 dispose():void;
}
const createMap=(data:Uint8Array,srgb:boolean):THREE.DataTexture=>{
 const t=new THREE.DataTexture(data,ROCK_LOOKDEV_SIZE,ROCK_LOOKDEV_SIZE,THREE.RGBAFormat,THREE.UnsignedByteType);
 t.wrapS=t.wrapT=THREE.RepeatWrapping;
 t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;
 t.generateMipmaps=true;t.anisotropy=4;
 t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;
 t.needsUpdate=true;
 return t;
};
export function createRockLookdevFactory():RockLookdevFactory{
 const textures={} as RockLookdevFactory['textures'];
 const materials={} as RockLookdevFactory['materials'];
 const styleStats={} as RockLookdevFactory['styleStats'];
 for(const study of STUDIES){
  const p=generateRockLookdevPixels(study);
  styleStats[study]={microFractureCoverage:p.microFractureCoverage,meanRoughness:p.meanRoughness};
  textures[study]={albedo:createMap(p.albedo,true),normal:createMap(p.normal,false),
   roughness:createMap(p.roughness,false)};
  materials[study]={} as Record<RockProjection,THREE.MeshStandardMaterial>;
  for(const projection of ['planar','triplanar'] as const){
   const maps=textures[study];
   const mat=new THREE.MeshStandardMaterial({
    name:'A2-'+study+'-'+projection+'-ART-REVIEW',
    color:0xffffff,vertexColors:true,map:maps.albedo,normalMap:maps.normal,roughnessMap:maps.roughness,
    normalScale:new THREE.Vector2(study==='T2'?.34:.24,study==='T2'?.34:.24),
    roughness:study==='T3'?.96:.94,metalness:0,side:THREE.FrontSide
   });
   if(projection==='triplanar'||study==='T3')installLocalShader(mat,study,projection);
   mat.userData.a2={study,projection,artApproved:false,sourceGeometry:'G1-unchanged'};
   materials[study][projection]=mat;
  }
 }
 const textureCount=9,baseTextureBytes=textureCount*ROCK_LOOKDEV_SIZE**2*4;
 let disposed=false;
 return {textures,materials,textureCount,baseTextureBytes,
  mipEstimateBytes:Math.round(baseTextureBytes*4/3),mappingScale:SCALE,
  textureSize:ROCK_LOOKDEV_SIZE,styleStats,dispose(){
   if(disposed)return;disposed=true;
   for(const study of STUDIES){
    for(const material of Object.values(materials[study]))material.dispose();
    for(const texture of Object.values(textures[study]))texture.dispose();
   }
  }};
}
