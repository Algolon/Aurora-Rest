"""GEO-R02C-B0/B1 evidence figures.
  B0 DESIGN TARGETS (authored intent, not terrain): design-plan.png (the derived master over the R1 hillshade) and
     target-<view>.svg (skyline of the authored crest skeleton projected into the identity cameras, over the measured M0 skyline).
  B1 MEASURED (on the composed terrain): maps-b1.png (hillshade M0 | B1 | height difference), skylines-b1.svg (M0 vs B1 vs target),
     sections-b1.svg (four cross-sections), streams-b1.png (D8 stream network > 5 ha, M0 vs B1, with the candidate route).
  python3 tools/geo-r02c-b01/evidence.py"""
from pathlib import Path
import json,sys
import numpy as np
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1];sys.path[:0]=[str(HERE/'lib'),str(HERE)]
from massif import crest_profile  # noqa: E402
from validate import compose  # noqa: E402
from route import bilinear  # noqa: E402
NX,NZ,CELL=1501,2001,4.;DOC=ROOT/'docs/geo-r02c-b01';IMG=DOC/'images';IMG.mkdir(parents=True,exist_ok=True)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans{}.ttf'
def F(s,b=False):
 try:return ImageFont.truetype(FONT.format('-Bold' if b else ''),s)
 except OSError:return ImageFont.load_default()
design=json.loads((HERE/'design/north-massif-b1.json').read_text());features=json.loads((ROOT/'public/geo-r02b/features.json').read_text())
R1,B1,entry=compose('b1');R=R1.astype(float);B=B1.astype(float);routes=json.loads((ROOT/'public/geo-r02c-b01/routes.json').read_text())
BOX=(40,640,250,950)  # rows, cols: z 3840..1440, x -2000..800
def PP(x,z,s=1.):return (((x+3000)/CELL-BOX[2])*s,((4000-z)/CELL-BOX[0])*s)
P=lambda x,z:PP(x,z)
def hill(H):
 j0,j1,i0,i1=BOX;sub=H[j0:j1,i0:i1];gz,gx=np.gradient(sub,CELL);n=np.stack([-gx,np.ones_like(sub),gz],-1);n/=np.linalg.norm(n,axis=-1,keepdims=True)
 L=np.array([np.sin(np.radians(315))*np.cos(np.radians(40)),np.sin(np.radians(40)),np.cos(np.radians(315))*np.cos(np.radians(40))]);hs=np.clip(n@L,0,1)*.75+.25
 c=np.clip(sub/900,0,1);rgb=np.stack([.62+.38*c,.64+.3*c,.56+.36*c],-1)*hs[...,None]*255;rgb[sub<=0]=[44,74,92]
 lev=np.floor(sub/100);e=((lev!=np.roll(lev,1,0))|(lev!=np.roll(lev,1,1)))&(sub>0);rgb[e]*=.62;return Image.fromarray(rgb.clip(0,255).astype(np.uint8))

