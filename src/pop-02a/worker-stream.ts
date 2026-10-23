import type {ChunkPopulation} from '../pop-01/contracts.ts';
import {chunkKey,owner,type PopulationConfig} from '../pop-01/generator.ts';
export interface WorkerPort {postMessage(value:unknown):void;terminate():void;onmessage:((e:{data:any})=>void)|null;onerror:((e:any)=>void)|null}
export interface ChunkSink {attach(p:ChunkPopulation):void;detach(key:string):void}
/** One job in flight; stale completion can never activate a former camera target. */
export class WorkerPopulationStream {
 readonly active=new Map<string,ChunkPopulation>();private desired=new Set<string>();private pending:{x:number;z:number}[]=[];
 private epoch=0;private id=0;private busy=false;private ready=false;private disposed=false;private port:WorkerPort;private sink:ChunkSink;
 readonly config:Partial<PopulationConfig>;readonly radius:number;error:string|null=null;discarded=0;completed=0;generationMs=0;
 constructor(port:WorkerPort,sink:ChunkSink,config:Partial<PopulationConfig>={},radius=2){this.port=port;this.sink=sink;this.config=config;this.radius=radius;port.onmessage=e=>this.receive(e.data);port.onerror=e=>{this.error=String(e.message??e);this.busy=false;};}
 target(x:number,z:number){if(this.disposed)throw Error('Worker stream disposed');if(!Number.isFinite(x)||!Number.isFinite(z))throw Error('Invalid target');const size=this.config.chunkSize??64,c=owner(x,z,size);this.epoch++;this.desired=new Set();const pending=[];
  for(let dx=-this.radius;dx<=this.radius;dx++)for(let dz=-this.radius;dz<=this.radius;dz++){const p={x:c.x+dx,z:c.z+dz},k=chunkKey(p);this.desired.add(k);if(!this.active.has(k))pending.push(p);}
  for(const k of this.active.keys())if(!this.desired.has(k)){this.sink.detach(k);this.active.delete(k);}
  this.pending=pending.sort((a,b)=>Math.hypot(a.x-c.x,a.z-c.z)-Math.hypot(b.x-c.x,b.z-c.z));this.pump();
 }
 private receive(data:any){if(this.disposed)return;if(data.kind==='ready'){this.ready=true;this.pump();return;}this.busy=false;if(data.kind==='error'){this.error=data.message;return;}
  const p=data.p as ChunkPopulation;if(data.epoch!==this.epoch||!this.desired.has(p.key)||this.active.has(p.key)){this.discarded++;}else{try{this.sink.attach(p);this.active.set(p.key,p);this.completed++;this.generationMs+=p.generationMs;}catch(e){this.error=String(e);return;}}this.pump();
 }
 private pump(){if(!this.ready||this.busy||this.error||!this.pending.length||this.disposed)return;const chunk=this.pending.shift()!;this.busy=true;this.port.postMessage({id:++this.id,epoch:this.epoch,chunk,config:this.config});}
 get queued(){return this.pending.length+(this.busy?1:0);}
 get settled(){return this.ready&&!this.queued&&!this.error;}
 dispose(){if(this.disposed)return;this.disposed=true;this.port.onmessage=null;this.port.onerror=null;this.port.terminate();for(const k of this.active.keys())this.sink.detach(k);this.active.clear();this.pending=[];this.desired.clear();}
}
