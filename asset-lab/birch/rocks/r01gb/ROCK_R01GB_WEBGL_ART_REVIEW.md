# AURORA REST — ROCK-R01G-B | Targeted Natural Source Selection

**Date:** 2026-10-25 Europe/Amsterdam
**Owner request:** Continue the next step; previous sandbox/web previews were not visible. Evaluate at most two additional sources without Blender.
**Art direction:** Believable Nature, Sculpted for Wonder.
**Locked design:** R01E **A — Nordic Weathered Corestone**. Myrstigen is real weathering/joint reference; Kummakivi supplies one massive continuous silhouette, NOT its exceptional balance.
**Protected technical baseline:** \`6416b8c0de15cdc238f1bf938637ae8dede914c6\`, previous R01G published first WebGL review.
**Isolated branch:** \`research/rock-r01gb-targeted-natural-sources\`.
**Verified CI:** [40240656722 — SUCCESS](https://github.com/Algolon/Aurora-Rest/actions/runs/40240656722).
**Raw capture artifact:** [12616708023 — 21 true Chromium/Three.js WebGL2 PNGs, source glTF/BIN/textures and SHA/MD5](https://github.com/Algolon/Aurora-Rest/actions/runs/40240656722/artifacts/12616708023).
**Permanent, mobile-friendly JPG contact sheet:** [VIEW IMAGE directly in GitHub](R01GB-GENUINE-WEBGL-CONTACT-SHEET.jpg). This JPEG was generated from actual captured WebGL pixels and committed in screenshot-bot commit \`05c05d6993c7060464f007502718baf7f94cf412\`.
**Result:** **TECHNICAL PASS / ART NOT APPROVED for Corestone A**. No merge, deployment, additional source selection, material polish, island changes, or geometry sculpting.

## 1. Sources and legal/geological truth

Two and only two new external source packages were inspected in this phase:

| ID | Real published source | Publisher author/rights | Caution |
|---|---|---|---|
| S1 | [Poly Haven Rock Moss Set 01](https://polyhaven.com/a/rock_moss_set_01) | Kless Gyzen, CC0 | Real authored forest stone geometry, but no verified Swedish/Norwegian geological provenance |
| S2 | [Poly Haven Namaqualand Boulder 02](https://polyhaven.com/a/namaqualand_boulder_02) | Greg Zaal / Rico Cilliers, CC0 | South African Karoo sandstone formation, **NOT Nordic granite**, and visually a **multi-rock composition** despite being provided as a single source mesh |

Official CC0 rights: https://polyhaven.com/license . No added user payment or licensing required for commercial use of source files. This permission does NOT imply the model is the same geological material, place, or specimen as Myrstigen/Kummakivi.

Both sources were downloaded from the publishers' \`api.polyhaven.com/files/<asset>\` public manifests. ALL published files needed for the 1K glTF scene were individually MD5-verified. Their SHA-256 digests, bytes, relative paths and source URL are in artifact \`public/r01gb/source-manifest.json\`. These source files were used read-only in the isolated viewer, not committed into the production asset repository.

## 2. Technical implementation and verified results

- Runtime is genuine Three.js / TypeScript \`GLTFLoader\`, with the prior G1 reference stone shown alongside the source geometry at controlled review scale.
- Individual meshes are selected, isolated, and clay-rendered **without changing original position coordinates, face topology or normals**. Scene instance transforms and uniform normalization are only used for inspection.
- Existing A2 T1 requires vertex colors; clone geometry in the showroom to add **neutral white** color for material compatibility. This does NOT alter raw glTF mesh positions or index arrays.
- Real Chromium software WebGL2 pipeline (SwiftShader) captured 21 original screenshots: seven source meshes in neutral clay, matched G1 comparisons for three candidates, rear/right/top for selected comparisons, nature/T1 and wireframe.
- **67/67 tests PASS, TypeScript PASS, Vite build PASS, WebGL2 PASS, zero reported browser page/console/HTTP errors.**
- Official 1K glTF packages contain **6 actual mesh nodes from S1 and 1 from S2**. S2's **one file mesh is a multi-boulder visual grouping**, not proof of one connected natural stone.
- Protected source scope check passed. The only persistent code is additive under \`rocks/r01gb/\`, dedicated HTML, Vite config, review capture script and workflow.
- User-facing JPG contact sheet (~72 kB) was generated from actual WebGL PNG pixels and pushed to this **isolated** branch by the CI bot. No fabricated concept art was used.

### Per-mesh source measurements

| Index | Actual glTF geometry | Source triangles | Source bounding dimensions X × Y × Z | Artistic conclusion vs A |
|---|---|---:|---|---|
| 0 | \`rock_moss_set_01_rock05\` | 16,548 | 1.817 × 1.205 × 2.999 | Angular/elongated horizontal chunk, sizeable irregular dent but lacks heavy broad crown |
| 1 | \`rock_moss_set_01_rock01\` | 11,000 | 2.238 × 1.473 × 3.369 | Narrow triangular rise, sharp cliff-like flank, not unified corestone |
| 2 | \`rock_moss_set_01_rock02\` | 10,996 | 2.655 × 1.262 × 3.264 | Low thin rounded mound with one forward rounded edge; lacks hero boulder mass |
| 3 | \`rock_moss_set_01_rock04\` | 10,589 | 2.128 × 1.768 × 1.965 | Relatively more height, but steep rock-face/pointed mountain profile, not weather-rounded continuous body |
| 4 | \`rock_moss_set_01_rock06\` | 8,994 | 2.126 × 1.262 × 2.757 | Irregular rough-sculpted block and local abrupt tip, not desired crown |
| 5 | \`rock_moss_set_01_rock03\` | 5,000 | 2.109 × 1.100 × 2.080 | Wide quiet and softened low form, **possible small supporting woodland stone**, too broad/featureless for A hero |
| 6 | \`boulder_02\` | 97,964 | 2.532 × 0.883 × 1.234 | Published as Namaqualand Boulder 02, visually **multiple separate rocks on a shallow patch**. Fails single-body criterion and wrong geology |

Total source triangles evaluated: 161,091. Dimensions are original glTF source units; shown normalized to max horizontal extent ≈3.35m for camera comparison. **They do not establish real-world measured dimensions of the individual field rocks** and do not validate physical GPU FPS.

## 3. Real visual review and interpretation

The original comparison benchmark G1 was a **previous design-language preference**, not a production-approved asset. Its intentional large planes remain an art-direction guide, but it itself is still stylized and low-poly.

**S1 Rock Moss Set 01:** Natural weathering complexity is far more believable than G01/G02 hand-generated facets. But none of the six individual stones simultaneously offers the **broad, heavy, asymmetric tall mass** and a short, sheltered weathering split required by A. Index #0 has some original surface hierarchy, but body is elongated and too horizontal. Index #3 has the strongest height but ends in sharp rise. Index #5 could become a small ambient forest rock, but should not be renamed Corestone A.

**S2 Namaqualand Boulder 02:** Front and rear WebGL views plainly show several separate-looking rocks forming a cluster / surface arrangement, despite the GLTF exporting them inside one source mesh. **Do not misrepresent one mesh as one stone**. Its South-African sandstone material and composition do not correspond to Nordic weathered granite and cannot meet the selected A brief by simply applying Aurora's granite shader.

**Material test:** No extra lookdev done. The prior T1-compatible white-color adapter remains in place for staging; the owner requested morphology first.

**Conclusion:** **Both additional source families fail as a single CORE A hero source.** They are useful future ambient rock candidates but have not received asset-specific approval and are NOT integrated.

## 4. Critical strategic consequence

The stop rule in the prior R01G art review explicitly allowed **at most two more genuine source candidates** and then required a strategy choice, rather than continuing arbitrary downloaded-rock shopping.

That gate has been reached. Do NOT trigger R01G-C "just two more Poly Haven rocks" automatically. The library-source strategy produces real geology-looking geometry, but so far not **the specific selected Nordic weathered corestone shape**.

Recommended next direction after separate owner authorization:
**ROCK-R01H — Specimen-Centric Source Acquisition & Shape Reconstruction Gate.** Use the already chosen Myrstigen+Kummakivi reference shapes as explicit image-based source constraints and locate **ONE authentic single-glacial-boulder multi-view 3D scan** with verified download/commercial derivative rights. The source is accepted only if it looks like the R01E silhouette in true WebGL front, side, rear. If no such model is verifiable, stop acquiring generic packs and change production technique transparently: e.g. artist-authored original low-to-mid-frequency rock from actual photograph/scan data with a human shape-review pass. This proposal is **not** new permission to model or use Blender.

Crucially, neither more random generated triangles nor simply adding the appearance of North-European granite solves mismatched morphology.

## 5. Accessibility and exact permanent source links

The user repeatedly could not see inline sandbox previews. The original source-of-truth screenshot is therefore persisted as **regular JPG in GitHub** at:

[Open genuine seven-candidate comparison in GitHub](https://github.com/Algolon/Aurora-Rest/blob/05c05d6993c7060464f007502718baf7f94cf412/asset-lab/birch/rocks/r01gb/R01GB-GENUINE-WEBGL-CONTACT-SHEET.jpg)

The individual PNGs remain as an attached GitHub Actions artifact, not dependent on a chat sandbox token. Exact artifact:
https://github.com/Algolon/Aurora-Rest/actions/runs/40240656722/artifacts/12616708023

No images are generated from an image model; screenshot contact composition only crops/downscales verified real WebGL images.

## 6. Stop condition

**TECHNICAL R01G-B COMPLETE. ART NOT APPROVED. Protected geometry and world preserved.** No Blender, no procedural sculpt, no merge, no deployment, no automatic further source trials. R01E A is still the owner-approved target.
