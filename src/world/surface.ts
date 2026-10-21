import { WORLD,LAKES,BRIDGE } from './config.ts';
import { heightAt, riverAt } from './geography.ts';

/** Interpolate the same diagonal and triangles as the terrain mesh, not its analytic source. */
export function surfaceHeightAt(x:number,z:number,segments:number=WORLD.tileNearSegments){
  const cell=WORLD.tileSize/segments;
  const x0=Math.floor((x+WORLD.halfWidth)/cell)*cell-WORLD.halfWidth;
  const z0=Math.floor((z+WORLD.halfLength)/cell)*cell-WORLD.halfLength;
  const u=(x-x0)/cell,v=(z-z0)/cell;
  const a=heightAt(x0,z0),b=heightAt(x0,z0+cell),c=heightAt(x0+cell,z0);
  if(u+v<=1)return a+(c-a)*u+(b-a)*v;
  const d=heightAt(x0+cell,z0+cell);
  return d+(b-d)*(1-u)+(c-d)*(1-v);
}

export function waterLevelAt(x:number,z:number){
  for(const lake of LAKES)if(Math.hypot((x-lake.x)/lake.rx,(z-lake.z)/lake.rz)<1)return lake.level+.25;
  const river=riverAt(x,z);
  if(river.distance<river.width)return river.level-.5;
  return WORLD.seaLevel-.45;
}

const bridgeEnds=[surfaceHeightAt(BRIDGE.x0,BRIDGE.z)+.15,surfaceHeightAt(BRIDGE.x1,BRIDGE.z)+.15];
export function bridgeHeightAt(x:number,z:number){
 if(x<BRIDGE.x0||x>BRIDGE.x1||Math.abs(z-BRIDGE.z)>BRIDGE.halfWidth)return -Infinity;
 const t=(x-BRIDGE.x0)/(BRIDGE.x1-BRIDGE.x0);return bridgeEnds[0]*(1-t)+bridgeEnds[1]*t;
}
export function walkHeightAt(x:number,z:number){return Math.max(surfaceHeightAt(x,z),bridgeHeightAt(x,z));}

export const MAX_WALK_GRADE=.7;
/** Small swept steps prevent tunnelling through water or steep banks during a slow frame. */
export function walkStep(x:number,z:number,dx:number,dz:number){
  const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.75));
  for(let i=0;i<count;i++){
    const nx=x+dx/count,nz=z+dz/count,distance=Math.hypot(dx,dz)/count;
    const y=walkHeightAt(x,z),ny=walkHeightAt(nx,nz);
    if(Math.abs(nx)>WORLD.halfWidth-1||Math.abs(nz)>WORLD.halfLength-1||ny<waterLevelAt(nx,nz)+.25||
      (distance>0&&Math.abs(ny-y)/distance>MAX_WALK_GRADE))break;
    // Cabin footprint. Other placeholder props remain non-colliding until WORLD-02.
    const cabin=WORLD.viewpoints[0],cx=nx-cabin.x,cz=nz-cabin.z;
    const lx=cx*Math.cos(.28)+cz*Math.sin(.28),lz=-cx*Math.sin(.28)+cz*Math.cos(.28);
    if(Math.abs(lx)<8.2&&Math.abs(lz)<6.2)break;
    x=nx;z=nz;
  }
  return {x,z,y:walkHeightAt(x,z)};
}
