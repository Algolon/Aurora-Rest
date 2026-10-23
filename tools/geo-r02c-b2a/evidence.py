"""GEO-R02C-B2a evidence figures (MEASURED on the composed B1.1 and B2a terrain; no design-only material here).
  diff-b2a.png        B2a - B1.1 height difference over the hillshade, with the D1-D4 locations and both routes
  seams-b2a.png       each B1.1 seam cluster: B1.1 | B2a hillshade crops and the slope added over R1 (red) under the same criterion
  col-b2a.svg         D2: the S0-S1 crest profile and a north-south section through the col, B1.1 vs B2a
  outlet-b2a.png      D4: the hollow and its outlet, B1.1 | B2a, with D8 streams > 0.5 ha
  route-b2a.svg       D3: elevation profiles of the primary approach and the scramble, coloured by 10 m hiking grade
  skyline-b2a-<v>.svg skyline regression: B1.1 and B2a skylines with the declared D1 / D2 windows shaded
  data/seam-area-cross-check.json  band-independent added-slope area around each B1.1 seam
  python3 tools/geo-r02c-b2a/evidence.py"""
from pathlib import Path
import json,sys
import numpy as np
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1];sys.path[:0]=[str(HERE/'lib'),str(HERE)]
from route import bilinear,hiking_grades,resample  # noqa: E402
import skyline_regression as SR  # noqa: E402
NX,NZ,CELL=1501,2001,4.;DOC=ROOT/'docs/geo-r02c-b2a';IMG=DOC/'images';IMG.mkdir(parents=True,exist_ok=True)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans{}.ttf'
def F(s,b=False):
 try:return ImageFont.truetype(FONT.format('-Bold' if b else ''),s)
 except OSError:return ImageFont.load_default()
R1=np.fromfile(ROOT/'public/geo-r02b/terrain.f32','<f4').reshape(NZ,NX).astype(float);B11=SR.load('b01','b1');B2=SR.load('b2a','a')
design=json.loads((HERE/'design/north-massif-b2a.json').read_text());fin=json.loads((DOC/'validation/a-final.json').read_text());routes=json.loads((ROOT/'public/geo-r02c-b2a/routes.json').read_text())
r11=json.loads((ROOT/'public/geo-r02c-b01/routes.json').read_text())['routes'][0]['points2']
SEAMS11=[[-1460,2687],[-997,2953],[-1117,2093],[-73,3180]]
def hill(H,box):
 j0,j1,i0,i1=box;sub=H[j0:j1,i0:i1];gz,gx=np.gradient(sub,CELL);n=np.stack([-gx,np.ones_like(sub),gz],-1);n/=np.linalg.norm(n,axis=-1,keepdims=True)
 L=np.array([np.sin(np.radians(315))*np.cos(np.radians(40)),np.sin(np.radians(40)),np.cos(np.radians(315))*np.cos(np.radians(40))]);hs=np.clip(n@L,0,1)*.75+.25
 c=np.clip(sub/900,0,1);rgb=np.stack([.62+.38*c,.64+.3*c,.56+.36*c],-1)*hs[...,None]*255;rgb[sub<=0]=[44,74,92]
 lev=np.floor(sub/50);e=((lev!=np.roll(lev,1,0))|(lev!=np.roll(lev,1,1)))&(sub>0);rgb[e]*=.7;return rgb
def toP(x,z,box,s=1.):return (((x+3000)/CELL-box[2])*s,((4000-z)/CELL-box[0])*s)
def boxat(x,z,half):j=int((4000-z)/CELL);i=int((x+3000)/CELL);h=int(half/CELL);return (j-h,j+h,i-h,i+h)

