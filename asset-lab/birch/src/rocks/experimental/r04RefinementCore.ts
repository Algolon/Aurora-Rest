/**
 * ASSET-01E2R-A: reversible, strictly local refinement of source-locked R04.
 * Original rockSculptR04Core.ts is never edited. No seeded silhouette generation.
 * G1: two small authored incisions and subtle front-slab seam adjustment.
 * G2: G1 plus two restrained side/rear supporting-plane incisions.
 */
import {buildHeroR04, type BoulderR04Mesh, type V3} from './rockSculptR04Core.ts';

export type R04GeometryStudy = 'G0'|'G1'|'G2';
type Cut = {name:string; part:0|1; xy:[number,number]; direction:V3; face:V3; depth:number};
const CUTS:readonly Cut[]=[
 {name:'upper-front-fault',part:0,xy:[-0.62,1.42],direction:[-0.4,-1,0.18],face:[0,0,1],depth:0.050},
 {name:'front-slab-bedding',part:1,xy:[0.15,1.10],direction:[0.8,-0.48,0.1],face:[0,0,1],depth:0.039},
 {name:'rear-weathered-joint',part:0,xy:[-0.35,1.24],direction:[-0.15,-1,0.3],face:[0,0,-1],depth:0.025},
 {name:'left-shoulder-chip',part:0,xy:[-1.05,1.54],direction:[0.18,-1,0.36],face:[-1,0,0],depth:0.027}
];
const sub=(a:V3,b:V3):V3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a:V3,b:V3):V3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a:V3,b:V3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const mag=(a:V3)=>Math.hypot(...a);
const normal=(a:V3,b:V3,c:V3):V3=>{const v=cross(sub(b,a),sub(c,a)),m=mag(v);if(m<1e-10)throw Error('Degenerate R04 refinement triangle');return[v[0]/m,v[1]/m,v[2]/m];};
const mix=(a:V3,b:V3,t:number):V3=>[a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t,a[2]*(1-t)+b[2]*t];
const get3=(a:number[],j:number):V3=>[a[j],a[j+1],a[j+2]];
export interface R04RefinedMesh extends BoulderR04Mesh {
 readonly study:R04GeometryStudy;
 readonly appliedCuts:readonly string[];
 readonly sourceTriangles:number;
 readonly maximumVertexShiftM:number;
}
function tuckSlab(p:V3):V3 {
 // Changes only the slab's upper inward-facing region. Ground footprint and crown stay source-faithful.
 const influence=Math.max(0,Math.min(1,(p[1]-0.85)/0.55))*Math.max(0,Math.min(1,(1.72-p[2])/0.65));
 return [p[0],p[1],p[2]-0.033*influence];
}
function uvFor(p:V3,n:V3):[number,number]{
 const a=n.map(Math.abs);
 const scale=.38;
 if(a[0]>=a[1]&&a[0]>=a[2])return [p[2]*scale,p[1]*scale];
 if(a[1]>=a[2])return [p[0]*scale,p[2]*scale];
 return [p[0]*scale,p[1]*scale];
}
export function buildRefinedR04(study:R04GeometryStudy='G1'):R04RefinedMesh {
 const base=buildHeroR04({seed:37,detail:'refined'});
 if(study!=='G0'&&study!=='G1'&&study!=='G2')throw RangeError('Unknown R04 geometry study');
 if(study==='G0')return {...base,study,appliedCuts:[],sourceTriangles:base.triangles,maximumVertexShiftM:0};
 const originalCount=base.pieces[0].triangles;
 const faces:Array<{vertices:[V3,V3,V3];color:V3;part:0|1;normal:V3;area:number}>=[];
 for(let i=0;i<base.triangles;i++){
   const v:[V3,V3,V3]=[get3(base.positions,i*9),get3(base.positions,i*9+3),get3(base.positions,i*9+6)];
   const part:iPart=i<originalCount?0:1;
   if(part===1)for(let j=0;j<3;j++)v[j]=tuckSlab(v[j]);
   const n=normal(...v);
   faces.push({vertices:v,color:get3(base.colors,i*9),part,normal:n,area:mag(cross(sub(v[1],v[0]),sub(v[2],v[0])))/2});
 }
 const chosen=new Map<number,Cut>();
 const active=study==='G2'?CUTS:CUTS.slice(0,2);
 for(const cut of active){
   let best=-1,bestScore=Infinity;
   for(let i=0;i<faces.length;i++){
     const f=faces[i];
     if(f.part!==cut.part||f.area<0.028||chosen.has(i))continue;
     const facing=dot(f.normal,cut.face);
     if(facing<0.18)continue;
     const c=mix(mix(f.vertices[0],f.vertices[1],0.5),f.vertices[2],1/3);
     const dx=c[0]-cut.xy[0],dy=c[1]-cut.xy[1];
     const score=(dx*dx+dy*dy) + 0.045/(f.area+0.04) + (1-facing)*0.27;
     if(score<bestScore){bestScore=score;best=i;}
   }
   if(best<0)throw Error('No source R04 plane supports authored cut '+cut.name);
   chosen.set(best,cut);
 }
 const positions:number[]=[],normals:number[]=[],colors:number[]=[],uv:number[]=[];
 const pieces=base.pieces.map(p=>({...p,triangles:0}));
 let maxShift=0;
 function emit(a:V3,b:V3,c:V3,sourceN:V3,color:V3):void {
   let n=normal(a,b,c);
   if(dot(n,sourceN)<0){const t=b;b=c;c=t;n=normal(a,b,c);}
   for(const p of [a,b,c]){
     positions.push(...p);normals.push(...n);colors.push(...color);uv.push(...uvFor(p,n));
   }
 }
 for(const [i,f] of faces.entries()){
   const [a,b,c]=f.vertices;
   const cut=chosen.get(i);
   const start=positions.length;
   if(cut){
     // Inset two endpoints on one authored structural direction. Original perimeter is untouched:
     // no open edges, overlays, z-fighting or independent decorative crack meshes.
     const centre:V3=[(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3,(a[2]+b[2]+c[2])/3];
     const dir=cut.direction;
     const ordered=[a,b,c].map((p,index)=>({index,projection:dot(sub(p,centre),dir)})).sort((x,y)=>x.projection-y.projection);
     const va=[a,b,c][ordered[0].index],vb=[a,b,c][ordered[1].index],vc=[a,b,c][ordered[2].index];
     const p0=mix(centre,va,.37),q0=mix(centre,vc,.37);
     const p:V3=[p0[0]-f.normal[0]*cut.depth,p0[1]-f.normal[1]*cut.depth,p0[2]-f.normal[2]*cut.depth];
     const q:V3=[q0[0]-f.normal[0]*cut.depth,q0[1]-f.normal[1]*cut.depth,q0[2]-f.normal[2]*cut.depth];
     maxShift=Math.max(maxShift,cut.depth);
     emit(va,vb,p,f.normal,f.color);emit(vb,q,p,f.normal,f.color);
     emit(vb,vc,q,f.normal,f.color);emit(vc,va,q,f.normal,f.color);
     emit(va,p,q,f.normal,f.color);
   }else emit(a,b,c,f.normal,f.color);
   pieces[f.part].triangles+=(positions.length-start)/9;
 }
 const lower:V3=[Infinity,Infinity,Infinity],upper:V3=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<positions.length;i+=3)for(let k=0;k<3;k++){lower[k]=Math.min(lower[k],positions[i+k]);upper[k]=Math.max(upper[k],positions[i+k]);}
 return {positions,normals,colors,uv,triangles:positions.length/9,bounds:{min:lower,max:upper},
  pieces,seed:base.seed,detail:base.detail,study,appliedCuts:[...chosen.values()].map(c=>c.name),
  sourceTriangles:base.triangles,maximumVertexShiftM:Math.max(maxShift,.033)};
}
type iPart=0|1;
