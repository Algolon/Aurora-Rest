import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {HeightGrid,terrainGeometry} from '../src/geo-r02b/terrain.ts';
test('GEO-R02B sampling matches actual mesh triangles at all LODs and boundaries',()=>{
 const width=1501,height=2001,values=new Float32Array(width*height);for(let j=0;j<height;j++)for(let i=0;i<width;i++)values[j*width+i]=Math.sin(i*.02)*45+Math.cos(j*.01)*16+i*.03;
 const grid=new HeightGrid(values,width,height);const ray=new THREE.Raycaster(),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
 for(const step of [4,8,16]){const geometry=terrainGeometry(grid,-600,800,400,step),mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld();for(const [u,v] of [[.001,.1],[.23,.86],[.7,.2],[.999,.5],[1,1],[0,0]]){const x=-600+u*400,z=800-v*400;ray.set(new THREE.Vector3(x,2000,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObject(mesh)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-grid.surface(x,z,step))<.001);}geometry.dispose();}material.dispose();
});
test('GEO-R02B world boundary sampling is finite and north-up grid maps correctly',()=>{const values=new Float32Array(1501*2001);values[0]=7;values[1500]=11;values[2000*1501]=19;const grid=new HeightGrid(values,1501,2001);assert.equal(grid.node(-3000,4000),7);assert.equal(grid.node(3000,4000),11);assert.equal(grid.node(-3000,-4000),19);for(const x of [-3000,0,3000])for(const z of [-4000,0,4000])assert.ok(Number.isFinite(grid.surface(x,z)));});
