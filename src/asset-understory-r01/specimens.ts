/** Reference-first botanical geometry pilot, NOT production-approved nature assets.
 * Purpose-built low understory silhouettes; never edits the Aurora Nature Asset Library.
 * All dimensions in real-world metres. Drawn as double-sided curved leaf surfaces and fine stems.
 */
import * as T from 'three';
export type UnderstoryKind='bilberry'|'lingonberry'|'feathermoss';
export const SPECIMENS={
 bilberry:{latin:'Vaccinium myrtillus',heightM:[.18,.4],palette:['#547643','#6b874e','#829957'],habit:'branching deciduous shrub, fine leaves'},
 lingonberry:{latin:'Vaccinium vitis-idaea',heightM:[.07,.17],palette:['#233f2d','#34533c','#4b6548'],habit:'creeping evergreen mats, leathery oval leaves'},
 feathermoss:{latin:'Hylocomium/Pleurozium-type',heightM:[.015,.09],palette:['#54683a','#687747','#87965a'],habit:'overlapping feathery moss layer'}
} as const;
type V=[number,number,number];
const v=(x:number,y:number,z:number):V=>[x,y,z];
const add=(a:V,b:V):V=>v(a[0]+b[0],a[1]+b[1],a[2]+b[2]);
const mul=(a:V,t:number):V=>v(a[0]*t,a[1]*t,a[2]*t);
const norm=(a:V):V=>{const d=Math.hypot(...a)||1;return mul(a,1/d)};
const cross=(a:V,b:V):V=>v(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]);
const palette=(x:string)=>new T.Color(x);
const rand=(seed:number)=>{let s=seed>>>0;return()=>{s+=0x6d2b79f5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}};
class Draft{
 positions:number[]=[];colors:number[]=[];
 tri(a:V,b:V,c:V,color:T.Color,brightness=1){
  for(const p of [a,b,c]){this.positions.push(...p);this.colors.push(color.r*brightness,color.g*brightness,color.b*brightness);}
 }
 quad(a:V,b:V,c:V,d:V,col:T.Color,tone=1){this.tri(a,b,c,col,tone);this.tri(a,c,d,col,tone)}
 stem(a:V,b:V,width:number,color:T.Color,segments=5){
  const axis=norm(v(b[0]-a[0],b[1]-a[1],b[2]-a[2]));
  const n=norm(cross(axis,Math.abs(axis[1])>.94?v(1,0,0):v(0,1,0))),side=norm(cross(axis,n));
  for(let j=0;j<segments;j++){
   const an=Math.PI*2*j/segments,bn=Math.PI*2*(j+1)/segments;
   const q=(p:V,t:number,k:number)=>add(p,add(mul(n,Math.cos(t)*width*k),mul(side,Math.sin(t)*width*k)));
   this.quad(q(a,an,1),q(a,bn,1),q(b,bn,.62),q(b,an,.62),color,.82+.18*Math.cos(an));
  }
 }
 /** Botanical ovate curved lamina with raised midrib and tapered base/tip, unlike planar paper-star quads. */
 leaf(base:V,dir:V,length:number,halfWidth:number,color:T.Color,up=.018){
  const d=norm(dir),across=norm(cross(Math.abs(d[1])>.95?v(0,0,1):v(0,1,0),d));
  const section=(t:number,s:number):V=>{
   const w=Math.pow(Math.sin(Math.PI*t),.77)*(1-.12*t);
   const midrib=.0017*(1-Math.abs(s))*Math.sin(Math.PI*t);
   return add(add(base,mul(d,length*t)),add(mul(across,halfWidth*w*s),v(0,Math.sin(Math.PI*t)*up+midrib,0)));
  };
  for(let k=0;k<4;k++){
   const t=k/4,u=(k+1)/4;
   this.quad(section(t,-1),section(u,-1),section(u,0),section(t,0),color,.82+k*.045);
   this.quad(section(t,0),section(u,0),section(u,1),section(t,1),color,.94+k*.03);
  }
 }
 geometry(){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.positions,3));
  g.setAttribute('color',new T.Float32BufferAttribute(this.colors,3));
  g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
 }
}
function bilberry(variant:number){
 const r=rand(3401+variant*319),d=new Draft(),stem=palette('#53734b'),dark=palette('#516646');
 const greens=['#547c45','#6b864e','#819958','#497143'].map(palette);
 // 7-10 organic upright branched shoots emerge from a shared rhizome, not a radial paper star.
 const num=8+variant;
 for(let k=0;k<num;k++){
  const a=k*2.399963+variant*.44+(r()-.5)*.35;
  const radius=.016+.04*r(),x=Math.cos(a)*radius,z=Math.sin(a)*radius;
  const h=.215+.13*r()+variant*.013,spread=.07+.055*r();
  const tip=v(x+Math.cos(a)*spread,h,z+Math.sin(a)*spread);
  const root=v(x,0,z);
  d.stem(root,v(x+Math.cos(a)*spread*.34,h*.52,z+Math.sin(a)*spread*.34),.0027,dark);
  d.stem(v(x+Math.cos(a)*spread*.34,h*.52,z+Math.sin(a)*spread*.34),tip,.0017,stem);
  for(let j=1;j<=4;j++){
   const t=.30+j*.133,side=(j%2===0?1:-1),ang=a+side*(.65+.30*r());
   const base=v(root[0]+(tip[0]-root[0])*t,h*t,root[2]+(tip[2]-root[2])*t);
   const branch=v(base[0]+Math.cos(ang)*(.027+.04*r()),base[1]+(.025+.033*r()),base[2]+Math.sin(ang)*(.027+.04*r()));
   d.stem(base,branch,.0014,stem,4);
   for(let leaf=0;leaf<2;leaf++){
    const da=ang+(leaf?-.65:.55)+(.2*r()-.1);
    const start=leaf?branch:base;
    d.leaf(start,v(Math.cos(da),.18+.24*r(),Math.sin(da)),.017+.012*r(),.0062+.003*r(),greens[(k+j+leaf)%greens.length],.0017);
   }
  }
 }
 return d.geometry();
}
function lingonberry(variant:number){
 const r=rand(7011+variant*107),d=new Draft(),wood=palette('#5d6347');
 const leaves=['#25412f','#33523b','#406248','#526c4d'].map(palette);
 // Low trailing runners branching at irregular intervals; leaves waxy, broad and compact.
 for(let k=0;k<15+variant*3;k++){
  const a=k*2.399963+variant*.21+(r()-.5)*.3,dist=.10+.21*r();
  const start=v((r()-.5)*.045,0,(r()-.5)*.045);
  const end=v(Math.cos(a)*dist,.036+.075*r(),Math.sin(a)*dist);
  const middle=v(end[0]*.56,.026+.022*r(),end[2]*.56);
  d.stem(start,middle,.0024,wood,5);d.stem(middle,end,.0015,wood,5);
  for(let j=1;j<=5;j++){
   const t=j/6,side=j%2?1:-1;
   const where=v(start[0]+(end[0]-start[0])*t,start[1]+(end[1]-start[1])*t+.012,start[2]+(end[2]-start[2])*t);
   const na=a+side*(.7+.3*r());
   d.leaf(where,v(Math.cos(na),.30+.12*r(),Math.sin(na)),.018+.01*r(),.0068+.004*r(),leaves[(k+j)%leaves.length],.0019);
  }
 }
 return d.geometry();
}
function featherMoss(variant:number){
 const r=rand(11092+variant*241),d=new Draft();
 const greens=['#52663b','#647b46','#7c8a53','#455d37','#85935a'].map(palette);
 // Dense overlapping tuft carpet, fine elongated branches — never a few radial spikes.
 // Continuous cover results from many tiny 2–8 cm stems, with gaps and changing aspect.
 for(let k=0;k<170+variant*26;k++){
  const a=r()*2*Math.PI,rr=Math.sqrt(r())*(.33+.06*variant),x=Math.cos(a)*rr,z=Math.sin(a)*rr;
  if((x-.10)**2+(z+.08)**2<.014&&r()>.5)continue; // irregular holes
  const c=greens[Math.floor(r()*greens.length)],h=.025+.052*r();
  const y=.005+rr*.013,start=v(x,y,z),tip=v(x+.025*(r()-.5),y+h,z+.025*(r()-.5));
  d.stem(start,tip,.0007,c,3);
  const dir=r()*2*Math.PI,fx=Math.cos(dir),fz=Math.sin(dir);
  for(let j=1;j<=5;j++){
   const t=j/6,l=(.010+.008*r())*(1-.4*t),p=v(start[0]+(tip[0]-start[0])*t,start[1]+(tip[1]-start[1])*t,start[2]+(tip[2]-start[2])*t);
   const left=v(p[0]+(-fz)*l,p[1]+.003*r(),p[2]+fx*l);
   const right=v(p[0]+fz*l,p[1]+.003*r(),p[2]-fx*l);
   d.tri(p,left,v(left[0]+fx*.004,left[1]+.006,left[2]+fz*.004),c,.83+.15*r());
   d.tri(p,right,v(right[0]+fx*.004,right[1]+.006,right[2]+fz*.004),c,.82+.15*r());
  }
 }
 return d.geometry();
}
/** One owned geometry per request. Deliberately no network, texture atlas or duplicated source file. */
export function makeUnderstoryGeometry(kind:UnderstoryKind,variant:0|1|2){
 if(!Number.isInteger(variant)||variant<0||variant>2)throw RangeError('Variant must be 0..2');
 return kind==='bilberry'?bilberry(variant):kind==='lingonberry'?lingonberry(variant):kind==='feathermoss'?featherMoss(variant):neverKind(kind);
}
function neverKind(kind:never):never{throw Error('Unknown botanical species '+kind)}
export function measure(kind:UnderstoryKind,variant:0|1|2){
 const g=makeUnderstoryGeometry(kind,variant),box=g.boundingBox!;
 const data={kind,variant,triangles:g.getAttribute('position').count/3,heightM:box.max.y-box.min.y,diameterM:Math.max(box.max.x-box.min.x,box.max.z-box.min.z),vertices:g.getAttribute('position').count};
 g.dispose();return data;
}
