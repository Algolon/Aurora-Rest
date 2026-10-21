import * as THREE from 'three';
import type {BatchBackend,RenderRecord} from './instancedRenderer.ts';
export class BatchedNatureRenderer implements BatchBackend {
 readonly objects:THREE.Mesh[];
 private mesh:THREE.BatchedMesh;
 private geometries:number[]=[];
 private handles=new Map<number,number>();
 private last=new Map<number,{geo:number;active:boolean}>();
 private updates=0;
 private reallocations=0;
 constructor(scene:THREE.Scene,geos:readonly THREE.BufferGeometry[],material:THREE.MeshLambertMaterial,
  depth:THREE.MeshDepthMaterial,capacity:number,shadows:boolean){
  const vertices=geos.reduce((n,g)=>n+g.attributes.position.count,0);
  const indices=geos.reduce((n,g)=>n+(g.index?.count??0),0);
  this.mesh=new THREE.BatchedMesh(capacity,vertices,indices,material);
  this.mesh.name='nature-multidraw';this.mesh.customDepthMaterial=depth;
  this.mesh.castShadow=shadows;this.mesh.receiveShadow=true;
  this.mesh.frustumCulled=false;this.mesh.sortObjects=false;
  this.geometries=geos.map(g=>this.mesh.addGeometry(g));
  scene.add(this.mesh);this.objects=[this.mesh];
 }
 sync(records:readonly RenderRecord[]){
  for(const r of records){
   let h=this.handles.get(r.id);
   if(h===undefined){h=this.mesh.addInstance(this.geometries[r.geo]);this.handles.set(r.id,h);this.mesh.setMatrixAt(h,r.matrix);this.mesh.setColorAt(h,r.color);this.mesh.setVisibleAt(h,r.active);this.last.set(r.id,{geo:r.geo,active:r.active});this.updates+=3;continue;}
   const prev=this.last.get(r.id)!;
   if(prev.geo!==r.geo){this.mesh.setGeometryIdAt(h,this.geometries[r.geo]);this.updates++}
   if(prev.active!==r.active){this.mesh.setVisibleAt(h,r.active);this.updates++}
   if(r.changed){this.mesh.setMatrixAt(h,r.matrix);this.mesh.setColorAt(h,r.color);this.updates+=2}
   prev.geo=r.geo;prev.active=r.active;
  }
 }
 setShadowEnabled(value:boolean){this.mesh.castShadow=value}
 getBufferUpdates(){return this.updates}
 getReallocations(){return this.reallocations}
 dispose(){this.mesh.removeFromParent();this.mesh.dispose();this.handles.clear();this.last.clear();}
}

// Backwards-compatible symbol for earlier ASSET-01B2 imports.
export {BatchedNatureRenderer as BatchedBirchRenderer};