# ---------- B0 design plan ----------
def design_plan(name='design-plan.png',label='B0 design target'):
 s0=1.6;base=hill(R);im=base.resize((int(base.width*s0),int(base.height*s0)),Image.LANCZOS).convert('RGBA');ov=Image.new('RGBA',im.size,(0,0,0,0));d=ImageDraw.Draw(ov)
 P=lambda x,z:PP(x,z,s0)
 d.polygon([P(*p) for p in design['studyArea']['polygon']],outline=(30,30,30,255));
 for c in design['cirques']:
  x,z=c['floorXZ'];r=c['rimDistanceM']/CELL*s0;fr=c['floorRadiusM']/CELL*s0;o=np.array(c['outDir'],float);o/=np.linalg.norm(o);cx,cy=P(x,z)
  d.ellipse([cx-r,cy-r,cx+r,cy+r],outline=(40,110,200,255),width=2);d.ellipse([cx-fr,cy-fr,cx+fr,cy+fr],fill=(40,110,200,60))
  ex,ey=P(x+o[0]*(c['floorRadiusM']+c['troughLengthM']),z+o[1]*(c['floorRadiusM']+c['troughLengthM']));d.line([(cx,cy),(ex,ey)],fill=(40,110,200,255),width=3);d.text((cx+6,cy-14),f"{c['id']} {c['name']} · floor {c['floorM']} m",fill=(10,50,120,255),font=F(12,True))
 col={'arm-west':(200,60,30),'arm-north':(150,30,140),'arm-southeast':(210,120,0),'rim-east':(120,90,40),'fjell-southwest':(60,130,60)}
 for r in design['ridges']:d.line([P(k[0],k[1]) for k in r['knots']],fill=col[r['id']]+(255,),width=5);k=r['knots'][len(r['knots'])//2];d.text(P(k[0]+20,k[1]),r['name'],fill=col[r['id']]+(255,),font=F(12,True))
 for b in design['buttresses']:d.line([P(k[0],k[1]) for k in b['knots']],fill=(90,60,40,255),width=3)
 for s in design['summits']:x,y=P(*s['xz']);d.polygon([(x,y-9),(x-8,y+6),(x+8,y+6)],fill=(20,20,20,255));d.text((x+10,y-8),f"{s['id']} {s['name']} {s['levelM']} m",fill=(0,0,0,255),font=F(13,True))
 for s in design['saddles']:x,y=P(*s['xz']);d.ellipse([x-5,y-5,x+5,y+5],outline=(0,0,0,255),width=2);d.text((x+8,y+2),f"{s['id']} {s['name']} {s['levelM']}",fill=(40,40,40,255),font=F(11))
 pa=next(r for r in features['routes'] if r['id']=='peak-ascent')['points2'];d.line([P(*p) for p in pa[::4]],fill=(255,255,255,200),width=2)
 d.line([P(*p) for p in routes['routes'][0]['points2'][::3]],fill=(255,220,0,255),width=3)
 lk=next(l for l in features['lakes'] if l['id']=='high-tarn');x,y=P(*np.mean(lk['boundary'],axis=0));d.text((x-30,y),'High Tarn (360 m, preserved)',fill=(255,255,255,255),font=F(12,True))
 im=Image.alpha_composite(im,ov).convert('RGB');W=im.width;leg=Image.new('RGB',(W,96),(250,248,243));g=ImageDraw.Draw(leg)
 g.text((10,8),f'{label}: derived North massif master (authored intent drawn over the R1 hillshade, 100 m contours). Not terrain.',fill=(0,0,0),font=F(14,True))
 g.text((10,32),'Coloured lines: the three arms, the High Tarn rim and the Vestfjell plateau · brown: buttresses · blue: cirques (rim circle, floor disc, outlet trough)',fill=(60,60,60),font=F(12))
 g.text((10,52),'triangles: summits · circles: saddles · black outline: study area (outside it nothing changes) · white: R1 peak-ascent (reference) · yellow: B1 candidate route',fill=(60,60,60),font=F(12))
 g.text((10,72),'Preserved: High Tarn and 150 m, the coast band, every water cell, the tarn-inlet-w and windward-gully corridors, all other routes.',fill=(60,60,60),font=F(12))
 o=Image.new('RGB',(W,im.height+96),(250,248,243));o.paste(leg,(0,0));o.paste(im,(0,96));o.save(IMG/name)

# ---------- skylines: target (design skeleton), M0 and B1 ----------
CAMS={'birchwood':('Birchwood Forest',(-700.,300.)),'valley-shoulder':('Central Valley shoulder',(-175.97,-155.95))}
def skyline_terrain(H,ox,oz,eye,az):
 r=np.arange(60,4200,4.);best=np.full(az.shape,-90.)
 for k,a in enumerate(az):
  x=ox+np.sin(a)*r;z=oz+np.cos(a)*r;h=bilinear(H,x,z);best[k]=np.degrees(np.arctan2(h-eye,r)).max()
 return best
def skyline_design(ox,oz,eye,az):
 rng=np.random.default_rng(0);st=dict(design['structure'],crestRoughnessM=0.);best=np.full(az.shape,-90.);labels=[]
 for r in design['ridges']+design['buttresses']:
  K=np.array(r['knots'],float);L=np.r_[0,np.cumsum(np.hypot(*np.diff(K[:,:2],axis=0).T))];s=np.arange(0,L[-1],4.);f=crest_profile(r['knots'],0.,70.,rng)
  x=np.interp(s,L,K[:,0]);z=np.interp(s,L,K[:,1]);h=f(s);a=np.arctan2(x-ox,z-oz);el=np.degrees(np.arctan2(h-eye,np.hypot(x-ox,z-oz)))
  idx=np.clip(np.searchsorted(az,a),0,len(az)-1);np.maximum.at(best,idx,el)
 for s in design['summits']+design['saddles']:
  x,z=s['xz'];labels.append((s['id'],np.arctan2(x-ox,z-oz),np.degrees(np.arctan2(s['levelM']-eye,np.hypot(x-ox,z-oz)))))
 return best,labels
def skylines():
 out={}
 for key,(name,(ox,oz)) in CAMS.items():
  eye=float(bilinear(R,ox,oz))+1.75;a0=np.arctan2(-520-ox,2770-oz);az=a0+np.radians(np.arange(-16,16.01,.05));m0=skyline_terrain(R,ox,oz,eye,az);b1=skyline_terrain(B,ox,oz,eye,az);tg,lab=skyline_design(ox,oz,eye,az)
  tg=np.where(tg>-80,np.maximum(tg,np.minimum(m0,tg)),np.nan);out[key]=(name,az,a0,m0,b1,tg,lab,eye)
 return out
def svg_skyline(key,name,az,a0,curves,lab,title,file,note):
 W,H=1100,360;px=13.33;xs=lambda a:W/2+np.degrees(a-a0)*px*1.6;ys=lambda e:H-60-(e-np.nanmin(curves[0][1])+.3)*px*6
 o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" font-family="DejaVu Sans,Arial,sans-serif" font-size="12"><rect width="100%" height="100%" fill="#fcfcfb"/>',
  f'<text x="14" y="22" font-size="15" font-weight="bold" fill="#0b0b0b">{title}</text><text x="14" y="40" fill="#52514e">{note}</text>']
 for lbl,c,col,dash in curves:
  pts=' '.join(f'{xs(a):.1f},{ys(e):.1f}' for a,e in zip(az,c) if np.isfinite(e));o.append(f'<polyline points="{pts}" fill="none" stroke="{col}" stroke-width="2" {"stroke-dasharray=\"6 4\"" if dash else ""}/>')
 for k,(lbl,c,col,dash) in enumerate(curves):o.append(f'<rect x="{14+k*260}" y="{H-26}" width="18" height="3" fill="{col}"/><text x="{38+k*260}" y="{H-20}" fill="#52514e">{lbl}</text>')
 for i,a,e in lab:o.append(f'<text x="{xs(a):.1f}" y="{ys(e)-8:.1f}" fill="#0b0b0b" text-anchor="middle" font-size="11">{i}</text>')
 o.append(f'<text x="{W-14}" y="{H-20}" text-anchor="end" fill="#898781">vertical exaggeration 6 x relative to horizontal</text></svg>');(IMG/file).write_text('\n'.join(o)+'\n')

