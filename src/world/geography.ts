/** WORLD-01 deterministic author-guided terrain, independently testable without Three.js. */
import { WORLD, type WaterPoint } from './config.ts';
export type Biome = 'ocean'|'shore'|'dune'|'forest'|'meadow'|'wetland'|'heath'|'alpine'|'rock'|'snow';
const clamp=(a:number,lo=0,hi=1)=>Math.min(hi,Math.max(lo,a));
const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const gauss=(x:number,z:number,cx:number,cz:number,rx:number,rz:number)=>Math.exp(-(((x-cx)/rx)**2+((z-cz)/rz)**2)*1.45);
function hash(i:number,j:number,seed:number){let n=(Math.imul(i,374761393)^Math.imul(j,668265263)^Math.imul(seed,1442695041))|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
export function noise(x:number,z:number,seed=WORLD.seed){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;const a=fx*fx*(3-2*fx),b=fz*fz*(3-2*fz);const p=hash(ix,iz,seed)*(1-a)+hash(ix+1,iz,seed)*a;const q=hash(ix,iz+1,seed)*(1-a)+hash(ix+1,iz+1,seed)*a;return (p*(1-b)+q*b)*2-1;}
export function fbm(x:number,z:number,seed=WORLD.seed){return .55*noise(x,z,seed)+.28*noise(x*2,z*2,seed+7)+.12*noise(x*4,z*4,seed+17)+.05*noise(x*8,z*8,seed+31);}
/** Signed, dimensionless inland mask. 0 represents the coastline, negative = sea. */
export function coastField(x:number,z:number){
  const a=Math.atan2(z/WORLD.halfLength,x/WORLD.halfWidth);
  const radius=Math.hypot(x/WORLD.halfWidth,z/WORLD.halfLength);
  const outline= .92+.092*Math.sin(3*a+.4)+.067*Math.sin(5*a-1.25)+.041*Math.cos(9*a+1.9)+.024*Math.sin(13*a-.8)
    -.12*gauss(x,z,2350,-2300,800,700) // sheltered bay cut inward on the SE coast
    -.12*gauss(x,z,-2520,120,700,700) // exposed western inlet
    +.08*gauss(x,z,-2300,1750,680,790) // windward northern headland
    -.12*gauss(x,z,-400,-3980,1000,700); // keep the south shoreline inside the tile bounds
  return outline-radius;
}
/** distance to piecewise line, plus interpolated drainage bed and stream width */
export function riverAt(x:number,z:number): {distance:number;level:number;width:number;t:number} {
  const ps:readonly WaterPoint[]=WORLD.water.river;
  let best={distance:Infinity,level:0,width:0,t:0};
  for(let i=0;i<ps.length-1;i++){
    const a=ps[i],b=ps[i+1],dx=b.x-a.x,dz=b.z-a.z;
    const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz));
    const d=Math.hypot(x-(a.x+dx*t),z-(a.z+dz*t));
    if(d<best.distance)best={distance:d,level:a.level+(b.level-a.level)*t,width:a.width+(b.width-a.width)*t,t:i+t};
  }
  return best;
}
/** Macro ridge as asymmetric elongated landform with mountainous contour variation. */
function ridge(x:number,z:number,cx:number,cz:number,angle:number,long:number,wide:number,height:number,seed:number){
  const dx=x-cx,dz=z-cz,co=Math.cos(angle),si=Math.sin(angle),u=(dx*co+dz*si)/long,v=(-dx*si+dz*co)/wide;
  const reach=Math.exp(-u*u*.72),cross=Math.exp(-(Math.abs(v)**1.55)*1.5);
  return height*reach*cross*(.86+.14*Math.sin(u*8+fbm(x/320,z/320,seed)*3));
}
function baseHeight(x:number,z:number){
  const coast=coastField(x,z),s=smooth(-.01,.17,coast),inland=Math.max(0,coast);
  const north = ridge(x,z,-650,2590,-.63,1700,540,605,1)
    +ridge(x,z,620,3090,.80,1120,450,365,2)
    +ridge(x,z,-1420,3340,.55,1100,370,240,3)
    +ridge(x,z,-1510,1580,-.48,1000,420,155,4);
  const southern=ridge(x,z,-910,-2470,-.35,1730,520,226,5)
    +ridge(x,z,-200,-1950,.42,1060,460,74,6);
  const shoulder=84*gauss(x,z,-1480,-1650,1200,1300)
    +ridge(x,z,-1720,680,-.45,670,205,118,87)
    +ridge(x,z,-860,810,.7,670,220,98,88);
  // Readable central U-shaped valley: low middle flanked by northwest and southeast shoulders.
  const valleyCarve=34*gauss(x,z,200,350,900,1700);
  const alpineCarve=65*gauss(x,z,320,1890,460,1280);
  // North ridge scree and glacially carved folded terrain; restrained macro noise.
  const rugged=fbm(x/420,z/420,13)*20 + fbm(x/118,z/118,29)*7;
  const rockDetail=(north/800)*fbm(x/75,z/75,41)*43;
  const dunes=22*gauss(x,z,940,-3220,1050,740)*(0.5+0.5*Math.sin(x/92+z/160)+.15*noise(x/70,z/70,9));
  const westCliffs=85*gauss(x,z,-2560,250,330,1500);
  let h=20+43*smooth(0,.38,inland)+north+southern+shoulder+westCliffs+98*gauss(x,z,0,980,850,670)+Math.max(0,dunes)-valleyCarve-alpineCarve+(rugged+rockDetail)*s;
  // Coast transitions into the sea while keeping cliff faces on the windward margin.
  const rim=clamp((coast+.025)/.085);
  h=h*rim+(-18+(coast*95))* (1-rim);
  return h;
}
export function heightAt(x:number,z:number):number{
  const coast=coastField(x,z);
  let h=baseHeight(x,z);
  if(coast<-.07)return -25+coast*65;
  // Hidden Fold enclosure: sheltered depression behind lower flanking hills.
  const hidden=gauss(x,z,-1260,420,560,550);
  h-=hidden*48;
  // Basin ring creates an embanked, alpine lake rather than a floating water disc.
  const {x:cx,z:cz,rx,rz}=WORLD.water.tarn;
  const r=Math.hypot((x-cx)/rx,(z-cz)/rz);
  const basin=1-smooth(1.0,1.6,r); // smooth accepts descending edges
  const target=WORLD.tarnLevel+(r-1)*43;
  h=h*(1-basin)+target*basin;
  // Downhill valley carve. River bed is always beneath a monotonically descending water profile.
  const river=riverAt(x,z);
  const full=river.width*1.20,bank=river.width*8;
  if(river.distance<bank && coast>-.05){
    // Authored drainage grade is the local base of a graded, shallow valley;
    // channel floor follows water while banks transition back into terrain.
    const inner=1-smooth(full,bank,river.distance);
    const bed=river.level-1.8+Math.max(0,river.distance-full)*.22;
    h=h*(1-inner)+bed*inner;
  }
  // Lowland wet basin and mire pools toward the river's lower catchment.
  const mire=gauss(x,z,1020,-870,700,1150);
  if(mire>.26)h=Math.min(h,23+(1-mire)*155);
  if(coast<0)h=Math.min(h,coast*155);
  else if(river.distance>river.width*1.2) h=Math.max(h,6*smooth(0,.07,coast));
  return h;
}
export function slopeAt(x:number,z:number){const d=12,hx=(heightAt(x+d,z)-heightAt(x-d,z))/(2*d),hz=(heightAt(x,z+d)-heightAt(x,z-d))/(2*d);return Math.hypot(hx,hz);}
export function biomeAt(x:number,z:number,h=heightAt(x,z),slope=slopeAt(x,z)):Biome{
  if(h<0) return 'ocean';
  const c=coastField(x,z), dune=gauss(x,z,940,-3220,1120,760),wet=gauss(x,z,1040,-960,750,1180);
  if(c<.025 && h<17)return 'shore';
  if(dune>.38&&h<92&&slope<.6)return 'dune';
  if(wet>.35&&h<38&&slope<.18)return 'wetland';
  if(h>695)return 'snow';
  if(h>470&&slope>.5)return 'rock';
  if(h>400)return 'alpine';
  if(slope>.75)return 'rock';
  if(h>235)return 'heath';
  const exposure=noise(x/450,z/450,105);
  return (h<175&&exposure>-.35&&slope<.4&&wet<.4)?'forest':'meadow';
}
export function regionAt(x:number,z:number):string{
  if(gauss(x,z,710,2590,500,400)>.42)return 'High Tarn';
  if(z>1540 && heightAt(x,z)>295)return 'North Peak';
  if(z>520 && z<1420 && Math.abs(x)<850)return 'Cairn Saddle';
  if(gauss(x,z,-1270,420,620,670)>.45)return 'Hidden Fold';
  if(gauss(x,z,-2430,300,520,2000)>.38)return 'Windward Coast';
  if(gauss(x,z,960,-3100,1200,850)>.45)return 'Dune Fields';
  if(gauss(x,z,-840,-2450,1600,900)>.35)return 'South Shoulder';
  if(gauss(x,z,1720,-2670,670,690)>.4)return 'Home Cove';
  if(gauss(x,z,940,-950,880,1550)>.37)return 'Mirelands';
  return 'Birchwood Forest';
}
export const LANDMARKS=WORLD.viewpoints.map(p=>({...p,elevation:heightAt(p.x,p.z)}));
