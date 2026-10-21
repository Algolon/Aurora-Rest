import * as THREE from 'three';
export type V3=[number,number,number];
export interface Data {
 meta:{masterId:string;masterRevision:string;masterSha256:string;terrainSha256:string;grid:{width:number;height:number;cellM:number;west:number;north:number}};
 coast:number[][];islands:{id:string;boundary:number[][]}[];
 ridges:{id:string;points:V3[]}[];valleys:{id:string;axis:V3[];boundary:number[][];widthsM:number[]}[];
 lakes:{id:string;name:string;level:number;boundary:number[][]}[];
 channels:{id:string;points:V3[];widthsM:number[];authoredWidthsM:number[]}[];
 routes:{id:string;role:string;widthM:number;targetMaxGrade:number;points2:number[][]}[];
 crossings:{id:string;channelId:string;position2:number[]}[];
 catchments:{id:string;name:string;rings:number[][][]}[];
}
export class HeightGrid {
 readonly values:Float32Array; readonly width:number; readonly height:number; readonly cell:number;
 constructor(values:Float32Array,width:number,height:number,cell=4){this.values=values;this.width=width;this.height=height;this.cell=cell;}
 node(x:number,z:number){const i=Math.max(0,Math.min(this.width-1,Math.round((x+3000)/this.cell))),j=Math.max(0,Math.min(this.height-1,Math.round((4000-z)/this.cell)));return this.values[j*this.width+i];}
 surface(x:number,z:number,step=4){
  const gx=Math.max(0,Math.min(6000/step-1e-8,(x+3000)/step)),gz=Math.max(0,Math.min(8000/step-1e-8,(4000-z)/step));
  const i=Math.floor(gx),j=Math.floor(gz),u=gx-i,v=gz-j,x0=i*step-3000,z0=4000-j*step;
  const a=this.node(x0,z0),b=this.node(x0,z0-step),c=this.node(x0+step,z0);
  if(u+v<=1)return a+(c-a)*u+(b-a)*v;
  const d=this.node(x0+step,z0-step);return d+(b-d)*(1-u)+(c-d)*(1-v);
 }
}
export function terrainGeometry(grid:HeightGrid,x0:number,north:number,span:number,step:number){
 const n=Math.round(span/step),pos=new Float32Array((n+1)**2*3),norm=new Float32Array(pos.length),indices:number[]=[];
 for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){
  const k=(j*(n+1)+i)*3,x=x0+i*step,z=north-j*step,h=grid.node(x,z);pos[k]=x;pos[k+1]=h;pos[k+2]=z;
  const dx=(grid.node(x+4,z)-grid.node(x-4,z))/8,dz=(grid.node(x,z+4)-grid.node(x,z-4))/8,l=Math.hypot(dx,1,dz);norm[k]=-dx/l;norm[k+1]=1/l;norm[k+2]=-dz/l;
 }
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;indices.push(a,a+1,b,a+1,b+1,b);}
 // Downward skirts preserve the contact surface while hiding mixed-resolution T junctions.
 const pp=Array.from(pos),nn=Array.from(norm);const edges=[Array.from({length:n+1},(_,i)=>i),Array.from({length:n+1},(_,j)=>j*(n+1)+n),Array.from({length:n+1},(_,i)=>n*(n+1)+n-i),Array.from({length:n+1},(_,j)=>(n-j)*(n+1))];
 for(const edge of edges){const first=pp.length/3;for(const a of edge)for(const drop of [0,32]){pp.push(pos[a*3],pos[a*3+1]-drop,pos[a*3+2]);nn.push(norm[a*3],norm[a*3+1],norm[a*3+2]);}for(let i=0;i<n;i++){const a=first+2*i;indices.push(a,a+1,a+2,a+2,a+1,a+3);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nn,3));g.setIndex(indices);g.computeBoundingSphere();return g;
}
interface Tile {mesh:THREE.Mesh; x:number;z:number;step:number;}
export class Terrain {
 readonly tiles:Tile[]=[];readonly group=new THREE.Group();readonly material=new THREE.MeshLambertMaterial({color:0xb4b6b0,side:THREE.DoubleSide});
 readonly grid:HeightGrid;
 constructor(grid:HeightGrid,scene:THREE.Scene){this.grid=grid;for(let j=0;j<20;j++)for(let i=0;i<15;i++){const x=-3000+i*400,z=4000-j*400,mesh=new THREE.Mesh(terrainGeometry(grid,x,z,400,16),this.material);this.group.add(mesh);this.tiles.push({mesh,x,z,step:16});}scene.add(this.group);}
 update(x:number,z:number,survey=false,force=false){let changed=0;for(const t of this.tiles){const desired=survey?8:Math.hypot(t.x+200-x,t.z-200-z)<700?4:16;if(t.step===desired)continue;if(!force&&changed>=1)break;t.mesh.geometry.dispose();t.mesh.geometry=terrainGeometry(this.grid,t.x,t.z,400,desired);t.step=desired;changed++;}}
 surface(x:number,z:number){const i=Math.max(0,Math.min(14,Math.floor((x+3000)/400))),j=Math.max(0,Math.min(19,Math.floor((4000-z)/400)));return this.grid.surface(x,z,this.tiles[j*15+i].step);}
}
export function contains(p:number[],ring:number[][]){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
export function waterAt(data:Data,x:number,z:number){
 for(const l of data.lakes)if(contains([x,z],l.boundary))return l.level;
 let answer=-Infinity;
 for(const s of data.channels)for(let i=1;i<s.points.length;i++){
  const a=s.points[i-1],b=s.points[i],dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1))),d=Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz);
  if(d<(s.widthsM[i-1]*(1-t)+s.widthsM[i]*t)/2)answer=Math.max(answer,a[1]+(b[1]-a[1])*t);
 }
 return Math.max(0,answer);
}
