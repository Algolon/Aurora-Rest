# WTR-01R — WebGL Runtime Repair and Visual Evidence Recovery

**Repository:** `Algolon/Aurora-Rest`  
**Branch:** `feature/wtr-01-water-lookdev`  
**Frozen pre-repair source:** `60f188a48541f20ef13e44d18e489117df1c8edf`  
**Full matched WebGL review:** https://github.com/Algolon/Aurora-Rest/actions/runs/39920572162  
**Artifact (36 real screenshots, PNG + index.html + manifest):** https://github.com/Algolon/Aurora-Rest/actions/runs/39920572162/artifacts/12486119437  
**Source tests & build (34/34):** https://github.com/Algolon/Aurora-Rest/actions/runs/39920572168

## Root causes and direct evidence

1. **Missing fog uniforms caused runtime JavaScript errors.** WTR-01 ShaderMaterial explicitly enabled Three.js fog and included `fog_pars_fragment`/`fog_fragment`, but did not declare the associated fog uniforms. The renderer attempted to upload `undefined.value`. **Fix:** merge `THREE.UniformsUtils.clone(THREE.UniformsLib.fog)` into the shader uniforms. Other artist-controlled uniforms remain unchanged.
2. **Incorrect depth convention hid water behind R1 terrain.** The viewer constructs its WebGLRenderer with `logarithmicDepthBuffer:true` and the canonical terrain Lambert shader honors that convention. The custom water shader initially emitted standard depth. Even after restoring fog uniforms, High Tarn's baseline rendered water while the High profile vanished at identical camera/geometry; the GPU water visibility test returned 0 changed pixels. **Fix:** add Three.js `logdepthbuf_pars_vertex`, `logdepthbuf_vertex`, `logdepthbuf_pars_fragment`, and `logdepthbuf_fragment`. The first run showed `isPerspectiveMatrix` was missing: this ShaderMaterial needs `<common>` explicitly for the logarithmic-depth implementation. The corrected shader compiles and uses matched depth.
3. **Capture timeout from continually repainting a heavyweight 4 m diagnostic terrain scene during Playwright screenshots.** This was an independent issue after the shader uniform repair. **Fix:** add `freezeForCapture` so a fixed-time screenshot is rendered on demand rather than while an unbounded requestAnimationFrame loop continues. Default interactive review behavior is preserved. No screenshot timeout limit was extended.
4. **Potential initialization-order fault:** `setSun('B')` was invoked before `currentShader` was declared. Corrected ordering to avoid a temporal-dead-zone failure.
5. **False camera attribution investigated and undone.** An intermediate High Tarn camera experiment was tried while the depth defect remained. After the actual root cause was identified, the original WTR-01 dry-shore and panoramic camera coordinates/selection were fully restored. No approved art or geographical parameters changed.

## Changed files (versus WTR-01 pre-repair)

| Path | Purpose |
|---|---|
| `src/wtr-01/material.ts` | Three.js fog uniforms; fog/log-depth shader chunks; required standard helper definitions |
| `src/wtr-01/main.ts` | Shader compiler log callback, initialization ordering, offscreen GPU water visibility proof, capture-only pause/freeze, existing camera restoration |
| `tools/wtr-01/capture.mjs` | Capture failures retain console/page errors and shader logs; fixed-time screenshots; real water pixel comparison; HTML gallery and diagnostic artifacts |
| `tests/wtr-01.test.ts` | All quality profiles assert required fog uniforms and log-depth shader dependencies |
| `.github/workflows/wtr-01-review.yml` | Full 6-camera × 4-profile real Chromium capture and artifact upload (no deployment) |
| `docs/wtr-01/RUNTIME_REPAIR.md` | This verification report |

No modifications to `src/geo-r02b`, `public/geo-r02b`, approved geography, MAT-01, POP-01 or any source water-art parameters. No third-party dependencies added.

## Validation result

**TECHNICAL PASS — WebGL runtime and screenshot evidence (review milestone).**  
**ART REVIEW PENDING — owner approval explicitly not granted.**

- Source validation: **34/34 tests passed**, TypeScript/Vite build passed. The protected R1 SHA256 tests and unchanged water positions/boundaries still run.
- Browser: **36 genuine unretouched Chromium/Three.js WebGL frames**, viewport 1600×900, actual ANGLE/Vulkan **SwiftShader software renderer**, deterministic `t=0,1.5,3` seconds.
- Camera matrix: Home Cove (shore/elevated), Windward Coast (shore/elevated), High Tarn (shore/panorama); `baseline/low/medium/high` at each. High profile also captured at `t=1.5`/`3` from the three shore-level views and at `t=0` with Sun A for every camera.
- Browser errors: **0**. GLSL compile errors: **0**. Screenshot timeouts: **0**.
- GPU read-back verification renders the same canonical scene twice, once without water and once with water, and counts actually changed pixels using a fixed 256×144 GPU framebuffer. Matched Low/Medium/High screenshots alone are **not** used as proof of water visibility. Result: Home Cove baseline 1021 / High 1029; Windward Coast High 9941; High Tarn baseline **13801** / High **13801**; High Tarn panoramic High 27977 (each out of 36864 pixels).
- Shader rendering quality profiles share three GPU programs overall for tested frames (terrain, baseline, custom as instantiated); reported per-frame total draw calls/triangles vary with native frustum culling, not profile.

| Camera | Observed total draw calls | Observed triangles |
|---|---:|---:|
| Home Cove shore | 36 | 791,857 |
| Home Cove elevated | 15 | 371,857 |
| Windward Coast shore | 24 | 551,857 |
| Windward Coast elevated | 24 | 551,857 |
| High Tarn shore | 131 | 2,691,857 |
| High Tarn panorama | 126 | 2,591,857 |

These are **software WebGL browser diagnostics**, not hardware frame-rate results. GPU `ReadPixels` stall warnings appeared in SwiftShader; they are expected read-back synchronization warnings during the explicit pixel-validation test, not runtime shader errors. No Android FPS claim or mobile performance acceptance is made.

## Genuine evidence access

The GitHub Actions artifact includes:
- `index.html`: a locally browsable grid/gallery linking the unretouched renderer PNGs
- `manifest.json`: per-image SHA256, camera/quality/time/sun, draw calls, triangles, WebGL renderer, program count, protected terrain hash and actual water-coverage checks
- 36 PNG captures; no illustration or substitute concept art

Download/extract the Actions artifact, then open `index.html` locally. The HTML is local-only; no deployment/Pages publishing occurred.

## Remaining visual defects — not shader failures

- Medium/High distant-water ripples exhibit **regular aliasing/banding and obvious repetitive wave interference** from elevated views. This is a visual-art quality concern to calibrate later, not a request to tune the working shader in WTR-01R.
- Shoreline geometry contains visible jagged clipped triangle patterns in some Windward and Home Cove views, including baseline renderings. Do not attribute pre-existing shoreline geometry to this shader repair or alter R1 hydrology.
- Overall landscape is still untextured neutral GEO calibration terrain, so full Nordic water/terrain material integration and realistic reflection response remain unevaluated.
- The Home Cove shore-level camera exposes a small horizon-level water strip; elevated view better reveals the cove. High Tarn shore view and panorama are genuinely populated with actual lake water and remain unchanged.

## Handoff

Keep WTR-01R isolated. Next gate is **owner artistic review** of the matched captures; any art calibration belongs in a separately authorized iteration. MAT-01 coordination, ocean/lake quality and coastal visuals remain separate from this runtime repair. No merge, deployment, WTR-02 river system or geography change.
