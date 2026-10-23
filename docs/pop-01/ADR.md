# POP-01 architecture decision — hybrid hierarchical chunks

Status: implemented review candidate. Source exception is milestone-specific: the owner's POP-01 request explicitly selects `90d0cb745e8e51a3dc737bd4dc11d6f8c322758b`, overriding AGENTS' default-branch ancestry for this branch only. Repository policy files remain unchanged. Initial remote search and local ref inspection found no POP branch or implementation. See `preflight.json` for clean state, source pins and protected hashes.

| Option | Determinism / seams | Ecology / authoring | Runtime / Android tradeoff |
|---|---|---|---|
| A: independently seeded tiles | Simple; tile-owned RNG often creates seams and order-dependent border arbitration | Weak without a second patch system | Small tasks, easy unload; boundary logic still necessary |
| B: hierarchical biome distribution | Good if evaluated as continuous world fields | Strong region → community → patch controls | Monolithic generation or retaining a world forest is inappropriate; needs streaming added |
| C: hybrid hierarchical chunks | Stateless world candidates + halo priority thinning; chunk owns results only | World fields and explicit composition masks independent of chunk grid | Bounded active set, smaller generation units, easy adapters; more render groups at small sizes |

Choose C because existing Nature batches expect reusable family geometry, scene registration and explicit disposal, while the 48 km² envelope rules out a permanent mesh per item. Pure geographic/ecological query + pure placement generator + lifecycle manager + renderer are separate modules. No MAT-01/WTR-01/GEO refinement branch is imported. No new global biome authority is established.

## Geographic contract and provenance

`EnvironmentQuery` in `contracts.ts` is a **proposed reconciliation boundary**, not an already agreed canonical environment API. `INPUT_STATUS` enumerates VERIFIED / DERIVED / ART-DIRECTED / FUTURE. A later shared API can replace this adapter without replacing the generator. Keep the names/units and provenance explicit during MAT reconciliation.

* VERIFIED: committed 1501 × 2001 terrain nodes, 4 m cells, world x −3000…3000 / z −4000…4000; sea level 0; clipped water mesh and water-surface raster; named anchors and six candidate routes.
* DERIVED: Y uses the exact canonical triangle interpolation, not bilinear interpolation or regenerated terrain. Slope is gradient magnitude (0.55 = 55%, not 55 degrees), normal from an 8 m central difference. Water queries use the committed clipped triangles, subtracting their documented 0.025 m display offset. Sea exclusion also applies outside mesh triangles at level 0. A height > water + 0.06 m is required.
* DERIVED: wet/dry boundary edges from cancellation of shared water-mesh triangle edges; indexed coast including offshore islands, route centrelines and water triangles. Distance queries are exact **within caps**: coast 192 m, water edge 64 m, tread 32 m. Saturated values mean “at least cap”, not an exact long distance. Rendered geometry is never the owner of placement truth.
* ART-DIRECTED: nearest anchor labels; smooth anchor-weighted woodland affinity (450 m exponential falloff), elevation/coast exposure proxy, proximity/low-slope moisture proxy, community suitability, treeline and narrow route buffers. These are deliberately provisional. No soils, groundwater, measured wind or geology dataset exists here.
* FUTURE: canonical MAT environmental classifications; soil/depth/bedrock fields, hydrologic saturation, wind shelter; exact physical tread and scenic view masks approved by the owner.

The route data includes broad reservations (e.g. hero 130 m), but the exclusion uses only centreline distance: 3.3 m tree, 1.15 m grass, 2.6 m rock. These are conservative provisional half-widths including object clearance, not a 130 m empty forest strip. They do not certify that a final path has been built. Canonical bridge/deck positions remain untouched; plants never populate water beneath them.

## Distribution and stable identity

