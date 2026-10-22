# GEO-R02C-A1a — First sculptural form study (M0 / V1 / V2 / V3)

**Status:** limited sculptural terrain experiment for independent artistic and technical review. Not production terrain.
**Branch:** `feature/geo-r02c-a1a-form-study`, created from the approved A1-D checkpoint `15c0977156edc2ded35f7440c84c46207177d06a`. Ancestry was verified: R1 `b6784a9` and P0 `90d0cb7` are both ancestors. The R1, P0 and A1-D branches are unchanged.
**Review page:** [`review.html`](review.html) (static; open from a checkout). **Nothing was merged, deployed or pushed.**

Two kinds of geometry appear in this study, and they are never mixed:

* **Generated terrain:** the composed variant heightfields, the Three.js renders of them, and the solid lines in sections and maps.
* **Authored design targets:** the approved A1-D intent, shown only as dashed lines in sections.

## 1. What was built

| Part | Location |
|---|---|
| Versioned incremental overlay (schema `aurora-terrain-overlay/1`) | `tools/geo-r02c-a1a/overlay.py`, `lib/{mask,operators,drainage,grid}.py` |
| Read-only extraction of R1's 4 m constraint classes | `tools/geo-r02c-a1a/r1_masks.py` |
| Variant specs | `tools/geo-r02c-a1a/specs/a1a-{m0,v1,v2,v3}.json` |
| Variant terrain (exact patches) and manifest | `public/geo-r02c-a1a/{v1,v2,v3}.patch.f32`, `manifest.json` |
| Geographic validation | `tools/geo-r02c-a1a/validate.py` → `validation/*.json` |
| Opt-in viewer composition and cameras | `src/geo-r02c-a1a/{variants,cameras}.ts`, small hooks in `src/geo-r02b/main.ts` |
| Fixed review cameras (16) | `tools/geo-r02c-a1a/cameras.json` (`cameras_build.py`) |
| Browser captures | `tools/geo-r02c-a1a/capture.mjs` → `captures/` |
| Sections and maps | `tools/geo-r02c-a1a/sections_maps.py` → `images/`, `sections.json` |
| Tests | `tests/geo-r02c-a1a.test.ts` |

Not implemented, as instructed: C2-a, C2-b, C3, C4, B1–B3, summit towers, A2 / Cairn Saddle, coast refinement, nature assets, generalising the gully method, and any design-master or R1 change.

## 2. The incremental overlay

**H = R1 + M · D.**

* **R1** is the committed canonical terrain (`fc8fd6da…`). It is never re-solved and never overwritten.
* **D** is the design displacement built by the spec's operators.
* **M ∈ [0, 1]** is the freedom mask. It is exactly 0 on every protected cell.

Only cells whose float32 value actually changes are written. Every other cell keeps R1's bytes, so an empty operator list reproduces R1 byte for byte. R1 is not re-solved: the P0 convergence study showed a re-solve would move about 22% of mainland cells.

**Storage and composition:**

* Each variant is stored as the float32 block of its changed bounding box, plus the full-terrain SHA-256.
* The viewer composes a variant only with `?terrain=a1a-m0|v1|v2|v3`: it copies the block into the R1 grid, hashes the result in the browser, and refuses to run if the hash differs from the manifest.
* Without the parameter nothing is fetched and the R1 heights are used unchanged.
* Cameras are opt-in via `?presets=a1a`.
* A new camera kind, `aerial`, places a camera at a fixed world position and target.

### 2.1 R1 constraint classes (read-only extraction)

`r1_masks.py` checks the audited generator's hash. It then executes only its setup and `constraints()` definition, in memory, with one asserted patch that copies the masks. The R1 solve is not run and no R1 file is touched (229 s, cached).

**Verification inside the window box, against the committed canonical terrain:**

