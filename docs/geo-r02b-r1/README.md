# GEO-R02B-R1 — Terrain integrity and organic landform correction

**Review candidate. The original seven large depressions are corrected; full artistic and walking-corridor approval remains open.** [Open matched before/after browser review](review.html). [Remaining issues and proposed corrections](REMAINING_ISSUES.md) include route widths, exact water-ripple coordinates and the source conflict. No merge, deployment, nature population or GEO-R02C work was performed.

## Evidence and preserved checkpoint

Baseline: `7438e6ae89a64f7ddeecd4b738e9480d9c713e7c` on `codex/geo-r02b-a-r1-terrain-skeleton`, remote `Algolon/Aurora-Rest`. Read-only preflight inspected all eight prior renders, complete local branch history, worktrees, instructions, generation ordering, original master and provenance. [Preflight](preflight.json), [root causes](ROOT_CAUSES.md), [stage-by-stage measurements](stage-depressions.json) and [cross-sections](depression-sections.svg) record the diagnosis before correction. Instrumenting the original generator reproduced its exact binary digest. Original GEO-R02B documentation, browser images and A-R1 files remain preserved. WORLD-01B source and original design outputs are unchanged.

Master `aurora-rest-concept-a-r1`, GEO-R02A-R1.1, SHA-256 `62cb154b4ab6473ae7e2507449cea5407774503cdc09fe42f09adbde0a0ec598`. The unchanged source adapter is pinned in [baseline-features.json](baseline-features.json). All 16 ridge branches, 13 channels, four lakes, eight catchments, four offshore island groups and six destinations are retained. North up/east right; 600 × 800 planning grid; `x=10u-3000`, `z=4000-10v`; 6 × 8 km envelope.

## Corrected construction

Independent maximum-union ridge tents, polygon valley cuts, raised channel supports and final coastal attenuation previously imposed contradictory elevations. The new generator solves a shared positive-weight harmonic field between authored crests, broad valley floors, lake shores, pass and coastline. All inland ridge controls outside explicit valley/water constraints impose lower bounds: low endpoints rise where required by connected terrain rather than forming pits, while high northern crowns retain their designed elevation. The coarse 16 m obstacle solve is refined at 4 m with the same constraints. The western Cairn approach continues 150 m down its existing side-valley direction, removing the artificial closed end cap while retaining its 170 m control. It does not fill depressions, erode the island, flatten routes or add procedural noise.

Channels use continuous closest-segment elevation projection and continuous transverse sections. Valley constraints leave a free transition between competing river systems, so the low main valley cannot overwrite a higher tributary bank. Lake rims remain above their level except at the cut inlet/outlet. Coastal gradients differ for exposed rock, sheltered coast and eastern sand. Coast conditions precede water sections; no attenuation modifies carved beds afterward.

Water is clipped against the exact canonical terrain triangles, with planar lakes and a continuous channel surface field. Ocean-side water is fixed at 0 m, preventing an uphill river interpolation apron from floating over the sea. The render offset is 0.025 m. The maximum computed terrain/water shoreline intersection error is 2.8e-14 m; actual float32 vertices are independently checked against terrain in tests. Open domain triangles above sea: 0. The 20 sea-level domain-edge triangles are covered by the ocean plane. This geometric check is not a discharge, flood or erosion simulation.

The integrity checkpoint renders the same 4 m canonical mesh used for contact. Mixed-resolution skirts are removed; neighbouring tile edge positions and normals match exactly. This costs performance and is not the final Android terrain renderer. Diagnostic crossing decks include measured bank-to-span ramps, with 3.5 m clear width. They remain greybox proposals.

Explicit interpretations: streams retain the prototype's minimum 16 m wetted planning width; bed depth is 1.6 m for this resolved grid. Small final streams need finer conforming geometry and depth review. Lake shores can move by several metres from their vector lines at grid resolution. Ridge curves and intended elevations remain in the source; actual terrain deviations below are not silently treated as source changes.

## Hydrology and coast

Material dry depressions (depth >2 m and area ≥800 m²): 0 at 20 m, 8 m and canonical 4 m sampling. All seven original pockets are absent. The smaller-depression check uses >0.1 m and ≥64 m²: **0 residual components**, maximum 0.000 m, total 0 m². Their coordinates and areas are in [integrity.json](integrity.json). The unrestricted “no unintended closed depressions” claim remains limited by the stated resolution and secondary threshold. Any listed residual requires review.

The actual raster-surface profiles, connected wet components and lake planarity are checked independently in [water-integrity.json](water-integrity.json). All 13 authored water profiles descend; 0 centreline samples stand above water. Lake inner-shore and non-outlet rim failures: 0 / 0. Levels remain High Tarn 360 m, Hidden Fold 118 m, Birchwood 86 / 48 m. Fine bed rises are listed per segment in [terrain-validation.json](terrain-validation.json); tiny raster ripples are not described as perfect hydraulic validation.

