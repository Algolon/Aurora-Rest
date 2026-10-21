# ASSET-01C2 — Multi-Species Vegetation Batching & Mixed Forest Validation

**Result: CONDITIONAL** — source fidelity, dual material-aware batching, both backend paths, alpha-aware shadows, LOD, visibility, and disposal were verified in a real Chromium/WebGL browser. Physical desktop/Android GPU/FPS/VRAM were not tested.

## Safe source checkpoint, CI, provenance

- Writable repository **only**: `Algolon/Aurora-Rest`.
- ASSET-01C2 branch: `feature/asset-01c2-mixed-forest-batching`.
- **Successfully tested implementation commit:** `bd95a995a0e531dd92c6e361c081507bab1b170b`.
- Explicit owner-authorized **one-time exception to default-branch ancestry**: branch directly from `feature/asset-01c1-scots-pine-fidelity@06a7edadb0a7df798a483f9c3bd8bf0311da67e3`. Before branching its exact SHA and successful CI `39582165051` were verified; no C2 branch existed. General AGENTS.md and project instructions not modified.
- Preceding B2 commit `87b4a2e00f0b29a89ec8aa1c5cdcf3bf7d170f6b` CI `39564035427` had succeeded.
- Read-only original Feh Lu We pinned at `17eafb0902833fb1121c77083f9f862eb4ffcd96`. No runtime dependency, no source writes.
- **10/10 GitHub Actions jobs passed**: https://github.com/Algolon/Aurora-Rest/actions/runs/39596422574 .
- **Browser visual evidence, 26 genuine PNG images and metrics JSON**: https://github.com/Algolon/Aurora-Rest/actions/runs/39596422574/artifacts/12343729332 .
- Eight separate data/artifact archives, one for each `{instanced,multidraw} × {birch,pine,balanced,pine70}`, under the same GitHub Actions run.
- No local checkout or native hardware session was available, and no local testing is claimed.

## Architecture and changed files

**Source-preserved:** birch `src/{geometry,foliage,materials,lod,index,rng}.ts` and pine `src/pine/{geometry,materials,index}.ts` remain unchanged. Nine unique source geometries per species, three structural variants, deterministic hashes, 22/36/62 m LOD thresholds, 3 m hysteresis and far/xfar geometry reuse are preserved. Existing single-species showrooms/CI scripts are retained.

**Modified:** `src/rendering/natureBatch.ts`, `src/rendering/batchedRenderer.ts`, `src/rendering/instancedRenderer.ts`. The B2 controller now accepts a **species-aware reference foliage tint and family**. Each backend is species-neutral; the B2 class names remain aliases. An empty BatchedMesh is no longer rendered. Node-compatible class fields make the real batch API testable directly under Node 22's strip-types runner. Original `createBirchBatch` remains a compatibility adapter and the earlier B2 benchmark builds.

**Added:** `src/rendering/mixedForest.ts` composes exactly two copies of that same generic controller, one with birch's material and one with pine's. It exposes `createNatureBatch({scene,renderer,families:{birch,pine},mode,...})` with global stable instance IDs, add, setTransform, setTint, setVisible, setVariant, getSpecies, forcedLOD, culling and shadow controls, camera update, per-species/aggregate getStats and disposal. Species is **immutable after add**, avoiding unsafe automatic GPU-handle migration. The mixed forest **does not own source family geometry/materials**; dispose it first, then dispose the two families.

**Added:** `mixed.html`, `mixed/showroom.ts`, `tests/mixed.test.ts`, `scripts/capture-mixed.mjs`, `.github/workflows/asset-01c2-mixed-forest.yml`; modified only lab `package.json` and `.gitignore`.

Multi-draw is used *only* if the actual renderer advertises `WEBGL_multi_draw`; it submits at most one `BatchedMesh` per present species. Otherwise the explicit `InstancedMesh` fallback uses up to nine indexed source geometry groups per species. Forcing unsupported multi-draw throws, rather than silently issuing per-tree calls. The same LOD and conservative shadow-swept visibility code drives both.

## Species material, tint and alpha-shadow fidelity

Original leaf tints: **birch `#97a94c`**, **pine `#4e6c48`**. The per-instance multiplier is computed in *linear RGB* as `desired tint / own species' reference tint`, therefore identity is (1,1,1). Species have separate canonical color materials while borrowing the same atlas and vegetationDepth through the pre-existing reference-counted cache; the geometry's original bark/foliage vertex colors and precompensation are unchanged. Neither source tint is multiplied twice, and neither species is recolored by another.

