# Nature Asset Library audit and POP-02 contract

The source geography branch has no Nature Asset Library modules. Imports cannot work simply by adding a relative path. The following remote branches were inspected read-only and pinned in `preflight.json`:

| Family / source | Exact inspected SHA | Relevant API / consequence |
|---|---|---|
| Birch B1 | 38885029462299406bf57bd4938d4495f39f0d5a | Base family; use shadow correction and batch descendants when extracting |
| Birch shadow correction | dfc6b56f98cc560f6debce9b4e1fb3237069ef74 | Alpha-aware depth material is a batch precondition |
| Birch B2 | 87b4a2e00f0b29a89ec8aa1c5cdcf3bf7d170f6b | `NatureSpeciesBatch` factory, three variants × three geometry LODs |
| Pine C1 | 06a7edadb0a7df798a483f9c3bd8bf0311da67e3 | Source-fidelity pine family |
| Mixed C2 | 5f87d08a430051c9656e7bf44d1dfdc4f784f85d | `createNatureBatch`, independent species materials, shared LOD/culling policy |
| Grass D1 | 64606fe3df5d2444d0af21683319f6637b8d34f8 | Four production-reference geometry variants |
| Grass D2 | 1c4870439ba1885a7b43bb80b35940f64bd6eeac | Instanced/multidraw cover |
| Grass D2R | 0104a97cd3612e1bf1bec12cec1ea537e92d12e5 | `createGrassBatch`; clustered placement experiments are not canonical world geography |
| Production rocks E1 | 33adfb992d907e386bc272dd73716d734191f2bf | `createRockFamily`, four `PRODUCTION_ROCK_SEEDS`; experimental files also exist in this tree and must be excluded |

Inspected files: `asset-lab/birch/src/rendering/{natureBatch,mixedForest}.ts`, `grass/rendering/grassBatch.ts`, `rocks/index.ts`, branch trees and API dependencies. This is a source/API audit, **not a revalidation of the source asset tests or artistic approval**. E2 premium assets are not imported or promoted.

## What extraction actually requires

Extract only the approved family modules and their transitive imports, not showrooms or the app. Tree factories require geometry, shared material cache, alpha-aware foliage/depth material, RNG, LOD, capabilities, visibility, instanced and batched backends. Both source tree batches and grass batches expose add / transform / visible / update / dispose but **no physical per-instance remove**. Setting invisible leaves their descriptor and internal ID registered; using that as chunk removal would leak logical population over exploration.

Use one renderer-managed page/chunk batch that can be fully disposed, with family geometry/materials shared above it. For C2, repeated per-chunk species × 3 variants × 3 LOD groups can be expensive. Measure 64 m lifecycle granularity against larger reusable render pages or retain generation chunks at 64 m and assemble temporary render pages separately. Do not rewrite approved batching pre-emptively.

Grass source transforms support yaw/scale, not a full quaternion. POP terrain normals require either accepting upright tufts at restricted slopes after visual review, or a separately reviewed adapter extension. Do not silently claim source ground-normal support. `GrassBatch` also requires the `flw-production-reference` family preset. Brightness/tint must preserve its documented relative material behavior. Rock seed IDs are source seeds, not POP variant indices; map through `PRODUCTION_ROCK_SEEDS` instead of passing 0…3 as seeds.

## Descriptor-to-source mapping

| POP field | Tree batch | Grass batch | Production rock batch (future adapter) |
|---|---|---|---|
| `family` | `species`: birch / pine | grass renderer | production only |
| `variant` | 0 / 1 / 2 | 0 / 1 / 2 / 3 | index into production seed list |
| x, y, z | `position` | `position` after reviewed alignment policy | compose full transform |
| rotation, scale | `rotationY`, `scale` | `rotationY`, `scale` | matrix |
| tint | relative source-reference tint, not arbitrary extra leaf tint | brightness contract | source material policy |
| normal / alignment | upright | requires explicit decision above | terrain normal + yaw |
| burial | 0 | 0 | subtract from queried Y |
| ID / chunk | adapter handle map → batch ID | adapter handle map → batch ID | adapter handle map |

`PopulationRenderer.attach` is atomic and may only register a complete chunk; on failure it must dispose partial batch allocations. `detach` removes all corresponding scene handles and per-chunk buffers, releases references and preserves shared family resources. `dispose` finishes chunks before family owners dispose their geometry/materials. `update(camera)` belongs to the rendering adapter, independently from placement generation.

## POP-01 decision

No source asset branch was merged, changed or wholesale copied. There is no claim of working source-geometry compatibility. A clearly labelled instanced proxy renderer exercises the real attachment/disposal contract and geographic placement. This follows the permitted diagnostic fallback and leaves approved art intact. It sacrifices final foliage/silhouette evaluation; that is explicit scope for POP-02.

## POP-02 plan (not started)

1. Reconfirm pins and select an approved common asset subtree; preserve provenance and exclude `rocks/experimental`.
2. Extract transitive dependencies into an isolated library with unchanged geometry/material hashes and source regression tests. No Feh Lu We runtime dependency.
3. Implement chunk/page ownership wrappers over the existing batch APIs. Prove full detach/dispose with actual WebGL buffer/heap profiling and source geometry preservation.
4. Resolve grass normal alignment and rock instancing without changing approved source geometry. Measure source LODs and fade behavior.
5. Reconcile the proposed environment-query contract with MAT-01 and current geography. Add reviewed glade/vista masks and biome transitions; retain candidate route status until physical tread is final.
6. Build one excellent Birchwood edge → Central Valley composition and Home Cove shoreline with approved assets; walk it and collect actual desktop/Android evidence before expanding coverage.
7. Choose worker/incremental generation, render-page size and density/visibility presets from measured device cost. No full-island production population until these gates pass.
