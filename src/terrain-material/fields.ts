/** Derived terrain fields on the canonical lattice. Every field is a pure function of the data source,
 * so identical inputs give identical arrays regardless of mesh tiling or LOD. */
import type {Lattice} from './types.ts';

/** Gradient magnitude (rise/run) by central differences over ±1 node, clamped at borders. */
export function slopeField(h:Float32Array,L:Lattice):Float32Array{
 const {width:W,height:H,cellM:c}=L,out=new Float32Array(W*H);
 for(let j=0;j<H;j++){const jn=j>0?j-1:j,js=j<H-1?j+1:j;
  for(let i=0;i<W;i++){const iw=i>0?i-1:i,ie=i<W-1?i+1:i;
   const gx=(h[j*W+ie]-h[j*W+iw])/((ie-iw)*c),gz=(h[jn*W+i]-h[js*W+i])/((js-jn)*c);
   out[j*W+i]=Math.hypot(gx,gz);
  }}
 return out;
}

/** Discrete Laplacian at spacing `r` nodes (m⁻¹). Positive = concave hollow, negative = convex ridge/knoll. */
export function curvatureField(h:Float32Array,L:Lattice,r:number):Float32Array{
 const {width:W,height:H,cellM:c}=L,out=new Float32Array(W*H),d=r*c;
 for(let j=0;j<H;j++){const jn=Math.max(0,j-r),js=Math.min(H-1,j+r);
  for(let i=0;i<W;i++){const iw=Math.max(0,i-r),ie=Math.min(W-1,i+r),k=j*W+i;
   out[k]=(h[j*W+iw]+h[j*W+ie]+h[jn*W+i]+h[js*W+i]-4*h[k])/(d*d);
  }}
 return out;
}

/** Exact Euclidean distance (m) to the nearest node where mask=1 (Felzenszwalb–Huttenlocher, O(N)). */
export function distanceField(mask:Uint8Array,L:Lattice):Float32Array{
 const {width:W,height:H,cellM:c}=L,INF=1e20,n=Math.max(W,H),f=new Float64Array(n),d=new Float64Array(n),v=new Int32Array(n),z=new Float64Array(n+1);
 const g=new Float64Array(W*H);
 for(let k=0;k<W*H;k++)g[k]=mask[k]?0:INF;
 const pass=(len:number)=>{
  let k=0;v[0]=0;z[0]=-INF;z[1]=INF;
  for(let q=1;q<len;q++){
   let s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k]);
   while(s<=z[k]){k--;s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k]);}
   k++;v[k]=q;z[k]=s;z[k+1]=INF;
  }
  k=0;for(let q=0;q<len;q++){while(z[k+1]<q)k++;d[q]=(q-v[k])**2+f[v[k]];}
 };
 for(let i=0;i<W;i++){for(let j=0;j<H;j++)f[j]=g[j*W+i];pass(H);for(let j=0;j<H;j++)g[j*W+i]=d[j];}
 for(let j=0;j<H;j++){for(let i=0;i<W;i++)f[i]=g[j*W+i];pass(W);for(let i=0;i<W;i++)g[j*W+i]=d[i];}
 const out=new Float32Array(W*H);for(let k=0;k<W*H;k++)out[k]=g[k]>=INF*.5?1e6:Math.sqrt(g[k])*c;
 return out;
}

/** Even–odd scanline rasterisation of polygon rings onto lattice nodes (1 inside). */
export function rasterizeRings(rings:number[][][],L:Lattice):Uint8Array{
 const {width:W,height:H,cellM:c,west,north}=L,out=new Uint8Array(W*H),xs:number[]=[];
 for(let j=0;j<H;j++){
  const z=north-j*c;xs.length=0;
  for(const ring of rings)for(let a=0,b=ring.length-1;a<ring.length;b=a++){
   const p=ring[a],q=ring[b];
   if((p[1]>z)!==(q[1]>z))xs.push(p[0]+(z-p[1])*(q[0]-p[0])/(q[1]-p[1]));
  }
  xs.sort((a,b)=>a-b);
  for(let k=0;k+1<xs.length;k+=2){
   const i0=Math.max(0,Math.ceil((xs[k]-west)/c)),i1=Math.min(W-1,Math.floor((xs[k+1]-west)/c));
   for(let i=i0;i<=i1;i++)out[j*W+i]=1;
  }
 }
 return out;
}

/** Separable box blur with clamped edges, applied `passes` times (≈ Gaussian, σ ≈ r·√(passes/3)). */
export function blurField(src:Float32Array,L:Lattice,r:number,passes=3):Float32Array{
 const {width:W,height:H}=L;let a=Float32Array.from(src),b=new Float32Array(W*H);
 const line=(get:(i:number)=>number,set:(i:number,v:number)=>void,len:number)=>{
  let s=0;const n=2*r+1;
  for(let i=-r;i<=r;i++)s+=get(Math.min(len-1,Math.max(0,i)));
  for(let i=0;i<len;i++){set(i,s/n);s+=get(Math.min(len-1,i+r+1))-get(Math.max(0,i-r));}
 };
 for(let p=0;p<passes;p++){
  for(let j=0;j<H;j++){const o=j*W;line(i=>a[o+i],(i,v)=>{b[o+i]=v;},W);}
  [a,b]=[b,a];
  for(let i=0;i<W;i++)line(j=>a[j*W+i],(j,v)=>{b[j*W+i]=v;},H);
  [a,b]=[b,a];
 }
 return a;
}

/** Bilinear lookup of a lattice field at world (x, z), clamped to the lattice. */
export function sampleField(f:Float32Array,L:Lattice,x:number,z:number):number{
 const {width:W,height:H,cellM:c,west,north}=L;
 const gx=Math.min(W-1.000001,Math.max(0,(x-west)/c)),gz=Math.min(H-1.000001,Math.max(0,(north-z)/c));
 const i=Math.floor(gx),j=Math.floor(gz),u=gx-i,v=gz-j,k=j*W+i;
 return (f[k]*(1-u)+f[k+1]*u)*(1-v)+(f[k+W]*(1-u)+f[k+W+1]*u)*v;
}
