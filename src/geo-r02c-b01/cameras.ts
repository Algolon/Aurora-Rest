import camerasJson from '../../tools/geo-r02c-b01/cameras.json?raw';
/** GEO-R02C-B01 review cameras (?cams=b01), next to the A1a (?presets=a1a), A1b (?cams=a1b) and A1c (?cams=a1c) sets. Walk cameras stand
 * 1.75 m above whichever terrain is loaded; aerial cameras have a fixed world position and target, identical for M0 and B1. */
export interface B01Camera {id:string;name:string;uv:number[];yaw:number;pitch:number;kind:string;group:string;aerial?:{pos:number[];target:number[]}}
export function b01Cameras(search:string):B01Camera[]{
 if(!(new URLSearchParams(search).get('cams')??'').split(',').includes('b01'))return [];
 return (JSON.parse(camerasJson).cameras as B01Camera[]).map(c=>({id:c.id,name:c.name,uv:c.uv,yaw:c.yaw,pitch:c.pitch,kind:c.kind,group:c.group,aerial:c.aerial}));
}
