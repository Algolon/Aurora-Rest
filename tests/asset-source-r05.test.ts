import test from 'node:test';import assert from 'node:assert/strict';
import * as T from 'three';
import {createMossHumusSubstrate,SUBSTRATE} from '../src/understory-asset-r04/substrate.ts';
import {createHash} from 'node:crypto';
const digest=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
test('R05 exact same R04 ground vertices, UV, normals and original source colours',()=>{
 const r=createMossHumusSubstrate(),mesh=r.group.children[0];
 assert(mesh instanceof T.Mesh);
 const g=mesh.geometry,p=g.getAttribute('position'),uv=g.getAttribute('uv'),nor=g.getAttribute('normal'),col=g.getAttribute('color');
 assert(p.count>10000);assert.equal(uv.count,p.count);assert.equal(nor.count,p.count);assert.equal(col.count,p.count);
 assert.equal(g.index.count/3,116*116*2);assert.equal(SUBSTRATE.widthM,2.4);assert.equal(SUBSTRATE.depthM,2.4);
 const key=digest(p.array);r.dispose();
 const fresh=createMossHumusSubstrate();
 assert.equal(key,digest(fresh.group.children[0].geometry.getAttribute('position').array));fresh.dispose();
});
test('R05 supplier ingestion must require original first-party MD5 & SHA-256',async()=>{
 const fs=await import('node:fs/promises'),s=await fs.readFile(new URL('../tools/asset-source-r05/fetch-source.mjs',import.meta.url),'utf8');
 assert.match(s,/publisherMd5/);assert.match(s,/sourceVerified:true/);
 assert.match(s,/api\.polyhaven\.com/);assert.match(s,/dl\.polyhaven\.org/);assert.match(s,/createHash\('md5'\)/);
});
