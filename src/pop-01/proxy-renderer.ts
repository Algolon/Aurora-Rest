import * as T from 'three';
import type {ChunkPopulation,Family,Placement,PopulationRenderer} from './contracts.ts';
const families:Family[]=['birch','pine','grass','rock'];
/** Diagnostic glyphs only. These geometries are NOT approved nature assets. */
export class DiagnosticRenderer implements PopulationRenderer {
 readonly chunks=new Map<string,{population:ChunkPopulation;meshes:Map<Family,T.InstancedMesh>}>();
 readonly enabled=new Set<Family>(families);
 private geometries=new Map<Family,T.BufferGeometry>();private materials=new Map<Family,T.MeshLambertMaterial>();
 private disposed=false;
 visible=0;submitted=0;
 readonly scene:T.Scene;constructor(scene:T.Scene){this.scene=scene;
  const tree=new T.ConeGeometry(2.2,9,5);tree.translate(0,4.5,0);
  const birch=new T.IcosahedronGeometry(2.8,0);birch.scale(.85,1.6,.85);birch.translate(0,5,0);
  const grass=new T.ConeGeometry(.4,.65,3);grass.translate(0,.325,0);
  this.geometries.set('birch',birch);this.geometries.set('pine',tree);this.geometries.set('grass',grass);this.geometries.set('rock',new T.IcosahedronGeometry(1.3,0));
  const colors={birch:0x75a578,pine:0x3c796a,grass:0x9eb273,rock:0x8f99a0};
  for(const f of families)this.materials.set(f,new T.MeshLambertMaterial({color:colors[f],flatShading:true}));
 }
 attach(population:ChunkPopulation){
  if(this.disposed)throw Error('Renderer disposed');if(this.chunks.has(population.key))throw Error('Duplicate chunk');
  const meshes=new Map<Family,T.InstancedMesh>();
  try{for(const f of families){const count=population.instances.filter(p=>p.family===f).length;if(!count)continue;const mesh=new T.InstancedMesh(this.geometries.get(f)!,this.materials.get(f)!,count);mesh.name='DIAGNOSTIC-PROXY:'+f;mesh.userData.chunk=population.key;mesh.userData.family=f;mesh.frustumCulled=false;meshes.set(f,mesh);this.scene.add(mesh);}this.chunks.set(population.key,{population,meshes});}
  catch(e){for(const m of meshes.values()){m.removeFromParent();m.dispose();}throw e;}
 }
 detach(key:string){const c=this.chunks.get(key);if(!c)return;for(const m of c.meshes.values()){m.removeFromParent();m.dispose();}this.chunks.delete(key);}
 update(camera:T.Camera,coverDistance=90){
  this.visible=0;this.submitted=0;camera.updateMatrixWorld();const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)),eye=new T.Vector3().setFromMatrixPosition(camera.matrixWorld),p=new T.Vector3(),s=new T.Vector3(),q=new T.Quaternion(),yaw=new T.Quaternion(),up=new T.Vector3(0,1,0),normal=new T.Vector3(),matrix=new T.Matrix4(),color=new T.Color();
  for(const c of this.chunks.values()){
   const counts:Record<Family,number>={birch:0,pine:0,grass:0,rock:0};const ids:Record<Family,string[]>={birch:[],pine:[],grass:[],rock:[]};
   for(const it of c.population.instances){if(!this.enabled.has(it.family))continue;
    p.set(it.x,it.y-it.burial,it.z);const distance=eye.distanceTo(p);if(it.family==='grass'&&distance>coverDistance)continue;
    const radius=it.family==='birch'||it.family==='pine'?10*it.scale:2.5*it.scale;
    if(!frustum.intersectsSphere(new T.Sphere(p,radius)))continue;
    yaw.setFromAxisAngle(up,it.rotation);q.identity();if(it.alignment==='terrain')q.setFromUnitVectors(up,normal.set(...it.normal));q.multiply(yaw);s.setScalar(it.scale);
    // Distinct proxy sizes make variant assignment visible, without impersonating source geometry.
    s.x*=.88+it.variant*.08;s.z*=1.05-it.variant*.035;
    matrix.compose(p,q,s);const mesh=c.meshes.get(it.family)!,i=counts[it.family]++;mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,color.setScalar(it.tint));ids[it.family].push(it.id);this.visible++;
   }
   for(const [f,m] of c.meshes){m.count=counts[f];m.visible=m.count>0;m.userData.ids=ids[f];m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;this.submitted+=m.count;}
  }
 }
 find(id:string):Placement|undefined {for(const c of this.chunks.values()){const p=c.population.instances.find(p=>p.id===id);if(p)return p;}}
 objects(){return [...this.chunks.values()].flatMap(c=>[...c.meshes.values()]);}
 dispose(){if(this.disposed)return;for(const k of this.chunks.keys())this.detach(k);for(const g of this.geometries.values())g.dispose();for(const m of this.materials.values())m.dispose();this.disposed=true;}
}
