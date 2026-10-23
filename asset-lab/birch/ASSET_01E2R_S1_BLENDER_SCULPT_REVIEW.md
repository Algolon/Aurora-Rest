# ASSET-01E2R-S1 — Blender-authored geological sculpt study

Aurora Rest · 23 October 2026 · **TECHNICAL PASS / ART CONDITIONAL / OWNER APPROVAL PENDING**

One rock only. The unified surface removes the conspicuous independent wedge seen in V2/V3. It does **not** yet establish that the overall sculpture meets the premium G1 standard. Preserve this editable study for owner review; do not expand a family or integrate it into the island.

## Repository and environment

- Authorized branch: `art/asset-01e2r-s1-blender-geological-sculpt`.
- Exact starting checkpoint: `5e1d412e24d054ff8b659236b39feb0f99c1cced`, verified against `art/asset-01e2r-b1r-multimass-calibration`.
- Read-only V3 reference: `abdbbac822178b0dcf8e98ba740212bd6b060181`.
- Protected G1/A2 material checkpoint: `91a2e0c8fc909a4a25f00e6d5fd621ddb703e6d8`.
- Verified local repository remote: `https://github.com/Algolon/Aurora-Rest.git`. Existing WORLD checkout was clean and left on its original branch. S1 uses a separate worktree created directly from the explicitly authorized B1R checkpoint. No existing S1 branch was found locally or remotely.
- Actual local Mac Blender: **5.2.2 LTS**, build hash `d13f752e3b9c`. Executable, `--version`, background startup, `bpy`, glTF export and import were executed successfully. Exporter identifies itself as **Khronos glTF Blender I/O v5.2.40**.
- The source art checkpoint does not contain AGENTS.md or PROJECT_INSTRUCTIONS.md. The applicable supplied instructions and the canonical workspace copies were read before editing.

An initial sandboxed graphics startup crashed inside Metal detection. The authorized local Blender invocation outside that restriction ran correctly. A constructor syntax error was corrected before valid artifacts were produced. None of those failed attempts is represented as model evidence. All delivered Blender images come from successful local Cycles execution.

## Prior evidence and design reversal

