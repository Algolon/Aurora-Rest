# ASSET-01B2 — Scalable Birch Rendering, Batching & LOD

**Verdict: CONDITIONAL** — both rendering backends, original source geometry, source-matched visual fidelity, shadow material, LOD logic, browser execution and 1,000-tree bounded draw calls are verified. Physical GPU performance, a hardware browser without multi-draw, representative end-to-end frame intervals and fully receiver-aware shadow culling are not verified.

## Repository and authorization

- Project: Aurora Rest, repository: `Algolon/Aurora-Rest`.
- Correction branch (this deliverable): `feature/asset-01b2-birch-batching-lab`.
- **Verified implementation SHA**: `effa1831a028e788eb3c019c6ed2e4929a122c42`.
- **Explicit one-time branch-policy exception**: owner authorized branching from `fix/asset-01b1r-birch-shadow-fidelity@dfc6b56f98cc560f6debce9b4e1fb3237069ef74`, not default `main`. The source SHA was re-verified and no ASSET-01B2 branch existed before creation. General `AGENTS.md` instructions were not changed.
- Asset reference (read only): `Algolon/Feh-Lu-We@17eafb0902833fb1121c77083f9f862eb4ffcd96`, particularly `src/world/vegbatch.ts`, `boslustSample.ts`, and `vegetationLod.ts`.
- **Successful code CI**: https://github.com/Algolon/Aurora-Rest/actions/runs/39561849672
- **Genuine 19-image browser artifact + measured JSON**: https://github.com/Algolon/Aurora-Rest/actions/runs/39561849672/artifacts/12329245167
- No local checkout was available; no local git/build/browser success is claimed. Writes were through the GitHub connector and validations executed on GitHub Actions Linux.

All Aurora main, WORLD-01/01B, Feh Lu We and earlier ASSET-01B1/01B1R source branches remain unmodified. No merge, PR, deployment, release, world integration, extra species or subsequent asset milestone.

## Architecture

Source-faithful baseline geometry and shaders stay exactly as approved: `src/geometry.ts`, `src/foliage.ts`, `src/materials.ts`, `src/lod.ts`, `src/rng.ts` and the original unit tests are unchanged. The family factory still assigns its shared `vegetationDepth` for conventional meshes.

New world-independent modules:

- `src/rendering/capabilities.ts`: read actual WebGL `WEBGL_multi_draw` extension; `auto` chooses BatchedMesh only if present, `multidraw` errors explicitly if unsupported, `instanced` always forces the fallback.
- `src/rendering/natureBatch.ts`: `createBirchBatch({scene,renderer,family,mode,capacity,...})` with stable `add` IDs, `setTransform`, `setTint`, `setVariant`, `setVisible`, forced LOD and visibility controls, explicit camera `update`, `getStats` and `dispose`. The owner disposes the batch **before** the shared family.
- `src/rendering/batchedRenderer.ts`: one `THREE.BatchedMesh` with the 9 original indexed geometries loaded once, geometry-ID switching, per-instance transforms/colours/visibility and existing alpha-aware depth material. Fixed instance capacity is explicit (default 1,100), with an error rather than overflowing it.
- `src/rendering/instancedRenderer.ts`: one `THREE.InstancedMesh` per active original geometry key, at most 9; avoids THREE's one-instance-per-draw BatchedMesh fallback. Power-of-two capacity growth disposes owned internal instance buffers/meshes, but does not dispose the borrowed source geometries/atlas/material/depth. Only updates changed instance lists or dirty matrices/colours.
- `src/rendering/visibility.ts`: per-instance source-geometry bounding spheres, camera frustum and distance exclusion, conservative sun-aligned swept shadow-retention volume. Unlike production island streaming, this uses no terrain/world-cell assumptions.
- `benchmark.html` and `benchmark/main.ts`: standalone interactive real Three.js benchmark with fixed-seed populations (1/100/500/1000), mode/LOD/shadow/culling/camera controls and visual diagnostics.

The existing source hybrid thresholds [22, 36, 62] m, 3m hysteresis and shared far/xfar geometry remain unchanged. Instances retain previous LOD state. Camera orientation changes cause culling updates; unchanged camera and instance configuration avoids buffer repacking. The camera colour material still contains the **single** linear birch tint; the per-instance RGB multiplier is `requestedTint / sourceLeafTint`, so the source leaf tint is not multiplied twice. The bark/leaf ratio already encoded into source geometry stays unchanged.

