# ASSET-01E2R-A2 — Nordic Granite Texture Lookdev

**Project:** Aurora Rest · Nature Asset Library
**Date:** 2026-10-22
**Authorized source:** art/asset-01e2r-r04-refinement@1ac9b9342bd888fcfdb5f1b31a11562ffe1df353
**Isolated working branch:** art/asset-01e2r-a2-rock-texture-lookdev
**Art status:** ART REVIEW PENDING — no material selected by the owner.
**Scope:** Material-only T1/T2/T3 on the identical original G1 geometry; existing E2R-A1 study and all production sources remain unchanged.

## 1. Skill/capability preflight

The installed ChatGPT skills catalog was inspected, with a specific search for Scenario Textures, texture/PBR and 3D modeling capabilities. There was **no installed Scenario Textures or dedicated PBR texture-generation skill** in the available catalog and no connected tool exposing a texture-generation API. No unavailable skill, image generator or external material asset is claimed. The workflow therefore uses a deterministic, fully source-owned texture algorithm in \`src/rocks/experimental/a2/rockTexturePixels.ts\`. A separate Three.js adapter \`rockTextureLookdev.ts\` builds GPU-friendly \`DataTexture\` maps and keeps texture ownership local.

No 3rd-party stone textures, unverified image assets or generated concept renders are used. The 3D evidence is captured from **actual Three.js Chromium WebGL** via Playwright.

## 2. Immutable geometry anchor

Exactly one object, \`r04StudyGeometry('G1')\`, is instantiated as the geometry source for every study. The approved G1 maintains **136 triangles / 408 nonindexed vertices** with the original two rock components. No sculptural, material or UV changes are made to its source file. The inherited G1 per-face planar UVs remain a reference method, not an edited geometry attribute.

The A2 CI includes a Git diff guard against the verified E2R source checkpoint, covering R04, G1, production rocks, birch/pine/grass and shared nature code. Tests repeat the G1 vertex-count/invariant checks. The independent Feh Lu We source parity checks use the locked production commit \`17eafb0902833fb1121c77083f9f862eb4ffcd96\`.

## 3. Three distinct authored studies

| Study | Art direction | Authored texturing | Normal / roughness |
|---|---|---|---|
| **T1 — Handcrafted Nordic Granite** | Quiet balanced cool-grey granite | Four nonaligned scales of tile-safe, deterministic stone variation, sparse mineral flecks and no decorative cracks | Shallow fine grain; mostly matte rock |
| **T2 — Weathered Fractured Granite** | More geological history without geometry clutter | T1-compatible stone with **three individually hand-placed branching directional crack paths**, nonuniform widths, local low contrast darkening and shallow surface depression | Stronger but still restrained fracture normal response, slightly rougher in grooves |
| **T3 — Coastal Weathered Stone** | Cooler exposed shoreline stone | Cooler palette, irregular coastal patina, a single restrained hairline, lower-zone object-space localized weathering/moss | Medium relief, varied high roughness and locally enhanced patina |

Each study independently generates three repeatable \`512 x 512\` RGBA maps: **albedo (sRGB)**, **normal (linear)** and **roughness (linear)**. A2 deliberately avoids old M2/M3 sine-based parallel diagonal streaks. T2 cracks are a small number of irregular line segments and diminish near UV tile borders rather than being infinitely repeated diagonals.

A deliberately calibrated second art pass raised the visibility of low/mid-frequency grain, T2 fractures and T3 coastal patina **without altering any G1 geometry, lighting or camera presets**. The first pass was too weak visually at walking distance; the final review should judge the post-calibration screenshots only.

## 4. Projection research: original per-face UV vs triplanar

**Original planar:** MeshStandardMaterial's standard map, normal and roughness sampling on the unmodified G1 planar face UVs. Lowest shader cost and preserves original UV language, but abrupt dominant-axis changes can expose unnatural rotations or seam/discontinuity across adjoining differently oriented faces.

**Object-space triplanar:** a local material-only \`onBeforeCompile\` hook samples all three axes for albedo, roughness and normal, weighting by fourth-power absolute **local face normal**. Shallow normal detail is reoriented through the material's view-space axis varyings. Because the projection uses **G1 object coordinates** rather than world position, mapping does not drift under object rotation or translation and its scale is approximately matched to existing \`0.38\` UV texture units per metre. It improves mapping continuity without changing UVs, but has materially higher fragment cost and can still show facet-to-facet gradient/weight changes on discontinuous normals.

**Approximate per-fragment texture fetches:** planar path = 3 (color/normal/roughness); triplanar = 9 (three axes each). This is static shader-sampling count, not a measured GPU performance ratio. T3 also adds a small local only ground-zone mask with smoothed spatial noise. **No global ShaderChunk modifications.** Six study/projection materials share the exact same nine underlying textures.

## 5. Texture memory, renderer and shader complexity

Nine raw RGBA 512px maps: **9,437,184 bytes (~9.00 MiB)** source texels. Estimated full RGBA mip chain **12,582,912 bytes (~12.00 MiB)** per complete three-study showroom; GPU driver overhead, shadow maps and duplicate browser CPU images are excluded. If only **one T** is retained later, its three maps occupy **3.00 MiB base / ~4.00 MiB mip-chain estimate** before compression.

Measured real Chromium/SwiftShader stage-1 geometry/shader frame observations:

| Scene | Whole-scene renderer calls | Whole-scene rendered triangles | Notes |
|---|---:|---:|---|
| T1/T2/T3 neutral, one G1 each | 7 | 818 | Same geometry + changing material only |
| Planar-vs-triplanar matched T1/T2/T3 | 7 | 814 | Same texture bytes and geometry across projections |
| One G1 in existing Aurora nature context | 19 | 11,166 | Actual birch, Scots pine, grass and production rock |

The above renderer counts include diagnostic floor, shadows and markers, not per-rock drawcall or physical Android FPS. For the triplanar variant, the browser captures 9 explicit custom \`texture2D\` instructions per shader source and actual WebGL program count; planar T1/T2 uses native Three PBR map includes. These results are valid only for the standalone test scene and simulated WebGL implementation, not a large island populated with hundreds of rocks. No physical Android GPU frame-time, shader microbenchmark or actual GPU-residency instrumentation was performed.

## 6. Reproducible browser evidence and QA

- \`rock-a2.html\` + \`rocks/a2-showroom.ts\`: standalone G1-only Three.js comparison, material switches, planar/triplanar, fixed front/rear/side/human views, zoom/orbit, neutral/Nordic/grazing light, original M1 reference and vegetation context.
- \`scripts/capture-rock-a2.mjs\`: captures **53 genuine 1440x900 WebGL PNGs** (material trio, lighting, mapping, closeups and context) plus **nine RGBA texture-map PNGs** and detailed \`metrics.json\`.
- \`tests/rock-a2-textures.test.ts\`: map determinism, alpha/finite channels, seams near 512px tile borders, materially distinct designs, sparsity of cracks, unchanged G1 invariants.
- \`.github/workflows/asset-01e2r-a2-rock-texture-lookdev.yml\`: original-source diff guard, existing tests, strict TS/Vite, independent birch/pine/grass/rock parity, actual browser shader compilation and WebGL artifacts.
- First evidence run before contrast calibration: [39827063939](https://github.com/Algolon/Aurora-Rest/actions/runs/39827063939) — 35 genuine WebGL views captured but regression job failed on nullable texture-preview buffer TS type (later corrected). The corrected second run [39827210350](https://github.com/Algolon/Aurora-Rest/actions/runs/39827210350) passed both CI jobs (39/39 tests, build, source parity and WebGL captures).

**Final post-art-calibration and matched-camera verification:** [GitHub Actions run 39828498701 — SUCCESS](https://github.com/Algolon/Aurora-Rest/actions/runs/39828498701), at implementation commit `ab18e304d5d11b31c7072c2fa9aedd29cedd3d33`. Both jobs PASS: 39/39 automated tests, TypeScript, Vite, G1 and protected-sources diff guard, original FLW birch/pine/grass/rock independent parity, Chromium/SwiftShader WebGL and 53 rendered 3D screenshots plus 9 generated texture PNGs. [Original full-resolution artifact 12448071571](https://github.com/Algolon/Aurora-Rest/actions/runs/39828498701/artifacts/12448071571). `metrics.json` reports `errors: []` and unchanged G1 geometry fingerprint `3175a6b2759321ee6a0e8ee024f5f74d2145922cc71590c509d4374520c9ec8e`.

## 7. Art-direction assessment — OWNER DECISION REQUIRED

The study is a **texture lookdev**, not a geometry review. Existing R04/G1 coarse planar mass is intentionally retained. **Matched-camera evidence:** 18 additional single-rock screenshots were captured at identical central positions, identical 3/4 camera, and matched lighting across all three materials and both projection methods. The three-rock perspective views are overview-only and are **not** used to compare form/silhouette because differing off-axis perspectives would confound art critique.

- **T1** is the safest common stone-language candidate. Its restrained weathering leaves the silhouette legible across face normals, and it should serve as the default against which the other variants are judged.
- **T2** contains visible geological information but the matched closeups expose the central failure: its long crossing line segments read more as embossed/engraved strokes laid over unrelated major rock faces than as naturally branching structural fractures. That is **not yet premium geological realism within the stylized target**. Recommend revision of the material's fracture placement/intensity in a separate approved pass rather than broad adoption.
- **T3** has the intended cooler shoreline-blue read, but weathering and localized moss barely show at normal walk distance. It is an interesting restricted coastal palette, not yet convincing as a distinct weathered surface-treatment asset.

**Post-review art-direction recommendation:** preserve **T1 as the provisional palette and material baseline**, not as a finished premium hero stone. T2's present fractures are too prominent and visually disconnected from the major planes to recommend promoting, despite passing geometry and material shader QA. T3 is a conditional optional coastal palette, but its moss/weathering effect needs improved location-coherent visibility before owner acceptance. The three materials are genuinely different and technically validated; *none is automatically art approved*. The owner must explicitly approve or request a separate texture-only refinement. Do not change G1 or proceed to the 10–15-family stage.

## 8. Protected scope and stop

This branch contains additive A2-specific material, showroom, map/tests, capture, report and CI files only; no changes to E2R-A1 G1 source, Feh Lu We, production rocks, approved nature assets, GEO-R02, WORLD, Aurora main, deployment, merging or island integration.

**STOP AFTER A2 — ART REVIEW PENDING.** Do not generate rock-family variants, alter G1 geometry or select a winner on behalf of the owner.

## 9. Final matched-camera metrics and mapping decision

| Measured review case | Renderer calls (whole scene) | Rendered triangles (whole scene) | Shader / note |
|---|---:|---:|---|
| One G1 + T1 triplanar | 4 | 402 | 9 custom texture2D statements; 5,276-char assembled fragment shader |
| One G1 + T2 triplanar | 4 | 402 | 9 custom texture2D statements; 5,276-char assembled fragment shader |
| One G1 + T3 triplanar | 4 | 402 | 9 custom texture2D statements; 5,807-char assembled fragment shader, local moss noise |
| One G1 + T2 planar | 4 | 402 | Unmodified native Three.js PBR map sampling |
| T1/T2/T3 three-object scene | 7 | 818 | Different positions in perspective; use matched single shots for form-constant art comparison |
| G1 + original nature context | 19 | 11,166 | Actual birch, Scots pine, grass and source production rock |

The object itself stays **136 triangles / 408 vertices**. All renderer values include ground, shadow passes and markers and do not imply physical mobile performance. Three studies have mean encoded roughness ~0.908, ~0.908 and ~0.919, respectively. T2 fracture-coverage mask occupies ~**1.37%** of the 512px texels; T3 ~**0.43%**. The UV texture-edge tests pass, but geometric per-face planar mapping can still visibly rotate a pattern across face junctions. Triplanar results yield smoother placement at a ~3× nominal texture-sampling cost, with **only modest image improvement on this particular already-authorial low-poly G1**. For future repeated low-cost stones, prefer planar or a dedicated UV bake; reserve triplanar for a limited number of significant rock assets only if accepted by the owner.

The actual original artifact is [Run 39828498701 — 53 WebGL screenshots, 9 PBR PNG maps, metrics](https://github.com/Algolon/Aurora-Rest/actions/runs/39828498701/artifacts/12448071571). Contact sheets with matched camera/light are delivered separately in the user handoff as crops of the **same real WebGL pixels**, not synthetic 3D art.

**Art status: ART REVIEW PENDING. All protected code untouched. No merge, deploy, island integration or E2R-B.**
