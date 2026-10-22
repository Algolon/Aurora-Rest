# GEO-R02C-P0 — Calibration Infrastructure

**Review candidate. No terrain geometry, design master, R1 artifact or existing test was changed.** Branch `feature/geo-r02c-p0-calibration-infra`, created from the verified R1 checkpoint `b6784a992df75e3e628f8211c6aff6cbf9e8eb24` under the one-time AGENTS.md exception approved for P0. The work was done in an isolated clone; the Codex worktree and the R1 branch were not touched. Nothing is merged or deployed. **The branch is not pushed** (push not authorized).

Labels used throughout:
* **reproduced** — re-run in this P0 environment with the stated result.
* **recorded** — Codex evidence, not re-run here.
* **inferred** — follows from reproduced evidence but was not observed directly.
* **hypothesis** — an untested explanation.

[Matched baseline renders](review.html) · [Convergence](convergence.md) · [Cross-platform reproducibility](reproducibility.md)

## 1. Git provenance (reproduced)

* `origin/codex/geo-r02b-a-r1-terrain-skeleton` resolves to `b6784a992df75e3e628f8211c6aff6cbf9e8eb24`, which is a commit object. Its history contains every R1 milestone commit in the review manifest: `7e6ca22`, `70382ea`, `7438e6a`, `087e3c4`, `613c27d`, `fcb2ce3` and `b6784a9`, on top of `c3621ea` (WORLD-01B).
* The blob SHA-256 values at `b6784a9` match the manifest:

  | File | SHA-256 |
  |---|---|
  | `terrain.f32` | `fc8fd6da…1f946a` |
  | `features.json` | `8f538cef…ed0166e` |
  | `water-mesh.f32` | `d216a9be…2294d` |
  | `water-surface.f32` | `e233e4f8…54e5bc55` |
  | design master | `62cb154b…a0ec598` |

* `git archive b6784a9` is file-for-file identical to the source ZIP reviewed earlier (174 files).
* The P0 commits sit on top of `b6784a9`; `git log` on this branch shows them.

## 2. Numerical baseline (priority A–C)

### C. R1's reported guarantees (reproduced from the canonical binary)

| R1 claim | P0 result |
|---|---|
| Codex validators `validate.py`, `water-integrity.py`, `integrity.py` | Re-run unchanged in a disposable copy of the exact commit tree. 5 of 6 outputs are byte-identical to the committed reports. The 6th (`route-profiles-full.csv`) differs in one value by 8.4×10⁻¹⁵. |
| 0 material depressions and 0 smaller (>0.1 m, ≥64 m²) at 20, 8 and 4 m | Reproduced in R1's own convention (`tools/geo-r02c/lib/hydro.py: r1_convention_sinks`). A stricter whole-grid check (ocean and all wet cells drain): 0 sinks >0.1 m or >0.5 m at any area; max spill 3.3 cm. |
| Water surfaces: rise 0.027 m on `main-upper`, 0.0012 m on `south-fen-tributary` | Reproduced exactly. The 0.027 m rise sits at the three-way confluence (590, −770). |
| Six route centrelines dry and within grade; R1 3.4 m band figures | P0's own route code reproduces R1's 1 m profile CSV (max difference 8.4×10⁻¹⁵). All six routes are dry and within target. |
| 24/24 tests and build | Reproduced on this checkout before any P0 change (Node 22.22, Linux). |
| Browser controller traversal of all routes | Recorded only; not re-run in P0. |

No validation gate was weakened or reinterpreted. P0's proposed tolerances (5 cm water rise, tread criteria) are labelled as proposals and are not R1 gates.

### A. Fine-grid convergence — [convergence.md](convergence.md)