def diffmap():
 box=(60,620,300,920);rgb=hill(B2,box);d=(B2-B11)[box[0]:box[1],box[2]:box[3]];t=np.clip(d/40,-1,1);m=np.abs(d)>0.05
 col=np.where(t[...,None]>0,np.array([214,60,40]),np.array([40,90,214]));a=np.abs(t)[...,None]*.85;rgb=np.where(m[...,None],rgb*(1-a)+col*a,rgb)
 im=Image.fromarray(rgb.clip(0,255).astype(np.uint8)).resize(((box[3]-box[2])*2,(box[1]-box[0])*2),Image.LANCZOS);d_=ImageDraw.Draw(im)
 for R,c in ((routes['routes'][0]['points2'],(255,215,0)),(routes['routes'][1]['points2'],(255,120,0))):d_.line([toP(x,z,box,2) for x,z in R[::3]],fill=c,width=3)
 d_.line([toP(x,z,box,2) for x,z in r11[::3]],fill=(255,255,255),width=1)
 for k,(x,z) in enumerate(SEAMS11):X,Y=toP(x,z,box,2);d_.ellipse([X-22,Y-22,X+22,Y+22],outline=(0,0,0),width=3);d_.text((X+24,Y-8),f'D1 seam {k+1}',fill=(0,0,0),font=F(15,True))
 c=fin['B_westernCol']['lowestPointOnArmCrestS0toS1']['xz'];X,Y=toP(*c,box,2);d_.text((X-60,Y-36),'D2 col',fill=(0,0,0),font=F(15,True));d_.ellipse([X-6,Y-6,X+6,Y+6],fill=(0,0,0))
 X,Y=toP(187,2311,box,2);d_.text((X+10,Y),'D4 outlet',fill=(0,0,0),font=F(15,True))
 W=im.width;o=Image.new('RGB',(W,im.height+70),(250,248,243));g=ImageDraw.Draw(o);o.paste(im,(0,70))
 g.text((10,8),'B2a - B1.1 height difference (red raised, blue lowered, ±40 m full colour), over the B2a hillshade (50 m contours)',fill=(0,0,0),font=F(15,True))
 g.text((10,34),'yellow: B2a primary approach · orange: optional scramble · white: B1.1 route · circles: the four B1.1 seam clusters',fill=(60,60,60),font=F(13));o.save(IMG/'diff-b2a.png')

