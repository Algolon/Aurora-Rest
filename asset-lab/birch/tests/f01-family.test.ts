import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {ROCK_ASSETS,ROCK_ARCHETYPES,loadNordicRockFamily} from '../rocks/f01/rockFamily.ts';
import {createPilotLayout,trailX,ZONES} from '../rocks/f01/pilotLayout.ts';
async function readGeometry(url:string){
 const b=readFileSync(new URL(url));const gltf=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const meshes:THREE.Mesh[]=[];gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh)meshes.push(o)});assert.equal(meshes.length,1);
 const mesh=meshes[0];for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m.dispose();return mesh.geometry;
}
for(const id of ROCK_ARCHETYPES)test('F01 real GLB '+id+' is finite metric, consistently wound and closed',async()=>{
 const g=await readGeometry(ROCK_ASSETS[id].url),p=g.getAttribute('position'),n=g.getAttribute('normal'),ix=g.index!;
 for(const a of ['position','normal','uv','color'])assert.ok(Array.from(g.getAttribute(a).array).every(Number.isFinite));
 g.computeBoundingBox();const dims=g.boundingBox!.getSize(new THREE.Vector3()).toArray();dims.forEach((d,i)=>assert.ok(Math.abs(d-ROCK_ASSETS[id].dimensions[i])<.001));assert.equal(g.boundingBox!.min.y,0);
 const vertices=new Map<string,number>(),weld:number[]=[];
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e6)).join(',');if(!vertices.has(key))vertices.set(key,vertices.size);weld.push(vertices.get(key)!);}
 const edges=new Map<string,number[]>(),adj=new Map<number,Set<number>>();let volume=0;
 for(let i=0;i<ix.count;i+=3){const ids=[ix.getX(i),ix.getX(i+1),ix.getX(i+2)],v=ids.map(j=>new THREE.Vector3().fromBufferAttribute(p,j));const norm=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0]));assert.ok(norm.length()>1e-8);volume+=v[0].dot(v[1].clone().cross(v[2]))/6;norm.normalize();
  for(const j of ids)assert.ok(norm.dot(new THREE.Vector3().fromBufferAttribute(n,j))>.99999);
  const t=ids.map(j=>weld[j]);for(let k=0;k<3;k++){const a=t[k],b=t[(k+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(',');edges.set(key,[...(edges.get(key)??[]),a<b?1:-1]);if(!adj.has(a))adj.set(a,new Set());if(!adj.has(b))adj.set(b,new Set());adj.get(a)!.add(b);adj.get(b)!.add(a);}
 }
 for(const signs of edges.values()){assert.equal(signs.length,2);assert.equal(signs[0]+signs[1],0);}const unseen=new Set(vertices.values()),stack=[unseen.values().next().value!];while(stack.length){const a=stack.pop()!;if(!unseen.delete(a))continue;stack.push(...adj.get(a)!);}assert.equal(unseen.size,0);assert.equal(vertices.size-edges.size+ix.count/3,2);assert.ok(volume>0);
 if(id!=='compact'){const path=id==='broadGlacial'?'broad-glacial':'sculptural',m=JSON.parse(readFileSync(new URL('../art/blender/f01-nordic-rocks/'+path+'/geometry-metrics.json',import.meta.url),'utf8'));assert.equal(m.runtime.triangles,ix.count/3);assert.deepEqual(m.runtime.nonadjacent_overlap_candidates,[]);assert.ok(m.correction_passes<=1);}
 console.log('F01 exported QA',id,{triangles:ix.count/3,attributeVertices:p.count,welded:vertices.size,volume});g.dispose();
});
test('R1 protected S1R source and export are byte-identical',()=>{
 for(const [name,hash] of Object.entries({'aurora-rock-s1r.glb':'7c4096eeeba75460e3af17fc9ccfac70f5c9ac30c17e7670d598e7c58ede7635','aurora-rock-s1r.blend':'2aca669a6302402fdc3b4346350d6f78100bccb43a1c8e350dc2536b8ecaefd4'}))assert.equal(createHash('sha256').update(readFileSync(new URL('../art/blender/s1r-sculptural-polish/'+name,import.meta.url))).digest('hex'),hash);
});
test('Family shares geometry/material, applies placement and releases owned resources once',async()=>{
 const material=new THREE.MeshStandardMaterial(),seen:THREE.BufferGeometry[]=[];let disposed=0,materialDisposed=0;material.addEventListener('dispose',()=>materialDisposed++);
 const family=await loadNordicRockFamily({material,geometryLoader:async u=>{const g=await readGeometry(u);seen.push(g);g.addEventListener('dispose',()=>disposed++);return g;}});
 const group=new THREE.Group(),a=family.createMesh('compact',{position:[2,-.1,4],rotationY:.7,scale:.9}),b=family.createMesh('compact');assert.equal(a.geometry,b.geometry);assert.equal(a.material,material);assert.deepEqual(a.position.toArray(),[2,-.1,4]);
 const t={position:[3,-.2,5] as const,rotationY:1.2,scale:[.9,1,1.02] as const},batch=family.createInstances('broadGlacial',[t]);const matrix=new THREE.Matrix4();batch.getMatrixAt(0,matrix);const expected=new THREE.Matrix4().compose(new THREE.Vector3(...t.position),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),1.2),new THREE.Vector3(...t.scale));matrix.elements.forEach((v,i)=>assert.ok(Math.abs(v-expected.elements[i])<1e-6));
 group.add(a,b,batch);family.dispose();family.dispose();assert.equal(group.children.length,0);assert.equal(disposed,3);assert.equal(materialDisposed,0);assert.throws(()=>family.createMesh('compact'),/disposed/);material.dispose();
});
test('Failed family load or invalid dimensions release every successfully loaded geometry',async()=>{
 for(const invalid of [false,true]){let disposed=0;await assert.rejects(loadNordicRockFamily({material:new THREE.MeshStandardMaterial(),geometryLoader:async u=>{if(!invalid&&u===ROCK_ASSETS.sculptural.url)throw Error('fixture network failure');const g=await readGeometry(u);g.addEventListener('dispose',()=>disposed++);if(invalid&&u===ROCK_ASSETS.sculptural.url)g.scale(2,2,2);return g;}}));assert.equal(disposed,invalid?3:2);}
});
test('Pilot has reproducible varied placement, sparse landmarks and clear trails',()=>{
 const a=createPilotLayout(10101),b=createPilotLayout(10101),c=createPilotLayout(10102);assert.deepEqual(a,b);assert.notDeepEqual(a,c);assert.equal(a.length,34);
 assert.equal(a.filter(p=>p.archetype==='compact').length,24);assert.equal(a.filter(p=>p.archetype==='broadGlacial').length,5);assert.equal(a.filter(p=>p.archetype==='sculptural').length,5);assert.ok(new Set(a.map(p=>p.rotationY)).size>25);
 for(const p of a){assert.ok(Math.abs(p.position[0]-trailX(p.zone,p.position[2]))>p.radius+1.35);assert.ok(p.position.every(Number.isFinite));for(const q of a)if(p!==q)assert.ok(Math.hypot(p.position[0]-q.position[0],p.position[2]-q.position[2])>=p.radius+q.radius+.24);}
});