1. Geographic anchor weights and conservative suitability establish large regions. They are proposals, not measured biomes.
2. Seven community definitions select available birch, pine, generic grass and production-rock family identifiers. Alpine/heath, wetland and dune labels **do not imply absent heather, sedges or dune species exist**; those requirements are marked future.
3. Continuous world-coordinate fields at 310 / 68 / 17 m generate large masses, patches, nested variation and glades. A separate 220 m field groups pine/birch. Forest affinity blends tree density across regional labels. Community categorical changes can still be abrupt; this is a known calibration limitation.
4. Jittered world lattices produce candidates at 7 m tree, 2.8 m grass, 11 m rock cells. ID = seed:layer:lattice-x:lattice-z. Independent integer hashes select attributes; there is no mutable RNG stream. X/Z identity survives chunk repartitioning. Future terrain changes requery Y and eligibility; some accepted IDs disappear or appear as suitability changes. This is expected, not a promise of identical populations on different geography.
5. Valid-candidate Matérn-II thinning uses a finite halo and total priority ordering. Trees of both species share spacing; trees and rocks also compete as solid objects. Grass spacing is independent, allowing understory. A lower-priority valid candidate may suppress a neighbor even if it is itself later suppressed; this slightly reduces density but makes outcomes local and order independent. Halo evaluation applies the same geographic/composition constraints as owned candidates. No sequential cross-chunk acceptance state exists.
6. Explicit `CompositionMask` glades and vista cones can reserve open space by family. Default list is empty: no invented view reservations are silently applied. Named owner-reviewed masks are a POP-02 composition task. Rock descriptors keep queried Y separate from burial; trees stay upright, grass/rocks receive terrain normals. Proxy transforms compose terrain alignment then local yaw.

## Chunking, memory and lifecycle

Benchmarks compare 64 / 128 / 256 m chunks over identical aligned 512 × 512 m windows. 64 m is the provisional default because a synchronous chunk is a non-preemptible CPU task. The review keeps radius 2 (25 chunks, 320 × 320 m), generating incrementally under an 8 ms **soft** budget; chunks may exceed it. Production should use a worker or resumable jobs before claiming hitch-free Android streaming. 128/256 m are selectable for review; those use radius 1.

`PopulationStream.target` cancels stale pending work, unloads undesired chunks first, and orders new work by distance. `tick` attaches before accepting state; failed atomic attach can retry. `clear` drops all population and buffers; re-entry recomputes. `dispose` clears and terminates renderer lifetime. There is no archive of unloaded instances or GPU geometry for every island cell. Candidates and halo caches are per generation call and garbage collected. Family resources belong to the adapter; per-chunk instance buffers belong to the chunk. The diagnostic renderer shares four geometries/materials and releases instance meshes on detach.

A placement is an object descriptor intended for debugging and interchange, not yet a packed production format. Reported UTF-8 JSON bytes are measured serialized size, **not JS heap or GPU memory**. Query initialization loads the canonical whole-island terrain and builds static water/line indices; this retained geographic memory is separate from active population memory. No native memory leak claim follows from a stable geometry count alone.

## Review rendering boundary

`pop-01.html` is an isolated Vite entry; the existing world/geography entrypoints are unchanged. Neutral terrain and static blue canonical water are context, not MAT/WTR work. A 1024 m square at full 4 m canonical resolution surrounds the selected anchor. Beyond that square terrain is omitted, so horizon water can be visible where distant land would exist. It must not be interpreted as new island geography. The review is local, and the active population square is deliberately limited and toggleable. World streaming logic is independent of this local terrain viewer; continuous full-island terrain streaming is out of scope.

Proxies use instancing, family visibility, per-instance frustum rejection and a ground-cover render distance (90 m walking). They have no production tree LODs, source alpha foliage, grass fade or source shadows. All proxy captures are labelled; they cannot establish production asset quality or cost. Renderer draw calls/triangles are real WebGL submission metrics, including terrain and the full static canonical water mesh; descriptor counts are separately labelled.

## Consequences

The engine is independently testable and survives the planned geography/material/water work through adapters. CPU granularity, source-family draw groups, smooth community boundaries, richer moisture/exposure and composed hiking scenes remain major POP-02 decisions. No production density for 48 km² is inferred from the small test windows. Ecological plausibility and artistic beauty remain separate owner review gates.
