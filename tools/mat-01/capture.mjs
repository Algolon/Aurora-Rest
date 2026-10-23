// MAT-01 evidence capture: unretouched Chromium/WebGL screenshots of the real Three.js review page (mat-01.html),
// plus in-page pixel diffs, GPU/CPU parity, resource lifecycle and renderer measurements.
// Usage: node tools/mat-01/capture.mjs [--url http://127.0.0.1:4320/mat-01.html] [--out docs/mat-01/evidence] [--groups a,b] [--size 1280x800]
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const arg=(n,f)=>{const i=process.argv.indexOf('--'+n);return i>0?process.argv[i+1]:f;};
const url=arg('url','http://127.0.0.1:4320/mat-01.html'),out=arg('out','docs/mat-01/evidence'),[width,height]=arg('size','1280x800').split('x').map(Number);
const groups=arg('groups','all'),files=arg('files',''),merge=process.argv.includes('--merge');
const executablePath=process.env.CHROME||(existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);
const sha=b=>createHash('sha256').update(b).digest('hex');
let head='unknown';try{head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{}
const BASE={surface:'material',debug:'off',force:-1,heightBlend:true,normals:true,triplanar:true,wireframe:false,water:true};
const S=(group,file,view,caption,patch={},extra={})=>({group,file,view,caption,patch:{...BASE,...patch},...extra});
const M=[['m01','M01 Nordic Forest Floor'],['m02','M02 Meadow Turf'],['m03','M03 Coastal Sand'],['m04','M04 Nordic Bedrock']];
const SHOTS=[
 ...M.flatMap(([c,n])=>[
  S('materials',`${c}-close.png`,`${c}-close`,`${n}: close-up, 1.1 m above the surface looking down (Nordic daylight).`),
  S('materials',`${c}-walk.png`,`${c}-walk`,`${n}: walking eye height 1.75 m.`),
  S('materials',`${c}-elevated.png`,`${c}-elevated`,`${n}: elevated 38 m view of the same location.`)]),
 S('scenes','birchwood-overview.png','birchwood-overview','Scene A — Birchwood overview: forest floor with glades and meadow margins on rolling terrain.'),
 S('scenes','birchwood-walk.png','birchwood-walk','Scene A — Birchwood at walking height from a forest edge.'),
 S('scenes','valley-overview.png','valley-overview','Scene B — Central Valley overview: open turf, river corridor wetness and large-distance colour continuity.'),
 S('scenes','valley-walk.png','valley-walk','Scene B — Central Valley at walking height (GEO-R02B central-valley viewpoint).'),
 S('scenes','cove-shore.png','cove-shore','Scene C — Home Cove shoreline at walking height (GEO-R02B home-cove viewpoint).'),
 S('scenes','cove-elevated.png','cove-elevated','Scene C — Home Cove from above: sand band, wet margin and grass-backed shore.'),
 S('scenes','tarn-slope.png','tarn-slope','Scene D — High Tarn rocky slope at walking height (GEO-R02B high-tarn viewpoint).'),
 S('scenes','tarn-elevated.png','tarn-elevated','Scene D — High Tarn elevated: bedrock on steep and high ground, sparse turf on benches.'),
 S('transitions','tr-forest-meadow.png','tr-forest-meadow','Transition forest floor ↔ meadow (height-blended).'),
 S('transitions','tr-forest-meadow-linear.png','tr-forest-meadow','Same view with height blending OFF (linear weight blend) for comparison.',{heightBlend:false}),
 S('transitions','tr-meadow-rock.png','tr-meadow-rock','Transition meadow ↔ bedrock on the northern massif.'),
 S('transitions','tr-sand-rock.png','tr-sand-rock','Transition sand ↔ bedrock on the eastern coast.'),
 S('transitions','tr-wet-shore.png','tr-wet-shore','Wet shoreline influence: darker, smoother sand at the waterline (wetness attribute from verified sea mask + height).'),
 S('transitions','tr-wet-meadow.png','tr-wet-meadow','River-side wet meadow: wetness from verified freshwater surface + provisional Mirelands intent.'),
 ...['weights','dominant','slope','wetness','exposure','macro'].map(d=>S('diagnostics',`island-${d}.png`,'island-ortho',`Island orthographic, debug view “${d}” (exact unlit shader output).`,{debug:d,water:false})),
 S('diagnostics','birchwood-weights.png','birchwood-ortho','Birchwood 1.2 km orthographic: canonical material weights.',{debug:'weights',water:false}),
 S('diagnostics','birchwood-blended.png','birchwood-ortho','Birchwood 1.2 km orthographic: final height-blended weights (shader presentation).',{debug:'blended',water:false}),
 S('diagnostics','tile-seam-lattice.png','tile-seam','Tile-boundary view: classification lattice (4 m) drawn on the terrain; the 400 m tile corner is in frame.',{debug:'lattice'}),
 S('diagnostics','tile-seam-wireframe.png','tile-seam','Same view, wireframe: tile boundaries at x = −1000 m and z = −400 m.',{wireframe:true}),
 S('lighting','valley-walk-neutral.png','valley-walk','Central Valley, neutral lighting.',{},{lighting:'neutral'}),
 S('lighting','valley-walk-grazing.png','valley-walk','Central Valley, low grazing sun (8°) to expose micro-relief.',{},{lighting:'grazing'}),
 S('lighting','m04-walk-grazing.png','m04-walk','Bedrock under grazing light.',{},{lighting:'grazing'}),
 S('lighting','m01-close-neutral.png','m01-close','Forest floor close-up, neutral lighting.',{},{lighting:'neutral'}),
 ...M.map(([c,n],i)=>S('comparison',`compare-valley-${c}.png`,'m02-walk',`Material comparison on identical terrain/camera: ${n} forced everywhere.`,{force:i})),
 S('triplanar','tarn-steep-triplanar.png','tarn-slope','Steep bedrock with selective triplanar projection ON.',{triplanar:true}),
 S('triplanar','tarn-steep-planar.png','tarn-slope','Same view with triplanar OFF (top-down projection only).',{triplanar:false}),
];
const BEFORE_AFTER=['valley-walk','valley-overview','birchwood-overview','birchwood-walk','cove-shore','tarn-slope','island-ortho'];
for(const v of BEFORE_AFTER)for(const [surface,label] of [['plain','Before — existing plain GEO-R02B terrain material (Lambert 0xb4b6b0)'],['vertex','Option A — per-vertex colour from the same classification (no detail textures)'],['material','After — MAT-01 hybrid material']])
 SHOTS.push(S('before-after',`ba-${v}-${surface}.png`,v,`${label}. Matched camera, lighting and terrain.`,{surface}));

const browser=await chromium.launch({headless:true,executablePath,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const manifest={tool:'tools/mat-01/capture.mjs',gitHead:head,url,viewport:{width,height,dpr:1},browser:browser.version(),
 evidence:'Unretouched Chromium WebGL2 screenshots of the MAT-01 Three.js review page on the real GEO-R02B-R1 terrain. Renderer is SwiftShader (software); timings are not GPU performance.',
 shots:[],diffs:[],measurements:{}};
// --merge: keep an existing manifest and replace only the shots/diffs/measurements re-captured in this run.
if(merge&&existsSync(`${out}/manifest.json`)){const old=JSON.parse(readFileSync(`${out}/manifest.json`,'utf8'));Object.assign(manifest,{shots:old.shots,diffs:old.diffs,measurements:old.measurements??{}});manifest.mergedRuns=[...(old.mergedRuns??[]),{gitHead:old.gitHead}];}
const upsert=(list,entry)=>{const i=list.findIndex(e=>e.file===entry.file);if(i>=0)list[i]=entry;else list.push(entry);};
let failed=false;const want=g=>groups==='all'||groups.split(',').includes(g);
try{
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1}),errors=[];page.setDefaultTimeout(900000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const t0=Date.now();await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>window.__auroraMAT01?.ready,null,{timeout:900000});
 manifest.measurements.pageReadySeconds=(Date.now()-t0)/1000;
 await page.addStyleTag({content:'#ui{display:none!important}'});
 await page.evaluate(()=>window.__auroraMAT01.pause(true));
 await mkdir(out,{recursive:true});
 const apply=async(shot)=>page.evaluate(({view,patch,lighting})=>{const q=window.__auroraMAT01;q.set({...patch,lighting:lighting??'nordic'});q.setView(view);},{view:shot.view,patch:shot.patch,lighting:shot.lighting});
 const shoot=async(shot)=>{await apply(shot);await page.evaluate(()=>window.__auroraMAT01.snap('_'));const png=await page.screenshot({path:`${out}/${shot.file}`});return png;};
 for(const shot of SHOTS){if(!want(shot.group)||(files&&!files.split(',').some(f=>shot.file.startsWith(f))))continue;const s=Date.now();const png=await shoot(shot);
  upsert(manifest.shots,{group:shot.group,file:shot.file,view:shot.view,caption:shot.caption,state:{...shot.patch,lighting:shot.lighting??'nordic'},sha256:sha(png),seconds:(Date.now()-s)/1000});
  console.log(shot.group,shot.file,((Date.now()-s)/1000).toFixed(1)+' s');await writeFile(`${out}/manifest.json`,JSON.stringify(manifest,null,1)+'\n');}
 const diffPair=async(name,caption,a,b,setA,setB)=>{
  await page.evaluate(setA);await page.evaluate(n=>window.__auroraMAT01.snap(n),a);
  await page.evaluate(setB);await page.evaluate(n=>window.__auroraMAT01.snap(n),b);
  const d=await page.evaluate(([x,y])=>window.__auroraMAT01.diff(x,y),[a,b]);
  await writeFile(`${out}/${name}`,Buffer.from(d.image.split(',')[1],'base64'));delete d.image;upsert(manifest.diffs,{file:name,caption,...d});console.log('diff',name,JSON.stringify(d));};
 if(want('invariance')){
  // Tiling: identical vertices split differently must give identical pixels (no seams).
  await diffPair('diff-tiling-tile-seam.png','Shaded MAT-01 frame, 400 m tiles vs 200 m tiles at the tile-corner view (×8 amplified |Δ|).','t400','t200',
   ()=>{const q=window.__auroraMAT01;q.setLayout('canonical');q.set({debug:'off',force:-1,wireframe:false,water:true,lighting:'nordic'});q.setView('tile-seam');},
   ()=>{const q=window.__auroraMAT01;q.setLayout('tile200');q.setView('tile-seam');});
  await page.screenshot({path:`${out}/tile-seam-200m.png`});upsert(manifest.shots,{group:'invariance',file:'tile-seam-200m.png',view:'tile-seam',caption:'Tile-corner view rendered with 200 m tiles (compare with tile-seam view at 400 m).'});
  // LOD: top-down classification must not change when mesh resolution changes.
  await diffPair('diff-lod-weights-ortho.png','Canonical weights, Birchwood orthographic: 4 m mesh vs LOD 4/8/16 m mesh (×8 amplified |Δ|).','lod4','lodmix',
   ()=>{const q=window.__auroraMAT01;q.setLayout('canonical');q.set({debug:'weights',water:false});q.setView('birchwood-ortho');},
   ()=>{const q=window.__auroraMAT01;q.setLayout('lod',{x:150,z:-1150});q.setView('birchwood-ortho');});
  await page.evaluate(()=>{const q=window.__auroraMAT01;q.set({wireframe:true,debug:'off'});q.snap('w');});await page.screenshot({path:`${out}/lod-wireframe-ortho.png`});
  upsert(manifest.shots,{group:'invariance',file:'lod-wireframe-ortho.png',view:'birchwood-ortho',caption:'LOD layout used for the LOD comparison (wireframe): 4, 8 and 16 m tiles by distance from the valley focus.'});
  await diffPair('diff-lod-shaded-walk.png','Shaded MAT-01, Central Valley overview: 4 m mesh vs LOD mesh. Differences come from geometry (silhouettes, interpolated normals), not material identity.','lodA','lodB',
   ()=>{const q=window.__auroraMAT01;q.setLayout('canonical');q.set({wireframe:false,debug:'off',water:true});q.setView('valley-overview');},
   ()=>{const q=window.__auroraMAT01;q.setLayout('lod',{x:150,z:-1150});q.setView('valley-overview');});
  await page.screenshot({path:`${out}/lod-shaded-valley.png`});upsert(manifest.shots,{group:'invariance',file:'lod-shaded-valley.png',view:'valley-overview',caption:'Central Valley overview rendered on the LOD mesh (compare with valley-overview.png).'});
  await page.evaluate(()=>window.__auroraMAT01.setLayout('canonical'));
 }
 if(want('measure')){
  const pts=[];for(let i=0;i<64;i++)pts.push([-1150+((i*37)%64)/64*600,-500+((i*23)%64)/64*600]);
  const parity=await page.evaluate(p=>window.__auroraMAT01.parity(-850,-200,330,p),pts);
  const err=parity.map(r=>Math.max(...r.gpu.map((g,k)=>Math.abs(g-r.cpu[k]))));
  manifest.measurements.gpuCpuParity={points:parity.length,maxAbsWeightError:+Math.max(...err).toFixed(4),meanAbsWeightError:+(err.reduce((a,b)=>a+b,0)/err.length).toFixed(5),note:'GPU raw weights rendered top-down to RGBA8 vs CPU TerrainMaterialQuery.weightsAt; 1/255 = 0.0039.'};
  manifest.measurements.lifecycle=await page.evaluate(()=>window.__auroraMAT01.lifecycle());
  manifest.measurements.runtime=await page.evaluate(()=>window.__auroraMAT01.metrics());
 }
 if(want('bench')){
  const bench={};
  for(const [view,profile] of [['valley-walk','high'],['valley-walk','balanced'],['valley-walk','mobile'],['valley-overview','high'],['birchwood-walk','high'],['island-ortho','high']]){
   await page.evaluate(async([v,p])=>{const q=window.__auroraMAT01;await q.setProfile(p);q.set({...{surface:'material',debug:'off',force:-1,wireframe:false,water:true}});q.setView(v);},[view,profile]);
   const compileMs=await page.evaluate(()=>window.__auroraMAT01.compileMs());
   const ms=await page.evaluate(()=>window.__auroraMAT01.benchmark(3));const m=await page.evaluate(()=>window.__auroraMAT01.metrics());
   bench[`${view}/${profile}`]={msPerFrameSoftware:ms,compileMs,calls:m.calls,triangles:m.triangles,programs:m.programs,textures:m.textures,materialMemoryBytes:m.materialMemoryBytes};console.log('bench',view,profile,ms);}
  for(const surface of ['plain','vertex']){await page.evaluate(async s=>{const q=window.__auroraMAT01;await q.setProfile('high');q.set({surface:s});q.setView('valley-walk');},surface);
   bench[`valley-walk/${surface}`]={msPerFrameSoftware:await page.evaluate(()=>window.__auroraMAT01.benchmark(3))};}
  await page.evaluate(()=>window.__auroraMAT01.set({surface:'material'}));
  manifest.measurements.softwareBenchmark={note:'Synchronous render + readPixels on SwiftShader at '+width+'×'+height+'. CPU rasterisation cost; NOT desktop or Android GPU frame time.',results:bench};
  manifest.measurements.runtime??=await page.evaluate(()=>window.__auroraMAT01.metrics());
 }
 manifest.pageErrors=errors;if(errors.length)failed=true;
}catch(e){failed=true;manifest.failure=String(e?.stack??e);console.error('CAPTURE FAILURE',e);}
finally{await writeFile(`${out}/manifest.json`,JSON.stringify(manifest,null,1)+'\n');await browser.close();}
if(failed)process.exitCode=1;
