# ASSET-UNDERSTORY-R01 — verified Nordic forest-floor specimen dossier
**Status: BOTANICAL CONCEPT STUDY / ART NOT APPROVED.** All source code new on an isolated branch from recovery `bced77ca3ca0539f7137cd9f066e6220518cf4a8`. No asset integration or deployment.

## Scope, evidence and reference identification

1. **Vaccinium myrtillus — common bilberry / blauwe bosbes.** Deciduous, suckering, commonly ~0.2–0.4m in suitable woodland, slender angular green stems and small ovate leaves with toothed margins; forest understory low bush/rhizome. Source: Royal Horticultural Society https://www.rhs.org.uk/plants/18701/vaccinium-myrtillus/details/ and Woodland Trust https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/plants/wild-flowers/bilberry/ . Design: real-size thin upright angled branches, small elliptic curled leaf laminas, irregular negative spaces. NOT a broad fern frond or grass.
2. **Vaccinium vitis-idaea — lingonberry / rode bosbes.** Low evergreen subshrub, frequently only 0.05–0.15m high, spreading by trailing rhizomes into colonies; small dark glossy leathery oval leaves; no bright red fruits by default. Source US Forest Service FEIS https://research.fs.usda.gov/feis/species-reviews/vacvit . Design: creeping runners, paired/alternating small leaflets, darker mass and sideways spread vs bilberry.
3. **Hylocomium splendens and Pleurozium schreberi — feather moss / etage- en bronsmos-like carpet.** Dense overlapping feathery shoots on shaded humus in cool forests, creates a ground layer rather than individual distant grass clumps. Source U.S. Forest Service https://research.fs.usda.gov/feis/species-reviews/hylspl and open botanical paper https://pmc.ncbi.nlm.nih.gov/articles/PMC5691860/. Design: fine horizontal branchlets and uneven hummock carpet, almost no vertical spikes. **Moss study is genus-inspired rather than a botanical taxonomic reconstruction.**

## Real-image visual anchors (view sources only, do not embed copyrighted photos/assets in repository)
- Bilberry understory photography: Poland State Forests public educational page https://www.lasy.gov.pl/pl/edukacja/lesnoteka-1/rosliny-runa/borowka-czarna
- Detailed bilberry leafy twigs: https://www.looduskalender.ee/n/node/9783
- Feather moss photo + closeup: https://snl.no/etasjemose ; https://florafinder.org/Species/MoreInfo.php?picture=Hylocomium_splendens-F868A3F521.jpg
- Study overview: https://research.slu.se/en/publications/understory-vegetation-as-a-forest-ecosystem-driver-evidence-from-/

No remote photo is shipped or copied. Only custom, original Three.js geometry authored for this repository, linked to specimen references; do NOT treat a photo's composition as asset licensing.

## Design principles
- **One diagnostic botanical family, not a production vegetation system.** Exactly three distinct specimen kinds, 3 deterministic variants each.
- Geometry in metres, small low-poly curved-leaf shapes with vertex colors, irregular stems and size contrast. No alpha billboard, atlas, PNG textures or Blender.
- Comparison showroom with labels and fixed WebGL eye-level, macro, overhead renders. Present clean non-world-scene comparison before integration.
- If shape reads like spiky paper stars, evergreen shrub is too tall, moss is a row of grass or stems float above the surface: ART REJECT or REVISE.
- No merging, canonical geography changes, changed game files, island ecology, additional material shader, user device performance claim or deployment.

## Quality gates
Node deterministic geometry tests, TypeScript check, isolated Vite build, genuine headless Chromium SwiftShader shots, metrics (<100k submitted triangle ceiling for full specimen room / <=12 draw calls), lifecycle disposal tests and review of visible screenshots. PASS != ART APPROVED.

## User-centered stop condition
One actual visual candidate. A single targeted pass only if a meaningful morphology flaw can be corrected promptly; do not restart an endless sculpting loop. Subsequent game integration requires separate explicit approval and new source-asset QA.
