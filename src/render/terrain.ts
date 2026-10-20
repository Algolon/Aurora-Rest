import * as THREE from 'three';
import { WORLD } from '../world/config.ts';
import {heightAt, biomeAt, noise, coastField, type Biome} from '../world/geography.ts';

const palettes:Record<Biome,[number,number,number]>={
 ocean:[.11,.30,.40],shore:[.72,.66,.48],dune:[.72,.65,.45],
 forest:[.25,.36,.20], meadow:[.43,.47,.30],wetland:[.35,.43,.27],
 heath:[.45,.42,.30],alpine:[.48,.48,.38],rock:[.43,.45,.43],snow:[.83,.84,.79]
};
const clay=new THREE.Color(),c2=new THREE.Color();
function colorAt(x:number,z:number,y:number,slope:number):[number,number,number]{
 const bio=biomeAt(x,z,y,slope),raw=palettes[bio];
 clay.setRGB(...raw);
 const fleck=noise(x/140,z/140,77)*.075+noise(x/28,z/28,19)*.022;
 const rock=Math.min(1,Math.max(0,(slope-.48)*1.7));
 if(bio!=='snow'&&bio!=='ocean'&&bio!=='rock'&&bio!=='shore') clay.lerp(c2.setRGB(...palettes.rock),rock*.68);
 clay.multiplyScalar(Math.max(.64,1+fleck));
 if(coastField(x,z)<0)clay.multiplyScalar(.82);
 return [clay.r,clay.g,clay.b];
}
function geometry(x0:number,z0:number,span:number,segments:number){
 const verts=(segments+1)**2,pos=new Float32Array(verts*3),col=new Float32Array(verts*3),ix:number[]=[];
 let k=0;
 for(let j=0;j<=segments;j++)for(let i=0;i<=segments;i++){
  const x=x0+(i/segments)*span,z=z0+(j/segments)*span,y=heightAt(x,z);
  pos[k]=x;pos[k+1]=y;pos[k+2]=z;
  k+=3;
 }
 for(let j=0;j<=segments;j++)for(let i=0;i<=segments;i++){
  const a=j*(segments+1)+i, left=j*(segments+1)+Math.max(0,i-1),right=j*(segments+1)+Math.min(segments,i+1), down=Math.max(0,j-1)*(segments+1)+i,up=Math.min(segments,j+1)*(segments+1)+i;
  const sx=(pos[right*3+1]-pos[left*3+1])/Math.max(1,(Math.min(segments,i+1)-Math.max(0,i-1))*span/segments);
  const sz=(pos[up*3+1]-pos[down*3+1])/Math.max(1,(Math.min(segments,j+1)-Math.max(0,j-1))*span/segments);
  const c=colorAt(pos[a*3],pos[a*3+2],pos[a*3+1],Math.hypot(sx,sz));col[a*3]=c[0];col[a*3+1]=c[1];col[a*3+2]=c[2];
 }
 for(let j=0;j<segments;j++)for(let i=0;i<segments;i++){
  const a=j*(segments+1)+i,b=a+segments+1;
  ix.push(a,b,a+1,a+1,b,b+1);
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.setIndex(ix);geo.computeVertexNormals();geo.computeBoundingSphere();return geo;
}
interface Tile {x:number;z:number;mesh:THREE.Mesh;near:boolean;}
export class TerrainRenderer{
 readonly tiles:Tile[]=[]; readonly group=new THREE.Group();
 readonly material=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
 private frame=0;
 constructor(scene:THREE.Scene){
  const span=WORLD.tileSize, nx=Math.ceil(WORLD.halfWidth*2/span),nz=Math.ceil(WORLD.halfLength*2/span);
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
   const x=-WORLD.halfWidth+i*span,z=-WORLD.halfLength+j*span;
   const mesh=new THREE.Mesh(geometry(x,z,span,WORLD.tileFarSegments),this.material);
   mesh.frustumCulled=true;mesh.receiveShadow=false;
   this.group.add(mesh);this.tiles.push({x:x+span/2,z:z+span/2,mesh,near:false});
  }
  scene.add(this.group);
 }
 update(x:number,z:number,force=false){
  // CPU budget: only a few meshes per frame while moving; full refresh when teleporting.
  const radiusNear=WORLD.nearRadius,radiusFar=WORLD.farRadius;
  let swaps=0;
  const sorted=this.tiles.map(tile=>({tile,d:Math.hypot(tile.x-x,tile.z-z)})).sort((a,b)=>a.d-b.d);
  for(const {tile,d} of sorted){
   const desired=d<(tile.near?radiusFar:radiusNear);
   if(desired===tile.near)continue;
   if(!force&&swaps>=3)break;
   const span=WORLD.tileSize,segments=desired?WORLD.tileNearSegments:WORLD.tileFarSegments;
   const next=geometry(tile.x-span/2,tile.z-span/2,span,segments);
   tile.mesh.geometry.dispose(); tile.mesh.geometry=next;tile.near=desired;swaps++;
  }
  this.frame++;
 }
 get nearCount(){return this.tiles.filter(t=>t.near).length;}
}
