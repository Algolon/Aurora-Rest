# ASSET-01B1 — Source provenance & fidelity contract

- **Read-only source**: https://github.com/Algolon/Feh-Lu-We
- **Pinned commit**: `17eafb0902833fb1121c77083f9f862eb4ffcd96`
- **Target**: https://github.com/Algolon/Aurora-Rest/tree/feature/asset-01b1-birch-lab/asset-lab/birch
- **Branch base**: `main@d543f66a85f120a182eebe56e2d24f5770f250fb`.
- **Production family**: `referenceTreeModel('birch',variant,lod,'outline','trees-r03')`; variants 0–2, near/mid/far, far reused for xfar.
- **Source woodkit.ts**: sections 23–59, 61–64, 127–172, 182–324, 335–430 and 462–475 extracted to `src/geometry.ts`. Original source reference dispatch: lines 478–509 and 614–616.
- **Original source foliageStyle.ts**: seeded `foliageSprays`, `foliageAtlas`, `SPRAY_SAMPLE` and the eight-family tile layout retained in `src/foliage.ts` (other families only for atlas UV parity).
- **Original boslustSample.ts**: `mergeModel` algorithm and linear bark/leaf ratios (lines 324–333) retained in `combineBirchModel`.
- **Source core/rng.ts**: exact `mulberry32` implementation copied.
- **Source woodkit.ts materials**: shader atlas and depth discard pipeline copied from lines 1438–1642 into `src/materials.ts`. Non-birch shader branches retained for initial parity.
- **Source surfaces.ts**: tree profile GLSL transposed from global ShaderChunk patching to a material-scoped `onBeforeCompile` transformation. This is a necessary architectural deviation; pixel parity needs browser evidence.
- **Source vegetationLod.ts**: hybrid [22,36,62] m, 3m hysteresis and selector copied into `src/lod.ts`.

**No rights or assets are transferred from any unrelated repo.** This is adaptation of this owner's source repository into the owner's destination repository.

## Art statuses
Feh Lu We source production implementation: baseline. Aurora visually accepted: **not yet**. New spruce/rock/grass visual experiments: **not included**.

## Missing evidence gate
Exact raw geometry parity against the pinned original module was independently verified by CI run 39500076428 (3 variants × 3 unique LODs × both source parts). Matched reference screenshots, Android performance and shader pixel-level comparisons remain unverified.
