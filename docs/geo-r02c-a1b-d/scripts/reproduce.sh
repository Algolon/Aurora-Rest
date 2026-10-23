#!/usr/bin/env bash
# Reproduce the whole A1b-D dossier from the repository root of this branch.
# Needs: Python 3.13 with numpy, scipy, shapely, Pillow; Node with the repo's node_modules (Playwright + Chromium) for the SVG -> PNG step.
set -euo pipefail
PY=${PYTHON:-python3}
cd "$(dirname "$0")"
$PY rebuild_cache.py            # A1a diagnostic cache (git-ignored), verified against the committed variant SHA-256s
for s in visibility editability vis_map geomorph hollows c1_overlook gully_search pixel_diff failure_composites \
         check_projection concept_skylines concept_sections proposal_map decisions build_review; do
  echo "== $s"; $PY $s.py > /dev/null
done
(cd ../images && node ../../geo-r02c-a1d/scripts/render_png.mjs 1.5 csec-*.svg)
