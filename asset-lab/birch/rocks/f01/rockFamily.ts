/** F01 staging pack. Real Blender GLBs, one shared unchanged A2 T1 material.
 * Does not depend on island terrain/population code. Family owns imported geometry.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {createRockLookdevFactory} from '../../src/rocks/experimental/a2/rockTextureLookdev.ts';
export const ROCK_ARCHETYPES=['compact','broadGlacial','sculptural'] as const;
export type RockArchetype=typeof ROCK_ARCHETYPES[number];
export const ROCK_ASSETS={
 compact:{id:'compact',label:'R1 · Compact Nordic',url:new URL('../../art/blender/s1r-sculptural-polish/aurora-rock-s1r.glb',import.meta.url).href,dimensions:[2.157078,1.657239,1.565776] as const,source:'S1R unchanged'},
 broadGlacial:{id:'broadGlacial',label:'R2 · Broad Glacial',url:new URL('../../art/blender/f01-nordic-rocks/broad-glacial/aurora-broad-glacial.glb',import.meta.url).href,dimensions:[5.13,1.94,2.56] as const,source:'F01 independently authored Blender cage'},
 sculptural:{id:'sculptural',label:'R3 · Sculptural',url:new URL('../../art/blender/f01-nordic-rocks/sculptural/aurora-sculptural.glb',import.meta.url).href,dimensions:[3.5,2.856625,3.32] as const,source:'F01 independently authored Blender cage'}
} satisfies Record<RockArchetype,{id:string;label:string;url:string;dimensions:readonly [number,number,number];source:string}>;
export interface RockTransform {position:readonly [number,number,number];rotationY?:number;scale?:number|readonly [number,number,number]}
export interface NordicRockFamily {
 readonly material:THREE.MeshStandardMaterial;
 readonly assets:typeof ROCK_ASSETS;
 getGeometry(id:RockArchetype):THREE.BufferGeometry;
 getDimensions(id:RockArchetype):THREE.Vector3;
 createMesh(id:RockArchetype,transform?:RockTransform):THREE.Mesh;
 createInstances(id:RockArchetype,transforms:readonly RockTransform[]):THREE.InstancedMesh;
 stats():{uniqueGeometryBytes:number;uniqueTriangles:Record<RockArchetype,number>;materialOwned:boolean;managedObjects:number;disposed:boolean};
 dispose():void;
}
export type GeometryLoader=(url:string)=>Promise<THREE.BufferGeometry>;
export async function loadGlbRockGeometry(url:string):Promise<THREE.BufferGeometry>{
 const gltf=await new GLTFLoader().loadAsync(url);gltf.scene.updateMatrixWorld(true);
 const meshes:THREE.Mesh[]=[];gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh)meshes.push(o)});
 if(meshes.length!==1)throw Error('Nordic rock GLB must contain exactly one mesh: '+url);
 const mesh=meshes[0],geometry=mesh.geometry as THREE.BufferGeometry;
 geometry.applyMatrix4(mesh.matrixWorld);geometry.computeBoundingBox();geometry.computeBoundingSphere();
 for(const material of new Set(Array.isArray(mesh.material)?mesh.material:[mesh.material]))material.dispose();
 return geometry;
}
function validateGeometry(g:THREE.BufferGeometry,id:RockArchetype){
 for(const name of ['position','normal','uv','color']){
  const a=g.getAttribute(name);if(!a||!Array.from(a.array).every(Number.isFinite))throw Error('Invalid GLB '+id+' / '+name);
 }
 g.computeBoundingBox();g.computeBoundingSphere();const dims=g.boundingBox!.getSize(new THREE.Vector3());
 if(Math.abs(g.boundingBox!.min.y)>.001||dims.toArray().some((x,i)=>Math.abs(x-ROCK_ASSETS[id].dimensions[i])>.035))throw Error('Unexpected metric scale/pivot for '+id+': '+dims.toArray());
}
/** Caller-supplied material is borrowed; otherwise this family owns one A2 factory.
 * A2's existing factory also creates unused study maps once; no per-placement maps.
 */
