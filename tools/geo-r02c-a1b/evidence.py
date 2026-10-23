"""MEASURED evidence for A1b-alpha (no terrain is written): before/after visibility of what each variant changed, terrain
difference and hillshade maps of the A2 south-west face, crest-parallel sections across the face, and long profiles along the
major couloir axes (their floors must keep falling). Compares M0 (= R1), A1a-V1 and A1b-alpha.
Outputs: docs/geo-r02c-a1b-alpha/images/*.png|svg, docs/geo-r02c-a1b-alpha/data/evidence.json"""
from pathlib import Path
import json,sys
import numpy as np
HERE=Path(__file__).resolve().parent;A1A=HERE.parent/'geo-r02c-a1a';sys.path[:0]=[str(HERE/'lib'),str(A1A/'lib'),str(A1A)]
from grid import ROOT,J,I,NX,NZ,load_r1  # noqa: E402
sys.path.insert(0,str(ROOT/'tools/geo-r02c/lib'))
from common import surface,hillshade  # noqa: E402
import validate as VA  # noqa: E402
from a1b_validate import VIEWPOINTS,visible_share  # noqa: E402
from visible_faces import couloir_lines  # noqa: E402
from shapely.geometry import LineString,Point  # noqa: E402
from PIL import Image,ImageDraw,ImageFont  # noqa: E402
from scipy import ndimage  # noqa: E402
OUT=ROOT/'docs/geo-r02c-a1b-alpha';IMG=OUT/'images';DAT=OUT/'data';IMG.mkdir(parents=True,exist_ok=True);DAT.mkdir(parents=True,exist_ok=True)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans{}.ttf'
def F(s,b=False):
 try:return ImageFont.truetype(FONT.format('-Bold' if b else ''),s)
 except OSError:return ImageFont.load_default()
R1=load_r1().astype(float)
def a1a(v):VA.VAR=ROOT/'public/geo-r02c-a1a';return VA.compose(v,load_r1())[0].astype(float)
def a1b(v):VA.VAR=ROOT/'public/geo-r02c-a1b';return VA.compose(v,load_r1())[0].astype(float)
V1=a1a('v1');AL=a1b('alpha');features=json.loads((ROOT/'public/geo-r02b/features.json').read_text())
spec=json.loads((HERE/'specs/a1b-alpha.json').read_text());op=spec['operators'][0];ridges={r['id']:r['points'] for r in features['ridges']}
res={'variants':{'m0':'fc8fd6da… (R1)','a1a-v1':json.loads((ROOT/'public/geo-r02c-a1a/manifest.json').read_text())['variants']['v1']['terrainSha256'],
 'a1b-alpha':json.loads((ROOT/'public/geo-r02c-a1b/manifest.json').read_text())['variants']['alpha']['terrainSha256']}}