Reviewed actual downloaded historical Chromium images from [B1R](https://github.com/Algolon/Aurora-Rest/actions/runs/39861894234) and [B1R2](https://github.com/Algolon/Aurora-Rest/actions/runs/39866581535), including the V0/V2/V3 neutral comparison, V3/G1 and junction views. Also read both B1R2 diagnosis and technical/art rejection reports and inspected the geometry and existing T1 shader source.

V3 solves topology while preserving independent primary/secondary planes. S1 starts from **one explicitly authored polygonal surface**. The shoulder is neither a copied V2 wedge nor a solid that is later unioned. No CSG, convex hull, primitive assembly, random facets, noise or subdivision is used to construct S1.

The fixed artistic intention is a compact granitic erratic: left-biased crown, descending oblique roof, one broad supporting right shoulder, unequal rear cleavage planes, a stable footprint and a few weathered edge cuts. This is stylized fracture logic, not a geological simulation.

## Authored mesh and stages

[build-rock-s1.py](art/blender/s1-geological-sculpt/build-rock-s1.py) contains named structural points and explicit polygon boundaries. The actual editable cage has **34 shared vertices and 29 polygons**. The front cleavage, crown roof, shoulder bridge and right connecting face share R/S and their boundary edges. There is no closed shoulder object or hidden main/secondary intersection.

S1-A neutral review exposed a narrow artificial crease at the first hinge layout. The same study was revised so five structural points lie on a common frontal plane. S1-B aligned the large roof/front/side patches. S1-C added one broad shared upper-right ridge and five selective **18 mm, one-segment** edge bevels. This clarified the subordinate form without adding another rock. S1-D recalculated orientation, checked the shell, applied identity transforms, added UV/color attributes and exported the evaluated copy. No separate rock variant or family was developed.

The source cage is preserved in collection **01 EDITABLE**. Collection **02 EXPORT** has the evaluated flat-shaded mesh; bevels are baked on this copy only. Named vertex groups, a face patch ID attribute and patch-name metadata support later Blender edits. The script is not required to open or edit either mesh. Source edits do not automatically update the evaluated copy; that limitation and reproduction steps are documented in the [artifact README](art/blender/s1-geological-sculpt/README.md).

## Editable source, GLB and material handling

- [Actual Blender project](art/blender/s1-geological-sculpt/aurora-rock-s1.blend).
- [Actual exported GLB](art/blender/s1-geological-sculpt/aurora-rock-s1.glb).
- [Visual review index](art/blender/s1-geological-sculpt/review.html).
- [Construction and topology metrics](art/blender/s1-geological-sculpt/geometry-metrics.json).
- [Independent saved-project validation and hashes](art/blender/s1-geological-sculpt/saved-blend-validation.json).

GLB settings: glTF 2.0 binary, selected runtime object only, metric size, Y-up conversion, vertex normals, UVMap, explicit `COLOR_0`, one mesh/primitive, no camera, light, animation, compression extension or external texture dependency. Ground pivot is `[0,0,0]` within the support footprint; node transforms are identity. The neutral Blender material is portable standard PBR, not a claim to reproduce the custom Aurora shader.

Primary Three.js review overrides the exported material with a **front-sided neutral MeshStandardMaterial**, vertex colors disabled. Secondary review directly uses the **unchanged A2 T1 triplanar material**. Exported local positions/normals/colors are compatible; no shader adapter or global texture changes were necessary. Metric face UVs use existing density 0.38. Neutral renders and front-sided culling provide the main normal/winding evidence, independently of the exported default material's double-sided setting.

## Measured geometry

| Property | Editable cage | Evaluated Blender surface | Exported GLB |
|---|---:|---:|---:|
| Vertices | 34 | 49 | 172 attribute vertices / 49 welded spatial vertices |
| Polygons before export triangulation | 29 | 39 | — |
| Triangles | 64 | 94 | 94 |
| Connected exterior components | 1 | 1 | 1 |
| Boundary / non-manifold edges | 0 / 0 | 0 / 0 | 0 / 0 |
| Inconsistent paired-edge winding | 0 | 0 | 0 |
| Degenerate faces / triangles | 0 | 0 | 0 |
| Euler characteristic | 2 | 2 | 2 |

Final exported dimensions **2.080 × 1.647 × 1.547 m (W/H/D)**; relative to nominal A-V2: +3.0%, −4.5%, −0.8%. The rock retains the compact size class. The GLB bounds are approximately X `[-1.02,1.06]`, Y `[0,1.64695]`, Z `[-0.78,0.76680]`.

Independent GLB triangle analysis gives **positive signed volume 2.98026 m³**, 141 undirected welded edges and minimum exported-normal/triangle-normal dot **0.89627**. Blender's polygon-based volume differs slightly because some n-gons are nonplanar; the separately measured saved-project triangulated volume agrees with the GLB. No invalid normals or reversed triangle winding was found. BVH diagnostics found **zero nonadjacent triangle overlap candidates**. This is a useful self-intersection check, not exhaustive proof for every adjacent contact or future edit.

## Genuine visual evidence

All delivered images depict the actual mesh. No ImageGen, concept image, heightmap or procedural stand-in is presented as engine evidence.

**Blender / Cycles:** eight neutral views in [renders](art/blender/s1-geological-sculpt/renders/): front, rear, left, right, three-quarter front/rear, top and 1.70 m human-height perspective. Six diagnostics cover the un-beveled cage, silhouette, source-edge overlay, directional plane highlighting, shoulder close-up and contact close-up. The stage-A primary PNG shows the final un-beveled control cage after refinement; it is not an archived rejected early version.

**Blender / protected references:** original A-V0, A-V2, A-V3 and G1, each from front and both three-quarter directions, plus G1/S1 side-by-side at actual scale. References come from immutable original Three.js attribute arrays converted to Blender coordinates. The original meshes were not remodeled, and their individual minimum Y values are normalized to the studio ground. Historical reference renders were reused unchanged in the final batch; every S1 render was regenerated for the final cage.

**Three.js / Chromium WebGL2 (SwiftShader):** **29 real 1440×1000 screenshots** in [threejs](art/blender/s1-geological-sculpt/threejs/) and [browser metrics](art/blender/s1-geological-sculpt/threejs/browser-metrics.json). The showroom loads the exported file using `GLTFLoader`. It includes neutral 360 views, human perspective, shoulder/contact views, T1, wireframe, silhouette, matched V0/V2/V3/G1 comparisons, close and wide approved nature context. Both full G1 and S1 remain visible in the final reference framing.

Key evidence:

- [Blender neutral front three-quarter](art/blender/s1-geological-sculpt/renders/threequarter-front.png).
- [Blender source control cage](art/blender/s1-geological-sculpt/diagnostics/wireframe.png).
- [Three.js neutral S1](art/blender/s1-geological-sculpt/threejs/s1-neutral-threequarter-front.png).
- [Three.js V3 versus S1, same scale](art/blender/s1-geological-sculpt/threejs/A-V3-s1-neutral-threequarter-front.png).
- [Three.js G1 versus S1, same scale](art/blender/s1-geological-sculpt/threejs/G1-s1-neutral-threequarter-front.png).
- [Three.js unchanged T1](art/blender/s1-geological-sculpt/threejs/s1-T1.png).
- [Original Aurora birch, Scots pine and grass context](art/blender/s1-geological-sculpt/threejs/aurora-nature-wide-T1.png).

Blender area lighting and Three.js hemisphere/directional lighting are intentionally neutral but not pixel-identical. Both expose the same silhouette and shared shoulder; the sharper WebGL lighting also makes the simple front planes easier to judge.

## Validation and preservation

**Implemented:** actual editable Blender geometry, static GLB, isolated showroom, reproduction scripts and image index.

**Locally tested:** Blender version/background/bpy/export; native project save and independent reopen without reconstruction; editable source and evaluated mesh collection checks; real GLB export/re-import; Blender topology, BVH diagnostics and identity transforms; independent binary GLB parser/topology tests; **47/47 lab tests**; strict TypeScript; original Vite build and isolated S1 Vite build.

**Browser-verified:** actual GLB loading; orientation, scale, ground pivot, normals, finite UV/color attributes; neutral and unchanged T1 shader compilation; no missing faces or visible junction gaps in reviewed views; approved nature-context loading. Final browser/console/shader error list is **empty**. The only pre-final browser defects were a Vite directory-URL trailing-slash issue and an absent favicon; both were corrected and the full capture rerun. Build output retains a normal large-chunk advisory for the isolated lab bundle.

**Protected source parity:** `git diff --exit-code 5e1d412 -- src asset-lab/birch/src` passes. All original G1/B1/B1R/A2, production rock, birch/pine/grass sources and world sources are unchanged. V3 is reproduced only as a pinned read-only snapshot, not modified. No Feh Lu We checkout or remote was written. The existing nature regressions pass; this task does not claim a new independent Feh Lu We source-parity run.

Whole-frame browser measurements, including ground, marker and shadows: neutral single S1 **4 draws / 222 triangles**; nature context **20 draws / 11,754 triangles**. The rock is one primitive / one main-pass draw. These are captured render counts, not physical device performance. Android performance, collision and island placement are outside this study.

## Critical artistic assessment

| Criterion | Assessment |
|---|---|
| Sculptural coherence | Improved over V2/V3: one parent form, no attached-wedge seam. |
| Large-form quality | Deliberately biased crown and descending roof; front remains broad and austere. |
| Geological logic | Shared oblique cleavage and supported shoulder are coherent; weathering is restrained. |
| Silhouette | Compact and asymmetric; quieter and less distinctive than G1. |
| Handcrafted stylization | Explicit authored patches; no randomized facets. Still risks reading as a simple faceted boulder. |
| 360 quality | Closed and supported from all sides; rear and left are the least expressive. |
| Aurora fit | T1 palette and original vegetation are compatible; context alone does not prove premium sculpture. |
| Three.js validity | Actual export loads correctly, with neutral/T1 evidence and no reported errors. |
| Editability | Actual saved editable cage and named evaluated mesh independently reopened successfully. |

**Recommendation: ART CONDITIONAL.** The structural hypothesis is supported: authoring the shoulder within the same cage yields visibly better continuity than preserving two convex solids and CSG-unioning them. The stronger claim—premium handcrafted geological quality on par with G1—is **not yet demonstrated**. The secondary form is now integrated but subtle. Several broad surfaces remain simple, and some nonplanar n-gons produce diagonal shading during triangulation. The 18 mm edge treatments are understated at gameplay scale. Texture does not remedy these limitations.

Stop after this rock. The owner should inspect neutral front, rear, side and matched V3/G1 views and decide whether this quieter direction merits later refinement. No further art production is authorized by this recommendation. **No owner ART APPROVE has been inferred from technical checks.**

## Checkpoint and CI

**Exact final asset / implementation checkpoint:** [`bfb4b8bd5cbbd330c2af8da234b9ac9097530c5e`](https://github.com/Algolon/Aurora-Rest/commit/bfb4b8bd5cbbd330c2af8da234b9ac9097530c5e).

**Actual implementation CI:** [Run 39950655843 — SUCCESS](https://github.com/Algolon/Aurora-Rest/actions/runs/39950655843), job `static-export-and-webgl` SUCCESS. The log confirms **47 tests / 47 pass / 0 fail**, strict TypeScript and both builds, protected source parity, and **S1 real GLB WebGL PASS 29 images**. Independent exported topology numbers agree with the local results above.

**Genuine CI browser artifact:** [Artifact 12499533691 — 29 PNGs and browser metrics](https://github.com/Algolon/Aurora-Rest/actions/runs/39950655843/artifacts/12499533691).

The follow-up documentation commit changes only this report to record the observed checkpoint and CI result; it deliberately skips duplicate CI. All model, renderer, test and evidence files remain byte-identical to the validated asset commit. The final branch-tip SHA is supplied in the handoff. The static CI workflow validates the GLB and Three.js only; native Blender reopening and rendering were verified locally, and artistic approval remains the owner's decision.

**STOP: one S1 study; no family, merge, deploy, release or island integration.**
