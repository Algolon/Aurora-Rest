import type {CanonicalEnvironment} from '../pop-01/geography.ts';
import type {ChunkPopulation,Family,Placement} from '../pop-01/contracts.ts';
import {PopulationGenerator,owner} from '../pop-01/generator.ts';
import {RULES} from '../pop-01/ecology.ts';
import {station} from './segment.ts';

export const PILOT={west:-794,east:-609,south:-168,north:-62} as const;
type Anchor={id:string;t:number;side:number;along:number;family:Family;variant:number;scale:number;rotation:number};
/** Authored grove edges, not a seed or a distribution field. Offsets are metres. */
const anchors:Anchor[]=[
 {id:'shelter-left-birch',t:.025,side:5.6,along:1,family:'birch',variant:1,scale:1.16,rotation:1.2},
 {id:'shelter-left-pine',t:.07,side:11,along:1,family:'pine',variant:0,scale:1.04,rotation:2.1},
 {id:'shelter-right-birch',t:.075,side:-5.4,along:0,family:'birch',variant:0,scale:1.06,rotation:.5},
 {id:'shelter-right-back',t:.13,side:-10.6,along:0,family:'birch',variant:2,scale:.92,rotation:2.7},
 {id:'shelter-left-return',t:.19,side:7.1,along:0,family:'birch',variant:2,scale:1.12,rotation:1.8},
 {id:'discovery-pair-a',t:.38,side:6.8,along:0,family:'birch',variant:0,scale:1.2,rotation:2.5},
 {id:'discovery-pair-b',t:.42,side:10.7,along:1,family:'birch',variant:1,scale:.88,rotation:3.9},
 {id:'discovery-counterframe',t:.32,side:-7.5,along:2,family:'pine',variant:2,scale:.98,rotation:4.2},
 {id:'pause-stone-main',t:.38,side:4.9,along:0,family:'rock',variant:1,scale:1.7,rotation:1.3},
 {id:'pause-stone-companion',t:.39,side:7.2,along:2.7,family:'rock',variant:3,scale:.82,rotation:2.4},
 {id:'pause-stone-small',t:.365,side:6.8,along:-1.8,family:'rock',variant:0,scale:.65,rotation:4.1},
 {id:'transition-left',t:.54,side:8.4,along:0,family:'birch',variant:2,scale:1.05,rotation:2.9},
 {id:'transition-left-back',t:.59,side:13.5,along:1,family:'pine',variant:1,scale:1.1,rotation:1.1},
 {id:'transition-right',t:.58,side:-7.8,along:0,family:'birch',variant:0,scale:.91,rotation:3.1},
 {id:'edge-right',t:.74,side:-9.5,along:0,family:'birch',variant:1,scale:1.18,rotation:4.7},
 {id:'edge-left-back',t:.77,side:13.8,along:0,family:'pine',variant:0,scale:1.03,rotation:2.1},
 {id:'reveal-left-frame',t:.96,side:6.5,along:-1.8,family:'birch',variant:0,scale:1.18,rotation:3.7},
 {id:'reveal-right-frame',t:.96,side:-7,along:-2,family:'birch',variant:2,scale:1.07,rotation:1.9},
 {id:'reveal-foot-stone',t:.99,side:4.8,along:-1.1,family:'rock',variant:2,scale:1.05,rotation:2.6}
];
/** Irregular ribbons and pockets follow one contour/path, with asymmetric gaps. */
const pockets:[string,number,number,number][]=[
 ['shelter-left-front',.025,3.7,1.4],['shelter-right-front',.035,-3.4,1.8],
 ['shelter-left-back',.07,6.8,0],['shelter-right-back',.1,-5.5,.4],
 ['approach-left',.16,4.2,0],['approach-right',.22,-4.7,0],
 ['discovery-left-front',.34,3.8,2.2],['discovery-right-front',.355,-3.6,1.9],
 ['discovery-left-skirt',.40,5.1,0],['discovery-right-back',.43,-6,0],
 ['turn-left',.48,4.8,0],['turn-right',.54,-4.1,0],
 ['breathing-left-front',.69,3.8,1.9],['breathing-right-front',.70,-3.5,1.6],
 ['breathing-left-back',.75,6.4,0],['breathing-right-back',.79,-6.1,0],
 ['edge-left',.84,4.8,0],['edge-right',.89,-5.2,0],
 ['reveal-left-front',.985,3.4,.3],['reveal-right-front',.985,-3.3,.2],
 ['reveal-left-skirt',.94,5.6,0],['reveal-right-skirt',.94,-5.8,0]
];
// Hand-arranged tuft motif: local cross/along offsets, variant, rotation, scale.
const tufts=[[-.8,-.2,3,.7,1.16],[.1,-.6,0,2.1,1.04],[.7,.1,1,4.2,.9],[-.5,.55,3,1.5,1.21],
 [.3,.8,0,3.2,1.12],[1.2,.65,1,2.5,1.02],[-1.1,1.35,0,.2,.85],[-.25,1.5,3,5.2,1.14],
 [.65,1.8,0,2.8,1.19],[1.35,1.55,3,4.8,.98],[-.7,2.2,1,1.9,.92],[.05,2.45,0,.9,1.22],
 [.9,2.65,3,3.9,1.15],[-1.35,2.8,0,4.1,.91],[-.4,3.2,3,2.2,1.05],[.45,3.5,1,1.1,1.09],
 [1.5,3.3,0,5.4,.88],[-.8,3.9,0,3.5,1.18],[.1,4.2,3,2.7,1.07],[1.1,4.4,1,.5,.94]];

