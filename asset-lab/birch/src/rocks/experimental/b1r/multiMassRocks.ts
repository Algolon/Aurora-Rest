/**
 * ASSET-01E2R-B1R — isolated A/B secondary-mass experiments.
 * V0 = byte-identical authored B1 geometry.
 * V1 = one subtle, closed, independently authored embedded stone shoulder.
 * V2 = still one shoulder, with slightly stronger sculptural emergence and
 *      a different directional plane rhythm (NOT a collection of primitives).
 *
 * Two closed intersecting solids are NOT a Boolean manifold union. We retain
 * each component's identity for seam inspection; both use one shared material.
 * No source B1/G1/A2 changes. The primary's raw geometry is never transformed.
 */
import * as THREE from 'three';
import {buildRockArchetype} from '../b1/rockArchetypes.ts';

export type MultiMassArchetype='A'|'B';
export type MultiMassVersion='V0'|'V1'|'V2';
type V3=[number,number,number];
type Plane=readonly [number,number,number,number];
type Face={vertices:V3[];source:number};
export interface SecondaryMassRecipe {
 readonly name:string;
 readonly purpose:string;
 readonly center:V3;
 readonly extents:V3;
 readonly cuts:readonly Plane[];
}
type RecipeSet=Readonly<Record<'V1'|'V2',SecondaryMassRecipe>>;
const RECIPES:Readonly<Record<MultiMassArchetype,RecipeSet>>={
 A:{
  V1:{
   name:'Embedded lower-right angular shoulder',
   purpose:'A small transverse foothill emerges through the front-right lower flank',
   center:[.62,-.07,.29],extents:[.46,.38,.42],
   cuts:[
    [.21,1,.18,.325],[-.54,.76,.24,.44],[.75,.46,.25,.48],
    [-.84,.08,.50,.43],[.71,-.07,-.69,.51],
    [-.20,.17,1,.355],[.12,.11,-1,.395],
    [-.41,-.81,.23,.41],[.64,-.63,.12,.43],
    [.20,.72,.68,.44]
   ]
  },
  V2:{
   name:'Tightly interlocked oblique shoulder',
   purpose:'A larger asymmetric flange with raked crown, tucked inner buttress and a short receding joint',
   center:[.60,-.045,.32],extents:[.51,.46,.44],
   cuts:[
    [.18,1,.30,.386],[-.67,.68,.23,.50],[.75,.38,.31,.48],
    [-.85,.18,.39,.51],[.78,.06,-.62,.54],
    [-.14,.29,1,.387],[.24,.11,-1,.423],
    [-.40,-.77,.24,.46],[.60,-.70,.21,.44],
    [-.57,.44,.65,.43],[.32,.74,-.52,.48]
   ]
  }
 },
 B:{
  V1:{
   name:'Broad embedded down-glacier shoulder',
   purpose:'An elongated supporting stone mass emerges from the lower right-side glacis',
   center:[2.11,-.075,.23],extents:[.79,.53,.66],
   cuts:[
    [.16,1,.15,.430],[-.52,.82,.22,.58],[.63,.64,.18,.62],
    [-.90,.15,.31,.72],[.84,.20,-.37,.66],
    [-.18,.19,1,.575],[.20,.13,-1,.585],
    [-.63,-.60,.20,.66],[.62,-.67,.19,.64],
    [.25,.78,.54,.62]
   ]
  },
  V2:{
   name:'Interlocking glacial fracture shoulder',
   purpose:'A deliberately oblique wedge runs into the main body and its exposed face follows the dominant glacial rake',
   center:[2.05,-.025,.26],extents:[.86,.55,.69],
   cuts:[
    [.10,1,.22,.494],[-.60,.78,.24,.70],[.76,.45,.24,.69],
    [-.91,.10,.32,.71],[.81,.24,-.47,.70],
    [-.23,.24,1,.604],[.15,.16,-1,.617],
    [-.63,-.60,.23,.67],[.54,-.73,.30,.72],
    [-.40,.81,.51,.67],[.37,.70,-.62,.70]
   ]
  }
 }
};
export const B1R_RECIPES=RECIPES;
const sub=(a:V3,b:V3):V3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a:V3,b:V3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:V3,b:V3):V3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normalize=(a:V3):V3=>{const k=Math.hypot(...a);if(k<1e-10)throw Error('Degenerate B1R vector');return[a[0]/k,a[1]/k,a[2]/k];};
const mix=(a:V3,b:V3,t:number):V3=>[a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t,a[2]*(1-t)+b[2]*t];
const quant=(p:V3)=>p.map(x=>Math.round(x*100000)).join(',');
function box(e:V3):Face[]{
 const [x,y,z]=e;
 const a:V3=[-x,-y,-z],b:V3=[x,-y,-z],c:V3=[x,y,-z],d:V3=[-x,y,-z];
 const f:V3=[-x,-y,z],g:V3=[x,-y,z],h:V3=[x,y,z],i:V3=[-x,y,z];
 return [
  {vertices:[a,d,c,b],source:-1},
  {vertices:[f,g,h,i],source:-2},
  {vertices:[a,f,i,d],source:-3},
  {vertices:[b,c,h,g],source:-4},
  {vertices:[a,b,g,f],source:-5},
  {vertices:[d,i,h,c],source:-6}
 ];
}
function clip(poly:Face[],plane:Plane,index:number):Face[]{
 const remaining:Face[]=[],hits:V3[]=[];
 const distance=(p:V3)=>p[0]*plane[0]+p[1]*plane[1]+p[2]*plane[2]-plane[3];
 for(const face of poly){
  const out:V3[]=[];
  for(let j=0;j<face.vertices.length;j++){
   const a=face.vertices[j],b=face.vertices[(j+1)%face.vertices.length];
   const da=distance(a),db=distance(b),ia=da<=1e-8,ib=db<=1e-8;
   if(ia)out.push(a);
   if(ia!==ib){const p=mix(a,b,da/(da-db));out.push(p);hits.push(p);}
  }
  if(out.length>=3)remaining.push({vertices:out,source:face.source});
 }
 const map=new Map<string,V3>();for(const p of hits)map.set(quant(p),p);
 const pts=[...map.values()];
 if(pts.length<3)return remaining;
 const centroid:V3=[0,0,0];
 for(const p of pts)for(let k=0;k<3;k++)centroid[k]+=p[k]/pts.length;
 const n=normalize([plane[0],plane[1],plane[2]]);
 const pivot:V3=Math.abs(n[1])<.85?[0,1,0]:[1,0,0];
 const u=normalize(cross(pivot,n)),v=cross(n,u);
 pts.sort((a,b)=>{
  const d1=sub(a,centroid),d2=sub(b,centroid);
  return Math.atan2(dot(d1,v),dot(d1,u))-Math.atan2(dot(d2,v),dot(d2,u));
 });
 remaining.push({vertices:pts,source:index});
 return remaining;
}
function buildSecondary(recipe:SecondaryMassRecipe):THREE.BufferGeometry{
 let faces=box(recipe.extents);
 for(const [i,p] of recipe.cuts.entries())faces=clip(faces,p,i);
 const pos:number[]=[],nrm:number[]=[],uv:number[]=[],col:number[]=[];
 const emit=(a:V3,b:V3,c:V3)=>{
  const cr=cross(sub(b,a),sub(c,a)),len=Math.hypot(...cr);
  if(len<1e-9)return;
  const n:V3=[cr[0]/len,cr[1]/len,cr[2]/len];
  const axes=n.map(Math.abs),s=.38;
  const getUv=(p:V3):[number,number]=>axes[0]>=axes[1]&&axes[0]>=axes[2]?[p[2]*s,p[1]*s]:
   axes[1]>=axes[2]?[p[0]*s,p[2]*s]:[p[0]*s,p[1]*s];
  const color:V3=[.235+Math.max(0,n[1])*.034,.263+Math.max(0,n[1])*.036,.298+Math.max(0,n[1])*.037];
  for(const p of [a,b,c]){
   const world:V3=[p[0]+recipe.center[0],p[1]+recipe.center[1],p[2]+recipe.center[2]];
   pos.push(...world);nrm.push(...n);uv.push(...getUv(world));col.push(...color);
  }
 };
 for(const face of faces)for(let i=1;i<face.vertices.length-1;i++)emit(face.vertices[0],face.vertices[i],face.vertices[i+1]);
 if(pos.length<36)throw Error('No authored secondary rock geometry '+recipe.name);
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 geo.setAttribute('normal',new THREE.Float32BufferAttribute(nrm,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
 geo.computeBoundingBox();geo.computeBoundingSphere();
 geo.name='B1R-secondary-'+recipe.name;
 geo.userData.b1r={component:'secondary',name:recipe.name,purpose:recipe.purpose,authoredCuts:recipe.cuts.length,
  watertightComponentIntended:true,unioned:false};
 return geo;
}
export interface MultiMassAsset {
 readonly id:MultiMassArchetype;
 readonly version:MultiMassVersion;
 readonly parts:readonly THREE.BufferGeometry[];
 readonly components:number;
 readonly metadata:{embeddedIndependentSolids:boolean;booleanUnion:boolean;sourcePrimaryPreserved:boolean;description:string};
 readonly bounds:THREE.Box3;
 readonly triangles:number;
 readonly vertices:number;
 dispose():void;
}
export function buildB1R(id:MultiMassArchetype,version:MultiMassVersion):MultiMassAsset{
 if(!['A','B'].includes(id))throw RangeError('Only A/B authorized in B1R');
 if(!(['V0','V1','V2'] as string[]).includes(version))throw RangeError('Unknown B1R version '+version);
 const primary=buildRockArchetype(id,'refined');
 const secondary=version==='V0'?null:buildSecondary(RECIPES[id][version]);
 const parts:THREE.BufferGeometry[]=secondary?[primary,secondary]:[primary];
 const bounds=new THREE.Box3();
 for(const p of parts){p.computeBoundingBox();bounds.union(p.boundingBox!);}
 const triangles=parts.reduce((sum,g)=>sum+g.getAttribute('position').count/3,0);
 const vertices=parts.reduce((sum,g)=>sum+g.getAttribute('position').count,0);
 let disposed=false;
 return {id,version,parts,components:parts.length,bounds,triangles,vertices,
  metadata:{embeddedIndependentSolids:parts.length>1,booleanUnion:false,sourcePrimaryPreserved:true,
   description:version==='V0'?'Untouched original B1 primary':RECIPES[id][version].purpose},
  dispose(){if(disposed)return;disposed=true;for(const part of parts)part.dispose();}
 };
}
export function b1rMetrics(id:MultiMassArchetype,version:MultiMassVersion){
 const a=buildB1R(id,version),b=a.bounds;
 const dimensions=[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z] as const;
 const m={id,version,components:a.components,triangles:a.triangles,vertices:a.vertices,
  dimensions,ratioWidthHeight:dimensions[0]/dimensions[1],
  groundContactMinY:b.min.y,independentSolids:a.components,booleanUnion:false};
 a.dispose();return m;
}
