/**
 * ROCK-R01-G02R — Organic Plane Refinement.
 * Single authored non-convex geological boulder; B1 Sheltered Fault direction.
 * Each XYZ point and GPU face link is fixed/curated, NOT a regular grid, noise,
 * convex cutter, generated rock family, or inherited G02 heightfield topology.
 * G02, G01, G01R and original R04/G1 are kept byte-for-byte read-only.
 * Coordinates metres, +Y up, +Z forward. ART NOT APPROVED.
 */
export type V3=[number,number,number];
type Triangle=[number,number,number];
export interface G02ROutput {
 positions:number[];normals:number[];uv:number[];colors:number[];
 triangles:number;bounds:{min:V3;max:V3};
 topology:{construction:'irregular-authored-surface-panels';
   firstOrderMasses:2;seamControls:number;largePlaneRatio:number;
   surfacePanels:number;totalControlVertices:number;closedExterior:true;
   source:'G02R';artApproved:false};
}
const UPPER:readonly V3[]=[
 [-1.65,.36,.55],[-1.67,.58,1.02],[-1.32,1.12,1.33],
 [-.83,1.51,1.38],[-.28,1.42,1.42],[.28,1.35,1.38],
 [.82,1.26,1.29],[1.38,1.03,1.08],[1.68,.67,.64],
 [1.73,.55,-.02],[1.55,.57,-.69],[1.19,.82,-1.18],
 [.54,1.11,-1.41],[-.18,1.32,-1.45],[-.91,1.35,-1.33],
 [-1.43,1.10,-1.02],[-1.70,.61,-.49],
 // Explicit large asymmetric upper masses, broad main crown (17-22).
 [-1.04,1.85,.84],[-.70,2.16,.45],[-.56,2.32,-.12],
 [-.95,2.28,-.70],[-.13,2.31,-.72],[-.03,2.20,.06],
 // Back-set lower eastern shoulder; short tucked frontal geological joint.
 [.41,1.69,.57],[.90,1.74,.47],[1.10,1.54,-.21],
 [.63,1.49,-.79],[.14,1.26,1.02],
 [-.54,1.60,1.09],[.96,1.22,.97],[-.34,1.98,-1.05]
];
/**
 * Deliberately irregular, manually FROZEN patch adjacency.
 * Authored planar footprint cells were evaluated separately and then fixed.
 * Do not regenerate these triangles with Delaunay/earclip at runtime.
 * Smaller local faces cluster near the sheltered joint, broad sculptural planes
 * dominate crown/shoulders/rear; no equal-sized repeated low-poly grid.
 */
