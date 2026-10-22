"""Base layers for the A1-D design maps: the approved A-R1 reference map cropped/scaled to the design extent, and an R1 clay
hillshade of the same extent (sun from 290 deg / 30 deg blended with 135 / 45, as in the P0 clay presets). Read-only inputs."""
from a1d_common import *
from PIL import Image
im=Image.open(ROOT/'docs/geo-r02b/reference-a-r1.png').convert('RGB')
l,t=ar1_px(X0,Z1);r_,b=ar1_px(X1,Z0);im.crop((int(l),int(t),int(r_),int(b))).resize((W*2,H*2),Image.LANCZOS).save(IMG/'base-ar1.jpg',quality=88)
Hh=terrain();j0=int((4000-Z1)/4);j1=int((4000-Z0)/4);i0=int((X0+3000)/4);i1=int((X1+3000)/4);sub=Hh[j0:j1,i0:i1]
hs=hillshade(sub,290,30)*.75+hillshade(sub,135,45)*.25;g=np.clip(hs,0,1)*200+40
rgb=np.stack([g,g*.98,g*.94],-1).astype(np.uint8);rgb[sub<=0]=[38,74,86]
Image.fromarray(rgb).resize((W*2,H*2),Image.LANCZOS).save(IMG/'base-r1-hillshade.jpg',quality=88);print('bases',W*2,H*2)
