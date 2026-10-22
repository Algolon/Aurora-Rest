# GEO-R02C-A1-D — North Peak Sculptural Landform Design (design checkpoint)

**Status:** design checkpoint for art review. **Nothing in this folder is generated terrain.** No overlay is implemented, no terrain binary was produced or changed, and A1 has not started.
**Branch:** `feature/geo-r02c-a1d-landform-design`, based on the verified P0 checkpoint `90d0cb745e8e51a3dc737bd4dc11d6f8c322758b` (itself on R1 `b6784a9`).
**Art direction:** *Believable Nature, Sculpted for Wonder.*
**Review page:** [`review.html`](review.html) (static; open locally in a browser). The v0 proposal as reviewed is preserved unchanged in [`v0/`](v0/a1d-proposal-v0.html).

## 0. How to read this dossier

Every number and drawing carries one of these labels:

| Label | Meaning |
|---|---|
| **Measured (R1)** | Computed here from the committed canonical R1 artifacts (`public/geo-r02b/terrain.f32`, `water-surface.f32`, `features.json`) or the A-R1 design master. Reproducible with `scripts/`. |
| **Design target** | Hand-specified intent: control points, ellipses, polylines. These are envelopes for A1 to realise and validate, not solver output. |
| **Inferred** | Follows from measured evidence but was not observed directly. |
| **Recorded** | Taken from the P0 report without re-running. |

In every section drawing, grey = measured R1 surface and dashed orange = design target. Sections are drawn at **true scale** unless the panel states a vertical factor. The v0 profiles were vertically *compressed* (×0.3–0.5), which understated every slope.

## 1. Coordinate conventions

* World metres, x east, z north, heights above sea level. Grid 1501 × 2001 at 4 m: `x = 4i − 3000`, `z = 4000 − 4j`.
* Planning UV of the design master: `u = (x + 3000) / 10`, `v = (4000 − z) / 10`.
* Map extent of the overlays: x −2100…1800, z 1200…4000, north up. 1 SVG px = 4 m; the PNG/JPG rasters are 2× (1 px = 2 m).
* A-R1 map registration: `docs/geo-r02b/reference-a-r1.png`, map frame cols 200–1799 and rows 334–2465 = UV 600 × 800.
* Camera yaw: 0 = north (+z), π/2 = east (+x), as in `src/geo-r02b/main.ts`.
* Coast distance is the Euclidean distance to the `features.json` coastline. The window feather uses Euclidean distance to the window-polygon boundary.

## 2. Concept v1 in one paragraph

North Peak becomes an **irregular three-arm horn** on the authored crests: A1 n-crown, A2 n-main SE and A3 n-main W. Crest positions and levels are fixed. The arms differ deliberately: A1 is sharp, A2 asymmetric and A3 broad. Two cirques carry the alpine character:

* **Nordbotn (C1)** is an E/ENE-facing cirque under the n-crown arête, the primary cirque.
* **Västra tarnbotn (C2)** is an ESE-facing corrie bench under the A2/n-east-arc junction, graded to the tarn-inlet-w source. It gives that stream a real head and moves R1 drainage back toward the authored High Tarn catchment.

The other landforms are handled as follows:

* C3 is not recommended. C4 is deferred.
* B1 is conditional on the route. B2 and B3 are options.
* One gully trial (G1, tarn-inlet-w) replaces the 110 m engineered bench on a single representative reach.
* The north coast, the inlet-n head and the High Tarn seam patch stay frozen.

Data: [`data/a1d-concept-v1.json`](data/a1d-concept-v1.json).

## 3. Corrections to v0 (found by measurement while answering D1–D10)