**Shadow correctness**: both backend meshes explicitly use the **same** cached `family.material.userData.vegetationDepth` from ASSET-01B1R. There are no extra shadow textures, shaders, global ShaderChunk edits or owned colour materials.

## Actual GitHub Actions validation

- 9/9 tests pass (including added capability/LOD/frustum regressions); TypeScript no-emit and Vite production build pass.
- Original Feh Lu We geometry runtime independently tested against the pinned commit: all 3 variants × near/mid/far × wood/leaves retain matching hashes of position, normal, UV, vertex colours and indices, plus bounding spheres.
- Chromium **155**, WebGL **2.0 (OpenGL ES 3.0 Chromium)**, WebGL renderer string `WebKit WebGL`, SwiftShader/software; `WEBGL_multi_draw` **present**. This establishes functional multi-draw in this browser, **not** physical GPU speed.
- Both backends compile the actual camera and alpha-aware shadow-pass materials, produce genuine PNGs and complete tests with no unexpected browser console/page errors.
- Single-tree original ASSET-01B1R reference versus fallback and BatchedMesh: **zero differing pixels above RGB tolerance 12**; `peakChannelDifference=0` for reference vs fallback. Each comparison uses 1280×900, identical camera, light, tree geometry, scale, orientation, source tint and shadow settings.
- At 100/500/1000, comparing matching fallback and BatchedMesh forest overview PNGs gives respectively **2/35/74** pixels differing by more than RGB 12 out of 1,152,000 each (measured separately from screenshot JSON). Differences are localized raster/shadow-edge-level noise, not silhouette or palette changes.
- Explicit forced fallback exercised **even though** multi-draw extension exists. Unsupported forced multi-draw is covered by the unit-level capability selector; a real physical browser *without* the extension was not available.

### Benchmarks (real WebGL renderer counters)

1280×900 DPR1, 1024² directional shadow map, same deterministic placement seed `952742`, 3 variants and mixed automatic LOD, fixed overview camera and lighting. The counts include ground and separate camera/depth render passes. The actual camera-pass counts were measured again with shadows disabled and subtracted from total, not guessed from object count.

| Trees | Path | Camera visible | Shadow only | Active groups | Camera calls | Shadow calls | Total calls | Active geometry triangles |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | Instanced | 91 | 8 | 4 | 5 | 4 | 9 | 44,296 |
| 500 | Instanced | 458 | 38 | 5 | 6 | 5 | 11 | 221,480 |
| 1,000 | Instanced | 916 | 78 | 6 | 7 | 6 | 13 | 443,918 |
| 100 | Multi-draw | 91 | 8 | 1 | 2 | 1 | 3 | 44,296 |
| 500 | Multi-draw | 458 | 38 | 1 | 2 | 1 | 3 | 221,480 |
| 1,000 | Multi-draw | 916 | 78 | 1 | 2 | 1 | 3 | 443,918 |

LOD mix for 100/500/1,000: `near=0/0/0; mid=1/2/5; far=18/115/233; xfar=80/379/756`. Far and xfar share exact geometry. The large overview naturally contains predominantly distant trees; the separate close-grove and walk screenshots exercise nearby silhouettes.

Instanced render-buffer updates on first population: 8/10/12; buffer growth events: 3/3/3. Batched initial per-instance setter operations: 300/1500/3000; no capacity reallocation. When no transform/view/LOD/visibility changes occur, no additional buffer-upload ranges are requested.

**Performance measurement qualification**: the JS `performance.now()` interval surrounding immediate `renderer.render` calls in the automated sampling yielded median **0.3–0.5 ms** and p95 **0.6–3.3 ms** depending on population/path (7 samples for 1,000; 10 for 100 and 500, following three warm-up samples). These are **CPU submission wall-times, not complete frame time, GPU time or FPS**. The SwiftShader runner took minutes to finish the visual workload, indicating the submission numbers do not represent perceived runtime responsiveness. End-to-end rAF frame-interval median/p95, true GPU timer queries, VRAM, mobile FPS and physical desktop FPS remain **unverified**, not zero or silently accepted.

### Visibility, shadows, LOD and lifecycle

