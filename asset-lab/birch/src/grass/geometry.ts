// Source faithful grass from Feh Lu We @ 17eafb0902833fb1121c77083f9f862eb4ffcd96
// Production referencePlantModel('grass',v,GROUND_DETAIL=true,GARDEN_DETAIL=true)
// and INTERIOR_GREEN=true. Main folded strips remain Tris geometry;
// refined gardenLeaf occurs in variant 2's seed-head mini-blades.
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {mulberry32} from '../rng.ts';
const UP=new THREE.Vector3(0,1,0);
const Y=UP;
export function twoSided(g0: THREE.BufferGeometry) {
  const g = g0.index ? g0.toNonIndexed() : g0;
  const out = new THREE.BufferGeometry();
  for (const name of Object.keys(g.attributes)) {
    const a = g.attributes[name] as THREE.BufferAttribute, n = a.itemSize, src = a.array as Float32Array;
    const dst = new Float32Array(src.length * 2);
    dst.set(src);
    for (let t = 0; t < a.count; t += 3) for (const [k, j] of [[0, 0], [1, 2], [2, 1]]) for (let c = 0; c < n; c++) dst[src.length + (t + k) * n + c] = src[(t + j) * n + c];
    out.setAttribute(name, new THREE.BufferAttribute(dst, n));
  }
  if (g !== g0) g.dispose();
  g0.dispose();
  out.computeBoundingSphere();
  return out;
}


class Tris {
  pos: number[] = []; col: number[] = [];
  tri(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, ca: THREE.Color, cb = ca, cc = cb) {
    this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    this.col.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b);
  }
  quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, c0: THREE.Color, c1 = c0) { this.tri(a, b, c, c0, c0, c1); this.tri(a, c, d, c0, c1, c1); }
  /** Normals from the faces, flipped to face up, then biased toward the sky by `up` (0–1); two-sided. */
  build(up = 0.4) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeVertexNormals();
    const nn = g.attributes.normal as THREE.BufferAttribute, v = new THREE.Vector3();
    for (let i = 0; i < nn.count; i++) { v.fromBufferAttribute(nn, i); if (v.y < 0) v.negate(); v.lerp(UP, up).normalize(); nn.setXYZ(i, v.x, v.y, v.z); }
    return twoSided(g);
  }
}
const C = (hex: string) => new THREE.Color(hex);
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const mix = (a: THREE.Color, b: THREE.Color, t: number) => a.clone().lerp(b, t);
/** A flat pointed leaf lying along `dir` (unit, horizontal) from `base`, bending up by `lift` then down at the tip. */
function leafShape(t: Tris, base: THREE.Vector3, dir: THREE.Vector3, L: number, W: number, lift: number, c0: THREE.Color, c1: THREE.Color, segs = 4, upright = 0) {
  const side = V(-dir.z, 0, dir.x);
  const at = (u: number, s: number) => {
    const w = W * Math.sin(Math.PI * Math.min(1, u * 1.05)) * (1 - u * 0.3);
    const h = Math.sin(u * Math.PI * 0.8) * lift + u * upright * L;
    return base.clone().addScaledVector(dir, u * L * (1 - upright * 0.6)).addScaledVector(side, s * w).add(V(0, h - Math.abs(s) * w * 0.2, 0));
  };
  for (let i = 0; i < segs; i++) {
    const u0 = i / segs, u1 = (i + 1) / segs, k0 = mix(c0, c1, u0), k1 = mix(c0, c1, u1);
    t.quad(at(u0, 0), at(u1, 0), at(u1, 1), at(u0, 1), k0, k1);
    t.quad(at(u0, -1), at(u1, -1), at(u1, 0), at(u0, 0), k0, k1);
  }
}
/** A small open bell (cone of `n` sides) hanging from `p` along `dir`. */
function bell(t: Tris, p: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, c0: THREE.Color, c1: THREE.Color, n = 5) {
  const a = dir.clone().normalize(), u = Math.abs(a.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0), s1 = u.clone().cross(a).normalize(), s2 = a.clone().cross(s1);
  const tip = p.clone().addScaledVector(a, len);
  for (let i = 0; i < n; i++) {
    const q0 = (i / n) * Math.PI * 2, q1 = ((i + 1) / n) * Math.PI * 2;
    const e0 = tip.clone().addScaledVector(s1, Math.cos(q0) * rad).addScaledVector(s2, Math.sin(q0) * rad);
    const e1 = tip.clone().addScaledVector(s1, Math.cos(q1) * rad).addScaledVector(s2, Math.sin(q1) * rad);
    t.tri(p, e0, e1, c0, c1, c1);
  }
}
/** A thin stem (flat ribbon facing the camera from most sides: two crossed strips). */
function stem(t: Tris, pts: THREE.Vector3[], w: number, c0: THREE.Color, c1 = c0) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], k0 = mix(c0, c1, (i - 1) / (pts.length - 1)), k1 = mix(c0, c1, i / (pts.length - 1));
    const w0 = w * (1 - (i - 1) / pts.length), w1 = w * (1 - i / pts.length);
    for (const d of [V(1, 0, 0), V(0, 0, 1)]) t.quad(a.clone().addScaledVector(d, -w0), b.clone().addScaledVector(d, -w1), b.clone().addScaledVector(d, w1), a.clone().addScaledVector(d, w0), k0, k1);
  }
}


