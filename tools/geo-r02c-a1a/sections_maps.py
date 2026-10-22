"""Matched before/after cross-sections and terrain-difference maps for M0/V1/V2/V3 (measured on the composed variants).
Solid lines = generated terrain; dashed black = the approved A1-D design target (authored intent, not terrain).
Outputs: docs/geo-r02c-a1a/images/section-*.svg|png, map-*.png; data in docs/geo-r02c-a1a/sections.json"""
from pathlib import Path
import json,sys
import numpy as np
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE/'lib'));sys.path.insert(0,str(HERE))
from grid import ROOT,NX,NZ,load_r1,surface  # noqa: E402
from validate import compose  # noqa: E402
from PIL import Image  # noqa: E402
sys.path.insert(0,str(ROOT/'tools/geo-r02c/lib'))
from common import hillshade  # noqa: E402
OUT=ROOT/'docs/geo-r02c-a1a';IMG=OUT/'images';IMG.mkdir(parents=True,exist_ok=True)
VAR=[('m0','M0 · R1','#8a8f98'),('v1','V1 · ridges','#2563eb'),('v2','V2 · + C1','#c2410c'),('v3','V3 · + G1','#15803d')]
R1=load_r1();H={v:compose(v,R1)[0] for v,_,_ in VAR}
A1D=json.loads((ROOT/'docs/geo-r02c-a1d/data/profiles.json').read_text())['profiles']
def a1d_target(pid,d,h):
 p=next(x for x in A1D if x['id']==pid);cp=p['controlPoints']
 if isinstance(cp,str):return None
 cd=[c[0] for c in cp];ch=[np.interp(c[0],d,h) if (c[1] is None or k in(0,len(cp)-1)) else c[1] for k,c in enumerate(cp)]
 t=np.full(len(d),np.nan);m=(d>=cd[0])&(d<=cd[-1]);t[m]=np.interp(d[m],cd,ch);return t
def across(ridge,at_s,half,from_pt):
 pts=np.array(next(r for r in json.loads((ROOT/'public/geo-r02b/features.json').read_text())['ridges'] if r['id']==ridge)['points'])[:,[0,2]]
 if np.hypot(*(pts[-1]-from_pt))<np.hypot(*(pts[0]-from_pt)):pts=pts[::-1]
 seg=np.hypot(*np.diff(pts,axis=0).T);s=np.r_[0,np.cumsum(seg)];k0=int(np.argmin(np.hypot(*(pts-from_pt).T)));s=s-s[k0]
 k=int(np.searchsorted(s,at_s));t=pts[min(k+1,len(pts)-1)]-pts[max(k-1,0)];t/=np.linalg.norm(t);n=np.array([-t[1],t[0]]);c=pts[k]
 return tuple(c+n*half),tuple(c-n*half)
LINES=[('A1-across','A1 n-crown arete, across at 250 m from the summit (W → E)',*across('n-crown',250,330,np.array([-520,2770])),None),
 ('A2-across','A2 SE arete, across at its middle (NE → SW)',*across('n-main',190,300,np.array([-520,2770])),None),
 ('A3-across','A3 W arete, across at its middle (S → N)',*across('n-main',-130,300,np.array([-520,2770])),None),
 ('summit-we','Summit W → E at z = 2770',(-1000,2770),(0,2770),None),
 ('summit-ns','Summit N → S at x = -520',(-520,3250),(-520,2300),None),
 ('C1-T1','C1 Nordbotn W → E at z = 2930 (A1-D section T1)',(-650,2930),(150,2930),'T1'),
 ('G1-mid','G1 tarn-inlet-w across the P0 mid transect (S → N)',None,None,'G1'),
 ('G1-upper','G1 tarn-inlet-w across at channel s = 260 m (S → N)',None,None,None)]
pts0=json.loads((ROOT/'docs/geo-r02c-p0/baseline/transects.json').read_text())['tarn-inlet-w-mid']['points']
ch=np.array(next(c for c in json.loads((ROOT/'public/geo-r02b/features.json').read_text())['channels'] if c['id']=='tarn-inlet-w')['points'])[:,[0,2]]
cs=np.r_[0,np.cumsum(np.hypot(*np.diff(ch,axis=0).T))];k=int(np.searchsorted(cs,260));tt=ch[k+3]-ch[k-3];tt/=np.linalg.norm(tt);nn=np.array([-tt[1],tt[0]])
GEO={'G1-mid':(tuple(pts0[0]),tuple(pts0[1])),'G1-upper':(tuple(ch[k]-nn*160),tuple(ch[k]+nn*160))}
def panel(title,d,series,target,w=900):
 allv=np.concatenate([s for _,_,s in series]+([target[np.isfinite(target)]] if target is not None else []));lo=allv.min()-8;hi=allv.max()+20;pad=46;pw=w-pad-12
 ph=float(np.clip(pw*(hi-lo)/(d.max()-d.min()),150,420))
 if ph>pw*(hi-lo)/(d.max()-d.min())+1:lo=hi-ph*(d.max()-d.min())/pw
 ht=int(ph+92);ex=(d.max()-d.min())/pw/((hi-lo)/ph);X=lambda v:pad+(v-d.min())/(d.max()-d.min())*pw;Y=lambda v:ht-50-(v-lo)/(hi-lo)*ph
 o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {ht}" font-family="system-ui,sans-serif" font-size="11"><rect width="{w}" height="{ht}" fill="#fffdf9"/>',f'<text x="{pad}" y="18" font-size="13" font-weight="700">{title}</text>']
 for kk in range(5):v=lo+(hi-lo)*kk/4;o.append(f'<line x1="{pad}" x2="{w-12}" y1="{Y(v):.1f}" y2="{Y(v):.1f}" stroke="#000" opacity=".1"/><text x="4" y="{Y(v)+4:.1f}" opacity=".7">{v:.0f} m</text>')
 if target is not None:
  m=np.isfinite(target);o.append(f'<polyline points="{" ".join(f"{X(a):.1f},{Y(b):.1f}" for a,b in zip(d[m],target[m]))}" fill="none" stroke="#111" stroke-width="1.6" stroke-dasharray="6 4"/>')
 for name,col,s in series:o.append(f'<polyline points="{" ".join(f"{X(a):.1f},{Y(b):.1f}" for a,b in zip(d,s))}" fill="none" stroke="{col}" stroke-width="{2.6 if name.startswith("M0") else 1.8}"/>')
 x=pad
 for name,col,_ in series:o.append(f'<rect x="{x}" y="{ht-30}" width="18" height="4" fill="{col}"/><text x="{x+24}" y="{ht-25}">{name}</text>');x+=130
 if target is not None:o.append(f'<line x1="{x}" x2="{x+18}" y1="{ht-28}" y2="{ht-28}" stroke="#111" stroke-dasharray="5 3"/><text x="{x+24}" y="{ht-25}">A1-D design target (authored, not terrain)</text>')
 o.append(f'<text x="{w-12}" y="{ht-8}" text-anchor="end" opacity=".7">{d.max()-d.min():.0f} m section · '+('true scale' if abs(ex-1)<.03 else f'vertical ×{ex:.2f}')+'</text></svg>');return '\n'.join(o)
