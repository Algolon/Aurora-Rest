# WORLD-01B — First Playable Island & Visual Calibration

**Review checkpoint, 2026-10-21.** Macro geography is implemented and browser-rendered; final art acceptance and physical Android validation remain open. Work is exclusive to `Algolon/Aurora-Rest`, branch `feature/world-01b-playable-calibration`, starting at WORLD-01 commit **`01d466bdca038f61ed7d5c43dbbe8eba05ed13fb`**. No merge, deployment, release or work in another repository was performed.

## Outcome and reference alignment

The original scene boots in WebGL but fails TypeScript compilation, has unsafe walking/inspection transitions and does not preserve several key geographic relationships in the supplied painting. WORLD-01B repairs the runtime and recomposes the macro terrain around an explicit geographic plan.

The [authoritative illustration](evidence/world-01b/reference-island.png) is oblique art with exaggerated relief. The [geographic plan](WORLD_01B_GEOGRAPHIC_PLAN.md) and [top-down blueprint](evidence/world-01b/geographic-blueprint.svg) were produced and reported before the substantial geographic rework. The approximate 6 × 8 km envelope is retained; the painting's decorative scale was not treated as a survey.

| Reference relationship | WORLD-01 deviation | Implemented WORLD-01B control |
|---|---|---|
| Northern / northwestern massif | One dominant rounded landform | Linked asymmetric, multi-summit crest, western ribs and lower approach walls |
| High Tarn east of the massif | Smaller basin too close to the original crest | Northeastern shelf, 360 m basin and southward outlet |
| Birchwood west of the central passage | Broad fallback region / southeastern viewpoint | Explicit west-central woodland mask and two small lake catchments |
| Hidden Fold east of Cairn Saddle | Enclosed valley on the west | Eastern basin, flanking ridges and tributary to the central river |
| Central valley / Cairn Saddle | Weak passage and terrain reveals | Open northward floor between western hills and eastern shelf |
| Mirelands downstream toward the south | Drainage largely hugs the east | South-central low basin connected to the cove outlet |
| Dune Fields on the eastern coast | Dunes across the southern shore | Eastern coastal sand belt north of Home Cove |
| Windward Coast / South Shoulder | Simplified rounded boundary | Authored coves, headlands, offshore islets and southwestern upland ridge |
| Sheltered southeastern Home Cove | Weakly indented bay | A real inlet, protecting headland, cabin apron and two trail departures |

The runtime coastline uses the same boundary controls as the blueprint. A cached 20 m signed-distance field preserves concave bays with constant-time terrain queries. Seeded detail, pure geography queries, chunk rendering, independent placeholder assets and the WORLD-01 history remain intact.

## Actual Three.js evidence

All PNGs below are browser screenshots of the running Three.js scene. The blueprint is a separate geographic drawing. Neither the blueprint nor the older heightfield diagnostics are presented as engine renders.

| View | WORLD-01 before | WORLD-01B after |
|---|---|---|
| Full island survey | [Original overview](evidence/world-01b/before/overview.png) | [North-up overview](evidence/world-01b/after/overview.png) |
| Elevated composition | Original survey above | [Oblique island](evidence/world-01b/after/island-oblique.png) |
| Home Cove | [Before](evidence/world-01b/before/home-cove.png) | [After](evidence/world-01b/after/home-cove.png) |
| Birchwood reveal | [Before](evidence/world-01b/before/birchwood.png) | [After](evidence/world-01b/after/birchwood.png) |
| Central Valley | [Before](evidence/world-01b/before/central-valley.png) | [After](evidence/world-01b/after/central-valley.png) |
| Cairn Saddle | [Before](evidence/world-01b/before/cairn-saddle.png) | [After](evidence/world-01b/after/cairn-saddle.png) |
| High Tarn | [Original camera intersects terrain](evidence/world-01b/before/high-tarn.png) | [Dry shore viewpoint](evidence/world-01b/after/high-tarn.png) |
| Windward Coast | [Before](evidence/world-01b/before/windward-coast.png) | [After](evidence/world-01b/after/windward-coast.png) |

