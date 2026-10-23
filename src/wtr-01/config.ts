/**
 * WTR-01 render-only configuration. Nothing in this file modifies hydrology,
 * raster heights, lake boundaries or the canonical R1 water mesh.
 */
export type Quality = 'low' | 'medium' | 'high';
export type WaterType = 'ocean' | 'lowerLake' | 'highTarn' | 'channel';
export const WATER_TYPES: readonly WaterType[] = ['ocean', 'lowerLake', 'highTarn', 'channel'] as const;
export interface WaterStyle {
  base: number; dark: number; sky: number;
  frequency: number; speed: number; slope: number; roughness: number;
  glint: number; fresnel: number; wind: readonly [number, number];
}
export type WaterPalette = Record<WaterType, WaterStyle>;
/** Calibratable *appearance* values, not inferred physical bathymetry. */
export const PALETTE: WaterPalette = {
  ocean:     {base:0x335d6c,dark:0x244653,sky:0xabc0c6,frequency:.14,speed:.22,slope:.085,roughness:.65,glint:.24,fresnel:.25,wind:[.84,.54]},
  lowerLake: {base:0x426d70,dark:0x315358,sky:0xaec5c0,frequency:.20,speed:.12,slope:.033,roughness:.81,glint:.15,fresnel:.19,wind:[.76,.65]},
  highTarn:  {base:0x3c6875,dark:0x2b4d5a,sky:0xc0ced0,frequency:.18,speed:.09,slope:.020,roughness:.86,glint:.11,fresnel:.23,wind:[.65,.76]},
  channel:   {base:0x466e75,dark:0x335761,sky:0xb6c6c8,frequency:.23,speed:.15,slope:.047,roughness:.77,glint:.13,fresnel:.17,wind:[.65,.76]}
};
export interface LakeBoundary {
  id:string; name:string; level:number; boundary:number[][];
}
export interface WaterStyleMetadata {
  waterType:WaterType; waterLevelM?:number; shorelineProximityM?:number;
  flowDirection?:readonly [number,number]; flowSpeedMps?:number;
}
/** Rendering-only typed fields. shorelineProximity and flow are PROPOSED,
 * never claimed to be available in the R1 water-mesh input. */
export const AVAILABLE_FIELDS = ['waterType','waterLevelM'] as const;
export const PROPOSED_FIELDS = ['shorelineProximityM','flowDirection','flowSpeedMps'] as const;
export function pointInRing(x:number,z:number,ring:readonly number[][]):boolean {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if((a[1]>z)!==(b[1]>z) && x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
interface LakeIndex {lake:LakeBoundary; bounds:readonly [number,number,number,number];kind:1|2}
/** These IDs are a visual classification adapter; original triangles are never edited. */
export function classifyCanonicalWaterMesh(vertices:Float32Array,lakes:readonly LakeBoundary[]){
  if(vertices.length%9!==0)throw new Error('Canonical water mesh must contain unindexed xyz triangles.');
  const index:LakeIndex[]=lakes.map(lake=>{
    if(!lake.boundary.length || !Number.isFinite(lake.level))throw new Error('Invalid canonical lake '+lake.id);
    const xs=lake.boundary.map(p=>p[0]), zs=lake.boundary.map(p=>p[1]);
    return {lake,bounds:[Math.min(...xs),Math.max(...xs),Math.min(...zs),Math.max(...zs)],kind:/high[\\s_-]*tarn/i.test(lake.id+' '+lake.name)?2:1};
  });
  const kinds=new Float32Array(vertices.length/3);
  const counts={lowerLake:0,highTarn:0,channel:0};
  for(let i=0;i<vertices.length;i+=9){
    const x=(vertices[i]+vertices[i+3]+vertices[i+6])/3;
    const y=(vertices[i+1]+vertices[i+4]+vertices[i+7])/3;
    const z=(vertices[i+2]+vertices[i+5]+vertices[i+8])/3;
    if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z))throw new Error('Invalid R1 water triangle '+i/9);
    let kind:1|2|3=3;
    for(const entry of index){
      const [minX,maxX,minZ,maxZ]=entry.bounds;
      if(x<minX||x>maxX||z<minZ||z>maxZ)continue;
      // Geometry carries a +0.025 m R1 rendering offset. This deliberately
      // tight level check avoids attributing unrelated channels to a lake.
      if(Math.abs(y-(entry.lake.level+.025))<.12 && pointInRing(x,z,entry.lake.boundary)){
        kind=entry.kind;break;
      }
    }
    kinds.fill(kind,i/3,i/3+3);
    if(kind===1)counts.lowerLake++;
    else if(kind===2)counts.highTarn++;
    else counts.channel++;
  }
  return {kinds,counts,triangles:vertices.length/9};
}
export function renderQualityDetail(q:Quality):0|1|2{return q==='low'?0:q==='medium'?1:2;}
