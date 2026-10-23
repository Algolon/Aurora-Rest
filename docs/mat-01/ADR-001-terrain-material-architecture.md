# ADR-001 — Terrain material architecture (MAT-01)

**Status:** proposed for review (technical). Art approval is a separate owner decision.
**Context checkpoint:** `feature/geo-r02c-p0-calibration-infra@90d0cb7` (contains GEO-R02B-R1 `b6784a9`).
**Branch:** `feature/mat-01-terrain-material-architecture`.

## 1. Problem

Aurora Rest's ground is a neutral Lambert colour (`0xb4b6b0`) on the GEO-R02B-R1 terrain (WORLD-01B used per-vertex biome colours on an older terrain). We need one reusable ground-material foundation for a ~6 × 8 km island that:

* reads at walking height (centimetres to metres) and from panoramic viewpoints (hundreds of metres);
* distributes materials from geography, continuously and deterministically;
* is independent of tile boundaries, LOD and vertex order;
* gives future vegetation, rocks, trails and water the *same* classification the renderer uses;
* fits desktop WebGL2 and leaves an Android path.

## 2. Verified inputs (repository facts, not assumptions)

| Input | Status | Source |
|---|---|---|
| 4 m canonical heightfield, 1501 × 2001 nodes, x ∈ [−3000, 3000], z ∈ [−4000, 4000] | verified | `public/geo-r02b/terrain.f32`, `features.json:meta.grid` |
| Water-surface level per node (NaN dry, 0 sea, > 0 freshwater) | verified | `public/geo-r02b/water-surface.f32` |
| Eight named catchment polygons, ten named anchors | verified | `features.json:catchments, anchors` |
| Slope, curvature (Laplacian at 12 m), distance to sea, distance to freshwater | derived (pure functions of the above) | `src/terrain-material/fields.ts` |
| Forest / dune / cove / mire / windward intentions | **provisional art direction** (soft masks from catchments and anchors) | `src/terrain-material/rules.ts` |
| Biome map, drainage/flow accumulation, soil depth, wind exposure model | **not available** — listed as `future` | — |

No hydrology, biome or ecological dataset was invented. Every input is labelled in `RULES.inputs`.

## 3. Options evaluated

**A — Vertex colour enhancement.** Per-vertex colour from a richer classification (implemented as a comparator: *Surface → Option A*).
**B — Texture splatting with per-tile/per-chunk weight masks.** Classic splat maps per terrain chunk, tiled detail textures.
**C — Hybrid multi-scale.** One *world-space* classification map for the whole island + a small shared array of tiled detail materials + procedural world-space meso/macro variation + height blending; triplanar only where requested.

### Decision matrix (5 = best)

| Criterion | A · vertex colour | B · per-tile splat masks | **C · hybrid world-space (selected)** |
|---|---|---|---|
| Visual fidelity, walking height | 1 — no sub-4 m detail at all (see `ba-valley-walk-vertex.png`) | 4 | 4 |
| Visual fidelity, panoramic | 3 | 3 — repetition without macro layer | 4 — macro/meso world variation |
| Architectural flexibility | 2 — colours baked into geometry | 3 — masks coupled to chunking | 5 — classification independent of meshes |
| Runtime complexity | 5 | 3 | 3 |
| Texture memory | 5 (0 MB) | 3 — mask per chunk, duplicated borders | 3 — 32 MB map (high) / 8 MB (mobile) + 10.7 / 2.7 MB detail |
| Shader samples per fragment | 5 (0) | 3 (~6–10) | 3 (≈6 typical near, ≈10 in transitions, 4 far; mobile 4–6) |
| Scalability (more materials) | 2 | 3 | 4 — +1 array layer per material, +1 weight layer per 4 |
| Android compatibility | 5 | 3 | 3 — mobile profile drops anti-tiling, meso, triplanar; ALU noise is the main cost |
| Tile / LOD invariance | 1 — colour changes with vertex density | 2 — seams at chunk borders unless padded | 5 — function of (x, z) only; measured pixel-identical re-tiling |
| Shared CPU/GPU classification | 3 | 2 | 5 — same bytes, same bilinear mapping |
| Future biome & water integration | 2 | 3 | 4 — attributes channel (wetness) already shared |
| Maintainability | 4 | 3 | 4 — one rules table, one material table, one shader |

**Selected: C**, restricted to what evidence justified:

