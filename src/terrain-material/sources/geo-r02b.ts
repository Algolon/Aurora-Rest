/** Terrain data layer adapter for the GEO-R02B-R1 canonical artifacts (public/geo-r02b/).
 * Read-only: it wraps the committed buffers and never edits heights, water, catchments or anchors. */
import type {TerrainDataSource} from '../types.ts';

export interface GeoR02BFeatures {
 meta:{masterSha256:string;terrainSha256:string;grid:{width:number;height:number;cellM:number;west:number;north:number}};
 catchments:{id:string;name:string;rings:number[][][]}[];
 anchors:{id:string;name:string;xzM:[number,number]}[];
}

export function geoR02BSource(heights:Float32Array,water:Float32Array|null,features:GeoR02BFeatures):TerrainDataSource{
 const g=features.meta.grid;
 if(heights.length!==g.width*g.height)throw new Error(`terrain.f32 has ${heights.length} samples; features.json expects ${g.width}×${g.height}`);
 if(water&&water.length!==heights.length)throw new Error('water-surface.f32 does not match the terrain lattice');
 return {
  id:'geo-r02b-r1',
  lattice:{width:g.width,height:g.height,cellM:g.cellM,west:g.west,north:g.north},
  heights,water,
  regions:features.catchments.map(c=>({id:c.id,name:c.name,rings:c.rings})),
  anchors:features.anchors.map(a=>({id:a.id,name:a.name,xz:[a.xzM[0],a.xzM[1]] as [number,number]})),
  provenance:{terrainSha256:features.meta.terrainSha256,masterSha256:features.meta.masterSha256},
 };
}
