/** MAT-01 fixed review cameras on the real GEO-R02B-R1 terrain. Positions were chosen with tools/mat-01/find-spots.ts
 * (canonical classification queries), then framed visually. Yaw: 0 = north (+z), π/2 = east (+x), as in src/geo-r02b/main.ts.
 * `eye` is metres above the canonical surface. */
export interface ReviewCamera {id:string;name:string;group:string;x:number;z:number;yaw:number;pitch:number;eye:number;fov?:number}
export interface OrthoCamera {id:string;name:string;group:string;ortho:true;x:number;z:number;halfHeight:number}
export type Camera=ReviewCamera|OrthoCamera;

const study=(code:string,label:string,x:number,z:number,yaw:number,closeEye=1.1):ReviewCamera[]=>[
 {id:`${code}-close`,name:`${code} ${label} · close-up`,group:'material-study',x,z,yaw,pitch:-1.05,eye:closeEye,fov:50},
 {id:`${code}-walk`,name:`${code} ${label} · walking height`,group:'material-study',x,z,yaw,pitch:-.16,eye:1.75},
 {id:`${code}-elevated`,name:`${code} ${label} · elevated`,group:'material-study',x,z,yaw,pitch:-.5,eye:38},
];

export const CAMERAS:Camera[]=[
 ...study('m01','Forest floor',-836,-626,.6),
 ...study('m02','Meadow turf',260,-458,.4),
 ...study('m03','Coastal sand',2078,-2176,2.4),
 // Bedrock close-up at hiker eye height: the 6.8 mm texel density blurs below ~1.5 m on a 45 % slope.
 ...study('m04','Bedrock',-568,2734,.6,1.7),
 {id:'birchwood-overview',name:'Birchwood · overview',group:'scene',x:-1150,z:-950,yaw:.35,pitch:-.33,eye:190},
 {id:'birchwood-walk',name:'Birchwood · walking height (forest edge)',group:'scene',x:-1440,z:270,yaw:1.2,pitch:-.07,eye:1.75},
 {id:'valley-overview',name:'Central Valley · overview',group:'scene',x:150,z:-1150,yaw:.1,pitch:-.22,eye:170},
 {id:'valley-walk',name:'Central Valley · walking height',group:'scene',x:90,z:80,yaw:.7,pitch:-.03,eye:1.75},
 {id:'cove-shore',name:'Home Cove · shoreline',group:'scene',x:1670,z:-1900,yaw:2.95,pitch:-.06,eye:1.75},
 {id:'cove-elevated',name:'Home Cove · elevated',group:'scene',x:1250,z:-1500,yaw:2.3,pitch:-.3,eye:120},
 {id:'tarn-slope',name:'High Tarn · rocky slope',group:'scene',x:1430,z:1930,yaw:-1.13,pitch:-.05,eye:1.75},
 {id:'tarn-elevated',name:'High Tarn · elevated',group:'scene',x:1000,z:1500,yaw:.35,pitch:-.25,eye:160},
 {id:'tr-forest-meadow',name:'Transition · forest floor ↔ meadow',group:'transition',x:-1440,z:270,yaw:1.6,pitch:-.45,eye:14},
 {id:'tr-meadow-rock',name:'Transition · meadow ↔ bedrock',group:'transition',x:406,z:2548,yaw:.5,pitch:-.4,eye:16},
 {id:'tr-sand-rock',name:'Transition · sand ↔ bedrock',group:'transition',x:-1900,z:-2300,yaw:-2.36,pitch:-.45,eye:20},
 {id:'tr-wet-shore',name:'Transition · wet shoreline',group:'transition',x:1390,z:-2444,yaw:3.1,pitch:-.35,eye:9},
 {id:'tr-wet-meadow',name:'Transition · river-side wet meadow',group:'transition',x:496,z:-1298,yaw:.8,pitch:-.3,eye:12},
 {id:'island-ortho',name:'Island · orthographic survey',group:'diagnostic',ortho:true,x:0,z:0,halfHeight:4300},
 {id:'birchwood-ortho',name:'Birchwood · orthographic 1.2 km',group:'diagnostic',ortho:true,x:-900,z:-300,halfHeight:600},
 {id:'tile-seam',name:'Tile boundary · x = −1000 m, z = −400 m',group:'diagnostic',x:-1000,z:-430,yaw:0,pitch:-.6,eye:22},
];
