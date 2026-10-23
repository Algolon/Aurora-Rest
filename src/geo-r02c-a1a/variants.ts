/** GEO-R02C opt-in review terrain variants. A1a: ?terrain=a1a-m0|a1a-v1|a1a-v2|a1a-v3; A1b-alpha: ?terrain=a1b-m0|a1b-alpha; A1c: ?terrain=a1c-m0|a1c-s1.
 * Without the parameter nothing is fetched and the canonical R1 heights are used unchanged. A variant is composed by copying
 * its exact float32 patch block into the R1 grid (no arithmetic), then the whole grid is hashed and compared with the
 * manifest's terrain SHA-256. */
export interface VariantInfo {id:string;family:VariantFamily;key:string;label:string;terrainSha256:string;expectedSha256:string;baselineSha256:string;verified:boolean;changedCells:number}
export interface VariantPatch {file:string;rows:[number,number];cols:[number,number];sha256:string;bytes:number}
export interface VariantEntry {id:string;label:string;terrainSha256:string;changedCells:number;patch:VariantPatch|null}
export type VariantFamily='a1a'|'a1b'|'a1c';
const FAMILIES:Record<VariantFamily,{pattern:RegExp;base:string}>={
 a1a:{pattern:/^a1a-(m0|v[1-3])$/,base:'/geo-r02c-a1a/'},
 a1b:{pattern:/^a1b-(m0|alpha)$/,base:'/geo-r02c-a1b/'},
 a1c:{pattern:/^a1c-(m0|s1)$/,base:'/geo-r02c-a1c/'}
};
export function variantRef(search:string):{family:VariantFamily;id:string}|null{
 const v=new URLSearchParams(search).get('terrain');if(!v)return null;
 for(const family of Object.keys(FAMILIES) as VariantFamily[])if(FAMILIES[family].pattern.test(v))return {family,id:v.slice(4)};
 return null;
}
/** A1a variant id (m0, v1, v2, v3) or null; other families are not A1a ids. */
export function variantId(search:string):string|null{const r=variantRef(search);return r&&r.family==='a1a'?r.id:null;}
/** Terrain identity reported by the viewer: the active (displayed) terrain hash, the canonical R1 baseline and the variant key. */
export function terrainIdentity(variant:VariantInfo|null,baselineSha256:string){
 return {terrainSha256:variant?variant.terrainSha256:baselineSha256,baselineTerrainSha256:baselineSha256,activeTerrain:variant?variant.key:'r1'};
}
/** Copies a patch block into a row-major grid of the given width (exact float copy). */
export function applyPatch(heights:Float32Array,width:number,patch:VariantPatch,block:Float32Array){
 const [j0,j1]=patch.rows,[i0,i1]=patch.cols,w=i1-i0+1;if(block.length!==(j1-j0+1)*w)throw new Error('Variant patch size mismatch');
 for(let j=j0;j<=j1;j++)heights.set(block.subarray((j-j0)*w,(j-j0+1)*w),j*width+i0);
}
export async function sha256Hex(view:ArrayBufferView){
 const d=await crypto.subtle.digest('SHA-256',view as unknown as BufferSource);return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function applyVariant(search:string,heights:Float32Array,width:number,baselineSha256='fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a'):Promise<VariantInfo|null>{
 const ref=variantRef(search);if(!ref)return null;const {family,id}=ref,base=FAMILIES[family].base;
 const manifest=await (await fetch(base+'manifest.json')).json() as {baseTerrainSha256:string;variants:Record<string,VariantEntry>};const e=manifest.variants[id];
 if(!e)throw new Error(`Unknown ${family} variant ${id}`);
 if(manifest.baseTerrainSha256!==baselineSha256)throw new Error(`${family} manifest is not based on the loaded R1 terrain`);
 if(e.patch)applyPatch(heights,width,e.patch,new Float32Array(await (await fetch(base+e.patch.file)).arrayBuffer()));
 const sha=await sha256Hex(heights);if(sha!==e.terrainSha256)throw new Error(`${family} variant ${id} does not match its manifest SHA-256`);
 return {id,family,key:`${family}-${id}`,label:e.label,terrainSha256:sha,expectedSha256:e.terrainSha256,baselineSha256,verified:true,changedCells:e.changedCells};
}
