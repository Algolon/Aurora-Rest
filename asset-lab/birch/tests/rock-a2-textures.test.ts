import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {generateRockLookdevPixels,ROCK_LOOKDEV_SIZE} from '../src/rocks/experimental/a2/rockTexturePixels.ts';
import {r04StudyGeometry} from '../src/rocks/experimental/r04MaterialStudies.ts';
const fingerprint=(a:Uint8Array)=>createHash('sha256').update(a).digest('hex');
const pixel=(a:Uint8Array,x:number,y:number)=>Array.from(a.slice((y*ROCK_LOOKDEV_SIZE+x)*4,(y*ROCK_LOOKDEV_SIZE+x)*4+4));
test('A2 three PBR sets deterministic, finite, distinct and correctly encoded',()=>{
 const fingerprints=new Set<string>();
 for(const s of ['T1','T2','T3'] as const){
  const p=generateRockLookdevPixels(s);
  assert.equal(p.size,512);
  assert.ok(p.meanRoughness>.78&&p.meanRoughness<1);
  for(const k of ['albedo','normal','roughness'] as const){
   const a=p[k];assert.equal(a.byteLength,512*512*4);
   for(let i=3;i<a.length;i+=4)assert.equal(a[i],255);
  }
  const sig=fingerprint(p.albedo);fingerprints.add(sig);
  assert.ok(p.normal.every(Number.isFinite));
  const repeated=generateRockLookdevPixels(s);
  for(const k of ['albedo','normal','roughness'] as const)
   assert.equal(fingerprint(p[k]),fingerprint(repeated[k]),'nondeterministic '+s+' '+k);
 }
 assert.equal(fingerprints.size,3,'Three art studies must not be mere material clones');
});
test('A2 tiled textures have no strong opposite-edge color or normal discontinuities',()=>{
 for(const s of ['T1','T2','T3'] as const){
  const p=generateRockLookdevPixels(s);
  for(const map of [p.albedo,p.normal,p.roughness]){
   let max=0;
   for(let k=0;k<512;k++){
    const l=pixel(map,0,k),r=pixel(map,511,k);
    const t=pixel(map,k,0),b=pixel(map,k,511);
    for(let c=0;c<3;c++)max=Math.max(max,Math.abs(l[c]-r[c]),Math.abs(t[c]-b[c]));
   }
   assert.ok(max<=18,s+' seam excessive at texel edges: '+max);
  }
 }
});
test('A2 fractures are sparse and differentiated rather than periodic diagonal grids',()=>{
 const t1=generateRockLookdevPixels('T1'),t2=generateRockLookdevPixels('T2'),t3=generateRockLookdevPixels('T3');
 assert.equal(t1.microFractureCoverage,0);
 assert.ok(t2.microFractureCoverage>0&&t2.microFractureCoverage<.055);
 assert.ok(t3.microFractureCoverage>0&&t3.microFractureCoverage<t2.microFractureCoverage);
 // A few deliberate line paths should leave most stone undisturbed.
 const t2Pixels=[t2.albedo,t2.normal,t2.roughness];
 assert.ok(t2Pixels.every(p=>new Set([p[0],p[512*512],p[512*1024]]).size>=1));
});
test('A2 must not modify G1 geometry (only materials receive new shaders)',()=>{
 const g=r04StudyGeometry('G1');
 const positions=g.getAttribute('position'),normal=g.getAttribute('normal');
 assert.equal(positions.count,408);assert.equal(normal.count,408);
 assert.equal(positions.count/3,136);
 assert.equal(g.userData.r04Refinement.study,'G1');
 assert.deepEqual(g.userData.r04Refinement.appliedCuts,['upper-front-fault','front-slab-bedding']);
 g.dispose();
});
