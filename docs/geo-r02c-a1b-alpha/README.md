# GEO-R02C-A1b-α — Visible-face study on the A2 south-west face

**Status:** one limited experiment, as approved on 23 Oct 2026. It is for artistic and technical review, not a merge or deploy candidate.
- Branch `feature/geo-r02c-a1b-alpha-visible-faces`, stacked on the A1b-D dossier `eb30038` (one-time AGENTS.md exception).
- Not implemented here: A1b-β, R-A (corridor narrowing), R-C (design master), the other R-B–R-H items, C1-R and G1′.

Labels: **MEASURED** = computed from the committed terrain or the real captures. **JUDGEMENT** = artistic evaluation of the real captures.

## 1. Provenance

| Item | Value |
|---|---|
| Base | `feature/geo-r02c-a1b-d-visibility-design` @ `eb30038fde396f108ea2b6cce7705ec65fad84e8` (pushed, remote verified) |
| Unchanged checkpoints | R1 `b6784a9`, P0 `90d0cb7`, A1-D `15c0977`, A1a `80553e2`, A1b-D `eb30038` |
| Canonical R1 terrain | `fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a` (untouched) |
| A1b M0 (empty overlay) | `fc8fd6da…`, byte-identical to R1 |
| A1b-α | `5806ac0c24606840565c069ff826286b66298ca1898353a2d4b96196f3ec5b05`, 11,498 changed cells (18.4 ha), cut-only, max lowering 23.8 m |
| A1a-V1 (comparison) | `61b599545d60f9bf…`, committed on A1a and unchanged |

## 2. What was built

**Overlay (reused, not modified).** `tools/geo-r02c-a1b/a1b_overlay.py` is a thin driver over the A1a overlay:
- H = R1 + M·D.
- M is the A1a freedom mask, built by the A1a code with the A1a V1 mask settings. The driver asserts the settings are identical, so every A1a protection holds cell for cell: crest bands (raise-only lower bounds), the ±75 m peak-ascent and ±55 m tarn-ascent corridors with 60 m fade, valley floors, water, R1 divides, the inlet-n head, the High Tarn seam, window v2 and the coastal freeze.
- Only changed float32 cells are written, as an exact patch with a full-terrain SHA-256 (`public/geo-r02c-a1b/`).

**Operator `visibleFaces`** (`tools/geo-r02c-a1b/lib/visible_faces.py`):
- **Measured target.** The A2/n-main south-west face, 150–620 m along the crest from the summit. The A1b-D viewsheds show it is visible from Birchwood, Central Valley and the alpine route, and A1a's global face gate rejected it at 69 %. The gate is not lowered globally; this operator acts on this one face only.
- **Geology, not masks.** Each couloir follows a real fall line of R1, traced by steepest descent on R1 smoothed at about 120 m. Couloirs are hourglass-shaped:
  - a broad, shallow head scallop under the crest;
  - a narrow, deep throat about a third of the way down;
  - a widening, shallowing fan that dies out in the free face.
  There are three major couloirs (depth 20 / 28 / 24 m at the throat, heads 155 and 170 m apart). Two have tributary heads that join them along curved paths, and there are four shallow minor couloirs lower on the face. Buttresses between them stay at R1, so the ribs run up to the crest as connected structure.
- **Smooth transitions, designed rather than masked.** Depth ramps in only beyond 18 m from the authored crest line (crest band 10 m + A1a fade 6 m < 18 m) and reaches full depth at 95 m. Every couloir ends inside the free face. The result is that the A1a mask trims only 0.008 % of the designed cut volume (at most 0.05 m), so no edge follows a mask boundary.
- **Constraint-aware.** Cut-only; floors fall all the way (gentlest floor gradient 0.21 m/m); no noise; no towers, spikes, cirques, gullies on channels or lakes.
- **Not done.** No protected region was released, and none was needed.

**Viewer.**
- `?terrain=a1b-m0|a1b-alpha` composes the patch in the browser and refuses to run on a SHA mismatch. A1a ids and the default path are unchanged.
- `?cams=a1b` adds two player-height cameras on the peak-ascent centreline (s = 900 m below the face, s = 2600 m looking across it).
- **Hash-reporting fix:** `snapshot()` now reports the *active* terrain hash (`terrainSha256`), the R1 baseline (`baselineTerrainSha256`) and the variant key (`activeTerrain`). Before this, a loaded variant still reported R1.

