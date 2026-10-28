import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {MATERIALS} from '../src/terrain-material/materials.ts';
import {synthesizeMaterial,type SynthesizedTexture} from '../src/terrain-material/textures.ts';
import {TerrainMaterialResources,createTerrainMaterial} from '../src/terrain-material/render/terrain-material.ts';
import {MAT_ART_R01_DEFINITIONS,SYNTHESIS,synthesizeMatArtR01} from '../src/mat-art-r01/variant.ts';
import {applyDefinitions,cavityOff,diagnosticDefinitions,lowpassAlbedo} from '../src/mat-art-r01/ground-variant.ts';
import {spectrum} from '../tools/mat-art-r01/spectrum.ts';

const sha=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
const texHash=(t:SynthesizedTexture)=>createHash('sha256').update(t.albedo).update(t.surface).digest('hex');
/** Geographic/environment foundation this milestone starts from. */
const FOUNDATION='2ffcf1d1794528d2166846ca7cca874c11f33029';
/** MAT-01 texture bytes synthesised from the FOUNDATION source tree. */
const ORIGINAL:Record<number,Record<string,string>>={
 512:{'forest-floor':'a89b21b2769ebb8a9df4cdd3a7a749beaaefb84fa92cd252f0a674e1beffae08','meadow-turf':'2192c972f3287f2787e72be6e9a2780b20c10f2a9696d494055a085ffb8b2fd0','coastal-sand':'e60872ee56ec6c92e01eef08f55e9f84b19f6109f621aeceec85602c8418c1b5',bedrock:'fd0df21195cb36819fb89aa52bfa635f2aa00f5bf6f8bcf4762270f4a5c51ea7'},
 256:{'forest-floor':'a305c663452cfc64037111ebff98d5b142fdba1e154fb1d4bcdc585f0a0b5641','meadow-turf':'08438a377cefeb5ef71b9ddec71409b4b874d90a23a821f0b269fd896bc563cd','coastal-sand':'ff33a85cb2881f83e858c93dd91c662e7222bd0741492fc259f0c941f925ec29',bedrock:'b94238495d6ec652ebfc2267392c1483462a195b8cb9fb070d39fe3cd74fde67'},
};
const tiny=()=>({schema:'aurora-rest-terrain-material/1' as const,lattice:{width:2,height:2,cellM:4,west:0,north:4},weights:new Uint8Array([255,0,0,0,0,255,0,0,0,0,255,0,0,0,0,255]),attributes:new Uint8Array(16),materials:MATERIALS.map(m=>m.id),rulesVersion:'test',sourceId:'test'});

test('MAT-ART-R01 modifies no file of the foundation tree (new files only)',()=>{
 // Working tree vs the foundation commit: any modified, deleted or type-changed tracked path fails.
 // Content comparison (follows symlinks), so it holds in a plain checkout and inside the recovery CI fixture, whose
 // tests/ and .github/ are reconstructions verified by that harness itself (tools/recovery/test-partition.mjs).
 const fixture=existsSync('tests/recovery-env.ts'),changed:string[]=[];
 const rows=execFileSync('git',['ls-tree','-r',FOUNDATION],{maxBuffer:64e6}).toString().trim().split('\n');
 assert.ok(rows.length>500);
 for(const row of rows){const [meta,path]=row.split('\t'),blob=meta.split(' ')[2];
  if(fixture&&(path.startsWith('tests/')||path.startsWith('.github/')))continue;
  if(!existsSync(path)){changed.push(path);continue;}
  const bytes=readFileSync(path),gitBlob=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  if(gitBlob===blob)continue;
  // Git LFS: the committed blob is a pointer; the checked-out bytes must match its oid and size.
  const pointer=execFileSync('git',['cat-file','-p',blob]).toString();
  if(!pointer.includes(`oid sha256:${sha(bytes)}`)||!pointer.includes(`size ${bytes.length}`))changed.push(path);}
 assert.deepEqual(changed,[]);
});

