/** The moss-vs-litter mosaic is authored in a review-only vertex-colour ground mesh;
 * source grass and original R01 specimen geometry remain completely unchanged.
 */
import * as T from 'three';
import {STUDY,hash,groundHeight,colonyField,treadDistance} from './plan.ts';
function clamp(v:number){return Math.max(0,Math.min(1,v))}
function smooth(a:number,b:number,t:number){const u=clamp((t-a)/(b-a));return u*u*(3-2*u)}
const soil=new T.Color('#514936'),moss=new T.Color('#536d40'),shrub=new T.Color('#567044'),litter=new T.Color('#777052'),track=new T.Color('#49412f');
function pick(x:number,z:number,composed:boolean){
 const micro=Math.sin(x*7.7+z*11.1)*Math.cos(x*10.2-z*6.1);
 const m=colonyField('feathermoss',x,z),b=colonyField('bilberry',x,z),l=colonyField('lingonberry',x,z);
 const color=soil.clone().lerp(litter,clamp(.19+.14*micro+.13*Math.sin(x*2-z*4)));
 if(composed){
  const carpet=Math.max(m*.89,Math.min(.72,b*.47+l*.6));
  color.lerp(moss,clamp(carpet+.14*Math.max(0,micro)));
  color.lerp(shrub,clamp(Math.max(b*.30,l*.41)));
  // A subtly compressed footfall gap, not a uniform broad pasted road.
  const d=treadDistance(x,z),width=.44+.10*Math.sin(z*3.9)+.08*Math.sin(z*7.1+x*4.3);
  const wear=1-smooth(width,width+.24,d);
  color.lerp(track,wear*.68);
 }
 color.multiplyScalar(1+.095*micro+.035*Math.sin(x*25-z*17));
 return color;
}
export function makeStageGround(composed:boolean){
 const n=180,m=168,position:number[]=[],colors:number[]=[],indices:number[]=[];
 const minX=-4,minZ=-3.6,dx=8/n,dz=7.2/m;
 for(let j=0;j<=m;j++)for(let i=0;i<=n;i++){
  const x=minX+i*dx,z=minZ+j*dz,y=groundHeight(x,z);
  position.push(x,y,z);
  const c=pick(x,z,composed);colors.push(c.r,c.g,c.b);
 }
 for(let j=0;j<m;j++)for(let i=0;i<n;i++){
  const a=j*(n+1)+i,b=a+n+1;indices.push(a,b,a+1,a+1,b,b+1);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(position,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const material=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
 const mesh=new T.Mesh(geometry,material);mesh.receiveShadow=true;mesh.name='review-only ground '+(composed?'patch':'uncomposed');
 return mesh;
}
export function makeSurfaceLitter(){
 const positions:number[]=[],cols:number[]=[];
 const palette=['#8d8053','#675839','#a29568','#4e4e32','#736843','#5b5b3d'].map(c=>new T.Color(c));
 const tri=(p:number[][],c:T.Color)=>{for(const a of p){positions.push(...a);cols.push(c.r,c.g,c.b)}};
 for(let i=0;i<720;i++){
  const x=(hash(i,7)-.5)*7.3,z=(hash(i,9)-.5)*6.4;
  if(treadDistance(x,z)<.35&&hash(i,17)>.22)continue;
  const a=hash(i,13)*Math.PI*2,ux=Math.cos(a),uz=Math.sin(a),sx=-uz,sz=ux,sz0=.018+.023*hash(i,14),w=.008+.008*hash(i,15);
  const y=groundHeight(x,z)+.007,c=palette[Math.floor(hash(i,18)*palette.length)];
  const p=[x,y,z],tip=[x+ux*sz0,y+.002,z+uz*sz0],left=[x+ux*sz0*.53-sx*w,y+.002,z+uz*sz0*.53-sz*w],right=[x+ux*sz0*.53+sx*w,y+.002,z+uz*sz0*.53+sz*w];
  tri([p,left,tip],c);tri([p,tip,right],c);
 }
 // Tiny deadfall twigs, free of major boulders/new bark assets.
 for(let i=0;i<65;i++){
  const x=(hash(i,39)-.5)*7.2,z=(hash(i,42)-.5)*6.2,a=hash(i,43)*Math.PI*2,len=.04+.12*hash(i,44),wide=.0017;
  if(treadDistance(x,z)<.55)continue;
  const u=Math.cos(a),v=Math.sin(a),y=groundHeight(x,z)+.01,c=palette[3];
  const left=[x-v*wide,y,z+u*wide],right=[x+v*wide,y,z-u*wide],endL=[x+u*len-v*wide,groundHeight(x+u*len,z+v*len)+.01,z+v*len+u*wide],endR=[x+u*len+v*wide,groundHeight(x+u*len,z+v*len)+.01,z+v*len-u*wide];
  tri([left,right,endL],c);tri([right,endR,endL],c);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(cols,3));g.computeVertexNormals();g.computeBoundingSphere();
 const mesh=new T.Mesh(g,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide,depthWrite:false}));mesh.name='review-only leaf litter';return mesh;
}
