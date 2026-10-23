// Tree LOD selector from Feh Lu We src/world/vegetationLod.ts at pinned source commit.
export const BIRCH_LOD_PROFILE={distances:[22,36,62] as const,hysteresis:3,continuous:'outline' as const};
export type BirchLod='near'|'mid'|'far'|'xfar';
export const BIRCH_LODS=['near','mid','far','xfar'] as const;
export function selectTreeLod(distance:number,previous:number,thresholds:readonly number[]=BIRCH_LOD_PROFILE.distances,hysteresis:number=BIRCH_LOD_PROFILE.hysteresis) {
 let level=0;
 while(level<thresholds.length && distance>=thresholds[level]+(previous<=level?hysteresis:-hysteresis))level++;
 return level;
}
export function geometryLod(lod:BirchLod):'near'|'mid'|'far' {return lod==='xfar'?'far':lod;}