The existing ASSET-01B1R alpha-aware depth material is assigned to both InstancedMesh and BatchedMesh for **both** species. No ShaderChunk mutations, shader duplication, replacement texture or shadow-filter redesign. The production foliage discard threshold is **0.4**.

**Strict real pixel regression (960×600, identical camera/light/mesh/near LOD):** birch reference → forced instanced **0 changed pixels**; birch reference → multi-draw **0**; pine reference → forced instanced **0**; pine reference → multi-draw **0** (RGB delta >12, 576,000 pixels per image). Controlled alpha-aware vs *intentionally broken* opaque-depth negative control changes **7,532 pixels for birch** and **7,777 for pine**, the same for both backend paths (RGB delta >10). Thus the foliage cards really have transparent shadow cutouts and the bark remains a caster.

Same-scene balanced mixed forest instanced vs multi-draw differs by **0 / 2 / 7 pixels** at populations 100 / 500 / 1,000 respectively, out of 576,000 pixels (RGB threshold 12). These differences are minor shader/raster/shadow-edge noise, not a palette/silhouette regression.

## Real browser performance and capabilities

**Chromium 155**, WebGL **2.0 (OpenGL ES 3.0 Chromium)**, renderer string `WebKit WebGL`, Chromium's **SwiftShader/software backend**. The actual `WEBGL_multi_draw` extension **was available and exercised**, and the fallback was explicitly forced in a browser that also supports it.

Deterministic placement seed **820241**; populations 100, 500 and 1,000; pure birch, pure Scots pine, 50/50 mixed, and 70%-pine/30%-birch; camera and lighting identical between backends. 960×600, DPR1, 768² directional shadow map. Render calls below are real `renderer.info.render.calls`; camera-pass drawcalls were remeasured with shadows off and subtracted to obtain shadow-pass calls. Ground plane is included.

| Composition | Mode | 100 trees (camera+shadow=total) | 500 | 1,000 | Active tree groups |
|---|---|---|---|---|---:|
| Birch only | Instanced | 4+3=**7** | 4+3=**7** | 4+3=**7** | 3 |
| Birch only | Multi-draw | 2+1=**3** | 2+1=**3** | 2+1=**3** | 1 |
| Pine only | Instanced | 4+3=**7** | 4+3=**7** | 4+3=**7** | 3 |
| Pine only | Multi-draw | 2+1=**3** | 2+1=**3** | 2+1=**3** | 1 |
| 50/50 mixed | Instanced | 7+6=**13** | 7+6=**13** | 7+6=**13** | 6 |
| 50/50 mixed | Multi-draw | 3+2=**5** | 3+2=**5** | 3+2=**5** | 2 |
| 70% pine | Instanced | 7+6=**13** | 7+6=**13** | 7+6=**13** | 6 |
| 70% pine | Multi-draw | 3+2=**5** | 3+2=**5** | 3+2=**5** | 2 |

**Every one of these 24 scenarios ran successfully.** Exactly 50/50 = 50/50, 250/250, 500/500; 70%-pine = 70/30, 350/150, 700/300. Draw submissions remain bounded by active material and geometry groups, not population.

### Balanced mixed forest: actual visibility / LOD / buffer / frame measurements

| Trees | Backend | Camera-visible / shadow-only | Visible geometry triangles | Groups | Buffer updates / reallocations | Actual rAF median / p95, ms |
|---:|---|---|---:|---:|---|---|
| 100 | Instanced | 100 / 0 | 54,478 | 6 | 12 / 6 | 316.6 / 633.3 |
| 500 | Instanced | 497 / 3 | 271,604 | 6 | 12 / 6 | 1,183.3 / 3,000.0 |
| 1,000 | Instanced | 992 / 8 | 545,482 | 6 | 12 / 6 | 2,350.0 / 4,683.1 |
| 100 | Multi-draw | 100 / 0 | 54,478 | 2 | 300 / 0 | 150.0 / 299.9 |
| 500 | Multi-draw | 497 / 3 | 271,604 | 2 | 1,500 / 0 | 766.6 / 1,100.0 |
| 1,000 | Multi-draw | 992 / 8 | 545,482 | 2 | 3,000 / 0 | 1,366.6 / 1,383.3 |

