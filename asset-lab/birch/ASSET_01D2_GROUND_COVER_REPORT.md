# ASSET-01D2 — Scalable Grass Rendering & Natural Ground-Cover Validation

**Review recommendation: CONDITIONAL.** Both GPU paths function, four immutable Feh Lu We source geometries/materials retain independent parity, 16 matched Mesh-vs-batched renders have zero changed pixels, 100–5,000 registered tufts are exercised, and resource life-cycle tests pass in real Chromium/WebGL. The compositions still require owner visual review and actual desktop/Android GPU performance qualification. Do not treat CI SwiftShader timings as hardware FPS.

## 1. Repository checkpoint and safety

- Writable repository: `Algolon/Aurora-Rest` **only**.
- Isolated branch: `feature/asset-01d2-scalable-ground-cover`.
- Approved ancestor: `feature/asset-01d1-grass-fidelity@64606fe3df5d2444d0af21683319f6637b8d34f8`; verified its remote HEAD was identical and there was no D2/ground-cover branch or D2 PR before creating this branch.
- Tested implementation commit: `327122a5f964d8b1c51b859969a56af62dd116f7`.
- **Successful all-three-jobs CI:** https://github.com/Algolon/Aurora-Rest/actions/runs/39633069018
- **49 genuine WebGL evidence files:** https://github.com/Algolon/Aurora-Rest/actions/runs/39633069018/artifacts/12360498312 (48 PNG, `ground-cover-metrics.json`).
- **Independent pinned-original-vs-Aurora material regression:** https://github.com/Algolon/Aurora-Rest/actions/runs/39633069018/artifacts/12359787531
- Read-only original source: `Algolon/Feh-Lu-We@17eafb0902833fb1121c77083f9f862eb4ffcd96`.
- A repository root `AGENTS.md` and `docs/PROJECT_INSTRUCTIONS.md` were requested in the assignment but **do not exist** at the approved D1 branch (404; root consists of `.github/`, `README.md`, `asset-lab/`). No replacement policy files were created.
- Only the D2 branch was written. No changes to Feh Lu We, main, WORLD-01B, GEO-R02, the source birch/pine models, the mixed-tree renderer, or D1 geometry/material source files. No PR, merge, deploy, release or world integration.

## 2. Architecture

Added:
- `src/grass/rendering/grassBatch.ts`: dedicated `GrassBatch` with stable IDs, setTransform, setVisible, setVariant, setBrightness, setFade, setCulling, setDistanceCulling, setShadows, update, getStats and dispose.
- `src/grass/rendering/grassFade.ts`: source scale-fade baseline and two isolated visibility experiments.
- `src/grass/groundCoverPlacement.ts`: deterministic, seeded multi-zone placement with irregular boundaries, coherent density waves, open patches, minimum spacing and mixed species.
- `grass/groundCoverShowroom.ts`, `ground-cover.html`: interactive browser lab, four populations, eight camera presets, selectable forced instancing or multi-draw, lighting/shadow and distance controls.
- `tests/groundCover.test.ts`, `scripts/capture-ground-cover.mjs`, `.github/workflows/asset-01d2-ground-cover.yml`.
- Lab-only package script, TypeScript include and evidence ignore extensions.

Both backends reuse the existing generic `getBatchCapabilities` and `resolveBatchMode`. Auto uses native `WEBGL_multi_draw` only if the extension is present; explicit forced multi-draw without support throws. `BatchedMesh` uses one grass material and four non-indexed source geometries, with stable handles and no geometry rebuilding when the camera moves. The fallback uses up to four `InstancedMesh` groups (one per grass variant), with dynamically doubling instance-buffer capacity and compact active instance arrays. BatchedMesh's **declared maximum capacity is fixed**, defaults to 10,000 and is checked; resizing the batch store itself is not part of D2.

The original grass family owns all four geometries and the reference-counted original material/atlas. The batch owns only scene objects and its instance/batch buffers. Dispose a batch *before* releasing its family.

## 3. Source geometry and shader fidelity

| Grass family | Original height | Triangles per tuft | Geometry status |
| --- | ---: | ---: | --- |
| 0 — Short tuft | 0.373 m | 216 | Unchanged |
| 1 — Tall wispy | 0.694 m | 264 | Unchanged |
| 2 — Seed heads | 0.770 m | 720 | Unchanged; most expensive |
| 3 — Broad sedge | 0.401 m | 168 | Unchanged |

