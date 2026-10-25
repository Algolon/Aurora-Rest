/**
 * ASSET-SOURCE-R05 — fail-closed supplier ingestion.
 * Official Poly Haven Public API, no guessed file paths and no external model aggregation.
 * Only three 1K PBR maps from original CC0 publisher are downloaded to a temporary CI workspace.
 * Their original publisher MD5 digests are verified before any WebGL screenshot is permitted.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const id='forest_leaves_02',root=process.cwd(),publicDir=join(root,'public','asset-source-r05');
const outDir=process.env.R05_OUTPUT??'/tmp/asset-source-r05';
await mkdir(publicDir,{recursive:true});await mkdir(outDir,{recursive:true});
const http=async(url)=>{
 for(let retry=0;retry<3;retry++){
  try{
   const response=await fetch(url,{headers:{'User-Agent':'AuroraRest-R05-CC0-Evaluation/1.0 (asset audit; https://github.com/Algolon/Aurora-Rest)','Accept':'application/json'},signal:AbortSignal.timeout(25000)});
   if(!response.ok)throw Error('HTTP '+response.status+' '+url);
   return response;
  }catch(err){if(retry===2)throw err;await new Promise(r=>setTimeout(r,800*(retry+1)));}
 }
};
const api='https://api.polyhaven.com';
const [info,files]=await Promise.all([http(api+'/info/'+id).then(r=>r.json()),http(api+'/files/'+id).then(r=>r.json())]);
if(!info||typeof info!=='object'||!files||typeof files!=='object')throw Error('Publisher metadata invalid');
if(info.type!==1)throw Error('Publisher asset is not a PBR texture');
const list=[];
function walk(node,path=[]){
 if(node&&typeof node==='object'){
  if(typeof node.url==='string'&&typeof node.size==='number'){list.push({path:path.join('/'),...node});return;}
  for(const [k,v]of Object.entries(node)){if(k==='include')continue;walk(v,[...path,k]);}
 }
}
walk(files);
const categories={
 diffuse:path=>/(^|\/)(diffuse|diff|albedo|base.?color)(\/|$)/i.test(path),
 normal:path=>/(^|\/)(nor_gl|normal.?gl|normal.*opengl)(\/|$)/i.test(path),
 roughness:path=>/(^|\/)(rough|roughness)(\/|$)/i.test(path)
};
const found={};let usedUrls=new Set();
for(const [kind,filter]of Object.entries(categories)){
 const matches=list.filter(f=>{
  const s=f.path.toLowerCase();
  return filter(s)&&/(^|\/)1k(\/|$)/i.test(s)&&/\.(jpg|jpeg|png)(\?|$)/i.test(f.url)&&/\/(jpg|jpeg|png)(\/|$)/i.test(s);
 }).sort((a,b)=>{
   const aa=/\.jpg(?:\?|$)/.test(a.url)?0:1,bb=/\.jpg(?:\?|$)/.test(b.url)?0:1;return aa-bb||a.size-b.size;
 });
 if(!matches.length)throw Error('Required '+kind+' 1k photo asset absent from official publisher manifest. Available candidates: '+list.filter(f=>filter(f.path)).slice(0,12).map(f=>f.path).join(', '));
 const entry=matches[0],src=new URL(entry.url);
 if(src.protocol!=='https:'||!['dl.polyhaven.org','cdn.polyhaven.com'].includes(src.hostname))throw Error('Unapproved publisher CDN host '+entry.url);
 if(entry.size>5500000||entry.size<1024)throw Error('Unexpected '+kind+' transfer size '+entry.size);
 if(!/^[0-9a-f]{32}$/i.test(entry.md5??''))throw Error('Publisher MD5 unavailable for '+kind);
 if(usedUrls.has(entry.url))throw Error('Duplicate source URL cross channel');
 usedUrls.add(entry.url);
 const response=await http(entry.url),buffer=Buffer.from(await response.arrayBuffer());
 if(buffer.length!==entry.size)throw Error(kind+' length does not match publisher manifest '+buffer.length+' vs '+entry.size);
 const md5=createHash('md5').update(buffer).digest('hex');
 if(md5!==entry.md5.toLowerCase())throw Error(kind+' bytes do not match publisher MD5!');
 const sha256=createHash('sha256').update(buffer).digest('hex');
 const ext=src.pathname.toLowerCase().endsWith('.png')?'png':'jpg';
 const filename=id+'_'+kind+'_1k.'+ext;
 await writeFile(join(publicDir,filename),buffer);
 found[kind]={originalSourceUrl:entry.url,publisherManifestPath:entry.path,filename,localUrl:'/asset-source-r05/'+filename,bytes:buffer.length,publisherMd5:entry.md5.toLowerCase(),actualMd5:md5,sha256,sourceVerified:true};
 console.log('CC0_SOURCE_VERIFIED',kind,filename,buffer.length,sha256);
}
const provenance={
 milestone:'ASSET-SOURCE-R05',assetId:id,assetPage:'https://polyhaven.com/a/'+id,
 publisher:'Poly Haven',author:'Rob Tuytel',license:'CC0 1.0',
 publisherLicensePage:'https://polyhaven.com/license',apiManifestUrl:api+'/files/'+id,
 metadata:info.name,metadataType:info.type,resolution:'1k',
 credit:'Powered by Poly Haven',maps:found,
 sourceRenderingAssetsDownloaded:true,wasRehostedInGit:false,provenanceVerified:true,
 verifiedAtUtc:new Date().toISOString()
};
const json=JSON.stringify(provenance,null,2)+'\n';
await writeFile(join(publicDir,'source_provenance.json'),json);
await writeFile(join(outDir,'source_provenance.json'),json);
await Promise.all(Object.values(found).map(async f=>{const {copyFile}=await import('node:fs/promises');await copyFile(join(publicDir,f.filename),join(outDir,f.filename));}));
