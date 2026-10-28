# MAT-ART-R01 — Phase A diagnosis: why MAT-01 ground does not match the stylized assets

All images are unretouched Three.js WebGL canvas readbacks from `mat-art-r01.html` (production bundle,
SwiftShader WebGL 2, 1100×700, DPR 1, FOV 57°, seed 73129, density 1, MAT high profile, R02 lighting). Every
capture of a view shares its camera pose, ground-mesh hash, full POP descriptor hash, classification hash and
scene settings; the capture tool asserts this ([capture.json](diagnosis/evidence/capture.json), 72 frames, 16
matched groups, zero console errors). Ablations change only the named channel of `forest-floor` and
`meadow-turf`; `coastal-sand` and `bedrock` are untouched.

**Baseline reproduction.** Variant A in this viewer reproduces the ENV-NATURE-R02 source frames for the same
poses: identical draw calls and triangles (66/466,253; 88/556,897; 111/684,685) and 91–94% bit-identical pixels.
The rest are ±1 LSB (5.8–7.8%) plus fewer than 0.05% of pixels, almost all on vegetation edges. R02 used
SwiftShader on LLVM 10, while this container uses Subzero ([r02-parity.json](diagnosis/evidence/r02-parity.json)).

## Ablations

| ID | Change (in-scope materials only) | Purpose |
| --- | --- | --- |
| D0 | none, faithful MAT-01 | baseline |
| D1 | `normalStrength` = 0 | detail-normal contribution |
| D2 | albedo RGB low-passed (features < ≈5 cm removed); height, normals, AO, far mean unchanged | high-frequency albedo |
| D2b | cavity AO channel = 1 | shader AO darkening |
| D3a | meso amount 0, patch/macro/exposure tints neutral | meso/macro colour |
| D3b | detail tile ×2 | texture scale and repetition |

## Evidence

**Texture spectrum** ([texture-spectrum-original.json](diagnosis/texture-spectrum-original.json), luminance L* including the near-field AO factor):

| Material | L* RMS | < 2.5 cm | 2.5–6 cm | 6–15 cm | 15–40 cm | ≥ 40 cm | Normal slope RMS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| meadow-turf | 14.2 | **63%** | 23% | 10% | 3% | 1% | **0.66** |
| forest-floor | 5.4 | 21% | 17% | 26% | 20% | 15% | 0.18 |

A screen pixel at 1.75 m eye height covers 4–6 mm across × 6–25 mm along the ground at 2–5 m. The 5 mm meadow
texel and 1 px blades therefore sit at or below pixel Nyquist exactly where the player looks.

**Rendered band energy** (L* RMS per screen band, ground pixels from the dominant-material mask;
[image-metrics.json](diagnosis/evidence/image-metrics.json)):

| View (vegetation hidden) | D0 1–3 px | D1 | D2 | D2b | D3a | D3b | D0 19–55 px |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Birchwood interior | 5.74 | 5.72 | **2.11** | 5.20 | 5.47 | 5.00 | 1.43 |
| Birchwood edge | 5.16 | 5.21 | **2.29** | 4.91 | 4.68 | 4.11 | 1.59 |
| Open grassland | 4.93 | 4.85 | **1.87** | 4.45 | 4.97 | 5.47 | 2.04 |
| Meadow transition | 2.36 | 2.36 | **1.27** | 2.31 | 2.28 | 2.43 | 1.94 |
| Overview | 1.07 | 1.07 | 1.01 | 1.13 | 1.04 | 1.49 | 0.61 (D3a 0.42) |

**Ground vs vegetation frequency signature** (vegetation on, same frames): the ratio of the finest to the broadest
band is 2.3 for ground and 0.9 for vegetation at Birchwood interior (4.0 with vegetation hidden), 1.9 vs 1.0 at Birchwood edge, and 2.8 vs 1.0 in
open grassland. The trees, grass and rocks put their contrast into silhouettes and the ground puts it into
pixel-scale speckle.

**Visual reading** (frames in [diagnosis/evidence](diagnosis/evidence)):
- D1 and D2b are visually almost indistinguishable from D0 at every station.
- D2 removes the photographic blade field. What remains is a uniform olive mush with a faint crackle: nothing in
  the texture is designed between ≈5 cm and several metres.
- D3a removes a yellow cast on meadow (MAT-01 macro pole `[1.24,1.08,.72]`) and, on the overview, 31% of the
  only landscape-scale structure.
- D3b makes blades chunkier and more conspicuous. It does not look better.
- The 3D grass tufts are cool teal-green (`#2e4e36`/`#46663c` bases); the ground is olive-yellow with near-black
  soil gaps. Tufts look placed on the ground, not grown from it.
- **Classification fact:** at the R02 "shelter" station (Birchwood interior) the ground under the birches is mostly
  `meadow-turf`. Forest floor appears only as patches. The meadow material therefore defines the woodland look too.
- The forest floor reads as decals: crisp lime moss splotches and saturated yellow leaf confetti on dark humus,
  with a strong value step against the meadow.

## Ranked root causes

1. **High-frequency, high-contrast albedo in meadow-turf: the primary cause.** 17,000 one-pixel blades with
   bright tips over dark soil put 63% of the variance below 2.5 cm. Removing it (D2) cuts on-screen fine-band
   energy by 56–63% at walking stations (46% at the transition). The next largest, D3b at 13–20%, only shifts
   energy into coarser bands; every other ablation stays at or below 10%.
2. **Missing designed shape between ≈5 cm and ≈1 m in both families.** Tile equalisation (0.9 at ⅛ tile) strips
   in-tile structure, so blurring alone produces flatness (D2). The stylized assets read through mid-scale masses, which the
   ground does not have. This is why "reduce detail" cannot be the fix.
3. **Palette/value mismatch with assets.** Warm yellow-olive with near-black gaps and a strong meadow macro
   yellow cast, against cool teal-green grass and muted stylized canopies. The forest floor's lime moss and
   saturated leaves read as decals. Contributors: palettes, `macroTint`/`exposureTint`, cavity AO (−9%).

Not root causes: **detail normals** (D1 ≤ 1% change despite slope RMS 0.66) and **tile scale/repetition** (D3b
makes it worse). Shader blending and lighting need no change: the transition fault is the value gap between
the families, not the blend.

## Decision (Gate A)

- **Change:** meadow and forest-floor generators (shape before stroke), palettes, equalisation and cavity
  strength, macro/exposure/patch tints, and a moderate reduction of normal strength and relief (consistency rather
  than impact).
- **Keep:** classification, blending and height-blend, shader and its anti-tiling, meso system, lighting, terrain
  geometry, coastal sand, bedrock, all assets, LOD and grass fade.
- **Hypothesis:** move contrast from grain/blade bands to tuft/clump bands with a narrower, asset-matched palette.

Gate ordering: the hypothesis and variant B code were drafted after the spectrum and the ground-only ablations at
the three close-up stations. The remaining environment and vegetation-on captures ran afterwards and confirmed
the ranking. B was not tuned against any A/B frame before the Phase D comparison.
