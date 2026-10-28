/** MAT-ART-R01 movement/shimmer probe. At fixed walking stations (vegetation hidden, to isolate the ground) the camera
 * steps forward 2 cm at a time — far below any geometric change a player would notice — and frame-to-frame ground
 * luminance change is measured. High-frequency texture that aliases shows up as large per-pixel flicker.
 *   node tools/mat-art-r01/shimmer.mjs <out-dir> [base-url] */
import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import assert from 'node:assert/strict';

const [out='docs/mat-art-r01/evidence/movement',base='http://127.0.0.1:4372/mat-art-r01.html']=process.argv.slice(2);
const VIEWS=['birch-edge','open-grassland','birch-interior'],VARIANTS=['mat-01','mat-art-r01'],STEPS=6,STEP_M=.02;
await mkdir(out,{recursive:true});
function decode(buf){let at=8,w,h;const chunks=[];while(at<buf.length){const n=buf.readUInt32BE(at),t=buf.toString('ascii',at+4,at+8),d=buf.subarray(at+8,at+8+n);at+=12+n;if(t==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);assert.equal(d[9],6);}if(t==='IDAT')chunks.push(d);}
 const p=inflateSync(Buffer.concat(chunks)),s=w*4,o=new Uint8Array(w*h*4),pa=(a,b,c)=>{const q=a+b-c,x=Math.abs(q-a),y=Math.abs(q-b),z=Math.abs(q-c);return x<=y&&x<=z?a:y<=z?b:c;};
 for(let y=0;y<h;y++){const f=p[y*(s+1)];for(let x=0;x<s;x++){const i=y*s+x,a=x>=4?o[i-4]:0,u=y?o[i-s]:0,ul=y&&x>=4?o[i-s-4]:0;o[i]=(p[y*(s+1)+1+x]+[0,a,u,(a+u)>>1,pa(a,u,ul)][f])&255;}}return {w,h,px:o};}
const lin=c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;},L=(px,i)=>{const y=.2126*lin(px[i])+.7152*lin(px[i+1])+.0722*lin(px[i+2]);return y>.008856?116*Math.cbrt(y)-16:903.3*y;};
const report={milestone:'MAT-ART-R01',probe:`${STEPS} forward steps of ${STEP_M*100} cm at 1.75 m eye height, vegetation hidden; ground pixels from the dominant-material mask at the first pose`,rows:[],errors:[],
 limits:'Software WebGL; MSAA on. A static-camera re-render is included as the noise floor.'};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:700},deviceScaleFactor:1});page.setDefaultTimeout(300000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto(base);
 const settle=async()=>{await page.evaluate(()=>window.__matArt?.pause(false));await page.waitForFunction(()=>window.__matArtFailure||window.__matArt?.snapshot().ready);assert.equal(await page.evaluate(()=>window.__matArtFailure),undefined);await page.evaluate(()=>window.__matArt.pause(true));};
 const grab=async()=>Buffer.from((await page.evaluate(()=>window.__matArt.capture())).split(',')[1],'base64');
 await page.waitForFunction(()=>window.__matArt);await settle();
 for(const view of VIEWS){
  await page.evaluate(v=>{const a=window.__matArt;a.setVegetation(false);a.setDebug('off');a.setVariant('mat-01');a.setView(v);},view);await settle();
  await page.evaluate(()=>window.__matArt.setDebug('dominant'));await settle();const mask=decode(await grab());await page.evaluate(()=>window.__matArt.setDebug('off'));
  const ground=new Uint8Array(mask.w*mask.h);for(let i=0;i<ground.length;i++){const r=mask.px[i*4],g=mask.px[i*4+1];ground[i]=(Math.abs(r-171)<=1&&Math.abs(g-196)<=1)||(Math.abs(r-46)<=1&&Math.abs(g-92)<=1)?1:0;}
  for(const variant of VARIANTS){
   await page.evaluate(([v,variant])=>{const a=window.__matArt;a.setVariant(variant);a.setView(v);},[view,variant]);await settle();
   const frames=[decode(await grab())];frames.unshift(decode(await grab()));// static re-render = noise floor
   for(let s=0;s<STEPS;s++){await page.evaluate(d=>window.__matArt.stepWalk(d),STEP_M);await settle();const png=await grab();frames.push(decode(png));if(s===STEPS-1)await writeFile(`${out}/${view}--${variant}--step${STEPS}.png`,png);}
   const diff=(a,b)=>{let sum=0,n=0;const all=[];for(let i=0;i<ground.length;i+=1)if(ground[i]){const d=Math.abs(L(a.px,i*4)-L(b.px,i*4));sum+=d;n++;if(i%7===0)all.push(d);}all.sort((x,y)=>x-y);return {mean:sum/n,p95:all[Math.floor(all.length*.95)],pixels:n};};
   const floor=diff(frames[0],frames[1]),steps=[];for(let s=1;s<frames.length-1;s++)steps.push(diff(frames[s],frames[s+1]));
   const row={view,variant,noiseFloor:floor,meanAbsDeltaLstar:steps.reduce((a,b)=>a+b.mean,0)/steps.length,p95DeltaLstar:steps.reduce((a,b)=>a+b.p95,0)/steps.length,steps};
   report.rows.push(row);console.log(view,variant,'floor',floor.mean.toFixed(3),'mean',row.meanAbsDeltaLstar.toFixed(3),'p95',row.p95DeltaLstar.toFixed(2));
   await writeFile(out+'/shimmer.json',JSON.stringify(report,null,2)+'\n');
  }
 }
 assert.deepEqual(report.errors,[]);report.status='MEASURED';
}catch(e){report.status='FAIL';report.failure=String(e?.stack??e);process.exitCode=1;console.error(e);}
finally{await writeFile(out+'/shimmer.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
