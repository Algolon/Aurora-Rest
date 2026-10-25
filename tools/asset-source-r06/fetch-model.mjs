/** Source-only vendor ingestion for R06. Never fabricate or reconstruct original bytes. */
import {mkdir,writeFile,readFile,copyFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
const out=process.env.R06_OUTPUT??'/tmp/asset-source-r06',dest=resolve('public/asset-source-r06');
await Promise.all([mkdir(out,{recursive:true}),mkdir(dest,{recursive:true})]);
const api='https://api.polyhaven.com',assetId='moss_01';
async function get(url){
 const target=new URL(url);
 if(target.protocol!=='https:'||!['api.polyhaven.com','dl.polyhaven.org'].includes(target.hostname))throw Error('Untrusted model source '+url);
 const r=await fetch(url,{headers:{'User-Agent':'AuroraRest-R06-MossSource/1.0','Accept':'*/*'},signal:AbortSignal.timeout(40000)});
 if(!r.ok)throw Error('Fetch '+r.status+': '+url);
 return Buffer.from(await r.arrayBuffer());
}
const manifest=JSON.parse((await get(api+'/files/'+assetId)).toString('utf8'));
const info=JSON.parse((await get(api+'/info/'+assetId)).toString('utf8'));
if(info.type!==2||!info.authors?.['Rob Tuytel'])throw Error('Original moss model author/type differs');
const chosen=manifest?.gltf?.['1k']?.gltf;
if(!chosen?.url||!chosen?.include)throw Error('Original 1k glTF/manifest dependencies unavailable');
if(!String(chosen.url).endsWith('.gltf'))throw Error('Official 1K source not glTF');
const originalAlpha=manifest?.Alpha?.['1k']?.png;
if(!originalAlpha?.url||!originalAlpha.md5)throw Error('Original feather-edge alpha mask unavailable');
const deps=[['moss_01_1k.gltf',chosen],...Object.entries(chosen.include),['textures/moss_01_alpha_1k.png',originalAlpha]];
const files=[];
for(const [name,entry] of deps){
 if(name.includes('..')||name.startsWith('/')||!/^([\w-]+\/)?[\w.-]+$/.test(name))throw Error('Path traversal or invalid publisher dependency '+name);
 if(typeof entry?.url!=='string'||!/^[0-9a-f]{32}$/i.test(entry?.md5)||!(entry?.size>50&&entry.size<12000000))throw Error('Missing original MD5/size '+name);
 const b=await get(entry.url);
 if(b.length!==entry.size)throw Error('Source size mismatch '+name);
 const md5=createHash('md5').update(b).digest('hex'),sha256=createHash('sha256').update(b).digest('hex');
 if(md5!==entry.md5.toLowerCase())throw Error('Source MD5 mismatch '+name);
 const target=join(dest,name);await mkdir(dirname(target),{recursive:true});await writeFile(target,b);
 const audit=join(out,'model-source',name);await mkdir(dirname(audit),{recursive:true});await writeFile(audit,b);
 files.push({path:name,url:entry.url,bytes:b.length,publisherMD5:entry.md5,verifiedMD5:md5,sha256});
 console.log('ORIGINAL_MOSS_BYTE_VERIFIED',name,b.length,sha256);
}
const raw=JSON.parse(await readFile(join(dest,'moss_01_1k.gltf'),'utf8'));
if(!raw.asset?.version?.startsWith('2.'))throw Error('Not glTF2');
const geometryAudit={
 nodes:raw.nodes?.length,meshes:raw.meshes?.length,materials:raw.materials?.length,
 meshPrimitives:(raw.meshes??[]).map((m,i)=>({mesh:i,primitives:m.primitives.map(p=>({attributes:p.attributes,indices:p.indices,mode:p.mode,material:p.material,extensions:p.extensions}))})),
 accessors:(raw.accessors??[]).map((a,i)=>({id:i,count:a.count,type:a.type,componentType:a.componentType,min:a.min,max:a.max})),
 extensionsUsed:raw.extensionsUsed??[],extensionsRequired:raw.extensionsRequired??[],
 topLevelImages:raw.images?.map(x=>x.uri),buffers:raw.buffers?.map(b=>({uri:b.uri,byteLength:b.byteLength})),
 sourceDimensionsM:(info.dimensions??[]).map(v=>v/1000),
 author:info.authors
};
if(geometryAudit.extensionsRequired.some(e=>!['KHR_texture_transform','EXT_mesh_gpu_instancing','KHR_materials_pbrSpecularGlossiness'].includes(e)))throw Error('Unknown required glTF extension '+geometryAudit.extensionsRequired);
if(!raw.meshes?.length||!raw.accessors?.length)throw Error('glTF no actual geometry');
const prov={milestone:'ASSET-SOURCE-R06',assetId,assetUrl:'https://polyhaven.com/a/moss_01',publisher:'Poly Haven',author:'Rob Tuytel',license:'CC0',officialApi:api+'/files/'+assetId,files,geometryAudit,publisherIntegrityPASS:true,reviewOnly:true};
await Promise.all([writeFile(join(dest,'source_provenance.json'),JSON.stringify(prov,null,2)),writeFile(join(out,'moss_source_provenance.json'),JSON.stringify(prov,null,2))]);
console.log('GLTF_REAL_GEOMETRY_AUDIT',JSON.stringify(geometryAudit).slice(0,6500));
