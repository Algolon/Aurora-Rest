/** Material definition layer: four MAT-01 reference ground materials. Data only; textures are synthesised from
 * these definitions (textures.ts) and the renderer reads the same table, so palettes stay art-directable in one place.
 * Colours are sRGB hex. Multipliers are applied in linear space by the shader. */
import type {MaterialId} from './types.ts';

export type Generator='forest-floor'|'meadow-turf'|'coastal-sand'|'bedrock';
export interface MaterialDefinition {
 id:MaterialId;name:string;code:string;
 generator:Generator;seed:number;
 /** World size of one detail-texture repeat (m). */
 tileM:number;
 /** Second, mip-biased sample at tileM × mesoScale breaks repetition at walking distance. */
 mesoScale:number;
 /** Gradient-map palette: [t, sRGB hex] stops applied during synthesis. */
 palette:[number,string][];
 normalStrength:number;
 /** Height-blend contrast against neighbouring materials (0 = linear weight blend). */
 heightBlend:number;
 roughness:{dry:number;wet:number};
 /** Linear RGB multiplier at full wetness. */
 wetTint:[number,number,number];
 /** Linear RGB multipliers at macro attribute 0 and 1 (art-directed large-scale variation). */
 macroTint:[[number,number,number],[number,number,number]];
 /** Linear RGB multiplier at full exposure (wind, altitude, convexity). */
 exposureTint:[number,number,number];
 /** Meso-scale irregular patches (1–8 m): tint, feature size and coverage fraction. */
 patch:{tint:[number,number,number];scaleM:number;coverage:number};
 /** Use triplanar projection on steep faces. */
 triplanar:boolean;
 /** Downslope weathering streaks on steep faces (0 = none). */
 streaks?:number;
 /** Amplitude of the procedural meso tone (3–20 m). */
 mesoAmount:number;
}

export const MATERIALS:readonly MaterialDefinition[]=[
 {id:'forest-floor',name:'Nordic Forest Floor',code:'M01',generator:'forest-floor',seed:101,tileM:2.2,mesoScale:5.3,
  palette:[[0,'#2a281d'],[.2,'#403c2b'],[.32,'#554c37'],[.42,'#6b5640'],[.5,'#565d3d'],[.63,'#687346'],[.76,'#7e8653'],[.83,'#86704e'],[.91,'#a3854f'],[1,'#ba9a5c']],
  normalStrength:.9,heightBlend:.55,roughness:{dry:.93,wet:.62},wetTint:[.72,.74,.76],
  macroTint:[[1.14,1.0,.84],[.8,1.04,.84]],exposureTint:[1.08,1.02,.9],
  patch:{tint:[.8,1.18,.74],scaleM:9,coverage:.5},triplanar:false,mesoAmount:.4},
 {id:'meadow-turf',name:'Meadow Turf',code:'M02',generator:'meadow-turf',seed:202,tileM:2.6,mesoScale:5.3,
  palette:[[0,'#30281a'],[.14,'#4d3f29'],[.28,'#54502e'],[.42,'#505d2e'],[.58,'#64763a'],[.72,'#7b8b48'],[.85,'#95995c'],[1,'#b6a86e']],
  normalStrength:.75,heightBlend:.45,roughness:{dry:.9,wet:.6},wetTint:[.74,.82,.74],
  macroTint:[[1.24,1.08,.72],[.8,1.0,.86]],exposureTint:[1.18,1.0,.74],
  patch:{tint:[.95,.76,.6],scaleM:6,coverage:.22},triplanar:false,mesoAmount:.45},
 {id:'coastal-sand',name:'Coastal Sand',code:'M03',generator:'coastal-sand',seed:303,tileM:2.0,mesoScale:5.3,
  palette:[[0,'#58544b'],[.3,'#8c8370'],[.5,'#a39981'],[.7,'#b5ab92'],[.9,'#c7bfab'],[1,'#dcd7ca']],
  normalStrength:.55,heightBlend:.25,roughness:{dry:.95,wet:.6},wetTint:[.5,.52,.56],
  macroTint:[[1.04,1,.94],[.95,.98,1.02]],exposureTint:[1.03,1.02,1],
  patch:{tint:[.9,.9,.88],scaleM:9,coverage:.18},triplanar:false,mesoAmount:.16},
 {id:'bedrock',name:'Nordic Bedrock',code:'M04',generator:'bedrock',seed:404,tileM:3.5,mesoScale:4.3,
  palette:[[0,'#1c1f20'],[.2,'#33383a'],[.4,'#474d4f'],[.55,'#595f60'],[.7,'#6d7372'],[.82,'#828782'],[.9,'#757b62'],[1,'#8f8b64']],
  normalStrength:1.15,heightBlend:.7,roughness:{dry:.84,wet:.6},wetTint:[.68,.7,.74],
  macroTint:[[1.06,1.02,.95],[.9,.97,1.05]],exposureTint:[1.05,1.05,1.04],
  patch:{tint:[.68,.72,.72],scaleM:14,coverage:.34},triplanar:true,streaks:.32,mesoAmount:.3},
];

export function materialById(id:MaterialId){const m=MATERIALS.find(m=>m.id===id);if(!m)throw new Error('Unknown material '+id);return m;}
