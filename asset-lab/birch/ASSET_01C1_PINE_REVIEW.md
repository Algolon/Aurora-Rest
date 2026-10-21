# ASSET-01C1 — Faithful Scots Pine Migration: technical and visual review

**Overall recommendation: CONDITIONAL — source geometry and isolated runtime technically ACCEPT; full matched-source shader pixel parity remains unverified.**

Project: Aurora Rest  
Repo: `Algolon/Aurora-Rest`  
Branch: `feature/asset-01c1-scots-pine-fidelity`  
**Verified implementation checkpoint:** `41037700dfa9c95dda3d338ceafa7b097c8aefe1`  
Parent: approved ASSET-01B2 `feature/asset-01b2-birch-batching-lab@87b4a2e00f0b29a89ec8aa1c5cdcf3bf7d170f6b`  
Read-only original: `Algolon/Feh-Lu-We@17eafb0902833fb1121c77083f9f862eb4ffcd96`  
**Successful actual CI on implementation:** https://github.com/Algolon/Aurora-Rest/actions/runs/39581404947  
**Genuine 29-file browser artifact** (28 PNGs and metrics JSON): https://github.com/Algolon/Aurora-Rest/actions/runs/39581404947/artifacts/12337035785

## Safety and authorized ancestry

Before branching, the approved ASSET-01B2 head `87b4a2e00f0b29a89ec8aa1c5cdcf3bf7d170f6b`, its successful CI, existing PRs and all remote branches were checked; no ASSET-01C1 branch existed. The owner specifically authorized the one-time exception to the default-branch rule: this branch descends from the pinned asset B2 checkpoint. `AGENTS.md` was not altered. GitHub connector API was used instead of a local checkout; local `git remote -v`, local browser and local worktree inspection are *not* claimed. All source reads of Feh Lu We were read-only.

**Preservation proof:** Git tree blob-SHA comparison against the approved B2 head shows the original `src/geometry.ts`, `src/foliage.ts`, `src/materials.ts`, `src/lod.ts`, `src/index.ts`, `src/rendering/{natureBatch,batchedRenderer,instancedRenderer}.ts`, existing birch tests and original benchmark infrastructure are **byte-identical**. Aurora main, WORLD-01/01B, GEO-R02A and all other repositories untouched. No PR/merge, deployment, release, island integration, another species or ASSET-01C2.

## Verified original production route and sculpt decisions

Original pinned `src/world/woodkit.ts` at lines 478–481 dispatches:

```ts
referenceTreeModel('pine', variant, lod, 'outline', 'trees-r03')
// -> pineModel(lod, variant, 'outline', true, true)
```

This is specifically *Scots pine*, not a spruce or conical placeholder: original `pineModel()` implementation at source woodkit.ts lines 625–696 generates leaning/curved tall trunks, root flare, lower fissured bark, warm upper pigmentation, sparse missing branches, asymmetrical whorls, irregular two/three spray groups, sparse near dead branch stubs and flatter upper crowns. Original `foliageSprays` builds the pine needle tile (tile index 3), keeping source UV markers 134–135. Pine's three original spray palettes and original colours `LEAF_TINT.pine='#4e6c48'`, `BARK_TINT.pine='#a3896f'` are preserved.

### Files and implementation

**Added** `src/pine/geometry.ts`: extracts the production reference branch of the original `pineModel` and `smoothWoodNormals`; reuses existing original `taperTube`, `foliageSprays` and `mulberry32`. A small source-identical subset of leaf/wood geometry helpers is kept locally to avoid touching the accepted birch generator. No nonproduction/experimental pine branch was imported. The `combinePineModel` operation follows source `boslustSample.ts` `mergeModel`: pre-multiply wood vertex colours by linear bark-tint/leaf-tint ratio, then merge source parts.