* **Reproduced:** R1's 4 m stage (240 fixed Jacobi sweeps) is not converged. Continuing it moves mainland cells by p99 8.1 m, max 24 m after +10,000 sweeps, and it is still moving.
* **Reproduced:** a converged obstacle solve of the same constraints (M0c) moves 22 % of mainland cells by more than 1 m.
* Most of that change lies within 300 m of the coast. That the coastal fixed band (20 m wide at 16 m, 5 m wide at 4 m) causes it is **inferred**.
* Curvature character and sink-freedom are unchanged by convergence, so non-convergence is **not** the cause of the membrane-like forms.
* **A windowed null re-solve (M0w) alone changes the North Peak window by p90 6 m.** For a fair A1 comparison, P0 recommends an *incremental* re-solve: H = R1 + Δ with Δ = 0 on all R1 constraints. Its null control is then byte-identical to R1. M0w is reserved as a drift reference.

### B. Cross-platform differences — [reproducibility.md](reproducibility.md)

* **Reproduced:** three Linux regenerations (including single-threaded) and a faithful instrumented replay are byte-identical (`19c5f839…`). Each takes about 3.5 minutes.
* **Reproduced:** canonical vs Linux: 629 cells differ by more than 1 cm, max 1.414 m, in one ~1 ha Upper Birchwood patch plus four north-west coast nodes. The crest active set is identical.
* **Verified by reproduction:** closed lake rings repeat their first vertex, so the KD nearest-vertex lookup in R1's `projection()` ties exactly near each seam and then inspects only one duplicate's segments.
  * A Linux replay with tie-aware projection applied to the Birchwood-upper ring only reproduces the canonical binary in all but 12 of 3,003,501 cells.
  * The four coast nodes lie on the coastline within 1.4×10⁻¹³ m and flip land/sea classification.
