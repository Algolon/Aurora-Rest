/**
 * ROCK-R01-G01R — The Sheltered Fault / controlled sculptural reconstruction.
 * One authored closed stone shell: large explicit geological cutting planes,
 * a single actual recessed fault study, and NO G01 triangulation spokes.
 * Local coordinates in metres: Y up, Z front. Art NOT approved.
 */
export type V3=[number,number,number];
type Plane=readonly [number,number,number,number];
type Panel={name:string;vertices:V3[]};
export interface R01SculptMesh{
 positions:number[];normals:number[];colors:number[];uv:number[];
 triangles:number;bounds:{min:V3;max:V3};
 topology:{outerFrontVertices:number;outerBackVertices:number;faultVertices:number;
 structuralMasses:number;closedExterior:boolean;model:'authored-one-shell';
 construction:'authored-cut-panels';panelCount:number;fractureCount:number};
}
const CUTS:readonly {name:string;plane:Plane}[]=[
 {name:'asymmetric-lower-left-shoulder',plane:[-.81,.67,.07,2.28]},
 {name:'low-windward-right-shoulder',plane:[.76,.70,.11,2.22]},
 {name:'broad-crown-slope',plane:[.24,1,.08,2.24]},
 {name:'back-crown-wear',plane:[.16,.63,-.47,2.03]},
 {name:'left-rear-crown-taper',plane:[-.48,.53,-.45,2.10]},
 {name:'raked-upper-front',plane:[-.32,.24,1,1.60]},
 {name:'weathered-left-front-break',plane:[-.55,.13,.72,1.63]},
 {name:'sheltered-right-front-shoulder',plane:[.48,.19,.90,1.45]},
 {name:'swept-upper-front-shoulder',plane:[.15,.45,.75,1.65]},
 {name:'wide-front-lower',plane:[.17,-.09,1,1.50]},
 {name:'front-high-angle',plane:[.17,.69,.69,2.20]},
 {name:'back-main-plane',plane:[-.08,.16,-1,1.45]},
 {name:'left-exterior',plane:[-1,.07,.15,1.78]},
 {name:'right-rear-exterior',plane:[1,.05,-.28,1.77]},
 {name:'right-oblique-plane',plane:[.79,.04,.54,1.89]},
 {name:'left-back-oblique',plane:[-.71,.10,-.53,1.62]},
 {name:'low-front-left-chamfer',plane:[-.54,-.60,.19,1.22]},
 {name:'low-right-base-chamfer',plane:[.64,-.51,.43,1.23]},
 {name:'low-front-chamfer',plane:[-.16,-.69,.72,1.19]},
 {name:'low-back-chamfer',plane:[.26,-.65,-.58,1.20]},
 {name:'front-right-shoulder-relief',plane:[.55,.52,.44,1.89]},
 {name:'upper-left-flank',plane:[-.62,.48,.28,1.91]}
];
const EPS=1e-7;
const sub=(a:V3,b:V3):V3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a:V3,b:V3):V3=>[
 a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a:V3,b:V3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const unit=(a:V3):V3=>{const len=Math.hypot(...a);if(len<EPS)throw Error('R01: zero normal');return a.map(x=>x/len) as V3};
const mix=(a:V3,b:V3,t:number):V3=>a.map((x,i)=>x+(b[i]-x)*t) as V3;
const key=(v:V3)=>v.map(x=>Math.round(x*1e6)).join(':');
function originalBox():Panel[]{
 const [x0,x1]=[-1.83,1.82],[y0,y1]=[0,2.40],[z0,z1]=[-1.53,1.48];
 const a:V3=[x0,y0,z0],b:V3=[x1,y0,z0],c:V3=[x1,y1,z0],d:V3=[x0,y1,z0];
 const e:V3=[x0,y0,z1],f:V3=[x1,y0,z1],g:V3=[x1,y1,z1],h:V3=[x0,y1,z1];
 return [
  {name:'back',vertices:[a,d,c,b]},{name:'front',vertices:[e,f,g,h]},
  {name:'left',vertices:[a,e,h,d]},{name:'right',vertices:[b,c,g,f]},
  {name:'base',vertices:[a,b,f,e]},{name:'crown',vertices:[d,h,g,c]}
 ];
}
function clip(panel:Panel,plane:Plane):{panel:Panel|null;cut:V3[]}{
 const [nx,ny,nz,d]=plane,out:V3[]=[],cut:V3[]=[],v=panel.vertices;
 for(let i=0;i<v.length;i++){
  const a=v[i],b=v[(i+1)%v.length];
  const da=nx*a[0]+ny*a[1]+nz*a[2]-d,db=nx*b[0]+ny*b[1]+nz*b[2]-d;
  if(da<=EPS)out.push(a);
  if((da<=EPS)!==(db<=EPS)){const p=mix(a,b,da/(da-db));out.push(p);cut.push(p);}
 }
 const cleaned=out.filter((p,i)=>key(p)!==key(out[(i+out.length-1)%out.length]));
 return {panel:cleaned.length>2?{name:panel.name,vertices:cleaned}:null,cut};
}
function cutSolid(solid:Panel[],name:string,plane:Plane):Panel[]{
 const result:Panel[]=[],hits=new Map<string,V3>();
 for(const face of solid){
  const r=clip(face,plane);if(r.panel)result.push(r.panel);
  for(const p of r.cut)hits.set(key(p),p);
 }
 const ring=[...hits.values()];if(ring.length<3)return result;
 const center:V3=[0,0,0];
 for(const p of ring)for(let i=0;i<3;i++)center[i]+=p[i]/ring.length;
 const n=unit([plane[0],plane[1],plane[2]]);
 const u=unit(cross(Math.abs(n[1])<.8?[0,1,0]:[1,0,0],n)),v=cross(n,u);
 const angle=(p:V3)=>{const q=sub(p,center);return Math.atan2(dot(q,v),dot(q,u));};
 ring.sort((a,b)=>angle(a)-angle(b));
 result.push({name,vertices:ring});
 return result;
}
const panelNormal=(p:Panel)=>unit(cross(sub(p.vertices[1],p.vertices[0]),sub(p.vertices[2],p.vertices[0])));
function panelArea(p:Panel){
 let result=0;for(let i=1;i<p.vertices.length-1;i++)
  result+=Math.hypot(...cross(sub(p.vertices[i],p.vertices[0]),sub(p.vertices[i+1],p.vertices[0])))*.5;
 return result;
}
/** Authored local fracture: a pair of actual inset interior vertices.
 * Preserves every panel boundary and avoids any external seam/T-junction.
 */
function renderPanel(p:Panel,fracture:boolean,positions:number[],normals:number[],uv:number[],colors:number[]){
 const verts=p.vertices,n=panelNormal(p);
 const emit=(a:V3,b:V3,c:V3)=>{
  const v=cross(sub(b,a),sub(c,a)),len=Math.hypot(...v);
  if(len<1e-8)throw Error('R01 degenerate triangle in '+p.name);
  const normal=v.map(x=>x/len) as V3,abs=normal.map(Math.abs);
  for(const t of [a,b,c]){
   positions.push(...t);normals.push(...normal);colors.push(1,1,1);
   if(abs[0]>=abs[1]&&abs[0]>=abs[2])uv.push(t[2]*.38,t[1]*.38);
   else if(abs[1]>=abs[2])uv.push(t[0]*.38,t[2]*.38);
   else uv.push(t[0]*.38,t[1]*.38);
  }
 };
 const tris:[V3,V3,V3][]=[];
 for(let i=1;i<verts.length-1;i++)tris.push([verts[0],verts[i],verts[i+1]]);
 if(fracture){
  const largest=tris.map(t=>Math.hypot(...cross(sub(t[1],t[0]),sub(t[2],t[0]))))
   .reduce((best,x,i,arr)=>x>arr[best]?i:best,0);
  const [a,b,c]=tris[largest],p0=mix(mix(a,b,.34),c,.28),q0=mix(p0,mix(b,c,.48),.43);
  const inset=(t:V3,d:number)=>t.map((x,i)=>x-n[i]*d) as V3;
  const P=inset(p0,.105),Q=inset(q0,.14);
  const pieces:[V3,V3,V3][]=[[a,b,P],[c,a,P],[b,c,Q],[c,P,Q],[P,b,Q]];
  for(const t of pieces){
   if(dot(cross(sub(t[1],t[0]),sub(t[2],t[0])),n)<0)[t[1],t[2]]=[t[2],t[1]];
   emit(...t);
  }
  tris.splice(largest,1);
 }
 for(const t of tris)emit(...t);
}
export function buildShelteredFaultR01():R01SculptMesh{
 let panels=originalBox();
 for(const {name,plane} of CUTS)panels=cutSolid(panels,name,plane);
 const positions:number[]=[],normals:number[]=[],uv:number[]=[],colors:number[]=[];
 const candidates=panels.filter(p=>panelNormal(p)[2]>.4&&panelArea(p)>.7&&p.vertices.some(v=>v[1]>1));
 candidates.sort((a,b)=>panelArea(b)-panelArea(a));
 const fault=candidates.find(p=>panelNormal(p)[0]>.05)??candidates[0];
 if(!fault)throw Error('R01: no suitable front panel for weathered joint');
 for(const p of panels)renderPanel(p,p===fault,positions,normals,uv,colors);
 const lo:V3=[Infinity,Infinity,Infinity],hi:V3=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<positions.length;i+=3)for(let k=0;k<3;k++){
  lo[k]=Math.min(lo[k],positions[i+k]);hi[k]=Math.max(hi[k],positions[i+k]);
 }
 return {positions,normals,uv,colors,triangles:positions.length/9,bounds:{min:lo,max:hi},
  topology:{outerFrontVertices:0,outerBackVertices:0,faultVertices:4,structuralMasses:2,
   closedExterior:true,model:'authored-one-shell',construction:'authored-cut-panels',
   panelCount:panels.length,fractureCount:1}};
}