| # | v0 statement | Measured finding | v1 response |
|---|---|---|---|
| 1 | "C1 sits on a 700–760 m plateau north of the summit" | v0 section T1 ran N–S at x = −250, **parallel to the contours**. The ground is a uniform ~33° east-facing slope between A1 and A2. | C1 re-oriented E/ENE with its headwall under A1. T1 now runs W→E. |
| 2 | "C1 lip ≥ 300 m from the coast" | v0 lip was 213–285 m from the coast, inside the 150–300 m taper. | v1 lip is 400 m out, floor ≥ 388 m, headwall ≥ 366 m (taper weight 1.0 everywhere). |
| 3 | "C2: headwall 40–110 m on the north side" | The authored n-east-arc crest north of v0 C2 is 591–614 m, *below* the v0 floor (617–624 m). 37% of the v0 floor drains to the sea in R1. | C2 moved WSW under the A2 junction, with the headwall W/NW and the floor 92% inside the R1 tarn catchment. |
| 4 | "C3 option A: raise the divide 44–50 m" | The v0 C3 floor centre is 21.5 m from the fixed crest line, and 45% of it drains to the sea. The divide raise is declined under D3. | C3 not recommended. |
| 5 | "B1 ≥ 75 m from the peak-ascent route" | The v0 B1 upper end was 35 m from the centreline, inside the frozen 75 m corridor. | B1 shortened and offset: 114 m minimum. Conditional (D5). |
| 6 | "S1 summit shoulder on the trail" | v0 S1 was about 100 m off the trail. | S1 = the route's real traverse shoulder at (−620, 2545), ~740 m. It is existing R1, protected rather than sculpted. |
| 7 | "Cirque staircase seen from High Tarn" | C2 is 0% visible from K1 and from the tarn overlook (a convex shoulder east of the source hides it). C1 is 10–16% visible. | Claim withdrawn. C2's value is hydrological and seen from the ridges and summit. |
| 8 | v0 profiles | Vertical scale compressed ×0.3–0.5. | All sections redrawn at true scale. |

## 4. D1–D10 decision sheet (preliminary decisions → v1)

| # | Your preliminary decision | v1 response | Evidence | Still open |
|---|---|---|---|---|
| D1 | Three-arm concept, irregular and believable | Arms on the authored crests. R1 holds n-main and n-crown within **1.2 m** of their authored levels, so there is no headroom to cut notches. Irregularity therefore comes from per-arm cross-sections, flank asymmetry, uneven rib and gully rhythm, and C1 ≠ C2. Optional raised towers (≤ 15 m) as an option only. | `hydrology-north-sources.json` → `crestFidelity`; `silhouettes.json` | Approve the per-arm character; towers yes/no |
| D2 | Prioritise C1, C2; investigate C3; defer C4 unless compelling | C1 primary, C2 secondary, C3 not recommended, C4 deferred. **C4 is the only cirque strongly visible from a main approach:** 30% of its zone from Birchwood, 89% from the windward coast. C1 is visible from the tarn side (10–16%) and the n-east-arc (81%). C2 is visible mainly from the ridge (96%). | `silhouettes.json` → `cirqueZoneVisiblePct` | Whether that makes C4 "compelling" (a candidate for A1b after the C1/C2 trials) |
| D3 | No automatic +44–50 m raise; analyse first | Analysed (§5). **Do not raise.** Freeze the inlet-n head in A1; propose a forward-only design-master correction of the source. | `hydrology-north-sources.json`, `images/hydro-*` | Approve the master-correction route |
| D4 | Asymmetric sculptural rock; no global slope target | The global slope envelope is removed. Each landform carries its own asymmetric section. A 4 m heightfield cannot represent faces steeper than about 45° per cell step; that is a technical limit, not a design target. | `profiles.json` | Whether rock meshes are needed after the A1 clay review |
| D5 | B1 only if it integrates with the walking route | B1 v1 branches from the A2 arête 53 m below its crest and stays **≥ 114 m** from the route centreline (needs ≥ 100). 2 of 24 R1 flow seeds from the B1 zone reach the corridor. | `design-checks.json` → `B1route` | Judge in clay from the route before keeping it |
| D6 | Preserve the north coastal freeze; check C1 | Freeze 0–150 m, taper 150–300 m. v1 C1 lies entirely beyond 366 m (taper weight 1.0). The A1 sharpening fades out in the taper, and the last ~200 m of n-crown stays R1. B3 (option) lies partly in the taper (weight 0.91). | `design-checks.json` → `C1coastal`, `featureClearance` | — |
| D7 | Window v2 provisional; validate geometry and feather | Polygon valid, 820 ha. Spill 100 m and glen 86 m outside. Every proposed feature in the core (≥ 208 m from the edge). The feather is Euclidean, rounded at the reflex corner (450, 1950). The P0 mask loader supports boxes only, so a polygon mask is an A1 prerequisite. | `window-v2-proposed.json`, `design-checks.json`, `images/window-v2-validation.png` | — |
| D8 | Trial the gully on one inlet | G1 on the tarn-inlet-w mid reach only (channel fraction 0.35–0.65). Bed fixed, ±5 m bench, ~40° outer / ~30° inner walls. G2 and G3 deferred. | `profile-G1-…` | Review the G1 trial in clay before generalising |
| D9 | No new lakes in A1 | Every cirque floor is graded to its lip. No sinks are allowed. | concept v1 | — |
| D10 | A-R1 and P0 renders as primary references | The A-R1 map is the primary base layer. P0 clay captures are the evidence frames. External references are secondary and not used in the analysis. | `images/evidence/`, `data/evidence-sources.json` | — |

