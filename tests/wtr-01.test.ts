import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PALETTE,WATER_TYPES,AVAILABLE_FIELDS,PROPOSED_FIELDS,
  pointInRing,classifyCanonicalWaterMesh,renderQualityDetail,type LakeBoundary
} from '../src/wtr-01/config.ts';

const square=(cx:number,cz:number,size:number)=>[
  [cx-size,cz-size],[cx+size,cz-size],[cx+size,cz+size],[cx-size,cz+size]
];
const lakes:LakeBoundary[]=[
  {id:'high-tarn',name:'High Tarn',level:360,boundary:square(0,0,30)},
  {id:'birch-upper-lake',name:'Birchwood',level:86,boundary:square(100,100,30)}
];
const tri=(x:number,y:number,z:number)=>[
  x,y+.025,z,x+2,y+.025,z,x,y+.025,z+2
];
test('WTR-01 triangle classifier adds exactly one classification per unchanged source vertex',()=>{
  const input=new Float32Array([...tri(0,360,0),...tri(100,86,100),...tri(200,20,200)]);
  const before=new Uint8Array(input.buffer).slice();
  const result=classifyCanonicalWaterMesh(input,lakes);
  assert.deepEqual(result.counts,{lowerLake:1,highTarn:1,channel:1});
  assert.deepEqual([...result.kinds],[2,2,2,1,1,1,3,3,3]);
  assert.equal(result.triangles,3);
  assert.deepEqual(new Uint8Array(input.buffer),before,'render-only classification cannot mutate canonical geometry');
});
test('WTR-01 fails closed for malformed/unordered/nonfinite mesh data',()=>{
  assert.throws(()=>classifyCanonicalWaterMesh(new Float32Array(8),lakes),/unindexed/);
  assert.throws(()=>classifyCanonicalWaterMesh(new Float32Array([...tri(0,NaN,0)]),lakes),/Invalid R1/);
});
test('water palette shares one coherent bounded material contract',()=>{
  assert.deepEqual(WATER_TYPES,['ocean','lowerLake','highTarn','channel']);
  for(const type of WATER_TYPES){
    const p=PALETTE[type];
    assert.ok(p.frequency>0&&p.speed>=0&&p.slope>=0);
    assert.ok(p.roughness>=0&&p.roughness<=1&&p.fresnel>=0&&p.fresnel<=1);
    assert.ok(Math.hypot(...p.wind)>.1);
  }
  assert.equal(renderQualityDetail('low'),0);
  assert.equal(renderQualityDetail('medium'),1);
  assert.equal(renderQualityDetail('high'),2);
  assert.deepEqual(AVAILABLE_FIELDS,['waterType','waterLevelM']);
  assert.deepEqual(PROPOSED_FIELDS,['shorelineProximityM','flowDirection','flowSpeedMps']);
  assert.equal(pointInRing(0,0,square(0,0,20)),true);
  assert.equal(pointInRing(40,40,square(0,0,20)),false);
});
test('canonical R1 High Tarn level and water mesh remain the audited source',()=>{
  const base=new URL('../',import.meta.url);
  const read=(p:string)=>readFileSync(new URL(p,base));
  const features=JSON.parse(read('public/geo-r02b/features.json').toString());
  const water=read('public/geo-r02b/water-mesh.f32');
  const high=features.lakes.find((l:{id:string})=>l.id==='high-tarn');
  assert.ok(high);assert.equal(high.level,360);
  assert.equal(createHash('sha256').update(water).digest('hex'),'d216a9be42934440e3b236139f5b8f91a58c358938492f865c6eef174672294d');
  assert.equal(createHash('sha256').update(read('public/geo-r02b/water-surface.f32')).digest('hex'),'e233e4f8cc2d7f425576c70f112819d49198a6090f15054e9e78523954e5bc55');
  const source=new Float32Array(water.buffer.slice(water.byteOffset,water.byteOffset+water.byteLength));
  const result=classifyCanonicalWaterMesh(source,features.lakes);
  assert.equal(result.triangles*3,features.waterMesh.vertices);
  assert.equal(result.triangles,111855);
  assert.ok(result.counts.highTarn>0,'actual R1 High Tarn triangles must appear in the review material');
  assert.equal(result.counts.highTarn+result.counts.lowerLake+result.counts.channel,result.triangles);
});
