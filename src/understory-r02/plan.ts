/** Single authored ~7m × 6m forest-floor quadrat. This is NOT a regional ecology generator. */
export type Kind='bilberry'|'lingonberry'|'feathermoss';
export interface PlantPosition {id:string;kind:Kind;variant:0|1|2;x:number;z:number;scale:number;angle:number;colony:string}
export const STUDY=Object.freeze({id:'understory-r02-site-study-a1',widthM:7.2,depthM:6.4,openTreadWidthM:.82,seed:120241});
const clusters=[
 {id:'B01',kind:'bilberry',x:-2.35,z:-1.5,rx:.98,rz:.95,count:8},
 {id:'B02',kind:'bilberry',x:-2.45,z:1.25,rx:.87,rz:1.05,count:8},
 {id:'B03',kind:'bilberry',x:2.28,z:-1.88,rx:.84,rz:.67,count:6},
 {id:'B04',kind:'bilberry',x:1.9,z:1.95,rx:.73,rz:.49,count:4},
 {id:'L01',kind:'lingonberry',x:2.45,z:1.18,rx:.90,rz:1.18,count:9},
 {id:'L02',kind:'lingonberry',x:2.34,z:-.94,rx:.95,rz:.82,count:9},
 {id:'L03',kind:'lingonberry',x:-1.8,z:-2.15,rx:.77,rz:.55,count:5},
 {id:'L04',kind:'lingonberry',x:-1.67,z:.32,rx:.52,rz:.57,count:4},
 {id:'M01',kind:'feathermoss',x:-2.56,z:.08,rx:1.02,rz:1.42,count:8},
 {id:'M02',kind:'feathermoss',x:2.25,z:-1.55,rx:1.06,rz:.88,count:6},
 {id:'M03',kind:'feathermoss',x:1.5,z:2.28,rx:1.03,rz:.55,count:5}
] as const satisfies readonly {id:string;kind:Kind;x:number;z:number;rx:number;rz:number;count:number}[];
export const COLONIES=clusters;
export function hash(i:number,j:number,k=0){let a=(2166136261^Math.imul(i+137,374761393)^Math.imul(j+31,668265263)^Math.imul(k+1,1274126177))>>>0;a=Math.imul(a^(a>>>13),1274126177);return ((a^(a>>>16))>>>0)/4294967296}
export function treadCenter(z:number){return .08+.13*z+.24*Math.sin(z*1.03-.4)}
export function treadDistance(x:number,z:number){return Math.abs(x-treadCenter(z));}
export function groundHeight(x:number,z:number){return .037*Math.sin(x*1.12+z*.53)*Math.cos(z*.92)+.014*Math.sin(x*2.38-z*1.36)+.006*Math.cos(x*4.31+z*2.69);}
export function colonyField(kind:Kind,x:number,z:number){
 let v=0;
 for(const c of clusters){if(c.kind!==kind)continue;
 const dx=(x-c.x)/c.rx,dz=(z-c.z)/c.rz;
 const noise=.15*Math.sin(x*4.1+z*2.4+c.count)+.12*Math.cos(z*3.2-x*2.9);
 const intensity=Math.max(0,1-Math.sqrt(dx*dx+dz*dz)+noise);
 v=Math.max(v,intensity);
 }
 const edge=Math.min(1,Math.max(0,(treadDistance(x,z)-.54)/.43));
 return v*edge;
}
export function authoredLayout():PlantPosition[]{
 const out:PlantPosition[]=[];
 for(let k=0;k<clusters.length;k++){
  const c=clusters[k];
  for(let j=0;j<c.count;j++){
   const theta=j*2.399963229728653+hash(k,j,1)*.42,rad=Math.sqrt((j+.38)/c.count)*(.66+.42*hash(k,j,2));
   const x=c.x+Math.cos(theta)*c.rx*rad,z=c.z+Math.sin(theta)*c.rz*rad;
   if(Math.abs(x)>STUDY.widthM/2-.18||Math.abs(z)>STUDY.depthM/2-.16||treadDistance(x,z)<STUDY.openTreadWidthM/2+.22)continue;
   const scale=(c.kind==='feathermoss'?.95:c.kind==='lingonberry'?.85:.88)+.24*hash(k,j,3);
   out.push({id:'understory-r02:'+c.id+':'+j,kind:c.kind,variant:(j%3) as 0|1|2,x,z,scale,angle:theta+hash(k,j,4)*1.7,colony:c.id});
  }
 }
 return out;
}
export function spatialAudit(){
 const p=authoredLayout(),counts:{[K in Kind]:number}={bilberry:0,lingonberry:0,feathermoss:0};
 p.forEach(x=>counts[x.kind]++);
 return{bounds:[-STUDY.widthM/2,STUDY.widthM/2,-STUDY.depthM/2,STUDY.depthM/2],counts,colonies:clusters.length,ids:p.map(x=>x.id),positions:p.map(({id,x,z,kind})=>({id,x,z,kind})),treadWidthM:STUDY.openTreadWidthM};
}
