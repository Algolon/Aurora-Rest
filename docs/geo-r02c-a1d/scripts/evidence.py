"""Reference frames for the A1-D dossier: downscaled JPG copies of existing P0 captures (R1 as committed; nothing re-rendered)."""
from a1d_common import *
from PIL import Image
CAP=ROOT/'docs/geo-r02c-p0/captures'
EV={'ev-oblique-clayA':'clayA/island-oblique.png','ev-valley-shoulder-clayB':'clayB/np-from-valley-shoulder.png','ev-birchwood-clayA':'clayA/np-from-birchwood.png',
 'ev-cairn-col-clayA':'clayA/np-from-cairn-col.png','ev-high-tarn-clayA':'clayA/high-tarn.png','ev-tarn-overlook-std':'standard/np-from-tarn-overlook.png'}
(IMG/'evidence').mkdir(exist_ok=True);out={}
for k,src in EV.items():
 im=Image.open(CAP/src).convert('RGB');im.thumbnail((1200,900),Image.LANCZOS);im.save(IMG/'evidence'/f'{k}.jpg',quality=82);out[k]={'source':'docs/geo-r02c-p0/captures/'+src,'size':list(im.size)}
write_json('evidence-sources.json',out);print(out)