out={}
for lid,title,a,b,tid in LINES:
 if a is None:a,b=GEO[lid]
 a=np.array(a,float);b=np.array(b,float);n=int(np.hypot(*(b-a))//4)+1;t=np.linspace(0,1,n);p=a+(b-a)*t[:,None];d=np.hypot(*(p-a).T)
 ser=[(lab,col,surface(H[v],p[:,0],p[:,1])) for v,lab,col in VAR];tgt=None
 if tid:tgt=a1d_target(tid,d,ser[0][2]) if tid!='G1' else None
 if tid=='G1':
  gp=next(x for x in A1D if x['id']=='G1');
  # G1 target in A1-D was a computed V-section on the same transect: recompute exactly as A1-D profiles.py did
  h0=ser[0][2];c=d[len(d)//2];bed=float(np.interp(c,d,h0));side=d-c;absd=np.abs(side)
  hill=np.interp(d,[d[0],c-75,c+75,d[-1]],[h0[0],np.interp(c-75,d,h0),np.interp(c+75,d,h0),h0[-1]]);tgt=np.where(absd<=5,bed,np.minimum(hill,bed+(absd-5)*np.tan(np.radians(np.where(side>0,30,40)))))
 svg=panel(title,d,ser,tgt);(IMG/f'section-{lid}.svg').write_text(svg)
 out[lid]={'title':title,'a':a.tolist(),'b':b.tolist(),'maxChangeM':{v:float(np.abs(s-ser[0][2]).max()) for (v,_,_),(_,_,s) in zip(VAR,ser)},'designTarget':tid}
(OUT/'sections.json').write_text(json.dumps(out,indent=1)+'\n')
# difference maps over the R1 hillshade + hillshade before/after, x -900..1000, z 2150..3300
x0,x1,z0,z1=-900.,1000.,2150.,3300.;Js=slice(int((4000-z1)/4),int((4000-z0)/4));Is=slice(int((x0+3000)/4),int((x1+3000)/4))
def shade(A):hs=hillshade(A.astype(float),290,30)*.75+hillshade(A.astype(float),135,45)*.25;g=np.clip(hs,0,1)*200+40;return np.stack([g,g*.98,g*.94],-1)
for v,lab,_ in VAR[1:]:
 dlt=(H[v]-R1)[Js,Is].astype(float);lim=40.;t=np.clip(dlt/lim,-1,1);w=1-np.abs(t);col=np.stack([np.where(t>0,1,w),w,np.where(t<0,1,w)],-1)*255
 base=shade(R1[Js,Is]);a_=np.where((dlt!=0)[...,None],.25*base+.75*col,base);Image.fromarray(a_.clip(0,255).astype(np.uint8)).resize(((Is.stop-Is.start)*2,(Js.stop-Js.start)*2),Image.LANCZOS).save(IMG/f'map-delta-{v}.png')
 Image.fromarray(shade(H[v][Js,Is]).astype(np.uint8)).resize(((Is.stop-Is.start)*2,(Js.stop-Js.start)*2),Image.LANCZOS).save(IMG/f'map-hillshade-{v}.png')
Image.fromarray(shade(R1[Js,Is]).astype(np.uint8)).resize(((Is.stop-Is.start)*2,(Js.stop-Js.start)*2),Image.LANCZOS).save(IMG/'map-hillshade-m0.png')
z=np.load(HERE/'.cache/v3.npz');M=z['M'];from grid import J,I
Ms=M[Js.start-J.start:Js.stop-J.start,Is.start-I.start:Is.stop-I.start];base=shade(R1[Js,Is]);g=np.stack([Ms*0+.2,Ms*.8+.1,Ms*.3+.1],-1)*255
img=np.where((Ms>0)[...,None],.45*base+.55*g,base*.55);Image.fromarray(img.clip(0,255).astype(np.uint8)).resize(((Is.stop-Is.start)*2,(Js.stop-Js.start)*2),Image.LANCZOS).save(IMG/'map-freedom-mask-v3.png')
print(json.dumps({k:{kk:round(vv,2) for kk,vv in v['maxChangeM'].items()} for k,v in out.items()}))
