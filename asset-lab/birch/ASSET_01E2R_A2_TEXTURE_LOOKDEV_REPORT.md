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
- \`scripts/capture-rock-a2.mjs\`: captures **35 genuine 1440x900 WebGL PNGs** (material trio, lighting, mapping, closeups and context) plus **nine RGBA texture-map PNGs** and detailed \`metrics.json\`.
- \`tests/rock-a2-textures.test.ts\`: map determinism, alpha/finite channels, seams near 512px tile borders, materially distinct designs, sparsity of cracks, unchanged G1 invariants.
- \`.github/workflows/asset-01e2r-a2-rock-texture-lookdev.yml\`: original-source diff guard, existing tests, strict TS/Vite, independent birch/pine/grass/rock parity, actual browser shader compilation and WebGL artifacts.
- First evidence run before contrast calibration: [39827063939](https://github.com/Algolon/Aurora-Rest/actions/runs/39827063939) — 35 genuine WebGL views captured but regression job failed on nullable texture-preview buffer TS type (later corrected). The corrected second run [39827210350](https://github.com/Algolon/Aurora-Rest/actions/runs/39827210350) passed both CI jobs (39/39 tests, build, source parity and WebGL captures).

**Latest post-art-calibration CI and screenshots:** inspect branch's current GitHub Actions record and append the actual run/artifact links from the successful final checkpoint; do not mistake the earlier pass's screenshots for the revised materials.

## 7. Art-direction assessment — OWNER DECISION REQUIRED

The study is a **texture lookdev**, not a geometry review. Existing R04/G1 coarse planar mass is intentionally retained.

- **T1** is the safest common stone-language candidate. Its restrained weathering leaves the silhouette legible across face normals, and it should serve as the default against which the other variants are judged.
- **T2** contains the most intentional geological information, but individual linework must read as embedded in stone rather than repeating printed decals. Under grazing light inspect the relative visibility of cut lines and texture vs G1 structural faults.
- **T3** offers environmental storytelling suited to shoreline/wetland placements but should not become the universal rock palette by default. The localized moss must remain sparse and geographically plausible; do not overfit to a single studio camera.

**Provisional technical/art-direction recommendation:** use T1 as *baseline material language*, evaluate T2 as a restricted fractured hero variant, and reserve T3 for coastal exposure. **This is not final art approval**: comparison screenshots must still be reviewed and the owner selects whether any T merits promotion. If post-calibration textures are still visibly too subtle, do not compensate by sculpting new faces, and do not ship them as premium merely because CI passes.

## 8. Protected scope and stop

This branch contains additive A2-specific material, showroom, map/tests, capture, report and CI files only; no changes to E2R-A1 G1 source, Feh Lu We, production rocks, approved nature assets, GEO-R02, WORLD, Aurora main, deployment, merging or island integration.

**STOP AFTER A2 — ART REVIEW PENDING.** Do not generate rock-family variants, alter G1 geometry or select a winner on behalf of the owner.
