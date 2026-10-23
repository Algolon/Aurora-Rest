# GEO-R02C-A1c — North Peak Macro-Massing & Sculptural Silhouette Study

Branch `feature/geo-r02c-a1c-macro-massing-study`, created from the verified A1b-α checkpoint
`154eb0706aee951d8ec3f3401f2c17b1940de468` (one-time AGENTS.md exception, as authorised). The R1 → P0 → A1-D → A1a → A1b-D → A1b-α
history is preserved. The design master (`62cb154b…`) and the R1 binaries (`fc8fd6da…`) are untouched.

**Authorisation used:** an R-B trial only, consisting of reversible, raise-only changes to selected secondary crest segments within an
envelope of +25 m. No R-A corridor narrowing, no R-C design-master change, no merge, no deployment.

**Result:** the feasibility study was completed and one candidate was generated. **S1 passes every geographic gate but fails
artistically** because it is visually insignificant. **S2 was not generated.** The recommendation is to stop local calibration and make a design-authority change.
Open `review.html` for the full evidence.

## 1 · Feasibility (no terrain generated)

`tools/geo-r02c-a1c/feasibility.py` → `feasibility/feasibility.json`, figure `images/feasibility.svg`.

For ten viewpoints, the study measures which terrain forms the North Peak skyline and how far the skyline could move if every
raise-eligible crest and shoulder point were lifted by the full 25 m. This is an upper bound with no hydrology guarantees.

| Viewpoint | Distance | Skyline frozen* | Upper bound | S1 as built |
|---|---|---|---|---|
| Birchwood Forest | 2.5 km | 49 % | 9.3 px | 4.2 px |
| Central Valley shoulder | 2.9 km | 50 % | 7.6 px | 2.7 px |
| Western coast (K3, new) | 1.2 km | 46 % | 27.7 px | 14.9 px |
| High Tarn east shore (new) | 2.1 km | 35 % | 17.4 px | 5.7 px |
| High Tarn overlook | 1.5 km | 60 % | 39.4 px | 1.1 px |
| High Tarn north shore | 1.6 km | 19 % | 33.2 px | 0.1 px |
| Alpine ascent, mid | 0.4 km | 98 % | 58.1 px | 7.5 px |
| Alpine ascent, s = 2600 m | 0.1 km | 100 % | (108.7 px over 3.3° only) | 0 px |
| South-east oblique | 1.7 km | 67 % | 11.0 px | 6.5 px |
| Northern oblique | 1.6 km | 70 % | 11.2 px | 5.1 px |

\* Frozen means the skyline is formed by the summit dome (frozen within 150 m), the trail corridor (frozen within about 139 m of
the peak-ascent and tarn-ascent centrelines) or crest outside the eligible segments. Pixel values assume a 60° vertical FOV over 800 px.

**Reading.** From the two identity views, even the upper bound stays under 10 px, because 25 m at 2.5–2.9 km subtends about 0.5°.
The large near-field bounds collapse once drainage destinations are preserved. The feasibility study already indicated that the
envelope is marginal for the far silhouette. S1 was built to test the near and mid views, and to check whether a coordinated set
of small changes reads as more than the sum of its parts. It does not.

## 2 · S1 — asymmetric ridge massing

Spec `tools/geo-r02c-a1c/specs/a1c-s1.json`, operator `tools/geo-r02c-a1c/lib/massing.py`, generator `a1c_overlay.py`.
Terrain SHA-256 `dcdb46ca1d7ec93cf977ece7fe3ece36ae60c5c1884341c29b2951c7443915c3`.

| Segment | Ridge | Designed peak |
|---|---|---|
| A2-shoulder (broad shoulder, then a step) | n-main | +22 m |
| A2-lower-step | n-main | +13 m |
| EA-rim (one sub-summit on the High Tarn rim) | n-east-arc | +20 m |
| A1-steps (stepped crown) | n-crown | +17 m |
| A3-spur-shoulder | n-west-spur | +22 m |
| A3-west-hump | n-main (west end) | +14 m |

How S1 meets the hydrology and transition constraints:

- **Raise-only.** Every cell is changed upwards or not at all. The crest band stays at or above its R1 lower bound.
- **Flow-preserving cap.** Each raised cell stays at least 0.02 m above its R1 D8 receiver.
- **Destination-preserving attenuation.** Wherever a change would reroute a catchment, the raise is smoothly reduced.
- **Fades.** Raises fade out over at least 90 m.
- **Frozen zones.** The summit area and the trail corridors keep exactly zero change.

**Measured result:**

- **Change.** 24,596 changed cells (39.35 ha; 35.26 ha by more than 5 cm), all of them raises, with a maximum of +20.0 m.
- **Declared cells.** 1,965 crest cells and 22,631 shoulder cells, each listed in `public/geo-r02c-a1c/s1.declared.json`.
- **Crest raised by more than 2 m:**

  | Ridge | Length | Max raise |
  |---|---|---|
  | n-main | 180 m | +13.7 m |
  | n-east-arc | 296 m | +20.0 m |
  | n-crown | 204 m | +17.0 m |
  | n-west-spur | 380 m | +15.4 m |

- **Viewshed.**
  - Upper trail: 8.7 ha newly hidden.
  - High Tarn east shore: 4.5 ha newly hidden.
  - Every other view: 2.6 ha or less.

Tried and dropped during design (per-segment tests, scratch only):

- **EA hump 2.** It sat on the sea / High Tarn spillway saddle and rerouted about 9 ha into High Tarn.
- **Segment starts inside the summit fade.** These made the fade gradient steeper than the core. The A1 and A2 segments now start 230 m and 200 m from the summit.

