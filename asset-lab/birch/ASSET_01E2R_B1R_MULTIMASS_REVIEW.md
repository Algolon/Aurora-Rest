# ASSET-01E2R-B1R — A/B Multi-Mass Sculptural Calibration

**Aurora Rest · Nature Asset Library · 22 October 2026**

**Source branch/HEAD (verified before editing):** \`art/asset-01e2r-b1-rock-family-archetypes@0f19462163c19189d3d4d4df588b3f6398d028e9\`

**Isolated working branch:** \`art/asset-01e2r-b1r-multimass-calibration\`

**Last geometry/lookdev implementation checkpoint:** \`5747be152c9dbab6a19f334e8a0207810cc82e69\`

**Verified implementation CI:** [Run 39861894234 — both jobs SUCCESS](https://github.com/Algolon/Aurora-Rest/actions/runs/39861894234)

**Genuine Chromium/Three.js WebGL artifact:** [Artifact 12462595951 — 82 PNGs plus metrics](https://github.com/Algolon/Aurora-Rest/actions/runs/39861894234/artifacts/12462595951)

**TECHNICAL PASS / ART REVIEW PENDING.** No ART APPROVE assigned by owner. No B2, island integration, merge or deploy.

## 1. Safety, baseline and diagnosis

1. Confirmed project repository and exact B1 source checkpoint; target B1R branch did not exist and was created directly from the authorized SHA.
2. Inspected source B1 rock archetype/half-space geometry, B1 showroom, browser screenshots, previous B1 art review, G1 geometry and A2 T1 texture workflow.
3. \`AGENTS.md\` and \`docs/PROJECT_INSTRUCTIONS.md\` do not exist at the source checkpoint (404). No nonexistent policy content was assumed.
4. No accessible GitHub branch held partial B1R work at preflight. Local/uncommitted state of another machine is not accessible through the GitHub integration and was not claimed inspected.
5. Original B1 A/B, all C/D/E, G1, A2 texture source, production nature assets, GEO/WORLD and Feh Lu We sources are unchanged.
6. Automated CI includes \`git diff --exit-code\` over protected original code and independent original FLW production source parity checks against \`17eafb0902833fb1121c77083f9f862eb4ffcd96\`.

**Baseline diagnosis:** B1-A/B were visually distinct but dominated by one convex half-space-clipped body each; the main surfaces were angular and somewhat generic. G1's higher-level interaction between main and supporting stone volumes suggested adding a **single subordinate, naturally raked shoulder** without adding noise facets or copying G1's frontal slab.

## 2. Three genuinely controlled versions for each rock

Implemented solely in new file \`src/rocks/experimental/b1r/multiMassRocks.ts\`.

- **V0:** Existing \`buildRockArchetype(id,'refined')\` output, byte-identical to protected B1 baseline. One closed source solid.
- **V1:** Exact same primary geometry plus a deliberately modeled closed secondary shoulder, partially penetrating the primary lower flank. Separate authored convex clipping planes, not a scaled main rock copy.
- **V2:** Same exact primary plus one alternative stronger, differently raked and better embedded secondary shoulder. No third mass, no new fracture network or random faceting.

A's shoulder emerges at the front-right low flank to give a compact body an asymmetrical supporting transition. B's mass emerges near the long right terminus, emphasizing the broad glacial orientation. Both use local authored half-space cuts with significantly different proportions and geological directions.

**Important modeling truth:** V1/V2 are **two independently closed, spatially overlapping solids**. They have NOT been Boolean-unioned or converted into one watertight outer manifold. The asset uses one common material but two draw-submeshes. The corresponding intersection surfaces inside the primary remain in the source; this is accepted for a reversible art study, **not proof of production-ready union topology**.

Both V1/V2 are algorithmically deterministic. The secondary component's centroid was checked by point-in-mesh ray-intersection tests as lying inside the original primary and secondary, and the parts are enclosed/wound correctly. This validates actual embedding, but not the geological quality of the seam.

## 3. Critical visual iteration and rejected initial integration

The initial secondary placements were valid but visually read as *a loose stone pasted onto the front* of A/B. This failed the central artistic objective. Before the final visual capture the secondary centers were moved deeper into the principal flank and given primarily **side-contour rather than front-facing** emergence. The supporting geometry remains unchanged across the three intended comparison states; no extra experimental versions were added to the final V0/V1/V2 review.

B-V2 also initially increased total height by 17%, violating the 15% guardrail due to a buried bottom. The vertical extent was corrected; final height increase is within 15%.

After inspection of actual 82 final neutral/T1 images, the transition is *less pasted on* but still visually a separate little shoulder on an otherwise simple big convex body, particularly for B. It does not yet fully match the handcrafted integrated form hierarchy of G1.

## 4. Final measured geometry & silhouette guard

Actual final WebGL \`metrics.json\` from artifact 12462595951:

| Rock / version | Dimensions W × H × D (metres) | ΔW vs V0 | ΔH vs V0 | Triangles | Nonindexed vertices | Independent solids |
|---|---|---:|---:|---:|---:|---:|
| A-V0 | 1.790 × 1.560 × 1.560 | — | — | 62 | 186 | 1 |
| A-V1 | 1.990 × 1.670 × 1.560 | +11.2% | +7.1% | 114 | 342 | 2 |
| A-V2 | 2.020 × 1.725 × 1.560 | +12.8% | +10.6% | 118 | 354 | 2 |
| B-V0 | 5.044 × 1.910 × 2.370 | — | — | 58 | 174 | 1 |
| B-V1 | 5.504 × 2.175 × 2.370 | +9.1% | +13.9% | 110 | 330 | 2 |
| B-V2 | 5.514 × 2.145 × 2.370 | +9.3% | +12.3% | 114 | 342 | 2 |

Depth remains unchanged in the final reported bounds. Both preserve main crown and main body exactly, with A clearly compact and B still widely horizontal (B V2 width/height approximately 2.57). Secondary volumes extend slightly below the baseline \`y=-0.34\` ground surface, providing physically plausible ground penetration and hiding bottom edge contours.

**Separate mass footprint:** A secondary x half-extents ~0.46–0.51 m, z half-extents 0.42–0.44 m; B ~0.79–0.86 m x, z ~0.66–0.69 m. Actual contact footprints need terrain placement later; no exact collision mesh is delivered.

No triangle budget artificially capped at 62/58. Added geometry provides a second intentionally modeled silhouette and plane structure, not arbitrary random triangles.

## 5. Genuine browser evidence and style review

New isolated \`rock-b1r.html\` / \`rocks/b1r-showroom.ts\` / \`scripts/capture-rock-b1r.mjs\`:

- Fixed matched *real-scale* A/B V0/V1/V2 three-up views, identical camera, exposure, lighting and same neutral or A2 T1 material.
- Every individual A/B V0/V1/V2 has front, rear, left, right, three-quarter, top and human-height views.
- Component diagnostic surfaces in ochre against neutral main stone, optional wireframe, closeups, genuine unchanged G1 reference and real original Aurora birch/Scots pine/grass/production rock scenery.
- Only existing T1 Nordic Granite reused, no new material maps, textures or global shaders.
- 82 original 1680×945 PNG screenshots from genuine headless Chromium/Three.js WebGL/SwiftShader. Real browser metadata \`errors=[]\`. Not generated 2D illustrations.

[Full-resolution 82-image review + metrics](https://github.com/Algolon/Aurora-Rest/actions/runs/39861894234/artifacts/12462595951). Separate review contact sheets and an offline HTML gallery were created from crops of those pixels for the owner; the originals remain authoritative.

**360 assessment:** no outright holes, floating fragments or visible depth z-fighting were observed in the review captures. However the two components visibly intersect at their boundary and can read as a distinct added solid, a genuine stylistic concern. Full triangle-triangle self-intersection analysis of the union boundary was not performed.

**G1 compatibility:** A and B retain the established angular, faceted stone language and match T1 palette, but their overall mass-to-mass composition is still more schematic and less refined than G1.

## 6. Measured performance & technical QA

**Run 39861894234** (on implementation commit \`5747be152c9dbab6a19f334e8a0207810cc82e69\`):
- **45/45 unit tests PASS**, including previous B1 model tests, deterministic regenerated multi-mass geometry, individually closed nondegenerate solids, winding/volume, embedded centroid check, and ≤15% silhouette variation.
- TypeScript strict check and Vite build PASS.
- Protected G1/R04, A2, original B1 and original nature source diff guard PASS.
- Original Feh Lu We birch, pine, grass and production rock independent parity PASS.
- Genuine WebGL screenshot captures PASS, 82 PNG files, browser and shader error list empty.
- Disposal is idempotent, geometry regenerates after disposal; components remain reusable under rotation/scale because coordinates are authored in local mesh space. Actual 360 images validate visual geometry, but there is **no physical Android FPS measurement**.

Whole-frame render statistics (including floor, height marker and shadow passes, not isolated rock GPU cost):

| Scene | Renderer calls | Rendered triangles |
|---|---:|---:|
| A V0/V1/V2 neutral, physical scale | 12 | 718 |
| B V0/V1/V2 neutral, physical scale | 12 | 694 |
| A-V1 alone component diagnostic | 5 | 230 |
| A-V2 alone component diagnostic | 5 | 238 |
| B-V1 alone component diagnostic | 5 | 222 |
| B-V2 alone component diagnostic | 5 | 230 |
| A-V2 + original nature context | 20 | 10,990 |
| B-V2 + original nature context | 20 | 10,982 |

The two independent mesh objects require two mesh draws in the main shading pass, before any shadow/depth passes. Production instancing/multidraw, LODs, collider generation or union merging were not implemented. One shared A2 T1 PBR material is used per component; in the showroom the existing A2 material factory allocates all T1/T2/T3 map resources, but only T1 is displayed for normal art review.

## 7. Art-direction recommendation — owner decision required

| Archetype | Provisional technical art recommendation | Remaining issue |
|---|---|---|
| **A: prefer V2 over V1/V0 for *further calibration*** | **ART CONDITIONAL**, not owner approval. V2 makes the lower angular shoulder most visible while preserving the compact outline. | Still a distinctly attached wedge at some viewpoints. Main-to-secondary structural boundary lacks a fully sculpted transition. |
| **B: prefer V2 over V1/V0 for *further calibration*** | **ART CONDITIONAL**, not owner approval. V2 retains broad glacial form and a more horizontally integrated terminal shoulder. | Shoulder can still read as a secondary block, not naturally fractured parent rock. Main body remains a large convex polyhedron with limited large-to-medium mass interplay. |

V0 should remain available as the fallback if owner considers the multi-mass experiment weaker. V1 is visually cleaner but delivers less change. There is no obligation to select V2 merely because it contains more polygons.

The **technical central hypothesis** — a secondary stone mass can be authored, geometrically embedded, and repeatedly rendered with protected source fidelity — has been demonstrated. The **artistic hypothesis** — adding an overlapping shoulder automatically yields convincing handcrafted integrated geology — is **not yet proven**.

**Next possible B1R follow-up (planning only):** re-author a local transition between primary and secondary main geological planes with an explicitly continuous junction (selective primary-side sculptural recession, authored bridge/union region or a carefully validated Boolean/welded seam), without changing overall A/B silhouette. This should be evaluated under neutral 360 views before involving T1; do not just add another loose rock or more random faceting.

C/D/E remain on their original B1 art statuses and have NOT been modified; the 10–15 full family is not authorized.

## 8. Traceability and stop

Protected B1 source checkpoint \`0f19462163c19189d3d4d4df588b3f6398d028e9\`, isolated \`art/asset-01e2r-b1r-multimass-calibration\`, last implementing change \`5747be152c9dbab6a19f334e8a0207810cc82e69\`.

[Implementation CI and original screenshots](https://github.com/Algolon/Aurora-Rest/actions/runs/39861894234)

The current branch tip after writing this review report contains only documentation changes beyond the referenced geometry implementation; verify its exact commit SHA from the live branch/CI before handoff.

**STOP AFTER A AND B. Technical PASS; ART REVIEW PENDING. No C/D/E rework, B2, merge, deployment or island integration.**
