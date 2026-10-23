from pathlib import Path
import json,math
import numpy as np
from PIL import Image,ImageDraw,ImageFont
root=Path('docs/env-p01');ev=root/'evidence';r=json.loads((ev/'runtime.json').read_text())
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
def sheet(name,views,title):
 im=Image.new('RGB',(1200,460*len(views)+50),'#15252a');d=ImageDraw.Draw(im);d.text((15,14),title,font=font,fill='white')
 for row,v in enumerate(views):
  for col,mode in enumerate(['neutral','faithful']):
   a=Image.open(ev/(v+'-'+mode+'.png')).convert('RGB');a.thumbnail((600,413));im.paste(a,(col*600,50+row*460));d.text((col*600+10,50+row*460+420),v+' / '+mode,font=font,fill='white')
 im.save(ev/name,quality=94)
sheet('walking-height-contact-sheet.jpg',['forest-interior','forest-edge','forest-corridor','forest-ecotone-outward'],'Birchwood / walking-height matched WebGL / neutral vs faithful MAT')
sheet('elevated-transition-comparison.jpg',['forest-landscape','valley-landscape'],'Elevated forest / meadow compatibility / neutral vs faithful MAT')
# Camera-projected diagnostic overlay on genuine renderer PNG. No scene or placement edits.
s=next(v for v in r['measurements'] if v['name']=='forest-overhead-faithful');pts=next(d['points'] for d in r['diagnostics'] if d['view']=='forest-landscape')
im=Image.open(ev/'forest-overhead-faithful.png').convert('RGB');d=ImageDraw.Draw(im);W,H=im.size
x,y,z,w=s['cameraQuaternion'];R=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
heights=np.fromfile('public/geo-r02b/terrain.f32',dtype='<f4').reshape(2001,1501)
def elev(x,z):
 gx=min(1499.999999,max(0,(x+3000)/4));gz=min(1999.999999,max(0,(4000-z)/4));i=int(gx);j=int(gz);u=gx-i;v=gz-j;a=heights[j,i];b=heights[j+1,i];c=heights[j,i+1]
 if u+v<=1:return a+(c-a)*u+(b-a)*v
 q=heights[j+1,i+1];return q+(b-q)*(1-u)+(c-q)*(1-v)
f=1/math.tan(math.radians(57)/2);counts={'treeOnMeadow':0,'grassOnBedrock':0,'shownTreeFlags':0,'shownGrassFlags':0};projected=[]
for p in pts:
 a=p['family'] in ['birch','pine'] and p['ground']['weights']['meadow-turf']>.5;b=p['family']=='grass' and p['ground']['weights']['bedrock']>.5
 if not(a or b):continue
 counts['treeOnMeadow' if a else 'grassOnBedrock']+=1
 v=R.T@(np.array([p['x'],elev(p['x'],p['z']),p['z']])-s['camera']);depth=-v[2]
 if depth<=0:continue
 px=(v[0]*f/(W/H)/depth+1)*W/2;py=(1-v[1]*f/depth)*H/2
 if not(0<=px<W and 70<=py<H):continue
 counts['shownTreeFlags' if a else 'shownGrassFlags']+=1
 if a:d.ellipse((px-5,py-5,px+5,py+5),outline='#ff6b64',width=2)
 else:d.line((px-4,py-4,px+4,py+4),fill='#ffe270',width=2);d.line((px-4,py+4,px+4,py-4),fill='#ffe270',width=2)
 projected.append({'id':p['id'],'pixel':[float(px),float(py)],'type':'treeOnMeadow' if a else 'grassOnBedrock'})
d.rectangle((0,0,W,65),fill='#15252a');d.text((15,10),'MAT / POP diagnostic overlay — camera-projected descriptor ground contacts',font=font,fill='white');d.text((15,36),'Red ring: tree on >50% meadow | yellow cross: grass on >50% bedrock | not placement edits',font=font,fill='white');im.save(ev/'ecological-overlay.png')
(root/'overlay-projection.json').write_text(json.dumps({'sourceCamera':s['camera'],'quaternion':s['cameraQuaternion'],'fov':57,'viewport':[W,H],'method':'Canonical triangle ground elevation projected by actual camera quaternion; all active descriptor flags, not necessarily visible source LODs. No occlusion test. Annotation banner suppresses top 70px.','counts':counts,'projected':projected},indent=2))
print('Addendum sheets and camera-projected overlay:',counts)
