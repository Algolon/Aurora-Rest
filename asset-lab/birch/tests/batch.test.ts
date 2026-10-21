import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {resolveBatchMode} from '../src/rendering/capabilities.ts';
import {classifyVisibility,cameraFrustum} from '../src/rendering/visibility.ts';
import {selectTreeLod} from '../src/lod.ts';
test('extension-based multi-draw selection is explicit and fallback is forced',()=>{
 const cap={webgl2:true,multiDraw:false,renderer:'test',glVersion:'WebGL2'};
 assert.equal(resolveBatchMode('auto',cap),'instanced');
 assert.equal(resolveBatchMode('instanced',cap),'instanced');
 assert.throws(()=>resolveBatchMode('multidraw',cap),/WEBGL_multi_draw unavailable/);
 assert.equal(resolveBatchMode('multidraw',{...cap,multiDraw:true}),'multidraw');
});
test('LOD hysteresis transitions all four levels in both directions',()=>{
 let level=0;
 for(const [d,expect] of [[22,0],[24.99,0],[25,1],[36,1],[39,2],[62,2],[65,3],[60,3],[58.99,2],[33,2],[32.99,1],[19,1],[18.99,0]] as const){
  level=selectTreeLod(d,level);assert.equal(level,expect,`distance ${d}`);
 }
});
test('camera rotation changes frustum, shadow-swept casters remain eligible',()=>{
 const cam=new THREE.PerspectiveCamera(60,1,.1,150);
 cam.position.set(0,5,0);cam.lookAt(0,5,-10);
 const front=cameraFrustum(cam);
 assert.equal(classifyVisibility(front,new THREE.Vector3(0,4,-20),3,20,100,null),'camera');
 assert.equal(classifyVisibility(front,new THREE.Vector3(0,4,20),3,20,100,null),'excluded');
 cam.lookAt(0,5,10);
 const back=cameraFrustum(cam);
 assert.equal(classifyVisibility(back,new THREE.Vector3(0,4,20),3,20,100,null),'camera');
 const f=cameraFrustum(cam);
 assert.equal(classifyVisibility(f,new THREE.Vector3(0,4,-20),3,20,100,new THREE.Vector3(0,0,1)),'shadow');
 assert.equal(classifyVisibility(f,new THREE.Vector3(0,4,20),3,200,100,null),'excluded');
});
