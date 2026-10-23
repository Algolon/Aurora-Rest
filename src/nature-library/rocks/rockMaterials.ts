/** Source-local rock shading; faithful Feh Lu We woodMats().rock and surface(stone).
 * This adapter never mutates THREE.ShaderChunk globally. Source: 17eafb0902833fb1121c77083f9f862eb4ffcd96. */
import * as THREE from 'three';
import {mulberry32} from '../rng.ts';
export const SURFACE_PROFILES = { timber: 1, plaster: 2, stone: 3, fabric: 4, paint: 5, ground: 6, foliage: 7, metal: 8, tree: 9 } as const;
export type SurfaceProfile = keyof typeof SURFACE_PROFILES;

/** Per profile: [low scale m, low amp, mid scale m, mid amp, hue amp, saturation]. */
export const SURFACE_PARAMS: Record<SurfaceProfile, [number, number, number, number, number, number]> = {
  timber: [3.2, 0.1, 0.55, 0.05, 0.05, 1.0],
  plaster: [2.6, 0.12, 0.9, 0.045, 0.05, 1.0],
  stone: [1.9, 0.1, 0.42, 0.07, 0.035, 0.97],
  fabric: [1.1, 0.07, 0.3, 0.035, 0.03, 1.0],
  paint: [2.4, 0.04, 0.0, 0.0, 0.02, 1.0],
  ground: [11.0, 0.2, 2.8, 0.09, 0.11, 0.72],
  foliage: [8.0, 0.15, 0.0, 0.0, 0.09, 0.84], // no mid lookup: canopy overdraw is the most expensive fill; the crowns break it up
  metal: [1.2, 0.03, 0.0, 0.0, 0.0, 1.0],
  tree: [7.0, 0.13, 0.0, 0.0, 0.08, 0.86],
};

const f = (n: number) => n.toFixed(4);
function profileGlsl() {
  return (Object.keys(SURFACE_PROFILES) as SurfaceProfile[]).map((k) => {
    const [ls, la, ms, ma, ha, sa] = SURFACE_PARAMS[k];
    return `#if FLW_SURFACE == ${SURFACE_PROFILES[k]}
  const vec4 FLW_A = vec4(${f(1 / ls)}, ${f(la)}, ${f(ms > 0 ? 1 / ms : 0)}, ${f(ma)});
  const vec2 FLW_B = vec2(${f(ha)}, ${f(sa)});
#endif`;
  }).join('\n');
}

const COMMON = /* glsl */ `
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


function stoneSurface(m:THREE.MeshLambertMaterial):THREE.MeshLambertMaterial {
 m.defines={...m.defines,FLW_SURFACE:3};m.userData.surface='stone';
 m.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\n'+COMMON);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+COMMON);
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n'+WORLDPOS);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+COLOR);
 };
 m.customProgramCacheKey=()=> 'flw-source-stone-surface-v1';m.needsUpdate=true;return m;
}
function strataTexture():THREE.CanvasTexture {
 const c=document.createElement('canvas');c.width=c.height=128;
 const x=c.getContext('2d');if(!x)throw Error('2D canvas unavailable for stone texture');
 const r=mulberry32(83);
 const grey=(v:number,a=1)=>`rgba(${Math.round(v*255)},${Math.round(v*255)},${Math.round(v*255)},${a})`;
 // Exact source woodkit.ts 128px strata canvas: order of RNG calls matters.
 x.fillStyle=grey(0.9);x.fillRect(0,0,128,128);
 for(let i=0;i<14;i++){x.fillStyle=grey(0.82+r()*0.14,0.6);x.fillRect(0,r()*128,128,2+r()*6);}
 for(let i=0;i<60;i++){x.fillStyle=grey(0.7+r()*0.3,0.3);x.fillRect(r()*128,r()*128,2+r()*5,2+r()*5);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
let owners=0, shared:THREE.MeshLambertMaterial|null=null;
export function acquireRockMaterial():THREE.MeshLambertMaterial {
 if(!shared)shared=stoneSurface(new THREE.MeshLambertMaterial({map:strataTexture(),vertexColors:true}));
 owners++;return shared;
}
export function releaseRockMaterial():void {
 if(owners<1)throw Error('Rock material owner underflow');
 if(--owners===0){const m=shared;shared=null;m?.map?.dispose();m?.dispose();}
}
export function rockMaterialOwners():number{return owners}
