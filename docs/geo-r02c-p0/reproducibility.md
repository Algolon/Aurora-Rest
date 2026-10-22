# GEO-R02C-P0 — Cross-platform reproducibility of R1 and proposed contract

**Scope.** The canonical R1 terrain (`public/geo-r02b/terrain.f32`, SHA-256 `fc8fd6da…1f946a`) was generated on the Codex macOS worktree. It is the immutable historical baseline and was not regenerated, overwritten or rebaselined. All regeneration in this study ran in disposable directories outside the repository. Evidence: [`reproducibility/platform-diff.json`](reproducibility/platform-diff.json), tools in `tools/geo-r02c/repro/`.

Labels: **reproduced** = re-run here with the stated result; **recorded** = Codex evidence not re-run; **inferred** = follows from reproduced evidence but not directly observed; **hypothesis** = untested explanation.

## 1. Linux regeneration (reproduced)

| Run | Environment | Terrain SHA-256 | Seconds |
|---|---|---|---|
| Earlier review run | Linux x86_64, Python 3.13.16, numpy 2.3.5, scipy 1.18.1, shapely 2.2.0 / GEOS 3.14.1 | `19c5f839…2b722b32` | 197 |
| run2 | same, default threads | `19c5f839…2b722b32` | 204 |
| run3 | same, `OMP/OPENBLAS/MKL_NUM_THREADS=1` | `19c5f839…2b722b32` | 216 |
| Instrumented replay (`r1_stages.py`) | same | `19c5f839…2b722b32` (faithful) | 210 |

Byte-identical regeneration holds in this environment, and threading has no effect. The instrumented replay patches the hash-checked R1 generator **in memory only** at asserted anchors that copy intermediate arrays. Its output digest equals the unmodified run.

## 2. Canonical (macOS) vs Linux

Measured float32 to float32 over 3,003,501 cells: 23,369 cells differ. Of these, 629 differ by more than 1 cm and 118 by more than 10 cm; the maximum is **1.414 m**. The >1 cm differences form five components:

| Component | Cells | Max |
|---|---|---|
| Upper Birchwood lake rim / inner bed, x −1040…−900, z 644…780 | 625 | 1.414 m |
| Single north-west coast nodes (−1684, 2808), (−1756, 2712), (−1768, 2696), (−1792, 2664) | 4 | 0.300 m |

The crest obstacle active set is identical on both platforms (18,937 crest cells at bound, 0 different).

### Mechanism A — closed-ring seam ties in `projection()` (verified by reproduction)

* Every lake ring passed to R1's `geometry.projection()` repeats its first vertex as its closing vertex (e.g. Birchwood upper: 452 vertices, 451 distinct). Near each seam, the two nearest KD-tree vertices are **exactly** equidistant. **Reproduced.**
* `projection()` inspects only the two segments adjacent to whichever duplicate `cKDTree` returns. At tied cells the returned distance can therefore be wrong. **Reproduced.** On Linux the errors near the seams are:

  | Lake | Max error | Tied cells with >1 cm error |
  |---|---|---|
  | High Tarn | 12.6 m | 126 |
  | Upper Birchwood | 16.3 m | 188 |
  | Lower Birchwood | 20.7 m | 232 |
  | Hidden Fold | 0.02 m | 3 |

* Inverting R1's outside-lake formula `level − 0.65 + 0.065·d` on the canonical values shows the distance the Mac used. At the Birchwood-upper rim it equals the exact nearest-segment distance (e.g. 28.2843 m where Linux used 28.7141 m). **Reproduced from the canonical binary; that this reflects the Mac's tie choice is inferred.**
* **Counterfactual:** the Linux replay with a tie-aware `projection()` applied *only* to the Birchwood-upper ring reproduces the canonical binary in all but **12 of 3,003,501 cells**. The 12 are the four coast nodes (0.30 m), one cell at (−932, 688) (0.045 m), and seven cells below 1 mm. Every other difference, including the ~23,000 sub-millimetre ones, vanishes. **Reproduced.**
* Applying tie-awareness to *all* rings instead creates new differences at the High Tarn (0.82 m) and Birchwood-lower (1.35 m) seams. So the Mac resolved those ties the same way Linux does. Only the Birchwood-upper ties resolve differently. **Reproduced.**
* Why `cKDTree` breaks this one set of ties differently on macOS is **unverified**. Hypothesis: last-bit differences in the tessellated ring coordinates from `parse_path` change the tree's split structure. The read-only test is `tools/geo-r02c/repro/platform_probe.py`. Running it on Linux ([`reproducibility/probe-linux-x86_64.json`](reproducibility/probe-linux-x86_64.json)) shows that at (−956, 704) the nearest vertices 0 and 451 (the duplicated seam vertex) are tied at exactly 2.8714108 UV. `cKDTree` returns index 0, so `projection()` inspects only segment 0 and returns 28.714 m. The true nearest segment is 450, at 28.284 m, which is the distance the canonical value implies. Running the same probe on the Mac and diffing the JSON would show whether the ring vertices differ bit-wise and which duplicate macOS returns.

