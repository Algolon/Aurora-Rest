# ASSET-01D2R — Natural Ground-Cover Visual Calibration & Walking Experience

**Overall review recommendation: CONDITIONAL, pending owner art review and native desktop/Android movement tests.** The source/renderer fidelity, browser regression and deterministic motion tests pass. V1 groups vegetation more organically in selected views; V2 clearly increases visible grass and reduces synchronized distance-fade steps. The visual target of a seamlessly rich Nordic meadow is **not yet reached**. V3's restrained ground albedo experiment produces negligible visible improvement at normal walking views and is **not recommended as the default**.

## 1. Provenance, branch and protected state

- Repository: `Algolon/Aurora-Rest`, the only writable repository.
- Authorised branch: `fix/asset-01d2r-ground-cover-visual-calibration`.
- Exact approved source D2 commit and HEAD before branch: `feature/asset-01d2-scalable-ground-cover@1c4870439ba1885a7b43bb80b35940f64bd6eeac`. Verified remote D2 HEAD and success of CI `39633710859`; no D2R branch or D2R PR existed.
- **Successfully tested D2R implementation commit:** `84f6d7284171db07158aab338f248876466a8ddb`.
- **Successful full D2R CI (3 jobs):** https://github.com/Algolon/Aurora-Rest/actions/runs/39668390960
- **Genuine before/after + seven-phase motion sequences:** https://github.com/Algolon/Aurora-Rest/actions/runs/39668390960/artifacts/12378507486 (`asset-01d2r-visual-metrics.json` and 88 PNG images).
- **Preserved D2 WebGL benchmarking/lifecycle/parity:** https://github.com/Algolon/Aurora-Rest/actions/runs/39668390960/artifacts/12379360288
- **Independent original Feh Lu We/Aurora material parity:** https://github.com/Algolon/Aurora-Rest/actions/runs/39668390960/artifacts/12377419881
- Original source remains strictly read-only at `Algolon/Feh-Lu-We@17eafb0902833fb1121c77083f9f862eb4ffcd96`.
- Source grass geometries, normals, UVs, atlas and foliage shader remain byte-identical; birch/pine source files, Aurora main, GEO-R02, WORLD-01B and all unrelated branches untouched. No PR, merge, deployment, island integration or ASSET-01E.

## 2. Exact V0 baseline and visual diagnosis

The original D2 Chromium/WebGL evidence is stored at https://github.com/Algolon/Aurora-Rest/actions/runs/39633710859/artifacts/12360966027 . V0 was independently recreated inside the new showroom with precisely the D2 generator, neutral ground, original 13m / 4m / 12-step fade, population 2,000, seed `120626`, matched lighting and 1100×720 viewport. Eight original perspectives were captured before being compared against changed variants.

**Observed defects in genuine baseline images:**
1. Tufts frequently read as separate, evenly spaced individual objects rather than connected grass masses.
2. Large bright, uniform ground exposures dominate the foreground, especially short grass/transition.
3. The approach viewpoint shows a narrow vegetation stripe at distance against an otherwise empty planar landscape.
4. Variant 2 seed heads look decorative but not naturally woven into the underlying growth.
5. A radial visibility limit + quantized scale fade are plausible causes of pulsing during movement. Static screenshots alone cannot prove perceptual popping.

The original test surface is a deliberately simple finite flat plane, not a production terrain. Its visible abrupt outer edge is partly **world-content absence**, not just the distance shader. Grass density alone is insufficient to correct that boundary.

## 3. Controlled experiments

| Version | Grass positions and species | Fade | Ground | Outcome |
| --- | --- | --- | --- | --- |
| **V0** | Exact D2 deterministic original | Original 13m / 4m / 12 steps | Original neutral plane | Grounded baseline, sparse silhouettes |
| **V1** | Seeded multiscale density, irregular clumps, microoverlap, short-grass base and localized tall/seed/sedge weights | **Same V0 fade** | **Same original ground** | Some richer groups, especially tall verge and sedge, but pronounced open gaps persist |
| **V2** | **Same V1 placement** | **19m visibility, 7m smooth fade, 48 steps, ±1.4m stable per-ID threshold jitter** | **Same original ground** | Longer perceived grass continuity; staggered shrink rather than one synchronized ring; still visually sparse |
| **V3** | **Same V2 placement** | **Same V2 fade** | Optional low-contrast 384×256 single-texture meadow albedo | A controlled experiment; normal-view image changes were effectively imperceptible, so not accepted as ground-integration solution |

