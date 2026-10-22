# ASSET-01E2R-B1R2 — Integrated Geological Transition Study (A only)

**Aurora Rest · Nature Asset Library**  
**Milestone date:** 23 October 2026 (Europe/Amsterdam)  
**Source verified:** \`art/asset-01e2r-b1r-multimass-calibration@5e1d412e24d054ff8b659236b39feb0f99c1cced\`  
**Isolated branch:** \`fix/asset-01e2r-b1r2-integrated-shoulder\`  
**Validated implementation CI:** [Run 39866581535 — both jobs SUCCESS](https://github.com/Algolon/Aurora-Rest/actions/runs/39866581535)  
**Actual Chromium WebGL evidence:** [Artifact 12463084984 — 33 PNGs + metrics](https://github.com/Algolon/Aurora-Rest/actions/runs/39866581535/artifacts/12463084984)

**TECHNICAL PASS · ART REJECT (A-V3 is not a premium integrated boulder) · OWNER REVIEW PENDING.**

## 1. Verified repository and safety

- Confirmed source B1R branch HEAD equals the exact authorized commit. The B1R2 target branch was absent before creation; explicitly created from the authorized checkpoint.
- Inspected original A-V2 primary and secondary geometry, B1/B1R source and tests, the B1R showroom, genuine screenshots and previous art report.
- \`AGENTS.md\` and \`docs/PROJECT_INSTRUCTIONS.md\` return 404 at the source; do not claim they were read.
- A connected GitHub API cannot establish the state of separate, unsynced local worktrees. No local clean-tree claim is made.
- The protected original B1, B1R, G1/R04, A2 and nature source files remain unchanged. The CI source diff guard passes relative to the source SHA.
- Feh Lu We is read only at \`17eafb0902833fb1121c77083f9f862eb4ffcd96\`.
- No changes to B, C, D, E, island, GEO/WORLD, production assets, merges or deployments.

## 2. Original A-V2 junction diagnosis — completed before implementing geometry

[Pre-sculpt diagnosis](ASSET_01E2R_B1R2_JUNCTION_DIAGNOSIS.md) was committed first.

- Primary: exactly the original 62-triangle B1 sculptural A rock.
- Secondary: 56-triangle authored A-V2 shoulder with center \`[0.60,-0.045,0.32]\` and 11 half-space cuts.
- Together: 118 triangles, two independently closed surfaces sharing **no** interface or common outer topology.
- Exposed secondary surface intersects the lower positive-X, positive-Z primary flank. Faces remain independently authored, so the shoulder reads as a pasted-on angular wedge, particularly under neutral and grazing lighting.
- Original combined approximate bounds: 2.020 × 1.725 × 1.560 m.
- The primary crown and opposite/rear large planes were designated unchanged.

The diagnosis distinguishes the *geometric* intersection defect (internal overlapping triangles and separate draw meshes) from the *art-direction* defect (an independent wedge silhouette and misaligned plane hierarchy). Solving only the first does **not** automatically solve the second.

## 3. Actual topology/construction implemented

New file: \`src/rocks/experimental/b1r2/integratedA.ts\`.

1. Obtain **unaltered** A-V2 two-component source geometry via \`buildB1R('A','V2')\`.
2. Clone the meshes for an isolated CSG operation. Use \`three-bvh-csg@0.0.18\` with real **ADDITION** (union), no source mutation, one material and no material groups.
3. Use the library's constrained polygon triangulation mode. The first ordinary triangulator failed strict surface-topology tests (115 bad edge incidences, 2 degenerates and reversed edge cases), and was rejected.
4. Consistently snap post-CSG positions to 0.00001 m for a shared seam representation.
5. Apply an authored, smoothly bounded three-axis transition deformation **only near the positive-X/front-side shoulder**, nominal center \`[0.57,0.04,0.34]\`. Maximum verified vertex movement is approximately **0.01236 m**.
6. Build a new non-indexed BufferGeometry with face normals, the shared original planar UV scale (0.38), restrained authored vertex colors and valid bounds.
7. Retain **A-V0/V1/V2 entirely unchanged**. A-V3 is a reversible alternative generated only on demand. T1 stone maps/shaders unchanged.

**Source construction truth:** Input = two independently closed overlapping solids. Output = one newly generated external CSG union mesh whose strict tests prove a single connected closed and consistently oriented shell for the current authored A-V3. It is *not* two objects merely sharing a material.

## 4. Geometric measurements, valid topology and reproducibility

Values from final \`rock-b1r2-evidence/metrics.json\` and strict Node topology log:

| Metric | A-V2 original | A-V3 current |
|---|---:|---:|
| Dimensions (m) W×H×D | 2.020 × 1.725 × 1.560 | 2.020 × 1.725 × 1.560 |
| Nonindexed triangles | 118 | 164 |
| Nonindexed vertices | 354 | 492 |
| Separate rock draw meshes | 2 | 1 |
| Combined material slots | Shared T1 | Shared T1 |
| Interior overlapping closed solids | Yes | No (CSG removes internal overlap) |
| Topology | Two independent closed components | One tested connected outer shell |

**Strict V3 topology analysis:**
- 164 faces, **84 unique spatial vertices**, 246 undirected edges.
- Connected components: **1**.
- Bad boundary/non-manifold edge incidences: **0**.
- Inconsistent paired-edge orientation: **0**.
- Degenerate triangles: **0**.
- Wrong-facing triangle normals: **0**.
- Euler characteristic \`V-E+F = 2\`, consistent with a genus-zero closed surface.
- Positive signed volume approximately \`2.9984 m³\`.
- Deterministic attributes and recreation after idempotent disposal PASS.
- Dimensions unchanged at the reported precision (0% bounds growth).

The tests go meaningfully beyond volume positivity. These tests do **not** constitute exhaustive proof of no triangle-triangle self-intersection under every numerical perturbation, nor do they validate physical collisions. The source intentionally retains \`topologyVerified:false\` in generated metadata as a reminder that automated external QA, not the mesh constructor, owns final validation.

## 5. Genuine 360-degree visual results

New isolated \`rock-b1r2.html\`, \`rocks/b1r2-showroom.ts\`, \`scripts/capture-rock-b1r2.mjs\` provide:
- Actual side-by-side A-V0 / A-V2 / A-V3, same physical scale, neutral lighting, unchanged T1, silhouette and normals diagnostic.
- Matched A-V2 and A-V3 fixed **front/rear/left/right/three-quarter/top/human-height** views.
- Junction front, side and opposite-side close-ups.
- Wireframe, G1 reference and the original Aurora birch, Scots pine, grass and production rock context.
- True **33 Chromium/Three.js WebGL SwiftShader screenshots**, 1680×945; browser error list \`[]\`.
- A portable offline contact-sheet/gallery package created from **only the actual browser PNG pixels**, never generated concept art.

### Critical art finding: geometrically continuous ≠ sculpturally continuous

The A-V3 union successfully removes the internal overlapping faces and reduces visible z-fighting risks, but **the separate angular wedge remains strongly recognizable**. The before/after neutral close-ups are extremely similar. The CSG Boolean interface fixes mathematical topology, not the independent original primary and shoulder face planes. Their aesthetic composition was not fundamentally redesigned.

The local deformation moves vertices at most 12 mm, too little to change the major-plane hierarchy, and a larger deformation would violate the narrowly authorized shape-preservation objective or produce new seam/tessellation problems.

The side view retains a prominent attached-wedge contour. The rear scarcely benefits. In G1 comparisons, A-V3 still does not demonstrate the intentional multi-mass transition or natural plane-to-plane composition of the reference.

**Art recommendation: ART REJECT — APPROACH NOT SUCCESSFUL at premium visual integration.** This is a technical prototype, **not** an ART APPROVE. Do not promote V3 to production reference merely because its CSG geometry is watertight.

## 6. Real CI, regressions and performance

**[Verified implementation Actions run 39866581535](https://github.com/Algolon/Aurora-Rest/actions/runs/39866581535): BOTH JOBS PASS.**

- **49/49 unit tests PASS** (includes existing nature/B1/B1R, new deterministic V3, shared attributes, edge incidence, orientation, connectivity, Euler test and preserved originals).
- TypeScript \`tsc --noEmit\` and Vite production build PASS.
- Protected old source \`git diff --exit-code\` PASS.
- Independent Feh Lu We source parity **birch / Scots pine / grass / production rock PASS**.
- Browser source: Chromium + Three.js WebGL/SwiftShader, 33 actual PNGs and no console errors.

**Whole-frame screenshot metrics** include shadow and ground marker:
- A-V2 neutral isolated: **6 drawcalls, 366 triangles** in the rendered frame.
- A-V3 neutral isolated: **4 drawcalls, 458 triangles** in the rendered frame.
- Three-way V0/V2/V3 neutral: **10 drawcalls, 818 triangles** in the rendered frame.

A-V3 does use one rock draw mesh instead of two, but it increases rock polygon count by ~39%. Rendering calls and shader costs are not equivalent to physical mobile GPU performance. No meaningful GPU profiling, instancing/collision/LOD, runtime island integration or physics performance was tested. The Boolean operation is geometry-generation code, not a recommendation to run CSG on every frame. Actual CPU generation time was not reliably benchmarked, so none is asserted.

## 7. Final decision and escalation

| Criterion | Outcome |
|---|---|
| Technical deterministic union | PASS |
| Geometry manifold/connectedness at authored parameters | PASS |
| G1/A2/B1/B1R/vegetation source preservation | PASS |
| Real WebGL evidence | PASS |
| Original A-V2 silhouette and bounds | PASS |
| Visible transition indistinguishable from pasted-on wedge | **FAIL** |
| Premium G1/R04 sculptural geological hierarchy | **FAIL** |
| Owner ART APPROVE | **NOT REQUESTED / NOT GIVEN** |

### Is this method appropriate for B?

**Not as a direct art workflow.** CSG union with constrained clipping is reusable as a final *topological cleanup step* after the main shape is designed. It is **not** an appropriate substitute for deliberate 3D geological art direction and connected plane authoring. Repeating it on B-V2 would probably produce another mathematically continuous but artistically assembled rock. B was not touched.

### What method would be required to improve the art?

A future, separately authorized task should re-author the actual main/secondary face intersection rather than simply union the existing two shapes: delete and rearrange selected original polygons, design connected large transition planes in a shared topological control cage, weld intended structural edges and check the silhouette from all sides. This may benefit from manual sculpt/Blender editing rather than another purely convex-clipping workflow. Do not add more geometric noise, random triangles, additional attached stones or texture masking.

The technically valid deterministic V3 union, explicit earlier failure diagnostics and reproducible WebGL tests remain safely available for that later decision.

## 8. Checkpoint and stop

**Source pin:** \`5e1d412e24d054ff8b659236b39feb0f99c1cced\`  
**Validated implementation CI:** https://github.com/Algolon/Aurora-Rest/actions/runs/39866581535  
**Original unmodified 33-image artifact:** https://github.com/Algolon/Aurora-Rest/actions/runs/39866581535/artifacts/12463084984

The report was committed separately on the isolated branch; verify the final HEAD and its CI run before handoff. **No B/C/D/E or island work; no merge/deploy.**

**STOP AFTER A-V3: TECHNICAL PASS / ART REJECT.**
