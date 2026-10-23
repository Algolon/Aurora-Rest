"""Plan view of the A1b-D constraint-release and freeze-zone proposal over the R1 hillshade.
MEASURED layers: kept protections, player-visible editable faces. CONCEPT layers: A1b-alpha targets, A1b-beta corridor release,
A2 crest-raise (not recommended now), C1-R layout, G1' reach, A1 lower-crest overlook. Output: images/proposal-plan.png"""
from b_common import *
from scipy import ndimage
from shapely.geometry import LineString,Point
from shapely import distance as sdist,points
from PIL import Image,ImageDraw,ImageFont
x0,x1,z0,z1=-1300.,1000.,2150.,3450.;ja,jb=int((4000-z1)/4),int((4000-z0)/4);ia,ib=int((x0+3000)/4),int((x1+3000)/4)
R=r1();sub=R[ja:jb,ia:ib];m=mask('v1');sl=(slice(ja-J.start,jb-J.start),slice(ia-I.start,ib-I.start));M=m['M'][sl];S=2
cls={c:m['cls_'+c][sl] for c in CLASSES}
hs=hillshade(R[ja-1:jb+1,ia-1:ib+1],315,40)[1:-1,1:-1]*.55+.45;img=np.repeat(hs[...,None],3,-1)*np.array([232,230,224])
X=(np.arange(ia,ib)*4-3000.)[None,:].repeat(sub.shape[0],0);Z=(4000.-np.arange(ja,jb)*4.)[:,None].repeat(sub.shape[1],1)
vs=np.load(DATA/'viewshed.npz');vis=json.loads((DATA/'visibility.json').read_text())
V=np.zeros(vs['gx'].shape,bool)
for k in ['birchwood','valley-shoulder','central-valley']+[k for k in vis['viewpoints'] if k.startswith('route-')]:V|=vs[k]
# viewshed grid (8 m, x -1500..900, z 3400..2158) -> this map's 4 m grid by nearest lookup
gi=np.clip(((X+1500)/8).astype(int),0,V.shape[1]-1);gj=np.clip(((3400-Z)/8).astype(int),0,V.shape[0]-1);inbox=(X>=-1500)&(X<900)&(Z<=3400)&(Z>=2158)
Vis=V[gj,gi]&inbox
pa=LineString(route('peak-ascent'));cd=sdist(pa,points(np.c_[X.ravel(),Z.ravel()])).reshape(X.shape)
dsum=np.hypot(X+520,Z-2770)
# kept protections (muted hatch)
prot=(M==0)&(sub>0);hatch=((np.add.outer(np.arange(sub.shape[0]),np.arange(sub.shape[1]))%6)<2)
img[prot&hatch]=img[prot&hatch]*.72
alpha=(M>0)&Vis&(dsum<700)&~cls['corridor'];img[alpha]=.45*img[alpha]+.55*np.array([20,184,166])
beta=cls['corridor']&(cd>40)&(cd<=135)&(sub>=780)&(dsum<450);img[beta]=.45*img[beta]+.55*np.array([249,115,22])
img[sub<=0]=(176,196,206)
im=Image.fromarray(img.clip(0,255).astype(np.uint8)).resize((sub.shape[1]*S,sub.shape[0]*S),Image.NEAREST)
c=Image.new('RGB',(im.width,im.height+150),(250,248,243));c.paste(im,(0,40));d=ImageDraw.Draw(c)
F=lambda s,b=False:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if b else '')+'.ttf',s)
W=lambda x,z:((x-x0)/4*S,(z1-z)/4*S+40)
d.text((12,10),'A1b-D proposal · constraint releases and freeze zones (MEASURED base, CONCEPT overlays)',fill=(20,20,20),font=F(17,True))
q=[W(a,b) for a,b in route('peak-ascent') if b>=z0];d.line(q,fill=(255,255,255),width=5);d.line(q,fill=(40,40,40),width=2)
# A2 crest raise (concept, not recommended now)
L=LineString(ridge('n-main')[:,[0,2]]);s0=L.project(Point(-520,2770));A2=[W(L.interpolate(s0+v).x,L.interpolate(s0+v).y) for v in np.arange(165,372,4)]
d.line(A2,fill=(127,29,29),width=7)
# C1-R concept layout
hol=json.loads((DATA/'hollows.json').read_text())['hollows']['NE'];th=np.array(hol['thalweg']);ths=arclen(th)
def at(s):return np.array([np.interp(s,ths,th[:,0]),np.interp(s,ths,th[:,1])])
fc=at(170);t_=at(180)-at(160);t_/=np.linalg.norm(t_);n_=np.array([-t_[1],t_[0]])
ell=[W(*(fc+t_*70*np.cos(a)+n_*65*np.sin(a))) for a in np.linspace(0,2*np.pi,60)];d.polygon(ell,outline=(17,24,39),width=3)
lip=[W(*(at(240)+n_*v)) for v in (-70,70)];d.line(lip,fill=(17,24,39),width=5)
rav=[W(*at(s)) for s in np.arange(240,ths[-1],8)];d.line(rav,fill=(14,116,144),width=4)
head=[W(*p) for p in [(-474.5,2881.1),(-520,2770),(-470,2745),(-410,2770)]];d.line([W(-497,2825),W(-474.5,2881.1),W(-451,2936),W(-427,2991),W(-400,3045)],fill=(17,24,39),width=3)
rib=[W(*(fc+n_*-115+t_*v)) for v in (-170,-60,40)];d.line(rib,fill=(120,53,15),width=5)
cou=[W(*(fc+n_*-190+t_*v)) for v in (-150,-40,60)];d.line(cou,fill=(14,116,144),width=3)
# G1' reach and alternative
ch=channel('tarn-inlet-w')[:,[0,2]];sc=arclen(ch);g=[W(np.interp(s,sc,ch[:,0]),np.interp(s,sc,ch[:,1])) for s in np.arange(296,472,4)];d.line(g,fill=(21,128,61),width=8)
a1=[W(np.interp(s,sc,ch[:,0]),np.interp(s,sc,ch[:,1])) for s in np.arange(208,386,4)];d.line(a1,fill=(21,128,61),width=2)
# overlook
for (x,z) in [(-318,3130),(-266,3160)]:X_,Y_=W(x,z);d.regular_polygon((X_,Y_,9),5,fill=(250,204,21),outline=(0,0,0))
# zones kept
for (x,z,rr,lb) in [(1290,2650,200,'D3 inlet-n head (kept)'),(750,2172,185,'High Tarn seam (kept)')]:
 X_,Y_=W(x,z);R_=rr/4*S;d.ellipse([X_-R_,Y_-R_,X_+R_,Y_+R_],outline=(124,58,237),width=2);d.text((X_-R_+4,Y_-R_-16),lb,fill=(91,33,182),font=F(11,True))
