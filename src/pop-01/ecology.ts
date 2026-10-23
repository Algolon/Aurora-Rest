import type {Community,EnvironmentSample,Family} from './contracts.ts';
export function hash(seed:number,x:number,z:number,salt=0){let h=(seed^Math.imul(x,374761393)^Math.imul(z,668265263)^Math.imul(salt,1442695041))>>>0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
const smooth=(t:number)=>t*t*(3-2*t);
export function field(seed:number,x:number,z:number,span:number,salt=0){const i=Math.floor(x/span),j=Math.floor(z/span),u=smooth(x/span-i),v=smooth(z/span-j);return (hash(seed,i,j,salt)*(1-u)+hash(seed,i+1,j,salt)*u)*(1-v)+(hash(seed,i,j+1,salt)*(1-u)+hash(seed,i+1,j+1,salt)*u)*v;}
export const COMMUNITIES:Record<Community,{trees:number;grass:number;rocks:number;pine:number;future:string[]}>= {
 'birch-woodland':{trees:.74,grass:.53,rocks:.15,pine:.18,future:['woodland understory','litter']},
 'pine-woodland':{trees:.59,grass:.25,rocks:.24,pine:.82,future:['roots','dry understory']},
 meadow:{trees:.07,grass:.82,rocks:.09,pine:.2,future:['flowers']},
 'alpine-heath':{trees:0,grass:.14,rocks:.48,pine:0,future:['heather','dwarf shrubs']},
 'rocky-coast':{trees:.025,grass:.12,rocks:.55,pine:.6,future:['coastal plants','bedrock']},
 wetland:{trees:.02,grass:.24,rocks:.045,pine:.1,future:['sedges','rushes']},
 dunes:{trees:.02,grass:.12,rocks:.04,pine:.7,future:['dune grasses']}
};
/** Provisional art-directed suitability; outputs do not claim measured botanical data. */
export function community(s:EnvironmentSample,seed:number):{id:Community;patch:number;forest:number}{
 const macro=field(seed,s.x,s.z,310,11),meso=field(seed,s.x,s.z,68,23),micro=field(seed,s.x,s.z,17,37);
 const patch=.55*meso+.3*macro+.15*micro;
 const woodland=s.woodlandAffinity;
 const forest=Math.max(0,Math.min(1,(macro+woodland-.7)*2))*Math.max(0,Math.min(1,(woodland-.15)*2));
 let id:Community=forest>.48?(field(seed,s.x,s.z,220,90)>.68?'pine-woodland':'birch-woodland'):'meadow';
 if(s.moisture>.58&&s.slope<.18)id='wetland';
 if(s.region==='dunes'&&s.elevation<55)id='dunes';
 if(s.coastDistance<45&&s.exposure>.3)id='rocky-coast';
 if(s.elevation>340||s.exposure>.85)id='alpine-heath';
 return {id,patch,forest};
}
export const RULES:Record<Family,{cell:number;spacing:number;maxSlope:number;maxHeight:number;waterClearance:number;coastClearance:number;trailClearance:number}>= {
 birch:{cell:7,spacing:5.2,maxSlope:.55,maxHeight:330,waterClearance:4,coastClearance:8,trailClearance:3.3},
 pine:{cell:7,spacing:5.2,maxSlope:.65,maxHeight:300,waterClearance:5,coastClearance:9,trailClearance:3.3},
 grass:{cell:2.8,spacing:.65,maxSlope:.7,maxHeight:430,waterClearance:.9,coastClearance:1.8,trailClearance:1.15},
 rock:{cell:11,spacing:3.2,maxSlope:1.5,maxHeight:1000,waterClearance:1.5,coastClearance:1.5,trailClearance:2.6}
};
