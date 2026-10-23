# MAT-01P — Material Performance & Integration Readiness

**Outcome: EXPERIMENTAL ONLY.** See [`DECISION.md`](DECISION.md).

The baked-noise option is sound and opt-in, and its default-off path is provably identical to MAT-01. Its performance benefit is unproven without devices, and it visibly re-arranges M01 patches in High. **Not a production replacement.** Nothing was merged, deployed or opened as a PR.

| Document | Content |
|---|---|
| [`PERFORMANCE.md`](PERFORMANCE.md) | cost centres, static instruction estimates, SwiftShader wall time, memory, device protocol |
| [`VISUAL_REVIEW.md`](VISUAL_REVIEW.md) | default compatibility, criterion-by-criterion visual assessment, image statistics |
| [`DECISION.md`](DECISION.md) | classification, recommended mobile strategy, open items |

Status labels:
- **TECHNICAL:** default path validated; candidate functional.
- **VISUAL:** candidate changes patch placement; Mobile small, High M01 perceptible.
- **OWNER ART:** pending, not requested.
- **PRODUCTION PERFORMANCE:** unverified, no devices.

## Verified baseline

| Item | Value |
|---|---|
| Repository | `Algolon/Aurora-Rest` (Feh-Lu-We untouched) |
| Protected MAT-01 baseline | `feature/mat-01-terrain-material-architecture` @ `ae8a9c17781cdaa85c9e55696697c6213a860ef6` (remote head re-verified; never modified) |
| Verification worktree | detached checkout of `ae8a9c1`, clean before and after all runs |
| Baseline tests / build | 41/41 pass, build pass (re-run in the untouched worktree) |
| Baseline browser gate | 14/14 PASS; values identical to the MAT-01 record (parity 0.0014, re-tiling Δ 0, LOD Δ ≤ 3, lifecycle 6 → 2 → 6) |
| Baseline evidence | 70/70 MAT-01 images present; 67 hashes verify; **3 had no recorded hash (pre-existing gap)** |
| Repository instructions | `AGENTS.md` (MAT-01 lineage) and `docs/project/{PROJECT_STATE,SESSION_PROTOCOL}.md` on `docs/aurora-rest-rebaseline-2026-10-23` read; MAT-01P scope matches "independent fragment cost feasibility from pinned MAT source" |
| Other branches | POP-02A / ENV-P01 source not present on GitHub; WTR, GEO and asset branches were not touched |

**Pre-existing MAT-01 evidence gap**: three images have no hash in `docs/mat-01/evidence/manifest.json` @ `ae8a9c1`. The MAT-01 capture tool omitted hashes for its invariance screenshots. SHA-256 values computed now from the files at `ae8a9c1`, for identification only:

| File | SHA-256 (post-hoc) |
|---|---|
| `tile-seam-200m.png` | `2cc1f833712817391f9530eff3b06ddd94d4fe8e1dc5d482a61b730b1f1d9384` |
| `lod-wireframe-ortho.png` | `be0ccb9873268a866f3590c9661038597944a4fa8cdafd1652f69964b0fc25db` |
| `lod-shaded-valley.png` | `948dd5bda2f097afcbe6660905c8411dff50343ca9bb0c3e5a11064ca7660841` |

## Experimental branch

`experiment/mat-01p-material-performance`, created from `ae8a9c1`. Commit chain:

| Commit | Content |
|---|---|
| `25d5e52` | opt-in baked-noise candidate, profiling tools, 4 tests (verified WIP checkpoint) |
| `f681cdc` | static SPIR-V evidence, noise statistics, repetition diagnostics |
| `7fa2437` | bounded SwiftShader benchmark (2 passes × 6 configurations), partial ablation |
| `f4ebf87` | camera-injection anchor fix, dry nadir centres |
| `be64adf` | `PERFORMANCE.md` |
| `c6ff025` | matched WebGL regression evidence |
| *this commit* | review documents, gate results, evidence index |

The final head is the commit adding this file: `git log -1 --format=%H -- docs/mat-01p/README.md`.

### Exact source changes vs `ae8a9c1`

Six files changed, 161 insertions, 28 deletions. No change to classification, query, materials, rules, terrain data, water or routes.

| File | Change |
|---|---|
| `src/terrain-material/render/shader.ts` | **+24 / −0.** `#ifdef TM_BAKED_NOISE` helper (`tmFbmB`, one `textureGrad` fetch) and `#ifdef/#else` around 4 call sites (anti-tile mask, meso, ecotone, patches ×2). Original lines kept verbatim in `#else`; streaks stay procedural. |
| `src/terrain-material/render/terrain-material.ts` | optional `BakedNoiseTexture` constructor argument → owned `noise` texture, `TM_BAKED_NOISE` define, `-baked` program cache key, `memoryBytes.noise`, `textures` getter so `dispose()` releases 4 or 5 textures. Defaults unchanged. |
| `src/terrain-material/textures.ts` | `synthesizeNoiseTexture(512, 32)`: 4-channel tileable fBm with the shader's value-noise basis and octave weights. |
| `src/mat-01/main.ts` | review page: Noise selector, `?noise=baked`, `setNoise()`, `buildResources()` shared by profile switch and lifecycle test. |
| `tools/mat-01/browser-check.mjs` | `--noise` option; lifecycle check uses the owned texture count. |
| `tests/mat-01p.test.ts` | 4 tests (below). |

