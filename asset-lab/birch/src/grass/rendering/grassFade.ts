/** Isolated Aurora ground-cover experiments; FLW geometry is never altered. */
export type FadePreset='source'|'extended'|'close';
export interface GrassFadeConfig {visibilityDistance:number;fadeDistance:number;steps:number}
export const GRASS_FADE_PRESETS:Record<FadePreset,GrassFadeConfig>={
 source:{visibilityDistance:13,fadeDistance:4,steps:12},
 extended:{visibilityDistance:19,fadeDistance:6,steps:18},
 close:{visibilityDistance:10,fadeDistance:3,steps:12}
};
/** Match original PlantBatch 12-level scale fade by default. steps=0 is continuous. */
export function grassScaleFade(distance:number,config:GrassFadeConfig):number{
 if(!Number.isFinite(distance)||distance<0)throw RangeError('Invalid grass distance');
 const {visibilityDistance,fadeDistance,steps}=config;
 if(!Number.isFinite(visibilityDistance)||visibilityDistance<=0||
   !Number.isFinite(fadeDistance)||fadeDistance<=0||fadeDistance>visibilityDistance||
   !Number.isInteger(steps)||steps<0)throw RangeError('Invalid grass fade configuration');
 const raw=Math.max(0,Math.min(1,(visibilityDistance-distance)/fadeDistance));
 return steps===0?raw:Math.round(raw*steps)/steps;
}
