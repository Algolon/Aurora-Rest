# ASSET-SOURCE-R06 — Original Moss Volume + R05 Photographic Ground Pilot

**Status:** original supplier geometry integration study, unapproved art. Protected original 558 recovery source files and former world runtime remain untouched.

## Execution instructions and reference

1. Starting reference: art/asset-source-r05-polyhaven-floor-pilot at 0d87633aae59f158a8735a97f8030eab1913a7bf, rooted in bced77ca3ca0539f7137cd9f066e6220518cf4a8.
2. Verify original author and license for [Poly Haven Moss 01](https://polyhaven.com/a/moss_01) — Rob Tuytel, [CC0](https://polyhaven.com/license). Record publisher file metadata and source size, and download original 1K glTF, BIN, diffuse/normal/ARM plus separate 1K alpha PNG, checking official MD5 and size, then SHA256.
3. Critical discovery: Official 1K glTF is *not* the 246,000-triangle preview. It contains 12 genuine frond source primitives totaling 204 triangles. Never claim the rich full moss screenshot is a loaded single source GLTF model.
4. Instanced assemblage: place 48 copies of each of these 12 real geometry groups in one bounded 0.85 × 0.62 meter area, 576 instances and 9,792 triangles. Retain true original mesh vertices, UVs, normals and supplier PBR, plus the official alpha mask. This *authored composition* is not an official source LOD or the original rich clump. Do not synthesize plant geometry, run Blender, change original source assets, or scatter into the world.
5. Reuse the original source R05 Forest Leaves 02 verified 1K PBR set, exact same 2.4m original ground geometry, world light and cameras between A/B. A = bare source R05 ground; B = same source R05 ground plus the one instanced Poly Haven moss clump.
6. Verify genuine Chromium WebGL A/B/A on walking, oblique, macro, overhead, source control and pixel-identical A restoration, cost <=15,000 added source triangles, <=18 draw calls, no GL errors. Original files are shipped only in CI artifact, NOT Git.
7. Artistically judge whether small original fronds form a credible nonrepeating mosaic that reads as living moss instead of alpha billboards; distinguish technical proof from art approval. If inadequate, close REVISE or REJECT without entering another micro-sculpting loop.

## Licence, risk and limitations

Poly Haven model and original 1K maps are published under CC0 with artist Rob Tuytel. Official API: https://api.polyhaven.com/files/moss_01 ; credit for API use: Powered by Poly Haven. Model is a set of source frond prototypes; no assumption that source preview's Blender geometry-node population was preserved in glTF. All file dependencies fetched from the publisher under HTTPS and hashed. No download from marketplace mirrors.

Original Photoshop-like R03 design remains visual goal only; R05 full organic photo PBR provides material base but not silhouette. Actual material macro/walking outputs are required. Stage only, no Android FPS claims, no production library adoption, no merge/deploy.
