/** Rendering adapter: turns a MaterialClassification and synthesised textures into GPU resources and a Three.js
 * material. Resources are shared by every terrain tile and LOD (one material, one program), are reference-counted
 * and can be disposed and recreated. */
import * as THREE from 'three';
import {MATERIALS,type MaterialDefinition} from '../materials.ts';
import type {MaterialClassification} from '../types.ts';
import type {SynthesizedTexture} from '../textures.ts';
import {DEBUG_VIEWS,FRAGMENT_DEBUG,FRAGMENT_MATERIAL,FRAGMENT_NORMAL,FRAGMENT_PARS,FRAGMENT_ROUGHNESS,VERTEX_MAIN,VERTEX_PARS,type DebugView} from './shader.ts';

export type QualityProfile='high'|'balanced'|'mobile';
export interface ProfileSettings {textureSize:number;mapDecimation:1|2;meso:boolean;antiTile:boolean;triplanar:boolean;anisotropy:number}
export const PROFILES:Record<QualityProfile,ProfileSettings>={
 high:{textureSize:512,mapDecimation:1,meso:true,antiTile:true,triplanar:true,anisotropy:8},
 balanced:{textureSize:512,mapDecimation:1,meso:true,antiTile:true,triplanar:false,anisotropy:4},
 mobile:{textureSize:256,mapDecimation:2,meso:false,antiTile:false,triplanar:false,anisotropy:2},
};
/** Debug colours (sRGB-ish display values) shared with the classification data maps. */
export const DEBUG_COLORS:[number,number,number][]=[[.18,.36,.16],[.67,.77,.38],[.91,.81,.55],[.5,.5,.52]];

function decimate(c:MaterialClassification,f:1|2){
 const {width:W,height:H}=c.lattice;if(f===1)return {weights:c.weights,attributes:c.attributes,width:W,height:H,cellM:c.lattice.cellM};
 const w=Math.floor((W-1)/f)+1,h=Math.floor((H-1)/f)+1,layers=c.weights.length/(W*H*4),weights=new Uint8Array(w*h*4*layers),attributes=new Uint8Array(w*h*4);
 for(let l=0;l<layers;l++)for(let j=0;j<h;j++)for(let i=0;i<w;i++)for(let q=0;q<4;q++)weights[l*w*h*4+(j*w+i)*4+q]=c.weights[l*W*H*4+(j*f*W+i*f)*4+q];
 for(let j=0;j<h;j++)for(let i=0;i<w;i++)for(let q=0;q<4;q++)attributes[(j*w+i)*4+q]=c.attributes[(j*f*W+i*f)*4+q];
 return {weights,attributes,width:w,height:h,cellM:c.lattice.cellM*f};
}

export class TerrainMaterialResources {
 readonly profile:QualityProfile;readonly settings:ProfileSettings;
 readonly weights:THREE.DataArrayTexture;readonly attributes:THREE.DataTexture;
 readonly albedo:THREE.DataArrayTexture;readonly surface:THREE.DataArrayTexture;
 readonly definitions:readonly MaterialDefinition[];readonly means:[number,number,number][];
 readonly uniforms:Record<string,THREE.IUniform>;
 readonly memoryBytes:{classification:number;detail:number;total:number};
 private owners=0;private disposedFlag=false;

