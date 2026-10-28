/** MAT-ART-R01 measurement of genuine capture PNGs. Reads PNGs only; never writes or alters an image.
 * Ground pixels are identified from the matching dominant-material debug capture (exact flat debug colours).
 * Band energy uses mask-normalised box filters, so vegetation/sky never bleed into ground statistics.
 *   node tools/mat-art-r01/image-metrics.mjs <evidence-dir> */
import {readFileSync,writeFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import assert from 'node:assert/strict';

export function png(path){
 const b=readFileSync(path),chunks=[];let width,height,channels;
 for(let at=8;at<b.length;){const size=b.readUInt32BE(at),type=b.toString('ascii',at+4,at+8),d=b.subarray(at+8,at+8+size);at+=12+size;
  if(type==='IHDR'){width=d.readUInt32BE(0);height=d.readUInt32BE(4);assert.equal(d[8],8);assert.ok(d[9]===2||d[9]===6);channels=d[9]===6?4:3;assert.equal(d[12],0);}
  if(type==='IDAT')chunks.push(d);}
 const packed=inflateSync(Buffer.concat(chunks)),stride=width*channels,bytes=new Uint8Array(height*stride);
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){const o=y*(stride+1),f=packed[o];
  for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=channels?bytes[i-channels]:0,up=y?bytes[i-stride]:0,ul=y&&x>=channels?bytes[i-stride-channels]:0;
   bytes[i]=(packed[o+1+x]+[0,a,up,(a+up)>>1,paeth(a,up,ul)][f])&255;}}
 return {width,height,channels,bytes};
}
const lin=c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;};
const lstar=y=>y>.008856?116*Math.cbrt(y)-16:903.3*y;
/** Exact dominant-material debug colours (DEBUG_COLORS × 255, rounded). */
const DEBUG={'forest-floor':[46,92,41],'meadow-turf':[171,196,97],'coastal-sand':[232,207,140],bedrock:[128,128,133]},SKY=[185,204,210];
function classify(mask){const {width:W,height:H,channels:C,bytes}=mask,cls=new Int8Array(W*H).fill(-1),ids=Object.keys(DEBUG);
 for(let i=0;i<W*H;i++){const r=bytes[i*C],g=bytes[i*C+1],b=bytes[i*C+2];
  ids.forEach((id,k)=>{const d=DEBUG[id];if(Math.abs(r-d[0])<=1&&Math.abs(g-d[1])<=1&&Math.abs(b-d[2])<=1)cls[i]=k;});
  if(cls[i]<0&&Math.abs(r-SKY[0])<=3&&Math.abs(g-SKY[1])<=3&&Math.abs(b-SKY[2])<=3)cls[i]=9;}
 return {cls,ids};}
/** Mask-normalised separable box filter (clamped edges). */
function maskedBlur(v,m,W,H,r){
 const pass=(src,w,horiz)=>{const out=new Float64Array(W*H),wo=new Float64Array(W*H);
  for(let a=0;a<(horiz?H:W);a++){let s=0,n=0;const at=b=>horiz?a*W+b:b*W+a,len=horiz?W:H;
   for(let b=-r;b<=r;b++){const k=at(Math.min(len-1,Math.max(0,b)));s+=src[k];n+=w[k];}
   for(let b=0;b<len;b++){out[at(b)]=s;wo[at(b)]=n;const add=at(Math.min(len-1,b+r+1)),rem=at(Math.max(0,b-r));s+=src[add]-src[rem];n+=w[add]-w[rem];}}
  return [out,wo];};
 const vm=v.map((x,i)=>x*m[i]),[h,hw]=pass(vm,m,true),[f,fw]=pass(h,hw,false);
 return f.map((x,i)=>fw[i]>1e-6?x/fw[i]:0);}
