/** Offline grade-aware alignment. Output is committed; no pathfinding runs in the browser. */
import {writeFileSync} from 'node:fs';
import {walkHeightAt,waterLevelAt} from '../src/world/surface.ts';
const anchors:Record<string,[number,number][]>={
 'Forest → Saddle':[[1810,-2982],[1400,-2450],[1000,-2250],[800,-2250],[-550,-1500],[-750,-650],[50,-292],[100,668]],
 'Dune Coast':[[1810,-2982],[2150,-1700],[2350,-850],[2200,-700]],
 'Alpine Ascent':[[100,668],[350,1250],[500,1700],[820,2198]],
 'Hidden Fold':[[2150,-1700],[1700,-600],[1050,168],[1800,300],[2200,-700],[2150,-1700]],
 'Windward Rim':[[-1050,-2550],[-600,-1600],[-750,-650],[-2000,-500],[-2350,198]],
};
type Point=[number,number];
const heights=new Map<string,number>();
function h(x:number,z:number){const key=`${x},${z}`;let v=heights.get(key);if(v===undefined){v=walkHeightAt(x,z);heights.set(key,v);}return v;}
function edge(a:Point,b:Point){
 const d=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(d/4));let prev=h(...a),cost=0;
 for(let i=1;i<=n;i++){
  const x=a[0]+(b[0]-a[0])*i/n,z=a[1]+(b[1]-a[1])*i/n,y=h(x,z),grade=Math.abs(y-prev)/(d/n);
  if(y<waterLevelAt(x,z)+1||grade>.32)return Infinity;
  cost+=d/n*(1+grade*grade*18);prev=y;
 }
 return cost;
}
function solve(start:Point,end:Point):Point[]{
 const step=25,minX=Math.floor((Math.min(start[0],end[0])-550)/step)*step,minZ=Math.floor((Math.min(start[1],end[1])-550)/step)*step;
 const width=Math.ceil((Math.max(start[0],end[0])+550-minX)/step),depth=Math.ceil((Math.max(start[1],end[1])+550-minZ)/step);
 const point=(id:number):Point=>[minX+(id%width)*step,minZ+Math.floor(id/width)*step];
 const nearest=(p:Point)=>{
  const center=Math.round((p[1]-minZ)/step)*width+Math.round((p[0]-minX)/step);
  let best=center,bestCost=Infinity;
  for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){
   const id=center+dx+dz*width,cost=edge(p,point(id));if(cost<bestCost){best=id;bestCost=cost;}
  }
  if(!Number.isFinite(bestCost))throw Error(`Unwalkable anchor ${p}`);return best;
 };
 const first=nearest(start),last=nearest(end),costs=new Map([[first,0]]),parents=new Map<number,number>();
 const open:[number,number][]=[[first,0]];
 // Binary min-heap keeps generation practical on a full island corridor.
 function push(item:[number,number]){let i=open.length;open.push(item);while(i>0){const p=(i-1)>>1;if(open[p][1]<=item[1])break;open[i]=open[p];i=p;}open[i]=item;}
 function pop(){const result=open[0],tail=open.pop()!;if(open.length){let i=0;while(i*2+1<open.length){let c=i*2+1;if(c+1<open.length&&open[c+1][1]<open[c][1])c++;if(open[c][1]>=tail[1])break;open[i]=open[c];i=c;}open[i]=tail;}return result;}
 const closed=new Set<number>();
 while(open.length){
  const [id]=pop();if(closed.has(id))continue;closed.add(id);
  if(id===last){
   const path:Point[]=[end];let at=id;while(at!==first){path.unshift(point(at));at=parents.get(at)!;}path.unshift(point(first));path.unshift(start);
   if(!Number.isFinite(edge(start,point(first)))||!Number.isFinite(edge(point(last),end)))throw Error('Anchor is not walkable');
   const simple:Point[]=[start];let i=0;
   while(i<path.length-1){let next=i+1;for(let j=i+2;j<path.length;j++){if(Math.hypot(path[j][0]-path[i][0],path[j][1]-path[i][1])>180)break;if(Number.isFinite(edge(path[i],path[j])))next=j;}if(Math.hypot(path[next][0]-simple.at(-1)![0],path[next][1]-simple.at(-1)![1])>.01)simple.push(path[next]);i=next;}
   return simple;
  }
  const a=point(id),ix=id%width,iz=Math.floor(id/width);
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
   if((dx===0&&dz===0)||ix+dx<0||ix+dx>=width||iz+dz<0||iz+dz>=depth)continue;
   const next=id+dx+dz*width;if(closed.has(next))continue;const b=point(next),value=costs.get(id)!+edge(a,b);
   if(value<(costs.get(next)??Infinity)){costs.set(next,value);parents.set(next,id);push([next,value+Math.hypot(b[0]-end[0],b[1]-end[1])]);}
  }
 }
 throw Error(`No grade-safe route from ${start} to ${end}`);
}
const routes:Record<string,Point[]>={};
for(const [name,points] of Object.entries(anchors)){
 const route:Point[]=[];for(let i=1;i<points.length;i++){const section=solve(points[i-1],points[i]);route.push(...(i>1?section.slice(1):section));}
 routes[name]=route;console.log(`${name}: ${route.length} controls`);
}
writeFileSync('src/world/routes.ts',`/** WORLD-01B grade-aware authored corridors. Regenerate with npm run routes:align. */\nexport const ROUTES:Record<string,readonly [number,number][]> = ${JSON.stringify(routes,null,2)};\n`);
