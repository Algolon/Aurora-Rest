import camerasJson from '../../tools/geo-r02c-a1b/cameras.json?raw';
/** GEO-R02C-A1b-alpha player-height review cameras (?cams=a1b), added next to the A1a set (?presets=a1a). Walk cameras stand
 * 1.75 m above whichever terrain is loaded, so every variant is seen from the same place. */
export interface A1bCamera {id:string;name:string;uv:number[];yaw:number;pitch:number;kind:string;group:string}
export function a1bCameras(search:string):A1bCamera[]{
 if(!(new URLSearchParams(search).get('cams')??'').split(',').includes('a1b'))return [];
 return (JSON.parse(camerasJson).cameras as A1bCamera[]).map(c=>({id:c.id,name:c.name,uv:c.uv,yaw:c.yaw,pitch:c.pitch,kind:c.kind,group:c.group}));
}
