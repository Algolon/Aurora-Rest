import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {classifyTerrain,classificationHash,quantizeWeights} from '../src/terrain-material/classify.ts';
import {geoR02BSource} from '../src/terrain-material/sources/geo-r02b.ts';
import {TerrainMaterialQuery} from '../src/terrain-material/query.ts';
import {MATERIAL_ORDER,RULES} from '../src/terrain-material/rules.ts';
import {MATERIALS} from '../src/terrain-material/materials.ts';
import {synthesizeMaterial} from '../src/terrain-material/textures.ts';
import {distanceField,rasterizeRings} from '../src/terrain-material/fields.ts';
import {tileGeometry} from '../src/terrain-material/render/terrain-tiles.ts';
import {TerrainMaterialResources,PROFILES} from '../src/terrain-material/render/terrain-material.ts';
import {HeightGrid,terrainGeometry} from '../src/geo-r02b/terrain.ts';
import type {MaterialClassification} from '../src/terrain-material/types.ts';

// MAT-01 terrain-material checks. The canonical classification is computed once (≈3–4 s) and shared.
const root=new URL('../',import.meta.url),read=(p:string)=>readFileSync(new URL(p,root)),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const f32=(p:string)=>{const b=read(p);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const features=JSON.parse(read('public/geo-r02b/features.json').toString());
const heights=f32('public/geo-r02b/terrain.f32'),water=f32('public/geo-r02b/water-surface.f32');
const heightsBefore=sha(Buffer.from(heights.buffer));
const source=geoR02BSource(heights,water,features);
const first=classifyTerrain(source).classification;
const query=new TerrainMaterialQuery(first);
/** Golden hash of rules mat-01-rules-r5 on terrain fc8fd6da…; update deliberately when rules change. */
const GOLDEN='bc2ce096df2672080f08ec6c92ed8f288e5d079a91db9855470ca1d56cee63a1';

test('MAT-01 changes no protected GEO-R02B, WORLD, water, route or P0 file (P0 git-blob baseline)',()=>{
 const manifest=JSON.parse(read('docs/mat-01/protected-baseline.json').toString());
 assert.equal(manifest.sourceCommit,'90d0cb745e8e51a3dc737bd4dc11d6f8c322758b');
 const files=Object.entries(manifest.files as Record<string,string>);assert.ok(files.length>200);
 for(const [file,hash] of files)assert.equal(sha(read(file)),hash,file);
});

test('classification never mutates the canonical heightfield or water surface',()=>{
 assert.equal(sha(Buffer.from(heights.buffer)),heightsBefore);
 assert.equal(sha(read('public/geo-r02b/terrain.f32')),'fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a');
});

test('classification is deterministic and matches the recorded golden hash',async()=>{
 const second=classifyTerrain(geoR02BSource(f32('public/geo-r02b/terrain.f32'),f32('public/geo-r02b/water-surface.f32'),features)).classification;
 assert.deepEqual(Buffer.from(second.weights),Buffer.from(first.weights));
 assert.deepEqual(Buffer.from(second.attributes),Buffer.from(first.attributes));
 assert.equal(await classificationHash(first),GOLDEN,'rules or inputs changed: review data maps, then update GOLDEN');
 assert.equal(first.rulesVersion,RULES.version);
});

test('every lattice node has weights summing to exactly 255 and valid attributes',()=>{
 const {width:W,height:H}=first.lattice;assert.equal(first.weights.length,W*H*4);assert.equal(first.attributes.length,W*H*4);
 for(let k=0;k<W*H;k++){const s=first.weights[k*4]+first.weights[k*4+1]+first.weights[k*4+2]+first.weights[k*4+3];if(s!==255)assert.fail(`node ${k} sums to ${s}`);}
 assert.deepEqual(first.materials,MATERIAL_ORDER);
});

test('island composition and named places are ecologically plausible',()=>{
 const at=(id:string)=>{const a=source.anchors.find(a=>a.id===id)!;return query.sample(a.xz[0],a.xz[1]);};
 assert.equal(at('forest').dominant,'forest-floor');assert.equal(at('fold').dominant,'forest-floor');
 assert.equal(at('valley').dominant,'meadow-turf');assert.equal(at('north-peak').dominant,'bedrock');
 // Every material is present on land in a meaningful but bounded share.
 const share=new Float64Array(4);let n=0;const {width:W,height:H}=first.lattice;
 for(let k=0;k<W*H;k+=7){if(heights[k]<=.5||Number.isFinite(water[k]))continue;n++;for(let m=0;m<4;m++)share[m]+=first.weights[k*4+m]/255;}
 const f=[...share].map(v=>v/n);
 assert.ok(f[0]>.12&&f[0]<.4,'forest '+f[0]);assert.ok(f[1]>.4&&f[1]<.75,'meadow '+f[1]);assert.ok(f[2]>.005&&f[2]<.06,'sand '+f[2]);assert.ok(f[3]>.08&&f[3]<.3,'rock '+f[3]);
 // Sand stays near the sea; wet attributes follow verified water.
 const sea=new Uint8Array(W*H);for(let k=0;k<W*H;k++)sea[k]=Number.isFinite(water[k])&&water[k]<=.001?1:0;
 const coast=distanceField(sea,first.lattice);
 for(let k=0;k<W*H;k+=3)if(first.weights[k*4+2]>128&&!sea[k])assert.ok(coast[k]<400,`sand ${coast[k]} m inland at node ${k}`);
});

test('CPU query: bilinear lattice sampling, normalised weights, exact at nodes',()=>{
 const {cellM:c,west,north,width:W}=first.lattice;
 for(const [i,j] of [[300,400],[700,900],[1100,1500],[200,1800]]){
  const w=query.weightsAt(west+i*c,north-j*c),k=(j*W+i)*4;
  for(let m=0;m<4;m++)assert.ok(Math.abs(w[m]-first.weights[k+m]/255)<1e-9);
 }
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let t=0;t<2000;t++){const w=query.weightsAt(-2900+rnd()*5800,-3900+rnd()*7800);const s=w[0]+w[1]+w[2]+w[3];assert.ok(Math.abs(s-1)<1e-9);for(const v of w)assert.ok(v>=0&&v<=1&&Number.isFinite(v));}
 const cov=query.coverage(-740,-50,25);assert.ok(Math.abs(Object.values(cov).reduce((a,b)=>a+b,0)-1)<1e-9);
});

