# ASSET-01E2R-A — R04-Preserving Geological Refinement & Material Studies

**Project:** Aurora Rest · Nature Asset Library
**Date:** 2026-10-22
**Authorized branch:** art/asset-01e2r-r04-refinement
**Source:** feature/asset-01e1-rock-family-calibration@33adfb992d907e386bc272dd73716d734191f2bf
**Status:** CI VERIFIED — 35/35 TESTS, TYPECHECK, VITE BUILD, SOURCE PARITY, 37 REAL WEBGL IMAGES; **ART REVIEW PENDING.** No art approval is claimed.
**Scope:** One R04 benchmark, controlled G1/G2 geometry modifications, M1/M2/M3 material exploration. E2R-B prohibited without owner authorization.

## 1. Source, safety and preflight

- Verified the exact E1 source commit through connected GitHub and inspected the E1 calibration report and actual R04 core, adapter, existing showroom, tests and workflow.
- E1 report records a passing prior CI result: [run 39678637647](https://github.com/Algolon/Aurora-Rest/actions/runs/39678637647). This **prior** success does not validate the E2R changes.
- The prescribed AGENTS.md and docs/PROJECT_INSTRUCTIONS.md were absent at the E1 pin (GitHub returned 404 for both); the rejected E2A report also documents their absence. Do not invent policy content.
- The E2R branch did not already exist; it was created directly from the explicit E1 SHA, not from E2A.
- Protected FLW experimental R04: Algolon/Feh-Lu-We@5725a7c08a7ae4dea578c26362881e3e8d60a38c; protected production: Algolon/Feh-Lu-We@17eafb0902833fb1121c77083f9f862eb4ffcd96. Neither source was modified.
- No Aurora main, GEO/WORLD, production rock, birch, pine, grass, batching, deployment, release, merging or island integration changed.

## 2. Why E2A was rejected

Inspected the rejected checkpoint report at a4757935cdabbe07fa333ea536ef3d4851f681e8. E2A introduced three independent cage-based silhouettes (A 144, B 144, C 168 triangles), displacing the R04 sculptural language. Candidate A had overly even faceting, B was rounded/generic, and C resembled an outcrop rather than a boulder. All three were non-approved as final hero rocks. This E2R work reuses R04 and **does not import the E2A generator**.

## 3. Baseline R04: immutable anchor

- Original experimental core remains at src/rocks/experimental/rockSculptR04Core.ts and adapter at r04HeroBoulder.ts, both unchanged.
- E1 verified 84 triangles in the main component and 44 in the frontal slab: 128 total, 384 non-indexed vertices.
- R04 is **two overlapping independent closed solids**. It is not a Boolean union and no manifold union is asserted.
- Preserve main asymmetrical crown, large angular planar faces, wedge/slab frontal mass, ground footprint, stone silhouette and source-authored palette.
- Known concerns from actual earlier E1 WebGL evidence: a schematic front wedge/seam, plain side/rear surfaces, material mismatch against production stone, and a weaker medium-scale detail language than approved vegetation.
- E1 already captured front, rear, both sides, top, three-quarter, human-height, wireframe, neutral/Nordic context views. The E2R screenshot script adds standardized G0 baseline captures for matched comparisons; **their successful generation still requires verification from an E2R CI artifact**.

## 4. Implemented geometry studies

**New files only:**
- src/rocks/experimental/r04RefinementCore.ts — pure deterministic geometry studies.
- src/rocks/experimental/r04MaterialStudies.ts — Three.js BufferGeometry adapter and material experiments.

| Geometry | Design | CI-verified isolated triangles |
|---|---|---:|
| G0 | Exact source R04, untouched | 128 |
| G1 | Source R04 with two hand-placed local incisions plus a 0.033m maximal subtle inward tuck of the frontal-slab upper seam | 136 |
| G2 | G1 plus one restrained rear and one left-shoulder incision | 144 |

The G1/G2 triangle counts are **measured in actual Chromium/WebGL captured renderer metadata** and separately covered by all-passing automated integrity tests (five triangles replace one per localized incision).

Two incisions G1: upper front fault on the main mass and directional bedding within the frontal slab. G2 adds rear joint and left shoulder chip. Triangle perimeters are maintained while interior control points move inward by approximately 0.025–0.050m; no overlay crack meshes are used. Original vertex colors are retained. Planar texture coordinates are chosen per original face dominant axis; cut subtriangles share the original local plane projection.

**Important artistic limitation:** these are short, inward-folded local cuts, not a continuous geological fracture network spanning many polygon faces. This conservative implementation also retains the two overlapping volumes. It is intended to test whether minimal sculptural edits plus materials are sufficient; it is not evidence of a completed premium rock. If the front remains an obvious applied slab or the cuts are invisible at walking distance, return to R04 for a more sophisticated authored face-level chisel pass, not E2A seed-based remeshing.

## 5. M1/M2/M3 material treatments

All material variants can be viewed on identical G1 or G2 geometry; geometry is not independently regenerated by material selection.

| Study | Albedo | Normal / relief | Roughness / weathering |
|---|---|---|---|
| M1 Clean Stylized Granite | Calmest pale stone with small tonal variation | Restrained procedural bump | High roughness, no moss |
| M2 Fractured Nordic Stone | Sparse embedded directional mineral micro-streaks | Stronger but shallow microrelief | High roughness |
| M3 Lightly Weathered Stone | Similar stone, restrained cooler tint | Subtle microrelief | Small lower-zone moss/weathering mask in a *local* material shader hook |

Materials use deterministic, repository-generated 256x256 RGBA CanvasTextures: albedo map, normal map and roughness map for each of three studies; 9 textures in this showroom. Wrapping/noise lattice and periodic mineral patterns were corrected for tile boundaries. Projection is dominant-axis planar **per face**, not full triplanar blending. Certain face-orientation seams can therefore still be visible; the WebGL review must evaluate them honestly.

Estimated uncompressed texture pixels: 9 x 256 x 256 x 4 = **2,359,296 bytes (~2.25 MiB)** before mipmaps, driver allocations or other CPU/GPU overhead. Browser-reported memory/performance is not yet measured.

Materials use MeshStandardMaterial; M3 has a local onBeforeCompile modifier. Existing production stone shader, three.js global ShaderChunks and original surface parity sources remain untouched. Textures/materials have factory-scoped ownership and idempotent disposal. No third-party or unlicensed textures.

## 6. Actual Three.js review infrastructure

New standalone review:
- r04-e2r.html
- rocks/e2r-showroom.ts
- scripts/capture-r04-refinement.mjs

Interactive modes: G0/G1/G2 *neutral* geometry comparison; M1/M2/M3 matched-material comparison with fixed geometry; single study; context with real existing birch, Scots pine, grass and production rock.

Controls: front/rear/left/right/top/three-quarter/human view; orbit and zoom; neutral/Nordic/grazing light; wireframe; renderer metrics. Geometry comparisons deliberately use the same untextured neutral material, while material comparisons keep the geometry fixed.

The Playwright capture script is designed to save matching actual WebGL canvas PNGs to r04-e2r-evidence/, together with metrics.json, capture checks and JS/browser errors. Its set covers the original seven views, geometry comparisons, G1/G2 viewpoints, geometry wireframe, material comparisons under three lighting conditions, texture close-ups and approved-vegetation context.

**Evidence integrity — VERIFIED:** On 2026-10-22, [E2R CI run 39753501673](https://github.com/Algolon/Aurora-Rest/actions/runs/39753501673) completed successfully on code-fix commit `e6824bb96b0c1792bbddb810cad4c985b0a54368`. The **37 actual Chromium/Three.js/WebGL PNGs and `metrics.json`** are in [artifact 12415086035](https://github.com/Algolon/Aurora-Rest/actions/runs/39753501673/artifacts/12415086035). The initial 37-image evidence remains independently preserved at [earlier artifact 12411956655](https://github.com/Algolon/Aurora-Rest/actions/runs/39747354928/artifacts/12411956655); bytewise comparison confirmed that **all 37 PNGs are identical across these two runs**, although their `metrics.json` bytes differ. The browser-report `errors` list is empty and its material lifecycle check records 9 textures created, disposed and successfully recreated. These are actual SwiftShader WebGL captures, **not physical Android GPU testing**.

## 7. QA and regression strategy

Files added:
- tests/r04-refinement.test.ts — determinism, G0 source equality, finite numbers, expected triangle counts, nondegenerate outward winding, exactly-two-edge incidence on each independent component, bounds, metadata.
- .github/workflows/asset-01e2r-r04-refinement.yml — isolated CI on E2R branch, npm test, TypeScript/Vite build, protected FLW production-source independent birch/pine/grass/rock parity, Chromium/Three.js WebGL screenshot generation, artifact upload.
- scripts/capture-r04-refinement.mjs — shader/browser errors, PNG validation, material lifecycle dispose/recreate smoke check.

**Verified A1 execution status:** 35/35 Node tests PASS (0 failed). `tsc --noEmit && vite build` PASS (`vite v8.3.5`, 14 modules transformed, Vite build completed in 231ms in this CI environment). Independent production-source **birch geometry parity PASS** (3 variants × 3 LODs), **pine parity PASS** (nine source models), **grass parity PASS** (4 source variants), **rock parity PASS** (source seeds 11/23/37/53); pinned FLW production SHA `17eafb0902833fb1121c77083f9f862eb4ffcd96` untouched. The Vite source-checkout dependency scanner emitted a **non-fatal warning** about a missing external FLW game/index.html; parity commands still succeeded and the CI job is green. Real Chromium WebGL capture PASS with 37 PNG images and metrics. No Android physical GPU check. Unit manifold-edge incidence cannot prove absence of every possible self-intersection or remove original slab/main overlap.

CI workflow file:
[ASSET-01E2R-A R04 refinement workflow](https://github.com/Algolon/Aurora-Rest/actions/workflows/asset-01e2r-r04-refinement.yml).

## 8. Performance and reuse

- **Actual browser metrics:** G0 128 triangles / 384 vertices; G1 136 triangles / 408 vertices; G2 144 triangles / 432 vertices. R04 still consists of two overlapping non-Boolean-unioned solids.
- 3 separate demonstration MeshStandardMaterial instances, 9 maps, 256x256 each.
- No new asset batching, no island-wide instancing, no LOD or collision implementation.
- One visible R04 model uses one rock mesh/geometry draw call in its normal forward pass, subject to renderer pipeline and possible shadow passes; **whole-scene drawcalls have not been measured** for this E2R showroom.
- Preview material is intentionally allocated once for the three simultaneous comparison objects, enabling reuse across variants. Later production integration requires shared ownership across instances.
- Procedural texture generation cost, real GPU memory, shader variant compile time and physical Android FPS remain unmeasured. The 37-image browser metadata reports 256px textures, 9 distinct texture resources and WebGL 2.0 Chromium under SwiftShader.

## 9. Art critical assessment and decision gate

**Positive / protected:** all G studies derive directly from R04; no silhouette-cage replacement, no regularized triangulated shell, source production rocks intact. Geometry and material effects are separated in the showroom.

**Risks:** (1) the R04 applied slab may still be obvious, (2) four local face incisions may be too shallow and too short to convey believable geological fractures, (3) dominant-axis mapping can reveal seams, (4) vertex-color multiplication by textures could darken the result excessively, (5) material normal detail can compete with the large planes, (6) lower-zone moss styling may read procedural. These must be judged from real browsers, not from source code.

**Current decision: ART REVIEW PENDING.** Real matching images exist and have been compiled into separate large review contact sheets for owner inspection. G1 maintains the source's broad mass with minor local treatment; G2's extra planes look more abrupt from the front; the visible M2/M3 fine parallel surface lines may read overly regular rather than authentically geological. These are **review observations**, not approval decisions. The prominent original front slab/seam remains. Do **not** assign ART APPROVE, ART CONDITIONAL or ART REJECT on behalf of the owner. Technical CI PASS does not confer art acceptance.

## 10. Future 10–15 model strategy — planning only

Provisional shape allocations: A 3 compact angular stones; B 3 broad glacial boulders; C 3 sculptural mid-size rocks; D 2–3 directional fractured masses; E 2–3 landmark boulders. Total selection should be **10–15**, not the full possible maximum (15). Deliberately author distinct mass proportions, crown/shoulder topology, fault directions, base area and contact profile; do not obtain variants by random seeds or axis-rescaling R04 alone.

Share chosen albedo/normal/roughness maps and avoid N unique shader variants. Consider per-family LOD and instancing, proxies and terrain alignment only under a later authorized E2R-B. Cliff and mountain systems are separate geology workflows.

## 11. Traceability, limitations and stop

Scope-limited files have been committed/pushed to art/asset-01e2r-r04-refinement through the connected GitHub repository. Final commit SHA is the tip of the branch after this report is created; verify through its history. No merge, deploy, release, production refactor, source repository write or 10–15 rock expansion was performed.

**Stop after E2R-A1. Technical CI verified. Owner art review is required before any E2R-B.**


## 12. E2R-A1 — Verified CI repair and measured WebGL review (2026-10-22)

### Minimal technical correction
The previous [run 39747354928](https://github.com/Algolon/Aurora-Rest/actions/runs/39747354928) completed with 37 genuine renders but failed TypeScript diagnostic TS2352 at `rocks/e2r-showroom.ts:47`. The three-mesh tuple had been produced by `.map()` then asserted as a three-element tuple. Commit [e6824bb](https://github.com/Algolon/Aurora-Rest/commit/e6824bb96b0c1792bbddb810cad4c985b0a54368) replaced that assertion with one `makeStudyMesh(): THREE.Mesh` helper and an explicit literal three-element tuple. The three meshes, positions, geometry/material generation, lighting and camera settings are **functionally unchanged**. No `any`/`unknown` cast was used.

### Confirmed CI and artifact links
- **All-green implementation run:** [39753501673](https://github.com/Algolon/Aurora-Rest/actions/runs/39753501673) on `e6824bb96b0c1792bbddb810cad4c985b0a54368`.
- **New verified visual artifact (37 PNG + metrics):** [12415086035](https://github.com/Algolon/Aurora-Rest/actions/runs/39753501673/artifacts/12415086035).
- **Original visual artifact, preserved and compared:** [12411956655](https://github.com/Algolon/Aurora-Rest/actions/runs/39747354928/artifacts/12411956655).
- **r04-refinement-regression:** PASS: 35/35 tests, Vite+strict TS check, original birch/pine/grass/rock parity.
- **r04-real-webgl:** PASS: 37 actual WebGL screenshots, no recorded page/console errors, texture lifecycle 9/9 recreation.
- **Evidence consistency:** the two artifact ZIPs contain the same 37 filenames and all PNG image bytes match; their metrics.json files differ. Contact sheets are derived by cropping/labeling the genuine screenshot pixels (no new synthetic model rendering). These are provided directly in the handoff conversation alongside the source ZIP.

### Actual rendered geometry and performance observations

| Scenario | Rendered rock vertices / triangles | Whole-scene Chromium WebGL renderer calls | Whole-scene rendered triangles |
|---|---|---:|---:|
| G0 original alone | 384 vertices / 128 triangles | 5 | 526 |
| G0+G1+G2 neutral comparison | 384/408/432 vertices, 128/136/144 triangles | 7 | 818 |
| G1 with M1/M2/M3 neutral | 3 × 408 vertices, 3 × 136 triangles | 8 | 946 |
| G2 with M1/M2/M3 neutral | 3 × 432 vertices, 3 × 144 triangles | 8 | 994 |
| G0 + G1 + original birch/pine/grass + production rock | G0 128 / G1 136 | 21 | 11,422 |

The above **renderer calls and rendered triangles refer to the entire showroom frame**, including floor, height marker and shadow passes; they are not per-rock GPU-cost measurements. Screenshots captured at 1440 × 900, WebGL 2.0 Chromium/SwiftShader. No Android FPS claims.

### Remaining art acceptance questions
1. Is the G1/G2 structural difference meaningful at human walking distance? Its fracture interventions are deliberately small, and the original applied front slab is still prominent.
2. Does M2/M3's repeated diagonal mineral pattern help or distract from large-scale faceting? Compare neutral/Nordic/grazing plus detail crops.
3. Do G1/M1, G1/M2 or G1/M3 fit the source-faithful vegetation in normal Nordic lighting? Final selection **must be made by the owner**.
4. The contact sheet is a *review convenience*, not a geometry-quality proof. The original 37 full-resolution PNGs and metrics remain the authoritative evidence.

**Final art status: ART REVIEW PENDING. No E2R-B, merge, deployment, production changes or geological redesign.**
