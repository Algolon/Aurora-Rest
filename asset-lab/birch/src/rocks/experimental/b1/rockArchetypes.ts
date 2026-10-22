/**
 * ASSET-01E2R-B1 — five individually authored, editable Nordic rock structures.
 *
 * No randomized vertices, noise silhouette, scaled copies of G1, or decorative
 * detached solids. An asymmetric polygonal stone contour is authored for each
 * morphology; authored shoulder/crown sections resolve large spatial planes.
 * G1 and all production rock implementations remain unmodified/read-only.
 */
import * as THREE from 'three';
import {buildSculptRock} from './rockSculpturalRefinement.ts';

export type RockArchetype='A'|'B'|'C'|'D'|'E';
type XZ=readonly [number,number];
type Band = Readonly<{
  y:number; width:number; depth:number; shiftX:number; shiftZ:number;
  /** Per-vertex crown / shoulder edge elevations; all deliberately authored. */
  lifts:readonly number[];
  /** Per-vertex radial adjustments; sparse, not procedural noise. */
  relief?:readonly number[];
}>;
export type RockDefinition=Readonly<{
  id:RockArchetype;name:string;landscape:string;geology:string;
  /** Ordered angular footprint from the front, seen from above. */
  contour:readonly XZ[];
  bands:readonly Band[];
  /** Optional face-specific, small inward geologic chisel. */
  chipFaces:readonly number[];
  textureScale:number;
}>;
const A:RockDefinition={
 id:'A',name:'Compact Angular Rock',landscape:'Forest paths & grass',geology:'Angular glacial fragment',
 contour:[[0,0.64],[.55,.48],[.81,.05],[.67,-.49],[.07,-.71],[-.57,-.49],[-.83,-.10],[-.69,.38]],
 bands:[
  {y:-.34,width:.83,depth:.87,shiftX:.03,shiftZ:0,lifts:[0,0,0,0,0,0,0,0]},
  {y:.17,width:1,depth:1,shiftX:0,shiftZ:0,lifts:[.03,-.04,.04,-.01,.02,.08,-.04,.01]},
  {y:.79,width:.78,depth:.83,shiftX:.07,shiftZ:-.04,lifts:[-.04,.10,.02,-.08,.04,-.07,.05,.01]},
  {y:1.11,width:.37,depth:.44,shiftX:-.10,shiftZ:-.07,lifts:[0,.02,-.12,-.06,.07,.01,.08,-.02]}
 ],
 chipFaces:[6],textureScale:.38
};
const B:RockDefinition={
 id:'B',name:'Broad Glacial Boulder',landscape:'Tundra & glacial valleys',geology:'Low horizontal erratic with displaced crown',
 contour:[[0,1.02],[1.22,.79],[2.34,.33],[2.43,-.46],[1.13,-1.05],[-.43,-1.12],[-1.88,-.74],[-2.61,-.03],[-1.44,.81]],
 bands:[
  {y:-.34,width:.90,depth:.91,shiftX:-.06,shiftZ:.04,lifts:[0,0,0,0,0,0,0,0,0]},
  {y:.31,width:1,depth:1,shiftX:0,shiftZ:0,lifts:[.03,.04,-.10,.02,-.01,.08,.02,.05,-.06]},
  {y:1.13,width:.87,depth:.78,shiftX:.10,shiftZ:-.13,lifts:[.06,-.04,.01,.04,-.05,-.05,.03,.03,.07]},
  {y:1.46,width:.55,depth:.49,shiftX:.30,shiftZ:-.20,lifts:[.04,.08,.02,-.02,.01,-.06,-.04,.03,.12]}
 ],
 chipFaces:[11],textureScale:.38
};
const C:RockDefinition={
 id:'C',name:'Sculptural Mid-Sized Boulder',landscape:'Forest clearings & trail edges',
 geology:'Offset crown and large planar shoulders without borrowed G1 geometry',
 contour:[[.06,1.26],[1.03,1.07],[1.73,.38],[1.26,-.77],[.26,-1.26],[-1.06,-.91],[-1.62,-.20],[-1.22,.86]],
 bands:[
  {y:-.34,width:.82,depth:.81,shiftX:.05,shiftZ:0,lifts:[0,0,0,0,0,0,0,0]},
  {y:.34,width:1.02,depth:1,shiftX:.01,shiftZ:-.06,lifts:[.10,.03,-.07,-.01,.12,.06,.02,-.08]},
  {y:1.28,width:.93,depth:.90,shiftX:-.12,shiftZ:-.04,lifts:[-.03,.13,.09,-.13,.06,.06,.04,-.03]},
  {y:2.05,width:.67,depth:.69,shiftX:-.23,shiftZ:-.20,lifts:[-.07,.13,-.04,-.11,.12,-.12,.11,.04]},
  {y:2.27,width:.30,depth:.34,shiftX:-.39,shiftZ:-.22,lifts:[-.04,.12,-.07,0,.01,-.04,.08,.03]}
 ],
 chipFaces:[12,16],textureScale:.38
};
const D:RockDefinition={
 id:'D',name:'Fractured Rock Mass',landscape:'Mountain foothills & bedrock exposures',
 geology:'Sheared diagonal block with staggered but connected mass and fault shoulders',
 contour:[[.17,1.36],[1.22,1.08],[2.02,.38],[1.57,-.54],[.56,-1.41],[-.80,-1.28],[-1.74,-.62],[-1.90,.46],[-.85,1.25]],
 bands:[
  {y:-.34,width:.82,depth:.79,shiftX:.14,shiftZ:.02,lifts:[0,0,0,0,0,0,0,0,0]},
  {y:.44,width:1.02,depth:1,shiftX:.01,shiftZ:-.04,lifts:[-.03,.04,-.09,.02,.14,.04,-.03,-.07,.07]},
  {y:1.47,width:.88,depth:.94,shiftX:.26,shiftZ:-.05,lifts:[.05,-.16,.08,.16,-.10,-.04,.15,-.18,.02]},
  {y:2.32,width:.72,depth:.69,shiftX:.40,shiftZ:-.17,lifts:[.12,-.13,.09,.12,-.07,-.17,.21,-.20,.11]},
  {y:2.67,width:.37,depth:.40,shiftX:.59,shiftZ:-.25,lifts:[.03,-.08,-.11,.05,.03,-.01,.10,-.13,.07]}
 ],
 chipFaces:[3,5,14,20],textureScale:.38
};
const E:RockDefinition={
 id:'E',name:'Landmark Boulder',landscape:'Viewpoints & memorable hiking routes',
 geology:'Tall asymmetric erratic, broad low plinth, leaning upper crown',
 contour:[[0,1.25],[1.13,.92],[1.48,.19],[1.30,-1.07],[-.15,-1.42],[-1.30,-.83],[-1.76,.11],[-1.07,1.02]],
 bands:[
  {y:-.34,width:.89,depth:.86,shiftX:.07,shiftZ:0,lifts:[0,0,0,0,0,0,0,0]},
  {y:.49,width:1,depth:1,shiftX:0,shiftZ:0,lifts:[.02,.05,-.11,.06,.03,-.06,.05,-.02]},
  {y:1.66,width:.83,depth:.86,shiftX:.10,shiftZ:-.13,lifts:[-.07,.09,-.05,.02,.14,.03,-.12,.08]},
  {y:2.95,width:.61,depth:.64,shiftX:.36,shiftZ:-.23,lifts:[.02,-.14,.15,.03,-.08,.04,-.08,.12]},
  {y:3.92,width:.43,depth:.44,shiftX:.46,shiftZ:-.33,lifts:[.15,-.08,.05,.09,-.07,.10,-.16,.05]},
  {y:4.20,width:.20,depth:.24,shiftX:.38,shiftZ:-.36,lifts:[-.06,.05,-.02,.08,-.04,.07,-.10,.03]}
 ],
 chipFaces:[9,19,31],textureScale:.38
};
export const ROCK_DEFINITIONS:Readonly<Record<RockArchetype,RockDefinition>>={A,B,C,D,E};
export const ROCK_ARCHETYPES=['A','B','C','D','E'] as const;
type V3=readonly [number,number,number];
const difference=(a:V3,b:V3):V3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a:V3,b:V3):V3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normal=(a:V3,b:V3,c:V3):V3=>{
 const v=cross(difference(b,a),difference(c,a)),l=Math.hypot(...v);
 if(l<1e-8)throw Error('Degenerate authored rock triangle');
 return [v[0]/l,v[1]/l,v[2]/l];
};
function bandVertices(d:RockDefinition,ring:Band):V3[]{
 const N=d.contour.length;
 if(ring.lifts.length!==N||(ring.relief&&ring.relief.length!==N))throw Error('Incomplete rock band '+d.id);
 return d.contour.map(([x,z],i)=>{
  const r=1+(ring.relief?.[i]??0);
  return [x*ring.width*r+ring.shiftX,ring.y+ring.lifts[i],z*ring.depth*r+ring.shiftZ];
 });
}
/** Independent sampled solidity volume; does not imply watertight Boolean union. */
export function buildRockArchetype(id:RockArchetype,detail:'primary'|'refined'='refined'):THREE.BufferGeometry{
 if(detail==='refined')return buildSculptRock(id);
 const d=ROCK_DEFINITIONS[id];
 if(!d)throw RangeError('Invalid B1 rock '+String(id));
 const rings=d.bands.map(b=>bandVertices(d,b));
 const N=d.contour.length;
 const faces:Array<{vertices:[V3,V3,V3];chip:boolean}>=[];
 const add=(a:V3,b:V3,c:V3,chip=false)=>faces.push({vertices:[a,b,c],chip});
 // Bottom (outward/down), no detached ground stones.
 for(let j=1;j<N-1;j++)add(rings[0][0],rings[0][j+1],rings[0][j]);
 // Side planes: diagonals direction deliberately alternates per geological sector,
 // broad authored polygon panels; no noise or uniform triangulated sphere.
 for(let k=0;k<rings.length-1;k++){
  for(let j=0;j<N;j++){
   const next=(j+1)%N;
   const a=rings[k][j],b=rings[k][next],c=rings[k+1][next],e=rings[k+1][j];
   const flip=((j+k+d.id.charCodeAt(0))%4===0);
   if(flip){add(a,b,e);add(b,c,e);}else{add(a,b,c);add(a,c,e);}
  }
 }
 // Top polygon is triangulated without a center-fan spike.
 const top=rings[rings.length-1];for(let j=1;j<N-1;j++)add(top[0],top[j],top[j+1]);
 // Face-level chisel only where selected; the patch lies strictly inside the
 // original triangle boundary, so it cannot create mesh cracks or overlays.
 const output:number[]=[],normals:number[]=[],colors:number[]=[],uv:number[]=[];
 let chiseled=0;
 const put=(a:V3,b:V3,c:V3)=>{
  const n=normal(a,b,c);
  const topness=Math.max(0,n[1]),rear=Math.max(0,-n[2]);
  const col:[number,number,number]=[
   .245+topness*.019-rear*.010,
   .271+topness*.020-rear*.012,
   .305+topness*.021-rear*.015
  ];
  const abs=[Math.abs(n[0]),Math.abs(n[1]),Math.abs(n[2])];
  const getUv=(p:V3):[number,number]=>{
   if(abs[0]>=abs[1]&&abs[0]>=abs[2])return [p[2]*d.textureScale,p[1]*d.textureScale];
   if(abs[1]>=abs[2])return [p[0]*d.textureScale,p[2]*d.textureScale];
   return [p[0]*d.textureScale,p[1]*d.textureScale];
  };
  for(const p of [a,b,c]){output.push(...p);normals.push(...n);colors.push(...col);uv.push(...getUv(p));}
 };
 for(const [idx,f] of faces.entries()){
  const [a,b,c]=f.vertices;
  if(detail==='refined'&&d.chipFaces.includes(idx)){
   const n=normal(a,b,c),t=.22;
   const mid:V3=[
    a[0]*t+b[0]*(.38)+c[0]*(.4)-n[0]*.045,
    a[1]*t+b[1]*(.38)+c[1]*(.4)-n[1]*.045,
    a[2]*t+b[2]*(.38)+c[2]*(.4)-n[2]*.045
   ];
   // Triangle patch fan without changing border vertices, outward winding.
   put(a,b,mid);put(b,c,mid);put(c,a,mid);chiseled++;
  }else put(a,b,c);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(output,3));
 geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.computeBoundingBox();geo.computeBoundingSphere();
 geo.name='ASSET-B1-'+id+'-'+detail+'-ART-UNAPPROVED';
 const box=geo.boundingBox!;
 geo.userData.b1={
  id,detail,description:d.name,geology:d.geology,landscape:d.landscape,
  triangles:output.length/9,faces:faces.length,chisels:chiseled,
  boundsMeters:[box.max.x-box.min.x,box.max.y-box.min.y,box.max.z-box.min.z],
  ringCount:rings.length,radialSectors:N,closedIntended:true,artApproved:false,
  g1SourceModified:false,productionIntegrated:false
 };
 return geo;
}
export function rockShapeMetrics(id:RockArchetype){
 const g=buildRockArchetype(id);
 const b=g.boundingBox!;
 const width=b.max.x-b.min.x,height=b.max.y-b.min.y,depth=b.max.z-b.min.z;
 const output={id,width,height,depth,widthHeight:width/height,depthWidth:depth/width,
  tris:g.getAttribute('position').count/3,vertices:g.getAttribute('position').count};
 g.dispose();return output;
}
