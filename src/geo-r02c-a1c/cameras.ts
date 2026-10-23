import camerasJson from '../../tools/geo-r02c-a1c/cameras.json?raw';
/** GEO-R02C-A1c player-height review cameras (?cams=a1c), added next to the A1a (?presets=a1a) and A1b (?cams=a1b) sets. Walk cameras stand
 * 1.75 m above whichever terrain is loaded, so every variant is seen from the same place. */
export interface A1cCamera {id:string;name:string;uv:number[];yaw:number;pitch:number;kind:string;group:string}
export function a1cCameras(search:string):A1cCamera[]{
 if(!(new URLSearchParams(search).get('cams')??'').split(',').includes('a1c'))return [];
 return (JSON.parse(camerasJson).cameras as A1cCamera[]).map(c=>({id:c.id,name:c.name,uv:c.uv,yaw:c.yaw,pitch:c.pitch,kind:c.kind,group:c.group}));
}