def maps():
 a=hill(R);b=hill(B);j0,j1,i0,i1=BOX;d=(B-R)[j0:j1,i0:i1];t=np.clip(d/150,-1,1);rgb=np.zeros(d.shape+(3,))
 rgb[...,0]=np.where(t>0,214,255*(1+t)*.84+40*(-t));rgb[...,1]=255*(1-np.abs(t))*.95+40*np.abs(t);rgb[...,2]=np.where(t<0,214,255*(1-t)*.84+40*t)
 rgb[d==0]=[236,235,230];c=Image.fromarray(rgb.clip(0,255).astype(np.uint8));W=a.width;o=Image.new('RGB',(W*3+20,a.height+60),(250,248,243));g=ImageDraw.Draw(o)
 for k,(im,t_) in enumerate(((a,'M0 = canonical R1'),(b,'B1 candidate'),(c,'B1 - R1 (red raised, blue lowered, ±150 m full colour; grey unchanged)'))):o.paste(im,(k*(W+10),50));g.text((k*(W+10)+4,14),t_,fill=(0,0,0),font=F(14,True))
 g2=ImageDraw.Draw(o)
 for k in (1,2):g2.line([(k*(W+10)+P(*p)[0],50+P(*p)[1]) for p in routes['routes'][0]['points2'][::3]],fill=(255,210,0),width=2)
 o.save(IMG/'maps-b1.png')
