import {readFileSync,writeFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import assert from 'node:assert/strict';
/** Read original 8-bit RGB/RGBA PNGs only. No image output, processing or retouching. */
function png(path){
 const b=readFileSync(path),chunks=[];let width,height,channels;
 for(let at=8;at<b.length;){const size=b.readUInt32BE(at),type=b.toString('ascii',at+4,at+8),d=b.subarray(at+8,at+8+size);at+=12+size;
  if(type==='IHDR'){width=d.readUInt32BE(0);height=d.readUInt32BE(4);assert.equal(d[8],8);assert.ok(d[9]===2||d[9]===6);channels=d[9]===6?4:3;assert.equal(d[12],0);}
  if(type==='IDAT')chunks.push(d);
 }
 const packed=inflateSync(Buffer.concat(chunks)),stride=width*channels,bytes=new Uint8Array(height*stride);
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){const offset=y*(stride+1),filter=packed[offset];assert.ok(filter<=4);
  for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=channels?bytes[i-channels]:0,up=y?bytes[i-stride]:0,ul=y&&x>=channels?bytes[i-stride-channels]:0;
   bytes[i]=(packed[offset+1+x]+([0,a,up,Math.floor((a+up)/2),paeth(a,up,ul)][filter]))&255;
  }
 }
 return {width,height,channels,bytes};
}
const out=process.argv[2]??'docs/env-nature-r02/evidence',report=[];
for(const view of ['shelter','discovery','breathing','reveal','overview']){
 const a=png(`${out}/source-${view}.png`),b=png(`${out}/authored-${view}.png`);assert.equal(a.width,b.width);assert.equal(a.height,b.height);
 let changed=0,strong=0,total=0;
 for(let i=0;i<a.width*a.height;i++){let max=0;for(let c=0;c<3;c++){const d=Math.abs(a.bytes[i*a.channels+c]-b.bytes[i*b.channels+c]);max=Math.max(max,d);total+=d;}if(max)changed++;if(max>20)strong++;}
 report.push({view,resolution:[a.width,a.height],changedPixelPercent:changed/(a.width*a.height)*100,channelDifferenceAbove20Percent:strong/(a.width*a.height)*100,meanAbsoluteRgbDifference:total/(a.width*a.height*3),note:'Difference is evidence of visible intervention, not artistic quality.'});
}
writeFileSync(out+'/pixel-differences.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
