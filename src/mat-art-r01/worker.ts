/** MAT-ART-R01 stylized texture synthesis off the main thread. The canonical classification is not recomputed:
 * the review reuses the faithful GroundIntegration classification byte for byte. */
import {MAT_ART_R01_DEFINITIONS,synthesizeMatArtR01} from './variant.ts';
import type {SynthesizedTexture} from '../terrain-material/textures.ts';

const scope=self as unknown as {onmessage:((e:MessageEvent<{textureSizes:number[]}>)=>void)|null;postMessage(message:unknown,transfer?:Transferable[]):void};
scope.onmessage=e=>{
 try{
  const t0=performance.now(),textures:Record<number,SynthesizedTexture[]>={},transfer:Transferable[]=[];
  for(const size of e.data.textureSizes){textures[size]=MAT_ART_R01_DEFINITIONS.map(d=>synthesizeMatArtR01(d,size));for(const t of textures[size])transfer.push(t.albedo.buffer,t.surface.buffer);}
  scope.postMessage({ok:true,textures,synthesisMs:Math.round(performance.now()-t0)},transfer);
 }catch(err){scope.postMessage({ok:false,error:String((err as Error)?.stack??err)});}
};
