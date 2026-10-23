# MAT-01 — Terrain Material Architecture & First Ground Lookdev

**Status: CONDITIONAL — technically acceptable for review; art review pending.**
Review page: [`review.html`](review.html) (gallery of genuine WebGL captures) · Decision record: [`ADR-001`](ADR-001-terrain-material-architecture.md) · Integration contract: [`INTEGRATION.md`](INTEGRATION.md)

Labels: **implemented** (code exists) · **tested** (automated check passes) · **browser-verified** (observed in real Chromium/WebGL2, SwiftShader) · **proposed** (not built) · **unverified** (no evidence possible here).

## A. Status

| | |
|---|---|
| Milestone result | Conditional |
| Technical acceptance recommendation | **Acceptable for review** — all ten acceptance criteria have evidence (§G) |
| Artistic recommendation | **Promising, not yet art-approvable.** Walking-height forest floor, turf and bedrock read well; panoramic forest/meadow contrast, sand–grass edges and extreme close-ups need a MAT-02 pass (§C) |
| Physical devices | **Unverified.** No GPU in this environment; all timings are SwiftShader software rendering |

## B. Implementation

* **Repository:** `Algolon/Aurora-Rest` (only writable repository; `Algolon/Feh-Lu-We` untouched).
* **Source checkpoint:** `feature/geo-r02c-p0-calibration-infra@90d0cb745e8e51a3dc737bd4dc11d6f8c322758b`. Verified: R1 `b6784a9` ⊂ P0 `90d0cb7` ⊂ A1D `15c0977`; A1D adds documentation only (70 files under `docs/`), so MAT-01 is independent of ongoing GEO-R02C work. No earlier MAT-01 branch existed.
* **Working branch:** `feature/mat-01-terrain-material-architecture` (not merged, not deployed, no PR).
* **Architecture:** Option C — hybrid world-space classification + shared detail-material array (ADR-001).

| Layer | Files |
|---|---|
| Terrain data adapter | `src/terrain-material/sources/geo-r02b.ts`, `types.ts` |
| Classification | `src/terrain-material/fields.ts`, `rules.ts`, `classify.ts`, `noise.ts` |
| CPU query (integration contract) | `src/terrain-material/query.ts` |
| Material definitions + textures | `src/terrain-material/materials.ts`, `textures.ts` |
| Rendering adapter | `src/terrain-material/render/terrain-material.ts`, `shader.ts`, `terrain-tiles.ts` |
| Review environment | `mat-01.html`, `src/mat-01/{main,worker,cameras}.ts`, `style.css` |
| Tools | `tools/mat-01/{capture,browser-check,gallery}.mjs`, `classify-report.ts`, `texture-sheets.ts`, `find-spots.ts`, `probe.mjs`, `compress-evidence.py`, `png.ts` |
| Tests | `tests/mat-01.test.ts` (12 tests) |
| Modified existing file | `vite.config.ts` — one added build input (`material: 'mat-01.html'`) |

## C. Visual results

| Material | Summary | Strongest | Weakest |
|---|---|---|---|
| **M01 Nordic Forest Floor** | olive-umber humus, needle litter, birch-leaf drifts, moss tufts; moss carpets as meso patches | walking-height read (`m01-walk`), leaf drifts | from altitude still a darker slab than meadow; real verdict needs trees on top |
| **M02 Meadow Turf** | dense stylised turf with soil gaps; dry/lush macro tint; soil patches | walking height and elevated (`m02-walk`, `m02-elevated`) — reads as ground cover, not paint | close-up blade contrast slightly busy |
| **M03 Coastal Sand** | warm-grey sand, restrained ripples with heavy-mineral troughs, grit; wet band near the waterline | calm, non-repeating at walking height | sand↔grass edge is a soft smudge; wet band subtle |
| **M04 Nordic Bedrock** | rounded granite, sparse broken joints, foliation, speckle, grey/ochre lichen, weathering streaks on steep faces | walking-height slab read, gravelly appearance at range | extreme close-up (< 1 m) blurs at 6.8 mm/texel |

Evidence: `evidence/` (70 captures + 3 diffs; lit views JPEG q85 re-encodes, diagnostics lossless PNG, listed with captions in `review.html` and `evidence/manifest.json`). Data maps in `classification/` and texture sheets in `textures/` are **data images, not renders**.

**Calibration history (real renders drove every change):** first frames showed chocolate-brown forest slabs, a visible 2.2 m tile grid, pale plaster-like rock and regular sand stripes. Fixes, each verified by re-capture: palette recalibration; RGB compositing instead of palette-index interpolation (removed orange moss halos); rotated anti-tiling sample; *texture high-pass equalisation* + procedural meso (removed the grid that survived anti-tiling — isolated with `probe.mjs`); per-material meso amplitude; leaf drifts; wider canonical ecotone with 30 m interleaving; wet roughness ≥ 0.6 (removed plastic glare); sun-facing bedrock study location.

## D. Technical results

All numbers below are **measured in this container** (headless Chromium 141.0.7390.37, ANGLE → **SwiftShader software Vulkan**). They are *not* desktop or Android GPU results.

