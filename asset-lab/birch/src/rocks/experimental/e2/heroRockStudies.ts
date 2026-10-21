/** E2A sculpt-cage method — source-independent unified closed boulder surface.
 * 12 authored directional angular sectors; per-height control profiles form the
 * silhouette and long coherent plane transitions. No randomness, noise or bolts.
 * Explicit centers / thickness / directional ridge controls are editable data.
 * Geometry is not production-approved. R04 / production source remain unchanged.
 */
export type Vec3=[number,number,number];export type RockId='A'|'B'|'C';
export type RockControls={widthScale:number;heightScale:number;depthScale:number;lean:number};
export type SculptRing={y:number;width:number;depth:number;x:number;z:number;radial:number[];rise:number[]};
export type RockSpec={id:RockId;name:string;intent:string;fractureAxis:Vec3;
 defaultControls:RockControls;rings:SculptRing[];top:Vec3;bottom:Vec3};
export type StudyData={id:RockId;controls:RockControls;positions:number[];normals:number[];
 uv:number[];triangleCount:number;faceCount:number;bounds:{min:Vec3;max:Vec3};
 facePlaneIds:number[];faceAreas:number[];componentCount:1;studyOnly:true};
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export function sculptRock(spec:RockSpec,changes:Partial<RockControls>={}):StudyData{
 const controls={...spec.defaultControls,...changes};
 if(Object.values(controls).some(v=>!Number.isFinite(v)))throw RangeError('Non-finite authored control');
 if(controls.widthScale<.6||controls.widthScale>1.5||controls.heightScale<.6||controls.heightScale>1.5||
  controls.depthScale<.6||controls.depthScale>1.5||Math.abs(controls.lean)>.3)
  throw RangeError('Outside E2A allowed proportions');
 if(spec.rings.length<4||spec.rings.some(r=>r.radial.length!==12||r.rise.length!==12))
  throw Error('Each authored ring must have 12 structural sectors');
 const deform=(p:Vec3):Vec3=>[
  p[0]*controls.widthScale+controls.lean*p[1],p[1]*controls.heightScale,p[2]*controls.depthScale];
 const rings=spec.rings.map(r=>Array.from({length:12},(_,sector)=>{
  const theta=2*Math.PI*sector/12;
  const rad=r.radial[sector];
  return deform([r.x+Math.cos(theta)*r.width*rad,r.y+r.rise[sector],r.z+Math.sin(theta)*r.depth*rad]);
 }));
 const positions:number[]=[],normals:number[]=[],uv:number[]=[],areas:number[]=[],faceIds:number[]=[];
 const min:Vec3=[Infinity,Infinity,Infinity],max:Vec3=[-Infinity,-Infinity,-Infinity];
 const triangle=(a:Vec3,b:Vec3,c:Vec3,faceId:number)=>{
  const n=cross(sub(b,a),sub(c,a)),length=Math.hypot(...n);if(length<1e-8)throw Error('Degenerate authored sculpt triangle '+spec.id);
  const fn=n.map(v=>v/length);
  for(const p of [a,b,c]){
   positions.push(...p);normals.push(...fn);uv.push(p[0]*.33,p[1]*.33);
   for(let j=0;j<3;j++){min[j]=Math.min(min[j],p[j]);max[j]=Math.max(max[j],p[j]);}
  }
  faceIds.push(faceId);areas.push(length*.5);
 };
 for(let band=0;band<rings.length-1;band++){
  for(let sector=0;sector<12;sector++){
   const next=(sector+1)%12;
   const lower=rings[band],upper=rings[band+1];
   triangle(lower[sector],upper[sector],lower[next],band*12+sector);
   triangle(lower[next],upper[sector],upper[next],band*12+sector);
  }
 }
 const top=deform(spec.top),bottom=deform(spec.bottom),lowest=rings[0],highest=rings[rings.length-1];
 for(let sector=0;sector<12;sector++){
  const next=(sector+1)%12;
  triangle(bottom,lowest[sector],lowest[next],-1);
  triangle(top,highest[next],highest[sector],-2);
 }
 return {id:spec.id,controls,positions,normals,uv,triangleCount:positions.length/9,
  faceCount:spec.rings.length*12+2,bounds:{min,max},
  facePlaneIds:faceIds,faceAreas:areas,componentCount:1,studyOnly:true};
}
