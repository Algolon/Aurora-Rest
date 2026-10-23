/** Validate the checked-in Blender export independently of bpy and the showroom. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
const data=readFileSync(new URL('../art/blender/s1-geological-sculpt/aurora-rock-s1.glb',import.meta.url));
assert.equal(data.toString('ascii',0,4),'glTF');assert.equal(data.readUInt32LE(4),2);assert.equal(data.readUInt32LE(8),data.length);
const jsonLength=data.readUInt32LE(12),doc=JSON.parse(data.toString('utf8',20,20+jsonLength));
const binStart=20+jsonLength+8;
function accessor(index:number){const a=doc.accessors[index],v=doc.bufferViews[a.bufferView];const n=({SCALAR:1,VEC2:2,VEC3:3,VEC4:4} as Record<string,number>)[a.type];const size=a.componentType===5126?4:2;const out:number[][]=[];
 for(let i=0;i<a.count;i++){const row=[];for(let k=0;k<n;k++){const offset=binStart+(v.byteOffset??0)+(a.byteOffset??0)+i*(v.byteStride??n*size)+k*size;row.push(a.componentType===5126?data.readFloatLE(offset):data.readUInt16LE(offset)/(a.normalized?65535:1));}out.push(row);}return out;}
const primitive=doc.meshes[0].primitives[0],positions=accessor(primitive.attributes.POSITION),normals=accessor(primitive.attributes.NORMAL),indices=accessor(primitive.indices).flat();
const vector=(n:number)=>new THREE.Vector3(...positions[n] as [number,number,number]);
test('S1 GLB has one static mesh, metric Y-up dimensions, ground pivot and complete finite attributes',()=>{
 assert.equal(doc.meshes.length,1);assert.equal(doc.meshes[0].primitives.length,1);assert.equal(doc.nodes.length,1);assert.equal(doc.cameras,undefined);assert.equal(doc.animations,undefined);assert.equal(doc.extensionsUsed,undefined);
 assert.deepEqual(Object.keys(primitive.attributes).sort(),['COLOR_0','NORMAL','POSITION','TEXCOORD_0']);
 for(const index of Object.values(primitive.attributes))assert.ok(accessor(index as number).flat().every(Number.isFinite));
 const box=new THREE.Box3().setFromPoints(positions.map(p=>new THREE.Vector3(...p as [number,number,number]))),size=box.getSize(new THREE.Vector3());
 assert.ok(Math.abs(size.x-2.08)<.001&&Math.abs(size.y-1.64695)<.001&&Math.abs(size.z-1.5468)<.001);assert.equal(box.min.y,0);assert.ok(box.containsPoint(new THREE.Vector3(0,0,0)));assert.equal(indices.length/3,94);
 const colors=accessor(primitive.attributes.COLOR_0).flat();assert.ok(Math.min(...colors)<.3&&Math.max(...colors)<=1);
});
test('S1 exported triangles weld to one closed consistently wound genus-zero shell with valid normals',()=>{
 const unique=new Map<string,number>(),weld:number[]=[];
 for(const p of positions){const key=p.map(x=>Math.round(x*1e6)).join(',');if(!unique.has(key))unique.set(key,unique.size);weld.push(unique.get(key)!);}
 const edges=new Map<string,number[]>(),adj=new Map<number,Set<number>>();let volume=0,minNormalDot=1;
 for(let i=0;i<indices.length;i+=3){const ids=indices.slice(i,i+3),[a,b,c]=ids.map(vector),cross=b.clone().sub(a).cross(c.clone().sub(a));assert.ok(cross.length()>.00000001,'degenerate triangle');volume+=a.dot(b.clone().cross(c))/6;
  const n=cross.normalize();for(const id of ids){const actual=new THREE.Vector3(...normals[id] as [number,number,number]);assert.ok(Math.abs(actual.length()-1)<.0001);minNormalDot=Math.min(minNormalDot,n.dot(actual));}
  const tri=ids.map(x=>weld[x]);for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(',');const signs=edges.get(key)??[];signs.push(a<b?1:-1);edges.set(key,signs);if(!adj.has(a))adj.set(a,new Set());if(!adj.has(b))adj.set(b,new Set());adj.get(a)!.add(b);adj.get(b)!.add(a);}
 }
 for(const [key,signs] of edges){assert.equal(signs.length,2,'boundary/nonmanifold '+key);assert.equal(signs[0]+signs[1],0,'inconsistent winding '+key);}
 const visited=new Set<number>(),stack=[0];while(stack.length){const v=stack.pop()!;if(visited.has(v))continue;visited.add(v);stack.push(...adj.get(v)!);}
 assert.equal(visited.size,unique.size);assert.equal(unique.size-edges.size+indices.length/3,2);assert.ok(volume>2.5&&volume<3.5);assert.ok(minNormalDot>.65,'wrong-facing normals');
 console.log('S1 exported QA',JSON.stringify({uniqueVertices:unique.size,exportVertices:positions.length,triangles:indices.length/3,edges:edges.size,signedVolume:volume,minNormalDot}));
});
