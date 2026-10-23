"""MEASURED map: player-visible North Peak terrain coloured by its A1a protection, with the skyline-forming points of each
viewpoint group and the outline of what V1 actually changed. Outputs images/visibility-{far,tarn,route}.png"""
from b_common import *
from PIL import Image,ImageDraw,ImageFont
from scipy import ndimage
vis=json.loads((DATA/'visibility.json').read_text());vs=np.load(DATA/'viewshed.npz');m=mask('v1')
x0,x1,z0,z1=vis['massifBox'];ja,jb=int((4000-z1)/4),int((4000-z0)/4);ia,ib=int((x0+3000)/4),int((x1+3000)/4)
R1=r1();sub=R1[ja:jb,ia:ib];S=2
hs=hillshade(R1[ja-1:jb+1,ia-1:ib+1],315,40)[1:-1,1:-1]*.55+.45
cls={c:m['cls_'+c][ja-J.start:jb-J.start,ia-I.start:ib-I.start] for c in CLASSES};M=m['M'][ja-J.start:jb-J.start,ia-I.start:ib-I.start]
chg=np.abs(variant('v1')[ja:jb,ia:ib]-sub)>.05;chg2=np.abs(variant('v2')[ja:jb,ia:ib]-sub)>.05
lab=np.full(sub.shape,'other',object);lab[M>0]='free'
for c in ['valley','wet','divide','zone','lake','waterSurface','otherEquality','sea']:lab[(M==0)&cls[c]&(lab=='other')]='otherprot'
lab[(M==0)&cls['corridor']]='corridor';lab[(M==0)&cls['crest']]='crest';lab[sub<=0]='sea'
COL={'free':(20,184,166),'corridor':(249,115,22),'crest':(220,38,38),'otherprot':(124,58,237),'other':(124,58,237),'sea':(150,170,180)}
F=lambda s,b=False:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if b else '')+'.ttf',s)
GROUPS={'far':(['birchwood','valley-shoulder','central-valley'],'Far approaches: Birchwood, Central Valley shoulder, Central Valley floor'),
 'tarn':(['tarn-overlook','high-tarn','tarn-shore'],'High Tarn: overlook, east shore, north shore'),
 'route':([k for k in vis['viewpoints'] if k.startswith('route-')],'Alpine route (peak-ascent centreline, s = 1300 to 2750 m)')}
DOT=[(255,255,255),(255,214,10),(56,189,248),(244,114,182),(163,230,53),(253,186,116)]
def W2P(x,z):return ((np.asarray(x)-x0)/4*S,(z1-np.asarray(z))/4*S)
for g,(ids,title) in GROUPS.items():
 v=np.zeros(vs['gx'].shape,bool)
 for k in ids:v|=vs[k]
 v=np.repeat(np.repeat(v,2,0),2,1)[:sub.shape[0],:sub.shape[1]]
 img=np.repeat(hs[...,None],3,-1)*np.array([226,224,218])
 for k,c in COL.items():
  sel=v&(lab==k);img[sel]=.35*img[sel]+.65*np.array(c)
 e=chg&~ndimage.binary_erosion(chg,iterations=1);img[e]=(15,15,15)
 e2=(chg2&~chg);e2=e2&~ndimage.binary_erosion(e2,iterations=1);img[e2]=(15,15,15)
 im=Image.fromarray(img.clip(0,255).astype(np.uint8)).resize((sub.shape[1]*S,sub.shape[0]*S),Image.NEAREST)
 H0=im.height;canvas=Image.new('RGB',(im.width,H0+176),(250,248,243));canvas.paste(im,(0,40));d=ImageDraw.Draw(canvas)
 d.text((12,10),'MEASURED · '+title,fill=(20,20,20),font=F(17,True))
 pa=route('peak-ascent');pa=pa[pa[:,1]>=z0];px,pz=W2P(pa[:,0],pa[:,1]);d.line(list(zip(px,pz+40)),fill=(255,255,255),width=5);d.line(list(zip(px,pz+40)),fill=(30,30,30),width=2)
 for n,k in enumerate(ids):
  sk=np.array(vis['viewpoints'][k]['skyline'])
  if not len(sk):continue
  qx,qz=W2P(sk[:,1],sk[:,2])
  for a,b in zip(qx,qz+40):d.ellipse([a-4,b-4,a+4,b+4],fill=DOT[n%6],outline=(0,0,0))
 sx,sz=W2P(-520,2770);d.polygon([(sx,sz+40-9),(sx-8,sz+40+6),(sx+8,sz+40+6)],fill=(0,0,0));d.text((sx+10,sz+30),'summit 900 m',fill=(0,0,0),font=F(13,True))
 y=H0+50;x=12
 for k,lbl in [('free','visible · editable in A1a (M > 0)'),('crest','visible · R1 crest band (raise-only)'),('corridor','visible · route corridor ±55–75 m'),('otherprot','visible · valley / water / divide / zone')]:
  d.rectangle([x,y,x+18,y+14],fill=COL[k]);d.text((x+24,y-1),lbl,fill=(20,20,20),font=F(13));x+=290 if x<300 else 300
  if x>900:x=12;y+=22
 y+=24;x=12;d.rectangle([x,y,x+18,y+14],fill=(200,200,195),outline=(0,0,0));d.text((x+24,y-1),'not visible from this group (hillshade)',fill=(20,20,20),font=F(13));x=310
 d.line([x,y+7,x+18,y+7],fill=(15,15,15),width=2);d.text((x+24,y-1),'outline: cells V1 / V2 actually changed',fill=(20,20,20),font=F(13))
 y+=24;x=12
 for n,k in enumerate(ids):
  t='skyline · '+vis['viewpoints'][k]['label'];w=int(d.textlength(t,font=F(12)))+34
  if x+w>canvas.width-12:x=12;y+=20
  d.ellipse([x,y+2,x+11,y+13],fill=DOT[n%6],outline=(0,0,0));d.text((x+16,y-1),t,fill=(20,20,20),font=F(12));x+=w
 d.text((canvas.width-12,H0+156),f'x {x0:.0f}…{x1:.0f} m, z {z0:.0f}…{z1:.0f} m · 4 m cells · north up · terrain-only line of sight',fill=(90,90,90),font=F(11),anchor='ra')
 canvas.save(IMG/f'visibility-{g}.png');print(g,canvas.size)
