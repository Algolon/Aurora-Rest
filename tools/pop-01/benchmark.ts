import {readFileSync,writeFileSync} from 'node:fs';
import os from 'node:os';
import {CanonicalEnvironment,type GeoData} from '../../src/pop-01/geography.ts';
import {HeightGrid} from '../../src/geo-r02b/terrain.ts';
import {PopulationGenerator,owner} from '../../src/pop-01/generator.ts';
const floats=(p:string)=>{const b=readFileSync(p);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const data=JSON.parse(readFileSync('public/geo-r02b/features.json','utf8')) as GeoData;
const t=performance.now(),heap0=process.memoryUsage(),geo=new CanonicalEnvironment(data,new HeightGrid(floats('public/geo-r02b/terrain.f32'),1501,2001),floats('public/geo-r02b/water-mesh.f32')),queryInitMs=performance.now()-t,heap1=process.memoryUsage();
const scenarios=[];
for(const r of geo.reviewRegions())for(const density of [.5,1,2])for(const chunkSize of [64,128,256]){
 const gen=new PopulationGenerator(geo,{density,chunkSize}),c=owner(r.x,r.z,chunkSize),rows=[],counts:Record<string,number>={},rejects:Record<string,number>={};let bytes=0,total=0;
 // Fixed 512 × 512 m footprint; different chunk counts compare equivalent area.
 const side=512/chunkSize,start={x:(Math.floor(r.x/256)*256-256)/chunkSize,z:(Math.floor(r.z/256)*256-256)/chunkSize};
 for(let i=0;i<side;i++)for(let j=0;j<side;j++){const p=gen.generate({x:start.x+i,z:start.z+j});rows.push(p.generationMs);bytes+=p.serializedBytes;total+=p.instances.length;for(const v of p.instances)counts[v.family]=(counts[v.family]??0)+1;for(const [k,v] of Object.entries(p.rejected))rejects[k]=(rejects[k]??0)+v;}
 rows.sort((a,b)=>a-b);scenarios.push({region:r,density,chunkSize,chunks:rows.length,footprintM:side*chunkSize,descriptors:total,counts,rejected:rejects,serializedBytes:bytes,totalGenerationMs:rows.reduce((a,b)=>a+b,0),medianChunkMs:rows[Math.floor(rows.length/2)],maxChunkMs:rows.at(-1)});
}
const report={environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0].model,logicalCPUs:os.cpus().length,renderer:'none; CPU placement benchmark',hardwareRisk:'No native Android or desktop GPU FPS measurements'},queryInitMs,memory:{before:heap0,afterQueryBuild:heap1,note:'Process memory snapshots include temporary mesh-edge indexing garbage; serialized descriptor lengths below are NOT heap allocations'},scenarios};
writeFileSync('docs/pop-01/benchmarks.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