The original bank-probe convention still reports 59 low probes. Their measured classification is `{"actual wet cross-section outside original nominal bank probe":1,"lower actual surface from projection":1,"outside authored coast / ocean-side normal probe":51,"overlapping tributary cross-section":6}`; all locations are in [water-integrity.json](water-integrity.json). It compares against the authored centre sample, including some probes beyond the coastline or in overlapping junction sections; it is retained for comparison, not erased. Clipped-interface and actual water-surface checks are additional evidence, not a claim that the old bank/flood assumptions were validated. Review rocky chutes, lower wetland junctions and physical bankfull widths separately.

Coast normal checks: median absolute zero-contour shift 0.52 m, P95 1.67 m, maximum measured 14.66 m; 2899 / 2906 normals find a sea-level crossing within 16 m. All exceptions over 4 m or without a crossing are located in integrity.json. River-mouth notches and sharp local coastal geometry require visual review; broad A-R1 bays/capes are unchanged.

D8 catchment diagnostics remain approximate. Arrival at a designed channel follows its separately checked downstream graph. These values show watershed-mask mismatch and small closed descents; they are not a fluid simulation or a newly approved watershed plan.

|Catchment|Reaches intended system|Unresolved closed descent|
|---|---|---|
|01|84.3%|0.0%|
|02|62.0%|0.0%|
|03|99.2%|0.0%|
|04|24.9%|0.0%|
|05|51.8%|0.0%|
|06|95.5%|0.0%|
|07|89.5%|0.0%|
|08|99.9%|0.0%|

## Six walking proposals and crossing constraints

All route elevations use the actual 4 m triangle diagonal and crossing ramps. [Full profiles](route-profiles.svg), [one-metre CSV](route-profiles-full.csv) and [candidate geometry / search legs](route-candidates.json) preserve exact measurements. The route planner modifies paths only. It tests the original reservation first, then reports controlled wider searches; no route changes terrain elevation.

|Route|Length km|Max grade|Target|Wet samples|3.4 m dry band with ≤35% transverse grade|
|---|---|---|---|---|---|
|hero|4.93|24.4%|25%|0|87.2%|
|tarn-ascent|1.23|29.3%|30%|0|75.8%|
|peak-ascent|2.93|29.4%|30%|0|48.9%|
|hidden-loop|3.96|27.5%|28%|0|74.6%|
|west-cape-spur|1.73|27.9%|30%|0|99.4%|
|south-shoulder-loop|3.39|29.1%|30%|0|84.1%|

A centreline grade pass does not accept its whole walking width. The 3.4 m band with ≤35% transverse grade is a conservative review probe based on the earlier low-slope diagnostic class; it is not a requirement that the entire 110–160 m geographic reservation be level. Purple markers identify narrow or steep transverse sections. Longitudinal grades are feasible candidates where dry, but summit traverses and several flank sections still need a measured narrow trail bench or a different reservation. Broad mountain flattening is not proposed. Full-width approval is withheld wherever the table is below 100%; conflict coordinates and cross-grades are in integrity.json. The terrain foundation is therefore not certified as fully playable across all six corridors.

|Route|Maximum departure from original m|Samples outside original half-width|Original endpoints preserved|
|---|---|---|---|
|hero|61.8|0.00%|True|
|tarn-ascent|57.0|0.64%|True|
|peak-ascent|81.2|1.10%|True|
|hidden-loop|32.0|0.00%|True|
|west-cape-spur|51.9|0.00%|True|
|south-shoulder-loop|81.7|0.00%|True|

M1/H1/H2 use the same authored crossing positions. Ramp lengths, levels, bank heights and grades are in [route-candidates.json](route-candidates.json). Browser controller traversal: `[{"id":"hero","blockedAt":-1,"endDistanceM":0,"samples":5019},{"id":"tarn-ascent","blockedAt":-1,"endDistanceM":0,"samples":1251},{"id":"peak-ascent","blockedAt":-1,"endDistanceM":0,"samples":2999},{"id":"hidden-loop","blockedAt":-1,"endDistanceM":0,"samples":4019},{"id":"west-cape-spur","blockedAt":-1,"endDistanceM":0,"samples":1754},{"id":"south-shoulder-loop","blockedAt":-1,"endDistanceM":0,"samples":3464}]`. This checks the actual walk collision function; width, water capacity and final bridge engineering remain separate gates.

## Geomorphology and regional review

The shared solution removes the large inter-ridge low pockets, the engineered channel support berms and repetitive valley boundary walls. Central Valley has a continuous broad floor; Hidden Fold's lake, enclosing crests and outlet gorge connect through one field. Cairn Saddle measures 215.00 m, northern flank 330.23 m, southern flank 284.66 m; approaches 170.00 / 155.10 m. These closely match 215 / 330 / 285 / 170 / 155 m proposals.

