// Minimal dependency-free PNG (RGB8) writer for MAT-01 data maps and texture sheets.
import {writeFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
function crc32(buf:Uint8Array){let c,crc=0xffffffff;for(let n=0;n<buf.length;n++){c=(crc^buf[n])&0xff;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;crc=(crc>>>8)^c;}return (crc^0xffffffff)>>>0;}
export function writePng(file:string,w:number,h:number,rgb:Uint8Array){
 const raw=new Uint8Array((w*3+1)*h);for(let y=0;y<h;y++)raw.set(rgb.subarray(y*w*3,(y+1)*w*3),y*(w*3+1)+1);
 const chunk=(type:string,data:Uint8Array)=>{const b=Buffer.alloc(12+data.length);b.writeUInt32BE(data.length,0);b.write(type,4,'ascii');Buffer.from(data).copy(b,8);b.writeUInt32BE(crc32(new Uint8Array(b.subarray(4,8+data.length))),8+data.length);return b;};
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=2;
 writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',new Uint8Array(0))]));
}
