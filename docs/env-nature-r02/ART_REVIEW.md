# ENV-NATURE-R02 — art acceptance review

**ART NO-GO.** This pilot has a running, reversible implementation and real matched WebGL evidence. It does not establish the premium stylized woodland experience required for owner art acceptance. Stop after the single stone-pocket refinement. No merge or deployment.

## Implementation checkpoint

- Branch: `art/env-nature-r02-woodland-composition`.
- Implementation/evidence checkpoint: `74b7cc89698921e50f39359068b2ccaa5fd17250` (the subsequent report commit adds this review).
- Foundation: `2ffcf1d1794528d2166846ca7cca874c11f33029`; recovery: `bced77ca3ca0539f7137cd9f066e6220518cf4a8`.
- R01 reference: `0ecd5bb4918898b6072c45cb40309922a0c19b99`; R01R decision: `18397507b244d8de5ac77def3da556099e7da22d`. All refreshed origin refs matched before work. None is modified by this branch.
- Added: three files in `src/env-nature-r02`, separate HTML/build config, one test file, bounded audit/capture/walk/report tools, isolated evidence workflow and this evidence directory. Existing source and default Vite config are preserved.
- Local checks: **77/77 current-source tests**, including four R02 tests; TypeScript and production review build pass. Recovery verifier: **558/558 original contents**. The 63 scoped terrain/hydrology/POP/ENV/nature/MAT files additionally match the exact geographic base. Existing historical provenance checks remain unchanged; CI reports their independent status.
- Browser checks: all five matched pairs preserve complete sorted original descriptors, independent canonical-generator output, ground mesh buffers, MAT classification, camera transforms and lighting. Final browser overlay exactly matches the saved placement ledger.
- Walk/lifecycle result: **PASS: path traversal, three regenerations and idempotent cleanup**; 157 engine positions, 14 untouched frame captures, 153.54 m; three regeneration cycles; idempotent disposal, worker/page release, listener cancellation and animation cancellation checked.
- CI runs and raw Linux WebGL artifacts are attached to the branch/PR checks; their status must be read separately from this local result. No hardware Android or desktop performance acceptance is claimed.

## Spatial design and actual constraints

One canonical west-cape spur section moving east toward Central Valley: **(-772,-84) → (-632.6154,-146.4615)**, **153.54 m**. 157 stations, maximum spacing 0.995 m. Five lateral samples across 3.4 m; maximum longitudinal grade 20.62%, cross-grade 24.08%. All are dry. Provisional route distance is zero. Minimum conservative solid-to-centre clearance before player radius is 2.10 m. This is a tested local candidate, not approval of the full hero route.

The surveyed reveal ray from eye position (-632.62, 130.77, -146.46) toward (-260,-60) is blocked: minimum terrain clearance **-3.33 m**. That is a real geographic limitation and matches the weak reveal in the PNG. No terrain was changed to manufacture visibility.

[Top-down composition plan](composition-plan.svg) · [full width/grade/obstruction survey](survey.json) · [complete placement/change ledger](manifest.json) · [protected-file hashes](protected-files.json) · [design and diagnosis](DESIGN.md).

Final authored layer: **1 birch, 2 pines, 4 rocks, 440 grass instances**, all individually named. 12 proposed anchors are rejected rather than moving source solids. Zero original descriptors are removed, repositioned or altered; no clearing masks. The original renderer may hide grass intersecting new rocks through its unchanged overlap policy; rejection counts are recorded per camera. The source-pilot reference ledger contains 1964 originals; camera streaming windows contain larger independent source populations, as tabulated below.

## Genuine image evidence

Unretouched 1100×700 PNG readback from the real Three.js WebGL canvas. First four views: 1.75 m above actual terrain; FOV 57°, DPR 1, seed 73129, density 1, faithful MAT-01 high profile, original source geometries, LOD and grass fade. Identical transforms, terrain, light, material profile and seed per pair. Elevated overview is 145 m above its terrain station. Exact positions/quaternions and renderer settings are in [review.json](evidence/review.json).

- [shelter: source](evidence/source-shelter.png) · [R02](evidence/authored-shelter.png)
- [discovery: source](evidence/source-discovery.png) · [R02](evidence/authored-discovery.png)
- [breathing: source](evidence/source-breathing.png) · [R02](evidence/authored-breathing.png)
- [reveal: source](evidence/source-reveal.png) · [R02](evidence/authored-reveal.png)
- [overview: source](evidence/source-overview.png) · [R02](evidence/authored-overview.png)

[Continuous engine-step traversal and raw frames](evidence/walking/walk.json). This is a sequence of approximately 1 m in-engine movement steps with no inter-station teleport, not a real-time input/video or FPS benchmark. Camera y = terrain + 1.75 m was checked at every step.

## Measured visual efficiency

| View | Source + active overlay descriptors | Draw calls source → R02 | Triangles source → R02 | Submitted source → R02 | RGB pixel change >20/255 |
| --- | ---: | ---: | ---: | ---: | ---: |
| shelter | 4545 + 383 | 66 → 71 | 466,253 → 488,969 | 188 → 259 | 6.37% |
| discovery | 4739 + 447 | 90 → 94 | 540,609 → 555,589 | 244 → 313 | 3.43% |
| breathing | 4505 + 447 | 88 → 91 | 556,897 → 574,185 | 245 → 306 | 2.23% |
| reveal | 3322 + 447 | 113 → 115 | 520,133 → 522,293 | 228 → 238 | 1.44% |
| overview | 4505 + 447 | 111 → 113 | 684,685 → 688,365 | 430 → 437 | 0.39% |

