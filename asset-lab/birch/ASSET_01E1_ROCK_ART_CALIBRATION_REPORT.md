# ASSET-01E1 — Rock Family Migration & Geological Art Calibration

**Project:** Aurora Rest · Nature Asset Library  
**Date:** 2026-10-21  
**Status:** Implemented and independently reviewed; art-direction approval is NOT implied.  
**Branch:** `feature/asset-01e1-rock-family-calibration`  
**No merge, release, deployment, WORLD/GEO changes, island integration or R05 sculpting.**

## 1. Verified repository / source checkpoints

| Repository | Reference | Verified pin |
|---|---|---|
| Aurora foundation | `fix/asset-01d2r-ground-cover-visual-calibration` | `0104a97cd3612e1bf1bec12cec1ea537e92d12e5` |
| Feh Lu We production (read-only) | `src/world/woodkit.ts`, `src/world/surfaces.ts` | `17eafb0902833fb1121c77083f9f862eb4ffcd96` |
| Feh Lu We ROCK-R01 R04 experiment (read-only) | `art/rock-r01-geological-assets` | `5725a7c08a7ae4dea578c26362881e3e8d60a38c` |

Aurora's authorized foundation HEAD matched the supplied SHA at preflight; the E1 branch did not previously exist. Source read-only commits were not modified. Existing approved birch, Scots pine, grass and ground-cover implementations remain unchanged.

## 2. Provenance and implementation

### Baseline P — four original production stones

- `src/rocks/productionRock.ts`: source-faithful `rockModel(seed)` extraction and associated source `paint()`.
- Seeds **11, 23, 37, 53** are stable, separate, deterministic geometry configurations. `ConvexGeometry`, `toCreasedNormals(...,0.56)`, planar UV, vertex colors, moss/contact shading and original geometry dimensions preserved.
- `src/rocks/rockMaterials.ts`: dedicated **stone** GLSL surface profile copied from the Feh Lu We stone profile and applied locally via `onBeforeCompile`. No global `THREE.ShaderChunk` changes.
- Original 128 × 128 strata texture recreated with production RNG seed 83, source drawing order, `SRGBColorSpace`, repeat wrapping, anisotropy 4, source Lambert lighting and vertex colors.
- `src/rocks/index.ts`: discrete geometry ownership, stable seeds, shared reference-counted material/texture, mesh creation and idempotent disposal.
- `src/rocks/provenance.ts`: explicit source pins and approval distinction.

### Baseline H — R04 prototype

- `src/rocks/experimental/rockSculptR04Core.ts`: verbatim source sculpt core from experimental commit.
- `src/rocks/experimental/r04HeroBoulder.ts`: source geometry/material adapter, with explicit `artApproved: false`, `productionIntegrated: false`.
- Source `refined` R04 retains **84 triangles** in its main piece plus **44 triangles** in its frontal slab, total **128**, with **384** non-indexed vertices.
- The two pieces are independently closed solids; their overlap does **not** make them one watertight Boolean union.
- No R05 geometry changes were attempted.

## 3. Exact independent production parity

CI runs the *original Feh Lu We `woodkit.ts`* from a checked-out source tree pinned to the production SHA through Vite SSR. It constructs original source geometry and compares against the Aurora extraction independently.

Per seed, **byte-identical** SHA-256 results for **positions, normals, UVs and vertex colors**, including index presence/topology, bounding boxes, bounding spheres and deterministic reconstruction.

| Seed | Triangles | Vertices | X × Y × Z bounds (metres, approximate) |
|---|---:|---:|---|
| 11 | 26 | 78 | 2.22 × 0.84 × 1.66 |
| 23 | 24 | 72 | 1.95 × 1.20 × 1.60 |
| 37 | 24 | 72 | 2.10 × 1.02 × 1.69 |
| 53 | 18 | 54 | 1.80 × 1.02 × 1.73 |

The source rocks are **not naturally pebble-sized**. Any pebbles will require scaled placements / appropriately designed variants in a later milestone. Reuse does not imply approval as all-size boulders.

### Actual original-vs-Aurora stone material pixels

A paired virtual Vite/WebGL studio loads the actual pinned Feh Lu We `woodMats().rock` and Aurora's isolated material adapter **in separate browser scenes** using the same geometry, camera, lights, canvas resolution, source profile and Three.js version.

Observed result with production seed 11: **0 changed pixels / 814,000 pixels (1100 × 740)**. Mean and maximum RGB channel difference = **0**. Original and Aurora output images were independently captured from WebGL. This is an exact result **for the matched reference conditions**, not a guarantee of all runtime lighting situations. Browser error-collection checks are part of the final CI pass.

This establishes visual source fidelity, **not** that the source colors and procedural stone shader satisfy Aurora's final premium look.

## 4. Genuine browser evidence

