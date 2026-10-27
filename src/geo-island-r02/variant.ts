/** GEO-ISLAND-R02 opt-in northern B2a preview.
 * Canonical R1 is returned untouched unless enabled. The exact B2a absolute
 * float32 patch is copied, never sculpted or blended, and SHA-256-verified.
 * Only a review source adapter, not an approved island geometry freeze. */
export interface R02VariantInfo {
  key:'b2a-a'; sha256:string; changedCells:number; baselineSha256:string;
}
const BASE='fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a';
async function sha256(buffer:ArrayBufferView){
  const digest=await crypto.subtle.digest('SHA-256',buffer as unknown as BufferSource);
  return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
}
export async function applyR02Preview(heights:Float32Array,width:number,enabled:boolean):Promise<R02VariantInfo|null>{
  if(!enabled)return null;
  if(await sha256(heights)!==BASE)throw Error('GEO-ISLAND-R02: source terrain differs from protected R1');
  const r=await fetch('/geo-r02c-b2a/manifest.json');
  if(!r.ok)throw Error('GEO-ISLAND-R02: missing B2a manifest');
  const manifest=await r.json() as {
    baseTerrainSha256:string;
    variants:{a:{terrainSha256:string;changedCells:number;patch:{
      file:string;sha256:string;bytes:number;rows:[number,number];cols:[number,number]}}}
  };
  if(manifest.baseTerrainSha256!==BASE)throw Error('GEO-ISLAND-R02: B2a baseline mismatch');
  const v=manifest.variants.a,p=v.patch;
  const response=await fetch('/geo-r02c-b2a/'+p.file);
  if(!response.ok)throw Error('GEO-ISLAND-R02: missing B2a patch');
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength!==p.bytes)throw Error('GEO-ISLAND-R02: patch length mismatch');
  if(await sha256(new Uint8Array(bytes))!==p.sha256)throw Error('GEO-ISLAND-R02: patch SHA mismatch');
  const patch=new Float32Array(bytes),[j0,j1]=p.rows,[i0,i1]=p.cols,w=i1-i0+1;
  if(i0<0||j0<0||i1>=width||j1*width+i1>=heights.length||patch.length!==(j1-j0+1)*w)
    throw Error('GEO-ISLAND-R02: patch coordinates outside canonical terrain');
  for(let j=j0;j<=j1;j++) heights.set(patch.subarray((j-j0)*w,(j-j0+1)*w),j*width+i0);
  const digest=await sha256(heights);
  if(digest!==v.terrainSha256)throw Error('GEO-ISLAND-R02: composed terrain hash mismatch');
  return {key:'b2a-a',sha256:digest,changedCells:v.changedCells,baselineSha256:BASE};
}