test('original MAT-01 textures stay byte-identical to the foundation at 512 and 256',()=>{
 for(const size of [512,256])for(const d of MATERIALS)assert.equal(texHash(synthesizeMaterial(d,size)),ORIGINAL[size][d.id],`${d.id}@${size}`);
});

test('stylized synthesis is deterministic and leaves coastal-sand and bedrock untouched',()=>{
 for(const size of [256,128]){
  const a=MAT_ART_R01_DEFINITIONS.map(d=>synthesizeMatArtR01(d,size)),b=MAT_ART_R01_DEFINITIONS.map(d=>synthesizeMatArtR01(d,size));
  a.forEach((t,i)=>assert.equal(texHash(t),texHash(b[i])));
  for(const id of ['coastal-sand','bedrock']){const i=MATERIALS.findIndex(m=>m.id===id);assert.equal(texHash(a[i]),texHash(synthesizeMaterial(MATERIALS[i],size)),id);}
  for(const id of ['forest-floor','meadow-turf']){const i=MATERIALS.findIndex(m=>m.id===id);assert.notEqual(texHash(a[i]),texHash(synthesizeMaterial(MATERIALS[i],size)),id);}
  for(const t of a){assert.equal(t.albedo.length,size*size*4);assert.equal(t.surface.length,size*size*4);assert.ok(t.meanLinear.every(v=>v>0&&v<1));}
 }
});

test('variant definitions keep material ids, order and every non-art field',()=>{
 assert.deepEqual(MAT_ART_R01_DEFINITIONS.map(d=>d.id),MATERIALS.map(d=>d.id));
 const art=new Set(['name','tileM','palette','normalStrength','macroTint','exposureTint','patch','mesoAmount']);
 MATERIALS.forEach((o,i)=>{const v=MAT_ART_R01_DEFINITIONS[i];
  if(o.id==='coastal-sand'||o.id==='bedrock'){assert.equal(v,o);return;}
  for(const k of Object.keys(o) as (keyof typeof o)[])if(!art.has(k))assert.deepEqual(v[k],o[k],`${o.id}.${k}`);
  assert.equal(v.generator,o.generator);assert.equal(v.seed,o.seed);});
 assert.deepEqual(Object.keys(SYNTHESIS).sort(),['forest-floor','meadow-turf']);
});

test('adapter reproduces constructor uniforms exactly and only changes in-scope slots',()=>{
 const textures=MATERIALS.map(d=>synthesizeMaterial(d,32)),c=tiny(),dump=(r:TerrainMaterialResources)=>JSON.stringify(['uMatScale','uMatWet','uMatMacroA','uMatMacroB','uMatExposure','uMatPatch','uMatMisc'].map(k=>r.uniforms[k].value));
 const a=new TerrainMaterialResources(c,textures,'high').acquire(),b=new TerrainMaterialResources(c,textures,'high').acquire();
 const before=dump(b);applyDefinitions(b,MATERIALS);assert.equal(dump(b),before);assert.equal(dump(a),before);
 applyDefinitions(b,MAT_ART_R01_DEFINITIONS);const keys=['uMatScale','uMatMacroA','uMatPatch','uMatMisc'];
 for(const k of keys){const va=a.uniforms[k].value as {toArray():number[]}[],vb=b.uniforms[k].value as {toArray():number[]}[];
  assert.notDeepEqual(vb[0].toArray(),va[0].toArray(),k+' forest-floor');assert.notDeepEqual(vb[1].toArray(),va[1].toArray(),k+' meadow');
  assert.deepEqual(vb[2].toArray(),va[2].toArray(),k+' sand');assert.deepEqual(vb[3].toArray(),va[3].toArray(),k+' bedrock');}
 // The stylized material compiles the identical program: same shader hook and cache key.
 const ma=createTerrainMaterial(a),mb=createTerrainMaterial(b);assert.equal(ma.customProgramCacheKey(),mb.customProgramCacheKey());assert.deepEqual(ma.defines,mb.defines);
 ma.dispose();mb.dispose();a.release();b.release();assert.ok(a.disposed&&b.disposed);
});