const BANDS=[['1–3 px',0,1],['3–7 px',1,3],['7–19 px',3,9],['19–55 px',9,27]];
export function regionStats(image,maskFn,W,H){
 const C=image.channels,L=new Float64Array(W*H),m=new Float64Array(W*H);let n=0;const rgb=[0,0,0];
 for(let i=0;i<W*H;i++){const r=image.bytes[i*C],g=image.bytes[i*C+1],b=image.bytes[i*C+2];L[i]=lstar(.2126*lin(r)+.7152*lin(g)+.0722*lin(b));if(maskFn(i)){m[i]=1;n++;rgb[0]+=r;rgb[1]+=g;rgb[2]+=b;}}
 if(n<500)return {pixels:n};
 const blurs=[L,...[1,3,9,27].map(r=>maskedBlur(L,m,W,H,r))],bands={};
 BANDS.forEach(([name],k)=>{let s=0;for(let i=0;i<W*H;i++)if(m[i]){const d=blurs[k][i]-blurs[k+1][i];s+=d*d;}bands[name]=Math.sqrt(s/n);});
 let mean=0,sq=0;for(let i=0;i<W*H;i++)if(m[i]){mean+=L[i];sq+=L[i]*L[i];}mean/=n;
 return {pixels:n,pixelShare:n/(W*H),meanSrgb:rgb.map(c=>Math.round(c/n)),meanLstar:mean,stdLstar:Math.sqrt(Math.max(0,sq/n-mean*mean)),bandRmsLstar:bands,
  fineToBroad:bands['1–3 px']/Math.max(1e-6,bands['19–55 px'])};}

export function measure(dir,capture){
 const rows=[],byKey=new Map();for(const r of capture.records)byKey.set(`${r.view}|${r.vegetation}|${r.debug==='dominant'?'mask':r.variant}`,r);
 for(const r of capture.records){if(r.debug==='dominant')continue;const mask=byKey.get(`${r.view}|${r.vegetation}|mask`);if(!mask)continue;
  const img=png(`${dir}/${r.file}`),mk=png(`${dir}/${mask.file}`),W=img.width,H=img.height,{cls,ids}=classify(mk);
  // One-pixel erosion against MSAA/edge mixing.
  const solid=k=>i=>{if(cls[i]!==k)return false;const x=i%W,y=(i/W)|0;return x>0&&y>0&&x<W-1&&y<H-1&&cls[i-1]===k&&cls[i+1]===k&&cls[i-W]===k&&cls[i+W]===k;};
  const materials={};ids.forEach((id,k)=>{const s=regionStats(img,solid(k),W,H);if(s.pixels>=500)materials[id]=s;});
  const ground=regionStats(img,i=>cls[i]>=0&&cls[i]<4,W,H);
  const vegetation=r.vegetation?regionStats(img,i=>cls[i]===-1,W,H):null;
  rows.push({view:r.view,vegetation:r.vegetation,variant:r.variant,file:r.file,ground,materials,vegetationPixels:vegetation});}
 return rows;}

if(import.meta.url===`file://${process.argv[1]}`){
 const dir=process.argv[2]??'docs/mat-art-r01/diagnosis/evidence',capture=JSON.parse(readFileSync(dir+'/capture.json','utf8'));
 const rows=measure(dir,capture);writeFileSync(dir+'/image-metrics.json',JSON.stringify({note:'L* band RMS on unretouched captures; ground pixels from the dominant-material debug capture. Measurements support, but do not replace, visual judgment.',rows},null,2)+'\n');
 const f=v=>v===undefined?'   -':v.toFixed(2).padStart(5);
 for(const r of rows){const g=r.ground.bandRmsLstar??{},v=r.vegetationPixels?.bandRmsLstar;
  console.log(`${r.view.padEnd(19)} ${(r.vegetation?'env':'ground').padEnd(6)} ${r.variant.padEnd(20)} ground ${f(g['1–3 px'])} ${f(g['3–7 px'])} ${f(g['7–19 px'])} ${f(g['19–55 px'])} std ${f(r.ground.stdLstar)}`+(v?` | veg ${f(v['1–3 px'])} ${f(v['3–7 px'])} ${f(v['7–19 px'])} ${f(v['19–55 px'])} share ${(r.vegetationPixels.pixelShare*100).toFixed(0)}%`:''));}
}
