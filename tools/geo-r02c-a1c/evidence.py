"""MEASURED evidence for the A1c candidates (no terrain is written): before/after skylines per viewpoint, viewshed change,
terrain-difference and hillshade maps, crest long profiles along every raised ridge, cross-sections across each raised
segment, and affected crest length per ridge. Usage: python3 tools/geo-r02c-a1c/evidence.py s1 [s2]
Outputs: docs/geo-r02c-a1c/images/*, docs/geo-r02c-a1c/data/evidence-<id>.json"""
from pathlib import Path
import json,sys
import numpy as np
HERE=Path(__file__).resolve().parent;A1A=HERE.parent/'geo-r02c-a1a';ROOT=HERE.parents[1]
sys.path[:0]=[str(HERE/'lib'),str(A1A/'lib'),str(A1A),str(ROOT/'tools/geo-r02c/lib')]
from grid import J,I,load_r1  # noqa: E402
from common import surface,hillshade  # noqa: E402
import validate as VA  # noqa: E402
from shapely.geometry import LineString,Point  # noqa: E402
from shapely import distance as sdist,points  # noqa: E402
from PIL import Image,ImageDraw,ImageFont  # noqa: E402
OUT=ROOT/'docs/geo-r02c-a1c';IMG=OUT/'images';DAT=OUT/'data';IMG.mkdir(parents=True,exist_ok=True);DAT.mkdir(parents=True,exist_ok=True)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans{}.ttf'
def F(s,b=False):
 try:return ImageFont.truetype(FONT.format('-Bold' if b else ''),s)
 except OSError:return ImageFont.load_default()
PXDEG=800/60.;SUMMIT=np.array([-520.,2770.])
VP=json.loads((OUT/'feasibility/feasibility.json').read_text())['viewpoints']
features=json.loads((ROOT/'public/geo-r02b/features.json').read_text());RID={r['id']:np.array(r['points'],float) for r in features['ridges']}
def compose(fam,v):VA.VAR=ROOT/f'public/geo-r02c-{fam}';return VA.compose(v,load_r1())[0].astype(float)
R1=load_r1().astype(float)
def skyline(H,ox,oz,eye,azs,restrict):
 oy=float(eye[4:]) if isinstance(eye,str) else float(surface(R1,[ox],[oz])[0])+eye;ds=np.r_[np.arange(8,1500,4.),np.arange(1500,7000,8.)];out=[]
 for a in azs:
  t=np.radians(a);xs=ox+np.sin(t)*ds;zs=oz+np.cos(t)*ds;ok=(np.abs(xs)<2998)&(np.abs(zs)<3998)
  if restrict:ok&=(xs>=-1700)&(xs<=1450)&(zs>=1450)&(zs<=3500)
  out.append(float(np.degrees(np.arctan2(surface(H,xs[ok],zs[ok])-oy,ds[ok])).max()) if ok.any() else -90.)
 return np.array(out)
