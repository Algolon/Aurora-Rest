import * as THREE from 'three';
import {WORLD,LAKES,WATERCOURSES,type WaterPoint} from '../world/config.ts';
const swatch=new THREE.Color();
function flowingRiver(source:readonly WaterPoint[]){
 const pts:number[]=[],colors:number[]=[],indices:number[]=[],side=new THREE.Vector2();
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
 const ocean=new THREE.Mesh(new THREE.PlaneGeometry(40000,40000),new THREE.MeshPhongMaterial({color:0x376575,shininess:24,specular:0x354951,flatShading:false}));
 ocean.rotation.x=-Math.PI/2; ocean.position.y=WORLD.seaLevel-.45;scene.add(ocean);
 const lakes=LAKES.map(lake=>{
  const mesh=new THREE.Mesh(new THREE.CircleGeometry(1,96),new THREE.MeshPhongMaterial({color:0x3f7885,shininess:65,specular:0x7b969b,side:THREE.DoubleSide}));
  mesh.rotation.x=-Math.PI/2;mesh.position.set(lake.x,lake.level+.25,lake.z);mesh.scale.set(lake.rx,lake.rz,1);scene.add(mesh);return mesh;
 });
 const rivers=WATERCOURSES.map(points=>{
  const mesh=new THREE.Mesh(flowingRiver(points),new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));mesh.position.y=.1;scene.add(mesh);return mesh;
 });
 return {ocean,lakes,rivers};
}