| Check | Result | Source |
|---|---|---|
| Re-tiling 400 m → 200 m tiles, shaded frame | **max Δ = 0** over 1,024,000 px (pixel-identical) | `evidence/diff-tiling-tile-seam.png` |
| LOD 4 m → 8/16 m mesh, top-down weights | max Δ 2/255, 0 px with Δ > 4 | `evidence/diff-lod-weights-ortho.png` |
| LOD, shaded perspective | 0.16 % px Δ > 16 — geometry silhouettes/normals only | `evidence/diff-lod-shaded-walk.png` |
| GPU ↔ CPU weights (64 pts, RGBA8 readback) | max abs 0.0033, mean 0.00033 (< 1/255) | manifest `gpuCpuParity` |
| Resource lifecycle | 6 → 2 textures on dispose → 6 on recreate; texture count stays at 6 across repeated profile switches (no leaks) | manifest `lifecycle`, `browser-check.json` |
| Shader compile errors | 0 (all three profiles) | browser gate |
| Programs / draw calls | 2–3 programs total (one terrain program for every tile and LOD); 84 calls walking, 302 island survey | manifest `softwareBenchmark` |
| One-time load (worker) | classification 2.8 s + texture synthesis 1.8 s = 4.7 s; page ready 6.4 s | manifest `runtime` |
| Material GPU memory | high/balanced 41.2 MiB (map 30.6 + detail 10.7); mobile 10.3 MiB | manifest, browser gate |
| Software frame cost, valley walk (1.75 M tris) | high 23.6 s · balanced 16.1 s · mobile 11.5 s · Option A 1.21 s · plain 1.30 s | manifest `softwareBenchmark` |

Interpretation: on a software rasteriser the hybrid shader costs ~18× the plain Lambert at this view, and the profiles scale as designed (mobile ≈ 49 % of high). Ratios on a real GPU will differ (texture fetches are far cheaper on GPUs than on SwiftShader; ALU noise relatively more expensive on mobile). **Desktop 60 FPS / Android 30 FPS remain unverified targets.**


* `npm test` — 41/41 (29 pre-existing + 12 MAT-01): protected-file baseline (244 files, P0 git blobs), heightfield immutability, determinism + golden hash, Σ = 255 at all 3,003,501 nodes, ecological plausibility, CPU query exactness, tiling/LOD independence, quantisation, provenance, palettes, texture tiling/determinism, resource lifecycle.
* `npm run build` — tsc + Vite, including the new `material` entry and worker chunk.
* Browser gate `tools/mat-01/browser-check.mjs` — shader errors, four distinct materials, three profiles, GPU↔CPU parity, re-tiling pixel identity, LOD identity, dispose/recreate.

## E. Design decisions (summary)

Selected Option C because it is the only option that is tile/LOD-invariant *by construction* and shares one classification with CPU systems. Vertex colours (A) were implemented as a comparator and fail walking-height readability; per-chunk splat masks (B) would recouple materials to chunking. Triplanar is retained but not justified by this terrain (1.8 % of land > 60°). Full detail in ADR-001.

## F. Recommended follow-up

**MAT-01 corrections (small, before integration)**
1. M04 close-range crispness: multi-pixel speckle/lichen features or 1024² bedrock layer in the high profile.
2. Sand↔grass edge: give sand a non-zero height-blend contrast against turf and a dune-grass fringe tint.
3. Forest-floor panoramic value contrast: decide with trees in frame (needs POP-01 preview), not in isolation.

**MAT-02 — full ground material library**
* Add dry soil, wet soil/peat, gravel/scree, alpine heath/tundra, forest-floor variants, shoreline wet sand, snow/transition (second weight layer is already supported).
* Authored biome/ecology masks to replace provisional intents; drainage/flow accumulation for wetness.
* Trail overlay layer (sub-lattice width) and route integration.
* Bake meso/patch noise into a small tiling mask texture to cut ALU for Android; attributes at 8 m to halve desktop map memory.
* Hardware measurements on a desktop GPU and a mid-range Android device.

**WTR-01 — water surface lookdev:** read `attribute(0)` (wetness) at the shoreline; the sawtooth water/terrain intersection visible in `m03-elevated` is a geometry/water issue, not a material one.

**POP-01 — procedural population:** consume `TerrainMaterialQuery` (examples in INTEGRATION.md); do not re-derive ecology in vegetation code.

**Dependencies before integration:** final GEO-R02C terrain revision (re-run classification + review data maps), authored ecology masks, art approval of the four materials, device performance evidence.

## G. Acceptance criteria evidence

| # | Criterion | Evidence |
|---|---|---|
| 1 | Architecture decision documented and justified | ADR-001 (matrix, rejected options, measured triplanar finding) |
| 2 | Four representative materials | `materials.ts`, `textures/`, `evidence/m0*-*.{jpg,png}` |
| 3 | Works on actual Aurora terrain | all scenes use `public/geo-r02b/*` (R1, `fc8fd6da…`) |
| 4 | Spatially coherent, biome-aware blending | `classification/*.png`, `island-*.png`, transitions group |
| 5 | No tile seams / LOD-dependent material changes | re-tiling diff, LOD weight diff, tests 7 |
| 6 | Tests and build pass | `npm test`, `npm run build`, browser gate |
| 7 | Genuine WebGL evidence | `review.html`, manifest with SHA-256 per file |
| 8 | Performance implications and device risks documented | ADR-001 §5, manifest measurements |
| 9 | Protected geography and assets preserved | protected-baseline test (244 files); asset branches untouched |
| 10 | Supports MAT-02 without redesign | generic `MAT_LAYERS`, stable layer slots, INTEGRATION §4 |

## Reproduce

```sh
npm ci && npm test && npm run build
npx vite --host 127.0.0.1 --port 4320          # then open http://127.0.0.1:4320/mat-01.html
node tools/mat-01/browser-check.mjs             # real-WebGL gate
node tools/mat-01/capture.mjs                   # evidence (≈1 h on SwiftShader at 1280×800)
python3 tools/mat-01/compress-evidence.py && node tools/mat-01/gallery.mjs
node --experimental-strip-types tools/mat-01/classify-report.ts   # data maps + coverage report
```
