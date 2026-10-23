import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
import{HeightGrid,terrainGeometry}from'../src/geo-r02b/terrain.ts';
import{tileGeometry}from'../src/terrain-material/render/terrain-tiles.ts';
import{TerrainMaterialResources}from'../src/terrain-material/render/terrain-material.ts';
import{MATERIALS}from'../src/terrain-material/materials.ts';import{synthesizeMaterial}from'../src/terrain-material/textures.ts';
import{TerrainMaterialQuery}from'../src/terrain-material/query.ts';
const pop='4d562187c10e64884e2193a0b09ced6eed3b4b08',sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
test('ENV preserves all POP source, nature assets and canonical geography byte for byte',()=>{
 const paths=execFileSync('git',['ls-tree','-r','--name-only',pop,'src/pop-01','src/pop-02a','src/nature-library','src/geo-r02b','public/geo-r02b']).toString().trim().split('\n');
 for(const p of paths)assert.equal(sha(readFileSync(p)),sha(execFileSync('git',['show',pop+':'+p],{maxBuffer:30e6})),p);
});
test('controlled MAT imports retain original file hashes',()=>{const m=JSON.parse(readFileSync('docs/env-p01/provenance.json','utf8'));for(const f of m.files)assert.equal(sha(readFileSync(f.path)),f.sha256,f.path);});
test('POP mesh and MAT adapter agree on geographic positions and canonical normals',()=>{
 const b=readFileSync('public/geo-r02b/terrain.f32'),heights=new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
 const grid=new HeightGrid(heights,1501,2001),lattice={width:1501,height:2001,cellM:4,west:-3000,north:4000};
 const a=terrainGeometry(grid,-800,400,128,4),bmesh=tileGeometry({lattice,heights},-800,400,128,4,0);
 assert.deepEqual(a.attributes.position.array,bmesh.attributes.position.array);assert.deepEqual(a.attributes.normal.array,bmesh.attributes.normal.array);a.dispose();bmesh.dispose();
});
test('MAT resources support balanced ownership and repeated release/recreate',()=>{
 const c:any={schema:'aurora-rest-terrain-material/1',lattice:{width:2,height:2,cellM:4,west:0,north:4},weights:new Uint8Array([255,0,0,0,0,255,0,0,0,0,255,0,0,0,0,255]),attributes:new Uint8Array(16),materials:MATERIALS.map(m=>m.id),rulesVersion:'test',sourceId:'test'};
 const query=new TerrainMaterialQuery(c);assert.equal(query.sample(0,4).dominant,'forest-floor');assert.equal(query.sample(4,0).dominant,'bedrock');
 const textures=MATERIALS.map(d=>synthesizeMaterial(d,32));
 for(const profile of ['high','balanced','mobile'] as const){const r=new TerrainMaterialResources(c,textures,profile).acquire();assert.equal(r.ownerCount,1);r.release();assert.equal(r.disposed,true);assert.throws(()=>r.acquire());assert.throws(()=>r.release());}
});
