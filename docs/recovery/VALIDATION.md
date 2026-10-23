# RECOVERY-R02 validation

2026-10-23, local macOS ARM64, Node.js 24.16.0 / npm 11.13.0.

| Check | Observed result |
| --- | --- |
| Original outer ZIP / nested ZIP CRC and safe paths | PASS |
| Original source manifest | PASS, 558/558 exact sizes and SHA-256; no missing/extra source files |
| Nine separately supplied ZIP parts | PASS, 558 unique files matching the same source manifest |
| GEO anchor | PASS, 293/293 original files retained byte-identically |
| MAT imports | PASS, 22/22 pinned Git blob and SHA-256 comparisons |
| Nature upstream | PASS, 22 exact files plus one exactly reproduced historical grass compatibility patch |
| npm ci | PASS, 28 packages installed from unchanged lockfile |
| npx tsc --noEmit | PASS |
| npm test | 73 PASS; one historical Git-object parity test BLOCKED (test process exits 1) |
| Production build | PASS; existing >500 kB chunk advisory |
| Production preview WebGL | PASS, actual Three.js canvas captures and no browser/network errors |
| Re-entry | PASS, three valley/forest cycles preserve full placement hash and GPU geometry/texture counters |
| Material toggles | PASS, neutral/weights/material preserve full placements and terrain geometry |
| Resource lifecycle | PASS, six balanced/mobile/high recreate operations, owner count 1; stable high-profile counters; teardown succeeds |

Browser: Chromium 151.0.7922.34 using ANGLE Vulkan SwiftShader. New ground-level forest and elevated forest/valley PNGs are genuine canvas readbacks from the built combined ENV viewer, distinct from preserved historical evidence. See validation/browser/result.json. This is software WebGL smoke evidence, not physical desktop/Android performance qualification or art approval.

The 74th test remains unchanged at tests/env-p01.test.ts. It compares original POP Git tree/blobs against recovered source. GitHub API 404 and upload-pack “not our ref” confirm its original object is unavailable. It is explicitly blocked, not a demonstrated source regression. Full suite and preserved CI therefore remain red until original history is supplied; no automatic pass substitution is introduced. Deterministic population, cross-chunk/worker behavior, protected sources, geometry and lifecycle assertions in the remaining original tests pass. See validation/tests.txt, typecheck.txt, build.txt and results.json.

Initial Chromium launch was denied by the execution sandbox; the same check succeeded with the required process permission. No source change was needed. The original preserved reentry tool was not run in-place because it overwrites historical resume-browser.json; tools/recovery/browser.mjs checks the same invariants plus material/profile operations and writes separate RECOVERY results.

Fresh GitHub checkout validation is recorded in FRESH_CLONE.json once the isolated branch has been pushed and independently downloaded. A local worktree or shared object clone is not treated as fresh-clone proof.

Decision pending independent GitHub retrieval: source validation permits pushing only the isolated recovery branch. No merge, PR, deployment or release is authorized.