* Height blending and world-space anti-tiling were kept because renders showed paint-like edges and a tile grid without them.
* The first meso implementation (a mip-biased second sample of the same texture) reintroduced a repeating 14 m pattern; it was **replaced by procedural world noise**, and detail textures are **high-pass equalised** so no low-frequency blotch can repeat on the tile grid (`tools/mat-01/probe.mjs` isolated the defect).
* **Triplanar is not enabled by default for the island**: only 1.8 % of land nodes are steeper than 60° (7.1 % > 45°), and matched renders with triplanar on/off are visually indistinguishable at review distances (`tarn-steep-triplanar.png` vs `tarn-steep-planar.png`). It stays available per material (bedrock) in the *high* profile for cliffs that later milestones add.

### Rejected

* **A as the solution** — kept only as the far-LOD/fallback idea and as a comparator. Fails walking-height readability and LOD invariance by construction.
* **B** — per-chunk masks recreate the coupling this milestone must avoid (tiling, LOD, border padding) and duplicate the classification per chunk.
* **Photographic / scanned textures** — off art direction and licence burden. All textures are self-authored procedurally.
* **Fully procedural ground in the shader (no textures)** — would put ecological rules in GLSL, duplicating CPU logic, and costs more ALU on Android.
* **Per-material splat textures of different sizes, texture atlases** — array textures avoid atlas bleeding and keep one sampler per plane.

## 4. Architecture

```
TerrainDataSource (adapter)        src/terrain-material/sources/geo-r02b.ts   read-only wrap of R1 artifacts
        │ heights, water, catchments, anchors
        ▼
Classification layer               src/terrain-material/{fields,rules,classify}.ts
        │ MaterialClassification: 4 m lattice, RGBA8 weights (Σ = 255 exactly) + RGBA8 attributes
        ├──────────────► CPU query API   src/terrain-material/query.ts  (vegetation, rocks, audio, trails)
        ▼
Material definition layer          src/terrain-material/{materials,textures}.ts  palettes, scales, tints → tileable textures
        ▼
Rendering adapter                  src/terrain-material/render/{terrain-material,shader,terrain-tiles}.ts
        ▼
Debug & review layer               src/mat-01/*, tools/mat-01/*
```

* **Canonical representation.** `MaterialClassification` is the single source of truth: per lattice node, `weights` (one RGBA8 layer per four materials, sum exactly 255) and `attributes` (wetness, macro tone, exposure, slope). The shader samples it with texel centres on lattice nodes; `TerrainMaterialQuery` performs the identical bilinear interpolation on the CPU. Browser parity: GPU vs CPU max abs weight error is reported in `browser-check.json`.
* **Presentation-only layers** (not part of the contract): sub-metre height blending, sub-lattice ecotone breakup (≈3 m), meso tone and patches, anti-tiling. These change *how* a mixture looks, never *which* materials are present at the lattice scale.
* **Classification runs once** per terrain revision in a Web Worker (≈3.5 s in Node on this container; browser timing recorded in the manifest), never per frame or per tile.
* **One material, one program** for every tile and LOD; resources are reference-counted and disposable (`TerrainMaterialResources`).
* **Normals.** Mesh normals are canonical ±1-node central differences (identical to GEO-R02B). Classification slope is computed from the canonical grid, never from mesh normals, so LOD cannot change it. Mesh normals only drive lighting and the triplanar blend.
* **Mirror convention.** Shader inputs are object-space geographic coordinates; detail normals are converted with `normalMatrix` columns, so the viewer's `scene.scale.x = −1` is handled without special cases.

## 5. Consequences and risks

* **Memory (high/balanced):** classification map 2 × 12.0 MB (+⅓ mips) ≈ 32 MB, detail arrays ≈ 10.7 MB. *Mobile:* map decimated to 8 m (≈ 8 MB) and 256² textures (≈ 2.7 MB). MAT-02 option: attributes at 8 m, or 4-bit packing, if the 32 MB desktop map is judged too large.
* **ALU:** value-noise patches/meso/ecotone cost ~5 fBm evaluations per active material. On mid-range Android this — not texture fetches — is the likely bottleneck; candidate fix is baking patch masks into a small tiling texture. **Unmeasured on hardware.**
* **Logarithmic depth buffer** (inherited from the GEO-R02B viewer) writes `gl_FragDepth`, which defeats early-Z, so the full material shader runs for overdrawn fragments. Worth revisiting in the game renderer.
* **Bilinear weights at 4 m** cannot represent features narrower than ~8 m (e.g. a 2 m trail). Trails need their own overlay layer (backlog).
* **Rules are provisional art direction**; the golden hash in `tests/mat-01.test.ts` makes every change deliberate and reviewable.
