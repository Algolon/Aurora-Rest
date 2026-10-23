/** POP owns placement only. Proposed contract for later MAT/WTR reconciliation. */
export type Provenance='VERIFIED'|'DERIVED'|'ART-DIRECTED'|'FUTURE';
export type Family='birch'|'pine'|'grass'|'rock';
export type Community='birch-woodland'|'pine-woodland'|'meadow'|'alpine-heath'|'rocky-coast'|'wetland'|'dunes';
export type Vec3=[number,number,number];
export interface EnvironmentSample {
 x:number;z:number;elevation:number;normal:Vec3;slope:number;
 waterLevel:number;waterKind:'ocean'|'inland'|'dry';dry:boolean;
 coastDistance:number;waterDistance:number;trailDistance:number;
 region:string;woodlandAffinity:number;exposure:number;moisture:number;
}
export interface EnvironmentQuery {
 readonly revision:string;
 readonly bounds:{west:number;east:number;south:number;north:number};
 sample(x:number,z:number):EnvironmentSample;
 elevation(x:number,z:number):number;
}
export interface Placement {
 id:string;family:Family;variant:number;x:number;y:number;z:number;
 rotation:number;scale:number;normal:Vec3;alignment:'upright'|'terrain';
 burial:number;tint:number;renderClass:'tree-lod'|'near-cover'|'rock-lod';chunk:string;
 metadata:{community:Community;patch:number;region:string;slope:number;source:string};
}
export interface Chunk {x:number;z:number}
export interface ChunkPopulation {
 key:string;instances:Placement[];candidates:number;rejected:Record<string,number>;generationMs:number;
 /** UTF-8 JSON length, not JS heap or GPU allocation. */
 serializedBytes:number;
}
export interface PopulationRenderer {
 /** Atomic: on failure retain nothing. Renderer owns per-chunk buffers, not shared family geometry. */
 attach(chunk:ChunkPopulation):void;
 detach(key:string):void;
 dispose():void;
}
export const INPUT_STATUS:Record<string,{status:Provenance;note:string}>={
 terrain:{status:'VERIFIED',note:'Committed 4 m grid and triangle interpolation; no regeneration'},
 water:{status:'VERIFIED',note:'Canonical clipped water mesh and sea level 0; raster retained and hash protected'},
 slope:{status:'DERIVED',note:'Finite-difference normal over 8 m; not geological rock classification'},
 distances:{status:'DERIVED',note:'Indexed canonical coast, water-mesh boundary, route centrelines; distances capped at query radius'},
 route:{status:'ART-DIRECTED',note:'R1 grade-tested candidate centrelines; provisional narrow tread, not reservation width'},
 region:{status:'ART-DIRECTED',note:'Nearest named geography anchor; provisional ecological weights, not canonical biomes'},
 moisture:{status:'ART-DIRECTED',note:'Conservative water-proximity/low-slope proxy, no soil or groundwater simulation'},
 exposure:{status:'ART-DIRECTED',note:'Elevation + coast proximity proxy; no wind simulation'},
 materials:{status:'FUTURE',note:'MAT-01 classification adapter; no dependency on unfinished implementation'},
 species:{status:'FUTURE',note:'Heather, sedges, shrubs, roots, litter and dune plants need dedicated approved assets'}
};
