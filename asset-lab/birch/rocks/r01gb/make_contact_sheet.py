"""Create small, durable GitHub-friendly genuine WebGL contact sheet from real captures.
NO image generation and no image alteration except downscale/crop/labels.
"""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
src=Path("r01gb-evidence");out=Path("rocks/r01gb");out.mkdir(parents=True,exist_ok=True)
metrics=json.loads((src/"metrics.json").read_text())
data=metrics["source"]["candidates"]
indices=[i for i in range(min(len(data),9)) if (src/f"candidate-{i:02d}-clay.png").exists()]
if not indices:raise RuntimeError("No verified screenshots")
width=1600;cellw=width//3;cellh=365
sheet=Image.new("RGB",(width,115+cellh*((len(indices)+2)//3)),(239,241,238))
draw=ImageDraw.Draw(sheet)
draw.text((24,20),"AURORA REST  /  ROCK-R01G-B  /  REAL THREE.JS WEBGL",(25,43,37),stroke_width=0)
draw.text((24,66),"Natural source geometry – NOT Corestone A; art approval pending",(70,82,76))
for n,i in enumerate(indices):
 p=src/f"candidate-{i:02d}-clay.png"
 with Image.open(p) as im:
  im=im.convert("RGB")
  # crop left-side UI and bottom status: retains rock and ground without changing actual render geometry
  im=im.crop((320,65,1335,765))
  im.thumbnail((cellw-18,cellh-73))
  x=(n%3)*cellw+9;y=112+(n//3)*cellh
  sheet.paste(im,(x+(cellw-18-im.width)//2,y))
 name=data[i]["name"]
 draw.text((x+12,y+cellh-56),f"#{i} {name[:41]}",(38,62,53))
 draw.text((x+12,y+cellh-32),f"{data[i]['triangles']:,} source triangles",(95,112,102))
output=out/"R01GB-GENUINE-WEBGL-CONTACT-SHEET.jpg"
sheet.save(output,"JPEG",quality=83,optimize=True)
print("GENUINE REVIEW PREVIEW",output,output.stat().st_size)