- Camera rotation in place (100-tree sample) changes camera-visible count **41 → 30**, shadow-only count **10 → 12**, excluding **49 → 58**, showing actual orientation-dependent visibility rather than position-only checks.
- Dedicated 100-tree shadow viewpoint retains **12 offscreen shadow casters** alongside 57 camera-visible trees.
- Reproducible camera path 30 → 24 → 26 → 40 → 33 → 38 → 66 → 60 → 58 → 34 → 18 m demonstrates near/mid/far/xfar transitions and reverse hysteresis without regenerating meshes. No cross-fade is present; original source-geometry popping remains possible.
- 5 repeated `createBirchBatch`/dispose cycles preserve scene child count and borrowed family alpha-depth and atlas materials; original ASSET-01B1R last-owner material lifecycle also remains covered by its unchanged tests.
- Alpha-cutout bark and foliage shadows are visibly source-faithful for the single-tree pixel-match and populated shadow scene. Conservative shadow sweeping intentionally over-retains some foliage; full terrain-dependent caster-to-receiver culling remains future work.

## Evidence index

Actual PNGs and JSON are in the successful workflow artifact linked above:
- `reference-single-tree.png`, `instanced-single-tree.png`, `multidraw-single-tree.png`: pixel reference, matched camera and alpha shadows.
- `instanced-{100,500,1000}-overview.png`, `multidraw-{100,500,1000}-overview.png`: identical deterministic woodland populations.
- `instanced-500-grove.png`, `instanced-100-approach.png`, `instanced-100-rotation-{25,205}.png`, `instanced-100-shadows.png`: dense, approach, orientation, shadow viewpoints.
- `lod-path-{0-30,3-40,6-66,9-34}.png`: LOD traversal states.
- `metrics.json`: original complete browser metadata, raw benchmark rows, colour-pixel check, visibility, LOD path and disposal checks.

To run locally on an appropriate machine: `cd asset-lab/birch && npm install && npm run dev`; open `http://127.0.0.1:5173/benchmark.html`. Inspect rendering-mode readout, manually force `instanced`, and test 1/100/500/1000, dynamic camera rotation, LOD boundaries, and shadows. Run `npm test` and `npm run build`. Physical Android test should use Chrome DevTools/WebGL capabilities, measured steady-state frame intervals, Chrome GPU process telemetry where available, and repeated camera paths; the standalone lab is **not** deployed.

## Known boundaries, acceptance and future integration

- **Fidelity**: geometry, source tint and alpha shadows pass; small per-pixel differences at large populations do not indicate visible art degradation.
- **Multi-draw**: extension present and proven; **no physical-GPU validation**.
- **Fallback**: proven forced fallback; at most 9 groups; missing-extension selection tested at code level, not directly on Android.
- **LOD**: deterministic hysteresis and far/xfar sharing proven; source LOD transitions may still pop.
- **Visibility**: camera-rotation and swept-shadow tests pass; conservative approximation could retain more than necessary, and may require refined long-shadow/cell cases later.
- **Performance**: bounded draw submissions demonstrated through 1,000 trees, but **no device FPS/GPU/VRAM acceptance**, and no full frame-interval distribution.
- **Lifecycle**: local scene GPU buffer resources released independently of owned source family; five repeated cycles pass.

| Gate | Verdict |
| --- | --- |
| GEOMETRY FIDELITY | ACCEPT |
| VISUAL FIDELITY | ACCEPT (matched runtime source pixels and populated shots) |
| MULTI-DRAW | ACCEPT for Chromium software WebGL functionality; physical GPU remains unverified |
| INSTANCED FALLBACK | ACCEPT for forced fallback and bounded group calls |
| LOD STABILITY | ACCEPT for state switching/hysteresis; inherent transition popping documented |
| VISIBILITY & SHADOWS | CONDITIONAL (conservative approximate shadow coverage) |
| PERFORMANCE EVIDENCE | CONDITIONAL (bounded draw calls; not hardware frame-time/FPS) |
| RESOURCE LIFECYCLE | ACCEPT (five cycles; source-owned material protection) |
| TECHNICAL VALIDATION | ACCEPT (tests/build/parity/real WebGL capture/CI) |

**Overall: CONDITIONAL**, pending physical-device performance and end-to-end frame timing, plus future shadow-receiver validation if deployed in a large island world. ASSET-01B2 stops here. Do not merge/deploy/integrate WORLD-01/01B or start other asset families without express authorization.
