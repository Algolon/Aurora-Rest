from pathlib import Path
import json,statistics,subprocess
root=Path('docs/env-p01');r=json.loads((root/'evidence/runtime.json').read_text());s=json.loads((root/'evidence/supplement.json').read_text())
assert not r.get('failure'),r.get('failure');assert not s.get('failure'),s.get('failure');assert not r['errors'] and not s['errors']
faithful='73fcfa7d237092f335c86f8afa024ee7ae1ddb49'
r['implementationCommit']=faithful;r['sourceFieldMeaning']='Observed HEAD at capture start, before committing the already implemented faithful integration. implementationCommit identifies those source bytes.'
(root/'evidence/runtime.json').write_text(json.dumps(r,separators=(',',':')))
neutral=r['measurements'][0];mat=r['measurements'][1];g=mat['ground'];page_times=[p for v in r['measurements'] for p in v['timing']['pageTimes']]
text=f'''# ENV-P01 measured costs and limits

Browser: {r['browser']}. Renderer: {r['gl']}. 1600 × 1100, DPR 1. All measurements are SwiftShader software rendering, not physical desktop or Android hardware.

## Preparation and initial load

First capture run: initial ready {r['initialReadyMs']:.0f} ms. MAT adapter load/preparation {g['loadMs']:.1f} ms; classification stages `{json.dumps(g['classificationMs'])}`; texture synthesis {g['synthesisMs']} ms; worker total {g['workerTotalMs']} ms. Both 512² and 256² texture sets are prepared once off-thread for reversible profile switching. This is an ENV load policy, not a change to source texture generators.

Separate sequential parity run: original POP ready {s['originalReadyMs']:.0f} ms; ENV ready {s['integratedReadyMs']:.0f} ms. This one-pair observation is not a controlled cache-independent load benchmark; use the worker/preparation breakdown to identify the new work rather than attributing the entire ready-time difference to the shader.

## Incremental scene costs

| Original-camera mode | Calls | Triangles | Geometries | Renderer textures | Programs |
|---|---:|---:|---:|---:|---:|
| Neutral | {neutral['renderer']['calls']} | {neutral['renderer']['triangles']} | {neutral['renderer']['memory']['geometries']} | {neutral['renderer']['memory']['textures']} | {neutral['programs']} |
| Faithful MAT | {mat['renderer']['calls']} | {mat['renderer']['triangles']} | {mat['renderer']['memory']['geometries']} | {mat['renderer']['memory']['textures']} | {mat['programs']} |

Ground integration adds no terrain geometry or draw calls in this matched view. One additional terrain shader program appears. The adapter explicitly owns four texture resources; the first observed renderer texture-count delta is {mat['renderer']['memory']['textures']-neutral['renderer']['memory']['textures']}. Any additional renderer-internal allocation beyond the four owned textures has not been independently attributed. Later neutral toggles retain MAT resources intentionally and must not be treated as fresh allocation baselines.

MAT high-profile estimated texture allocation including mip chains: {g['gpuBytes']['total']/1048576:.2f} MiB ({g['gpuBytes']['classification']/1048576:.2f} classification + {g['gpuBytes']['detail']/1048576:.2f} detail). Renderer counters are allocation counts, not measured resident GPU bytes. Shared source nature assets remain separate from these estimates.

## Matched static API-return timing sample

Same original forest-interior pose, unchanged population, paused animation. Each sample drains previous work, times renderOnce() followed by WebGL finish(), then stops. The observed browser API return does not independently prove completion in the separate GPU process. First sample is warmup; remaining two are listed below. These are browser render/finish API-return durations, not GPU timer queries, real-time FPS or an Android estimate. No PNG encoding is included. Two samples do not establish a percentile distribution.

| Profile | Surface | Warmup ms | API-return samples ms | Mean ms |
|---|---|---:|---|---:|
'''
for b in s['benchmarks']:text+=f"| {b['profile']} | {b['mode']} | {b['warmupMs']:.1f} | {', '.join(f'{x:.1f}' for x in b['samplesMs'])} | {statistics.mean(b['samplesMs']):.1f} |\n"
text+=f'''
## Existing stalls and resource lifecycle

Largest recorded source page construction in the main capture run: {max(page_times):.1f} ms. This is the pre-existing POP-02A synchronous activation path; it remains unsolved and exceeds a production frame budget. Per-camera worker totals, page times, registrations, renderer memory, CPU submission times and frame interval arrays remain in runtime.json. The inherited POP frame-interval metric discards intervals ≥10 seconds, so it is not a complete long-stall distribution. Capture readback wall times include queued work, synchronization and PNG encoding and must not be used as isolated MAT cost or FPS.

Two balanced/mobile/high recreation cycles preserve placement hashes, one resource owner, and identical high-profile geometry/texture counters. Shader program counts are recorded per cycle; cache reuse is separate from texture ownership. Full viewer teardown completes without exceptions in the tested scenario. These are tested lifecycles, not a claim that every possible navigation/resize/error lifecycle is proven leak-free.

A retained drawing buffer and explicit pause/readback controls support deterministic screenshot export. The retained buffer is additional framebuffer storage, outside MAT's texture estimates. The original POP viewer is unchanged and is independently checked for camera and full-descriptor parity.

## Validation scope

`npm test`: 74/74 (58 pre-existing POP-side tests + 12 imported MAT tests + 4 ENV tests). `npm run build`: TypeScript + Vite passes. Original MAT modules are hash-identical; no compatibility patch was required. Relevant integration browser checks cover all required scenes, profiles, unchanged descriptors/terrain buffers, proxy mode, lifecycle and explicit full teardown. No browser or GLSL errors were observed. The original standalone MAT browser gate was not rerun; its prior acceptance is not presented as new ENV evidence.

No physical device, real-time walk benchmark, GPU elapsed query, island-wide population, full-world streaming or water-shader integration is claimed.
'''
(root/'PERFORMANCE.md').write_text(text)
qa={'implementationCommit':faithful,'automated':{'tests':74,'passed':74,'build':'pass'},'browserChecks':r['checks']+s['checks'],'errors':r['errors']+s['errors'],'technicalIntegration':'pass in earlier tested scenarios; final source-history gate blocked after environment resume','visualReviewCandidate':'conditional: continuity improved, edge coherence and composition incomplete','artApproval':'pending owner review','passB':'no presentation adjustment retained','captureCount':len(r['measurements'])+len(s['measurements'])}
(root/'QA.json').write_text(json.dumps(qa,indent=2))
print('Final performance and QA reports written',qa['captureCount'])