export async function loadNordicRockFamily(options:{material?:THREE.MeshStandardMaterial;geometryLoader?:GeometryLoader}={}):Promise<NordicRockFamily>{
 const results=await Promise.allSettled(ROCK_ARCHETYPES.map(id=>(options.geometryLoader??loadGlbRockGeometry)(ROCK_ASSETS[id].url)));
 if(results.some(r=>r.status==='rejected')){for(const r of results)if(r.status==='fulfilled')r.value.dispose();throw Error('Unable to load complete Nordic rock pack: '+results.filter(r=>r.status==='rejected').map(r=>String(r.reason)).join('; '));}
 const geometries={} as Record<RockArchetype,THREE.BufferGeometry>;
 try{for(const [i,id] of ROCK_ARCHETYPES.entries()){const g=(results[i] as PromiseFulfilledResult<THREE.BufferGeometry>).value;geometries[id]=g;validateGeometry(g,id);}}
 catch(e){for(const r of results)if(r.status==='fulfilled')r.value.dispose();throw e;}
 const lookdev=options.material?undefined:createRockLookdevFactory();
 const material=options.material??lookdev!.materials.T1.triplanar;
 // Local integration adapter only: preserve A2 map/palette/weights; rotate micro-normal
 // axes with the instance transform, matching ordinary rotated meshes.
 if(lookdev){
  const original=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey.bind(material);
  material.onBeforeCompile=(shader,renderer)=>{
   original(shader,renderer);
   for(const axis of ['X','Y','Z']){
    const vector=axis==='X'?'1.0,0.0,0.0':axis==='Y'?'0.0,1.0,0.0':'0.0,0.0,1.0';
    const old=`vA2Axis${axis}=normalize(normalMatrix*vec3(${vector}));`;
    if(!shader.vertexShader.includes(old))throw Error('A2 instance-axis adapter source mismatch');
    shader.vertexShader=shader.vertexShader.replace(old,`\n#ifdef USE_INSTANCING\nvA2Axis${axis}=normalize(normalMatrix*mat3(instanceMatrix)*vec3(${vector}));\n#else\n${old}\n#endif\n`);
   }
  };
  material.customProgramCacheKey=()=>key()+'-f01-instance-basis-v1';
 }
 const managed=new Set<THREE.Mesh>();let disposed=false;
 const check=()=>{if(disposed)throw Error('Nordic rock family disposed');};
 const getGeometry=(id:RockArchetype)=>{check();const g=geometries[id];if(!g)throw RangeError('Unknown Nordic rock archetype '+id);return g;};
 const matrix=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();
 const transformMatrix=(t:RockTransform)=>{
  if(t.position.length!==3||!t.position.every(Number.isFinite)||!Number.isFinite(t.rotationY??0))throw RangeError('Invalid rock transform');
  const s=typeof t.scale==='number'?[t.scale,t.scale,t.scale]:t.scale??[1,1,1];
  if(s.length!==3||!s.every(x=>Number.isFinite(x)&&x>0))throw RangeError('Invalid rock scale');
  p.fromArray(t.position);q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,t.rotationY??0);scale.fromArray(s);return matrix.compose(p,q,scale);
 };
 return {material,assets:ROCK_ASSETS,getGeometry,getDimensions(id){return getGeometry(id).boundingBox!.getSize(new THREE.Vector3());},
 createMesh(id,t={position:[0,0,0]}){const mesh=new THREE.Mesh(getGeometry(id),material);transformMatrix(t).decompose(mesh.position,mesh.quaternion,mesh.scale);mesh.name='nordic-rock.'+id;mesh.castShadow=mesh.receiveShadow=true;mesh.userData.archetype=id;managed.add(mesh);return mesh;},
 createInstances(id,transforms){if(!transforms.length)throw RangeError('Rock batch must contain placements');const mesh=new THREE.InstancedMesh(getGeometry(id),material,transforms.length);try{transforms.forEach((t,i)=>mesh.setMatrixAt(i,transformMatrix(t)));}catch(e){mesh.dispose();throw e;}mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.name='nordic-rock.instances.'+id;mesh.castShadow=mesh.receiveShadow=true;mesh.userData.archetype=id;managed.add(mesh);return mesh;},
 stats(){return {uniqueGeometryBytes:Object.values(geometries).reduce((sum,g)=>sum+Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.index?.array.byteLength??0),0),uniqueTriangles:Object.fromEntries(ROCK_ARCHETYPES.map(id=>[id,(geometries[id].index?.count??geometries[id].getAttribute('position').count)/3])) as Record<RockArchetype,number>,materialOwned:!!lookdev,managedObjects:managed.size,disposed};},
 dispose(){if(disposed)return;disposed=true;for(const m of managed){m.removeFromParent();if(m instanceof THREE.InstancedMesh)m.dispose();}managed.clear();for(const g of Object.values(geometries))g.dispose();lookdev?.dispose();}
 };
}
