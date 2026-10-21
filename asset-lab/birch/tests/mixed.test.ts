import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createNatureBatch} from '../src/rendering/mixedForest.ts';
import {relativeInstanceColor,createBirchBatch} from '../src/rendering/natureBatch.ts';
import {LEAF_TINT} from '../src/geometry.ts';
function family(hex:string){
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
 geo.setAttribute('normal',new THREE.Float32BufferAttribute([0,0,1,0,0,1,0,0,1],3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,1],2));
 geo.setAttribute('color',new THREE.Float32BufferAttribute([1,1,1,1,1,1,1,1,1],3));
 geo.setIndex([0,1,2]);geo.computeBoundingSphere();
 const mat=new THREE.MeshLambertMaterial({vertexColors:true,color:hex});
 mat.userData.vegetationDepth=new THREE.MeshDepthMaterial();
 return {material:mat,getGeometry:()=>geo,createMesh:()=>new THREE.Mesh(geo,mat),dispose(){geo.dispose();mat.userData.vegetationDepth.dispose();mat.dispose()}};
}
const fallback={getContext:()=>({getExtension:()=>null,getParameter:()=> 'test'})} as unknown as THREE.WebGLRenderer;
test('relative instance tints are linear, independent and identity for original colors',()=>{
 for(const k of ['birch','pine'] as const){
  const orig=new THREE.Color(LEAF_TINT[k]);
  const mul=relativeInstanceColor(orig,orig);
  assert.ok(Math.abs(mul.r-1)<1e-7&&Math.abs(mul.g-1)<1e-7&&Math.abs(mul.b-1)<1e-7);
 }
 const pine=new THREE.Color(LEAF_TINT.pine),birch=new THREE.Color(LEAF_TINT.birch);
 const tint=relativeInstanceColor(new THREE.Color('#60805b'),pine);
 assert.notDeepEqual(tint.toArray(),relativeInstanceColor(new THREE.Color('#60805b'),birch).toArray());
});
test('mixed controller provides stable global IDs, isolated materials and 18 fallback geometry groups',()=>{
 const scene=new THREE.Scene(),birch=family(LEAF_TINT.birch),pine=family(LEAF_TINT.pine);
 const forest=createNatureBatch({scene,renderer:fallback,families:{birch,pine},mode:'auto',culling:false,forcedLod:'near'});
 assert.equal(forest.mode,'instanced');assert.equal(forest.objects.length,18);
 const a=forest.add({species:'birch',variant:0,position:[1,0,3]});
 const b=forest.add({species:'pine',variant:1,position:[2,0,4]});
 const c=forest.add({species:'birch',variant:2,position:[3,0,5]});
 assert.deepEqual([a,b,c],[0,1,2]);assert.equal(forest.getSpecies(b),'pine');
 forest.setTint(b,'#64804d');forest.setTransform(c,{position:[4,0,5],scale:1.1});
 forest.setVariant(a,1);forest.setVisible(b,false);
 const camera=new THREE.PerspectiveCamera(60,1,.1,100);camera.position.set(0,5,10);camera.lookAt(0,3,0);
 const st=forest.update(camera);
 assert.equal(st.registered,3);assert.equal(st.species.birch.registered,2);assert.equal(st.species.pine.registered,1);
 assert.equal(st.cameraVisible,2);assert.equal(st.excluded,1);
 assert.equal(st.species.birch.renderGroups,2);assert.equal(st.species.pine.renderGroups,0);
 assert.equal(forest.getObjects('birch')[0].material,birch.material);
 assert.equal(forest.getObjects('pine')[0].material,pine.material);
 assert.ok(forest.objects.every(x=>x.customDepthMaterial===(x.material as THREE.Material).userData.vegetationDepth));
 const updates=forest.getStats().bufferUpdates;
 const again=forest.update(camera);assert.equal(again.bufferUpdates,updates);
 camera.lookAt(12,3,0);forest.update(camera);
 forest.dispose();forest.dispose();assert.equal(scene.children.length,0);
 assert.ok(birch.material.map===null&&pine.material.map===null);
 assert.throws(()=>forest.add({species:'pine',variant:0,position:[0,0,0]}),/disposed/);
 birch.dispose();pine.dispose();
});
test('source-compatible createBirchBatch wrapper still uses original birch tint and forced fallback',()=>{
 const scene=new THREE.Scene(),b=family(LEAF_TINT.birch);
 const forest=createBirchBatch({scene,renderer:fallback,family:b,mode:'instanced',culling:false,forcedLod:'near'});
 forest.add({variant:0,position:[0,0,0]});
 const c=new THREE.PerspectiveCamera(60,1,.1,100);c.position.set(0,5,15);c.lookAt(0,4,0);
 forest.update(c);
 const mesh=forest.objects.find(o=>o.visible) as THREE.InstancedMesh;
 assert.ok(mesh?.isInstancedMesh);assert.equal(mesh.count,1);
 const tint=new THREE.Color();mesh.getColorAt(0,tint);
 assert.ok(Math.abs(tint.r-1)<1e-7&&Math.abs(tint.g-1)<1e-7&&Math.abs(tint.b-1)<1e-7);
 forest.dispose();b.dispose();
});
test('forcing unavailable multi-draw fails explicitly and preserves clean scene',()=>{
 const scene=new THREE.Scene(),birch=family(LEAF_TINT.birch),pine=family(LEAF_TINT.pine);
 assert.throws(()=>createNatureBatch({scene,renderer:fallback,families:{birch,pine},mode:'multidraw'}),/WEBGL_multi_draw unavailable/);
 assert.equal(scene.children.length,0);birch.dispose();pine.dispose();
});
