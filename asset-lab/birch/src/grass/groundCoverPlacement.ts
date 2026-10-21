import {mulberry32} from '../rng.ts';
import type {GrassVariant} from './geometry.ts';
export interface GrassPlacement {variant:GrassVariant;position:[number,number,number];rotationY:number;scale:number;tint:number;patch:number}
export interface GroundCoverPlacement {seed?:number;count:number;minSpacing?:number}
/** Seeded uneven meadow: overlapping broad zones, clustered growth, open soil gaps,
 * and spatial-hash rejection. Test placement only; no island soil or biome rules. */
export function generateGrassPlacement({seed=120626,count,minSpacing=.115}:GroundCoverPlacement):GrassPlacement[]{
 if(!Number.isInteger(count)||count<0||count>20000||!(minSpacing>0))throw RangeError('Invalid meadow placement');
 const rand=mulberry32(seed);const points:GrassPlacement[]=[];
 const cells=new Map<string,number[]>(),step=minSpacing;
 const key=(a:number,b:number)=>a+','+b;
 const centers=[-10.5,-3.5,3.5,10.5];
 const dist2=(a:number,b:number)=>a*a+b*b;
 for(let attempt=0;points.length<count&&attempt<count*250;attempt++){
  // Global coherent coverage with irregular boundaries and bare pockets.
  const x=(rand()-.5)*32,z=(rand()-.5)*20;
  const edge=dist2(x/17,z/11)+.13*Math.sin(x*.41+z*.26)+.075*Math.sin(z*.79-x*.43);
  if(edge>1)continue;
  const cluster=.5+.27*Math.sin(x*.73+1.6*Math.sin(z*.34))+.23*Math.cos(z*.85-x*.33);
  const gaps=Math.sin(x*1.2+z*.53)*Math.cos(z*1.44-x*.35);
  const density=Math.min(.98,Math.max(.06,.78*cluster+.16*gaps));
  if(rand()>density)continue;
  const cx=Math.floor(x/step),cz=Math.floor(z/step);
  let tooClose=false;
  for(let a=-1;a<=1&&!tooClose;a++)for(let b=-1;b<=1&&!tooClose;b++){
   for(const index of cells.get(key(cx+a,cz+b))??[]){
    const p=points[index].position;
    if(dist2(p[0]-x,p[2]-z)<step*step){tooClose=true;break}
   }
  }
  if(tooClose)continue;
  const bend=.5*Math.sin(z*.42)+.32*Math.sin(x*.32);
  const weights=centers.map((c,i)=>{
   const d=(x-c+bend)/(i===0||i===3?6.5:6);
   return Math.exp(-.5*d*d)*(i===2?.58:1);
  });
  // Seed heads deliberately lower-density: the source mesh has 720 triangles.
  const sum=weights.reduce((a,b)=>a+b,0);
  let draw=rand()*sum,patch=0;
  while(patch<3&&draw>weights[patch]){draw-=weights[patch];patch++}
  const variant=patch as GrassVariant;
  const s=variant===0?.72+rand()*.53:variant===1?.78+rand()*.4:variant===2?.8+rand()*.38:.74+rand()*.55;
  const point:GrassPlacement={variant,position:[x,0,z],rotationY:rand()*Math.PI*2,scale:s,tint:.84+rand()*.25,patch};
  const cell=key(cx,cz);if(!cells.has(cell))cells.set(cell,[]);
  cells.get(cell)!.push(points.length);points.push(point);
 }
 if(points.length<count)throw Error('Placement capacity exhausted for '+count);
 return points;
}
