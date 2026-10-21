export type WalkPhase='approach'|'enter'|'dense'|'turn'|'reverse'|'lateral'|'stop-start';
export const WALK_PHASES:readonly WalkPhase[]=['approach','enter','dense','turn','reverse','lateral','stop-start'] as const;
export interface WalkSample {frame:number;phase:WalkPhase;position:[number,number,number];target:[number,number,number]}
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
export function sampleMeadowWalk(frame:number,framesPerPhase=12):WalkSample{
 if(!Number.isInteger(frame)||frame<0||!Number.isInteger(framesPerPhase)||framesPerPhase<2)
  throw RangeError('Invalid walking frame');
 const ix=Math.min(WALK_PHASES.length-1,Math.floor(frame/framesPerPhase));
 const t=Math.min(1,(frame%framesPerPhase)/(framesPerPhase-1));
 let x=0,z=0,yaw=Math.PI,phase=WALK_PHASES[ix];
 // +z means looking toward the meadow; walking movement stays at human height.
 if(phase==='approach'){z=lerp(18,9,t);yaw=Math.PI}
 if(phase==='enter'){z=lerp(9,4,t);yaw=Math.PI}
 if(phase==='dense'){z=lerp(4,-3,t);yaw=Math.PI}
 if(phase==='turn'){z=-3;yaw=lerp(Math.PI,Math.PI/2,t)}
 if(phase==='reverse'){z=lerp(-3,4,t);yaw=0}
 if(phase==='lateral'){z=4;x=lerp(0,6,t);yaw=Math.PI/2}
 if(phase==='stop-start'){z=4;x=6+2*t*t*(3-2*t);yaw=Math.PI/2}
 return {frame,phase,position:[x,1.68,z],
  target:[x+Math.sin(yaw)*8,.45,z+Math.cos(yaw)*8]};
}
