/** MAT-ART-R01 ground-variant adapter. The original MAT-01 path is untouched: variant A is literally the faithful
 * GroundIntegration material. Every other mode builds its own TerrainMaterialResources from the same canonical
 * classification and the same shader program (identical GLSL and cache key), and differs only in the detail
 * textures and per-material uniforms passed to it. No existing source file is modified. */
import * as T from 'three';
import {TerrainMaterialResources,createTerrainMaterial,PROFILES,type QualityProfile} from '../terrain-material/render/terrain-material.ts';
import {srgbToLinear,linearToSrgb,boxBlurWrap,type SynthesizedTexture} from '../terrain-material/textures.ts';
import type {MaterialDefinition} from '../terrain-material/materials.ts';
import type {GroundIntegration} from '../env-p01/ground.ts';

/** In-scope materials. coastal-sand and bedrock are never altered by any mode. */
export const SCOPE=['forest-floor','meadow-turf'] as const;
export const GROUND_VARIANTS=['mat-01','mat-art-r01','diag-normal-off','diag-albedo-lowpass','diag-cavity-off','diag-meso-off','diag-scale-2x'] as const;
export type GroundVariant=typeof GROUND_VARIANTS[number];
export const VARIANT_LABELS:Record<GroundVariant,string>={
 'mat-01':'A · Original MAT-01','mat-art-r01':'B · MAT-ART-R01 stylized',
 'diag-normal-off':'D1 · original albedo, detail normals off','diag-albedo-lowpass':'D2 · albedo low-passed (<≈5 cm removed), original normals/AO',
 'diag-cavity-off':'D2b · cavity AO off, original albedo/normals','diag-meso-off':'D3a · meso/patch/macro tint neutral','diag-scale-2x':'D3b · detail tile scale ×2',
};

/** Rewrites the per-material uniforms exactly as TerrainMaterialResources' constructor derives them. */
export function applyDefinitions(resources:TerrainMaterialResources,definitions:readonly MaterialDefinition[]){
 const u=resources.uniforms;
 resources.definitions.forEach((original,i)=>{const d=definitions.find(x=>x.id===original.id);if(!d)throw Error('Missing variant definition '+original.id);
  (u.uMatScale.value[i] as T.Vector4).set(1/d.tileM,1/(d.tileM*d.mesoScale),d.normalStrength,d.heightBlend);
  (u.uMatWet.value[i] as T.Vector4).set(...d.wetTint,d.roughness.wet);
  (u.uMatMacroA.value[i] as T.Vector3).set(...d.macroTint[0]);(u.uMatMacroB.value[i] as T.Vector3).set(...d.macroTint[1]);
  (u.uMatExposure.value[i] as T.Vector3).set(...d.exposureTint);
  (u.uMatPatch.value[i] as T.Vector4).set(...d.patch.tint,1/d.patch.scaleM);
  (u.uMatMisc.value[i] as T.Vector4).set(d.patch.coverage,d.triplanar?1:0,d.streaks??0,d.mesoAmount);});
}
/** Shallow texture copy with fresh byte planes, so diagnostics never alias the original textures. */
const copy=(t:SynthesizedTexture):SynthesizedTexture=>({...t,albedo:t.albedo.slice(),surface:t.surface.slice()});
/** Diagnostic D2: removes albedo detail below ≈5 cm (two wrapped box passes, linear light). Height, normals, AO and
 * the far-field mean are the original bytes, so only albedo frequency content changes. */
export function lowpassAlbedo(t:SynthesizedTexture,tileM:number,cutoffM=.05):SynthesizedTexture{
 const out=copy(t),S=t.size,r=Math.max(1,Math.round(cutoffM/(tileM/S)/2));
 for(let c=0;c<3;c++){const f=new Float32Array(S*S);for(let i=0;i<S*S;i++)f[i]=srgbToLinear(t.albedo[i*4+c]/255);
  const b=boxBlurWrap(boxBlurWrap(f,S,r),S,r);for(let i=0;i<S*S;i++)out.albedo[i*4+c]=Math.round(linearToSrgb(Math.min(1,b[i]))*255);}
 return out;
}
/** Diagnostic D2b: cavity AO channel set to 1; everything else original. */
export function cavityOff(t:SynthesizedTexture):SynthesizedTexture{const out=copy(t);for(let i=0;i<t.size*t.size;i++)out.surface[i*4+2]=255;return out;}

