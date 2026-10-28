/** Loads the MAT-ART-R01 stylized textures (512 and 256, matching every quality profile) from a worker. */
import {MAT_ART_R01_DEFINITIONS} from './variant.ts';
import type {VariantSource} from './ground-variant.ts';

export async function loadStylized():Promise<VariantSource&{synthesisMs:number}>{
 const worker=new Worker(new URL('./worker.ts',import.meta.url),{type:'module'});
 try{return await new Promise((resolve,reject)=>{worker.onerror=e=>reject(Error(e.message));
  worker.onmessage=e=>e.data.ok?resolve({definitions:MAT_ART_R01_DEFINITIONS,textures:e.data.textures,synthesisMs:e.data.synthesisMs}):reject(Error(e.data.error));
  worker.postMessage({textureSizes:[512,256]});});}
 finally{worker.terminate();}
}
