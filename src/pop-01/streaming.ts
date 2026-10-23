import type {ChunkPopulation,PopulationRenderer} from './contracts.ts';
import {PopulationGenerator,chunkKey,owner} from './generator.ts';
/** Bounded active cache. No hidden archive; re-entry recomputes descriptors. */
export class PopulationStream {
 readonly active=new Map<string,ChunkPopulation>();
 private pending:{x:number;z:number}[]=[];private disposed=false;
 readonly generator:PopulationGenerator;readonly renderer:PopulationRenderer;readonly radius:number;
 constructor(generator:PopulationGenerator,renderer:PopulationRenderer,radius=1){this.generator=generator;this.renderer=renderer;this.radius=radius;if(!Number.isInteger(radius)||radius<0||radius>5)throw RangeError('Invalid active radius');}
 target(x:number,z:number){
  this.live();if(!Number.isFinite(x)||!Number.isFinite(z))throw RangeError('Invalid streaming position');const c=owner(x,z,this.generator.config.chunkSize),desired=new Map<string,{x:number;z:number}>();
  for(let dx=-this.radius;dx<=this.radius;dx++)for(let dz=-this.radius;dz<=this.radius;dz++){const n={x:c.x+dx,z:c.z+dz};desired.set(chunkKey(n),n);}
  for(const k of this.active.keys())if(!desired.has(k)){this.renderer.detach(k);this.active.delete(k);}
  this.pending=[...desired.values()].filter(c=>!this.active.has(chunkKey(c))).sort((a,b)=>Math.hypot(a.x-c.x,a.z-c.z)-Math.hypot(b.x-c.x,b.z-c.z));
 }
 /** Soft budget: at least one whole chunk; synchronous chunk work may exceed budget. */
 tick(budgetMs=8){this.live();if(!Number.isFinite(budgetMs)||budgetMs<=0)throw RangeError('Invalid generation budget');const start=performance.now();let n=0;while(this.pending.length&&(n===0||performance.now()-start<budgetMs)){const c=this.pending[0],p=this.generator.generate(c);this.renderer.attach(p);this.active.set(p.key,p);this.pending.shift();n++;}return n;}
 get queued(){return this.pending.length;}
 clear(){this.live();for(const k of this.active.keys())this.renderer.detach(k);this.active.clear();this.pending=[];}
 dispose(){if(this.disposed)return;this.clear();this.renderer.dispose();this.disposed=true;}
 private live(){if(this.disposed)throw Error('Population stream disposed');}
}
