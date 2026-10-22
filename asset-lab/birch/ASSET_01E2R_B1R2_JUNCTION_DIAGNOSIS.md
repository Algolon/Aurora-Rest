# B1R2 — Pre-sculpt junction diagnosis (immutable baseline)

Source `art/asset-01e2r-b1r-multimass-calibration@5e1d412e24d054ff8b659236b39feb0f99c1cced`.

- `buildB1R('A','V2')` returns **two separately closed** `BufferGeometry` meshes, not one outer-shell union.
- Primary is exactly `buildRockArchetype('A','refined')` (62 triangles). The B1 primary consists of authored half-space planes and selected inset facets.
- The secondary is `B1R_RECIPES.A.V2` (56 triangles): center `[0.60,-0.045,0.32]`, initial authored extents `[0.51,0.46,0.44]`, with 11 authored directional cuts. Both pieces use the shared A2 T1 material, authored plane colors and `0.38` planar UV units.
- The secondary centroid is embedded in the main body by original B1R point-in-mesh tests. The exposed region is near the low positive-X / positive-Z flank. The two shells intersect without shared edge topology. Outer face fragments of both source solids meet at untrimmed mesh intersections, leading to an assembly/junction seam on the front and side.
- Original measured external combined bounds: about **2.020 × 1.725 × 1.560 m**, **118 triangles**, **2 independently closed solids**, before any reconstruction.
- Upper crown, rear major planes and opposite flank belong to the main unchanged primary and should stay intact. Unwanted internal portions of both shells around the overlap should be removed.
- Potential failure mode of simple clipping-based geometry: both materials and planar normals are locally consistent, but their independently flat normals and abrupt polygon borders do not inherit one shared geological surface.
- **Chosen limited study:** generate a single exterior union shell from copied A-V2 component geometries, then use a deterministic, position-based, spatially limited transition deformation in the positive-X / positive-Z lower shoulder neighborhood. Recompute flat normals, colors and face UVs consistently. No changes to source V0/V1/V2 or any B/C/D/E/G1/A2 code.
- **Risk gate:** Boolean triangulation may introduce T-junctions, non-manifold vertices, tiny triangles or over-complicated facets. Do not claim manifold continuity without edge incidence, connected-component checks, ray-intersection/self-intersection diagnostics and genuine WebGL evidence. Stop with an explicit blocker if the result cannot pass.
