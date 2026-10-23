import type {Family} from './contracts.ts';
/** Explicitly authored population-only controls; never a new geographic or biome truth. */
export type CompositionMask={id:string;families:readonly Family[];x:number;z:number}&(
 {kind:'glade';radius:number}|{kind:'vista';range:number;heading:number;halfAngle:number}
);
export function compositionExcludes(masks:readonly CompositionMask[],family:Family,x:number,z:number){
 return masks.some(m=>{if(!m.families.includes(family))return false;const dx=x-m.x,dz=z-m.z,d=Math.hypot(dx,dz);if(m.kind==='glade')return d<m.radius;if(d>=m.range)return false;const angle=Math.atan2(dx,dz)-m.heading;return Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<m.halfAngle;});
}
