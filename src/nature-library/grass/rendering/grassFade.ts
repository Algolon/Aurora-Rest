/** Isolated Aurora ground-cover experiments; FLW geometry is never altered. */
export type FadePreset='source'|'extended'|'close'|'refined';
export interface GrassFadeConfig {visibilityDistance:number;fadeDistance:number;steps:number;thresholdJitter?:number;smooth?:boolean}
export const GRASS_FADE_PRESETS:Record<FadePreset,GrassFadeConfig>={
 source:{visibilityDistance:13,fadeDistance:4,steps:12},
 extended:{visibilityDistance:19,fadeDistance:6,steps:18},
 close:{visibilityDistance:10,fadeDistance:3,steps:12},
 refined:{visibilityDistance:19,fadeDistance:7,steps:48,thresholdJitter:1.4,smooth:true}
};
/** Match original PlantBatch 12-level scale fade by default. steps=0 is continuous. */
export function grassScaleFade(distance:number,config:GrassFadeConfig,instanceOffset=0):number{
 if(!Number.isFinite(distance)||distance<0)throw RangeError('Invalid grass distance');
 const {visibilityDistance,fadeDistance,steps}=config;
 if(!Number.isFinite(visibilityDistance)||visibilityDistance<=0||
   !Number.isFinite(fadeDistance)||fadeDistance<=0||fadeDistance>visibilityDistance||
   !Number.isInteger(steps)||steps<0)throw RangeError('Invalid grass fade configuration');
 if(!Number.isFinite(instanceOffset)||Math.abs(instanceOffset)>1||
  !(config.thresholdJitter===undefined||Number.isFinite(config.thresholdJitter)&&config.thresholdJitter>=0&&config.thresholdJitter<=fadeDistance*.5))
  throw RangeError('Invalid deterministic grass fade jitter');
 const shifted=distance-instanceOffset*(config.thresholdJitter??0);
 const raw=Math.max(0,Math.min(1,(visibilityDistance-shifted)/fadeDistance));
 const shaped=config.smooth?raw*raw*(3-2*raw):raw;
 return steps===0?shaped:Math.round(shaped*steps)/steps;
}