export function diagnosticDefinitions(base:readonly MaterialDefinition[],variant:GroundVariant):MaterialDefinition[]{
 return base.map(d=>{if(!(SCOPE as readonly string[]).includes(d.id))return d;
  if(variant==='diag-normal-off')return {...d,normalStrength:0};
  if(variant==='diag-meso-off')return {...d,mesoAmount:0,patch:{...d.patch,tint:[1,1,1]},macroTint:[[1,1,1],[1,1,1]],exposureTint:[1,1,1]};
  if(variant==='diag-scale-2x')return {...d,tileM:d.tileM*2};
  return d;});
}

export interface VariantSource {definitions:readonly MaterialDefinition[];textures:Record<number,SynthesizedTexture[]>}

/** Owns at most one non-original resources/material pair at a time; A always comes from GroundIntegration. */
export class GroundVariants {
 variant:GroundVariant='mat-01';
 readonly ground:GroundIntegration;readonly baseDefinitions:readonly MaterialDefinition[];private stylized:VariantSource|null;
 private resources:TerrainMaterialResources|null=null;private material:T.MeshStandardMaterial|null=null;private dead=false;
 constructor(ground:GroundIntegration,baseDefinitions:readonly MaterialDefinition[],stylized:VariantSource|null=null){this.ground=ground;this.baseDefinitions=baseDefinitions;this.stylized=stylized;}
 setStylized(source:VariantSource){this.stylized=source;if(this.variant==='mat-art-r01')this.rebuild();}
 get active():T.Material{if(this.dead)throw Error('Ground variants disposed');return this.variant==='mat-01'||this.ground.mode!=='material'?this.ground.material:this.material!;}
 get activeResources():TerrainMaterialResources{return this.variant==='mat-01'?this.ground.resources:this.resources!;}
 set(variant:GroundVariant){if(this.dead)throw Error('Ground variants disposed');if(variant==='mat-art-r01'&&!this.stylized)throw Error('Stylized textures not loaded');this.variant=variant;this.rebuild();}
 setProfile(profile:QualityProfile){this.ground.setProfile(profile);this.rebuild();}
 private release(){this.material?.dispose();this.resources?.release();this.material=null;this.resources=null;}
 private rebuild(){
  this.release();if(this.variant==='mat-01')return;
  const size=PROFILES[this.ground.profile].textureSize,original=this.ground.prepared.textures[size],classification=this.ground.prepared.classification;
  let textures=original,definitions:readonly MaterialDefinition[]=this.baseDefinitions;
  if(this.variant==='mat-art-r01'){textures=this.stylized!.textures[size];definitions=this.stylized!.definitions;}
  else{
   const idx=classification.materials.map(id=>(SCOPE as readonly string[]).includes(id));
   if(this.variant==='diag-albedo-lowpass')textures=original.map((t,i)=>idx[i]?lowpassAlbedo(t,this.baseDefinitions[i].tileM):t);
   if(this.variant==='diag-cavity-off')textures=original.map((t,i)=>idx[i]?cavityOff(t):t);
   definitions=diagnosticDefinitions(this.baseDefinitions,this.variant);
  }
  this.resources=new TerrainMaterialResources(classification,textures,this.ground.profile).acquire();
  applyDefinitions(this.resources,definitions);
  // Same shader and debug state as the faithful adapter.
  this.resources.setDebug(this.ground.mode==='weights'?'weights':'off');
  this.material=createTerrainMaterial(this.resources);
 }
 setDebug(view:Parameters<TerrainMaterialResources['setDebug']>[0]){this.ground.resources.setDebug(view);this.resources?.setDebug(view);}
 snapshot(){const r=this.activeResources;return {variant:this.variant,profile:this.ground.profile,gpuBytes:r.memoryBytes,owners:r.ownerCount,disposed:r.disposed,
  variantOwners:this.resources?.ownerCount??0,textureLayers:r.albedo.image.depth,textureSize:r.albedo.image.width};}
 dispose(){if(this.dead)return;this.dead=true;this.release();}
}
