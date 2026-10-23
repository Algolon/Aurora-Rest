# POP-01 visual and technical QA

**Technical review candidate. Artistic acceptance: open.** Tests pass; browser checks pass. The screenshots show real canonical geography with diagnostic proxies, not approved final assets.

## Measured local review populations

Seed 73129, density 1, 64 m chunks, radius 2: 25 chunks / 10.24 ha active area per region. Generated counts do not change by camera mode. Submitted proxy counts depend on frustum/distance/family visibility and do not measure occlusion-visible pixels. Draw calls/triangles include terrain and static water.

| Region | Camera | Descriptors | Birch | Pine | Grass | Rock | Submitted | Calls | Triangles |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Birchwood Forest | overhead | 4986 | 488 | 250 | 4164 | 84 | 4986 | 101 | 281853 |
| Birchwood Forest | landscape | 4986 | 488 | 250 | 4164 | 84 | 4468 | 101 | 278071 |
| Birchwood Forest | walk | 4986 | 488 | 250 | 4164 | 84 | 273 | 32 | 245877 |
| Central Valley | overhead | 6109 | 48 | 18 | 5996 | 47 | 6109 | 80 | 280985 |
| Central Valley | landscape | 6109 | 48 | 18 | 5996 | 47 | 5380 | 77 | 276495 |
| Central Valley | walk | 6109 | 48 | 18 | 5996 | 47 | 388 | 23 | 245557 |
| Home Cove dry apron | overhead | 4566 | 120 | 27 | 4343 | 76 | 4566 | 82 | 273177 |
| Home Cove dry apron | landscape | 4566 | 120 | 27 | 4343 | 76 | 4150 | 78 | 270611 |
| Home Cove dry apron | walk | 4566 | 120 | 27 | 4343 | 76 | 429 | 23 | 246145 |

## Actual browser evidence

Chromium 153.0.8010.0; ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). 1600 × 1100, DPR 1. No browser errors or warnings. Nine geographic/camera captures + community/slope/water/tread/chunk diagnostics + walking interaction capture. Screenshots are unretouched.

* PASS — four region teleport roundtrips + unload/regenerate preserve IDs and GPU geometry/texture counts
* PASS — instance inspector data resolves stable ID
* PASS — family visibility affects rendered instances without changing population
* PASS — density regeneration deterministic
* PASS — seed control changes and restores population
* PASS — actual WASD movement uses canonical ground height

## Visual assessment

* Birchwood: coherent mixed-tree groups and varying openings are visible. Proxies cannot evaluate approved leaf alpha, shadows, silhouettes or forest-floor layering.
* Central Valley: the initial pass was too wooded. Final population now favors meadow with sparse trees and riverbank clearance. The change is in suitability/density rules, not geography or hand-picked coordinates.
* Home Cove: a sparse-to-woodland gradient and coastal exclusion are visible. Shelter is still only a coarse art-directed proxy; no wind simulation is claimed.
* No internal chunk-grid holes were observed in the overhead/chunk diagnostic. The outer rectangular population termination is the intentionally bounded active set. The non-recursive halo tests provide the stronger spacing/order evidence.
* The seven community colors are categorical diagnostics; their boundaries are visibly sharper than desired final ecological transitions. Source grass, shrubs/heath/sedge families and material coupling will be needed for convincing transitions.
* Walking views now face forward correctly; the original survey-controls override bug was caught and fixed during QA. There is no tree/rock collision system in this diagnostic viewer.
* The terrain review is local and omits distant land beyond the patch; it is not a full-world horizon or continuous terrain-streaming acceptance test.

## Technical criteria

| Criterion | Evidence | Result |
|---|---|---|
| Deterministic descriptors | Repetition / reverse order / chunk repartition tests | Pass |
| Terrain + water integrity | Canonical triangle queries / wet-triangle tests / protected hash guard | Pass |
| Chunk seams and spacing | Halo thinning, tree/rock cross-class spacing and cross-boundary tests | Pass |
| Multiple communities | Seven provisional definitions; actual region distributions | Implemented; art calibration open |
| Three actual regions | Source anchor validation + nine browser views | Pass |
| No unfinished milestone dependency | Only pinned P0 source, isolated population modules | Pass |
| Lifecycle and regeneration | Unit attachment retry/cleanup + browser teleport/regeneration checks | Pass in tested scope |
| Actual-world diagnostics | Community/slope/water/tread/chunks + descriptor inspection | Pass |
| Performance characterization | 27 CPU scenarios, browser submissions, explicit hardware limits | Pass; production FPS unverified |
| Safe POP-02 path | Pinned asset audit, lifecycle/grass-transform risks, staged extraction plan | Documented; actual asset adapter deferred |

Owner review remains required. Do not read “technical review candidate” as a production-performance or artistic approval.