 constructor(classification:MaterialClassification,textures:readonly SynthesizedTexture[],profile:QualityProfile){
  this.profile=profile;this.settings=PROFILES[profile];
  this.definitions=classification.materials.map(id=>{const d=MATERIALS.find(m=>m.id===id);if(!d)throw new Error('No definition for '+id);return d;});
  if(textures.length!==this.definitions.length)throw new Error('Texture count does not match material count');
  const S=textures[0].size;if(textures.some(t=>t.size!==S))throw new Error('All detail textures must share one size');
  const map=decimate(classification,this.settings.mapDecimation),layers=Math.ceil(this.definitions.length/4),N=this.definitions.length;
  const linearMip=<T extends THREE.Texture>(t:T):T=>{t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;};
  this.weights=linearMip(new THREE.DataArrayTexture(map.weights,map.width,map.height,layers));
  this.weights.wrapS=this.weights.wrapT=THREE.ClampToEdgeWrapping;
  this.attributes=linearMip(new THREE.DataTexture(map.attributes,map.width,map.height,THREE.RGBAFormat,THREE.UnsignedByteType));
  this.attributes.wrapS=this.attributes.wrapT=THREE.ClampToEdgeWrapping;
  const pack=(plane:'albedo'|'surface')=>{const data=new Uint8Array(S*S*4*N);textures.forEach((t,i)=>data.set(t[plane],i*S*S*4));
   const tex=linearMip(new THREE.DataArrayTexture(data,S,S,N));tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=this.settings.anisotropy;return tex;};
  this.albedo=pack('albedo');this.albedo.colorSpace=THREE.SRGBColorSpace;this.surface=pack('surface');
  this.means=textures.map(t=>t.meanLinear);
  const v3=(a:number[])=>new THREE.Vector3(a[0],a[1],a[2]);
  this.uniforms={
   uWeights:{value:this.weights},uAttributes:{value:this.attributes},uAlbedo:{value:this.albedo},uSurface:{value:this.surface},
   uLattice:{value:new THREE.Vector4(classification.lattice.west,classification.lattice.north,map.cellM,0)},
   uMapSize:{value:new THREE.Vector2(map.width,map.height)},
   uMatScale:{value:this.definitions.map(d=>new THREE.Vector4(1/d.tileM,1/(d.tileM*d.mesoScale),d.normalStrength,d.heightBlend))},
   uMatWet:{value:this.definitions.map(d=>new THREE.Vector4(...d.wetTint,d.roughness.wet))},
   uMatMacroA:{value:this.definitions.map(d=>v3(d.macroTint[0]))},uMatMacroB:{value:this.definitions.map(d=>v3(d.macroTint[1]))},
   uMatExposure:{value:this.definitions.map(d=>v3(d.exposureTint))},
   uMatPatch:{value:this.definitions.map(d=>new THREE.Vector4(...d.patch.tint,1/d.patch.scaleM))},
   uMatMisc:{value:this.definitions.map(d=>new THREE.Vector4(d.patch.coverage,d.triplanar?1:0,d.streaks??0,d.mesoAmount))},
   uMatMean:{value:this.means.map(v3)},uDebugColor:{value:DEBUG_COLORS.slice(0,N).map(v3)},
   uDetailFade:{value:new THREE.Vector2(35,170)},uFarBlend:{value:new THREE.Vector2(350,1800)},uAntiTile:{value:new THREE.Vector2(260,1/9)},
   uHeightBlend:{value:1},uNormalScale:{value:1},uTriplanarOn:{value:this.settings.triplanar?1:0},uDebug:{value:0},uForce:{value:-1},
  };
  const mip=4/3,classBytes=(map.weights.length+map.attributes.length)*mip,detailBytes=S*S*4*N*2*mip;
  this.memoryBytes={classification:Math.round(classBytes),detail:Math.round(detailBytes),total:Math.round(classBytes+detailBytes)};
 }
 get disposed(){return this.disposedFlag;}
 acquire(){if(this.disposedFlag)throw new Error('Terrain material resources were disposed');this.owners++;return this;}
 release(){if(this.owners<1)throw new Error('Terrain material resource owner underflow');if(--this.owners===0)this.dispose();}
 get ownerCount(){return this.owners;}
 setDebug(view:DebugView){const i=DEBUG_VIEWS.indexOf(view);if(i<0)throw new Error('Unknown debug view '+view);this.uniforms.uDebug.value=i;}
 forceMaterial(index:number){this.uniforms.uForce.value=index;}
 dispose(){if(this.disposedFlag)return;this.disposedFlag=true;for(const t of [this.weights,this.attributes,this.albedo,this.surface])t.dispose();}
}

/** One shared material per resources instance; the program is identical for every tile and LOD. */
export function createTerrainMaterial(resources:TerrainMaterialResources):THREE.MeshStandardMaterial{
 const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,metalness:0,side:THREE.DoubleSide});
 const N=resources.definitions.length;
 material.defines={MAT_COUNT:N,MAT_LAYERS:Math.ceil(N/4),...(resources.settings.meso?{TM_MESO:''}:{}),...(resources.settings.antiTile?{TM_ANTITILE:''}:{})};
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,resources.uniforms);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\n'+VERTEX_PARS).replace('#include <project_vertex>','#include <project_vertex>\n'+VERTEX_MAIN);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+FRAGMENT_PARS)
   .replace('#include <map_fragment>',FRAGMENT_MATERIAL).replace('#include <roughnessmap_fragment>',FRAGMENT_ROUGHNESS)
   .replace('#include <normal_fragment_maps>',FRAGMENT_NORMAL).replace('#include <dithering_fragment>','#include <dithering_fragment>\n'+FRAGMENT_DEBUG);
 };
 material.customProgramCacheKey=()=>`aurora-terrain-material-v1-${resources.profile}-${N}`;
 material.userData.terrainMaterial=true;
 return material;
}
