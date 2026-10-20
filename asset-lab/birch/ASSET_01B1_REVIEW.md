# ASSET-01B1 — Faithful Birch Family Migration: final technical / visual review

Date: 2026-10-20
Branch: `feature/asset-01b1-birch-lab`
Implemented and CI-verified code checkpoint: `172e21a50a6c83c94213dcfb292f744ffbb6fb1b`
Source: `Algolon/Feh-Lu-We@17eafb0902833fb1121c77083f9f862eb4ffcd96`
Branch base: `Algolon/Aurora-Rest/main@d543f66a85f120a182eebe56e2d24f5770f250fb`
CI: https://github.com/Algolon/Aurora-Rest/actions/runs/39500076428
Browser review artifact: https://github.com/Algolon/Aurora-Rest/actions/runs/39500076428/artifacts/12300540089

## Scope and boundaries

Faithful extraction and isolated local Three.js showroom only. All production WORLD-01 / WORLD-01B code remains untouched. No world vegetation population, asset family expansion, merge, deployment or Feh Lu We modifications.

## Verified results

- **Actual CI execution:** 5/5 Node geometry/determinism tests passed, TypeScript no-emit validation passed, Vite production build passed.
- **Independent source parity:** in a temporary read-only sparse checkout at the pinned Feh Lu We commit, the original `referenceTreeModel('birch',v,lod,'outline','trees-r03')` runtime was imported. For 3 variants × near/mid/far × wood/leaves the original and Aurora produce matching raw byte hashes for positions, normals, UVs, vertex colours and indices, with matching bounding spheres.
- **LOD:** three unique combined meshes per variant, nine total. Far/xfar alias uses the very same geometry object in the browser. Hybrid thresholds [22,36,62] m and 3 m hysteresis; selector tests passed.
- **Real browser:** Chromium WebGL 2 (software/SwiftShader backend) captured 23 genuine PNG screenshots plus `render-metrics.json` in a downloadable Actions artifact; page console had no unexpected errors.
- **Mesh triangles:** variant 0 near/mid/far = 1606/568/470; variant 1 = 1424/504/416; variant 2 = 1560/560/452.
- **Lifecycle smoke:** shared material atlas reference retained across multiple simultaneously instantiated family owners, disposing a family invalidates its geometry access while the active family keeps its materials; far/xfar object identity verified.
- **Visual inspection:** distinct birch silhouettes, white flecked bark with dark base, drooping foliage sprays and restrained palette variation visible at near and close inspection; no obvious opaque foliage sheets or green trunks in captured daylight/neutral views.

## Material differences and remaining evidence

- Feh Lu We's global `THREE.ShaderChunk` surface modification was deliberately converted to a material-scoped `onBeforeCompile` patch. Geometry parity is **proven**, but shader pixel-perfect parity is **not established**.
- Source-versus-Aurora pixel-difference review at identical camera, exposure and lights is **not available**; existing source screenshots are not a matched comparison.
- Browser validation used software-rendered Chromium. No physical Samsung/Android test, real GPU frametime benchmark or sustained-memory leak analysis was run.
- The full island scene was neither built nor rendered in this branch, by design. The source metadata on Aurora main remain separate from the pending WORLD-01 development branch.
- The asset lab has a material-reference cache and dispose handlers. The browser smoke test is a lifecycle sanity check, **not** a long-session VRAM profiler.

## Acceptance decision

**GEOMETRY FIDELITY: ACCEPT (source verified).**
**STANDALONE LAB: TECHNICALLY VERIFIED.**
**MATERIAL/ART: REVIEW CANDIDATE — requires owner inspection of screenshot artifact and optional matched-source shader regression.**
**WORLD INTEGRATION: NOT AUTHORIZED.**

## ASSET-01B2 recommendation

Do not begin automatically. After owner review, ASSET-01B2 may extend the isolated lab to a world-agnostic batched/instanced renderer and verify forced no-multi-draw fallback, LOD transitions and mobile performance on physical hardware. World integration waits for a separately accepted WORLD-01B checkpoint.
