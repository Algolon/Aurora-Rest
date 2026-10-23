# AURORA REST — ROCK-R01-G02
## Hand-Authored Non-Convex Sculptural Blockout — Genuine WebGL Review

**Date:** 23 October 2026
**Owner authorization:** "Ga verder met de G02 — Hand-Authored Non-Convex Sculptural Blockout".
**Art direction:** Believable Nature, Sculpted for Wonder.
**Selected design:** B1 / The Sheltered Fault — pronounced, integrated geological joint.
**Execution branch:** \`art/rock-r01-g02-nonconvex-blockout\`
**Starting source commit:** \`b76d7d3698eb46ff68fc756a9735c3390e19ab7b\` (frozen G01R review).
**G02 source creation:** \`d4851d446c273d33aea020f38e803c014ab30a28\`.
**G02 validated source:** \`ec680f2e993e0b3a18661e7994ba5d6b7a832edd\` (one regression test indexing fix; no geometry change).
**CI PASS:** [Run 40025472151](https://github.com/Algolon/Aurora-Rest/actions/runs/40025472151).
**17 original actual Chromium/Three.js WebGL screenshots + metrics:** [Artifact 12532138352](https://github.com/Algolon/Aurora-Rest/actions/runs/40025472151/artifacts/12532138352).
**Status:** **TECHNICAL PASS · BLOCKOUT CONDITIONAL · ART NOT APPROVED.** Owner artistic decision pending.

### 1. Protected source and implementation footprint

Created new additive files on a new isolated branch:

- \`rocks/r01/g02NonConvexCore.ts\`: complete G02 source-owned hand-authored topology.
- \`rocks/r01/g02Geometry.ts\`: Three.js BufferGeometry with complete normal, color and UV attributes.
- \`rocks/r01/g02-showroom.ts\`, \`rock-g02.html\`, \`vite.g02.config.ts\`: isolated live review viewer, including G1 vs G02 and G01R vs G02.
- \`scripts/capture-rock-g02.mjs\`: genuine browser evidence.
- \`tests/rock-r01-g02.test.ts\`: determinism, topology, scale, outward winding, attribute/disposal assertions.
- \`rocks/r01/ROCK_R01_G02_BLOCKOUT_BRIEF.md\`: mission, constraints, sculptural landmarks and art gate.
- \`.github/workflows/rock-r01-g02.yml\`: protected-source gate and independent build/WebGL evidence.

Original source G01 and G01R is unchanged; R04/G1, A2 T1, F01, birch, Scots pine and grass source, Feh Lu We and WORLD/GEO/ENV/POP/MAT all remain untouched. No F01 registry update, island integration, merge, deployment, or asset approval.

### 2. Actual sculptural construction

The entire exterior is one watertight, continuous, non-convex hand-authored stone shell. It is **not** an automatic convex-hull clipping process, two stacked primitive rocks or a hidden Boolean operation. Three-dimensional reference vertices are authored explicitly in a nonuniform 6 × 4 spatial design scaffold; the surface is closed along a shaped shoulder contour and an asymmetric ground-contact contour.

- **Primary mass:** High left/rear body reaching approximately 2.4 m (authored crown); 75–80% as intended, though the perceived volume ratio has not been quantitatively measured.
- **Secondary displaced shoulder:** Lower right/front region with its own large sloping facets and a natural continuous shared surface.
- **Recessed geological transition:** Four intentionally displaced seam controls receding toward the rear, with depth expressed through XYZ geometry rather than texture alone.
- **Support:** One irregular intermediate shoulder contour and widened, low ground ring; current side panel regularity remains a visual shortcoming.
- **Real authored triangles:** Only 108, without any random geometry noise or tessellation subdivision optimizer.

**Key interpretation:** \`nonconvexUpperSurface=true\` means authored recessed surface control geometry, not a proof of a rigorously quantified nonconvexity score or that the resulting art is premium. The visual observation is more important than descriptive metadata.

### 3. Verified technical metrics

| Measure | Actual observation |
|---|---:|
| Automated tests | **64/64 PASS; zero skips** |
| TypeScript / Vite G02 build | **PASS** |
| Real Chromium WebGL2 captures | **17 actual PNG screenshots** |
| Browser JS/HTTP errors | **0 reported** |
| Triangle count | **108** |
| Nonindexed render vertices | **324** |
| Distinct authored control vertices | **56** |
| Bounds | **3.624 × 2.355 × 2.982 metres** |
| Structural seam controls | **4** |
| Main+secondary geometric regions | 2 intended; one physical connected solid |
| Shell manifoldness | **PASS** by welded-edge incidence, connectedness, Euler genus-zero and signed volume tests |
| Geometry determinism, finite normals/UV/colors | **PASS** |
| Renderer calls: isolated G02 | 5 whole-scene per-frame calls (including floor/shadow passes; not rock-only) |
| Renderer calls: nature context | 17 whole-scene calls (includes vegetation etc.) |
| A2 T1 material compatibility | Real WebGL render successful; A2 material source unchanged |
| Physical GPU / Android FPS | **NOT MEASURED** |
| Exhaustive self-intersection / collision / LOD | **NOT VALIDATED** |

First G02 CI run 40025382663 failed because the new normal-checking test used an incorrect buffer offset; test only was corrected in \`ec680f2e\`. It did not reveal a geometry defect. The following CI 40025472151 verified the corrected complete workflow.

### 4. Authentic visual evidence — prioritized frames

See the linked artifact:

- \`G1-versus-G02-neutral.png\`: original benchmark **left**, experimental G02 **right**.
- \`G01R-versus-G02-neutral.png\`: art-rejected G01R **left**, experimental G02 **right**.
- \`G02-neutral-front.png\`, \`G02-neutral-frontThreeQuarter.png\`, \`G02-neutral-rear.png\`, \`G02-neutral-rearThreeQuarter.png\`, \`G02-neutral-left.png\`, \`G02-neutral-right.png\`, \`G02-neutral-top.png\`, \`G02-neutral-human.png\`.
- \`G02-neutral-grazing.png\`, \`G02-neutral-wireframe.png\`.
- \`G02-A2-T1.png\`, \`G02-A2-T1-rear.png\`.
- \`G02-nature-context.png\`.
- \`G01R-versus-G02-rear.png\`, \`G1-versus-G02-rear.png\`.
- \`metrics.json\`.

These are **actual Three.js/WebGL renderer captures** and not image-generated concept art.

### 5. Artistic assessment (blockout gate)

**Positive relative to G01R:**

1. Genuine form depth: two distinct elevation zones emerge from one shared shell; no radial triangle spoke fragments.
2. The geological transition is genuinely spatial and open at the top, rather than a single triangular notch darkened by materials.
3. The right shoulder reads more distinctly in silhouette and rear three-quarter view.
4. The shape remains separate from G1, and its source complexity remains small.

**Unresolved failures relative to owner-selected B1 and original G1:**

1. **Too mountain-shaped / peaked silhouette.** Front and nature context frame show two miniature peaks, not one broad substantial weathered boulder. G1 reads as a more mature rock composition.
2. **Still architectural in the lower portion.** The mid/foot rim creates strongly vertical or regular supporting faces, too close to a low-poly extruded block. Lack of naturally integrated ground-contact weathering.
3. **The recessed seam reads too much like a V-notch and gap between peaks.** The desired shallow, partially sheltered, discontinuous fault does not convincingly flow onto the frontal mass and right side.
4. **Plane layout remains mechanically grid-derived.** Although vertices are individually authored, adjacent panel boundaries and repeated edge structure remain too systematic. Some flat facets are too large and monotonic under neutral light.
5. **The T1 material does not repair the sculptural issues.** The difference from approved handcrafted vegetation is visible at human walking distance.

### 6. Art disposition and recommendation

**TECHNICAL G02 BLOCKOUT: PASS, fully preserved.**
**ART: CONDITIONAL for further FORM STUDY ONLY — NOT ENVIRONMENT READY.**

It is meaningfully more non-convex and integrated than G01R, but it should **not** be promoted to the asset library, merged or instantiated into Aurora's island. The owner makes the final artistic decision.

A possible narrowly scoped **G02R** (NOT authorized here) should focus only on three first-order changes: broaden/soften the primary crown and make a lower asymmetrical secondary shoulder; shorten/narrow and partially shelter the V-shaped cleft; replace the regular lower skirt with fewer larger hand-directed battered planes and natural embedded contact points. Preserve the current G02 source, controls and camera evidence for exact comparisons; do not solve via random noise, higher triangle count or texturing.

If owner finds G02 still aesthetically too mechanical, consider real manual artist-led sculpting with editable mesh topology as a distinct workflow decision, rather than escalating increasingly elaborate code-generation of procedural forms.

### 7. Mandatory stops and scope integrity

**STOP after first genuine G02 WebGL review.** No automatic G02R, no replacement of the historical G01/G01R, no F01 family registration, no production island changes, no new rock families, no merge or deploy.

All technical evidence is linked above, and actual visual approval is deliberately withheld.
