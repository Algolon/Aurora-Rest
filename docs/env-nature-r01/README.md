# ENV-NATURE-R01 — Authored Birchwood → Central Valley Composition Pilot

**Status: isolated review candidate. NOT art approved. NOT geography freeze.**

## Protected basis
- Parent: `feature/geo-island-r02-baseline-reconciliation@2ffcf1d1794528d2166846ca7cca874c11f33029` (recovery-derived).
- Canonical terrain: `public/geo-r02b/terrain.f32`, expected SHA-256 `fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a`.
- Original POP-01 generator, POP-02A worker/renderer, ENV-P01 adapter, MAT shader and assets remain untouched. No nature-regeneration or new asset family.
- This pilot runs on **R1 geography only**, regardless of the optional B2a comparison present in the parent review branch. The unresolved peak scramble and hero-corridor width are not approved.
- No changes to islands/coastline/lakes, no integration to production app.

## Creative intent

One deliberately short sequence; not an island-wide biome rollout.

1. **Enclosure** around Birchwood's forest-edge viewpoint. Existing trees remain dense outside two offset small openings (25 m and 16 m radii), with a sightline down the transition.
2. **Pause** near the west side of the hero trail bend (`[-358,-290]`) inside a 24 m clearing. Keep rocks and ground cover as intimate foreground structure.
3. **Release** toward Central Valley: a restrained 145 m canopy-only vista (heading in x-east/z-north convention), opening toward a 19 m meadow-threshold pocket near `[-237,-174]`.
4. **Preserve** untouched forest framing outside authored islands and the original coastline/hydrology. Do not erase entire forest mass or flatten the ground.

Masks are data, not handwavy noise; see `src/env-nature-r01/composition.ts`. Only `birch` and `pine` are ever suppressed. Their overlap creates irregular connected pockets while retaining the original tree distribution elsewhere.

## Important implementation decision

The existing `PopulationGenerator` supports composition masks, but feeding masks *into* generator rejection can change neighboring Matérn-priority thinning and add previously suppressed descriptors. This contradicts the owner's selection-only policy.

ENV-NATURE-R01 uses `suppressOnly()` **after** the complete unmodified generator run in a separate worker:
- Source `PopulationGenerator(...,{compositionMasks:[]})` generates the original population.
- Only a subset of source `Placement` objects passes into the renderer.
- No retained descriptor (ID, x/y/z, family, scale, rotation, tint, burial, chunk, metadata) is modified.
- Grass and rocks are never excluded by authored composition.
- Source mode and authored mode use identical seed, generation, terrain and material data. Protected source code is left intact.

This technique is a bounded pilot only. Large visual gaps may remain when ground MAT classification does not match the resulting canopy; no unapproved shader/material edits are included.

## Evaluate

```sh
npm ci
node --experimental-strip-types --test tests/env-nature-r01.test.ts
npm run build
npm run dev
# Browser: http://127.0.0.1:5173/env-nature-r01.html
# Query ?composition=source to view original source.
```

Review real Three.js camera presets `nature-glade`, `nature-turn`, `nature-reveal` with faithful MAT-01 selected, alongside original forest-edge/forest-corridor/valley-landscape. See CI `.github/workflows/env-nature-r01.yml` for a reproducible automated before/after and placement identity ledger.

## Stop / go

**Technical GO if:** required unit tests + typecheck/build pass; actual rendered source vs authored matched WebGL QA pass; all retained complete descriptors are identical; removed families only trees; view cameras dry; no missing textures/broken shaders.

**Art GO only if owner confirms**:
- Opening shapes don't read like bald circular cuts or unnatural holes;
- a legible woodland enclosure → glade → meadow release is visible from real walking height;
- no conspicuous dark forest-floor patches unsupported by canopy;
- rocks/grass/tree profiles retain coherent stylized appearance;
- source asset silhouette and performance remain within budget (not hardware benchmarked here).

If artistic effect is weak or masked areas appear implausible, reject these five masks and replace with **one bounded alternate design** instead of expanding into an island-wide terrain or asset experiment.

**Out of scope:** full corridor walkable tread (prior cross-slope issues still unresolved), a finished nature release, new props or textures, full forest density tuning, North Peak sculpting, Blender, production merge or deployment.
