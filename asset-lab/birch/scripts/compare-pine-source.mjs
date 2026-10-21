// Independent original Feh Lu We Scots pine source-runtime parity: split + combined.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {createServer} from 'vite';
import {pineReferenceModel,makePineGeometry} from '../src/pine/geometry.ts';
import {BARK_TINT,LEAF_TINT} from '../src/geometry.ts';
const pinned='17eafb0902833fb1121c77083f9f862eb4ffcd96',root=process.env.FLW_ROOT;
if(!root)throw Error('FLW_ROOT required');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),pinned);
const vite=await createServer({root,logLevel:'error',server:{middlewareMode:true},appType:'custom'});
function checksum(a){if(!a)return null;const h=createHash('sha256');h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));return {count:a.count,size:a.itemSize,digest:h.digest('hex')}}
function compare(a,b,where){
 for(const n of ['position','normal','uv','color'])assert.deepEqual(checksum(b.getAttribute(n)),checksum(a.getAttribute(n)),where+'/'+n);
 assert.deepEqual(checksum(b.index),checksum(a.index),where+'/index');
 if(a.boundingSphere&&b.boundingSphere){
  assert.ok(a.boundingSphere.center.distanceTo(b.boundingSphere.center)<1e-7,where+' center');
  assert.ok(Math.abs(a.boundingSphere.radius-b.boundingSphere.radius)<1e-7,where+' radius');
 }
}
function combineSource(model){
 const b=new THREE.Color(BARK_TINT.pine),l=new THREE.Color(LEAF_TINT.pine),ratio=new THREE.Color(b.r/l.r,b.g/l.g,b.b/l.b);
 const c=model.wood.getAttribute('color');
 for(let i=0;i<c.count;i++)c.setXYZ(i,c.getX(i)*ratio.r,c.getY(i)*ratio.g,c.getZ(i)*ratio.b);
 const parts=model.wood.index&&model.leaves.index?[model.wood,model.leaves]:[model.wood,model.leaves].map(g=>g.index?g.toNonIndexed():g);
 const combined=mergeGeometries(parts);
 combined.computeBoundingSphere();
 return combined;
}
const counts=[];
try{
 const mod=await vite.ssrLoadModule('/src/world/woodkit.ts');
 assert.equal(typeof mod.referenceTreeModel,'function');
 for(const v of [0,1,2])for(const lod of ['near','mid','far']){
  const source=mod.referenceTreeModel('pine',v,lod,'outline','trees-r03');
  const target=pineReferenceModel(v,lod,'outline');
  for(const part of ['wood','leaves'])compare(source[part],target[part],v+'/'+lod+'/'+part);
  const sourceCombined=combineSource(source),targetCombined=makePineGeometry(v,lod);
  compare(sourceCombined,targetCombined,v+'/'+lod+'/combined');
  counts.push({variant:v,lod,triangles:(targetCombined.index?.count??0)/3,
   height:targetCombined.boundingBox?.max.y,splitWoodTriangles:(target.wood.index?.count??0)/3,splitFoliageTriangles:(target.leaves.index?.count??0)/3});
  source.wood.dispose();source.leaves.dispose();sourceCombined.dispose();
  target.wood.dispose();target.leaves.dispose();targetCombined.dispose();
 }
 console.log('PINE SOURCE PARITY PASS: original referenceTreeModel pine trees-r03, all split + combined raw attributes, nine models.');
 console.log('PINE SOURCE TRIANGLE COUNTS '+JSON.stringify(counts));
}finally{await vite.close()}
