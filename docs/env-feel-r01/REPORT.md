# ENV-FEEL-R01 — Living Nordic Environment Systems
**Date:** 2026-10-24 · **Status:** ISOLATED TECHNICAL PILOT, NOT ART APPROVED
**Source basis:** `art/env-r02d-first-person-woodland-cohesion` @ `5a05c9e6a722d9b98d3300791f46637e5a437508`.
**Protected recovery ancestor:** `bced77ca3ca0539f7137cd9f066e6220518cf4a8`.
**Scope:** Source, browser-only experimental lab, no world merge / no deployment / no use of Godot assets.

## A: source and license audit
| Project | Source | License | Engine/API | Decision |
| --- | --- | --- | --- | --- |
| EZ-Tree | https://github.com/dgreenheck/ez-tree | MIT (Daniel Greenheck, 2024) | Three.js ≥0.167, `@dgreenheck/ez-tree` 1.1.0; `Tree.generateLODs()`, `createGeometry()` | Investigate offline 1-tree morphology/LOD export; do not add runtime dependency |
| SeedThree | https://github.com/SkyeShark/SeedThree | MIT (SkyeShark 2026) | Three.js ^0.184, app/WebGPU-first with WebGL2 fallback; v0.1.0-alpha | Inspect wind field, paper birch, LOD, impostor, grass designs; no direct vendor |
| Aurora Rest | https://github.com/Algolon/Aurora-Rest | Project source | Three.js ^0.186.1, Vite ^8.3.2, existing POP-02A and R02D candidate forest | Preserve source assets and rendering policy |
| Reddit demo | Original user-supplied post | Not verified | Godot modular environment addons | Inspiration only; no permission to reuse code |

SeedThree's generated textures include model-generated material and bird samples sourced from xeno-canto; use MIT source code concepts for research, but separately verify provenance/licenses of any specific shipped media before reuse. Neither third-party project is directly copied into this study.

## B: prototype scope and controls
Open `env-feel-r01.html` using `npx vite --host 127.0.0.1`.
The independent scene uses ~58 deterministic birch/pine proxies, instanced grass, ground with path, weather-linked fog and sun, streamed rain lines, and opt-in synthesized audio. It is *not* the protected canonical Birchwood map or an asset quality candidate.
- Mode: still / breeze / squall / clearing / 160 s auto sequence
- Time: seek and pause, weather deterministic for fixed time and mode
- Wind: world-space, spatially varying gust; shared direction drives grass shader, canopy matrices, rain slant and audio level
- Rain: a single line batch, camera-local and profile capped
- Rain aftermath: stored moisture affects ground color and roughness; fog and overcast affect sky and light
- Inspector `window.__ENV_FEEL_R01__`: setMode, seek, snapshot, setMobile, dispose
- Mobile button modifies resolution and particle count. Browser emulation is **not Android hardware proof**.

## C: evidence and acceptance gates
The isolated workflow `.github/workflows/env-feel-r01.yml` executes deterministic unit tests, typecheck, Vite build and real Chromium SwiftShader WebGL captures. Its report and screenshots are uploaded as a GitHub Actions artifact on successful capture.
No statement that the tests, build, real renderer, screenshots or mobile performance PASS is valid until the relevant hosted run is inspected.
A/B/A: still morning -> storm -> still with identical weather snapshot.
Visual review has not been signed off. Tree proxies are deliberately lower quality than proposed Nordic hero assets, and material/wind behavior needs fidelity tests on existing birch/pine/grass.
Draw calls/triangles are scene-specific and cannot be compared directly with ENV-R02D counts because this is an independent laboratory scene.

## Non-goals and risks
No new island terrain, procedural ecology populations, LOD thresholds, water system, night cycle, commits to external repos, or publishing.
Known risks: procedural crown sway is a simplified translation rather than branch deformation; particles are cheap line precipitation, not physically correct rain; noise-based ambient audio is a proxy, not production recordings.
Test with existing source nature assets on an R02D opt-in overlay **only after** separate code validation; never change the protected 558-file source or promote R02D's unapproved leaf-sprig proxies.
The existing ENV-R02D art review remains **ART REVISE** and **NOT APPROVED FOR PRODUCTION**.

## Follow-up decision
1. Confirm hosted CI and downloadable true-WebGL artifacts.
2. Art-direct wind speed, foliage phase offsets, squall readability, sound balance and rain wetness via first-person A/B comparisons.
3. If coherent weather movement passes, plan R02 with opt-in integration in actual Birchwood forest and physical Android 30 FPS test.
4. Separately trial EZ-Tree or SeedThree *offline* only when reference-based shapes improve over existing nature assets. Document asset origin and performance.
