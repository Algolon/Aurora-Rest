// Material scoped reproduction of Feh Lu We indoorLeafMaterial() with
// surface(...,'foliage'); no global ShaderChunk mutations.
import * as THREE from 'three';
import {mulberry32} from '../rng.ts';
const INDOOR_FAMILIES=['ficus','snake','alocasia','pothos','cactus','succulent','zz'] as const;
// Source SURFACE_PARAMS.foliage [8.0,.15,0,0,.09,.84];\n// Source GLSL emits exactly these constants when FLW_SURFACE == 7.\nconst profileGlsl=()=>`#if FLW_SURFACE == 7\n  const vec4 FLW_A = vec4(0.1250, 0.1500, 0.0000, 0.0000);\n  const vec2 FLW_B = vec2(0.0900, 0.8400);\n#endif`;\nconst COMMON = /* glsl */ `
#ifdef FLW_SURFACE
varying vec3 vFlwP;
${profileGlsl()}
vec2 flwHash2(vec3 p) { p = fract(p * vec3(0.1031, 0.103, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.xx + p.yz) * p.zy); }
// value noise with two decorrelated channels for the price of one lookup set
vec2 flwNoise2(vec3 x) {
  vec3 i = floor(x), u = fract(x); u = u * u * (3.0 - 2.0 * u);
  return mix(mix(mix(flwHash2(i), flwHash2(i + vec3(1, 0, 0)), u.x), mix(flwHash2(i + vec3(0, 1, 0)), flwHash2(i + vec3(1, 1, 0)), u.x), u.y),
             mix(mix(flwHash2(i + vec3(0, 0, 1)), flwHash2(i + vec3(1, 0, 1)), u.x), mix(flwHash2(i + vec3(0, 1, 1)), flwHash2(i + vec3(1, 1, 1)), u.x), u.y), u.z);
}
vec3 flwSurface(vec3 base, vec3 p) {
  // broad value zone + a separate warm / cool drift (one lookup), a mid-scale breakup (a second, only where used)
  vec2 lo = flwNoise2(p * FLW_A.x) - 0.5;
  float v = 1.0 + lo.x * 2.0 * FLW_A.y;
  if (FLW_A.w > 0.0) v += (flwNoise2(p * FLW_A.z + 31.1).x - 0.5) * 2.0 * FLW_A.w;
  vec3 c = base * v * (vec3(1.0) + vec3(0.6, 0.12, -0.75) * (lo.y * 2.0 * FLW_B.x));
  float g = dot(c, vec3(0.299, 0.587, 0.114));
  return mix(vec3(g), c, FLW_B.y);
}
#endif
`;


const WORLDPOS = /* glsl */ `
#ifdef FLW_SURFACE
  vec4 flwW = vec4(transformed, 1.0);
  #ifdef USE_BATCHING
    flwW = batchingMatrix * flwW;
  #endif
  #ifdef USE_INSTANCING
    flwW = instanceMatrix * flwW;
  #endif
  vFlwP = (modelMatrix * flwW).xyz;
#endif
`;


const COLOR = /* glsl */ `
#ifdef FLW_SURFACE
  diffuseColor.rgb = flwSurface(diffuseColor.rgb, vFlwP);
#endif
`;


function sourceFoliageSurface<T extends THREE.MeshLambertMaterial>(m:T):T {
 m.defines={...m.defines,FLW_SURFACE:7};
 m.userData.surface='foliage';
 m.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\n'+COMMON);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+COMMON);
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n'+WORLDPOS);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+COLOR);
 };
 m.customProgramCacheKey=()=> 'flw-grass-r09-surface-foliage-v1';
 m.needsUpdate=true;
 return m;
}
let leafMat:THREE.MeshLambertMaterial|null=null;
function buildIndoorLeafMaterial() {
  if(leafMat)return leafMat;
  const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d')!;x.fillStyle='#ffffff';x.fillRect(0,0,1024,512);
  INDOOR_FAMILIES.forEach((family,tile)=>{
    const ox=tile%4*256,oy=Math.floor(tile/4)*256;x.save();x.beginPath();x.rect(ox+2,oy+2,252,252);x.clip();
    const gr=x.createLinearGradient(ox,0,ox+256,0);gr.addColorStop(0,'#a7b29b');gr.addColorStop(.42,'#e0e5d9');gr.addColorStop(.5,'#f8f9ed');gr.addColorStop(.58,'#d5decc');gr.addColorStop(1,'#a9b89e');x.fillStyle=gr;x.fillRect(ox,oy,256,256);
    // Fine brush grain stays subordinate to coherent growth lines.
    const r=mulberry32(9900+tile*71);for(let i=0;i<850;i++){x.globalAlpha=.055;x.fillStyle=r()<.5?'#3d5137':'#ffffff';x.fillRect(ox+r()*256,oy+r()*256,.7,2+r()*3);}x.globalAlpha=1;
    const rib=(colour:string,width:number,offset=0)=>{x.strokeStyle=colour;x.lineWidth=width;x.beginPath();x.moveTo(ox+128+offset,oy+252);x.bezierCurveTo(ox+125+offset,oy+170,ox+132+offset,oy+65,ox+128+offset,oy+4);x.stroke();};
    if(family==='snake'||family==='cactus'){
      for(let k=0;k<9;k++){x.strokeStyle=k%2?'#b9c3ac':'#e6ebd9';x.lineWidth=family==='cactus'?5:3;x.beginPath();x.moveTo(ox+24+k*26,oy+256);x.lineTo(ox+24+k*26,oy);x.stroke();}
      if(family==='snake')for(let k=0;k<14;k++){x.fillStyle='rgba(96,112,80,.16)';x.fillRect(ox,oy+k*19,256,4);}
    }else if(family!=='succulent'){
      const pairs=family==='alocasia'?6:9;
      for(let k=0;k<pairs;k++)for(const sign of [-1,1]){
        const v=.12+k/(pairs+1)*.8,cy=oy+256*(1-v),reach=104*Math.pow(Math.sin(Math.PI*v),.7);
        x.lineCap='round';x.strokeStyle=family==='alocasia'?'#6d8559':'#7e966b';x.lineWidth=family==='alocasia'?4.5:2.8;
        x.beginPath();x.moveTo(ox+128,cy);x.bezierCurveTo(ox+128+sign*reach*.35,cy-8,ox+128+sign*reach*.72,cy-22,ox+128+sign*reach,cy-28);x.stroke();
        x.strokeStyle=family==='alocasia'?'#edf0c2':'#dde8bd';x.lineWidth=family==='alocasia'?2:1.25;x.stroke();
      }
      rib('#718b5d',family==='alocasia'?6:4);rib('#edf2c8',family==='alocasia'?2.5:1.8,1);
    }x.restore();
  });
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  return leafMat=sourceFoliageSurface(new THREE.MeshLambertMaterial({map,vertexColors:true}));
}

let owners=0;
export function acquireGrassMaterial(){
 const m=buildIndoorLeafMaterial();owners++;return m;
}
export function releaseGrassMaterial(){
 if(owners<1)throw Error('Grass material reference underflow');
 if(--owners===0){const m=leafMat;leafMat=null;m?.map?.dispose();m?.dispose();}
}
export function grassMaterialOwnerCount(){return owners}
