/** ENV-R02C: committed authored design translated into reversible review-only
 * existing POP placement geometry. Source descriptors are NEVER mutated. */
import type {ChunkPopulation,Placement} from '../pop-01/contracts.ts';
import type {ChunkSink} from '../pop-02a/worker-stream.ts';
import type {CanonicalEnvironment} from '../pop-01/geography.ts';
import {owner} from '../pop-01/generator.ts';
import {GATEWAY,GROVE_OFFSETS} from './design.ts';

type Planned=Placement;
const h=(a:string)=>{let r=2166136261;for(let i=0;i<a.length;i++)r=Math.imul(r^a.charCodeAt(i),16777619);return (r>>>0)/4294967296;};
const close=(x:number,z:number,c:number[])=>Math.hypot(x-c[0],z-c[1]);
function segmentDist(x:number,z:number,a:readonly number[],b:readonly number[]){
 const vx=b[0]-a[0],vz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*vx+(z-a[1])*vz)/(vx*vx+vz*vz)));
 return Math.hypot(x-(a[0]+vx*t),z-(a[1]+vz*t));
}
export function clearance(x:number,z:number){
 const q=GATEWAY.clearing,u=(x-q.x)/q.rx,v=(z-q.z)/q.rz;
 const glade=u*u+v*v<1;
 const tread=GATEWAY.route.some((a,i)=>i<GATEWAY.route.length-1&&segmentDist(x,z,a,GATEWAY.route[i+1])<5.0);
 return glade||tread;
}
export function authoredPositions(){
 const rows:{id:string;family:'birch'|'pine'|'grass';x:number;z:number;scale:number;variant:number}[]=[];
 for(const g of GATEWAY.groves){
  GROVE_OFFSETS.forEach(([dx,dz,scale],i)=>{
   const family=g.family==='mixed'?(i%3===0?'pine':'birch'):g.family;
   const x=g.center[0]+dx*g.scale,z=g.center[1]+dz*g.scale;
   if(clearance(x,z))return;
   rows.push({id:'env-r02c:canopy:'+g.id+':'+i,family,x,z,scale:scale*g.scale*(i%4===0?.84:1),variant:i%3});
  });
  // 2 smaller birch stems per grove, standing along the uneven grove interior edge.
  for(let i=0;i<2;i++){const x=g.center[0]+(i?-.6:.6)*12*g.scale,z=g.center[1]+(i?.7:-.7)*12*g.scale;
   if(!clearance(x,z))rows.push({id:'env-r02c:juvenile:'+g.id+':'+i,family:'birch',x,z,scale:.45+i*.12,variant:i});}
 }
 for(const p of GATEWAY.groundCover){
  // Existing grass geometry repurposed as clumpy low groundcover proxy; no new botanicals claimed.
  for(let i=0;i<48;i++){
    const radial=Math.sqrt((i+.4)/48),angle=i*2.3999632297;
    const x=p.center[0]+Math.cos(angle)*p.rx*radial,z=p.center[1]+Math.sin(angle)*p.rz*radial;
    if(clearance(x,z))continue;
    rows.push({id:'env-r02c:ground:'+p.id+':'+i,family:'grass',x,z,scale:.88+(i%5)*.105,variant:i%4});
  }
 }
 return rows;
}
export function makeAuthoredInstances(geo:CanonicalEnvironment):Placement[]{
 return authoredPositions().flatMap(p=>{
  const sample=geo.sample(p.x,p.z);
  // Respect canonical land/water, steep terrain and water clearance.
  if(!sample.dry||sample.slope>.52||sample.waterDistance<3.5)return [];
  const chunk=owner(p.x,p.z,64);const shade=h(p.id);
  return [{id:p.id,family:p.family,variant:p.variant,x:p.x,y:sample.elevation,z:p.z,
    rotation:shade*Math.PI*2,scale:p.scale,normal:sample.normal,alignment:p.family==='grass'?'terrain':'upright',
    burial:0,tint:.92+shade*.12,renderClass:p.family==='grass'?'near-cover':'tree-lod',
    chunk:chunk.x+','+chunk.z,metadata:{community:'birch-woodland',patch:1,region:sample.region,
    slope:sample.slope,source:'env-r02c-review-only'} } as Placement];
 });
}
export function composeChunk(source:ChunkPopulation,planned:readonly Placement[],enabled:boolean){
 if(!enabled)return{chunk:source,hidden:[] as string[],added:[] as string[]};
 const kept:Placement[]=[],hidden:string[]=[];
 for(const p of source.instances){
  if((p.family==='birch'||p.family==='pine')&&clearance(p.x,p.z)){hidden.push(p.id);continue;}
  kept.push(p);
 }
 const added=planned.filter(p=>p.chunk===source.key);
 if(!hidden.length&&!added.length)return{chunk:source,hidden,added:[] as string[]};
 return{chunk:{...source,instances:[...kept,...added],serializedBytes:0},hidden,added:added.map(p=>p.id)};
}
export class AuthoredGatewaySink implements ChunkSink{
 readonly originals=new Map<string,ChunkPopulation>();private rendered=new Map<string,ChunkPopulation>();
 readonly planned:Placement[];enabled=false;private sink:ChunkSink;
 constructor(sink:ChunkSink,geo:CanonicalEnvironment){this.sink=sink;this.planned=makeAuthoredInstances(geo);}
 attach(p:ChunkPopulation){
  if(this.originals.has(p.key))throw Error('Duplicate composition chunk '+p.key);
  const edited=composeChunk(p,this.planned,this.enabled).chunk;
  this.sink.attach(edited);this.originals.set(p.key,p);this.rendered.set(p.key,edited);
 }
 detach(key:string){if(!this.originals.has(key))return;this.sink.detach(key);this.originals.delete(key);this.rendered.delete(key);}
 setEnabled(value:boolean){
  if(this.enabled===value)return;this.enabled=value;
  for(const [key,source] of this.originals){
   const edited=composeChunk(source,this.planned,value).chunk;
   if(this.rendered.get(key)===edited)continue;
   this.sink.detach(key);this.sink.attach(edited);this.rendered.set(key,edited);
  }
 }
 snapshot(){
  const originals=[...this.originals.values()].flatMap(p=>p.instances),rendered=[...this.rendered.values()].flatMap(p=>p.instances);
  const orig=new Set(originals.map(p=>p.id)),now=new Set(rendered.map(p=>p.id)),hidden=originals.filter(p=>!now.has(p.id)),added=rendered.filter(p=>!orig.has(p.id));
  return{version:GATEWAY.version,enabled:this.enabled,originalCount:originals.length,renderedCount:rendered.length,
   hiddenCount:hidden.length,addedCount:added.length,addedTrees:added.filter(p=>p.family!=='grass').length,
   addedGrass:added.filter(p=>p.family==='grass').length,hiddenIds:hidden.map(p=>p.id).sort(),addedIds:added.map(p=>p.id).sort(),
   canonicalIds:originals.map(p=>p.id).sort(),plannedTotal:this.planned.length};
 }
}