Additional after views: [South Shoulder](evidence/world-01b/after/south-shoulder.png), [Hidden Fold](evidence/world-01b/after/hidden-fold.png), [Dune Fields](evidence/world-01b/after/dune-fields.png), [mobile-size touch emulation](evidence/world-01b/after/mobile-emulation.png).

**Comparison limits:** WORLD-01's overview puts north at the bottom; WORLD-01B fixes north-up/east-right orientation. Raw screenshots are retained. Named viewpoints moved with their regions, so these are geographic/experience comparisons, not identical camera-position A/B tests. Exact position, yaw, camera and renderer data are in each `runtime.json`. The oblique capture uses a temporary survey camera and reduced haze; those settings are recorded in the capture tool. Captures instrument the served dev module for camera placement and telemetry only; production contains no capture API.

## Runtime changes

- Corrected literal seed type inference that prevented TypeScript compilation. Added a dependency lockfile and `npm ci` in the existing validation-only CI workflow.
- Walking now interpolates the exact terrain triangles instead of smoothing toward the analytic heightfield. Raycast tests verify actual Three.js mesh contact at edges, diagonals and both detail levels.
- Swept movement blocks open water, excessive grades and the rotated cabin footprint. A simple boardwalk shares its deck height with the controller and connects the hero route across the lower drainage.
- Teleports exit overview, set a ground-level camera and reset input. Overview restores the prior location, orientation and walk/fly mode. Returning from flight above open water uses a dry landmark.
- Focus loss and pointer-lock release clear held input. UI fields no longer inadvertently trigger movement shortcuts.
- Higher near/far resolution, hidden downward skirts and shared normals improve surface continuity. Increasing the survey near plane fixes depth fighting across tiles and lake water in the elevated view.
- Restrained daylight improves landform readability. Opaque ocean water removes the visible underwater terrain rectangle. Placeholder props are excluded from open water.

## Executed validation

| Check | Result and evidence |
|---|---|
| Original geography tests | **12/12 passed** before edits: [log](evidence/world-01b/before/tests.txt) |
| Original TypeScript/Vite build | **Failed** on seed parameter types: [log](evidence/world-01b/before/build.txt) |
| Final geography, mesh and traversal tests | **19/19 passed**: [log](evidence/world-01b/after/tests.txt) |
| Final TypeScript + Vite production build | **Passed**: [log](evidence/world-01b/after/build.txt) |
| Development browser controls | **7 recorded checks passed**, including all teleports, overview/fly restoration, WASD, blur handling, water fallback and touch movement/look: [results](evidence/world-01b/after/browser-checks.json) |
| Built production bundle in Chromium | **Passed** boot, all nine teleports and console checks: [results](evidence/world-01b/after/production-smoke.json) |
| Actual engine captures | **7 before + 11 after**, with no captured JavaScript/WebGL console errors: [before metrics](evidence/world-01b/before/runtime.json), [after metrics](evidence/world-01b/after/runtime.json) |

The build retains Vite's warning about a single approximately 565 kB minified application chunk (approximately 145 kB gzip). This is a warning, not a build failure. The existing CI performs source tests and build; browser evidence is local.

## Route feasibility and scale

The original dry-land tests allowed a 96% grade on the dune route, a 91% alpine grade and an alpine endpoint inside the lake. Routes are now offline grade-aware alignments committed as editable controls. Generation does not run during gameplay.

All final routes passed dry-ground and **less than 36% grade at 1 m sampling** against the triangulated walking surface. A separate test advances the actual swept walking function through every full route. This is controller simulation, not a continuous real-time manual hike of every trail.

