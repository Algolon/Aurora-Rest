# POP-02A architecture and streaming decision

## Recovery and isolation

The existing clean POP-01 worktree and portable bundle both resolve to `4afbb6f9598a1611df53d0c9f61b6fd1845a3fc7`, whose direct parent is `90d0cb745e8e51a3dc737bd4dc11d6f8c322758b`. `git bundle verify` passed. Baseline tests reproduce 42/42 and TypeScript/Vite build passes. The new isolated worktree/branch is `feature/pop-02a-nature-asset-integration`, from that exact checkpoint. This is the owner's milestone-specific ancestry exception; repository policy files are unchanged. Nothing is pushed, merged or deployed.

POP-01 `src/pop-01` and canonical geography/hydrology are hash protected. POP-02A owns new rendering/worker adapters, not placement rules. The original POP-01 proxy viewer remains available; `pop-02a.html` adds source assets and a proxy comparison mode.

## Generation chunks versus render pages

Generation remains the unchanged 64 m deterministic world-coordinate engine. Render pages are independently configurable at 128 / 256 / 512 m; the final provisional default is 128 m with the instanced backend. Source batches share family geometry/materials across pages. Their original insertion/visibility/update/dispose interfaces are preserved. No invisible registry is allowed to grow indefinitely while roaming.

`RenderPageStore` keeps one bounded desired chunk set and one current immutable batch page per page key. Attach/replace records desired data and marks the page dirty. Detach removes desired descriptors immediately. A dirty resident page is hidden until replacement; empty pages dispose immediately. Rebuild constructs a complete new page, updates it, swaps ownership only on success, then physically disposes the old source batch handles/instance buffers. A failing factory cleans partial source allocations, and a failing initial update disposes its prospective page while retaining the former hidden page for a retry. No shared family geometry/material is disposed by page release. Final renderer disposal releases pages before family owners.

A page is rebuilt from IDs sorted in a locale-independent order; there is no hidden archive of unloaded populations. Re-entry reconstructs the same placements, subject to the source LOD selector's normal camera/history behavior. Rebuilding resets source LOD hysteresis state, so a tree in a hysteresis band can choose a different transient LOD from a continuously resident tree. This is a visibility limitation, not a transform or identity change.

Grass suppression uses all currently active neighboring-page rocks. A 6 m conservative halo covers current maximum transformed source rock + grass footprint bounds. Adjacent pages affected by incoming/outgoing rocks are invalidated as well. This is a rendering eligibility adjustment, never a rewrite of the generator or global biome data.

## Streaming options compared

| Option | Benefit | Limitation / decision |
|---|---|---|
| Web Worker | Removes whole synchronous chunk placement calls and geographic indexing from the render thread; unchanged generator gives exact output parity | Duplicates canonical query data/index memory; does not create or upload WebGL resources |
| Resumable main-thread generator | Could obey a fine step budget without worker data duplication | Would require changing tested sampling/halo traversal and carrying generator continuation state; deferred to avoid a placement-engine rewrite |
| Hybrid worker generation + scheduled page activation | One worker job in flight, near-first target queue, stale-epoch cancellation, at most one page construction per animation frame | Selected; page construction and first render submission remain synchronous and may exceed budget substantially |

`WorkerPopulationStream` sends only one job at a time. Target changes cancel pending old jobs, remove undesired active chunks and ignore stale completion epochs. It does not launch an uncontrolled full-world batch. Current in-flight synchronous worker work cannot be interrupted, but its result cannot activate a former target. Worker errors are surfaced; there is no silent fallback to main-thread island generation.

Page activation waits until the current desired chunk queue settles, coalescing many attachments rather than rebuilding on every chunk message. At most one page activates per frame. This is a **measured conditional streaming solution**, not a claim of hitch-free production motion: dirty pages temporarily disappear, page rebuilds can be costly, and shader compilation/first uploads can stall. A subsequent performance milestone must implement finer activation or bounded reusable slots without compromising shared resource ownership.

## Metrics and rendering ownership

Worker generation time, page construction/initial CPU visibility, subsequent camera update time, CPU `renderer.render` submission duration and rAF intervals are reported separately. A render-submission duration is not a GPU elapsed query. rAF intervals in SwiftShader are not native Android FPS. Renderer calls/triangles include terrain, static canonical water, source asset camera and shadow passes. Registered source slots, generated descriptors and submitted source instances are separate values; grass footprint/policy suppression explains differences.

The final review defaults to explicit instancing; the optional auto mode chooses native multi-draw only when `WEBGL_multi_draw` is actually available; instanced fallback is selectable. Page-size/backend comparisons use the same POP descriptors and camera. Near/mid/far geometry and 22/36/62 m source LOD thresholds are preserved, as are the source grass 13 m and D2R refined 19 m fades.

The neutral 1024 m terrain patch and static blue canonical water are review context only. There is no MAT or WTR shader integration, no geography editing, no full-island terrain streaming and no physical tree/rock collision system. Review cameras come from verified anchors, actual POP descriptors, canonical route candidates and dry shoreline searches. The route corridor is provisional, not an approved final hiking path.

## Final default decision

The isolated 6-scenario comparison found the smallest maximum page-construction observation with instanced 128 m pages (~308 ms here). Instanced 256 m had a slightly lower sum but a larger maximum (~612 ms); native multi-draw reduced draw calls while exhibiting larger construction peaks in this session. The final provisional 128 m / instanced profile trades additional draws for finer activation units and fewer renderer texture allocations. All of these spikes remain far above a production frame budget. This is a local software-browser decision, not proof of native hardware superiority. The earlier 34-shot comparison series deliberately retains its recorded 256 m / auto settings; `final-*.png` and `final-validation.json` record the selected default.
