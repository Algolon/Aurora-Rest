# AURORA REST — ROCK-R01-G01R | Controlled Sculptural Reconstruction Review

**Date:** 2026-10-23  
**Design lock:** ROCK-R01-B1 — The Sheltered Fault, option B  
**Execution:** Normal ChatGPT conversation; author-built source, verified GitHub Actions/WebGL  
**Art disposition:** **ART REJECT — G01R unsuitable as an environment asset; preserve experiment.** Final artistic authority remains with project owner.

## 1. Source and provenance

- **Parent source checkpoint (G01, unmodified):** c40b6a68f8860a42e826b8b953f327d27e621247
- **Dedicated G01R branch:** art/rock-r01-g01r-sculptural-reconstruction
- **Verified implementation commit:** b7579e53990709961da3e2c6ccafcc2c8e04a5e1
- **Technical CI:** [40022121211 — success](https://github.com/Algolon/Aurora-Rest/actions/runs/40022121211)
- **Genuine Chromium/Three.js/WebGL evidence:** [artifact 12531830021, 15 PNGs + metrics.json](https://github.com/Algolon/Aurora-Rest/actions/runs/40022121211/artifacts/12531830021)
- **G1 original, read-only:** art/asset-01e2r-r04-refinement@1ac9b9342bd888fcfdb5f1b31a11562ffe1df353
- **F01 technical base, read-only:** art/asset-01f01-nordic-rock-family-pilot@604ff2a82a3ef7d49638fcac1b2af4c22ec0f0ab
- **Design:** [ROCK_R01_B1_DESIGN.md](rocks/r01/ROCK_R01_B1_DESIGN.md)
- **Authorized correction brief:** [ROCK_R01_G01R_IMPLEMENTATION_BRIEF.md](rocks/r01/ROCK_R01_G01R_IMPLEMENTATION_BRIEF.md)
- **Implementation:** [sculptCore.ts](rocks/r01/sculptCore.ts), unchanged [geometry.ts](rocks/r01/geometry.ts)
- **Targeted checks:** [rock-r01-g01r.test.ts](tests/rock-r01-g01r.test.ts), plus original G01 tests and existing nature tests.

No Feh Lu We writes, no original G01 branch modification, no replacement of R2/R3, no island population/runtime, merge or deployment.

## 2. Objective and actual construction

Original G01 failed visually despite its closed mesh: large nonplanar ear-clipped triangles and injected fold vertices produced starbursts and sawtooth fissures.

G01R replaces that authoring algorithm with a single closed convex-dominant exterior sculpted by **named, deterministic geological clipping planes**. Plane intersections generate meaningful flat surfaces, each triangulated for the GPU without intentionally creating visible subdivision stripes. One front face is given a *real* local in-surface offset by two interior displaced points (0.105 and 0.14 m). The exterior boundary of that face remains unchanged and connected to its neighbors.

This geometry is **one physical volume**. The metadata value structuralMasses=2 expresses the B1 design intent, not proof that two legible separate geological masses were achieved. That distinction is crucial to the artistic failure.

## 3. Technical outcome

| Metric | Observed |
|---|---|
| GitHub CI / original+new automated tests | **PASS — 61/61, zero failures** |
| TypeScript / Vite isolated showroom | PASS |
| Real Chromium/WebGL2 captures | **15 PNG captures** |
| Console/HTTP browser errors | None recorded |
| Triangle count / nonindexed render vertices | **80 / 240** |
| Authored surviving stone panels | **22** |
| Local bounding dimensions | **3.65 × 2.40 × 3.01 m** |
| Outer topology | One connected closed surface in inherited edge-incidence / Euler tests |
| Determinism / finite normal, UV, color | PASS |
| A2 T1 material rendering | Captured; unchanged source |
| Reference G1 side-by-side | Captured at same camera and lighting |
| Vegetation context | Captured using unchanged approved birch, pine, grass |
| Example whole-scene diagnostic drawcalls | 5 isolated; 17 nature context, includes non-rock objects/passes |
| Physical-device GPU FPS | **NOT TESTED** |
| Exhaustive self-intersection/production collision/streaming | **NOT TESTED** |

The existing G01 source protection gates and test infrastructure remain intact. Original G1 remains 136 triangles. No claims of actual Android GPU performance are warranted by Chromium SwiftShader.

## 4. Genuine visual review

Review first: artifact **G1-versus-R01-neutral.png** (G1 left; G01R right), **R01-neutral-rearThreeQuarter.png**, **R01-neutral-front.png** and **R01-nature-context.png**. Neutral clay frames are decisive; T1 cannot improve poor mass geometry.

### Improvement over G01
- Eliminates large radial face fans and pointed black shard-like creases that dominated the original G01.
- Produces a technically clean, deterministic, source-owned rock mesh that remains compatible with the existing showroom, material and later staging interface.
- Camera capture, UVs and protected-source scope remain verifiable.

### Three disqualifying artistic defects

**(1) House-like/convex block massing.** The silhouette and especially the rear view are too flat-sided, symmetric in their broad reading and roof-like. A clipped convex solid does not recreate the stepped, non-convex sculptural interactions that made G1 interesting.

**(2) Artificial triangular void.** The localized inset is a single dark triangular cut at the front-right rather than an irregular, geologically coherent, continuing joint. There is no convincing recessed shared boundary between a main mass and displaced shoulder.

**(3) No actual displaced secondary mass.** Although named cutting planes shape the right shoulder, the result is visually one simple clipped solid. This fails the owner-selected B1 structural intent and loses the large-scale form hierarchy established in the design brief.

The visual benchmark is the **original G1**, which still has the more compelling mass hierarchy, directional planes and localized geometry.

## 5. Root-cause finding and strategic lesson

Two distinct techniques have now failed for different reasons:

- **G01: silhouette triangulation plus scattered interior folds** -> huge radial triangles, faux cracks, over-faceted spokes.
- **G01R: clipping one convex-dominant stone volume** -> clean construction but flat, architectural and missing a second coherent mass.

The *art problem cannot be solved merely by increasing triangle count, cutting more global planes or using T1 granite*. The underlying issue is the spatial composition of non-convex large masses, particularly where two geological directions merge.

Future work should begin with a true **non-convex, art-directed mesh blockout** with explicit shared boundary geometry and local fault orientation. G1 can remain the shape-language benchmark without copying its vertices. Evaluate front, right, rear and human height as neutral clay before adding material, tests beyond basic integrity, or population support. Avoid another automatic convex-cage pass, regular ring-surface system or decorative local face insets as substitute for joined masses.

## 6. Recommendation and mandatory stop

**Technical G01R milestone: COMPLETE AND CI VERIFIED.**  
**Art acceptance: REJECTED (recommendation for owner confirmation).**  
**Safe checkpoint: preserved, no merge, no deployment.**

Do not integrate G01R into F01 family registry or playable Aurora island.

Recommended owner decision: either stop rock experimentation here and defer, or authorize a new narrowly bounded **G02 manual non-convex sculptural blockout** with a prior **multi-view form approval gate**. That would be a fresh modelling strategy, not automatic G01R refinement. No G02 implementation is authorized by this report.

**STOP AT G01R WEBGL REVIEW.**
