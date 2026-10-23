# POP-02A asset compatibility and acceptance audit

Source branches were read, never checked out for editing or merged. `provenance.json` pins seven required commits and every extracted module's original SHA-256. Exactly 23 transitive modules are copied into `src/nature-library`; no showroom app, unrelated vegetation family factory, experimental R04/E2 rock or Feh Lu We runtime is imported. Source foliage atlas utilities contain the existing shared atlas tiles; that is retained source infrastructure, not new family integration.

| System | Factory / mapping | Source scale | Materials / alpha / shadows | Backend and lifecycle | Status |
|---|---|---|---|---|---|
| Birch B1R / B2 | `createBirchFamily`, variants 0–2, near/mid/far; logical xfar shares far | E.g. variant 0 near: ~6.70 × 11.81 × 5.81 m, descriptor scalar applied unchanged | Source vertex colors, bark compensation, own leaf tint, shared atlas, custom alpha-aware depth | C2 species batch, instanced or native multi-draw; family owns geometry/material leases | Source-fidelity gate reproduced; owner art approval not inferred |
| Scots pine C1 / C2 | `createPineFamily`, variants 0–2, same source LOD policy | E.g. variant 0 near: ~6.67 × 13.57 × 8.62 m | Distinct pine reference tint/material; shared alpha-aware depth/atlas | Existing `createNatureBatch` composes species batches; no per-item delete | C2 report CONDITIONAL overall; prior source/render validation is evidence, not new owner art approval |
| Grass D1 / D2R | `createGrassFamily`, four `flw-production-reference` variants | Source short tuft ~0.37 m high, seed-head variant ~0.77 m; POP scale preserved | Original real blade geometry, source normals/colors, FrontSide shader; no foliage atlas on grass | Source `GrassBatch`, source/refined fade profiles, shared family owners; local optional orientation/stable fade-key extension | D2R source fidelity accepted in source report; natural mass/ground integration explicitly CONDITIONAL |
| Production rocks E1 | `createRockFamily`, POP indices 0–3 → seeds **11,23,37,53** | Source rocks ~1.8–2.2 m wide before POP scaling; not pebble geometry | Original stone texture/profile, vertex colors, instancing-aware shader; source material unchanged | Four shared-geometry `InstancedMesh` groups/page; whole-page detach/dispose | Source report ACCEPT production baseline for ordinary dressing; not hero-boulder approval |

The current files are sourced from D2R for the shared birch/pine/grass dependency graph, and E1 for the three production rock modules. These descendants retain the earlier source geometry/material families; B2's controller evolves into C2's species-aware controller intentionally. No experimental premium-rock implementation is reachable.

## Required pins verified as commit objects

* Birch shadow correction `dfc6b56f98cc560f6debce9b4e1fb3237069ef74`
* Birch B2 `87b4a2e00f0b29a89ec8aa1c5cdcf3bf7d170f6b`
* Pine C1 `06a7edadb0a7df798a483f9c3bd8bf0311da67e3`
* Mixed C2 `5f87d08a430051c9656e7bf44d1dfdc4f784f85d`
* Grass D1 `64606fe3df5d2444d0af21683319f6637b8d34f8`
* Grass D2R `0104a97cd3612e1bf1bec12cec1ea537e92d12e5`
* Production rock E1 `33adfb992d907e386bc272dd73716d734191f2bf`

Read source evidence: C2 mixed-forest report, D2R visual-calibration report, E1 rock-art-calibration report, B1 README, actual factories, materials, batches, visibility, LOD and fade code. Source reports record prior independent parity/CI, but those external CI jobs are not claimed as rerun here. Current POP-02A tests and captures are recorded separately.

## Birch gate before mixed integration

`pop-02a-fidelity.html` reproduces an unbatched source-family Mesh versus its existing instanced batch under matched transforms, source near LOD, neutral daylight, actual terrain and alpha-aware shadows. The chosen tree is a real POP descriptor. Source geometry/material files remain byte-identical.

At geographic coordinates, 71 / 1,080,000 pixels exceed RGB delta 12, mean channel difference ~0.0041. A controlled local-studio variant (local origin, identity yaw/scale) has **zero changed pixels and zero mean/max difference**. The world-space difference is consistent with CPU model-view versus Float32 instance/view matrix rounding; this is an inference from the controlled test, not a claim that all coordinate error is proven away. No geometry/material fix was needed. The negative control without alpha-aware depth changes 29,988 pixels, confirming cutout shadows are active. Raw results and images are in `evidence/birch-fidelity.json`.

## Grass A versus B

A retains upright source yaw transforms but rejects slopes above 25% for rendering. It avoids normal-orientation changes and is selectable for comparison, but discards eligible POP grass and still allows roots/blades to intersect a sloping plane across a tuft's width.

B preserves POP's terrain-normal intent through an optional quaternion composed **normal alignment × local yaw**. It changes no blade vertices, indices, source normals, source colors, material or fade rules. This is the selected candidate; compare the real A/B captures and unit transform test. Terrain is curved/triangulated, so normal alignment does not certify every individual blade never contacts the ground.

`grass-compatibility.patch` is the complete local source delta: optional orientation, optional stable fade offset, and parameter properties expanded into ordinary fields for the repository's Node strip-types runner. Missing optional parameters retain source behavior. Stable fade is keyed from the immutable POP ID so page reordering cannot assign a different D2R fade phase. The original fade distance/steps/smoothstep are unchanged.

Source rocks and grass use their actual geometry footprints for conservative render-only overlap rejection. Neighboring render pages contribute obstacles; affected border pages are invalidated when neighboring chunks change. Original POP descriptors/IDs/Y/rotation/scale remain immutable; generated, registered and submitted counts are explicitly separate. The rock adapter subtracts recorded burial at render time, rather than changing terrain or stored Y.
