/**
 * Aurora Rest ROCK-R01-G02 — The Sheltered Fault / HAND-AUTHORED non-convex blockout.
 *
 * Distinct custom geological grid and perimeter, NOT a generic terrain generator.
 * The concave seam is part of one shared continuous surface, not two primitives,
 * a convex-hull cut or a painted detail. Dimensions are metres (+Y up, +Z front).
 * G01 and G01R remain unchanged as separate historical implementations.
 * Artistic state: EXPERIMENTAL, NOT APPROVED.
 */
export type V3=[number,number,number];
type Triangle=[number,number,number];
const ROWS=4,COLS=6,WIDTH_SCALE=1.055;

/** Six deliberately unequal longitudinal stone-section controls.
 * Main high glacial mass: cols 0–2; displaced low shoulder: cols 4–5.
 * Col 3 is a continuous recessed and diagonally offset joint, 4 rows long.
 * The deepest point is front-facing; the seam fades into rear bedrock.
 */
const X:readonly (readonly number[])[]=[
 [-1.52,-1.04,-.39,.15,.88,1.47],
 [-1.47,-1.01,-.35,.10,.91,1.52],
 [-1.39,-.87,-.25,.38,1.02,1.49],
 [-1.20,-.68,-.10,.55,1.16,1.38]
];
const Z:readonly (readonly number[])[]=[
 [1.21,1.34,1.37,.80,1.42,1.12],
 [.63,.64,.48,.21,.64,.62],
 [-.43,-.40,-.42,-.66,-.46,-.42],
 [-1.20,-1.21,-1.10,-1.33,-1.30,-1.23]
];
const Y:readonly (readonly number[])[]=[
 [1.10,1.54,1.72,1.17,1.50,1.15],
 [1.36,2.12,2.25,1.49,1.88,1.37],
 [1.47,2.25,2.40,1.57,1.81,1.41],
 [1.10,1.62,1.73,1.39,1.53,1.05]
];
const idx=(r:number,c:number)=>r*COLS+c;
const orientXZ=(a:V3,b:V3,c:V3)=>(b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]);
const sub=(a:V3,b:V3):V3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a:V3,b:V3):V3=>[
 a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const length=(a:V3)=>Math.hypot(...a);
export interface G02Mesh {
 positions:number[];normals:number[];uv:number[];colors:number[];
 triangles:number;bounds:{min:V3;max:V3};
 topology:{construction:'hand-authored-nonconvex-one-shell';
  surfaceRows:number;surfaceColumns:number;seamControlPoints:number;
  authoredVertices:number;triangles:number;nonconvexUpperSurface:true;
  separateSolids:0;ownerArtApproved:false;hasAutomaticNoise:false};
}
function triangulateFoot(vertices:V3[],ids:number[]):Triangle[]{
 const remaining=[...ids],triangles:Triangle[]=[];
 let signed=0;
 for(let i=0;i<ids.length;i++){
  const a=vertices[ids[i]],b=vertices[ids[(i+1)%ids.length]];
  signed+=a[0]*b[2]-b[0]*a[2];
 }
 const orientation=Math.sign(signed);
 if(!orientation)throw Error('G02 degenerate foot polygon');
 let guard=0;
 while(remaining.length>3){
  if(++guard>400)throw Error('G02 foot boundary earclip failed');
  let found=false;
  for(let i=0;i<remaining.length;i++){
   const a=remaining[(i-1+remaining.length)%remaining.length];
   const b=remaining[i],c=remaining[(i+1)%remaining.length];
   if(orientation*orientXZ(vertices[a],vertices[b],vertices[c])<=1e-7)continue;
   const blocked=remaining.some(p=>p!==a&&p!==b&&p!==c&&
    orientation*orientXZ(vertices[a],vertices[b],vertices[p])>=-1e-7&&
    orientation*orientXZ(vertices[b],vertices[c],vertices[p])>=-1e-7&&
    orientation*orientXZ(vertices[c],vertices[a],vertices[p])>=-1e-7);
   if(blocked)continue;
   // reverse for outward (-Y) facing floor
   triangles.push([a,c,b]);remaining.splice(i,1);found=true;break;
  }
  if(!found)throw Error('G02 foot cannot triangulate '+remaining.length+' vertices');
 }
 triangles.push([remaining[0],remaining[2],remaining[1]]);
 return triangles;
}
export function buildShelteredFaultG02():G02Mesh{
 const v:V3[]=[];
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)
  v.push([X[r][c]*WIDTH_SCALE,Y[r][c],Z[r][c]]);
 const triangles:Triangle[]=[];
 for(let r=0;r<ROWS-1;r++)for(let c=0;c<COLS-1;c++){
  const a=idx(r,c),b=idx(r,c+1),d=idx(r+1,c),e=idx(r+1,c+1);
  // Explicit local panel edges: no central interior fan or random triangulation.
  if((r+c)%3===0)triangles.push([a,b,d],[b,e,d]);
  else triangles.push([a,b,e],[a,e,d]);
 }
 // Named perimeter ordering from positive-Z frontal lip via the right,
 // rear and left. Every side patch shares the top edge with the cap.
 const rim=[
  ...Array.from({length:COLS},(_,c)=>idx(0,c)),
  ...Array.from({length:ROWS-1},(_,r)=>idx(r+1,COLS-1)),
  ...Array.from({length:COLS-1},(_,c)=>idx(ROWS-1,COLS-2-c)),
  ...Array.from({length:ROWS-2},(_,r)=>idx(ROWS-2-r,0))
 ];
 const midStart=v.length;
 for(const vertexId of rim){
  const [x,y,z]=v[vertexId];
  const factor=(Math.abs(x)<.3&&z>.5)?1.07:1.13;
  v.push([x*factor,Math.max(.48,Math.min(1.14,y*.58+.07)),z*(z<.9?1.10:1.07)]);
 }
 const footStart=v.length;
 for(let i=0;i<rim.length;i++){
  const [x,,z]=v[rim[i]];
  v.push([x*1.10,i%4<2?.045:.075,z*1.05]);
 }
 for(let i=0;i<rim.length;i++){
  const j=(i+1)%rim.length,a=rim[i],b=rim[j],m=midStart+i,
   n=midStart+j,f=footStart+i,g=footStart+j;
  triangles.push([a,m,n],[a,n,b],[m,f,g],[m,g,n]);
 }
 triangles.push(...triangulateFoot(v,rim.map((_,i)=>footStart+i)));
 const positions:number[]=[],normals:number[]=[],uv:number[]=[],colors:number[]=[];
 const lo:V3=[Infinity,Infinity,Infinity],hi:V3=[-Infinity,-Infinity,-Infinity];
 for(const face of triangles){
  const [a,b,c]=face.map(i=>v[i]);
  const n=cross(sub(b,a),sub(c,a)),mag=length(n);
  if(mag<1e-9)throw Error('G02 degenerate authored facet '+face);
  const unit=n.map(x=>x/mag) as V3,abs=unit.map(Math.abs);
  for(const p of [a,b,c]){
   positions.push(...p);normals.push(...unit);colors.push(1,1,1);
   if(abs[0]>=abs[1]&&abs[0]>=abs[2])uv.push(p[2]*.38,p[1]*.38);
   else if(abs[1]>=abs[2])uv.push(p[0]*.38,p[2]*.38);
   else uv.push(p[0]*.38,p[1]*.38);
   for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],p[k]);hi[k]=Math.max(hi[k],p[k]);}
  }
 }
 return {positions,normals,uv,colors,triangles:triangles.length,bounds:{min:lo,max:hi},
  topology:{construction:'hand-authored-nonconvex-one-shell',surfaceRows:ROWS,
   surfaceColumns:COLS,seamControlPoints:ROWS,authoredVertices:v.length,
   triangles:triangles.length,nonconvexUpperSurface:true,separateSolids:0,
   ownerArtApproved:false,hasAutomaticNoise:false}};
}