The original `indoorLeafMaterial()` reproduction, source `FLW_SURFACE=7`, authored vertex color, FrontSide double-winding geometry, 1024×512 atlas and UVs are unchanged. The D1 pinned-source geometry checks passed again for every attribute. The independent D1 original-source-versus-Aurora material rendering also passed unchanged.

**New matched batching parity:** For each of four variants at world x=0 and world x=4.25, compare a standalone original Mesh against forced InstancedMesh and native BatchedMesh with matched camera, lighting and transforms. **16/16 comparisons have zero changed pixels (RGB maximum delta 0 across all 792,000 pixels per image)**. This explicitly verifies world-space procedural foliage shading with both per-instance transformation paths, not just parity at the origin.

## 4. Ground-cover design and visual evidence

The lab combines four zones: short meadow (variant 0), tall verge (variant 1), selective seed meadow (variant 2), and moist sedge (variant 3). Zones are overlapping rather than rectangular. Generation uses seed 120626, low-frequency density variations, nonuniform clusters, bare gaps, an irregular global edge, separate species selection weights, minimum spacing 0.115 m, randomized yaw, brightness, and modest scale range. Variant 2 uses a lower selection weight because its source model costs 720 triangles. There is no soil/watershed map or permanent biome assignment.

Genuine canvas captures: `2000-{top,walk,short,tall,seed,sedge,transition,approach}.png`, `approach-{extended,close}.png`, `500-shadows-{on,off}.png`, `bench-{500,2000}-{instanced,multidraw}.png`, plus 32 original-vs-backend world-coordinate parity images. The screenshot archive is linked above. Screenshots were generated by Chromium WebGL, **not mocked or fabricated**. Human art-direction approval is outstanding, and the evidence does not automatically establish that transitions, silhouette richness, or source scale fade feel natural.

## 5. Camera fade experiments

| Preset | Draw distance | Fade span | Scale increments | Interpretation |
| --- | ---: | ---: | ---: | --- |
| Source | 13m | 4m | 12 | Exact Feh Lu We scale-fade baseline |
| Extended | 19m | 6m | 18 | Farther grass and finer fade quantization |
| Close | 10m | 3m | 12 | Prioritize near-field detail |

No original grass geometry was reduced or replaced. Every frame recomputes the camera frustum after camera world-matrix update; pure rotation is included and visibility changes are captured across standing, forward movement, turning and returning. Inactive instances are compacted or marked invisible without constructing Mesh objects. No instance color or matrix buffer is uploaded by the instanced backend if neither membership nor transforms changed. Scale fading remains quantized: perception of possible pulses and rings must be assessed visually on a moving hardware camera. Extended/close results must **not** become fixed island defaults.

## 6. Chromium/WebGL performance evidence

Tested GitHub Actions environment: headless Chromium 155, WebGL 2 / ES 3, `WEBGL_multi_draw=true`, software Chromium rendering path (SwiftShader flags). Grass shadow-map configuration: 1024×1024, PCFSoft. Seed, geometry and camera paths are fixed across backends. The table gives the final walking-camera frame of each run. Drawcalls include one ground-plane camera drawcall; shadows were disabled for this population matrix.

| Registered | Visible / culled | Visible triangles | Instanced drawcalls / groups | Multi-draw drawcalls / groups |
| ---: | ---: | ---: | ---: | ---: |
| 100 | 18 / 82 | 4,344 | 5 / 4 | 2 / 1 |
| 500 | 107 / 393 | 34,872 | 5 / 4 | 2 / 1 |
| 2,000 | 413 / 1,587 | 141,312 | 5 / 4 | 2 / 1 |
| 5,000 | 1,067 / 3,933 | 358,608 | 5 / 4 | 2 / 1 |

Last walking-position visibility-update CPU samples (ms, `performance.now`, **single-path observations**):

| Registered | Instanced | BatchedMesh |
| ---: | ---: | ---: |
| 100 | 0.0 (timer resolution) | 0.1 |
| 500 | 0.4 | 0.3 |
| 2,000 | 0.7 | 3.3 |
| 5,000 | 1.1 | 8.8 |

Five repeat `WebGLRenderer.render` submission-duration samples per scenario were saved, with median and sample p95. At 5,000: instanced approximately 0.2 / 0.3ms median/p95; batched approximately 0.5 / 0.7ms. **These are JavaScript submission durations, not frame intervals, GPU time or playable FPS**. rAF frame-interval data and native VRAM measurements are not reliably available in this capture. Browser renderer counters (geometries and textures) are saved in the raw JSON, but are not portable GPU-memory measures. Registered counts deliberately exceed simultaneously visible counts due to 13m range/frustum culling. Multi-draw has fewer scene drawcalls but notably greater CPU visibility-update cost at 5,000; this requires hardware profiling before treating multi-draw as a universal winner.

