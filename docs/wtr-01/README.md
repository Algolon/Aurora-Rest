# WTR-01 — Stylized Water System Foundation (review candidate)

**Project:** Aurora Rest · **branch:** `feature/wtr-01-water-lookdev`  
**Parent:** `feature/geo-r02c-p0-calibration-infra@90d0cb745e8e51a3dc737bd4dc11d6f8c322758b`  
**Scope:** Ocean + lakes/tarns; no watercourses, wetlands, foam, physics, or canonical geometry edits.

## 1. Architecture decision record — ADR-WTR-01

**Decision: B, a small custom shader with a single shared regional configuration (a light hybrid in spirit).**

| Candidate | Benefits | Weaknesses | WTR-01 decision |
|---|---|---|---|
| A. Standard/Physical | Three.js-managed lights, fog, disposal, PBR; easiest to maintain | Controlled Nordic water look and multi-scale animated surface normals need texture plumbing, env maps or `onBeforeCompile`; without an environment reflection source, PhysicalMaterial does not solve water | Retained as static baseline, not selected |
| B. Lightweight custom shader | Explicit artistic control of Fresnel-like angular tint, coherent palette, multi-frequency normal-only animation; no textures/FBOs or external libraries | Must explicitly manage color space, fog, lighting, time and WebGL compilation; no genuine reflection | **Selected** for contained WTR-01 lookdev |
| C. Hybrid features | Extensible material foundation with optional local effects | Additional complexity and permutations before visual evidence or reliable shore-distance exists | Deferred: config/interfacing from C retained |

**Rationale.** There is no verified environment cubemap, screen-space depth texture, detailed bathymetry or shoreline distance field in the pinned R1 water payload. Pretending otherwise would yield unsupported reflection and shallow-water behavior. The chosen shader operates on the actual R1 triangle positions and applies two/three restrained, analytic wind-ripple frequencies to lighting normals only. It provides a stable baseline for visual comparison before committing to expensive reflections or textures.

**Limitations:** Fresnel-like sky tint is **not** scene/environment reflection; local low-frequency tonal variation is **not** water depth; the Home Cove color/motion mask is an **approximate art-directable zone around the R1 Home Cove view**, not a geographic shore-distance raster. There is no wave-height displacement, actual foam, refraction, physically measured water velocities or underwater effects. Rendering is opaque to sidestep sorting and unknown bathymetry; real underwater transparency/refraction is outside WTR-01.

## 2. Canonical geometry contract

- `public/geo-r02b/terrain.f32` — 1501 × 2001 cells, 4 m, **read-only**.
- `public/geo-r02b/features.json` — authored lake names, levels and polygon boundaries; **read-only**.
- `public/geo-r02b/water-mesh.f32` — 335,565 vertices / **111,855 unindexed triangles**, 4,026,780 bytes; positions from the canonical R1 terrain/water-surface triangle clip; **read-only**.
- `public/geo-r02b/water-surface.f32` — 1501 × 2001 water raster, 12,014,004 bytes; **read-only**.
- Ocean is an existing-convention plane, y = 0 m, 40 km wide. Inland triangles retain the R1 **+0.025 m** render offset already baked into the source.
- A `waterKind` Float32 vertex attribute labels each complete R1 triangle as lower lake (1), High Tarn (2) or channel placeholder (3); ocean plane is kind 0. Classification uses *triangle centroid inside authored lake ring and water elevation within 12 cm of the canonical level*. No positions, heights, indices, connectivity, coastlines or polygon boundaries are modified. Near lake-mouth classification can differ across adjacent triangles; this is a **render coloration** risk, not a hydrological fix.
- The R1 captured water source has known pre-existing caveats: an approximately 2.7 cm river-surface rise at the main-upper confluence; windward gully mouth bank anomaly; several lake rim projection-seam errors documented by GEO-R02C-P0. None were modified or concealed.

**Important architectural boundary:** the older `src/render/water.ts` is WORLD-01B's separate placeholder (including circular lakes); WTR-01 intentionally uses `src/geo-r02b/terrain.ts` and actual R1 inputs instead. WTR-01 does not replace production rendering or modify either source.

## 3. Implementation map

| File | Function |
|---|---|
| `src/wtr-01/config.ts` | Typed style profiles, future metadata interface, source-only triangle classification |
| `src/wtr-01/material.ts` | Shared custom GLSL (low/medium/high), no textures; tone mapping, output color space and scene fog chunks |
| `src/wtr-01/main.ts` | Standalone GEO-R02B terrain + R1 wet mesh + ocean; six review cameras; resource cleanup |
| `src/wtr-01/style.css` / `wtr-01.html` | Visual controls and separate entrypoint |
| `tests/wtr-01.test.ts` | Canonical hashes, lake altitude, triangle preservation, profile validation |
| `tools/wtr-01/capture.mjs` | Matched genuine Playwright/WebGL screenshot and deterministic-time evidence harness |
| `vite.config.ts` | Adds **only** an isolated additional build entry; no production deployment |

Profiles: Low compiles without ripple normals/specular; Medium uses two analytic wind ripples; High uses three. No texture samplers, reflection framebuffer or dependent water camera. One shader program is shared across ocean and inland meshes at a given quality, one non-indexed canonical wet mesh draw, one ocean-plane draw. The 300 canonical 4 m terrain tiles and their existing millions of terrain triangles remain the dominant review-scene expense.

