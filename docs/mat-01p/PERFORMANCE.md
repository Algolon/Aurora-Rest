# MAT-01P — Performance diagnosis

Three kinds of evidence are kept strictly apart. None of them is device performance.

| Kind | What it is | What it is not |
|---|---|---|
| **Static estimate** | SPIR-V instruction counts of the exact WebGL fragment shader (glslang 15.1 + spirv-opt -O) | GPU cycles, frame time or a speed-up |
| **Software wall time** | Chromium 141 / ANGLE / **SwiftShader** CPU rasterisation | GPU frame time; software texture fetches are disproportionately expensive |
| **Device measurement** | — | **None available.** No desktop GPU or Android device was accessible |

No Android or desktop FPS is claimed anywhere in this package.

## 1. Static shader cost (estimate)

Source: `profile/shader-stats-{baseline,candidate}.json`, `profile/*.frag`, `profile/*.opt.spv` (hashes recorded and re-verified).
The per-material loops are not unrolled by spirv-opt, so every count is **one material iteration plus fixed work**, roughly the common single-material pixel; transition pixels run the loop body 2–3 times. *ALU lanes* weights each ALU instruction by its vector width.

| Shader | Instructions | Texture-sample sites | ALU instructions | ALU lanes |
|---|---|---|---|---|
| MAT-01 High (≡ Balanced: triplanar is a uniform) | 1979 | 11 | 1186 | 1958 |
| MAT-01 Mobile | 1548 | 9 | 880 | 1467 |
| High, every fBm → constant (lower bound) | 891 | 11 | 373 | 654 |
| Mobile, every fBm → constant (lower bound) | 824 | 9 | 338 | 602 |
| **Candidate High, baked noise** | 1170 | 16 | 566 | **968 (−51 %)** |
| **Candidate Mobile, baked noise** | 1064 | 12 | 508 | **873 (−40 %)** |
| Candidate High, baked OFF | 1979 | 11 | 1186 | 1958 — SPIR-V **byte-identical** to MAT-01 (`240c71e3…`) |
| Candidate Mobile, baked OFF | 1548 | 9 | 880 | 1467 — SPIR-V **byte-identical** to MAT-01 (`444025cf…`) |

**Diagnosis.** Procedural fBm is the dominant arithmetic cost: about **67 % of ALU lanes in High** and **59 % in Mobile**. Each `tmFbm` call (three value-noise octaves, twelve hashes) costs about **216 ALU lanes**, consistently across profiles (High has 6 call sites per material, Mobile 4). Texture-sample *sites* are modest (9–11), but each site runs once per active material.

## 2. Software wall time (SwiftShader)

Method (`tools/mat-01p/profile.mjs`):
- One fixed view, `tr-forest-meadow`: near-field forest/meadow transition, terrain fills the frame.
- Identical 16 m LOD mesh for every configuration, so vertex cost is small and constant.
- Synchronous render + 1-pixel readback at 400×250 and 1600×1000; median of 5 frames after one warm-up.
- Fragment cost = slope between the two resolutions (ns per pixel).
- Two complete passes to measure reproducibility.

Source: `profile/bench-pass1/ablation.json`, `profile/bench-pass2/ablation.json`.

| Configuration | Pass 1 ns/px | Pass 2 ns/px | Mean | Effect vs own profile |
|---|---|---|---|---|
| High · procedural (MAT-01) | 4477 | 4629 | 4553 | — |
| High · baked (candidate) | 4637 | 4387 | 4512 | **−0.9 %, inside run-to-run noise** |
| High · no fBm (floor) | 3722 | 3901 | 3811 | −16 % |
| Mobile · procedural (MAT-01) | 2631 | 2355 | 2493 | — |
| Mobile · baked (candidate) | 2376 | 2294 | 2335 | **−6 %, inside the ±5.5 % Mobile spread** |
| Mobile · no fBm (floor) | 1980 | 1862 | 1921 | −23 % |
| Plain existing Lambert (reference, smoke run) | — | — | ≈ 100 | ≈ 45× cheaper than High |

Run-to-run spread: ±1.7 % (High) to ±5.5 % (Mobile). Single features that cost 5–15 % are therefore at or below the noise floor.

**Result: inconclusive on software.**
- Removing all noise saves only 16–23 % here, while the static estimate says noise is about 60 % of ALU work. SwiftShader spends most of its time sampling textures in software (8× anisotropic trilinear, `textureGrad`).
- So a texture fetch replacing ALU is close to cost-neutral here. That neither confirms nor rules out a GPU benefit.

**Partial ablation** (first run, interrupted and deliberately stopped; 4 of 16 variants; `profile/ablation-partial/ablation.json`): removing patch noise changed per-pixel cost by −15.8 / −9.4 / **+3.6 %** across three views, ecotone noise −10.2 / −0.7 / −3.2 %, meso noise −11.8 / −10.1 / −7.2 %. The positive value shows these single-feature numbers are not reliable on SwiftShader, which is why profiling stopped instead of extending.

## 3. Memory

| Profile | MAT-01 | With baked noise | Difference |
|---|---|---|---|
| High / Balanced | 41.22 MiB (classification 30.55 + detail 10.67) | 42.55 MiB | +1.33 MiB (512² RGBA8 + mips) |
| Mobile | 10.31 MiB | 11.64 MiB | +1.33 MiB (+13 %) |

The candidate adds one 512² RGBA8 texture (1,398,101 bytes with mips). It is owned, counted and disposed by `TerrainMaterialResources` (texture count 5 instead of 4).

## 4. Other cost centres (not addressed by the candidate)

- **Logarithmic depth buffer** (inherited from the GEO viewer) writes `gl_FragDepth`, which disables early depth rejection. The full material shader runs for overdrawn fragments; on GPUs this can outweigh any noise saving. Highest-value item to test on hardware.
- **Anisotropic filtering** (8× High, 4× Balanced, 2× Mobile) multiplies fetch cost on bandwidth-limited mobile GPUs.
- **Classification map memory**: 30.6 MiB on High is the largest resource. Halving attributes to 8 m (−7.6 MiB) is the obvious option; not implemented.
- **Transition pixels** run the material loop 2–3 times; all noise costs scale with that.

## 5. What would settle the question

The candidate reduces arithmetic and adds texture fetches. Only a GPU can say which bound dominates.

Minimum device protocol:
1. Same view (`tr-forest-meadow`), same 16 m mesh, fixed resolution.
2. Five configurations: MAT-01 High, MAT-01 Mobile, candidate Mobile, Mobile with no fBm (floor), plain Lambert (reference).
3. Measure GPU time with `EXT_disjoint_timer_query_webgl2` where exposed; otherwise frame time over 300 frames with vsync noted.
4. Devices: one desktop discrete GPU, one mid-range Android (Mali-G57/G68 or Adreno 6xx class), one low-end Android.
5. Report the candidate's gain only as a fraction of the measured (procedural − no-fBm) gap.
