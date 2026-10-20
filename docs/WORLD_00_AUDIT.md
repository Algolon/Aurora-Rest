# WORLD-00 — Feh Lu We nature architecture audit

Date: 2026-10-20. Inspected the connected live `Algolon/Feh-Lu-We` repository, default branch at inspection `ccr-75ef4113-kfkimm`. No changes were made to Feh Lu We.

| Production file | Verified architecture | Aurora Rest suitability / action |
|---|---|---|
| `src/world/woodkit.ts` | Shared procedurally constructed Three.js geometries, vertex-color and bark atlas conventions; species `oak`, `beech`, `birch`, `pine` with 3 variants each; `grassModel` with 4 variants; ConvexGeometry rock generator | Reuse birch and pine after decoupling imports; spruce absent and must be separately authored. Preserve original geometry/copyright provenance. Grass concept useful; vertex colors require biome retinting. Rock convex hull adequate as placeholder, not premium hero rock |
| `src/world/foliageStyle.ts` | `NATURE_STYLE`, art profiles and foliage sprays/atlas | Good source for consistent stylistic language; extract relevant functions rather than importing entire estate context |
| `src/world/woodlandPlan.ts` | Site-agnostic deterministic placement interface, seeded local streams per feature/position, path exclusion and anchored hero trees | Strong design to adapt for ecological distribution; current type-level coupling to `woodkit.ts`, `nature.ts`, `three` |
| `src/world/vegbatch.ts` | BatchedMesh/multi-draw path; InstancedMesh fallback with custom frustum/visible-set packing; per-frame hooks; dynamic LOD integration | Strong performance baseline, BUT coupled to `World`, `CAPS` and `scene` lifecycle; adapt and test fallback independently |
| `src/world/vegetationLod.ts` | Hysteresis-based tree LOD profiles. Production hybrid `[22, 36, 62] m`, hysteresis 3 m | Transfer LOD selection algorithm after independent tests; island horizon demands more distant impostors |
| `src/world/estateWoods.ts` | Estate-wide vegetation integration with BOSLUST layout, collisions, footprints, plan and terrain | Not portable directly. Extract patterns, not the application-level orchestrator |
| `src/core/caps.ts` | Capability flags and multi-draw fallback toggling | Replace with local WebGL capability probe in Aurora Rest module |
| `package.json` | Three `^0.186.1`, `@types/three` `^0.186.0`, Vite `^8.3.2` | Aurora Rest manifest aligned with these versions for anticipated code portability, but package installation/build not yet verified |

## Immediate technical decision

Use authored + seeded pure terrain functions, chunked Three.js heightfield meshes and world-local rendering modules. **Do not copy Feh Lu We `woodkit.ts` wholesale:** it imports `surfaces.ts`, `artkit.ts`, `indoorPlants.ts`, `gardenkit.ts`, foliage styles and geometry utilities. A naïve drop-in would import estate-wide assumptions.

All `WORLD-01` placeholder trees and rocks are deliberately independent provisional geometry, **not** renamed Feh Lu We production assets. This avoids a misleading claim of integrated asset reuse. The Feh Lu We asset extraction belongs in a distinct `WORLD-02-ASSETS` branch after a rendered baseline is accepted.

## High-priority risks

1. Source/bundle access: local runtime has Node and Chromium but cannot resolve npm registry/GitHub hosts; no actual Three.js/Vite build is presently possible.
2. Missing illustrated reference as a mountable file in this request; the prototype follows the textual layout, so coastline match is not signed off.
3. Lake basin, river grading and coastline meshes have not been inspected in a running Three.js scene.
4. Using fully detailed vegetation at world scale would create unacceptable CPU/GPU work; future visibility cells, LOD and instancing must be integrated with careful profiling.
5. A 6 × 8 km environment needs a strong composition and movement budget, not merely seeded procedural noise.
6. **Resolved 2026-10-20:** Independent project repository `Algolon/Aurora-Rest` confirmed. All implementation writes must target this repository only. Feh Lu We remains read-only.
