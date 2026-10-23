# GEO-R02C-B2a — North Peak Geographic Integration & Hiking Quality

Branch `feature/geo-r02c-b2a-geographic-integration`, created from the verified B1.1 checkpoint
`679958e6b29d7739c4b0b37809e0c11101a264c4`. This branch is a one-time exception to AGENTS.md (it is not branched from `main`), as authorised.

| What | Status |
|---|---|
| A-R1 design master, R1 generator and binaries (`fc8fd6da…`) | Untouched |
| B1.1 design, patch (`86e89c1e…`), routes and evidence; B1.0; earlier GEO-R02C branches | Untouched (`data/protected-integrity.json`) |
| `main` | Untouched. No merge and no deployment. |
| B2a candidate | `?terrain=b2a-a`, terrain SHA-256 `a2476daa86a3b4291d20a13b89359446eb19a923d62621102daac147dc2a3332` |

**Verdict: GEOGRAPHIC PASS · PRIMARY HIKE PASS · SCRAMBLE AND TRAIL ART CONDITIONAL. Not full acceptance.** The optional scramble fails its own 0.50 limit (8 m) and has no tread, and the heightfield bench leaves visible artefacts (north arête sawtooth, hairpin chevrons).

The verdict, the gate table and the known-defect register are in `art-notes.json` and `review.html` (sections 1, 7 and 10).

## What B2a changes (and only that)

B2a is derived from B1.1. Its versioned design is `tools/geo-r02c-b2a/design/north-massif-b2a.json` (revision B2a.1, with `parentB11` provenance). `data/design-changes-b1.1-to-b2a.json` lists every field that differs from B1.1.

| | B1.1 defect | B2a correction | Result |
|---|---|---|---|
| D1 | 4 coastal / corridor seam clusters over 0.25 ha (2.08, 1.71, 0.88, 0.79 ha) | Authored terminal profiles: the authored difference to R1 decays by smoothstep between the 70 m coast freeze and a per-structure terminal length. Vesttind and Nordhorn are protected. A separate 320 m taper runs before the windward-gully corridor. | 0 clusters over 0.25 ha (largest 0.09 ha). Same criterion and limit. Band-independent cross-check in `data/seam-area-cross-check.json`. |
| D2 | Col 695.3 m at the wrong place; Vesttind prominence 40.5 m | Root cause: the flank-variation branch of `ridge_height` applied no end caps, so the south-east arm continued behind the summit as a radial cone and filled the col. Fix: explicit authored start cap; col target reconciled to 680 m (Vesttind 735.8 m with ~56 m prominence); the Vestfjell plateau start moved west. | Col 681.4 m at (−810, 2683). Prominence 54.4 m. North Peak 897.04 m, apex unchanged. |
| D3 | 38 m over 0.30, summit section max 0.475, 25.7 % cross-slope > 0.5, no tread | Split into a primary approach (limit 0.30) to the Vestfjell shoulder viewpoint and an explicitly identified optional scramble (limit 0.50). Trail bench cut and fill in the heightfield. Both routes re-planned on the final surface. | Primary: 0 m over 0.30, max 0.296, 0 % cross-slope > 0.5. Scramble: 8 m over its 0.50 limit, 69 % cross-slope > 0.5, no usable tread. |
| D4 | 0.39 ha dry hollow (6.6 m conditioned fill) | Least-cut natural outlet gully (188 m, max cut 7.25 m), smoothed in plan; no new tarn. | 0 dry hollows, 0 new sinks. High Tarn untouched. |

The one bounded corrective pass (B2a.0 → B2a.1) shortened the arm-west terminal from 520 m to 380 m. In B2a.0 the taper pulled the west arm 21 px down in the Birchwood skyline; B2a.1 brings that to 16.4 px, inside the declared D1 window. One implementation defect was then fixed without any design change. The D4 channel had followed the 8-connected grid staircase and aliased into a comb of notches, so it is now carved along the smoothed path polyline.

## Reproduce

```
python3 tools/geo-r02c-b2a/build.py --repeat 2        # B2a patch, manifest, routes; asserts identical SHA over 2 runs
python3 tools/geo-r02c-b2a/validate.py                # validation/a.json (preserved areas, hydrology, seams, summit, route)
python3 tools/geo-r02c-b2a/final_checks.py            # validation/a-final.json (recomposition, D1-D4 detail)
python3 tools/geo-r02c-b2a/skyline_regression.py      # data/skyline-regression.json (exit 1 on regression)
python3 tools/geo-r02c-b2a/evidence.py                # measured figures in images/, data/seam-area-cross-check.json, data/design-changes-*.json
npx vite --port 4351 &                                # viewer
node tools/geo-r02c-b2a/capture.mjs --url http://127.0.0.1:4351/geo-r02b.html --variants b2a-a --modes clayA --views <ids>
node tools/geo-r02c-b2a/traverse.mjs --url http://127.0.0.1:4351/geo-r02b.html   # validation/traversal.json
python3 tools/geo-r02c-b2a/compare.py                 # images/compare-*.jpg
python3 tools/geo-r02c-b2a/protect_check.py           # data/protected-integrity.json
python3 tools/geo-r02c-b2a/checksums.py && python3 tools/geo-r02c-b2a/build_review.py
```

The B1.1 reference terrain is rebuilt from the B1.1 patch and never rewritten. Viewer: `?terrain=b2a-a&cams=b2a` (B1.1 is `?terrain=b01-b1`). The B2a variant replaces `peak-ascent` and adds `peak-scramble`. The R1 alignment stays available as `peak-ascent-r1`.

## Files

- `captures/<variant>/<clayA|clayB>/<view>.jpg`: real Three.js captures. Each `capture-manifest-*.json` records the terrain SHA-256, camera, renderer and timing.
- `images/compare-*.jpg`: matched B1.1 | B2a sheets.
- `images/diff-b2a.png`, `seams-b2a.png`, `col-b2a.svg`, `outlet-b2a.png`, `route-b2a.svg`, `skyline-b2a-*.svg`: measured terrain figures. None is design-only.
- `validation/`, `data/`, `run-log.json`, `art-notes.json`, `review.html`.
