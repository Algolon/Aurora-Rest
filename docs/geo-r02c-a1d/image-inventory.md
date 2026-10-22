# A1-D image and data inventory

Kinds: **measured R1** = computed from committed R1/A-R1 artifacts; **design target** = hand-specified intent, not generated terrain; **reference** = existing material (A-R1 map, P0 captures). Sizes in KB.

## Images

| File | Kind | Shows | Made by | KB |
|---|---|---|---|---|
| [`images/base-ar1.jpg`](images/base-ar1.jpg) | reference | A-R1 map crop, design extent, 2 px/4 m | `scripts/bases.py` | 200 |
| [`images/base-r1-hillshade.jpg`](images/base-r1-hillshade.jpg) | measured R1 | R1 clay hillshade, design extent | `scripts/bases.py` | 98 |
| [`images/hydro-H1-source-n-ns.png`](images/hydro-H1-source-n-ns.png) | measured R1 | H1 N→S through ht-source-n with drainage strip | `scripts/analysis_hydrology.py` | 105 |
| [`images/hydro-H1-source-n-ns.svg`](images/hydro-H1-source-n-ns.svg) | measured R1 | H1 N→S through ht-source-n with drainage strip | `scripts/analysis_hydrology.py` | 8 |
| [`images/hydro-H2-inlet-n-long.png`](images/hydro-H2-inlet-n-long.png) | measured R1 | H2 tarn-inlet-n long profile vs nearest authored crest, MFD areas, candidate head | `scripts/analysis_hydrology.py` | 95 |
| [`images/hydro-H2-inlet-n-long.svg`](images/hydro-H2-inlet-n-long.svg) | measured R1 | H2 tarn-inlet-n long profile vs nearest authored crest, MFD areas, candidate head | `scripts/analysis_hydrology.py` | 7 |
| [`images/hydro-H3-source-w-we.png`](images/hydro-H3-source-w-we.png) | measured R1 | H3 W→E through ht-source-w (saddle + knob) | `scripts/analysis_hydrology.py` | 75 |
| [`images/hydro-H3-source-w-we.svg`](images/hydro-H3-source-w-we.svg) | measured R1 | H3 W→E through ht-source-w (saddle + knob) | `scripts/analysis_hydrology.py` | 13 |
| [`images/hydro-H4-c2-ns.png`](images/hydro-H4-c2-ns.png) | measured R1 | H4 N→S through v0 C2 showing the divide and the crest below the v0 floor | `scripts/analysis_hydrology.py` | 84 |
| [`images/hydro-H4-c2-ns.svg`](images/hydro-H4-c2-ns.svg) | measured R1 | H4 N→S through v0 C2 showing the divide and the crest below the v0 floor | `scripts/analysis_hydrology.py` | 9 |
| [`images/hydro-catchment01-missing.png`](images/hydro-catchment01-missing.png) | measured R1 | Mask: authored catchment 01 cells R1 does not drain to High Tarn (8 m px, x −600…1792, z 1500…3192) | `scripts/analysis_hydrology.py` | 1 |
| [`images/hydro-north-drainage-base.png`](images/hydro-north-drainage-base.png) | measured R1 | Base raster for the hydrology map | `scripts/analysis_hydrology.py` | 89 |
| [`images/hydro-north-map.png`](images/hydro-north-map.png) | measured R1 | D3 map: R1 drainage destination, contours, authored catchment 01, crest anomaly, sources, candidate heads | `scripts/hydro_map.py` | 584 |
| [`images/hydro-north-map.svg`](images/hydro-north-map.svg) | measured R1 | D3 map: R1 drainage destination, contours, authored catchment 01, crest anomaly, sources, candidate heads | `scripts/hydro_map.py` | 50 |
| [`images/overlay-v1-on-ar1.jpg`](images/overlay-v1-on-ar1.jpg) | design target over A-R1 | Annotated concept v1 over the approved A-R1 map (legend included) | `scripts/overlay.py` | 425 |
| [`images/overlay-v1-on-ar1.png`](images/overlay-v1-on-ar1.png) | design target over A-R1 | Annotated concept v1 over the approved A-R1 map (legend included) | `scripts/overlay.py` | 1369 |
| [`images/overlay-v1-on-ar1.svg`](images/overlay-v1-on-ar1.svg) | design target over A-R1 | Annotated concept v1 over the approved A-R1 map (legend included) | `scripts/overlay.py` | 482 |
| [`images/overlay-v1-on-r1-clay.jpg`](images/overlay-v1-on-r1-clay.jpg) | design target over R1 | Same annotations over the R1 clay hillshade | `scripts/overlay.py` | 300 |
| [`images/overlay-v1-on-r1-clay.png`](images/overlay-v1-on-r1-clay.png) | design target over R1 | Same annotations over the R1 clay hillshade | `scripts/overlay.py` | 859 |
| [`images/overlay-v1-on-r1-clay.svg`](images/overlay-v1-on-r1-clay.svg) | design target over R1 | Same annotations over the R1 clay hillshade | `scripts/overlay.py` | 482 |
| [`images/profile-G1-tarn-inlet-w-gully.png`](images/profile-G1-tarn-inlet-w-gully.png) | measured R1 + design target | G1 gully trial section on tarn-inlet-w (true scale) | `scripts/profiles.py` | 50 |
| [`images/profile-G1-tarn-inlet-w-gully.svg`](images/profile-G1-tarn-inlet-w-gully.svg) | measured R1 + design target | G1 gully trial section on tarn-inlet-w (true scale) | `scripts/profiles.py` | 3 |
| [`images/profile-T1-c1-nordbotn.png`](images/profile-T1-c1-nordbotn.png) | measured R1 + design target | T1 W→E at z 2930 through C1 (true scale) | `scripts/profiles.py` | 71 |
| [`images/profile-T1-c1-nordbotn.svg`](images/profile-T1-c1-nordbotn.svg) | measured R1 + design target | T1 W→E at z 2930 through C1 (true scale) | `scripts/profiles.py` | 4 |
| [`images/profile-T2-c2-vastra-tarnbotn.png`](images/profile-T2-c2-vastra-tarnbotn.png) | measured R1 + design target | T2 W→E at z 2530 through C2-a (true scale) | `scripts/profiles.py` | 59 |
| [`images/profile-T2-c2-vastra-tarnbotn.svg`](images/profile-T2-c2-vastra-tarnbotn.svg) | measured R1 + design target | T2 W→E at z 2530 through C2-a (true scale) | `scripts/profiles.py` | 5 |
| [`images/profile-T4-c4-vindbotn-deferred.png`](images/profile-T4-c4-vindbotn-deferred.png) | measured R1 + design target | T4 C4 study (deferred) | `scripts/profiles.py` | 69 |
| [`images/profile-T4-c4-vindbotn-deferred.svg`](images/profile-T4-c4-vindbotn-deferred.svg) | measured R1 + design target | T4 C4 study (deferred) | `scripts/profiles.py` | 4 |
| [`images/profile-T5-inlet-n-option-a-not-recommended.png`](images/profile-T5-inlet-n-option-a-not-recommended.png) | measured R1 + design target | T5 v0 option A divide raise (not recommended) | `scripts/profiles.py` | 74 |
| [`images/profile-T5-inlet-n-option-a-not-recommended.svg`](images/profile-T5-inlet-n-option-a-not-recommended.svg) | measured R1 + design target | T5 v0 option A divide raise (not recommended) | `scripts/profiles.py` | 4 |
| [`images/silhouettes.png`](images/silhouettes.png) | measured R1 (zones = design) | Skylines from ten approaches coloured by A1-D zone | `scripts/analysis_silhouettes.py` | 303 |
| [`images/silhouettes.svg`](images/silhouettes.svg) | measured R1 (zones = design) | Skylines from ten approaches coloured by A1-D zone | `scripts/analysis_silhouettes.py` | 465 |
| [`images/window-v2-validation.png`](images/window-v2-validation.png) | measured R1 + design | Window v2 ring/feather/core, coastal band, features and protected items | `scripts/analysis_design_checks.py` | 552 |
| [`images/evidence/ev-birchwood-clayA.jpg`](images/evidence/ev-birchwood-clayA.jpg) | reference (P0 capture) | downscaled copy of `docs/geo-r02c-p0/captures/clayA/np-from-birchwood.png` | `scripts/evidence.py` | 29 |
| [`images/evidence/ev-cairn-col-clayA.jpg`](images/evidence/ev-cairn-col-clayA.jpg) | reference (P0 capture) | downscaled copy of `docs/geo-r02c-p0/captures/clayA/np-from-cairn-col.png` | `scripts/evidence.py` | 25 |
| [`images/evidence/ev-high-tarn-clayA.jpg`](images/evidence/ev-high-tarn-clayA.jpg) | reference (P0 capture) | downscaled copy of `docs/geo-r02c-p0/captures/clayA/high-tarn.png` | `scripts/evidence.py` | 30 |
| [`images/evidence/ev-oblique-clayA.jpg`](images/evidence/ev-oblique-clayA.jpg) | reference (P0 capture) | downscaled copy of `docs/geo-r02c-p0/captures/clayA/island-oblique.png` | `scripts/evidence.py` | 47 |
| [`images/evidence/ev-tarn-overlook-std.jpg`](images/evidence/ev-tarn-overlook-std.jpg) | reference (P0 capture) | downscaled copy of `docs/geo-r02c-p0/captures/standard/np-from-tarn-overlook.png` | `scripts/evidence.py` | 20 |
| [`images/evidence/ev-valley-shoulder-clayB.jpg`](images/evidence/ev-valley-shoulder-clayB.jpg) | reference (P0 capture) | downscaled copy of `docs/geo-r02c-p0/captures/clayB/np-from-valley-shoulder.png` | `scripts/evidence.py` | 23 |

