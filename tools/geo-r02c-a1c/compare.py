"""MEASURED on actual browser captures: matched sheets M0 | A1b-alpha | A1c S1 (same camera, sun and material, unretouched;
lower row = crop of the massif) and pixel change against M0. M0 and A1b-alpha frames are reused from the committed A1a / A1b
captures where they exist (the renderer reproduced A1a frames byte for byte, docs/geo-r02c-a1b-alpha/data/render-identity.json);
frames for the A1c cameras and the missing A1b-alpha oblique are captured on this branch.
Outputs: docs/geo-r02c-a1c/images/compare-*.jpg, docs/geo-r02c-a1c/data/pixel_diff.json"""
from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/geo-r02c-a1c'
A1A=ROOT/'docs/geo-r02c-a1a/captures';A1B=ROOT/'docs/geo-r02c-a1b-alpha/captures';A1C=OUT/'captures'
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans{}.ttf'
def F(s,b=False):
 try:return ImageFont.truetype(FONT.format('-Bold' if b else ''),s)
 except OSError:return ImageFont.load_default()
def frame(v,mode,view):
 cands={'a1a-m0':[A1C/'a1a-m0'/mode/f'{view}.jpg',A1B/'a1a-m0'/mode/f'{view}.jpg',A1A/'m0'/mode/f'{view}.jpg'],
  'a1b-alpha':[A1C/'a1b-alpha'/mode/f'{view}.jpg',A1B/'a1b-alpha'/mode/f'{view}.jpg'],'a1c-s1':[A1C/'a1c-s1'/mode/f'{view}.jpg']}[v]
 return next((p for p in cands if p.exists()),None)
def load(p):return np.asarray(Image.open(p).convert('RGB').filter(ImageFilter.MedianFilter(3)),dtype=np.int16)
NAMES={'a1a-birchwood':'Birchwood Forest (2.5 km)','a1a-valley-shoulder':'Central Valley shoulder (2.9 km)','a1a-tarn-overlook':'High Tarn overlook','a1c-tarn-east':'High Tarn east shore',
 'a1b-face-from-upper-route':'Alpine ascent, s = 2600 m','a1a-west-arm':'West arm (on the ascent)','a1a-oblique-se':'South-east elevated oblique','a1a-oblique-n':'Northern elevated oblique','a1c-west-coast':'Western windward coast (K3)'}
CROP={'a1a-birchwood':(520,170,1040,420),'a1a-valley-shoulder':(500,220,900,380),'a1a-tarn-overlook':(0,120,700,480),'a1c-tarn-east':(300,150,1000,480),'a1b-face-from-upper-route':(400,200,1280,700),
 'a1a-west-arm':(200,0,1100,400),'a1a-oblique-se':(200,220,1000,700),'a1a-oblique-n':(200,200,1080,700),'a1c-west-coast':(200,80,1100,520)}
px={};sheets=[]
for view in NAMES:
 for mode in ('clayA','clayB'):
  ps=[frame(k,mode,view) for k in ('a1a-m0','a1b-alpha','a1c-s1')]
  if not all(ps):continue
  a=load(ps[0]);px.setdefault(view,{})[mode]={k:round(100*float((np.abs(a-load(p)).max(-1)>12).mean()),2) for k,p in zip(('a1b-alpha','a1c-s1'),ps[1:])}
  PW=420;PH=262;GAP=10;box=CROP[view];ch=int(PW*(box[3]-box[1])/(box[2]-box[0]));im=Image.new('RGB',(3*PW+4*GAP,60+PH+24+ch+16),(250,248,243));d=ImageDraw.Draw(im)
  d.text((GAP,10),f'{NAMES[view]} · {mode}',fill=(20,20,20),font=F(16,True))
  q=px[view][mode];d.text((GAP,34),f"Actual Three.js captures, same camera and sun, unretouched. Pixels changed vs M0: A1b-α {q['a1b-alpha']} %, S1 {q['a1c-s1']} %",fill=(80,80,80),font=F(12))
  for n,(lab,p) in enumerate(zip(('M0 = R1','A1b-α (rejected)','A1c S1'),ps)):
   x=GAP+n*(PW+GAP);src=Image.open(p).convert('RGB');im.paste(src.resize((PW,PH),Image.LANCZOS),(x,60));im.paste(src.crop(box).resize((PW,ch),Image.LANCZOS),(x,60+PH+24))
   d.rectangle([x,60,x+8+int(d.textlength(lab,font=F(12,True))),80],fill=(20,20,20));d.text((x+4,63),lab,fill=(255,255,255),font=F(12,True))
   d.rectangle([x+box[0]/1280*PW,60+box[1]/800*PH,x+box[2]/1280*PW,60+box[3]/800*PH],outline=(234,88,12),width=1)
  d.text((GAP,60+PH+6),'crop of the orange box, enlarged',fill=(80,80,80),font=F(11));f=OUT/'images'/f'compare-{view}-{mode}.jpg';im.save(f,quality=88);sheets.append(f.name)
(OUT/'data/pixel_diff.json').write_text(json.dumps({'method':'pixels with |delta| > 12 of 255 in any channel after a 3 x 3 median','views':px},indent=1)+'\n')
print(len(sheets),'sheets');print(json.dumps(px,indent=0))