Cumulative instance update/write counters and buffer reallocations are included in the raw metrics. They are not GPU upload byte totals; backend algorithms update at different granularities. Every benchmark scenario completed with no browser error.

## 7. Shadows

In the 500-instance forced-instancing meadow, **shadow enabled: 9 drawcalls / 69,746 triangles**; **shadow disabled: 5 drawcalls / 34,874 triangles**. Approximate incremental shadow-pass submission cost is four calls (camera-pass ground + four active variants). The scene uses the original grass FrontSide material; no tree alpha foliage depth shader is inserted. The showroom default is **shadows disabled** for dense grass; local nearby-grass shadow casting is available for visual comparison. A distance-restricted per-tuft shadow backend was **not** implemented or qualified: Three.js BatchedMesh's shadow flag is mesh-wide, so true near-shadow subsets require separately grouped batches. This gate remains CONDITIONAL. SHADOW-R01 remains outside scope.

## 8. Resource lifetime, regressions and stability

The real WebGL regression verified **six create/update/dispose cycles**, repeated disposal, scene-child return to baseline, two extra concurrent family owners sharing the same original material, no early material/atlas disposal, exactly one material and atlas disposal at final-owner release, dynamically growing instanced buffers, and successful recreation and fresh WebGL render. No GrassFamily geometry/material is released from `GrassBatch.dispose()`.

**All 3 CI jobs passed**: 24/24 Node tests, strict TypeScript/Vite build, independent pinned Feh Lu We birch/pine/grass geometry parity, independent source material parity, real WebGL 16-pair batched rendering parity, real 100/500/2,000/5,000 benchmark matrix, shadow images and life-cycle checks. No previous tests were removed or weakened.

## 9. Acceptance gates

| Gate | Result | Explanation |
| --- | --- | --- |
| SOURCE FIDELITY | **ACCEPT** | Immutable geometry, normals, colors, atlas, material and source parity |
| BATCHING CORRECTNESS | **ACCEPT** | 16/16 zero-difference Mesh/instance/multi comparisons |
| VISUAL GROUND COVER | **CONDITIONAL** | Genuine eight-view meadow screenshots; owner visual review pending |
| DISTANCE & FADE QUALITY | **CONDITIONAL** | Baseline and alternatives functional; perceptual walking test pending |
| SHADOW QUALITY | **CONDITIONAL** | On/off measured; near-shadow-only separate grouping unimplemented |
| SCALABILITY | **ACCEPT in browser test** | 5,000 registered, bounded 5-vs-2 draws; physical GPU unknown |
| RESOURCE LIFECYCLE | **ACCEPT** | Six cycles, owners/release/recreate and instancing growth pass |
| REGRESSION SAFETY | **ACCEPT** | 24 Node tests, source birch/pine/grass material & geometry parity |
| PERFORMANCE EVIDENCE | **CONDITIONAL** | SwiftShader browser metrics only, not Android/desktop native |

**Final recommendation: CONDITIONAL, ready for owner review—not approved for island integration.**

## 10. Future first-playable meadow recommendation

Use the untouched original four source geometries, begin at **13m / 4m / 12-step** baseline with **shadows disabled** at scale, support forced instanced fallback, and test the **19m / 6m / 18-step** alternative on hardware for view continuity. Keep seed-head variant 2 relatively sparse until native fill/vertex-cost evidence warrants expansion. Make biome densities and any grass shadow policy conditional on the future island terrain/camera design rather than hardcoding the test showroom placement.

Owner review should focus on low-angle silhouette diversity, open-soil patches, irregular cross-zone transitions, seed-head repetition, fade rings during continuous walking, and meaningful trade-offs between grass presence and Nordic ground readability. Subsequent implementation may investigate shadow proximity partitioning, batching CPU-write reduction and separate distant representations, but **none is authorized as part of this D2 checkpoint**.

## 11. Reproducibility and stop condition

```bash
git switch feature/asset-01d2-scalable-ground-cover
cd asset-lab/birch
npm install --no-audit --no-fund
npm test
npm run build
npm run dev
# Browser: http://127.0.0.1:5173/ground-cover.html
# Chromium/Playwright with installed Chrome:
CHROME_PATH=/path/to/chrome npm run capture:ground-cover
```

Stop at this isolated milestone. No merge, deployment, world population, further grass family migration, or main-branch modification.
