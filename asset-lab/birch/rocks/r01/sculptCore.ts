/**
 * Aurora Rest ROCK-R01-G01 — The Sheltered Fault.
 * Hand-authored silhouette, two legible geological masses, one CLOSED outer skin.
 * No copied R04 vertices, random noise, convex hull, Boolean, or world integrations.
 * Metres; X right, Y up, +Z forward. ART NOT APPROVED.
 */
export type V3=[number,number,number];
export interface R01SculptMesh {
 positions:number[]; normals:number[]; uv:number[]; colors:number[];
 triangles:number; bounds:{min:V3;max:V3};
 topology:{outerFrontVertices:number;outerBackVertices:number;faultVertices:number;
  structuralMasses:number;closedExterior:boolean;model:'authored-one-shell'};
}
const FRONT:readonly V3[]=[
 [-1.50,.15,.90],[-1.78,.45,1.05],[-1.82,1.01,1.10],
 [-1.50,1.65,1.08],[-.94,2.16,.82],[-.39,2.40,.49],
 [.12,2.30,.56],[.64,1.93,.81],[.97,1.68,1.12],
 [1.33,1.54,1.11],[1.70,1.15,.92],[1.79,.74,1.05],
 [1.63,.28,1.03],[1.13,.10,1.02],[.47,.08,1.27],[-.68,.09,1.19]
];
const BACK:readonly V3[]=[
 [-1.31,.13,-1.06],[-1.70,.34,-1.10],[-1.72,.95,-1.06],
 [-1.39,1.50,-.98],[-.82,1.96,-.90],[-.36,2.28,-.74],
 [.05,2.23,-.86],[.62,1.92,-1.17],[1.16,1.74,-1.48],
 [1.54,1.59,-1.54],[1.75,1.22,-1.47],[1.64,.69,-1.53],
 [1.52,.19,-1.26],[1.19,.13,-1.22],[.50,.12,-1.11],[-.68,.11,-1.18]
];
// Continuous recessed seam (front +Z); depth follows actual authored relief,
// not a dark overlay or a separate slab.
const FAULT:readonly V3[]=[
 [.05,1.96,.70],[.27,1.64,.83],[.59,1.33,.88],[1.04,.99,.95]
];
const FRONT_LEFT_FOLDS:readonly V3[]=[
 [-1.13,1.20,1.41],[-.67,.81,1.39],[-.74,1.88,1.09],[-.06,.56,1.35]
];
const FRONT_RIGHT_FOLDS:readonly V3[]=[
 [1.17,1.37,1.36],[1.37,.90,1.29]
];
const REAR_FOLDS:readonly V3[]=[
 [-.91,1.24,-1.21],[-.13,.66,-1.25],[.98,1.33,-1.44],[.31,1.91,-1.16]
];
const sub=(a:V3,b:V3):V3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a:V3,b:V3):V3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const orient=(a:V3,b:V3,c:V3)=> (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
type Tri=[number,number,number];
function earclip(ring:readonly number[],points:readonly V3[]):Tri[]{
 const ids=[...ring],faces:Tri[]=[];
 let area=0;
 for(let i=0;i<ids.length;i++){const a=points[ids[i]],b=points[ids[(i+1)%ids.length]];area+=a[0]*b[1]-b[0]*a[1];}
 if(Math.abs(area)<1e-7)throw Error('Degenerate authored R01 region');
 const sign=Math.sign(area);
 let guard=0;
 while(ids.length>3){
  if(++guard>500)throw Error('R01 planar silhouette does not triangulate');
  let found=false;
  for(let i=0;i<ids.length;i++){
   const a=ids[(i-1+ids.length)%ids.length],b=ids[i],c=ids[(i+1)%ids.length];
   if(sign*orient(points[a],points[b],points[c])<1e-8)continue;
   let blocked=false;
   for(const p of ids){
    if(p===a||p===b||p===c)continue;
    const x=points[p];
    if(sign*orient(points[a],points[b],x)>=-1e-8
       &&sign*orient(points[b],points[c],x)>=-1e-8
       &&sign*orient(points[c],points[a],x)>=-1e-8){blocked=true;break;}
   }
   if(!blocked){faces.push([a,b,c]);ids.splice(i,1);found=true;break;}
  }
  if(!found)throw Error('R01 earclip stalled at '+ids.length+' authored vertices');
 }
 faces.push([ids[0],ids[1],ids[2]]);
 return faces;
}
function fold(faces:Tri[],points:V3[],p:V3):void {
 const index=points.length;
 for(let i=0;i<faces.length;i++){
  const t=faces[i],a=points[t[0]],b=points[t[1]],c=points[t[2]];
  const sign=Math.sign(orient(a,b,c));
  if(sign*orient(a,b,p)>1e-8&&sign*orient(b,c,p)>1e-8&&sign*orient(c,a,p)>1e-8){
   points.push([...p] as V3);
   faces.splice(i,1,[t[0],t[1],index],[t[1],t[2],index],[t[2],t[0],index]);
   return;
  }
 }
 throw Error('R01 authored fold outside its structural region: '+p.join(','));
}
function orientFace(tri:Tri,points:V3[],front:boolean):Tri {
 const positive=orient(points[tri[0]],points[tri[1]],points[tri[2]])>0;
 return positive===front?tri:[tri[0],tri[2],tri[1]];
}
export function buildShelteredFaultR01():R01SculptMesh {
 const points:V3[]=[...FRONT,...BACK,...FAULT].map(v=>[...v] as V3);
 const frontIds=FRONT.map((_,i)=>i),backIds=BACK.map((_,i)=>i+FRONT.length);
 const seam=FAULT.map((_,i)=>FRONT.length+BACK.length+i);
 const leftRing=[...frontIds.slice(11),...frontIds.slice(0,7),...seam];
 const rightRing=[...frontIds.slice(6,12),...seam.slice().reverse()];
 const left=earclip(leftRing,points),right=earclip(rightRing,points),rear=earclip(backIds,points);
 for(const p of FRONT_LEFT_FOLDS)fold(left,points,[...p] as V3);
 for(const p of FRONT_RIGHT_FOLDS)fold(right,points,[...p] as V3);
 for(const p of REAR_FOLDS)fold(rear,points,[...p] as V3);
 const faces:Tri[]=[
  ...left.map(t=>orientFace(t,points,true)),
  ...right.map(t=>orientFace(t,points,true)),
  ...rear.map(t=>orientFace(t,points,false))
 ];
 // Explicit authored side connections. Shared outer-boundary vertices mean
 // one shell; no independent overlapped closed polyhedron and no z-fighting.
 for(let i=0;i<FRONT.length;i++){
  const j=(i+1)%FRONT.length;
  faces.push([i,j,j+FRONT.length],[i,j+FRONT.length,i+FRONT.length]);
 }
 const positions:number[]=[],normals:number[]=[],uv:number[]=[],colors:number[]=[];
 const min:V3=[Infinity,Infinity,Infinity],max:V3=[-Infinity,-Infinity,-Infinity];
 for(const tri of faces){
  const [a,b,c]=tri.map(i=>points[i]),n=cross(sub(b,a),sub(c,a)),len=Math.hypot(...n);
  if(len<1e-8)throw Error('Degenerate R01 triangle');
  const unit:V3=n.map(x=>x/len) as V3;
  const abs=unit.map(Math.abs);
  for(const p of [a,b,c]){
   positions.push(...p);normals.push(...unit);colors.push(1,1,1);
   if(abs[0]>=abs[1]&&abs[0]>=abs[2])uv.push(p[2]*.38,p[1]*.38);
   else if(abs[1]>=abs[2])uv.push(p[0]*.38,p[2]*.38);
   else uv.push(p[0]*.38,p[1]*.38);
   for(let k=0;k<3;k++){min[k]=Math.min(min[k],p[k]);max[k]=Math.max(max[k],p[k]);}
  }
 }
 return {positions,normals,uv,colors,triangles:faces.length,bounds:{min,max},
  topology:{outerFrontVertices:FRONT.length,outerBackVertices:BACK.length,
   faultVertices:FAULT.length,structuralMasses:2,closedExterior:true,model:'authored-one-shell'}};
}
