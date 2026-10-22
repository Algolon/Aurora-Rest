"""Small SVG helpers for A1-D section drawings. Grey = measured R1; dashed orange = design target; strips = measured drainage."""
import numpy as np
GREY='#8a8f98';ORANGE='#c2410c';ANN='#9a3412';TARN='#2f6fb0';SEA='#475569';OTHER='#a8a29e'
def panel(title,d,series,notes=(),left='',right='',strip=None,w=900,ylab='m',extra=(),ph_range=(150,520)):
 """series: list of (values, kind) with kind in {'r1','target','ref'}; notes: (distance, text[, height]);
 strip: per-sample codes (1 tarn, 2 sea, other) drawn as a drainage band under the plot."""
 d=np.asarray(d,float);allv=np.concatenate([np.asarray(v,float) for v,_ in series]+[np.array([n[2] for n in notes if len(n)>2],float)])
 lo=np.nanmin(allv)-10;hi=np.nanmax(allv)+30;pad=46;bot=40 if strip is not None else 28;pw=w-pad-12
 ph=float(np.clip(pw*(hi-lo)/(d.max()-d.min()),*ph_range))  # true scale (1:1) unless the panel would be too flat or too tall
 if ph>pw*(hi-lo)/(d.max()-d.min())+1:lo=hi-ph*(d.max()-d.min())/pw  # extend the height range rather than exaggerate
 ht=int(ph+bot+68);ex=(d.max()-d.min())/pw/((hi-lo)/ph)
 X=lambda v:pad+(v-d.min())/(d.max()-d.min())*pw;Y=lambda v:ht-bot-(v-lo)/(hi-lo)*ph
 s=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {ht}" font-family="system-ui,sans-serif" font-size="11">',
    f'<rect class="bg" width="{w}" height="{ht}" fill="#fffdf9"/>',f'<text x="{pad}" y="16" font-size="13" font-weight="700" fill="currentColor">{title}</text>']
 for k in range(5):
  v=lo+(hi-lo)*k/4;s.append(f'<line x1="{pad}" x2="{w-12}" y1="{Y(v):.1f}" y2="{Y(v):.1f}" stroke="currentColor" opacity=".12"/><text x="4" y="{Y(v)+4:.1f}" fill="currentColor" opacity=".7">{v:.0f} {ylab}</text>')
 sty={'r1':f'stroke="{GREY}" stroke-width="2.2"','target':f'stroke="{ORANGE}" stroke-width="2.4" stroke-dasharray="7 4"','ref':f'stroke="{TARN}" stroke-width="1.6" stroke-dasharray="2 3"'}
 for v,kind in series:
  v=np.asarray(v,float);ok=np.isfinite(v)
  s.append(f'<polyline points="{" ".join(f"{X(a):.1f},{Y(b):.1f}" for a,b in zip(d[ok],v[ok]))}" fill="none" {sty[kind]}/>')
 for e in extra:s.append(e(X,Y))
 top=np.nanmax(np.vstack([np.asarray(v,float) for v,_ in series]),axis=0)
 for k,n in enumerate(notes):
  dd,txt=n[0],n[1];yy=n[2] if len(n)>2 else np.interp(dd,d,np.nan_to_num(top,nan=lo));o=18+(k%2)*15
  anchor=' text-anchor="end"' if X(dd)>w-170 else ''
  s.append(f'<line x1="{X(dd):.1f}" x2="{X(dd):.1f}" y1="{Y(yy)-3:.1f}" y2="{Y(yy)-o:.1f}" stroke="{ORANGE}" opacity=".7"/><text x="{X(dd)+(-3 if anchor else 3):.1f}" y="{Y(yy)-o-3:.1f}" fill="{ANN}"{anchor}>{txt}</text>')
 if strip is not None:
  yb=ht-bot+6
  for k in range(len(d)-1):
   c={1:TARN,2:SEA}.get(int(strip[k]),OTHER);s.append(f'<rect x="{X(d[k]):.1f}" y="{yb}" width="{X(d[k+1])-X(d[k])+.6:.1f}" height="7" fill="{c}"/>')
  s.append(f'<text x="{w-12}" y="{yb-2}" text-anchor="end" font-size="10" fill="currentColor" opacity=".7">R1 drainage: <tspan fill="{TARN}">■ High Tarn</tspan> <tspan fill="{SEA}">■ sea</tspan> <tspan fill="{OTHER}">■ other catchment</tspan></text>')
 s.append(f'<text x="{pad}" y="{ht-8}" fill="currentColor" opacity=".7">{left}</text><text x="{w-12}" y="{ht-8}" text-anchor="end" fill="currentColor" opacity=".7">{right}</text>')
 s.append(f'<text x="{w/2:.0f}" y="{ht-8}" text-anchor="middle" fill="currentColor" opacity=".7">{d.max()-d.min():.0f} m section · '+('true scale, no vertical exaggeration' if abs(ex-1)<.03 else f'vertical exaggeration ×{ex:.2f}')+'</text></svg>')
 return '\n'.join(s)
