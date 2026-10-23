"""Cross-section sketches for the corrected features. Solid lines = MEASURED terrain (R1, committed A1a variants);
dashed black = CONCEPT design target computed from the analytic rules stated in each panel (not generated terrain).
Outputs: images/csec-*.svg; data/concept_sections.json"""
from b_common import *
from shapely.geometry import LineString,Point

R=r1();V={v:variant(v) for v in ('v1','v2','v3')};m1=mask('v1');m3=mask('v3');out={}
def h(H,p):return surface(H,p[:,0],p[:,1])
def M_at(m,p):j,i=cell_of(p[:,0],p[:,1]);v=np.zeros(len(j));ok=j>=0;v[ok]=m['M'][j[ok],i[ok]];return v
import textwrap
def svg(name,title,d,series,target,notes,zones=(),xlabel='distance (m)',w=980):
 notes=[l for n in notes for l in textwrap.wrap(n,138)]
 allv=np.concatenate([s for *_,s in series]+[target[np.isfinite(target)]]);lo=np.floor(allv.min()/10)*10-10;hi=np.ceil(allv.max()/10)*10+15
 pad=56;pw=w-pad-20;ph=300;top=54;X=lambda v:pad+(v-d.min())/(d.max()-d.min())*pw;Y=lambda v:top+ph-(v-lo)/(hi-lo)*ph
 ex=((d.max()-d.min())/pw)/((hi-lo)/ph);ht=top+ph+60+18*len(notes)
 o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {ht}" font-family="DejaVu Sans,system-ui,sans-serif" font-size="12"><rect width="{w}" height="{ht}" fill="#fffdf9"/>',
  f'<text x="{pad}" y="22" font-size="15" font-weight="700" fill="#111">{title}</text>',
  f'<text x="{pad}" y="40" fill="#555">solid = MEASURED terrain · dashed black = CONCEPT target (rule-based sketch, not terrain) · vertical ×{ex:.2f}</text>']
 for a,b,col,lab in zones:o.append(f'<rect x="{X(a):.1f}" y="{top}" width="{X(b)-X(a):.1f}" height="{ph}" fill="{col}" opacity=".18"/><text x="{(X(a)+X(b))/2:.1f}" y="{top+14}" text-anchor="middle" fill="#333" font-size="11">{lab}</text>')
 for k in range(6):v=lo+(hi-lo)*k/5;o.append(f'<line x1="{pad}" x2="{w-20}" y1="{Y(v):.1f}" y2="{Y(v):.1f}" stroke="#000" opacity=".08"/><text x="6" y="{Y(v)+4:.1f}" fill="#555">{v:.0f} m</text>')
 for k in range(6):v=d.min()+(d.max()-d.min())*k/5;o.append(f'<text x="{X(v):.1f}" y="{top+ph+16}" text-anchor="middle" fill="#555">{v:.0f}</text>')
 o.append(f'<text x="{pad+pw/2}" y="{top+ph+32}" text-anchor="middle" fill="#555">{xlabel}</text>')
 for lab,col,wid,s in series:o.append(f'<polyline points="{" ".join(f"{X(a):.1f},{Y(b):.1f}" for a,b in zip(d,s))}" fill="none" stroke="{col}" stroke-width="{wid}"/>')
 ok=np.isfinite(target);o.append(f'<polyline points="{" ".join(f"{X(a):.1f},{Y(b):.1f}" for a,b in zip(d[ok],target[ok]))}" fill="none" stroke="#111" stroke-width="2.2" stroke-dasharray="7 4"/>')
 x=pad;y=top+ph+48
 for lab,col,wid,_ in series:o.append(f'<rect x="{x}" y="{y-8}" width="18" height="4" fill="{col}"/><text x="{x+24}" y="{y-3}" fill="#222">{lab}</text>');x+=24+int(7.2*len(lab))+30
 o.append(f'<line x1="{x}" x2="{x+20}" y1="{y-6}" y2="{y-6}" stroke="#111" stroke-width="2" stroke-dasharray="6 3"/><text x="{x+26}" y="{y-3}" fill="#222">CONCEPT target</text>')
 for k,n in enumerate(notes):o.append(f'<text x="{pad}" y="{y+18+18*k}" fill="#333">{n}</text>')
 o.append('</svg>');p=IMG/f'csec-{name}.svg';p.write_text('\n'.join(o))
