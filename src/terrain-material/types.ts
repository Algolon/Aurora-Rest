/** MAT-01 terrain-material contracts. These types are renderer-independent: nothing here imports Three.js. */

/** Stable material identifiers. MAT-02 appends ids; existing ids and their layer slots never change meaning. */
export type MaterialId='forest-floor'|'meadow-turf'|'coastal-sand'|'bedrock';

/** Regular world-space lattice. Node (i,j) sits at x = west + i·cellM, z = north − j·cellM (rows run south). */
export interface Lattice {width:number;height:number;cellM:number;west:number;north:number}

/** How trustworthy an input is. Every classification input declares one of these. */
export type InputProvenance='verified-source'|'derived'|'provisional-artistic'|'future';

/** Terrain data layer: the only thing classification knows about the world. Implemented by an adapter per terrain source. */
export interface TerrainDataSource {
 readonly id:string;
 readonly lattice:Lattice;
 /** Canonical node heights in metres, row-major, `lattice.width × lattice.height`. Never mutated. */
 readonly heights:Float32Array;
 /** Water-surface level per node: NaN = dry, 0 = sea, > 0 = freshwater (lakes and channels). */
 readonly water:Float32Array|null;
 /** Named polygons with authored ecological intent (e.g. catchments). Rings are [x, z] in metres. */
 readonly regions:readonly {id:string;name:string;rings:number[][][]}[];
 /** Named anchor points (x, z) in metres. */
 readonly anchors:readonly {id:string;name:string;xz:[number,number]}[];
 /** Source checksums for provenance reporting. */
 readonly provenance:Record<string,string>;
}

/** Per-node auxiliary surface attributes stored beside the weights (RGBA8, 0..255 each). */
export const ATTRIBUTE_CHANNELS=['wetness','macro','exposure','slope'] as const;
export type AttributeChannel=typeof ATTRIBUTE_CHANNELS[number];

/** The canonical classification. Shader and CPU consumers both read this exact data. */
export interface MaterialClassification {
 readonly schema:'aurora-rest-terrain-material/1';
 readonly lattice:Lattice;
 /** Layer order. Weights for material k live in layer floor(k/4), channel k%4. */
 readonly materials:readonly MaterialId[];
 /** ceil(materials/4) RGBA8 layers, each width·height·4 bytes. Per node the material weights sum to exactly 255. */
 readonly weights:Uint8Array;
 /** RGBA8: wetness, macro tone variation, exposure, canonical slope (rise/run ÷ 1.5). */
 readonly attributes:Uint8Array;
 readonly rulesVersion:string;
 readonly sourceId:string;
}

/** Normalised material composition at one world position. */
export interface SurfaceSample {
 weights:Record<MaterialId,number>;
 dominant:MaterialId;
 dominantWeight:number;
 wetness:number;
 macro:number;
 exposure:number;
}