| Result | Cells |
|---|---|
| Equality cells | 215,833 |
| — match exactly | 210,732 |
| — offshore island footprints (written after R1's solve) | 5,095 |
| — nodes lying exactly on the coastline (the 4 known macOS/Linux flips plus 2 at about 10⁻¹³ m) | 6 |
| — unexplained | **0** |
| Crest cells | 9,209 |
| — below their bound | 0 |

The island and coastline cells all lie in the frozen coastal band.

### 2.2 Mask (approved window v2)

* **Window:** the polygon (−2000, 1700)…(−2000, 4000) from `docs/geo-r02c-a1d/data/window-v2-proposed.json`. 8 m frozen ring, 200 m smoothstep feather on Euclidean distance (so the reflex corner is rounded).
* **Coast:** 0–150 m frozen, smoothstep taper 150–300 m (D6).
* **Protected classes (M = 0)**, each with its own fade distance:

| Class | What it covers | Fade |
|---|---|---|
| sea | not mainland land | — |
| lake | R1 lake rims and beds | 30 m |
| wet | R1 channel sections (±18 m) | 12 m (4 m on the G1 reach) |
| valley | R1 valley-floor bands (±55 m), except the declared G1 release | 20 m |
| otherEquality | pass and coast fringe | 16 m |
| crest | R1 crest lower-bound bands (±10 m) | 6 m |
| corridor | peak-ascent ±75 m, tarn-ascent ±55 m | 60 m |
| zone | inlet-n head r 200 m (D3), High Tarn seam r 185 m | 40 m |
| divide | R1 catchment divides more than 12 m from any authored crest | 40 m |
| waterSurface | every cell where R1 defines a water surface | 4 m |

Two classes were added during the study because validation demanded them:

* **divide:** without it, a face cut rerouted 85 cells across the solver-crease divide near the A2 junction.
* **waterSurface:** without it, one released valley-floor cell went 5 cm below the channel water.

Both are now permanent.

### 2.3 Empty-overlay parity (gate before sculpting)

M0 runs the whole pipeline (constraints, mask, no operators, compose). It writes no patch, and its terrain SHA-256 equals canonical R1: `fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a`. The TypeScript test composes M0 through the viewer's own code path and gets the same hash. **Parity holds, so sculpting proceeded.**

## 3. Variants (generated terrain)

All variants share the same mask rules and the same base terrain.

**Variant definitions:**

* **V1 · ridge and flank sculpting.** The `faces` operator sculpts each arête with a designed face profile hanging from the R1 height at the edge of the frozen crest band (PCHIP knots, per side, varying slowly along the arête). The surface becomes a soft minimum of R1 and that target, so it only cuts.
  * Targets of neighbouring arêtes are blended by ridge proximity (τ = 40 m). Faces therefore meet in soft couloir hollows and never undercut another authored ridge.
  * Gate: a face is sculpted only if at least 75% of its band (10–150 m from the crest) is unprotected. Otherwise the cut would only reach the sliver the mask leaves, and would take the mask's shape.
* **V2 · V1 + C1 Nordbotn.** C1 is an excavation-only target surface:
  * an irregular plan outline (low-order harmonics);
  * a slightly dished floor graded east from 716 m to a lip set at the existing slope height (694 m), so there is no step and no overdeepening;
  * a concave headwall under the A1 arête.
* **V3 · V2 + G1.** The R1 valley-floor band (±55 m) is released only on the middle reach of `tarn-inlet-w` (channel fraction 0.35–0.65). It becomes an asymmetric V-gully:
  * the bed and the ±18 m R1 channel section stay frozen;
  * walls are about 34° ± 5° (steeper on the outside of bends), varying slowly along the reach;
  * there is a soft knee into a hillslope reconstructed from R1 at ±110 m.

**Measured face gate:**

| Face | Unprotected | Sculpted |
|---|---|---|
| A1 west | 95.5% | yes |
| A1 east | 91.9% | yes |
| A2 north-east | 84.3% | yes |
| A2 south-west | 68.8% | **no** |
| A3 south | 0.2% | **no** |
| A3 north | 70.0% | **no** |

A3 cannot be sculpted under the approved protections: its south face lies inside the peak-ascent corridor, and its north face is 30% protected.

| Variant | Terrain SHA-256 | Changed cells | Area | Δ min / max | Patch |
|---|---|---|---|---|---|
| M0 | `fc8fd6da…` (= R1) | 0 | 0 | 0 / 0 | none |
| V1 | `61b59954…` | 16,694 | 26.7 ha | −30.6 / 0 m | 314 KB |
| V2 | `e012c711…` | 16,694 | 26.7 ha | −82.8 / 0 m | 314 KB |
| V3 | `8d81f9fc…` | 18,096 | 29.0 ha | −82.8 / +14.4 m | 459 KB |

V1 and V2 change the same cells, because C1 sits inside the A1 east face that V1 already sculpts. V2 cuts deeper there.

**Against the design envelope:**

* C1's deepest cut is 82.8 m, inside the 85 m A1-D envelope.
* On the A1-D section T1, V2 follows the authored target closely: headwall, graded floor, and a lip that rejoins the slope (`images/section-C1-T1.png`).
* G1 changes its sections by 8–10 m, with fills up to 14 m on the bench edges.

## 4. Validation (every variant)

Full reports: `validation/{m0,v1,v2,v3}.json`. All four pass:

* **Protected classes:** every protected class is unchanged, cell by cell, including crest bands, water, corridors, divides and frozen zones.
* **Outside the window:** the outside of the window box is byte-identical.
* **Crests:** no crest cell is below its R1 bound.
* **Land and coast:** the land/sea sign is unchanged, and the coast 0–150 m is unchanged.
* **Water:** no wet cell changes state (lakes and channel beds are valid).
* **Catchments:** the D8 drainage destination (High Tarn / sea / other) is unchanged for every cell, so no catchment is rerouted.
* **Sinks:** zero new dry sink cells (priority flood around the edited region). Independently, the TypeScript test's full-grid flood gives a maximum spill depth equal to R1's own 0.033 m and zero new cells over 1 cm.
* **Trails:** every trail centreline is unchanged (Δ = 0 m along all six routes), so passability is unchanged.
* **Default viewer path:** with no query parameters, the A1a build renders the 8 R1 views pixel-identically to the P0 build, outside the live FPS status panel and crosshair, with identical cameras (`default-viewer-identity.json`; same Chromium/SwiftShader on the same machine, comparison code from P0's `tools/geo-r02c/compare_default.py`). Three PNGs are byte-identical; the other five differ only inside the FPS panel.
* **Continuity:** the maximum per-cell Δ gradient is 1.2 (V1) and 1.9 (V2/V3). The steep cells are the C1 rim and headwall, which are intended. No mask seam exceeded 1.0 after the corridor fade was widened to 60 m.

## 5. Determinism and cost

* **Determinism:** each variant was generated twice in the reference environment (Linux x86_64, CPython 3.13, numpy 2.3.5, scipy 1.18.1, shapely 2.2.0), and both runs gave identical terrain SHA-256s for M0, V1, V2 and V3.
* **Generation cost:**
  * R1 constraint extraction: 229 s once (cached in `tools/geo-r02c-a1a/.cache/`, git-ignored).
  * Per variant: about 50–58 s for mask, operators and composition. Most of that is the mask's distance transforms.
  * Validation: about 8 s per variant.
  * Browser capture (software WebGL, clay 8192² shadow map): about 50 s per frame alone, and about 3 min per frame with four processes sharing the CPU.

## 6. What failed along the way (kept for the record)

| Attempt | Result | Decision |
|---|---|---|
| Additive bump operators (flank and horn) | Blotchy dents bounded by mask fades; an artificial notch behind the summit seen from Birchwood | Replaced |
| Per-arm face cut without blending | 138 new sink cells, 9,801 rerouted cells, Δ steps up to 6.2 (faces undercut neighbouring ridges) | Replaced by blended faces |
| Blended faces with hard min() and τ = 15 m | Thin V-folds read as crumpled fabric | Soft minimum, τ = 40 m |
| Divide guard on all divides | Suppressed sharpening exactly at the crests (crests are divides) | Guard only off-crest divides |
| C1 from elliptical distance | Crater-like round bowl with a rim all round | Irregular outline and dished floor; lip at slope height |
| C1 flow-aligned amphitheatre | Overcut to −92 m, sinks, 3,615 rerouted cells | Rejected |
| C1 lip fade | Lip higher than floor, an overdeepened basin (sinks); violates D9 | Rejected |
| G1 hillslope from ±70 m | Only 3–5 m change (shallow host valley) | ±110 m: 8–10 m |
| A2 south-west face (69% free) | Mask-shaped dark wedge beside the summit from Birchwood | Face gate (≥ 75% free) |
| Arête slicing | Bug: A3 resolved to a one-point line, so it was never sculpted in earlier iterations | Fixed; A3 is now excluded by the gate, measured |

## 7. Real Three.js renders

* **Frames:** 160 unretouched WebGL screenshots of the real viewer rendering the composed variant terrain (`captures/<variant>/<mode>/<view>.jpg`; metadata in `captures/capture-manifest-*.json`, including each frame's terrain SHA-256 and camera).
* **Modes:** both P0 clay sun presets for all 16 cameras (A: az 290° / el 18°; B: az 135° / el 35°), plus standard material for 8 key cameras.
* **Settings:** viewport 1280 × 800, software WebGL (SwiftShader), clay shadow map 8192². The UI overlay is hidden by CSS.
* **Cameras:** 16 fixed cameras shared by every variant:
  * Birchwood, the valley shoulder, the High Tarn shore and overlook;
  * two alpine-approach positions on the peak-ascent trail;
  * a summit-area view into C1, the n-crown arête, the W arête;
  * the C1 floor and lip;
  * G1 from upstream and downstream;
  * three elevated obliques.
* **Lighting note:** sun A leaves every east- and north-facing view in shadow, which is why sun B matters for the C1 side.

### Artistic evaluation (judged on the renders, not on metrics)

| Question | V1 · ridges | V2 · + C1 | V3 · + G1 |
|---|---|---|---|
| Silhouette meaningfully more distinctive? | **No** from Birchwood, the valley shoulder, High Tarn or the trail: those faces are frozen. Slightly sharper A1 east face from the north and east obliques only. | As V1 | As V1 |
| Branches read as connected natural structures? | A1 and the A2 north-east face only. Soft couloir hollows where faces meet; no artefacts once the face gate was in place. | Same; the C1 headwall continues the A1 east face | Same |
| C1 a glacial landform, not an artificial depression? | n/a | **Partly.** From its floor the headwall reads as an amphitheatre wall. From the elevated obliques it reads as a rounded, rimmed bowl stamped into a planar face. The section matches the A1-D design. | As V2 |
| G1 a real mountain gully? | n/a | n/a | **No.** The fill-only V reads as mounds, and there is a serrated wall where steep walls meet the rasterised frozen channel section (a mask artefact). Kept as a diagnostic checkpoint, not proposed. |
| Geographic coherence | Yes (all checks pass) | Hydrologically yes; visually C1 sits *on* the face, not in a valley head | Hydrologically yes; visually no |
| Appealing from player height? | Unchanged at existing player positions | Only inside C1, which no route reaches | G1 views worse than M0 |

Curvature and slope numbers in `validation/*.json` are supplemental; none of them was used as an acceptance score.

## 8. Defects, trade-offs and recommendations

**Defects (generated terrain):**

1. **C1 reads as a stamped bowl from the air.** R1's east face is a uniform planar slope with no valley head, so any bowl cut into it exposes its rim on every side. A convincing cirque must span the full width between the A1 and A2 arêtes, so that its rim *is* the arêtes. The headwall also needs structure (ribs, couloirs, talus), not a smooth surface.
2. **G1 serrated wall.** Steep walls start right at R1's frozen channel section, which is rasterised as a staircase on this diagonal reach, and the 4 m fade lets the staircase through. A ≥ 12 m fade or a smooth vector boundary would remove it.
3. **G1 reads as mounds.** The reach lies in a valley only 5–12 m deep. With the bed fixed, a V can only be built by filling (0 to +14 m). Half the reach is also frozen by the approved High Tarn seam zone (r 185 m).
4. **Camera placement:** from the summit dome, and from the frozen ±10 m A1 crest cap, the convex cap hides the face below, so C1 cannot be seen from the summit area at eye height (the replacement crest camera shows the same limit). C1 is judged from its floor, its lip and the east oblique.

**Trade-offs that need an art-direction decision:**

* **Trail corridor freeze (±75 m, 60 m fade):** it covers the summit's whole south face and A3's south face. While it stands, the silhouette from the south and south-west cannot change. Options:
  * (a) keep it, and treat A1 as a north/east-side study;
  * (b) narrow it near the summit to centreline ± 12–20 m, with a passability gate;
  * (c) move the summit reveal to A2.
* **Crest bands are lower bounds (±10 m frozen):** irregular crests need raises, which you have not approved, so the arêtes keep R1's smooth crest profile.
* **Face gate (≥ 75% unprotected):** it prevents mask-shaped cuts but excludes A2 south-west and A3. The threshold is reviewable.
* **Production builds copy `public/geo-r02c-a1a/` (1.1 MB) into `dist`:** this needs a decision before any deploy (none is authorised).

**Recommendations:**

1. Approve the overlay platform (mechanism, mask, validation, tests) as the basis for A1.
2. Decide the protection question next, since it determines whether the approaches can ever see the change. Recommended: option (b) for the summit block, plus a passability test.
3. Redesign C1 as a valley-head amphitheatre spanning A1–A2 (rim = arêtes, opening ENE), with headwall structure, inside the 85 m envelope.
4. Retest G1 on a reach with at least 25 m of side relief, with a ≥ 12 m channel-edge fade. Do not generalise the gully method yet.
5. Add one or two player-height viewpoints that actually see the north and east faces (for example an A2 route candidate). Otherwise the study cannot be judged at player height.

**Stop conditions:** V3's G1 shows a visible continuity artefact (the serrated wall). Per the brief it is preserved as a diagnostic checkpoint and reported, not forced into acceptance. No other stop condition was hit: parity held, frozen terrain, beds and lakes are unchanged, there are no new sinks, and no design-master edit was needed.

## 9. Reproduce

From the repository root, in the P0 reference environment plus Pillow:

```
python3 tools/geo-r02c-a1a/r1_masks.py                       # 229 s once; verifies the extracted classes
for v in m0 v1 v2 v3; do python3 tools/geo-r02c-a1a/overlay.py tools/geo-r02c-a1a/specs/a1a-$v.json --repeat 2; done
for v in m0 v1 v2 v3; do python3 tools/geo-r02c-a1a/validate.py $v; done
python3 tools/geo-r02c-a1a/cameras_build.py --check
python3 tools/geo-r02c-a1a/sections_maps.py
npx vite --host 127.0.0.1 --port 4311 &                       # then:
node tools/geo-r02c-a1a/capture.mjs --variants m0,v1,v2,v3 --modes clayA,clayB,standard
python3 tools/geo-r02c-a1a/build_review.py
npm test && npm run build
```

View a variant: `/geo-r02b.html?terrain=a1a-v2&presets=a1a` (add `&review=clay&sun=B` for clay).