/** A thin stem (flat ribbon facing the camera from most sides: two crossed strips). */
function stem(t: Tris, pts: THREE.Vector3[], w: number, c0: THREE.Color, c1 = c0) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], k0 = mix(c0, c1, (i - 1) / (pts.length - 1)), k1 = mix(c0, c1, i / (pts.length - 1));
    const w0 = w * (1 - (i - 1) / pts.length), w1 = w * (1 - i / pts.length);
    for (const d of [V(1, 0, 0), V(0, 0, 1)]) t.quad(a.clone().addScaledVector(d, -w0), b.clone().addScaledVector(d, -w1), b.clone().addScaledVector(d, w1), a.clone().addScaledVector(d, w0), k0, k1);
  }
}


/** A flat pointed leaf lying along `dir` (unit, horizontal) from `base`, bending up by `lift` then down at the tip. */
function leafShape(t: Tris, base: THREE.Vector3, dir: THREE.Vector3, L: number, W: number, lift: number, c0: THREE.Color, c1: THREE.Color, segs = 4, upright = 0) {
  const side = V(-dir.z, 0, dir.x);
  const at = (u: number, s: number) => {
    const w = W * Math.sin(Math.PI * Math.min(1, u * 1.05)) * (1 - u * 0.3);
    const h = Math.sin(u * Math.PI * 0.8) * lift + u * upright * L;
    return base.clone().addScaledVector(dir, u * L * (1 - upright * 0.6)).addScaledVector(side, s * w).add(V(0, h - Math.abs(s) * w * 0.2, 0));
  };
  for (let i = 0; i < segs; i++) {
    const u0 = i / segs, u1 = (i + 1) / segs, k0 = mix(c0, c1, u0), k1 = mix(c0, c1, u1);
    t.quad(at(u0, 0), at(u1, 0), at(u1, 1), at(u0, 1), k0, k1);
    t.quad(at(u0, -1), at(u1, -1), at(u1, 0), at(u0, 0), k0, k1);
  }
}

