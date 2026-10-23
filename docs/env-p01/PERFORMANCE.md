# ENV-P01 measured costs and limits

Browser: 153.0.8010.0. Renderer: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). 1600 × 1100, DPR 1. All measurements are SwiftShader software rendering, not physical desktop or Android hardware.

## Preparation and initial load

First capture run: initial ready 10393 ms. MAT adapter load/preparation 6669.7 ms; classification stages `{"slopeCurvature": 140, "distances": 557, "coarseFields": 366, "rules": 1887, "total": 2950}`; texture synthesis 1691 ms; worker total 4673 ms. Both 512² and 256² texture sets are prepared once off-thread for reversible profile switching. This is an ENV load policy, not a change to source texture generators.

Separate sequential parity run: original POP ready 3446 ms; ENV ready 18103 ms. This one-pair observation is not a controlled cache-independent load benchmark; use the worker/preparation breakdown to identify the new work rather than attributing the entire ready-time difference to the shader.

## Incremental scene costs

| Original-camera mode | Calls | Triangles | Geometries | Renderer textures | Programs |
|---|---:|---:|---:|---:|---:|
| Neutral | 85 | 471677 | 13 | 7 | 5 |
| Faithful MAT | 85 | 471677 | 13 | 12 | 6 |

Ground integration adds no terrain geometry or draw calls in this matched view. One additional terrain shader program appears. The adapter explicitly owns four texture resources; the first observed renderer texture-count delta is 5. Any additional renderer-internal allocation beyond the four owned textures has not been independently attributed. Later neutral toggles retain MAT resources intentionally and must not be treated as fresh allocation baselines.

MAT high-profile estimated texture allocation including mip chains: 41.22 MiB (30.55 classification + 10.67 detail). Renderer counters are allocation counts, not measured resident GPU bytes. Shared source nature assets remain separate from these estimates.

## Matched static API-return timing sample

Same original forest-interior pose, unchanged population, paused animation. Each sample drains previous work, times renderOnce() followed by WebGL finish(), then stops. The observed browser API return does not independently prove completion in the separate GPU process. First sample is warmup; remaining two are listed below. These are browser render/finish API-return durations, not GPU timer queries, real-time FPS or an Android estimate. No PNG encoding is included. Two samples do not establish a percentile distribution.

| Profile | Surface | Warmup ms | API-return samples ms | Mean ms |
|---|---|---:|---|---:|
| high | neutral | 2.5 | 2.4, 2.0 | 2.2 |
| high | material | 24.2 | 2.5, 1.2 | 1.8 |
| balanced | neutral | 1.7 | 1.1, 0.9 | 1.0 |
| balanced | material | 36.8 | 5.2, 4.8 | 5.0 |
| mobile | neutral | 2.1 | 1.7, 1.4 | 1.6 |
| mobile | material | 42.2 | 1.2, 0.8 | 1.0 |

## Existing stalls and resource lifecycle

Largest recorded source page construction in the main capture run: 7072.0 ms. This is the pre-existing POP-02A synchronous activation path; it remains unsolved and exceeds a production frame budget. Per-camera worker totals, page times, registrations, renderer memory, CPU submission times and frame interval arrays remain in runtime.json. The inherited POP frame-interval metric discards intervals ≥10 seconds, so it is not a complete long-stall distribution. Capture readback wall times include queued work, synchronization and PNG encoding and must not be used as isolated MAT cost or FPS.

Two balanced/mobile/high recreation cycles preserve placement hashes, one resource owner, and identical high-profile geometry/texture counters. Shader program counts are recorded per cycle; cache reuse is separate from texture ownership. Full viewer teardown completes without exceptions in the tested scenario. These are tested lifecycles, not a claim that every possible navigation/resize/error lifecycle is proven leak-free.

A retained drawing buffer and explicit pause/readback controls support deterministic screenshot export. The retained buffer is additional framebuffer storage, outside MAT's texture estimates. The original POP viewer is unchanged and is independently checked for camera and full-descriptor parity.

## Validation scope

Before resume, `npm test`: 74/74 (58 pre-existing POP-side tests + 12 imported MAT tests + 4 ENV tests). `npm run build`: TypeScript + Vite passes. Original MAT modules are hash-identical; no compatibility patch was required. Relevant integration browser checks cover all required scenes, profiles, unchanged descriptors/terrain buffers, proxy mode, lifecycle and explicit full teardown. No browser or GLSL errors were observed. The original standalone MAT browser gate was not rerun; its prior acceptance is not presented as new ENV evidence.

No physical device, real-time walk benchmark, GPU elapsed query, island-wide population, full-world streaming or water-shader integration is claimed.

## Post-resume preservation check

After restoring the exact canonical terrain bytes and dependencies, build passes; the full suite is 73/74. The sole failing check needs the unavailable original POP Git object store. The protected-file hashes and imported MAT provenance checks pass. See RECOVERY_STATUS.md; final milestone acceptance is blocked until the source history is restored. API-return values above must not be treated as verified GPU rendering speed.