* **Unverified:** *why* `cKDTree` breaks the Birchwood-upper ties differently on macOS, and why the coast nodes flip. Mac intermediate arrays do not exist. A small Mac probe is specified in `reproducibility.md`. One 4.5 cm cell is unattributed.
* **Latent R1 defect (documented, not fixed):** independently of platform, the same seam ties make R1's lake rim and bed constraints use non-nearest distances, by up to 12.6 m (High Tarn), 16.3 m and 20.7 m (Birchwood). High Tarn is inside the A1 window.
* **Contract:**
  1. Canonical committed artifacts (R1's Mac binaries are permanent).
  2. Byte-identical regeneration in a declared Linux reference environment (`tools/geo-r02c/env/requirements.lock.txt`, hash-pinned and verified to install; plus `fingerprint.py`).
  3. Cross-platform equivalence with identical classification and feature tolerances.

  A blanket 2 m tolerance is rejected.

## 3. Validation infrastructure (implemented, tested)

| Tool | Purpose | Measured cost here (4-core Linux container) |
|---|---|---|
| `tools/geo-r02c/repro/r1_stages.py` | Hash-checked, in-memory instrumented replay of the R1 generator; stage dumps outside the repo; optional counterfactuals | 210 s (286 s / 217 s for counterfactuals); ~260 MB temporary dumps |
| `tools/geo-r02c/repro/platform_diff.py` | Canonical vs Linux attribution, ring-seam tie exposure, counterfactual comparison | 7.0 s (measured during a concurrent capture run); output identical on rerun |
| `tools/geo-r02c/repro/convergence.py` | Residuals, Jacobi continuation, converged M0c and windowed M0w controls | 664 s total (Jacobi +10,000 sweeps 507 s; M0c 64 s; M0w 23 s) |
| `tools/geo-r02c/baseline.py` | All baseline diagnostics on the canonical binary → `baseline/` | 89 s (sinks 67 s) |
| `tools/geo-r02c/invariance.py` | Window invariance: outside and frozen-ring byte identity, D8 receivers, water raster and mesh; `--self-test` | 3–4 s; self-test passes (R1 vs R1, core-only bump, outside change rejected) |
| `tools/geo-r02c/masks/A1-window-v1.json` | Provisional diagnostic window x −2000…1700, z 1500…4000; 8 m frozen ring, 200 m C¹ feather; High Tarn, channel beds and coast band frozen | — |
| `tools/geo-r02c/transects.json`, `lib/form.py`, `lib/routes.py`, `lib/los.py`, `lib/hydro.py` | Named transects, curvature and crease indicators, flank fall in R1's left/right convention, route tread probes, terrain-only reveal line of sight, sink conventions | part of `baseline.py` |
| `tools/geo-r02c/cameras_build.py` → `cameras.json` | 15 fixed review cameras derived from R1 route geometry (3 Central Valley, 4 Cairn, 4 Hidden Fold, 4 North Peak silhouettes), each asserted on dry ground | <1 s |
| `src/geo-r02b/review.ts`, `review-options.ts` (+4 lines in `main.ts`) | **Opt-in** viewer modes: `?presets=p0` adds the cameras; `?review=clay&sun=A\|B` adds clay albedo, reduced hemisphere fill, fixed sun and an island-wide 8192 shadow map | — |
| `tools/geo-r02c/capture.mjs`, `compare_default.py`, `review_page.py` | Matched browser captures with manifest and hashes; default-viewer identity check; static gallery | see §4 |
| `tests/geo-r02c-p0.test.ts` (5 tests, runs in `npm test`/CI) | Protected-file and artifact hash guard; strict 4 m dry-sink check; water-rise regression; camera validity; opt-in parsing and window sanity | whole suite (29 tests) 3.7 s |
| `tools/geo-r02c/repro/platform_probe.py` | Read-only probe to run on macOS and diff against the Linux output, to settle the open tie-breaking question | seconds |

Expensive numerical diagnostics (replays, convergence, platform attribution) are offline tools and are not run in CI.

**Convention correction.** R1 measures ridge sides in planning UV coordinates (v points south), so R1's `flankWidthLeftM` applies to the **world-right** side of the authored direction. This is asserted in `baseline.py`. My earlier independent review compared flank asymmetry with the opposite convention. Re-measured with the correct one, 8 of the 14 ridges with authored asymmetry have their steeper fall on the authored narrower side: an indicator, close to chance.

## 4. Matched baseline renders (browser-verified)

* **Default viewer unchanged.** The untouched R1 build and the P0 build were captured on the same machine with the default URL. 7 of 8 R1 views give byte-identical PNGs. The overview differs only in 53 pixels of the live FPS text in the status panel; every other pixel and every camera is identical. See [`captures/default-viewer-identity.json`](captures/default-viewer-identity.json).
* **Review captures.** 23 views (8 R1 views and 15 P0 cameras) × 3 modes: standard, clay sun A (WNW 18°), clay sun B (SE 35°), 69 images in total. Each is an unretouched 1600×1200 screenshot of the actual Three.js viewer (Chromium 141.0.7390.37, SwiftShader software WebGL). The UI overlay is hidden by CSS and this is recorded per image. There were no page or console errors. Gallery: [review.html](review.html); manifest with SHA-256 per image: [`captures/capture-manifest.json`](captures/capture-manifest.json).
* **Measured capture cost** (software rendering, scene, shadow pass included): median 14.0 s per standard view, 34.8 s clay A, 39.8 s clay B; 2,319 s for all 69. These are not frame-rate or device performance measurements.
* **Known clay-mode artefact.** Faint speckles appear at grazing distances in some frames, probably shadow-map precision. They do not affect geometry, which is identical across all three columns.

## 5. Tests and build (reproduced on the P0 HEAD)

* `npm test`: 29/29 pass (24 existing, unchanged, plus 5 P0) in 3.7 s wall. `npm run build`: TypeScript and Vite pass; the existing >500 kB chunk warning remains.
* Not run on GitHub CI, because the branch is not pushed.

## 6. Protected-file hash comparison

`baseline/baseline-manifest.json` records SHA-256 for 104 protected files:

| Path | Files |
|---|---|
| `public/geo-r02b` | 5 |
| `docs/geo-r02b` | 25 |
| `docs/geo-r02b-r1` | 47 |
| `tools/geo-r02b` | 6 |
| `tools/geo-r02b-r1` | 12 |
| `src/world` | 5 |
| existing tests | 4 |

`git diff b6784a9..HEAD` over these paths is empty, and the new CI test re-verifies every hash on each run. The only edited existing file is `src/geo-r02b/main.ts`: 4 lines added, 2 changed (hemisphere light kept in a variable, plus the opt-in hooks).

## 7. Limitations and blockers

* **Not pushed.** The branch exists only in this ephemeral cloud container and is lost if the container is reclaimed. Pushing needs your authorization.
* Mac intermediate arrays are unavailable, so the macOS tie-breaking and coast-node predicate behaviour are inferred, not observed (see §2B).
* There is no Docker daemon in this environment, so a digest-pinned container image could not be built or verified. The reference environment is defined by the hash-locked wheels and the fingerprint.
* All renders use software WebGL. There is no GPU, desktop-hardware or Android measurement. The 4 m canonical mesh (~6.6 M triangles) remains unsuitable for Android, as R1 itself documents.
* Line-of-sight results are terrain-only proxies; walkthrough sequences are still to be judged from the captures.
* The latent R1 ring-seam projection defect is documented, not fixed. Fixing it would change the R1 baseline and needs a separate decision.
* The south-low-tail source conflict is unchanged. It is outside the A1 window and blocks neither P0 nor A1.

## 8. Recommendations for the A1-D design study

1. **Use an incremental re-solve for constraint-based variants** (H = R1 + Δ, Δ = 0 on R1 constraints). Its null control equals R1 byte-for-byte. Use M0w only to report drift. Compare displacement-only variants against M0. Demonstrate the null identity before any sculpting.
2. **Decide the north-coast scope explicitly.** That band is where R1 is most solver-stage dependent (drift mean +2 to +6 m within 300 m of the coast). Either keep the north seaward slopes frozen in A1, or bring them in deliberately with their own review cameras.
3. **High Tarn rim:** keep it frozen in A1, as the provisional mask does. Decide separately whether an R1.x seam fix is wanted. It would affect High Tarn and both Birchwood lakes.
4. **Review on clay sun A and B first**, standard material second. Use the 4 North Peak silhouette cameras plus the 8 R1 views. Treat curvature, asymmetry and crease figures as indicators. The baseline shows the A1 window at about 85 % saddle-shaped sloping land and the north massif at about 91 %.
5. **Reassess the window boundary** during A1-D. `main-upper` crosses z = 1500. Its bed is frozen, but the feather there runs through glen-tarn-outlet.

## 9. Reproduce

```sh
python3.13 -m venv .venv && .venv/bin/pip install --require-hashes --no-deps -r tools/geo-r02c/env/requirements.lock.txt
npm ci && npm test && npm run build
.venv/bin/python tools/geo-r02c/baseline.py                       # -> docs/geo-r02c-p0/baseline
.venv/bin/python tools/geo-r02c/invariance.py --self-test
.venv/bin/python tools/geo-r02c/repro/r1_stages.py --out /tmp/r1-stages --expect <Linux digest>   # outside the repo
.venv/bin/python tools/geo-r02c/repro/platform_diff.py --dumps /tmp/r1-stages [--counterfactual ...]
.venv/bin/python tools/geo-r02c/repro/convergence.py --dumps /tmp/r1-stages --tmp /tmp/r1-convergence
npx vite preview --port 4310 &   # after npm run build
node tools/geo-r02c/capture.mjs --url http://127.0.0.1:4310/geo-r02b.html --out docs/geo-r02c-p0/captures --modes standard,clayA,clayB
.venv/bin/python tools/geo-r02c/review_page.py
```

**Stop.** GEO-R02C-P0 ends here and requests review. A1 overlay authoring and terrain sculpting were not started.
