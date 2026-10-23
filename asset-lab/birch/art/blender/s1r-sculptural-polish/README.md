# Aurora Rest — one S1R sculptural polish

**ART CONDITIONAL · owner approval pending.** A refinement of the saved S1 editable cage, not a replacement generator or a new rock family.

## Actual files and structure

- `aurora-rock-s1r.blend`: saved native Blender 5.2.2 LTS project. Collection **10 S1R EDITABLE** holds the 39-vertex / 62-polygon source. **11 S1R EXPORT** holds its 96-triangle evaluated copy. Original S1 source/runtime collections remain as hidden backups inside this new file; the original separate files are unchanged.
- `aurora-rock-s1r.glb`: real selected-object export of the evaluated copy; Y up, metres, ground pivot, one primitive and material, 260 attribute vertices / 50 spatial vertices.
- `S1R_ART_DIAGNOSIS.md`: committed before artistic edits, at `65400f7697795818809ec9e1b26c2ba0057f496f`.
- `inspect-s1.py` / `s1-inspection.json`: actual original-file inspection, harmless disposable edit/save/export preflight and unchanged baseline rendering.
- `polish-s1r.py`: opens the protected S1 `.blend`, duplicates its existing cage and performs named vertex translations, five boundary inserts and face splits. It does not run S1's generator or reconstruct a new primitive.
- `validate-s1r.py`: independently reopens the saved new project and checks its actual mesh, attributes, groups, transforms and original backup. It also renders matched original silhouette/wire/plane diagnostics without resaving.
- `geometry-metrics.json`, `saved-blend-validation.json`: actual mesh/export measurements, input/output hashes, edit coordinates and file sizes.
- `baseline/`, `renders/`, `diagnostics/`: genuine Blender PNGs. Both models use the original neutral studio and identical camera directions, 52 mm perspective / 3.2 m orthographic width, 1000×820 output and 20 Cycles samples.
- `comparisons/`: labeled, matched before/after plates composed from those untouched Blender pixels, with no crop, rotation or scaling.
- `threejs/`: actual Chromium/WebGL GLB screenshots and metrics. Neutral/Nordic/grazing lighting, unchanged T1, S1/G1 comparisons and original Aurora vegetation.
- `regression-summary.json`: independent pinned original nature geometry and grass material pixel-parity results.

## Manual editing

Unhide collection 10 and hide 11. The 34 original named S1 vertex groups remain; five new groups identify **FRONT_LEFT_BREAK, FRONT_RIGHT_BREAK, LEFT_REAR_BREAK, LEFT_SIDE_BREAK, REAR_BREAK**. Custom `named_vertex_indices` maps all names to the saved cage. `geological_patch` face IDs still refer to the original 29 patch names, including split child faces; polygon indices themselves have changed.

Large frontal, western and rear panels remain planar quads. Warped roof/crown and supporting faces have explicit edges, so an artist can see/edit their actual normals and boundaries. There is no smoothing/subdivision stack to hide. Three named exposed edges are selectively beveled on the evaluated copy: J–K / K–L at 24 mm and N–G at 14 mm. The source fracture edges stay sharp. No random edge selection is used.

Source edits do not automatically update collection 11. Duplicate the revised cage and repeat the documented selected bevel, triangulation, flat-normal, UV/color and selected-export operations; alternatively record the deliberate edit in `polish-s1r.py` and rerun it. Original S1 files are read-only inputs.

## Reproduction

From repository root:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --threads 6 --python asset-lab/birch/art/blender/s1r-sculptural-polish/inspect-s1.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --threads 6 --python asset-lab/birch/art/blender/s1r-sculptural-polish/polish-s1r.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --threads 6 --python asset-lab/birch/art/blender/s1r-sculptural-polish/validate-s1r.py
```

`polish-s1r.py -- --preview` renders only three diagnostic views but uses the same single model; it is not a second variant. Run the full commands for all evidence.

From `asset-lab/birch`:

```sh
npm install --no-audit --no-fund --package-lock=false
npm test
npm run build
npx vite build --config vite.s1r.config.ts
node scripts/capture-rock-s1r.mjs
node scripts/compose-s1r-plates.mjs
npm run dev -- --port 4225
```

Open `/rock-s1r.html`. Set `CHROME_PATH` to an installed Chromium when needed. The actual two Blender GLBs are loaded using `GLTFLoader`. Side-by-side orthographic layout follows the camera's screen-right axis so left/rear views remain separated and original S1 stays on the left. Comparison models do not receive each other's cast shadows; individual views retain self-shadowing. The floor still receives shadows. Front-sided neutral material is the primary review; T1 source/palette/maps/shaders remain unchanged.

CI runs the checked-in export, all 50 tests, protected-file diff guards, both builds, genuine WebGL and independent pinned nature parity. It does not install Blender or claim native editing/art approval. The separate reference runtime used by parity tests is disposable and never a production dependency.

No world integration, batching, LOD or collision physics is included. Static geometry and local attributes are suitable inputs for later instancing; that integration is not validated here. Future collision may use a simpler proxy rather than the render mesh.
