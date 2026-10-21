import * as THREE from 'three';
import {writeFileSync} from 'node:fs';
import {TerrainRenderer} from '../src/render/terrain.ts';
import {WORLD} from '../src/world/config.ts';
const start=performance.now(),terrain=new TerrainRenderer(new THREE.Scene());
const constructionMs=performance.now()-start;
const teleports=WORLD.viewpoints.map(p=>{
 const t=performance.now();terrain.update(p.x,p.z,true);
 return {name:p.name,refreshMs:performance.now()-t,nearTiles:terrain.nearCount};
});
const movement=[];
for(let x=-900;x<=900;x+=10){const t=performance.now();terrain.update(x,-500);movement.push(performance.now()-t);}
movement.sort((a,b)=>a-b);
const result={note:'CPU-only Node timing of terrain generation and mesh replacement; not browser/GPU frame times.',constructionMs,teleports,
 movementMs:{median:movement[Math.floor(movement.length*.5)],p95:movement[Math.floor(movement.length*.95)],max:movement.at(-1)}};
writeFileSync('docs/evidence/world-01b/after/terrain-cpu.json',JSON.stringify(result,null,2)+'\n');console.log(result);
