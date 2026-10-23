/** ASSET-01E1. Verbatim geometry logic extracted from pinned Feh Lu We production.
 * Source woodkit.ts rockModel and paint at 17eafb0902833fb1121c77083f9f862eb4ffcd96. Geometry and RNG invariant.
 * Experimental R04 MUST NOT be substituted for this source family. */
import * as THREE from 'three';
import {ConvexGeometry} from 'three/examples/jsm/geometries/ConvexGeometry.js';
import {toCreasedNormals} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {mulberry32,type Rng} from '../rng.ts';
function paint(g: THREE.BufferGeometry, f: number | ((p: THREE.Vector3, i: number) => [number, number, number])) {
  const p = g.attributes.position as THREE.BufferAttribute, c = new Float32Array(p.count * 3), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const rgb = typeof f === 'number' ? [f, f, f] : f(v.fromBufferAttribute(p, i), i);
    c.set(rgb, i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

export function rockModel(seed: number): THREE.BufferGeometry {
  const r: Rng = mulberry32(seed);
  const pts: THREE.Vector3[] = [];
  const n = 11 + Math.floor(r() * 4), tilt = (r() - 0.5) * 0.35;
  for (let i = 0; i < n; i++) {
    const u = r() * Math.PI * 2, v = Math.acos(2 * r() - 1);
    let x = Math.sin(v) * Math.cos(u), y = Math.cos(v), z = Math.sin(v) * Math.sin(u);
    y = y > 0 ? y * (0.55 + r() * 0.25) : y * 0.4; // flatter top, buried bottom
    x *= 1.0 + r() * 0.25; z *= 0.75 + r() * 0.2;
    pts.push(new THREE.Vector3(x, y + x * tilt, z));
  }
  pts.push(new THREE.Vector3(0.9, -0.45, 0.6), new THREE.Vector3(-0.9, -0.45, -0.5), new THREE.Vector3(0.2, -0.45, -0.8), new THREE.Vector3(-0.3, -0.45, 0.8));
  const hull = new ConvexGeometry(pts);
  hull.deleteAttribute('normal');
  const g = toCreasedNormals(hull, 0.56);
  hull.dispose();
  g.computeBoundingBox();
  const top = g.boundingBox!.max.y, bot = g.boundingBox!.min.y;
  const nn = g.attributes.normal as THREE.BufferAttribute;
  const face: number[] = [];
  for (let f = 0; f < g.attributes.position.count / 3; f++) face.push(0.88 + r() * 0.2); // each plane its own value
  paint(g, (p, i) => {
    const h = (p.y - bot) / (top - bot), up = nn.getY(i);
    const moss = THREE.MathUtils.smoothstep(up, 0.55, 0.9) * THREE.MathUtils.smoothstep(h, 0.45, 0.85);
    const k = (0.72 + 0.28 * THREE.MathUtils.smoothstep(h, 0.0, 0.35)) * face[Math.floor(i / 3)];
    return [k * (1 - moss * 0.4), k * (1 - moss * 0.12), k * (1 - moss * 0.55)];
  });
  // planar UVs (strata run horizontally)
  const p = g.attributes.position as THREE.BufferAttribute, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(nn.getX(i)) > Math.abs(nn.getZ(i)); uv[i * 2] = (ax ? p.getZ(i) : p.getX(i)) * 0.9; uv[i * 2 + 1] = p.getY(i) * 0.9; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeBoundingSphere();
  return g;
}


export const PRODUCTION_ROCK_SEEDS = [11,23,37,53] as const;
export type RockSeed=typeof PRODUCTION_ROCK_SEEDS[number];
export function makeProductionRock(seed:RockSeed):THREE.BufferGeometry{
 if(!PRODUCTION_ROCK_SEEDS.includes(seed))throw RangeError('Unapproved source rock seed');
 return rockModel(seed);
}
