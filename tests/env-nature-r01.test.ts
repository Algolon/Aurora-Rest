import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {HeightGrid} from '../src/geo-r02b/terrain.ts';
import {CanonicalEnvironment,type GeoData} from '../src/pop-01/geography.ts';
import {PopulationGenerator,owner} from '../src/pop-01/generator.ts';
import {compositionExcludes} from '../src/pop-01/composition.ts';
import {AUTHOR_MASKS,AUTHOR_VIEWPOINTS,PILOT_BOUNDS} from '../src/env-nature-r01/composition.ts';
import {suppressOnly} from '../src/env-nature-r01/suppress.ts';
const bytes=(p:string)=>readFileSync(p);
const floats=(p:string)=>{const b=bytes(p);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const features=JSON.parse(bytes('public/geo-r02b/features.json').toString()) as GeoData;
const geo=new CanonicalEnvironment(features,new HeightGrid(floats('public/geo-r02b/terrain.f32'),1501,2001),floats('public/geo-r02b/water-mesh.f32'));
const gen=new PopulationGenerator(geo,{seed:73129,chunkSize:64});
test('canonical geography and source data remain unmodified',()=>{
 assert.equal(createHash('sha256').update(bytes('public/geo-r02b/terrain.f32')).digest('hex'),'fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a');
 assert.equal(features.meta.terrainSha256,'fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a');
});
test('authored pilot is bounded, selective, reversible and all cameras dry',()=>{
 assert.equal(AUTHOR_MASKS.length,5);
 for(const v of AUTHOR_VIEWPOINTS){assert.ok(v.x>=PILOT_BOUNDS.west&&v.x<=PILOT_BOUNDS.east);assert.ok(v.z>=PILOT_BOUNDS.south&&v.z<=PILOT_BOUNDS.north);assert.ok(geo.sample(v.x,v.z).dry,'dry review viewpoint '+v.id);}
 for(const m of AUTHOR_MASKS){assert.deepEqual([...m.families],['birch','pine']);assert.ok(m.x>=PILOT_BOUNDS.west&&m.x<=PILOT_BOUNDS.east);assert.ok(m.z>=PILOT_BOUNDS.south&&m.z<=PILOT_BOUNDS.north);}
});
test('post-generation suppression is exact subset; retains every placement byte-identically',()=>{
 let removed=0,retained=0;
 const chunks=new Map();
 for(const v of AUTHOR_VIEWPOINTS) {
   const centre=owner(v.x,v.z,64);
   for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const c={x:centre.x+dx,z:centre.z+dz};chunks.set(c.x+','+c.z,c);}
 }
 for(const c of chunks.values()){
  const source=gen.generate(c),before=JSON.stringify(source),after=suppressOnly(source,AUTHOR_MASKS);
  assert.equal(JSON.stringify(source),before,'source untouched');
  assert.deepEqual(suppressOnly(source,[]),source);
  const originals=new Map(source.instances.map(x=>[x.id,x]));
  for(const p of after.instances){assert.deepEqual(p,originals.get(p.id));assert.equal(compositionExcludes(AUTHOR_MASKS,p.family,p.x,p.z),false);}
  for(const p of source.instances)if(!after.instances.some(x=>x.id===p.id)){
    assert.ok(p.family==='birch'||p.family==='pine','no grass/rock removal');
    assert.equal(compositionExcludes(AUTHOR_MASKS,p.family,p.x,p.z),true);
    removed++;
  }
  retained+=after.instances.length;
  assert.equal(source.instances.length-after.instances.length,after.rejected['authored-suppression']);
 }
 assert.ok(removed>0,'Pilot must actually open canopy, not merely configure a mask');
 assert.ok(retained>100,'Existing nature population should remain dominant');
});
test('outside bounded visual art pilot, suppression is identity',()=>{
 const c=owner(1100,1400,64),source=gen.generate(c);
 assert.deepEqual(suppressOnly(source,AUTHOR_MASKS).instances,source.instances);
});
