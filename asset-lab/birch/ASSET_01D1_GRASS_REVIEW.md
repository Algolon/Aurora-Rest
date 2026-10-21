# ASSET-01D1 — Grass Family Fidelity Migration & Visual Validation

**Review decision: CONDITIONAL pending owner art approval** — four production geometries independently match the source byte-for-byte; four-variant showroom, material configuration, source-palette data, lifecycle and all prior tree regressions passed. A second Chromium session separately rendered original pinned Feh Lu We grass and the Aurora extraction with identical cameras and lights: the resulting four pairs of original/Aurora PNGs are **byte-identical**. The complete source-material comparison has now passed in the final CI run, in addition to the original showroom and all geometry/build regression jobs. No large grass instancing, island placement or grass field optimization is authorized here.

## Safe repository checkpoint and provenance

- Sole writable repository: `Algolon/Aurora-Rest`.
- Branch: `feature/asset-01d1-grass-fidelity`.
- **Verified grass implementation and material parity harness checkpoint:** `0c472726387aab72bdcba72a64e68dd11c3b219d` (the latest change is only to the independent browser test fixture).
- Explicit one-time owner authorization to branch from `feature/asset-01c2-mixed-forest-batching@5f87d08a430051c9656e7bf44d1dfdc4f784f85d` (source HEAD reverified before branching). C2 CI succeeded: https://github.com/Algolon/Aurora-Rest/actions/runs/39597895913 .
- Reference *only, READ-ONLY*: `Algolon/Feh-Lu-We@17eafb0902833fb1121c77083f9f862eb4ffcd96`.
- **Full successful ASSET-01D1 CI (all 3 jobs):** https://github.com/Algolon/Aurora-Rest/actions/runs/39623666161 — 21/21 Node tests, TypeScript/Vite, original birch/pine/grass source parity, standalone grass Chromium screenshots and original-source-vs-Aurora material pixel parity.
- **Genuine 24-image WebGL browser artifact / metadata:** https://github.com/Algolon/Aurora-Rest/actions/runs/39623666161/artifacts/12355503353 (includes `grass-browser-metrics.json`).
- **Successful original source-vs-Aurora WebGL material comparison:** https://github.com/Algolon/Aurora-Rest/actions/runs/39623666161/artifacts/12356237482 — four original/Aurora screenshot pairs and `matched-materials.json`. All four show **0 changed pixels out of 576,000** (max RGB difference 0); paired PNG bytes are SHA-256-identical. The original source was served read-only via Vite with its GitHub Pages `base` disabled for this test; the shader/geometry remained untouched.
- No local clone/worktree was available to inspect, no local tests/renders claimed. All writes used connected GitHub tooling, tests took place in GitHub Actions. No commits in source Feh Lu We or any other repository.

Original accepted birch, pine, mixed-forest batches, source geometry/materials, prior CI, WORLD-01B/GEO-R02, Aurora main and all other project branches remain unchanged. Only the new D1 branch was written. No PR/merge/deployment, no island runtime integration or D2.

## Critical production-route research — verified

The production Feh Lu We browser defaults at the **pinned original source commit** are:

| Flag | Production default | Effect |
| --- | --- | --- |
| `NATURE_STYLE` | `woodland-r02` | `FULL_NATURE=true` |
| `vegdetail` | `r05` | `VEGETATION_DETAIL=true`, `GROUND_DETAIL=true` |
| `gardenart` | `r09` | `GARDEN_DETAIL=true`, `INTERIOR_GREEN=true` |

The original `PlantBatch.add('grass',v,...)` calls `referencePlantModel('grass',variant)` whenever `FULL_NATURE`, using `GROUND_DETAIL=true` and `GARDEN_DETAIL=true` by default. `PlantBatch.build()` selects **`indoorLeafMaterial()`** as its outdoor plant material under `INTERIOR_GREEN=true`, rather than `woodMats().flat`.

**Important distinction:** The r09 garden flag does **not** replace the 9/11/8/7 main grass blades with `gardenLeaf`. The core grass strips are produced by the original `Tris` geometry with three folded blade sections and doubled reverse winding with up-biased normals. The refined garden generator is active on variant **2 seed headlets** via `gardenLeaf` (12 authored mini-blades, 6 segments, across=2, textureFamily=1). Main strips become `gardenSmoothNormals(base)` and `whitePlantUV(base)` (exact UV `[.875,.25]`) before merging with garden headlets and their tile-1 UVs. Every variant uses the same indoor foliage texture atlas/material under this normal browser route, even outdoors. Variant 0/1/3 do not acquire extra rounded blade geometry, whereas variant 2 does.

