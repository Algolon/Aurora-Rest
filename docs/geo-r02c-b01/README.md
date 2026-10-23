# GEO-R02C-B0/B1 — Art-Directed Northern Massif Rebaseline

Branch `feature/geo-r02c-b01-north-massif-rebaseline`, created from the verified A1c checkpoint
`f1d58eb1a9508f5a7c287f06d7617a327cfabf13` (one-time AGENTS.md exception, as authorised).

| What | Status |
|---|---|
| A-R1 design master `docs/geo-r02b/design-master-A-R1-v1.json` (`62cb154b…`) | Untouched |
| R1 generator and binaries (`fc8fd6da…`) | Untouched |
| Earlier milestone branches | Untouched |
| Merge or deployment | None |

**Verdict:**
- **B1.1 shows significant artistic progress and is the first candidate that reads as a mountain massif.** It is not yet art-approved.
- **Why it is not approved:**
  - From the identity views, the new crown sits on the unchanged smooth plinth.
  - Some faces show planar facets.
  - The Western Col is filled.
  - Two arm ends make short artificial sea-cliff steps at the coast band.
- **Supporting files:** `review.html` (self-contained) and `art-notes.json`.

## Method

The terrain is not an overlay on R1. The derived, versioned design master
`tools/geo-r02c-b01/design/north-massif-b1.json` authors the massif. It describes:

- the summit hierarchy and saddles;
- three different arms plus the High Tarn rim and the Vestfjell plateau;
- buttresses;
- four cirques with outlet troughs;
- the study area, its preserved features and the drainage and route intent.

`tools/geo-r02c-b01/build.py` generates the regional heightfield from it (`lib/massif.py`):

1. **Base.** The lowland envelope is R1, smoothed and lowered in the massif core. The lowering tapers to zero toward the coast and the south and east edges.
2. **Ridges.** The authored crest lines are added with a smooth maximum. Each crest has a PCHIP profile through the summits and saddles, and asymmetric concave flanks whose width varies along the ridge.
3. **Cap.** Raises are capped relative to R1 away from the crests, so the lower slopes keep their character.
4. **Cirques and troughs.** These are carved with a smooth minimum, but never at the summits.
5. **Rib field.** A weak, seeded rib field is added, then a talus limit and light smoothing.
6. **Blend.** The result is blended into R1 with a 220 m feather. The blend weight is 0 at the coast band, on all water, at High Tarn plus 150 m, on the two inlet corridors and on all other routes.
7. **Conditioning.** An epsilon priority flood removes the remaining dry depressions, so the drainage is regenerated rather than frozen.
8. **Route.** `lib/route.py` derives the candidate peak-ascent with a grade-constrained A* on the rendered triangle surface. It follows R1 until the route enters the edited terrain.

The viewer loads B1 as an opt-in variant, `?terrain=b01-b1` (`&cams=b01` adds the new cameras). The variant patch is verified by its SHA-256. Its route override replaces `peak-ascent` and keeps the R1 alignment as `peak-ascent-r1`.

## Results (B1.1)

| | |
|---|---|
| Terrain SHA-256 | `86e89c1e955ef44b252111d87cfce1194eae55efac479bb1a3b069966ce7323d` |
| Changed area | 327.2 ha (190.8 ha raised and 84.3 ha lowered by more than 1 m), all inside the study area |
| Extremes | +155.5 m / −195.3 m |
| Summit | 897.0 m at (−520, 2772), 2 m from the approved position; island maximum |
| Hierarchy | Tarntind 774.7, Vesttind 735.8, Nordhorn 754.0, Austtind 700.2; Skar notch 711.9 (R1 809.8), North gap 759.5 (R1 861.2), Tarn col 625.4, Western Col 728.8 (authored 668: filled, known defect) |
| Skyline from Birchwood | max shift 33.9 px, 25.1° of width over 3 px (A1c S1: 4.2 px) |
| Skyline from the Central Valley shoulder | 29.2 px, 20.4° (A1c S1: 2.7 px) |

