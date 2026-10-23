/** Deterministic showroom-local staging only. No island/POP dependency. */
import {mulberry32} from '../../src/rng.ts';
import {ROCK_ASSETS,type RockArchetype,type RockTransform} from './rockFamily.ts';
export type ZoneId='woodland'|'glacial'|'foothill';
export const ZONES={woodland:{center:[-27,-7] as const,label:'A · Woodland Edge',counts:{compact:10,broadGlacial:0,sculptural:1}},glacial:{center:[0,12] as const,label:'B · Glacial Clearing',counts:{compact:6,broadGlacial:4,sculptural:1}},foothill:{center:[27,-7] as const,label:'C · Foothill Trail',counts:{compact:8,broadGlacial:1,sculptural:3}}};
export interface PilotRock extends RockTransform {id:string;archetype:RockArchetype;zone:ZoneId;radius:number;embedding:number;scale:readonly [number,number,number]}
export const trailX=(zone:ZoneId,z:number)=>ZONES[zone].center[0]+1.1*Math.sin((z-ZONES[zone].center[1])*.18);
export function demoGroundHeight(x:number,z:number){return .12*Math.sin(x*.09)+.10*Math.cos(z*.13)+.45*Math.exp(-(((x-27)/15)**2)-(((z+7)/16)**2));}
export function createPilotLayout(seed=10101,height:(x:number,z:number)=>number=demoGroundHeight):PilotRock[]{
 if(!Number.isInteger(seed))throw RangeError('Pilot seed must be integer');
 const result:PilotRock[]=[];
 for(const [zone,definition] of Object.entries(ZONES) as [ZoneId,typeof ZONES[ZoneId]][]){
  const random=mulberry32(seed^({woodland:217,glacial:443,foothill:809}[zone]));
  // Place scarce large stones before compact satellites; rejection preserves the path.
  for(const archetype of ['broadGlacial','sculptural','compact'] as const){
   const count=definition.counts[archetype];let placed=0;
   for(let attempt=0;placed<count&&attempt<8000;attempt++){
    const x=definition.center[0]+(random()-.5)*25,z=definition.center[1]+(random()-.5)*21;
    const base=.82+random()*.30;const mild=random()<.12;
    const scale:[number,number,number]=[base*(mild?.96:1),base,base*(mild?1.04:1)];
    const dimensions=ROCK_ASSETS[archetype].dimensions;const radius=.5*Math.hypot(dimensions[0]*scale[0],dimensions[2]*scale[2]);
    if(Math.abs(x-trailX(zone,z))<1.35+radius)continue;
    if(result.some(r=>Math.hypot(r.position[0]-x,r.position[2]-z)<r.radius+radius+.25))continue;
    const yaw=random()*Math.PI*2,embedding=.055+random()*.075;
    // Conservative low footprint samples prevent floating on this mild demo terrain.
    let ground=height(x,z);for(let k=0;k<8;k++){const a=k*Math.PI/4;ground=Math.min(ground,height(x+Math.cos(a)*radius,z+Math.sin(a)*radius));}
    result.push({id:zone+'.'+archetype+'.'+placed,archetype,zone,position:[x,ground-embedding,z],rotationY:yaw,scale,radius,embedding});placed++;
   }
   if(placed!==count)throw Error('Unable to place requested pilot rocks in '+zone+'/'+archetype);
  }
 }
 return result;
}
