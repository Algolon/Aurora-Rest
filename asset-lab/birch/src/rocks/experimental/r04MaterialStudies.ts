/** ASSET-01E2R-A — R04 geometry/material studies. Entirely isolated from production rock family. */
import * as THREE from 'three';
import {buildRefinedR04,type R04GeometryStudy} from './r04RefinementCore.ts';
import {rockR04Geometry} from './r04HeroBoulder.ts';
export type R04MaterialStudy='M1'|'M2'|'M3';
export function r04StudyGeometry(study:R04GeometryStudy):THREE.BufferGeometry {
 if(study==='G0')return rockR04Geometry({seed:37,detail:'refined'});
 const d=buildRefinedR04(study),g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(d.positions,3));
 g.setAttribute('normal',new THREE.Float32BufferAttribute(d.normals,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(d.colors,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(d.uv,2));
 g.computeBoundingBox();g.computeBoundingSphere();
 g.name='R04-preserved-'+study+'-ART-UNAPPROVED';
 g.userData.r04Refinement={study,appliedCuts:d.appliedCuts,sourceTriangles:d.sourceTriangles,
  maxLocalShiftM:d.maximumVertexShiftM,artApproved:false,productionIntegrated:false,
  separateClosedComponents:2,booleanUnion:false};
 return g;
}
function hash(i:number,j:number,seed:number):number {
 let x=Math.imul(i,374761393)^Math.imul(j,668265263)^Math.imul(seed,1442695041);
 x=Math.imul(x^(x>>>13),1274126177);
 return ((x^(x>>>16))>>>0)/4294967295;
}
function fade(v:number):number{return v*v*(3-2*v)}
function noise(x:number,y:number,seed:number):number {
 const ix=Math.floor(x),iy=Math.floor(y),fx=fade(x-ix),fy=fade(y-iy),period=32;
 const h=(a:number,b:number)=>hash(((a%period)+period)%period,((b%period)+period)%period,seed);
 return (h(ix,iy)*(1-fx)+h(ix+1,iy)*fx)*(1-fy)
  +(h(ix,iy+1)*(1-fx)+h(ix+1,iy+1)*fx)*fy;
}
function maps(study:R04MaterialStudy):{albedo:THREE.CanvasTexture;normal:THREE.CanvasTexture;roughness:THREE.CanvasTexture} {
 const dim=256;
 const make=()=>{const c=document.createElement('canvas');c.width=c.height=dim;return c;};
 const ca=make(),cn=make(),cr=make();
 const a=ca.getContext('2d'),n=cn.getContext('2d'),r=cr.getContext('2d');
 if(!a||!n||!r)throw Error('Canvas 2D context missing for R04 procedural textures');
 const ia=a.createImageData(dim,dim),inn=n.createImageData(dim,dim),ir=r.createImageData(dim,dim);
 const h=(x:number,y:number)=> {
  const low=noise(x/32,y/32,11)-.5;
  const mid=noise(x/8,y/8,23)-.5;
  const fine=noise(x/2,y/2,37)-.5;
  const mineral=study==='M1'?0:Math.sin((x+y*.42)*Math.PI/32)*.012;
  return low*.50+mid*.24+fine*.09+mineral;
 };
 for(let y=0;y<dim;y++)for(let x=0;x<dim;x++){
   const i=(y*dim+x)*4;
   const height=h(x,y),lower=h((x+dim-1)%dim,y),upper=h((x+1)%dim,y);
   const hDown=h(x,(y+dim-1)%dim),hUp=h(x,(y+1)%dim);
   const vein=study==='M1'?0:Math.pow(Math.max(0,Math.sin((x*.42+y*.28)*Math.PI/16)),38)*(study==='M2'?12:9);
   const grain=height*20-vein;
   const tint=study==='M3'?[0,1,1]:study==='M2'?[0,0,2]:[2,1,0];
   for(let k=0;k<3;k++)ia.data[i+k]=Math.max(0,Math.min(255,236+grain+tint[k]));
   ia.data[i+3]=255;
   const bump=(study==='M1'?.11:study==='M2'?.28:.19);
   inn.data[i]=Math.max(0,Math.min(255,128+(lower-upper)*bump*90));
   inn.data[i+1]=Math.max(0,Math.min(255,128+(hDown-hUp)*bump*90));
   inn.data[i+2]=Math.max(0,Math.min(255,255-(Math.abs(lower-upper)+Math.abs(hDown-hUp))*bump*3));
   inn.data[i+3]=255;
   const rough=Math.max(210,Math.min(255,238+height*12));
   ir.data[i]=ir.data[i+1]=ir.data[i+2]=rough;ir.data[i+3]=255;
 }
 a.putImageData(ia,0,0);n.putImageData(inn,0,0);r.putImageData(ir,0,0);
 const texture=(canvas:HTMLCanvasElement,isColor=false)=>{
  const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.anisotropy=4;t.generateMipmaps=true;if(isColor)t.colorSpace=THREE.SRGBColorSpace;return t;
 };
 return {albedo:texture(ca,true),normal:texture(cn),roughness:texture(cr)};
}
export interface R04MaterialStudies {
 readonly materials:Readonly<Record<R04MaterialStudy,THREE.MeshStandardMaterial>>;
 readonly textureCount:number;
 readonly textureSize:number;
 dispose():void;
}
export function createR04MaterialStudies():R04MaterialStudies {
 const materials={} as Record<R04MaterialStudy,THREE.MeshStandardMaterial>;
 const owned:THREE.Texture[]=[];
 for(const study of ['M1','M2','M3'] as const){
   const textures=maps(study);owned.push(...Object.values(textures));
   const mat=new THREE.MeshStandardMaterial({
    color:0xffffff,vertexColors:true,map:textures.albedo,
    normalMap:textures.normal,normalScale:new THREE.Vector2(study==='M1'?.12:study==='M2'?.28:.20),
    roughnessMap:textures.roughness,roughness:study==='M1'?.92:.94,metalness:0,
    side:THREE.FrontSide
   });
   mat.name='R04-'+study+'-UNAPPROVED';
   mat.userData.r04Study=study;
   if(study==='M3'){
     // Local shader hook: weathering remains at physically lower-facing stone zones.
     // No global shader chunks or shared Aurora materials are modified.
     mat.onBeforeCompile=shader=>{
       const varying='varying vec3 vR04Local;\n';
       shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\n'+varying);
       shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+varying);
       shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvR04Local=position;');
       shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nfloat r04Low=1.0-smoothstep(-0.16,0.77,vR04Local.y);\nfloat r04Patch=0.5+0.5*sin(vR04Local.x*6.3+sin(vR04Local.z*4.2))*sin(vR04Local.z*5.7);\nfloat r04Moss=r04Low*smoothstep(0.51,0.79,r04Patch)*0.22;\ndiffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.67,0.89,0.60),r04Moss);');
     };
     mat.customProgramCacheKey=()=> 'r04-e2r-local-weather-v1';
   }
   materials[study]=mat;
 }
 let disposed=false;
 return {materials,textureCount:owned.length,textureSize:256,dispose(){
  if(disposed)return;disposed=true;
  for(const mat of Object.values(materials))mat.dispose();
  for(const tex of owned)tex.dispose();
 }};
}