export function sourcePilot(geo:CanonicalEnvironment){
 const gen=new PopulationGenerator(geo),rows:Placement[]=[];
 for(let x=Math.floor((PILOT.west-8)/64);x<=Math.floor((PILOT.east+8)/64);x++)
 for(let z=Math.floor((PILOT.south-8)/64);z<=Math.floor((PILOT.north+8)/64);z++)rows.push(...gen.generate({x,z}).instances);
 return rows;
}
export function buildComposition(geo:CanonicalEnvironment,source:readonly Placement[]){
 const accepted:Placement[]=[],rejected:{id:string;reason:string;x:number;z:number}[]=[];
 function add(a:Anchor){
  const p=station(geo,a.t),x=p.x+p.nx*a.side+p.dx*a.along,z=p.z+p.nz*a.side+p.dz*a.along,s=geo.sample(x,z),r=RULES[a.family];
  const id='env-r02:'+a.id;
  let reason=x<PILOT.west||x>PILOT.east||z<PILOT.south||z>PILOT.north?'outside pilot':
   !s.dry?'water':s.waterDistance<r.waterClearance||s.coastDistance<r.coastClearance?'shore clearance':
   s.trailDistance<r.trailClearance?'provisional tread':s.slope>r.maxSlope||s.elevation>r.maxHeight?'asset ecology':'';
  if(!reason&&a.family!=='grass'&&source.some(q=>q.family!=='grass'&&Math.hypot(q.x-x,q.z-z)<Math.max(3.2,a.family==='rock'?2.6:5.2)))reason='existing solid retained';
  if(reason){rejected.push({id,reason,x,z});return;}
  accepted.push({id,family:a.family,variant:a.variant,x,y:s.elevation,z,rotation:a.rotation,scale:a.scale,normal:s.normal,
   alignment:a.family==='birch'||a.family==='pine'?'upright':'terrain',burial:a.family==='rock'?.22:0,tint:1,
   renderClass:a.family==='grass'?'near-cover':a.family==='rock'?'rock-lod':'tree-lod',chunk:Object.values(owner(x,z,64)).join(','),
   metadata:{community:'birch-woodland',patch:1,region:s.region,slope:s.slope,source:'ENV-NATURE-R02 explicit overlay; source geometry/MAT unchanged'}});
 }
 for(const a of anchors)add(a);
 for(const [id,t,side,along] of pockets)for(let i=0;i<tufts.length;i++){
  const [cross,forward,variant,rotation,scale]=tufts[i];
  add({id:id+':tuft-'+String(i+1).padStart(2,'0'),t,side:side+cross,along:along+forward,family:'grass',variant,rotation,scale});
 }
 return {placements:accepted,rejected};
}
/** Stream receives originals. Only the rendering sink sees this reversible concatenation. */
export function withOverlay(chunk:ChunkPopulation,overlay:readonly Placement[],enabled:boolean):ChunkPopulation {
 return enabled?{...chunk,instances:[...chunk.instances,...overlay.filter(p=>p.chunk===chunk.key)]}:chunk;
}
