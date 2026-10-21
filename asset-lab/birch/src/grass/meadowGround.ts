import * as THREE from 'three';
import {fieldNoise,meadowDensity} from './naturalGroundCover.ts';
/** Optional D2R V3 albedo-only study. Not a replacement grass asset.
 * Single 2-triangle ground; texture constructed once, toggleable. */
export function createMeadowGroundTexture(seed=120626):THREE.CanvasTexture{
 const w=384,h=256,c=document.createElement('canvas');c.width=w;c.height=h;
 const ctx=c.getContext('2d');if(!ctx)throw Error('Ground canvas unavailable');
 const pixels=ctx.createImageData(w,h),data=pixels.data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const worldX=(x/(w-1)-.5)*44,worldZ=(.5-y/(h-1))*31;
  const cover=meadowDensity(worldX,worldZ,seed);
  const broad=fieldNoise(worldX*.31+7,worldZ*.31-18,seed+471)-.5;
  const fine=fieldNoise(worldX*3.2,worldZ*3.2,seed+177)-.5;
  // Keep ground readable as earth, never opaque green paint. Preserve neutral daylight.
  const variation=11*broad+4*fine;
  const i=(y*w+x)*4;
  data[i]=Math.max(0,Math.min(255,Math.round(179-16*cover+variation)));
  data[i+1]=Math.max(0,Math.min(255,Math.round(182-7*cover+variation)));
  data[i+2]=Math.max(0,Math.min(255,Math.round(157-13*cover+variation)));
  data[i+3]=255;
 }
 ctx.putImageData(pixels,0,0);
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
 map.anisotropy=2;map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;
 map.generateMipmaps=true;return map;
}
