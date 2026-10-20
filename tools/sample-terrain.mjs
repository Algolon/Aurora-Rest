import {writeFileSync} from 'node:fs';
import {heightAt,coastField,biomeAt} from '../src/world/geography.ts';
const xs=Array.from({length:121},(_,i)=>-3600+i*60);
const zs=Array.from({length:155},(_,i)=>-4620+i*60);
const h=[],coast=[];let min=Infinity,max=-Infinity;
for(const z of zs){const hr=[],cr=[];for(const x of xs){const y=heightAt(x,z);hr.push(Math.round(y*10)/10);cr.push(Math.round(coastField(x,z)*1e4)/1e4);min=Math.min(min,y);max=Math.max(max,y);}h.push(hr);coast.push(cr);}
writeFileSync('docs/terrain-samples.json',JSON.stringify({xs,zs,h,coast,min,max}));
console.log(`sampled ${xs.length*zs.length} points; h=[${min.toFixed(1)}, ${max.toFixed(1)}]m`);
