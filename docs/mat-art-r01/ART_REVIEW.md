# MAT-ART-R01 — Stylized Nordic Ground Calibration: art review

**Decision: ART CONDITIONAL.** The *Soft Sculpted Nordic Ground* direction measurably and visibly resolves the
owner's main complaint: the ground no longer reads as photographic, fine-grained detail competing with the
stylized assets. One bounded issue remains before owner acceptance. At 1–3 m the soft rounded clump primitive reads as **leaf/clover
ground cover** rather than grass and moss (meadow tufts and forest moss cushions). It has a single cause in
`Plane.blob` and is not fixed here, because the one permitted refinement went to the colour hierarchy, which was
the larger defect across all views. Technical validation passes. A technical PASS is not an art GO.

No merge, no deployment. Original MAT-01 is untouched and remains the default everywhere.

## A. Checkpoint

- Branch: `claude/focused-hopper-9hsewe` (session branch). The same commits are offered as
  `art/mat-art-r01-stylized-ground-calibration`; see the PR for the published ref.
- Evidence/implementation checkpoint: `39ace2487afd7139a65382507a92555ba26ab053`. This review is added on top.
- Foundation: `feature/geo-island-r02-baseline-reconciliation` @ `2ffcf1d1794528d2166846ca7cca874c11f33029`, which
  descends from recovery `fix/recovery-ci-r01` @ `bced77ca3ca0539f7137cd9f066e6220518cf4a8`. Rejected R02
  `195ada5b58450b22a38e530c78fa751eaf6edaeb` was used read-only (camera definitions and source PNGs for parity).
- **New files only.** No path in the foundation tree is modified. A test enforces this by git-blob/LFS identity and
  is verified to fail on a tampered file. Added: `src/mat-art-r01/*` (viewer, adapter, variant, worker, loader,
  cameras), `mat-art-r01.html`, `vite.mat-art-r01.config.ts`, `tests/mat-art-r01.test.ts`, `tools/mat-art-r01/*`,
  `docs/mat-art-r01/*`.

## B. Material specification

[MATERIAL_SPEC.md](MATERIAL_SPEC.md) covers palette hierarchy, microdetail, meso approach, normals, repetition,
the asset relationship, the full parameter table and trade-offs. [DIAGNOSIS.md](DIAGNOSIS.md) has the ranked
root causes and the Gate A record. In short:

1. **Primary cause:** high-frequency, high-contrast meadow albedo. 63% of the variance is below 2.5 cm; the
   D2 low-pass ablation removes 56–63% of on-screen fine-band energy. Normals (≤ 1%) and tile scale are not causes.
2. **Secondary:** no designed shape between ≈5 cm and ≈1 m in either family, so blurring alone goes flat.
3. **Tertiary:** palette/value mismatch with the assets (yellow-olive, near-black soil gaps, lime decals).

Variant B moves contrast into 6–40 cm sculpted tufts and cushions (69–70% of variance), cuts strokes to about 5% of
MAT-01's, narrows the value range and aligns hue with the assets. **R1**, the single refinement, adjusted only the
colour hierarchy, after the first comparison showed lost macro massing and a lawn-green cast.

## C. Real visual evidence

Unretouched 1100×700 canvas readbacks, SwiftShader WebGL 2, DPR 1, FOV 57°, eye height 1.75 m (overview 145 m),
seed 73129, density 1, MAT high profile, R02 lighting, POP stream, LOD and grass fade. In every pair only the ground
material differs. The tool asserts camera pose, POP descriptor hash, ground-mesh hash, classification hash and
scene settings per view. Poses: [cameras.ts](../../src/mat-art-r01/cameras.ts); metadata per frame:
[refined/capture.json](evidence/refined/capture.json).

Final pairs (A = MAT-01 · B = MAT-ART-R01 after R1):

