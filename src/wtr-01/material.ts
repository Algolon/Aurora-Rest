import * as THREE from 'three';
import {PALETTE,WATER_TYPES,renderQualityDetail,type Quality,type WaterType} from './config.ts';
export type WaveStudy = 'original'|'A'|'B'|'C';
export const WAVE_STUDIES:readonly WaveStudy[]=['original','A','B','C'];
export function waveStudyId(study:WaveStudy):number { const n=WAVE_STUDIES.indexOf(study); if(n<0)throw new Error('Unknown wave study '+study); return n; }

/**
 * WTR-01 reusable opaque stylized-water shader: no refraction buffer, no SSR,
 * no invented bathymetry. Animation changes surface NORMALS only.
 * The underlying GEO-R02B-R1 geometric shoreline stays completely static.
 */
const VERTEX = `
attribute float waterKind;
varying float vWaterKind;
varying vec3 vWaterWorld;
#include <common>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
void main(){
  vec4 worldPosition = modelMatrix * vec4(position,1.0);
  vWaterWorld = worldPosition.xyz;
  vWaterKind = waterKind;
  vec4 mvPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <fog_vertex>
}`;
const FRAGMENT = `
precision highp float;
uniform float uTime;
uniform float uStudy;
uniform float uShowLakesOnly;
uniform vec3 uSunDirection;
uniform vec3 uBase[4];
uniform vec3 uDark[4];
uniform vec3 uSky[4];
uniform vec4 uSurface[4];  // frequency, speed, normal-slope, roughness
uniform vec2 uOptical[4];  // glint, Fresnel
uniform vec2 uWind[4];
varying float vWaterKind;
varying vec3 vWaterWorld;
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
void main(){
  #include <logdepthbuf_fragment>
  if(uShowLakesOnly > 0.5 && (vWaterKind < 0.5 || vWaterKind > 2.5)) discard;
  vec3 base = vWaterKind > 2.5 ? uBase[3] : vWaterKind > 1.5 ? uBase[2] : vWaterKind > 0.5 ? uBase[1] : uBase[0];
  vec3 dark = vWaterKind > 2.5 ? uDark[3] : vWaterKind > 1.5 ? uDark[2] : vWaterKind > 0.5 ? uDark[1] : uDark[0];
  vec3 sky  = vWaterKind > 2.5 ? uSky[3]  : vWaterKind > 1.5 ? uSky[2]  : vWaterKind > 0.5 ? uSky[1]  : uSky[0];
  vec4 surface = vWaterKind > 2.5 ? uSurface[3] : vWaterKind > 1.5 ? uSurface[2] : vWaterKind > 0.5 ? uSurface[1] : uSurface[0];
  vec2 optical = vWaterKind > 2.5 ? uOptical[3] : vWaterKind > 1.5 ? uOptical[2] : vWaterKind > 0.5 ? uOptical[1] : uOptical[0];
  vec2 wind = vWaterKind > 2.5 ? uWind[3] : vWaterKind > 1.5 ? uWind[2] : vWaterKind > 0.5 ? uWind[1] : uWind[0];

  // The Home Cove visual region is a deliberately broad soft art-direction
  // mask around the existing R1 review camera, NOT a shore-distance field.
  if(vWaterKind < 0.5) {
    float shelter = 1.0 - smoothstep(450.0,1950.0,distance(vWaterWorld.xz,vec2(-1670.0,-1900.0)));
    base = mix(base,vec3(0.115,0.270,0.295),shelter*0.23);
    surface.z *= 1.0 - shelter*0.52;
    surface.y *= 1.0 - shelter*0.35;
  }
  vec2 dir=normalize(wind);
  vec2 grad=vec2(0.0);
  #if WATER_DETAIL > 0
    if(uStudy < 0.5){
      // Protected WTR-01R original formulation, for *matched* visual baselines.
      float p=dot(vWaterWorld.xz,dir)*surface.x+uTime*surface.y;
      float q=dot(vWaterWorld.xz,vec2(-dir.y,dir.x)*0.88+dir*0.38)*surface.x*1.61-uTime*surface.y*0.73;
      grad=surface.z*(cos(p)*dir+0.44*cos(q)*(vec2(-dir.y,dir.x)*0.88+dir*0.38));
      #if WATER_DETAIL > 1
        float r=dot(vWaterWorld.xz,vec2(dir.y,-dir.x))*surface.x*2.42+uTime*surface.y*1.27;
        grad += surface.z*0.18*cos(r)*vec2(dir.y,-dir.x);
      #endif
    } else if(uStudy < 1.5){
      // A: conservative frequency and amplitude rebalancing; no domain warp.
      vec2 side=vec2(-dir.y,dir.x);
      float p=dot(vWaterWorld.xz,dir)*surface.x*.73+uTime*surface.y*.83;
      float q=dot(vWaterWorld.xz,normalize(dir*.78+side*.62))*surface.x*1.12-uTime*surface.y*.64+1.27;
      grad=surface.z*(.58*cos(p)*dir+.19*cos(q)*normalize(dir*.78+side*.62));
      #if WATER_DETAIL > 1
        float r=dot(vWaterWorld.xz,normalize(dir*.48-side*.88))*surface.x*1.83+uTime*surface.y*.58+2.09;
        grad+=surface.z*.085*cos(r)*normalize(dir*.48-side*.88);
      #endif
    } else {
      // B: gentle, non-stochastic low-frequency directional variation.
      // C: same waves, with independent screen-space damping per component.
      vec2 side=vec2(-dir.y,dir.x);
      float drift=.19*sin(dot(vWaterWorld.xz,vec2(.0026,.0014))+.4)
                 +.08*sin(dot(vWaterWorld.xz,vec2(-.0018,.0031))-1.3);
      vec2 primary=normalize(dir+drift*side);
      vec2 secondary=normalize(dir*.63+side*.78);
      float p=dot(vWaterWorld.xz,primary)*surface.x*.39+uTime*surface.y*.53;
      float q=dot(vWaterWorld.xz,secondary)*surface.x*1.13-uTime*surface.y*.81+1.83;
      float a=1.0, b=1.0, c=1.0;
      if(uStudy > 2.5){
        // Phase footprint in screen pixels; suppress subpixel ripple detail.
        // Derivatives available in WebGL2 and Three.js WebGL1 with derivatives.
        a=1.0-smoothstep(.90,2.65,fwidth(p));
        b=1.0-smoothstep(.90,2.65,fwidth(q));
      }
      grad=surface.z*(.43*a*cos(p)*primary+.21*b*cos(q)*secondary);
      #if WATER_DETAIL > 1
        vec2 tertiary=normalize(dir*.47-side*.88);
        float r=dot(vWaterWorld.xz,tertiary)*surface.x*2.03+uTime*surface.y*1.01+2.37;
        if(uStudy>2.5)c=1.0-smoothstep(.90,2.65,fwidth(r));
        grad+=surface.z*.072*c*cos(r)*tertiary;
      #endif
    }
  #endif
  vec3 normal=normalize(vec3(-grad.x,1.0,-grad.y));
  vec3 eye=normalize(cameraPosition-vWaterWorld);
  float facing=max(dot(normal,eye),0.0);
  float fresnel=pow(1.0-facing,4.0);
  float slowTonal=0.42+0.12*sin(dot(vWaterWorld.xz,vec2(0.0047,-0.0029)));
  vec3 water=mix(base,dark,slowTonal);
  water *= 0.88+0.12*max(dot(normal,normalize(uSunDirection)),0.0);
  water=mix(water,sky,clamp(fresnel*optical.y,0.0,0.4));
  #if WATER_DETAIL > 0
    vec3 halfway=normalize(eye+normalize(uSunDirection));
    float shine=pow(max(dot(normal,halfway),0.0),mix(14.0,115.0,1.0-surface.w));
    water += sky*shine*optical.x;
  #endif
  gl_FragColor=vec4(water,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

function styles<T>(f:(type:WaterType)=>T):T[]{return WATER_TYPES.map(f);}
export function createWaterShader(quality:Quality,sunDirection:THREE.Vector3,study:WaveStudy='original'):THREE.ShaderMaterial {
  const material=new THREE.ShaderMaterial({
    name:'Aurora WTR-01 '+quality,
    vertexShader:VERTEX, fragmentShader:FRAGMENT,
    defines:{WATER_DETAIL:renderQualityDetail(quality)},
    side:THREE.DoubleSide, transparent:false, depthWrite:true, fog:true,
    // ShaderMaterial does not inject ShaderLib uniforms automatically. Fog
    // chunks declare fogColor/fogDensity (and fogNear/fogFar for linear fog);
    // omitting them causes WebGLUniforms.upload to read undefined.value.
    uniforms:{
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uTime:{value:0},
      uStudy:{value:waveStudyId(study)},
      uShowLakesOnly:{value:0},
      uSunDirection:{value:sunDirection.clone().normalize()},
      uBase:{value:styles(k=>new THREE.Color(PALETTE[k].base))},
      uDark:{value:styles(k=>new THREE.Color(PALETTE[k].dark))},
      uSky:{value:styles(k=>new THREE.Color(PALETTE[k].sky))},
      uSurface:{value:styles(k=>{const p=PALETTE[k];return new THREE.Vector4(p.frequency,p.speed,p.slope,p.roughness);})},
      uOptical:{value:styles(k=>new THREE.Vector2(PALETTE[k].glint,PALETTE[k].fresnel))},
      uWind:{value:styles(k=>new THREE.Vector2(...PALETTE[k].wind))}
    }
  });
  return material;
}
export function createOceanGeometry(size=40000):THREE.PlaneGeometry {
  const geometry=new THREE.PlaneGeometry(size,size);
  geometry.rotateX(-Math.PI/2);
  geometry.setAttribute('waterKind',new THREE.Float32BufferAttribute(new Float32Array(geometry.getAttribute('position').count),1));
  return geometry;
}
export function createCanonicalWaterGeometry(positions:Float32Array,kinds:Float32Array):THREE.BufferGeometry {
  if(positions.length/3!==kinds.length)throw new Error('Water render-classification count mismatch');
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('waterKind',new THREE.BufferAttribute(kinds,1));
  geometry.computeBoundingSphere();
  return geometry;
}