export function gardenLeaf(base:THREE.Vector3,dir:THREE.Vector3,length:number,width:number,lift:number,c0:THREE.Color,c1:THREE.Color,upright=0,segments=8,across=2,textureFamily?:number) {
  const side=new THREE.Vector3(-dir.z,0,dir.x).normalize(),p:number[]=[],col:number[]=[],ix:number[]=[],uv:number[]=[];
  const add=(u:number,s:number)=>{
    const w=width*Math.pow(Math.sin(Math.PI*u),.72)*(1-u*.15);
    const v=base.clone().addScaledVector(dir,length*u*(1-upright*.6)).addScaledVector(side,w*s)
      .addScaledVector(Y,Math.sin(u*Math.PI*.85)*lift+u*upright*length-w*s*s*.25);
    p.push(v.x,v.y,v.z);
    if(textureFamily!==undefined)uv.push(((textureFamily%4)+(.5+s*Math.pow(Math.sin(Math.PI*u),.72)*(1-u*.15)*.5))/4,(1-Math.floor(textureFamily/4)+u)/2);
    const colour=c0.clone().lerp(c1,.2+u*.65).multiplyScalar(1+.075*Math.cos(u*Math.PI*8-Math.abs(s)*3)+.10*Math.exp(-Math.abs(s)*8)-.025*Math.abs(s));
    col.push(colour.r,colour.g,colour.b);
  };
  add(0,0);
  for(let k=1;k<segments;k++)for(let j=0;j<=across;j++)add(k/segments,j/across*2-1);
  add(1,0);const tip=p.length/3-1,row=across+1;
  for(let j=0;j<across;j++)ix.push(0,1+j,2+j);
  for(let k=0;k<segments-2;k++)for(let j=0;j<across;j++){
    const a=1+k*row+j,b=a+row;ix.push(a,b,a+1,a+1,b,b+1);
  }
  const end=1+(segments-2)*row;
  for(let j=0;j<across;j++)ix.push(end+j,tip,end+j+1);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));if(textureFamily!==undefined)g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
  const n=g.attributes.normal;
  for(let i=0;i<n.count;i++){
    const v=new THREE.Vector3().fromBufferAttribute(n,i);if(v.y<0)v.negate();v.lerp(Y,.35).normalize();n.setXYZ(i,v.x,v.y,v.z);
  }
  const front=[...ix];for(let i=0;i<front.length;i+=3)ix.push(front[i],front[i+2],front[i+1]);g.setIndex(ix);
  const result=g.toNonIndexed();g.dispose();result.userData.keepColor=true;return result;
}


export function gardenSmoothNormals(g:THREE.BufferGeometry) {
  const p=g.attributes.position,n=g.attributes.normal,groups=new Map<string,{sum:THREE.Vector3;ids:number[]}>();
  for(let i=0;i<p.count;i++){
    const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e6)).join(',');
    let group=groups.get(key);if(!group){group={sum:new THREE.Vector3(),ids:[]};groups.set(key,group);}
    group.sum.add(new THREE.Vector3(n.getX(i),n.getY(i),n.getZ(i)));group.ids.push(i);
  }
  for(const {sum,ids} of groups.values()){sum.normalize();if(sum.lengthSq()<.1)sum.copy(Y);for(const i of ids)n.setXYZ(i,sum.x,sum.y,sum.z);}
}

export const WHITE_LEAF_UV=[.875,.25] as const;
export function whitePlantUV(g:THREE.BufferGeometry) {
  const uv=new Float32Array(g.attributes.position.count*2);for(let i=0;i<uv.length;i+=2){uv[i]=WHITE_LEAF_UV[0];uv[i+1]=WHITE_LEAF_UV[1];}g.setAttribute('uv',new THREE.BufferAttribute(uv,2));return g;
}

