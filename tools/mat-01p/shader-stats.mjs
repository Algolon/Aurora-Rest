// MAT-01P static shader cost: captures the exact terrain fragment shader each variant hands to WebGL (shaderSource is
// wrapped in the page; no source file changes), compiles it with glslangValidator → SPIR-V, optimises with spirv-opt
// (-O; the dynamic per-material loops are NOT unrolled, so each loop body is counted once ≈ a single-material pixel) and classifies instructions.
// Static counts are hardware-independent proxies, not GPU cycle counts: real pixels run 1–2 material iterations.
// Requires glslangValidator, spirv-opt, spirv-dis on PATH (system tools; not project dependencies).
// Usage: node tools/mat-01p/shader-stats.mjs --url http://127.0.0.1:4330/mat-01.html --out docs/mat-01p/profile [--variants a,b]
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const arg=(n,f)=>{const i=process.argv.indexOf('--'+n);return i>0?process.argv[i+1]:f;};
const url=arg('url','http://127.0.0.1:4330/mat-01.html'),out=arg('out','docs/mat-01p/profile'),label=arg('label','baseline');
const executablePath=process.env.CHROME||(existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);
const R={fbmBody:['float tmFbm(vec2 p){return .6*tmNoise(p)+.3*tmNoise(p*2.13+17.)+.1*tmNoise(p*4.41+31.);}','float tmFbm(vec2 p){return .5;}']};
const ALL=[
 {id:'high',profile:'high',edits:[]},{id:'balanced',profile:'balanced',edits:[]},{id:'mobile',profile:'mobile',edits:[]},
 {id:'high-no-fbm',profile:'high',edits:['fbmBody']},{id:'mobile-no-fbm',profile:'mobile',edits:['fbmBody']},
 {id:'high-baked',profile:'high',edits:[],noise:'baked'},{id:'mobile-baked',profile:'mobile',edits:[],noise:'baked'},
];
const want=arg('variants','high,balanced,mobile,high-no-fbm,mobile-no-fbm');
const variants=ALL.filter(v=>want.split(',').includes(v.id));
const TEX=/^OpImage(Sample|Fetch|Gather)/;
const ALU=/^Op(F(Add|Sub|Mul|Div|Mod|Rem|Negate)|VectorTimesScalar|MatrixTimes|VectorTimesMatrix|Dot|ExtInst|FOrd|FUnord|Select|ConvertFToS|ConvertSToF|ConvertFToU|ConvertUToF|IAdd|ISub|IMul|SLessThan|SGreaterThan|IEqual|LogicalAnd|LogicalOr|LogicalNot|Any|All)/;
function analyse(frag,name){
 // WebGL GLSL ES 3.00 → desktop GLSL 4.50 for glslang's OpenGL SPIR-V target (semantics unchanged for counting).
 const src=frag.replace(/^#version 300 es/m,'#version 450').replace(/^precision [^;]+;$/gm,'');
 const base=`${out}/${name}`;
 require_write(`${base}.frag`,src);
 execFileSync('glslangValidator',['-G','--auto-map-locations','--auto-map-bindings','-S','frag','-o',`${base}.spv`,`${base}.frag`],{stdio:'pipe'});
 execFileSync('spirv-opt',['-O','--loop-unroll','-O',`${base}.spv`,'-o',`${base}.opt.spv`],{stdio:'pipe'});
 const dis=execFileSync('spirv-dis',['--raw-id',`${base}.opt.spv`],{encoding:'utf8'});
 const types={};let tex=0,alu=0,aluLanes=0,total=0,branches=0;
 for(const line of dis.split('\n')){
  const t=line.match(/^\s*(%\d+) = OpType(Float|Vector|Matrix|Int|Bool)\b(.*)$/);
  if(t){const [,id,kind,rest]=t;types[id]=kind==='Vector'?Number(rest.trim().split(/\s+/)[1]):kind==='Matrix'?4:1;continue;}
  const m=line.match(/^\s*(?:%\d+ = )?(Op\w+)\s*(%\d+)?/);if(!m)continue;const op=m[1];
  if(/^Op(Type|Decorate|Name|MemberDecorate|Capability|Extension|ExtInstImport|MemoryModel|EntryPoint|ExecutionMode|Source|Constant|Variable|Function|Label|Return|Undef|String|Line|NoLine)/.test(op))continue;
  total++;if(op==='OpBranchConditional')branches++;
  if(TEX.test(op))tex++;else if(ALU.test(op)){alu++;aluLanes+=types[m[2]]??1;}
 }
 const spvSha256=createHash('sha256').update(readFileSync(`${base}.opt.spv`)).digest('hex');
 return {instructions:total,textureSamples:tex,aluInstructions:alu,aluLanes,conditionalBranches:branches,optimisedSpirvSha256:spvSha256};
}
import {writeFileSync} from 'node:fs';
function require_write(p,s){writeFileSync(p,s);}
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const result={tool:'tools/mat-01p/shader-stats.mjs',label,url,glslang:execFileSync('glslangValidator',['--version'],{encoding:'utf8'}).split('\n')[0],
 note:'Static SPIR-V counts of the exact WebGL fragment shader after spirv-opt -O. The per-material loops stay loops, so each loop body is counted once (≈ one active material; transition pixels run 2–3 iterations). aluLanes weights each ALU instruction by its vector width. Hardware-independent proxy; not GPU cycles.',variants:{}};
try{
 for(const v of variants){
  const page=await browser.newPage({viewport:{width:320,height:200}});page.setDefaultTimeout(900000);
  await page.addInitScript(()=>{const sources=[];window.__shaderSources=sources;const orig=WebGL2RenderingContext.prototype.shaderSource;
   WebGL2RenderingContext.prototype.shaderSource=function(sh,src){sources.push(src);return orig.call(this,sh,src);};});
  await page.route(/\/src\/terrain-material\/render\/shader\.ts/,async route=>{const resp=await route.fetch();let body=await resp.text();
   for(const k of v.edits){if(!body.includes(R[k][0]))throw new Error('edit '+k+' missing');body=body.split(R[k][0]).join(R[k][1]);}await route.fulfill({response:resp,body});});
  await page.goto(url);await page.waitForFunction(()=>window.__auroraMAT01?.ready,null,{timeout:900000});
  await page.evaluate(async v=>{const q=window.__auroraMAT01;q.pause(true);await q.setProfile(v.profile);if(v.noise)q.set({noise:v.noise});q.setView('m02-walk');q.snap('s');},v);
  const frags=await page.evaluate(()=>window.__shaderSources.filter(s=>s.includes('tmFbm')&&s.includes('pc_fragColor')));
  if(!frags.length)throw new Error('terrain fragment shader not captured for '+v.id);
  const frag=frags.at(-1);
  result.variants[v.id]={profile:v.profile,edits:v.edits,noise:v.noise??'procedural',defines:[...frag.matchAll(/^#define ((?:TM|MAT)_\w+(?: \S+)?)\s*$/gm)].map(m=>m[1]),...analyse(frag,`${label}-${v.id}`)};
  console.log(v.id,JSON.stringify(result.variants[v.id]));await page.close();
 }
}catch(e){result.failure=String(e?.stack??e);console.error(e);process.exitCode=1;}
finally{await writeFile(`${out}/shader-stats-${label}.json`,JSON.stringify(result,null,1)+'\n');await browser.close();}