# ---- 1. visibility of the changed cells from every review viewpoint (terrain-only line of sight on R1, eye 1.75 m)
def changed_pts(H,thr=1.):
 jj,ii=np.nonzero(np.abs(H-R1)>thr);sel=slice(None,None,max(1,len(jj)//3000));return ii[sel]*4.-3000,4000.-jj[sel]*4.,len(jj)
vis={}
for name,H in (('a1a-v1',V1),('a1b-alpha',AL)):
 tx,tz,n=changed_pts(H);vis[name]={'changedCellsOver1m':int(n),'changedHaOver1m':round(n*16/1e4,2),'visiblePct':{k:round(100*visible_share(R1,x,z,tx,tz),1) for k,(x,z) in VIEWPOINTS.items()}}
res['visibilityOfChanges']=vis
# ---- 2. visibility maps: what each group sees, with V1 (outline) and alpha (fill) changes
x0,x1,z0,z1=-1000.,400.,1850.,3250.;ja,jb=int((4000-z1)/4),int((4000-z0)/4);ia,ib=int((x0+3000)/4),int((x1+3000)/4);S=2
sub=R1[ja:jb,ia:ib];hs=hillshade(R1[ja-1:jb+1,ia-1:ib+1],315,40)[1:-1,1:-1]*.55+.45
gx,gz=np.meshgrid(np.arange(x0,x1,8.),np.arange(z1,z0,-8.))
def viewshed(ox,oz):
 tx=gx.ravel();tz=gz.ravel();oy=surface(R1,[ox],[oz])[0]+1.75;ty=surface(R1,tx,tz)+.5;d=np.hypot(tx-ox,tz-oz);v=np.zeros(len(tx),bool)
 for k in range(0,len(tx),1500):
  sl=slice(k,k+1500);n=int(max(2,d[sl].max()/8));s=(np.arange(1,n)/n)[None,:];xs=ox+(tx[sl]-ox)[:,None]*s;zs=oz+(tz[sl]-oz)[:,None]*s;ys=oy+(ty[sl]-oy)[:,None]*s
  v[sl]=~(surface(R1,xs.ravel(),zs.ravel()).reshape(xs.shape)>ys+.05).any(axis=1)
 return v.reshape(gx.shape)&(surface(R1,tx,tz).reshape(gx.shape)>0)
GROUPS={'far':(['birchwood','valley-shoulder','central-valley'],'Far approaches (Birchwood, Central Valley)'),
 'route':(['approach-mid','approach-upper','face-from-route','face-from-upper-route'],'Alpine route (approach and A1b trail cameras)'),
 'tarn':(['tarn-overlook','high-tarn','tarn-shore'],'High Tarn (overlook and shores)')}
z_=np.load(HERE/'.cache/alpha.npz');M=z_['M'][ja-J.start:jb-J.start,ia-I.start:ib-I.start]
dV1=(V1-R1)[ja:jb,ia:ib];dAL=(AL-R1)[ja:jb,ia:ib];W2P=lambda x,z:((x-x0)/4*S,(z1-z)/4*S+40)
mapstats={}
for g,(ids,title) in GROUPS.items():
 vv=np.zeros(gx.shape,bool)
 for k in ids:vv|=viewshed(*VIEWPOINTS[k])
 v4=np.repeat(np.repeat(vv,2,0),2,1)[:sub.shape[0],:sub.shape[1]]
 img=np.repeat(hs[...,None],3,-1)*np.array([226,224,218]);prot=M==0;hatch=(np.add.outer(np.arange(sub.shape[0]),np.arange(sub.shape[1]))%6)<2
 img[prot&hatch]*=.72;img[v4]=img[v4]*.55+.45*np.array([20,184,166])
 a=np.clip(-dAL/20,0,1);img=img*(1-.75*a[...,None])+.75*a[...,None]*np.array([234,88,12])
 e=(np.abs(dV1)>.05);e=e&~ndimage.binary_erosion(e);img[e]=(20,20,20)
 im=Image.fromarray(img.clip(0,255).astype(np.uint8)).resize((sub.shape[1]*S,sub.shape[0]*S),Image.NEAREST);c=Image.new('RGB',(im.width,im.height+100),(250,248,243));c.paste(im,(0,40));d=ImageDraw.Draw(c)
 d.text((12,10),'MEASURED · '+title,fill=(20,20,20),font=F(16,True))
 q=[W2P(x,z) for x,z in np.array(next(r for r in features['routes'] if r['id']=='peak-ascent')['points2']) if z0<=z<=z1];d.line(q,fill=(255,255,255),width=5);d.line(q,fill=(30,30,30),width=2)
 for k in ids:
  X_,Y_=W2P(*VIEWPOINTS[k])
  if x0<=VIEWPOINTS[k][0]<=x1 and z0<=VIEWPOINTS[k][1]<=z1:d.ellipse([X_-6,Y_-6,X_+6,Y_+6],fill=(255,214,10),outline=(0,0,0))
 X_,Y_=W2P(-520,2770);d.polygon([(X_,Y_-9),(X_-8,Y_+6),(X_+8,Y_+6)],fill=(0,0,0));d.text((X_+10,Y_-8),'summit',fill=(0,0,0),font=F(12,True))
 y=im.height+50;x=12
 for col,t in [((20,184,166),'visible from this group'),((234,88,12),'A1b-α cut (darker = deeper, 20 m)'),((20,20,20),'outline: A1a-V1 changes'),((150,150,150),'hatched: protected (M = 0)'),((255,214,10),'viewpoint in frame')]:
  w=int(d.textlength(t,font=F(12)))+40
  if x+w>c.width-12:x=12;y+=20
  d.rectangle([x,y+2,x+18,y+14],fill=col);d.text((x+24,y),t,fill=(20,20,20),font=F(12));x+=w
 c.save(IMG/f'visibility-{g}.png')
 al=np.abs(dAL)>1;v1=np.abs(dV1)>1;mapstats[g]={'alphaChangedVisiblePct':round(100*float((al&v4).sum()/max(1,al.sum())),1),'v1ChangedVisiblePct':round(100*float((v1&v4).sum()/max(1,v1.sum())),1)}
res['visibilityMaps']=mapstats
# ---- 3. difference + hillshade maps of the face
fx0,fx1,fz0,fz1=-700.,150.,1950.,2780.;fa,fb=int((4000-fz1)/4),int((4000-fz0)/4);fi,fj=int((fx0+3000)/4),int((fx1+3000)/4)
def shade(A):h=hillshade(A,290,30)*.7+hillshade(A,135,40)*.3;g=np.clip(h,0,1)*200+40;return np.stack([g,g*.98,g*.94],-1)
panels=[]
for lab,H in (('M0 = R1',R1),('A1a-V1',V1),('A1b-α',AL)):panels.append((lab,shade(H[fa-1:fb+1,fi-1:fj+1])[1:-1,1:-1]))
dd=(AL-R1)[fa:fb,fi:fj];t=np.clip(dd/20,-1,1);w=1-np.abs(t);panels.append(('Δ A1b-α − R1 (±20 m)',np.stack([np.where(t>0,1,w),w,np.where(t<0,1,w)],-1)*255*.85+shade(R1[fa-1:fb+1,fi-1:fj+1])[1:-1,1:-1]*.15))
S2=2;ph,pw=dd.shape[0]*S2,dd.shape[1]*S2;c=Image.new('RGB',(pw*2+12,ph*2+90),(250,248,243));d=ImageDraw.Draw(c)
d.text((8,8),'MEASURED · A2 south-west face, hillshade (sun from WNW and SE) and terrain difference',fill=(20,20,20),font=F(15,True))
for k,(lab,a) in enumerate(panels):
 x_=(k%2)*(pw+12);y_=30+(k//2)*(ph+30);c.paste(Image.fromarray(a.clip(0,255).astype(np.uint8)).resize((pw,ph),Image.LANCZOS),(x_,y_+22));d.text((x_+4,y_+4),lab,fill=(20,20,20),font=F(13,True))
c.save(IMG/'face-maps.png')
# ---- 4. sections: crest-parallel across the face, and long profiles along the major couloir axes
crest=LineString(np.array(ridges['n-main'])[:,[0,2]]);s0=crest.project(Point(-520,2770))
seg=LineString([(crest.interpolate(s0+v).x,crest.interpolate(s0+v).y) for v in np.arange(150,640,4.)])
def svg(name,title,d,series,notes,xlabel):
 allv=np.concatenate([s for *_,s in series]);lo=np.floor(allv.min()/10)*10-5;hi=np.ceil(allv.max()/10)*10+5;w=980;pad=56;pw_=w-pad-20;ph_=260;top=50
 X=lambda v:pad+(v-d.min())/(d.max()-d.min())*pw_;Y=lambda v:top+ph_-(v-lo)/(hi-lo)*ph_;ex=((d.max()-d.min())/pw_)/((hi-lo)/ph_)
 o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {top+ph_+60+18*len(notes)}" font-family="DejaVu Sans,system-ui,sans-serif" font-size="12"><rect width="100%" height="100%" fill="#fffdf9"/>',
  f'<text x="{pad}" y="22" font-size="15" font-weight="700" fill="#111">{title}</text><text x="{pad}" y="38" fill="#555">MEASURED terrain of the committed variants · vertical ×{ex:.2f}</text>']
 for k in range(6):v=lo+(hi-lo)*k/5;o.append(f'<line x1="{pad}" x2="{w-20}" y1="{Y(v):.1f}" y2="{Y(v):.1f}" stroke="#000" opacity=".08"/><text x="6" y="{Y(v)+4:.1f}" fill="#555">{v:.0f} m</text>')
 for k in range(6):v=d.min()+(d.max()-d.min())*k/5;o.append(f'<text x="{X(v):.1f}" y="{top+ph_+16}" text-anchor="middle" fill="#555">{v:.0f}</text>')
 o.append(f'<text x="{pad+pw_/2}" y="{top+ph_+32}" text-anchor="middle" fill="#555">{xlabel}</text>')
 for lab,col,wid,s in series:o.append(f'<polyline points="{" ".join(f"{X(a):.1f},{Y(b):.1f}" for a,b in zip(d,s))}" fill="none" stroke="{col}" stroke-width="{wid}"/>')
 x=pad;y=top+ph_+48
 for lab,col,wid,_ in series:o.append(f'<rect x="{x}" y="{y-8}" width="18" height="4" fill="{col}"/><text x="{x+24}" y="{y-3}" fill="#222">{lab}</text>');x+=24+int(7.2*len(lab))+30
 for k,n in enumerate(notes):o.append(f'<text x="{pad}" y="{y+18+18*k}" fill="#333">{n}</text>')
 o.append('</svg>');(IMG/f'{name}.svg').write_text('\n'.join(o))
secs={}
for off in (90,200,340):
 L=seg.offset_curve(-off)  # shapely: positive offset = left of the crest direction; the south-west face is on the right
 if L.geom_type!='LineString':L=max(L.geoms,key=lambda g:g.length)
 s=np.arange(0,L.length,4.);P=np.array([[L.interpolate(v).x,L.interpolate(v).y] for v in s])
 r=surface(R1,P[:,0],P[:,1]);v=surface(V1,P[:,0],P[:,1]);a=surface(AL,P[:,0],P[:,1])
 secs[f'crestParallel{off}m']={'maxCutM':round(float((r-a).max()),1),'v1MaxChangeM':round(float(np.abs(v-r).max()),2)}
 svg(f'section-face-{off}m',f'Across the A2 south-west face, {off} m below the crest line (crest-parallel)',s,[('M0 = R1','#8a8f98',3,r),('A1a-V1','#2563eb',1.6,v),('A1b-α','#c2410c',2,a)],
  [f'A1b-α: couloir / buttress rhythm, max cut {(r-a).max():.0f} m on this line; buttresses stay at R1. A1a-V1 = R1 here (max change {np.abs(v-r).max():.2f} m).'],'distance along the face, summit side → n-east-arc junction side (m)')
lines=couloir_lines(op,ridges,R1);prof={}
for k,cl in enumerate(lines[:3]):
 L=LineString(cl['line']);s=np.arange(0,L.length,4.);P=np.array([[L.interpolate(v).x,L.interpolate(v).y] for v in s])
 r=surface(R1,P[:,0],P[:,1]);a=surface(AL,P[:,0],P[:,1]);g=np.diff(a)/4.
 prof[f'major{k+1}']={'sFromSummitM':cl['spec']['sFromSummitM'],'lengthM':round(float(L.length)),'maxCutOnAxisM':round(float((r-a).max()),1),'floorAlwaysFalls':bool((g<0).all()),'gentlestFloorGradient':round(float(-g.max()),3)}
 svg(f'profile-couloir-{k+1}',f'Major couloir {k+1} (head {cl["spec"]["sFromSummitM"]} m from the summit): long profile along its axis',s,[('M0 = R1','#8a8f98',3,r),('A1b-α floor','#c2410c',2,a)],
  [f'The floor falls all the way ({"yes" if (g<0).all() else "NO"}); gentlest floor gradient {-g.max():.2f} m/m; max cut on the axis {(r-a).max():.0f} m.'],'distance down the fall line from the couloir head (m)')
res['sections']=secs;res['couloirProfiles']=prof
(DAT/'evidence.json').write_text(json.dumps(res,indent=1)+'\n');print(json.dumps({k:res[k] for k in ('visibilityOfChanges','visibilityMaps','sections','couloirProfiles')},indent=1))
