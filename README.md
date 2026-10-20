# Aurora Rest — WORLD-01 (experimental terrain foundation)

A standalone, deterministic, Kungsleden-inspired Nordic wilderness terrain prototype, authored for **Three.js + TypeScript + Vite**, with an 8 × 6 km design envelope.

**Status:** Source files and geography tests are written and run locally. The actual Three.js scene has NOT yet been bundled, browser-rendered, performance profiled or visually accepted. Treat this as a candidate implementation, not a verified playable release. The canonical repository is `https://github.com/Algolon/Aurora-Rest`. Work is kept on a dedicated feature branch pending review; no merge or deployment is authorized.

## Quick start (requires an internet-enabled dev environment to obtain dependencies)

```bash
npm install
npm run dev
```

Open the local address reported by Vite. For a production bundle: `npm run build` and `npm run preview`. Geography-only checks use `npm run test:geo` (Node.js 22+ with TypeScript stripping). **Build and preview are pending real execution.**

## Controls

| Control | Behavior |
|---|---|
| WASD / arrows | Walk |
| Mouse | Look around after clicking the view |
| Shift | Faster movement |
| F | Toggle fly/walk; fly uses Q/E to descend/ascend |
| O | Overhead island inspection, with WASD pan and Q/E elevation |
| 1–9 | Teleport to named viewpoints |
| Mobile | Drag left half to walk, right half to look |

The camera is eye-level in walk mode (eye height 1.75 m). The controller currently snaps/smoothly follows the ground surface; **it is not a complete physics implementation**. It does not yet handle slope limits, step-up, acceleration, obstacles, swimming or meaningful jumping.

## What is authored

- `src/world/config.ts` — island scale, seeded parameters, landmark anchors, main river profile.
- `src/world/geography.ts` — editable coastline, authored mountain ridges, glacial valley and saddle, alpine lake depression, drainage grading, surface-height queries and biomes. Independent of WebGL.
- `src/world/routes.ts` — main hiking routes, authored as macro polyline anchors.
- `src/render/terrain.ts` — chunked high/low mesh resolution, vertex colors, per-tile geometry replacement based on camera distance.
- `src/render/water.ts` — ocean, alpine lake and stream ribbon (simple placeholders).
- `src/render/landmarks.ts` — tiny cabin, cairns, a sparse set of low-detail instanced trees and boulders. **These are new placeholders, NOT Feh Lu We asset exports.**
- `src/render/trails.ts` — terrain-following route ribbons to aid navigation; not finished paths.
- `src/main.ts` — rendering scene, atmospheric daylight, first-person look, touch controls, inspection modes, diagnostics.
- `tests/world.test.ts` — 12 executed geographic/data quality tests.
- `docs/world01-terrain-diagnostic.png` — a heightfield interpretation of the executed terrain function; **not a screenshot from Three.js**.

## Coordinates

The world uses metres. X increases to the east, Z increases to the north, Y is elevation. Sea level is 0. The terrain domain is 6,000 m east/west by 8,000 m north/south, with the irregular island coastline contained within these bounds.

## Quality gate

The first model data are coherent enough for a **first WebGL macro-terrain render/review**, but WORLD-01 is not visually accepted. Priorities: browser boot and bugfixes; coastal morphology; alpine-lake shoreline and river transitions; trail grade/collision; human-scale quality; actual FLW asset port; mobile GPU and draw-call validation. See `docs/WORLD_00_AUDIT.md` and `docs/WORLD_01_REPORT.md`. See `AGENTS.md` and `docs/PROJECT_INSTRUCTIONS.md` for mandatory repository boundaries.
