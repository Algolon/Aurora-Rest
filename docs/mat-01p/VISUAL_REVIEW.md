# MAT-01P — Visual review (baked-noise candidate)

All images are genuine Chromium 141 WebGL2 renders (SwiftShader) of the MAT-01 review page. The 1280×800 views use canonical 400 m tiles at 4 m, Nordic daylight and the same cameras for both servers:
- **baseline:** pinned worktree `ae8a9c1`
- **candidate:** experimental branch

Sources:
- `regression/manifest.json`: per-shot SHA-256 of the original lossless PNG and of the committed file
- `regression/summary.json`: all statistics, computed on the lossless PNGs
- `regression/composites/`: baseline | candidate | |Δ|×4, half resolution

Two near-nadir cameras were injected at serve time for the repetition test, identically on both servers:
- `nadir-forest`: 320 m above (−700, 250), 99.96 % forest floor
- `nadir-meadow`: 320 m above (810, −1158), 99.1 % meadow turf

## A. Default compatibility (baked noise OFF) — exact

| Evidence | Result |
|---|---|
| Optimised SPIR-V, High and Mobile | byte-identical to MAT-01 (`240c71e3…`, `444025cf…`) |
| Shader source with candidate branches removed | SHA-256 `21fa34d0…` equals MAT-01 (`tests/mat-01p.test.ts`) |
| 10 matched views, High | **all 10 PNG files byte-identical** to the baseline captures (max Δ 0, histogram distance 0) |
| Browser gate, candidate OFF | 14/14, every value equal to the baseline gate (`gates/browser-check-procedural.json`) |

Identical rendering setup: same Chromium/SwiftShader binary, viewport 1280×800 at DPR 1, camera list, lighting, profile, layout and data artifacts (terrain `fc8fd6da…`, classification `bc2ce096…`).

## B. Opt-in candidate (baked noise ON)

### Quantitative statistics (0–255 sRGB units)

The baked texture is a *different realisation* of statistically matched noise. Pixel Δ therefore measures where patches moved. The other columns measure whether the look is kept.

**High**

| View | % px Δ>16 | Mean colour shift | Luminance spread ratio | Hist. L1 | Tone Δ at 1/16 scale |
|---|---|---|---|---|---|
| m01-walk (M01 walking height) | 7.6 | **3.33** | 1.010 | **0.154** | 3.04 |
| m01-elevated (M01 elevated) | 2.3 | 0.41 | 0.992 | 0.026 | 2.20 |
| m02-walk (M02) | 8.3 | 1.74 | 0.988 | 0.081 | 1.97 |
| m02-elevated | 0.7 | 0.03 | 1.018 | 0.035 | 1.77 |
| tr-forest-meadow (transition) | 8.0 | 0.73 | 1.042 | 0.087 | 2.33 |
| birchwood-overview | 0.2 | 0.14 | 1.000 | 0.017 | 1.15 |
| valley-walk | **14.7** | 2.05 | 0.982 | 0.085 | 2.77 |
| m04-walk (bedrock) | 2.4 | 0.13 | 0.998 | 0.118 | 2.19 |
| nadir-forest | 0.0 | 0.38 | 1.003 | 0.059 | 2.47 |
| nadir-meadow | 0.0 | 0.18 | 0.989 | 0.049 | 2.02 |

**Mobile**

| View | % px Δ>16 | Mean colour shift | Luminance spread ratio | Hist. L1 | Tone Δ at 1/16 scale |
|---|---|---|---|---|---|
| m01-walk | 0.05 | 1.49 | 0.996 | 0.085 | 1.73 |
| m01-elevated | 0.02 | 0.11 | 1.000 | 0.071 | 1.68 |
| m02-walk | 0.51 | 0.02 | 1.000 | 0.004 | 0.20 |
| tr-forest-meadow | 0.17 | 0.25 | 0.997 | 0.011 | 0.56 |
| nadir-forest | 0.00 | 0.39 | 1.001 | 0.037 | 1.88 |
| *all 10 views, worst case* | 0.51 | 1.49 | 0.996–1.008 | 0.085 | 1.88 |

Mobile changes far less because it has no meso or anti-tiling noise. Only the patch and ecotone masks change there.

### Assessment by criterion

| Criterion | Finding | Verdict |
|---|---|---|
| **Texture repetition** | Autocorrelation of high-passed luminance at every baked period lag (ecotone 103 m, meadow patch 192 m, forest patch 288 m, meso 373 m) is \|r\| ≤ 0.035, the same as control lags and the procedural baseline. The one larger value (ecotone lag, r ≈ −0.10 to −0.13) occurs equally in procedural and baked. No repetition is visible in the nadir composites. | No repetition introduced |
| **Patch placement & coverage** | Placement changes everywhere (different realisation). Coverage statistics match: forest 49.6 % vs 50.9 %, bedrock 7.6 % vs 7.8 % (`profile/noise-statistics.json`). **In the M01 walking-height reference view the camera now stands in a moss carpet**: green-dominant pixels in the lower frame go from 8.7 % to 17.6 %, and fewer leaf drifts read (`composites/detail-m01-walk-foreground.png`). | **Perceptible change of a reviewed image** |
| **Low-frequency tonal variation** | Tone Δ at 1/16 scale ≤ 3.0 (High), ≤ 1.9 (Mobile). Meso tone keeps its amplitude and scale; only its arrangement moves. | Equivalent character |
| **Material readability** | All four materials stay distinct (browser gate min mean-RGB distance 33.9 vs 28.6). Luminance spread within 0.98–1.04 of baseline, so no loss of texture contrast. | Preserved |
| **Colour shifts** | Frame-mean shift ≤ 3.3 (High, M01 walk) and ≤ 1.5 (Mobile). Forced-meadow gate view +4.4 G (75.0 → 79.4). These come from which pixels land inside tinted patches, not from a global tint change. | Small but not zero; visible in M01 walk |
| **Artifacts and seams** | No seams. The noise texture tiles seamlessly (test), sampling is `textureGrad`-filtered, re-tiling stays pixel-identical (gate). No new aliasing seen; the mip-filtered noise is, if anything, smoother at distance. | None found |
| **Ground-scale consistency** | Patch, meso and ecotone scales are unchanged (same world-space frequencies); M01 ↔ M02 transition shape changes but keeps its width and irregularity (`tr-forest-meadow`). | Preserved |

### Perceptual summary

At walking height in High, the candidate is a **different but equally plausible arrangement** of the same material. It is not the same image. The largest difference is M01: the reference walking view becomes visibly mossier because a moss carpet now sits in the foreground.

Art review of M01 forest floor is pending and must not be pre-empted (ENV-P01 owner review). This candidate therefore **cannot be presented as appearance-preserving for High**.

In Mobile the differences are small (≤ 0.5 % of pixels Δ>16, ≤ 1.5/255 colour shift) and hard to see at review scale. They are still a re-arrangement, not identity.

Coverage percentages agreeing is **not** treated as proof of equivalence: the per-image differences above are real.

## Pre-existing evidence gap (MAT-01, not introduced here)

Three MAT-01 evidence images have no recorded SHA-256 in `docs/mat-01/evidence/manifest.json` @ `ae8a9c1`:
- `tile-seam-200m.png`
- `lod-wireframe-ortho.png`
- `lod-shaded-valley.png`

All 70 MAT-01 images are present, and the other 67 hashes verify. For post-hoc identification only (computed now, from the files at `ae8a9c1`), see `README.md` § Verified baseline.