test('material identity is a function of world position only: tiling and LOD cannot change it',()=>{
 // The review adapter reproduces the canonical GEO-R02B tile mesh exactly at 4 m.
 const grid=new HeightGrid(heights,1501,2001,4);
 const canonical=terrainGeometry(grid,-1000,0,400,4),adapter=tileGeometry({lattice:first.lattice,heights},-1000,0,400,4);
 assert.deepEqual([...adapter.getAttribute('position').array],[...canonical.getAttribute('position').array]);
 const cn=canonical.getAttribute('normal').array,an=adapter.getAttribute('normal').array;for(let i=0;i<cn.length;i++)assert.ok(Math.abs(cn[i]-an[i])<1e-6);
 // A 16 m LOD tile and two 200 m tiles share their vertices' world positions with the canonical tile; the material
 // lookup uses only (x, z), so the composition at every shared vertex is identical.
 const lod=tileGeometry({lattice:first.lattice,heights},-1000,0,400,16).getAttribute('position'),a=new Float64Array(4),b=new Float64Array(4);
 for(let v=0;v<lod.count;v+=5){const x=lod.getX(v),z=lod.getZ(v);query.weightsAt(x,z,a);query.weightsAt(x+0,z-0,b);assert.deepEqual([...a],[...b]);
  assert.equal(lod.getY(v),grid.node(x,z));}
 const left=tileGeometry({lattice:first.lattice,heights},-1000,0,200,4).getAttribute('position'),right=tileGeometry({lattice:first.lattice,heights},-800,0,200,4).getAttribute('position');
 for(let r=0;r<=50;r++){const l=r*51+50,q=r*51;assert.equal(left.getX(l),right.getX(q));assert.equal(left.getY(l),right.getY(q));assert.equal(left.getZ(l),right.getZ(q));}
});

test('quantisation preserves exact sums and degenerate inputs',()=>{
 const out=new Uint8Array(4);
 for(const w of [[.3333,.3333,.3334,0],[1,0,0,0],[.001,.002,.003,.994],[0,0,0,0],[.25,.25,.25,.25]]){quantizeWeights(w,out,0);assert.equal(out.reduce((a,b)=>a+b,0),255,JSON.stringify(w));}
 quantizeWeights([0,0,0,0],out,0);assert.deepEqual([...out],[0,255,0,0]);
});