| View | Full environment | Ground only |
| --- | --- | --- |
| 1 Birchwood interior (R02 "shelter") | [A](evidence/refined/birch-interior--env--mat-01.png) · [B](evidence/refined/birch-interior--env--mat-art-r01.png) | [A](evidence/refined/birch-interior--ground--mat-01.png) · [B](evidence/refined/birch-interior--ground--mat-art-r01.png) |
| 2 Birchwood edge (R02 "breathing") | [A](evidence/refined/birch-edge--env--mat-01.png) · [B](evidence/refined/birch-edge--env--mat-art-r01.png) | [A](evidence/refined/birch-edge--ground--mat-01.png) · [B](evidence/refined/birch-edge--ground--mat-art-r01.png) |
| 3 Forest → meadow transition | [A](evidence/refined/meadow-transition--env--mat-01.png) · [B](evidence/refined/meadow-transition--env--mat-art-r01.png) | [A](evidence/refined/meadow-transition--ground--mat-01.png) · [B](evidence/refined/meadow-transition--ground--mat-art-r01.png) |
| 4 Open grassland | [A](evidence/refined/open-grassland--env--mat-01.png) · [B](evidence/refined/open-grassland--env--mat-art-r01.png) | [A](evidence/refined/open-grassland--ground--mat-01.png) · [B](evidence/refined/open-grassland--ground--mat-art-r01.png) |
| 5 Elevated overview (R02 "overview") | [A](evidence/refined/overview--env--mat-01.png) · [B](evidence/refined/overview--env--mat-art-r01.png) | [A](evidence/refined/overview--ground--mat-01.png) · [B](evidence/refined/overview--ground--mat-art-r01.png) |
| G1 Ground close-up, R02 shelter station | — | [A](evidence/refined/close-forest-floor--ground--mat-01.png) · [B](evidence/refined/close-forest-floor--ground--mat-art-r01.png) |
| G2 Meadow close-up | — | [A](evidence/refined/close-meadow--ground--mat-01.png) · [B](evidence/refined/close-meadow--ground--mat-art-r01.png) |
| G3 Forest–meadow close-up | — | [A](evidence/refined/close-transition--ground--mat-01.png) · [B](evidence/refined/close-transition--ground--mat-art-r01.png) |

The first comparison (B before R1) is preserved in [evidence/first-comparison](evidence/first-comparison); the six-way
diagnostic ablations are in [diagnosis/evidence](diagnosis/evidence); per-pixel masks (`--mask.png`) accompany every set.

**Measured** (L* RMS on ground pixels by screen band; [refined/image-metrics.json](evidence/refined/image-metrics.json)):

| View (vegetation on) | Fine 1–3 px A → B | Broad 19–55 px A → B | Fine/broad A → B | Vegetation fine/broad | Meadow hue/sat. A → B |
| --- | ---: | ---: | ---: | ---: | --- |
| Birchwood interior | 4.97 → 2.21 | 2.13 → 2.42 | 2.33 → **0.92** | 0.90 | 60°/0.50 → 68°/0.41 |
| Birchwood edge | 5.15 → 1.99 | 2.72 → 2.83 | 1.89 → **0.70** | 0.99 | 60°/0.49 → 68°/0.40 |
| Meadow transition | 2.70 → 2.68 | 3.05 → 3.02 | 0.89 → 0.89 | 1.18 | 56°/0.48 → 66°/0.37 |
| Open grassland | 5.14 → 2.45 | 1.85 → 2.00 | 2.78 → **1.23** | 0.97 | 70°/0.39 → 75°/0.33 |
| Overview | 1.78 → 2.01 | 2.97 → 3.20 | 0.60 → 0.63 | 0.86 | 60°/0.49 → 68°/0.39 |

Vegetation hue/saturation is 71–90° and 0.27–0.38. The forest/meadow hue gap on the overview is 9° for A, 26° for
the first B and **13° for R1**.

**Movement** ([movement/shimmer.json](evidence/movement/shimmer.json)): six 2 cm forward steps, vegetation hidden,
static re-render noise floor exactly 0. Mean / p95 per-step ground |ΔL*| for A → B: Birchwood edge 6.18/22.7 →
**2.51/8.4**; open grassland 4.84/18.8 → **1.92/7.3**; Birchwood interior 6.42/24.9 → **2.29/8.4**. That is
59–64% less flicker.

