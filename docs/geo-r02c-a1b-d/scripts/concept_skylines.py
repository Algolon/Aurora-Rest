"""Actual A1a M0 captures annotated with (1) the MEASURED R1 skyline coloured by its A1a protection class and (2) the CONCEPT
A1b-beta A2 crest raise (dashed; a design target drawn from an analytic profile, not generated terrain).
Outputs: images/skyline-protection-*.jpg; data/concept_a2_raise.json"""
from b_common import *
from project import project,capture
from shapely.geometry import LineString,Point
from PIL import Image,ImageDraw,ImageFont
F=lambda s,b=False:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if b else '')+'.ttf',s)
COL={'free':(13,148,136),'crest':(220,38,38),'corridor':(234,88,12),'valley':(124,58,237),'divide':(124,58,237),'wet':(124,58,237),'zone':(124,58,237),'outside window':(120,120,120)}
R=r1();L=LineString(ridge('n-main')[:,[0,2]]);s0=L.project(Point(-520,2770))
# CONCEPT A2 stepped arete raise (metres above R1 crest) by distance from the summit along n-main towards the n-east-arc junction
PROFILE=[(165,0),(215,18),(285,18),(310,7),(345,7),(372,0)]
def a2_dh(s):
 xs=np.array([p[0] for p in PROFILE],float);ys=np.array([p[1] for p in PROFILE],float);k=np.searchsorted(xs,s)-1;k=np.clip(k,0,len(xs)-2);t=np.clip((s-xs[k])/(xs[k+1]-xs[k]),0,1);t=t*t*(3-2*t)
 return np.where((s<xs[0])|(s>xs[-1]),0.,ys[k]+(ys[k+1]-ys[k])*t)
SS=np.arange(150,380,2.);A2=np.array([[L.interpolate(s0+s).x,L.interpolate(s0+s).y] for s in SS]);A2h=surface(R,A2[:,0],A2[:,1]);A2dh=a2_dh(SS)
def annotate(view,concept,out_name,title):
 cap=capture('m0','clayB',view);ox,oz=-cap['camera'][0],cap['camera'][2];oy=cap['camera'][1]
 im=Image.open(ROOT/'docs/geo-r02c-a1a/captures'/cap['file']).convert('RGB');d=ImageDraw.Draw(im)
 pts=[];labs=[]
 for a in np.linspace(-46,46,700):
  t=cap['yaw']+np.radians(a);ds=np.r_[np.arange(8,1500,4.),np.arange(1500,7000,8.)];xs=ox+np.sin(t)*ds;zs=oz+np.cos(t)*ds;ok=(np.abs(xs)<2998)&(np.abs(zs)<3998)
  h=surface(R,xs[ok],zs[ok]);k=int(np.argmax((h-oy)/ds[ok]));pts.append((xs[ok][k],h[k],zs[ok][k]))
 pts=np.array(pts);lab,_=classify(pts[:,0],pts[:,2]);px,py,_=project(cap,pts[:,[0,1,2]])
 inm=(pts[:,0]>=-1500)&(pts[:,0]<=900)&(pts[:,2]>=2150)&(pts[:,2]<=3400)
 for k in range(len(px)-1):
  if np.isfinite(px[k]) and np.isfinite(px[k+1]) and abs(px[k+1]-px[k])<40:
   c=COL.get(lab[k],(120,120,120)) if inm[k] else (150,150,150);d.line([(px[k],py[k]),(px[k+1],py[k+1])],fill=c,width=5 if inm[k] else 2)
 res=None
 if concept:
  qx,qy,_=project(cap,np.c_[A2[:,0],A2h+A2dh,A2[:,1]]);bx,by,_=project(cap,np.c_[A2[:,0],A2h,A2[:,1]])
  # concept skyline = upper envelope of the measured skyline and the raised crest line (dashed where it rises above)
  sky_y=np.interp(qx,px[np.isfinite(px)],py[np.isfinite(px)])
  for k in range(0,len(qx)-1,2):
   if qy[k]<sky_y[k]-.5:d.line([(qx[k],qy[k]),(qx[k+1],qy[k+1])],fill=(17,24,39),width=3)
  shift=np.maximum(0,sky_y-qy);res={'maxSkylineShiftPx':r(shift.max(),1),'raisedLengthOnSkylineM':r(2*np.sum(shift>1),0)}
  k=int(np.argmax(shift));d.text((qx[k]+8,qy[k]-30),f'CONCEPT A2 step +18 m → {shift.max():.0f} px',fill=(17,24,39),font=F(15,True))
 # legend band
 band=Image.new('RGB',(im.width,72),(250,248,243));db=ImageDraw.Draw(band);db.text((12,6),title,fill=(20,20,20),font=F(15,True));x=12
 for k,t in [('crest','R1 crest band (raise-only)'),('corridor','route corridor (frozen)'),('free','editable in A1a'),('valley','valley / divide / water')]:
  db.rectangle([x,40,x+26,46],fill=COL[k]);db.text((x+32,33),t,fill=(20,20,20),font=F(13));x+=int(db.textlength(t,font=F(13)))+60
 if concept:db.line([x,43,x+26,43],fill=(17,24,39),width=3);db.text((x+32,33),'CONCEPT (dashed segments): A2 raise, not terrain',fill=(20,20,20),font=F(13))
 outim=Image.new('RGB',(im.width,im.height+72));outim.paste(im,(0,0));outim.paste(band,(0,im.height));outim.save(IMG/out_name,quality=88)
 share={k:r(100*np.mean(lab[inm]==k)) for k in sorted(set(lab[inm]))} if inm.any() else {}
 print(view,share,res);return {'view':view,'massifSkylineShareInFramePct':share,'concept':res}
rows=[annotate('a1a-birchwood',True,'skyline-protection-birchwood.jpg','MEASURED skyline from Birchwood coloured by A1a protection · actual M0 capture, clay sun B'),
 annotate('a1a-valley-shoulder',True,'skyline-protection-valley-shoulder.jpg','MEASURED skyline from the Central Valley shoulder coloured by A1a protection · actual M0 capture'),
 annotate('a1a-approach-upper',False,'skyline-protection-approach-upper.jpg','MEASURED skyline from the upper alpine route coloured by A1a protection · actual M0 capture'),
 annotate('a1a-tarn-shore',False,'skyline-protection-tarn-shore.jpg','MEASURED skyline from the High Tarn north shore coloured by A1a protection · actual M0 capture')]
dump('concept_a2_raise.json',{'status':'CONCEPT (design target, not terrain; requires separate crest-raise authorization)','ridge':'n-main (A2 arm, summit to the n-east-arc junction)',
 'profileSFromSummitM_dhM':PROFILE,'crossProfile':'full raise within 20 m of the crest line, smoothstep to 0 at 70 m; raise only, never below R1',
 'routeClearanceM':'>= 114 m from the peak-ascent centreline for s >= 150 m (measured), i.e. outside corridor + fade','views':rows})