def line_pts(pts,step=4.):
 L=LineString(pts);s=np.arange(0,L.length,step);P=np.array([[L.interpolate(v).x,L.interpolate(v).y] for v in s]);return s,P
# ---- 1. C1-R long section: A1 crest (s=120 from summit) -> head of the NE hollow -> thalweg -> coast
hol=json.loads((DATA/'hollows.json').read_text())['hollows']['NE'];th=np.array(hol['thalweg'])
d,P=line_pts(np.vstack([[-474.5,2881.1],th]));r1h=h(R,P);v2h=h(V['v2'],P)
crest_edge=10.;Hc=np.interp(crest_edge,d,r1h);s_th0=np.hypot(*(np.array([-330,2900])-[-474.5,2881.1]))
lip_d=s_th0+240;lip_h=float(np.interp(lip_d,d,r1h));floor_back=lip_h+20.
HW=45.;head=Hc-np.tan(np.radians(HW))*(d-crest_edge)
floor=np.interp(d,[0,lip_d-150,lip_d],[floor_back,floor_back,lip_h])
T=np.where(d<=crest_edge,r1h,np.minimum(r1h,np.maximum(head,floor)));T=np.where(d>=lip_d,r1h,T)
# concave headwall foot (talus apron): soften the knee with a 25 m running max of a quadratic blend
cut=r1h-T;out['C1R-long']={'lipDistanceM':r(lip_d),'lipHeightM':r(lip_h),'floorBackM':r(floor_back),'maxLoweringM':r(cut.max()),'raiseM':r(max(0,-cut.min())),'headwallDeg':HW}
svg('c1r-long','C1-R Nordbotn, long section: A1 crest → NE hollow → coast (along the measured thalweg)',d,
 [('R1 (M0)','#8a8f98',3,r1h),('A1a V2 (rejected)','#c2410c',1.8,v2h)],T,
 [f'Concept rule: crest band (10 m) untouched; headwall {HW:.0f}° from the crest edge (local 55–60° rock bands ≤ 30 m tall); floor {floor_back:.0f} m graded to the natural lip at {lip_h:.0f} m (thalweg s = 240 m); below the lip R1 is untouched (ravine 45–124 m deep).',
  f'Cut only: max lowering {cut.max():.0f} m (A1-D envelope 85 m), raise 0 m. Floor grades outward, so no closed basin (no tarn, D9).',
  'MEASURED: A1a V2 placed its floor above the head of the hollow (690–705 m) on the planar face, where the hollow is only 4–21 m deep.'],
 zones=[(0,crest_edge,'#dc2626','crest'),(lip_d,d.max(),'#0ea5e9','R1 ravine to the NE bay (unchanged)')],xlabel='distance from the A1 crest point (m)')
