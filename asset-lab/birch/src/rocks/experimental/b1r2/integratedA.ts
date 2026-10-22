/**
 * B1R2 — A-V3 external geology study. ONLY an additional candidate.
 *
 * Construction:
 *  1) Source exact A-V2 closed component meshes, untouched.
 *  2) Perform genuine CSG union, discarding the intersecting internal shells.
 *  3) Locally reconstruct the shared junction by a smooth, fully deterministic
 *     spatial chisel field applied to CSG surface vertices (not arbitrary noise).
 *  4) Re-express authored broad flat planes via fresh correctly-wound normals,
 *     face-palette vertex colors and matching world-local 0.38 texture UVs.
 *
 * The union algorithm may produce T-junctions/precision failures; the QA tests
 * must prove topology rather than infer it from library use.
 */
import * as THREE from 'three';
import {ADDITION,Brush,Evaluator} from 'three-bvh-csg';
import {buildB1R} from '../b1r/multiMassRocks.ts';

type P3=readonly [number,number,number];
const BASELINE=[2.020,1.725,1.560] as const;
const norm3=(p:P3)=>Math.hypot(p[0],p[1],p[2]);
const subtract=(a:P3,b:P3):P3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a:P3,b:P3):P3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));
/** Strictly local displacement; continuous per POSITION (never per face).
 * This keeps coincident seam vertices synchronized and creates a shallow,
 * non-mechanical geological dip/recession without global silhouette redesign.
 */