### Preserved, cell for cell

- Everything outside the study area.
- Land/sea and the 0–70 m coast band.
- Every water cell.
- High Tarn: lake, 360 m level, shoreline and 150 m around it.
- The tarn-inlet-w and windward-gully corridors.
- The centrelines of hero, tarn-ascent, hidden-loop, west-cape-spur and south-shoulder-loop. All five also pass the walk test on B1.

### Hydrology (whole island)

- No new dry closed depressions; the maximum fill depth is 0.033 m, as on R1.
- No new unresolved drainage.
- 17.6 ha change their drainage destination. The High Tarn catchment goes from 102.3 to 95.3 ha.
- The D8 stream network above 5 ha is regenerated: 3,337 stream cells on B1 against 2,394 on R1.
- One conditioned hollow (0.39 ha, 6.6 m deep) remains as a dry tarn site.

### Route

- The R1 alignment is blocked on B1 at point 2000 and is kept as reference.
- The candidate shares its first 1,074 points with R1 and is 2,795 m long in total.
- It passes the walk-test emulation (0.65 m steps, grade ≤ 0.7) end to end.
- Hiking grade (10 m): p95 0.294, and 1.5 % of the route is above 0.30.
- A declared summit scramble covers the last 140 m, with a maximum of 0.475.

### Boundary

The largest cluster where B1 adds steepness over R1 in the blend band is 2.1 ha, which fails the 0.25 ha limit. It sits where arm ends meet the coast freeze; see the limitations in `art-notes.json`.

### Determinism, tests and build

- **Determinism:** `--repeat 2` gives identical output.
- **Tests:** `npm test` passes 58/58: the 50 existing tests, unmodified, plus 8 in `tests/geo-r02c-b01.test.ts`.
- **Build:** `npm run build` passes.
- **Runtime:** a 1.23 MB patch plus a 62 kB route file. The mesh and controller are unchanged.

## Evidence

| Path | Contents |
|---|---|
| `images/design-plan.png`, `images/target-*.svg` | **B0 design targets**: authored intent, not terrain |
| `captures/b01-m0`, `captures/b01-b1.0`, `captures/b01-b1` | 72 real Three.js frames: 12 identical cameras × clay sun A/B; manifests carry each frame's terrain SHA |
| `images/compare-*.jpg` | Matched M0 \| B1.0 \| B1.1 sheets |
| `images/maps-b1.png`, `images/sections-b1.svg`, `images/skyline-b1-*.svg`, `images/streams-b1.png` | Measured geometry, skylines and streams |
| `validation/b1.json` | Independent validation |
| `data/skylines.json` | Measured skyline shifts |
| `run-log.json` | Iterations, environment, tests and build |
| `iteration/` | The B1.0 design and manifest |

## Reproduce

```sh
python3 tools/geo-r02c-b01/build.py --repeat 2      # B1.1 patch, manifest, route (about 2 min per run)
python3 tools/geo-r02c-b01/validate.py              # validation/b1.json
python3 tools/geo-r02c-b01/evidence.py              # figures and data/skylines.json
npx vite --port 4341 &                              # viewer: /geo-r02b.html?terrain=b01-b1&cams=b01&presets=a1a
node tools/geo-r02c-b01/capture.mjs --url http://127.0.0.1:4341/geo-r02b.html --out docs/geo-r02c-b01/captures \
  --variants b01-m0,b01-b1 --modes clayA,clayB --views a1a-birchwood,a1a-valley-shoulder,a1a-tarn-overlook,a1c-tarn-east,a1a-approach-mid,a1a-approach-upper,b01-route-fjell,b01-route-shoulder,a1a-oblique-se,a1a-oblique-n,b01-oblique-sw,a1c-west-coast
python3 tools/geo-r02c-b01/compare.py && python3 tools/geo-r02c-b01/build_review.py
npm test && npm run build
```

`tools/geo-r02c-b01/preview.py` is a fast numpy design preview used while authoring. It is **not** a Three.js capture, and none of its output is presented as evidence.
