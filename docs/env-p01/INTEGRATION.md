# ENV-P01 integration plan and audit

POP source: 4d562187c10e64884e2193a0b09ced6eed3b4b08. Original branch retained; one pre-existing untracked temporary water file is untouched. Isolated worktree starts at exact POP checkpoint. Owner's explicit milestone ancestry takes precedence over AGENTS.md's generic default-branch recommendation. No history rewrite or remote mutation.

## Architecture and decisions (before implementation)

POP: canonical 4 m HeightGrid triangulation; deterministic 64 m generation chunks; 128 m instanced render pages by default. LivingRenderer owns shared family resources, page handles borrow them. Alpha foliage/custom depth and grass/rock slope policies remain in original source adapters. Source LOD thresholds and fade settings stay unchanged. Original review cameras, keyboard walking, OrbitControls, warm lighting, 2048 PCF shadows, ACES exposure 1.05 and linear fog are retained.

MAT: classifyTerrain -> MaterialClassification weights/attributes -> TerrainMaterialQuery + TerrainMaterialResources. Stable slots forest-floor, meadow-turf, coastal-sand, bedrock. Classification reads terrain and water-surface lattice; POP water exclusion independently reads canonical water triangles. Never substitute water-mesh for the classification lattice. Texture arrays are synthesized off-thread. High/balanced/mobile profiles remain source-defined.

1. Replace only the existing POP mesh material; no additional terrain mesh.
2. Both systems use x east, z north, 4 m grid, west -3000/north 4000. MAT viewer scene.scale.x=-1 is presentation only, NOT imported into ENV.
3. Existing terrainGeometry positions and finite-difference normals are compatible with geographic shader inputs. No tile adapter necessary; existing geometry stays byte-identical.
4. MeshStandardMaterial shader injections retain Three's lighting, fog, log-depth and shadow chunks. POP scene settings take precedence; no MAT viewer lighting copied.
5. Worker loads MAT classification/textures independently from population generation. Separate water-surface fetch; no canonical buffers transferred away from POP.
6. One ENV ground adapter owns one material/resources pair (one acquire/release). Terrain meshes borrow it. Neutral material owned separately by adapter.
7. Profile/recreate releases material and four GPU textures, then replaces them; test actual renderer counters and owner underflow/use-after-dispose.
8. Material toggle never reaches population stream/settings. Verify full serialized descriptors, not only IDs; protect original POP source by Git blob hashes.

## Controlled source integration

Import only new MAT modules, isolated MAT viewer for regression, original MAT test/protected manifest and documentation; do not replace any POP modules. provenance.json records source blob and SHA256. Add build inputs without overwriting existing inputs. No WTR code imported. Faithful baseline is committed before any lookdev; optional lookdev only after real screenshots support it.
