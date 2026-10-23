# ASSET-01E2R-S1R — authored sculptural polish

Aurora Rest · 23 October 2026 · **TECHNICAL PASS / ART CONDITIONAL / OWNER APPROVAL PENDING**

One S1 refinement is preserved. The front now has an oblique two-plane cleavage, the left/rear share a deliberate wrapping break, and the crown has explicit structural faces. The improvement is visible in neutral Blender and real WebGL comparisons. The remaining upper-front triangular rhythm is still less calm and geological than G1's larger stone plates. This candidate is credible as a compact environment rock; it has not established the premium hero-rock standard for the whole family.

## 1. Verified foundation and safety

- Authorized branch: `art/asset-01e2r-s1r-blender-sculptural-polish`.
- Exact starting checkpoint: `7ed1d43aa5e6577bba5238dfa53be645523c110f`.
- Validated S1 implementation: `bfb4b8bd5cbbd330c2af8da234b9ac9097530c5e`, [successful original CI](https://github.com/Algolon/Aurora-Rest/actions/runs/39950655843).
- Protected G1/A2 checkpoint: `91a2e0c8fc909a4a25f00e6d5fd621ddb703e6d8`.
- Verified canonical remote `https://github.com/Algolon/Aurora-Rest.git`; clean original WORLD and S1 worktrees. No S1R branch or partial work existed locally/remotely. Created a new isolated worktree directly from the explicitly authorized S1 SHA.
- Supplied working constraints plus canonical workspace AGENTS.md and PROJECT_INSTRUCTIONS.md were read. Those policy files are absent from the historical art branch; no general policy files were changed.
- Original S1 `.blend`/`.glb`, G1, A/B/B1R/V3 references, A2, production/nature sources, mixed forest, ground cover and world sources remain unchanged. No merge, deployment, release or island integration.

## 2. Actual Blender environment and baseline inspection

Local macOS **Blender 5.2.2 LTS**, hash `d13f752e3b9c`, was verified using the actual installed executable. Background `bpy` loaded the original `.blend`; a disposable duplicate exercised mesh editing, native save and GLB export before art changes. Cycles produced a fresh unchanged neutral baseline from eight required directions.

The actual project contains the original 34-vertex / 29-polygon editable source, separate 94-triangle evaluated mesh, named groups and review collections. Both source and evaluated objects have no live modifier stack: S1's selected bevels are baked only on its evaluated copy. The runtime object's unused diagnostic material slots are not part of its exported primitive. The original mesh and export workflow were inspected directly, not inferred from the GLB.

[Actual inspection](art/blender/s1r-sculptural-polish/s1-inspection.json) records collections, objects, materials/modifiers, all named vertex coordinates, polygon boundaries and measured nonplanarity. The original long oblique roof deviates **85.6 mm** from its polygon plane, crown **71.0 mm**, rear cap **38.2 mm**. These explain part of S1's incidental diagonal shading.

## 3. Diagnosis committed before modeling

[Pre-edit diagnosis](art/blender/s1r-sculptural-polish/S1R_ART_DIAGNOSIS.md) was checkpointed as **`65400f7697795818809ec9e1b26c2ba0057f496f`** before artistic changes.

The diagnosis protects all nine ground vertices a–i, K's high point, compact descending crown, the C/D/R shared shoulder, right lower supports and metric pivot. It targets the quiet frontal cleavage, western/rear slab transitions and warped roof/crown. Planned new points are named according to their structural roles. No generic primitive, independent rock solid or CSG operation is involved.

## 4. Exact modeling changes and editability

[polish-s1r.py](art/blender/s1r-sculptural-polish/polish-s1r.py) **opens the actual protected S1 Blender file and duplicates its existing editable mesh**. It never runs the S1 constructor or edits only the GLB.

S1R-A translates existing A/B/I/H/G/F/J/N/L/M/S in controlled directions: a broader frontal head, staggered western/rear crest, slightly lower right crown transition and modestly lifted shared shoulder ridge. K and the nine flat ground points remain exact. All input/output coordinates are preserved in [geometry metrics](art/blender/s1r-sculptural-polish/geometry-metrics.json).

S1R-B inserts **five shared vertices** on existing boundaries:

- FRONT_LEFT_BREAK on al–A and FRONT_RIGHT_BREAK on bl–B, joined through the original frontal face. Their elevations differ (~0.87 / 0.61 m), producing one oblique cleavage rather than a uniform facet grid.
- LEFT_REAR_BREAK on gl–G and LEFT_SIDE_BREAK on hl–H, joined through the existing west face; the former continues to REAR_BREAK on fl–F through the rear face. This connected crease changes the left/rear mass direction without adding a slab or solid.

The two front panels and western/rear panels are fitted to real planes. Adjacent surfaces retain shared inserted boundary points. Roof/crown and selected neighboring faces receive explicit directionally chosen splits. Remaining materially warped polygons are resolved into explicit patches without inserting any further points. The source retains the original geological patch IDs; its child polygons are visible/editable rather than silently warped n-gons.

S1R-C replaces five 18 mm S1 bevel selections with **J–K and K–L at 24 mm; N–G at 14 mm** on the evaluated copy. Fracture ridges stay sharp. Runtime triangulation happens **before** flat normal, UV and color generation. There is no smoothing, subdivision, random noise or displacement.

The saved file has **10 S1R EDITABLE** and **11 S1R EXPORT** collections, while original S1 collections remain hidden backups inside this new project. All 34 original named groups survive, plus five new fracture groups. The source is directly editable without running the script. The evaluated copy is regenerated through documented steps; it is not automatically linked to later source edits. The [README](art/blender/s1r-sculptural-polish/README.md) explains this practical limitation and reproduction workflow.

A BMesh index-table error in the first bevel attempt was corrected by preserving edge references before editing. Only successful final native/export/render artifacts are delivered. It was an automation bookkeeping defect, not a Blender artistic limitation.

## 5. Sculptural before/after assessment

| Region | Observed change | Remaining weakness |
|---|---|---|
| Front | Unequal upper/lower planes and slanted cleavage replace the quiet vertical panel; shared bridge still flows into the shoulder. | Several supporting triangles converge near the shoulder/roof; the rhythm can look crystalline rather than broadly chiseled. |
| Left | Clear upper/lower mass transition and asymmetrical ledge improve the former quiet column-like profile. | Mid-height break is angular and may feel abrupt under grazing light. |
| Rear | One connected oblique break and staggered crest create stronger supporting planes. | Rear upper triangulation is more active than necessary; this is not a G1-quality hero back face. |
| Crown | Left-biased high point and descending right roof survive; explicit planes remove accidental shading. | Top/front has more triangular face language than G1's large slabs. |
| Base | Exact original flat ground points and stable support retained. | Original lower perimeter still reads somewhat as a continuous chamfer band. |

The candidate is **more sculpturally articulated than S1 in front, left and rear**, not merely denser: export rises only from 94 to 96 triangles. This does not by itself establish premium quality. Its compact asymmetrical identity remains clear and no attached wedge returns.

## 6. Actual native and runtime artifacts

- [Editable S1R Blender project](art/blender/s1r-sculptural-polish/aurora-rock-s1r.blend).
- [Actual exported GLB](art/blender/s1r-sculptural-polish/aurora-rock-s1r.glb).
- [Complete visual review index](art/blender/s1r-sculptural-polish/review.html).
- [Independent saved-file verification](art/blender/s1r-sculptural-polish/saved-blend-validation.json).

Export: selected evaluated object only, binary glTF 2.0, metres, Y up, identity node transform, origin on ground plane, vertex normals, UVMap at existing 0.38 density and explicit COLOR_0. No lights/cameras, animation, morph, external texture or Blender-only shader dependency. Actual GLB re-import returns the final dimensions and **96 triangles**. Three.js uses `GLTFLoader` on this file; no approximate geometry path exists.

Primary browser review is front-sided neutral MeshStandardMaterial, vertex colors disabled. Secondary review directly reuses unchanged **A2 T1 Nordic Granite** with existing local-coordinate projection and exported colors. No palette, map, moss, shader or material-system edits. The portable exported default neutral material is distinct from this custom Three.js review override.

## 7. Geometry, size and technical suitability

| Property | Original S1 | Refined S1R |
|---|---:|---:|
| Editable vertices | 34 | 39 |
| Editable polygons | 29 | 62 |
| Editable implied triangles | 64 | 74 |
| Evaluated/export triangles | 94 | 96 |
| Evaluated spatial vertices | 49 | 50 |
| GLB attribute vertices | 172 | 260 |
| Exterior components | 1 | 1 |
| Boundary / non-manifold / degenerate | 0 / 0 / 0 | 0 / 0 / 0 |
| Inconsistent edge winding | 0 | 0 |
| Euler characteristic | 2 | 2 |
| GLB primitives / used material slots | 1 / 1 | 1 / 1 |
| Dimensions W/H/D (m) | 2.080 / 1.647 / 1.547 | **2.157 / 1.657 / 1.566** |
| GLB bytes | 8,924 | **12,456** |
| Native Blender bytes | 118,646 | **127,537** |

Bounds growth is approximately **+3.7% width / +0.6% height / +1.2% depth**, within the size guardrail. The final Y-up bounds are X `[-1.097078,1.06]`, Y `[0,1.657239]`, Z `[-0.78,0.785776]`. Location/rotation are zero, scale one, pivot `[0,0,0]` inside the stable support footprint.

Independent GLB analysis: **144 welded undirected edges**, positive triangle volume **3.116617 m³**, minimum triangle/normal dot **0.999999946** versus S1's ~0.89627. Source maximum face nonplanarity is ~`1.07e-7 m`; runtime ~`1.34e-7 m`. Thus visible plane boundaries are now actual authored geometry, not warped polygon normal interpolation.

Source and runtime have one closed oriented shell. BVH checks report **zero nonadjacent triangle overlap candidates**; adjacent-contact numerical edge cases and future edits are not exhaustively proven by that diagnostic. Original S1 input hashes match exactly throughout the build and independent static tests.

Measured whole-frame WebGL counts (including floor, 1.8 m marker and shadow passes): **single S1R 4 draws / 226 triangles**, **S1 + S1R 6 draws / 414 triangles**, **approved nature context 20 draws / 11,758 triangles**. These are render counts, not physical-device FPS or GPU timings.

The isolated rock requires **one main-pass draw**, one primitive/material. The showroom owns each imported geometry; unused imported default materials are disposed after replacement, and page cleanup disposes geometry, review materials, renderer and family resources. Existing T1 factory owns its textures; none are changed. Static local coordinates and ground origin make this a suitable input for later instancing, but no instancing implementation or device benchmark is claimed. A future collision proxy may be simpler than the render mesh; none is added here.

## 8. Genuine Blender and Three.js evidence

**32 actual Blender PNGs:** original S1 has eight mandatory views plus five closeups and three diagnostics; S1R has the same eight views and eight diagnostics (silhouette, wire, planes, front/left/rear/shoulder/contact). The original neutral studio, cameras, 52 mm perspective / 3.2 m orthographic framing, metric scale, ground, 1000×820 resolution and 20 Cycles samples are identical for the baseline and refinement.

**11 matched Blender plates:** [comparisons](art/blender/s1r-sculptural-polish/comparisons/) place **original S1 left / S1R right**. Each panel is the unchanged 1000×820 render; labels are added above. No rotation, crop or rescale exaggerates improvement. [Plate method](art/blender/s1r-sculptural-polish/comparisons/plate-method.json).

**37 genuine Chromium/WebGL2 SwiftShader screenshots:** [threejs](art/blender/s1r-sculptural-polish/threejs/) and [browser metrics](art/blender/s1r-sculptural-polish/threejs/browser-metrics.json). Both actual GLBs are loaded; original G1 is displayed from its unchanged pinned vertex snapshot. Coverage includes neutral 360/human views for both S1 and S1R, side/rear/top comparisons, neutral/Nordic/grazing with neutral/T1, G1 and actual approved birch/Scots pine/grass context.

Comparison layout follows camera screen-right, maintaining original left/refinement right even for left/rear cameras. Rock-to-rock shadow reception is disabled identically in paired views to prevent one model's shadow distorting the other; single views retain self-shadows and the shared floor receives cast shadows. Blender and Three.js light responses differ; cross-renderer pixel parity is not claimed.

Key owner review:

- [Matched Blender front](art/blender/s1r-sculptural-polish/comparisons/blender-S1-S1R-front.png).
- [Matched Blender left](art/blender/s1r-sculptural-polish/comparisons/blender-S1-S1R-left.png).
- [Matched Blender rear](art/blender/s1r-sculptural-polish/comparisons/blender-S1-S1R-rear.png).
- [Neutral WebGL three-quarter](art/blender/s1r-sculptural-polish/threejs/S1-S1R-neutral-threequarter-front.png).
- [Neutral WebGL left](art/blender/s1r-sculptural-polish/threejs/S1-S1R-neutral-left.png).
- [Neutral WebGL rear](art/blender/s1r-sculptural-polish/threejs/S1-S1R-neutral-threequarter-rear.png).
- [G1 comparison, actual scale](art/blender/s1r-sculptural-polish/threejs/G1-S1R-neutral.png).
- [Unchanged T1 / Nordic](art/blender/s1r-sculptural-polish/threejs/S1-S1R-T1-nordic.png).
- [Approved Aurora vegetation context](art/blender/s1r-sculptural-polish/threejs/aurora-nature-context-wide.png).

G1 remains a substantially larger hero asset. S1R shares its angular material/plane vocabulary but has a smaller, more crystalline face structure. Context shows compatibility; it is not used to hide weak neutral form.

## 9. Validation and protected regressions

**Implemented:** actual saved-file source edits, evaluated copy, GLB, isolated review scene and reproducible evidence scripts.

**Blender-tested:** original-file preflight; native save and independent final reopen without rebuilding; all 39 groups/source topology and backup; flat runtime normals, attributes, identity transforms; selected GLB export/re-import, dimension match and BVH diagnostics. Final file hashes are recorded, not inferred from a successful renderer build.

**Locally tested:** **50/50 Node tests**, including all previous S1/nature/material/lifecycle checks and three new independent S1R binary tests. Strict TypeScript and original plus isolated Vite builds pass. Only the existing large-chunk advisory remains for the lab bundle.

**Browser-verified:** 37 actual GLB screenshots; **zero page/console/shader/resource errors**. Neutral front-sided review exposes correct scale/orientation, no missing faces/inverted winding, stable contact, intended faceting and unchanged T1 compatibility.

**Protected parity:** original source and complete S1 asset directory diff clean against `7ed1d43`. No tests weakened. Independent original **birch, Scots pine, grass and production rock** raw geometry/attribute/bounds checks all pass against pin `17eafb0902833fb1121c77083f9f862eb4ffcd96`. Grass material pixel parity passes for all four variants: **0 changed pixels / 0 maximum RGB difference**, 576,000 pixels per variant. [Machine-readable regression summary](art/blender/s1r-sculptural-polish/regression-summary.json).

The external reference was materialized in a disposable temporary test directory; pre-existing Feh Lu We directories/remotes/source were never modified. It is not an Aurora runtime dependency. CI uses a sparse source-only reference and reruns these checks without Blender.

## 10. Critical art recommendation and stop

| Gate | Result |
|---|---|
| Stronger front/left/rear large/medium form | Visible improvement; moderate rather than a premium breakthrough. |
| 360-degree quality | Left/rear are more articulated; top is the busiest remaining view. |
| Compact asymmetric identity / shoulder | Preserved, with small measured bounds changes and exact original support points. |
| Handcrafted control | Actual source edits and named structural boundaries; no random generation. |
| G1 compatibility | Compatible compact environment-rock candidate; G1 hero quality is not matched. |
| Blender editability | PASS: independent saved-file inspection. |
| Three.js validity / protected technical safety | PASS locally; exact CI evidence recorded in checkpoint addendum. |
| Final owner art approval | Not given or inferred. |

**ART CONDITIONAL.** S1R is suitable for owner review as a normal compact environment rock and visibly stronger than S1 in the requested weaker angles. It is not yet the standard for the broader premium rock family. The upper-front/crown triangle convergence and angular mid-height step remain the main concerns. More texture, polygon count or random sculpt passes would not resolve that art-direction question.

The limitation is the chosen authored plane composition and this automation-directed artistic result, **not Blender's modeling capability**. Preserve this single best candidate and stop. No further rock, material study, batching, physics, world placement, merge or deploy is authorized here.

## 11. Exact checkpoint and CI

Branch: `art/asset-01e2r-s1r-blender-sculptural-polish`. Pre-edit diagnosis commit: `65400f7697795818809ec9e1b26c2ba0057f496f`. The exact final asset implementation SHA, observed CI result and visual artifact links are recorded in the verification addendum after the authorized push. Final branch-tip SHA is supplied in the handoff. Native Blender/art validation remains distinct from static CI.
