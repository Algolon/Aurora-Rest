from b_common import *
from project import project,capture
from PIL import Image,ImageDraw
cams=json.loads((ROOT/'tools/geo-r02c-a1a/cameras.json').read_text())['cameras']
for view in ('a1a-birchwood','a1a-valley-shoulder','a1a-tarn-shore','a1a-oblique-c1'):
 cap=dict(capture('m0','clayB',view));cam=next(c for c in cams if c['id']==view)
 if cam['kind']=='aerial':cap['aerial']=cam['aerial'];cap['camera']=[-cam['aerial']['pos'][0],cam['aerial']['pos'][1],cam['aerial']['pos'][2]]
 ox,oz=-cap['camera'][0],cap['camera'][2]
 im=Image.open(ROOT/'docs/geo-r02c-a1a/captures'/cap['file']).convert('RGB');d=ImageDraw.Draw(im)
 # skyline: max elevation angle per azimuth across the frame, measured on R1
 R=r1();oy=cap['camera'][1];pts=[]
 for a in np.linspace(-50,50,400):
  yaw=cap['yaw'];t=yaw+np.radians(a);ds=np.r_[np.arange(8,1500,4.),np.arange(1500,7000,8.)];xs=ox+np.sin(t)*ds;zs=oz+np.cos(t)*ds
  ok=(np.abs(xs)<2998)&(np.abs(zs)<3998);h=surface(R,xs[ok],zs[ok]);k=int(np.argmax((h-oy)/ds[ok]));pts.append((xs[ok][k],h[k],zs[ok][k]))
 px,py,_=project(cap,np.array(pts));q=[(a,b) for a,b in zip(px,py) if np.isfinite(a) and -50<a<1330]
 d.line(q,fill=(255,0,255),width=2);im.save(EVID/f'projcheck-{view}.jpg',quality=85);print(view,cap['camera'],cap['yaw'],cap['pitch'])