def sections():
 S=[('A · west-east through North Peak',(-1400,2770),(400,2770)),('B · north-south through North Peak',(-520,3500),(-520,1700)),('C · through Tarntind and the Skar notch, SW-NE',(-700,2200),(200,2900)),('D · across the Vestfjell plateau, west-east',(-1500,2350),(-300,2350))]
 W,Hh=1100,250;o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {Hh*4+30}" font-family="DejaVu Sans,Arial,sans-serif" font-size="12"><rect width="100%" height="100%" fill="#fcfcfb"/>']
 for k,(t,a,b) in enumerate(S):
  n=600;x=np.linspace(a[0],b[0],n);z=np.linspace(a[1],b[1],n);hr=bilinear(R,x,z);hb=bilinear(B,x,z);L=np.hypot(b[0]-a[0],b[1]-a[1]);y0=k*Hh+30
  sx=lambda i:40+i/(n-1)*(W-60);sy=lambda h:y0+Hh-30-h/950*(Hh-60)
  o.append(f'<text x="40" y="{y0+8}" font-weight="bold" fill="#0b0b0b">{t} ({L/1000:.1f} km, no vertical exaggeration would be {L/950:.1f}:1 · drawn {((W-60)/L)/((Hh-60)/950):.2f}x)</text>')
  for lev in range(0,901,300):o.append(f'<line x1="40" x2="{W-20}" y1="{sy(lev):.1f}" y2="{sy(lev):.1f}" stroke="#e1e0d9"/><text x="36" y="{sy(lev)+4:.1f}" text-anchor="end" fill="#898781" font-size="10">{lev}</text>')
  o.append(f'<polyline points="{" ".join(f"{sx(i):.1f},{sy(h):.1f}" for i,h in enumerate(hr))}" fill="none" stroke="#898781" stroke-width="2" stroke-dasharray="5 3"/>')
  o.append(f'<polyline points="{" ".join(f"{sx(i):.1f},{sy(h):.1f}" for i,h in enumerate(hb))}" fill="none" stroke="#2a78d6" stroke-width="2"/>')
 o.append('<rect x="40" y="10" width="18" height="3" fill="#898781"/><text x="62" y="16" fill="#52514e">M0 (R1)</text><rect x="140" y="10" width="18" height="3" fill="#2a78d6"/><text x="162" y="16" fill="#52514e">B1</text></svg>')
 (IMG/'sections-b1.svg').write_text('\n'.join(o)+'\n')
def streams():
 z=np.load(HERE/'.cache/streams.npz');aR,aB=z['aR'],z['aB'];box=tuple(int(v) for v in z['box']);thr=5e4
 def img(H,a):
  global BOX
  old=BOX;BOX=box;im=np.asarray(hill(H)).copy();BOX=old;m=a>thr;w=np.clip(np.log10(a/thr)/2,0,1);im[m]=(np.array([30,90,200])*w[m][:,None]+im[m]*(1-w[m][:,None])*.4).astype(np.uint8);return Image.fromarray(im)
 a=img(R,aR);b=img(B,aB);o=Image.new('RGB',(a.width*2+10,a.height+40),(250,248,243));o.paste(a,(0,40));o.paste(b,(a.width+10,40));g=ImageDraw.Draw(o)
 g.text((4,10),'D8 streams > 5 ha · M0 (R1)',fill=(0,0,0),font=F(14,True));g.text((a.width+14,10),'D8 streams > 5 ha · B1 (regenerated drainage)',fill=(0,0,0),font=F(14,True));o.save(IMG/'streams-b1.png')

if __name__=='__main__':
 design_plan()
 sk=skylines();res={}
 for key,(name,az,a0,m0,b1,tg,lab,eye) in sk.items():
  svg_skyline(key,name,az,a0,[('M0 measured skyline (R1)',m0,'#898781',True),('B0 target: authored crest skeleton',tg,'#eb6834',True)],lab,f'B0 design target · North Peak from {name}',f'target-{key}.svg','Target = upper envelope of the authored crest lines and summit levels, projected into the camera. It is intent, not terrain.')
  svg_skyline(key,name,az,a0,[('M0 measured (R1)',m0,'#898781',True),('B1 measured (actual terrain)',b1,'#2a78d6',False),('B0 target',tg,'#eb6834',True)],lab,f'B1 measured skyline · North Peak from {name}',f'skyline-b1-{key}.svg','Terrain ray cast at 0.05° steps on the composed grids (eye 1.75 m above the ground).')
  px=13.33;res[key]={'maxShiftPx':round(float(np.nanmax(np.abs(b1-m0))*px),1),'meanShiftPx':round(float(np.nanmean(np.abs(b1-m0))*px),1),'widthShiftOver3pxDeg':round(float((np.abs(b1-m0)*px>3).sum()*.05),1),
   'b1PeakElevationDeg':round(float(b1.max()),2),'m0PeakElevationDeg':round(float(m0.max()),2)}
 maps();sections();streams()
 (DOC/'data').mkdir(exist_ok=True);(DOC/'data/skylines.json').write_text(json.dumps({'method':'terrain ray cast, eye 1.75 m, 60° vertical FOV over 800 px','views':res},indent=1)+'\n');print(json.dumps(res,indent=0))
