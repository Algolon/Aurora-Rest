/** One-time load work off the main thread: canonical classification + detail-texture synthesis. */
import {classifyTerrain,classificationHash} from '../terrain-material/classify.ts';
import {geoR02BSource,type GeoR02BFeatures} from '../terrain-material/sources/geo-r02b.ts';
import {MATERIALS} from '../terrain-material/materials.ts';
import {synthesizeMaterial} from '../terrain-material/textures.ts';

export interface WorkerRequest {terrain:ArrayBuffer;water:ArrayBuffer;features:GeoR02BFeatures;textureSizes:number[]}
// Typed locally so the DOM library (used by the rest of src/) is not mixed with the WebWorker library.
const scope=self as unknown as {onmessage:((e:MessageEvent<WorkerRequest>)=>void)|null;postMessage(message:unknown,transfer?:Transferable[]):void};

scope.onmessage=async e=>{
 try{
  const {terrain,water,features,textureSizes}=e.data,t0=performance.now();
  const source=geoR02BSource(new Float32Array(terrain),new Float32Array(water),features);
  const {classification,timingsMs}=classifyTerrain(source);
  const hash=await classificationHash(classification);
  const t1=performance.now(),textures:Record<number,ReturnType<typeof synthesizeMaterial>[]>={};
  for(const size of textureSizes)textures[size]=MATERIALS.map(d=>synthesizeMaterial(d,size));
  const synthesisMs=Math.round(performance.now()-t1);
  const transfer:Transferable[]=[classification.weights.buffer,classification.attributes.buffer];
  for(const list of Object.values(textures))for(const t of list)transfer.push(t.albedo.buffer,t.surface.buffer);
  scope.postMessage({ok:true,classification,hash,timingsMs,synthesisMs,workerTotalMs:Math.round(performance.now()-t0),textures},transfer);
 }catch(err){scope.postMessage({ok:false,error:String((err as Error)?.stack??err)});}
};
