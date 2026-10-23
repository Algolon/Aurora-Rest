/** Recreate immutable comparison arrays only; never mutates protected source.
 * Requires locally fetched B1R2 checkpoint and optional three-bvh-csg@0.0.18.
 * Checked-in snapshots mean neither is required by the showroom or CI.
 */
import {execFileSync} from 'node:child_process';
import {writeFile,unlink} from 'node:fs/promises';
import {buildB1R} from '../src/rocks/experimental/b1r/multiMassRocks.ts';
import {r04StudyGeometry} from '../src/rocks/experimental/r04MaterialStudies.ts';
const helper=new URL('.s1-v3-'+process.pid+'.ts',import.meta.url);
const raw=execFileSync('git',['show','abdbbac822178b0dcf8e98ba740212bd6b060181:asset-lab/birch/src/rocks/experimental/b1r2/integratedA.ts'],{encoding:'utf8'});
await writeFile(helper,raw.replace("'../b1r/multiMassRocks.ts'","'../src/rocks/experimental/b1r/multiMassRocks.ts'"));
try{
 const {buildIntegratedA}=await import(helper.href);
 const v0=buildB1R('A','V0'),v2=buildB1R('A','V2'),v3=buildIntegratedA(),g1=r04StudyGeometry('G1');
 const objects={'A-V0':v0.parts,'A-V2':v2.parts,'A-V3':[v3.geometry],G1:[g1]},meshes={};
 for(const [name,parts] of Object.entries(objects)){
  const groundY=Math.min(...parts.map(g=>{g.computeBoundingBox();return g.boundingBox.min.y}));
  meshes[name]=parts.map(g=>Object.fromEntries(['position','normal','color','uv'].map(k=>[k,Array.from(g.getAttribute(k).array)]).concat([['groundY',groundY]])));
 }
 await writeFile(new URL('../art/blender/s1-geological-sculpt/references/reference-geometry.json',import.meta.url),JSON.stringify({provenance:{'A-V0 / A-V2':'5e1d412e24d054ff8b659236b39feb0f99c1cced','A-V3':'abdbbac822178b0dcf8e98ba740212bd6b060181',G1:'91a2e0c8fc909a4a25f00e6d5fd621ddb703e6d8'},meshes}));
 v0.dispose();v2.dispose();v3.dispose();g1.dispose();console.log('Pinned real comparison geometry exported');
}finally{await unlink(helper);}