Material count remains **7**, texture count **13**; loaded geometry counts span **27–29** as the original families become resident. MAT estimated texture allocation remains **43,222,155 bytes**, including mip levels. Cleanup records zero geometries, zero pages/chunks and zero MAT owners; the Three.js texture counter retains one entry after renderer disposal and the context-loss call. It did not grow across the three cycles. This is recorded rather than treated as proof of zero VRAM use. Actual driver/GPU VRAM is unavailable; instance-buffer growth is not represented by those texture figures. Full synchronous render samples and CPU submission timings are retained in review.json. These software-renderer figures are diagnostic and do not establish physical-device performance. A changed pixel is not evidence of improved art.

## Art-direction observations

- **shelter:** Asymmetric grass groups add foreground depth and leave a readable centre. The canopy still reads as open woodland, and the fine textured floor dominates.
- **discovery:** The single refinement makes the stone group visible beside the route. Its bright convex silhouette is conspicuously provisional, not a convincing intimate resting landmark.
- **breathing:** The rise and verge rhythm provide a modest transition. Sparse separate tufts do not form a coherent woodland floor or an intimate glade.
- **reveal:** A wooded side slope and a small water glimpse are visible. The intended valley target is terrain-occluded. Added foreground tufts do not create the required landscape reveal.
- **overview:** The intervention is spatially bounded; original tree distribution is retained. The new cover follows short asymmetric verge pockets rather than an island-wide population change.

The owner's 2026-10-28 feedback is borne out by the evidence: **the grass/ground texture is too realistic and fine for the intended stylized approach**. The coarse stylized canopy/tuft silhouettes and densely textured ground do not share a coherent scale of detail. Placement alone did not resolve this. The protected MAT architecture is retained; this task does not silently become a material-art overhaul.

| Criterion | Weight | Judgment / 10 | Observation |
| --- | ---: | ---: | --- |
| Natural composition / hierarchy | 30% | 4 | More near-field rhythm; broad empty floor and weak massing remain |
| Stylized vegetation / material cohesion | 25% | 3 | Realistic fine floor texture, separate tufts and bright convex stone conflict |
| Walking / discovery | 25% | 4 | Contiguous traversal, readable central space; pause and pacing remain weak |
| Landscape reveal / place | 15% | 2 | Small water glimpse, no compelling valley composition |
| Visual efficiency / consistency | 5% | 7 | Existing batches/materials, small measured cost; repeated forms remain |

Supporting weighted judgment: **3.6/10**, subjective and evidence-grounded. The visible floor mismatch and failed reveal determine the rejection independently of that score.

The scene still reads as a prototype. Foreground grouping is modestly improved; the ground remains excessively exposed; tree-to-ground massing is incomplete; no artificial canopy hole was introduced; the required sequence is not artistically convincing. It retains the existing source palette but falls short of Aurora Rest's premium handcrafted stylized direction.

**Confidence:** high in source preservation, local survey, actual renderer pixels and this pilot's rejection; moderate in broader conclusions about what another existing-asset design could achieve. Only one selected segment and one design were tested. No island-wide claim follows. The limiting dependencies are material/understory art cohesion and a genuinely legible landscape sightline. Any future task needs a separately bounded authorization; no additional iteration is started here.

## Reproduction and evidence integrity notes

`npm ci`, then `node --experimental-strip-types tools/env-nature-r02/audit.mjs`, `node --experimental-strip-types --test tests/env-nature-r02.test.ts`, `npm run build`, `npx vite build --config vite.env-nature-r02.config.ts`, and `npm run preview -- --port 4362`. Run `node tools/env-nature-r02/capture.mjs` and `node tools/env-nature-r02/walk.mjs` against that production preview. Install the locked Playwright Chromium first; CHROME may select an existing compatible browser. The separate review config adds the entry point without altering protected recovery build configuration.

Initial ten PNGs are retained in [initial/](initial). The first harness incorrectly compared unsorted worker-map insertion order; the final harness compares every full descriptor sorted by stable ID and independently regenerates canonical references. Signed numeric zero in quaternions is normalized only as numeric zero. No original test was weakened. A dev-server module cache retained pre-refinement code; final authored evidence therefore uses the freshly built production bundle and an exact runtime-manifest assertion. Final source PNGs reuse the untouched initial source readbacks; their full sorted descriptor and ground-buffer hashes match the final runtime. Reuse provenance is explicit in review.json. There are no generated, retouched, concept or diagnostic images presented as runtime proof.

Original context: [issue #4](https://github.com/Algolon/Aurora-Rest/issues/4), [R01 real WebGL](https://github.com/Algolon/Aurora-Rest/actions/runs/40536613933), [R01R art rejection](https://github.com/Algolon/Aurora-Rest/blob/18397507b244d8de5ac77def3da556099e7da22d/docs/env-nature-r01/ART_REVIEW_R01R.md).
