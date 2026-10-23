# Aurora Rest — S1 geological sculpt

**One authored rock study. ART CONDITIONAL. Owner approval pending.**

- `aurora-rock-s1.blend`: actual Blender 5.2.2 LTS project, not a placeholder.
- `aurora-rock-s1.glb`: actual Blender glTF 2.0 export. Metres, Y up, ground pivot, one mesh, 94 triangles.
- `build-rock-s1.py`: explicit shared-vertex control cage and named geological patches; no Boolean, convex hull, noise, subdivision or independent shoulder.
- `validate-blend-s1.py`: reopens the saved project and checks accessible geometry without reconstructing it.
- `geometry-metrics.json`: Blender construction, topology and GLB re-import results.
- `saved-blend-validation.json`: independent saved-project results and artifact SHA-256 hashes.
- `renders/`: eight actual Cycles neutral views.
- `diagnostics/`: actual Blender primary-form, silhouette, source wire, plane-direction, shoulder and contact views.
- `references/`: immutable original A-V0/V2/V3/G1 vertex snapshots and actual Blender reference renders; original meshes are not S1 inputs.
- `threejs/`: genuine Chromium WebGL screenshots loading the GLB, plus browser metrics.
- `review.html`: local visual index, with renderer labels.

## Editing

Open the `.blend` directly. Collection **01 EDITABLE** holds the original 34-vertex / 29-polygon cage. It is hidden initially: unhide it and hide collection **02 EXPORT** when editing. Named vertex groups identify structural points; the `geological_patch` face attribute and `patch_names` custom property identify source patches. R/S are the shared shoulder hinge/ridge. Source geometry can be edited in Blender without running any script.

Collection **02 EXPORT** contains the flat-shaded 49-vertex evaluated stone mesh with five selective 18 mm bevel edges, UVMap and Color attributes. The modifiers are baked only on this copy. Editing the source does not automatically regenerate this copy: duplicate the revised source and repeat selective bevel/UV/export steps, or update the constructor for reproducibility. No opaque procedural node dependency is required to open the model.

Collections **03 REVIEW** and **04 REFERENCES** are studio and comparison objects, excluded from the selected-object GLB export. Do not export the entire scene.

## Reproduce

From repository root, with the verified local Blender executable:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --threads 6 --python asset-lab/birch/art/blender/s1-geological-sculpt/build-rock-s1.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python asset-lab/birch/art/blender/s1-geological-sculpt/validate-blend-s1.py
```

`-- --primary-only` renders the un-beveled primary cage only; it intentionally replaces the saved project with that stage. Run the full constructor afterwards for the complete deliverable. `-- --reuse-reference-renders` reuses only already-existing unchanged historical reference PNGs; S1 views, diagnostics, GLB and project are regenerated.

From `asset-lab/birch`:

```sh
npm install --no-audit --no-fund --package-lock=false
npm test
npm run build
npx vite build --config vite.s1.config.ts
node scripts/capture-rock-s1.mjs
npm run dev -- --port 4221
```

Open `/rock-s1.html`. `CHROME_PATH` can select an installed Chromium executable. The browser uses Three.js `GLTFLoader`, not a procedural substitute. The S1 config builds this isolated entry explicitly; the original lab entry is unchanged.

Reference reconstruction is optional. The checked-in `reference-geometry.json` is sufficient for both renderers. To reconstruct it, fetch the pinned B1R2 checkpoint, install **only as an optional local tool** `three-bvh-csg@0.0.18` (`npm install --no-save --package-lock=false three-bvh-csg@0.0.18`), then run `node --experimental-strip-types scripts/export-s1-references.mjs`. This reads the original V3 implementation from Git, creates/deletes its own temporary adapter and never modifies protected originals. CSG is used only to reproduce the rejected historical reference; **S1 never uses CSG**, and no CSG runtime dependency is added.

## Material and evidence limits

Primary review is neutral, front-sided `MeshStandardMaterial` with vertex colors disabled. The secondary review directly reuses unchanged A2 T1 triplanar material with exported `COLOR_0` and local positions/normals. No shader adapter or texture changes were needed. Per-face UV density is 0.38, consistent with the existing material convention. Blender's studio shader is not expected to reproduce the A2 custom Three.js shader.

Blender uses neutral Cycles area lighting; Three.js uses the lab's neutral hemisphere/directional setup and ACES. Camera directions and metric scale are comparable; pixel-perfect lighting parity is not claimed. Review front/rear/sides/top before judging the material pass.

Static CI checks the GLB and Three.js only. It cannot establish Blender editability or artistic approval. No Android measurements, island integration, collision work, merge or deployment.
