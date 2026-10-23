"""MEASURED on actual browser captures: pixel change M0 -> A1a-V1 and M0 -> A1b-alpha per view and lighting mode, and matched
comparison sheets (M0 | A1a-V1 | A1b-alpha, same camera, sun and material, unretouched; the lower row is a 2x crop of the face).
M0 and V1 frames for the 16 A1a cameras are the committed A1a captures (the renderer reproduced them byte for byte here: see
docs/geo-r02c-a1b-alpha/data/render-identity.json); everything else is captured on this branch.
Outputs: docs/geo-r02c-a1b-alpha/data/pixel_diff.json, docs/geo-r02c-a1b-alpha/images/compare-*.jpg"""
from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter
ROOT=Path(__file__).resolve().parents[2];A1A=ROOT/'docs/geo-r02c-a1a/captures';A1B=ROOT/'docs/geo-r02c-a1b-alpha/captures';OUT=ROOT/'docs/geo-r02c-a1b-alpha'
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans{}.ttf'
def F(s,b=False):
 try:return ImageFont.truetype(FONT.format('-Bold' if b else ''),s)
 except OSError:return ImageFont.load_default()
def frame(variant,mode,view):
 if variant=='a1b-alpha' or view.startswith('a1b-'):return A1B/variant/mode/f'{view}.jpg'
 return A1A/{'a1a-m0':'m0','a1a-v1':'v1'}[variant]/mode/f'{view}.jpg'
def load(p):return np.asarray(Image.open(p).convert('RGB').filter(ImageFilter.MedianFilter(3)),dtype=np.int16)
views=sorted({p.stem for p in (A1B/'a1b-alpha').glob('*/*.jpg')});modes=['clayA','clayB','standard'];out={'method':'pixels with |delta| > 12 of 255 in any channel after a 3 x 3 median (as in the A1b-D dossier)','views':{}}
for v in views:
 for m in modes:
  pa=frame('a1b-alpha',m,v)
  if not pa.exists() or not frame('a1a-m0',m,v).exists():continue
  a=load(frame('a1a-m0',m,v));row=out['views'].setdefault(v,{})
  for key in ('a1a-v1','a1b-alpha'):
   p=frame(key,m,v)
   if p.exists():row.setdefault(m,{})[key]=round(100*float((np.abs(a-load(p)).max(-1)>12).mean()),2)
(OUT/'data/pixel_diff.json').write_text(json.dumps(out,indent=1)+'\n')
# crop boxes (x0, y0, x1, y1 in the 1280 x 800 frame) around the A2 south-west face, chosen per camera
CROP={'a1a-birchwood':(560,180,1000,400),'a1a-valley-shoulder':(520,230,880,360),'a1a-approach-upper':(640,40,1280,360),'a1a-approach-mid':(500,60,1100,360),
 'a1a-oblique-se':(260,240,900,620),'a1b-face-from-upper-route':(560,300,1280,700),'a1b-face-from-route':(300,180,900,480),'a1a-tarn-overlook':(0,180,640,500),'a1a-tarn-shore':(0,200,640,520)}
NAMES={'a1a-birchwood':'Birchwood Forest (far approach, 2.5 km)','a1a-valley-shoulder':'Central Valley shoulder (2.9 km)','a1a-approach-upper':'Alpine route, upper approach',
 'a1a-approach-mid':'Alpine route, mid approach','a1a-oblique-se':'Elevated oblique from the south-east','a1b-face-from-upper-route':'A1b · peak-ascent trail s = 2600 m, looking across the face',
 'a1b-face-from-route':'A1b · peak-ascent trail s = 900 m, below the face','a1a-tarn-overlook':'High Tarn overlook','a1a-tarn-shore':'High Tarn north shore'}
def sheet(view,mode):
 keys=['a1a-m0','a1a-v1','a1b-alpha'];paths=[frame(k,mode,view) for k in keys]
 if not all(p.exists() for p in paths):return None
 PW=420;PH=262;GAP=10;box=CROP.get(view,(320,200,960,600));cw=PW;ch=int(PW*(box[3]-box[1])/(box[2]-box[0]))
 im=Image.new('RGB',(3*PW+4*GAP,60+PH+24+ch+40),(250,248,243));d=ImageDraw.Draw(im)
 d.text((GAP,10),f'{NAMES.get(view,view)} · {mode}',fill=(20,20,20),font=F(16,True))
 pd=out['views'].get(view,{}).get(mode,{});d.text((GAP,34),f"Actual Three.js captures, same camera and sun, unretouched. Pixels changed vs M0: A1a-V1 {pd.get('a1a-v1','–')} %, A1b-α {pd.get('a1b-alpha','–')} %",fill=(80,80,80),font=F(12))
 for k,(key,p) in enumerate(zip(keys,paths)):
  x=GAP+k*(PW+GAP);src=Image.open(p).convert('RGB');im.paste(src.resize((PW,PH),Image.LANCZOS),(x,60));im.paste(src.crop(box).resize((cw,ch),Image.LANCZOS),(x,60+PH+24))
  lab={'a1a-m0':'M0 = R1','a1a-v1':'A1a-V1 (rejected)','a1b-alpha':'A1b-α'}[key];d.rectangle([x,60,x+8+int(d.textlength(lab,font=F(12,True))),80],fill=(20,20,20));d.text((x+4,63),lab,fill=(255,255,255),font=F(12,True))
  d.rectangle([x+(box[0]/1280)*PW,60+(box[1]/800)*PH,x+(box[2]/1280)*PW,60+(box[3]/800)*PH],outline=(234,88,12),width=1)
 d.text((GAP,60+PH+6),'crop of the orange box, enlarged',fill=(80,80,80),font=F(11))
 f=OUT/'images'/f'compare-{view}-{mode}.jpg';im.save(f,quality=88);return f.name
made=[n for v in CROP for m in ('clayA','clayB') for n in [sheet(v,m)] if n]
print(json.dumps({k:v.get('clayB') for k,v in out['views'].items()},indent=0));print(len(made),'sheets')
