import camerasJson from '../../tools/geo-r02c-a1a/cameras.json?raw';
/** GEO-R02C-A1a fixed review cameras (?presets=a1a). Walk cameras stand 1.75 m above whichever terrain is loaded;
 * aerial cameras have a fixed world position and target, identical for every variant. */
export interface A1aCamera {id:string;name:string;uv:number[];yaw:number;pitch:number;kind:string;group:string;aerial?:{pos:number[];target:number[]}}
export function a1aCameras(search:string):A1aCamera[]{
 if(new URLSearchParams(search).get('presets')!=='a1a')return [];
 return (JSON.parse(camerasJson).cameras as A1aCamera[]).map(c=>({id:c.id,name:c.name,uv:c.uv,yaw:c.yaw,pitch:c.pitch,kind:c.kind,group:c.group,aerial:c.aerial}));
}
