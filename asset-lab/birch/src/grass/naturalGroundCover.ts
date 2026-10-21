import {mulberry32} from '../rng.ts';
import type {GrassPlacement,GroundCoverPlacement} from './groundCoverPlacement.ts';
import type {GrassVariant} from './geometry.ts';

/** D2R V1: placement-only study. D2's generator remains untouched for V0.
 * All coordinates and rules are deliberately showroom-local, not island biomes. */
interface Point {x:number;z:number;radius:number;priority:number}
const sat=(v:number)=>Math.min(1,Math.max(0,v));
const hash=(x:number,z:number,seed:number)=>{
 let h=(Math.imul(x,374761393)^Math.imul(z,668265263)^Math.imul(seed,1442695041))|0;
 h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;
};
const smooth=(v:number)=>v*v*(3-2*v);
export function fieldNoise(x:number,z:number,seed:number):number{
 const a=Math.floor(x),b=Math.floor(z),u=smooth(x-a),v=smooth(z-b);
 const lo=hash(a,b,seed)*(1-u)+hash(a+1,b,seed)*u;
 const hi=hash(a,b+1,seed)*(1-u)+hash(a+1,b+1,seed)*u;
 return lo*(1-v)+hi*v;
}
export function meadowDensity(x:number,z:number,seed:number):number{
 const warpX=(fieldNoise(x*.12+17,z*.12,seed+44)-.5)*3.1;
 const warpZ=(fieldNoise(x*.1,z*.1+29,seed+61)-.5)*2.5;
 const X=x+warpX,Z=z+warpZ;
 const broad=fieldNoise(X*.17,Z*.17,seed+2);
 const medium=fieldNoise(X*.51,Z*.51,seed+9);
 const gaps=fieldNoise(X*.34+21,Z*.34-13,seed+18);
 const coastline=Math.pow(X/16.8,2)+Math.pow(Z/10.7,2);
 // Intermittent open ground, asymmetrically shaped rather than circular holes.
 const edge=sat((1.05-coastline)*4);
 const negative=gaps>.67?.3:gaps<.27?.45:1;
 // Winding narrow walkable opening; intentionally NOT a final-game path.
 const pathX=.85+1.4*(fieldNoise(Z*.19,6,seed+27)-.5);
 const footpath=Math.abs(X-pathX)<.42?.2:1;
 return sat((.18+.56*broad+.32*medium)*edge*negative*footpath);
}
export function naturalSpeciesWeights(x:number,z:number,seed:number):readonly [number,number,number,number] {
 const drift=(fieldNoise(x*.15+9,z*.15,seed+72)-.5)*3.8;
 const center=x+drift;
 const mound=(a:number,width:number)=>Math.exp(-.5*((center-a)/width)**2);
 // A soft common short-grass layer; tall grasses and sedges have local centers.
 // Source seed-head geometry (720 tris) is only a sparse meadow accent.
 const short=.78+.25*mound(-9,9);
 const tall=.12+1.9*mound(-4.2,3.9);
 const seedHeads=.03+.46*mound(3.4,3.8);
 const sedge=.07+2.1*mound(10.8,3.2)*( .5+.5*fieldNoise(x*.22,z*.22,seed+31));
 return [short,tall,seedHeads,sedge];
}
function chooseSpecies(x:number,z:number,seed:number,u:number):GrassVariant {
 const weights=naturalSpeciesWeights(x,z,seed);
 let n=u*weights.reduce((a,b)=>a+b,0);
 for(let i=0;i<3;i++){if(n<weights[i])return i as GrassVariant;n-=weights[i]}
 return 3;
}
function closeToExisting(x:number,z:number,min:number,grid:Map<string,Point[]>,step:number):boolean{
 const ix=Math.floor(x/step),iz=Math.floor(z/step);
 for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){
  for(const q of grid.get((ix+a)+':'+(iz+b))??[]){
   const dx=q.x-x,dz=q.z-z;
   if(dx*dx+dz*dz<Math.min(min,q.radius)**2)return true;
  }
 }
 return false;
}
export interface NaturalGroundCoverOptions extends GroundCoverPlacement {
 /** Scale spacing in high-density microclumps; original meshes are unchanged. */
 overlap?:number;
}
export function generateNaturalGrassPlacement({seed=120626,count,minSpacing=.115,overlap=.68}:NaturalGroundCoverOptions):GrassPlacement[]{
 if(!Number.isInteger(count)||count<0||count>20000||!(minSpacing>0)||!(overlap>=.4&&overlap<=1))
  throw RangeError('Invalid natural meadow parameters');
 if(count===0)return [];
 const rnd=mulberry32(seed^0x51a92b),result:GrassPlacement[]=[];
 const step=minSpacing,grid=new Map<string,Point[]>();
 const centers:Point[]=[];
 // Many small nuclei within larger broad vegetation communities; no row or grid planting.
 for(let i=0;i<86;i++){
  const x=(rnd()-.5)*30,z=(rnd()-.5)*18;
  centers.push({x,z,radius:.65+rnd()*2.5,priority:.5+rnd()*1.5});
 }
 const gaussian=()=>Math.sqrt(-2*Math.log(Math.max(1e-7,rnd())))*Math.cos(rnd()*2*Math.PI);
 for(let attempts=0;result.length<count&&attempts<Math.max(10000,count*190);attempts++){
  let x:number,z:number;
  if(rnd()<.88){
   const c=centers[Math.floor(rnd()*centers.length)];
   x=c.x+gaussian()*c.radius*.7;z=c.z+gaussian()*c.radius*.65;
  }else{x=(rnd()-.5)*32;z=(rnd()-.5)*20}
  if(Math.abs(x)>16.4||Math.abs(z)>10.3)continue;
  const density=meadowDensity(x,z,seed);
  if(rnd()>density)continue;
  // Density-driven overlap: microclumps form masses, not perfectly separated dots.
  const local=minSpacing*(density>.63?overlap:density>.39?.82:1);
  if(closeToExisting(x,z,local,grid,step))continue;
  const variant=chooseSpecies(x,z,seed,rnd());
  const scale=variant===0?.75+rnd()*.58:variant===1?.73+rnd()*.55:variant===2?.77+rnd()*.43:.72+rnd()*.62;
  const tuft:GrassPlacement={variant,position:[x,0,z],rotationY:rnd()*Math.PI*2,
   scale,tint:.87+rnd()*.2,patch:variant};
  const ix=Math.floor(x/step),iz=Math.floor(z/step),key=ix+':'+iz;
  if(!grid.has(key))grid.set(key,[]);
  grid.get(key)!.push({x,z,radius:local,priority:density});
  result.push(tuft);
 }
 if(result.length!==count)throw Error('Natural meadow placement capacity exhausted '+result.length+'/'+count);
 return result;
}
