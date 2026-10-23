/** Review-side terrain mesh adapter. Builds tiles from the canonical lattice exactly like src/geo-r02b/terrain.ts
 * (positions from nearest canonical nodes, normals from ±1-node central differences) and adds optional LOD steps and
 * skirts so material invariance can be tested across tilings and resolutions. Heights are read, never written. */
import * as THREE from 'three';
import type {Lattice} from '../types.ts';
import type {TerrainMaterialQuery} from '../query.ts';
import {MATERIALS} from '../materials.ts';

export interface HeightLattice {lattice:Lattice;heights:Float32Array}
export interface TileLayout {spanM:number;stepFor:(tileCenterX:number,tileCenterZ:number)=>number;skirtM:number}

export function nodeHeight(src:HeightLattice,x:number,z:number){
 const {width:W,height:H,cellM:c,west,north}=src.lattice;
 const i=Math.max(0,Math.min(W-1,Math.round((x-west)/c))),j=Math.max(0,Math.min(H-1,Math.round((north-z)/c)));
 return src.heights[j*W+i];
}

export function tileGeometry(src:HeightLattice,x0:number,north:number,span:number,step:number,skirtM=0){
 const c=src.lattice.cellM,n=Math.round(span/step),pos:number[]=[],nrm:number[]=[],idx:number[]=[];
 const add=(x:number,z:number,drop:number)=>{const h=nodeHeight(src,x,z),dx=(nodeHeight(src,x+c,z)-nodeHeight(src,x-c,z))/(2*c),dz=(nodeHeight(src,x,z+c)-nodeHeight(src,x,z-c))/(2*c),l=Math.hypot(dx,1,dz);
  pos.push(x,h-drop,z);nrm.push(-dx/l,1/l,-dz/l);};
 for(let j=0;j<=n;j++)for(let i=0;i<=n;i++)add(x0+i*step,north-j*step,0);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;idx.push(a,a+1,b,a+1,b+1,b);}
 if(skirtM>0){
  const edges=[[...Array(n+1).keys()],[...Array(n+1).keys()].map(i=>i*(n+1)+n),[...Array(n+1).keys()].map(i=>n*(n+1)+n-i),[...Array(n+1).keys()].map(i=>(n-i)*(n+1))];
  for(const edge of edges){const start=pos.length/3;
   for(const a of edge){const x=pos[a*3],z=pos[a*3+2];add(x,z,0);add(x,z,skirtM);}
   for(let i=0;i<n;i++){const a=start+i*2;idx.push(a,a+1,a+2,a+2,a+1,a+3);}}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nrm,3));g.setIndex(idx);g.computeBoundingSphere();return g;
}

export class TerrainTiles {
 readonly group=new THREE.Group();readonly src:HeightLattice;
 private material:THREE.Material;layout:TileLayout;
 readonly tiles:{mesh:THREE.Mesh;x:number;z:number;step:number}[]=[];
 constructor(src:HeightLattice,material:THREE.Material,layout:TileLayout){this.src=src;this.material=material;this.layout=layout;this.build();}
 private build(){
  const {width:W,height:H,cellM:c,west,north}=this.src.lattice,spanX=(W-1)*c,spanZ=(H-1)*c,s=this.layout.spanM;
  for(let j=0;j*s<spanZ-1e-6;j++)for(let i=0;i*s<spanX-1e-6;i++){
   const x=west+i*s,z=north-j*s,step=this.layout.stepFor(x+s/2,z-s/2);
   const mesh=new THREE.Mesh(tileGeometry(this.src,x,z,Math.min(s,west+spanX-x),step,this.layout.skirtM),this.material);
   this.group.add(mesh);this.tiles.push({mesh,x,z,step});
  }
 }
 /** Rebuild with a different tiling / LOD layout; the material (and its program) is reused unchanged. */
 relayout(layout:TileLayout){this.disposeGeometry();this.layout=layout;this.build();}
 setMaterial(m:THREE.Material){this.material=m;for(const t of this.tiles)t.mesh.material=m;}
 get triangleCount(){let n=0;for(const t of this.tiles)n+=(t.mesh.geometry.index?.count??0)/3;return n;}
 disposeGeometry(){for(const t of this.tiles){this.group.remove(t.mesh);t.mesh.geometry.dispose();}this.tiles.length=0;}
}

/** Option A comparator: per-vertex colours from the same classification (macro tone only, no detail textures). */
export function applyVertexColors(tiles:TerrainTiles,query:TerrainMaterialQuery,means:[number,number,number][]){
 const defs=query.map.materials.map(id=>MATERIALS.find(m=>m.id===id)!),w=new Float64Array(defs.length);
 for(const t of tiles.tiles){const g=t.mesh.geometry,p=g.getAttribute('position'),col=new Float32Array(p.count*3);
  for(let v=0;v<p.count;v++){const x=p.getX(v),z=p.getZ(v);query.weightsAt(x,z,w);const wet=query.attribute(0,x,z),macro=query.attribute(1,x,z),expo=query.attribute(2,x,z);
   for(let q=0;q<3;q++){let s=0;defs.forEach((d,m)=>{const tint=(d.macroTint[0][q]*(1-macro)+d.macroTint[1][q]*macro)*(1+(d.exposureTint[q]-1)*expo)*(1+(d.wetTint[q]-1)*wet);s+=w[m]*means[m][q]*tint;});col[v*3+q]=s;}}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));}
}
