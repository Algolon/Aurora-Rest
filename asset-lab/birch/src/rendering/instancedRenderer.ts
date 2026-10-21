import * as THREE from 'three';
export interface RenderRecord {id:number;geo:number;matrix:THREE.Matrix4;color:THREE.Color;active:boolean;changed:boolean}
export interface BatchBackend {
 readonly objects:readonly THREE.Mesh[];
 sync(records:readonly RenderRecord[]):void;
 dispose():void;
 getBufferUpdates():number;
 getReallocations():number;
}
interface Group {mesh:THREE.InstancedMesh;ids:number[];cap:number;geometry:THREE.BufferGeometry}
export class InstancedNatureRenderer implements BatchBackend {
 readonly objects:THREE.Mesh[]=[];
 private groups:Group[]=[];
 private updates=0;
 private reallocations=0;
 constructor(private scene:THREE.Scene,geos:readonly THREE.BufferGeometry[],private material:THREE.MeshLambertMaterial,
  private depth:THREE.MeshDepthMaterial,private shadows:boolean){
  this.groups=geos.map(g=>{const group:Group={mesh:null as unknown as THREE.InstancedMesh,ids:[],cap:8,geometry:g};group.mesh=this.makeMesh(group,8);return group});
 }
 private makeMesh(g:Group,cap:number){
  const mesh=new THREE.InstancedMesh(g.geometry,this.material,cap);
  mesh.name='nature-instanced-group';
  mesh.customDepthMaterial=this.depth;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(cap*3),3).setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled=false;mesh.castShadow=this.shadows;mesh.receiveShadow=true;
  mesh.count=0;mesh.visible=false;this.scene.add(mesh);this.objects.push(mesh);return mesh;
 }
 private grow(g:Group,needed:number){
  const old=g.mesh;const ix=this.objects.indexOf(old);
  old.removeFromParent();old.dispose();this.objects.splice(ix,1);
  const cap=2**Math.ceil(Math.log2(Math.max(8,needed)));
  g.cap=cap;g.mesh=this.makeMesh(g,cap);this.reallocations++;
 }
 sync(records:readonly RenderRecord[]){
  const buckets:RenderRecord[][]=this.groups.map(()=>[]);
  for(const rec of records)if(rec.active)buckets[rec.geo].push(rec);
  this.groups.forEach((g,i)=>{
   const list=buckets[i],ids=list.map(x=>x.id);
   const changed=ids.length!==g.ids.length||ids.some((id,k)=>id!==g.ids[k])||list.some(r=>r.changed);
   if(list.length>g.cap)this.grow(g,list.length);
   g.mesh.visible=list.length>0;g.mesh.count=list.length;
   if(!changed)return;
   g.ids=ids;
   list.forEach((r,k)=>{g.mesh.setMatrixAt(k,r.matrix);g.mesh.setColorAt(k,r.color)});
   if(list.length){
    g.mesh.instanceMatrix.clearUpdateRanges();g.mesh.instanceMatrix.addUpdateRange(0,list.length*16);g.mesh.instanceMatrix.needsUpdate=true;
    g.mesh.instanceColor!.clearUpdateRanges();g.mesh.instanceColor!.addUpdateRange(0,list.length*3);g.mesh.instanceColor!.needsUpdate=true;
    this.updates+=2;
   }
  });
 }
 setShadowEnabled(value:boolean){this.shadows=value;for(const g of this.groups)g.mesh.castShadow=value}
 getBufferUpdates(){return this.updates}
 getReallocations(){return this.reallocations}
 dispose(){for(const g of this.groups){g.mesh.removeFromParent();g.mesh.dispose();}this.groups=[];this.objects.length=0;}
}

// Backwards-compatible symbol for earlier ASSET-01B2 imports.
export {InstancedNatureRenderer as InstancedBirchRenderer};