X_,Y_=W(-520,2770);d.polygon([(X_,Y_-9),(X_-8,Y_+6),(X_+8,Y_+6)],fill=(0,0,0))
for (x,z,t,col) in [(-345,2965,'C1-R floor',(17,24,39)),(-60,3060,'lip / threshold',(17,24,39)),(60,3260,'R1 ravine → NE bay',(14,116,144)),(-420,3010,'headwall (A1 / summit)',(17,24,39)),
                    (-330,2770,'lateral rib',(120,53,15)),(-300,2620,'A2 step (concept, not now)',(127,29,29)),(430,2500,"G1′ reach s 296–472",(21,128,61)),(-250,3200,'A1 lower-crest overlook',(120,90,0))]:
 X_,Y_=W(x,z);d.text((X_,Y_),t,fill=col,font=F(12,True))
y=im.height+50;x=12
items=[((20,184,166),'A1b-α: editable faces visible from Birchwood / Central Valley / route (no new release)'),((249,115,22),'A1b-β: corridor ±75 → ±20 m near the summit (release needed)'),
 ((127,29,29),'A2 crest raise +18 m (release needed; 4–5 px gain, not recommended now)'),((17,24,39),'C1-R concept: headwall, floor, lip'),((120,53,15),'C1-R lateral rib'),((21,128,61),"G1′ (thick) vs A1a G1 reach (thin)"),
 ((250,204,21),'overlook that would see C1-R (needs a path)'),((150,150,150),'hatched: kept protections (crest, corridor, valley, water, divide, zones)')]
for col,t in items:
 w=int(d.textlength(t,font=F(12)))+40
 if x+w>c.width-12:x=12;y+=20
 d.rectangle([x,y+2,x+18,y+14],fill=col);d.text((x+24,y),t,fill=(20,20,20),font=F(12));x+=w
d.text((c.width-12,c.height-16),f'x {x0:.0f}…{x1:.0f} m, z {z0:.0f}…{z1:.0f} m · north up · visibility terrain-only',fill=(90,90,90),font=F(11),anchor='ra')
c.save(IMG/'proposal-plan.png');print(c.size,'alpha cells',int(alpha.sum()),'beta cells',int(beta.sum()))
dump('proposal_plan.json',{'alphaTargetAreaHa':r(alpha.sum()*16/1e4,2),'betaReleaseAreaHa':r(beta.sum()*16/1e4,2),'notes':'alpha = A1a-editable (M>0) cells within 700 m of the summit visible from far approaches or the route, outside the corridor; beta = corridor cells 40-135 m from the trail above 780 m within 450 m of the summit'})