## Data

| File | Content |
|---|---|
| [`data/a1d-concept-v0.json`](data/a1d-concept-v0.json) | Concept v0 as reviewed (superseded) |
| [`data/a1d-concept-v1.json`](data/a1d-concept-v1.json) | Concept v1 design targets with status per feature |
| [`data/design-checks.json`](data/design-checks.json) | D5/D6/D7: feature clearance, protected items, grid zones, B1 vs route, C2 catchment |
| [`data/evidence-sources.json`](data/evidence-sources.json) | Source P0 capture of each evidence frame |
| [`data/hydrology-north-sources.json`](data/hydrology-north-sources.json) | D3: sources, crest fidelity, n-east-arc anomaly, catchment 01 comparison, relocation candidates |
| [`data/profiles.json`](data/profiles.json) | Five section studies: lines, control points, max lowering/raise |
| [`data/silhouettes.json`](data/silhouettes.json) | Approach skylines, summit line of sight, cirque visibility |
| [`data/window-v2-proposed.json`](data/window-v2-proposed.json) | Window v2 proposal (polygon, ring, feather, coastal band) |

## Superseded v0 (preserved unchanged)

| File | Content |
|---|---|
| [`v0/a1d-proposal-v0.html`](v0/a1d-proposal-v0.html) | v0 as reviewed on 22 Oct 2026 |
| [`v0/overlay-v0-on-ar1.jpg`](v0/overlay-v0-on-ar1.jpg) | v0 as reviewed on 22 Oct 2026 |
| [`v0/overlay-v0-on-r1-clay.jpg`](v0/overlay-v0-on-r1-clay.jpg) | v0 as reviewed on 22 Oct 2026 |
| [`v0/profile-v0-1.svg`](v0/profile-v0-1.svg) | v0 as reviewed on 22 Oct 2026 |
| [`v0/profile-v0-2.svg`](v0/profile-v0-2.svg) | v0 as reviewed on 22 Oct 2026 |
| [`v0/profile-v0-3.svg`](v0/profile-v0-3.svg) | v0 as reviewed on 22 Oct 2026 |
| [`v0/profile-v0-4.svg`](v0/profile-v0-4.svg) | v0 as reviewed on 22 Oct 2026 |
| [`v0/profile-v0-5.svg`](v0/profile-v0-5.svg) | v0 as reviewed on 22 Oct 2026 |
