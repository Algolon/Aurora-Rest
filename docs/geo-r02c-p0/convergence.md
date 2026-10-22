# GEO-R02C-P0 — Convergence of the R1 4 m stage

**Question.** Is the shipped R1 4 m terrain a converged solution of its own 4 m constraints? If not, how should A1 variants be compared fairly without changing the R1 baseline?

Evidence: [`convergence/convergence.json`](convergence/convergence.json), maps in `convergence/`. Tool: `tools/geo-r02c/repro/convergence.py`. Inputs: the canonical binary (read-only), plus constraint masks and stages from the faithful Linux replay. Converged surfaces stayed outside the repository. Measured on a shared 4-core Linux container.

## Findings

**1. R1's 4 m stage is not converged. (Reproduced.)**

R1 upsamples the converged 16 m solve, then runs a fixed 240 Jacobi sweeps at 4 m (`tools/geo-r02b-r1/generate.py:112`). Per sweep, the Laplace residual on the Linux replay is small: p99 9 mm, max 6.3 cm. However, Jacobi removes long-wavelength error extremely slowly. Continuing R1's exact iteration from the shipped state moves mainland free cells as follows:

| Extra sweeps | p50 | p90 | p99 | max | cells > 1 m | mean signed | seconds |
|---|---|---|---|---|---|---|---|
| +1,000 | 0.04 m | 0.67 m | 3.85 m | 18.5 m | 107,378 | +0.10 m | 52 |
| +3,000 | 0.10 m | 1.32 m | 6.18 m | 23.1 m | 202,398 | +0.18 m | 161 |
| +10,000 | 0.21 m | 2.27 m | 8.09 m | 24.3 m | 307,221 | +0.29 m | 507 |

The surface is still moving after 10,000 extra sweeps.

**2. Converged reference (M0c). (Reproduced.)**

This is a full-island obstacle solve of exactly R1's 4 m constraints, using conjugate gradients and R1's crest active-set rule:

* 3 active-set rounds, 1,929 CG iterations, 64 s.
* Max residual afterwards 2×10⁻⁶ m.
* Difference from R1: p50 0.30 m, p90 2.83 m, p99 8.86 m, max 24.6 m.
* 352,285 mainland cells (22 %) move more than 1 m, and 60,112 more than 5 m.
* 41 % of cells are lowered and 45 % raised.

**3. Where the difference sits.**

Inside the A1 window, the null re-solve drift (M0w, below) grouped by distance from the coast:

| Distance from coast | Mean | p90 \|Δ\| | max \|Δ\| |
|---|---|---|---|
| 0–50 m | +2.44 m | 6.85 m | 22.5 m |
| 50–150 m | +5.59 m | 12.19 m | 24.6 m |
| 150–300 m | +3.83 m | 8.39 m | 17.5 m |
| 300–600 m | +1.08 m | 4.52 m | 8.3 m |
| > 600 m | +0.09 m | 0.62 m | 1.8 m |

R1 fixes a coastal band of `sd < 1.25 × cell`: 20 m wide at the 16 m stage, only 5 m at the 4 m stage. The 4 m relaxation never propagates far enough to replace the 16 m coastal profile. **The band widths are verified in code. That they cause the coastal drift is inferred from the spatial pattern.** In the full-island map, the north coast rises and the western headland tips drop.

**4. Form character is not caused by non-convergence. (Reproduced.)**

Curvature classes on mainland cells with slope above 5 %:

| | convex | concave | saddle | planar |
|---|---|---|---|---|
| R1 | 2.6 % | 2.3 % | 71.7 % | 14.6 % |
| M0c | 2.4 % | 2.2 % | 73.1 % | 15.5 % |

The membrane-like character is a property of the harmonic operator, not of the stopping rule. Converging would **not** fix the sculptural deficit.

**5. Drainage guarantees survive convergence. (Reproduced.)**

M0c has no dry sink above 0.1 m (≥ 64 m²) or 0.5 m (any area). Its maximum spill depth is 3.3 cm, the same as R1.

## Fair comparison for A1 without touching R1

**M0w, the windowed null re-solve. (Reproduced.)** The same converged solver runs only inside the provisional A1 window. The frozen 8 m ring and everything outside take the canonical values; the constraint values are R1's.

* Outside the window and in the ring: exactly 0 difference, by construction.
* Inside: p50 0.33 m, p90 5.98 m, p99 12.9 m, max 24.6 m, mean +1.58 m. 131,919 cells move more than 1 m.
* Feather band: p99 6.6 m.
* Sinks: none. 23 s.

**Consequence.** Any A1 variant that re-solves the window converged inherits metres of change from convergence alone, concentrated on the north coast, before any sculpting. Comparing such a variant with M0 would credit, or blame, the overlay for solver drift.

**Recommended protocol for A1-D** (proposal, to be decided in the design review):

1. **M0** (canonical R1) remains the visual and technical baseline for every gate.
2. **Preferred construction for constraint-based variants: an incremental re-solve.** Solve only for a correction field Δ:
   * Δ = 0 on all R1 constraint cells, the frozen ring and outside the window.
   * Δ = (new target − R1) on new overlay constraint cells.
   * Δ harmonic, plus any obstacle bounds, elsewhere inside the window.
   * H = R1 + Δ.

   Because the operator is linear, an empty overlay gives Δ ≡ 0. The null control is then byte-identical to R1, and all differences belong to the overlay. Crest obstacle bounds need the same active-set handling as R1. This construction must be demonstrated in A1 with the existing sink, water, route and invariance checks; it is not assumed.
3. **If a fully re-solved window variant is ever used**, M0w must be captured and reviewed as its own control (clay and standard renders). Variant-minus-M0w then isolates the overlay effect, and M0w-minus-M0 is reported as solver drift.
4. **Post-solve displacement variants** (R1 + w·Δ, no re-solve) compare directly with M0. They must still pass the hydrology checks, since a displacement can create minima.

**Not done in P0.** No converged surface was committed, adopted or rendered as a candidate. Whether a converged R1.x should ever become a new baseline is a separate decision. The coastal drift above shows it would visibly change the north coast and western headlands.
