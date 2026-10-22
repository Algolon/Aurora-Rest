/** GEO-R02C-A1a opt-in terrain variants (?terrain=a1a-m0|a1a-v1|a1a-v2|a1a-v3). Without the parameter nothing is fetched and
 * the canonical R1 heights are used unchanged. A variant is composed by copying its exact float32 patch block into the
 * R1 grid (no arithmetic), then the whole grid is hashed and compared with the manifest's terrain SHA-256. */
export interface VariantInfo {id:string;label:string;terrainSha256:string;expectedSha256:string;verified:boolean;changedCells:number}
export interface VariantPatch {file:string;rows:[number,number];cols:[number,number];sha256:string;bytes:number}
export interface VariantEntry {id:string;label:string;terrainSha256:string;changedCells:number;patch:VariantPatch|null}

export function variantId(search:string):string|null{
 const v=new URLSearchParams(search).get('terrain');return v&&/^a1a-(m0|v[1-3])$/.test(v)?v.slice(4):null;
}
/** Copies a patch block into a row-major grid of the given width (exact float copy). */
export function applyPatch(heights:Float32Array,width:number,patch:VariantPatch,block:Float32Array){
 const [j0,j1]=patch.rows,[i0,i1]=patch.cols,w=i1-i0+1;if(block.length!==(j1-j0+1)*w)throw new Error('A1a patch size mismatch');
 for(let j=j0;j<=j1;j++)heights.set(block.subarray((j-j0)*w,(j-j0+1)*w),j*width+i0);
}
export async function sha256Hex(view:ArrayBufferView){
 const d=await crypto.subtle.digest('SHA-256',view as unknown as BufferSource);return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function applyVariant(search:string,heights:Float32Array,width:number):Promise<VariantInfo|null>{
 const id=variantId(search);if(!id)return null;
 const manifest=await (await fetch('/geo-r02c-a1a/manifest.json')).json() as {variants:Record<string,VariantEntry>};const e=manifest.variants[id];
 if(!e)throw new Error('Unknown A1a variant '+id);
 if(e.patch)applyPatch(heights,width,e.patch,new Float32Array(await (await fetch('/geo-r02c-a1a/'+e.patch.file)).arrayBuffer()));
 const sha=await sha256Hex(heights);if(sha!==e.terrainSha256)throw new Error(`A1a variant ${id} does not match its manifest SHA-256`);
 return {id,label:e.label,terrainSha256:sha,expectedSha256:e.terrainSha256,verified:true,changedCells:e.changedCells};
}
