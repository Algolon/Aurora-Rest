import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {HeightGrid,terrainGeometry} from '../src/geo-r02b/terrain.ts';
const raw=readFileSync(new URL('../public/geo-r02b/terrain.f32',import.meta.url));
const values=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));
const grid=new HeightGrid(values,1501,2001);
test('R1 canonical tiles share identical edge vertices and normals, without skirts',()=>{
 const a=terrainGeometry(grid,-600,800,400,4),b=terrainGeometry(grid,-200,800,400,4);
 assert.equal(a.getAttribute('position').count,101*101);assert.equal(a.index!.count,100*100*6);
 for(let j=0;j<=100;j++)for(const name of ['position','normal']){const aa=a.getAttribute(name),bb=b.getAttribute(name);for(let k=0;k<3;k++)assert.equal(aa.getComponent(j*101+100,k),bb.getComponent(j*101,k));}
 a.dispose();b.dispose();
});
test('R1 immutable source, generated digest and saddle/flank relationships',()=>{
 const master=readFileSync(new URL('../docs/geo-r02b/design-master-A-R1-v1.json',import.meta.url));const data=JSON.parse(readFileSync(new URL('../public/geo-r02b/features.json',import.meta.url),'utf8'));
 assert.equal(createHash('sha256').update(master).digest('hex'),'62cb154b4ab6473ae7e2507449cea5407774503cdc09fe42f09adbde0a0ec598');assert.equal(createHash('sha256').update(raw).digest('hex'),data.meta.terrainSha256);
 assert.ok(values.every(Number.isFinite));assert.ok(Math.abs(grid.surface(40,920)-215)<.5);assert.ok(grid.surface(-60,1190)>grid.surface(40,920));assert.ok(grid.surface(-130,630)>grid.surface(40,920));
});
test('R1 clipped water stays above canonical terrain, exercising shoreline vertices',()=>{
 const r=readFileSync(new URL('../public/geo-r02b/water-mesh.f32',import.meta.url));const v=new Float32Array(r.buffer.slice(r.byteOffset,r.byteOffset+r.byteLength));let shoreline=0;
 for(let i=0;i<v.length;i+=3){const h=grid.surface(v[i],v[i+2]);assert.ok(h<=v[i+1]+.015,`Water intersects terrain at ${v[i]},${v[i+2]}`);if(Math.abs(h-(v[i+1]-.025))<.008)shoreline++;}
 assert.ok(shoreline>1000);
});
