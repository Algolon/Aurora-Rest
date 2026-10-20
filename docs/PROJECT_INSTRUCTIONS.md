# Aurora Rest — project instructions (canonical)

**Title:** Aurora Rest  
**Repository:** https://github.com/Algolon/Aurora-Rest  
**Environment:** Three.js + TypeScript + Vite (desktop and Android browser)  
**Genre:** Peaceful, Kungsleden-inspired Nordic island hiking/exploration environment.  
**Art direction:** Premium Handcrafted Stylized Nordic Wilderness.

## Non-negotiable repository boundary
**Work exclusively within `Algolon/Aurora-Rest`.** All world code, terrain generation, configuration, asset extraction/adaptation, QA artifacts, build scripts, tests, documentation, branches, commits and pull requests for Aurora Rest belong here.

`Algolon/Feh-Lu-We` may be *read/inspected only* as a source of existing procedural trees, grass, rocks, vegetation batching, LOD, vertex-color style and deterministic placement patterns. Never write, commit, merge or deploy in Feh Lu We. Other projects are also out of scope. Do not couple Aurora Rest at runtime to Feh Lu We's application modules; copy/adapt only reusable components with documented provenance and independent testing. Never silently incorporate unaccepted experimental art assets.

## Experience and world design
Create a beautiful island whose landscape is rewarding to hike without quests, survival mechanics or combat. Prioritize wonder, serenity, scale, natural authenticity, exploration and belonging. Begin with an approximately 6 km east–west × 8 km north–south irregular island (editable parameters; sea level 0). The geography should comprise:
- North Peak: authored sculptural alpine massif, glacial valleys, high passes and snow pockets.
- High Tarn: elevated lake basin with credible catchment and downstream outlet.
- Cairn Saddle: principal traverse and view corridor.
- Birchwood Forest: mixed Nordic birch/pine/spruce forests and clearings.
- Hidden Fold: secluded valley with surprising alternate route connection.
- Mirelands: connected wetland and lower river basin.
- Dune Fields: sand and wind-driven coastal dune belt.
- Windward Coast: exposed, rugged coast with dramatic views.
- South Shoulder: gentler rolling uplands.
- Home Cove: sheltered southeast start, simple cabin placeholder and clear trails.

Use authored macro geography (island mass, ridges, passes, watersheds and watercourses) with **seeded** procedural detail, ecological vegetation placement, local editability and sensible LOD. Do not rely on random-noise terrain or biome-wide uniform asset scattering. Rivers must descend into lowlands; wetlands occupy realistic drainage; dunes belong in sandy exposed zones; treelines reflect elevation, moisture and wind. Preserve visual enclosure/reveal and landmark readability. Route network should form traversable loops: sheltered forest, dunes/coast, valley/wetlands, alpine tarn and Hidden Fold.

## Performance and quality
Prefer reusable vertex-colored geometry, instancing/batching, seeded placements, frustum culling, LOD and world-region visibility. Keep desktop 60 FPS / capable Android 30 FPS as **measurement goals**, not guaranteed achievements; use the Feh Lu We ~750k visible triangles / ~150 draw calls numbers only as historical context, not hard island caps. Implement walking + fly + elevated inspection modes, and debug FPS/draw calls/triangles/terrain chunks/player coordinates. Maintain a fixed attractive Nordic summer/early autumn daylight setting before advanced weather.

## Milestone sequence and gates
- WORLD-00 audit: inspect source asset architecture, identify clean extraction patterns and risks. Current state: completed audit, see report.
- WORLD-01 macro terrain: coherent recognizable island, prominent northern ridge, central valley/saddle, southern uplands, watershed, coastline, lake, lowlands and diagnostic views. **Candidate only; currently not accepted visually**.
- WORLD-02 hero corridor: Home Cove → Birchwood Forest → Central Valley → Cairn Saddle; develop one visually excellent traversable landscape section with detailed nature integration, trails, light and water. Must be convincing from player height before scaling to the full island.
- WORLD-03 ecological populations: forests, understory, grass, tundra, wetlands, coastal vegetation, botanical transitions and efficient batching/LODs.
- WORLD-04 hydrology and coastline polish.
- WORLD-05 remaining world population and connected trails.
- WORLD-06 hiking experience, environment and Android/desktop performance polish.

For each milestone, capture a full overview, geographic/biome diagnostics, actual Three.js ground-level render(s), hero viewpoint, measured runtime metrics and concise acceptance decision with blockers. **Do not equate generated 2D terrain images with runtime screenshots.** Do not merge/deploy without explicit approval. Work in small branches, test, review and checkpoint. Avoid broad uncontrolled implementation passes.

## Immediate next work
1. Verify Aurora Rest worktree and repository remote; install dependencies if available.
2. Run geography tests and complete TypeScript/Vite build, then run the real browser scene.
3. Inspect island topography and composition against supplied island concept art (the original reference must be provided as an actual source file for rigorous image comparison).
4. Fix camera, lake/river placement, slope safety, shoreline, scenic reveals and mobile controls before promoting any visual quality gate.
5. Extract independent, documented, tested Feh Lu We vegetation modules **only into Aurora Rest** after WORLD-01 acceptance.
