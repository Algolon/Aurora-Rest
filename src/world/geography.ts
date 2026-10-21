/** Deterministic reference-aligned macro terrain. Geographic controls precede procedural detail. */
import {WORLD,LAKES,WATERCOURSES,type WaterPoint} from './config.ts';
import {COASTLINE,ISLETS} from './layout.ts';
export type Biome='ocean'|'shore'|'dune'|'forest'|'meadow'|'wetland'|'heath'|'alpine'|'rock'|'snow';
const clamp=(v:number,lo=0,hi=1)=>Math.min(hi,Math.max(lo,v));
const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const gauss=(x:number,z:number,cx:number,cz:number,rx:number,rz:number)=>Math.exp(-(((x-cx)/rx)**2+((z-cz)/rz)**2)*1.45);
function hash(i:number,j:number,seed:number){let n=(Math.imul(i,374761393)^Math.imul(j,668265263)^Math.imul(seed,1442695041))|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
export function noise(x:number,z:number,seed:number=WORLD.seed){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;const a=fx*fx*(3-2*fx),b=fz*fz*(3-2*fz);const p=hash(ix,iz,seed)*(1-a)+hash(ix+1,iz,seed)*a;const q=hash(ix,iz+1,seed)*(1-a)+hash(ix+1,iz+1,seed)*a;return (p*(1-b)+q*b)*2-1;}
export function fbm(x:number,z:number,seed:number=WORLD.seed){return .55*noise(x,z,seed)+.28*noise(x*2,z*2,seed+7)+.12*noise(x*4,z*4,seed+17)+.05*noise(x*8,z*8,seed+31);}

// Cached signed-distance field retains non-star-shaped bays and peninsulas.
// 20 m samples are finer than far terrain cells; height queries remain constant-time.
const COAST_CELL=20,COAST_W=WORLD.halfWidth*2/COAST_CELL+1,COAST_D=WORLD.halfLength*2/COAST_CELL+1;
const coastDistances=new Float32Array(COAST_W*COAST_D);
for(let row=0;row<COAST_D;row++)for(let col=0;col<COAST_W;col++){
 const x=col*COAST_CELL-WORLD.halfWidth,z=row*COAST_CELL-WORLD.halfLength;let inside=false,minSquared=Infinity;
 for(let i=0;i<COASTLINE.length;i++){
  const a=COASTLINE[i],b=COASTLINE[(i+1)%COASTLINE.length],dx=b[0]-a[0],dz=b[1]-a[1];
  const t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));
  minSquared=Math.min(minSquared,(x-a[0]-dx*t)**2+(z-a[1]-dz*t)**2);
  if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 coastDistances[row*COAST_W+col]=Math.sqrt(minSquared)*(inside?1:-1)/3000;
}
function mainlandField(x:number,z:number){
 if(Math.abs(x)>=WORLD.halfWidth||Math.abs(z)>=WORLD.halfLength)return -.05-Math.max(0,Math.abs(x)-WORLD.halfWidth,Math.abs(z)-WORLD.halfLength)/3000;
 const gx=(x+WORLD.halfWidth)/COAST_CELL,gz=(z+WORLD.halfLength)/COAST_CELL,ix=Math.floor(gx),iz=Math.floor(gz),u=gx-ix,v=gz-iz,index=iz*COAST_W+ix;
 return (coastDistances[index]*(1-u)+coastDistances[index+1]*u)*(1-v)
   +(coastDistances[index+COAST_W]*(1-u)+coastDistances[index+COAST_W+1]*u)*v;
}
export function coastField(x:number,z:number){
 let field=mainlandField(x,z);
 for(const island of ISLETS){const r=Math.hypot((x-island.x)/island.rx,(z-island.z)/island.rz);field=Math.max(field,(1-r)*Math.min(island.rx,island.rz)/3000);}
 return field;
}
export function riverAt(x:number,z:number):{distance:number;level:number;width:number;t:number}{
 let best={distance:Infinity,level:0,width:0,t:0};
 for(const ps of WATERCOURSES)for(let i=0;i<ps.length-1;i++){
  const a:WaterPoint=ps[i],b:WaterPoint=ps[i+1],dx=b.x-a.x,dz=b.z-a.z;
  const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz));
  const d=Math.hypot(x-a.x-dx*t,z-a.z-dz*t);
  if(d<best.distance)best={distance:d,level:a.level+(b.level-a.level)*t,width:a.width+(b.width-a.width)*t,t:i+t};
 }
 return best;
}
function ridge(x:number,z:number,cx:number,cz:number,angle:number,long:number,wide:number,height:number,seed:number){
  const dx=x-cx,dz=z-cz,co=Math.cos(angle),si=Math.sin(angle),u=(dx*co+dz*si)/long,v=(-dx*si+dz*co)/wide;
  const reach=Math.exp(-u*u*.72),cross=Math.exp(-(Math.abs(v)**1.55)*1.5);
  return height*reach*cross*(.86+.14*Math.sin(u*8+fbm(x/320,z/320,seed)*3));
}
/** Authored, asymmetric multi-summit crest; valleys read between linked rock ribs. */
function northSpine(x:number,z:number){
  const crests=[[-1650,2630,520,350],[-1200,2800,720,350],[-920,2740,500,350],[-510,2580,785,420],[-150,2780,460,370],[280,2910,600,340],[600,2780,360,300]];
  let h=0;
  for(let i=1;i<crests.length;i++){
    const a=crests[i-1],b=crests[i],dx=b[0]-a[0],dz=b[1]-a[1];
    const t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));
    const d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t),width=a[3]+(b[3]-a[3])*t;
    h=Math.max(h,(a[2]+(b[2]-a[2])*t)*Math.exp(-Math.pow(d/width,1.35)*.95));
  }
  return h;
}

