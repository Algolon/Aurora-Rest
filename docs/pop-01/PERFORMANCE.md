# POP-01 performance evidence

CPU placement measurements; native FPS is unverified. The benchmark ran in Node on AMD EPYC 9V74 80-Core Processor (linux x64). Query-index initialization: 153.0 ms.

Each row uses the same aligned **512 × 512 m footprint** for its region. Descriptor counts are identical at different chunk sizes. This is a CPU generation benchmark, not rendered coverage or GPU cost. Timings are one measured sweep; no statistical device guarantee is implied.

| Region | Chunk edge | Chunks | Descriptors | Median chunk ms | Max chunk ms | JSON MB |
|---|---:|---:|---:|---:|---:|---:|
| Birchwood Forest | 64 | 64 | 11516 | 5.2 | 10.5 | 7.16 |
| Birchwood Forest | 128 | 16 | 11516 | 22.9 | 35.5 | 7.15 |
| Birchwood Forest | 256 | 4 | 11516 | 88.5 | 112.1 | 7.15 |
| Central Valley | 64 | 64 | 15784 | 5.4 | 10.1 | 9.60 |
| Central Valley | 128 | 16 | 15784 | 19.7 | 38.0 | 9.60 |
| Central Valley | 256 | 4 | 15784 | 78.2 | 94.9 | 9.60 |
| Home Cove dry apron | 64 | 64 | 8797 | 7.0 | 12.2 | 5.45 |
| Home Cove dry apron | 128 | 16 | 8797 | 29.6 | 46.2 | 5.45 |
| Home Cove dry apron | 256 | 4 | 8797 | 117.3 | 127.2 | 5.43 |

The complete report includes sparse (0.5), default (1.0) and dense (2.0) scenarios for each region and chunk size: 27 scenarios. Density is an artistic multiplier, not a per-hectare guarantee. Culling, species and ground-cover limits are rendering concerns.

**Decision:** default to 64 m generation chunks. Their approximately 5–7 ms median work here is substantially shorter than 128/256 m units, but maxima still exceed the 8 ms soft budget. Native Android can be slower. Move generation to a worker or make it resumable before production camera streaming. Benchmark render-page aggregation with the source tree batches; 64 m generation chunks need not become separate production draw groups.

Memory snapshots in `benchmarks.json` include terrain, water, feature data and temporary edge-index construction garbage. UTF-8 descriptor length is measured separately. It is not a JS heap-size estimate. No whole-island descriptor count or heap allocation is extrapolated from local sampling. The active population cache is bounded; the canonical geographic arrays are retained separately.

Browser results, draw calls/triangles, per-view submitted proxy counts and lifecycle checks are in `evidence/runtime.json`. The local terrain mesh and static full water mesh contribute a large fixed triangle cost. These numbers are **diagnostic-proxy submission costs**, not production foliage/grass benchmarks. No desktop 60 FPS / Android 30 FPS claim is made.
