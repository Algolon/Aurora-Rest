# POP-02A measured rendering and activation behavior

**Software Chromium/SwiftShader only. Not native Android or desktop GPU FPS.**

The first full run measured six page/backend transitions but its timing arrays retained prior samples. The supplement resets timing arrays per transition; the table below uses those isolated windows. Values are one observed run, not statistical device guarantees. Some setup/GC/compiler scheduling noise remains; do not rank real devices from these numbers.

| Backend | Page edge | Pages | Registered | Page build samples ms | Max page ms | Sum page ms | Draw calls | Triangles |
|---|---:|---:|---:|---|---:|---:|---:|---:|
| instanced | 128 | 9 | 4894 | 307.7 / 104.8 / 152.8 / 137.6 / 148.5 / 142.7 / 143.9 / 142.9 / 130.9 | 307.7 | 1411.8 | 85 | 471677 |
| instanced | 256 | 4 | 4894 | 320.0 / 126.1 / 263.7 / 612.0 | 612.0 | 1321.8 | 63 | 471677 |
| instanced | 512 | 2 | 4894 | 1958.1 / 352.0 | 1958.1 | 2310.1 | 43 | 471677 |
| multidraw | 128 | 9 | 4894 | 1178.4 / 548.3 / 657.5 / 770.0 / 688.5 / 622.0 / 508.5 / 741.4 / 324.0 | 1178.4 | 6038.6 | 43 | 426233 |
| multidraw | 256 | 4 | 4894 | 684.6 / 712.0 / 599.9 / 4.2 | 712.0 | 2000.7 | 37 | 426233 |
| multidraw | 512 | 2 | 4894 | 1721.7 / 12.7 | 1721.7 | 1734.4 | 27 | 426233 |

**Final provisional choice: instanced 128 m pages.** This had the smallest maximum page-construction observation (~308 ms here) and lower renderer texture counters, trading more draw calls for smaller activation units. Instanced 256 m had a slightly lower aggregate page-build sum but a higher maximum (~612 ms). Native multi-draw reduced draw calls, but did not win page construction in this session. Rendering-page size is not yet hardware-approved.

This is still far outside an interactive frame budget. The architecture removes chunk generation from the main thread, limits it to one in-flight worker job, coalesces chunk updates and activates at most one render page per frame. It **does not** make a whole source page preemptible. Dirty pages are hidden until replacement, causing temporary disappearance; first allocations, shader compilation, CPU source-batch registration and uploads remain blockers. No average FPS figure is used to hide these spikes.

Reported worker generation duration is CPU placement work in the Worker. Page build includes source-batch construction, registrations, visibility initialization and buffer staging. CPU `renderer.render` durations include submission and possible upload/driver synchronization; they are not isolated GPU elapsed time. rAF intervals include software rendering and scheduling. Raw samples and maxima are retained in `runtime.json`, `supplement.json` and `final-validation.json`.

Renderer calls/triangles include terrain, static canonical water, camera and shadow submissions. Multi-draw can internally cull retained shadow geometry in a camera pass, so submission counts differ from the instanced backend even though the matched interior images are pixel-identical. `renderer.info.memory` counts geometry/texture objects, not GPU bytes.

Real-batch repeated region unload/re-entry is stable for descriptor IDs, registered source counts and renderer counters in both the original 256 m/native run and the final 128 m/instanced run. This does not certify an arbitrary native driver or prove complete JS heap stability. Worker query data/index memory is duplicated versus the render-thread geographic context and requires device profiling.
