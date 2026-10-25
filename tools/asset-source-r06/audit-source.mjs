import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.R06_OUTPUT??'/tmp/asset-source-r06';await mkdir(out,{recursive:true});
const headers={'User-Agent':'AuroraRest-R06-CC0-Research/1.0','Accept':'application/json'};
async function read(url){const r=await fetch(url,{headers,signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('API '+r.status+' '+url);return r.json();}
const id='moss_01',site='https://api.polyhaven.com';
const [info,manifest]=await Promise.all([read(site+'/info/'+id),read(site+'/files/'+id)]);
if(info.type!==2)throw Error('Not model'); 
const entries=[];
function descend(node,path=[]){if(!node||typeof node!=='object')return;
 if(typeof node.url==='string'&&typeof node.size==='number'){entries.push({path:path.join('/'),url:node.url,size:node.size,md5:node.md5,include:node.include??null});return;}
 for(const [k,v] of Object.entries(node))descend(v,[...path,k]);
}
descend(manifest);
const summary={
 asset:id,assetInfo:{name:info.name,type:info.type,authors:info.authors,dimensions:info.dimensions,vertices:info.vertices,triangles:info.triangles},
 roots:Object.keys(manifest),
 entries:entries.map(({path,url,size,md5,include})=>({path,size,md5,ext:url.split('?')[0].split('.').at(-1),host:new URL(url).hostname,include:include?JSON.stringify(include).slice(0,900):null})),
 viable:entries.filter(x=>/\.(glb|gltf|fbx|obj|zip)(?:\?|$)/i.test(x.url)&&x.size<65000000).map(x=>({path:x.path,size:x.size,md5:x.md5,host:new URL(x.url).hostname,url:x.url,include:x.include??null}))
};
await writeFile(out+'/model_manifest.json',JSON.stringify(summary,null,2)+'\n');
console.log('R06_VERIFIED_API',JSON.stringify({name:summary.assetInfo.name,authors:summary.assetInfo.authors,roots:summary.roots,total:entries.length,viable:summary.viable.map(({path,size,host})=>({path,size,host})).slice(0,24),first:summary.entries.slice(0,16)}));
