import {readFileSync,writeFileSync} from 'node:fs';
const root='docs/env-nature-r02',r=JSON.parse(readFileSync(root+'/evidence/review.json')),walk=JSON.parse(readFileSync(root+'/evidence/walking/walk.json')),survey=JSON.parse(readFileSync(root+'/survey.json')),manifest=JSON.parse(readFileSync(root+'/manifest.json')),pixels=JSON.parse(readFileSync(root+'/evidence/pixel-differences.json'));
const checkpoint=process.argv[2]??'see branch history';
const views=['shelter','discovery','breathing','reveal','overview'];
const rows=views.map(view=>{const a=r.records.find(v=>v.mode==='source'&&v.view===view),b=r.records.find(v=>v.mode==='authored'&&v.view===view);return {view,a,b,pixel:pixels.find(p=>p.view===view)}});
const table=rows.map(({view,a,b,pixel})=>`| ${view} | ${a.snapshot.descriptorCount} + ${b.snapshot.overlayCount} | ${a.snapshot.renderer.calls} → ${b.snapshot.renderer.calls} | ${a.snapshot.renderer.triangles.toLocaleString('en-US')} → ${b.snapshot.renderer.triangles.toLocaleString('en-US')} | ${a.snapshot.render.visible} → ${b.snapshot.render.visible} | ${pixel.channelDifferenceAbove20Percent.toFixed(2)}% |`).join('\n');
const observations={shelter:'Asymmetric grass groups add foreground depth and leave a readable centre. The canopy still reads as open woodland, and the fine textured floor dominates.',discovery:'The single refinement makes the stone group visible beside the route. Its bright convex silhouette is conspicuously provisional, not a convincing intimate resting landmark.',breathing:'The rise and verge rhythm provide a modest transition. Sparse separate tufts do not form a coherent woodland floor or an intimate glade.',reveal:'A wooded side slope and a small water glimpse are visible. The intended valley target is terrain-occluded. Added foreground tufts do not create the required landscape reveal.',overview:'The intervention is spatially bounded; original tree distribution is retained. The new cover follows short asymmetric verge pockets rather than an island-wide population change.'};
const sourceLinks=views.map(v=>`- [${v}: source](evidence/source-${v}.png) · [R02](evidence/authored-${v}.png)`).join('\n');
const markdown=`# ENV-NATURE-R02 — art acceptance review

**ART NO-GO.** This pilot has a running, reversible implementation and real matched WebGL evidence. It does not establish the premium stylized woodland experience required for owner art acceptance. Stop after the single stone-pocket refinement. No merge or deployment.

## Implementation checkpoint

- Branch: \`art/env-nature-r02-woodland-composition\`.
- Implementation/evidence checkpoint: \`${checkpoint}\` (the subsequent report commit adds this review).
- Foundation: \`2ffcf1d1794528d2166846ca7cca874c11f33029\`; recovery: \`bced77ca3ca0539f7137cd9f066e6220518cf4a8\`.
- R01 reference: \`0ecd5bb4918898b6072c45cb40309922a0c19b99\`; R01R decision: \`18397507b244d8de5ac77def3da556099e7da22d\`. All refreshed origin refs matched before work. None is modified by this branch.
- Added: three files in \`src/env-nature-r02\`, separate HTML/build config, one test file, bounded audit/capture/walk/report tools, isolated evidence workflow and this evidence directory. Existing source and default Vite config are preserved.
- Local checks: **77/77 current-source tests**, including four R02 tests; TypeScript and production review build pass. Recovery verifier: **558/558 original contents**. The 63 scoped terrain/hydrology/POP/ENV/nature/MAT files additionally match the exact geographic base. Existing historical provenance checks remain unchanged; CI reports their independent status.
- Browser checks: all five matched pairs preserve complete sorted original descriptors, independent canonical-generator output, ground mesh buffers, MAT classification, camera transforms and lighting. Final browser overlay exactly matches the saved placement ledger.
- Walk/lifecycle result: **${walk.status}**; ${walk.steps.length} engine positions, ${walk.frames.length} untouched frame captures, ${walk.distanceM?.toFixed(2)} m; three regeneration cycles; idempotent disposal, worker/page release, listener cancellation and animation cancellation checked.
- CI runs and raw Linux WebGL artifacts are attached to the branch/PR checks; their status must be read separately from this local result. No hardware Android or desktop performance acceptance is claimed.

## Spatial design and actual constraints

One canonical west-cape spur section moving east toward Central Valley: **(-772,-84) → (-632.6154,-146.4615)**, **${survey.lengthM.toFixed(2)} m**. ${survey.sampleCount} stations, maximum spacing ${survey.maxIntervalM.toFixed(3)} m. Five lateral samples across 3.4 m; maximum longitudinal grade ${(survey.maxAlongGrade*100).toFixed(2)}%, cross-grade ${(survey.maxCrossGrade*100).toFixed(2)}%. All are dry. Provisional route distance is zero. Minimum conservative solid-to-centre clearance before player radius is ${Math.min(...survey.samples.map(s=>s.nearestSolid.distance-s.nearestSolid.radius)).toFixed(2)} m. This is a tested local candidate, not approval of the full hero route.

The surveyed reveal ray from eye position (${survey.sightline.from.map(x=>x.toFixed(2)).join(', ')}) toward (-260,-60) is blocked: minimum terrain clearance **${survey.sightline.minClearance.toFixed(2)} m**. That is a real geographic limitation and matches the weak reveal in the PNG. No terrain was changed to manufacture visibility.

[Top-down composition plan](composition-plan.svg) · [full width/grade/obstruction survey](survey.json) · [complete placement/change ledger](manifest.json) · [protected-file hashes](protected-files.json) · [design and diagnosis](DESIGN.md).

Final authored layer: **1 birch, 2 pines, 4 rocks, 440 grass instances**, all individually named. ${manifest.rejected.length} proposed anchors are rejected rather than moving source solids. Zero original descriptors are removed, repositioned or altered; no clearing masks. The original renderer may hide grass intersecting new rocks through its unchanged overlap policy; rejection counts are recorded per camera. The source-pilot reference ledger contains ${manifest.sourceCount} originals; camera streaming windows contain larger independent source populations, as tabulated below.

## Genuine image evidence

Unretouched 1100×700 PNG readback from the real Three.js WebGL canvas. First four views: 1.75 m above actual terrain; FOV 57°, DPR 1, seed 73129, density 1, faithful MAT-01 high profile, original source geometries, LOD and grass fade. Identical transforms, terrain, light, material profile and seed per pair. Elevated overview is 145 m above its terrain station. Exact positions/quaternions and renderer settings are in [review.json](evidence/review.json).

${sourceLinks}

[Continuous engine-step traversal and raw frames](evidence/walking/walk.json). This is a sequence of approximately 1 m in-engine movement steps with no inter-station teleport, not a real-time input/video or FPS benchmark. Camera y = terrain + 1.75 m was checked at every step.

## Measured visual efficiency

| View | Source + active overlay descriptors | Draw calls source → R02 | Triangles source → R02 | Submitted source → R02 | RGB pixel change >20/255 |
| --- | ---: | ---: | ---: | ---: | ---: |
${table}

Material count remains **7**, texture count **13**; loaded geometry counts span **27–29** as the original families become resident. MAT estimated texture allocation remains **43,222,155 bytes**, including mip levels. Actual driver/GPU VRAM is unavailable; instance-buffer growth is not represented by those texture figures. Full synchronous render samples and CPU submission timings are retained in review.json. These software-renderer figures are diagnostic and do not establish physical-device performance. A changed pixel is not evidence of improved art.

## Art-direction observations

${views.map(v=>`- **${v}:** ${observations[v]}`).join('\n')}

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

\`npm ci\`, then \`node --experimental-strip-types tools/env-nature-r02/audit.mjs\`, \`node --experimental-strip-types --test tests/env-nature-r02.test.ts\`, \`npm run build\`, \`npx vite build --config vite.env-nature-r02.config.ts\`, and \`npm run preview -- --port 4362\`. Run \`node tools/env-nature-r02/capture.mjs\` and \`node tools/env-nature-r02/walk.mjs\` against that production preview. Install the locked Playwright Chromium first; CHROME may select an existing compatible browser. The separate review config adds the entry point without altering protected recovery build configuration.

Initial ten PNGs are retained in [initial/](initial). The first harness incorrectly compared unsorted worker-map insertion order; the final harness compares every full descriptor sorted by stable ID and independently regenerates canonical references. Signed numeric zero in quaternions is normalized only as numeric zero. No original test was weakened. A dev-server module cache retained pre-refinement code; final authored evidence therefore uses the freshly built production bundle and an exact runtime-manifest assertion. Final source PNGs reuse the untouched initial source readbacks; their full sorted descriptor and ground-buffer hashes match the final runtime. Reuse provenance is explicit in review.json. There are no generated, retouched, concept or diagnostic images presented as runtime proof.

Original context: [issue #4](https://github.com/Algolon/Aurora-Rest/issues/4), [R01 real WebGL](https://github.com/Algolon/Aurora-Rest/actions/runs/40536613933), [R01R art rejection](https://github.com/Algolon/Aurora-Rest/blob/18397507b244d8de5ac77def3da556099e7da22d/docs/env-nature-r01/ART_REVIEW_R01R.md).
`;
writeFileSync(root+'/ART_REVIEW.md',markdown);
const figures=rows.map(({view,a,b})=>`<section><h2>${view}</h2><p>${observations[view]}</p><div class="pair"><figure><figcaption>Original source</figcaption><a href="evidence/${a.file}"><img src="evidence/${a.file}" loading="lazy"></a></figure><figure><figcaption>Authored R02</figcaption><a href="evidence/${b.file}"><img src="evidence/${b.file}" loading="lazy"></a></figure></div></section>`).join('');
writeFileSync(root+'/review.html',`<!doctype html><html lang="en"><meta charset="utf-8"><title>Aurora Rest — R02 art review</title><style>body{font:16px/1.5 system-ui;margin:24px;background:#eeeae1;color:#202d29}h1,h2{line-height:1.2}.pair{display:flex;gap:16px}figure{margin:0;flex:1;min-width:0}img{width:100%;height:auto}section{margin:32px 0}a{color:#26534c}@media(max-width:800px){.pair{display:block}}</style><h1>Aurora Rest — ENV-NATURE-R02</h1><p><b>ART NO-GO</b> · One 153.54 m corridor, one design, one stone-pocket refinement. No merge or deployment.</p><p>Foreground grouping improved modestly. The overly realistic ground texture conflicts with the stylized vegetation, the floor remains exposed, and the landscape reveal does not work convincingly.</p><p><a href="ART_REVIEW.md">Complete review and measurements</a> · <a href="composition-plan.svg">Spatial plan</a> · <a href="manifest.json">Placement manifest</a> · <a href="evidence/review.json">Camera / renderer metadata</a> · <a href="evidence/walking/walk.json">Traversal and lifecycle checks</a></p><p>Actual untouched Three.js/WebGL readbacks, 1100×700. The first four pairs use identical 1.75 m cameras, lighting, terrain, seed, FOV and faithful MAT settings. Click an image for the raw PNG. The elevated overview is labelled separately.</p>${figures}<h2>Walking evidence</h2><p>${walk.steps.length} continuous engine positions, ${walk.distanceM?.toFixed(2)} m. These are sampled raw frames, not a real-time performance video.</p>${walk.frames.map(f=>`<figure><figcaption>${f.distance.toFixed(1)} m · engine step ${f.step}</figcaption><img loading="lazy" src="evidence/walking/${f.file}"></figure>`).join('')}</html>`);
console.log('Wrote ART_REVIEW.md and review.html');
