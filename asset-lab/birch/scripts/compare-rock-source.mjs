/** Independent pinned Feh Lu We rockModel runtime vs Aurora source adaptation.
 * Set FLW_ROOT to checked-out Git worktree at exact production commit. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {rockModel,PRODUCTION_ROCK_SEEDS} from '../src/rocks/productionRock.ts';
const pin='17eafb0902833fb1121c77083f9f862eb4ffcd96',root=process.env.FLW_ROOT;
if(!root)throw Error('FLW_ROOT required: independently load pinned production generator');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),pin);
const oldLocation=globalThis.location;
globalThis.location={search:'?vegstyle=woodland-r02&vegdetail=r05&gardenart=r09',href:'http://localhost/?vegstyle=woodland-r02&vegdetail=r05&gardenart=r09',pathname:'/'};
const server=await createServer({root,logLevel:'error',server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true}});
const checksum=a=>a?{size:a.itemSize,count:a.count,hash:createHash('sha256').update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength)).digest('hex')}:null;
const results=[];
try{
 const source=await server.ssrLoadModule('/src/world/woodkit.ts');
 assert.equal(typeof source.rockModel,'function','Must run actual FLW woodkit.ts rockModel');
 for(const seed of PRODUCTION_ROCK_SEEDS){
  const a=source.rockModel(seed),b=rockModel(seed);
  for(const key of ['position','normal','color','uv']){
   assert.deepEqual(checksum(a.getAttribute(key)),checksum(b.getAttribute(key)),seed+'/'+key);
  }
  assert.deepEqual(checksum(a.index),checksum(b.index),seed+'/index');
  for(const g of [a,b]){g.computeBoundingBox();g.computeBoundingSphere();}
  const bounds=g=>({box:[...g.boundingBox.min.toArray(),...g.boundingBox.max.toArray()],
   sphere:[...g.boundingSphere.center.toArray(),g.boundingSphere.radius]});
  assert.deepEqual(bounds(a),bounds(b),seed+'/bounds');
  const verts=a.getAttribute('position').count;
  const report={seed,triangles:(a.index?.count??verts)/3,vertices:verts,indexed:!!a.index,
   dimensions:a.boundingBox.getSize({x:0,y:0,z:0,toArray(){return [this.x,this.y,this.z]}}).toArray(),
   checksums:Object.fromEntries(['position','normal','uv','color'].map(k=>[k,checksum(a.getAttribute(k)).hash]))};
  results.push(report);a.dispose();b.dispose();
 }
 console.log('ROCK SOURCE PARITY PASS '+JSON.stringify({sourcePin:pin,results}));
}finally{await server.close();if(oldLocation===undefined)delete globalThis.location;else globalThis.location=oldLocation;}
