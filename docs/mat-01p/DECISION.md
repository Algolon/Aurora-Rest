# MAT-01P — Decision

## Classification: **EXPERIMENTAL ONLY**

The implementation is sound and safe to keep as an opt-in experiment. Neither its benefit nor its appearance has been demonstrated well enough to call it a technical candidate for adoption.

| Requirement | Evidence | Met? |
|---|---|---|
| Functionality validated | 45/45 tests, typecheck, build; browser gate 14/14 with baked noise OFF and ON; lifecycle 5 → 0 → 5 textures; profile switching; no shader or page errors | **Yes** |
| Default compatibility | candidate OFF ≡ MAT-01: identical SPIR-V, identical PNG files in 10 views, identical gate values | **Yes, exact** |
| Classification / identity / CPU–GPU / coordinates | untouched by design; golden classification hash unchanged; GPU↔CPU parity 0.0014 in both modes; re-tiling Δ 0; LOD Δ ≤ 3/255 | **Yes** |
| Measurable performance potential | static estimate: ALU lanes −51 % High / −40 % Mobile, at the cost of +5/+3 texture samples. **Measured** (SwiftShader): High −0.9 %, Mobile −6 %, both within run-to-run noise. **No device data.** | **Not demonstrated** |
| Appearance preserved | different realisation of statistically matched noise. Mobile differences are small; **High M01 walking-height reference view visibly mossier**. M01 art review is pending (ENV-P01) and must not be pre-empted. | **Not demonstrated (High); small changes (Mobile)** |
| Regressions / artifacts | none found (no seams, no repetition, no aliasing, no lifecycle leak) | — |

Why not **TECHNICAL CANDIDATE**: its performance potential is an instruction-count estimate only. The brief rules out inferring hardware speed-ups from SPIR-V counts, and the only measured wall time is inconclusive.

Why not **REJECTED**: there are no regressions or artifacts, the default path is provably unchanged, and the arithmetic reduction is real. Whether it matters is a GPU question nobody has asked yet.

## What this does and does not authorise

- Baked noise stays **off by default in every profile**. Nothing here changes MAT-01 behaviour.
- **Do not adopt** baked noise as a default without (1) device evidence per `PERFORMANCE.md` §5 and (2) explicit owner art approval of the re-arranged patches.
- `feature/mat-01-terrain-material-architecture@ae8a9c1` remains the protected MAT-01 baseline. The experimental branch is not a replacement, is not merged and has no PR.
- No further optimisation rounds without an explicit owner decision.

## Recommended mobile strategy

1. **Keep MAT-01 procedural noise everywhere for now.** It is the validated, art-reviewed-pending look.
2. **Measure on real devices first** (`PERFORMANCE.md` §5). The decisive number is the gap between Mobile procedural and Mobile with no fBm on a mid-range Android GPU.
   - **Gap ≥ ~15 % of terrain GPU time:** the noise is worth optimising. Evaluate this candidate on Mobile only, where its visual change is smallest, and ask the owner to approve the re-arranged patches from Mobile captures.
   - **Gap below that:** drop the candidate and keep the shader as is.
3. **Test bigger, art-neutral levers first** on the same devices:
   - the inherited logarithmic depth buffer, which disables early-Z
   - anisotropy (2× already on Mobile)
   - render-resolution scale
   - attributes at 8 m to save classification memory

   These do not change the look.
4. **Consistency caveat:** if Mobile alone used baked noise, patch layouts would differ between devices. That is acceptable for ground detail, but it should be a conscious owner decision.

## Open items (for the owner / next milestone)

- Device measurements (desktop discrete GPU, mid-range Android, low-end Android).
- Owner art review of M01 within ENV-P01, independent of this experiment.
- **Pre-existing MAT-01 behaviour, recorded only and not changed:** the patch `coverage` parameter is not an area fraction. Meadow's nominal 22 % yields about 0.4 % patch area from the noise term, sand about 0.1 % and bedrock about 8 %; only forest (50 %) lands near its design value. This is an art-direction question for after ENV-P01 review.
- **Pre-existing MAT-01 evidence gap:** 3 images without recorded hashes (see `README.md`).
