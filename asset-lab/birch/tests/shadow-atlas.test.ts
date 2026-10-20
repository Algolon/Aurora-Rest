import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {makeBirchGeometry} from '../src/geometry.ts';

// Shadow-pass atlas coordinate contract. Geometry and colours are unmodified:
// opaque bark stays under the atlas foliage marker, leaves remain beyond it.
test('each birch LOD preserves bark and spray atlas UV domains',()=>{
 for(const variant of [0,1,2] as const)for(const lod of ['near','mid','far'] as const){
  const g=makeBirchGeometry(variant,lod);
  const uv=g.getAttribute('uv') as THREE.BufferAttribute;
  let bark=0,sprays=0;
  for(let i=0;i<uv.count;i++){
   const u=uv.getX(i),v=uv.getY(i);
   if(u>127){sprays++;assert.ok(u>=128&&u<=129,`atlas spray tile moved: ${variant}/${lod}/${u}`);assert.ok(v>=0&&v<=1)}
   else bark++;
  }
  assert.ok(bark>0&&sprays>0,`missing bark/foliage in ${variant}/${lod}`);
  g.dispose();
 }
});