const TOP_FACES:readonly Triangle[]=[
 [0,16,1],[26,22,25],[11,12,26],[7,29,6],[6,29,27],
 [23,22,27],[27,29,23],[19,16,0],[25,9,10],[26,25,10],
 [10,11,26],[21,22,26],[19,22,21],[26,12,21],
 [0,1,17],[17,1,2],[27,4,5],[6,27,5],[23,29,24],
 [25,22,24],[24,22,23],[24,29,7],[24,7,8],[24,9,25],
 [8,9,24],[14,30,13],[21,12,13],[13,30,21],[15,16,20],
 [20,16,19],[14,15,20],[20,30,14],[21,30,20],
 [20,19,21],[19,0,18],[18,0,17],[18,22,19],
 [27,22,18],[17,2,3],[3,4,28],[28,17,3],
 [18,17,28],[28,4,27],[28,27,18]
];
/** The irregular outer lip around the joint-bearing upper shell. */
const RIM:readonly number[]=[1,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2];
const FOOT_SCALE:readonly number[]=[
 .91,.87,.86,.89,.92,.88,.91,.93,.90,.90,.89,.88,.92,.90,.90,.86
];
/** Local, uneven weathering on SELECTED skirts, not a continuous mid-level band. */
const LOCAL_RELIEF:readonly number[]=[1,4,8,12,15];
const sub=(a:V3,b:V3):V3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a:V3,b:V3):V3=>[
 a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const magnitude=(a:V3)=>Math.hypot(...a);
const patchArea=(a:V3,b:V3,c:V3)=>magnitude(cross(sub(b,a),sub(c,a)))*.5;
export function buildShelteredFaultG02R():G02ROutput{
 const vertices:V3[]=UPPER.map(p=>[...p] as V3);
 const faces:Triangle[]=TOP_FACES.map(f=>[...f] as Triangle);
 const footStart=vertices.length;
 for(let i=0;i<RIM.length;i++){
  const [x,,z]=vertices[RIM[i]],scale=FOOT_SCALE[i];
  vertices.push([x*scale,i%3===1?.035:.060,z*(i%4<2?.93:.90)]);
 }
 for(let i=0;i<RIM.length;i++){
  const j=(i+1)%RIM.length,a=RIM[i],b=RIM[j],
   d=footStart+i,c=footStart+j;
  if(LOCAL_RELIEF.includes(i)){
   const A=vertices[a],B=vertices[b],C=vertices[c],D=vertices[d];
   const w:V3=[0,0,0];
   for(let k=0;k<3;k++)w[k]=.29*A[k]+.22*B[k]+.24*C[k]+.25*D[k];
   w[0]+=.025*Math.sign(w[0]);w[2]+=.035*Math.sign(w[2]);
   const t=vertices.length;vertices.push(w);
   faces.push([a,b,t],[b,c,t],[c,d,t],[d,a,t]);
  }else faces.push([a,b,c],[a,c,d]);
 }
 // Ground underside hidden after embedding; radial triangulation ONLY here,
 // never on any visible geological face.
 const footCenter=vertices.length;vertices.push([0,.045,0]);
 for(let i=0;i<RIM.length;i++)faces.push([
  footStart+i,footStart+(i+1)%RIM.length,footCenter]);
 // Calibrate dimensions without changing local geometry relationships.
 for(const v of vertices){v[0]*=1.04;v[1]*=1.025;v[2]*=1.035;}
 const positions:number[]=[],normals:number[]=[],uv:number[]=[],colors:number[]=[];
 const min:V3=[Infinity,Infinity,Infinity],max:V3=[-Infinity,-Infinity,-Infinity];
 const upperAreas:number[]=[];
 for(let i=0;i<faces.length;i++){
  const [a,b,c]=faces[i].map(j=>vertices[j]);
  const n=cross(sub(b,a),sub(c,a)),mag=magnitude(n);
  if(mag<1e-8)throw Error('G02R degenerate triangle '+i);
  if(i<TOP_FACES.length)upperAreas.push(patchArea(a,b,c));
  const unit=n.map(x=>x/mag) as V3,abs=unit.map(Math.abs);
  for(const p of [a,b,c]){
   positions.push(...p);normals.push(...unit);colors.push(1,1,1);
   if(abs[0]>=abs[1]&&abs[0]>=abs[2])uv.push(p[2]*.38,p[1]*.38);
   else if(abs[1]>=abs[2])uv.push(p[0]*.38,p[2]*.38);
   else uv.push(p[0]*.38,p[1]*.38);
   for(let k=0;k<3;k++){min[k]=Math.min(min[k],p[k]);max[k]=Math.max(max[k],p[k]);}
  }
 }
 const areas=upperAreas.sort((a,b)=>a-b);
 const ratio=areas[Math.floor(areas.length*.9)]/areas[Math.floor(areas.length*.1)];
 return {positions,normals,uv,colors,triangles:faces.length,bounds:{min,max},
  topology:{construction:'irregular-authored-surface-panels',
   firstOrderMasses:2,seamControls:1,largePlaneRatio:ratio,
   surfacePanels:TOP_FACES.length,totalControlVertices:vertices.length,
   closedExterior:true,source:'G02R',artApproved:false}};
}
