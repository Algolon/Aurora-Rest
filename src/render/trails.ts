import * as THREE from 'three';
import {walkHeightAt as heightAt} from '../world/surface.ts';
import {ROUTES} from '../world/routes.ts';
/** Authored macro alignments, to be grade/slope validated and locally shaped in WORLD-02. */
function ribbon(points:readonly [number,number][],width:number){
 // Linear authored controls with sub-steps (curve softening can come in WORLD-02).
 const verts:number[]=[],colors:number[]=[],inds:number[]=[];let idx=0;
 for(let j=0;j<points.length-1;j++){
  const a=points[j],b=points[j+1],dx=b[0]-a[0],dz=b[1]-a[1];const len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,steps=Math.max(2,Math.ceil(len/2));
  for(let k=0;k<steps;k++){
   const t=k/steps,x=a[0]+dx*t,z=a[1]+dz*t;
   for(const sign of [-1,1]){
    const tx=x+nx*width*sign,tz=z+nz*width*sign;
    verts.push(tx,heightAt(tx,tz)+.12,tz);
    const n=.95+.05*Math.sin(x*.017+z*.031);colors.push(n*.58,n*.51,n*.38);
   }
   if(idx>0){const v=idx*2;inds.push(v-2,v,v-1,v-1,v,v+1);}idx++;
  }
 }
 const a=points[points.length-2],b=points[points.length-1],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);
 for(const sign of [-1,1]){const x=b[0]-dz/l*width*sign,z=b[1]+dx/l*width*sign;verts.push(x,heightAt(x,z)+.12,z);colors.push(.58,.51,.38);}
 const v=idx*2;inds.push(v-2,v,v-1,v-1,v,v+1);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(inds);geo.computeVertexNormals();return geo;
}
export function addTrails(scene:THREE.Scene){
 const mat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,transparent:true,opacity:.72,depthWrite:false});
 Object.values(ROUTES).forEach(route=>{const mesh=new THREE.Mesh(ribbon(route,1.2),mat);mesh.renderOrder=2;scene.add(mesh);});
}
