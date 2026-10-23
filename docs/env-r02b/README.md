# ENV-R02B — Authored Woodland Composition Pilot

Status: **visual pilot only / ART NOT APPROVED**. Based on protected recovery source `bced77ca3ca0539f7137cd9f066e6220518cf4a8`.

## Why
ENV-R02A ground-only pilot proved locally green terrain alone doesn't solve park-like tree distribution. This sidecar tests **negative space**: a soft, sinuous opening from interior woodland towards forest-edge, with a slightly wider asymmetric grove clearing. This is not a physical walking trail and not an ecology algorithm.

## Scope
- Original 558 file contents are byte-identical; no existing source is modified.
- Canonical POP generator, worker, seed=73129, geographic buffers, MAT classification, light, LOD and asset geometry unchanged.
- `env-r02b.html` starts in *unmodified* state. Tick *R02B authored woodland window* for candidate.
- At most selected **birch/pine** descriptor IDs in a small authored worldspace envelope are hidden **from the review renderer only**. Original descriptors in the worker stream remain intact.
- Source placements outside the window, all grass/rocks, all tree transforms and every original sample are unchanged. Mask uses canonical forest anchor + metre offsets, 4 control points and a compact elliptical clearing, not island-wide randomness.
- This prototype uses simple deterministic suppression and *cannot build new groves*. Evaluate honestly: if clearing looks artificial or surrounding density insufficient, reject it and move to more rigorous authored composition.

## Commands
`node --experimental-strip-types --test tests/env-r02b.test.ts`
`npx vite build --config vite.env-r02b.config.ts`
`npx vite --config vite.env-r02b.config.ts`

## Evidence and quality gates
GitHub workflow captures A/B/A at forest-interior, forest-edge, forest-landscape, forest-corridor on real SwiftShader WebGL. Reports hidden IDs per camera, unchanged source IDs, unchanged original ground buffer and exact baseline screenshot restoration. Technical pass does **not** imply art approval. No deployment, merge or production approval.

Risks: removal-only thinning can resemble a cut track; ground remains dark in cleared patches; local view may contain low density and little visual difference. Scene is a diagnostic viewer, not the actual completed walk. A park-like canopy cannot be fixed simply by removing trees.
