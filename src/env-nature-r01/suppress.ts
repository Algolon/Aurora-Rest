/** Pure post-generation selective suppression. Generator never sees masks.
 * Retained IDs and complete Placement records are identical to source. */
import type {ChunkPopulation,Placement} from '../pop-01/contracts.ts';
import {compositionExcludes,type CompositionMask} from '../pop-01/composition.ts';
export function suppressOnly(source:ChunkPopulation,masks:readonly CompositionMask[]){
 if(!masks.length)return source;
 const kept:Placement[]=source.instances.filter(p=>!compositionExcludes(masks,p.family,p.x,p.z));
 const removed=source.instances.length-kept.length;
 const rejected={...source.rejected,'authored-suppression':removed};
 const out={...source,instances:kept,rejected};
 out.serializedBytes=new TextEncoder().encode(JSON.stringify(out)).length;
 return out;
}
