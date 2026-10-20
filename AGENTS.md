# Aurora Rest — mandatory working instructions

## Identity and canonical repository
- Project and world/game title: **Aurora Rest**.
- The **only authorized writable repository** for this project is **`Algolon/Aurora-Rest`** (`https://github.com/Algolon/Aurora-Rest`).
- Never push code, commits, branches, pull requests, releases, tags, deployments, or documentation for Aurora Rest to any other repository.
- **`Algolon/Feh-Lu-We` is READ-ONLY**: it may be inspected to identify reusable techniques and compatible procedural nature assets, but **must not be modified, committed to, deployed, or used as a working branch for Aurora Rest**.
- Any other project (including Little North, Project Vesper, Feh Lu We) is out of scope. Do not make even unrelated cleanups there.
- Reuse Feh Lu We architecture by extracting/adapting appropriately scoped source into **Aurora Rest** with documented provenance and independently tested dependencies. Do not create a runtime dependency on the full Feh Lu We application.

## Development and release safety
1. Before editing: verify `git remote -v` points at `https://github.com/Algolon/Aurora-Rest.git` (or exact same SSH repository). Verify worktree/branch and clean/dirty state; do not accidentally modify another checkout.
2. Work in small, isolated feature branches based on the current Aurora Rest default branch. Never force-push a shared branch.
3. Preserve reproducible checkpoints with focused commits and succinct audit logs, plus the observed HEAD SHA.
4. Run appropriate tests/builds and capture actual in-engine evidence before claiming success. Distinguish **implemented**, **tested**, **browser-verified** and **proposed**.
5. **Do not merge, deploy, publish GitHub Pages, or cut a release unless explicitly approved.** Draft PRs are permitted for review; do not enable auto-merge or auto-deploy.
6. Never copy credentials, local paths, production private data, or dependencies from unrelated repositories.
7. If access, dependencies, visual proof, or execution are unavailable, preserve the work safely and explicitly report the limitation. Never describe conceptual imagery/heightmap diagnostics as Three.js runtime screenshots.

## Scope and milestones
- Current stage: WORLD-00 audit complete; WORLD-01 **candidate foundation** only (macro terrain; not yet art-approved).
- First priority: build and run the actual Three.js + TypeScript + Vite scene, collect ground-level/elevated renders and performance evidence, correct geometry and traversal as needed.
- Then accept a high-quality Home Cove → Birchwood Forest → Central Valley → Cairn Saddle hero hiking corridor before expanding vegetation to the whole island.
- Avoid scope drift to narrative systems, NPCs, survival, weather systems or detailed cabin interiors.
- Target desktop browser and Android browser; performance goals require measurements on actual devices.

## References and precedence
- Project vision and repository constraints: `docs/PROJECT_INSTRUCTIONS.md`.
- Feh Lu We architecture audit: `docs/WORLD_00_AUDIT.md`.
- WORLD-01 result and known limitations: `docs/WORLD_01_REPORT.md`.
- Existing code under `src/` remains the source of truth for behavior. This file sets *working constraints*, not evidence that any runtime tests have passed.