test('stylized resources are balanced across every quality profile and repeated creation',()=>{
 const c=tiny();for(let cycle=0;cycle<3;cycle++)for(const profile of ['high','balanced','mobile'] as const){
  const t=MAT_ART_R01_DEFINITIONS.map(d=>synthesizeMatArtR01(d,32)),r=new TerrainMaterialResources(c,t,profile).acquire();applyDefinitions(r,MAT_ART_R01_DEFINITIONS);
  assert.equal(r.ownerCount,1);assert.equal(r.memoryBytes.total,new TerrainMaterialResources(c,MATERIALS.map(d=>synthesizeMaterial(d,32)),profile).memoryBytes.total);r.release();assert.ok(r.disposed);assert.throws(()=>r.acquire());}
});

test('diagnostic ablations change only the documented channel of in-scope materials',()=>{
 const d=MATERIALS[1],t=synthesizeMaterial(d,64),lp=lowpassAlbedo(t,d.tileM),co=cavityOff(t);
 assert.deepEqual(lp.surface,t.surface);for(let i=3;i<t.albedo.length;i+=4)assert.equal(lp.albedo[i],t.albedo[i]);assert.notDeepEqual(lp.albedo,t.albedo);
 assert.deepEqual(co.albedo,t.albedo);for(let i=0;i<t.surface.length;i++)assert.equal(co.surface[i],i%4===2?255:t.surface[i]);
 assert.equal(texHash(synthesizeMaterial(d,64)),texHash(t),'diagnostics never alias the original bytes');
 for(const v of ['diag-normal-off','diag-meso-off','diag-scale-2x'] as const){const defs=diagnosticDefinitions(MATERIALS,v);assert.equal(defs[2],MATERIALS[2]);assert.equal(defs[3],MATERIALS[3]);assert.notDeepEqual(defs[0],MATERIALS[0]);}
});

test('stylized frequency budget: fine contrast far below MAT-01 meadow, shape-and-larger contrast retained',()=>{
 // Absolute L* budgets (not variance shares): R2 tufts have crisp tapered edges by design, which shifts some share into
 // the blade band while the absolute fine contrast stays a fraction of MAT-01's photographic blade field.
 const band=(s:ReturnType<typeof spectrum>,a:string,b:string)=>Math.hypot(s.bands[a].rmsLstar,s.bands[b].rmsLstar);
 const meadow=MATERIALS.find(m=>m.id==='meadow-turf')!,original=spectrum(synthesizeMaterial(meadow,512),meadow.tileM);
 const originalFine=band(original,'grain <2.5 cm','blade 2.5–6 cm');
 for(const id of ['forest-floor','meadow-turf']){
  const v=MAT_ART_R01_DEFINITIONS.find(m=>m.id===id)!,sv=spectrum(synthesizeMatArtR01(v,512),v.tileM);
  // Shape = everything at or above tuft scale: R3 forest moss carries its structure in ≈1 m mats against humus.
  const fine=band(sv,'grain <2.5 cm','blade 2.5–6 cm'),shape=Math.hypot(band(sv,'tuft 6–15 cm','clump 15–40 cm'),sv.bands['patch ≥40 cm'].rmsLstar);
  assert.ok(fine<.35*originalFine,`${id} sub-6 cm L* ${fine} vs MAT-01 meadow ${originalFine}`);
  assert.ok(shape>3,`${id} shape-scale L* ${shape} (not flat)`);
  assert.ok(fine/shape<1.2,`${id} fine/shape ${fine/shape}; MAT-01 meadow is ${(originalFine/Math.hypot(band(original,'tuft 6–15 cm','clump 15–40 cm'),original.bands['patch ≥40 cm'].rmsLstar)).toFixed(2)}`);
 }
 assert.equal(sha(readFileSync('src/terrain-material/textures.ts')),sha(execFileSync('git',['show',FOUNDATION+':src/terrain-material/textures.ts'])));
});
