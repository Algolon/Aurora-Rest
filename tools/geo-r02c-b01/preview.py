"""DESIGN PREVIEW ONLY (not a Three.js capture): fast numpy z-buffer splat render of a heightfield with clay-like Lambert
lighting, used to iterate the authored massif before the real browser captures. Also a plan hillshade with contours.
  python3 tools/geo-r02c-b01/preview.py OUT_DIR [--views birchwood,valley-shoulder,...]"""
from pathlib import Path
import argparse,json,sys
import numpy as np
from PIL import Image,ImageDraw
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]
NX,NZ,CELL=1501,2001,4.
VIEWS={'birchwood':(-700,300,'eye',(-520,2770)),'valley-shoulder':(-176,-156,'eye',(-520,2770)),'tarn-overlook':(700,1950,'eye',(-520,2770)),
 'tarn-east':(1430,1930,'eye',(-520,2770)),'west-coast':(-1520,2060,'eye',(-520,2770)),'oblique-se':(700,1650,1450,(-520,2770)),'oblique-n':(-250,4300,1300,(-520,2770)),
 'oblique-sw':(-1900,1300,1250,(-520,2770)),'approach':(-560,2250,'eye',(-520,2770))}
def sun(az,el):a,e=np.radians(az),np.radians(el);return np.array([np.sin(a)*np.cos(e),np.sin(e),np.cos(a)*np.cos(e)])
def surf(H,x,z):
 gx=np.clip((x+3000)/CELL,0,NX-1.001);gz=np.clip((4000-z)/CELL,0,NZ-1.001);i=gx.astype(int);j=gz.astype(int);u=gx-i;v=gz-j
 return H[j,i]*(1-u)*(1-v)+H[j,i+1]*u*(1-v)+H[j+1,i]*(1-u)*v+H[j+1,i+1]*u*v
def render(H,view,W=960,Hh=600,sunv=(290,18),box=(0,900,100,1350)):
 cx,cz,eye,(tx,tz)=VIEWS[view];cy=float(surf(H,np.array([cx]),np.array([cz]))[0])+1.75 if eye=='eye' else eye
 yaw=np.arctan2(tx-cx,tz-cz);tgt=float(surf(H,np.array([tx]),np.array([tz]))[0]);dist=np.hypot(tx-cx,tz-cz)
 pitch=np.arctan2(tgt-cy,dist)*(0.55 if eye=='eye' else 0.8)
 j0,j1,i0,i1=box;sub=H[j0:j1,i0:i1].astype(float);jj,ii=np.mgrid[j0:j1,i0:i1];X=ii*CELL-3000.;Z=4000.-jj*CELL
 gz_,gx_=np.gradient(sub,CELL);n=np.stack([-gx_,np.ones_like(sub),gz_],-1);n/=np.linalg.norm(n,axis=-1,keepdims=True)
 L=sun(*sunv);shade=np.clip(n@L,0,1)*.78+.3
 # camera basis
 f=np.array([np.sin(yaw)*np.cos(pitch),np.sin(pitch),np.cos(yaw)*np.cos(pitch)]);r=np.cross(f,[0,1,0]);r/=np.linalg.norm(r);u=np.cross(r,f)
 P=np.stack([X-cx,sub-cy,Z-cz],-1);d=P@f;xs=P@r;ys=P@u;ok=(d>5)&(sub>-1)
 fpx=(Hh/2)/np.tan(np.radians(30));px=W/2+xs[ok]/d[ok]*fpx;py=Hh/2-ys[ok]/d[ok]*fpx;dd=d[ok];sh=shade[ok];wet=sub[ok]<=0
 img=np.zeros((Hh,W,3));img[:]=[200,210,214];zb=np.full((Hh,W),np.inf)
 rad=np.clip(np.ceil(CELL*1.5*fpx/dd),1,9).astype(int);col=np.where(wet[:,None],np.array([30,60,70]),(np.array([196,186,166])*sh[:,None]))
 for rr in np.unique(rad):
  m=rad==rr;ox,oy=np.meshgrid(np.arange(-(rr//2),rr-(rr//2)),np.arange(-(rr//2),rr-(rr//2)))
  for a,b in zip(ox.ravel(),oy.ravel()):
   X_=(px[m]+a).astype(int);Y_=(py[m]+b).astype(int);D=dd[m];C=col[m];k=(X_>=0)&(X_<W)&(Y_>=0)&(Y_<Hh)
   X_,Y_,D,C=X_[k],Y_[k],D[k],C[k];o=np.argsort(-D);X_,Y_,D,C=X_[o],Y_[o],D[o],C[o]
   cur=zb[Y_,X_];w=D<cur;zb[Y_[w],X_[w]]=D[w];img[Y_[w],X_[w]]=C[w]
 return Image.fromarray(img.clip(0,255).astype(np.uint8))
def plan(H,box=(40,640,280,940),contour=50):
 j0,j1,i0,i1=box;sub=H[j0:j1,i0:i1].astype(float);gz_,gx_=np.gradient(sub,CELL);n=np.stack([-gx_,np.ones_like(sub),gz_],-1);n/=np.linalg.norm(n,axis=-1,keepdims=True)
 hs=np.clip(n@sun(315,40),0,1)*.75+.25;c=np.clip(sub/900,0,1);rgb=np.stack([.55+.45*c,.6+.3*c,.45+.4*c],-1)*hs[...,None]*255;rgb[sub<=0]=[40,70,90]
 lev=np.floor(sub/contour);e=(lev!=np.roll(lev,1,0))|(lev!=np.roll(lev,1,1));rgb[e&(sub>0)]*=.55
 lev=np.floor(sub/250);e=(lev!=np.roll(lev,1,0))|(lev!=np.roll(lev,1,1));rgb[e&(sub>0)]=[90,40,30]
 return Image.fromarray(rgb.clip(0,255).astype(np.uint8))
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('out');a.add_argument('--views',default='birchwood,valley-shoulder,oblique-se,oblique-n');a.add_argument('--sun',default='290,18');args=a.parse_args()
 out=Path(args.out);out.mkdir(parents=True,exist_ok=True);R1=np.fromfile(ROOT/'public/geo-r02b/terrain.f32','<f4').reshape(NZ,NX)
 z=np.load(HERE/'.cache/b1.npz');B1=z['H'];sv=tuple(float(v) for v in args.sun.split(','))
 both=lambda a,b:(lambda im:(im.paste(a,(0,0)),im.paste(b,(a.width,0)),im)[2])(Image.new('RGB',(a.width*2,a.height)))
 both(plan(R1),plan(B1)).save(out/'plan.png')
 for v in args.views.split(','):both(render(R1,v,sunv=sv),render(B1,v,sunv=sv)).save(out/f'{v}.png')
 print('ok')
