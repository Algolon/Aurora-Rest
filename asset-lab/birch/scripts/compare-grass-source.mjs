// Independent pin-correct Feh Lu We runtime vs Aurora production grass.
// Crucial: source flags derive from browser location; Node missing location silently
// sets GARDEN_DETAIL / INTERIOR_GREEN false. Set globals BEFORE Vite SSR imports.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {makeGrassGeometry} from '../src/grass/geometry.ts';
const pin='17eafb0902833fb1121c77083f9f862eb4ffcd96',root=process.env.FLW_ROOT;
if(!root)throw Error('FLW_ROOT is required: must load pinned real source runtime');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),pin);
const before=globalThis.location;
globalThis.location={search:'?vegstyle=woodland-r02&vegdetail=r05&gardenart=r09',href:'http://localhost/?vegstyle=woodland-r02&vegdetail=r05&gardenart=r09',pathname:'/'};
const server=await createServer({root,logLevel:'error',server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true}});
const checksum=a=>a?{size:a.itemSize,count:a.count,hash:createHash('sha256').update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength)).digest('hex')}:null;
const data=[];
try{
 const style=await server.ssrLoadModule('/src/world/foliageStyle.ts');
 const garden=await server.ssrLoadModule('/src/world/gardenkit.ts');
 const indoor=await server.ssrLoadModule('/src/world/indoorPlants.ts');
 const module=await server.ssrLoadModule('/src/world/woodkit.ts');
 const flags={NATURE_STYLE:style.NATURE_STYLE,FULL_NATURE:style.FULL_NATURE,VEGETATION_DETAIL:style.VEGETATION_DETAIL,
  GROUND_DETAIL:style.GROUND_DETAIL,GARDEN_DETAIL:garden.GARDEN_DETAIL,INTERIOR_GREEN:garden.INTERIOR_GREEN};
 assert.deepEqual(flags,{NATURE_STYLE:'woodland-r02',FULL_NATURE:true,VEGETATION_DETAIL:true,
  GROUND_DETAIL:true,GARDEN_DETAIL:true,INTERIOR_GREEN:true},'Must match production browser flags');
 assert.equal(typeof module.referencePlantModel,'function');
 assert.deepEqual(indoor.WHITE_LEAF_UV,[.875,.25]);
 for(const variant of [0,1,2,3]){
  const src=module.referencePlantModel('grass',variant,true,true);
  const dest=makeGrassGeometry(variant,'flw-production-reference');
  for(const key of ['position','normal','color','uv']){
   assert.deepEqual(checksum(dest.getAttribute(key)),checksum(src.getAttribute(key)),variant+'/'+key);
  }
  assert.deepEqual(checksum(dest.index),checksum(src.index),variant+'/index');
  src.computeBoundingBox();src.computeBoundingSphere();
  dest.computeBoundingBox();dest.computeBoundingSphere();
  const fmt=g=>({box:[...g.boundingBox.min.toArray(),...g.boundingBox.max.toArray()],sphere:[...g.boundingSphere.center.toArray(),g.boundingSphere.radius]});
  assert.deepEqual(fmt(dest),fmt(src),variant+'/bounds');
  const pos=src.getAttribute('position'),uv=src.getAttribute('uv');
  assert.ok(uv && pos.count>0,'Source production geometry must contain UV');
  data.push({variant,vertices:pos.count,triangles:src.index?src.index.count/3:pos.count/3,indexed:!!src.index,
   bytes:Object.values(src.attributes).reduce((x,a)=>x+a.array.byteLength,0)+(src.index?.array.byteLength??0),
   boundingBox:[...src.boundingBox.min.toArray(),...src.boundingBox.max.toArray()],maxHeight:src.boundingBox.max.y,
   uvHash:checksum(uv).hash,positionHash:checksum(pos).hash});
  src.dispose();dest.dispose();
 }
 // Diagnostic, deliberately not used for production acceptance.
 const diagnostics=[];
 for(const mode of ['basic-grass-model','refined-ground-r05']){
  const g=makeGrassGeometry(2,mode);
  diagnostics.push({mode,vertices:g.getAttribute('position').count,hasUV:!!g.getAttribute('uv')});
  g.dispose();
 }
 console.log('GRASS SOURCE PARITY PASS '+JSON.stringify({pin,flags,data,diagnostics}));
}finally{await server.close();if(before===undefined)delete globalThis.location;else globalThis.location=before}