export type GrassVariant=0|1|2|3;
export type GrassPreset='flw-production-reference'|'refined-ground-r05'|'basic-grass-model';
const C=(hex:string)=>new THREE.Color(hex);
const V=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
const mix=(a:THREE.Color,b:THREE.Color,t:number)=>a.clone().lerp(b,t);
export function grassModel(variant = 0): THREE.BufferGeometry {
  const v = variant % 4, r = mulberry32(63 + v * 17), t = new Tris();
  const spec = [
    { n: 13, h: [0.28, 0.22], w: [0.022, 0.012], lean: [0.12, 0.2], c0: '#4d6428', c1: '#9cb35a' },
    { n: 20, h: [0.45, 0.35], w: [0.013, 0.008], lean: [0.2, 0.25], c0: '#556b2f', c1: '#b9b46e' },
    { n: 11, h: [0.26, 0.18], w: [0.02, 0.01], lean: [0.1, 0.15], c0: '#4d6428', c1: '#a3b360' },
    { n: 9, h: [0.32, 0.18], w: [0.038, 0.012], lean: [0.25, 0.2], c0: '#3f5a26', c1: '#7e9446' },
  ][v];
  const c0 = C(spec.c0), c1 = C(spec.c1);
  for (let i = 0; i < spec.n; i++) {
    const a = r() * Math.PI * 2, h = spec.h[0] + r() * spec.h[1], lean = spec.lean[0] + r() * spec.lean[1], w = spec.w[0] + r() * spec.w[1];
    const d = V(Math.cos(a), 0, Math.sin(a)), s = V(-Math.sin(a), 0, Math.cos(a));
    const base = d.clone().multiplyScalar(r() * 0.06);
    const pt = (u: number, side: number) => base.clone().addScaledVector(d, lean * u * u).add(V(0, h * u * (1 - (v === 3 ? 0.25 * u * u : 0)), 0)).addScaledVector(s, side * w * (1 - u));
    for (let k = 0; k < 2; k++) { const u0 = k / 2, u1 = (k + 1) / 2; t.quad(pt(u0, -1), pt(u0, 1), pt(u1, 1), pt(u1, -1), mix(c0, c1, u0), mix(c0, c1, u1)); }
  }
  if (v === 2) for (let i = 0; i < 4; i++) { // seed stems with an oat-like head
    const a = r() * Math.PI * 2, h = 0.55 + r() * 0.25, d = V(Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08);
    const top = d.clone().add(V(0, h, 0));
    stem(t, [V(0, 0, 0), d.clone().multiplyScalar(0.5).add(V(0, h * 0.5, 0)), top], 0.005, C('#6f7f3a'), C('#a99c62'));
    const head = C('#b5a26a');
    for (let k = 0; k < 4; k++) leafShape(t, top.clone().add(V(0, -k * 0.035, 0)), V(Math.cos(a + k * 1.6), 0, Math.sin(a + k * 1.6)), 0.05, 0.012, -0.03, head, head, 1);
  }
  return t.build(0.6);
}