The independent real pinned source-runtime parity harness explicitly sets `location.search='?vegstyle=woodland-r02&vegdetail=r05&gardenart=r09'` **before Vite SSR loads the source modules**, checks all six computed flag values, then compares the real `referencePlantModel('grass',v,true,true)`. This avoids the known **incorrect Node defaults** caused by `location` being unavailable. Diagnostic `grassModel()` and `referencePlantModel(...,true,false)` are separate, expressly **not** substituted as the accepted production models.

Other original source implementations inspected: `src/world/woodkit.ts` (grass + Tris + stem + blade), `src/world/gardenkit.ts` (gardenLeaf and smooth normals), `src/world/indoorPlants.ts` (whitePlantUV and indoorLeafMaterial), `src/world/foliageStyle.ts`, `src/world/boslustSample.ts` (PlantBatch), `src/world/vegbatch.ts` (backend semantics), `src/world/surfaces.ts` (foliage surface shader) and `src/core/rng.ts`.

## Independent source geometry validation

Source comparison imports original Feh Lu We's **real original production runtime**, not Aurora's own grass implementation. The source clone's HEAD must be exactly `17eafb0902833fb1121c77083f9f862eb4ffcd96`. For each of four variants every raw `position,normal,color,uv,index` is independently SHA-256 compared for count, item-size, bytes and content. Bounding box, bounding sphere, topology and triangle counts are also checked; all passed.

| Variant | Original role | Height (m) | Vertices | Triangles | Indexed? | Attribute storage |
|---|---|---:|---:|---:|---|---:|
| 0 | Short tuft | 0.3733 | 648 | 216 | No | 28,512 bytes |
| 1 | Tall wispy | 0.6943 | 792 | 264 | No | 34,848 bytes |
| 2 | Seed-head grass | 0.7700 | 2,160 | 720 | No | 95,040 bytes |
| 3 | Broad arching sedge | 0.4013 | 504 | 168 | No | 22,176 bytes |

The high cost of variant 2 is actual authored garden-detail seed-head geometry, not a duplication defect. The original UV/normal topology and color gradients are preserved; there are no grass transparency billboards or alpha overdraw. All four use metres, and their unique seeded geometry hashes are stable. Basic variant 2, as a diagnostic, differs: `grassModel(2)` has 840 vertices and no UV, and r05 **non-garden** `referencePlantModel(2,true,false)` has 1,152 vertices and no UV; accepted r09 reference has 2,160 vertices **with** UV.

## Aurora implementation and material reconstruction

New files:

- `asset-lab/birch/src/grass/geometry.ts`: small source-extracted original `Tris`/twoSided, leaf/stem helpers, gardenLeaf, gardenSmoothNormals, whitePlantUV and production grass branch; explicit optional basic and non-garden diagnostic presets.
- `asset-lab/birch/src/grass/materials.ts`: original `indoorLeafMaterial()` 1024×512 seven-family seeded canvas atlas, colour space `SRGBColorSpace`, anisotropy 4, `vertexColors=true`, `FrontSide`, with source `SURFACE_PARAMS.foliage=[8,.15,0,0,.09,.84]`. Reproduces the original foliage surface GLSL via **material-local `onBeforeCompile`**, instead of Feh Lu We's **global ShaderChunk install**, which is prohibited for Aurora trees. Shader construction uses the original profile and linear source colors. Source material's default white multiplier remains unchanged.
- `asset-lab/birch/src/grass/index.ts`: `createGrassFamily({preset:'flw-production-reference'})`; `getGeometry(v)`, `createMesh(v)`, `dispose()`. Only four original variants. Nine tree geometries/tree LOD/shadow-specialized material rules are deliberately not forced onto grass. Family geometry is cached by each family instance, and the production material/atlas are shared via reference counting across owners. Last-owner release disposes AtlasTexture and Lambert material once, recreation generates new objects. Diagnostic nonproduction materials remain separate.
- `asset-lab/birch/grass.html`, `grass/showroom.ts`: isolated 1100×720 browser inspection with all four side-by-side, metric ruler, individual variants, normal 3/4 and top/low camera, blade-fold close-up, seed head and sedge close-ups, neutral/Nordic lighting, shadow controls, orbit, zoom and explicit diagnostic route switch.
- `asset-lab/birch/tests/grass.test.ts`, `scripts/compare-grass-source.mjs`, `scripts/capture-grass.mjs`; optional independent `scripts/compare-grass-material.mjs`.
- New `.github/workflows/asset-01d1-grass.yml`, lab npm script extensions and ignore patterns. Nothing in existing birch/pine/mixed tree modules changed.

