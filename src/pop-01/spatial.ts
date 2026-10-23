/** Uniform-grid broad phase. All nearest distances are exact within the documented cap. */
export interface Segment {ax:number;az:number;bx:number;bz:number}
export class SegmentIndex {
 private bins=new Map<string,Segment[]>();
 readonly cell:number;constructor(cell=64){this.cell=cell;}
 add(s:Segment){for(let x=Math.floor(Math.min(s.ax,s.bx)/this.cell);x<=Math.floor(Math.max(s.ax,s.bx)/this.cell);x++)for(let z=Math.floor(Math.min(s.az,s.bz)/this.cell);z<=Math.floor(Math.max(s.az,s.bz)/this.cell);z++){const k=x+','+z;let b=this.bins.get(k);if(!b)this.bins.set(k,b=[]);b.push(s);}}
 ring(points:number[][],closed=false){for(let i=1;i<points.length;i++)this.add({ax:points[i-1][0],az:points[i-1][1],bx:points[i][0],bz:points[i][1]});if(closed&&points.length>2)this.add({ax:points.at(-1)![0],az:points.at(-1)![1],bx:points[0][0],bz:points[0][1]});}
 distance(x:number,z:number,cap=64){let d=cap;for(let i=Math.floor((x-cap)/this.cell);i<=Math.floor((x+cap)/this.cell);i++)for(let j=Math.floor((z-cap)/this.cell);j<=Math.floor((z+cap)/this.cell);j++)for(const s of this.bins.get(i+','+j)??[]){const dx=s.bx-s.ax,dz=s.bz-s.az,t=Math.max(0,Math.min(1,((x-s.ax)*dx+(z-s.az)*dz)/(dx*dx+dz*dz||1)));d=Math.min(d,Math.hypot(x-s.ax-t*dx,z-s.az-t*dz));}return d;}
}