## 5. Northern source conflict: hydrological analysis and recommendation (D3)

**Measured (R1):**

* `ht-source-n` (1290, 2650) is authored at **640 m**. It lies **37 m** from the n-east-arc crest line, which is authored at **553 m**, so the source is **87.5 m above** its own adjacent crest.
* R1 honours the source level by building a knob. The crest there is lifted up to **+94.5 m** above its authored level over 220 m of ridge. It is the *only* departure from authored crest levels on all five northern ridges; every other crest is within 2.4 m.
* The tarn/sea drainage divide passes **12.6 m** from the source.
* The multiple-flow contributing area is **0.10 ha** at the source and only 0.81 ha 400 m downstream. A believable perennial head in this setting needs several hectares.
* Wider context: R1 drains only part of the authored A-R1 High Tarn catchment. On the inflow side (north of z 2300), 13.4 of 73.1 authored ha drain elsewhere (7.5 ha to the sea). Across the whole polygon, including the outlet glen where conventions may differ, the shortfall is 51.7 ha.
* Root cause (inferred): the master's source levels (620 m and 640 m) sit above nearby authored crest levels (597 m and 553 m). R1 follows the levels, not the catchment polygon.

**Options evaluated:**

| Option | Result | Verdict |
|---|---|---|
| A. Raise the divide +44–50 m (v0) | Codifies the knob into a ~690 m false top on a ridge authored at 553 m. Changes the n-east-arc skyline. The crest is fixed 37 m away, so the catchment stays ≲ 0.3 ha. | **Not recommended** |
| B. Leave it, sculpt only a gully | The knob and its 0.1 ha "source on a summit" stay visible at the stream head. | Acceptable only as the A1 interim |
| C. Correct the design master (forward-only) | Moves the head down the existing channel line to a hollow below the crest. Downstream bed levels stay unchanged. The knob disappears in a regenerated R1.x. | **Recommended** |

**Recommendation:**

1. **In A1:** freeze a 200 m zone around the inlet-n head. No sculpting and no raise, so A1 neither entrenches nor removes the knob.
2. **As a separate, approval-gated design-master errata** (alongside the R1.x seam fix): move `ht-source-n` about **150–180 m down the existing channel** to about (1210, 2495–2525). There the authored bed is **503–526 m**, which is 23–41 m below the nearest authored crest and 185–205 m from it.
3. In the same errata, review `ht-source-w` (620 m) against the 597 m n-east-arc section. In A1, C2 already gives that source a 2–8 ha head and moves drainage toward catchment 01.

## 6. Approach silhouettes (A1 scope; the Cairn col is A2)

Terrain-only skylines from ten viewpoints ([`images/silhouettes.svg`](images/silhouettes.svg), [`data/silhouettes.json`](data/silhouettes.json)). **Measured (R1):**

* From the south and south-west (valley shoulder 2.9 km, Birchwood 2.5 km), the skyline within ±12° of the summit is formed by **A2 + A3 + summit (50–62%)**. These are the main levers for silhouette identity.
* The true summit point is in line of sight **only** from those two far approaches. From the route, the tarn, K1, the east ridge, the sea and K3, the summit's own rounded brow hides it. Sharpening the summit block (D1) is what makes the top itself read.
* From the sea to the north, A1 (n-crown) forms 52% of the skyline. From the NE bay at water level the massif is hidden behind the coastal slope.
* **Cairn col:** the summit is hidden and the near foreground forms 100% of the skyline. Per the A1/A2 split, A1 is **not** reshaped to force this view. It belongs to A2.

## 7. Feature catalogue (v1, design targets)

