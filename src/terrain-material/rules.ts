/** MAT-01 distribution rules. One editable table; classify.ts is the only code that interprets it.
 * Every input is labelled with its provenance so provisional art direction is never mistaken for world data. */
import type {InputProvenance,MaterialId} from './types.ts';

export const MATERIAL_ORDER:readonly MaterialId[]=['forest-floor','meadow-turf','coastal-sand','bedrock'];

export interface AnchorIntent {anchor:string;radiusM:[number,number];weight:number}

export const RULES={
 version:'mat-01-rules-r5',
 seed:20261023,
 inputs:{
  height:'verified-source',water:'verified-source',catchments:'verified-source',anchors:'verified-source',
  slope:'derived',curvature:'derived',coastDistance:'derived',freshwaterDistance:'derived',
  forestIntent:'provisional-artistic',duneIntent:'provisional-artistic',coveIntent:'provisional-artistic',
  mireIntent:'provisional-artistic',windwardIntent:'provisional-artistic',
  drainage:'future',soilDepth:'future',windExposure:'future',biomeMap:'future',
 } satisfies Record<string,InputProvenance>,
 /** Forest affinity per verified catchment id. The weights themselves are provisional art direction. */
 forestByCatchment:{'04':1,'05':1,'03':.8,'07':.5,'08':.35,'06':.3,'02':.25,'01':0} as Record<string,number>,
 /** Ground outside every catchment polygon. */
 forestOutside:.15,
 intentBlurM:110,
 /** Domain warp that makes intent boundaries organic rather than polygonal. */
 warp:{scaleM:260,amplitudeM:85},
 dune:[{anchor:'dunes',radiusM:[560,1050],weight:1}] as AnchorIntent[],
 cove:[{anchor:'home',radiusM:[520,480],weight:1}] as AnchorIntent[],
 mire:[{anchor:'mire',radiusM:[760,620],weight:1}] as AnchorIntent[],
 /** Exposed Windward Coast: rock rather than sand along the western shore. */
 windward:{fromX:-1650,toX:-2250},
 forest:{
  treelineM:[235,330],treelineJitterM:70,
  maxSlope:[.5,.85],
  coastBufferM:[25,110],
  /** Glades: few, large meadow openings inside forest intent. */
  gladeScaleM:240,gladeThreshold:[.24,.52],gladeStrength:.9,
  /** Riparian copses: birch groves along lowland freshwater, broken up by noise. */
  riparianM:55,riparianStrength:.55,riparianMaxM:160,
  /** Forest edge: smooth low-frequency displacement (avoids mottled mid-intent zones). */
  edge:[.2,.76],edgeScaleM:170,edgeNoise:.22,
  ecotoneScaleM:30,ecotoneNoise:.3,
 },
 rock:{
  slope:[.55,1.05],slopeJitter:.16,
  altitudeM:[390,640],altitudeJitterM:90,summitM:[600,820],
  convexity:[.0025,.011],convexSlope:[.12,.42],
  coastM:[8,55],coastSlope:[.22,.5],
  outcropScaleM:75,outcropThreshold:[.6,.8],outcropSlope:[.2,.45],
 },
 sand:{
  baseWidthM:16,duneWidthM:190,coveWidthM:75,widthJitterM:14,
  maxHeightM:[5,12],duneMaxHeightM:[38,60],
  maxSlope:[.16,.36],duneMaxSlope:[.32,.55],
  /** Seabed is sand down to this depth, then rock/sand mix (hidden below opaque water). */
  seabedSandM:-6,
 },
 wet:{
  freshwaterM:16,freshwaterSlope:[.25,.6],
  shoreBandM:[4,18],shoreHeightM:[.6,2.2],
  mireHeightM:[24,55],hollow:[.001,.006],hollowStrength:.35,
 },
 exposure:{altitudeM:[220,520],convexity:[.002,.01],coastM:260},
 macro:{scaleM:380},
} as const;
