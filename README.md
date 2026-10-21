# Aurora Rest — WORLD-01B

A standalone, deterministic Nordic hiking-world prototype in Three.js, TypeScript and Vite. Canonical repository: **Algolon/Aurora-Rest**. Development remains on a feature branch for review, without merge or deployment.

WORLD-01B runs in WebGL and aligns the macro geography with the supplied island illustration: northern mountain ridges, northeastern High Tarn, western woodland, eastern Hidden Fold, a central drainage corridor, eastern coastal dunes and southeastern Home Cove. The [geographic blueprint](docs/evidence/world-01b/geographic-blueprint.svg) translates the oblique painting into an editable top-down plan.

**Verified:** TypeScript/Vite production build; 19 geography, mesh-contact and traversal tests; desktop Chromium rendering and controls; touch controls under mobile-size browser emulation. Actual before/after renders, measurements and remaining limitations are in the [WORLD-01B report](docs/WORLD_01B_REPORT.md). **Art acceptance and physical Android performance remain unverified.** Trees, rocks, water and trail materials remain placeholders.

## Run locally

Node.js 22.18+ or 24 is required for native TypeScript stripping in the test tools.

```sh
npm ci
npm test
npm run build
npm run dev
```

Vite serves localhost by default. `npm run preview` serves the built bundle locally. There is no deployment workflow.

## Controls

| Control | Behaviour |
|---|---|
| WASD / arrows | Walk at 5 m/s; Shift at 10 m/s |
| Click scene, then mouse | Look; Escape releases pointer lock |
| F | Fly / walk; Q/E changes flight height |
| O | North-up overview; restores the prior walk/fly view on return |
| 1–9 or landmark menu | Teleport to a dry landmark and resume walking |
| Touch | Drag left half to move, right half to look |

Walking follows the rendered terrain triangles and the authored bridge deck. Swept steps block open water, excessive grades and the cabin footprint. This remains a simple controller: other placeholder props have no collision, and jumping, sliding and full character physics are outside this milestone.

## Editable geography

- `src/world/layout.ts`: reference-derived coastline and detached island controls.
- `src/world/config.ts`: scale, lake basins, watercourses, viewpoints and bridge.
- `src/world/geography.ts`: ridges, valley floors, shelf, drainage carving, regional masks and seeded detail.
- `src/world/routes.ts`: committed grade-aware route alignments. Recompute after geographic changes with `npm run routes:align`, then run tests and inspect the renders.
- `src/world/surface.ts`: triangle interpolation, water masks and walking checks.
- `src/render/`: chunked terrain, simple water, trail ribbons and independent placeholder landmarks. These are not Feh Lu We asset exports.

Coordinates use metres: X east, Z north, Y elevation. A shared world/camera reflection makes the geographic east/north convention appear correctly in a Y-up renderer. The design envelope remains approximately 6 × 8 km.

## Reproduce evidence

```sh
npx playwright install chromium
npm run dev -- --port 4192
# In another terminal:
npm run test:browser
npm run capture:world -- after
npm run routes:profile
node tools/profile-terrain.ts
node tools/draw-blueprint.mjs
```

`CHROME` can select an existing Chromium executable. `WORLD_URL` selects a local server, defaulting to port 4192 for the browser tools. Capture and deep control checks instrument the served development module only; no test API is shipped in the production bundle. For a production smoke test, start preview on port 4193 and run `WORLD_URL=http://127.0.0.1:4193 npm run test:browser -- --production`.

The committed `before/` evidence belongs to WORLD-01 commit `01d466bdca038f61ed7d5c43dbbe8eba05ed13fb`. Re-running a tool against the current branch does not recreate that baseline. Named viewpoints moved during geographic alignment; their coordinates are recorded in each runtime measurement file.

See [AGENTS.md](AGENTS.md) and [project instructions](docs/PROJECT_INSTRUCTIONS.md) for repository and release boundaries. [WORLD-00](docs/WORLD_00_AUDIT.md) and [WORLD-01](docs/WORLD_01_REPORT.md) remain historical foundation reports.
