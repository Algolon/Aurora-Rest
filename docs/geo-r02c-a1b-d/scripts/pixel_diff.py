"""MEASURED on the committed A1a browser captures: share of pixels that changed between M0 and each variant, per view and
lighting mode (|delta| > 12 of 255 in any channel, after a 3 x 3 median to suppress JPEG ringing). Output: data/pixel_diff.json"""
from b_common import *
from PIL import Image,ImageFilter
CAP=ROOT/'docs/geo-r02c-a1a/captures';out={'method':__doc__.strip(),'views':{}}
def load(p):return np.asarray(Image.open(p).convert('RGB').filter(ImageFilter.MedianFilter(3)),dtype=np.int16)
for mode in ('clayB','clayA','standard'):
 for f in sorted((CAP/'m0'/mode).glob('*.jpg')):
  a=load(f);row=out['views'].setdefault(f.stem,{})
  for v in ('v1','v2','v3'):
   b=load(CAP/v/mode/f.name);d=np.abs(a-b).max(-1);row.setdefault(mode,{})[v]=r(100*np.mean(d>12),2)
for k,v in out['views'].items():print(f'{k:24s}',v.get('clayB'),v.get('standard',''))
dump('pixel_diff.json',out)