EYES={'birchwood':1.75,'valley-shoulder':1.75,'tarn-overlook':1.75,'tarn-shore':1.75,'high-tarn':1.75,'approach-mid':1.75,'upper-trail':1.75,'oblique-se':'abs:1450','oblique-n':'abs:1300','west-coast':1.75}
def run(vid):
 fam='a1c';H=compose(fam,vid);res={'variant':vid,'skylines':{},'viewshed':{}}
 d=H-R1;ch=np.abs(d)>0.05;res['changedHa']=round(float(ch.sum())*16/1e4,2);res['maxRaiseM']=round(float(d.max()),2);res['maxLoweringM']=round(float(-d.min()),2)
 decl=json.loads((ROOT/f'public/geo-r02c-a1c/{vid}.declared.json').read_text());cr=np.array(decl['crestRaised']);lens={}
 if len(cr):
  P=points(np.c_[cr[:,1]*4.-3000,4000.-cr[:,0]*4.]);dd=np.stack([sdist(LineString(RID[k][:,[0,2]]),P) for k in ('n-main','n-crown','n-west-spur','n-nw-cape','n-east-arc')]);near=np.argmin(dd,0)
  for n,k in enumerate(('n-main','n-crown','n-west-spur','n-nw-cape','n-east-arc')):
   m=near==n
   if m.any():lens[k]={'crestCells':int(m.sum()),'approxCrestLengthM':round(float(m.sum())*16/20),'maxRaiseM':round(float(cr[m,2].max()),1)}
 res['affectedCrest']=lens
 # skylines before / after (actual terrain)
 panels=[]
 for k,v in VP.items():
  if k not in EYES:continue
  az=np.array([p[0] for p in v['skyline']]);ox,oz=v['xz'];restrict=isinstance(EYES[k],str)
  if not len(az):continue
  azs=np.arange(az.min(),az.max()+1e-9,.2);a0=skyline(R1,ox,oz,EYES[k],azs,restrict);a1=skyline(H,ox,oz,EYES[k],azs,restrict);dp=(a1-a0)*PXDEG
  res['skylines'][k]={'name':v['name'],'maxShiftPx':round(float(dp.max()),1),'widthShiftOver3pxDeg':round(float((dp>=3).sum()*.2),1),'widthShiftOver1pxDeg':round(float((dp>=1).sum()*.2),1)}
  panels.append((k,v['name'],azs,a0,a1,dp))
 # skyline figure
 w=980;ph=120;gap=34;Hh=40+len(panels)*(ph+gap);o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {Hh}" font-family="DejaVu Sans,system-ui,sans-serif" font-size="11"><rect width="100%" height="100%" fill="#fffdf9"/>',
  f'<text x="16" y="22" font-size="14" font-weight="700" fill="#111">MEASURED skylines, R1 (grey) and A1c {vid.upper()} (orange), terrain only; shift in pixels of the 1280 × 800 review captures</text>']
 y=40
 for k,name,azs,a0,a1,dp in panels:
  lo=min(a0.min(),a1.min());hi=max(a0.max(),a1.max());pad=.08*(hi-lo+1e-6);lo-=pad;hi+=pad;X=lambda a:60+(a-azs[0])/(azs[-1]-azs[0])*(w-80);Y=lambda v:y+ph-(v-lo)/(hi-lo)*(ph-14)
  o.append(f'<text x="16" y="{y+12}" font-weight="700" fill="#111">{name}</text><text x="{w-16}" y="{y+12}" text-anchor="end" fill="#444">max shift {dp.max():.1f} px · ≥ 3 px over {(dp>=3).sum()*.2:.1f}°</text>')
  o.append(f'<polyline points="{" ".join(f"{X(a):.1f},{Y(b):.1f}" for a,b in zip(azs,a0))}" fill="none" stroke="#8a8f98" stroke-width="2.4"/>')
  o.append(f'<polyline points="{" ".join(f"{X(a):.1f},{Y(b):.1f}" for a,b in zip(azs,a1))}" fill="none" stroke="#c2410c" stroke-width="1.4"/>')
  o.append(f'<text x="56" y="{y+ph+12}" text-anchor="start" fill="#666">{azs[0]:.0f}°</text><text x="{w-20}" y="{y+ph+12}" text-anchor="end" fill="#666">{azs[-1]:.0f}° azimuth</text>');y+=ph+gap
 o.append('</svg>');(IMG/f'skylines-{vid}.svg').write_text('\n'.join(o))
 # viewshed change of the massif (8 m grid) from ground viewpoints
 gx,gz=np.meshgrid(np.arange(-1500.,1300.,16.),np.arange(3400.,1600.,-16.));tx=gx.ravel();tz=gz.ravel()
 def vis(Hh,ox,oz):
  oy=surface(R1,[ox],[oz])[0]+1.75;ty=surface(Hh,tx,tz)+.5;dd=np.hypot(tx-ox,tz-oz);v=np.zeros(len(tx),bool)
  for s_ in range(0,len(tx),1500):
   sl=slice(s_,s_+1500);n=int(max(2,dd[sl].max()/8));s=(np.arange(1,n)/n)[None,:];xs=ox+(tx[sl]-ox)[:,None]*s;zs=oz+(tz[sl]-oz)[:,None]*s;ys=oy+(ty[sl]-oy)[:,None]*s
   v[sl]=~(surface(Hh,xs.ravel(),zs.ravel()).reshape(xs.shape)>ys+.05).any(axis=1)
  return v&(surface(R1,tx,tz)>0)
 for k,v in VP.items():
  if EYES.get(k)!=1.75:continue
  a=vis(R1,*v['xz']);b=vis(H,*v['xz']);res['viewshed'][k]={'visibleBeforeHa':round(float(a.sum())*256/1e4,1),'visibleAfterHa':round(float(b.sum())*256/1e4,1),'newlyHiddenHa':round(float((a&~b).sum())*256/1e4,1),'newlyVisibleHa':round(float((b&~a).sum())*256/1e4,1)}
 # maps: hillshade R1 / variant, difference
 x0,x1,z0,z1=-1300.,700.,2050.,3350.;ja,jb=int((4000-z1)/4),int((4000-z0)/4);ia,ib=int((x0+3000)/4),int((x1+3000)/4)
 def shade(A):hs=hillshade(A,290,30)*.7+hillshade(A,135,40)*.3;g=np.clip(hs,0,1)*200+40;return np.stack([g,g*.98,g*.94],-1)
 S=1;sub=lambda A:A[ja-1:jb+1,ia-1:ib+1]
 h0=shade(sub(R1))[1:-1,1:-1];h1=shade(sub(H))[1:-1,1:-1];dd=d[ja:jb,ia:ib];t=np.clip(dd/20,-1,1);ww=1-np.abs(t)
 dm=np.stack([np.where(t>0,1,ww),ww,np.where(t<0,1,ww)],-1)*255*.85+h0*.15
 pw,ph_=h0.shape[1],h0.shape[0];c=Image.new('RGB',(pw*3+24,ph_+70),(250,248,243));dr=ImageDraw.Draw(c)
 dr.text((8,8),f'MEASURED · North Peak, hillshade of R1, A1c {vid.upper()} and the difference (red = raised, up to 20 m)',fill=(20,20,20),font=F(14,True))
 for n,(lab,a) in enumerate((('M0 = R1',h0),(f'A1c {vid.upper()}',h1),('Δ (±20 m)',dm))):
  c.paste(Image.fromarray(a.clip(0,255).astype(np.uint8)),(n*(pw+12),48));dr.text((n*(pw+12)+6,52),lab,fill=(20,20,20),font=F(13,True))
 c.save(IMG/f'maps-{vid}.png')
 # crest long profiles and cross-sections
 spec=json.loads((HERE/f'specs/a1c-{vid}.json').read_text());segs=[s for op in spec['operators'] if op['type']=='ridgeMassing' for s in op['segments']]
 prof=[]
 def svg(name,title,dist,series,notes,xl):
  allv=np.concatenate([s for *_,s in series]);lo=np.floor(allv.min()/10)*10-5;hi=np.ceil(allv.max()/10)*10+5;w_=980;pad=56;pw_=w_-pad-20;ph2=220;top=46
  X=lambda v:pad+(v-dist.min())/(dist.max()-dist.min())*pw_;Y=lambda v:top+ph2-(v-lo)/(hi-lo)*ph2;ex=((dist.max()-dist.min())/pw_)/((hi-lo)/ph2)
  o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w_} {top+ph2+56+18*len(notes)}" font-family="DejaVu Sans,system-ui,sans-serif" font-size="12"><rect width="100%" height="100%" fill="#fffdf9"/>',
   f'<text x="{pad}" y="22" font-size="14" font-weight="700" fill="#111">{title}</text><text x="{pad}" y="38" fill="#555">MEASURED terrain · vertical ×{ex:.2f}</text>']
  for k in range(5):v=lo+(hi-lo)*k/4;o.append(f'<line x1="{pad}" x2="{w_-20}" y1="{Y(v):.1f}" y2="{Y(v):.1f}" stroke="#000" opacity=".08"/><text x="6" y="{Y(v)+4:.1f}" fill="#555">{v:.0f} m</text>')
  for k in range(6):v=dist.min()+(dist.max()-dist.min())*k/5;o.append(f'<text x="{X(v):.1f}" y="{top+ph2+16}" text-anchor="middle" fill="#555">{v:.0f}</text>')
  o.append(f'<text x="{pad+pw_/2}" y="{top+ph2+32}" text-anchor="middle" fill="#555">{xl}</text>')
  for lab,col,wid,s in series:o.append(f'<polyline points="{" ".join(f"{X(a):.1f},{Y(b):.1f}" for a,b in zip(dist,s))}" fill="none" stroke="{col}" stroke-width="{wid}"/>')
  x=pad;yy=top+ph2+48
  for lab,col,wid,_ in series:o.append(f'<rect x="{x}" y="{yy-8}" width="18" height="4" fill="{col}"/><text x="{x+24}" y="{yy-3}" fill="#222">{lab}</text>');x+=24+int(7.2*len(lab))+30
  for k,n_ in enumerate(notes):o.append(f'<text x="{pad}" y="{yy+18+18*k}" fill="#333">{n_}</text>')
  o.append('</svg>');(IMG/f'{name}.svg').write_text('\n'.join(o))
 done=set()
 for s in segs:
  rid=s['ridge'];L=LineString(RID[rid][:,[0,2]]);s0=L.project(Point(*s['origin'])) if 'origin' in s else 0.
  key=(rid,s0)
  if key not in done:
   done.add(key);ss=np.arange(0,L.length,4.);P=np.array([[L.interpolate(v).x,L.interpolate(v).y] for v in ss]);a=surface(R1,P[:,0],P[:,1]);b=surface(H,P[:,0],P[:,1])
   svg(f'crest-{vid}-{rid}',f'Crest long profile: {rid} (R1 vs A1c {vid.upper()})',ss-s0,[('R1 crest','#8a8f98',3,a),(f'{vid.upper()} crest','#c2410c',2,b)],
    [f'Max raise on the crest line {float((b-a).max()):.1f} m; summit and principal crest alignment unchanged (the line itself is the authored crest).'],'distance along the crest (m)'+(' from the summit' if 'origin' in s else ''))
   prof.append({'ridge':rid,'maxCrestRaiseM':round(float((b-a).max()),1),'raisedLengthOver2mM':int(((b-a)>2).sum()*4)})
  mid=(s['profile'][0][0]+s['profile'][-1][0])/2;q=L.interpolate(s0+mid);q2=L.interpolate(s0+mid+3);q1=L.interpolate(s0+mid-3);tt=np.array([q2.x-q1.x,q2.y-q1.y]);tt/=np.linalg.norm(tt);n=np.array([-tt[1],tt[0]])
  off=np.arange(-260,261,4.);P=np.array([q.x,q.y])+off[:,None]*n;a=surface(R1,P[:,0],P[:,1]);b=surface(H,P[:,0],P[:,1])
  svg(f'xsec-{vid}-{s["id"]}',f'Across {s["id"]} at its midpoint ({s["arm"]})',off,[('R1','#8a8f98',3,a),(vid.upper(),'#c2410c',2,b)],[s['character'][:150]],'distance across the crest (m), + = left of the crest direction')
 res['crestProfiles']=prof
 (DAT/f'evidence-{vid}.json').write_text(json.dumps(res,indent=1)+'\n');print(json.dumps({k:res[k] for k in ('changedHa','maxRaiseM','affectedCrest','skylines','viewshed')},indent=0))
for v in sys.argv[1:]:run(v)