**Baseline reproduction:** variant A matches R02's source frames, with identical draw calls and triangles and
91–94% bit-identical pixels. The remainder is ±1 LSB plus fewer than 0.05% of pixels on vegetation edges
(SwiftShader LLVM vs Subzero; [r02-parity.json](diagnosis/evidence/r02-parity.json)).

**Actual improvements:** the photographic blade speckle is gone at every walking view; the ground's frequency
signature matches the vegetation's; shimmer is down by about 60%; meadow hue and saturation move toward the assets;
forest-floor lime decals and yellow confetti are replaced by muted cushions and fewer leaves; landscape-scale hue
massing is kept (after R1).

**Remaining defects:**
1. *(the bounded condition)* At 1–3 m the rounded, soft-rimmed clump shape reads as leafy or clover ground cover;
   on the forest floor the cushions read as clover on garden soil. Pale blade accents look like straw specks.
2. The forest-floor/meadow boundary is still a clear value step, brown humus against green sward, although the hue
   gap is close to A's. Classification and blending are protected, so only material colour can address it.
3. Open meadow at 15–40 m is calm but somewhat uniform; R1 restores massing but not much mid-scale incident.
4. Forest-floor humus between cushions is plainer than A's. It is calm rather than rich.
5. The 3D grass tufts remain cooler and teal compared with any ground value. That is an asset colour, outside scope.
6. The exposed-floor composition and the failed R02 reveal are unchanged (out of scope).

## D. Technical comparison

- **Determinism / preservation:** original MAT-01 textures are byte-identical to the foundation at 512 and 256 (pinned
  hashes). The stylized synthesis is deterministic across runs. Coastal sand and bedrock are byte-identical in the
  variant. Variant definitions differ only in art fields, with ids, order, seeds and generators unchanged. Recovery
  manifest source integrity is 558/558, and the foundation tree is unmodified (content test). Canonical terrain,
  hydrology, features, classification (hash `bc2ce096…63a1` in every capture), POP descriptors (sha per view in
  capture.json) and nature-library geometry are all unchanged.
- **Rendering:** the stylized material uses the identical shader, defines and program cache key. The program count is
  7 for both variants. The adapter reproduces the constructor uniforms exactly and changes only in-scope slots
  (unit test). The masks confirm blending and classification are unchanged.
- **Lifecycle:** 3 cycles × high/balanced/mobile × A/B keeps textures at 13 and programs at 7. Each profile is
  balanced (owners 1), and disposal leaves 0 geometries and 1 texture, the same residue R02 recorded.
- **Performance (software WebGL, not a device claim):** draw calls, triangles, scene materials (7) and programs (7)
  are identical for A and B in every view (66/466,253 … 111/684,685). Estimated MAT texture allocation is identical:
  43,222,155 B (high/balanced) and 10,814,880 B (mobile), with the same texture format and layer count. The
  `gl.finish()` timings (≈0.3–2.6 ms) do not represent SwiftShader GPU cost and are not used as evidence.
- **Costs and limitations:**
  - B synthesis is a one-off load cost in a worker. At 512² it measured about 0.6 s for forest floor and 0.9 s for
    meadow, against 0.5 s each for A (measured under contention).
  - The review viewer keeps A resident beside B so switching is instant. That adds one MAT resource set (four
    textures) only while comparing; a production adoption would replace A rather than add to it.
  - No hardware desktop or Android measurement was made.
- **Checks:** 81/81 tests inside the recovery CI partition (8 new); TypeScript; production builds (default and
  review); the full recovery CI gate locally with real WebGL; GitHub Actions on the pushed commits (see PR).

## E. Artistic acceptance

