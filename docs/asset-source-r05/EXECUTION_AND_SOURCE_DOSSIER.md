# ASSET-SOURCE-R05 — Verified Natural Asset Source Pilot

**Status:** Source-first CC0 selection. Genuine bytes and WebGL must pass before ART review.

## Mission and execution contract

1. Protect baseline recovery bced77ca3ca0539f7137cd9f066e6220518cf4a8 and R04 rejected source checkpoint baa9a7209ab87e16537a8cdc7420b483b45c5166. Use an isolated new branch. No merge, deploy, or source library admission.
2. Find verified ORIGINAL publisher material rather than another synthetic plant model. Read direct-source asset licensing, author, price, resolution, maps and reuse rights.
3. Source pilot candidate: [Poly Haven Forest Leaves 02](https://polyhaven.com/a/forest_leaves_02), author Rob Tuytel, CC0. Official [licensing](https://polyhaven.com/license). Original textured photogrammetry-derived forest floor with photographed moss, small litter and twigs. This is **PBR texture maps**, not a scanned 3D shrub or terrain mesh.
4. Resolve diffuse, OpenGL normal and roughness JPG/PNG at 1K **through the official Poly Haven API**. Reject missing maps, untrusted host, size mismatch or official published MD5 mismatch. Record strong SHA-256 hashes. Image byte content remains unmodified. Credit **Powered by Poly Haven** for using the live API. Store original maps and provenance in GitHub Actions artifacts, not silently in Git.
5. Exact controlled geometry: reuse R04's original 2.4 × 2.4m base ground geometry. A applies existing R04 vertex-colour material; B applies source diffuse/normal/rough maps using MeshStandardMaterial. Same positions, UVs, normals, camera, lights and colour management. No 3D shrub or new moss sculpting, no tileable mesh magic. This isolates material value, not full ecosystem quality.
6. Capture real Chromium/SwiftShader A/B/A from walking, oblique, macro, top views. Reject synthetic/missing texture fallback. Validate source MD5 & SHA, map dimensions, bounds, renderer, no errors, A/B/A pixel-identical restores. Scope is an asset-material showroom, not real-device FPS.
7. Artistically review if the real photo PBR significantly improves colour heterogeneity, humus/leaf material and normal lighting at 1K; say if imagery is flat, too repetitive, wrong scale, or lacks actual moss geometry. ART GO is not implied by CI green.
8. Stop with documented source/provenance, genuine screenshots, art verdict, next source options and protected Git SHA. No merge or deployment.

## Three genuine candidates

| Candidate | Publisher/licence | Fact and reason |
|---|---|---|
| [Forest Leaves 02](https://polyhaven.com/a/forest_leaves_02) | Poly Haven/Rob Tuytel, CC0 | Selected. Moss, leaves, twigs, soil; original 1K maps for surface evaluation. |
| [Moss 01](https://polyhaven.com/a/moss_01) | Poly Haven/Rob Tuytel, CC0 | Deferred. Original 3D model ~0.8m across and ~246k triangles at published quality; too expensive for unproven mass instancing. Needs LOD-specific pilot before adoption. |
| [Forest Ground 04](https://polyhaven.com/a/forest_ground_04) | Poly Haven, CC0 | Reserve PBR texture, not introduced as hidden substitute for first choice. |

## Licensing and implementation constraints

- Official CC0 text: https://polyhaven.com/license ; commercial use and redistribution permitted, attribution appreciated.
- Public API metadata/files: https://api.polyhaven.com/info/forest_leaves_02 and https://api.polyhaven.com/files/forest_leaves_02 ; API credit policy: https://polyhaven.com/our-api .
- File entries supplied by API identify actual download URLs, byte sizes and MD5. The CI outputs SHA-256 and a provenance JSON. No unverified filename/path assumptions.
- Original maps downloaded in isolated CI working directory and distributed as workflow artifacts only. Do not ship the produced artifact or CDN file in release without later owner art/source approval.
- NOT importing Poly Haven thumbnail/renders as textures or downloading multi-megabyte photogrammetry mesh.
- NOT building or claiming a leaf-dense Vaccinium model in R05; separate source vetting required if needed.
- No Blender, Python photoreconstruction, generated images masquerading as a real source, new world scripts, production asset library modifications, deployment or merges.

## Visual acceptance requirements

User's R03 visual target remains a composition/lighting guide, not real scan ground truth. First compare whether source's moss/litter/ground frequencies feel truly richer under the same light with the same geometry. Look for repeats, texel limits, overcontrast, colour-cast, correct OpenGL normals, plausible roughness at walking height and macro; if material still looks like a sheet, mark **ART REVISE** and propose *one distinct* depth/geometry or source 3D sample, not another arbitrary procedural sculpting loop.

## Reproducibility

Commands in the GitHub workflow perform original source ingestion, hash checks, TypeScript, Vite and WebGL captures. Source changes on the isolated branch are auditable separately from PBR binary photos temporarily staged in CI. Source downloads must be trusted by the publisher's original map MD5, not by an external aggregator or author's generated descriptions. Historical POP ancestry remains separately BLOCKED regardless of green recovered CI.