### Mechanism B — coastline-coincident grid nodes (verified in effect, cause unverified)

The four coast nodes lie on the coastline polyline to within 1.4×10⁻¹³ m. Linux classifies two of them as sea and two as land; each canonical value equals the formula of the **opposite** branch exactly (0.0 vs −0.3 m). **Reproduced.** Whether the flip comes from last-bit coordinate differences or from the point-in-polygon predicate is **unverified**. The probe evaluates `contains_xy` for these nodes with R1's own node coordinates (`np.arange(0, 600.001, 0.4)`). On Linux it reproduces the replay's classification: sea, sea, land, land. The same probe on the Mac is expected to show the opposite set if this mechanism is right.

### Unattributed

One cell at (−932, 688) differs by 4.5 cm and seven by under 1 mm, after both mechanisms are accounted for. Their cause is **not attributed**.

### Consequences

* **Geometry:** a ~1 ha patch of the Upper Birchwood rim and inner bed differs by up to 1.41 m between platforms. That is larger than the 1.6 m channel depth margin allows to be ignored, and comparable to the lake-rim freeboard.
* **Not a platform issue — a latent R1 defect.** Independently of platform, `projection()` returns non-nearest distances near **every** lake seam, by up to 12.6–20.7 m at High Tarn and both Birchwood lakes. The lake rim and bed constraints there do not follow R1's own stated formula. High Tarn lies inside the provisional A1 window. This is documented here and **not corrected** in P0: a correction would change the R1 baseline.

## 3. Proposed reproducibility contract

| Tier | Contract | Status |
|---|---|---|
| **1 — Canonical artifacts** | Committed binaries plus SHA-256 are the only truth for runtime, tests and review. R1's Mac-generated binaries are permanent historical baselines; CI never regenerates them. The P0 hash guard (`tests/geo-r02c-p0.test.ts`) enforces this. | Implemented and tested |
| **2 — Byte-identical regeneration** | Each future R02C generator declares a reference environment: Linux x86_64, CPython 3.13, `tools/geo-r02c/env/requirements.lock.txt` (hash-pinned wheels), fingerprint from `tools/geo-r02c/env/fingerprint.py`. Two independent runs must produce identical bytes before outputs are committed. | Verified for R1's generator in this environment (3 runs) |
| **3 — Cross-platform equivalence** | On any other platform: identical **classification** (land/sea, constraint masks, active set) and feature tolerances, below. Any classification flip is a generator defect to remove, never a tolerance to widen. | Proposal |

**Tier 3 tolerances (proposal):**

| Feature | Tolerance |
|---|---|
| Equality-constraint cells (lake levels and rims, channel beds, coast, pass) | ≤ 1 mm |
| Free cells | p99.9 ≤ 5 cm, max ≤ 0.25 m |
| Sinks | Identical set (currently none) |
| D8 outlet system | Identical for ≥ 99.99 % of cells, exceptions listed |
| Routes | Same pass/fail for every route |
| Lake wet extent | Within one cell |

A blanket 2 m tolerance is rejected. It exceeds the 1.6 m channel bed depth, the ~1.2–1.8 m lake-rim freeboard and the 1.41 m difference observed, so it would hide exactly the class of defect found here.

**Generator hygiene for R02C tools (not applied to R1):**

* Distance queries must be exact nearest-segment, or tie-aware.
* Closed rings must not rely on KD nearest-vertex adjacency.
* Grid nodes on polygon boundaries need an explicit, documented inclusion rule.
* Solves must be converged to a stated tolerance (see [`convergence.md`](convergence.md)).
* Output may optionally be quantised to 1 mm before float32 encoding.

Given that R1's remaining arithmetic is bitwise identical across these two platforms once the two classification hazards are removed, byte-identical cross-platform output is a realistic goal for R02C generators. It is **not** guaranteed until each new generator is tested on both platforms.

**Rebaselining remains a separate decision.** A future R1.x that fixes the seam ties would change High Tarn, both Birchwood lakes and possibly Hidden Fold. It needs explicit approval and its own before/after review.
