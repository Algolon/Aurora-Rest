# Environment-data coordination audit (read-only)

Inspected MAT branch `feature/mat-01-terrain-material-architecture` at `ae8a9c17781cdaa85c9e55696697c6213a860ef6`: `docs/mat-01/INTEGRATION.md`, `src/terrain-material/{rules,fields,query}.ts`, and `sources/geo-r02b.ts`. WTR remote at audit: `feature/wtr-01-water-lookdev@90037110189f5a51d2f4fdad5790b84a05df36fd`. No code from either branch is imported, merged or modified.

| Concern | Preserved POP-01 contract | MAT-01 inspected interface | Reconciliation requirement |
|---|---|---|---|
| Coordinates | x east, z north, metre coordinates, 6 × 8 km grid | Same GEO-R02B convention; legacy viewer x-mirror explicitly render-only | Compatible units; never put render mirroring into queries |
| Ground height | Exact piecewise triangle interpolation of committed 4 m mesh | Source wraps committed height/raster lattice; classification fields queried bilinearly | Keep geometric contact from exact terrain triangles; do not use blended material weights as height |
| Slope | Gradient magnitude from ±4 m samples, rise/run, independent normal | `slopeField` central difference; attribute channel 3 stores slope ÷1.5 in quantized map | Decode units before any future rule comparison; quantized/bilinear classification is not exact contact data |
| Region intent | Anchor-weighted provisional woodland and continuous world patch fields | Catchment-weighted forest intent, blurred/warped; separate dune/cove/mire intents | These are different provisional rules. Do not silently switch them during asset integration; shared foundation/art review must choose the authority |
| Moisture | Capped water-edge proximity + low-slope/low-elevation proxy | Wetness uses water/node distance, curvature and authored mire intent | Neither is measured soil moisture; reconcile wet/dry boundary, flow assumptions and thresholds explicitly |
| Shore distance | Exact within caps to clipped mesh boundary/coast segments | Euclidean lattice distance to nearest wet/coast nodes and bilinear fields | Different resolution/meaning, especially within a few metres of a bank. Keep exact POP safety clearance independently |
| Exposure | Altitude + coastal proximity proxy | Altitude + convexity + coast field | Not interchangeable botanical datasets; keep provenance visible |
| Materials | No material ownership | `TerrainMaterialQuery.weightsAt`, `weightOf`, `sample`, `coverage`, `attribute` share classification bytes with shader | Future adapter may consume reviewed weights without importing MAT shader/render code |
| Water | Committed clipped mesh and sea level decide exclusion | MAT source can wrap committed water-surface raster; WTR owns presentation | Future shared water query should preserve canonical contact, independently from water appearance |

There is **no third biome framework** in POP-02A: original POP-01 placement is unchanged. Neither MAT's material IDs nor POP's community labels become automatically canonical through this milestone. A separately reviewed environment-foundation integration should settle classification ownership, resolution, moisture/exposure assumptions and whether POP placements intentionally change. It must not conflate material appearance with geometric height or water safety.
