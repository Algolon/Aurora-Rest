import * as THREE from 'three';
import {WORLD} from '../world/config.ts';
import {heightAt} from '../world/geography.ts';
const swatch=new THREE.Color();
function flowingRiver(){
 const source=WORLD.water.river,pts:number[]=[],colors:number[]=[],indices:number[]=[],side=new THREE.Vector2();
 const samples=10*(source.length-1);
 for(let i=0;i<=samples;i++){
  const f=i/10,j=Math.min(source.length-2,Math.floor(f)),t=Math.min(1,f-j),a=source[j],b=source[j+1];
  const x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,level=a.level+(b.level-a.level)*t;
  side.set(-(b.z-a.z),b.x-a.x).normalize();
  const width=a.width+(b.width-a.width)*t;
  for(const sign of [-1,1]){
   pts.push(x+side.x*width*sign,level-.6,z+side.y*width*sign);
   swatch.setRGB(.14,.34,.35).lerp(new THREE.Color(.31,.49,.50),t*.33);colors.push(swatch.r,swatch.g,swatch.b);
  }
  if(i<samples){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
export function addWater(scene:THREE.Scene){
 const ocean=new THREE.Mesh(new THREE.PlaneGeometry(20000,20000),new THREE.MeshPhongMaterial({color:0x467e89,shininess:66,specular:0x778b88,flatShading:false,transparent:true,opacity:.96,depthWrite:true}));
 ocean.rotation.x=-Math.PI/2; ocean.position.y=WORLD.seaLevel-.45;scene.add(ocean);
 const tarn=WORLD.water.tarn;const circle=new THREE.Mesh(new THREE.CircleGeometry(1,96),new THREE.MeshPhongMaterial({color:0x4e8585,shininess:105,specular:0x879a9a,side:THREE.DoubleSide}));
 circle.rotation.x=-Math.PI/2;circle.position.set(tarn.x,WORLD.tarnLevel+.25,tarn.z);circle.scale.set(tarn.rx,tarn.rz,1);scene.add(circle);
 const river=new THREE.Mesh(flowingRiver(),new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));river.position.y=.1;scene.add(river);
 // Shallow wetland pools: restricted to lowland elevation to avoid floating water discs.
 for(const [cx,cz,rad] of [[850,-1000,83],[1480,-1380,55],[1090,-780,43]] as const){
  const y=heightAt(cx,cz)+.38;
  if(y>18)continue;
  const pool=new THREE.Mesh(new THREE.CircleGeometry(rad,42),new THREE.MeshPhongMaterial({color:0x557f75,transparent:true,opacity:.8,side:THREE.DoubleSide}));
  pool.rotation.x=-Math.PI/2;pool.position.set(cx,y,cz);scene.add(pool);
 }
 return {ocean,tarn:circle,river};
}
