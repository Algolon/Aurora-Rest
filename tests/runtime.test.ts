import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {terrainGeometry} from '../src/render/terrain.ts';
import {surfaceHeightAt,walkHeightAt,waterLevelAt,walkStep,bridgeHeightAt} from '../src/world/surface.ts';
import {WORLD,LAKES,WATERCOURSES,BRIDGE} from '../src/world/config.ts';
import {heightAt,coastField,regionAt} from '../src/world/geography.ts';
import {ROUTES} from '../src/world/routes.ts';
import {ISLETS,COASTLINE} from '../src/world/layout.ts';

test('walking height matches real Three.js terrain triangles, including tile edges and diagonals',()=>{
 const ray=new THREE.Raycaster(),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
 for(const segments of [WORLD.tileNearSegments,WORLD.tileFarSegments])for(const [x0,z0] of [[500,2000],[0,500],[-2500,0]]){
  const geometry=terrainGeometry(x0,z0,500,segments),mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld();
  for(const [u,v] of [[.013,.046],[.117,.65],[.31,.27],[.59,.93],[.99,.001],[1,.5],[0,.77]]){
   const x=x0+u*500,z=z0+v*500;ray.set(new THREE.Vector3(x,2000,z),new THREE.Vector3(0,-1,0));
   const hit=ray.intersectObject(mesh)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-surfaceHeightAt(x,z,segments))<.001,`${segments}: ${x},${z}`);
  }
  geometry.dispose();
 }
 material.dispose();
});

test('all route segments are dry and remain under 36% grade on rendered ground at 1 m samples',()=>{
 for(const [name,points] of Object.entries(ROUTES))for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],distance=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(distance),step=distance/steps;
  let previous=walkHeightAt(...a);
  for(let j=1;j<=steps;j++){
   const x=a[0]+(b[0]-a[0])*j/steps,z=a[1]+(b[1]-a[1])*j/steps,y=walkHeightAt(x,z);
   assert.ok(y>waterLevelAt(x,z)+.25,`${name}: submerged ${x},${z}`);
   assert.ok(Math.abs(y-previous)/step<.36,`${name}: grade ${Math.abs(y-previous)/step} at ${x},${z}`);previous=y;
  }
 }
});

test('the actual walking collision function traverses every authored route',()=>{
 for(const [name,points] of Object.entries(ROUTES))for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3);
  let p={x:a[0],z:a[1],y:walkHeightAt(...a)};
  for(let j=0;j<steps;j++)p=walkStep(p.x,p.z,(b[0]-a[0])/steps,(b[1]-a[1])/steps);
  assert.ok(Math.hypot(p.x-b[0],p.z-b[1])<.01,`${name} stops before ${b}`);
 }
});

test('lake entry, cliff descent and cabin entry are blocked, while the bridge is walkable',()=>{
 const lake=LAKES[0];const p=walkStep(lake.x-lake.rx-30,lake.z,600,0);
 assert.ok(p.x<lake.x-100,'stops on the visible dry shore before entering open water');assert.ok(p.y>waterLevelAt(p.x,p.z));
 const cabin=WORLD.viewpoints[0],c=walkStep(cabin.x,cabin.z+20,0,-30);
 assert.ok(c.z>cabin.z+5);
 const bridge=walkStep(BRIDGE.x0,BRIDGE.z,BRIDGE.x1-BRIDGE.x0,0);
 assert.ok(Math.abs(bridge.x-BRIDGE.x1)<.01);assert.ok(bridgeHeightAt(900,BRIDGE.z)>waterLevelAt(900,BRIDGE.z)+1);
 let found=false;
 for(let z=1800;z<3000&&!found;z+=20)for(let x=-1500;x<-200&&!found;x+=20){
  if(walkHeightAt(x,z)-walkHeightAt(x+1,z)>1){const stop=walkStep(x,z,1,0);assert.equal(stop.x,x);found=true;}
 }
 assert.ok(found,'test includes an actual steep descent');
});

test('reference region relationships and named spawn surfaces remain coherent',()=>{
 const named=Object.fromEntries(WORLD.viewpoints.map(p=>[p.name,p]));
 assert.ok(named['Birchwood Forest'].x<0&&named['Hidden Fold'].x>0);
 assert.ok(named['Dune Fields'].x>1800&&named['Dune Fields'].z>named['Home Cove'].z);
 assert.ok(WORLD.water.tarn.x>700&&WORLD.water.tarn.z>1700);
 assert.ok(named['South Shoulder'].x<0&&named['South Shoulder'].z<-2000);
 for(const p of WORLD.viewpoints){assert.equal(regionAt(p.x,p.z+18),p.name);assert.ok(walkHeightAt(p.x,p.z+18)>waterLevelAt(p.x,p.z+18)+.25,p.name);}
});

test('authored coastline has finite inlets and detached offshore land',()=>{
 for(const [x,z] of COASTLINE)assert.ok(Math.abs(coastField(x,z))<.02);
 for(const island of ISLETS){assert.ok(heightAt(island.x,island.z)>20);assert.ok(coastField(island.x,island.z)>0);}
 assert.ok(heightAt(1250,-3100)<0,'Home Cove is a real inlet');
 assert.ok(heightAt(1810,-3000)>0,'cabin headland remains land');
});

test('all catchments descend, with their channel beds below water at interior controls',()=>{
 for(const points of WATERCOURSES){
  for(let i=1;i<points.length;i++)assert.ok(points[i].level<points[i-1].level);
  for(const p of points.slice(1,-1))assert.ok(heightAt(p.x,p.z)<p.level-.1,`${p.x},${p.z}`);
 }
 const tributary=WATERCOURSES[1].at(-1)!;
 assert.ok(WORLD.water.river.some(p=>p.x===tributary.x&&p.z===tributary.z&&p.level===tributary.level));
});