export function referenceGrassModel(variant:GrassVariant,detail=true,garden=true,interiorGreen=true):THREE.BufferGeometry {
 const kind='grass';
 const v=variant%4,r=mulberry32(4201+v*71+417),t=new Tris();
 const rounded:THREE.BufferGeometry[]=[];
 const INTERIOR_GREEN=interiorGreen;
  const palette = detail ? (kind === 'grass'
    ? [['#46663c','#9fac68','#2e4e36'],['#365b40','#7fa46b','#234535'],['#686d3e','#b9ac6a','#3f5636'],['#4b7148','#9fb873','#2c503c']][v]
    : [['#426d43','#91b568','#284f39'],['#507b45','#a4bb70','#32583c'],['#365e43','#7da16a','#254b39']][v]) : ['#3c6235','#88a856','#294b30'];
  const [green,light,dark] = palette.map(C);

  const blade = (p: THREE.Vector3, d: THREE.Vector3, L: number, W: number, rise: number, a = green, b = light) => {
    if(garden){rounded.push(gardenLeaf(p,d,L,W,rise,a,b,0,kind==='fern'?3:6,2,INTERIOR_GREEN?(kind==='grass'?1:0):undefined));return;}
    const s=V(-d.z,0,d.x), mid=p.clone().addScaledVector(d,L*.48).add(V(0,rise,0)), tip=p.clone().addScaledVector(d,L).add(V(0,rise*.48,0));
    if (detail) {
      // Six-point outline rounds the shoulders around a raised midrib.
      const ridge=mid.clone().add(V(0,W*.32,0));
      const edge=(u:number,sign:number,w:number)=>p.clone().addScaledVector(d,L*u).addScaledVector(s,sign*W*w).add(V(0,Math.sin(u*Math.PI*.8)*rise,0));
      const ring=[p,edge(.28,1,.78),edge(.68,1,.87),tip,edge(.68,-1,.87),edge(.28,-1,.78)];
      for(let i=0;i<ring.length;i++){
        const colour=mix(a,b,i<3?.72:.42);
        t.tri(ring[i],ring[(i+1)%ring.length],ridge,colour,colour,b);
      }
    } else {
      t.tri(p,mid.clone().addScaledVector(s,W),tip,a,b,b);
      t.tri(p,tip,mid.clone().addScaledVector(s,-W),a,b,mix(a,b,.65));
    }
  };

 if(kind==='grass') {
} else if(kind==='grass') {
    const n=[9,11,8,7][v], H=[.34,.65,.44,.46][v], width=[.022,.016,.024,.045][v];
    for(let i=0;i<n;i++){
      const a=i*2.39996+r()*.5,d=V(Math.cos(a),0,Math.sin(a)),s=V(-d.z,0,d.x), h=H*(.65+r()*.55),lean=(v===3?.38:.22)*(.6+r());
      const base=d.clone().multiplyScalar(.02+r()*.06);
      const at=(u:number,w:number)=>base.clone().addScaledVector(d,lean*u*u).add(V(0,h*u*(1-(v===3?.25:.08)*u),0)).addScaledVector(s,w*width*(1-u));
      if(detail){
        // Three bent sections, each folded along the midrib, without extra alpha layers.
        const fold=(u:number,w:number)=>at(u,w).add(V(0,(1-Math.abs(w))*width*.22*Math.sin(Math.PI*u),0));
        for(let k=0;k<3;k++){
          const u=k/3,z=(k+1)/3,c0=mix(dark,light,u*.85),c1=mix(dark,light,z*.85);
          t.quad(fold(u,-1),fold(u,0),fold(z,0),fold(z,-1),c0,c1);
          t.quad(fold(u,0),fold(u,1),fold(z,1),fold(z,0),mix(c0,green,.18),mix(c1,green,.18));
        }
      }else{
        for(let k=0;k<3;k++){
          const u=k/3,z=(k+1)/3,c0=mix(dark,light,u),c1=mix(dark,light,z);
          t.quad(at(u,-1),at(u,1),at(z,1),at(z,-1),c0,c1);
        }
      }
    }
    if(v===2)for(let i=0;i<3;i++){
      const a=i*2.2,d=V(Math.cos(a),0,Math.sin(a)),top=d.clone().multiplyScalar(.12).add(V(0,.65+i*.06,0));
      stem(t,[V(0,0,0),top.clone().multiplyScalar(.5),top],.004,green,C('#a6a270'));
      for(let k=0;k<4;k++)blade(top.clone().add(V(0,-k*.04,0)),d.clone().applyAxisAngle(UP,k*1.8),.06,.013,-.02,C('#9c9560'),C('#c6b97a'));
    
 const base=t.build(.6);
 if(!garden)return base;
 gardenSmoothNormals(base);
 if(INTERIOR_GREEN)whitePlantUV(base);
 const result=mergeGeometries([base,...rounded])!;
 base.dispose();rounded.forEach(g=>g.dispose());
 result.computeBoundingSphere();
 return result;
}
export function makeGrassGeometry(v:GrassVariant,preset:GrassPreset='flw-production-reference'){
 if(![0,1,2,3].includes(v))throw RangeError('Unknown grass variant '+v);
 if(preset==='basic-grass-model')return grassModel(v);
 if(preset==='refined-ground-r05')return referenceGrassModel(v,true,false,false);
 if(preset==='flw-production-reference')return referenceGrassModel(v,true,true,true);
 throw RangeError('Unknown grass preset '+preset);
}
