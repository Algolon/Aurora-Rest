# F01 technical handoff — staging only

**R2 and R3: ART NOT APPROVED.** Their source files, exports and technical infrastructure are preserved for review. Do not populate the playable island with these shapes on the strength of passing tests. R1 retains its prior S1R candidate status; F01 makes no new owner approval claim.

The reusable loader/registry, lifecycle contract, deterministic demo placement and instancing adapter are technically validated. They can support later accepted replacement geometry through the same explicit registry contract.

## Runtime contract

`rockFamily.ts` exports `loadNordicRockFamily`, `ROCK_ASSETS`, `ROCK_ARCHETYPES` and `RockTransform`. It loads actual GLBs with GLTFLoader, requires complete finite attributes and checks expected physical bounds. A failed partial load releases completed geometries. The family owns all imported geometries; meshes and instance groups share them.

```ts
const family = await loadNordicRockFamily();
const rocks = family.createInstances('compact', [
  {position: [12, terrainY - 0.08, 7], rotationY: 1.4, scale: 0.95},
]);
scene.add(rocks);
// On region/owner shutdown, after removing references:
family.dispose(); // removes created objects, frees instance buffers, geometry/material/maps
```

All placements remain owned until `family.dispose()`. There is no per-object release API in this pilot; use one family owner per finite region or extend ownership deliberately for streaming. Do not dispose shared geometry/material per placed mesh. If supplying `material`, it is borrowed and caller-disposed; custom materials must support instancing themselves. Disposal is idempotent. Creating new objects after disposal throws.

| ID | GLB path relative to asset-lab/birch | Width × height × depth (m) | Triangles |
|---|---|---|---:|
| compact | art/blender/s1r-sculptural-polish/aurora-rock-s1r.glb | 2.157 × 1.657 × 1.566 | 96 |
| broadGlacial | art/blender/f01-nordic-rocks/broad-glacial/aurora-broad-glacial.glb | 5.130 × 1.940 × 2.560 | 90 |
| sculptural | art/blender/f01-nordic-rocks/sculptural/aurora-sculptural.glb | 3.500 × 2.857 × 3.320 | 106 |

Units are metres, Y-up, pivot `(0,0,0)` at the ground plane, identity orientation/scale. Slight footprint asymmetry is intentional. `getDimensions` returns measured local bounds. GLBs have one material slot; imported neutral materials are replaced and disposed.

## Shared material and reuse

The default owner creates one existing A2 factory and shares `materials.T1.triplanar`. Protected texture/shader source is unchanged. The factory creates nine study textures once; T1 uses three. This remains a small, documented allocation overhead, not per-placement allocation. Triplanar position is in authored metric space, so differently sized archetypes have comparable grain scale; placement scaling 0.82–1.12 changes it slightly. UVs also remain available.

F01 locally wraps the existing compile hook so micro-normal axes follow the instance transform, while retaining T1 palette, maps and projection. Ordinary-versus-instanced image comparison is part of `capture-rock-f01.mjs`. Default uniform scaling is preferred; rare mild nonuniform scaling is demonstrated but should stay restrained. Geometry/material are shared by ordinary meshes and instance batches. The demo uses three rock instance groups, one per archetype; each still participates in the shadow pass.

## Placement guidance, conditional on later art acceptance

Use compact stones most often in woodland/path/meadow edges; broad glacial stones sparsely in open valleys, clearings and lakeshore transitions; sculptural stones infrequently at foothill/trail/viewpoint locations. The demonstration has 24:5:5 placements across three small zones. This is a review composition, not a measured island-wide density prescription. Start with that relative rarity, then tune against the authoritative terrain and traversal layout.

`pilotLayout.ts` is a deterministic staging example with seed 10101, yaw variation, scale 0.82–1.12, occasional ±4% footprint variation, conservative pairwise clearance and clear trails. It samples a mild demonstration heightfield; it is **not** a production terrain adapter. It embeds rocks 55–130 mm below the lowest sampled footprint height. On real slopes evaluate footprint support, bury/skip unsuitable placements and check traversal; never simply reuse the showroom height function.

## Dependencies and deferred work

The module depends on Three.js/GLTFLoader and the asset lab's existing A2 T1 factory. The demo additionally uses approved birch, Scots pine, grass, ground texture and RNG modules unchanged. It has no world/GEO/ENV/POP/MAT runtime dependency. No external Feh Lu We application is loaded at runtime; original-source provenance remains documented in the existing asset library.

No collision proxies, authored LODs, region streaming or full world batching are supplied. Future collision work should use simple, separately validated proxies. Instance batches need region-level partitioning for useful culling; the three demonstration-wide batches are deliberately coarse. T1 sharing and shader compatibility must be preserved when integrating with any future population renderer.

A possible future branch is `codex/asset-01f01-controlled-world-integration`, **proposed only**, starting from the owner's confirmed authoritative world/population checkpoint. None is selected here. Before that work: obtain art disposition, confirm compatible GEO/ENV/POP/MAT checkpoints, reconcile module paths/material ownership, test terrain anchoring, collision/traversal and actual device budgets. Copy or port only the scoped pack/interface changes; do not merge the old asset-lab ancestry wholesale into an active world branch. No island integration is performed or authorized by this handoff.
