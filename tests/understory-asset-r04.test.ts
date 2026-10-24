import test from 'node:test';import assert from 'node:assert/strict';
import {SUBSTRATE,createMossHumusSubstrate,mossCoverage,elevation,fbm} from '../src/understory-asset-r04/substrate.ts';
import {BILBERRY,createDenseBilberry,makeBilberryGeometry} from '../src/understory-asset-r04/bilberry.ts';
import {createHash} from 'node:crypto';
const digest=x=>createHash('sha256').update(Buffer.from(x.buffer,x.byteOffset,x.byteLength)).digest('hex');
test('substrate is one local patch with finite continuous relief and variable continuous moss cover',()=>{
 assert.equal(SUBSTRATE.widthM,2.4);assert.equal(SUBSTRATE.depthM,2.4);
 const a=createMossHumusSubstrate(),b=createMossHumusSubstrate();
 const g0=a.group.children[0].geometry,g1=b.group.children[0].geometry;
 assert.equal(digest(g0.getAttribute('position').array),digest(g1.getAttribute('position').array));
 assert.equal(digest(g0.getAttribute('color').array),digest(g1.getAttribute('color').array));
 assert(a.metrics().drawObjects<=5&&a.metrics().triangles<165000);
 const values=[];for(let x=-1;x<1;x+=.11)for(let z=-1;z<1;z+=.11){values.push(mossCoverage(x,z));assert(Number.isFinite(elevation(x,z)));assert(Number.isFinite(fbm(x,z)));}
 assert(Math.max(...values)-Math.min(...values)>.17);
 assert(values.every(v=>v>=0&&v<=1));
 a.dispose();b.dispose();
});
test('bilberry is one leafy shrub, not a low paper-star rosette',()=>{
 const a=makeBilberryGeometry(),b=makeBilberryGeometry();
 const pa=a.getAttribute('position').array,pb=b.getAttribute('position').array;
 assert.equal(digest(pa),digest(pb));
 assert(a.getAttribute('position').count>35000);
 assert(a.getAttribute('position').count/3<50000);
 const box=a.boundingBox;
 assert(box.max.y>.24&&box.max.y<.55);
 assert(box.max.x-box.min.x>.38);
 assert(box.max.z-box.min.z>.31);
 assert.equal(BILBERRY.clumps,5);assert(BILBERRY.shoots>=40);
 a.dispose();b.dispose();
 const asset=createDenseBilberry();
 assert.equal(asset.metrics().drawObjects,1);asset.dispose();
});
test('asset prototypes are separate and never import production environment',()=>{
 assert.equal(SUBSTRATE.sourcePhotographyPixelsUsed,false);
 assert.equal(BILBERRY.sourcePhotoPixelsUsed,false);
 const a=createMossHumusSubstrate(),b=createDenseBilberry();
 assert(a.group!==b.group);assert(a.metrics().triangles>b.metrics().triangles);
 a.dispose();b.dispose();
});