## 3. Validation (MEASURED; `validation/*.json`)

The A1a validation runs unchanged on the A1b manifest. `a1b_validate.py` adds stricter checks on top; it does not weaken any.

| Gate | Result |
|---|---|
| Empty overlay M0 = R1 byte for byte | pass (`fc8fd6da…`) |
| Protected cells unchanged (all A1a classes) | pass: 0 cells |
| Outside the window | unchanged |
| Crest cells | 0 changed, 0 below their lower bound |
| Summit | unchanged (899.95 m at (−520, 2770)); window maximum unchanged |
| ±75 m corridor, High Tarn seam, inlet-n head | 0 cells changed |
| New dry sinks (> 1 cm) | 0 |
| Drainage destination changes | 0 |
| Wet cells, lakes, beds | 0 changed |
| Land/sea, coast 0–150 m | unchanged |
| Route centrelines | Δ = 0 m on all six routes |
| Walking test in the viewer (all routes) | identical on M0 and A1b-α, all passable |
| Mask-shaped edges | none: mask trims 0.008 % of the cut (max 0.05 m); gradient and curvature in fade zones ≤ free face |
| Couloir floors fall all the way | yes for all three majors (gentlest 0.29, 0.22, 0.21 m/m) |
| Determinism | 2 runs, identical SHA-256 |
| Active/baseline hash reporting | viewer reports `5806ac0c2460…` as active, R1 as baseline |
| Tests / build | 43/43 pass (existing tests unmodified) / pass |

## 4. Visibility: does anyone see it? (MEASURED)

Share of each variant's changed terrain (> 1 m) in terrain-only line of sight, eye 1.75 m:

| Viewpoint | A1a-V1 | A1b-α |
|---|---|---|
| Birchwood | 0.0 % | 100.0 % |
| Central Valley shoulder | 0.9 % | 89.1 % |
| Central Valley floor | 0.0 % | 0.0 % |
| High Tarn overlook | 14.0 % | 2.2 % |
| High Tarn east shore | 44.4 % | 33.4 % |
| High Tarn north shore | 4.8 % | 0.0 % |
| Route, mid approach | 0.0 % | 14.9 % |
| Route, upper approach | 0.0 % | 76.3 % |
| A1b trail camera s = 900 m | 0.0 % | 85.0 % |
| A1b trail camera s = 2600 m | 0.0 % | 86.6 % |

Pixel change in the real captures (`data/pixel_diff.json`) is small everywhere: at most 1.6 % of the frame, on the upper-trail view under clay sun A. It shows visibility, not quality.

## 5. Artistic evaluation (JUDGEMENT on the real captures, both suns)

**Verdict: ART: NOT PASS — calibration checkpoint, technically clean.**

A1b-α does what A1a-V1 could not: its changes are on terrain players actually see. 100 % of the changed area is in line of sight from Birchwood and 85–87 % from the two trail cameras, against 0 % for V1, and every technical gate passes without releasing any protection.

Artistically it is not yet good enough. From the upper trail the couloirs and ribs read as a believable eroded face. From Birchwood and the Central Valley shoulder they read as a few dark scratches on a still smooth summit dome, and from the south-east oblique as a set of near-parallel grooves. Per the brief, it is preserved as a diagnostic checkpoint and not tuned towards acceptance.

