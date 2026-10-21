// ASSET-01C1 — pin-accurate production Scots pine extracted from Feh Lu We.
// Pinned: Algolon/Feh-Lu-We@17eafb0902833fb1121c77083f9f862eb4ffcd96 woodkit.ts pineModel(),
// referenceTreeModel('pine',v,lod,'outline','trees-r03').
// Production-only reference branch; non-reference/experimental leaf masses omitted.
// This file intentionally leaves approved src/geometry.ts (birch) byte-identical.
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {taperTube,BARK,LEAF_TINT,BARK_TINT,type Lod,type Model} from '../geometry.ts';
import {mulberry32} from '../rng.ts';
import {foliageSprays,type SprayPalette} from '../foliage.ts';
type P3=[number,number,number];
interface Cluster {c:THREE.Vector3;r:P3;seed:number;amp:number;flat:number;val:number;sat?:boolean;}
const vec=(p:P3)=>new THREE.Vector3(p[0],p[1],p[2]);
const GUT=.07,ATLAS_COLS=4;
// Source-compatible local geometry utility subset; no runtime link to Feh Lu We.
function paint(g: THREE.BufferGeometry, f: number | ((p: THREE.Vector3, i: number) => [number, number, number])) {
  const p = g.attributes.position as THREE.BufferAttribute, c = new Float32Array(p.count * 3), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const rgb = typeof f === 'number' ? [f, f, f] : f(v.fromBufferAttribute(p, i), i);
    c.set(rgb, i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
function mergeParts(parts: THREE.BufferGeometry[]) {
  for (const g of parts) {
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.color) paint(g, 1);
    for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(n)) g.deleteAttribute(n);
  }
  const allIdx = parts.every((g) => g.index);
  const m = mergeGeometries(allIdx ? parts : parts.map((g) => (g.index ? g.toNonIndexed() : g)))!;
  parts.forEach((g) => g.dispose());
  m.computeBoundingSphere();
  return m;
}
function barkCol(g: THREE.BufferGeometry, col: number) {
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setX(i, (col + GUT + Math.min(1, Math.max(0, uv.getX(i))) * (1 - 2 * GUT)) / ATLAS_COLS);
  return g;
}

function flareK(a: number, y: number, lobes: { a: number; w: number }[], flare: number, flareH: number) {
  const F = flare * (y >= 0 ? Math.pow(1 - THREE.MathUtils.smoothstep(y, 0, flareH), 3.2) : 0.5 + 0.5 * THREE.MathUtils.smoothstep(y, -0.45, 0));
  const curl = 0.18 * (1 - THREE.MathUtils.smoothstep(y, -0.45, flareH)); // ridges twist a little as they descend
  const sharp = 4 + 12 * (1 - THREE.MathUtils.smoothstep(y, -0.1, flareH * 0.7)); // broad buttress up the trunk, slim root at the ground
  let k = 1;
  for (const l of lobes) { const d = Math.cos(a - l.a - curl * l.w); if (d > 0) k += F * l.w * d ** sharp; }
  return k + F * 0.08 * (1 + Math.sin(a * 3 + 1.3)) * 0.5; // a little general swell between the ridges
}

