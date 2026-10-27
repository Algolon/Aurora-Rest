/**
 * GEO-ISLAND-R02 local walking-corridor feasibility survey.
 * Read-only, uses the exact committed 4 m R1 triangle field and water raster.
 * Searches lateral offsets around documented width conflicts. Output is a
 * candidate survey, NOT a committed route, path/tread, or freeze approval.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(process.argv[2]||'.');
const dest=resolve(process.argv[3]||'/tmp/geo-island-r02-evidence');
mkdirSync(dest,{recursive:true});
const features=JSON.parse(readFileSync(resolve(root,'public/geo-r02b/features.json'),'utf8'));
const integrity=JSON.parse(readFileSync(resolve(root,'docs/geo-r02b-r1/integrity.json'),'utf8'));
const geo=features.meta.grid,w=geo.width,h=geo.height,cell=geo.cellM??4,west=geo.west??-3000,north=geo.north??4000;
const fromBytes=name=>{const b=readFileSync(resolve(root,name));const v=new Float32Array(b.buffer,b.byteOffset,b.byteLength/4);if(v.length!==w*h)throw Error('Grid has incorrect size: '+name);return v;};
const terrain=fromBytes('public/geo-r02b/terrain.f32');
const water=fromBytes('public/geo-r02b/water-surface.f32');
const defined=(n,x)=>{if(!Number.isFinite(n))throw Error('Nonfinite '+x);return n;};
const node=(v,i,j)=>v[Math.max(0,Math.min(h-1,j))*w+Math.max(0,Math.min(w-1,i))];
function surface(values,x,z){
 const gx=Math.max(0,Math.min(w-1-1e-8,(x-west)/cell)), gz=Math.max(0,Math.min(h-1-1e-8,(north-z)/cell));
 const i=Math.floor(gx),j=Math.floor(gz),u=gx-i,v=gz-j;
 const a=node(values,i,j),b=node(values,i,j+1),c=node(values,i+1,j);
 if(u+v<=1)return a+(c-a)*u+(b-a)*v;
 const d=node(values,i+1,j+1);
 return d+(b-d)*(1-u)+(c-d)*(1-v);
}
const height=(x,z)=>surface(terrain,x,z);
const waterLevel=(x,z)=>{const a=surface(water,x,z);return Number.isFinite(a)?Math.max(0,a):0;};
const dry=(x,z)=>height(x,z)>waterLevel(x,z)+.06;
function getRoute(){const r=features.routes?.find(q=>q.id==='hero');if(!r||!Array.isArray(r.points2)||r.points2.length<2)throw Error('Hero route missing from actual features');return r;}
const route=getRoute();
function tangent(x,z){
 let best=Infinity,vec=null,segment=-1;
 for(let i=1;i<route.points2.length;i++){
  const [ax,az]=route.points2[i-1],[bx,bz]=route.points2[i],dx=bx-ax,dz=bz-az,len2=dx*dx+dz*dz;
  if(len2<.01)continue;
  const t=Math.min(1,Math.max(0,((x-ax)*dx+(z-az)*dz)/len2)),dist=Math.hypot(x-ax-t*dx,z-az-t*dz);
  if(dist<best){const len=Math.sqrt(len2);best=dist;vec=[dx/len,dz/len];segment=i-1;}
 }
 if(!vec)throw Error('No route direction');
 return {t:vec,n:[-vec[1],vec[0]],segment,distanceToRouteM:best};
}
function evaluate(x,z,d){
 const [tx,tz]=d.t,[nx,nz]=d.n;
 let worstCross=0,worstAlong=0,minDry=Infinity;
 for(const t of [-8,0,8]){
  const cx=x+tx*t,cz=z+tz*t,a=[cx-nx*1.7,cz-nz*1.7],b=[cx+nx*1.7,cz+nz*1.7];
  const vals=[a,[cx,cz],b];
  for(const [px,pz] of vals)minDry=Math.min(minDry,height(px,pz)-waterLevel(px,pz));
  worstCross=Math.max(worstCross,Math.abs(height(...a)-height(...b))/3.4);
 }
 worstAlong=Math.abs(height(x+tx*8,z+tz*8)-height(x-tx*8,z-tz*8))/16;
 return {x:+x.toFixed(2),z:+z.toFixed(2),crossGrade:+worstCross.toFixed(4),
  alongGrade:+worstAlong.toFixed(4),dryClearance:+minDry.toFixed(3),
  pass:worstCross<=.35&&worstAlong<=.25&&minDry>.06};
}
const records=integrity.routes.find(x=>x.id==='hero')?.widthConflicts;
if(!Array.isArray(records))throw Error('Cannot locate historical sampled hero conflicts');
const conflicts=records.map((r,i)=>{
 const [x,z]=r.xz,d=tangent(x,z),at=evaluate(x,z,d);
 let options=[];
 for(let offset=-16;offset<=16;offset+=2){
  const px=x+d.n[0]*offset,pz=z+d.n[1]*offset,score=evaluate(px,pz,d);
  if(score.pass)options.push({...score,offsetM:offset});
 }
 options.sort((a,b)=>Math.abs(a.offsetM)-Math.abs(b.offsetM)||a.crossGrade-b.crossGrade);
 return {index:i+1,originalXZ:[x,z],sourceCrossGrade:r.crossGrade,
  nearestRouteSegment:d.segment,nearestRouteDistanceM:+d.distanceToRouteM.toFixed(2),
  measuredAtPoint:at,localCandidates:options.slice(0,5),viableLocalOffsetFound:options.length>0,
  zone:Math.abs(x)<350&&z>-600&&z<500?'Central Valley / Cairn approach':'Other hero-route section'};
});
const verdict=conflicts.filter(c=>c.viableLocalOffsetFound).length;
const report={milestone:'GEO-ISLAND-R02-B',status:'LOCAL CANDIDATE SEARCH ONLY; NOT A CORRIDOR PASS',
 baseTerrainSha256:features.meta.terrainSha256,historyRouteLengthM:integrity.routes.find(x=>x.id==='hero')?.lengthM,
 criteria:{halfTreadWidthM:1.7,maxCrossGrade:0.35,maxLocalLongitudinalGrade:0.25,
  stationSpanM:16,offsetRangeM:16,stepM:2},
 historicalConflicts:conflicts.length,viableLocalOffsets:verdict,conflicts,
 limits:['Uses documented conflict sample points, not a continuous exhaustive corridor audit',
  'Lateral offsets do not establish connected walkable trails',
  'No route, terrain, ecosystem placements, or Git histories modified',
  'Any candidate requires interpolation, grade and cross-slope continuity, water and visibility checks, 1.7 m player view, and art acceptance']};
writeFileSync(dest+'/route-corridor-local-survey.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({historicalConflicts:conflicts.length,viableLocalOffsets:verdict,details:conflicts.map(c=>({xz:c.originalXZ,viable:c.viableLocalOffsetFound,offset:c.localCandidates[0]?.offsetM}))},null,2));