The standalone `rocks.html` / `rocks/showroom.ts` is a real Three.js/WebGL asset lab, not concept imagery. UI supports original four seeds, R04 experimental, matched comparison, approved Aurora birch/pine/grass context, neutral/Nordic lighting, front/rear/side/top/three-quarter/human-height views, wireframe, shadows, zoom/orbit and geometry metrics.

CI Playwright/Chromium (SwiftShader) captures **20 actual showroom screenshots**:
- Four production seeds in three-quarter view, all-seed studio/Nordic overview, source strata closeup
- R04 front, rear, both sides, top, three-quarter, wireframe and human perspective
- Matched source-vs-hero comparison in neutral and Nordic daylight
- R04 beside **actual approved Aurora birch, Scots pine and grass** in neutral and Nordic lighting

See the newest ASSET-01E1 CI artifacts for `rock-evidence/*.png`, `rock-evidence/metrics.json`, and paired `rock-material-parity/*.png` screenshots and pixel measurements.

**Evidence links:**
- [E1 full 20-screenshot context review, source/regression CI run](https://github.com/Algolon/Aurora-Rest/actions/runs/39677044079)
- [E1 paired original-source material WebGL pixel experiment](https://github.com/Algolon/Aurora-Rest/actions/runs/39678011373)
- [E1 final workflow (source parity + screenshots + material parity)](https://github.com/Algolon/Aurora-Rest/actions/runs/39678280772)

**Important scope:** these are real Chromium WebGL images; **not** physical Android GPU validation, not in-world island screenshots, and not photogrammetric comparison to concept art.

## 5. Critical geological art review

Reference inputs: four owner-supplied rock studies/images, including a premium multi-plane grey hero boulder, simplified rounded stacked boulders (an undesirable stylization extreme), angular stylized rocky formations and natural coastal rocks.

### Production baseline — visual assessment

**Strengths:** faithful, deterministic, very low-cost, angular rather than clay-like; variations are enough to seed less salient loose ground stones. Original strata shader is reproducible exactly.

**Weaknesses:** flat polyhedra are visibly generic, relatively few silhouette interruptions (18–26 triangles), limited fracture/orientation hierarchy, stylized moss reads quite pale/yellow under the bright diagnostic lighting, and details disappear at walking distance. Their physically broad ~2m widths should not be interpreted as small pebbles without scaling.

**Verdict:** **ACCEPT — PRODUCTION ROCK BASELINE** as source-locked reusable geometry/material reference, most promising for Class A and non-hero dressing. Do not confuse this with acceptance as hero-rock style.

### Experimental R04 — visual assessment from actual WebGL

**Strengths:** stronger broad mass and planar hierarchy than source production models; asymmetric top profile; explicit front supporting slab; clearer high-level shape language, consistent with the *direction* of Fortnite-inspired deliberate planes. Good geometry economy for a single landmark boulder.

**Observed limitations:**
1. The front slab dominates and looks like an imposed geometric wedge; the upper seam/central notch reads as a deliberate polygonal construction instead of a credible natural split.
2. Rear and side views are under-articulated compared with the reference rock families; rear appears as a simplified polygon.
3. The large faces remain too empty and geometrically smooth, with little middle-scale geological fracture/weathering.
4. R04 material is different from production stone (flat-colored MeshStandardMaterial vs source textured stone Lambert/profile), making current cross-family color/shading continuity weak.
5. The geometry meets the core hard-surface form objective but does not yet achieve a visually rich, handcrafted Nordic boulder. It should not be treated as an approved premium hero asset.

**Verdict: CONDITIONAL — R04 ART DIRECTION, not model acceptance.** Keep the broader silhouette/plane strategy, but do not promote the current R04 into production. The next art pass should refine only one experimental rock, once explicitly authorized.

### Aurora style compatibility

The real side-by-side approved birch, Scots pine and grass context highlights an artistic mismatch. Trees carry cohesive, multi-scale authored forms, texture and nuanced silhouettes. R04 currently has comparatively large featureless surfaces, no integrated fractures or tasteful moss, and a harder, more diagrammatic facet vocabulary. The thin human height marker confirms scale but does not resolve the stylistic mismatch.

Provisional **geological art gate = NOT ACCEPTED** for R04 as final asset.

## 6. Performance and ownership

| Test scenario | Real WebGL `renderer.info.render.calls` | Rendered scene triangles |
|---|---:|---:|
| Four production rocks + diagnostic surroundings | 9 | 186 |
| R04 only + diagnostic surroundings | 5 | 526 |
| Production + R04 comparison + surroundings | 13 | 710 |
| R04 + approved birch/pine/grass + surroundings | 17 | 11,098 |

These are **whole-scene frame counts**, including shadow passes / marker / floor; they are NOT isolated per-asset drawcall costs. Production rocks use one rock material; R04 uses one separate diagnostic material. The 128-triangle R04 geometry has 384 non-indexed vertices; the source rock geometric cost is 18–26 triangles. Source material and geometry share safe ownership patterns with disposal and caching feasibility, but E1 does not add island-wide batching or collision proxies.

R04 one-off `buildHeroR04` time on headless CI was a few milliseconds; this must not be interpreted as physical device performance. No Android FPS, browser memory stress test, or large world-cell population benchmark was performed.

## 7. Automated checks

- **32/32 Node tests passed** on the isolated branch, including existing nature library regressions and rock/R04 geometry invariants.
- Strict TypeScript check and Vite production build passed.
- Actual original Feh Lu We **birch / Scots pine / grass / rock** source geometry parity passed.
- Original source/adapter WebGL stone material output: **0 changed pixels** in matched 1100×740 comparison.
- Real Chromium/WebGL capture completed with 20 showroom screenshots, browser diagnostics, material metadata and renderer metrics.
- R04 nondegenerate winding and closure of *each component* validated; no assertion of Boolean union.
- Browser capture via SwiftShader; no physical Android graphics validation.
- Unchanged existing source-tree test code was not weakened.

## 8. Geological asset classification and measured next steps

| Class | Intended role | E1 finding | Recommended strategy |
|---|---|---|---|
| **A — Small stones** | Path edges, gravel groups, loose stones | Source rock generator cheap; at source scale too large | Reuse original seed family with scaled/seeded placement; only later add micro-variant if visual repeat noticeable |
| **B — Medium boulders** | Glacial erratics, freestanding rocks | Source lacks enough authored silhouette differentiation | Extend source or build a limited authored procedural family after art threshold is agreed |
| **C — Hero rocks** | Trail landmarks, viewpoint silhouettes | R04 formal language promising but current execution not approved | Targeted single hero R05 art experiment *only after owner approval* |
| **D — Exposed outcrops** | Bedrock emerging from slope/coast | Neither isolated production polyhedron nor R04 assembly represents embedded rock | Later terrain-coherent procedural modular outcrops, aligned with geological direction and embedded contact lines |
| **E — Cliffs / mountain systems** | Ridge, shore and mountain faces | Standalone rocks are the wrong abstraction | Defer to separate geology/terrain interface after GEO-R02 terrain shapes and watershed alignment are stable |

Do not model D/E by enlarging Class A geometries.

## 9. Recommendations for a separate ASSET-01E2, not started

After owner review, E2 should choose one constrained direction:
1. Calibrate **one hero boulder** with authentic fracture networks, softened/chipped edge hierarchy, less schematic slab seam, developed rear, and restrained surface colors.
2. Compare it beside existing Aurora vegetation under two standardized lighting setups at meaningful walking scale.
3. Preserve the P baseline completely and compare artistic results against R04; do not generate a full family before approval.
4. Then define how stone material and palette variants sit alongside the source-locked reference (without changing original seed parity).

**Not in E1:** no landscape placement, cliffs, R05 code, gameplay collision, new LOD family, Android FPS guarantee, merge, deployment, release or GEO modification.

## 10. Independent acceptance and unresolved issues

| Gate | Review result |
|---|---|
| Production rock source geometry parity | **PASS — exact source SHA-256 parity** |
| Production stone material fidelity | **PASS for matched reference camera/light — 0/814,000 differing pixels** |
| R04 technical Three.js/WebGL validity | **PASS — renders and geometry invariants**, two overlapping solids remain separate |
| Geological art quality of R04 | **CONDITIONAL / NOT ACCEPTED as production model** |
| Harmony with existing Aurora nature assets | **CONDITIONAL — visible art/style gap** |
| Future scalability design | **PASS for reference architecture, NOT tested at world scale** |
| Regression safety | **PASS — 32 tests plus original-source parity** |
| E1 technical completion | **CONDITIONAL owner review**; verified isolated deliverables, physical Android not claimed |

### Required final labels

- **ACCEPT — PRODUCTION ROCK BASELINE**
- **CONDITIONAL — R04 ART DIRECTION** (do not accept model for the game)
- **CONDITIONAL — E1 TECHNICAL COMPLETION** (actual code/CI evidence is complete for isolated lab; artistic closure and later integration require separate approval)

## 11. Traceability and scope integrity

- E1 branch only: `feature/asset-01e1-rock-family-calibration`.
- Read-only FLW production and experimental pins listed above.
- `asset-lab/birch/src/rocks/**`, `rocks.html`, `rocks/showroom.ts`, rock tests and scripts, additive CI workflow, and this report.
- No modifications to Aurora main; no Feh Lu We writes.
- No adjustments to birch, pine, grass model geometry, rendering/batching implementation, GEO-R02 or WORLD-01B.
- Final branch HEAD / CI status should be read from the final workflow run; this document's own commit advances the branch for documentation only.

**Stop: ASSET-01E1. Await artistic and milestone review before any ASSET-01E2.**
