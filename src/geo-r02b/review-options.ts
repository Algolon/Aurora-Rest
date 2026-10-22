/** GEO-R02C-P0 review options; dependency-free so Node tests can import them. */
export interface ReviewOptions {clay:boolean;sun:'A'|'B';presets:boolean}
// Sun presets: azimuth clockwise from north, elevation above the horizon (degrees).
export const SUN_PRESETS={A:{azimuth:290,elevation:18,label:'low west-north-west'},B:{azimuth:135,elevation:35,label:'mid south-east'}} as const;
export const CLAY={albedo:0xbdb8ad,hemisphere:.45,sun:2.6,shadowMap:8192};

export function reviewOptions(search:string):ReviewOptions{
 const q=new URLSearchParams(search),clay=q.get('review')==='clay',sun=q.get('sun')==='B'?'B':'A';
 return {clay,sun,presets:clay||q.get('presets')==='p0'};
}
/** Unit sun direction in the viewer's geographic frame (x east, y up, z north); the scene's x mirror is applied by its parent. */
export function sunDirection(preset:'A'|'B'):[number,number,number]{
 const p=SUN_PRESETS[preset],az=p.azimuth*Math.PI/180,el=p.elevation*Math.PI/180;
 return [Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)];
}