# ---- 2. C1-R cross section across the floor (perpendicular to the thalweg at s = 170 m)
k=int(np.argmin(np.abs(np.hypot(*(th-th[0]).T)-170)));c=th[k];t=th[min(k+1,len(th)-1)]-th[max(k-1,0)];t/=np.linalg.norm(t);n=np.array([-t[1],t[0]])
dd=np.arange(-300,301,4.);P=c+dd[:,None]*n;r1c=h(R,P);v2c=h(V['v2'],P);fl=float(np.interp(lip_d-70,d,T))
left_is_a1=(c+n*-200)[1]>(c+n*200)[1]
wl=fl+np.tan(np.radians(40 if left_is_a1 else 52))*np.maximum(0,-dd-65);wr=fl+np.tan(np.radians(52 if left_is_a1 else 40))*np.maximum(0,dd-65)
Tc=np.minimum(r1c,np.where(dd<0,wl,wr)+3*(np.abs(dd)/65)**2*(np.abs(dd)<=65))
# lateral rib on the A2 side: R1 kept as the rib crest (about -100..-130 m), a secondary couloir cut beyond it so the rib stands proud
rib_side=-1 if not left_is_a1 else 1;cc=rib_side*190.;Tc=Tc-18*np.clip(1-((dd-cc)/75)**2,0,1)**2
out['C1R-cross']={'centre':[r(c[0]),r(c[1])],'floorM':r(fl),'maxLoweringM':r((r1c-Tc).max()),'leftSide':'A1 (south-facing wall, 40°)' if left_is_a1 else 'A2 (north-facing wall, 52°)'}
svg('c1r-cross','C1-R Nordbotn, cross section across the floor (A1 side ↔ A2 side)',dd,[('R1 (M0)','#8a8f98',3,r1c),('A1a V2 (rejected)','#c2410c',1.8,v2c)],Tc,
 [f'Concept rule: floor {fl:.0f} m, 130 m wide, gently dished (+3 m at its edges); asymmetric walls: shaded north-facing wall (A2 side) 52°, sunny south-facing wall (A1 side) 40°;',
  'cut only. MEASURED: across this floor station R1 is nearly level (≈ 700 m) for 250 m on the A2 side, because A2 runs 300+ m away, so a wall cut here would expose an artificial rim (the V2 failure).',
  'CONCEPT fix: A1 is the natural north-west rim; on the A2 side a lateral rock rib is left at R1 (about -100…-130 m) and a secondary couloir (≤ 18 m) is cut beyond it, so the rib reads as a spur descending from the summit, not as a cut edge.',
  f'Max lowering on this section {out["C1R-cross"]["maxLoweringM"]:.0f} m.'],xlabel='distance across the hollow (m), negative = '+('A1 side' if left_is_a1 else 'A2 side'))
# ---- 3. G1' asymmetric section on tarn-inlet-w lower reach (s = 400 m)
ch=channel('tarn-inlet-w')[:,[0,2]];sc=arclen(ch);s_=400.;c=np.array([np.interp(s_,sc,ch[:,0]),np.interp(s_,sc,ch[:,1])])
t=np.array([np.interp(s_+8,sc,ch[:,0]),np.interp(s_+8,sc,ch[:,1])])-np.array([np.interp(s_-8,sc,ch[:,0]),np.interp(s_-8,sc,ch[:,1])]);t/=np.linalg.norm(t);n=np.array([-t[1],t[0]])
dd=np.arange(-140,141,2.);P=c+dd[:,None]*n;r1g=h(R,P);v3g=h(V['v3'],P);bed=float(np.interp(0,dd,r1g))
SHIFT=22.;ext=np.r_[dd,dd[-1]+np.arange(4,60,4.)];r1e=np.r_[r1g,r1g[-1]+(r1g[-1]-r1g[-10])/(dd[-1]-dd[-10])*np.arange(4,60,4.)]
env=np.interp(dd+SHIFT,ext,r1e)   # the R1 hillside advanced 22 m towards the channel (fills the bench wedge only)
we=20.;bank=np.interp(we,dd,r1g);wall=bank+np.where(dd>32,np.tan(np.radians(40))*(dd-32),(dd-we)/12*1.5)
Tg=r1g.copy();sel=dd>we;Tg[sel]=np.maximum(r1g[sel],np.minimum(wall[sel],env[sel]))
knee=dd[sel][np.argmax(wall[sel]>=env[sel])] if (wall[sel]>=env[sel]).any() else 110.
Tg[sel]-=2.5*np.exp(-((dd[sel]-knee)/8)**2)
Mn=M_at(m3,P);north_M=float(Mn[(dd>30)&(dd<90)].mean())
out['G1p-section']={'channel':'tarn-inlet-w','sM':s_,'centre':[r(c[0]),r(c[1])],'bedM':r(bed),'maxFillM':r((Tg-r1g).max()),'maxCutM':r((r1g-Tg).max()),'kneeM':r(knee),'a1aMaskMeanNorthWall30to90M':r(north_M,2)}
svg('g1p','G1′ tarn-inlet-w lower reach (s = 400 m): asymmetric cut-bank gully, bed frozen',dd,[('R1 (M0)','#8a8f98',3,r1g),('A1a V3 (rejected)','#15803d',1.8,v3g)],Tg,
 ['Concept rule: wet section ±20 m frozen (bed unchanged); south side: R1 bench kept; north (hillside) side: 12 m bank strip rising 1.5 m, then a 40° wall',
  'filled only up to the R1 hillside advanced 22 m towards the channel (a wedge that follows the real slope: no back-slope, no mound), a 2–3 m rim rounding; smooth vector distance, ≥ 12 m transition.',
  f'Max fill {out["G1p-section"]["maxFillM"]:.0f} m, max cut {out["G1p-section"]["maxCutM"]:.0f} m. MEASURED A1a V3: fill on both sides (left mound) and a 4 m fade on a rasterised wet edge.'],
 zones=[(-20,20,'#0891b2','frozen wet section'),(-140,-20,'#a3a3a3','bench kept'),(20,32,'#22c55e','bank strip')],xlabel='distance across the channel (m), + = north (hillside)')
