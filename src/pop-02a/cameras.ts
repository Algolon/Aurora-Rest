import {PopulationGenerator,owner} from '../pop-01/generator.ts';
import type {CanonicalEnvironment} from '../pop-01/geography.ts';
export interface ReviewCamera {id:string;region:string;label:string;x:number;z:number;kind:'overhead'|'landscape'|'walk'|'close';heading:number;source:string;asset?:'birch'|'grass'|'rock'}
export function reviewCameras(geo:CanonicalEnvironment):ReviewCamera[]{
 const regions=geo.reviewRegions(),out:ReviewCamera[]=[];
 const add=(region:string,id:string,label:string,x:number,z:number,kind:ReviewCamera['kind'],heading=0,source='offset from verified features.json anchor')=>{if(!geo.sample(x,z).dry)throw Error('Wet camera '+id);out.push({id,region,label,x,z,kind,heading,source});};
 for(const r of regions){add(r.id,r.id+'-overhead',r.name+' · distribution',r.x,r.z,'overhead');add(r.id,r.id+'-landscape',r.name+' · landscape',r.x,r.z,'landscape');add(r.id,r.id+'-walk',r.name+' · walking height',r.x,r.z,'walk',r.id==='home'?-Math.PI/2:0);}
 const f=regions[0];add('forest','forest-edge','Birchwood · forest edge',f.x+85,f.z-40,'walk',Math.PI/2);add('forest','forest-interior','Birchwood · interior',f.x-25,f.z+25,'walk',-.6);
 const hero=geo.data.routes.find(r=>r.id==='hero')!;const point=hero.points2.reduce((a,b)=>Math.hypot(a[0]-f.x,a[1]-f.z)<Math.hypot(b[0]-f.x,b[1]-f.z)?a:b);
 add('forest','forest-corridor','Birchwood → Valley · provisional route corridor',point[0],point[1],'walk',-.9,'nearest canonical hero route candidate to Birchwood anchor; not final physical path');
 const v=regions[1];let bank:{x:number;z:number}|undefined;for(let radius=12;radius<180&&!bank;radius+=12)for(let a=0;a<Math.PI*2;a+=.3){const x=v.x+Math.cos(a)*radius,z=v.z+Math.sin(a)*radius,s=geo.sample(x,z);if(s.dry&&s.waterDistance>5&&s.waterDistance<12&&s.waterLevel<4){bank={x,z};break;}}
 if(bank)add('valley','valley-bank','Central Valley · riverbank',bank.x,bank.z,'walk',-.8,'dry canonical water-mesh boundary search, 5–12 m clearance');
 const h=regions[2];let shore:{x:number;z:number}|undefined;for(let radius=12;radius<240&&!shore;radius+=12)for(let a=0;a<Math.PI*2;a+=.3){const x=h.x+Math.cos(a)*radius,z=h.z+Math.sin(a)*radius,s=geo.sample(x,z);if(s.dry&&s.coastDistance>9&&s.coastDistance<20){shore={x,z};break;}}
 if(shore)add('home','home-shore','Home Cove · shoreline transition',shore.x,shore.z,'walk',Math.PI,'dry coast-distance search, 9–20 m inland');
 const pilot=new PopulationGenerator(geo).generate(owner(f.x,f.z,64));for(const family of ['birch','grass','rock'] as const){const p=pilot.instances.find(p=>p.family===family);if(p)out.push({id:'forest-close-'+family,region:'forest',label:'Birchwood · '+family+' source close-up',x:p.x,z:p.z,kind:'close',heading:0,source:'actual POP-01 descriptor '+p.id,asset:family});}
 return out;
}
