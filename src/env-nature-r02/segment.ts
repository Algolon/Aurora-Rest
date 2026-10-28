import type {CanonicalEnvironment} from '../pop-01/geography.ts';
import type {ReviewCamera} from '../pop-02a/cameras.ts';

/** One contiguous, unmodified section of the canonical west-cape spur, walked east. */
export function selectedPath(geo:CanonicalEnvironment):[number,number][] {
 const route=geo.data.routes.find(r=>r.id==='west-cape-spur');
 if(!route)throw Error('Canonical west-cape spur unavailable');
 return route.points2.slice().reverse().filter(p=>p[0]>=-772&&p[0]<=-632.6154).map(p=>[p[0],p[1]]);
}
export function station(geo:CanonicalEnvironment,t:number){
 const path=selectedPath(geo),i=Math.round(t*(path.length-1)),p=path[i],next=path[Math.min(i+4,path.length-1)],prev=path[Math.max(0,i-4)];
 const dx=next[0]-prev[0],dz=next[1]-prev[1],len=Math.hypot(dx,dz);
 return {x:p[0],z:p[1],dx:dx/len,dz:dz/len,nx:-dz/len,nz:dx/len};
}
export const BEATS=[
 {id:'shelter',label:'Shelter · enclosed approach',t:0,pitch:.075},
 {id:'discovery',label:'Discovery · stone and birch pocket',t:.34,pitch:.035},
 {id:'breathing',label:'Breathing space · grove edge',t:.69,pitch:-.035},
 {id:'reveal',label:'Reveal · east over valley shoulder',t:1,pitch:-.09}
] as const;
export function pilotCameras(geo:CanonicalEnvironment):ReviewCamera[]{
 return [...BEATS.map(b=>{const p=station(geo,b.t);return {id:b.id,label:b.label,x:p.x,z:p.z,heading:b.id==='reveal'?Math.atan2(-372.6,-86.5):Math.atan2(-p.dx,-p.dz),kind:'walk' as const,region:'forest',source:'ENV-NATURE-R02: exact canonical west-cape spur station'};}),
 {id:'overview',label:'Elevated · selected 153 m corridor',x:-702,z:-114,heading:0,kind:'overhead',region:'forest',source:'ENV-NATURE-R02 elevated composition review'}];
}
