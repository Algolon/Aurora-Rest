import {HeightGrid,type Data} from '../geo-r02b/terrain.ts';
import {SegmentIndex} from './spatial.ts';
import type {EnvironmentQuery,EnvironmentSample,Vec3} from './contracts.ts';
export interface GeoData extends Data {waterMesh:{file:string;surfaceFile:string;meshSha256:string};anchors:{id:string;name:string;xzM:[number,number]}[]}
/** Mesh surfaces, rather than authored channel widths, decide water exclusion. */
export class CanonicalEnvironment implements EnvironmentQuery {
 readonly revision:string;
 readonly bounds={west:-3000,east:3000,south:-4000,north:4000};
 readonly coast=new SegmentIndex();readonly shore=new SegmentIndex();readonly trails=new SegmentIndex();
 private waterBins=new Map<string,number[]>();
 readonly data:GeoData;readonly height:HeightGrid;readonly water:Float32Array;
 constructor(data:GeoData,height:HeightGrid,water:Float32Array){
  this.data=data;this.height=height;this.water=water;
  this.revision='geo-r02c-p0:'+data.meta.terrainSha256+':'+data.waterMesh.meshSha256;
  if(height.values.length!==data.meta.grid.width*data.meta.grid.height||water.length%9)throw Error('Invalid canonical data');
  this.coast.ring(data.coast,true);for(const i of data.islands)this.coast.ring(i.boundary,true);
  for(const r of data.routes)this.trails.ring(r.points2);
  // Internal shared triangle edges cancel. Remaining edges are canonical wet/dry boundaries.
  const edges=new Map<string,[number,number,number,number]>();
  for(let i=0;i<water.length;i+=9){
   const xs=[water[i],water[i+3],water[i+6]],zs=[water[i+2],water[i+5],water[i+8]];
   for(let bx=Math.floor(Math.min(...xs)/64);bx<=Math.floor(Math.max(...xs)/64);bx++)for(let bz=Math.floor(Math.min(...zs)/64);bz<=Math.floor(Math.max(...zs)/64);bz++){const k=bx+','+bz;let bin=this.waterBins.get(k);if(!bin)this.waterBins.set(k,bin=[]);bin.push(i);}
   for(let j=0;j<3;j++){const k=(j+1)%3,a=xs[j]+','+zs[j],b=xs[k]+','+zs[k],key=a<b?a+'|'+b:b+'|'+a;if(edges.has(key))edges.delete(key);else edges.set(key,[xs[j],zs[j],xs[k],zs[k]]);}
  }
  for(const [ax,az,bx,bz] of edges.values())this.shore.add({ax,az,bx,bz});
 }
 elevation(x:number,z:number){return this.height.surface(x,z);}
 waterLevel(x:number,z:number){
  let level=0;const w=this.water;
  for(const i of this.waterBins.get(Math.floor(x/64)+','+Math.floor(z/64))??[]){
   const ax=w[i],az=w[i+2],bx=w[i+3],bz=w[i+5],cx=w[i+6],cz=w[i+8];
   const den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(den)<1e-10)continue;
   const a=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/den,b=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/den;
   if(a>=-1e-7&&b>=-1e-7&&a+b<=1+1e-7)level=Math.max(level,a*w[i+1]+b*w[i+4]+(1-a-b)*w[i+7]-.025);
  }return level;
 }
 sample(x:number,z:number):EnvironmentSample{
  const elevation=this.elevation(x,z),dx=(this.elevation(x+4,z)-this.elevation(x-4,z))/8,dz=(this.elevation(x,z+4)-this.elevation(x,z-4))/8,l=Math.hypot(dx,1,dz),normal:Vec3=[-dx/l,1/l,-dz/l];
  const waterLevel=this.waterLevel(x,z),coastDistance=this.coast.distance(x,z,192),waterDistance=Math.min(this.shore.distance(x,z,64),coastDistance),trailDistance=this.trails.distance(x,z,32);
  const anchor=this.data.anchors.reduce((a,b)=>Math.hypot(x-a.xzM[0],z-a.xzM[1])<Math.hypot(x-b.xzM[0],z-b.xzM[1])?a:b);
  let weights=0,woodlandAffinity=0;for(const a of this.data.anchors){const w=Math.exp(-Math.hypot(x-a.xzM[0],z-a.xzM[1])/450);weights+=w;woodlandAffinity+=w*(a.id==='forest'?.9:a.id==='valley'?.16:a.id==='home'?.48:.34);}woodlandAffinity/=weights;
  const dry=x>=-3000&&x<3000&&z>=-4000&&z<4000&&elevation>waterLevel+.06;
  const slope=Math.hypot(dx,dz),exposure=Math.min(1,Math.max(0,elevation/650+(192-coastDistance)/384));
  const moisture=Math.min(1,(64-waterDistance)/80+(elevation<18&&slope<.12?.3:0));
  return {x,z,elevation,normal,slope,waterLevel,waterKind:dry?'dry':waterLevel>.05?'inland':'ocean',dry,coastDistance,waterDistance,trailDistance,region:anchor.id,woodlandAffinity,exposure,moisture};
 }
 reviewRegions(){return ['forest','valley','home'].map(id=>{const a=this.data.anchors.find(a=>a.id===id);if(!a)throw Error('Missing geographic anchor '+id);const [x,z]=a.xzM,s=this.sample(x,z);if(!s.dry)throw Error('Review anchor not dry: '+id);return {id,name:a.name,x,z,elevation:s.elevation,source:'features.json anchors.'+id};});}
}
