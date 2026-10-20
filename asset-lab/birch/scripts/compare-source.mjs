// Executed against the original pinned Feh Lu We module, not a re-implementation.
// CI materializes Feh Lu We into a READ-ONLY temporary checkout outside Aurora's repo.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {birchReferenceModel} from '../src/geometry.ts';
const pinned='17eafb0902833fb1121c77083f9f862eb4ffcd96',root=process.env.FLW_ROOT;
if(!root)throw Error('FLW_ROOT required: original source checkout missing');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
assert.equal(sha,pinned,'pinned original commit must match');
const server=await createServer({root,logLevel:'error',server:{middlewareMode:true},appType:'custom'});
function checksum(attr){
 if(!attr)return null;
 const h=createHash('sha256');h.update(Buffer.from(attr.array.buffer,attr.array.byteOffset,attr.array.byteLength));
 return {itemSize:attr.itemSize,count:attr.count,digest:h.digest('hex')};
}
function compare(g0,g1,variant,lod,part){
 for(const name of ['position','normal','uv','color']){
  const a=checksum(g0.getAttribute(name)),b=checksum(g1.getAttribute(name));
  assert.deepEqual(b,a,`variant=${variant} lod=${lod} part=${part} attribute=${name}`);
 }
 assert.deepEqual(checksum(g1.index),checksum(g0.index),`indices variant=${variant} lod=${lod} part=${part}`);
 if(g0.boundingSphere&&g1.boundingSphere){
  assert.ok(g0.boundingSphere.center.distanceTo(g1.boundingSphere.center)<1e-7,'bounding-sphere centre');
  assert.ok(Math.abs(g0.boundingSphere.radius-g1.boundingSphere.radius)<1e-7,'bounding-sphere radius');
 }
}
try {
 const source=await server.ssrLoadModule('/src/world/woodkit.ts');
 assert.equal(typeof source.referenceTreeModel,'function','original referenceTreeModel unavailable');
 for(const v of [0,1,2])for(const lod of ['near','mid','far']){
  const original=source.referenceTreeModel('birch',v,lod,'outline','trees-r03');
  const aurora=birchReferenceModel(v,lod,'outline');
  for(const part of ['wood','leaves'])compare(original[part],aurora[part],v,lod,part);
  original.wood.dispose();original.leaves.dispose();aurora.wood.dispose();aurora.leaves.dispose();
 }
 console.log('SOURCE GEOMETRY PARITY PASS: 3 variants x 3 unique LODs x wood/leaves; position, normal, uv, color, index, bound spheres match original pinned module.');
} finally {await server.close();}