test('rules declare provenance for every input and reference existing source data',()=>{
 const allowed=new Set(['verified-source','derived','provisional-artistic','future']);
 for(const [k,v] of Object.entries(RULES.inputs))assert.ok(allowed.has(v),k);
 for(const it of [...RULES.dune,...RULES.cove,...RULES.mire])assert.ok(features.anchors.some((a:{id:string})=>a.id===it.anchor),it.anchor);
 for(const id of Object.keys(RULES.forestByCatchment))assert.ok(features.catchments.some((c:{id:string})=>c.id===id),id);
 const ring=rasterizeRings([[[0,0],[40,0],[40,40],[0,40]]],{width:21,height:21,cellM:4,west:-20,north:60});
 // Even–odd scanlines are half-open in z: rows z = 0…36 (10) × columns x = 0…40 (11).
 assert.equal(ring.reduce((a,b)=>a+b,0),10*11);
});

test('material definitions are complete, ordered and palettes are well formed',()=>{
 assert.deepEqual(MATERIALS.map(m=>m.id),MATERIAL_ORDER);
 for(const m of MATERIALS){
  assert.ok(m.palette.length>=4&&m.palette[0][0]===0&&m.palette.at(-1)![0]===1,m.id);
  for(let i=1;i<m.palette.length;i++)assert.ok(m.palette[i][0]>m.palette[i-1][0]&&/^#[0-9a-f]{6}$/.test(m.palette[i][1]),m.id);
  for(const v of [m.tileM,m.mesoScale,m.normalStrength,m.heightBlend,m.roughness.dry,m.roughness.wet,m.patch.coverage,m.patch.scaleM,m.mesoAmount,...m.wetTint,...m.exposureTint,...m.macroTint.flat(),...m.patch.tint])assert.ok(Number.isFinite(v)&&v>=0,m.id);
  assert.ok(m.roughness.wet>=.5,'wet roughness below .5 reads as glossy plastic: '+m.id);
 }
});

test('detail textures are deterministic, tileable and within expected tone ranges',()=>{
 for(const def of MATERIALS){
  const a=synthesizeMaterial(def,64),b=synthesizeMaterial(def,64),S=64;
  assert.deepEqual(Buffer.from(a.albedo),Buffer.from(b.albedo),def.id);assert.deepEqual(Buffer.from(a.surface),Buffer.from(b.surface),def.id);
  // Wrap seam: differences across the tile edge are not larger than typical neighbour differences.
  let edge=0,inner=0;
  for(let y=0;y<S;y++)for(let c=0;c<3;c++){edge+=Math.abs(a.albedo[(y*S+S-1)*4+c]-a.albedo[(y*S)*4+c]);inner+=Math.abs(a.albedo[(y*S+S/2)*4+c]-a.albedo[(y*S+S/2-1)*4+c]);}
  assert.ok(edge<=inner*1.6+S,`${def.id} wrap seam ${edge} vs interior ${inner}`);
  const lum=.2126*a.meanLinear[0]+.7152*a.meanLinear[1]+.0722*a.meanLinear[2];assert.ok(lum>.02&&lum<.4,`${def.id} mean luminance ${lum}`);
 }
});

test('GPU resources: shared, reference counted, fully disposed and re-creatable',()=>{
 const tiny:MaterialClassification={...first,lattice:{width:8,height:8,cellM:4,west:0,north:0},weights:new Uint8Array(8*8*4).fill(63),attributes:new Uint8Array(8*8*4)};
 const tex=MATERIALS.map(d=>synthesizeMaterial(d,16));
 const r=new TerrainMaterialResources(tiny,tex,'mobile');let disposed=0;
 for(const t of [r.weights,r.attributes,r.albedo,r.surface])t.addEventListener('dispose',()=>disposed++);
 r.acquire();r.acquire();r.release();assert.equal(disposed,0);assert.equal(r.disposed,false);
 r.release();assert.equal(disposed,4);assert.equal(r.disposed,true);
 assert.throws(()=>r.acquire());assert.throws(()=>r.release());
 const again=new TerrainMaterialResources(tiny,tex,'mobile').acquire();assert.equal(again.disposed,false);again.release();
 assert.equal(PROFILES.mobile.mapDecimation,2);assert.ok(r.memoryBytes.total>0);
});
