/** ENV-R02D: bounded, review-only ground-level cohesion over real HERO route.
 * NO terrain/MAT changes and NO production botanical assets.
 */
import * as T from 'three';
import type {CanonicalEnvironment} from '../pop-01/geography.ts';
export type Point=readonly [number,number];
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const hash=(i:number,j:number,k=0)=>{let a=(2166136261^Math.imul(i+3009,374761393)^Math.imul(j+901,668265263)^Math.imul(k+23,2654435761))>>>0;a=Math.imul(a^(a>>>13),1274126177);return((a^(a>>>16))>>>0)/4294967296;};
export const COHESION=Object.freeze({version:'env-r02d-cohesion-a1',center:[-350,-290] as Point,lengthM:86,pathCoreWidthM:1.7,pathFeatherWidthM:.6,coverReachM:10});
/** Select a true, contiguous +/- 43 m subsection of the canonical hero-route polyline. */
export function segmentOnHero(points:readonly Point[],center:Point=COHESION.center,length=COHESION.lengthM){
 if(points.length<2)throw Error('Hero route too short');
 let middle=0,closest=Infinity;
 for(let i=0;i<points.length;i++){const d=Math.hypot(points[i][0]-center[0],points[i][1]-center[1]);if(d<closest){middle=i;closest=d;}}
 if(closest>2)throw Error('Review segment not on canonical route');
 let left=middle,right=middle,west=0,east=0;
 while(left>0&&west<length/2){west+=Math.hypot(points[left][0]-points[left-1][0],points[left][1]-points[left-1][1]);left--;}
 while(right<points.length-1&&east<length/2){east+=Math.hypot(points[right][0]-points[right+1][0],points[right][1]-points[right+1][1]);right++;}
 const chosen=points.slice(left,right+1);
 const span=chosen.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-chosen[i][0],p[1]-chosen[i][1]),0);
 if(span<70||span>94)throw Error('Expected 70-94m contiguous walking study, got '+span.toFixed(1));
 return{points:chosen,lengthM:span,closestMeters:closest};
}
type CoverPosition={id:string;x:number;z:number;radius:number;height:number;shade:number};
/** Authored edge banks: clumps on alternating sides and gaps, no hedge rows. */
export function coverBank(route:readonly Point[],geo:CanonicalEnvironment):CoverPosition[]{
 const out:CoverPosition[]=[];let used=-4;
 let traveled=0;
 for(let i=1;i<route.length-1;i++){
  const a=route[i-1],b=route[i],c=route[i+1];
  traveled+=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(traveled-used<2.2)continue;used=traveled;
  const vx=c[0]-a[0],vz=c[1]-a[1],len=Math.hypot(vx,vz)||1,nx=-vz/len,nz=vx/len;
  for(const side of [-1,1]){
   const edgeDensity=Math.sin(traveled*.115+(side+1)*1.75);
   for(let j=0;j<5;j++){
    const r=hash(i,j,side),noise=hash(i,j,side+6);
    // Alternating bank mass and gaps, no uninterrupted rows.
    if((edgeDensity<.08&&j>2)||r<.24)continue;
    const distance=3.2+j*1.8+1.8*(noise-.5),along=(hash(i,j,5)-.5)*5.2;
    const x=b[0]+nx*side*distance+vx/len*along,z=b[1]+nz*side*distance+vz/len*along;
    const s=geo.sample(x,z);if(!s.dry||s.slope>.52||s.waterDistance<3.5)continue;
    out.push({id:'env-r02d:understory:'+i+':'+side+':'+j,x,z,radius:.43+.27*hash(i,j,8),height:.16+.18*hash(i,j,9),shade:hash(i,j,10)});
   }
  }
 }
 return out;
}
function leafGeometry(){
 const positions:number[]=[],colors:number[]=[],indices:number[]=[];
 const tint=[[.12,.24,.13],[.18,.29,.16],[.20,.31,.18],[.13,.26,.16]];
 for(let k=0;k<11;k++){
  const angle=k*Math.PI*(3-Math.sqrt(5)),radius=.14+.19*((k%5)/4),w=.14+(k%3)*.037;
  const hx=Math.cos(angle),hz=Math.sin(angle),cx=hx*radius,cz=hz*radius;
  const height=.22+.17*((k*7%11)/10),slope=.11+.14*(k%4)/3;
  const base=positions.length/3,rr=-hz,rz=hx;
  const vertices=[
    [cx*.28,.028,cz*.28],[cx-w*rr,.13+slope*.25,cz-w*rz],
    [cx+hx*.18,.32+height*.28,cz+hz*.18],[cx+w*rr,.13+slope*.25,cz+w*rz]
  ];
  const col=tint[k%tint.length];
  for(let v=0;v<vertices.length;v++){positions.push(...vertices[v]);let mul=v===2?1.18:v===0?.78:1;colors.push(...col.map(q=>Math.min(1,q*mul)));}
  indices.push(base,base+1,base+2,base,base+2,base+3);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function makePath(geo:CanonicalEnvironment,route:readonly Point[]){
 const colors:number[]=[],position:number[]=[],indices:number[]=[];
 // Four-band earth path: two central shoulders plus feathering onto unchanged MAT ground.
 const bands=[-.86,-.57,.57,.86],alpha=[0,.58,.58,0];
 for(let i=0;i<route.length;i++){
  const here=route[i],prev=route[Math.max(0,i-1)],next=route[Math.min(route.length-1,i+1)];
  const dx=next[0]-prev[0],dz=next[1]-prev[1],len=Math.hypot(dx,dz)||1,nx=-dz/len,nz=dx/len;
  const taper=.90+.09*Math.sin(i*.21)+.07*Math.sin(i*.68);
  for(let j=0;j<bands.length;j++){
   const x=here[0]+nx*bands[j]*taper,z=here[1]+nz*bands[j]*taper;
   const yy=geo.elevation(x,z)+.09;position.push(x,yy,z);
   const v=.79+.13*Math.sin(i*.24+j*2.5);
   // RGB and vertex-alpha; dirt is muted compared with green forest floor.
   colors.push(.16*v,.15*v,.105*v,alpha[j]);
  }
  if(i)for(let j=0;j<bands.length-1;j++){const a=(i-1)*4+j,b=i*4+j;indices.push(a,b,a+1,a+1,b,b+1);}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(position,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,4));geometry.setIndex(indices);geometry.computeVertexNormals();
 const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
 mesh.frustumCulled=false;mesh.renderOrder=3;return mesh;
}
export class WoodlandCohesionLayer {
 readonly group=new T.Group();
 readonly route:ReturnType<typeof segmentOnHero>;
 readonly cover:ReturnType<typeof coverBank>;
 readonly path:T.Mesh; readonly shrub:T.InstancedMesh;
 enabled=false;
 constructor(scene:T.Scene,geo:CanonicalEnvironment,heroRoute:readonly Point[]){
  this.route=segmentOnHero(heroRoute);this.cover=coverBank(this.route.points,geo);
  this.path=makePath(geo,this.route.points);this.group.add(this.path);
  const geom=leafGeometry(),mat=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  this.shrub=new T.InstancedMesh(geom,mat,this.cover.length);
  this.shrub.frustumCulled=false;this.shrub.castShadow=false;this.shrub.receiveShadow=false;
  const tr=new T.Object3D();
  for(let i=0;i<this.cover.length;i++){
   const c=this.cover[i];tr.position.set(c.x,geo.elevation(c.x,c.z)+.035,c.z);
   tr.rotation.set(0,hash(i,6)*Math.PI*2,0);tr.scale.set(c.radius,c.height/.45,c.radius);
   tr.updateMatrix();this.shrub.setMatrixAt(i,tr.matrix);
   const tint=new T.Color().setRGB(.83+c.shade*.25,.87+c.shade*.13,.76+c.shade*.15);this.shrub.setColorAt(i,tint);
  }
  this.shrub.instanceMatrix.needsUpdate=true;this.group.add(this.shrub);
  scene.add(this.group);this.setEnabled(false);
 }
 setEnabled(v:boolean){this.enabled=v;this.group.visible=v;}
 snapshot(){return{version:COHESION.version,enabled:this.enabled,pathVisible:this.group.visible,routeLengthM:Number(this.route.lengthM.toFixed(2)),routeVertices:this.route.points.length,originalRouteOffsetM:this.route.closestMeters,lowCoverCount:this.cover.length,geometryTriangles:(this.path.geometry.index!.count+this.shrub.geometry.index!.count*this.cover.length)/3,reviewOnly:true};}
 dispose(){this.group.removeFromParent();this.path.geometry.dispose();(this.path.material as T.Material).dispose();this.shrub.geometry.dispose();(this.shrub.material as T.Material).dispose();this.shrub.dispose();}
}
