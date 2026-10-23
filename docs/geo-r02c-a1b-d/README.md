# GEO-R02C-A1b-D — Why A1a failed, and the A1b redesign (design only)

Status: **design checkpoint.** No terrain was generated or written. The R1, P0, A1-D and A1a branches are unchanged.

**Decisions recorded after review (23 Oct 2026):**

| Item | Decision |
|---|---|
| Preserve this dossier on `feature/geo-r02c-a1b-d-visibility-design` | approved |
| A1b-α, the visible-face experiment on the A2 south-west face | approved as one limited experiment, on its own branch |
| A1b-β, the summit block (needs R-A) | **not approved** |
| R-A corridor narrowing | **not approved** |
| R-B to R-H | **not reviewed; not approved** |
| R-C design-master crest revision | **not approved** |
| C1-R (§2) and G1′ (§3) | **deferred** design alternatives; not to be implemented |

`A1b-implementation-prompt.md` is kept as the handoff written for review. Its B-β part is void under these decisions, and A1b-α is governed by the approval above.

Labels used throughout:
- **MEASURED**: computed from canonical R1, the committed A1a variants, or the committed A1a browser captures.
- **CONCEPT**: a rule-based design target (dashed lines in the figures). It is not terrain.
- **PROPOSAL**: a recommendation or a design judgement.

## 0. A1a preservation (Part 1)

| Check | Result |
|---|---|
| Repository | `https://github.com/Algolon/Aurora-Rest` (origin) |
| Branch / HEAD | `feature/geo-r02c-a1a-form-study` @ `80553e2d5af88fa16ea5ef3db6b0adcbd4b529c3`, 3 commits on `15c0977`, clean worktree |
| Protected paths vs `15c0977` | R1, P0, A1-D, design master, existing tests: 0 files changed |
| Other branches | P0 `90d0cb7`, A1-D `15c0977`, R1 `b6784a9`: local = remote, untouched |
| Committed artefacts | 3 variant patches + manifest, 4 validation reports, 160 JPEG captures + 8 capture manifests, review page, README, default-viewer identity |
| Generated-file check | largest blob 300 KB, total 6.5 MB; no caches, `node_modules`, `dist`, logs or secrets |
| Push | `git push -u origin feature/geo-r02c-a1a-form-study` (no force); remote HEAD = `80553e2…` exactly |

**Erratum (A1a README, left unchanged because A1a is immutable evidence):** the patch sizes in its variant table are wrong. The actual sizes are V1 153,264 B, V2 153,264 B and V3 300,048 B; the README says 314 / 314 / 459 KB. The manifests and tests are correct.

## 1. V1: why the ridge sculpting was invisible (MEASURED)

Data: `data/visibility.json`, `data/editability.json`, `data/pixel_diff.json`. Maps: `images/visibility-{far,tarn,route}.png`. Annotated captures: `images/skyline-protection-*.jpg`.

| Viewpoint | Massif skyline: crest band | Corridor | Editable | Δh for a 3 px skyline change | Max V1 skyline shift |
|---|---|---|---|---|---|
| Birchwood | 81 % | 4 % | 10 % | 9.1 m | 0.00 px |
| Central Valley shoulder | 63 % | 3 % | 23 % | 10.8 m | 0.18 px |
| Central Valley floor | 27 % | 0 % | 20 % | 9.5 m | 0.00 px |
| High Tarn overlook | 21 % | 5 % | 45 % | 2.3 m | 0.35 px |
| High Tarn north shore | 18 % | 2 % | 63 % | 2.6 m | 0.43 px |
| Route s = 1300–2750 m | 30–68 % | 8–69 % | 0–23 % | 0.1–2.1 m | 0.00 px |

Pixel change, M0 → V1/V2/V3 (clay sun B): **0.00 %** from Birchwood, the Central Valley shoulder, the west arm and both approach cameras; ≤ 0.05 % from High Tarn.

The failure has three causes:
1. **The skyline is the crest.** From the far approaches, 62–82 % of the North Peak skyline is the R1 crest lower-bound band. Below-crest face cuts cannot move it at all. V1's largest shift anywhere was 0.43 px.
2. **The route sees the corridor.** From the alpine route, the skyline ahead is mostly the trail corridor (±75 m + 60 m fade) and the crest band. The summit's convex brow sits inside the corridor.
3. **V1 sculpted the faces nobody looks at.** 69–75 % of the massif cells visible from the far approaches were editable, and V1 changed none of them. The face gate (≥ 75 % free) rejected the A2 south-west face (69 %) and the A3 south face (70 %), so only the north and east faces were cut. Those faces are behind the summit from every approach.