| Id | Form | Status | Geometry (world m) | Target | Measured constraint |
|---|---|---|---|---|---|
| Summit | North Peak | fixed | (−520, 2770), 900 m | sharpen the summit block so the top reads | brow hides the top from 8 of 10 approaches |
| A1 | n-crown arête | proposed | authored crest | sharpest: concave east flank (C1 headwall), stepped west flank; fades out in the coastal taper | crest within 0.8 m of authored |
| A2 | n-main SE arête | proposed | authored crest to (−230, 2540) | steep NE flank, ribbed SW flank (B1) | within 1.2 m |
| A3 | n-main W arête | proposed | authored crest to (−710, 2570) | broad, lower-angle north flank, gullied south flank | within 1.2 m |
| Towers | gendarmes on A1/A2 | option | ≤ 3, 20–40 m long | +8 to +15 m above the crest (raise only) | approval |
| C1 | Nordbotn | proposed | floor (−255, 2930) 100 × 90 m; lip (−165, 2985)–(−160, 2885) | E/ENE aspect; floor 690–705 m graded to a ~688 m lip; headwall relief 145–175 m; max lowering 85 m, no raise | lip 400 m, floor 388 m from coast |
| C2 | Västra tarnbotn | proposed (C2-a) | floor (150, 2530) 115 × 65 m; threshold at the source (400–420, 2500–2545) | ESE; floor 622–632 m graded to 620 m; headwall relief 60–105 m; max lowering 31 m, raise 9 m (saddle fill) | floor 92% tarn catchment; headwall zone 90% inside authored 01 |
| C2-b | enclosed variant | option | north rim (120, 2640)–(250, 2668)–(380, 2650) | +15–25 m rim | restores 1.03 ha, 100% inside authored 01 |
| C3 | Norra tarnbotn | not recommended | — | — | see §3 #4 |
| C4 | Vindbotn | deferred | floor (−1130, 2370) | v0 study T4 kept | most visible cirque from Birchwood (30%) |
| B1 | south pillar | conditional | (−410, 2630)–(−370, 2530)–(−320, 2430) | rib 15–40 m proud | ≥ 114 m from the route centreline |
| B2 | SE-arm ribs | option | (−40, 2400)–(150, 2330); (60, 2230)–(260, 2140) | 10–25 m ribs | justified by K1 / valley shoulder only |
| B3 | Tarnryggen spur rib | option | (880, 2860)–(880, 2500) | 10–30 m rib | partly in the coastal taper (0.91) |
| S1 | route shoulder | fixed | (−620, 2545), ~740 m | protect (frozen corridor) | — |
| S2 / S3 | knolls | deferred / option | (−860, 2240) / (20, 2380) | — | — |
| G1 | tarn-inlet-w gully trial | proposed | channel fraction 0.35–0.65 | bed fixed; ±5 m bench; 40° / 30° walls; max raise 13 m (bench edges filled) | R1 bench ±55 m |
| G2 / G3 | inlet-n, windward | deferred | — | — | D3 / D8 |
| Couloirs, talus | C1 and C2 headwalls | proposed | irregular spacing | notches 4–8 m; talus aprons ~30–34° | — |

## 8. Protected geographic features (must not change in A1)

1. R1 binaries and source, the A-R1 design master, P0 code and existing tests. A1 output is a new artifact, R1 + Δ.
2. Summit position and height (−520, 2770, 900 m).
3. All crest polylines: positions fixed, never lowered. Raises only where approved (towers, C2-b rim).
4. High Tarn: level 360 m, wet extent, 32 m rim, and the seam-error patch with its 185 m clearance at (750, 2172).
5. The High Tarn spill (880, 1850) and glen-tarn-outlet, both outside window v2.
6. Every channel bed polyline, bed level and source point. Only the cross-section beside the bed may change, and only on the G1 trial reach.
7. The inlet-n head zone, r = 200 m around (1290, 2650), pending D3.
8. Coast and the 0–150 m band (frozen), tapering to 300 m.
9. Peak-ascent and tarn-ascent centrelines and corridors (75 m / 55 m), including S1.
10. Cairn Saddle and the lower pass-north-flank (A2 territory).
11. No new water bodies or sinks. Catchment changes only as declared (C2-a, C2-b), and only toward the authored catchment 01.

## 9. Window v2 (provisional design boundary, D7)

