# ENV-R02D — First-Person Woodland Cohesion, A1 design and implementation

**Starting checkpoint:** A2 `3239a6ebce5f41ab9b99a2624709d3b557b61f0e`; protected recovery `bced77ca3ca0539f7137cd9f066e6220518cf4a8`.
**Status:** opt-in isolated visual pilot, not an approved path, ecology, shader, or asset release.
**Art direction:** Believable Nature, Sculpted for Wonder.

## Art diagnosis
The actual R02C A2 WebGL A/B photos (run 40039048971) show better tree clusters but an uninterrupted open dark ground plane, no visible winding trail, and no real shrub layer. More random tree density alone is not the solution.

## Authoring decision: 86m around the actual hero route
- Take the contiguous canonical **hero route polyline** around `[-350,-290]`, 43m in either direction. This connects the three existing R02C A2 camera positions; never invent a parallel vector path.
- Preserve R02C A2's authored groves A–F, original 558 recovery files, terrain, MAT material weight textures, geography, source POP seed, shadows and tree asset definitions.
- Add a **separate renderer-only translucent 1.7m footpath core**, with 0.6m visually fading edge (vertex alpha) and original canonical elevation sampling. The study does **not** modify canonical path collision, elevation, MAT classification or physics.
- Add a bounded network of varied low `leaf-sprig` proxy clumps along both sides, intentionally interrupted for rhythm, with low height (~0.28–0.53m). Local geometry is lightweight authoring *for silhouette only*, not a botanical shrub/moss/lingonberry asset. It is not approved for production.
- The new layer and A2 layers start **OFF**. A/B/A review compares validated R02C-A2 with R02D+A2, using the same cameras and ground shader, with exact restoration after switching off R02D.

## Protected invariants
- The default scene and entire R02C A2 view remain unchanged, no source file overwritten and no main merge.
- Only original `env-r02c:` rendered grove rows can remain active in the comparison; R02D adds no canonical POP descriptors, IDs or transforms.
- Only temporary review meshes under `WoodlandCohesionLayer.group`; dispose geometry, materials and instancing explicitly.
- Genuine WebGL validation uses all three corridor walk views, checks identical canonical placement identifiers, ground buffers and A/B/A pixel restoration. Also logs draw calls and triangles against provisional 750k submitted triangle guidance, without claiming device FPS.

## Artist's decision criteria
**GO for visual cohesion study** only if the route is naturally legible without reading as an artificial road, low foreground/understory masks the exposed floor, and enclosure/reveal improve from **walking height**. If the green clumps look like abstract low-poly cutouts, dark ground remains dominant or path follows terrain poorly, the study is **ART REVISE / ART REJECT**, regardless of code tests.

No Blender micro-iterations, no new production-grade botanical source assets, no island-wide ecology, no terrain redesign, no merge and no deployment.