**Material qualification:** Chromium compiled the source foliage surface profile `FLW_SURFACE=7` with its original 1024×512 atlas, authored vertex colours and FrontSide material, with no inappropriate tree vegetationDepth. The original globally installed Feh Lu We foliage ShaderChunks were reproduced via a material-local shader hook to avoid any tree material mutation. **Separately hosted real source-vs-Aurora WebGL PNGs are byte-identical for all four grass variants**, not just similar under a colour threshold; source and Aurora images shared the same camera and lights. This directly verifies the combined UV/atlas/color/shader behavior. Owner art-direction approval remains a separate decision.

## Genuine browser visual evidence and resource/lifecycle

**Successful Chromium 155 / WebGL 2.0 (OpenGL ES 3.0 Chromium), renderer `WebKit WebGL`, SwiftShader software** browser tests: 24 real canvas PNGs and metric JSON. Captures include:

- `production-all-four-nordic.png`, `production-all-four-neutral.png`.
- `production-variant-{0,1,2,3}-{threequarter,low-angle,top,blade-close}.png`.
- `production-seed-detail.png`, `production-sedge-detail.png`, `production-blade-detail.png`.
- `diagnostic-ground-r05-not-production.png`, `diagnostic-basic-grassModel-not-production.png`.
- `production-return-after-switch.png`.

Measured geometry costs are in the previous table. One grass material/one atlas shared by four meshes; the standalone four-model scene reports **15 total calls** (including shadowed ground, scale reference and scene lights) for its original reference frame; this is not a large grass field benchmark.

Browser lifecycle verifies two additional concurrent grass families return the same material; no premature atlas/material disposal on releasing one owner; final owner disposes each exactly once; a new family allocates fresh map and material, renders again without WebGL runtime errors. The current isolated scene creates four individual models, not population instancing. Existing tree materials/shaders and source resources remain isolated.

**Automated suite:** 21/21 Node tests, TypeScript no-emit, Vite production build, independent original birch and pine runtime parity, four grass source geometry parity cases under real browser flags, full grass Chromium/WebGL showroom and **independent 0-pixel Feh Lu We-vs-Aurora material parity**, all successfully executed together in GitHub Actions **`39623666161`**. Physical Android/desktop rendering speed is *not tested* and is not an ASSET-01D1 gate.

## Source PlantBatch knowledge for ASSET-01D2 (NOT implemented)

At the pinned source, `PLANT_SHOW.grass = 13` metres; `PlantBatch` has a default fade span **4 m**; `k=min(1,(show-distance)/fade)`, quantized `kq=round(k*12)/12`, so visible grass shrinks in 12 discrete scale steps over its last 4m rather than alpha-fading. Camera movement of **less than 0.25 m** skips a visibility update; matrix uploads happen only after a quantized scale step changes. Plant variants share one geometry per variant in a `makeVegBatch` with multi-draw if supported and an `InstancedMesh` group per geometry otherwise. In the source grass show distance may be overridden per placement via `PlantBatch.add(...,show=13)`. Do not use 13m/4m/12 bins as mandatory future Aurora biome defaults without hardware/density testing.

ASSET-01D2 may investigate dedicated ground-cover batching, distribution, terrain alignment, density and tile streaming, distance fading, frustum culling, far representation, cross-device shadow policy, lifecycle and real Android performance. None is implemented or implied as accepted by the four-mesh lab.

## Acceptance gates

| Gate | Result |
|---|---|
| SOURCE ROUTE CORRECTNESS | **ACCEPT** — flags and exact original production runtime proven |
| GEOMETRY FIDELITY | **ACCEPT** — four raw source hashes and bounds match |
| MATERIAL FIDELITY | **ACCEPT** — original-vs-Aurora rendered PNG bytes identical across 4 production variants; local foliage shader matches |
| ART FIDELITY | **CONDITIONAL** — genuine source-faithful browser images, owner final review not yet given |
| ARCHITECTURAL REUSE | **ACCEPT** — standalone grass family, no tree shader/batch mutations |
| NON-REGRESSION | **ACCEPT** — original tree files untouched, birch/pine parity + 21 tests pass |
| RESOURCE LIFECYCLE | **ACCEPT** — shared material, last-owner release, recreate-render passed |
| TECHNICAL VALIDATION | **ACCEPT** — all three final GitHub Actions jobs passed, 21 tests, TypeScript/Vite, all geometry parity, grass browser screenshots, matched original-source pixel comparison |

**Overall: CONDITIONAL pending only final owner art-direction review.** Source geometry and matched material images are technically source-identical. No physical-device performance claim is required for the four-model ASSET-01D1 scope.

No merge, deployment, island integration, Feh Lu We modifications, additional grass species, new palette, broad grass batching, ASSET-01D2 or world changes. Stop after this isolated grass fidelity checkpoint and await user review.
