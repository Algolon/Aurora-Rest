import camerasJson from '../../tools/geo-r02c-b2a/cameras.json?raw';
/** GEO-R02C-B2a review cameras (?cams=b2a), next to the A1a/A1b/A1c/B01 sets. Walk cameras stand 1.75 m above whichever terrain is loaded;
 * aerial cameras have a fixed world position and target, identical for B1.1 and B2a. */
export interface B2aCamera {id:string;name:string;uv:number[];yaw:number;pitch:number;kind:string;group:string;aerial?:{pos:number[];target:number[]}}
export function b2aCameras(search:string):B2aCamera[]{
 if(!(new URLSearchParams(search).get('cams')??'').split(',').includes('b2a'))return [];
 return (JSON.parse(camerasJson).cameras as B2aCamera[]).map(c=>({id:c.id,name:c.name,uv:c.uv,yaw:c.yaw,pitch:c.pitch,kind:c.kind,group:c.group,aerial:c.aerial}));
}