## 3 · Validation (`validation/s1.json`, `validation/m0.json`)

The unmodified A1a suite runs first. It reports pass = false because crest cells change, which is the declared R-B trial.
The A1c pass is defined explicitly in `a1c_validate.py`, is stricter everywhere else, and passes:

- **Protected classes.** Every protected class except crest is unchanged, cell for cell: sea, lakes, wet cells, valley floors, divides, corridors, frozen zones and water surface.
- **Outside the window.** Everything outside the window is unchanged.
- **Declared cells.** Every changed cell is declared. No crest cell is lowered, and none falls below its bound.
- **Summit.** The summit cell (899.953 m) and the window maximum are unchanged. The nearest change is 197 m from the summit and 137.8 m from a trail centreline.
- **Hydrology.** No new dry sinks under the priority flood, and no drainage-destination change: 0 cells rerouted between High Tarn, sea and other.
- **Water and coast.** Water, lakes, channel beds, land/sea and the 0–150 m coast band are unchanged.
- **Routes.** All six route centrelines are unchanged (Δ = 0 m). Cross-slope at 8 m and 20 m is unchanged on every route.
- **Transitions.** Fade gradient max 0.449 ≤ core 0.499, and fade curvature 0.058 ≤ core 0.079. This measure does not catch the
  visible attenuation dents: up to 11.4 m below the designed surface, 693 cells more than 2 m below it.
- **Determinism.** `--repeat 2` gives an identical SHA-256. A re-run after reinstalling scipy and shapely reproduced the committed files byte for byte.
- **Tests and build.**
  - `npm test`: 50/50 pass (43 existing tests unmodified, plus 7 new in `tests/geo-r02c-a1c.test.ts`).
  - `npm run build`: pass.

## 4 · Renders and art verdict

All renders are real Three.js / SwiftShader captures at 1280 × 800 under clay sun A (290°, 18°) and clay sun B (135°, 35°).
The compact set has 28 new frames, listed in `captures/capture-manifest-*.json`; each manifest entry carries the active terrain SHA.
All other M0 and A1b-α frames are reused from the committed A1a and A1b-α captures. There is no standard-material gallery,
following the brief, because the first images showed no meaningful improvement.

Matched sheets (M0 | A1b-α | S1) are in `images/compare-*.jpg`. Pixel change is in `data/pixel_diff.json`; S1 changes at most 1.0 % of pixels in any view.

**Verdict: S1 ART NOT PASS.**

- **Identity views.** It is insignificant from the identity views.
- **Asymmetry.** The arms do not read as three different profiles.
- **Coherence.** The raises are six isolated patches. None of them can join the summit.
- **Only one camera.** Only the western-coast view shows a lift that could be called massing.
- **Hook artifact.** The south-east oblique shows lumps and a hook-shaped notch left by the drainage-preserving attenuation.

The full answers are in `art-notes.json` and `review.html`.

**S2 was not generated.** It would need lowering below the crest bound and edits inside the same frozen zones, and the brief
says not to proceed automatically after S1 fails.

## 5 · Stop conditions triggered

- The forms remain visually insignificant.
- Only one camera clearly improves.
- The +25 m envelope is insufficient for the far silhouette.
- A meaningful result requires summit-zone, corridor and crest-bound changes.

No stop condition on geographic integrity was triggered, and no protection was released.

## 6 · Recommendation

Stop local calibration under the current protections. The three studies bracket the space:

- A1a (ridges): invisible.
- A1b-α (face detail): surface marks.
- A1c S1 (crest massing): insignificant.

The smallest design-authority change that can give North Peak a different silhouette is **R-C on the North Peak block**: a
re-authored summit block and arm profiles in the design master, with the summit position and height kept. Its scope would be:

- crest change of roughly ±50–60 m within about 150 m of the summit;
- lowering for saddles and notches on the A1 and A2 arms;
- regeneration of drainage for the block, instead of preserving every current divide.

It should be combined with **R-A on the A3 arm only**, a local re-alignment or narrowing of the peak-ascent corridor.

That change needs a design decision first. Request an independent art review and a target silhouette from Birchwood and the
Central Valley shoulder before any further sculpting.

## Reproduce

```sh
python3 docs/geo-r02c-a1b-d/scripts/rebuild_cache.py                       # A1a cache (git-ignored)
python3 tools/geo-r02c-a1c/feasibility.py
python3 tools/geo-r02c-a1c/a1c_overlay.py tools/geo-r02c-a1c/specs/a1c-m0.json --repeat 2
python3 tools/geo-r02c-a1c/a1c_overlay.py tools/geo-r02c-a1c/specs/a1c-s1.json --repeat 2
python3 tools/geo-r02c-a1c/a1c_validate.py m0 && python3 tools/geo-r02c-a1c/a1c_validate.py s1
python3 tools/geo-r02c-a1c/evidence.py s1
npx vite --port 4331 &                                                     # viewer: /geo-r02b.html?terrain=a1c-s1&cams=a1b,a1c
node tools/geo-r02c-a1c/capture.mjs --url http://127.0.0.1:4331/geo-r02b.html --out docs/geo-r02c-a1c/captures \
  --variants a1c-s1 --modes clayA,clayB --views a1a-birchwood,a1a-valley-shoulder,a1c-west-coast,a1c-tarn-east,a1a-tarn-overlook,a1b-face-from-upper-route,a1a-west-arm,a1a-oblique-se,a1a-oblique-n
python3 tools/geo-r02c-a1c/compare.py && python3 tools/geo-r02c-a1c/figures.py && python3 tools/geo-r02c-a1c/build_review.py
npm test && npm run build
```

Python: numpy, scipy, shapely, Pillow (the versions used are in `run-log.json`).