## 4. Review procedure and acceptance gate

```bash
npm ci
npm test
npm run build
npm run preview -- --port 4173
# open http://127.0.0.1:4173/wtr-01.html
# another shell:
node tools/wtr-01/capture.mjs
# optional second daylight:
node tools/wtr-01/capture.mjs --two-suns
```

The six actual geography-backed review views are: Home Cove shore, Home Cove elevated, Windward Coast shore, Windward Coast elevated, High Tarn near water, High Tarn panorama. High Tarn uses the actual named lake **360 m** in canonical features, never a circular test shape. Shore cameras are placed on measured dry terrain close to existing R1 anchors; elevated versions are camera offsets only. Baseline/Low/Medium/High captures share cameras and fixed t=0, with additional High captures at t=1.5 and 3.0 seconds for three shoreline/tarn views. The UI also supports play/pause, normal-only animation, lake/ocean focus, wireframe, daylight A/B and renderer counters.

### Evidence classification

| Gate | Required evidence | Current state |
|---|---|---|
| Source geometry | P0 SHA-256 guards, unchanged canonical assets | Implemented; see CI |
| TypeScript + build | GitHub Actions source-validation run on final branch HEAD | Verify actual CI result; do not infer success from code |
| Shader compile | Real WebGL Chromium runtime without page/console errors | **PENDING** until actual browser capture |
| Coastline, lake visual quality | matched screenshots + animation comparison | **ART REVIEW PENDING** |
| Android, 60/30 FPS | Device profiling with actual GPU + screenshots | **PENDING** |
| Comparison to baseline | matched baseline/Low/Medium/High | Harness provided; captures still required |

Tests/builds alone are not an art pass. Automated browser captures show shader execution but do not settle artistic quality. Runtime counters are browser-local diagnostics, not reproducible device performance ratings.

## 5. MAT-01 shoreline integration contract

The water shader currently **consumes** `waterType` (classification) and indirectly lake `waterLevelM`. It neither generates nor modifies MAT-01 terrain materials. A future read-only `ShoreContext` may expose:

```ts
interface ShoreContext {
  kind: 'ocean' | 'lake' | 'river' | 'wetland';
  waterLevelM: number;
  signedShoreDistanceM?: number; // not implemented, must be validated
  wetness01?: number;             // MAT-01 derives after agreeing physical meaning
  localFlowDirectionXZ?: [number,number]; // not implemented
  localFlowSpeedMps?: number;     // not implemented
}
```

Do not compute shore proximity from arbitrary color gradients, pretend that high terrain means deep water, or author a second competing biome/wetness classifier. MAT-01 should own material application; WTR can consume proven geometry-derived shoreline diagnostics when available. Agree on geographic coordinate conventions: x=east, z=north, y=meters, sea level zero, Three.js parent scene mirrors x in these viewers.

## 6. Performance observations / risks

**Static complexity (source-derived, not measured FPS):** 111,855 inland water triangles, 2 ocean triangles; 1 water shader program plus terrain baseline shaders, no screen-space pass, 0 water textures and 0 water render targets. `waterKind` adds about 1.34 MB CPU/GPU attribute data. The 12 MB water-level raster is loaded for camera and dry-ground diagnostics only; production can avoid keeping it if the camera system supplies the needed sampled water heights. Switching qualities disposes the previous ShaderMaterial. Disposal covers ocean/inland geometry, 300 terrain tile meshes, terrain material and renderer on window unload. The shader uses highp and the project's existing tone/color/fog conventions.

**Unmeasured:** true mobile precision/performance, shader compiler support across devices, browser draw counts/frame times, terrain streaming feasibility. Until real hardware testing, do not claim 60/30 FPS or mobile readiness. The full-resolution 300-tile R1 viewer is inherently a heavyweight diagnostic context, not a mobile production terrain streaming solution.

## 7. Explicit WTR-02 / WTR-03 backlog

**WTR-02 — channel/stream flow**  
Prioritize: (P0) verifiable along-channel direction field on actual R1 water triangles; (P0) confluence continuity and 2.7 cm legacy rise decision owned by GEO; (P1) signed along-stream UV/flow vectors and low-cost directional ripples; (P1) local turbulence from channel curvature/rocks only when physically grounded; (P2) rocky bed, rapids and waterfall candidates, with no global fluid simulation.

**WTR-03 — wetlands/coastal response**  
Prioritize: (P0) validated signed shoreline-distance data and MAT-01 ownership handshake; (P1) wet shoreline ground transition and material cooperation; (P1) shallow wetland pools/puddles on canonical basin geometry; (P2) localized restrained foam from *actual* shore/intersection geometry; (P2) selective environmental reflections if evidence justifies memory and GPU cost. Explicitly defer full SSR/refraction pending verified performance and art need.

## 8. Status recommendation

**TECHNICAL CONDITIONAL / ART REVIEW PENDING**, unless final CI or browser findings require **BLOCKED**. Shader compilation, frame capture, user review and Android/device measurements must be completed before **TECHNICAL PASS** or **ART APPROVED** can be claimed. No merge, Pages deployment or production integration is included.