**Added** `src/pine/materials.ts`: creates a **separate pine-coloured Lambert material** with the *existing* Feh Lu We-derived atlas/map, material-scoped `onBeforeCompile` shader and program cache key, reusing the canonical original pine bark map and pine needle spray atlas. Borrowed atlas/depth materials remain reference counted through the existing `acquireBirchMaterials/releaseBirchMaterials`; the pine-specific colour material has its own family-owner counter. No pine tint can mutate birch material colour.

**Added** `src/pine/index.ts`: independent `createPineFamily()`, caches 3 variants × near/mid/far = nine distinct source geometries. Logical xfar directly shares far. Attaches the already-corrected alpha-aware source `vegetationDepth` to each regular `THREE.Mesh` in all variants/LODs. Exposes `getGeometry`, `createMesh`, `dispose`; no mixed-species batching in this milestone.

**Added** `pine.html`, `pine/showroom.ts`: standalone real Three.js visual inspector with all/individual pine variants, near/mid/far/xfar, front/side/threequarter, separate bark/needle close-ups, orbit/distance sliders, neutral/daylight controls and switchable shadows. Camera aim was corrected specifically for full-height 12–14 m pine trees; existing birch showroom is unaffected.

**Added** `tests/pine.test.ts`, `scripts/compare-pine-source.mjs`, `scripts/capture-pine.mjs`, `.github/workflows/asset-01c1-scots-pine.yml`. **Changed only lab plumbing:** `asset-lab/birch/package.json` (two pine scripts) and `.gitignore` (generated evidence).

### Source parity — independently verified

GitHub Actions read-only sparse-cloned the *original Feh Lu We runtime at the exact pinned commit* into the runner and imported its real `referenceTreeModel` through Vite SSR. For each of **3 variants × 3 unique LODs**, original and Aurora **split wood, split foliage and combined indexed geometry** match byte-for-byte raw attribute SHA hashes:
`position`, `normal`, `uv`, `color` and `index`, as well as bounding sphere centre/radius (1e-7 tolerance). Original combined geometry was built independently using the real source merge logic, not Aurora's own pine merge as the comparison reference. The original birch source runtime parity also passes unchanged.

| Variant | Height max (m) | near triangles | mid triangles | far/xfar triangles |
|---|---:|---:|---:|---:|
| 0 | 13.121 | 2,312 | 904 | 654 |
| 1 | 12.092 | 2,344 | 928 | 678 |
| 2 | 14.359 | 2,104 | 820 | 594 |

Original production LOD profile `[22,36,62]` metres with 3 m hysteresis is **reused without modification**. Far/xfar identity was checked in real Chromium for all variants.

### Browser, materials, shadows and resource lifecycle

**Actual GitHub Actions execution:** 13/13 Node tests pass (all existing birch/batching/shadow atlas tests plus pine tests), TypeScript no-emit and Vite production build pass, pinned source-runtime original birch and pine independent parity pass, browser screenshot script passes without unexpected console/page errors.

Browser: Chromium headless on GitHub Actions runner, WebGL **2.0 (OpenGL ES 3.0 Chromium)**, renderer reported `WebKit WebGL`; WebGL software rendering/SwiftShader. **Do not interpret this as physical desktop or Android GPU acceptance.**

Genuine pixel screenshots (28 captures) establish visually the source's asymmetrical whorls, slender sculpted stems, needle spray shape, warm upper trunks, lower bark sculpt and absence of cone/Christmas-tree silhouettes. Source pine palette `#4e6c48` and birch `#97a94c` remain separate in browser; both species' materials share the atlas map but not their colour-material object. No double-applied pine tint.

For the pine alpha-depth negative-control scene, the *same* tree/shadow/ground/camera was rendered using the existing custom alpha-aware `vegetationDepth` and deliberately with default opaque depth. **47,546 pixels changed at RGB threshold >10** in the final corrected-camera run. The pine tree's dark opaque trunk remains a shadow caster; the needle spray masks create the expected fine cut-out shadow pattern. The original alpha-discard threshold **0.4** and source UV atlas convention are unchanged; no extra shadow shader or new texture introduced.

