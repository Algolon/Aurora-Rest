// MAT-01P shader cost-centre profiler (ablation). Runs against an UNMODIFIED MAT-01 review page: each variant rewrites
// the served shader module in flight (Playwright route interception) and never touches source files.
// Fragment cost is isolated by rendering every variant at two resolutions: the slope (ns per pixel) is fragment work,
// the intercept is vertex/fixed work. On SwiftShader this is CPU rasterisation cost, NOT GPU timing.
// Usage: node tools/mat-01p/profile.mjs --url http://127.0.0.1:4330/mat-01.html [--out docs/mat-01p/profile] [--frames 3]
//        [--variants a,b] [--views a,b]
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
const arg=(n,f)=>{const i=process.argv.indexOf('--'+n);return i>0?process.argv[i+1]:f;};
const url=arg('url','http://127.0.0.1:4330/mat-01.html'),out=arg('out','docs/mat-01p/profile'),frames=Number(arg('frames','3'));
const SIZES=[[400,250],[1600,1000]];
const executablePath=process.env.CHROME||(existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);

// Exact substrings of the MAT-01 shader (src/terrain-material/render/shader.ts @ ae8a9c1). Each must match exactly once
// per listed count or the run aborts, so an ablation can never silently measure the unmodified shader.
const R={
 patch:['float pn=.62*tmFbm(tmXZ*uMatPatch[m].w+vec2(float(m)*13.7,float(m)*5.3))+.38*tmFbm(tmXZ*uMatPatch[m].w*.23+vec2(float(m)*3.1,9.2));','float pn=.5;'],
 ecotone:['(tmFbm(tmXZ*.31+vec2(float(m)*7.3,2.9))-.5)','0.'],
 meso:['tmFbm(tmXZ*ms+vec2(float(m)*37.1,-11.7))','.5'],
 antiTileMask:['tmFbm(tmXZ*uAntiTile.y+vec2(float(m)*5.1,1.7))','.5'],
 streaks:['tmFbm(vec2(dot(tmXZ,tc)*.33,vGeo.y*.045))','.5'],
 fbmBody:['float tmFbm(vec2 p){return .6*tmNoise(p)+.3*tmNoise(p*2.13+17.)+.1*tmNoise(p*4.41+31.);}','float tmFbm(vec2 p){return .5;}'],
 fbmOneOctave:['float tmFbm(vec2 p){return .6*tmNoise(p)+.3*tmNoise(p*2.13+17.)+.1*tmNoise(p*4.41+31.);}','float tmFbm(vec2 p){return tmNoise(p);}'],
};
const V=[
 {id:'full',label:'MAT-01 unchanged',edits:[]},
 {id:'no-patch-noise',label:'patch fBm ×2 → constant',edits:['patch']},
 {id:'no-ecotone-noise',label:'ecotone fBm → constant',edits:['ecotone']},
 {id:'no-meso-noise',label:'meso fBm → constant',edits:['meso']},
 {id:'no-antitile-mask',label:'anti-tile mask fBm → constant (2 extra fetches kept)',edits:['antiTileMask']},
 {id:'no-antitile',label:'anti-tiling off (fBm + 2 fetches removed)',edits:[],state:{uniform:['uAntiTile',[0,1/9]]}},
 {id:'no-streaks',label:'streak fBm → constant',edits:['streaks']},
 {id:'no-fbm',label:'every fBm → constant (upper bound of noise savings)',edits:['fbmBody']},
 {id:'fbm-1-octave',label:'fBm reduced to one value-noise octave',edits:['fbmOneOctave']},
 {id:'no-height-blend',label:'height blending off',edits:[],state:{patch:{heightBlend:false}}},
 {id:'no-detail-normals',label:'detail normals off',edits:[],state:{patch:{normals:false}}},
 {id:'single-material',label:'meadow forced everywhere (no blending)',edits:[],state:{patch:{force:1}}},
 {id:'balanced',label:'Balanced profile (no triplanar)',edits:[],profile:'balanced'},
 {id:'mobile',label:'Mobile profile (8 m map, 256² textures, no meso/anti-tiling/triplanar)',edits:[],profile:'mobile'},
 {id:'mobile-no-fbm',label:'Mobile profile + every fBm → constant',edits:['fbmBody'],profile:'mobile'},
 {id:'plain',label:'existing plain Lambert terrain (reference)',edits:[],state:{patch:{surface:'plain'}}},
 // MAT-01P candidate (only on a server that implements setNoise): fBm masks read from the baked noise texture.
 {id:'baked',label:'High + baked noise candidate',edits:[],state:{patch:{noise:'baked'}}},
 {id:'balanced-baked',label:'Balanced + baked noise candidate',edits:[],profile:'balanced',state:{patch:{noise:'baked'}}},
 {id:'mobile-baked',label:'Mobile + baked noise candidate',edits:[],profile:'mobile',state:{patch:{noise:'baked'}}},
];
const wantV=arg('variants',''),VIEWS=arg('views','tr-forest-meadow,m02-elevated,valley-walk').split(',');
const variants=wantV?V.filter(v=>wantV.split(',').includes(v.id)):V.filter(v=>!v.id.includes('baked'));
const median=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
const browser=await chromium.launch({headless:true,executablePath,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const result={tool:'tools/mat-01p/profile.mjs',url,browser:browser.version(),frames,sizes:SIZES,views:VIEWS,
 geometry:'All variants render the same 16 m LOD mesh (existing MAT-01 LOD path, focus placed off-island) so vertex cost is small and constant; material weights are LOD-invariant (MAT-01 diff ≤ 3/255).',
 method:'Synchronous render + 1-px readPixels per frame, median of N after one warm-up. Fragment cost = slope between two resolutions (ns/pixel); fixed cost = intercept (ms). SwiftShader software rasterisation: relative costs only.',
 variants:[]};
await mkdir(out,{recursive:true});
try{
 for(const v of variants){
  const page=await browser.newPage({viewport:{width:SIZES[1][0],height:SIZES[1][1]},deviceScaleFactor:1}),errors=[],applied={};page.setDefaultTimeout(1800000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route(/\/src\/terrain-material\/render\/shader\.ts/,async route=>{
   const resp=await route.fetch();let body=await resp.text();
   for(const key of v.edits){const [from,to]=R[key],n=body.split(from).length-1;applied[key]=n;if(n<1)throw new Error(`ablation ${key} did not match served shader`);body=body.split(from).join(to);}
   await route.fulfill({response:resp,body});});
  await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>window.__auroraMAT01?.ready,null,{timeout:1800000});
  for(const key of v.edits)if(!applied[key])throw new Error(`ablation ${key} was not applied`);
  await page.addStyleTag({content:'#ui{display:none!important}'});
  await page.evaluate(async v=>{const q=window.__auroraMAT01;q.pause(true);if(v.profile)await q.setProfile(v.profile);
   q.set({surface:'material',debug:'off',force:-1,heightBlend:true,normals:true,triplanar:true,wireframe:false,water:true,lighting:'nordic',...(v.state?.patch??{})});
   if(v.state?.uniform)q.uniform(...v.state.uniform);
   // Identical coarse geometry for every variant (16 m mesh everywhere) so fragment work dominates the frame.
   q.setLayout('lod',{x:1e6,z:1e6});},v);
  const mode=await page.evaluate(()=>window.__auroraMAT01.metrics().noise??'procedural');
  if((v.state?.patch?.noise??'procedural')!==mode)throw new Error(`variant ${v.id} expected noise ${v.state?.patch?.noise} but page reports ${mode}`);
  const entry={id:v.id,label:v.label,edits:v.edits,editMatches:applied,profile:v.profile??'high',noise:mode,views:{}};
  for(const view of VIEWS){
   const pts=[];
   for(const [w,h] of SIZES){
    await page.setViewportSize({width:w,height:h});
    // The page's resize listener runs asynchronously; dispatch it synchronously and assert the drawing-buffer size.
    const r=await page.evaluate(([view,frames])=>{dispatchEvent(new Event('resize'));const q=window.__auroraMAT01;q.setView(view);const size=q.snap('warm');const t=[];
     for(let i=0;i<frames;i++){const s=performance.now();q.snap('t');t.push(performance.now()-s);}return {size,t};},[view,frames]);
    if(r.size.w!==w||r.size.h!==h)throw new Error(`drawing buffer ${r.size.w}×${r.size.h}, expected ${w}×${h}`);
    const times=r.t;pts.push({w,h,pixels:w*h,ms:median(times),samples:times.map(x=>+x.toFixed(1))});
    if(w===SIZES[1][0]&&view===VIEWS[0])await page.screenshot({path:`${out}/${v.id}--${view}.png`});
   }
   const [a,b]=pts,nsPerPixel=(b.ms-a.ms)/(b.pixels-a.pixels)*1e6,fixedMs=a.ms-nsPerPixel*a.pixels/1e6;
   const metrics=await page.evaluate(()=>{const m=window.__auroraMAT01.metrics();return {calls:m.calls,triangles:m.triangles,shaderErrors:m.shaderErrors.length};});
   entry.views[view]={points:pts,nsPerPixel:+nsPerPixel.toFixed(1),fixedMs:+fixedMs.toFixed(1),...metrics};
   console.log(v.id,view,JSON.stringify({nsPerPixel:+nsPerPixel.toFixed(1),fixedMs:+fixedMs.toFixed(1),ms:pts.map(p=>p.ms.toFixed(0))}));
  }
  entry.errors=errors;result.variants.push(entry);await page.close();
  await writeFile(`${out}/ablation.json`,JSON.stringify(result,null,1)+'\n');
 }
}catch(e){result.failure=String(e?.stack??e);console.error(e);process.exitCode=1;}
finally{await writeFile(`${out}/ablation.json`,JSON.stringify(result,null,1)+'\n');await browser.close();}
