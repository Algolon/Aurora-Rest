# AURORA REST — ASSET-SOURCE-R05 Final Source and WebGL Art Review

**DECISION: SOURCE & TECHNICAL PASS / REAL PBR MATERIAL VALUE CONDITIONAL GO / FULL FOREST FLOOR ART REVISE.**

## Reviewed original asset

- **Asset:** [Poly Haven Forest Leaves 02](https://polyhaven.com/a/forest_leaves_02), publisher Poly Haven, credited author Rob Tuytel. Official [Poly Haven CC0 licence](https://polyhaven.com/license) explicitly permits commercial use, modification and redistribution.
- **Three original supplier maps selected:** 1K `Diffuse`, `nor_gl` (OpenGL tangent-space normal), and `Rough`. Originals were pulled by [Poly Haven Public API](https://api.polyhaven.com/files/forest_leaves_02). The publisher's byte-size and MD5 were checked, and a SHA-256 was recorded. No guessed mirror URL or generated substitute used. `Powered by Poly Haven` credit is included in the pilot.
- **Provenance:** `source_provenance.json` in the [genuine CI artifact](https://github.com/Algolon/Aurora-Rest/actions/runs/40241109161/artifacts/12616384375); underlying maps kept unmodified in this artifact, NOT committed into the game repository.

| 1K publisher file | Bytes | Supplier MD5 | SHA-256 |
|---|---:|---|---|
| Diffuse JPEG | 437,891 | `13e9bfac07cb72ca143e153cc2f589a8` | `2bac85cdc76927fa7dc311037bbbc4dfa2633ea56eb0a24c9cabe163a68c9aa5` |
| OpenGL normal JPEG | 577,163 | `72002432222467c74cd9980cbddb25a4` | `cf6a40ab24f44d3e891a92a1c252416ed1192af54ac92a5704bdfbda0805e290` |
| Roughness JPEG | 192,523 | `578e637510d8fdd7acf97afc6f329e9d` | `3d2163acb9e22801caa4d34cb3e9bb443dfd0e6f2bebbd559c61e9b14f945dd4` |

Original downloaded resolution confirmed in extracted artifact: **1024×1024 px per map**, total **1,207,577 bytes** in image bytes; actual in-memory GPU footprint, compression/transfers and mipmaps will differ.

## Executed genuine WebGL test

Technical evidence: [R05 publisher-verified material source ingestion, unit tests, typecheck, Vite build and real WebGL run](https://github.com/Algolon/Aurora-Rest/actions/runs/40241109161) SUCCESS. Four matched cameras: walking height, oblique, surface macro and overhead. On every view, A (original R04 base procedural vertex colour) → B (same geometry, original supplier 1K diffuse/normal/rough PBR) → A restores pixel-identically. No Chromium page or console errors. Original R04 ground mesh position, normals and UV are shared between both modes; source world scripts unmodified.

- **Source geometry:** original R04 base substrate, 2.4×2.4m, **26,912 mesh triangles**.
- **Scene:** 26,914 submitted triangles, **2 draw calls** in both A and B, including neutral staging plane. These are WebGL render counters under Chromium SwiftShader, not device benchmarks or guaranteed FPS.
- **Models:** no moss mesh, tree, shrub, scanner, Unreal, Blender, glTF file, LOD or production vegetation was imported in R05. The first-party source is a true photographed **material set only**.

## Independent visual evaluation of real screenshots

**Positive:** Massive, unambiguous improvement in ground surface legibility. A is a smooth blurry green-brown procedural base; B contains authentic broken twigs, thin needles, litter, small moss patches, irregular soil tones and fine lighting cues. The material scale and edge distribution read as actual woodland texture and remove the R04 checkerboard/blank-ground problem. Across identical camera geometry the WebGL scene shows successful original OpenGL normal shading at oblique/macro angles.

**Still not premium/game-ready:** B is structurally a nearly flat sheet. Diffuse and normal detail alone cannot supply raised moss cushions, twig silhouette, layered twigs/roots, canopy contact or thick feathermoss. At walking height the photo is more earthy/yellow-orange than the subdued Nordic greens in R03 art target. Macro reveals a limited 1K texture sample; tiling/seams and realistic game-scale UV density were not tested. The R04 base stage contains no world lighting occlusion or biome-masked transitions. The image has no living bilberry/lingonberry assets; a source texture is not a shrub.

**Art outcome:** source material photographic *approach* CONDITIONAL GO as base material reference; source texture by itself **ART REVISE** for island production. It should not be merged, deployed, or registered as final MAT-01 source without a separate asset/material integration study.

## Other candidate research and limits

- [Poly Haven Moss 01](https://polyhaven.com/a/moss_01) has real geometry and CC0 rights but ~246,000 tris at published resolution. Unverified LOD/mobile costs make this unsuitable for automatic mass placement; NOT downloaded or claimed as tested.
- [Poly Haven Forest Ground 04](https://polyhaven.com/a/forest_ground_04) remains an untested reserve source texture.
- Poly Haven official CC0 licence grants use of its original assets, not rights to publish unowned website preview artwork; this milestone uses only downloaded original supplier files.

## Next distinct gate

**ASSET-SOURCE-R06 — real volume and material marriage**: use R05 verified texture as a temporary base, audit a CC0 genuine moss/forest-floor 3D source **with sufficient LOD or demonstrate decimation to ~5–15k triangles per local patch**, then compare a single 2.4m patch in a neutral source showroom against R05 B. Alternatively, source an organically layered foliage alpha/geometry asset, with verified licence and type. Prioritize morphology/depth and material contact, not density or hue parameter loops. This is a future milestone, NOT authorized by the R05 pilot and not automatically started.

## Source protection

R05 branch originated from R04 final art checkpoint `baa9a7209ab87e16537a8cdc7420b483b45c5166`, descended from protected original recovery `bced77ca3ca0539f7137cd9f066e6220518cf4a8`. Protected original game files not edited. The old POP Git ancestry gap remains separately BLOCKED despite healthy current CI. No merge/deployment/production library admission.