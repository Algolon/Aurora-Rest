/** UNDERSTORY-ASSET-R04: local 2.4m moss-humus ground specimen.
 * Original procedural geometry; no photo/texture is imported. ART NOT APPROVED.
 * Feather moss design informed by USFS Pleurozium schreberi and Swedish 2017 moss morphology.
 */
import * as T from 'three';

export const SUBSTRATE=Object.freeze({widthM:2.4,depthM:2.4,frondInstances:2060,mossColonies:96,referenceSpecies:'Pleurozium schreberi / Hylocomium splendens',sourcePhotographyPixelsUsed:false});
export const fract=(x:number)=>x-Math.floor(x);
export function hash(x:number,z:number,salt=0){return fract(Math.sin(x*127.1+z*311.7+salt*74.7)*43758.5453123);}
export function smoothNoise(x:number,z:number,salt=0){const i=Math.floor(x),j=Math.floor(z),fx=fract(x),fz=fract(z),u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);const a=hash(i,j,salt),b=hash(i+1,j,salt),c=hash(i,j+1,salt),d=hash(i+1,j+1,salt);return T.MathUtils.lerp(T.MathUtils.lerp(a,b,u),T.MathUtils.lerp(c,d,u),v);}
export function fbm(x:number,z:number){let a=.56,scale=1.0,value=0,denom=0;for(let k=0;k<4;k++){value+=smoothNoise(x*scale,z*scale,k+3)*a;denom+=a;scale*=2.1;a*=.49;}return value/denom;}
export function mossCoverage(x:number,z:number){const low=fbm(x*1.52+2.3,z*1.24-5),mid=fbm(x*3.7-7,z*3.0+8);return T.MathUtils.smoothstep(low*.81+mid*.19,.34,.67);}
export function elevation(x:number,z:number){return .016*Math.sin(x*2.7+z*.6)*Math.cos(z*2.5-x*.3)+.026*fbm(x*3.2,z*3.2)+.007*Math.sin(6.1*x-2.7*z);}
const SOIL=new T.Color('#63503c'), HUMUS=new T.Color('#3f3529'), MOSS=new T.Color('#596a3c'),NEW_MOSS=new T.Color('#88975b'),LITTER=new T.Color('#92805c');
function tile(){
 const n=116,p:number[]=[],col:number[]=[],uv:number[]=[],idx:number[]=[];
 for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){
  const x=(i/n-.5)*SUBSTRATE.widthM,z=(j/n-.5)*SUBSTRATE.depthM,y=elevation(x,z);p.push(x,y,z);uv.push(i/n,j/n);
  const wet=fbm(x*4.3+9,z*4.3+4),micro=fbm(x*17-3,z*17+5),cover=mossCoverage(x,z);
  const c=SOIL.clone().lerp(HUMUS,.2+wet*.54).lerp(LITTER,.08+.22*micro);
  c.lerp(MOSS,cover*(.72+.18*wet));
  c.lerp(NEW_MOSS,cover*(.08+.13*micro));col.push(c.r,c.g,c.b);
 }
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
function cushions(){
 // Interlocking low 3D moss humps with inhomogeneous boundary and open humus holes.
 const positions:number[]=[],colors:number[]=[],indices:number[]=[];
 const dark=new T.Color('#40562f'),light=new T.Color('#687c43');let idx=0;
 for(let k=0;k<SUBSTRATE.mossColonies;k++){
  const ang=k*2.39996+hash(k,2)*.37,rr=.16+.91*Math.sqrt((k+.2)/SUBSTRATE.mossColonies),cx=Math.cos(ang)*rr,cz=Math.sin(ang)*rr;
  if(mossCoverage(cx,cz)<.25)continue;
  const rx=.060+.065*hash(k,13),rz=.055+.065*hash(k,19),height=.006+.010*hash(k,17);
  const rings=4,sectors=20,start=idx;
  for(let j=0;j<=rings;j++)for(let s=0;s<=sectors;s++){
   const t=j/rings,a=s/sectors*2*Math.PI,r=t*(1+.10*Math.sin(3*a+k)+.06*Math.cos(7*a+k*1.9));
   const x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r;
   const mound=Math.pow(Math.max(0,1-t*t),1.2),y=elevation(x,z)+.006+height*mound;
   positions.push(x,y,z);const tone=.64+.29*hash(k+j,s,3);
   const c=dark.clone().lerp(light,tone*mound+.12);colors.push(c.r,c.g,c.b);idx++;
  }
  for(let j=0;j<rings;j++)for(let s=0;s<sectors;s++){
   const a=start+j*(sectors+1)+s,b=a+sectors+1;indices.push(a,b,a+1,a+1,b,b+1);
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
 return new T.Mesh(g,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));
}
function frondGeometry(){
 const d:number[]=[],c:number[]=[];const green=new T.Color('#56723d'),tips=new T.Color('#839451');
 // Flat-topped, reclining pinnate shoots. Whorls are slightly concave and staggered, never upright fir silhouettes.
 const tri=(a:number[],b:number[],e:number[],color:T.Color)=>{
  for(const p of [a,b,e]){d.push(...p);c.push(color.r,color.g,color.b);}
 };
 for(let k=0;k<8;k++){
  const t=(k+.55)/8,reach=.075*t,y=.006+.010*Math.sin(Math.PI*t);
  const width=.008*(.50+.5*Math.sin(Math.PI*t))*(1-.35*t),angle=k*1.25;
  const vein=[reach,y,0],forward=[reach+.008,y+.003,0];
  for(const side of [-1,1]){
   const bend=side*(.013+.009*Math.sin(2.3*k+angle)),mid=[reach+.005,y+.004,bend*.65];
   const tip=[reach+.017,y+.005,bend];
   const base=[reach-.004,y,side*width*.26];
   tri(base,mid,tip,k%3===0?tips:green);
   tri(mid,forward,tip,k%2?green:tips);
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(d,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();g.computeBoundingSphere();return g;
}
function litter(){
 const p:number[]=[],c:number[]=[],golds=['#957953','#786344','#b59b72','#695539','#6a724f'].map(v=>new T.Color(v));
 const add=(v:number[][],color:T.Color)=>{for(const t of v){p.push(...t);c.push(color.r,color.g,color.b)}};
 for(let i=0;i<1050;i++){
  const x=(hash(i,11)-.5)*2.35,z=(hash(i,19)-.5)*2.35;if(hash(i,51)<mossCoverage(x,z)*.62)continue;
  const a=hash(i,26)*Math.PI*2,dx=Math.cos(a),dz=Math.sin(a),len=.012+.036*hash(i,31),w=.0014+.004*hash(i,34),y=elevation(x,z)+.006;
  const t=[x+dx*len,y+.001,z+dz*len],b=[x,y,z],m=[x+dx*len*.6-dz*w,y+.002,z+dz*len*.6+dx*w],n=[x+dx*len*.6+dz*w,y+.002,z+dz*len*.6-dx*w];
  const color=golds[Math.floor(hash(i,48)*golds.length)];add([b,m,t],color);add([b,t,n],color);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();g.computeBoundingSphere();
 return new T.Mesh(g,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide,depthWrite:true}));
}
export interface OwnedAsset {group:T.Group;metrics:()=>{triangles:number;drawObjects:number;ownedGeometries:number};dispose:()=>void;}
export function createMossHumusSubstrate():OwnedAsset{
 const group=new T.Group();group.name='UNDERSTORY-R04 Moss+Humus substrate / local 2.4m';
 const base=new T.Mesh(tile(),new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));base.name='humus relief + shaded moss pigment';group.add(base);
 const pads=cushions();pads.name='low overlapping moss cushion geometry';group.add(pads);
 const geom=frondGeometry(),material=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
 const fronds=new T.InstancedMesh(geom,material,SUBSTRATE.frondInstances);fronds.frustumCulled=false;fronds.name='reclining feather-moss branches';
 const dummy=new T.Object3D();
 for(let i=0;i<SUBSTRATE.frondInstances;i++){
  const x=(hash(i,13)-.5)*2.32,z=(hash(i,17)-.5)*2.32,cover=mossCoverage(x,z);
  const scale=.52+hash(i,31)*.85;
  dummy.position.set(x,elevation(x,z)+.006,z);
  dummy.rotation.set(0,hash(i,21)*Math.PI*2,(hash(i,23)-.5)*.22);
  dummy.scale.set(scale*(.75+.3*cover),scale,scale);
  // sparse litter gaps are still represented by fronds but tiny and brownish
  if(cover<.28)dummy.scale.multiplyScalar(.22);
  dummy.updateMatrix();fronds.setMatrixAt(i,dummy.matrix);
  fronds.setColorAt(i,new T.Color().setRGB(.74+cover*.21,.72+cover*.24,.60+cover*.27));
 }
 fronds.instanceMatrix.needsUpdate=true;if(fronds.instanceColor)fronds.instanceColor.needsUpdate=true;group.add(fronds);
 const debris=litter();debris.name='needles and broken leaves';group.add(debris);
 return{group,metrics:()=>{let triangles=0,drawObjects=0,ownedGeometries=0;group.traverse(o=>{if(o instanceof T.Mesh){const g=o.geometry;triangles+=(g.index?g.index.count:g.attributes.position.count)/3*(o instanceof T.InstancedMesh?o.count:1);drawObjects++;ownedGeometries++;}});return{triangles,drawObjects,ownedGeometries};},
 dispose:()=>{group.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();if(o instanceof T.InstancedMesh)o.dispose();}});group.removeFromParent();}
 };
}