| Question | Judgement |
|---|---|
| 1. Visibly meaningful? | Partly. Clearly visible from the upper peak-ascent trail (1.6 % of frame pixels change under clay sun A, all of it on the face) and from the south-east oblique. From Birchwood (0.16 %) and the Central Valley shoulder (0.04 %) it is visible only as small marks on the dome flank. From the upper approach camera and High Tarn there is no change, because the face is outside the frame or out of sight. |
| 2. Does the mountain feel more naturally sculpted? | Only at close range. From the trail, the face gains erosion structure. From the far approaches, the summit dome and the smooth, frozen arêtes still dominate, so a sculpted patch on one face reads as surface detail rather than as a different mountain. |
| 3. Do the forms connect to the surrounding massif? | Downslope, yes: couloirs follow true fall lines and fan out into the face. Upslope, not enough: the crest is frozen and smooth, so couloir heads cannot notch it, and the ribs end against an unbroken ridge line. This is the main disconnection. |
| 4. Convincing under both sun presets? | Clay sun A (low, WNW) gives strong relief and the best result. Under clay sun B (SE) the face is lit frontally and the relief is soft. Neither makes the far views convincing. |
| 5. Free of gouges, mask edges and repetition? | No mask edges: the A1a mask trims at most 4 cm, and gradient and curvature in fade zones are no higher than inside the face. No gouges at the crest. Repetition is only partly avoided: in plan and in the oblique, the three major couloirs read as near-parallel, evenly spaced grooves, because the face is a uniform planar slope with parallel fall lines. |

## 6. Limitations

- The far silhouette and the summit dome are unchanged by design (crest bands, summit and ±75 m corridor frozen), so the experiment cannot change the read of the mountain from Birchwood. That would need R-A or the crest-level decisions R-B/R-C.
- R1 gives this face a uniform planar slope, so fall-line couloirs are near-parallel by construction. Breaking that needs larger-scale massing (buttress volumes, shoulders), which cut-only face relief cannot build.
- Couloir heads stop 18 m below the authored crest line to keep the crest lower bound and its fade untouched, so no couloir reaches the skyline.
- The s = 900 m trail camera sees the face only near its upper edge in perspective, so the s = 2600 m camera is the clear player-height view.
- Pixel-change counts use a coarse threshold (|Δ| > 12 after a 3 × 3 median). They show visibility, not quality.
- Captures use SwiftShader software WebGL in clay and standard materials. No vegetation, snow or rock textures; real materials would change contrast.
- Only the evaluation cameras were captured for A1b-α (10 views in both clay suns, 7 in standard). The C1, G1 and north-side A1a cameras look at terrain A1b-α does not change.

## 7. Recommendation

Do not accept A1b-α as a landform, and do not continue tuning the same face with deeper or more cuts: the limiting factor is the smooth, frozen crest and dome that frame it, not the depth of the couloirs.

Recommended next step: a summit-block experiment (A1b-β), because the decisive flaw is the disconnection between sculpted faces and the smooth dome and crest. It needs the R-A corridor release, which is not approved; if R-A is approved, run β with the A1b-α face as its lower context.

If R-A stays closed, the only remaining no-release calibration is a second visible face (A3 south) with fewer, broader buttress-scale forms, to test whether consistency across faces helps. Expected gain is low, because the dome stays as it is.

Do not start C1-R yet: it is 0 % visible from current player positions and needs a viewpoint decision (R-E) first.

## 8. Reproduce

From the repository root (Python 3.13 + numpy, scipy, shapely, Pillow; Node + Playwright Chromium):

```
python docs/geo-r02c-a1b-d/scripts/rebuild_cache.py           # A1a cache (git-ignored), verified against committed SHA-256s
python tools/geo-r02c-a1b/a1b_overlay.py tools/geo-r02c-a1b/specs/a1b-m0.json --repeat 2
python tools/geo-r02c-a1b/a1b_overlay.py tools/geo-r02c-a1b/specs/a1b-alpha.json --repeat 2
python tools/geo-r02c-a1b/a1b_validate.py m0 && python tools/geo-r02c-a1b/a1b_validate.py alpha
npx vite --port 4321 &                                       # then:
node tools/geo-r02c-a1b/passability.mjs
node tools/geo-r02c-a1b/capture.mjs --variants a1b-alpha --modes clayA,clayB      # plus the M0/V1 frames for the a1b cameras
python tools/geo-r02c-a1b/evidence.py && python tools/geo-r02c-a1b/compare.py && python tools/geo-r02c-a1b/build_review.py
npm test && npm run build
```

M0 and A1a-V1 frames for the 16 shared cameras are the committed A1a captures. The renderer reproduced them byte for byte on this machine (`data/render-identity.json`).
