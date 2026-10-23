# POP-01 — procedural nature population review

**Implemented and tested; owner art review required. No merge, deployment or production asset promotion.**

Working branch: `feature/pop-01-procedural-population-engine`.
Source: `90d0cb745e8e51a3dc737bd4dc11d6f8c322758b` on `feature/geo-r02c-p0-calibration-infra`.
Repository: https://github.com/Algolon/Aurora-Rest . The branch is local; it has not been pushed or published.

[Architecture decision](ADR.md) · [Asset audit and POP-02 plan](ASSET_INTEGRATION.md) · [WebGL review gallery](review.html) · [CPU benchmark data](benchmarks.json) · [Browser evidence](evidence/runtime.json) · [Protected source manifest](preflight.json)

## What is working

* Asset-agnostic deterministic placement descriptors, seven provisional ecological communities, smooth multiscale patches, sparse transitions and optional authored glade/vista controls.
* Canonical 4 m terrain height/normal queries, clipped water-mesh exclusion, coastline, class-specific water margins and narrow candidate-route tread clearance.
* Stable world candidate IDs, halo minimum spacing across chunks, shared tree/rock spacing, upright trees and terrain-aligned rock/cover descriptors. Placement is independent of camera/loading order and chunk size.
* Bounded streaming, cancellation of stale pending chunks, unload/re-entry and deterministic regeneration. Render representation and data ownership are separate.
* Isolated actual Three.js review scene: three verified anchors, density/seed/chunk size, family toggles, terrain diagnostics, chunk lines, instance inspection, overhead/landscape/walking views and runtime metrics. Rendering uses explicitly labelled diagnostic proxies.
* A safe, source-inspected asset handoff. Approved tree/grass renderers were not rewritten, source branches were not modified, and premium experimental rocks were not promoted.

## Verified test regions

Coordinates come directly from `public/geo-r02b/features.json` anchors; heights are sampled from the canonical binary, not the proposal heights in the anchor metadata.

| Region | Anchor ID | World X / Z (m) | Actual terrain Y (m) |
|---|---|---:|---:|
| Birchwood Forest | forest | −740 / −50 | 113.352 |
| Central Valley | valley | 200 / 10 | 29.339 |
| Home Cove dry apron | home | 1670 / −1900 | 4.552 |

Exact evaluated values, population counts and per-view renderer submissions are recorded in `evidence/runtime.json`. The guide values above are rounded; the binary and report remain authoritative.

## Reproduce

```sh
npm ci --no-audit --no-fund
npm test
npm run build
npm run dev
# open http://127.0.0.1:5173/pop-01.html
node --experimental-strip-types tools/pop-01/benchmark.ts
# with Playwright Chromium installed, or CHROME=/path/to/compatible/chromium:
node tools/pop-01/capture.mjs
```

`capture.mjs` starts and stops its own local Vite server. It records actual WebGL screenshots and interaction assertions. Captures use software SwiftShader in this environment. No concept images are used. `tools/pop-01/handoff.mjs` writes the observed Git HEAD and artifact hashes outside the commit for review without attempting the impossible task of embedding a commit's own SHA inside itself.

## Validation

`npm test`: **42 / 42 pass** (29 existing tests + 13 POP tests). `npm run build`: **pass**, existing shared Three.js >500 kB bundle warning remains. Tests cover identical outputs, reverse generation order, chunk-size repartitioning, actual terrain contact, canonical wet triangles, water/ocean distinction, family constraints, inter-chunk spacing, heightfield-adapter changes, provisional tread clearance, composition masks, repeated load/unload/teleport, failed attach/retry, input guards and protected-source hash equality.

Browser assertions cover all three regions × three views; repeated region teleport roundtrips/regeneration; stable IDs and stable renderer geometry/texture counts; family visibility; seed/density controls; inspector data; actual WASD movement and canonical walking height. See the machine-readable report for measured results, browser version and errors/warnings. Stable geometry counts do not substitute for a physical device heap profile or prove a general-purpose driver leak test.

## Interpretation and remaining risks

* **Technical review candidate, not production readiness.** The ten POP-01 technical criteria have implementation and evidence; acceptance remains the owner's decision. Artistic acceptance is open, and the proxy visuals are not approved nature art.
* No physical Android or desktop-GPU FPS claim. CPU benchmarks and software WebGL submissions are different measurements. Small chunks improve generation granularity but add batch groups. An 8 ms soft budget can still overrun on one chunk; workers/resumable generation are the principal runtime next step.
* Ecological inputs are intentionally approximate: anchor-weighted woodland, altitude/coastal exposure and moisture proxies. The community API is proposed for MAT reconciliation; no canonical global biome, soil or wind dataset was invented. Seven labels are supported; only birch, pine, generic grass and production rock identifiers exist.
* The active review population covers 320 × 320 m at default settings, surrounded by a 1024 m full-resolution terrain patch. Its outer population edge is a streaming limit, not a density seam inside adjoining chunks. Distant terrain outside the local patch is omitted; visible horizon water there does not represent geographic edits. This viewer is local validation, not full-island traversal or full-island population.
* The water mesh is displayed unchanged as static context, adding ~112k triangles even in a local review. MAT shading and WTR rendering are not implemented here.
* Candidate route buffers preserve a narrow walking reservation only. No final physical trail/collision system is claimed. Trees/rocks avoid their tread; tree crowns can overhang it. Default authored scenic masks are empty pending owner composition review.
* Regional/community threshold transitions, simplified moisture/exposure, source grass alignment, rock/cover footprint interaction and hero compositions need refinement with approved source assets. POP-02 should not merely increase density.

Stop here: POP-02 is planned in `ASSET_INTEGRATION.md` and has not started.
