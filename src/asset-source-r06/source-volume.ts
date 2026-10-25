/** R06 original authored fronds only: no procedural shape creation.
 * Each instance uses mesh POSITION, NORMAL, UV and material from Poly Haven glTF exactly.
 * Placement is one explicitly bounded real-scale 0.86m moss colony, not game ecology.
 */
import * as T from 'three';
import {hash,elevation} from '../understory-asset-r04/substrate.ts';
export interface MossAudit {
 originalPrototypes:number;
 originalSourceTriangles:number;
 instancedSourceTriangles:number;
 instanceCount:number;
 physicalWidthM:number;
 algorithm:'source-mesh-instancing';
}
export const SOURCE_PLAN={instancesPerPrototype:48,centerX:-.32,centerZ:-.16,diameterXM:.85,diameterZM:.62} as const;
export function getSourceProtoMeshes(root:T.Object3D):T.Mesh[]{
 const leaves:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh && !(o instanceof T.InstancedMesh))leaves.push(o);});
 if(leaves.length!==12)throw Error('Poly Haven actual 1k glTF is no longer 12 distinct frond source meshes: '+leaves.length);
 return leaves;
}
export function buildMossVolume(root:T.Object3D,alpha:T.Texture){
 const models=getSourceProtoMeshes(root),out=new T.Group();out.name='R06 authored 3D moss patch — original Poly Haven source fronds';
 let originalTriangles=0,totalTriangles=0,instanceCount=0;
 const world=T.MathUtils;
 for(let k=0;k<models.length;k++){
  const source=models[k],g=source.geometry;
  if(!g.getAttribute('uv')||!g.getAttribute('normal'))throw Error('Original glTF frond UV or normals missing '+k);
  const nTriangles=(g.index?.count??g.getAttribute('position').count)/3;
  if(!Number.isInteger(nTriangles)||nTriangles<1||nTriangles>30)throw Error('Source prototype unexpected primitive size '+k);
  originalTriangles+=nTriangles;
  const mat=(source.material as T.MeshStandardMaterial).clone();
  // Preserve the source's original 1K textures and use the separate OFFICIAL source alpha mask
  // because Poly Haven's published glTF stores diffuse as JPEG with no alpha pixels.
  mat.alphaMap=alpha;mat.alphaTest=.43;mat.transparent=false;mat.depthWrite=true;mat.side=T.DoubleSide;
  const mesh=new T.InstancedMesh(g,mat,SOURCE_PLAN.instancesPerPrototype);
  mesh.name='genuine-moss_01-frond-'+k;mesh.frustumCulled=false;
  const dummy=new T.Object3D();
  for(let i=0;i<SOURCE_PLAN.instancesPerPrototype;i++){
   const id=k*SOURCE_PLAN.instancesPerPrototype+i;
   const angle=id*2.399963+hash(id,19)*.20;
   const f=Math.sqrt((id+.45)/(SOURCE_PLAN.instancesPerPrototype*models.length));
   const r=f*(.81+.29*hash(id,7)),x=SOURCE_PLAN.centerX+Math.cos(angle)*SOURCE_PLAN.diameterXM*.5*r;
   const z=SOURCE_PLAN.centerZ+Math.sin(angle)*SOURCE_PLAN.diameterZM*.5*r;
   const heightFactor=.83+.36*hash(id,13);
   dummy.position.set(x,elevation(x,z)+.008,z);
   dummy.rotation.set(0,angle+hash(id,17)*1.4,(hash(id,23)-.5)*.17);
   dummy.scale.set(heightFactor,heightFactor,heightFactor);
   dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;out.add(mesh);
  totalTriangles+=nTriangles*SOURCE_PLAN.instancesPerPrototype;
  instanceCount+=SOURCE_PLAN.instancesPerPrototype;
 }
 if(originalTriangles!==204)throw Error('Original published primitive set changed from audited 204 triangles: '+originalTriangles);
 if(totalTriangles<5000||totalTriangles>15000)throw Error('Instanced moss exceeds original R06 budget: '+totalTriangles);
 const metrics: MossAudit={
  originalPrototypes:models.length,originalSourceTriangles:originalTriangles,
  instancedSourceTriangles:totalTriangles,instanceCount,
  physicalWidthM:SOURCE_PLAN.diameterXM,algorithm:'source-mesh-instancing'
 };
 return {
  group:out,metrics,
  dispose(){for(const o of out.children){if(o instanceof T.InstancedMesh){(o.material as T.Material).dispose();o.dispose();}}out.removeFromParent();}
 };
}
