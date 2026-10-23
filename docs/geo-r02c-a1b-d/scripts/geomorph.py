"""MEASURED geomorphology of the North Peak massif on R1 (no design): D8 contributing area on the 4 m grid, contour plan
curvature at 120 m scale, aspect, and the A1-D C1 site. Output: data/geomorph.npz, images/geomorph-massif.png (+ data/geomorph.json)."""
from b_common import *
from scipy import ndimage
from PIL import Image,ImageDraw,ImageFont
x0,x1,z0,z1=-1700.,1000.,2050.,3700.;ja,jb=int((4000-z1)/4),int((4000-z0)/4);ia,ib=int((x0+3000)/4),int((x1+3000)/4)
R1=r1();H=R1[ja:jb,ia:ib].copy();ny,nx=H.shape
# D8 contributing area (m2): process cells high -> low
order=np.argsort(-H,axis=None);acc=np.full(H.size,16.);Hf=H.ravel()
nb=[(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)];dist=[np.sqrt(2),1,np.sqrt(2),1,1,np.sqrt(2),1,np.sqrt(2)]
rec=np.full(H.size,-1);best=np.zeros(H.size)
for (dj,di),dd in zip(nb,dist):
 sh=np.full(H.shape,np.inf);sj=slice(max(dj,0),ny+min(dj,0));si=slice(max(di,0),nx+min(di,0));tj=slice(max(-dj,0),ny+min(-dj,0));ti=slice(max(-di,0),nx+min(-di,0))
 sh[tj,ti]=H[sj,si];drop=((H-sh)/(dd*4)).ravel();k=drop>best;best[k]=drop[k]
 idx=np.arange(H.size).reshape(H.shape);tgt=np.full(H.shape,-1);tgt[tj,ti]=idx[sj,si];rec[k]=tgt.ravel()[k]
for c in order:
 if rec[c]>=0:acc[rec[c]]+=acc[c]
acc=acc.reshape(H.shape)
Hs=ndimage.gaussian_filter(H,30/4)            # ~120 m support for plan curvature / aspect
gz,gx=np.gradient(Hs,4.);gz=-gz
p=gx**2+gz**2+1e-9;fxx=np.gradient(np.gradient(Hs,4.,axis=1),4.,axis=1);fzz=np.gradient(-np.gradient(Hs,4.,axis=0),4.,axis=0)*-1
fxz=np.gradient(np.gradient(Hs,4.,axis=1),4.,axis=0)*-1
plan=-(fxx*gz**2-2*fxz*gx*gz+fzz*gx**2)/p**1.5   # >0 convex (spur), <0 concave (hollow) on contours
aspect=(np.degrees(np.arctan2(-gx,-gz))+360)%360   # direction the slope faces (0 = N, 90 = E)
slope=np.degrees(np.arctan(np.hypot(*np.gradient(H,4.))))
np.savez_compressed(DATA/'geomorph.npz',H=H.astype('<f4'),acc=acc.astype('<f4'),plan=plan.astype('<f4'),aspect=aspect.astype('<f4'),slope=slope.astype('<f4'),box=np.array([x0,x1,z0,z1]))  # float32 storage; H is R1's own float32
# map
S=2;hs=hillshade(R1[ja-1:jb+1,ia-1:ib+1],315,40)[1:-1,1:-1]*.55+.45;img=np.repeat(hs[...,None],3,-1)*np.array([228,226,220])
cv=np.clip(-plan*4000,-1,1)   # hollows blue, spurs red (scaled)
img=np.where((H>0)[...,None],img*(1-.35*np.abs(cv)[...,None])+.35*np.abs(cv)[...,None]*np.where((cv>0)[...,None],np.array([37,99,235]),np.array([220,38,38])),img)
img[H<=0]=(176,196,206)
for lev in range(100,900,50):
 b=(H>=lev)&~ndimage.binary_erosion(H>=lev);img[b]=(90,90,90) if lev%100 else (40,40,40)
la=np.log10(acc);stream=la>=4.0;img[stream]=(8,145,178);img[la>=4.7]=(3,105,161)
im=Image.fromarray(img.clip(0,255).astype(np.uint8)).resize((nx*S,ny*S),Image.NEAREST)
c=Image.new('RGB',(im.width,im.height+110),(250,248,243));c.paste(im,(0,36));d=ImageDraw.Draw(c)
F=lambda s,b=False:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if b else '')+'.ttf',s)
W2P=lambda x,z:((x-x0)/4*S,(z1-z)/4*S+36)
d.text((12,8),'MEASURED · R1 North Peak: contours (50 m), contour curvature at ~120 m scale, D8 flow lines',fill=(20,20,20),font=F(16,True))
for rid in ('n-main','n-crown','n-west-spur','n-nw-cape','n-east-arc'):
 p_=ridge(rid);q=[W2P(a,b) for a,_,b in p_];d.line(q,fill=(60,30,10),width=2)
for cid in ('tarn-inlet-w','tarn-inlet-n','windward-gully'):
 p_=channel(cid);q=[W2P(a,b) for a,_,b in p_];d.line(q,fill=(14,116,144),width=3)
a=json.loads((ROOT/'docs/geo-r02c-a1d/data/a1d-concept-v1.json').read_text());c1=next(k for k in a['cirques'] if k['id']=='C1')
fx,fz,rx,rz=c1['floor'][:4];X,Z=W2P(fx,fz);d.ellipse([X-rx/4*S,Z-rz/4*S,X+rx/4*S,Z+rz/4*S],outline=(0,0,0),width=2);d.text((X+rx/4*S+4,Z-8),'A1-D / A1a C1',fill=(0,0,0),font=F(12,True))
X,Z=W2P(-520,2770);d.polygon([(X,Z-9),(X-8,Z+6),(X+8,Z+6)],fill=(0,0,0));d.text((X+10,Z-8),'summit',fill=(0,0,0),font=F(12,True))
y=im.height+46
for col,t in [((37,99,235),'contour-concave hollow'),((220,38,38),'contour-convex spur'),((8,145,178),'D8 flow ≥ 1 ha'),((3,105,161),'≥ 5 ha'),((60,30,10),'authored ridges'),((14,116,144),'R1 channels')]:
 d.rectangle([12+0,y,30,y+14],fill=col);d.text((36,y-1),t,fill=(20,20,20),font=F(13));y+=0;d.text
 d=ImageDraw.Draw(c);y=y;  # keep one line per legend item below
 y+=0
# legend on one row
c2=c;d=ImageDraw.Draw(c2);d.rectangle([0,im.height+40,c2.width,c2.height],fill=(250,248,243));x=12;y=im.height+48
for col,t in [((37,99,235),'contour-concave hollow'),((220,38,38),'contour-convex spur'),((8,145,178),'D8 flow ≥ 1 ha'),((3,105,161),'≥ 5 ha'),((60,30,10),'authored ridges'),((14,116,144),'R1 channels')]:
 w=int(d.textlength(t,font=F(13)))+44
 if x+w>c2.width-12:x=12;y+=22
 d.rectangle([x,y,x+18,y+14],fill=col);d.text((x+24,y-1),t,fill=(20,20,20),font=F(13));x+=w
d.text((c2.width-12,c2.height-16),f'x {x0:.0f}…{x1:.0f} m, z {z0:.0f}…{z1:.0f} m · north up',fill=(90,90,90),font=F(11),anchor='ra')
c2.save(IMG/'geomorph-massif.png');print(c2.size)
