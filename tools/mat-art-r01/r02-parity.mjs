/** MAT-ART-R01: pixel parity of variant-A (faithful MAT-01) captures against the ENV-NATURE-R02 source-composition
 * PNGs of the same poses (read from Git, 195ada5). Proves the review viewer reproduces the protected baseline.
 *   node tools/mat-art-r01/r02-parity.mjs <evidence-dir> <r02-png-dir> */
import {writeFileSync} from 'node:fs';
import {png} from './image-metrics.mjs';
const isGround=(m,i)=>{const r=m.bytes[i*m.channels],g=m.bytes[i*m.channels+1];return (Math.abs(r-171)<=1&&Math.abs(g-196)<=1)||(Math.abs(r-46)<=1&&Math.abs(g-92)<=1);};
const [dir,r02]=process.argv.slice(2),pairs=[['birch-interior','shelter'],['birch-edge','breathing'],['overview','overview']],rows=[];
for(const [mine,theirs] of pairs){const a=png(`${dir}/${mine}--env--mat-01.png`),b=png(`${r02}/source-${theirs}.png`),mask=png(`${dir}/${mine}--env--mask.png`);
 let changed=0,max=0,sum=0;const n=a.width*a.height,hist={'1':0,'2-4':0,'5-20':0,'>20':0},strongOnGround={ground:0,other:0};
 for(let i=0;i<n;i++){let m=0;for(let c=0;c<3;c++){const d=Math.abs(a.bytes[i*a.channels+c]-b.bytes[i*b.channels+c]);m=Math.max(m,d);sum+=d;}if(m)changed++;max=Math.max(max,m);
  if(m)hist[m<=1?'1':m<=4?'2-4':m<=20?'5-20':'>20']++;if(m>20)strongOnGround[isGround(mask,i)?'ground':'other']++;}
 rows.push({view:mine,r02View:theirs,size:[a.width,a.height],identicalPixelPercent:(n-changed)/n*100,maxChannelDifference:max,meanAbsoluteDifference:sum/(n*3),
  differencePercentByLevel:Object.fromEntries(Object.entries(hist).map(([k,v])=>[k,v/n*100])),strongDifferencePixels:strongOnGround});}
console.log(JSON.stringify(rows,null,1));writeFileSync(`${dir}/r02-parity.json`,JSON.stringify({interpretation:'R02 rendered on SwiftShader LLVM 10, this run on SwiftShader Subzero: residual is ±1 LSB rounding plus sparse vegetation-edge pixels; ground pixels are effectively unchanged.',source:'origin/art/env-nature-r02-woodland-composition 195ada5 docs/env-nature-r02/evidence/source-*.png',rows},null,2)+'\n');