Polygon (−2000, 1700) → (450, 1700) → (450, 1950) → (1700, 1950) → (1700, 4000) → (−2000, 4000), with an 8 m frozen ring and a 200 m smoothstep feather ([`data/window-v2-proposed.json`](data/window-v2-proposed.json)). **Measured:**

* The polygon is valid and covers 820 ha. The core holds 264,652 land cells at 4 m.
* The spill is 100 m and the glen 86 m outside the window.
* High Tarn is 88.5% inside, but it is frozen anyway.
* 226 m of the peak-ascent route lies in the feather or ring (frozen corridor). The tarn-ascent route lies entirely outside.
* All proposed and optional features lie in the core.

The P0 file `tools/geo-r02c/masks/A1-window-v1.json` is unchanged.

## 10. Remaining prerequisites before A1 implementation

1. **Final art approval** of D1–D10 as answered here, including C2-a vs C2-b, B1, towers and the C4 position.
2. **D3 decision:** approve freezing inlet-n in A1 and the design-master errata route. The errata itself is not part of A1.
3. **Incremental solver:** H = R1 + Δ, with Δ = 0 on R1 constraints outside released zones. An empty overlay must reproduce `terrain.f32` byte for byte.
4. **Declared constraint release:** valley-floor bands on the G1 reach only; crest raises only where approved. Null = nothing released.
5. **Crest inequality in Δ:** R1's crest lower bounds stay satisfied (H ≥ crest), with the active set reported.
6. **Converged windowed solve** to a stated tolerance; cells outside the window byte-identical to R1.
7. **Polygon window mask** (window v2) with Euclidean feather, the coastal taper and the frozen zones.
8. **Overlay schema and validator:** clearances, frozen zones, graded floors (no sinks), and declared catchment changes, checked against catchment 01.
9. **Hydrology gates:** sink set empty, D8 outlet systems unchanged except as declared, channel beds within 1 mm.
10. **Route gates:** existing peak-ascent and tarn-ascent tests pass unmodified.
11. **Review cameras K1–K4** added through a reviewed test change. P0 pins 15 cameras; adding cameras is not a weakening.
12. **|Δ| report inside the seam clearance.** Must be zero.
13. **Reference environment:** Linux pinned; byte-identical on two runs; Mac probe recommended but not blocking.

## 11. Assumptions and uncertainties

* Silhouettes and visibility are **terrain-only**: no vegetation, haze or curvature, with a 1.75 m eye. They rank options; they do not predict the final rendered view.
* D8 and multiple-flow areas are computed on R1, which already contains the 1.6 m channel cuts. Contributing areas near channels are approximate.
* The "inflow side" catchment comparison cuts at z 2300 to avoid outlet-glen polygon conventions. The whole-polygon figure (51.7 ha) is reported but should not be quoted alone.
* Design-target heights are control-point envelopes. A1's solver will produce a smooth surface between them, so real slopes and edges may differ locally.
* The relocated inlet-n head (§5) is a candidate range, not a design-master edit. Its catchment after regeneration is unknown until R1.x exists.
* C2-a's 7.9 ha contributing area is an estimate from R1 drainage around the bowl. The true value depends on the final floor grading.
* Feature visibility does not account for the cirques themselves once carved. A carved C1 headwall will be more visible than the R1 slope it replaces (inferred).

## 12. Reproduce

From the repository root, in the P0 reference environment (`tools/geo-r02c/env/requirements.lock.txt`) plus Pillow, and Node with Playwright and the pre-installed Chromium:

```
cd docs/geo-r02c-a1d/scripts
python3 bases.py && python3 evidence.py
python3 analysis_hydrology.py      # D3 (slowest step: multiple-flow accumulation)
python3 analysis_design_checks.py  # D5 / D6 / D7 / C2 catchment
python3 analysis_silhouettes.py    # approaches, cirque visibility
python3 profiles.py && python3 overlay.py && python3 hydro_map.py
node render_png.mjs 2 ../images/overlay-v1-*.svg ../images/hydro-north-map.svg
node render_png.mjs 1.5 ../images/profile-*.svg ../images/hydro-H*.svg ../images/silhouettes.svg
```

The scripts only read R1 and A-R1 inputs and write inside `docs/geo-r02c-a1d/`. File list: [`image-inventory.md`](image-inventory.md).