The eight new neutral browser views were inspected. Central Valley loses its large repeating walls and Hidden Fold has a more continuous shore; small local tessellation/constraint marks remain. High Tarn still reads as an engineered inlet ribbon on a smooth shoulder in places. Cairn’s panorama is smoother but its landform rhythm remains weak. Home Cove and Mirelands remain visually flat; those views do not establish meaningful scenic improvement by themselves. North Peak and South Shoulder still lack convincing secondary rock buttresses and valley hierarchy. These remaining defects are not marked accepted.

The neutral ground views are the artistic decision evidence. Harmonic slopes can still be too smooth or show sharp changes at hard floor/crest constraints. North Peak needs review for asymmetric buttresses and subsidiary valley rhythm; South Shoulder for convincing lower rock structure; High Tarn for the transition from inlet gullies to its elevated basin. Home Cove and the eastern sandy zone remain deliberately unpopulated greybox landforms. Improved numerical continuity alone does not establish fidelity to the original illustration.

One source conflict remains at the South low tail: authored endpoint x=450 / z=-3440 m proposes +8 m outside the approved mainland footprint. Coastline authority is preserved there; its measured terrain is below sea level. Proposed source correction for review: move the endpoint inland or end the crest at the coast. The master is not edited.

Largest measured crest-knot deviations (positive values arise where a low authored tail sits inside a higher connected massif; water/valley intersections can override a crest equality):

|Ridge|x/z m|Authored m|Actual m|Difference m|
|---|---|---|---|---|
|forest-lower-spur|[-920.0, -1470.0]|55.0|117.1|+62.1|
|forest-lower-spur|[-690.0, -1310.0]|80.0|102.7|+22.7|
|south-low-tail|[450.0, -3440.0]|8.0|-1.5|-9.5|
|south-north-spur|[-1420.0, -1860.0]|45.0|53.5|+8.5|
|forest-lower-spur|[-420.0, -1250.0]|96.0|104.3|+8.3|
|n-east-arc|[1230.0, 2740.0]|570.0|577.0|+7.0|
|n-east-arc|[1320.0, 1600.0]|275.0|279.5|+4.5|
|e-linked-rim|[1320.0, 1600.0]|275.0|279.5|+4.5|

## Actual browser comparison and diagnostics

Eight unretouched Chromium WebGL images use the original x/z, yaw, pitch, overview and oblique camera specifications at 1600 × 1200. Ground eye height follows the corrected ground +1.75 m; it is not a fixed absolute altitude. The review pairs them with the unchanged baseline images. Height, slope, downhill arrows, depression locations, river/terrain alignment and route conflicts are additional actual browser captures. Scientific SVG profiles are clearly labelled separately.

Browser errors: 0. Render system: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0) (0x0000C0DE)), SwiftShader driver). [Browser QA notes](QA_NOTES.md) preserve the first software-renderer input timeout and its repeat test. Software WebGL timings do not validate desktop hardware or physical Android performance. No physical Android measurements were made.

## Tests, reproducibility and stop

npm test: 24/24 pass (19 unchanged WORLD-01B tests; 5 GEO-R02B/R1 tests). npm run build: TypeScript and Vite production build pass for both entries; shared Three.js chunk >500 kB warning remains. Nineteen retained tests concern WORLD-01B; five concern GEO-R02B/R1 mesh contact, edge continuity, source/digest preservation and actual clipped water geometry. Software tests do not accept artistic defects.

Terrain SHA-256: `fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a`. Independent repeat: Independent complete generation → water clipping → route search reproduced byte-identical terrain, features and both water binaries.. [Verification details](verification-results.json) and [runtime evidence](evidence/runtime.json) record observed source hashes. The source implementation checkpoint used for captures is `fcb2ce3806f15c6014eecfb191d53df37c9913b2`.

Reproduce using Node 24+, Python with the pinned original `tools/geo-r02b/requirements.txt`, then:

```sh
npm ci
python3 tools/geo-r02b-r1/generate.py
python3 tools/geo-r02b-r1/water.py
python3 tools/geo-r02b-r1/routes.py
python3 tools/geo-r02b-r1/validate.py
python3 tools/geo-r02b-r1/water-integrity.py
python3 tools/geo-r02b-r1/integrity.py
npm test
npm run build
npm run dev -- --port 4197 --strictPort
# separate terminal; CHROME and WORLD_URL can override executable / local URL
node tools/geo-r02b-r1/capture.mjs
python3 tools/geo-r02b-r1/report.py
```

Recommendation: review the corrected geographic foundation visually and technically, while withholding full acceptance for the documented hydrological limits, catchment mismatch, route widths and remaining smooth/constraint-driven landform appearance. This checkpoint stops at GEO-R02B-R1. No merge, deployment or next milestone is authorized.
