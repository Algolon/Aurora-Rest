import test from 'node:test';
import assert from 'node:assert/strict';
import {createEcotonePilot,ENV_R02A_DESIGN} from '../src/env-r02a/ecotone.ts';

const W=101,H=101;
function fixture(){
 const weights=new Uint8Array(W*H*4),attributes=new Uint8Array(W*H*4);
 for(let i=0;i<W*H;i++){weights[i*4]=200;weights[i*4+1]=55;attributes[i*4]=71;}
 return {schema:'aurora-rest-terrain-material/1' as const,
  lattice:{width:W,height:H,cellM:4,west:-200,north:200},
  materials:['forest-floor','meadow-turf','coastal-sand','bedrock'] as const,
  weights,attributes,rulesVersion:'mat-01-r5',sourceId:'geo'};
}
test('ENV-R02A off is immutable: candidate does not touch any canonical bytes or attributes',()=>{
 const original=fixture(),bytes=original.weights.slice(),attrs=original.attributes.slice();
 const a=createEcotonePilot(original,-85,40);
 assert.deepEqual(original.weights,bytes);assert.deepEqual(original.attributes,attrs);
 assert.equal(a.classification.attributes,original.attributes);
 assert.notEqual(a.classification.weights,original.weights);
 assert.equal(original.rulesVersion,'mat-01-r5');
});
test('bounded sculptural mask preserves exact bytes outside zone, four-channel conservation, zero rock/sand changes',()=>{
 const original=fixture(),a=createEcotonePilot(original,-85,40),{weights}=a.classification;
 assert(a.audit.changedNodes>0);
 assert(a.audit.changedNodes<W*H);
 for(let j=0;j<H;j++)for(let i=0;i<W;i++){
  const k=(j*W+i)*4,x=-200+i*4,z=200-j*4;
  assert.equal(weights[k]+weights[k+1]+weights[k+2]+weights[k+3],255);
  assert.equal(weights[k+2],original.weights[k+2]);
  assert.equal(weights[k+3],original.weights[k+3]);
  const outside=((x/ENV_R02A_DESIGN.radiusX)**2+(z/ENV_R02A_DESIGN.radiusZ)**2)>=1;
  if(outside)assert.deepEqual([...weights.slice(k,k+4)],[...original.weights.slice(k,k+4)]);
 }
 const k=(50*W+50)*4;assert(weights[k]<original.weights[k]);
});
test('same inputs give deterministic candidate, alternative anchor relocates mask',()=>{
 const map=fixture(),a=createEcotonePilot(map,-85,40),b=createEcotonePilot(map,-85,40),c=createEcotonePilot(map,10,100);
 assert.deepEqual(a.classification.weights,b.classification.weights);
 assert.deepEqual(a.audit,b.audit);
 assert.notDeepEqual(a.classification.weights,c.classification.weights);
 assert.throws(()=>createEcotonePilot({...map,materials:['meadow-turf','forest-floor','coastal-sand','bedrock']},-85,40));
});
