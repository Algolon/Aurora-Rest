// MAT-01 texture sheets: the synthesised detail textures as flat images (TEXTURE DATA, not renderer screenshots).
// Each sheet tiles the texture 2×2 so wrap seams would be visible. Albedo sheets by default; pass `all` for normal/AO and height.
// Usage: node --experimental-strip-types tools/mat-01/texture-sheets.ts [outDir] [size] [all]
import {mkdirSync,writeFileSync} from 'node:fs';
import {MATERIALS} from '../../src/terrain-material/materials.ts';
import {synthesizeMaterial} from '../../src/terrain-material/textures.ts';
import {writePng} from './png.ts';
const out=process.argv[2]??'docs/mat-01/textures',size=Number(process.argv[3]??512),all=process.argv[4]==='all';mkdirSync(out,{recursive:true});
const summary:Record<string,unknown>={tool:'tools/mat-01/texture-sheets.ts',evidenceType:'synthesised texture data, tiled 2×2; NOT renderer screenshots',size,materials:{}};
for(const def of MATERIALS){
 const t0=performance.now(),tex=synthesizeMaterial(def,size),ms=performance.now()-t0,S=tex.size,W=S*2;
 const sheet=(fn:(o:number)=>[number,number,number])=>{const rgb=new Uint8Array(W*W*3);for(let y=0;y<W;y++)for(let x=0;x<W;x++){const o=((y%S)*S+(x%S))*4;rgb.set(fn(o),(y*W+x)*3);}return rgb;};
 writePng(`${out}/${def.code}-${def.id}-albedo.png`,W,W,sheet(o=>[tex.albedo[o],tex.albedo[o+1],tex.albedo[o+2]]));
 if(all)writePng(`${out}/${def.code}-${def.id}-normal-ao.png`,W,W,sheet(o=>[tex.surface[o],tex.surface[o+1],tex.surface[o+2]]));
 if(all)writePng(`${out}/${def.code}-${def.id}-height.png`,W,W,sheet(o=>[tex.albedo[o+3],tex.albedo[o+3],tex.albedo[o+3]]));
 (summary.materials as Record<string,unknown>)[def.id]={tileM:def.tileM,texelMm:+(def.tileM/S*1000).toFixed(2),synthesisMs:Math.round(ms),meanLinear:tex.meanLinear.map(v=>+v.toFixed(4)),meanHeight:+tex.meanHeight.toFixed(3)};
 console.log(def.code,def.id,Math.round(ms)+' ms');
}
writeFileSync(`${out}/texture-summary.json`,JSON.stringify(summary,null,1)+'\n');
