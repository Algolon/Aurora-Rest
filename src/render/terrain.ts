import * as THREE from 'three';
import { WORLD } from '../world/config.ts';
import {heightAt, biomeAt, noise, coastField, type Biome} from '../world/geography.ts';
import {surfaceHeightAt} from '../world/surface.ts';

const palettes:Record<Biome,[number,number,number]>={
 ocean:[.07,.19,.24],shore:[.55,.48,.32],dune:[.55,.48,.30],
 forest:[.14,.23,.12], meadow:[.29,.34,.17],wetland:[.19,.28,.16],
 heath:[.33,.29,.18],alpine:[.33,.34,.27],rock:[.29,.32,.32],snow:[.79,.83,.82]
};
const clay=new THREE.Color(),c2=new THREE.Color();
// Share a bounded, world-aligned gradient cache across LODs. Near meshes reuse
// lighting samples already needed by far tiles instead of four height queries per vertex.
const normalCell=WORLD.tileSize/WORLD.tileFarSegments;
const normalWidth=Math.ceil(WORLD.halfWidth*2/normalCell)+3,normalDepth=Math.ceil(WORLD.halfLength*2/normalCell)+3;
const gradients=new Float32Array(normalWidth*normalDepth*2),gradientReady=new Uint8Array(normalWidth*normalDepth);
function gradientNode(ix:number,iz:number){
 const index=iz*normalWidth+ix;
 if(!gradientReady[index]){
  const x=(ix-1)*normalCell-WORLD.halfWidth,z=(iz-1)*normalCell-WORLD.halfLength,d=4;
  gradients[index*2]=(heightAt(x+d,z)-heightAt(x-d,z))/(2*d);
  gradients[index*2+1]=(heightAt(x,z+d)-heightAt(x,z-d))/(2*d);gradientReady[index]=1;
 }
 return index*2;
}
function gradientAt(x:number,z:number){
 const gx=(x+WORLD.halfWidth)/normalCell+1,gz=(z+WORLD.halfLength)/normalCell+1,ix=Math.floor(gx),iz=Math.floor(gz),u=gx-ix,v=gz-iz;
 const a=gradientNode(ix,iz),b=gradientNode(ix+1,iz),c=gradientNode(ix,iz+1),d=gradientNode(ix+1,iz+1);
 return [0,1].map(k=>(gradients[a+k]*(1-u)+gradients[b+k]*u)*(1-v)+(gradients[c+k]*(1-u)+gradients[d+k]*u)*v);
}
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
export function terrainGeometry(x0:number,z0:number,span:number,segments:number){
 const verts=(segments+1)**2,pos=new Float32Array(verts*3),col=new Float32Array(verts*3),norm=new Float32Array(verts*3),ix:number[]=[];
 let k=0;
 for(let j=0;j<=segments;j++)for(let i=0;i<=segments;i++){
  const x=x0+(i/segments)*span,z=z0+(j/segments)*span,y=heightAt(x,z);
  pos[k]=x;pos[k+1]=y;pos[k+2]=z;
  k+=3;
 }
 for(let j=0;j<=segments;j++)for(let i=0;i<=segments;i++){
  const a=j*(segments+1)+i,[sx,sz]=gradientAt(pos[a*3],pos[a*3+2]),length=Math.hypot(sx,1,sz);
  norm[a*3]=-sx/length;norm[a*3+1]=1/length;norm[a*3+2]=-sz/length;
  const c=colorAt(pos[a*3],pos[a*3+2],pos[a*3+1],Math.hypot(sx,sz));col[a*3]=c[0];col[a*3+1]=c[1];col[a*3+2]=c[2];
 }
 for(let j=0;j<segments;j++)for(let i=0;i<segments;i++){
  const a=j*(segments+1)+i,b=a+segments+1;
  ix.push(a,b,a+1,a+1,b,b+1);
 }
 // Downward skirts cover mixed-LOD T junctions without raising the walking surface.
 const positions=Array.from(pos),colors=Array.from(col),normals=Array.from(norm);
 const edges=[Array.from({length:segments+1},(_,i)=>i),Array.from({length:segments+1},(_,i)=>i*(segments+1)+segments),Array.from({length:segments+1},(_,i)=>segments*(segments+1)+segments-i),Array.from({length:segments+1},(_,i)=>(segments-i)*(segments+1))];
 for(const edge of edges){
  const start=positions.length/3;
  for(const a of edge){
   for(const drop of [.2,45]){positions.push(pos[a*3],pos[a*3+1]-drop,pos[a*3+2]);colors.push(col[a*3],col[a*3+1],col[a*3+2]);normals.push(norm[a*3],norm[a*3+1],norm[a*3+2]);}
  }
  for(let i=0;i<segments;i++){const a=start+i*2;ix.push(a,a+1,a+2,a+2,a+1,a+3);}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setIndex(ix);
 geo.computeBoundingSphere();return geo;
}
interface Tile {x:number;z:number;mesh:THREE.Mesh;near:boolean;}
export class TerrainRenderer{
 readonly tiles:Tile[]=[]; readonly group=new THREE.Group();
 readonly material=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
 constructor(scene:THREE.Scene){
  const span=WORLD.tileSize, nx=Math.ceil(WORLD.halfWidth*2/span),nz=Math.ceil(WORLD.halfLength*2/span);
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
   const x=-WORLD.halfWidth+i*span,z=-WORLD.halfLength+j*span;
   const mesh=new THREE.Mesh(terrainGeometry(x,z,span,WORLD.tileFarSegments),this.material);
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
   if(!force&&swaps>=1)break;
   const span=WORLD.tileSize,segments=desired?WORLD.tileNearSegments:WORLD.tileFarSegments;
   const next=terrainGeometry(tile.x-span/2,tile.z-span/2,span,segments);
   tile.mesh.geometry.dispose(); tile.mesh.geometry=next;tile.near=desired;swaps++;
  }
 }
 heightAt(x:number,z:number){
  const i=Math.floor((x+WORLD.halfWidth)/WORLD.tileSize),j=Math.floor((z+WORLD.halfLength)/WORLD.tileSize);
  const tile=this.tiles[j*Math.ceil(WORLD.halfWidth*2/WORLD.tileSize)+i];
  return surfaceHeightAt(x,z,tile?.near?WORLD.tileNearSegments:WORLD.tileFarSegments);
 }
 get nearCount(){return this.tiles.filter(t=>t.near).length;}
}
