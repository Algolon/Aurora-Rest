import type {ChunkPopulation,Placement} from '../pop-01/contracts.ts';
export interface RenderPage {hide():void;dispose():void;update(camera:unknown):void;registered:number}
export type PageFactory=(placements:readonly Placement[])=>RenderPage;
/** CPU desired state is independent of immutable, bounded-lifetime GPU pages. */
export class RenderPageStore {
 readonly chunks=new Map<string,ChunkPopulation>();readonly pages=new Map<string,RenderPage>();readonly dirty=new Set<string>();
 private dead=false;private factory:PageFactory;readonly pageSize:number;readonly chunkSize:number;
 rebuilds=0;disposedPages=0;lastBuildMs=0;lastFailure:string|null=null;
 constructor(factory:PageFactory,pageSize=256,chunkSize=64){if(pageSize%chunkSize||pageSize<chunkSize)throw Error('Render page must contain whole generation chunks');this.factory=factory;this.pageSize=pageSize;this.chunkSize=chunkSize;}
 pageOfChunk(key:string){const [x,z]=key.split(',').map(Number);if(!Number.isInteger(x)||!Number.isInteger(z))throw Error('Invalid chunk key');return Math.floor(x*this.chunkSize/this.pageSize)+','+Math.floor(z*this.chunkSize/this.pageSize);}
 attach(p:ChunkPopulation){this.live();if(this.chunks.has(p.key))throw Error('Duplicate chunk attach');this.pageOfChunk(p.key);this.chunks.set(p.key,p);this.invalidate(this.pageOfChunk(p.key));}
 replace(p:ChunkPopulation){this.live();if(!this.chunks.has(p.key))throw Error('Missing chunk transform owner');this.chunks.set(p.key,p);this.invalidate(this.pageOfChunk(p.key));}
 detach(key:string){this.live();if(!this.chunks.delete(key))return;const page=this.pageOfChunk(key);this.invalidate(page);if(![...this.chunks.keys()].some(k=>this.pageOfChunk(k)===page)){this.pages.get(page)?.dispose();if(this.pages.has(page))this.disposedPages++;this.pages.delete(page);this.dirty.delete(page);}}
 invalidate(key:string){this.dirty.add(key);this.pages.get(key)?.hide();}
 /** Rebuild at most one page per activation. Factory must clean partial allocations on failure. */
 flushOne(camera?:unknown){this.live();const key=this.dirty.values().next().value as string|undefined;if(key===undefined)return false;const placements=[...this.chunks.values()].filter(p=>this.pageOfChunk(p.key)===key).flatMap(p=>p.instances).sort((a,b)=>a.id<b.id?-1:1),start=performance.now();let next:RenderPage|undefined;
  try{next=this.factory(placements);if(camera)next.update(camera);const old=this.pages.get(key);this.pages.set(key,next);this.dirty.delete(key);old?.dispose();if(old)this.disposedPages++;this.rebuilds++;this.lastFailure=null;return true;}
  catch(e){next?.dispose();this.lastFailure=String(e);throw e;}finally{this.lastBuildMs=performance.now()-start;}
 }
 update(camera:unknown){this.live();for(const [key,p] of this.pages)if(!this.dirty.has(key))p.update(camera);}
 clear(){this.live();for(const p of this.pages.values()){p.dispose();this.disposedPages++;}this.pages.clear();this.dirty.clear();this.chunks.clear();}
 dispose(){if(this.dead)return;this.clear();this.dead=true;}
 get registered(){return [...this.pages.values()].reduce((n,p)=>n+p.registered,0);}
 private live(){if(this.dead)throw Error('Render store disposed');}
}
