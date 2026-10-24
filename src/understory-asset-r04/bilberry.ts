/** UNDERSTORY-ASSET-R04: single leaf-dense original bilberry shrub sculptural mesh.
 * Designed after USFS Vaccinium myrtillus: green angular shoots, alternating 1–3cm leaves, rhizome.
 * Source photos were consulted as REFERENCES; no external photo or scanned geometry incorporated.
 */
import * as T from 'three';
import {hash,type OwnedAsset} from './substrate.ts';
export const BILBERRY=Object.freeze({species:'Vaccinium myrtillus',heightRangeM:[.24,.49],clumps:5,shoots:46,sourcePhotoPixelsUsed:false});
type V=[number,number,number];
const v=(x:number,y:number,z:number):V=>[x,y,z];
const add=(a:V,b:V):V=>v(a[0]+b[0],a[1]+b[1],a[2]+b[2]);
const diff=(a:V,b:V):V=>v(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const mul=(a:V,t:number):V=>v(a[0]*t,a[1]*t,a[2]*t);
const dot=(a:V,b:V)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:V,b:V):V=>v(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]);
const norm=(a:V)=>mul(a,1/(Math.hypot(...a)||1));
class Brush{
 pos:number[]=[];colors:number[]=[];
 tri(a:V,b:V,c:V,co:T.Color,mul=1){for(const p of [a,b,c]){this.pos.push(...p);this.colors.push(co.r*mul,co.g*mul,co.b*mul);}}
 quad(a:V,b:V,c:V,d:V,co:T.Color,tone=1){this.tri(a,b,c,co,tone);this.tri(a,c,d,co,tone);}
 tube(a:V,b:V,radius:number,co:T.Color){
  const up=norm(diff(b,a)),q=norm(cross(up,Math.abs(up[1])>.94?v(1,0,0):v(0,1,0))),s=norm(cross(up,q));
  for(let i=0;i<5;i++){
   const angle=i*Math.PI*2/5,next=(i+1)*Math.PI*2/5;
   const pt=(c:V,t:number,r:number)=>add(c,add(mul(q,r*Math.cos(t)),mul(s,r*Math.sin(t))));
   this.quad(pt(a,angle,radius),pt(a,next,radius),pt(b,next,radius*.69),pt(b,angle,radius*.69),co,.84+.12*Math.cos(angle));
  }
 }
 leaf(base:V,axis:V,len:number,colour:T.Color,twist:number){
  const d=norm(axis),side=norm(cross(d,Math.abs(d[1])>.90?v(0,0,1):v(0,1,0)));
  const lift=.0018+.0024*Math.abs(Math.sin(twist)),halfWidth=len*(.27+.04*Math.cos(twist));
  const bent=(t:number,s:number)=>{
   const width=Math.pow(Math.sin(Math.PI*t),.76)*(1-.08*t),cuff=.0015*(1-Math.abs(s))*Math.sin(Math.PI*t);
   return add(base,add(mul(d,len*t),add(mul(side,s*width*halfWidth),v(0,lift*Math.sin(Math.PI*t)+cuff,0))));
  };
  for(let k=0;k<4;k++){
   const t=k/4,n=(k+1)/4;
   this.quad(bent(t,-1),bent(n,-1),bent(n,0),bent(t,0),colour,.82+.025*k);
   this.quad(bent(t,0),bent(n,0),bent(n,1),bent(t,1),colour,.98+.016*k);
  }
 }
 geom(){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.pos,3));g.setAttribute('color',new T.Float32BufferAttribute(this.colors,3));g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
 }
}
const leaves=['#56763f','#688850','#79955c','#4f7243','#87a266','#658551'].map(x=>new T.Color(x));
const green=new T.Color('#63814e'),brown=new T.Color('#675839');
export function makeBilberryGeometry(){
 const d=new Brush();
 // Five irregular rhizomatous colonies with individual stems and clear negative gaps.
 const clumps:[number,number][]=[[-.16,-.09],[.13,-.13],[.0,.10],[-.18,.18],[.23,.12]];
 for(let j=0;j<BILBERRY.shoots;j++){
  const colony=j%clumps.length,origin=clumps[colony],h=.27+.19*hash(j,10),a=j*2.399963+.27*hash(j,3);
  const jitter=.025+.095*hash(j,4),root=v(origin[0]+Math.cos(a)*jitter,.004,origin[1]+Math.sin(a)*jitter);
  const drift=.055+.11*hash(j,5),tip=v(root[0]+Math.cos(a)*drift,h,root[2]+Math.sin(a)*drift);
  const mid=add(mul(root,.49),mul(tip,.51));
  mid[0]+=.018*Math.sin(j*1.3);mid[2]+=.018*Math.cos(j*.93);
  d.tube(root,mid,.0028, j%3?green:brown);d.tube(mid,tip,.0016,green);
  // alternate leaf-bearing branches; edge shoots less dense but canopy remains leafy in volume
  for(let k=0;k<9;k++){
   const t=.26+(k+.5)/10,a2=a+(k%2?.95:-1.0)+(hash(j,k)-.5)*.7;
   const branchRoot=add(root,mul(diff(tip,root),t));
   const l=.065+.060*hash(j,k,4),end=add(branchRoot,v(Math.cos(a2)*l,.009+.023*hash(j,k,6),Math.sin(a2)*l));
   d.tube(branchRoot,end,.00115,green);
   // true 1-3cm single lamina, not one radial multi-leaf star
   for(let leaf=0;leaf<4;leaf++){
    const theta=a2+(leaf-1)*.72+.3*(hash(j,k,leaf)-.5),p=add(branchRoot,mul(diff(end,branchRoot),.48+.18*leaf));
    const direct=v(Math.cos(theta),.11+.32*hash(j+leaf,k,9),Math.sin(theta));
    const length=.020+.015*hash(j,k+leaf,12);
    d.leaf(p,direct,length,leaves[(j+k+leaf)%leaves.length],theta);
   }
  }
 }
 return d.geom();
}
export function createDenseBilberry():OwnedAsset{
 const group=new T.Group();group.name='UNDERSTORY-R04 original dense bilberry / single asset';
 const g=makeBilberryGeometry(),mat=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
 const mesh=new T.Mesh(g,mat);mesh.name='Vaccinium myrtillus leafed twigs and rhizome';mesh.castShadow=false;group.add(mesh);
 return{group,metrics:()=>({triangles:g.attributes.position.count/3,drawObjects:1,ownedGeometries:1}),dispose:()=>{mesh.geometry.dispose();mat.dispose();mesh.removeFromParent();group.removeFromParent();}};
}
