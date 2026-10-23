"""EVIDENCE: matched A1a failure screenshots, cropped/arranged only (no retouching). Every panel is an actual committed A1a
Three.js browser capture (1280 x 800, SwiftShader) of the same camera, sun and material; numbers from data/pixel_diff.json.
Outputs: images/failure-v1.jpg, failure-v2.jpg, failure-v3.jpg"""
from b_common import *
from PIL import Image,ImageDraw,ImageFont
CAP=ROOT/'docs/geo-r02c-a1a/captures';pdiff=json.loads((DATA/'pixel_diff.json').read_text())['views']
F=lambda s,b=False:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if b else '')+'.ttf',s)
NAMES={'a1a-birchwood':'Birchwood (far approach, 2.5 km)','a1a-valley-shoulder':'Central Valley shoulder (2.9 km)','a1a-approach-upper':'Alpine route, upper approach',
 'a1a-tarn-shore':'High Tarn north shore','a1a-oblique-c1':'Aerial oblique over C1 (no player position)','a1a-c1-floor':'Inside C1, on its floor (no route reaches it)',
 'a1a-g1-downstream':'G1 downstream, High Tarn side','a1a-g1-upstream':'G1 upstream'}
def sheet(name,title,rows,var,crop=None):
 PW=620;PH=388;GAP=14;top=58;rowh=PH+44
 Hh=top+rowh*len(rows)+(PH+60 if crop else 0)+28;im=Image.new('RGB',(2*PW+3*GAP,Hh),(250,248,243));d=ImageDraw.Draw(im)
 d.text((GAP,12),title,fill=(20,20,20),font=F(19,True));d.text((GAP,36),'Actual committed A1a Three.js captures (feature/geo-r02c-a1a-form-study @ 80553e2), clay sun B, same camera per row. Unretouched.',fill=(80,80,80),font=F(12))
 y=top
 for view,mode in rows:
  a=Image.open(CAP/'m0'/mode/f'{view}.jpg').resize((PW,PH),Image.LANCZOS);b=Image.open(CAP/var/mode/f'{view}.jpg').resize((PW,PH),Image.LANCZOS)
  pct=pdiff[view][mode][var];d.text((GAP,y+8),f'{NAMES.get(view,view)} · {mode}',fill=(20,20,20),font=F(14,True))
  d.text((im.width-GAP,y+8),f'pixels changed M0 → {var.upper()}: {pct:.2f} %',fill=(185,28,28) if pct<0.1 else (20,20,20),font=F(14,True),anchor='ra')
  im.paste(a,(GAP,y+30));im.paste(b,(2*GAP+PW,y+30))
  for x_,t in ((GAP,'M0 = R1'),(2*GAP+PW,var.upper())):d.rectangle([x_,y+30,x_+70,y+52],fill=(20,20,20));d.text((x_+8,y+33),t,fill=(255,255,255),font=F(13,True))
  y+=rowh
 if crop:
  view,mode,box,label=crop;b=Image.open(CAP/var/mode/f'{view}.jpg').crop(box);a=Image.open(CAP/'m0'/mode/f'{view}.jpg').crop(box)
  s=min(PW/b.width,PH/b.height);sz=(int(b.width*s),int(b.height*s));d.text((GAP,y+8),label,fill=(20,20,20),font=F(14,True))
  im.paste(a.resize(sz,Image.LANCZOS),(GAP,y+30));im.paste(b.resize(sz,Image.LANCZOS),(2*GAP+PW,y+30))
  for x_,t in ((GAP,'M0 crop'),(2*GAP+PW,var.upper()+' crop')):d.rectangle([x_,y+30,x_+92,y+52],fill=(20,20,20));d.text((x_+8,y+33),t,fill=(255,255,255),font=F(13,True))
 im=im.crop((0,0,im.width,(y+30+sz[1]+16) if crop else y+10));im.save(IMG/f'{name}.jpg',quality=88);print(name,im.size)
sheet('failure-v1','V1 · ridge and flank sculpting is invisible from the approaches',[('a1a-birchwood','clayB'),('a1a-valley-shoulder','clayB'),('a1a-approach-upper','clayB'),('a1a-tarn-shore','clayB')],'v1')
sheet('failure-v2','V2 · C1 reads as a bowl stamped into a planar face',[('a1a-oblique-c1','clayB'),('a1a-c1-floor','clayB')],'v2')
sheet('failure-v3','V3 · G1 fill-only gully: mounds and a serrated wall',[('a1a-g1-downstream','clayB'),('a1a-g1-upstream','clayB')],'v3',
 crop=('a1a-g1-downstream','clayB',(0,90,620,340),'Detail, G1 downstream: the serrated wall where steep fill meets the rasterised frozen channel section'))