The V0 placement generator was not modified and is still selectable. The V1/V2 selection uses a separate `naturalGroundCover.ts` module with seeded overlapping broad communities and small clumps, warped value-noise density, irregular blank gaps, a narrow wandering test clearing, intentional source-model scale/yaw/brightness variety, and selective 720-triangle seed heads. V1 changes species distribution as well as positions, so its effect should be interpreted as **combined placement/species composition**, not a pure positional ablation. Instance counts, initial seed, camera/lighting, floor and rendering backend were kept fixed for the controlled screenshots.

All four source variants remain geometrically unchanged. V3 is a standalone `meadowGround.ts` canvas albedo map; no new grass objects, billboard geometry, source-material changes, wind or biome maps were introduced. The showroom defaults to **V2**, with V3 toggleable for comparison. The calibrated texture is disposed separately.

## 4. Fade and walking controls

The source and extended/close D2 fade configurations remain bit-for-bit selectable. V2 adds `refined` independently:
- Visibility range **19m**
- Fade span **7m**
- **48** quantized scale increments, after smoothstep shaping
- Per-grass deterministic **±1.4m** offset to stagger fade boundaries
- No alpha transparency or material brightness tricks

The grass batch retains correct instance-ID stable transforms, visibility frustum checks, forced instanced fallback and native multi-draw. The only renderer changes are: per-ID fade offset used solely when requested, and an unchanged-camera/projection early return that avoids the full visibility loop and sets the reported update duration to zero. Pure rotation and actual walking movement invalidate the view and trigger updates. `setFade` no longer forces unnecessary writes when the chosen profile is unchanged.

The showroom has a working **Play walking route** control, plus a reproducible 84-frame, seven-phase camera path at 1.68m eye height: approach, enter, dense walk, turn in place, reverse, move laterally, stop/start. The genuine browser evidence captures **28 labelled PNG frames for V0** and **28 for V3** (V3 and V2 have identical fade and positions, only ground differs), including known frame indices and camera world coordinates. These are actual sequential Three.js renders, not generated illustrations. The evidence also contains Chromium rAF interval samples with a reported median of about 16.7ms; these **are scheduling samples, not GPU FPS or reliable native frame-time measurements**.

The phase sequences demonstrate the changed grass silhouettes and visible counts while moving; human perception of subtle 48-step pulses and radial boundaries remains a **conditional acceptance gate**. The finite test meadow still leaves an empty horizon beyond its spatial extent.

## 5. Matched visual evidence and V3 decision

Exactly **8 matched camera perspectives × 4 versions = 32 static PNGs** (top, walk, short, tall, seed, sedge, transition, approach), plus **56 motion PNGs**. Each perspective was rendered from the same camera position/light/seed/population where possible. V0 vs V1 isolates placement+species change; V1 vs V2 isolates fade; V2 vs V3 isolates the ground texture.

Of 792,000 pixels per frame, V2-vs-V3 had **zero changed RGB pixels above delta 12** in normal walk, sedge and approach views. In the top-down image, only **28** exceeded that threshold. This proves the current subtle ground study is too restrained to achieve the requested material visual continuity; it **should not be presented as a solved ground-integration layer**. Do not boost ground green indiscriminately merely to produce a larger pixel difference.

Visual conclusion from image inspection: the V2/V3 source-grass distribution is a moderate improvement over V0 in localized grass families, not an art-direction-final natural meadow. Ground remains exposed. More distant environmental continuity needs future world-context evaluation, rather than falsely claiming that the 19m visibility setting covers an unbounded landscape.

## 6. Performance and rendering guardrails

These are real **Chromium 155 WebGL 2.0 / SwiftShader software browser** results, not hardware FPS. All render paths, motions and original resource parity passed.

At the final matched walking camera pose:

| Registered | V0 visible / triangles | V2 and V3 visible / triangles | Instanced drawcalls | Multi-draw drawcalls |
| ---: | ---: | ---: | ---: | ---: |
| 100 | 18 / 4,344 | 45 / 13,872 | 5 | 2 |
| 500 | 107 / 34,872 | 239 / 69,480 | 5 | 2 |
| 2,000 | 413 / 141,312 | 909 / 268,104 | 5 | 2 |
| 5,000 | 1,067 / 358,608 | 2,232 / 656,976 | 5 | 2 |

The 5,000-instance V2 improvement comes with **2.09× visible tufts and 1.83× visible triangles**, even while all drawcalls remain bounded. D2R recorded individual moving-camera CPU visibility-update observations as high as **7.9ms** (V2 instanced, 5,000) and **9.4ms** (V3 multi-draw, 5,000), alongside much smaller observations at other camera points. These are noisy single-path CPU values, not a statistical guarantee or GPU timing. The steady-camera update was consistently **0ms** because no visibility loop ran. Full buffer-update/reallocation data, renderer memory counters and raw positions are in the archived JSON.

V3 uses a separate once-allocated ground CanvasTexture; it does not change grass triangle counts/draw groups. Resource counters are browser/renderer bookkeeping, not VRAM. Shadows remain OFF by default. Near-only shadows and the separate SHADOW-R01 effort were not implemented.

## 7. Technical verification

**Run 39668390960: all three CI jobs successful.**
- **29/29** Node tests, existing ASSET-01B/C/D1/D2 tests retained and five D2R-specific tests added.
- Strict TypeScript/Vite production build passed.
- Independent pinned original Feh Lu We **birch, pine, grass** source geometry parity passed.
- Unchanged original Feh Lu We/Aurora grass material parity passed.
- Original D2 real Chromium/WebGL batch vs original Mesh test passed (16/16 matched cases with zero changed pixels).
- Existing D2 benchmarks 100/500/2,000/5,000, resource owner sharing and six create/update/dispose cycles passed.
- New 32 matched visual comparisons, 56 genuine motion-frame images, 24 V0/V2/V3 performance scenarios and browser error checks passed.
- No native desktop/Android GPU or visual subjective approval claimed.

## 8. Acceptance gates and next review

| Gate | Status |
| --- | --- |
| Natural distribution | **CONDITIONAL** — some grouping improvements but considerable open ground |
| Ground integration | **CONDITIONAL / V3 NOT SELECTED** — subtle albedo difference has too little visual impact |
| Walking continuity | **CONDITIONAL** — staggered 48-step fade works and sequences exist; remaining horizon/ring should be judged moving |
| Source fidelity | **ACCEPT** |
| Instancing and multi-draw correctness | **ACCEPT** |
| Performance | **CONDITIONAL** — bounded drawcalls but nearly doubled visible triangles; hardware untested |
| Resource lifecycle | **ACCEPT** |
| Tests, build, real browser validation | **ACCEPT** |

**Recommendation: retain V2 as the review candidate, V0 as the reference and V3 only as a diagnostic toggle.** No final art acceptance should be granted from a green CI. Inspect the 32 comparison images and the 56 moving-camera frames for grass-mass cohesion, repeating silhouettes, width of the visible grass band, open terrain and pulse perception before authorizing island integration.

A future controlled experiment may study more convincing layered ground-cover structure or lower-cost distant meadow continuity. These are **not approved** by the present milestone and must not alter the source grass geometries. No further work, main-world changes, merge or deploy is authorized under D2R.

## 9. Reproduction

```bash
git switch fix/asset-01d2r-ground-cover-visual-calibration
cd asset-lab/birch
npm install --no-audit --no-fund
npm test
npm run build
npm run dev
# Open http://127.0.0.1:5173/ground-cover.html
CHROME_PATH=/path/to/chrome npm run capture:ground-cover
CHROME_PATH=/path/to/chrome npm run capture:ground-cover:visual
```

**Stop after D2R. No Feh Lu We changes, Aurora main, GEO-R02, WORLD-01B, island implementation, new family, merge, deployment or ASSET-01E.**
