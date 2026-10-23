import * as T from 'three';
import type {ChunkPopulation,Family} from '../pop-01/contracts.ts';
import {DiagnosticRenderer} from '../pop-01/proxy-renderer.ts';
import {RenderPageStore} from './page-store.ts';
import {NatureResources,SourcePage,type SourceSettings} from './source-page.ts';
export class LivingRenderer {
 readonly resources:NatureResources;store:RenderPageStore;private scene:T.Scene;private renderer:T.WebGLRenderer;private proxy:DiagnosticRenderer;
 readonly chunks=new Map<string,ChunkPopulation>();settings:SourceSettings;pageSize=128;representation:'assets'|'proxies'='assets';
 constructor(scene:T.Scene,renderer:T.WebGLRenderer){this.scene=scene;this.renderer=renderer;this.resources=new NatureResources();this.proxy=new DiagnosticRenderer(scene);this.settings={mode:'instanced',shadows:true,forcedLod:null,enabled:new Set<Family>(['birch','pine','grass','rock']),grassAlignment:'normal',grassFade:'refined',treeDistance:180};this.store=this.makeStore();}
 private makeStore(){return new RenderPageStore(rows=>new SourcePage(rows,this.scene,this.renderer,this.resources,this.settings,undefined,[...this.chunks.values()].flatMap(p=>p.instances.filter(p=>p.family==='rock'))),this.pageSize);}
 attach(p:ChunkPopulation){if(this.chunks.has(p.key))throw Error('Duplicate desired chunk');if(this.representation==='assets')this.store.attach(p);else this.proxy.attach(p);this.chunks.set(p.key,p);this.invalidateNeighbors(p.key);}
 detach(key:string){if(!this.chunks.has(key))return;if(this.representation==='assets')this.store.detach(key);else this.proxy.detach(key);this.chunks.delete(key);this.invalidateNeighbors(key);}
 private invalidateNeighbors(key:string){if(this.representation!=='assets')return;const [cx,cz]=key.split(',').map(Number),size=this.pageSize;for(let x=Math.floor((cx*64-6)/size);x<=Math.floor(((cx+1)*64+6)/size);x++)for(let z=Math.floor((cz*64-6)/size);z<=Math.floor(((cz+1)*64+6)/size);z++){const k=x+','+z;if(this.store.pages.has(k))this.store.invalidate(k);}}
 reconfigure(){this.store.dispose();this.proxy.dispose();this.proxy=new DiagnosticRenderer(this.scene);this.store=this.makeStore();for(const p of this.chunks.values())if(this.representation==='assets')this.store.attach(p);else this.proxy.attach(p);}
 update(camera:T.Camera,activate=false){if(this.representation==='assets'){if(activate&&this.store.dirty.size)this.store.flushOne(camera);this.store.update(camera);}else{this.proxy.enabled.clear();for(const f of this.settings.enabled)this.proxy.enabled.add(f);this.proxy.update(camera,90);}}
 get pending(){return this.representation==='assets'?this.store.dirty.size:0;}
 stats(){const pages=[...this.store.pages.values()] as SourcePage[],byFamily={birch:0,pine:0,grass:0,rock:0},lodCounts={near:0,mid:0,far:0,xfar:0};let grassSlope=0,grassRockOverlap=0;for(const p of pages){for(const f of Object.keys(byFamily) as Family[])byFamily[f]+=p.byFamily[f];for(const k of Object.keys(lodCounts) as (keyof typeof lodCounts)[])lodCounts[k]+=p.lodCounts[k];grassSlope+=p.rejected.grassSlope;grassRockOverlap+=p.rejected.grassRockOverlap;}
 return {representation:this.representation,pageSize:this.pageSize,pages:this.store.pages.size,pending:this.pending,registered:this.representation==='assets'?this.store.registered:[...this.chunks.values()].reduce((n,p)=>n+p.instances.length,0),byFamily,lodCounts,visible:this.representation==='assets'?pages.reduce((n,p)=>n+p.visible,0):this.proxy.visible,geometryTriangles:pages.reduce((n,p)=>n+p.visibleTriangles,0),pageBuildMs:this.store.lastBuildMs,cameraUpdateMs:pages.reduce((n,p)=>n+p.lastUpdateMs,0),backends:[...new Set(pages.map(p=>p.backend))],rejected:{grassSlope,grassRockOverlap}};}
 dispose(){this.store.dispose();this.proxy.dispose();this.chunks.clear();this.resources.dispose();}
}
