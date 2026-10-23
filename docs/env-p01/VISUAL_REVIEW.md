# ENV-P01 visual review

## Recommendation

Faithful integration is materially better than neutral POP ground. It is an environment review foundation, not a finished or owner-approved Nordic forest. Owner art review is required. No lookdev exposure, density, shadow, asset geometry or material palette changes are retained.

Faithful implementation checkpoint: `73fcfa7d237092f335c86f8afa024ee7ae1ddb49`. The first capture run began with implementation changes uncommitted on POP HEAD; runtime.json's `source` is the observed HEAD at capture start, not a claim that ENV already existed in POP. The faithful source was then preserved in this commit, before any optional calibration. Source modules and source hashes identify the implementation precisely.

## Actual WebGL findings

1. **Ground continuity improves substantially.** Walking-height M01 now supplies recognizable litter, humus and olive moss around the existing trunk contacts. The flat neutral plane disappears; birch trunks and pine silhouettes remain readable.
2. **Distribution is the first art problem.** The forest-floor mass and the actual trees do not share a boundary. Elevated views reveal an open dark material patch and trees continuing onto meadow. This is a classifier disagreement, not a coordinate error.
3. **Foreground still lacks a convincing transition in scale.** Source grass tufts are individually legible but separated by large flat areas; a 19 m fade makes their geometry disappear beyond the immediate foreground. Increasing density would conceal, rather than explain, this gap and is outside this baseline.
4. **M01 texture is stronger close up than as a distant mass.** Litter is readable, but the repeated small detail and relatively uniform macro value still compete with a calm handcrafted composition. The panoramic dark slab remains visible with real trees present.
5. **Source stones are conspicuously pale and angular.** They preserve the production asset family, but their contrast with the new floor exposes a cohesion problem. Hero-rock modeling is not part of this milestone.
6. **Composition remains provisional.** The untouched terrain has broad smooth slopes; the source distribution can read like a regularly scattered plantation. No handcrafted glade layout, understory or authored trail has been added. A pleasing screenshot is insufficient evidence of a finished walking experience.
7. **Shadows work on the new receiver.** Fine canopy silhouettes and trunk contacts remain visible. Their dark patches contribute to the tonal contrast, but a global exposure change would also brighten already bright birch foliage and stones. A blanket lighting adjustment is not yet justified.

## Evidence and scope

`review.html` and `evidence/contact-sheet.jpg` compare seven original POP camera views, neutral versus faithful MAT. Original-world camera positions, quaternions, scene settings, render counters and full placement hashes are in `evidence/runtime.json`. PNGs are lossless 1600×1100 WebGL canvas readbacks, not concept images. No screenshots are AI generated.

`forest-edge` is the original POP review camera name; it faces into woodland and does not, by its name alone, prove the material ecotone is visible. Supplementary outward ecotone views and route poses are recorded separately when captured. Central Valley is a limited alignment check, not a second calibrated environment.

The walking replay is a sequence of recorded geographic camera poses, not a real-time frame-rate demonstration. Existing walking constrains the eye to canonical terrain; there is no new player controller or physical tree/rock collision. Reported view/camera labels are provisional review locations, not final trail approvals.

## Ecological diagnostics

`ecological-mismatches.json` records per-view descriptor counts and flags. `ecological-mismatch-map.png` is explicitly a data visualization, paired with a genuine WebGL weights view.

A tree descriptor is flagged when meadow weight exceeds 0.5; a grass descriptor when bedrock weight exceeds 0.5. These diagnostic thresholds do not establish that every flag is artistically wrong, nor that every grass descriptor is currently drawn (fade, distance, rock suppression and LOD apply). No placements were removed, moved, recolored or regenerated from MAT weights.

The initial forest landscape sample includes 738 tree descriptors; 170 lie on meadow-dominant ground. This makes the disagreement significant enough to review, but does not justify silently making MAT the final ecological authority. Ground coverage in an apparent glade also requires a canopy/density analysis; a tree-only point count is not a complete glade metric.

## Pass B decision

No tonal or density candidate retained. Preserve this faithful comparison as the baseline. The first follow-up should reconcile local ecological intent in a small reviewed area before further material or lighting calibration. Any M01 palette/macro redesign belongs to MAT-01R, with the same integrated views as evidence.
