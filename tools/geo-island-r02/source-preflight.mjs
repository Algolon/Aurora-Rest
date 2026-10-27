import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const REC='bced77ca3ca0539f7137cd9f066e6220518cf4a8';
const B2A='77f352f3bd4ea25a1ed5d6bff95b645a0e1050db';
const BASE='fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a';
const common={
'public/geo-r02b/terrain.f32':'fc929b08e7dff10b052c074f85682ae0ed672480',
'public/geo-r02b/water-surface.f32':'1fc6d65cea35bf12903cf62003a35bc85537a872',
'public/geo-r02b/features.json':'6e91c4090f7453f17144d1694b9805bc5205e7f2',
'docs/geo-r02b/design-master-A-R1-v1.json':'7a28fd433ffac95f3f91f38c6406d467a930bf6b',
'src/world/geography.ts':'d6eebf03f06bb450e3e45f461074eff84cc2567b',
'src/world/config.ts':'6ad3b2d8280513a96b75e6965e0bfae3b733caf7'
};
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const req=(v,m)=>{if(!v)throw Error(m);};
try{
 const ref=resolve(process.argv[2]||'.');
 const out=resolve(process.argv[3]||'/tmp/geo-island-r02-evidence');
 mkdirSync(out,{recursive:true});
 req(git('cat-file','-t',REC)==='commit','Recovery commit missing');
 req(git('cat-file','-t',B2A)==='commit','B2a commit missing');
 const shared=[];
 for(const [path,blob] of Object.entries(common)){
  const baseline=git('rev-parse',REC+':'+path);
  const b2a=git('rev-parse',B2A+':'+path);
  const current=git('hash-object',path);
  req(baseline===blob&&b2a===blob&&current===blob,'Protected common blob mismatch: '+path);
  shared.push({path,gitBlob:blob,identical:true});
 }
 const original=readFileSync('public/geo-r02b/terrain.f32');
 req(sha(original)===BASE,'Canonical terrain hash mismatch');
 const meta=JSON.parse(readFileSync('public/geo-r02b/features.json','utf8')).meta;
 req(meta?.terrainSha256===BASE,'Terrain metadata mismatch');
 const {width,height}=meta.grid;
 req(original.length===width*height*4,'Grid dimensions do not match byte length');
 const man=JSON.parse(readFileSync(resolve(ref,'public/geo-r02c-b2a/manifest.json'),'utf8'));
 req(man.baseTerrainSha256===BASE,'B2a manifest baseline mismatch');
 const v=man.variants.a, spec=v.patch;
 const patch=readFileSync(resolve(ref,'public/geo-r02c-b2a',spec.file));
 req(sha(patch)===spec.sha256&&patch.length===spec.bytes,'B2a patch checksum/size failure');
 const [j0,j1]=spec.rows,[i0,i1]=spec.cols, rw=i1-i0+1;
 req(i0>=0&&i1<width&&j0>=0&&j1<height,'Patch outside grid');
 req((j1-j0+1)*rw*4===patch.length,'Patch rectangle invalid');
 const candidate=Buffer.from(original);
 for(let j=j0;j<=j1;j++)patch.copy(candidate,(j*width+i0)*4,(j-j0)*rw*4,(j-j0+1)*rw*4);
 let modified=0;
 for(let i=0;i<original.length;i+=4)if(original.readUInt32LE(i)!==candidate.readUInt32LE(i))modified++;
 req(modified===v.changedCells,'Changed-cell count not equal to manifest');
 req(sha(candidate)===v.terrainSha256,'Reconstructed B2a does not hash to source manifest');
 const report={milestone:'GEO-ISLAND-R02A',status:'SOURCE COMPATIBILITY PASS; NO GEOGRAPHY FREEZE',
  protectedRecoveryCommit:REC,b2aReferenceCommit:B2A,baselineTerrainSha256:BASE,
  b2aTerrainSha256:sha(candidate),waterSurfaceSha256:sha(readFileSync('public/geo-r02b/water-surface.f32')),
  sharedObjects:shared,patch:{rows:spec.rows,cols:spec.cols,sha256:sha(patch),changedCells:modified},
  protectedBaselineWritten:false,
  remainingGates:['Runtime POP/MAT/terrain compatibility','Birchwood Central Valley walk-corridor width',
  'Identical-camera fresh WebGL evidence','Coast mouth and South Shoulder exception review','Owner art approval']};
 writeFileSync(resolve(out,'preflight.json'),JSON.stringify(report,null,2)+'\n');
 console.log('PASS: protected shared blobs, R1 SHA, B2a patch, exact '+modified+'-cell reconstruction. NO FREEZE.');
}catch(e){console.error('GEO-ISLAND-R02 preflight FAILED:',e.message);process.exitCode=1;}
