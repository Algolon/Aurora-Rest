/**
 * B1-C Sculptural rock pass: authored geological half-space chisel cuts.
 * The initial angular control-cages remain available as 'primary' immutable
 * evidence. Refined versions use R04-like meaningful major planes instead of
 * visually uniform bands and radial triangle tessellation.
 *
 * Single closed solid per model. No random geometry or stacked sub-primitives.
 */
import * as THREE from 'three';
import type {RockArchetype} from './rockArchetypes.ts';
type V3=[number,number,number];
type Plane=readonly [number,number,number,number];
type Poly={vertices:V3[];id:number};
type RockSculpt={bounds:{x:readonly [number,number];y:readonly [number,number];z:readonly [number,number]};
 cuts:readonly Plane[];details:readonly number[]};
const ROCK_SCULPTS:Readonly<Record<RockArchetype,RockSculpt>>={
 A:{bounds:{x:[-.91,.88],y:[-.34,1.22],z:[-.78,.78]},
 cuts:[
 [ .31,1,.12,1.22],[-.72,.78,.12,1.15],[.83,.42,.23,.93],
 [-.92,.16,.21,.83],[.16,.13,1,.73],[-.17,.08,-1,.70],
 [-.42,.69,-.67,1.17],[.71,.24,-.72,.91],
 [-.66,-.56,.19,.89],[.64,-.68,.10,.85],
 [.22,.81,.64,1.27]],
 details:[2,6]},
 B:{bounds:{x:[-2.67,2.53],y:[-.34,1.57],z:[-1.21,1.16]},
 cuts:[
 [.13,1,.12,1.46],[-.48,.88,.17,1.71],[.48,.91,-.09,1.55],
 [-.85,.24,.18,2.01],[.84,.16,.28,2.02],
 [.15,.10,1,1.04],[-.17,.09,-1,1.09],
 [-.55,.41,-.66,1.86],[.72,.31,-.74,1.87],
 [-.31,-.72,.21,1.27],[.60,-.70,.15,1.41],
 [.13,.83,.65,1.46]],
 details:[3,8]},
 C:{bounds:{x:[-1.75,1.74],y:[-.34,2.43],z:[-1.48,1.45]},
 cuts:[
 [.18,1,.18,2.40],[-.62,.75,.13,2.06],[.71,.67,.19,2.16],
 [-.87,.13,.42,1.52],[.81,.12,.37,1.55],
 [-.18,.24,1,1.32],[.20,.16,-1,1.33],
 [-.79,.14,-.57,1.45],[.72,.19,-.68,1.57],
 [-.58,-.71,.10,1.38],[.58,-.66,.22,1.35],
 [-.42,.78,.59,2.29],[.52,.80,.43,2.43],
 [.12,.77,-.75,2.25],[-.44,.34,-.72,1.59]],
 details:[5,12,14]},
 D:{bounds:{x:[-2.04,1.98],y:[-.34,2.92],z:[-1.64,1.51]},
 cuts:[
 [.26,1,.16,2.83],[-.59,.86,.17,2.48],[.77,.60,-.10,2.18],
 [-.88,.15,.26,1.79],[.86,.12,.35,1.71],
 [-.38,.23,1,1.36],[.29,.14,-1,1.46],
 [-.82,.08,-.62,1.62],[.78,.23,-.63,1.60],
 [-.65,-.58,.22,1.48],[.59,-.72,.17,1.39],
 [-.64,.69,.49,2.24],[.54,.67,.54,2.35],
 [-.51,.44,-.77,1.79],[.53,.42,-.74,1.71],
 [-.44,.84,-.31,2.29]],
 details:[5,8,12]},
 E:{bounds:{x:[-1.77,1.68],y:[-.34,4.56],z:[-1.53,1.49]},
 cuts:[
 [.24,1,.11,4.42],[-.60,.71,.06,3.88],[.78,.62,.16,3.43],
 [-.85,.15,.44,1.73],[.72,.09,.59,1.56],
 [-.25,.16,1,1.20],[.24,.12,-1,1.23],
 [-.76,.12,-.62,1.54],[.78,.08,-.55,1.57],
 [-.73,-.52,.10,1.52],[.66,-.62,.15,1.34],
 [-.56,.77,.28,3.42],[.51,.78,.24,3.89],
 [-.38,.49,-.73,2.70],[.54,.50,-.69,2.62],
 [.20,.88,.36,4.45]],
 details:[4,13]}
};
const dot=(a:V3,b:V3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const sub=(a:V3,b:V3):V3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a:V3,b:V3):V3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normalize=(a:V3):V3=>{const l=Math.hypot(...a);if(l<1e-9)throw Error('B1 degenerate normal');return[a[0]/l,a[1]/l,a[2]/l];};
const mix=(a:V3,b:V3,t:number):V3=>[a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t,a[2]*(1-t)+b[2]*t];
const key=(p:V3)=>p.map(v=>Math.round(v*1e5)).join(':');
function initialBox(b:RockSculpt['bounds']):Poly[]{
 const [xl,xr]=b.x,[yb,yt]=b.y,[zf,zb]=b.z;
 const a:V3=[xl,yb,zf],c:V3=[xr,yb,zf],d:V3=[xr,yt,zf],e:V3=[xl,yt,zf];
 const f:V3=[xl,yb,zb],g:V3=[xr,yb,zb],h:V3=[xr,yt,zb],i:V3=[xl,yt,zb];
 return [
  {vertices:[a,e,d,c],id:-1},
  {vertices:[f,g,h,i],id:-2},
  {vertices:[a,f,i,e],id:-3},
  {vertices:[c,d,h,g],id:-4},
  {vertices:[a,c,g,f],id:-5},
  {vertices:[e,i,h,d],id:-6}
 ];
}
function clipFace(face:Poly,plane:Plane){
 const out:V3[]=[],hit:V3[]=[];
 const dist=(p:V3)=>p[0]*plane[0]+p[1]*plane[1]+p[2]*plane[2]-plane[3];
 for(let i=0;i<face.vertices.length;i++){
  const a=face.vertices[i],b=face.vertices[(i+1)%face.vertices.length],da=dist(a),db=dist(b);
  const ia=da<=1e-7,ib=db<=1e-7;
  if(ia)out.push(a);
  if(ia!==ib){const p=mix(a,b,da/(da-db));out.push(p);hit.push(p);}
 }
 return {poly:out.length>=3?{vertices:out,id:face.id}:null,hit};
}
function cutPolyhedron(faces:Poly[],plane:Plane,id:number):Poly[]{
 const remaining:Poly[]=[],hits:V3[]=[];
 for(const f of faces){const v=clipFace(f,plane);if(v.poly)remaining.push(v.poly);hits.push(...v.hit);}
 const uniq=new Map<string,V3>();for(const p of hits)uniq.set(key(p),p);
 const pts=[...uniq.values()];
 if(pts.length<3)return remaining;
 const center:V3=[0,0,0];for(const p of pts)for(let j=0;j<3;j++)center[j]+=p[j]/pts.length;
 const n=normalize([plane[0],plane[1],plane[2]]);
 const pivot:V3=Math.abs(n[1])<.8?[0,1,0]:[1,0,0];
 const u=normalize(cross(pivot,n)),v=cross(n,u);
 pts.sort((a,b)=>{const da=sub(a,center),db=sub(b,center);
  return Math.atan2(dot(da,v),dot(da,u))-Math.atan2(dot(db,v),dot(db,u));
 });
 remaining.push({vertices:pts,id});return remaining;
}
export function buildSculptRock(id:RockArchetype):THREE.BufferGeometry{
 const d=ROCK_SCULPTS[id];if(!d)throw RangeError('Unknown B1 sculpt '+id);
 let poly=initialBox(d.bounds);
 for(const [i,plane] of d.cuts.entries())poly=cutPolyhedron(poly,plane,i);
 const pos:number[]=[],normals:number[]=[],colors:number[]=[],uv:number[]=[];
 let planesUsed=0,chipCount=0;
 function emit(a:V3,b:V3,c:V3,color:V3){
  const cr=cross(sub(b,a),sub(c,a)),area=Math.hypot(...cr);
  if(area<1e-8)return;
  const n:V3=[cr[0]/area,cr[1]/area,cr[2]/area];
  const axes=[Math.abs(n[0]),Math.abs(n[1]),Math.abs(n[2])],s=.38;
  const getUv=(p:V3):[number,number]=>axes[0]>=axes[1]&&axes[0]>=axes[2]?
   [p[2]*s,p[1]*s]:axes[1]>=axes[2]?[p[0]*s,p[2]*s]:[p[0]*s,p[1]*s];
  for(const p of [a,b,c]){pos.push(...p);normals.push(...n);colors.push(...color);uv.push(...getUv(p));}
 }
 for(const face of poly){
  const v=face.vertices;if(v.length<3)continue;
  const n=normalize(cross(sub(v[1],v[0]),sub(v[2],v[0])));
  const faceColor:V3=[.235+Math.max(0,n[1])*.034,.263+Math.max(0,n[1])*.036,.298+Math.max(0,n[1])*.037];
  planesUsed++;
  const chisel=d.details.includes(face.id)&&v.length>=4;
  if(chisel){
   const centroid:V3=[0,0,0];
   for(const p of v)for(let j=0;j<3;j++)centroid[j]+=p[j]/v.length;
   const lead=v[1],anchor:V3=[
    centroid[0]*.74+lead[0]*.26-n[0]*.048,
    centroid[1]*.74+lead[1]*.26-n[1]*.048,
    centroid[2]*.74+lead[2]*.26-n[2]*.048
   ];
   for(let i=0;i<v.length;i++)emit(anchor,v[i],v[(i+1)%v.length],faceColor);
   chipCount++;
  }else for(let i=1;i<v.length-1;i++)emit(v[0],v[i],v[i+1],faceColor);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.computeBoundingBox();geo.computeBoundingSphere();
 const b=geo.boundingBox!;
 geo.name='ASSET-B1-'+id+'-authored-sculptural-major-planes';
 geo.userData.b1={id,detail:'refined',archetype:id,
  geometryMethod:'authored-geological-halfspace-cuts',planesUsed,
  majorCuts:d.cuts.length,chiseledFaces:chipCount,
  triangles:pos.length/9,boundsMeters:[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z],
  artApproved:false,productionIntegrated:false,g1SourceModified:false};
 return geo;
}
