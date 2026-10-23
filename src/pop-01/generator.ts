import type {Chunk,ChunkPopulation,EnvironmentQuery,EnvironmentSample,Family,Placement} from './contracts.ts';
import {compositionExcludes,type CompositionMask} from './composition.ts';
import {community,COMMUNITIES,field,hash,RULES} from './ecology.ts';
export interface PopulationConfig {seed:number;chunkSize:number;density:number;compositionMasks:readonly CompositionMask[]}
export const DEFAULT_CONFIG:PopulationConfig={seed:73129,chunkSize:64,density:1,compositionMasks:[]};
export function chunkKey(c:Chunk){return c.x+','+c.z;}
export function owner(x:number,z:number,size:number):Chunk{return {x:Math.floor(x/size),z:Math.floor(z/size)};}
interface Candidate {id:string;family:Family;x:number;z:number;priority:number;i:number;j:number;layer:number;s:EnvironmentSample;eco:ReturnType<typeof community>}
export class PopulationGenerator {
 readonly config:Readonly<PopulationConfig>;
 readonly geo:EnvironmentQuery;
 constructor(geo:EnvironmentQuery,config:Partial<PopulationConfig>={}){this.geo=geo;this.config=Object.freeze({...DEFAULT_CONFIG,...config,compositionMasks:Object.freeze((config.compositionMasks??[]).map(m=>Object.freeze({...m,families:Object.freeze([...m.families])})))});const c=this.config;if(!Number.isInteger(c.seed)||c.seed<0||c.seed>0xffffffff||!Number.isFinite(c.chunkSize)||c.chunkSize<32||c.chunkSize>512||!Number.isFinite(c.density)||c.density<0||c.density>2)throw RangeError('Invalid population configuration');}
 /** Independent world lattice; chunk size, camera and load order never seed the RNG. */
 private candidate(i:number,j:number,layer:number):Candidate|null {
  const {seed,density}=this.config,cell=layer===0?7:layer===1?2.8:11;
  const x=(i+hash(seed,i,j,layer*20+1))*cell,z=(j+hash(seed,i,j,layer*20+2))*cell;
  if(x<this.geo.bounds.west||x>=this.geo.bounds.east||z<this.geo.bounds.south||z>=this.geo.bounds.north)return null;
  const s=this.geo.sample(x,z),eco=community(s,seed),def=COMMUNITIES[eco.id];
  const family:Family=layer===0?(hash(seed,i,j,8)<def.pine?'pine':'birch'):layer===1?'grass':'rock';
  const isWoodland=eco.id==='birch-woodland'||eco.id==='pine-woodland'||eco.id==='meadow';
  const treeDensity=isWoodland?.025+eco.forest**2*.8:def.trees;
  const base=layer===0?treeDensity:layer===1?def.grass:def.rocks;
  // Smooth density over regional boundaries; nested fields retain glades/soil pockets.
  const patch=eco.patch<.28?0:Math.max(0,Math.min(1,(eco.patch-.25)*2));
  const rockBoost=family==='rock'?.6+Math.min(.7,s.slope)+field(seed,x,z,42,109):1;
  if(hash(seed,i,j,layer*20+4)>=Math.min(1,base*density*patch*rockBoost))return null;
  return {id:`${seed}:${layer}:${i}:${j}`,family,x,z,priority:hash(seed,i,j,layer*20+5),i,j,layer,s,eco};
 }
 private rejection(c:Candidate):string|null {
  const s=c.s,r=RULES[c.family];
  if(compositionExcludes(this.config.compositionMasks,c.family,c.x,c.z))return 'authored-composition';
  if(!s.dry)return s.waterKind==='ocean'?'ocean':'inland-water';
  if(s.elevation>r.maxHeight)return 'treeline/elevation';
  if(s.slope>r.maxSlope)return 'slope';
  if(s.waterDistance<r.waterClearance||s.coastDistance<r.coastClearance)return 'shore-clearance';
  if(s.trailDistance<r.trailClearance)return 'provisional-tread';
  return null;
 }
 generate(chunk:Chunk):ChunkPopulation {
  if(!Number.isInteger(chunk.x)||!Number.isInteger(chunk.z))throw RangeError('Chunk coordinates must be integers');
  const t=performance.now(),key=chunkKey(chunk),size=this.config.chunkSize,instances:Placement[]=[],rejected:Record<string,number>={};let candidates=0;
  const reject=(why:string)=>{rejected[why]=(rejected[why]??0)+1;};
  for(let layer=0;layer<3;layer++){
   const cell=layer===0?7:layer===1?2.8:11;
   // Ephemeral halo cache. No retained world-scale candidate map.
   const cache=new Map<string,Candidate|null>();
   const get=(i:number,j:number)=>{const k=i+','+j;if(!cache.has(k))cache.set(k,this.candidate(i,j,layer));return cache.get(k)!;};
   for(let i=Math.floor(chunk.x*size/cell);i<Math.ceil((chunk.x+1)*size/cell);i++)for(let j=Math.floor(chunk.z*size/cell);j<Math.ceil((chunk.z+1)*size/cell);j++){
    candidates++;const c=get(i,j);if(!c){reject('density/patch/bounds');continue;}
    if(chunkKey(owner(c.x,c.z,size))!==key){reject('neighbor-owner');continue;}
    const invalid=this.rejection(c);if(invalid){reject(invalid);continue;}
    // Matérn-II priority thinning: compare all valid candidates, including across chunk borders.
    // A rejected-by-spacing candidate may suppress another; this is intentional, no recursive RNG.
    let conflict=false;const radius=Math.ceil(RULES[c.family].spacing/cell);
    for(let di=-radius;di<=radius&&!conflict;di++)for(let dj=-radius;dj<=radius;dj++){
     if(!di&&!dj)continue;const b=get(i+di,j+dj);if(!b||this.rejection(b))continue;
     if((b.priority<c.priority||(b.priority===c.priority&&b.id<c.id))&&Math.hypot(c.x-b.x,c.z-b.z)<Math.max(RULES[c.family].spacing,RULES[b.family].spacing)){conflict=true;break;}
    }
    // Trees and rocks share a solid-object exclusion; cover may grow under both.
    if(!conflict&&layer!==1){const otherLayer=layer===0?2:0,otherCell=otherLayer===0?7:11,reach=5.2;
     for(let oi=Math.floor((c.x-reach)/otherCell);oi<=Math.floor((c.x+reach)/otherCell)&&!conflict;oi++)for(let oj=Math.floor((c.z-reach)/otherCell);oj<=Math.floor((c.z+reach)/otherCell);oj++){
      const b=this.candidate(oi,oj,otherLayer);if(!b||this.rejection(b))continue;
      if((b.priority<c.priority||(b.priority===c.priority&&b.id<c.id))&&Math.hypot(c.x-b.x,c.z-b.z)<Math.max(RULES[c.family].spacing,RULES[b.family].spacing)){conflict=true;break;}
     }
    }
    if(conflict){reject('spacing');continue;}
    const h=hash(this.config.seed,i,j,layer*20+9),burial=c.family==='rock'?.12+h*.2:0;
    instances.push({id:c.id,family:c.family,variant:Math.floor(hash(this.config.seed,i,j,layer*20+10)*(layer===0?3:4)),x:c.x,y:c.s.elevation,z:c.z,rotation:h*Math.PI*2,scale:c.family==='grass'?.75+h*.5:c.family==='rock'?.65+h*1.8:.8+h*.45,normal:c.s.normal,alignment:layer===0?'upright':'terrain',burial,tint:.9+hash(this.config.seed,i,j,layer*20+12)*.18,renderClass:layer===0?'tree-lod':layer===1?'near-cover':'rock-lod',chunk:key,metadata:{community:c.eco.id,patch:c.eco.patch,region:c.s.region,slope:c.s.slope,source:this.geo.revision}});
   }
  }
  instances.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  return {key,instances,candidates,rejected,generationMs:performance.now()-t,serializedBytes:new TextEncoder().encode(JSON.stringify(instances)).byteLength};
 }
}