function flaredTrunk(path: P3[], radius: (t: number) => number, lobes: { a: number; w: number }[], flare: number, flareH: number, radial: number, rows: number, vScale: number, detailedFlare = rows >= 6) {
  const curve = new THREE.CatmullRomCurve3(path.map(vec), false, 'centripetal');
  const len = curve.getLength();
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const P = new THREE.Vector3();
  // ring heights: dense through the flare (where the buttresses change fastest), then even up the trunk
  const y0 = path[0][1], y1 = path[path.length - 1][1], base = [y0, -0.2, 0, 0.14, 0.3, 0.48, 0.7, 0.95, flareH + 0.25].filter((y) => y > y0 && y < y1 - 0.5);
  const fine = !detailedFlare ? base.filter((_, i) => i % 3 === 0) : base; // coarse LODs: every third flare ring
  const top = fine[fine.length - 1] ?? y0, ys = [y0, ...fine.filter((y) => y > y0)];
  const rest = Math.max(1, rows - ys.length + 1);
  for (let i = 1; i <= rest; i++) ys.push(top + ((y1 - top) * i) / rest);
  rows = ys.length - 1;
  for (let i = 0; i <= rows; i++) {
    const t = (ys[i] - y0) / (y1 - y0); // height fraction ≈ curve parameter (the axis is near vertical)
    curve.getPointAt(t, P);
    const R = radius(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const k = flareK(a, P.y, lobes, flare, flareH);
      pos.push(P.x + Math.cos(a) * R * k, P.y, P.z + Math.sin(a) * R * k);
      uv.push(j / radial, (t * len) / vScale);
    }
  }
  for (let i = 0; i < rows; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function smoothWoodNormals(g: THREE.BufferGeometry) {
  g.computeVertexNormals();
  const p = g.attributes.position as THREE.BufferAttribute, normals = g.attributes.normal as THREE.BufferAttribute;
  const sums = new Map<string, THREE.Vector3>();
  const keyAt = (i: number) => `${Math.round(p.getX(i) * 1e5)},${Math.round(p.getY(i) * 1e5)},${Math.round(p.getZ(i) * 1e5)}`;
  for (let i = 0; i < p.count; i++) {
    const key = keyAt(i), sum = sums.get(key) ?? new THREE.Vector3();
    sum.add(new THREE.Vector3().fromBufferAttribute(normals, i)); sums.set(key, sum);
  }
  for (let i = 0; i < p.count; i++) {
    const n = sums.get(keyAt(i))!.clone().normalize(); normals.setXYZ(i, n.x, n.y, n.z);
  }
}

const PINE_PALETTES: readonly SprayPalette[] = [
 {base:LEAF_TINT.pine,shade:'#254c38',green:'#52794b',warm:'#6f8b51',warmth:.14},
 {base:LEAF_TINT.pine,shade:'#234639',green:'#41674a',warm:'#678357',warmth:.10},
 {base:LEAF_TINT.pine,shade:'#32523b',green:'#64804d',warm:'#84915b',warmth:.17},
];
function treePalette(species:'pine',variant:number):SprayPalette {
 if(species!=='pine')throw Error('This module implements only the production Scots pine');
 return PINE_PALETTES[((variant%3)+3)%3];
}

const pineLobes = (rnd: (a: number, b: number) => number) => [0, 1, 2, 3].map((i) => ({ a: i * 1.57 + rnd(-0.4, 0.4), w: rnd(0.5, 1) }));
export function pineModel(lod: Lod, variant = 0, continuous: boolean | 'outline' = false, reference = false, sculpt = false): Model {
  const v = variant % 3, r = mulberry32(733 + v * 211), near = lod === 'near', xfar = lod === 'xfar', far = lod === 'far' || xfar;
  const rnd = (a: number, b: number) => a + r() * (b - a);
  const T = [12.2, 11.0, 13.4][v], bend = [[0.45, -0.25], [-0.3, 0.2], [0.75, 0.4]][v], light = [0.6, 2.4, 4.1][v];
  const axis = (y: number): P3 => { const t = Math.max(0, y) / T; return [bend[0] * (t * t * 0.8 + 0.25 * Math.sin(t * 3.1)), y, bend[1] * (t * t * 0.8 + 0.2 * Math.sin(t * 2.6))]; };
  const lobes = pineLobes(rnd);
  const wood: THREE.BufferGeometry[] = [flaredTrunk([[0, -0.45, 0], axis(T * 0.3), axis(T * 0.65), axis(T)], (t) => THREE.MathUtils.lerp(0.36, 0.06, Math.pow(t, 0.9)), lobes, 1.1, 0.9, near ? 14 : far ? 5 : 7, sculpt ? (near ? 26 : far ? 9 : 14) : near ? 12 : far ? 3 : 4, 1.6, near)];
  const clusters: Cluster[] = [];
  const crownBase = T * [0.56, 0.5, 0.62][v];
  // irregular whorls: 4–5 levels, 2–4 branches each, some skipped
  let y = crownBase, a = rnd(0, 6.3), i = 0;
  while (y < T - 0.6) {
    const f = (y - crownBase) / (T - crownBase), n = 2 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      a += 2.39996 + rnd(-0.6, 0.6);
      if (r() < 0.22) continue; // a missing branch: gaps in the crown
      const lightSide = 1 + 0.45 * Math.cos(a - light);
      const L = (2.3 - 0.9 * f * f) * lightSide * rnd(0.75, 1.15) * (v === 1 ? 1.1 : 1);
      const el = THREE.MathUtils.lerp(-0.12, 0.35, f) + rnd(-0.1, 0.12);
      const S = vec(axis(y + rnd(-0.25, 0.25)));
      const d = new THREE.Vector3(Math.cos(el) * Math.cos(a), Math.sin(el), Math.cos(el) * Math.sin(a));
      const E = S.clone().addScaledVector(d, L), M = S.clone().lerp(E, 0.5).add(new THREE.Vector3(0, -0.12 + f * 0.2, 0));
      if (!xfar || continuous) wood.push(taperTube([[S.x, S.y, S.z], [M.x, M.y, M.z], [E.x, E.y, E.z]], [0.1 - f * 0.03, 0.06, 0.025], { radial: near ? 5 : 3, rows: sculpt ? (near ? 8 : far ? 2 : 4) : near ? 4 : far ? 1 : 2, vScale: 1.2 }));
      // two or three ragged clumps along the end of the branch, tilted with it, at different heights
      const m = 2 + Math.floor(r() * 2.5);
      for (let q = 0; q < m; q++) {
        const t = 1 - q * rnd(0.18, 0.26), c = S.clone().lerp(E, t).add(new THREE.Vector3(rnd(-0.25, 0.25), rnd(-0.1, 0.3) + q * 0.08, rnd(-0.25, 0.25)));
        const s = (0.48 + L * 0.13) * (q ? rnd(0.7, 0.9) : 1);
        clusters.push({ c, r: [s * rnd(0.95, 1.2), s * rnd(0.58, 0.74), s * rnd(0.9, 1.15)], seed: v * 17 + i * 3.1 + q, amp: 0.34, flat: 0.8, val: rnd(0.9, 1.1), sat: q >= 2 });
      }
      i++;
    }
    y += rnd(0.75, 1.25);
  }
  // rounded top: a few clumps round the leader's end
  const tp = vec(axis(T));
  for (let q = 0; q < 4; q++) clusters.push({ c: tp.clone().add(new THREE.Vector3(Math.cos(q * 1.9 + v) * (q ? 0.8 : 0.1), -0.3 * q + 0.15, Math.sin(q * 1.9 + v) * (q ? 0.8 : 0.1))), r: [0.85, 0.6, 0.8].map((s) => s * rnd(0.85, 1.1)) as P3, seed: v * 17 + 90 + q, amp: 0.34, flat: 0.8, val: rnd(0.95, 1.08) });
  if (near) for (let k = 0; k < 4; k++) { // dead stubs on the bare trunk
    const yy = 2.2 + k * rnd(0.8, 1.3), aa = k * 2.1 + r(), S = vec(axis(yy));
    wood.push(taperTube([[S.x, yy, S.z], [S.x + Math.cos(aa) * 0.45, yy - 0.12, S.z + Math.sin(aa) * 0.45]], [0.05, 0.02], { radial: 4, rows: 2 }));
  }
  const woodG = mergeParts(wood.map((g) => barkCol(paint(g, (p) => {
    const t = THREE.MathUtils.smoothstep(p.y, T * 0.29, T * 0.6);
    return [0.62 + 0.55 * t, 0.56 + 0.2 * t, 0.5 + 0.02 * t];
  }), BARK.fissured)));
  const centre = clusters.reduce((s, k) => s.add(k.c), new THREE.Vector3()).divideScalar(clusters.length);
  const cr = Math.max(...clusters.map((k) => k.c.distanceTo(centre) + k.r[0]));
  if (reference) {
    const leaves = foliageSprays(clusters, lod, 'pine', sculpt ? treePalette('pine', v) : undefined);
    if (sculpt) {
      for (const g of [woodG, leaves]) {
        const p = g.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = THREE.MathUtils.smoothstep(y, 1.6, 7);
          p.setXYZ(i, x + t * .32 * Math.sin(y * .38 + v * 1.6), y, z + t * .15 * Math.sin(y * .48 + v));
        }
        if (g === woodG) {
          smoothWoodNormals(g);
          const uv = g.attributes.uv as THREE.BufferAttribute, colours = g.attributes.color as THREE.BufferAttribute;
          for (let i = 0; i < p.count; i++) {
            uv.setX(i, 20 + uv.getX(i));
            const warm = THREE.MathUtils.smoothstep(p.getY(i), T * .30, T * .67);
            colours.setXYZ(i, colours.getX(i) * (1 + warm * .14), colours.getY(i) * (1 - warm * .03), colours.getZ(i) * (1 - warm * .16));
          }
        }
        g.computeBoundingBox(); g.computeBoundingSphere();
      }
    }
    return { wood: woodG, leaves };
  }
  throw new Error('Only referenceTreeModel production rendering is supported by the isolated pine family');
}
export function pineReferenceModel(variant:number,lod:Lod,continuous:boolean|'outline'='outline'):Model {
 return pineModel(lod,variant,continuous,true,true);
}
export function combinePineModel(m:Model):THREE.BufferGeometry{
 const b=new THREE.Color(BARK_TINT.pine),l=new THREE.Color(LEAF_TINT.pine);
 const ratio=new THREE.Color(b.r/l.r,b.g/l.g,b.b/l.b);
 const c=m.wood.getAttribute('color') as THREE.BufferAttribute;
 for(let i=0;i<c.count;i++)c.setXYZ(i,c.getX(i)*ratio.r,c.getY(i)*ratio.g,c.getZ(i)*ratio.b);
 const parts=m.wood.index&&m.leaves.index?[m.wood,m.leaves]:[m.wood,m.leaves].map(g=>g.index?g.toNonIndexed():g);
 const merged=mergeGeometries(parts)!;
 m.wood.dispose();m.leaves.dispose();
 merged.computeBoundingSphere();merged.computeBoundingBox();
 return merged;
}
export type PineVariant=0|1|2;
export function makePineGeometry(variant:PineVariant,lod:'near'|'mid'|'far'):THREE.BufferGeometry{
 return combinePineModel(pineReferenceModel(variant,lod,'outline'));
}
