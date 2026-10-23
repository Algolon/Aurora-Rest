import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createWaterShader,WAVE_STUDIES,waveStudyId} from '../src/wtr-01/material.ts';
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

test('WTR-01 custom shader includes all Three.js fog and logarithmic-depth dependencies',()=>{
  for(const quality of ['low','medium','high'] as const){
    const shader=createWaterShader(quality,new THREE.Vector3(0,1,0));
    assert.equal(shader.fog,true);
    for(const uniform of ['fogColor','fogNear','fogFar','fogDensity','uTime','uSunDirection']){
      assert.ok(shader.uniforms[uniform]&&'value' in shader.uniforms[uniform],quality+': missing '+uniform);
    }
    for(const chunk of [
      'logdepthbuf_pars_vertex','logdepthbuf_vertex',
      'logdepthbuf_pars_fragment','logdepthbuf_fragment',
      'fog_pars_vertex','fog_vertex','fog_pars_fragment','fog_fragment'
    ]){
      assert.ok((shader.vertexShader+shader.fragmentShader).includes('#include <'+chunk+'>'),quality+': missing '+chunk);
    }
    shader.dispose();
  }
});

test('WTR-01A candidate switch preserves WTR-01R uniforms and all quality levels',()=>{
  assert.deepEqual(WAVE_STUDIES,['original','A','B','C']);
  assert.deepEqual(WAVE_STUDIES.map(waveStudyId),[0,1,2,3]);
  for(const study of WAVE_STUDIES){
    for(const quality of ['low','medium','high'] as const){
      const material=createWaterShader(quality,new THREE.Vector3(0.5,1,.2),study);
      assert.equal(material.uniforms.uStudy.value,waveStudyId(study));
      for(const k of ['uTime','uSunDirection','fogColor','fogDensity','uBase','uWind','uSurface']){
        assert.ok(material.uniforms[k],study+'/'+quality+': '+k);
      }
      for(const uniform of Object.values(material.uniforms)){
        const values=Array.isArray(uniform.value)?uniform.value:[uniform.value];
        for(const v of values){
          if(typeof v==='number')assert.ok(Number.isFinite(v));
          if(v?.isVector2)assert.ok(Number.isFinite(v.length())&&v.length()>0);
          if(v?.isVector4)assert.ok([v.x,v.y,v.z,v.w].every(Number.isFinite));
        }
      }
      assert.ok(material.vertexShader.includes('logdepthbuf_vertex'));
      assert.ok(material.fragmentShader.includes('logdepthbuf_fragment'));
      material.dispose();
    }
  }
});
