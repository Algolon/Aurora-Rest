# ASSET-01B1 — Fidelity review (evidence log)

Branch: `feature/asset-01b1-birch-lab`.
Source: `Algolon/Feh-Lu-We@17eafb0902833fb1121c77083f9f862eb4ffcd96`.
Target base: `Algolon/Aurora-Rest/main@d543f66a85f120a182eebe56e2d24f5770f250fb`.

## Scope
Isolated tree mesh and foliage/material port. No world integration or vegetative population. Multi-draw and Android stress deferred to ASSET-01B2.

## Evidence
- Original procedural algorithms: extracted from pinned source; see PROVENANCE.md.
- Nine unique mesh definitions: **implemented** (three variants × near/mid/far), with logical xfar alias.
- Deterministic test: **authored**, execution pending in an environment with npm/Three.js.
- TypeScript/Vite build: **pending verification**.
- Browser-rendered screenshots and equivalent source comparisons: **pending verification**.
- Pixel-level material parity: **not demonstrated**.
- Real GPU/Android measurements: **not conducted**.

## Acceptance decision
**TECHNICAL CANDIDATE, VISUAL ACCEPTANCE BLOCKED** until successful build, browser imagery and shader/material inspection are actually observed. Do not merge or deploy on the strength of source extraction alone.
