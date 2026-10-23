# Aurora Rest — Cross-session working protocol

## Authoritative context
1. Read docs/project/PROJECT_STATE.md and the exact pinned technical reports on the appropriate source branches.
2. Inspect branch, full commit SHA and AGENTS.md if present; list missing verification rather than guessing.
3. Handoffs, screenshots and chat reports are evidence sources but NOT a substitute for recoverable source code.

## Each new task MUST define
- Repo, full pinned parent SHA and own isolated branch.
- Exact protected files / other branches, desired deliverables and accept/reject criteria.
- Technical vs art gates, reproducible source/browser captures, expected tests and true hardware limits.
- Whether pushing a feature branch is authorized. Never merge, deploy, force-push or rewrite parent history by default.

## Deliverables MUST include
- Unmodified source checkpoint plus any new code snapshot / Git commit SHA.
- Browser renderer screenshots with manifests, original camera/time/profile/lighting and SHA-256 hashes (not AI concept art).
- Tests, errors, measured limits, resource lifecycle, differences vs baseline.
- Separate statuses: TECHNICAL, VISUAL, OWNER ART, PRODUCTION PERFORMANCE.
- Recovery status when old Git objects are missing: restored bytes != restored ancestry.
- Durable GitHub docs/release/archive link, not a temporary Work link alone.
- Update the project-wide decision log / state from real evidence, so this chat can be deleted without losing knowledge.

## Approved next environments
- Claude Code High: MAT-01P shader cost & integration readiness, from MAT-01 pinned checkpoint; no MAT-02 expansion. See continuity pack prompt.
- Work: finish POP-02A/ENV-P01 source recovery only, using existing source snapshot and evidence; no repeat implementation.
- Normal ChatGPT Think/High: independent milestone/roadmap, NATURE-REG-01 and GEO-R02C art direction. No claims of engine implementation.
- Only after recovered source: POP-02B1 technical incremental page construction.

## Art/source safety
Canonical GEO fixed until owner explicit approval; MAT provisional ecological rules not automatically authoritative for population; hero rock studies not production; preserve Feh-Lu-We read-only. GitHub Actions artifacts can expire: secure originals separately.
