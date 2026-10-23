// MAT-01 classification report: runs the canonical classifier on the committed GEO-R02B-R1 artifacts and writes
// top-down DATA MAPS (not renderer screenshots) plus coverage statistics.
// Usage: node --experimental-strip-types tools/mat-01/classify-report.ts [outDir]
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {writePng as png} from './png.ts';
import {classifyTerrain,classificationHash} from '../../src/terrain-material/classify.ts';
import {geoR02BSource} from '../../src/terrain-material/sources/geo-r02b.ts';
import {MATERIAL_ORDER,RULES} from '../../src/terrain-material/rules.ts';
import {sampleField} from '../../src/terrain-material/fields.ts';

const out=process.argv[2]??'docs/mat-01/classification';mkdirSync(out,{recursive:true});
const f32=(p:string)=>{const b=readFileSync(p);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const features=JSON.parse(readFileSync('public/geo-r02b/features.json','utf8'));
const source=geoR02BSource(f32('public/geo-r02b/terrain.f32'),f32('public/geo-r02b/water-surface.f32'),features);
const {classification:c,timingsMs,fields}=classifyTerrain(source,{keepFields:true});
const {width:W,height:H}=c.lattice;

// Downsample 2× (8 m per pixel) for compact data maps.
const S=2,w=Math.floor(W/S),h=Math.floor(H/S);
const DEBUG:[number,number,number][]=[[46,92,40],[170,196,96],[232,206,140],[128,128,132]];
function map(name:string,fn:(k:number)=>[number,number,number]){const rgb=new Uint8Array(w*h*3);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=fn(y*S*W+x*S);rgb.set(v.map(q=>Math.max(0,Math.min(255,Math.round(q)))),(y*w+x)*3);}png(`${out}/${name}.png`,w,h,rgb);}
const land=(k:number)=>!(Number.isFinite(source.water![k])&&source.water![k]<=.001)&&source.heights[k]>=0;
const shade=(k:number)=>{const i=k%W,j=(k/W)|0,hh=source.heights,a=hh[k],b=hh[Math.min(W*H-1,k+W)],r=hh[Math.min(W*H-1,k+1)];return Math.max(.55,Math.min(1.15,1+((a-r)-(b-a))*.06));};
const SEA:[number,number,number]=[58,92,108];
map('weights-blend',k=>{if(!land(k))return SEA;let r=0,g=0,b=0;for(let m=0;m<4;m++){const q=c.weights[k*4+m]/255;r+=q*DEBUG[m][0];g+=q*DEBUG[m][1];b+=q*DEBUG[m][2];}const s=shade(k);return [r*s,g*s,b*s];});
map('dominant',k=>{if(!land(k))return SEA;let best=0;for(let m=1;m<4;m++)if(c.weights[k*4+m]>c.weights[k*4+best])best=m;return DEBUG[best];});
map('wetness',k=>{const v=c.attributes[k*4];return land(k)?[255-v*.8,255-v*.5,255-v*.1]:SEA;});
map('exposure',k=>{const v=c.attributes[k*4+2];return land(k)?[v,v*.8,255-v]:SEA;});
map('slope',k=>{const s=fields!.slope[k];return land(k)?(s<.12?[145,187,144]:s<.25?[217,213,125]:s<.35?[231,170,96]:s<.6?[202,106,83]:[108,54,93]):SEA;});
map('forest-intent',k=>{const v=sampleField(fields!.forestIntent,fields!.forestIntentLattice,c.lattice.west+(k%W)*c.lattice.cellM,c.lattice.north-Math.floor(k/W)*c.lattice.cellM);return land(k)?[255-v*200,255-v*120,255-v*200]:SEA;});

const counts=new Float64Array(4);let landN=0,sumErrors=0;
for(let k=0;k<W*H;k++){let s=0;for(let m=0;m<4;m++)s+=c.weights[k*4+m];if(s!==255)sumErrors++;if(!land(k))continue;landN++;for(let m=0;m<4;m++)counts[m]+=c.weights[k*4+m]/255;}
const anchors=Object.fromEntries(source.anchors.map(a=>{const k=Math.round((c.lattice.north-a.xz[1])/c.lattice.cellM)*W+Math.round((a.xz[0]-c.lattice.west)/c.lattice.cellM);return [a.id,Object.fromEntries(MATERIAL_ORDER.map((id,m)=>[id,+(c.weights[k*4+m]/255).toFixed(3)]))];}));
const report={tool:'tools/mat-01/classify-report.ts',evidenceType:'top-down classification data maps (8 m/pixel), NOT renderer screenshots',
 rulesVersion:RULES.version,sourceId:c.sourceId,sourceProvenance:source.provenance,lattice:c.lattice,sha256:await classificationHash(c),timingsMs,
 weightSumViolations:sumErrors,landNodes:landN,landCoverage:Object.fromEntries(MATERIAL_ORDER.map((id,m)=>[id,+(counts[m]/landN).toFixed(4)])),anchorComposition:anchors,
 legend:{'forest-floor':DEBUG[0],'meadow-turf':DEBUG[1],'coastal-sand':DEBUG[2],bedrock:DEBUG[3]}};
writeFileSync(`${out}/classification-report.json`,JSON.stringify(report,null,1)+'\n');
console.log(JSON.stringify(report,null,1));
