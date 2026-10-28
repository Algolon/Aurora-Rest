import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {HeightGrid} from '../src/geo-r02b/terrain.ts';
import {CanonicalEnvironment} from '../src/pop-01/geography.ts';
import {PopulationGenerator,owner} from '../src/pop-01/generator.ts';
import {RULES} from '../src/pop-01/ecology.ts';
import {buildComposition,sourcePilot,withOverlay,PILOT} from '../src/env-nature-r02/composition.ts';
import {selectedPath,pilotCameras} from '../src/env-nature-r02/segment.ts';
const sha=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
const floats=(p:string)=>{const b=readFileSync(p);return new Float32Array(b.buffer,b.byteOffset,b.byteLength/4);};
const geo=new CanonicalEnvironment(JSON.parse(readFileSync('public/geo-r02b/features.json','utf8')),new HeightGrid(floats('public/geo-r02b/terrain.f32'),1501,2001),floats('public/geo-r02b/water-mesh.f32'));
const source=sourcePilot(geo),layer=buildComposition(geo,source);

test('R02 protected source, terrain, hydrology, assets and MAT remain byte-identical',()=>{
 const manifest=JSON.parse(readFileSync('docs/env-nature-r02/protected-files.json','utf8'));
 assert.ok(manifest.files.length>50);
 for(const f of manifest.files)assert.equal(sha(readFileSync(f.path)),f.sha256,f.path);
 assert.equal(sha(readFileSync('public/geo-r02b/terrain.f32')),'fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a');
});
test('R02 deterministic manifest and original full descriptor identity survive every toggle',()=>{
 const ledger=JSON.parse(readFileSync('docs/env-nature-r02/manifest.json','utf8'));
 assert.deepEqual(layer.placements,ledger.placements);assert.deepEqual(buildComposition(geo,source),layer);
 assert.equal(sha(JSON.stringify(source)),ledger.sourceSha256);
 const gen=new PopulationGenerator(geo),p=gen.generate(owner(-720,-110,64)),before=JSON.stringify(p);
 for(const enabled of [true,false,true,false]){
  const combined=withOverlay(p,layer.placements,enabled);
  assert.equal(JSON.stringify(p),before);assert.deepEqual(combined.instances.filter(q=>!q.id.startsWith('env-r02:')),p.instances);
  assert.equal(combined.instances.length,p.instances.length+(enabled?layer.placements.filter(q=>q.chunk===p.key).length:0));
 }
 const outside=gen.generate({x:20,z:20});assert.deepEqual(withOverlay(outside,layer.placements,true),outside);
});
test('R02 authored identities, approved references, scale policy, ecology and pilot bounds are valid',()=>{
 assert.equal(new Set(layer.placements.map(p=>p.id)).size,layer.placements.length);
 assert.ok(layer.placements.length>0);
 for(const p of layer.placements){
  assert.ok(p.id.startsWith('env-r02:'));assert.ok(!source.some(s=>s.id===p.id));
  assert.ok(p.x>=PILOT.west&&p.x<=PILOT.east&&p.z>=PILOT.south&&p.z<=PILOT.north);
  assert.ok(Number.isInteger(p.variant)&&p.variant>=0&&p.variant<((p.family==='birch'||p.family==='pine')?3:4));
  const lo=p.family==='grass'?.75:p.family==='rock'?.65:.8,hi=p.family==='grass'?1.25:p.family==='rock'?2.45:1.25;
  assert.ok(p.scale>=lo&&p.scale<=hi);
  const s=geo.sample(p.x,p.z),r=RULES[p.family];assert.ok(s.dry);assert.ok(s.waterDistance>=r.waterClearance&&s.coastDistance>=r.coastClearance&&s.trailDistance>=r.trailClearance);
  assert.equal(p.y,s.elevation);assert.deepEqual(p.normal,s.normal);assert.equal(p.chunk,Object.values(owner(p.x,p.z,64)).join(','));
 }
});
test('R02 corridor is contiguous canonical path with tested 3.4 m dry width and passing grades',()=>{
 const survey=JSON.parse(readFileSync('docs/env-nature-r02/survey.json','utf8')),path=selectedPath(geo);
 assert.equal(path.length,survey.samples.length);assert.ok(survey.lengthM>=120&&survey.lengthM<=180);assert.ok(survey.maxIntervalM<=4);
 assert.ok(survey.maxAlongGrade<=.25);assert.ok(survey.maxCrossGrade<=.35);assert.ok(survey.allDry&&survey.clearPlayer);
 assert.equal(survey.maxRouteDistance,0);
 for(let i=0;i<path.length;i++){
  const s=survey.samples[i];assert.deepEqual(path[i],[s.x,s.z]);assert.equal(geo.elevation(s.x,s.z),s.elevation);
  for(const w of s.width){assert.equal(geo.elevation(w.x,w.z),w.y);assert.ok(geo.sample(w.x,w.z).dry);}
 }
 for(const c of pilotCameras(geo))assert.ok(geo.sample(c.x,c.z).dry);
});