**Correction to my A1a recommendation (b):** narrowing the trail corridor frees at most 2.5 % of the far skyline (Birchwood / Central Valley). It helps the route views (4–18 % of their skyline, 15–32 % of route-visible cells at ±20 m), not the far silhouette.

**What would move the far silhouette (MEASURED geometry):** a 3 px change needs 9–11 m at Birchwood / Central Valley; a strong change (≥ 15 px, about 1.1°) needs ≥ 50 m at 2.8 km. The CONCEPT A2 stepped raise (+18 m, route-safe ≥ 114 m from the trail) moves the skyline only 4–5 px. The A3 arm cannot be raised without moving the route, because the trail runs 17–46 m from the A3 crest. **The far silhouette is a design-master property (authored crest heights), not something an A1 overlay can deliver.**

**Can protections be narrowed safely?**
- Corridor: yes, near the summit, with a passability gate. R1 has no flattened tread, and the trail already crosses 50–75 % cross-slopes, so the gate must hold the centreline, the grade and the ±3 m tread cross-slope, not a 150 m band. This needs authorization **R-A**.
- Crest bands: they cannot be lowered (R1 lower bound). They can be raised, which needs **R-B**, and the gain is small.
- Divides, water, valley floors, coast: keep them all. They are not what hides the forms.

## 2. V2: C1 geometry (MEASURED + CONCEPT) — C1-R DEFERRED

Data: `data/hollows.json`, `data/c1_overlook.json`, `data/concept_sections.json`. Figures: `images/geomorph-massif.png`, `images/failure-v2.jpg`, `images/csec-c1r-long.svg`, `images/csec-c1r-cross.svg`.

**Measured:**
- The east side has one broad hollow, between A1 (n-crown) and A2, opening NE to the coast (aspect 42°).
- It is a real valley only between about 650 m and 320 m: 45–124 m below its rims, about 500 m wide.
- Above 700 m, where A1-D/A1a put the C1 floor (690–705 m), the hollow is only 4–21 m deep. That is the planar face, so the bowl's rim showed on three sides.
- Across the floor station, R1 is level (about 700 m) for 250 m on the A2 side, because the A2 arête runs more than 300 m away.
- The hollow is 0 % visible from the far approaches and the route, and 0.3 % from High Tarn. From the summit and the upper A1 crest it is hidden by the convex cap. Only the lower A1 crest (760–790 m) sees 43–51 % of it.
- The tarn-side alternative (the A1-D C2 site) is the opposite case: a planar ESE slope with no valley head, but 52 % visible from the far approaches and 41 % from High Tarn.

**CONCEPT C1-R (Nordbotn rebuilt):**
- **Location:** the same hollow, with the system moved down to the true valley head.
- **Headwall:** 45° from the frozen A1/summit crest-band edge, with local 55–60° rock bands no more than 30 m tall.
- **Floor:** about 665 m at the back, graded to the natural lip at 645 m (thalweg s = 240 m). It grades outward, so there is no closed basin (D9).
- **Walls:** asymmetric. The shaded north-facing wall (A2 side) is 52°; the sunny south-facing wall (A1 side) is 40°.
- **Rims:** A1 is the natural north-west rim. On the A2 side a **lateral rock rib** is left at R1, with a secondary couloir (≤ 18 m) cut beyond it. The rib therefore reads as a spur, not a cut edge.
- **Outflow:** the existing R1 ravine down to the NE bay, untouched.
- **Envelope:** cut only, max lowering 83 m (A1-D envelope 85 m), raise 0.

**PROPOSAL:** C1 can be integrated naturally at its current location only as C1-R. At player height it is worthless until a viewpoint exists (**R-E**: a lower-A1-crest path or overlook). Do not move the cirque to the tarn side: that would invent a valley head on a planar slope, which is decorative, and it carries tarn-catchment risk (**R-F**).

## 3. V3: G1 gully (MEASURED + CONCEPT) — G1′ DEFERRED

Data: `data/gully_search.json`. Figures: `images/failure-v3.jpg`, `images/csec-g1p.svg`.

**Why the frozen masks prevent excavation:**
- Every channel in the window has a frozen wet section of ±20 m.
- Beyond it lies R1's authored bench at about bed + 4 m.
- "Cut room" (how far the ground 4–44 m beyond the wet edge could be lowered while still falling 5 % toward the channel) is 0–3 m on every reach.
- With the bed fixed, a gully can only be made deeper by raising its walls. A1a V3 filled both sides, so the open side became a mound.