Lifecycle in real browser:
- Multiple pine family owners return the same pine material and same original depth; while other owners exist, shared atlas and depth survive.
- Birch and pine simultaneously share the atlas, but maintain separate species colour materials.
- After the final pine owner disposes, **atlas, shared depth and pine colour material each emit exactly one disposal**, and a newly created pine family allocates new colour/atlas/depth objects and renders successfully in WebGL.
- Existing birch/batching source files, shader and geometry remain byte-identical.

**No full mixed-family forest render was performed.** This tests coexistence of family resources, not ASSET-01C2 batching performance.

### Evidence files

GitHub Actions artifact (link above) includes:
- `pine-all-three-daylight.png`, `pine-all-three-neutral.png`: all three actual species silhouettes.
- `pine-{0,1,2}-near-{front,side,threequarter}.png`: full-height variants, corrected frame.
- `pine-{0,1,2}-bark-close.png`, `pine-{0,1,2}-needle-close.png`: lower bark sculpt and production foliage atlas.
- `pine-{0,1,2}-{mid,far,xfar}-threequarter.png`: LOD visual evidence.
- `pine-shadow-alpha-aware.png`, `pine-shadow-default-opaque-negative-control.png`: identical camera/lights, positive/negative depth evidence.
- `pine-render-metrics.json`: real browser backend, source colour hex values, triangle counts, resource and alpha-cutout test results.

### Technical/art qualifications

- **Geometric fidelity proven**; independent matched-source *pixel-level shader fidelity* with a separate live Feh Lu We rendering under identical camera and lighting was not executed. The shared shader originated from Feh Lu We but Aurora uses the existing material-scoped ShaderChunk adaptation from ASSET‑01B1; visually source-faithful behaviour is supported but not an exact pixel-match claim.
- Original pine sculpted UV-marker 20 and pine-specific atlas texture sampling are preserved. Bark may read relatively flat under some lights; do not recolour or remodel in this milestone. Art-owner review of genuine renders is recommended before promotion.
- Source near/mid/far crown-density and branch-geometry changes can create visible LOD popping; ASSET-01C1 deliberately preserves originals.
- Shadow-map resolution, smoothing and cast/receive aliasing are showroom/renderer limitations, separate from proven alpha-depth correctness.
- Physical Android, physical desktop frame-time/FPS and mixed forest batching are not measured or accepted by this milestone.

### Separate acceptance gates

| Gate | Decision | Evidence |
|---|---|---|
| SOURCE FIDELITY | **ACCEPT** | Independent original runtime split + combined raw hashes |
| ART FIDELITY | **CONDITIONAL** | Real visual review preserves sculpt and palette; matched-source shader pixels unavailable |
| LOD CORRECTNESS | **ACCEPT** | Original thresholds/hysteresis, nine geometries, far/xfar sharing |
| SHADOW FIDELITY | **ACCEPT** | Custom depth and negative-control pixel difference in real WebGL |
| ARCHITECTURAL REUSE | **ACCEPT** | Atlas/shader/refcount reused, species-local color material; no second batching engine |
| BIRCH NON-REGRESSION | **ACCEPT** | All protected files byte-identical and birch runtime parity/tests pass |
| TECHNICAL VALIDATION | **ACCEPT** | 13 tests, tsc/Vite, original parity, Chromium/WebGL capture, lifecycle |

**OVERALL: CONDITIONAL** only for independently matched source-vs-Aurora shader screenshot comparison / owner final art approval. No geometry, material isolation or alpha shadow blocker was observed.

## Recommended next phase (not authorized or implemented)

If the user approves ASSET‑01C1, define ASSET‑01C2 to adapt `createBirchBatch` into a species-aware shared small rendering contract, preserving separate colour uniforms and the already-corrected shared alpha-aware depth; compare single-species and mixed fallback/multi-draw at 100/500/1000 and enforce lifecycle ownership. **Do not begin ASSET‑01C2 or integrate anything into the island based on this report alone.**

**STOP CONDITION:** Pine migration, isolated lab rendering, original parity, QA and checkpoint complete. No merge or deploy.
