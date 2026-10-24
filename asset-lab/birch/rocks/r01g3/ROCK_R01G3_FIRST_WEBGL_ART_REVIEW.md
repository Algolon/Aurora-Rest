# AURORA REST — ROCK-R01G (Three.js-first correction)
## Actual source-rock WebGL review — 24 October 2026

**Owner instruction:** abandon Blender and the past iterative Three.js polygon-sculpt loop; resume chat-first research, licensed *natural source geometry*, native Three.js, and one bounded visual review. 
**Owner-approved design:** R01E A — Nordic Weathered Corestone, Myrstigen (local unequal weathered joint) + Kummakivi (coherent large mass, not balancing contact).
**Protected baseline:** \`93b1278d369492bb4c25f284a280387264595d09\`.
**Isolated branch:** \`research/rock-r01g-threejs-natural-geometry-pilot\`.
**Final verified runtime SHA:** \`61d992310d524da3e6f05bb6a1143278aea148dc\`.
**Verified CI:** https://github.com/Algolon/Aurora-Rest/actions/runs/40090905758
**Original 21 genuine Chromium/WebGL2 PNGs, glTF+BIN+1K PBR maps, metrics and hashes:** https://github.com/Algolon/Aurora-Rest/actions/runs/40090905758/artifacts/12558892914
**State:** **TECHNICAL PASS — ART NOT APPROVED as Corestone A**. Owner decision pending. No merge, deployment or world integration.

## 1. Three actual available source families reviewed from publishers' evidence

| Source | Publisher / license | Real authored format and suitability | Disposition |
|---|---|---|---|
| **Rock Moss Set 02** | Poly Haven / Kless Gyzen / CC0 | Seven real weathered stones, published ~58K total triangles. Closest initial match to rounded Nordic boulders; **selected for actual WebGL test**. | Technical PASS, ART CONDITIONAL only as secondary boulder source |
| **Rock Moss Set 01** | Poly Haven / Kless Gyzen / CC0 | Six forest stones, ~63K tris, more obvious fractured rock faces in publisher's photo. | Reserve; NOT downloaded or WebGL verified during this iteration |
| **Namaqualand Boulder 03** | Poly Haven / Greg Zaal & collaborators / CC0 | One Karoo sandstone block, ~122K tris; natural but more rectilinear/very different geology. | Secondary/negative comparison, NOT downloaded or WebGL verified |

Official sources:
https://polyhaven.com/a/rock_moss_set_02
https://polyhaven.com/a/rock_moss_set_01
https://polyhaven.com/a/namaqualand_boulder_03
License: https://polyhaven.com/license
Official public API: https://polyhaven.com/our-api and \`GET https://api.polyhaven.com/files/rock_moss_set_02\`.
These source models are **NOT** actual 3D reconstructions of Myrstigen, Kummakivi or Scandinavian bedrock, and must NEVER be labelled so in the game.

## 2. Genuine source geometry and technical work

- Remote Poly Haven API discovery: see source-probe CI https://github.com/Algolon/Aurora-Rest/actions/runs/40089862932.
- Retrieved 1K **gltf + original .bin + three PBR textures** from the official Poly Haven CDN; verified all 5 exact publisher-supplied MD5 hashes and recorded independent SHA-256 values. Raw geometry positions/indices stay unchanged.
- The glTF contains **7 actual node/mesh objects**, loaded using actual \`GLTFLoader\` and staged individually in a new source-owned Three.js showroom \`rocks/r01g3/showroom.ts\`.
- Bounding-box group translation, uniform viewport scale to ~3.35 m horizontal width, and a WHITE vertex color attribute are the **only stage adjustments**. White COLOR_0 is necessary because the existing A2 T1 shader uses \`vertexColors:true\`; without a color attribute it renders black. Stage adapter duplicates \`BufferGeometry\` but does not reshape vertex positions or indices. The raw glTF file is preserved.
- The source geometry is rendered in real Chromium/Three.js/WebGL2 SwiftShader (not physical Android GPU); neutral clay, original G1 same-setup comparison, selected right/rear views, optional unchanged A2 T1 and existing Aurora birch/pine context.
- **67/67 tests pass, TypeScript PASS, Vite build PASS, genuine WebGL capture PASS, 21 screenshots, 0 recorded page/console/HTTP errors**.
- Original R01E A 2D sheets, G1, G01/G01R/G02/G02R, F01, vegetation, world, materials and other branches are unmodified; protected source diff check passed. **No Blender involved.**

### Imported individual geometries (real Poly Haven mesh names)

| Display index | glTF mesh | Source triangles | Original bounding XYZ units | Art assessment |
|---|---|---:|---|---|
| 0 | \`rock_moss_set_02_rock07\` | 9,826 | 1.693 × .745 × 1.215 | **Closest natural low rounded mass** but oversized edge hollow, lower silhouette than A |
| 1 | \`rock_moss_set_02_rock08\` | 8,000 | 1.206 × .529 × .984 | Sloped ridge/triangular flank, too small/generic for A |
| 2 | \`rock_moss_set_02_rock10\` | 8,000 | 2.203 × .768 × 1.552 | Pleasant broad flow, but too flat/plate-like |
| 3 | \`rock_moss_set_02_rock11\` | 8,000 | 1.954 × 1.311 × 1.529 | Height nearer A, but sharp angular shelf/mountain shape |
| 4 | \`rock_moss_set_02_rock12\` | 7,999 | 1.580 × .736 × 1.443 | Multi-lobed weathering but low, busy/over-carved |
| 5 | \`rock_moss_set_02_rock13\` | 7,928 | 2.091 × 1.256 × 1.138 | Significant local relief, too vertically sliced/irregular |
| 6 | \`rock_moss_set_02_rock09\` | 7,894 | 1.629 × .610 × 1.011 | Broad flat low stone, no distinct hero crown |

Total in the seven imported meshes: **57,647 triangles** (sum listed above). Each normalized width is set near 3.35 m for comparison, with proportions preserved. Staged candidate 0 height is only around **1.47 m** at that scale, below A's preferred 1.8–2.4 m target.

## 3. Artistic verdict against approved A

Primary owner criteria: heavy singular asymmetrical boulder, broad weathered high mass, short sheltered non-mirrored crack, 3–5 coherent natural geological regions, lower integrated convex right belly, irregular embedded support. At walking distance it must look like a Nordic glacial/weathered boulder, not two peaks, an angular rock wall, uniform-low-poly slab or volcanic lump.

**What is convincingly better than G01–G02R:**
1. The scanned/authored geometries exhibit real localized variable-curvature stone regions, fine weathering relief and credible side/rear continuity, without triangle-grid patterns.
2. One actual submesh can be isolated, loaded at metric stage scale, shaded with neutral clay and Aurora's T1 material with transparent source provenance.
3. Meshes have true detailed normals and can be inspected in Three.js without Blender.

**What still prevents A approval:**
1. **Candidate 0** is a low rounded boulder with a large hollow/broken end in the face, not the short, sheltered Myrstigen-type crevice. Rear is simplified; whole-body mass lacks A's high broad crown.
2. **Candidate 2** shows uninterrupted curves but flattens into a long shallow slab.
3. **Candidate 3 and 5** reach more convincing relative height but feel angular, swept and vertical rather than a large unified naturally weathered corestone.
4. None have both a strong A silhouette AND the specific sheltered localized fracture from the owner's Myrstigen+Kummakivi direction.
5. Provenance is generic weathered stone from an external author's pack; it has **no validated Nordic geological specimen origin**. CC0 grants creative use but does not establish lithology or natural formation history.

**ART DISPOSITION:** source import/review pipeline APPROVED FOR FURTHER RESEARCH, but **no present single mesh is ART APPROVED for the Corestone A hero rock**. Candidate 0 may be explored separately as a small woodland side-boulder; don't call it the main original A. Do not force the candidate toward A via random deformation or polygon surgery, and do not simply retexture to "solve" silhouette.

## 4. Material note (independently resolved)
Initial screenshot with the existing A2 T1 material was black because the external GLTF lacked the vertex-color attribute expected by the existing T1 shader. R01G viewer now adds **WHITE vertex colors on a cloned review geometry** (no original positions or faces touched). Fresh WebGL captures confirm this resolves the black material. No shader source has been changed. This is a transferable safe import-compatibility adapter if art ever approves a genuine candidate.

## 5. Recommended narrowly scoped next task — R01G-B (NOT AUTOMATICALLY AUTHORIZED)

**Scan-first single-boulder selection**, not another polygon modeling loop.

1. Screen a maximum of two distinct additional actual natural 3D sources, prioritizing a broad, tall-ish rounded individual boulder with a small natural sheltered pocket over multi-stone sets. Rock Moss Set 01 may offer an alternative, but no "match" can be inferred from the publisher thumbnail alone.
2. Preserve their CC0 source and exact geometry hashes, using the same verified ingestion tool. Prioritize shape fit from FRONT, SIDE and REAR and a verified single-mass design.
3. If neither matches A, **stop** and reconsider the source acquisition strategy (specific licensed geological 3D scans, or owner-mediated external authored asset workflow). Do not return to the failed G01/02 procedural topology method.
4. Only after OWNER ART APPROVE of the actual single geometry would texture coherence, creative adaptations, LODs, F01 registration, collision and island integration be authorized.

**STOP:** first legitimate source and WebGL review completed. No merge or deployment.
