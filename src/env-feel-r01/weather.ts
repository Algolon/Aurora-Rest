/** ENV-FEEL-R01: pure, deterministic Nordic microclimate. No Three.js dependency. */
export type WeatherMode = 'cycle' | 'still' | 'breeze' | 'squall' | 'clearing';
export type WeatherState = Readonly<{
  windX:number; windZ:number; windSpeed:number; gust:number;
  rain:number; wetness:number; fog:number; overcast:number;
  sun:number; ambient:number; time:number; mode:WeatherMode;
}>;
export const CYCLE_SECONDS = 160;
const clamp01 = (x:number) => Math.max(0,Math.min(1,x));
const smooth = (a:number,b:number,x:number) => {
  const v=clamp01((x-a)/(b-a));
  return v*v*(3-2*v);
};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
type Climate = {wind:number;rain:number;wetness:number;fog:number;overcast:number};
const still:Climate={wind:.12,rain:0,wetness:.05,fog:.16,overcast:.12};
const breeze:Climate={wind:.48,rain:0,wetness:.08,fog:.10,overcast:.22};
const squall:Climate={wind:.85,rain:1,wetness:.94,fog:.82,overcast:1};
const clearing:Climate={wind:.25,rain:0,wetness:.65,fog:.30,overcast:.25};
function interpolate(a:Climate,b:Climate,t:number):Climate{
  return {wind:mix(a.wind,b.wind,t),rain:mix(a.rain,b.rain,t),
    wetness:mix(a.wetness,b.wetness,t),fog:mix(a.fog,b.fog,t),
    overcast:mix(a.overcast,b.overcast,t)};
}
export function sampleClimate(seconds:number,mode:WeatherMode='cycle'):WeatherState{
  const time=Number.isFinite(seconds)?Math.max(0,seconds):0;
  const t=((time%CYCLE_SECONDS)+CYCLE_SECONDS)%CYCLE_SECONDS;
  let base:Climate;
  if(mode!=='cycle') base=({still,breeze,squall,clearing} as Record<Exclude<WeatherMode,'cycle'>,Climate>)[mode];
  else if(t<30) base=interpolate(still,breeze,smooth(7,30,t));
  else if(t<60) base=interpolate(breeze,squall,smooth(30,60,t));
  else if(t<103) base=squall;
  else if(t<130) base=interpolate(squall,clearing,smooth(103,130,t));
  else base=interpolate(clearing,still,smooth(130,160,t));
  // Wind and rain respond to the same gust envelope. Spatial variation belongs in shaders.
  const gust=clamp01(.50+.28*Math.sin(time*.23+.3)+.17*Math.sin(time*.57+1.7));
  const speed=clamp01(base.wind*(.72+.48*gust));
  const angle=.48+.13*Math.sin(time*.024);
  return Object.freeze({
    mode,time,windX:Math.cos(angle),windZ:Math.sin(angle),
    windSpeed:speed,gust,rain:clamp01(base.rain),wetness:clamp01(base.wetness),
    fog:clamp01(base.fog),overcast:clamp01(base.overcast),
    sun:clamp01(1-base.overcast*.76),ambient:clamp01(1-base.overcast*.34)
  });
}
/** Shared world-space disturbance field for grass, leaf crowns and rain slant. */
export function windAt(x:number,z:number,time:number,state:WeatherState):number{
  const travel=(x*state.windX+z*state.windZ)*.145;
  const rolling=.55+.30*Math.sin(time*1.35-travel)+.15*Math.sin(time*2.72-travel*.45);
  return state.windSpeed*Math.max(.10,rolling)*(.65+.35*state.gust);
}
export const weatherIsValid=(s:WeatherState)=>[
 s.windX,s.windZ,s.windSpeed,s.gust,s.rain,s.wetness,s.fog,s.overcast,s.sun,s.ambient,s.time
].every(Number.isFinite) && Math.abs(Math.hypot(s.windX,s.windZ)-1)<1e-6 &&
 [s.windSpeed,s.gust,s.rain,s.wetness,s.fog,s.overcast,s.sun,s.ambient].every(v=>v>=0&&v<=1);
