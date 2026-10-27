# ENV-NATURE-R02 — Execution Instruction (after R01R artistic NO-GO)

## Role and authority
Act as senior stylized environment art director, Three.js/TypeScript technical artist, spatial game designer, and WebGL QA engineer. Project: Aurora Rest. Owner-defined art direction: **Believable Nature, Sculpted for Wonder**. Execute on an **isolated review branch** descended from the verified recovery-derived geography; no merge, deployment, or protected-file changes.

## Mission
Produce one visually convincing, ~120–180m walkable Birchwood micro-composition that demonstrates shelter → intimate pause → natural glimpse toward Central Valley, through **existing source tree/grass/rock assets** rather than further subtractive deletion. Prove in actual eye-height WebGL captures whether our existing asset system is capable of a premium handcrafted, cozy Nordic woodland feel.

## First actions
1. Read `docs/env-nature-r01/ART_REVIEW_R01R.md` and reproduce the R01 source/authored WebGL captures from GitHub Actions 40536613933. Do not treat the rejected clearing variant as approved.
2. Select **one** camera-to-camera corridor segment on the dry, canonical R1 terrain. Ground the start/end from real `features.json` and player-sampled heights. Check gradients, cross-slope, water, trees, and possible route conflict at <=4m intervals; if the existing trail cannot be used, keep the experiment a *visual walkthrough* rather than claim an approved hiking trail.
3. Prepare a compact 2D top-down composition diagram referencing the actual sampled segment: forest enclosure, foreground ground-cover rhythm, grove edge, pause, vista. Decide from geometry before implementing. No invented source imagery.
4. Build **one** opt-in Three.js art-study variant. Prefer retaining existing instances and using art-authored grouping/framing from the **verified existing nature-library**. No new object family, Blender or downloaded models, no procedural terrain/noise/erosion, no repositioning or regeneration of original population descriptors. Any extra hand-authored assets, if necessary, must be explicit, uniquely identifiable, bounded and removable as one overlay, never silently mixed into canonical POP.
5. Avoid solving sparse foreground with more tree deletion. Retain strong near-field frames, subtle asymmetric opening and sufficient grass/rock hierarchy; if faithful MAT ground still feels exposed, document as an art limitation rather than change its protected shader.
6. Record matched original vs art-variant **real Three.js WebGL** eye-height screenshots at 3+ meaningful stations (1.75m), plus one high view, genuine scene metrics, retained-ID parity, terrain+MAT SHA, and a short movement traversal. The reveal station must actually show a designed directional sightline. Capture raw canvas pixels; do not manufacture beauty shots.
7. Explicit decision: **ART GO** if all three stations show an intentional believable spatial sequence with no conspicuous holes/ground mismatch and normal route/water/terrain constraints; **CONDITIONAL** if one localized fix is justified; **NO-GO** after a single failed correction. Stop before merge or deploy and present the exact evidence to owner.

## Technical constraints / freeze
- Protected source: `fix/recovery-ci-r01@bced77ca3ca0539f7137cd9f066e6220518cf4a8` and original `src/pop-01`, `src/pop-02a`, `src/env-p01`, `src/terrain-material`, `public/geo-r02b`.
- Keep B2a North Peak only as optional separate reference; no new North Peak integration work.
- Review group: Birchwood → Central Valley only. Never imply island-wide geography is final.
- Production-quality tradeoff: a deliberately authored 150m woodland beat is preferable to 6km of generic procedural population.
- One bounded implementation and at most one evidence-driven correction. No further asset/source acquisition or random masks.

## Deliverables
- Spatial composition decision sketch/diagram with actual surveyed positions;
- Isolated Three.js study and determinism/provenance tests;
- Real WebGL matched before/after (walking + elevated) and movement evidence;
- Complete original/overlay instance ledger; regression/source checks;
- Concise art review and owner GO/NO-GO recommendation. **No automatic merge.**
