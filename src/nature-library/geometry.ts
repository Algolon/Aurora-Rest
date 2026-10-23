// ASSET-01B1: extracted faithful birch-only procedural geometry.
// Pinned source: Algolon/Feh-Lu-We@17eafb0902833fb1121c77083f9f862eb4ffcd96 src/world/woodkit.ts
// Excludes all estate/game/indoor/garden imports; preserved geometry algorithm blocks are marked by provenance.
import * as THREE from 'three';
import {mergeGeometries, mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {mulberry32} from './rng.ts';
import {foliageSprays, type SprayPalette} from './foliage.ts';
export function taperTube(pts: [number, number, number][], radii: number[], o: { radial?: number; rows?: number; lobes?: number; flare?: number; vScale?: number } = {}) {
  const radial = o.radial ?? 8, rows = o.rows ?? Math.max(3, pts.length * 2);
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const frames = curve.computeFrenetFrames(rows, false);
  const len = curve.getLength();
  const R = (t: number) => {
    const f = t * (radii.length - 1), i = Math.min(radii.length - 2, Math.floor(f));
    return THREE.MathUtils.lerp(radii[i], radii[i + 1], f - i);
  };
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  const P = new THREE.Vector3(), N = new THREE.Vector3(), V = new THREE.Vector3();
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    curve.getPointAt(t, P);
    const r0 = R(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      // buttress lobes fade out over the first ~25 % of the length
      const lobe = o.lobes ? 1 + (o.flare ?? 0.6) * Math.pow(Math.max(0, 1 - t / 0.25), 2) * (0.35 + 0.65 * Math.pow(Math.max(0, Math.cos(a * o.lobes)), 2)) : 1;
      N.copy(frames.normals[i]).multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i], Math.sin(a)).normalize();
      V.copy(P).addScaledVector(N, r0 * lobe);
      pos.push(V.x, V.y, V.z); nor.push(N.x, N.y, N.z);
      uv.push(j / radial, (t * len) / (o.vScale ?? 1));
    }
  }
  for (let i = 0; i < rows; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals(); // lobes change the surface: recompute (seam at u=0 stays smooth enough at this density)
  return g;
}
const UP = new THREE.Vector3(0, 1, 0);
/** Low-frequency deterministic 3D noise (sum of sines) in [-1, 1]. */
const n3 = (x: number, y: number, z: number, s: number) =>
  (Math.sin(x * 1.7 + s) * Math.sin(y * 2.3 + s * 1.3) + Math.sin(z * 1.9 + s * 0.7) * Math.sin((x + y) * 1.3 + s * 2.1) + Math.sin((y - z) * 2.1 + s * 3.1)) / 3;