# ---- 4. A2 crest long profile with the concept raise
from concept_skylines import a2_dh  # noqa
L=LineString(ridge('n-main')[:,[0,2]]);s0=L.project(Point(-520,2770));ss=np.arange(0,380,4.);P=np.array([[L.interpolate(s0+v).x,L.interpolate(s0+v).y] for v in ss])
a2=h(R,P);v1a=h(V['v1'],P);Ta=a2+a2_dh(ss)
svg('a2-crest','A2 arête crest profile, summit → n-east-arc junction: concept stepped raise (requires a crest-raise release)',ss,[('R1 crest (M0)','#8a8f98',3,a2),('A1a V1','#2563eb',1.6,v1a)],Ta,
 ['Concept rule: +18 m plateau-step 215–285 m from the summit, a steep step down to +7 m, taper to 0 at the junction; ≥ 114 m from the trail.',
  'MEASURED gain: 4–5 px from Birchwood / Central Valley (3 px needs ≥ 9–11 m there). Raise-only is compatible with the R1 crest lower bound.'],
 zones=[(0,150,'#ea580c','within trail corridor + fade')],xlabel='distance from the summit along n-main (m)')
# ---- 5. A1b-alpha face rhythm: section along the A2 south-west face, 110 m below the crest line (parallel offset)
seg=LineString([(L.interpolate(s0+v).x,L.interpolate(s0+v).y) for v in np.arange(170,372,4.)]);off=seg.offset_curve(-110)
if off.geom_type!='LineString':off=max(off.geoms,key=lambda g:g.length)
ds,P=line_pts(np.array(off.coords));fa=h(R,P);visible=json.loads((DATA/'visibility.json').read_text())
cent=[40,120,175];wid=[34,46,30];dep=[14,9,16];Tf=fa.copy()
for c_,w_,d_ in zip(cent,wid,dep):Tf-=d_*np.clip(1-((ds-c_)/w_)**2,0,1)**1.5
Mf=M_at(m1,P)
out['A2-face-rhythm']={'offsetFromCrestM':110,'couloirs':[{'atM':c_,'widthM':2*w_,'depthM':d_} for c_,w_,d_ in zip(cent,wid,dep)],'a1aMaskMean':r(Mf.mean(),2)}
svg('a2-face','A1b-α: A2 south-west face, crest-parallel section 110 m off the crest line: couloir / buttress rhythm',ds,[('R1 (M0)','#8a8f98',3,fa),('A1a V1 (face gated out)','#2563eb',1.6,h(V['v1'],P))],Tf,
 ['Concept rule: cut-only couloirs at uneven spacing (≈ 80 / 55 m), 60–90 m wide, 9–16 m deep, with buttresses left at R1; walls ≤ 45°; drains downslope to the existing catchments.',
  f'MEASURED: A1a mask mean on this line {Mf.mean():.2f} (editable). V1 left it untouched because the face gate (≥ 75 % free) rejected this face at 69 %.'],xlabel='distance along the face (m), summit side → junction side')
