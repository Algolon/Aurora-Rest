# POP-02A — nature asset integration review

**Technical integration implemented and tested. Streaming performance conditional; owner art approval open.**

Branch: `feature/pop-02a-nature-asset-integration`, from exact POP-01 `4afbb6f9598a1611df53d0c9f61b6fd1845a3fc7`, whose parent is canonical geography `90d0cb745e8e51a3dc737bd4dc11d6f8c322758b`. Initial integration checkpoint: `2b01a572d7db47654940489abaa77a82ece48245`; final handoff manifest records the final review commit. Local only: no push, merge, publication or deployment.

[Visual review](review.html) · [QA and artistic assessment](QA.md) · [Asset compatibility](ASSET_COMPATIBILITY.md) · [Architecture](ARCHITECTURE.md) · [Performance](PERFORMANCE.md) · [MAT/WTR reconciliation audit](MAT_WTR_COORDINATION.md)

## Delivered

* Original POP-01 recovered and reproduced; its placement code and canonical data remain hash-identical.
* Isolated source library: birch/pine (three variants, source LODs), four source grass variants and four production rocks only (seeds 11,23,37,53). Full provenance and explicit grass batch compatibility patch.
* Real source-family batches driven by POP descriptors, per-page atomic replacement/disposal, shared family ownership, terrain-oriented grass/rocks, conservative rock-footprint suppression and stable ID-based grass fade phases.
* Web Worker near-priority generation with one job in flight and stale-target cancellation. At most one coalesced page activates per frame; page construction still stalls.
* `pop-02a.html` with proxies/source assets, density, seed, page sizes, backends, LOD, grass policies/fade, warm/cool light, shadows, inspection and 17 actual-world cameras.
* 58 passing automated tests; passing TypeScript/Vite build; actual WebGL comparisons, source-fidelity gate, contact sheet, full-resolution captures, actual keyboard walking frames/replay and measured performance limitations.

## Reproduce

```sh
npm ci --no-audit --no-fund
npm test
npm run build
npm run dev
# open /pop-02a.html; /pop-01.html remains intact
CHROME=/path/to/chromium node tools/pop-02a/fidelity.mjs
# The following start/stop their own Vite preview after npm run build:
CHROME=/path/to/chromium node tools/pop-02a/capture.mjs
CHROME=/path/to/chromium node tools/pop-02a/supplement.mjs
CHROME=/path/to/chromium node tools/pop-02a/final-validation.mjs
python3 tools/pop-02a/media.py
python3 tools/pop-02a/review.py
```

`capture.mjs` deliberately switches configurations for comparison. The retained first full series used 256 m / auto pages; `final-*.png` records the selected 128 m / instanced default. The source matrix/depth comparison's geographic pose has 71 small pixel differences; studio comparison and matched full-forest backend comparison are exact. See QA for scope, tolerances and negative control.

`extract.py` is a one-time pinned transitive extraction helper; it refuses an existing destination to protect reviewed compatibility fixes. Normal reproduction uses the already committed source modules, not re-extraction. Imported source whitespace is deliberately retained for byte fidelity; the small compatibility patch includes original blank context lines.

## Remaining gates / POP-02B proposal (not started)

1. **Activation performance first:** keep the unchanged placement engine, but make buffer/page registration resumable or use bounded reusable handle pools with explicit page eviction. Avoid hiding an entire dirty page while retaining full cleanup. Prove max-frame behavior rather than average FPS.
2. Profile canonical-query duplication, JS heap and real GPU resources on desktop and Android. Choose page/backend/density/visibility profiles from device data; do not infer Android readiness from SwiftShader.
3. Review a shared environment-data contract with MAT/GEO/WTR before using material weights as placement authority. Geometric contact and exact water safety must remain independent from blended shading.
4. Artistically review the source trees/grass/production stones, then address forest-floor continuity, patch/edge composition and a short hiking corridor. The bare neutral floor and separated tufts currently miss the premium target. More uniform scattering is not the solution.
5. Resolve source LOD reset transitions, optional near grass shadows and camera/view clearances only through a scoped reviewed follow-up. New shrubs, litter, heath or sedge families require their own approval.

No full-island population, geography edits, MAT/WTR merges, premium rock work, new vegetation families or production terrain streaming was started. Stop after this review package.