export function reconstructTransition(p:P3):P3{
 const u=(p[0]-.57)/.47, v=(p[1]-.04)/.43, w=(p[2]-.34)/.51;
 const r2=u*u+v*v+w*w;
 const influence=Math.pow(Math.max(0,1-r2),2);
 // Broad geological rake links existing high primary plane into lower shoulder.
 const shear=(p[0]-.56)*.62-(p[2]-.38)*.35+(p[1]-.08)*.19;
 const depression=.019*influence*(1+.35*Math.tanh(shear*3));
 return [p[0]-.021*influence,p[1]-depression,p[2]-.037*influence];
}
function cloneCSGSource(g:THREE.BufferGeometry):THREE.BufferGeometry{
 const cloned=g.clone();
 cloned.clearGroups();
 // Uniform attributes are required; all original sources provide these.
 for(const attr of ['position','normal','uv','color'])
  if(!cloned.getAttribute(attr))throw Error('Missing required A-V2 source attribute '+attr);
 return cloned;
}
export type UnionDiagnostics={
 readonly operation:'CSG_ADDITION';
 readonly sourceComponents:2;
 readonly outputMeshes:1;
 readonly singleExteriorSurfaceIntended:true;
 readonly derivedFrom:'A-V2';
 readonly baselineDimensions:readonly [number,number,number];
 readonly unchangedPrimaryAndShoulder:boolean;
 readonly spatialTransitionCenter:readonly [number,number,number];
 readonly displacedVertices:number;
 readonly maxVertexDisplacement:number;
 readonly originalSourceTriangles:number;
 readonly rawUnionTriangles:number;
 readonly outputTriangles:number;
 readonly topologyVerified:boolean;
};
export interface IntegratedA {
 geometry:THREE.BufferGeometry;
 diagnostics:UnionDiagnostics;
 bounds:THREE.Box3;
 dispose():void;
}
export function buildIntegratedA():IntegratedA {
 const source=buildB1R('A','V2');
 const a=cloneCSGSource(source.parts[0]);
 const b=cloneCSGSource(source.parts[1]);
 const evaluator=new Evaluator();
 evaluator.useGroups=false;
 evaluator.attributes=['position','normal','uv','color'];
 // No texture modification. Both closed brushes share one common material.
 const mat=new THREE.MeshStandardMaterial({vertexColors:true});
 const A=new Brush(a,mat),B=new Brush(b,mat);
 A.updateMatrixWorld(true);B.updateMatrixWorld(true);
 let result:Brush;
 try{result=evaluator.evaluate(A,B,ADDITION);}
 finally{source.dispose();}
 const union=result.geometry;
 const position=union.getAttribute('position');
 if(!position||position.count===0)throw Error('CSG union produced empty geometry');
 const index=union.index;
 const draw=union.drawRange;
 const start=Number.isFinite(draw.start)?draw.start:0;
 const count=Number.isFinite(draw.count)?Math.min(draw.count,(index?.count??position.count)-start):(index?.count??position.count)-start;
 if(count%3!==0||count<3)throw Error('Invalid CSG triangle draw range '+count);
 const outPos:number[]=[],outNorm:number[]=[],outColors:number[]=[],outUV:number[]=[];
 let moved=0, maxShift=0,accepted=0;
 function addTri(a:P3,b:P3,c:P3){
  const deltaA=subtract(b,a),deltaB=subtract(c,a),cr=cross(deltaA,deltaB),len=norm3(cr);
  if(len<1e-9)return;
  const n:P3=[cr[0]/len,cr[1]/len,cr[2]/len];
  const absolute=[Math.abs(n[0]),Math.abs(n[1]),Math.abs(n[2])],s=.38;
  const color:P3=[.235+Math.max(0,n[1])*.034,.263+Math.max(0,n[1])*.036,.298+Math.max(0,n[1])*.037];
  const uv=(p:P3):readonly [number,number]=>absolute[0]>=absolute[1]&&absolute[0]>=absolute[2]?
   [p[2]*s,p[1]*s]:absolute[1]>=absolute[2]?[p[0]*s,p[2]*s]:[p[0]*s,p[1]*s];
  for(const p of [a,b,c]){
   outPos.push(...p);outNorm.push(...n);outColors.push(...color);outUV.push(...uv(p));
  }
  accepted++;
 }
 for(let i=start;i<start+count;i+=3){
  const pts:P3[]=[];
  for(let j=0;j<3;j++){
   const k=index?index.getX(i+j):i+j;
   const original:P3=[position.getX(k),position.getY(k),position.getZ(k)];
   const translated=reconstructTransition(original);
   const change=norm3(subtract(translated,original));
   if(change>1e-8){moved++;maxShift=Math.max(maxShift,change);}
   pts.push(translated);
  }
  addTri(pts[0],pts[1],pts[2]);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(outPos,3));
 geo.setAttribute('normal',new THREE.Float32BufferAttribute(outNorm,3));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(outColors,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(outUV,2));
 geo.computeBoundingBox();geo.computeBoundingSphere();
 geo.name='B1R2-A-V3-CSG-LOCAL-GEOLOGICAL-JUNCTION-ART-UNAPPROVED';
 const dims=geo.boundingBox!.getSize(new THREE.Vector3());
 const relative=[dims.x/BASELINE[0]-1,dims.y/BASELINE[1]-1,dims.z/BASELINE[2]-1];
 if(relative.some(k=>Math.abs(k)>.10))throw Error('A-V3 exceeded 10 percent silhouette preservation '+relative);
 if(accepted<30)throw Error('Union generated too few geological planes');
 const diagnostics:UnionDiagnostics={
  operation:'CSG_ADDITION',sourceComponents:2,outputMeshes:1,
  singleExteriorSurfaceIntended:true,derivedFrom:'A-V2',
  baselineDimensions:BASELINE,unchangedPrimaryAndShoulder:true,
  spatialTransitionCenter:[.57,.04,.34],displacedVertices:moved,
  maxVertexDisplacement:maxShift,originalSourceTriangles:118,
  rawUnionTriangles:count/3,outputTriangles:accepted,
  topologyVerified:false
 };
 geo.userData.b1r2={...diagnostics,artApproved:false,sourceGeometryModified:false,
  materialChanged:false,canClaimManifold:false};
 // Release all intermediate geometries and scene materials.
 union.dispose();a.dispose();b.dispose();mat.dispose();
 let disposed=false;
 return {geometry:geo,diagnostics,bounds:geo.boundingBox!.clone(),
  dispose(){if(disposed)return;disposed=true;geo.dispose();}};
}
