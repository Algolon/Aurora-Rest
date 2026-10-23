# Aurora Rest — ROCK-R01-G01 | First Genuine WebGL Sculptural Review

**Date:** 2026-10-23
**Project:** Aurora Rest · Nature Asset Library
**Owner design:** ROCK-R01-B1 / The Sheltered Fault, selected direction B
**Status:** TECHNICAL PASS · ART NOT APPROVED · OWNER REVIEW REQUIRED
**Base F01:** 604ff2a82a3ef7d49638fcac1b2af4c22ec0f0ab
**Branch:** art/rock-r01-r04-sculptural-study
**Verified implementation commit:** 403454766c5ec0e1c3c075078fe906f60a4c7acf
**CI PASS:** [ROCK-R01-G01 run 40014247257](https://github.com/Algolon/Aurora-Rest/actions/runs/40014247257)
**Actual WebGL screenshot artifact:** [G01 15-image WebGL review, artifact 12526709770](https://github.com/Algolon/Aurora-Rest/actions/runs/40014247257/artifacts/12526709770)

## Source and design provenance

- Original untouched R04/G1: art/asset-01e2r-r04-refinement@1ac9b9342bd888fcfdb5f1b31a11562ffe1df353.
- Existing unchanged A2 T1 material: art/asset-01e2r-a2-rock-texture-lookdev@91a2e0c8fc909a4a25f00e6d5fd621ddb703e6d8.
- Verified F01 loader, shared material, instancing staging: art/asset-01f01-nordic-rock-family-pilot@604ff2a82a3ef7d49638fcac1b2af4c22ec0f0ab.
- Durable owner-selected B1 design brief: [rocks/r01/ROCK_R01_B1_DESIGN.md](rocks/r01/ROCK_R01_B1_DESIGN.md).
- Geometry: [rocks/r01/sculptCore.ts](rocks/r01/sculptCore.ts) and [rocks/r01/geometry.ts](rocks/r01/geometry.ts).
- Isolated interactive browser study: [rock-r01.html](rock-r01.html), [rocks/r01/showroom.ts](rocks/r01/showroom.ts).
- Capture script: [scripts/capture-rock-r01.mjs](scripts/capture-rock-r01.mjs).
- Tests: [tests/rock-r01-g01.test.ts](tests/rock-r01-g01.test.ts).

## What was physically authored

One continuous, closed triangulated outer-shell mesh, not two overlapping closed primitive rocks. Hand-authored front and back perimeter control vertices, four recessed fault vertices, six front structural fold anchors and four rear fold anchors. Triangulated front into left and right regions sharing one sunken fault line; closed sides stitch front and rear perimeters. Two geological mass directions are a **design intention**, not separately validated physical pieces.

Zero automatic rock-family generation or randomness. No source geometry copied from R04. No alteration of protected source assets or WORLD/GEO/ENV/POP/MAT branches. No F01 registry replacement, merge or deployment.

## Actual geometry and technical verification

| Metric | Observed result |
|---|---|
| Local bounds | 3.61 × 2.32 × 2.95 m |
| R01 triangles / attribute vertices | 88 / 264 (nonindexed) |
| G1 comparison triangles | 136 |
| Mesh shell | One closed, connected, genus-zero orientable surface in edge-incidence tests |
| Geometry assertions | Finite positions, normals, UVs and white vertex colors |
| Determinism | PASS |
| Outward winding and flat normals | PASS |
| Nondegenerate triangles | PASS |
| Euler characteristic / connectedness | PASS |
| TypeScript | PASS |
| Isolated Vite browser build | PASS |
| Full existing automated test suite | 60/60 PASS |
| Browser | Chromium WebGL 2.0 / SwiftShader |
| Captures | 15 actual canvas PNGs, no browser JS/HTTP errors |
| Browser drawcalls | Example five whole-scene calls (floor, light passes and objects included); not isolated per rock |
| Resource handling | Geometry dispose asserted; separate showroom asset owner cleanup implemented |
| Physical GPU / Android FPS | NOT TESTED |
| Exhaustive self-intersection or collision proxy | NOT TESTED |

Protected source diff gate against F01 PASS. Build/test results are from the implementation commit above, not inferred from documentation changes.

## Actual WebGL evidence

The linked artifact includes:
- R01-neutral-front / rear / left / right / frontThreeQuarter / rearThreeQuarter / top / human.png.
- R01-neutral-grazing.png and R01-neutral-wireframe.png.
- G1-versus-R01-neutral.png and G1-versus-R01-rear.png.
- R01-A2-T1.png and R01-A2-T1-rear.png.
- R01-nature-context.png.
- metrics.json.

These are real Three.js/WebGL canvas captures, **not generated concept art**.

## First artistic assessment

**Recommendation: ART REJECT for the G01 candidate; preserve it as a technical experiment. Owner makes the final artistic disposition.**

The silhouette is a distinct lower, broader rock than G1, but the face language is badly deficient. Real frontal and rear perspectives show:

1. **Major defect — fan/spoke triangulation.** Planar polygon ear-clipping and interior point splitting create long, narrow triangular fans converging on individual nodes, yielding starburst/shard patterns. This reads like a fragmented geometric prop rather than authored geological planes.
2. **Major defect — false fracture.** The intended recessed diagonal fault reads as multiple spiky dark wedges and abrupt creases. It does not communicate a continuous weathered structural joint or believable displacement.
3. **Major defect — weak secondary geological mass.** Although the right side has lower envelope and rear thickness, the primary/secondary relationship is not readable as overlapping, structurally coherent stone masses. The rear contains an especially conspicuous radial triangle fan.

The existing A2 T1 material and approved birch/pine/grass context do not resolve the shape defect. Extra facet noise, denser triangulation or texture would only disguise the underlying problem.

## Proposed next design decision, NOT authorized work

If the owner requests a focused corrective pass, avoid adding more subdivisions to the current triangulation. Replace the fan-based surface tessellation with **explicit large-scale authored polygon panels**. Establish the top, shoulder, displaced secondary shoulder and recessed joint as a coherent three-dimensional boundary layout first; triangulate each intentional panel afterward. Keep the current shell/pivot/UV/normal/CI/showroom infrastructure and visual comparison cameras. Then review neutral clay before T1. No automatic broad rock family.

**Mandatory stop:** first real WebGL review is now complete. No geometrical refinement, island integration, merge, deployment or artistic approval without owner direction.