| Criterion | Weight | A (MAT-01) | B (R1) | Basis |
| --- | ---: | ---: | ---: | --- |
| Cohesion with stylized vegetation | 35% | 3 | 6.5 | Frequency signature matches the assets; painted-mass language matches the canopies; tufts and value step still separate |
| Material abstraction and hierarchy | 25% | 3 | 6 | Clear shape hierarchy and controlled microdetail; the leafy primitive weakens the read |
| Naturalness and colour variation | 20% | 5 | 6 | Olive-moss with restored massing beats A's yellow cast; mid-distance meadow somewhat uniform; humus plain |
| Walking-height readability and distance | 15% | 4 | 6.5 | 60% less shimmer, calm mid-ground, intentional near-field; leafy close-range read |
| Performance and consistency | 5% | 8 | 8 | GPU-neutral; ≈ +0.6 s one-off worker synthesis at 512² |
| **Weighted (supporting judgment)** | | **3.8** | **6.35** | |

1. *Clearly less photographic?* **Yes**, in every matched walking view, with the measurement agreeing.
2. *Do the grass tufts look connected?* **Partly.** The ground no longer out-grasses them and the hue is closer, but
   the teal tufts are still cooler than the ground.
3. *One visual language for both families?* **Mostly.** They share shape scale, lighting cue and frequency budget.
   The value step remains at their boundary.
4. *Pleasant, readable colour masses?* **Yes after R1.** The first B failed here; it was flat lawn green.
5. *Enough close-range detail?* **Enough quantity, wrong vocabulary.** The detail is intentional but reads as
   leaves or clover at 1–3 m.
6. *Natural transitions?* **Acceptable.** The blend is unchanged and smooth; the value contrast is still noticeable.
7. *Tiling, shimmer, repetition?* **Improved.** Shimmer is down about 60%, and no tile grid is visible in the
   walking or overview frames.
8. *Stylized Nordic rather than flat cartoon?* **Yes for R1.** The first B leaned toward a flat cartoon on the
   overview, and R1 corrected that.
9. *Trees and rocks integrated?* **Better.** The canopies and ground now share a painted-mass vocabulary; the bright
   rocks remain an asset matter.
10. *Clearly better than MAT-01 from the same viewpoints?* **Yes at walking and mid range. At close range it is
    calmer but introduces the leafy read.**

**ART CONDITIONAL.** The bounded remaining issue is the close-range clump primitive: replace the rounded soft
ellipse with a lean-aligned, tapered, grass-like tuft silhouette (and lobed moss cushions on the forest floor), with
accents closer to the tuft tone. The change is confined to `Plane.blob` and the stroke tone in
`src/mat-art-r01/variant.ts`, and needs no shader, classification or asset change. It should be re-checked with
the same `tools/mat-art-r01/capture.mjs refined` plan. No further iteration is started here, per the
one-refinement limit.

**Confidence:** high on preservation, matched conditions, the measured frequency, shimmer and hue changes, and on the
root-cause ranking. Moderate on the art judgment, which is a single reviewer on software-rendered frames at
1100×700. The verdict would be falsified if owner review at hardware resolution found the R1 ground still read as
competing detail, or if the leafy read turned out to be acceptable (then GO), or found the colour massing
unconvincing (then NO-GO).

## Reproduction

```bash
npm ci && git lfs pull
node --experimental-strip-types --test tests/mat-art-r01.test.ts
npx vite build --config vite.mat-art-r01.config.ts --outDir dist-mat-art-ab
npx vite preview --config vite.mat-art-r01.config.ts --outDir dist-mat-art-ab --host 127.0.0.1 --port 4372 --strictPort
CHROME=<chromium or headless shell> node tools/mat-art-r01/capture.mjs refined <out-dir>
node tools/mat-art-r01/image-metrics.mjs <out-dir>
CHROME=<…> node tools/mat-art-r01/shimmer.mjs <out-dir>
```

Run one browser at a time: two concurrent SwiftShader sessions exhausted container memory once during this work. The
diagnosis was resumed from its matched groups and the event is recorded in its capture.json. The surveys are
`tools/mat-art-r01/survey-cameras.ts` and `tools/mat-art-r01/spectrum.ts`.