Balanced overview has far/xfar counts 2/98, 10/490, 21/979 respectively; near and mid are absent because this overview camera starts relatively far away. Dedicated approach, grove, forest-edge and LOD-moving camera evidence exercise closer trees. Source LOD popping has not been redesigned.

Actual `requestAnimationFrame` interval sampling uses seven intervals per scenario, separated from five camera-motion `performance.now()` CPU visibility update samples. **These are real software-browser frame intervals but NOT GPU timer queries, hardware FPS or portable performance targets.** The SwiftShader runner slows dramatically near 1,000 trees; physical desktop/Android FPS and VRAM are unknown. The per-scenario raw JSON captures all other composition frame medians/p95, draw totals, visible geometry, LOD counts and CPU update samples. Do not interpret browser CPU submission timing as GPU timing.

## Visibility, lifecycle and genuine image evidence

LOD and camera-frustum checks cover the two species independently, preserving 3m hysteresis and original source geometry. Camera rotation without translation changes visibility and the conservative sun-aligned sweep retains offscreen shadow casters (balanced overview: 0, 3 and 8 retained at 100/500/1,000). The world-agnostic visibility approximation intentionally does not replace terrain receiver-aware shadow/frustum culling.

The browser lifecycle test constructs/updates/disposes **five full mixed batches** and verifies no scene-child growth; checks that material colours do not cross-contaminate; adds extra family owners; releases the last pine family while birch still retains atlas and depth; finally releases birch and verifies **exactly one dispose each** for shared atlas and depth. It then creates fresh birch/pine families, a new mixed batch and performs a successful WebGL render. Shared assets are never freed on forest batch disposal.

Actual artifact screenshot names: `{birch,pine}-source-reference.png`, `{birch,pine}-{instanced,multidraw}-single.png`, `{birch,pine}-{instanced,multidraw}-shadow-{alpha,opaque-negative}.png`, `balanced-{100,500,1000}-{instanced,multidraw}-overview.png`, `pine70-500-{approach,grove,edge,rotation,lodwalk}.png`, `balanced-100-rotation-negative130.png`. `metrics.json` documents exact browser metadata, pixel comparisons, LOD/visibility diagnostics, shadow evidence and lifecycle observations. Additional 500-tree PNG and all 100/500/1,000 metrics exist for each benchmark matrix job.

## Verification and acceptance

- **17/17 Node tests**, including pre-existing B1/B1R/B2/C1 regressions and new species APIs, all pass.
- `tsc --noEmit` and Vite production build pass.
- Independent pin-exact original Feh Lu We **birch** geometry parity passes, and independent **pine** split/combined original raw geometry parity passes.
- Genuine WebGL shader compilation, reference images, mix screenshots and benchmark matrices pass without unexpected page/console errors.
- ASSET-01B2 `createBirchBatch` compatibility preserved; prior source geometries, species materials and original tests are not modified.

| Acceptance gate | Result |
|---|---|
| BIRCH FIDELITY | **ACCEPT** |
| PINE FIDELITY | **ACCEPT** |
| MULTI-SPECIES ARCHITECTURE | **ACCEPT** |
| MATERIAL & SHADOW CORRECTNESS | **ACCEPT** |
| MULTI-DRAW | **ACCEPT in tested WebGL environment** |
| INSTANCED FALLBACK | **ACCEPT in forced fallback; absence-of-extension behavior unit-tested** |
| LOD & VISIBILITY | **ACCEPT within isolated lab** |
| PERFORMANCE EVIDENCE | **CONDITIONAL — not hardware validated** |
| RESOURCE LIFECYCLE | **ACCEPT** |
| TECHNICAL VALIDATION | **ACCEPT** |

**OVERALL CONDITIONAL.** Bounded drawcall scaling, visual fidelity and lifecycle are verified. Real desktop GPU, Android without extension, VRAM and practical game FPS remain future hardware gates; projected shadow-map edge quality remains a separate future SHADOW-R01 concern.

**STOP:** No merge, deployment, island integration, Feh Lu We modifications, additional tree species, WORLD-01B/GEO-R02A modifications or ASSET-01D. Mixed-species forest is reviewable only on `feature/asset-01c2-mixed-forest-batching`. Await explicit approval before later world integration.
