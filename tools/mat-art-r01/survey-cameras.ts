/** MAT-ART-R01: locate meadow-transition and open-grassland walking cameras from the canonical, unmodified
 * MAT classification and POP population. Read-only. Run:
 *   node --experimental-strip-types tools/mat-art-r01/survey-cameras.ts [out.json] */
import {readFileSync,writeFileSync} from 'node:fs';
import {classifyTerrain} from '../../src/terrain-material/classify.ts';
import {geoR02BSource} from '../../src/terrain-material/sources/geo-r02b.ts';
import {TerrainMaterialQuery} from '../../src/terrain-material/query.ts';
import {HeightGrid} from '../../src/geo-r02b/terrain.ts';
import {CanonicalEnvironment} from '../../src/pop-01/geography.ts';
import {PopulationGenerator,owner} from '../../src/pop-01/generator.ts';
import type {Placement} from '../../src/pop-01/contracts.ts';

const f32=(p:string)=>{const b=readFileSync(p);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const features=JSON.parse(readFileSync('public/geo-r02b/features.json','utf8'));
const heights=f32('public/geo-r02b/terrain.f32'),surface=f32('public/geo-r02b/water-surface.f32'),mesh=f32('public/geo-r02b/water-mesh.f32');
const {classification}=classifyTerrain(geoR02BSource(heights,surface,features)),query=new TerrainMaterialQuery(classification);
const geo=new CanonicalEnvironment(features,new HeightGrid(heights,1501,2001),mesh),gen=new PopulationGenerator(geo);
const chunks=new Map<string,Placement[]>();
const around=(x:number,z:number,r:number)=>{const out:Placement[]=[];
 for(let cx=Math.floor((x-r)/64);cx<=Math.floor((x+r)/64);cx++)for(let cz=Math.floor((z-r)/64);cz<=Math.floor((z+r)/64);cz++){
  const key=cx+','+cz;if(!chunks.has(key))chunks.set(key,gen.generate(owner(cx*64+1,cz*64+1,64)).instances);
  for(const p of chunks.get(key)!)if(Math.hypot(p.x-x,p.z-z)<r)out.push(p);}
 return out;};
/** Fraction of a forward view cone (5–45 m, ±25°) per material, plus dry share. */
const cone=(x:number,z:number,heading:number)=>{let ff=0,mt=0,wet=0,n=0;
 for(let d=5;d<=45;d+=4)for(let a=-25;a<=25;a+=10){const h=heading+a*Math.PI/180,px=x-Math.sin(h)*d,pz=z-Math.cos(h)*d,w=query.sample(px,pz).weights;
  ff+=w['forest-floor'];mt+=w['meadow-turf'];if(!geo.sample(px,pz).dry)wet++;n++;}
 return {forestFloor:ff/n,meadow:mt/n,wet:wet/n};};
const centre={x:-702,z:-114},candidates:{kind:string;x:number;z:number;heading:number;score:number;detail:unknown}[]=[];
for(let x=centre.x-520;x<=centre.x+520;x+=8)for(let z=centre.z-520;z<=centre.z+520;z+=8){
 const s=geo.sample(x,z);if(!s.dry||s.slope>.18||s.waterDistance<25)continue;
 const here=query.sample(x,z).weights,cover=query.coverage(x,z,20);
 for(let k=0;k<16;k++){const heading=k/16*Math.PI*2,v=cone(x,z,heading);if(v.wet>0)continue;
  if(here['meadow-turf']>.9&&cover['meadow-turf']>.85&&v.meadow>.85){
   const near=around(x,z,30),grass=near.filter(p=>p.family==='grass').length,trees=near.filter(p=>p.family==='birch'||p.family==='pine').length;
   if(grass>40&&trees<=4)candidates.push({kind:'grassland',x,z,heading,score:v.meadow+grass/2000-trees/50,detail:{view:v,grass30m:grass,trees30m:trees}});}
  if(here['forest-floor']>.6&&v.forestFloor>.2&&v.meadow>.45&&v.meadow<.8){
   const near=around(x,z,30),grass=near.filter(p=>p.family==='grass').length,trees=near.filter(p=>p.family==='birch'||p.family==='pine').length;
   if(trees>6&&grass>20)candidates.push({kind:'transition',x,z,heading,score:1-Math.abs(v.meadow-.6)+trees/200,detail:{view:v,grass30m:grass,trees30m:trees}});}
 }
}
const pick=(kind:string)=>candidates.filter(c=>c.kind===kind).sort((a,b)=>Math.hypot(a.x-centre.x,a.z-centre.z)/400-a.score-(Math.hypot(b.x-centre.x,b.z-centre.z)/400-b.score))[0];
const report={milestone:'MAT-ART-R01 camera survey',method:'Canonical MAT classification + POP-01 generator, 8 m grid within 520 m of the R02 corridor centre; dry, slope ≤ 0.18, ≥ 25 m from water; forward cone 5–45 m ±25° fully dry.',
 counts:{grassland:candidates.filter(c=>c.kind==='grassland').length,transition:candidates.filter(c=>c.kind==='transition').length},
 grassland:pick('grassland'),transition:pick('transition')};
console.log(JSON.stringify(report,null,1));
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