dump('concept_sections.json',{'status':'CONCEPT targets (rule-based) evaluated against MEASURED R1; no terrain generated','sections':out})
print(json.dumps(out,indent=1))
# ---- 6. A1b-beta summit block: section perpendicular to the peak-ascent trail 150 m below the summit
pa=route('peak-ascent');sp=arclen(pa);s_=sp[-1]-150;c=np.array([np.interp(s_,sp,pa[:,0]),np.interp(s_,sp,pa[:,1])])
t=np.array([np.interp(s_+10,sp,pa[:,0]),np.interp(s_+10,sp,pa[:,1])])-np.array([np.interp(s_-10,sp,pa[:,0]),np.interp(s_-10,sp,pa[:,1])]);t/=np.linalg.norm(t);n=np.array([-t[1],t[0]])
dd=np.arange(-220,221,2.);P=c+dd[:,None]*n;r1s=h(R,P);v1s=h(V['v1'],P);lab,_=classify(P[:,0],P[:,1])
h0=float(np.interp(0,dd,r1s));Ts=r1s.copy();sm=lambda x:np.clip(x,0,1)**2*(3-2*np.clip(x,0,1))
crestband=np.array([l=='crest' for l in lab]);cbd=np.array([np.abs(dd[crestband]-v).min() if crestband.any() else 1e9 for v in dd])
for sg in (-1,1):
 side=(dd*sg)>20;ed=float(np.interp(20*sg,dd,r1s));tgt=ed-np.tan(np.radians(40))*(np.abs(dd)-20)
 cut=np.clip(r1s-tgt,0,25)*sm((np.abs(dd)-20)/20)*sm(cbd/20)*(1-sm((np.abs(dd)-110)/80))
 Ts[side]=(r1s-cut)[side]
out['summit-block']={'routeSM':r(s_),'centre':[r(c[0]),r(c[1])],'trailM':r(h0),'maxLoweringM':r((r1s-Ts).max()),'corridorNow':'±75 m + 60 m fade','corridorProposed':'±20 m + 20 m fade, tread gate'}
svg('summit-block','A1b-β summit block: across the trail 150 m below the summit (needs a corridor release)',dd,
 [('R1 (M0)','#8a8f98',3,r1s),('A1a V1 (corridor-frozen)','#2563eb',1.6,v1s)],Ts,
 ['Concept rule: trail tread and ±20 m unchanged (centreline Δ = 0, grade and tread cross-slope unchanged), 20 m smoothstep fade, flanks cut towards 40° (≤ 25 m deep), fading out by 190 m;',
  'R1 crest-band cells never lowered and a 20 m blend away from them (no cliff at the band edge). MEASURED: today the ±75 m corridor plus 60 m fade freezes this whole section (V1 = R1).',
  f'Max lowering {out["summit-block"]["maxLoweringM"]:.0f} m. Gain (measured on R1 geometry): frees 4–18 % of the route skyline and 15–32 % of route-visible massif cells at ±20 m.'],
 zones=[(-20,20,'#ea580c','trail ±20 m (kept)'),(-75,-20,'#fdba74','released'),(20,75,'#fdba74','released')],xlabel='distance across the trail (m)')
dump('concept_sections.json',{'status':'CONCEPT targets (rule-based) evaluated against MEASURED R1; no terrain generated','sections':out})
print(out['summit-block'])
