/** ENV-R02B: isolated, rendered-only authored woodland composition.
 * No canonical regeneration, changes of transforms, asset edits or biome changes.
 * All spatial numbers are offsets in metres from canonical 'forest' anchor.
 */
import type {ChunkPopulation,Placement} from '../pop-01/contracts.ts';
import type {ChunkSink} from '../pop-02a/worker-stream.ts';

export const PLAN = Object.freeze({
  version:'env-r02b-birchwood-opening-v1',
  center:[35,-12] as readonly [number,number],
  gladeRadii:[36,27] as readonly [number,number],
  route:[[ -18,12 ],[ 8,0 ],[ 42,-17 ],[ 73,-33 ]] as readonly (readonly [number,number])[],
  ribbonHalfWidthM:17, thinning:0.95,
  preservedCameraRadiusM:10,
});
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
const idRandom=(id:string)=>{let h=2166136261;for(let i=0;i<id.length;i++){h^=id.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0)/4294967296;};
function distanceSegment(x:number,z:number,a:readonly number[],b:readonly number[]){
  const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));
  return {distance:Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz),t};
}
/** Removal probability 0 outside the intentional glade and its meandering visual window. */
export function thinningAt(x:number,z:number,forestX:number,forestZ:number){
 const u=x-forestX,v=z-forestZ,c=PLAN.center;
 // Preserve the immediate trunk composition at both source review camera points.
 if(Math.hypot(u+25,v-25)<PLAN.preservedCameraRadiusM || Math.hypot(u-85,v+40)<PLAN.preservedCameraRadiusM) return 0;
 const wx=u+2.7*Math.sin(v*.065),wz=v+2.1*Math.sin(u*.049);
 const qx=(wx-c[0])/PLAN.gladeRadii[0],qz=(wz-c[1])/PLAN.gladeRadii[1];
 const ellipse=Math.max(0,1-qx*qx-qz*qz);
 const clearing=.90*smooth(ellipse*1.85);
 let ribbon=0;
 for(let i=0;i<PLAN.route.length-1;i++){
  const {distance,t}=distanceSegment(wx,wz,PLAN.route[i],PLAN.route[i+1]);
  const endFade=(i===0?smooth(t*2):1)*(i===PLAN.route.length-2?smooth((1-t)*2):1);
  const width=PLAN.ribbonHalfWidthM*(.8+.32*Math.sin(t*Math.PI+i*1.4));
  const rr=1-distance/width;
  ribbon=Math.max(ribbon,endFade*.75*smooth(rr));
 }
 return Math.max(clearing,ribbon)*PLAN.thinning;
}
export function composeChunk(source:ChunkPopulation,enabled:boolean,forestX:number,forestZ:number){
 if(!enabled)return{chunk:source,removed:[] as string[]};
 const removed:string[]=[],kept:Placement[]=[];
 for(const p of source.instances){
  const chance=(p.family==='birch'||p.family==='pine')?thinningAt(p.x,p.z,forestX,forestZ):0;
  if(chance>idRandom(p.id)){removed.push(p.id);continue;}
  kept.push(p);
 }
 if(!removed.length)return{chunk:source,removed};
 return {chunk:{...source,instances:kept,serializedBytes:new TextEncoder().encode(JSON.stringify(kept)).length},removed};
}
/** Reversible sink: the stream retains original source chunks; only renderer receives a filtered copy. */
export class WoodlandCompositionSink implements ChunkSink{
  readonly originals=new Map<string,ChunkPopulation>();
  private rendered=new Map<string,ChunkPopulation>();
  enabled=false;
  private sink:ChunkSink;readonly forestX:number;readonly forestZ:number;
  constructor(sink:ChunkSink,forestX:number,forestZ:number){this.sink=sink;this.forestX=forestX;this.forestZ=forestZ;}
  attach(p:ChunkPopulation){if(this.originals.has(p.key))throw Error('Duplicate composition chunk '+p.key);
    const c=composeChunk(p,this.enabled,this.forestX,this.forestZ);
    this.sink.attach(c.chunk);this.originals.set(p.key,p);this.rendered.set(p.key,c.chunk);
  }
  detach(key:string){if(!this.originals.has(key))return;this.sink.detach(key);this.originals.delete(key);this.rendered.delete(key);}
  setEnabled(value:boolean){
    if(this.enabled===value)return;this.enabled=value;
    for(const [key,source] of this.originals){
      const c=composeChunk(source,value,this.forestX,this.forestZ);
      // Keep unchanged chunks and GPU render pages: the pilot should rebuild only affected locations.
      if(this.rendered.get(key)===c.chunk)continue;
      this.sink.detach(key);this.sink.attach(c.chunk);this.rendered.set(key,c.chunk);
    }
  }
  snapshot(){
    const source=[...this.originals.values()].flatMap(p=>p.instances),rendered=[...this.rendered.values()].flatMap(p=>p.instances),
      retained=new Set(rendered.map(p=>p.id)),hidden=source.filter(p=>!retained.has(p.id));
    return {enabled:this.enabled,version:PLAN.version,originalCount:source.length,renderedCount:rendered.length,
      hiddenCount:hidden.length,hiddenBirch:hidden.filter(p=>p.family==='birch').length,hiddenPine:hidden.filter(p=>p.family==='pine').length,
      hiddenIds:hidden.map(p=>p.id).sort(),originalIds:source.map(p=>p.id).sort(),renderedIds:rendered.map(p=>p.id).sort()};
  }
}
