# ASSET-01B1R — Birch Shadow Fidelity & Alpha-Cutout Correction

**Decision: ACCEPT** — code and browser evidence confirm the defect, correction, unchanged geometry and resource ownership. Owner visual sign-off remains available before any merge.

- Target: `Algolon/Aurora-Rest`
- Correction branch: `fix/asset-01b1r-birch-shadow-fidelity`
- Branch parent: `feature/asset-01b1-birch-lab@38885029462299406bf57bd4938d4495f39f0d5a`
- Source reference (read-only): `Algolon/Feh-Lu-We@17eafb0902833fb1121c77083f9f862eb4ffcd96`
- Pre-fix diagnostic checkpoint: `b990097202d18490b33aec97b11d6d259d914a13`
- **Verified fix implementation commit:** `04edd537a64199226af0c5e8d8cc43928e7d10a6`
- Baseline workflow: https://github.com/Algolon/Aurora-Rest/actions/runs/39509715805 (success)
- Baseline browser captures: https://github.com/Algolon/Aurora-Rest/actions/runs/39509715805/artifacts/12305301056
- Corrected workflow: https://github.com/Algolon/Aurora-Rest/actions/runs/39510249826 (success)
- Corrected browser captures: https://github.com/Algolon/Aurora-Rest/actions/runs/39510249826/artifacts/12305995950

## Explicit authorization and safety boundary

The user explicitly authorized a **one-time exception** to Aurora's default-branch rule: create the correction branch from the pinned existing birch-lab HEAD, preserving the full ancestry. This is **not a change** to `AGENTS.md` or the general project policy. Before creating the branch, the original asset branch was confirmed at the expected SHA and the fix branch did not yet exist. There was no local checkout in this environment; commits were performed through connected GitHub tools and tests/renders executed using GitHub Actions. No local worktree status or local git remote were claimed. Aurora `main`, WORLD-01/01B and Feh Lu We remained untouched. No merge, PR, release, deployment or ASSET-01B2 actions.

## Confirmed root cause

`src/materials.ts` had already created and owned `tree.userData.vegetationDepth`, a source-faithful `THREE.MeshDepthMaterial`. Its shader interprets spray atlas UV markers above 127 with the original `SPRAY_SAMPLE` and discards texels whose alpha is **below 0.4**, while non-spray bark continues to cast shadows. However, `createBirchFamily().createMesh()` returned `THREE.Mesh` instances without setting `customDepthMaterial`.

Feh Lu We's original `src/world/vegbatch.ts` explicitly sets `customDepthMaterial = material.userData.vegetationDepth` on both `BatchedMesh` and `InstancedMesh`. This is verified source intent, not evidence that Aurora already had correct shadows.

Before implementation, the controlled `shadow.html` Three.js runtime captured all variants and LODs with consistent orthographic camera, neutral opaque floor, directional light, 4096² shadow map and WebGL2 software renderer. `natural` (original factory) and `forced-default` were **pixel-identical**. Activating the existing depth material *only in the test harness* produced fine, alpha-cut-out leaf shadows rather than large, opaque leaf-plane silhouettes. Near variant 0 changed **17,876 pixels** with RGB difference greater than 10. Every variant/LOD showed the defect.

## Minimal fix

**Production code changed:** `asset-lab/birch/src/index.ts` only. After constructing the existing mesh, the factory now requires the pre-existing shared depth material to be a `THREE.MeshDepthMaterial` and assigns it to `m.customDepthMaterial`. It does not allocate another depth material, replace the foliage atlas or alter the visible material/shader.

**Validation support changed/added:** `asset-lab/birch/shadow.html`, `shadow/diagnostic.ts`, `scripts/capture-shadow.mjs`, `tests/shadow-atlas.test.ts`, `package.json` (PNG decoder and capture script), `.gitignore` (generated evidence), `.github/workflows/asset-01b1r-shadow.yml` (branch-specific CI). These are isolated to the asset lab and its CI workflow.

## Real verification results

- Existing geometry/determinism tests pass, plus new bark/spray UV-domain regression checks.
- TypeScript no-emit check and Vite production build pass.
- **Pinned source-runtime geometry parity passes**: positions, normals, UVs, vertex colours, indices, bounding spheres for all three variants, three unique geometry LODs and original wood/leaves parts. No geometry or LOD source files changed.
- Browser test checks 3 variants × near/mid/far/xfar = **12 cases**, each under normal, forced-default, and manual-alpha depth paths = **36 real captures** per phase.
- **After correction, natural and manual-alpha camera images are pixel-identical** for all 12 cases; zero differing RGB pixels at 10-level threshold, and zero differing PNG pixels when compared with the pre-fix manual-alpha images.
- Default (deliberately broken negative control) versus corrected changes **12,508–17,876 pixels** across cases; all cases pass.
- Alpha discard uses the original threshold **0.4**. Bark continues to cast solid shadows; foliage leaves show corresponding nonrectangular cutout shadow detail.
- Headless Chromium WebGL **2.0** (SwiftShader software mode) compiles and renders the shadow pass without logged page/console errors.
- Three draw calls recorded for the single-tree shadow diagnostic, for both old and corrected paths; no new material or texture is created by the fix. This is *not* hardware GPU profiling.
- Browser lifecycle test verified shared depth/atlas ownership between multiple family instances; no release while referenced; each shared depth material and atlas emits exactly one dispose on last owner; creating a new family after disposal allocates a distinct depth resource and successfully renders again.

## Evidence and visual limitations

Two complete **actual Chromium/WebGL** capture archives are linked above. Files named `before-birch0-near-natural.png` and `after-birch0-near-natural.png` offer exact full-frame before/after comparison; corresponding `manual-alpha` images provide the positive control and `forced-default` images provide the negative control. Also inspect variants 1 and 2, plus mid/far/xfar screenshots. `before-metrics.json` and `after-metrics.json` include conditions, alpha assignment and render metrics.

The shadowed leaf geometry contains overlapping physical spray cards, so its correctly cut-out shadow is still denser where leaf clusters overlap. Small shadow-map aliasing and self-shadowing depend on directional-light resolution/bias. Pixel-perfect correspondence to separately rendered Feh Lu We with identical settings is **not claimed**. The material object, original atlas and camera shader code are unchanged; *observed lighting* can differ because corrected self-shadows are different. Physical Android and dedicated GPU performance are outside scope.

## Acceptance gates

| Gate | Result |
|---|---|
| SHADOW CORRECTNESS | **ACCEPT** — controlled negative/positive A/B, WebGL rendered |
| GEOMETRY FIDELITY | **ACCEPT** — independent original source parity |
| MATERIAL FIDELITY | **ACCEPT** — same camera material, alpha atlas and shader; only shadow-depth selection changed |
| RESOURCE LIFECYCLE | **ACCEPT** — multi-owner + last-release + recreation WebGL checks |
| TECHNICAL VALIDATION | **ACCEPT** — tests, typecheck, build, browser/WebGL/shader validation |

**Stop:** No merge, deployment, island integration or ASSET-01B2. Review the screenshot evidence and explicitly authorize any subsequent merge or work.
