"""Five A1-D landform cross-section studies: measured R1 (grey) vs hand-specified DESIGN TARGET envelopes (dashed orange).
Targets are design intent only: piecewise-linear control points; None (and the first/last point) snap to measured R1 so that
targets meet fixed crests and unedited terrain exactly. Nothing here generates terrain. Outputs: images/profile-*.svg, data/profiles.json."""
from a1d_common import *
from a1d_svg import panel
def target(d,h,cp):
 d=np.asarray(d);h=np.asarray(h);cd=[c[0] for c in cp];ch=[np.interp(c[0],d,h) if (c[1] is None or k in(0,len(cp)-1)) else c[1] for k,c in enumerate(cp)]
 t=h.copy();m=(d>=cd[0])&(d<=cd[-1]);t[m]=np.interp(d[m],cd,ch);return t
def xs(a,b,pts):  # control points given by world x (W-E sections) -> distance along a-b
 return [(abs(x-a[0]),v) for x,v in pts]
P=[]
a,b=(-650,2930),(150,2930)
P.append(dict(id='T1',file='profile-T1-c1-nordbotn',status='proposed (v1)',title='T1 · W→E at z = 2930: A1 arête → Nordbotn (C1) headwall → floor → lip → existing east slope',a=a,b=b,
 cp=xs(a,b,[(-560,None),(-453,None),(-440,None),(-425,846),(-400,812),(-370,768),(-340,722),(-300,704),(-250,699),(-200,694),(-170,690),(-150,None)]),
 notes=xs(a,b,[(-453,'A1 crest (fixed)'),(-385,'headwall'),(-325,'talus foot'),(-250,'floor 690–705, graded east'),(-165,'lip ~688'),(0,'R1 slope to the NE bay')]),lr=('W','E'),
 v0='v0 T1 ran N–S at x = −250, parallel to the contours, which made the east slope look like a plateau; superseded'))
a,b=(-300,2530),(700,2530)
P.append(dict(id='T2',file='profile-T2-c2-vastra-tarnbotn',status='proposed (v1, variant C2-a)',title='T2 · W→E at z = 2530: A2 crest → Västra tarnbotn (C2) headwall → floor → source-w threshold → gully',a=a,b=b,
 cp=xs(a,b,[(-260,None),(-215,None),(-170,None),(-150,690),(-100,660),(-50,640),(0,632),(100,629),(200,626),(300,623),(380,621),(420,None)]),
 notes=xs(a,b,[(-215,'A2 crest (fixed)'),(-90,'headwall'),(150,'floor 622–632'),(300,'saddle filled 5–10 m'),(420,'threshold = source 620'),(560,'R1 gully side')]),lr=('W','E'),v0='v0 T2 ran NW→SE through a floor that straddled the tarn/sea divide; superseded'))
g=json.loads((ROOT/'docs/geo-r02c-p0/baseline/transects.json').read_text())['tarn-inlet-w-mid'];gd=np.array(g['distanceM']);gh=np.array(g['heightM']);gp=np.array(g['points'])
# which side is the outside of the bend at the station: sign of channel turning
ch=channel_xyz('tarn-inlet-w')[:,[0,2]];k=len(ch)//2;v1=ch[k]-ch[k-15];v2=ch[k+15]-ch[k];turn=np.sign(v1[0]*v2[1]-v1[1]*v2[0])
c=gd[len(gd)//2];bed=float(np.interp(c,gd,gh));  # transect is channel-normal and centred on the channel
side=gd-c;absd=np.abs(side)
hill=np.interp(gd,[gd[0],c-75,c+75,gd[-1]],[gh[0],np.interp(c-75,gd,gh),np.interp(c+75,gd,gh),gh[-1]])
nrm=gp[1]-gp[0];left_is_pos=np.sign(-v1[1]*nrm[0]+v1[0]*nrm[1])  # +distance side relative to flow-left
outside_pos=(turn<0)==(left_is_pos>0)  # turning left (turn>0) puts the outside on the right
steep=np.tan(np.radians(40));gentle=np.tan(np.radians(30))
slope=np.where((side>0)==outside_pos,steep,gentle)
gt=np.where(absd<=5,bed,np.minimum(hill,bed+(absd-5)*slope))
P.append(dict(id='G1',file='profile-G1-tarn-inlet-w-gully',status='proposed (trial reach only, D8)',title='G1 · tarn-inlet-w trial cross-section: R1 110 m graded bench → asymmetric V-gully (bed fixed)',d=gd,h=gh,t=gt,
 notes=[(c-95,'R1 flat bench ±55 m'),(c,'bed fixed'),(c+(35 if outside_pos else -35),'outer wall ~40°'),(c+(-35 if outside_pos else 35),'inner wall ~30°')],lr=('S','N'),v0='v0 used symmetric 36° walls'))
a,b=(-1000,2750),(-1300,2000)
P.append(dict(id='T4',file='profile-T4-c4-vindbotn-deferred',status='deferred (D2)',title='T4 · NE→SW: Vindbotn (C4), DEFERRED — kept as a study, not part of A1',a=a,b=b,
 cp=[(60,None),(104,None),(150,575),(200,500),(240,455),(300,438),(360,425),(420,412),(460,395),(520,330),(560,280),(600,220),(640,None)],
 notes=[(104,'crest kept'),(170,'headwall'),(330,'shallow bowl'),(430,'lip ~410'),(560,'rock chute')],lr=('NE','SW'),v0='unchanged from v0'))
a,b=(1270,2950),(1270,2250)
P.append(dict(id='T5',file='profile-T5-inlet-n-option-a-not-recommended',status='not recommended (D3)',title='T5 · N→S at x = 1270: v0 option A (raise the divide ~+50 m) — NOT recommended, see H1/H2',a=a,b=b,
 cp=[(150,480),(200,600),(240,668),(270,656),(285,646),(300,639),(340,610),(400,569)],
 notes=[(90,'north face (coastal band)'),(240,'divide raised to ~668 (rejected)'),(290,'source 637–640'),(450,'gully to High Tarn')],lr=('N','S'),v0='v0 option A'))
out=[]
for p in P:
 if 'd' not in p:p['d'],p['h'],_=section(p['a'],p['b']);p['t']=target(p['d'],p['h'],p['cp'])
 dl=p['t']-p['h'];svg=panel(p['title'],p['d'],[(p['h'],'r1'),(p['t'],'target')],p['notes'],*p['lr'])
 (IMG/(p['file']+'.svg')).write_text(svg)
 out.append({'id':p['id'],'file':'images/'+p['file']+'.svg','status':p['status'],'title':p['title'],'line':[list(p['a']),list(p['b'])] if 'a' in p else 'P0 transect tarn-inlet-w-mid',
  'controlPoints':[[float(c[0]),c[1]] for c in p['cp']] if 'cp' in p else 'computed V-section (bench ±5 m, 40° outer / 30° inner walls)',
  'maxLoweringM':r(max(0,-dl.min())),'maxRaiseM':r(max(0,dl.max())),'v0':p['v0']})
write_json('profiles.json',{'note':'DESIGN TARGETS, not generated terrain. Grey = measured R1 on the rendered triangles; dashed = hand-specified target.','profiles':out})
for o in out:print(o['id'],o['status'],o['maxLoweringM'],o['maxRaiseM'])
