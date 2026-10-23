"""MEASURED on actual browser captures: matched sheets B1.1 (protected baseline) | B2a, same camera, sun and material, unretouched;
lower row = enlarged crop of the region the view is about.
Outputs docs/geo-r02c-b2a/images/compare-<view>-<mode>.jpg"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];DOC=ROOT/'docs/geo-r02c-b2a';CAP=DOC/'captures'
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans{}.ttf'
def F(s,b=False):
 try:return ImageFont.truetype(FONT.format('-Bold' if b else ''),s)
 except OSError:return ImageFont.load_default()
NAMES={'a1a-birchwood':'Birchwood Forest (2.5 km)','a1a-valley-shoulder':'Central Valley shoulder (2.9 km)','a1a-tarn-overlook':'High Tarn overlook','a1c-tarn-east':'High Tarn east shore',
 'a1a-approach-mid':'Alpine approach (R1 route position, s = 1825 m)','a1a-approach-upper':'Alpine approach (R1 route position, s = 2425 m)','b01-route-fjell':'Vestfjell plateau · OFF-ROUTE viewpoint (132 m from the B1.1 route)','b01-route-b11':'B1.1 route position · upper Vestfjell (route-bound in B1.1 only)','b01-route-shoulder':'B1 route · start of the summit scramble',
 'a1a-oblique-se':'Elevated oblique · south-east','a1a-oblique-n':'Elevated oblique · north','b01-oblique-sw':'Elevated oblique · south-west','a1c-west-coast':'Western windward coast',
 'b2a-col-south':'Western Col / Vesttind from the south (D2)','b2a-seam-nw':'North-west arm terminal (D1 seams 1-2)','b2a-seam-north':'North coast terminal (D1 seam 4)','b2a-seam-gully':'Windward gully corridor transition (D1 seam 3)','b2a-outlet':'Hollow outlet close-up (D4)','b2a-switchbacks':'Primary approach switchbacks and benches (D3)',
 'b2a-route-upper':'Primary approach · upper switchbacks (route-bound walk camera)','b2a-route-viewpoint':'Primary approach · panoramic viewpoint, looking at Vesttind','b2a-route-scramble':'Optional summit scramble · north arête (route-bound)'}
CROP={'a1a-birchwood':(380,150,1060,420),'a1a-valley-shoulder':(380,200,960,400),'a1a-tarn-overlook':(0,120,760,480),'a1c-tarn-east':(260,150,1000,480),'a1a-approach-mid':(200,0,1100,480),
 'a1a-approach-upper':(200,0,1100,480),'b01-route-fjell':(200,0,1100,480),'b01-route-b11':(200,150,1100,630),'b01-route-shoulder':(200,0,1100,480),'a1a-oblique-se':(150,150,1100,760),'a1a-oblique-n':(150,150,1130,700),'b01-oblique-sw':(150,100,1130,700),'a1c-west-coast':(150,40,1100,480),
 'b2a-col-south':(200,100,1100,600),'b2a-seam-nw':(200,100,1100,600),'b2a-seam-north':(200,100,1100,600),'b2a-seam-gully':(200,100,1100,600),'b2a-outlet':(300,150,1000,600),'b2a-switchbacks':(200,100,1100,600),'b2a-route-upper':(200,150,1100,630),'b2a-route-viewpoint':(150,330,1050,800),'b2a-route-scramble':(500,250,1280,760)}
LAB=(('b01-b1','B1.1 (protected baseline)'),('b2a-a','B2a candidate'))
def main():
 (DOC/'images').mkdir(parents=True,exist_ok=True);made=[]
 for view in NAMES:
  for mode in ('clayA','clayB'):
   lab=[(v,l) for v,l in LAB if (CAP/v/mode/f'{view}.jpg').exists()];ps=[CAP/v/mode/f'{view}.jpg' for v,_ in lab]
   if len(lab)<2:continue  # both frames are required
   PW,PH,G=420,262,10;box=CROP[view];ch=int(PW*(box[3]-box[1])/(box[2]-box[0]));im=Image.new('RGB',(len(lab)*PW+(len(lab)+1)*G,52+PH+22+ch+12),(250,248,243));d=ImageDraw.Draw(im)
   d.text((G,10),f'{NAMES[view]} · {mode}',fill=(20,20,20),font=F(16,True));d.text((G,32),'Actual Three.js captures, identical camera position, sun and clay material, unretouched.',fill=(80,80,80),font=F(12))
   for n,((v,lab_),p) in enumerate(zip(lab,ps)):
    x=G+n*(PW+G);src=Image.open(p).convert('RGB');im.paste(src.resize((PW,PH),Image.LANCZOS),(x,52));im.paste(src.crop(box).resize((PW,ch),Image.LANCZOS),(x,52+PH+22))
    d.rectangle([x,52,x+8+int(d.textlength(lab_,font=F(12,True))),72],fill=(20,20,20));d.text((x+4,55),lab_,fill=(255,255,255),font=F(12,True))
    d.rectangle([x+box[0]/1280*PW,52+box[1]/800*PH,x+box[2]/1280*PW,52+box[3]/800*PH],outline=(234,88,12),width=1)
   d.text((G,52+PH+5),'crop of the orange box, enlarged',fill=(80,80,80),font=F(11));f=DOC/'images'/f'compare-{view}-{mode}.jpg';im.save(f,quality=88);made.append(f.name)
 print(len(made),'sheets')
if __name__=='__main__':main()