def slope(H):gz,gx=np.gradient(H,CELL);return np.hypot(gx,gz)
def seams():
 sR,s11,s2=slope(R1),slope(B11),slope(B2);tiles=[]
 for k,(x,z) in enumerate(SEAMS11):
  box=boxat(x,z,220);row=[]
  for H,s,lab in ((B11,s11,'B1.1'),(B2,s2,'B2a')):
   rgb=hill(H,box);add=(s-sR)[box[0]:box[1],box[2]:box[3]];m=(add>0.5);rgb[m]=rgb[m]*.35+np.array([220,30,30])*.65
   im=Image.fromarray(rgb.clip(0,255).astype(np.uint8)).resize((330,330),Image.LANCZOS);g=ImageDraw.Draw(im);g.rectangle([0,0,250,22],fill=(20,20,20));g.text((5,4),f'{lab} · seam {k+1} ({x}, {z})',fill=(255,255,255),font=F(12,True));row.append(im)
  tiles.append(row)
 W=2*330+30;o=Image.new('RGB',(W*2+10,70+2*(330+10)),(250,248,243));g=ImageDraw.Draw(o)
 g.text((10,8),'D1 seams: hillshade crops (440 m), red = slope added over R1 by more than 0.5 (the seam criterion also needs the band and core-p99 tests)',fill=(0,0,0),font=F(14,True))
 g.text((10,32),f"B1.1: 4 clusters over 0.25 ha (2.08, 1.71, 0.88, 0.79 ha). B2a: {fin['A_seams']['failingClusters']} over 0.25 ha; largest {max([s['areaHa'] for s in fin['A_seams']['clusters']] or [0])} ha.",fill=(60,60,60),font=F(13))
 for k,row in enumerate(tiles):
  X=(k%2)*(W+10);Y=70+(k//2)*(340)
  for n,im in enumerate(row):o.paste(im,(X+n*(330+10),Y))
 o.save(IMG/'seams-b2a.png')

def col():
 arm=np.array(next(r for r in design['ridges'] if r['id']=='arm-west')['knots'],float)[:7,:2];P=resample(arm,4.);s=np.r_[0,np.cumsum(np.hypot(*np.diff(P,axis=0).T))]
 h11=bilinear(B11,P[:,0],P[:,1]);h2=bilinear(B2,P[:,0],P[:,1]);hr=bilinear(R1,P[:,0],P[:,1])
 c=fin['B_westernCol'];x0,z0=c['lowestPointOnArmCrestS0toS1']['xz'];zz=np.linspace(z0-400,z0+400,201);xx=np.full_like(zz,x0);q11=bilinear(B11,xx,zz);q2=bilinear(B2,xx,zz)
 W,H=1100,585;o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" font-family="DejaVu Sans,Arial,sans-serif" font-size="12"><rect width="100%" height="100%" fill="#fcfcfb"/>']
 def panel(y0,xs,ys,curves,title,xl,ylo,yhi):
  sx=lambda v:60+(v-xs[0])/(xs[-1]-xs[0])*(W-90);sy=lambda v:y0+230-(v-ylo)/(yhi-ylo)*200
  o.append(f'<text x="60" y="{y0+12}" font-weight="bold" fill="#0b0b0b">{title}</text>')
  for lev in range(int(ylo//50*50),int(yhi)+1,50):o.append(f'<line x1="60" x2="{W-30}" y1="{sy(lev):.1f}" y2="{sy(lev):.1f}" stroke="#e1e0d9"/><text x="54" y="{sy(lev)+4:.1f}" text-anchor="end" fill="#898781" font-size="10">{lev}</text>')
  for lab,v,colr,dash in curves:o.append(f'<polyline points="{" ".join(f"{sx(a):.1f},{sy(b):.1f}" for a,b in zip(xs,v))}" fill="none" stroke="{colr}" stroke-width="2" {"stroke-dasharray=\"5 3\"" if dash else ""}/>')
  o.append(f'<text x="{W-30}" y="{y0+248}" text-anchor="end" fill="#898781" font-size="11">{xl}</text>')
 panel(20,s,None,[('R1',hr,'#b9b7ad',True),('B1.1',h11,'#898781',True),('B2a',h2,'#2a78d6',False)],f"Crest S0 (North Peak) → S1 (Vesttind) along the authored west arm · B2a col {c['lowestPointOnArmCrestS0toS1']['levelM']} m, Vesttind {c['vesttindB1M']} m, prominence {c['vesttindProminenceAboveColM']} m (B1.1: 695.3 m, 40.5 m)",'distance from the summit along the arm (m)',560,920)
 panel(290,zz,None,[('B1.1',q11,'#898781',True),('B2a',q2,'#2a78d6',False)],f'North-south section through the B2a col at x = {x0}: the saddle between the north cirque side and the Vestfjell side','z (m), south → north',min(q2.min(),q11.min())-10,max(q2.max(),q11.max())+10)
 o.append('<rect x="60" y="572" width="18" height="3" fill="#898781"/><text x="82" y="578" fill="#52514e">B1.1 (protected baseline)</text><rect x="260" y="572" width="18" height="3" fill="#2a78d6"/><text x="282" y="578" fill="#52514e">B2a</text><rect x="360" y="572" width="18" height="3" fill="#b9b7ad"/><text x="382" y="578" fill="#52514e">R1</text></svg>')
 (IMG/'col-b2a.svg').write_text('\n'.join(o)+'\n')

def outlet():
 sys.path.insert(0,str(HERE));from validate import accumulation
 box=boxat(200,2260,260);tiles=[]
 for H,lab in ((B11,'B1.1 · conditioned hollow (dry tarn site, 6.6 m fill)'),(B2,'B2a · natural outlet (D4)')):
  rgb=hill(H,box);a=accumulation(H,box);m=a>5e3;rgb[m]=rgb[m]*.3+np.array([30,90,200])*.7
  im=Image.fromarray(rgb.clip(0,255).astype(np.uint8)).resize((520,520),Image.LANCZOS);g=ImageDraw.Draw(im);g.rectangle([0,0,400,22],fill=(20,20,20));g.text((5,4),lab,fill=(255,255,255),font=F(12,True));tiles.append(im)
 o=Image.new('RGB',(1060,580),(250,248,243));g=ImageDraw.Draw(o);g.text((10,8),'D4: hollow between the south-east arm and the High Tarn rim (520 m crop) · blue: D8 flow paths > 0.5 ha',fill=(0,0,0),font=F(14,True))
 [o.paste(im,(10+k*530,50)) for k,im in enumerate(tiles)];o.save(IMG/'outlet-b2a.png')

def route():
 W,H=1100,420;o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" font-family="DejaVu Sans,Arial,sans-serif" font-size="12"><rect width="100%" height="100%" fill="#fcfcfb"/>',
  '<text x="20" y="22" font-weight="bold" fill="#0b0b0b">D3: elevation profiles on the rendered B2a surface, coloured by 10 m hiking grade</text>']
 P1=np.array(routes['routes'][0]['points2']);P2=np.array(routes['routes'][1]['points2']);s1=np.r_[0,np.cumsum(np.hypot(*np.diff(P1,axis=0).T))];s2=s1[-1]+np.r_[0,np.cumsum(np.hypot(*np.diff(P2,axis=0).T))]
 S=np.r_[s1,s2];h=np.r_[bilinear(B2,P1[:,0],P1[:,1]),bilinear(B2,P2[:,0],P2[:,1])];g1,_=hiking_grades(B2,P1);g2,_=hiking_grades(B2,P2);g=np.r_[np.pad(g1,(5,len(P1)-len(g1)-5),'edge'),np.pad(g2,(5,len(P2)-len(g2)-5),'edge')]
 lo=int(h.min()//100*100);sx=lambda v:60+v/S[-1]*(W-90);sy=lambda v:380-(v-lo)/(920-lo)*330
 for lev in range(lo,901,100):o.append(f'<line x1="60" x2="{W-30}" y1="{sy(lev):.1f}" y2="{sy(lev):.1f}" stroke="#e1e0d9"/><text x="54" y="{sy(lev)+4:.1f}" text-anchor="end" fill="#898781" font-size="10">{lev}</text>')
 colr=lambda v:'#1baf7a' if v<=0.2 else '#2a78d6' if v<=0.3 else '#eda100' if v<=0.5 else '#e34948'
 for i in range(0,len(S)-1,3):o.append(f'<line x1="{sx(S[i]):.1f}" y1="{sy(h[i]):.1f}" x2="{sx(S[min(i+3,len(S)-1)]):.1f}" y2="{sy(h[min(i+3,len(S)-1)]):.1f}" stroke="{colr(g[i])}" stroke-width="3"/>')
 o.append(f'<line x1="{sx(s1[-1]):.1f}" x2="{sx(s1[-1]):.1f}" y1="40" y2="380" stroke="#52514e" stroke-dasharray="4 3"/><text x="{sx(s1[-1])+6:.1f}" y="52" fill="#52514e">viewpoint {routes["report"]["viewpointM"]} m · optional scramble →</text>')
 o.append(f'<text x="{sx(0)+6:.1f}" y="52" fill="#52514e">primary hiking approach (R1 alignment, then B2a)</text>')
 for k,(lab,c) in enumerate((('≤ 0.20','#1baf7a'),('0.20–0.30','#2a78d6'),('0.30–0.50','#eda100'),('> 0.50','#e34948'))):o.append(f'<rect x="{60+k*140}" y="398" width="18" height="4" fill="{c}"/><text x="{82+k*140}" y="404" fill="#52514e">{lab}</text>')
 o.append(f'<text x="{W-30}" y="404" text-anchor="end" fill="#898781">distance along the route (m)</text></svg>');(IMG/'route-b2a.svg').write_text('\n'.join(o)+'\n')

def skylines():
 from shapely import contains_xy;from shapely.geometry import Polygon
 for v in ('birchwood','valley-shoulder'):
  ox,oz=SR.VIEWS[v];a0=np.arctan2(-520-ox,2770-oz);az=a0+np.radians(np.arange(-18,18.001,.05));e1,p1=SR.skyline(B11,ox,oz,az);e2,p2=SR.skyline(B2,ox,oz,az)
  W,H=1100,330;sx=lambda a:30+(np.degrees(a-a0)+18)/36*(W-60);lo=min(e1.min(),e2.min());hi=max(e1.max(),e2.max());sy=lambda e:H-50-(e-lo)/(hi-lo+1e-6)*(H-110)
  o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" font-family="DejaVu Sans,Arial,sans-serif" font-size="12"><rect width="100%" height="100%" fill="#fcfcfb"/>',
   f'<text x="20" y="22" font-weight="bold" fill="#0b0b0b">Skyline regression from {v.replace("-"," ")}: B1.1 (protected) vs B2a · vertical exaggeration {((W-60)/36)/((H-110)/(hi-lo)):.1f}x</text>']
  for w,colr in zip(SR.ALLOWED,('#e1eef3','#fdf0dc')):
   m=contains_xy(Polygon(w['xz']),p1[:,0],p1[:,1])|contains_xy(Polygon(w['xz']),p2[:,0],p2[:,1])
   for i in np.nonzero(m)[0]:o.append(f'<rect x="{sx(az[i]):.1f}" y="40" width="{(W-60)/720+.6:.1f}" height="{H-90}" fill="{colr}"/>')
  for e,c,dash in ((e1,'#898781',True),(e2,'#2a78d6',False)):o.append(f'<polyline points="{" ".join(f"{sx(a):.1f},{sy(x):.1f}" for a,x in zip(az,e))}" fill="none" stroke="{c}" stroke-width="2" {"stroke-dasharray=\"5 3\"" if dash else ""}/>')
  o.append(f'<rect x="30" y="{H-24}" width="18" height="3" fill="#898781"/><text x="52" y="{H-18}" fill="#52514e">B1.1</text><rect x="110" y="{H-24}" width="18" height="3" fill="#2a78d6"/><text x="132" y="{H-18}" fill="#52514e">B2a</text>'
   f'<rect x="190" y="{H-28}" width="14" height="10" fill="#e1eef3"/><text x="210" y="{H-18}" fill="#52514e">D2 window</text><rect x="300" y="{H-28}" width="14" height="10" fill="#fdf0dc"/><text x="320" y="{H-18}" fill="#52514e">D1 window</text></svg>')
  (IMG/f'skyline-b2a-{v}.svg').write_text('\n'.join(o)+'\n')

def seam_area():
 """Band-independent cross-check of D1: area within 220 m of each B1.1 seam where slope exceeds R1 by > 0.5 (inside or outside the blend band)."""
 sR,s1,s2=slope(R1),slope(B11),slope(B2);out=[]
 for k,(x,z) in enumerate(SEAMS11):
  b=boxat(x,z,220);b=np.s_[b[0]:b[1],b[2]:b[3]];r={'seam':k+1,'xz':[x,z]}
  for lab,s in (('b11',s1),('b2a',s2)):a=(s-sR)[b];r[lab]={'addedSlopeOver05Ha':round(float((a>0.5).sum())*CELL*CELL/1e4,2),'maxAddedSlope':round(float(a.max()),2)}
  out.append(r)
 (DOC/'data').mkdir(exist_ok=True);(DOC/'data/seam-area-cross-check.json').write_text(json.dumps({'method':seam_area.__doc__,'seams':out},indent=1)+'\n')

def design_changes():
 """Every field of the design master that differs between B1.1 (tools/geo-r02c-b01/design/north-massif-b1.json) and B2a."""
 a=json.loads((ROOT/'tools/geo-r02c-b01/design/north-massif-b1.json').read_text());out=[]
 def walk(x,y,p):
  if isinstance(x,dict) and isinstance(y,dict):
   for k in sorted(set(x)|set(y)):walk(x.get(k),y.get(k),f'{p}.{k}' if p else k)
  elif isinstance(x,list) and isinstance(y,list) and len(x)==len(y) and all(isinstance(v,dict) and 'id' in v for v in x+y):
   for u,v in zip(x,y):walk(u,v,f"{p}[{u.get('id')}]")
  elif x!=y:out.append({'path':p,'b1.1':x,'b2a':y})
 walk(a,design,'');(DOC/'data/design-changes-b1.1-to-b2a.json').write_text(json.dumps(out,indent=1)+'\n')

if __name__=='__main__':
 design_changes();seam_area();diffmap();seams();col();outlet();route();skylines();print('ok')