function baseHeight(x:number,z:number){
 const coast=mainlandField(x,z),inland=smooth(0,.12,coast);
 const north=northSpine(x,z)+ridge(x,z,200,2970,.3,1100,390,260,2)
   +ridge(x,z,-1450,2200,1.4,760,380,130,3);
 const shelf=320*gauss(x,z,1260,2030,1150,1380)
   +ridge(x,z,1990,1880,1.4,1000,300,290,4)
   +ridge(x,z,1440,2770,-.25,800,240,165,9);
 const valleyWalls=ridge(x,z,-650,1000,1.3,1000,330,185,61)
   +ridge(x,z,1250,900,1.2,700,260,115,62);
 const southern=ridge(x,z,-1050,-2550,-.3,1400,520,195,5)
   +ridge(x,z,-1500,-1750,1.1,950,390,60,6);
 const foldWalls=ridge(x,z,1900,300,1.4,650,260,135,7)
   +ridge(x,z,1150,700,-.5,520,210,85,8);
 const westCliffs=105*gauss(x,z,-2330,100,360,2400);
 const woodlandHills=58*gauss(x,z,-1100,-150,1050,1450);
 const valleyCarve=35*gauss(x,z,80,300,620,1700);
 const dunes=gauss(x,z,2220,-1710,470,1050)*24*(.55+.45*Math.sin(x/80+z/175));
 const detail=fbm(x/420,z/420,13)*14+fbm(x/118,z/118,29)*4+(north/900)*fbm(x/80,z/80,41)*28;
 let h=28+30*smooth(0,.3,coast)+north+shelf+valleyWalls+southern+foldWalls+westCliffs+woodlandHills+dunes-valleyCarve+detail*inland;
 // Broad U-shaped passage keeps the massif and eastern shelf distinct.
 const centre=80+Math.max(0,z-700)*.18;
 const valley=smooth(-450,350,z)*(1-smooth(1500,1900,z))*(1-smooth(150,470,Math.abs(x-centre)));
 const floor=80+Math.max(0,z+100)*.105;
 h=h*(1-valley)+Math.min(h,floor)*valley;
 const rim=smooth(0,.075,coast),shoreGrade=170+1100*gauss(x,z,-2300,200,450,2400);
 return h*rim+coast*shoreGrade*(1-rim);
}
export function heightAt(x:number,z:number):number{
 const mainland=mainlandField(x,z),coast=coastField(x,z);
 if(coast<-.04)return -20+coast*60;
 if(mainland<0){
  let h=Math.min(-.1,mainland*170);
  for(const island of ISLETS){const r=Math.hypot((x-island.x)/island.rx,(z-island.z)/island.rz);if(r<1)h=Math.max(h,island.height*Math.pow(1-r*r,.8));}
  return h;
 }
 let h=baseHeight(x,z);
 // Lakes share their exact basin controls with water rendering and traversal queries.
 for(const lake of LAKES){
  const r=Math.hypot((x-lake.x)/lake.rx,(z-lake.z)/lake.rz);
  const blend=1-smooth(1.08,1.95,r),target=lake.level+(r-1)*(lake.name==='High Tarn'?35:24);
  h=h*(1-blend)+target*blend;
 }
 // Western tarn approach: a broad hanging valley, not a thin artificially flat path.
 const t=clamp((z-1250)/900),approachX=450+350*t;
 const ramp=smooth(1100,1350,z)*(1-smooth(2180,2350,z))*(1-smooth(65,250,Math.abs(x-approachX)));
 h=h*(1-ramp)+(205+163*t)*ramp;
 // A low gravel floodplain provides a credible short boardwalk crossing above the cove.
 const crossing=(1-smooth(120,280,Math.abs(x-900)))*(1-smooth(70,230,Math.abs(z+2250)));
 h=h*(1-crossing)+(8+Math.abs(x-900)*.03)*crossing;
 const river=riverAt(x,z),full=river.width*1.2,bank=river.width*7;
 if(river.distance<bank){
  const inner=1-smooth(full,bank,river.distance),bed=river.level-2+Math.max(0,river.distance-full)*.18;
  h=h*(1-inner)+bed*inner;
 }
 const mire=gauss(x,z,550,-1450,850,730);
 h=h*(1-mire*.7)+Math.min(h,26+(1-mire)*55)*mire*.7;
 // Local flat apron for a modest exterior cabin, well inland of the cove shoreline.
 const home=WORLD.viewpoints[0],pad=1-smooth(22,95,Math.hypot(x-home.x,z-home.z));
 if(pad>0)h=h*(1-pad)+baseHeight(home.x,home.z)*pad;
 return h;
}
export function slopeAt(x:number,z:number){const d=8;return Math.hypot((heightAt(x+d,z)-heightAt(x-d,z))/(2*d),(heightAt(x,z+d)-heightAt(x,z-d))/(2*d));}
export function biomeAt(x:number,z:number,h=heightAt(x,z),slope=slopeAt(x,z)):Biome{
 if(h<0)return 'ocean';const coast=coastField(x,z);
 if(coast<.014&&h<18)return 'shore';
 if(gauss(x,z,2150,-1700,600,1100)>.32&&h<110&&slope<.6)return 'dune';
 if(gauss(x,z,550,-1450,900,800)>.3&&h<52&&slope<.2)return 'wetland';
 if(h>735||h>620&&noise(x/190,z/170,92)>.1&&slope<.9)return 'snow';
 if(slope>.7||h>500&&slope>.45)return 'rock';
 if(h>400)return 'alpine';if(h>250)return 'heath';
 const forest=Math.max(gauss(x,z,-1050,-350,1200,1550),gauss(x,z,1350,150,750,950),gauss(x,z,1770,-2700,550,600));
 return forest>.25&&slope<.5?'forest':'meadow';
}
export function regionAt(x:number,z:number):string{
 if(gauss(x,z,1250,2200,700,550)>.3)return 'High Tarn';
 if(z>1700&&heightAt(x,z)>300)return 'North Peak';
 if(gauss(x,z,1350,150,800,850)>.35)return 'Hidden Fold';
 if(z>300&&z<1400&&Math.abs(x-100)<650)return 'Cairn Saddle';
 if(x<-2100)return 'Windward Coast';
 if(gauss(x,z,2150,-1700,650,1100)>.3)return 'Dune Fields';
 if(gauss(x,z,1750,-3000,650,650)>.3)return 'Home Cove';
 if(gauss(x,z,-1050,-2550,1400,850)>.35)return 'South Shoulder';
 if(gauss(x,z,550,-1450,1000,950)>.3)return 'Mirelands';
 if(x>-400&&x<700&&z>-850&&z<700)return 'Central Valley';
 return 'Birchwood Forest';
}
export const LANDMARKS=WORLD.viewpoints.map(p=>({...p,elevation:heightAt(p.x,p.z)}));