function paint(g: THREE.BufferGeometry, f: number | ((p: THREE.Vector3, i: number) => [number, number, number])) {
  const p = g.attributes.position as THREE.BufferAttribute, c = new Float32Array(p.count * 3), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const rgb = typeof f === 'number' ? [f, f, f] : f(v.fromBufferAttribute(p, i), i);
    c.set(rgb, i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
/** Merge parts into one indexed geometry with position/normal/uv/color (missing uv → planar). */
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
/** Spherical-ish UVs for foliage masses (a leaf-dab texture wraps without stretching badly); u offset by LEAF_U. */
function foliageUV(g: THREE.BufferGeometry, scale: number) {
  const p = g.attributes.position as THREE.BufferAttribute, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = LEAF_U + (p.getX(i) + p.getZ(i) * 0.7) / scale; uv[i * 2 + 1] = (p.getY(i) + p.getZ(i) * 0.4) / scale; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

export interface Model { wood: THREE.BufferGeometry; leaves: THREE.BufferGeometry }
/**
 * near < 16 m (inspected), mid 16–26 m, far 26–48 m, xfar beyond (DEV-03: estate-wide woodland). All share one
 * skeleton and the outline clusters, so a switch coarsens the surface but keeps the silhouette.
 */
export type Lod = 'near' | 'mid' | 'far' | 'xfar';
export type TreeSpecies = 'oak' | 'beech' | 'birch' | 'pine';
export type BushSpecies = 'hazel' | 'holly';
/**
 * Species palette (sRGB hex): the instance colour of a tree or bush is its LEAF tint (with a small per-object
 * jitter); bark vertex colours are pre-multiplied by BARK ÷ LEAF, so one instance colour tints both.
 */
export const BARK_TINT: Record<TreeSpecies | BushSpecies, string> = { oak: '#7a6652', beech: '#9c978c', birch: '#ece8de', pine: '#a3896f', hazel: '#8c735c', holly: '#6e604e' };
export const LEAF_TINT: Record<TreeSpecies | BushSpecies, string> = { oak: '#6f8a3a', beech: '#86a043', birch: '#97a94c', pine: '#4e6c48', hazel: '#7b9645', holly: '#46663a' };
/** Variants per species (each a distinct, authored or seeded silhouette). */
export const VARIANTS = 3;
export const BARK = { fissured: 0, smooth: 1, birch: 2 } as const;
export const ATLAS_COLS = 4;
/** Foliage UVs carry this offset in u: the tree material recognises them and repeats them inside the leaf column. */
export const LEAF_U = 64;
const GUT = 0.07;
function barkCol(g: THREE.BufferGeometry, col: number) {
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setX(i, (col + GUT + Math.min(1, Math.max(0, uv.getX(i))) * (1 - 2 * GUT)) / ATLAS_COLS);
  return g;
}

// ------------------------------------------------------------------------------------------------ tree building blocks
type P3 = [number, number, number];
const vec = (p: P3) => new THREE.Vector3(p[0], p[1], p[2]);

/**
 * A foliage cluster: a displaced, slightly flattened sphere. Near: icosphere (80 triangles); far: octasphere (32)
 * (small clusters one step coarser) — same centre, size and noise, so the LOD switch keeps the outline.
 * Normals are blended toward the crown centre (one soft volume) and biased up (undersides read as shaded green,
 * not black); vertex colour bakes occlusion (darker inside and underneath, lighter and warmer on outer tops) and a
 * small per-cluster value step so overlapping clusters separate.
 */
interface Cluster { c: THREE.Vector3; r: P3; seed: number; amp: number; flat: number; val: number; spiky?: boolean; /** a small filler clump: near LOD only */ sat?: boolean }
function clusterGeo(k: Cluster, lod: Lod, crownC: THREE.Vector3, crownR: number, bend = 0.5, nearSmall = 0.5) {
  // small clusters one step coarser: near icosphere (80) / octasphere (32); far octasphere (32) / icosahedron (20)
  // far: icosahedron (20) for every cluster
  const small = Math.max(...k.r) < (lod === 'near' ? nearSmall : 0.9);
  const g0 = lod === 'near' ? (small ? new THREE.OctahedronGeometry(1, 1) : new THREE.IcosahedronGeometry(1, 1)) : small || lod === 'far' || lod === 'xfar' ? new THREE.IcosahedronGeometry(1, 0) : new THREE.OctahedronGeometry(1, 1);
  g0.deleteAttribute('normal'); g0.deleteAttribute('uv');
  const g = mergeVertices(g0, 1e-5);
  g0.dispose();
  const p = g.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    let d = 1 + k.amp * n3(v.x * 1.7, v.y * 1.7, v.z * 1.7, k.seed) + k.amp * 0.45 * n3(v.x * 3.9, v.y * 3.9, v.z * 3.9, k.seed + 7.7);
    if (k.spiky) d += 0.22 * Math.max(0, n3(v.x * 6.3, v.y * 6.3, v.z * 6.3, k.seed + 3.1));
    v.multiplyScalar(d);
    if (v.y < 0) v.y *= k.flat;
    p.setXYZ(i, k.c.x + v.x * k.r[0], k.c.y + v.y * k.r[1], k.c.z + v.z * k.r[2]);
  }
  g.computeVertexNormals();
  const nn = g.attributes.normal as THREE.BufferAttribute, w = new THREE.Vector3(), col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    w.copy(v).sub(crownC);
    const dist = w.length() / crownR;
    w.normalize();
    const n = new THREE.Vector3().fromBufferAttribute(nn, i).lerp(w, bend).normalize().lerp(UP, 0.3).normalize();
    nn.setXYZ(i, n.x, n.y, n.z);
    const up = THREE.MathUtils.smoothstep(n.y, -0.7, 0.9);
    const kk = (0.78 + 0.22 * up) * (0.72 + 0.28 * THREE.MathUtils.smoothstep(dist, 0.3, 1.0)) * 1.12 * k.val;
    col[i * 3] = kk * (0.98 + 0.08 * up); col[i * 3 + 1] = kk * (1.0 + 0.04 * up); col[i * 3 + 2] = kk * (1.0 - 0.14 * up);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
/** The clusters that define the crown's outline: top-, bottom-, and outermost in ±x and ±z. Kept at every LOD. */
function extremes(ks: Cluster[]) {
  const pick = (f: (k: Cluster) => number) => ks.reduce((a, b) => (f(b) > f(a) ? b : a));
  return new Set([pick((k) => k.c.y + k.r[1]), pick((k) => -(k.c.y - k.r[1])), pick((k) => k.c.x + k.r[0]), pick((k) => -(k.c.x - k.r[0])), pick((k) => k.c.z + k.r[2]), pick((k) => -(k.c.z - k.r[2]))]);
}
/** Mid/far: drop the small filler clumps, but never one that defines the outline (so a LOD switch does not pop). */
function dropFillers(ks: Cluster[]) { const keep = extremes(ks); return ks.filter((k) => !k.sat || keep.has(k)); }
/** Far LOD: the outline clusters plus the largest others, n in all; the inner ones a little larger, so the crown
 * keeps its mass and outline with fewer parts. */
function largest(ks: Cluster[], n: number, inflate = true) {
  if (ks.length <= n) return ks;
  const keep = extremes(ks), f = inflate ? Math.cbrt(ks.length / n) : 1;
  const rest = ks.filter((k) => !keep.has(k)).sort((a, b) => b.r[0] * b.r[1] * b.r[2] - a.r[0] * a.r[1] * a.r[2]).slice(0, Math.max(0, n - keep.size));
  return [...keep, ...rest.map((k) => ({ ...k, r: k.r.map((x) => x * f) as P3 }))];
}
/**
 * Drop cluster triangles buried inside a neighbouring cluster (centroid well inside its ellipsoid): they are never
 * seen, only drawn. Keeps every triangle on the outside of the crown.
 */
function cullBuried(geos: THREE.BufferGeometry[], ks: Cluster[], margin = 0.82) {
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  geos.forEach((g, gi) => {
    const p = g.attributes.position as THREE.BufferAttribute, idx = g.index!.array, keep: number[] = [];
    for (let t = 0; t < idx.length; t += 3) {
      a.fromBufferAttribute(p, idx[t]); b.fromBufferAttribute(p, idx[t + 1]); c.fromBufferAttribute(p, idx[t + 2]);
      a.add(b).add(c).divideScalar(3);
      const hidden = ks.some((k, ki) => ki !== gi && ((a.x - k.c.x) / k.r[0]) ** 2 + ((a.y - k.c.y) / k.r[1]) ** 2 + ((a.z - k.c.z) / k.r[2]) ** 2 < margin * margin);
      if (!hidden) keep.push(idx[t], idx[t + 1], idx[t + 2]);
    }
    g.setIndex(keep);
  });
  return geos;
}

/**
 * Trunk with integrated roots: horizontal rings round a smooth (slightly leaning) axis. Toward the ground the ring
 * swells into buttress lobes at irregular bearings and strengths, widest at ground level and narrowing again below
 * it, so each lobe is a root ridge that rises out of the soil and runs up into the trunk — no separate root tubes,
 * no joints, no visible root tips — and on a slope the downhill side shows the ridges diving into the soil.
 */
/**
 * The trunk's radius multiplier at bearing `a` (model space) and height `y`: buttresses widest at ground level;
 * above it they run up into the trunk, below it they dive and narrow (on a slope the downhill side shows them going
 * into the soil, not a skirt). Shared by the mesh and by `trunkFootprint` (placement), so both agree.
 */
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
interface Broadleaf {
  seed: number; H: number; leader: number; lean: [number, number]; trunk: [number, number]; flare: number; buttress: number;
  limbs: number; tiered: boolean; limbEl: [number, number]; limbLen: [number, number]; limbR: number; limbArch: number;
  subs: [number, number]; subLen: [number, number]; subEl: number;
  cl: [number, number]; clFlat: number; clSquash: number; clAmp: number; droop: number; topClusters: number; midP: number;
  bark: number; barkK: (y: number) => [number, number, number]; vScale: number;
}
interface Branch { pts: P3[]; r: number[]; level: 1 | 2 }
interface Skeleton { trunk: { path: P3[]; radius: (t: number) => number; lobes: { a: number; w: number }[] }; branches: Branch[]; clusters: Cluster[] }

function growBroadleaf(sp: Broadleaf): Skeleton {
  const r = mulberry32(sp.seed);
  const rnd = (a: number, b: number) => a + r() * (b - a);
  const top = sp.H + sp.leader;
  const axis = (y: number): P3 => { const t = Math.max(0, y) / top; return [sp.lean[0] * t * t * 1.0 + sp.lean[0] * t * 0.3, y, sp.lean[1] * t * t + sp.lean[1] * t * 0.3]; };
  const trunkPath: P3[] = [[0, -0.45, 0], axis(top * 0.3), axis(top * 0.65), axis(top)];
  const r0 = sp.trunk[0], r1 = sp.trunk[1];
  const trunkR = (y: number) => { const t = (y + 0.45) / (top + 0.45); return y <= sp.H ? THREE.MathUtils.lerp(r0, r1, Math.min(1, (y + 0.45) / (sp.H + 0.45))) : THREE.MathUtils.lerp(r1, r1 * 0.25, (y - sp.H) / Math.max(0.01, sp.leader)) * (t > 0 ? 1 : 1); };
  const radius = (t: number) => trunkR(-0.45 + t * (top + 0.45));
  // buttresses at irregular bearings and strengths
  const lobes: { a: number; w: number }[] = [];
  let a = r() * Math.PI * 2;
  for (let i = 0; i < sp.buttress; i++) { lobes.push({ a, w: rnd(0.55, 1.0) }); a += (Math.PI * 2 / sp.buttress) * rnd(0.6, 1.4); }
  const branches: Branch[] = [], clusters: Cluster[] = [];
  const addCluster = (c: THREE.Vector3, s: number, seed: number, sat = false) => clusters.push({ c, r: [s * rnd(0.95, 1.15), s * sp.clSquash * rnd(0.9, 1.1), s * rnd(0.95, 1.15)], seed, amp: sp.clAmp, flat: sp.clFlat, val: rnd(0.93, 1.07), sat });
  // limbs
  const a0 = r() * Math.PI * 2;
  for (let i = 0; i < sp.limbs; i++) {
    const f = sp.limbs > 1 ? i / (sp.limbs - 1) : 0;
    const y = sp.tiered ? sp.H + f * sp.leader * 0.82 + rnd(-0.2, 0.2) : sp.H - rnd(0, 0.7);
    const az = a0 + i * 2.39996 + rnd(-0.45, 0.45);
    const el = THREE.MathUtils.lerp(sp.limbEl[0], sp.limbEl[1], sp.tiered ? f * 0.6 + r() * 0.4 : r());
    const L = rnd(sp.limbLen[0], sp.limbLen[1]) * (sp.tiered ? 1 - 0.55 * f : 1);
    const d = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    const S = vec(axis(y));
    const P1 = S.clone().addScaledVector(d, L * 0.34).add(new THREE.Vector3(0, L * sp.limbArch * 0.5, 0));
    const P2 = S.clone().addScaledVector(d, L * 0.7).add(new THREE.Vector3(0, L * sp.limbArch * 0.6 - sp.droop * L * 0.15, 0));
    const E = S.clone().addScaledVector(d, L).add(new THREE.Vector3(0, L * sp.limbArch * 0.35 - sp.droop * L * 0.5, 0));
    const rl = trunkR(y) * sp.limbR * rnd(0.8, 1.1);
    const limb: P3[] = [S, P1, P2, E].map((v) => [v.x, v.y, v.z]);
    branches.push({ pts: limb, r: [rl, rl * 0.72, rl * 0.45, rl * 0.18], level: 1 });
    const curve = new THREE.CatmullRomCurve3(limb.map(vec), false, 'centripetal');
    const ns = Math.round(rnd(sp.subs[0], sp.subs[1]));
    for (let k = 0; k < ns; k++) {
      const ft = rnd(0.42, 0.82), Sb = curve.getPointAt(ft);
      const saz = az + (k % 2 ? 1 : -1) * rnd(0.45, 1.05), sel = el + rnd(0.05, sp.subEl);
      const Ls = L * rnd(sp.subLen[0], sp.subLen[1]);
      const ds = new THREE.Vector3(Math.cos(sel) * Math.cos(saz), Math.sin(sel), Math.cos(sel) * Math.sin(saz));
      const Mb = Sb.clone().addScaledVector(ds, Ls * 0.55).add(new THREE.Vector3(0, Ls * 0.1, 0));
      const Eb = Sb.clone().addScaledVector(ds, Ls).add(new THREE.Vector3(0, -sp.droop * Ls * 0.45, 0));
      const rs = rl * (1 - ft * 0.6) * 0.55;
      branches.push({ pts: [Sb, Mb, Eb].map((v) => [v.x, v.y, v.z]), r: [rs, rs * 0.55, rs * 0.2], level: 2 });
      const s = rnd(sp.cl[0], sp.cl[1]);
      addCluster(Eb.clone().add(new THREE.Vector3(0, s * 0.3 - sp.droop * s * 0.5, 0)), s, sp.seed * 0.01 + i * 7.3 + k * 2.9);
      if (r() < sp.midP) { const m = Sb.clone().lerp(Eb, 0.5); addCluster(m.add(new THREE.Vector3(0, s * 0.35, 0)), s * rnd(0.6, 0.75), sp.seed * 0.01 + i * 3.1 + k * 5.3 + 1, true); }
    }
    const s = rnd(sp.cl[0], sp.cl[1]) * 1.1;
    addCluster(E.clone().add(new THREE.Vector3(0, s * 0.3 - sp.droop * s * 0.5, 0)), s, sp.seed * 0.01 + i * 4.7 + 0.5);
  }
  // crown top: over the end of the leader (tiered) or over the fork (decurrent), so the crown is closed above
  for (let i = 0; i < sp.topClusters; i++) {
    const t = vec(axis(top));
    const s = rnd(sp.cl[0], sp.cl[1]) * (i ? 0.85 : 1.05);
    addCluster(t.add(new THREE.Vector3(rnd(-0.9, 0.9) * (i ? 1 : 0.3), s * 0.45 + (sp.tiered ? 0 : 1.4) + i * 0.4, rnd(-0.9, 0.9) * (i ? 1 : 0.3))), s, sp.seed * 0.01 + 50 + i);
  }
  return { trunk: { path: trunkPath, radius, lobes }, branches, clusters };
}

function emitBroadleaf(sp: Broadleaf, sk: Skeleton, lod: Lod, continuous: boolean | 'outline' = false, smoothFork = false, relief = false): Model {
  const near = lod === 'near', xfar = lod === 'xfar', far = lod === 'far' || xfar;
  const girth = THREE.MathUtils.clamp(sp.trunk[0] / 0.45, 0.6, 1); // slim trunks need fewer sides
  const wood: THREE.BufferGeometry[] = [flaredTrunk(sk.trunk.path, sk.trunk.radius, sk.trunk.lobes, sp.flare, 1.25, xfar ? 5 : Math.round((near ? 20 : far ? 6 : 9) * girth), smoothFork ? (near ? 28 : far ? 9 : 16) : near ? 11 : far ? 3 : 4, sp.vScale, near)];
  const reliefCaps: number[] = [];
  const capPart = (g: THREE.BufferGeometry, radius: (t: number) => number) => {
    if (!relief) return;
    const uv = g.attributes.uv; let length = 0;
    for (let i = 0; i < uv.count; i++) length = Math.max(length, uv.getY(i));
    for (let i = 0; i < uv.count; i++) reliefCaps.push(Math.min(.055, radius(uv.getY(i) / Math.max(.001, length)) * .18));
  };
  capPart(wood[0], sk.trunk.radius);
  for (const b of sk.branches) {
    if (!near && b.level === 2) continue; // mid/far: limbs only; side branches are hidden in the foliage at that distance
    if (xfar && !continuous) continue; // continuity prototype retains the primary branch skeleton
    wood.push(taperTube(b.pts, b.r, { radial: near ? (b.level === 1 ? (relief ? 12 : 6) : (relief ? 6 : 3)) : far ? 3 : (relief ? 8 : 4), rows: smoothFork ? (near ? (b.level === 1 ? 12 : 5) : far ? 4 : 7) : near ? (b.level === 1 ? 4 : 3) : far ? 1 : 2, vScale: 1.2 }));
    capPart(wood[wood.length - 1], t => THREE.MathUtils.lerp(b.r[0], b.r[b.r.length - 1], t));
  }
  const crownC = sk.clusters.reduce((s, k) => s.add(k.c), new THREE.Vector3()).divideScalar(sk.clusters.length);
  const crownR = Math.max(...sk.clusters.map((k) => k.c.distanceTo(crownC) + Math.max(...k.r)));
  let ks = near ? sk.clusters : dropFillers(sk.clusters); // mid/far: the small filler clumps are dropped
  if (far) ks = largest(ks, continuous ? 14 : xfar ? 6 : 14, !continuous);
  const leaves = cullBuried(ks.map((k) => clusterGeo(k, continuous === true && lod === 'mid' ? 'near' : lod, crownC, crownR)), ks);
  const woodG = mergeParts(wood.map((g) => barkCol(paint(g, (p) => sp.barkK(p.y)), sp.bark)));
  if (relief) woodG.userData.barkReliefCaps = new Float32Array(reliefCaps);
  return { wood: woodG, leaves: mergeParts(leaves.map((g) => foliageUV(g, 1.4))) };
}
const broadleaf = (sp: Broadleaf, lod: Lod) => emitBroadleaf(sp, growBroadleaf(sp), lod);
// ------------------------------------------------------------------------------------------------ birch
/**
 * Silver birch: a slender, slightly wavering white trunk (dark and rough at the foot) with a leader to the top; many
 * thin branches rising and then drooping at the tips, small clumps hanging from them — a narrow, airy crown you can
 * see through. Three layouts (height, branch count, lean).
 */
const BIRCHES: Broadleaf[] = [0, 1, 2].map((v) => ({
  seed: 6203 + v * 131, H: [3.8, 3.4, 4.2][v], leader: [6.2, 5.4, 6.8][v], lean: [[0.3, -0.1], [-0.35, 0.22], [0.18, 0.35]][v] as [number, number],
  trunk: [0.22, 0.15] as [number, number], flare: 0.9, buttress: 4, tiered: true, limbs: [9, 8, 10][v], limbEl: [0.45, 0.95] as [number, number],
  limbLen: [2.3, 3.1] as [number, number], limbR: 0.4, limbArch: 0.3, subs: [1, 2] as [number, number], subLen: [0.45, 0.7] as [number, number], subEl: 0.15,
  cl: [0.3, 0.42] as [number, number], clFlat: 0.85, clSquash: 0.92, clAmp: 0.3, droop: 1.1, topClusters: 1, midP: 0.55,
  bark: BARK.birch, barkK: (y: number) => { const k = 0.35 + 0.65 * THREE.MathUtils.smoothstep(y, 0.2, 1.3); return [k, k, k * 0.98]; }, vScale: 1.6,
}));
export function birchModel(variant: number, lod: Lod): Model { return broadleaf(BIRCHES[variant % 3], lod); }
// Equivalent to referenceTreeModel('birch', variant, lod, 'outline', 'trees-r03')
// Original production dispatch: woodkit.ts lines 478-509 and 614-616.
const BIRCH_PALETTES = [
 { shade: '#456d3a', green: '#9cb653', warm: '#c0b756', warmth: .18 },
 { shade: '#355f3c', green: '#7fa34d', warm: '#a8b257', warmth: .12 },
 { shade: '#596e39', green: '#a8b354', warm: '#c6ae48', warmth: .48 },
] as const;
function birchPalette(variant: number): SprayPalette {
 const v = ((variant % 3) + 3) % 3;
 return {base:LEAF_TINT.birch,...BIRCH_PALETTES[v]};
}
export function birchReferenceModel(variant: number, lod: Lod, continuous: boolean|'outline' = 'outline'): Model {
 const sp=BIRCHES[((variant%3)+3)%3], sk=growBroadleaf(sp);
 const model=emitBroadleaf(sp,sk,lod,continuous);
 model.leaves.dispose();
 model.leaves=foliageSprays(sk.clusters,lod,'birch',birchPalette(variant));
 return model;
}
// Same color-space and composition as source boslustSample.ts mergeModel(), lines 324-333.
export function combineBirchModel(m:Model): THREE.BufferGeometry {
 const b=new THREE.Color(BARK_TINT.birch), l=new THREE.Color(LEAF_TINT.birch);
 const ratio=new THREE.Color(b.r/l.r,b.g/l.g,b.b/l.b);
 const c=m.wood.attributes.color as THREE.BufferAttribute;
 for(let i=0;i<c.count;i++) c.setXYZ(i,c.getX(i)*ratio.r,c.getY(i)*ratio.g,c.getZ(i)*ratio.b);
 const parts=m.wood.index&&m.leaves.index?[m.wood,m.leaves]:[m.wood,m.leaves].map(g=>g.index?g.toNonIndexed():g);
 const g=mergeGeometries(parts)!;
 m.wood.dispose();m.leaves.dispose();
 g.computeBoundingBox();g.computeBoundingSphere();
 return g;
}
export function makeBirchGeometry(variant:0|1|2,lod:'near'|'mid'|'far'):THREE.BufferGeometry {
 return combineBirchModel(birchReferenceModel(variant,lod,'outline'));
}