**Serrated wall:** steep walls started at the rasterised wet-band edge with a 4 m fade, so the cell staircase became visible. Use a smooth vector distance with a transition of at least 12 m.

**Is a 4 m grid enough?** Yes for walls of 10 m or more (a 25 m wall at 40° spans 7–8 cells). Steps, slots and rock ledges under about 8 m need assets or meshes, not the heightfield.

**Reach search:** no reach in the window has ≥ 25 m relief on both banks. All of them are valley-side channels with one hillside bank.
- **Recommended G1′:** tarn-inlet-w, s = 296–472 m. North (hillside) relief 31–38 m, south bank 4 m, gradient 36 %. 100 % visible from the High Tarn viewpoints, 0 % from the far approaches. The north wall is outside the High Tarn seam zone and is limited only by the R1 valley band (A1a mask mean 0.44).
- **Alternative G2:** tarn-inlet-n, s = 270–376 m (relief about 31 m, 64 % far-visible), next to the D3 frozen head zone (**R-H**).

**CONCEPT section (asymmetric cut-bank gully):**
- Wet section frozen.
- South bench kept as it is.
- North side: a 12 m bank strip, then a 40° wall, filled only up to the R1 hillside advanced 22 m toward the channel. The fill is a wedge that follows the real slope, so there is no back-slope and no mound.
- A 2–3 m rim rounding.
- Max fill about 16 m.
- Needs **R-G** (reach shift and valley-band release).

## 4. Art direction review: A1-D assumptions that implementation disproved

| A1-D assumption | Evidence | Revision |
|---|---|---|
| Per-arm cross-sections and flank asymmetry make the silhouette irregular | Far skyline is 62–82 % crest band; V1 shift ≤ 0.43 px, 0.00 % pixel change | Irregular far silhouette needs crest-profile authority (design master); A1 overlays act on visible faces and the near summit |
| C1 at (−255, 2930), floor 690–705 m, reads as a cirque on the E face | Floor sat above the valley head on a planar face; rim exposed; invisible from all player positions | C1-R moved to the valley head, with a lateral rib, and with an explicit viewpoint decision |
| G1 symmetric V (40° / 30°) via the released bench | Bed + wet ±20 m frozen, cut room 0–3 m, one-sided relief only | Asymmetric cut-bank gully on a hillside reach, monotonic fill |
| Corridor narrowing would reveal the south silhouette (my A1a option b) | ≤ 2.5 % of far skyline freed | Corridor narrowing is a route-experience lever, not a far-silhouette lever |
| Summit point visible only from far approaches; brow hides it from the route (A1-D §6) | Confirmed | Summit-block sculpting near the trail is the strongest player-height lever |

Unchanged principles: no noise, no towers, cut-only where possible, broad and coherent forms, water and routes exactly preserved.

## 5. Comparison (PROPOSAL; measured basis in `data/decisions.json`)

| Option | Visual gain | Hydrological risk | Complexity | Authorization |
|---|---|---|---|---|
| **A1b-α** visible face relief | medium (31 ha of approach/route-visible faces; 0 px skyline) | low | low–medium | none |
| **A1b-β** α + summit block, corridor ±20 m | high on the ascent, medium far | low (route risk handled by gate) | medium | R-A |
| A2 crest raise +18 m | low (4–5 px) | low | low | R-B |
| Design-master crest revision (A-R2) | high (only route to a new far silhouette) | high (re-solve) | high | R-C |
| C1-R valley-head cirque | high credibility, low at current player positions | low–medium | high | R-D (+ R-E to be seen) |
| Tarn-side cirque | high visibility, decorative risk | medium–high | high | R-F |
| G1′ tarn-inlet-w s 296–472 | low–medium, local (High Tarn) | low–medium | medium | R-G |
| G2 tarn-inlet-n | medium | medium (D3) | medium | R-H |

## 6. Changes that need separate authorization (none granted as of 23 Oct 2026)

- **R-A** Peak-ascent corridor near the summit: ±75 m → ±20 m above 780 m, with a passability gate.
- **R-B** Any crest raise.
- **R-C** Design-master crest-profile revision and R1 re-solve.
- **R-D** Replace A1-D C1 with C1-R.
- **R-E** A path or overlook on the lower A1 crest.
- **R-F** A tarn-side cirque (C2-a).
- **R-G** G1 reach shift to s 296–472 m plus valley-band release.
- **R-H** G2 on tarn-inlet-n.

