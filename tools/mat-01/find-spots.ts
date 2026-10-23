// MAT-01 helper: finds representative dry, gentle locations per material and per transition from the canonical
// classification (CPU query API), to place review cameras. Usage: node --experimental-strip-types tools/mat-01/find-spots.ts
import {readFileSync} from 'node:fs';
import {classifyTerrain} from '../../src/terrain-material/classify.ts';
import {geoR02BSource} from '../../src/terrain-material/sources/geo-r02b.ts';
import {TerrainMaterialQuery} from '../../src/terrain-material/query.ts';
const f32=(p:string)=>{const b=readFileSync(p);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const source=geoR02BSource(f32('public/geo-r02b/terrain.f32'),f32('public/geo-r02b/water-surface.f32'),JSON.parse(readFileSync('public/geo-r02b/features.json','utf8')));
const {classification}=classifyTerrain(source),q=new TerrainMaterialQuery(classification),L=classification.lattice;
const H=(x:number,z:number)=>source.heights[Math.round((L.north-z)/4)*L.width+Math.round((x-L.west)/4)];
const W=(x:number,z:number)=>source.water![Math.round((L.north-z)/4)*L.width+Math.round((x-L.west)/4)];
const slope=(x:number,z:number)=>Math.hypot(H(x+4,z)-H(x-4,z),H(x,z+4)-H(x,z-4))/8;
const anchor=(id:string)=>source.anchors.find(a=>a.id===id)!.xz;
function best(label:string,[cx,cz]:[number,number],radius:number,score:(x:number,z:number)=>number){
 let top:{s:number;x:number;z:number}[]=[];
 for(let z=cz-radius;z<=cz+radius;z+=12)for(let x=cx-radius;x<=cx+radius;x+=12){if(Number.isFinite(W(x,z))||H(x,z)<=0.5)continue;const s=score(x,z);if(s>-1e9)top.push({s,x,z});}
 top.sort((a,b)=>b.s-a.s);top=top.slice(0,3);
 console.log(label,top.map(t=>`(${t.x},${t.z}) h=${H(t.x,t.z).toFixed(0)} s=${slope(t.x,t.z).toFixed(2)} score=${t.s.toFixed(2)} ${JSON.stringify(Object.fromEntries(Object.entries(q.sample(t.x,t.z).weights).map(([k,v])=>[k.slice(0,4),+v.toFixed(2)])))}`).join(' | '));
}
const pure=(id:Parameters<TerrainMaterialQuery['weightOf']>[0])=>(x:number,z:number)=>{const c=q.coverage(x,z,30,5)[id];return c-slope(x,z)*.5;};
best('forest-pure',anchor('forest'),600,pure('forest-floor'));
best('meadow-pure',anchor('valley'),600,pure('meadow-turf'));
best('sand-pure',anchor('home'),600,pure('coastal-sand'));
best('rock-pure',anchor('tarn'),700,(x,z)=>q.coverage(x,z,30,5).bedrock-Math.abs(slope(x,z)-.3));
best('forest-meadow',anchor('forest'),700,(x,z)=>{const c=q.coverage(x,z,40,7);return -Math.abs(c['forest-floor']-.5)-Math.abs(c['meadow-turf']-.5)-slope(x,z);});
best('meadow-rock',anchor('tarn'),800,(x,z)=>{const c=q.coverage(x,z,40,7);return -Math.abs(c.bedrock-.45)-Math.abs(c['meadow-turf']-.5)-slope(x,z)*.5;});
best('sand-rock',anchor('home'),900,(x,z)=>{const c=q.coverage(x,z,40,7);return -Math.abs(c.bedrock-.4)-Math.abs(c['coastal-sand']-.45)-slope(x,z)*.3;});
best('sand-dunes',anchor('dunes'),700,pure('coastal-sand'));
best('wet-shore',anchor('home'),700,(x,z)=>q.attribute(0,x,z)*q.weightOf('coastal-sand',x,z)-slope(x,z));
best('wet-meadow',anchor('mire'),700,(x,z)=>q.attribute(0,x,z)*q.weightOf('meadow-turf',x,z)-slope(x,z));
// Sun-facing bedrock (Nordic daylight sun from azimuth 215°): the surface rises toward the north-east.
const sunFacing=(x:number,z:number)=>{const dx=(H(x+4,z)-H(x-4,z))/8,dz=(H(x,z+4)-H(x,z-4))/8,l=Math.hypot(dx,1,dz);return (-dx*-0.57+-dz*-0.82)/l;};
best('rock-sunlit',anchor('north-peak'),900,(x,z)=>{const c=q.coverage(x,z,25,5).bedrock;return c<.85?-1e10:sunFacing(x,z)-Math.abs(slope(x,z)-.45);});
best('rock-sunlit-valley',anchor('cairn'),900,(x,z)=>{const c=q.coverage(x,z,25,5).bedrock;return c<.85?-1e10:sunFacing(x,z)-Math.abs(slope(x,z)-.45);});
best('sand-rock-island',[0,0],3000,(x,z)=>{if((x/12+z/12)%4)return -1e10;const p=q.sample(x,z).weights;if(p['coastal-sand']<.25||p.bedrock<.25)return -1e10;const c=q.coverage(x,z,35,5);return Math.min(c.bedrock,c['coastal-sand']);});