New tools (`tools/mat-01p/`):

| Tool | Purpose |
|---|---|
| `profile.mjs` | ablation and benchmark via served-module rewriting; two-resolution fragment cost |
| `shader-stats.mjs` | exact WebGL shader → SPIR-V counts |
| `compare.mjs` | matched baseline/candidate captures with injected nadir cameras |
| `compare-images.py` | statistics, composites, repetition test |
| `noise-stats.ts` | noise statistics |
| `package-evidence.py` | evidence packaging |

## Tests and gates (final branch)

| Check | Result | Evidence |
|---|---|---|
| `npm test` | **45/45** (29 GEO + 12 MAT-01 + 4 MAT-01P) | — |
| Typecheck / build | pass (worker and material chunks built) | — |
| MAT-01P tests | default shader text ≡ MAT-01 hash; no profile enables the candidate; noise texture deterministic, tileable, 4 decorrelated channels; distribution and per-material patch coverage within tolerance | `tests/mat-01p.test.ts` |
| Browser gate, baked OFF | 14/14, values identical to baseline | `gates/browser-check-procedural.json` |
| Browser gate, baked ON | 14/14 (shader compile, 4 materials, 3 profiles + switching, parity 0.0014, re-tiling Δ 0, LOD Δ ≤ 3, lifecycle 7 → 2 → 7, no page errors) | `gates/browser-check-baked.json` |

## Evidence index

| Path | What |
|---|---|
| `regression/manifest.json` | 5 runs × 10 views, per-shot original PNG SHA-256 and committed-file SHA-256, profile, noise mode, memory, errors |
| `regression/summary.json` | identity and candidate statistics per view, repetition autocorrelation, composite hashes |
| `regression/{base-high,cand-high-baked,base-mobile,cand-mobile-baked}/` | matched screenshots (JPEG q88 of lossless captures); `cand-high-default` files were byte-identical to `base-high` and are represented by hash only |
| `regression/composites/` | baseline \| candidate \| Δ×4, plus the M01 foreground detail |
| `profile/shader-stats-*.json`, `*.frag`, `*.opt.spv` | exact WebGL fragment shaders and optimised SPIR-V (hashes recorded and re-verified) |
| `profile/bench-pass{1,2}/` | bounded SwiftShader benchmark, 6 configurations |
| `profile/ablation-partial/` | first ablation run, 4 of 16 variants (stopped deliberately) |
| `profile/noise-statistics.json` | procedural vs baked distribution and patch coverage |
| `gates/` | both browser-gate results |

Environment for every measurement:
- Chromium 141.0.7390.37, ANGLE → Vulkan → **SwiftShader** (software)
- Node 22.22, three r186, Linux container, no GPU
- glslang 15.1 / SPIRV-Tools 2025.1, installed as system tools, not project dependencies

## Remaining limitations

- **No device measurements.** No Android or desktop FPS is claimed. SwiftShader inverts the usual fetch/ALU cost ratio, so its results cannot settle the question in either direction.
- Static counts measure one material-loop iteration and ignore scheduling, precision (mediump), cache behaviour and texture-unit throughput.
- Baked noise tiles every 32 lattice cells (103–373 m depending on the mask). No repetition was measurable, but this was not checked at every scale and lighting.
- The candidate covers 5 of 6 noise call sites; rock streaks stay procedural.
- One fixed benchmark view; transition-heavy and far-field mixes may differ.

## Device-testing recommendation

Follow `PERFORMANCE.md` §5:
- One fixed view and mesh.
- Five configurations: MAT-01 High, MAT-01 Mobile, candidate Mobile, Mobile with no fBm, plain Lambert.
- Measure with GPU timer queries where available, otherwise 300-frame frame-time.
- Devices: one desktop discrete GPU, one mid-range Android (Mali-G57/G68 or Adreno 6xx class), one low-end Android.
- Report the candidate's gain as a fraction of the procedural → no-fBm gap. Test the logarithmic-depth (early-Z) and anisotropy levers on the same devices.

## Entry for the central project-state dossier

> **MAT-01P — Material performance & integration readiness** (2026-10-23).
> Branch `experiment/mat-01p-material-performance` from MAT-01 `ae8a9c1`; head = commit adding `docs/mat-01p/README.md`.
> **Outcome: EXPERIMENTAL ONLY.** An opt-in baked-noise path (`TM_BAKED_NOISE`) replaces 5 procedural fBm calls with filtered texture fetches.
> Default OFF in all profiles and proven identical to MAT-01 (identical SPIR-V; 10/10 identical PNG files; identical gate).
> Static estimate: ALU −51 % High / −40 % Mobile at +5/+3 texture samples. SwiftShader wall time inconclusive (−0.9 % / −6 %, within noise). **No device data.**
> Visual: a different but statistically matched patch arrangement; small in Mobile, **perceptible in the High M01 walking-height reference view** (mossier foreground).
> Tests 45/45, build pass, browser gate 14/14 OFF and ON, lifecycle and profile switching verified.
> **Do not adopt without device evidence and owner art approval.** Next: device profiling per `docs/mat-01p/PERFORMANCE.md` §5.
> MAT-01 remains the protected baseline. Pre-existing MAT-01 evidence gap: 3 invariance images lack recorded hashes (post-hoc hashes in `docs/mat-01p/README.md`).
