# ASSET-01E2A — Premium Hero Boulder: three real silhouette studies

**Project:** Aurora Rest · Nature Asset Library  
**Date:** 2026-10-21  
**Branch:** `art/asset-01e2-hero-boulder-calibration`  
**Implementation checkpoint prior to this report:** `26d845c0285aafda146dabde1db3f81936cfc1b0`  
**Visual/art status:** **NO CANDIDATE YET ART-APPROVED**. E2B not started.  
**Latest completed E2A implementation CI:** [run 39682244748](https://github.com/Algolon/Aurora-Rest/actions/runs/39682244748), all jobs PASS.  
**Genuine 43-image browser evidence:** [ASSET-01E2A screenshots and metrics artifact](https://github.com/Algolon/Aurora-Rest/actions/runs/39682244748/artifacts/12384463182).  
**Existing E1 WebGL regression:** [E1 rock baseline artifact](https://github.com/Algolon/Aurora-Rest/actions/runs/39682244748/artifacts/12383968503).  
**Original-vs-Aurora material regression:** [Matched stone material artifact](https://github.com/Algolon/Aurora-Rest/actions/runs/39682244748/artifacts/12385190612).

## 1. Repository preflight and protected sources

At preflight the original Aurora E1 HEAD exactly matched `33adfb992d907e386bc272dd73716d734191f2bf`, and the pinned E1 GitHub Actions [run 39678637647](https://github.com/Algolon/Aurora-Rest/actions/runs/39678637647) was green.

Original production Feh Lu We: `17eafb0902833fb1121c77083f9f862eb4ffcd96` — verified, read-only.

Original experimental Feh Lu We R04: `5725a7c08a7ae4dea578c26362881e3e8d60a38c` — verified, read-only.

The requested `AGENTS.md` and `docs/PROJECT_INSTRUCTIONS.md` were not present in the pinned Aurora repository; root contained `.github`, `README.md`, and `asset-lab`. Existing asset-lab instructions and full ASSET-01E1 report were reviewed. The E2 branch did not exist at preflight and was created explicitly from the approved E1 SHA.

No Feh Lu We modifications, E1 baseline overwrites, main branch writes, merges, releases, deployments, or island-world changes.

## 2. Actual development steps

**E2A-1 diagnostic:** first authored halfspace-sculpt candidate set passed geometric tests but actual browser images showed three overly blocky silhouettes (A angular block, B house-like cap, C obelisk). Those images were *rejected as artistic evidence of premium quality*. The prototype was not promoted.

**E2A-2:** replaced that overly convex approach with an authored unified sculptural contour cage. Each rock is constructed from 12 angular directions and distinct hand-authored horizontal cross-sections controlling asymmetric mass, upper crown, ground contact, shoulder projections, recession and directional bends. The per-ring horizontal radii, shifts, rise offsets and top/bottom cap centers are explicit editable values; this is not noise-driven or three seed variants. Each study remains one continuous, closed triangulated rock volume rather than two overlapping slabs. No textures, moss, fractal noise or post-hoc shader illusions were used for the primary evaluation.

Implementation locations:

- `src/rocks/experimental/e2/heroRockStudies.ts`: deterministic closed-surface triangulation, explicit major scale/lean controls, diagnostic metadata.
- `src/rocks/experimental/e2/candidateDefinitions.ts`: three independent authored control cages and fracture directions.
- `src/rocks/experimental/e2/studyMaterials.ts`: Three.js BufferGeometry and flat untextured clay/silhouette/wireframe materials, optional restrained diagnostic Nordic tint.
- `src/rocks/experimental/e2/provenance.ts`: protected sources, experimental-only policy.
- `rock-e2.html`, `rocks/e2Showroom.ts`: independent real-WebGL rock showroom; selectable model, 7 standardized cameras, orbit, zoom, neutral and Nordic light, silhouette, clay, wire and material preview, dimensions/stats, R04 benchmark and existing approved birch/pine/grass.
- `tests/rockE2.test.ts`: geometry, closed-edge incidence, volume winding, finite values, determinism, editable controls, proportions, R04 regressions.
- `scripts/capture-rock-e2.mjs`: 43-image reproducible actual browser evidence with WebGL and canvas checks.
- `.github/workflows/asset-01e2a-hero-boulder.yml`: all E1 + E2 technical checks.

**Important limitation:** this produces a genuinely editable 3D silhouette study, not a hand-sculpted final rock. The geological process is suggested by broad directional mass and recesses; the meshes do **not** yet possess fully articulated natural fracture surfaces. Treat claimed fracture intent as a design hypothesis, not as an accomplished fracture-network result.

## 3. Three art studies and physical scale

| Candidate | Intention | Bounds W × H × D | Triangles | Non-indexed vertices | Components | Material |
|---|---|---:|---:|---:|---:|---|
| A — Fractured Granite Mass | Grounded heavy granite with irregular crown and integrated front shoulders | 4.373 × 2.830 × 3.285 m | 144 | 432 | 1 continuous | 1 diagnostic |
| B — Glacial Erratic | Wide, low, offset glacial stone, abraded face and fractured opposing edge | 5.279 × 2.290 × 3.391 m | 144 | 432 | 1 continuous | 1 diagnostic |
| C — Angular Nordic Outcrop | Taller leaning directional structure and distinct rear contour | 3.731 × 4.090 × 2.792 m | 168 | 504 | 1 continuous | 1 diagnostic |
| R04 — benchmark, unchanged | Original slab-led assembly | 3.73 × 2.644 × 3.03 m | 128 | 384 | 2 overlapping | 1 separate reference |

These are geometry-local bounding extents, not artificially normalized to one height. A uniform 1.8 m person-height pole appears in the screenshots. R04 uses original seed 37, refined. No new mesh is exported from the production rock index.

## 4. Genuine WebGL visual evidence

The **43 screenshot archive** comes from real Chromium + Three.js/WebGL render readbacks, not synthetic images. SwiftShader is used, therefore **not** physical Android GPU proof.

The archive contains:
- `overview-neutral.png` and `overview-silhouette.png`: same camera/scale A, B, C and R04.
- For each candidate A/B/C: `{ID}-{front,rear,left,right,threequarter,top,human}-clay.png` (7 views).
- For each: front/rear/left flat-black `silhouette`, three-quarter `wireframe`, and `nordic` (5 additional views).
- `R04-matched-{A,B,C}-neutral.png`: unchanged R04 under the same camera setup used for each candidate.
- `A-B-C-R04-nature.png`: four rocks alongside **existing approved Aurora birch, Scots pine and grass**.
- `A-B-C-R04-matched-neutral.png`: direct four-model front comparison.
- `metrics.json`: frame drawcalls, dimensions, bounds, browser details and GL error checks.

**Stylistic caution:** the existing approved nature models appear under controlled light in this lab; the rock prototypes are not yet comparably nuanced in planes and material. The grass/birch/pine comparison is context, not an art-acceptance claim.

## 5. Critical art critique from actual front / rear / side / three-quarter images

### A — Fractured Granite Mass

**Strengths:** believable broad, grounded boulder footprint; asymmetric crown and noticeable uneven shoulders; better 360-degree volume than the prior angular-block study; low enough and wide enough to read as a freestanding granite landmark. More appropriate to **Class C hero boulder** than C's sheer outcrop.

**Weaknesses:** evenly subdivided triangular shading generates a crumpled/algorithmic patchwork, not enough dominant continuous planes. A clear, geologically authentic **directional fracture is not resolved**; there is only a broad recessed area near the front. The front and rear remain overly faceted rather than selectively weathered. Ground contact is plausible but dark lower band looks artificially regular in places.

**Gate:** **ART CONDITIONAL — REFINEMENT NEEDED**. Most appropriate *boulder-class* starting point, but not yet premium/approved. Geometry direction must be deliberately simplified and sculpturally organized in E2B (only after selection).

### B — Glacial Erratic

**Strengths:** distinct lower, wider silhouette and reduced visual resemblance to R04; clear shifted mass and plausible broad erratic footprint.

**Weaknesses:** front and top remain comparatively generic and domed; triangular tessellation is more visible than glacial abrasion. Distinctive geological narrative is too weak. The comparatively unarticulated face reads as a stylized polyhedral lump, still at risk of repeating the R01/R02 clay-like failure in a different form.

**Gate:** **ART REJECT** for the proposed hero silhouette. Retain branch evidence as an engineering example only; do not promote automatically.

### C — Angular Nordic Outcrop

**Strengths:** best immediate landmark readability and tallest primary contour. Directional leaning shape and rear step are more distinctive than A/B. The triangle-scale spatial variation reads as larger, more deliberate planes in some three-quarter views. The rock looks recognizably different from the source family.

**Weaknesses:** in front/side views the central angular recess resembles a procedural geometric fold; the peak and opposing profiles lack the believable layered geological fracture history of the premium references. Has a much stronger **Class D outcrop** identity than a glacial hero boulder; could be the wrong morphology for a standalone Class C boulder. Still overfaceted and simplified.

**Gate:** **ART CONDITIONAL — REFINEMENT NEEDED** as a **Class D directional outcrop**, not yet a premium hero boulder.

### R04 reference comparison

All new candidates eliminate the visible *two-piece assembled frontal slab*, because they are each a single closed sculpt. That is a genuine geometric advance over R04.

However, converting to a single solid does not automatically improve sculptural quality. The R04 reference's large coherent planes remain stronger than A/B/C's overuniform triangle distribution in some views. A proper next art pass should combine **A's natural broader silhouette** (if pursuing a hero boulder) with the discipline of **R04's authored large planar cuts**, not simply subdivide A further. C is a separate future outcrop art opportunity.

**The first failed E2A shapes and the revised shapes both provide valuable negative evidence: either a few geometric cuts produce an overly constructed block, or too many equally weighted facets produce crumpled-looking rock. A selected third method must bridge those failure modes by hierarchically composing large planes and only selectively sculpting medium planes.**

## 6. Cross-candidate decision matrix

| Art gate | A | B | C |
|---|---|---|---|
| Distinct silhouette | Conditional | Weak | Strongest |
| Geological coherence | Incomplete fracture | Weak abrasion | Incomplete directional fracture |
| Large/medium plane hierarchy | Too even | Too even | Better but inconsistent |
| Front/rear/side quality | Reasonably balanced | Generic front | Strongest rear contrast |
| Premium stylization | Not yet | No | Not yet |
| Hero **boulder** role | Best fit | Weak | More outcrop than boulder |
| Approved vegetation fit | Needs plane and palette calibration | Weak | Potential in exposed sites |
| Three.js technical validity | PASS | PASS | PASS |
| Overall E2A art status | **ART CONDITIONAL** | **ART REJECT** | **ART CONDITIONAL (outcrop only)** |

**Recommendation for owner review:** A is the best candidate to pursue as a genuine hero **boulder**, though it is NOT approved. C is a useful alternative if the goal shifts to a tall, angular outcrop. **None currently meets the stated premium silhouette acceptance threshold.** Do not automatically authorize E2B based on this recommendation.

## 7. Technical tests and browser diagnostics

- **37/37 automated tests PASS**, including 5 E2 tests and all E1 nature-library/rock regressions.
- E2 A, B, C: determinism, all finite vertex attributes, nonzero triangle areas, positive winding, single closed volume by 2-edge manifold incidence, editable bounded proportions, bounds and distinct design ratios.
- R04 unchanged and passes original 128-triangle invariants.
- TypeScript and Vite production build PASS.
- Original pinned Feh Lu We birch, pine, grass and rock independent source geometry parity PASS.
- E1 stone original vs Aurora material browser comparison remains valid; exact 0 changed pixels in the E1 matched test.
- 43 genuine E2 browser captures, no browser console errors, all GL error flags zero, no empty capture.
- Representative **whole-frame** renderer values under the showroom (not direct per-asset costs):
  - four-rock overview: 11 calls / 1,438 scene triangles
  - A-only: 5 calls / 558 scene triangles
  - B-only: 5 calls / 558 scene triangles
  - C-only: 5 calls / 606 scene triangles
  - four-rock nature context: 23 calls / 12,010 scene triangles
- Initial build cost on CI hardware was ~7.8 ms A / 1.0 ms B / 0.7 ms C. Single measurements only; not robust benchmarks and not physical Android results.

**Limitations:** graph/topology checks do not constitute independent exhaustive triangle-triangle self-intersection testing. Images show no obvious gaps or z-fighting, but do not prove subpixel absence at arbitrary camera positions. No game-world collision, live terrain embedding, mesh LOD rollout, game-world drawcall benchmark or Android performance tests.

## 8. Proposed E2B — requires explicit owner selection first

If the owner selects **A as the hero boulder**, proposed next pass:
1. Art-direct a deliberately smaller number of truly large continuous front/side/back planes, retaining A's broad irregular volume.
2. Replace triangle patchwork with one geologically plausible, directed primary fracture continuous over crown and side; structural recesses should connect logically rather than decorative facet clusters.
3. Rework front and back using coherent planes and localized transitions, not a new detached slab.
4. Stabilize a convincingly grounded base and controlled bevels/edge chips only after major planar hierarchy is accepted.
5. Then calibrate stone material against birch/pine/grass in a separate subpass without altering source-locked production stone.
6. Keep R04 and E2A candidates as immutable checkpoints for side-by-side comparison.

If **C is preferred**, first reclassify as Class D outcrop rather than forcing C into the hero boulder category.

**No E2B code is included or authorized here.**

## 9. Scope and final gates

| Gate | E2A result |
|---|---|
| Isolated git branch ancestry | PASS |
| All three actual distinct editable Three.js geometries | PASS |
| Seven neutral views per candidate plus silhouettes/wire | PASS |
| R04 unmodified comparator | PASS |
| Existing Aurora vegetation context | PASS |
| Geometry regressions | PASS |
| Genuine browser/WebGL capture | PASS |
| Premium boulder art acceptance | **NOT MET** |
| Owner-approved winner | **NONE YET** |
| Merge/deployment | **NOT AUTHORIZED / NOT PERFORMED** |

**E2A finished as a technically validated, honestly inconclusive art-calibration study. Stop. Await owner selection or a new scoped silhouette design brief; do not begin E2B automatically.**

Final report-commit SHA is the head of `art/asset-01e2-hero-boulder-calibration` after this document is added; refer to the linked branch/CI for the canonical hash.
