# AURORA REST — ASSET-SOURCE-R06 Final Source and Independent Art Review

**FINAL: TECHNICAL PASS; ORIGINAL SOURCE / CC0 PROVENANCE PASS; ART REJECT for R06 assembled moss volume. NO production asset approval.**

## Protected source, original source and actual model content

- Protected original Aurora Rest recovery: bced77ca3ca0539f7137cd9f066e6220518cf4a8. Recovered source CI separately preserves original 558 protected file bytes; historical missing POP Git ancestry remains separately BLOCKED.
- R05 approved material direction: 0d87633aae59f158a8735a97f8030eab1913a7bf. Original selected PBR substrate texture = Poly Haven Forest Leaves 02, published by Rob Tuytel, CC0.
- First-party R06 moss asset = [Poly Haven Moss 01](https://polyhaven.com/a/moss_01), original credited creator Rob Tuytel; [Poly Haven original CC0 licence](https://polyhaven.com/license) supports reuse/redistribution including commercial.
- **Important verified packaging disparity:** supplier advertises ~246,000 triangles and densely volumetric moss in its main model preview, but supplied first-party **1K glTF actually holds only 12 small individual original moss-frond mesh prototypes, totaling exactly 204 primitive triangles**. The rich geometry-node/evaluated preview **is not present as an imported GLTF clump**. Neither the source nor this pilot should be described as a 246k-triangle model in Three.js.
- R06 composes 48 instances of each of the original 12 source fronds: **576 actual source-geometry copies / 9,792 submitted source triangles**, 0.85m × 0.62m local bounded footprint. These are first-party mesh vertices/UV/normals, instanced through native Three.js, not newly sculpted fake morphology. The arrangement is an **original Aurora Rest review-only composition**, not a publisher-provided LOD.
- Original mesh retained from glTF, separate original publisher 1K alpha PNG used for visible cutouts; original GLTF texture maps diffuse/normal/ARM are unchanged. Forest floor is exactly the R05 2.4 × 2.4m reviewed photographed PBR on the existing R04 geometry, with no world modifications.

## Verified original file byte evidence

| Supplier asset component | Size | Publisher MD5 matched | Strong SHA-256 |
|---|---:|---|---|
| Moss 01 glTF 1K | 18,481 | 1baba498fd3936673609dda5ecfe960a | 36fe6cb9889abb33f4dbee402928e260a3e7dfaec043d39b80b1e3afff684f65 |
| moss_01.bin | 7,260 | cdb092878a81b3208a162d79546892fe | 440e3cadbd93ad383cdbb9b4c17c3236774924c33ff62ac409ab00b8ed622861 |
| 1K moss diffuse JPG | 170,297 | 5768f973a7d6d2846a2e76a6b0669a83 | 7c8d0794dd9db0a82f668a276896818d195c644cfed35f0fbf984a3260e70e50 |
| 1K moss OpenGL normal JPG | 388,925 | faf161f708abe274db1b8087800fa08b | 531d6bea634ac956d87b176a89740f229ec7e8137a6413e290bab640c6a8b0ec |
| 1K moss ARM JPG | 336,140 | e3b6adf32db7076885afe0e179cc1850 | 0cf0aabfc370a51e7d330ae01e63ca380f88a9bb0fcfa94730374476183a12cf |
| 1K moss alpha PNG | 85,174 | e55f1cca390d93f23980a5fdbe1dc705 | 00da5c2d0164338c2330587737ff65cefb5575de0c7019ae20bd6f60976608c0 |

Original supplier dependency manifest and R05 original Forest Leaves 02 validated diffuse/nor_gl/rough materials also retained in [CI artifact with raw source, provenance and real screenshots](https://github.com/Algolon/Aurora-Rest/actions/runs/40244245296/artifacts/12618635155). All files are downloaded anew during CI, with original supplier MD5+length validation and newly calculated SHA-256. Original source binaries are not checked into Git.

## Genuine WebGL A/B/A results — identical R05 base

[Real WebGL build / original supplier byte tests / TS / 3D authored-instance tests / four A/B/A captures](https://github.com/Algolon/Aurora-Rest/actions/runs/40244245296) **SUCCESS**.

| Camera | A: R05 PBR, no source moss | B: R05 + original source moss | Pixel-identical A restore |
|---|---|---|---|
| Walking height | 2 calls / 26,914 triangles | 14 calls / 36,706 triangles | PASS |
| Oblique eye | 2 calls / 26,914 triangles | 14 calls / 36,706 triangles | PASS |
| Macro | 2 calls / 26,914 triangles | 14 calls / 36,706 triangles | PASS |
| Overhead | 2 calls / 26,914 triangles | 14 calls / 36,706 triangles | PASS |

Added cost: 12 draw calls / 9,792 source triangles, exact match with geometry audit. Five original supplier files plus source alpha = 6, and 3 original forest PBR maps validated. Original R05 ground PBR/material/light/camera geometry unchanged. No JS/browser errors. Real Chromium SwiftShader review ONLY, not a physical Android device benchmark. Protected game files unaffected.

## Visually inspected source screenshot verdict

**Review from real browser PNGs, not AI art or publisher thumbnails.** R05 source photographic forest floor contains believable leaves, twig, moss-colour and soil litter. With the R06 source fronds enabled:

- **Walking height — FAIL:** little distinguishable volumetric benefit, moss clump is visually imperceptible without searching for it, no cohesive soft carpet silhouette.
- **Oblique — FAIL:** one small dark local sprig area, not a dense interlocking natural moss bed. The surface still looks almost fully flat.
- **Macro — FAIL:** a regular field of upright, narrow black-green sprigs; repeated thin stems read like miniature stalks, crop stubble or card-like foliage. Not the beautiful full, interwoven green feathermoss from R03 target, and the source model's full premium preview cannot be reproduced from the tiny glTF source without acquiring evaluated source geometry.
- **Overhead — FAIL:** sparse source foliage hardly changes the base photograph; no credible continuous natural moss-mat volume or heterogeneous transitions.

Root cause is primarily **source deliverable mismatch** and its component scale/silhouette, not a shader multiplier. We should NOT patch by increasing random instance count, procedural leaf modelling, arbitrary moss colour grades, or starting a Blender sculpting loop.

**Verdict: TECH PASS / SOURCE PASS / ART REJECT for this assemblage, with a documented source mismatch.** Reject production use of the R06 volume; preserve R05 conditional material foundation separately. Do not mark asset as approved just because the manufacturer source is CC0 or the rendered image changed.

## Bounded next different gate

Recommend **ASSET-SOURCE-R07 — Evaluated Forest-Floor Geometry Acquisition**, no automatic implementation: look only for original publisher-supplied *evaluated* 3D natural moss or mossy forest-floor glTF/GLB/OBJ or genuine 3D scan that visibly includes its full moss bed mass, verify exact downloadable geometry and accompanying texture alpha/normal and CC0/redistributable licence *before* writing integration code. Aim 5–15k source triangles after source-authored LOD, or compare source LOD at multiple distances; if the source lacks an evaluated geometry variant, reject it at the manifest audit gate. Explicit no Blender requirement in chat-first workflow. Two direct candidate types: scanned moss/humus surface geometry, or publisher-assigned optimized moss clump with true evaluated mesh. Do not assume Poly Haven 246k preview equals published 1K glTF.

## Execution and delivery status

R06 code and final verdict isolated to art/asset-source-r06-real-moss-volume. Real capture evidence, original supplier glTF/PBR/alpha with hashes are downloadable GitHub Actions artifacts. Original protected recovery files untouched. No merge, deployment, shader rebaseline, Nature Asset Library registration, runtime game modification or unapproved source import.
