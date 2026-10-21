import * as THREE from 'three';
import {WORLD,BRIDGE} from '../world/config.ts';
import {heightAt, noise, slopeAt, biomeAt, coastField} from '../world/geography.ts';
import {bridgeHeightAt,waterLevelAt} from '../world/surface.ts';
function seed(i:number){let n=i|0;n=Math.imul(n^(n>>>15),2246822519);n=Math.imul(n^(n>>>13),3266489917);return((n^(n>>>16))>>>0)/4294967296;}
export function addLandmarks(scene:THREE.Scene){
 // WORLD-01 only: readable placeholders, not adapted Feh Lu We asset geometry.
 const spruce=new THREE.ConeGeometry(1,1,6),trunk=new THREE.CylinderGeometry(.11,.16,1,5),rock=new THREE.DodecahedronGeometry(1,0);
 const foliageMat=new THREE.MeshLambertMaterial({color:0x486653,flatShading:true});
 const trunkMat=new THREE.MeshLambertMaterial({color:0x6e5a43});
 const rockMat=new THREE.MeshLambertMaterial({color:0x7a7b70,flatShading:true});
 const trees=new THREE.InstancedMesh(spruce,foliageMat,700),stems=new THREE.InstancedMesh(trunk,trunkMat,700),boulders=new THREE.InstancedMesh(rock,rockMat,240);
 const mat=new THREE.Matrix4(),p=new THREE.Vector3(),rot=new THREE.Quaternion(),s=new THREE.Vector3(),q=new THREE.Color();let nt=0,nr=0;
 for(let i=0;i<6200&&nt<700;i++){
  const x=(seed(i*29+19)-.5)*5500,z=(seed(i*41+31)-.5)*7450,y=heightAt(x,z);
  if(y<Math.max(3,waterLevelAt(x,z)+.5)||y>215||coastField(x,z)<.06||slopeAt(x,z)>.35)continue;
  const b=biomeAt(x,z,y);if(!['forest','meadow'].includes(b))continue;
  // Clustered stands: clearings and meadows remain readable at macro scale.
  const stand=noise(x/490,z/490,711);if(stand<-.05||seed(i*13+3)<.61)continue;
  const ht=9+seed(i*67+7)*10,wd=2.2+seed(i*23+11)*2.4;
  p.set(x,y+ht*.62,z);s.set(wd,ht,wd);rot.setFromAxisAngle(new THREE.Vector3(0,1,0),seed(i+5)*Math.PI*2);mat.compose(p,rot,s);trees.setMatrixAt(nt,mat);
  q.setHSL(.34+seed(i+11)*.05,.20+seed(i*5)*.13,.27+seed(i*7)*.09);trees.setColorAt(nt,q);
  p.y=y+ht*.15;s.set(1,ht*.3,1);mat.compose(p,rot,s);stems.setMatrixAt(nt,mat);nt++;
 }
 for(let i=0;i<1200&&nr<240;i++){
  const x=(seed(i*83+2)-.5)*5650,z=(seed(i*37+5)-.5)*7550,y=heightAt(x,z);
  if(y<Math.max(8,waterLevelAt(x,z)+.5)||coastField(x,z)<0||seed(i*23)<.5)continue;
  const rad=2+seed(i*7+13)*9;
  p.set(x,y+rad*.12,z);rot.setFromAxisAngle(new THREE.Vector3(0,1,0),seed(i*9)*6.28);s.set(rad,rad*.6,rad*.7);mat.compose(p,rot,s);boulders.setMatrixAt(nr,mat);nr++;
 }
 trees.count=stems.count=nt;boulders.count=nr;
 trees.instanceMatrix.needsUpdate=true;stems.instanceMatrix.needsUpdate=true;boulders.instanceMatrix.needsUpdate=true;
 [trees,stems,boulders].forEach(m=>{m.frustumCulled=false;scene.add(m)});
 const base= WORLD.viewpoints[0],bx=base.x,bz=base.z,by=heightAt(bx,bz);
 // Small exterior cabin marker; interiors deferred.
 const cabin=new THREE.Group();cabin.position.set(bx,by,bz);
 const wood=new THREE.MeshLambertMaterial({color:0x8b674d}),roofMat=new THREE.MeshLambertMaterial({color:0x484b44}),doorMat=new THREE.MeshLambertMaterial({color:0x47372b});
 const body=new THREE.Mesh(new THREE.BoxGeometry(15,6,11),wood);body.position.y=3.5;cabin.add(body);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(10.7,5,4),roofMat);roof.rotation.y=Math.PI/4;roof.scale.z=.8;roof.position.y=9;cabin.add(roof);
 const door=new THREE.Mesh(new THREE.BoxGeometry(2.7,4.5,.25),doorMat);door.position.set(0,2.6,5.6);cabin.add(door);
 cabin.rotation.y=-.28;scene.add(cabin);
 // Authored cairns for navigation; not arbitrary structures in distant scenery.
 const cairnMat=new THREE.MeshLambertMaterial({color:0x9a998a,flatShading:true});
 for(const [x,z] of [[100,650],[820,2180],[1050,150]]){
  const y=heightAt(x,z);for(let j=0;j<5;j++){
    const a=new THREE.Mesh(new THREE.DodecahedronGeometry(1,0),cairnMat);
    a.position.set(x+(seed(j+x)-.5)*.3,y+.15+j*.55,z);a.scale.set(1.6-j*.2,.33,.9-j*.1);scene.add(a);
  }
 }
 // The only river crossing on the hero route has a physical deck shared with walking queries.
 const bridgeMat=new THREE.MeshLambertMaterial({color:0x806d4e,side:THREE.DoubleSide});
 const length=BRIDGE.x1-BRIDGE.x0,y0=bridgeHeightAt(BRIDGE.x0,BRIDGE.z),y1=bridgeHeightAt(BRIDGE.x1,BRIDGE.z);
 const deck=new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(length,y1-y0),.35,BRIDGE.halfWidth*2),bridgeMat);
 deck.position.set((BRIDGE.x0+BRIDGE.x1)/2,(y0+y1)/2-.175,BRIDGE.z);deck.rotation.z=Math.atan2(y1-y0,length);scene.add(deck);
 for(let x=BRIDGE.x0+15;x<BRIDGE.x1;x+=22){
  const top=bridgeHeightAt(x,BRIDGE.z),base=heightAt(x,BRIDGE.z);
  if(top<=base)continue;
  for(const side of [-1,1]){const post=new THREE.Mesh(new THREE.CylinderGeometry(.35,.45,top-base,6),wood);post.position.set(x,(top+base)/2,BRIDGE.z+side*2.4);scene.add(post);}
 }
 return {trees:nt,rocks:nr};
}
