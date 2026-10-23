"""PROPOSAL data for the A1b-D review: option comparison and the list of changes that need separate authorization.
Numbers are copied from the MEASURED data files named in 'evidence'; ratings are design judgement and labelled as such."""
from b_common import *
vis=json.loads((DATA/'visibility.json').read_text())['viewpoints'];ed=json.loads((DATA/'editability.json').read_text())['viewpoints']
pp=json.loads((DATA/'proposal_plan.json').read_text());cs=json.loads((DATA/'concept_sections.json').read_text())['sections']
hol=json.loads((DATA/'hollows.json').read_text())['hollows'];gs=json.loads((DATA/'gully_search.json').read_text())['channels']
OPTIONS=[
 {'id':'A1b-alpha','family':'A','name':'Player-visible face relief, current protections','recommended':'first prototype',
  'measuredBasis':f"{pp['alphaTargetAreaHa']} ha of A1a-editable faces visible from Birchwood, Central Valley or the route; V1 changed 0 % of those cells",
  'visualGain':'medium: in-face relief (couloirs, buttresses, shadow lines) on the faces players actually look at; skyline unchanged (0 px)',
  'hydrologicalRisk':'low: cut-only on open faces, existing divide guard, same A1a validation','complexity':'low–medium: reuse the A1a face operator, add viewshed targeting and a couloir rhythm, face gate 0.75 → 0.60 on targeted faces',
  'authorization':'none beyond running A1b'},
 {'id':'A1b-beta','family':'A','name':'A1b-α plus summit block with a narrowed trail corridor','recommended':'second prototype, only if release R-A is granted',
  'measuredBasis':f"corridor ±20 m frees 4–18 % of the route skyline and 15–32 % of route-visible massif cells; release area {pp['betaReleaseAreaHa']} ha above 780 m",
  'visualGain':'high at player height on the hero ascent; medium from the far approaches','hydrologicalRisk':'low: cut-only flanks, divide guard; route risk medium, handled by a passability gate',
  'complexity':'medium: corridor geometry change + tread gate + walk test','authorization':'R-A corridor release'},
 {'id':'A2-raise','family':'A','name':'A2 stepped crest raise (+18 m)','recommended':'not now',
  'measuredBasis':'skyline shift 4–5 px from Birchwood / Central Valley; 3 px needs ≥ 9–11 m','visualGain':'low','hydrologicalRisk':'low','complexity':'low','authorization':'R-B crest raise'},
 {'id':'A-R2','family':'A','name':'Far-silhouette identity through a design-master crest revision','recommended':'strategic decision, outside A1',
  'measuredBasis':'far skylines are 62–82 % R1 crest band; a strong change (≥ 15 px) needs ≥ 50 m at 2.8 km','visualGain':'high (the only route to a new far silhouette)',
  'hydrologicalRisk':'high: requires an R1 re-solve, which P0 measured would move about 22 % of mainland cells','complexity':'high','authorization':'R-C design-master revision'},
 {'id':'C1-R','family':'B','name':'C1 rebuilt as a valley-head cirque in the NE hollow','recommended':'design accepted for later (A1c); needs a viewpoint',
  'measuredBasis':f"hollow is a real valley only below ~650 m (45–124 m deep, ~500 m wide); 0 % visible from far / route, {hol['NE']['visibleSharePct']['tarn']} % from High Tarn; 43–51 % from the lower A1 crest",
  'visualGain':'high geomorphological credibility; low at current player positions','hydrologicalRisk':'low–medium: sea catchment, cut-only, floor grades out, ravine untouched',
  'complexity':f"high: headwall, floor, lateral rib, secondary couloir, lip; max lowering {cs['C1R-long']['maxLoweringM']:.0f} m",'authorization':'R-D C1 redesign, R-E overlook path'},
 {'id':'C1-tarn','family':'B','name':'Cirque on the visible tarn side (A1-D C2-a site)','recommended':'not recommended',
  'measuredBasis':f"planar ESE slope, no valley head (0–23 m deep); visible {hol['TW']['visibleSharePct']['far']} % far / {hol['TW']['visibleSharePct']['tarn']} % High Tarn",
  'visualGain':'high visibility, but the valley head would have to be invented (decorative risk)','hydrologicalRisk':'medium–high: High Tarn catchment, saddle fill','complexity':'high','authorization':'R-F C2-a (deferred by D2)'},
 {'id':"G1'",'family':'C','name':'Asymmetric cut-bank gully, tarn-inlet-w s 296–472 m','recommended':'design accepted for later; calibration only',
  'measuredBasis':'hillside (north) relief 31–38 m, south bank 4 m, cut room 0–1 m, 100 % visible from High Tarn, 0 % far','visualGain':'low–medium, local',
  'hydrologicalRisk':'low–medium: bed frozen, fill only on the hillside bank, lateral fall to the channel kept','complexity':'medium','authorization':'R-G reach and valley-band release'},
 {'id':'G2','family':'C','name':'Gully on tarn-inlet-n s 270–376 m','recommended':'alternative only',
  'measuredBasis':'hillside relief ~31 m, gradient 61 %, visible 64 % far / 100 % High Tarn; next to the D3 frozen head zone','visualGain':'medium','hydrologicalRisk':'medium (D3 source conflict nearby)','complexity':'medium','authorization':'R-H G2 (deferred)'}]
AUTH=[
 {'id':'R-A','change':'Narrow the peak-ascent corridor near the summit from ±75 m (+60 m fade) to ±20 m (+20 m fade) above 780 m, with a passability gate (centreline Δ = 0, grade and ±3 m tread cross-slope unchanged, walk test passes)','neededFor':'A1b-β','why':'the corridor is derived from the design-master route reservation (widthM 150)'},
 {'id':'R-B','change':'Crest raises on any arête (e.g. A2 step +18 m)','neededFor':'A2 raise','why':'not approved in A1-D (D1 left towers/raises as an option)'},
 {'id':'R-C','change':'Design-master crest-profile revision (A-R2) and the R1 re-solve it implies','neededFor':'a new far silhouette','why':'design-master edits are a stop condition for A1'},
 {'id':'R-D','change':'Replace the A1-D C1 geometry with C1-R (floor 655–665 m moved down the hollow, lateral rib, secondary couloir, headwall to the crest band, max lowering ≈ 83 m)','neededFor':'C1-R','why':'changes an approved A1-D design element (D2)'},
 {'id':'R-E','change':'A path or overlook on the lower A1 crest (≈ 760–790 m) so C1-R can be seen at player height','neededFor':'C1-R at player height','why':'new route / reservation'},
 {'id':'R-F','change':'Build a cirque on the tarn side (C2-a)','neededFor':'C1-tarn','why':'deferred by D2'},
 {'id':'R-G','change':"Move G1 from the middle reach (fraction 0.35–0.65) to s 296–472 m (≈ 0.50–0.79) and release the R1 valley band there; hillside-bank fill up to ≈ 16 m",'neededFor':"G1'",'why':'D8 fixed G1 to the middle reach'},
 {'id':'R-H','change':'Gully on tarn-inlet-n (G2)','neededFor':'G2','why':'deferred (D3 / D8)'}]
dump('decisions.json',{'status':'PROPOSAL (ratings are design judgement; measured basis cites data files)','options':OPTIONS,'authorizations':AUTH,
 'evidence':['visibility.json','editability.json','pixel_diff.json','hollows.json','c1_overlook.json','gully_search.json','concept_sections.json','concept_a2_raise.json','proposal_plan.json']})
print('ok',len(OPTIONS),len(AUTH))
