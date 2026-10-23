from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json,subprocess
root=Path('docs/pop-02a/evidence')
selected=['final-forest-landscape','final-forest-interior','forest-edge','forest-corridor','forest-close-birch','forest-close-grass','forest-close-rock','valley-landscape','valley-bank','home-landscape','home-shore','forest-landscape-proxies']
w,h,cols=480,370,3
sheet=Image.new('RGB',(w*cols,100+h*4),(20,41,38));d=ImageDraw.Draw(sheet)
try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',19);title=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',27)
except OSError:font=title=ImageFont.load_default()
d.text((20,14),'AURORA REST — POP-02A | Actual WebGL review',font=title,fill=(230,238,225));d.text((20,56),'Source assets, neutral terrain. Technical candidate; owner art review required.',font=font,fill=(185,205,184))
for i,name in enumerate(selected):
 im=Image.open(root/(name+'.png')).convert('RGB');im.thumbnail((w-12,h-42));x=(i%cols)*w+6;y=100+(i//cols)*h;sheet.paste(im,(x,y));d.text((x+4,y+h-35),name.replace('forest-','birchwood-'),font=font,fill=(224,230,212))
sheet.save(root/'contact-sheet.jpg',quality=92)
subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','4','-i',str(root/'walking/frame-%02d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','19','-movflags','+faststart',str(root/'walking-review.mp4')],check=True)
(root/'media.json').write_text(json.dumps({'contactSheet':'Derived montage of 12 unretouched full-resolution WebGL captures; originals retained.','walkingMovie':'Derived from 10 actual keyboard-driven WebGL sample frames at 4 fps replay, not a real-time FPS recording.','sourceFrames':10,'replayFps':4},indent=2)+'\n')
print('Created contact sheet and actual-frame walking replay')
