# MAT-01 integration contract

How future milestones consume the terrain-material foundation without duplicating its rules.

## 1. One canonical classification, two consumers

```ts
import {geoR02BSource} from '../terrain-material/sources/geo-r02b.ts';
import {classifyTerrain} from '../terrain-material/classify.ts';
import {TerrainMaterialQuery} from '../terrain-material/query.ts';

const source = geoR02BSource(heights, waterSurface, features);   // read-only adapter
const {classification} = classifyTerrain(source);                // once per terrain revision (worker)
const ground = new TerrainMaterialQuery(classification);         // CPU consumers
const resources = new TerrainMaterialResources(classification, textures, 'high'); // GPU consumer
```

The renderer and every CPU system read **the same bytes** (`classification.weights`, `classification.attributes`) with the **same bilinear lattice mapping**. Rules live only in `src/terrain-material/rules.ts` + `classify.ts`; GLSL contains no ecological rules.

## 2. CPU query API (`TerrainMaterialQuery`)

| Method | Returns | Typical use |
|---|---|---|
| `weightsAt(x, z, out?)` | `Float64Array` of normalised weights in `classification.materials` order (sums to 1) | per-instance density |
| `weightOf(id, x, z)` | one weight | "how much meadow is here?" |
| `sample(x, z)` | `{weights, dominant, dominantWeight, wetness, macro, exposure}` | placement decisions, footstep audio |
| `coverage(x, z, radiusM, n?)` | mean composition over a disc | cluster seeding, LOD impostor tint |
| `attribute(channel, x, z)` | 0 wetness, 1 macro tone, 2 exposure, 3 slope ÷ 1.5 | tinting vegetation to match ground |

Coordinates are metres: x east, z north (the GEO-R02B convention; the viewer's x-mirror is a render concern only).

### Example — POP-01 grass density

```ts
function grassDensity(x: number, z: number): number {
  const s = ground.sample(x, z);
  const meadow = s.weights['meadow-turf'], forest = s.weights['forest-floor'];
  // Dense in meadow, sparse under woodland, none on sand or bedrock; drier exposed ground thins it.
  return (meadow * 1.0 + forest * 0.25) * (1 - 0.35 * s.exposure);
}
function treeChance(x: number, z: number): number {
  return ground.weightOf('forest-floor', x, z) ** 1.5;   // forest edges thin out naturally across the ecotone
}
function vegetationTint(x: number, z: number): number {
  return ground.attribute(1, x, z);                       // same macro tone the ground uses, so grass and soil agree
}
```

### What is and is not in the contract

* **In:** lattice-scale composition (≥ ~8 m features), wetness, macro tone, exposure, slope.
* **Not in:** sub-lattice presentation (height-blended borders, ≈3 m ecotone breakup, meso patches, anti-tiling). Vegetation should not try to match those; they are below the scale at which a placement decision is visible.

## 3. GPU adapter

* `TerrainMaterialResources(classification, textures, profile)` owns four textures (weights array, attributes, albedo array, surface array). `acquire()` / `release()`; the last release disposes everything.
* `createTerrainMaterial(resources)` returns one `MeshStandardMaterial` shared by all tiles and LODs. Terrain meshes need only `position` (geographic object space) and `normal`.
* Debug views: `resources.setDebug('weights' | 'dominant' | 'slope' | 'wetness' | 'macro' | 'exposure' | 'blended' | 'raw-weights' | 'albedo' | 'detail-normal' | 'lattice')`.
* Profiles: `high` (anti-tiling, meso, triplanar on bedrock), `balanced` (no triplanar), `mobile` (8 m map, 256² textures, no anti-tiling/meso/triplanar).

## 4. Adding a material (MAT-02)

1. Append an id to `MaterialId` and `MATERIAL_ORDER` (never reorder existing ids — layer slots are part of the data contract).
2. Add a `MaterialDefinition` (palette, scales, tints) and a generator in `textures.ts`.
3. Express its distribution in `RULES` + `classify.ts` (weights are layered so the sum stays exactly 255).
4. Materials 5–8 automatically use a second weight layer (`MAT_LAYERS = ceil(N/4)`); the shader loops are already generic.
5. Review data maps (`tools/mat-01/classify-report.ts`), then update the golden hash in `tests/mat-01.test.ts`.

## 5. Dependencies to resolve before integration

| Dependency | Why | Owner milestone |
|---|---|---|
| Final GEO-R02C terrain revision | the classification is a pure function of it; re-run + review data maps | GEO |
| Authored biome / ecology masks | forest/dune/mire intents are provisional art direction | GEO / art direction |
| Drainage / flow accumulation | wetness currently uses distance to water + curvature only | GEO / WTR |
| Trail corridors as data | 4 m lattice cannot carry 2 m trails; needs an overlay layer | ROUTE / MAT-02 |
| Water surface material | ground wetness meets water at the shoreline; WTR-01 should read `attribute(0)` | WTR-01 |
| Physical device measurements | all MAT-01 timings are software-rendered | perf |
