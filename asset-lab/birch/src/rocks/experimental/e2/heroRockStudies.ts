/**
 * ASSET-01E2A — Authored geological polyhedral silhouettes.
 * A/B/C deliberately distinct, single closed solids, not random seed variants.
 * A parameter scales the authored model without changing its geological planes.
 * +Y up, +Z front. All source production + R04 code remains untouched.
 */
export type Vec3=[number,number,number];
export type Plane=readonly [number,number,number,number];
export type RockId='A'|'B'|'C';
export type RockControls={widthScale:number;heightScale:number;depthScale:number;lean:number};
export type RockSpec={id:RockId;name:string;intent:string;
 box:{x:readonly [number,number];y:readonly [number,number];z:readonly [number,number]};
 planes:readonly Plane[];fractureAxis:Vec3;defaultControls:RockControls};
type Face={verts:Vec3[];id:number};
export type StudyData={positions:number[];normals:number[];uv:number[];triangleCount:number;
 faceCount:number;bounds:{min:Vec3;max:Vec3};facePlaneIds:number[];faceAreas:number[];
 id:RockId;controls:RockControls;componentCount:1;studyOnly:true};
const EPS=1e-7;
const add=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const length=(a:Vec3)=>Math.hypot(...a);
const normalize=(a:Vec3):Vec3=>{const d=length(a)||1;return[a[0]/d,a[1]/d,a[2]/d];};
const interpolate=(a:Vec3,b:Vec3,t:number):Vec3=>a.map((x,i)=>x+(b[i]-x)*t) as Vec3;
const key=(v:Vec3)=>v.map(x=>Math.round(x*1e5)).join(':');
function startingBox(b:RockSpec['box']):Face[]{
 const [x0,x1]=b.x,[y0,y1]=b.y,[z0,z1]=b.z;
 const a:Vec3=[x0,y0,z0],bb:Vec3=[x1,y0,z0],c:Vec3=[x1,y1,z0],d:Vec3=[x0,y1,z0];
 const e:Vec3=[x0,y0,z1],f:Vec3=[x1,y0,z1],g:Vec3=[x1,y1,z1],h:Vec3=[x0,y1,z1];
 return [{verts:[a,d,c,bb],id:-1},{verts:[e,f,g,h],id:-2},
  {verts:[a,e,h,d],id:-3},{verts:[bb,c,g,f],id:-4},
  {verts:[a,bb,f,e],id:-5},{verts:[d,h,g,c],id:-6}];
}
function cut(faces:Face[],plane:Plane,id:number):Face[]{
 const [nx,ny,nz,d]=plane,dist=(p:Vec3)=>nx*p[0]+ny*p[1]+nz*p[2]-d;
 const kept:Face[]=[],hits:Vec3[]=[];
 for(const face of faces){
  const verts:Vec3[]=[];
  for(let i=0;i<face.verts.length;i++){
   const a=face.verts[i],b=face.verts[(i+1)%face.verts.length],
    da=dist(a),db=dist(b),ia=da<=EPS,ib=db<=EPS;
   if(ia)verts.push(a);
   if(ia!==ib){const p=interpolate(a,b,da/(da-db));verts.push(p);hits.push(p);}
  }
  if(verts.length>=3)kept.push({verts,id:face.id});
 }
 const unique=new Map(hits.map(p=>[key(p),p] as const)),v=[...unique.values()];
 if(v.length<3)return kept;
 const ctr:Vec3=[0,0,0];for(const p of v)for(let i=0;i<3;i++)ctr[i]+=p[i]/v.length;
 const n=normalize([nx,ny,nz]),pivot:Vec3=Math.abs(n[1])<.8?[0,1,0]:[1,0,0];
 const ux=normalize(cross(pivot,n)),vy=cross(n,ux);
 v.sort((a,b)=>{
  const angle=(p:Vec3)=>Math.atan2(dot(sub(p,ctr),vy),dot(sub(p,ctr),ux));
  return angle(a)-angle(b);
 });
 kept.push({verts:v,id});
 return kept;
}
export function sculptRock(spec:RockSpec,changes:Partial<RockControls>={}):StudyData{
 const controls={...spec.defaultControls,...changes};
 for(const [key,value] of Object.entries(controls)){
  if(!Number.isFinite(value))throw RangeError('non-finite '+key);
 }
 if(controls.widthScale<.6||controls.widthScale>1.5||controls.heightScale<.6||controls.heightScale>1.5||
    controls.depthScale<.6||controls.depthScale>1.5||Math.abs(controls.lean)>.3)
  throw RangeError('E2A control outside conservative range');
 let faces=startingBox(spec.box);
 for(let i=0;i<spec.planes.length;i++)faces=cut(faces,spec.planes[i],i);
 const positions:number[]=[],normals:number[]=[],uv:number[]=[],facePlaneIds:number[]=[],faceAreas:number[]=[];
 const min:Vec3=[Infinity,Infinity,Infinity],max:Vec3=[-Infinity,-Infinity,-Infinity];
 let validFaces=0;
 for(const face of faces){
  const pts=face.verts.map(p=>[
   p[0]*controls.widthScale+controls.lean*(p[1]-spec.box.y[0]),
   p[1]*controls.heightScale,p[2]*controls.depthScale
  ] as Vec3);
  if(pts.length<3)continue;
  const n=normalize(cross(sub(pts[1],pts[0]),sub(pts[2],pts[0])));
  let totalArea=0;
  const start=positions.length;
  for(let t=1;t<pts.length-1;t++){
   const tri=[pts[0],pts[t],pts[t+1]];
   const area=length(cross(sub(tri[1],tri[0]),sub(tri[2],tri[0])))*.5;
   if(area<=1e-9)continue;
   const fn=normalize(cross(sub(tri[1],tri[0]),sub(tri[2],tri[0])));
   for(const p of tri){
    positions.push(...p);normals.push(...fn);
    uv.push(p[0]*.32,p[1]*.32);
    for(let i=0;i<3;i++){min[i]=Math.min(min[i],p[i]);max[i]=Math.max(max[i],p[i]);}
   }
   totalArea+=area;
  }
  if(positions.length>start){validFaces++;facePlaneIds.push(face.id);faceAreas.push(totalArea);}
 }
 if(!positions.length||positions.some(x=>!Number.isFinite(x)))throw Error('Invalid E2A geometry '+spec.id);
 return {id:spec.id,controls,positions,normals,uv,triangleCount:positions.length/9,
  faceCount:validFaces,bounds:{min,max},facePlaneIds,faceAreas,componentCount:1,studyOnly:true};
}
