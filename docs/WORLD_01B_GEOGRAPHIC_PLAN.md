# WORLD-01B — reference-derived geographic blueprint

Authoritative input: [user-supplied island illustration](evidence/world-01b/reference-island.png), supplied during this iteration, 2026-10-20. [Top-down blueprint](evidence/world-01b/geographic-blueprint.svg).

## Interpretation before implementation

The painting is an oblique composition, with substantial vertical exaggeration and compressed distant ground. Its decorative scale is not a surveyed measurement. Retain the provisional 6 × 8 km envelope, translate **relationships**, and do not trace mountain silhouettes as coast. North is up in the blueprint; east is right. Coordinates are editable design anchors in metres, not inferred survey positions.

| Region | Blueprint centre (east, north) | Intended relationship |
|---|---:|---|
| North Peak | -550, 2500 | Dominant northern / northwestern multi-summit massif |
| High Tarn | 1250, 2200 | Basin east of the massif, on an elevated northeastern shelf |
| Cairn Saddle | 100, 650 | Open passage south of the massif, between west woodland and eastern escarpment |
| Birchwood Forest | -1050, -350 | Large west-central sheltered woodland mass, with small lakes |
| Hidden Fold | 1350, 150 | Enclosed **eastern** valley below the High Tarn shelf, with a lake |
| Mirelands | 500, -1500 | South-central drainage basin, downstream of the mountain corridor |
| Dune Fields | 2150, -1700 | **Eastern/southeastern coastal** dune belt, north of Home Cove |
| Windward Coast | -2350, 300 | Scalloped, rocky western shore with headlands and detached islets |
| South Shoulder | -1050, -2550 | Southwestern uplands and cliffs; lower than North Peak |
| Home Cove | 1550, -3060 | Sheltered southeastern inlet with a headland protecting the cabin shore |

Central Valley is a connecting landscape, not an eleventh reference region: it runs from Mirelands northward to Cairn Saddle. Main drainage descends from High Tarn via the central/eastern valley margin into Mirelands and then Home Cove. Hidden Fold has a tributary connection. Western woodland lakes are small separate catchments; do not force every pond into the alpine river.

## Structural deviations in WORLD-01

1. Hidden Fold is on the **west**; it must move east and gain an enclosing escarpment.
2. Birchwood's actual placement is scattered/southeastern rather than the large west-central woodland in the reference.
3. Dunes lie across the **southern** shore instead of the east coast.
4. The outline is an almost continuous rounded island; the reference needs western coves, offshore rocks, eastern promontories and a protected, visibly indented southeastern Home Cove.
5. The single dominant rounded mountain and small northeastern lake are too weakly separated. Establish an articulated northern crest and an eastern lake shelf, with Cairn Saddle opening below them.
6. The river follows the eastern edge for most of its course. The wetland basin and outlet need to become a legible central-to-southeastern sequence.
7. The original overview has north at the bottom. Geographic north/east need a consistent render orientation before visual comparison.

## Proposed implementation scope

Replace the radial sine coastline with an editable authored boundary and a small set of offshore island controls. Move region/basin controls to the above anchors. Retain deterministic noise, tile rendering, controls, placeholder asset architecture and the feature-branch history. Preserve the mountain/valley hierarchy but recompose its ridges around the northwestern massif and northeastern shelf. Add an eastern enclosed lake basin and a main lowland drainage path. Re-route trails only after these controls are stable, checking water and grade along the actual triangulated walking surface.

This is substantial **macro-geographic reworking** within WORLD-01B. No detailed vegetation expansion, imported nature assets or decorative production work is planned. The blueprint records the proposal before implementation; final acceptance still requires new actual Three.js renders and tests. Exact illustration matching is an art-review decision, not something geography tests can prove.
