# ENV-NATURE-R01R — Real WebGL Artistic Acceptance Review

**Art verdict: NO-GO. Technical verdict: PASS.** This is an art-review decision, not a production rollback and not an asset-system failure.

## Evidence examined
- Actual, unretouched 1100×700 Three.js/WebGL, 1.75m walking-eye captures, original source assets and faithful MAT ground: [validated GitHub Actions run](https://github.com/Algolon/Aurora-Rest/actions/runs/40536613933) and [nine-file evidence ZIP](https://github.com/Algolon/Aurora-Rest/actions/runs/40536613933/artifacts/12749921029).
- Evidence JSON is preserved separately at `R01R-evidence.json`; its original `review.json` source is the WebGL ZIP (SHA-256 `64299cfaf94774f0482ab00c37779c1976dac40ffd2eda29b0de28df3d843d16`).
- Source terrain, MAT classification, camera transforms and complete surviving nature descriptor identities matched for all three views. All unit tests and build checks passed on R01.
- Image-difference figures: RGB pixel fraction with strongest channel difference greater than 20/255, calculated from the untouched matched PNGs (Pillow/NumPy in review environment).

| Actual 1.75m view | Source → authored descriptors | Tree removals | Pixel difference >20 | Art review |
| --- | ---: | ---: | ---: | --- |
| nature-glade | 4739 → 4722 | 17 | 19.62% | Creates bare, unframed foreground; no convincing glade |
| nature-turn | 3181 → 3170 | 11 | 43.02% | Dominant exposed slope; no compelling trail pause or framing |
| nature-reveal | 4076 → 4065 | 11 | **0.00%** | Source and modified image pixel-identical: designed reveal is invisible |

Counts are local per-camera population windows, not globally independent tree removals. The 0%-pixel-difference frame independently confirms that deleting descriptors is not synonymous with improving a player's experience.

## Art-direction diagnosis

1. Subtractive canopy masking is working exactly as engineered, but *density reduction alone is not environmental composition*. It strips foreground trees yet leaves exposed MAT ground without complementary understory or authored silhouettes.
2. The available first-person camera viewpoints do not demonstrate a readable **enclosure → intimate pause → valley reveal** sequence. The third camera is already on an exposed hillside; it does not reveal the valley through an opening.
3. The material/asset combination remains visibly more prototype-like than the intended **Believable Nature, Sculpted for Wonder**: repeated tree silhouettes, sparse foreground grass/rocks, broad texture planes, weak framing. These are art-level observations, not measured performance defects.
4. The unresolved hero-corridor width/cross-slope audit prevents claiming final walkability, even though all sampled review cameras were dry.
5. Artificially increasing the number or radius of deletion masks is **not a credible next fix**. No sixth canopy-clearing experiment is authorized by this review.

## Decisions and protection

- **REJECT** acceptance of the five ENV-NATURE-R01 masks as a production environment composition. Keep their reversible, isolated test code and WebGL evidence for reference. Do not merge or deploy them.
- **ACCEPT** the post-generation subset-only suppression mechanism as technically verified: no new/repositioned/changed source descriptor, no edit to POP-01, original terrain or MAT-01.
- Preserve `fix/recovery-ci-r01@bced77ca3`, `feature/geo-island-r02-baseline-reconciliation@2ffcf1d1` and original `feature/env-nature-r01-authored-birchwood-valley@0ecd5bb4`.
- **Next single art milestone:** ENV-NATURE-R02 — *Existing-Asset Woodland Framing Micro-Pilot* (see `ENV_NATURE_R02_EXECUTION.md`). Do not start a new mountain/rock/terrain/Blender workflow.
- Owner art approval is mandatory before merging. A nonidentical PNG is never considered approval by itself.

## Exit criteria for R02

One short, proven dry route section (not the entire 4.93km provisional hero route); source-preserving artist-authored framing with existing stylized assets; a local grove, textured/covered close ground, a plausible natural opening, and a real visually legible reveal from 1.75m with fixed before/after cameras. Document exact added/suppressed instance IDs and draw-call/triangle delta. Respect provisional tread and river/shore exclusion. If existing source assets cannot convincingly achieve this in one bounded pass, stop with **ASSET/ART LIMITATION**, rather than hiding it with more mask iterations.