Not an authorization item, but disclosed: the face-gate threshold (0.75 → 0.60 on targeted faces) is a technical parameter.

## 7. Recommendation (Part 5)

**Prioritise A (player-visible summit and faces).**
- It tests the actual A1a failure directly: can anything players see change?
- It has the highest artistic impact at real player positions.
- It is technically the most feasible, reusing the overlay, mask and validation.

B (C1-R) cannot be judged at player height until R-E exists. C (gully) is bed-locked and local.

**The smallest decisive experiment:**
- **A1b-α (always):** viewshed-targeted, cut-only couloir/buttress relief on the A2 south-west, A3 south and summit south faces, under the current protections.
- **A1b-β (only with R-A):** α plus the summit block with a ±20 m tread-gated corridor.
- Decide afterwards whether A-R2 (design-master silhouette) is needed. If α and β pass review, the far silhouette may stay as authored. If reviewers still want a new far silhouette, only R-C delivers it.

The self-contained prompt is `A1b-implementation-prompt.md`. It has not been executed.

## 8. Reproduce

Everything here reproduces from a clean checkout of this branch. Requirements: Python 3.13 with numpy, scipy, shapely and Pillow, and Node with the repository's `node_modules` (Playwright + the pre-installed Chromium) for the SVG → PNG step. From the repository root:

```
PYTHON=python3 docs/geo-r02c-a1b-d/scripts/reproduce.sh
```

What it runs:
1. `rebuild_cache.py` recreates the git-ignored A1a diagnostic cache (`tools/geo-r02c-a1a/.cache/`: the R1 constraint extraction, the R1 divides, and the V1/V3 mask arrays). It runs the A1a overlay in memory, asserts that the rebuilt terrain matches the committed variant SHA-256, and never writes `public/`. It takes about 6 minutes the first time.
2. The analysis chain: `visibility → editability → vis_map → geomorph → hollows → c1_overlook → gully_search → pixel_diff → failure_composites → check_projection → concept_skylines → concept_sections → proposal_map → decisions → build_review`, which takes about 2 minutes.
3. The section SVGs are rendered to PNG with the A1-D helper `docs/geo-r02c-a1d/scripts/render_png.mjs`.

`A1A_ROOT` overrides the repository root if the scripts are run from elsewhere. `review.html` is generated from `scripts/review.src.html` and `A1b-implementation-prompt.md` by `build_review.py`.

Reproduction check: a fresh run on this branch, from an empty cache, reproduced every committed data file and image (see the commit message for the comparison).

Projection check: the measured R1 skyline projected into the A1a captures lands on the rendered skyline (`evidence/projcheck-*.jpg`).

## 9. Package inventory

| Path | Contents | Label |
|---|---|---|
| `README.md` | this dossier, decisions, R-A…R-H definitions | — |
| `A1b-implementation-prompt.md` | implementation handoff written for review (its B-β part is void) | PROPOSAL |
| `review.html` | static review page (built by `scripts/build_review.py`) | — |
| `data/visibility.json`, `viewshed.npz`, `editability.json` | skylines, viewsheds and protection shares for 12 viewpoints | MEASURED |
| `data/pixel_diff.json` | pixel change M0 → V1/V2/V3 on all A1a captures | MEASURED |
| `data/geomorph.npz`, `hollows.json`, `c1_overlook.json` | R1 flow, curvature, hollow thalwegs and sections, C1 site visibility | MEASURED |
| `data/gully_search.json` | per-channel bank relief, cut room, protection and visibility | MEASURED |
| `data/concept_sections.json`, `concept_a2_raise.json`, `proposal_plan.json` | rule-based targets evaluated against R1 | CONCEPT |
| `data/decisions.json` | option comparison and R-A…R-H | PROPOSAL |
| `images/visibility-*.png` | visibility versus protection maps | MEASURED |
| `images/failure-v{1,2,3}.jpg`, `skyline-protection-*.jpg` | real A1a captures, arranged and annotated | MEASURED (+ dashed CONCEPT) |
| `images/geomorph-massif.png` | contours, curvature, flow lines | MEASURED |
| `images/csec-*.svg/.png` | cross-section sketches (C1-R and G1′ deferred) | MEASURED + CONCEPT |
| `images/proposal-plan.png` | releases and kept freeze zones | MEASURED base + CONCEPT |
| `evidence/projcheck-*.jpg` | projection validation | MEASURED |
| `scripts/` | every script above, plus `reproduce.sh`, `rebuild_cache.py`, `build_review.py`, `review.src.html` | — |
