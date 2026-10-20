# ASSET-01B1 — Faithful Birch Family Lab

**Status:** standalone experimental asset lab; independent of Aurora WORLD-01/01B.

Pinned source: `Algolon/Feh-Lu-We@17eafb0902833fb1121c77083f9f862eb4ffcd96`.

## Run locally
```bash
cd asset-lab/birch
npm install
npm test
npm run build
npm run dev
```
Open the local URL from Vite. This is **not** a deployment.

The gallery shows the three source birch variants with near/mid/far geometry, and a logical xfar level which shares far geometry. Controls: variant, LOD or auto, distance, orbit, daylight/neutral, front/side/three-quarter/bark close-up.

## Scope
Files under `asset-lab/birch` are independent from `src/world`, `src/render` and the main Aurora entrypoint. No WORLD-01 code imports this lab. Geometry is generated on demand from fixed Feh Lu We seed constants. Repeated builds cache nine combined geometries per family instance.

## Caveats
The extracted geometry has independent raw-attribute parity with the pinned Feh Lu We implementation (CI run 39500076428). The showroom has real WebGL 2 browser screenshots; matched material pixel parity and physical device performance remain unverified. Shaders use a scoped material patch replacing Feh Lu We's global ShaderChunk mutation. This is not an island population or batching benchmark.
