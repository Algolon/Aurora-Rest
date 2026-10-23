/** CPU query API over the canonical classification. This is the integration contract for vegetation,
 * rocks, trails and audio: the shader samples the same bytes with the same bilinear lattice mapping. */
import type {MaterialClassification,MaterialId,SurfaceSample} from './types.ts';

export class TerrainMaterialQuery {
 readonly map:MaterialClassification;
 private readonly ids:readonly MaterialId[];
 private readonly w=new Float64Array(4);
 constructor(map:MaterialClassification){this.map=map;this.ids=map.materials;}

 /** Bilinear lattice coordinates; identical to the shader's texel-centre mapping. */
 private cell(x:number,z:number){
  const {width:W,height:H,cellM:c,west,north}=this.map.lattice;
  const gx=Math.min(W-1.000001,Math.max(0,(x-west)/c)),gz=Math.min(H-1.000001,Math.max(0,(north-z)/c));
  const i=Math.floor(gx),j=Math.floor(gz);
  return {k:j*W+i,W,u:gx-i,v:gz-j};
 }
 private bilinear(bytes:Uint8Array,stride:number,channel:number,x:number,z:number){
  const {k,W,u,v}=this.cell(x,z),a=bytes[k*stride+channel],b=bytes[(k+1)*stride+channel],c=bytes[(k+W)*stride+channel],d=bytes[(k+W+1)*stride+channel];
  return ((a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v)/255;
 }

 /** Normalised material weights at world (x, z), in `materials` order. Sums to 1. */
 weightsAt(x:number,z:number,out:Float64Array=new Float64Array(this.ids.length)):Float64Array{
  let sum=0;
  for(let m=0;m<this.ids.length;m++){const layer=m>>2,size=this.map.lattice.width*this.map.lattice.height*4;
   out[m]=this.bilinear(this.map.weights.subarray(layer*size,(layer+1)*size),4,m&3,x,z);sum+=out[m];}
  for(let m=0;m<out.length;m++)out[m]/=sum||1;
  return out;
 }
 weightOf(id:MaterialId,x:number,z:number){const m=this.ids.indexOf(id);if(m<0)throw new Error('Unknown material '+id);return this.weightsAt(x,z,this.w)[m];}
 attribute(channel:0|1|2|3,x:number,z:number){return this.bilinear(this.map.attributes,4,channel,x,z);}

 sample(x:number,z:number):SurfaceSample{
  const w=this.weightsAt(x,z,this.w),weights={} as Record<MaterialId,number>;let dominant=this.ids[0],best=-1;
  this.ids.forEach((id,m)=>{weights[id]=w[m];if(w[m]>best){best=w[m];dominant=id;}});
  return {weights,dominant,dominantWeight:best,wetness:this.attribute(0,x,z),macro:this.attribute(1,x,z),exposure:this.attribute(2,x,z)};
 }

 /** Mean composition over a disc (deterministic n×n stratified grid) for population density decisions. */
 coverage(x:number,z:number,radiusM:number,n=7):Record<MaterialId,number>{
  const acc=new Float64Array(this.ids.length),tmp=new Float64Array(this.ids.length);let count=0;
  for(let b=0;b<n;b++)for(let a=0;a<n;a++){
   const dx=((a+.5)/n*2-1)*radiusM,dz=((b+.5)/n*2-1)*radiusM;if(dx*dx+dz*dz>radiusM*radiusM)continue;
   this.weightsAt(x+dx,z+dz,tmp);for(let m=0;m<acc.length;m++)acc[m]+=tmp[m];count++;
  }
  const out={} as Record<MaterialId,number>;this.ids.forEach((id,m)=>{out[id]=acc[m]/Math.max(1,count);});return out;
 }
}
