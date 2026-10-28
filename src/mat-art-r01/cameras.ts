/** MAT-ART-R01 review cameras. Camera definitions only — no composition, placement or geography.
 * `selectedPath`, `station` and the R02 beats reproduce ENV-NATURE-R02 src/env-nature-r02/segment.ts at
 * 195ada5b58450b22a38e530c78fa751eaf6edaeb, so the shelter/breathing/overview poses are the validated R02 poses.
 * Meadow-transition and open-grassland stations come from tools/mat-art-r01/survey-cameras.ts. */
import type {CanonicalEnvironment} from '../pop-01/geography.ts';

export interface MatArtCamera {
 id:string;label:string;x:number;z:number;heading:number;pitch:number;
 kind:'walk'|'overhead';
 /** Which brief set the view serves. */
 set:'environment'|'ground-close';
 source:string;
}
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
const R02='ENV-NATURE-R02 validated pose (195ada5)';
/** Surveyed 2026-10-28 from the canonical classification (docs/mat-art-r01/diagnosis/camera-survey.json). */
const TRANSITION={x:-646,z:-130,heading:1.1780972450961724},GRASSLAND={x:-1198,z:-82,heading:1.9634954084936207};

export function matArtCameras(geo:CanonicalEnvironment):MatArtCamera[]{
 const shelter=station(geo,0),breathing=station(geo,.69);
 const forward=(p:{dx:number;dz:number})=>Math.atan2(-p.dx,-p.dz);
 return [
  {id:'birch-interior',label:'1 · Birchwood interior · 1.75 m',x:shelter.x,z:shelter.z,heading:forward(shelter),pitch:.075,kind:'walk',set:'environment',source:R02+' "shelter"'},
  {id:'birch-edge',label:'2 · Birchwood forest edge · 1.75 m',x:breathing.x,z:breathing.z,heading:forward(breathing),pitch:-.035,kind:'walk',set:'environment',source:R02+' "breathing"'},
  {id:'meadow-transition',label:'3 · Forest → meadow transition · 1.75 m',...TRANSITION,pitch:-.06,kind:'walk',set:'environment',source:'MAT-ART-R01 classification survey: forest-floor station, view cone 37% forest floor / 60% meadow'},
  {id:'open-grassland',label:'4 · Open grassland · 1.75 m',...GRASSLAND,pitch:-.06,kind:'walk',set:'environment',source:'MAT-ART-R01 classification survey: 100% meadow view cone, 52 POP grass / 2 trees within 30 m'},
  {id:'overview',label:'5 · Elevated overview · 145 m',x:-702,z:-114,heading:0,pitch:0,kind:'overhead',set:'environment',source:R02+' "overview"'},
  // Ground close-ups: same stations, player looking down (view centre ≈ 2.3 m ahead).
  {id:'close-forest-floor',label:'G1 · Forest floor close-up',x:shelter.x,z:shelter.z,heading:forward(shelter),pitch:-.65,kind:'walk',set:'ground-close',source:R02+' "shelter" station, pitch −0.65'},
  {id:'close-meadow',label:'G2 · Meadow turf close-up',...GRASSLAND,pitch:-.65,kind:'walk',set:'ground-close',source:'open-grassland station, pitch −0.65'},
  {id:'close-transition',label:'G3 · Forest–meadow transition',...TRANSITION,pitch:-.3,kind:'walk',set:'ground-close',source:'meadow-transition station, pitch −0.30'},
 ];
}