| Route | Length | Maximum grade at 5 m profile spacing | Submerged samples |
|---|---:|---:|---:|
| Forest → Saddle | 5.80 km | 31.3% | 0 |
| Dune Coast | 2.57 km | 15.7% | 0 |
| Alpine Ascent | 2.08 km | 31.3% | 0 |
| Hidden Fold loop | 6.49 km | 30.9% | 0 |
| Windward Rim | 4.29 km | 32.0% | 0 |

[Final route profiles](evidence/world-01b/after/routes.json). Original profiles use the analytic terrain; final profiles use rendered triangle/deck heights, so the original numbers are diagnostic context rather than a controlled benchmark. Routes have also moved with the reference geography. The hero corridor is about 19 minutes at the current 5 m/s game walk speed, or about 69 minutes at 1.4 m/s. Pacing and full island scale still need user playtesting.

## Performance evidence

Measured on desktop Chromium 151 using ANGLE/Metal on Apple M1, 1440 × 900 at device scale 1. Each static view samples 180 animation frames after settling. These are requestAnimationFrame intervals under desktop synchronization, not GPU timer queries or a mobile performance guarantee.

| View | Draw calls | Triangles | Median / p95 frame interval |
|---|---:|---:|---:|
| Original overview | 228 | 75k | 16.7 / 17.7 ms |
| Final overview | 245 | 288k | 16.7 / 17.7 ms |
| Final Home Cove | 212 | 229k | 16.7 / 17.6 ms |
| Final Central Valley | 105 | 151k | 16.7 / 17.6 ms |
| Final High Tarn | 31 | 84k | 16.7 / 17.6 ms |

The extra triangles purchase terrain contact and shoreline detail. They do not establish an Android budget.

A CPU-only terrain profile found expensive repeated gradient evaluation. A bounded world-aligned gradient cache reduced the observed movement-update p95 from roughly 77 ms to **15.9 ms**, with a final maximum around **24.3 ms**. Final full terrain construction was about **712 ms**, and forced teleport refreshes about **127–238 ms**. These Node CPU timings are distinct from the browser frame measurements: [profile](evidence/world-01b/after/terrain-cpu.json). First load and forced teleports still block, and occasional moving LOD work can exceed a 60 FPS frame budget. Async generation/worker scheduling remains future optimization work.

## Acceptance decision and remaining work

**Implemented:** reference-derived structural geography, deterministic authored coast/islets, relocated region controls, lakes/drainage, route alignments and runtime fixes.

**Tested / browser-verified:** the build, the 19 tests, controller simulations, named desktop views, production smoke checks and mobile-size touch emulation described above.

**Ready for review:** the macro-composition is substantially closer to the reference and recognizable through the intended region relationships. This is a checkpoint candidate, **not final artistic acceptance**. The reference's sculpted cliff language, irregular lake shores, detailed wetlands, layered mountain faces and convincing woodland density are not yet achieved. Lake/water materials, distant LOD transitions, some distant edge artifacts and trail turn presentation still need refinement. The current forest is a geographic mask with sparse independent placeholder trees, not a completed forest scene.

**Unverified:** physical Android GPU/input/memory performance; sustained cross-device play; full character/prop collision; end-to-end hiking enjoyment; final scale; rigorous hydrological simulation; production-quality vegetation and materials. Rivers descend along authored levels and tested beds, but are not an erosion or flood model. No Feh Lu We nature modules were imported in this iteration.

Do not promote the WORLD-02 hero corridor art gate or start island-wide detailed vegetation on the strength of these tests. The next review should first judge the blueprint against the actual overview, approve or revise macro spacing/coastal shape, then refine the one hero corridor at player height.

## Reproduction and provenance

See the [README](../README.md) for commands. Source/evidence hashes in [manifest.json](evidence/world-01b/manifest.json) identify this capture state without claiming that uncommitted captures already belonged to a commit. Runtime JSON records the observed baseline HEAD; the review checkpoint commit and draft PR identify the saved final state. The PR is stacked on `feature/world-00-world-01-foundation` so reviewers see only WORLD-01B changes. No auto-merge or deployment is enabled.
