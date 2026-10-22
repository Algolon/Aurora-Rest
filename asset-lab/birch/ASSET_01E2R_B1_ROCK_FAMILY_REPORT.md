# ASSET-01E2R-B1 — Five Nordic Rock Archetypes: Technical and Artistic Review

**Project:** Aurora Rest · Nature Asset Library  
**Date:** 2026-10-22  
**Branch:** \`art/asset-01e2r-b1-rock-family-archetypes\`  
**Authorized base:** \`art/asset-01e2r-a2-rock-texture-lookdev@91a2e0c8fc909a4a25f00e6d5fd621ddb703e6d8\`  
**Final geometry source commit:** \`ca5c16376b8b8e4cc279d32089385e27250d049f\`  
**Verified implementation CI:** [GitHub Actions 39855209243 — SUCCESS](https://github.com/Algolon/Aurora-Rest/actions/runs/39855209243)  
**Genuine browser evidence:** [artifact 12459034546 — 86 screenshots + metrics](https://github.com/Algolon/Aurora-Rest/actions/runs/39855209243/artifacts/12459034546)

**Technical status:** PASS. **Art status:** ART REVIEW PENDING, with explicit recommendations to refine/rework.  
**No owner ART APPROVE for B1. No B2, no merge or deploy.**

## 1. Verification and protected ancestry

- The exact A2 base checkpoint was confirmed before creating B1, with no preexisting B1 branch.
- Repository source inspected: R04/G1 geometry, A2 deterministic Nordic granite texture system and previous CI/browser evidence.
- The named instruction files \`AGENTS.md\` and \`docs/PROJECT_INSTRUCTIONS.md\` were not found at the verified A2 commit (404); their content was not assumed.
- B1 adds only new isolated procedural rock and review files. The original R04/G1, A2 materials, production rocks, source birch, pine, grass, and WORLD/GEO implementations were not modified.
- GitHub Actions verified source-file fidelity relative to A2 using an explicit \`git diff --exit-code\` protection guard.
- Independent original Feh Lu We production source pin \`17eafb0902833fb1121c77083f9f862eb4ffcd96\` remains read-only.

## 2. Two preserved, actually modeled stages

### B1-A — Authored control-cage primary silhouettes

\`src/rocks/experimental/b1/rockArchetypes.ts\` defines five different ordered rock contours and irregular asymmetric crown/shoulder rings. No seed-driven random noise or scaled copies of G1. \`buildRockArchetype(id,'primary')\` remains available for reference and before/after comparisons.

The real first-pass Chromium images revealed a substantial artistic issue: uniform horizontal banding and similar broad triangulated faces, producing a generic low-poly look.

### B1-C — Sculptural geological refinement

\`src/rocks/experimental/b1/rockSculpturalRefinement.ts\` implements R04-inspired major-plane chisel cuts, each archetype using its own authored boundaries and directional cut planes. Broad selected panels have restrained inward folds. \`buildRockArchetype(id,'refined')\` exposes these revised models. Old primary geometry is retained and not silently overwritten.

The second pass reduced uniformly distributed triangles, but it sometimes overcorrects toward overly flat/blocky masses: the revised rocks remain relatively convex single solids, while original G1 gains character from coherent interacting primary masses. Further subdivision alone would not solve this artistic gap.

## 3. Measured model geometry — genuine WebGL evidence

| Prototype | Measured width × height × depth | Ratios | Refined triangles | Nonindexed vertices |
|---|---|---|---:|---:|
| A — Compact Angular Rock | 1.79 × 1.56 × 1.56 m | W/H 1.15 | 62 | 186 |
| B — Broad Glacial Boulder | 5.04 × 1.91 × 2.37 m | W/H 2.64 | 58 | 174 |
| C — Sculptural Mid-Sized Boulder | 3.49 × 2.77 × 2.93 m | W/H 1.26 | 78 | 234 |
| D — Fractured Rock Mass | 4.02 × 3.14 × 3.15 m | W/H 1.28 | 92 | 276 |
| E — Landmark Boulder | 3.45 × 4.82 × 2.97 m | W/H 0.72 | 62 | 186 |

These counts and bounds are taken from the original \`metrics.json\` in artifact 12459034546, not inferred from source code. The G1 style anchor remains unchanged at 136 triangles / 408 vertices.

Prototypes A, B and E are clearly distinct in height/width ratio, while C and D are too similar in proportions (1.26 vs 1.28) and actual large-plane composition to count as sufficiently different approved artistic families.

## 4. Real three-dimensional visual validation

Separate \`rock-b1.html\`, \`rocks/b1-showroom.ts\` and \`scripts/capture-rock-b1.mjs\` provide:

- Six-model gallery including G1, in actual world units and normalized-height mode.
- Seven actual camera directions per rock: front, rear, left, right, top, three-quarter and human height.
- Isolated single-rock views, neutral clay, actual A2 T1 Nordic granite and grazing light.
- Explicit first-pass vs refined paired views; wireframe diagnostics; original Aurora birch, Scots pine, grass and production rock context.
- Limited A2 T2/T3 and original planar-vs-triplanar comparisons on C/D/E.
- A genuine 1800×1000 Chromium/Three.js/SwiftShader WebGL screenshot set of **86 PNGs**, plus renderer metrics and browser errors. The recorded browser error list is empty.

The source WebGL artifact is [12459034546](https://github.com/Algolon/Aurora-Rest/actions/runs/39855209243/artifacts/12459034546). Contact sheets are crops and labeled layouts of these exact original pixels, never generated concept art.

## 5. Critical artistic assessment — not owner approval

| Archetype | Proposed gate for owner's consideration | Evidence and improvement |
|---|---|---|
| **A — Compact** | **ART CONDITIONAL — TARGETED REFINEMENT** | Compact class and scale are useful, but angular crown and large flat base remain schematic. Add one natural displaced shoulder and correct contact silhouette rather than random faceting. |
| **B — Broad Glacial** | **ART CONDITIONAL — TARGETED REFINEMENT** | Clearly low/wide and well differentiated. Front/top still read as a cut wedge or roof and ground contact has an abrupt dark edge. Needs a more natural broad glacial crown and shoulder transitions. |
| **C — Sculptural Mid** | **ART REJECT — REWORK ARCHETYPE** | Still too simple and house/block-like; lacks G1's interplay of multiple large forms. Also overlaps D. Requires a genuinely new mass composition, not cosmetic chipping. |
| **D — Fractured Mass** | **ART REJECT — REWORK ARCHETYPE** | Not a legible faulted geological formation; reads as a single sloping trapezoid similar to C. Needs genuine structural fault language or coherent offset masses rather than more texture cracks. |
| **E — Landmark** | **ART REJECT — REWORK ARCHETYPE** | Clearly tall and recognizable but has an unnatural menhir/obelisk form. Natural erratic silhouette and asymmetric body needed before acceptance. |

No model is approved for production. These assessments are evidence-based recommendations and **must not be confused with the owner's final artistic decisions**.

This B1 exercise demonstrates that handcrafted planes and distinct parameterizations alone are insufficient for premium rock-art quality. G1's broad plane-to-plane hierarchy and multi-mass asymmetry are still better. The correct next iteration is targeted art calibration on these five classes, not automatic expansion into 15 variants.

## 6. Material coherence and rendering performance

- Existing A2 T1 granite is the provisional shared material; T2/T3 remain optional comparisons.
- The Three.js showroom uses the real existing A2 material factory and unchanged Aurora vegetation families. No global shader or source texture changes.
- Planar vs triplanar is available for comparison, but no mapping method compensates for weak silhouette.
- The three A2 studies' nine 512² RGBA maps occupy approximately **9 MiB base texels** / **12 MiB including mipmaps** in the lookdev showroom; materials/textures are shared rather than allocated per rock.

**Recorded whole-frame renderer metrics** (not one-rock GPU costs):

| Scene | WebGL renderer calls | Drawn triangles |
|---|---:|---:|
| Original-scale G1 + five B1 geometry, neutral | 14 | 1,106 |
| B1-A isolated, neutral | 4 | 254 |
| B1-C isolated, neutral | 4 | 286 |
| B1-A with original nature context | 18 | 10,878 |

These numbers include scene floor, marker, shadow passes and other objects. No Android GPU measurements, production collision, batching, world placement or LODs were performed. The low single-asset triangle counts and current shader costs do not establish large-scale landscape performance.

## 7. Tests, integrity, CI

The last implementation commit \`ca5c16376b8b8e4cc279d32089385e27250d049f\` passed both jobs on **[run 39855209243](https://github.com/Algolon/Aurora-Rest/actions/runs/39855209243)**:

- **42/42 Node tests PASS** — existing systems and B1 archetype tests.
- TypeScript typecheck and Vite build PASS.
- Five mesh topologies verified for determinism, finite vertices/normals/UVs/colors, correct winding, positive volume, non-degenerate triangles, closed/two-incidence edges and valid bounds.
- Independent protected source birch, Scots pine, grass and production rock parity PASS.
- Original R04/G1 invariant tests remain green.
- Real Chromium WebGL capture PASS: 86 true PNGs, browser errors empty.

R04-style source validity and browser rendering are substantiated, but tests do **not** establish photoreal geology, real-world rock formation realism, material correctness on every physical GPU, or art approval.

## 8. Recommended next decision — planning only

1. Owner visually reviews original G1 vs A-E, physical/normalized silhouette layouts, primary-to-refined pairs, 360° views, material comparisons and Aurora nature context.
2. Decide whether to pursue a tightly scoped **B1R targeted art calibration** for A/B and substantially rework C/D/E, including natural multi-mass geology without generic triangulation.
3. Approve individual exemplars **only after** they meet the R04/G1 premium style standard.
4. Do not proceed to B2 10–15 variations or island deployment merely because 42 tests passed.

## 9. Safety and stop condition

**Implementation checkpoint:** \`ca5c16376b8b8e4cc279d32089385e27250d049f\`  
**Final report-only commit:** read the new report commit from the branch history. The report commit itself contains **no geometry, material, island, screenshot setting, release or workflow modifications**.

**Status: TECHNICAL PASS / ART REVIEW PENDING. STOP AFTER B1.** No merge, deploy, integration, variants or protected source changes.
