"""Private visual cross-check of all library scenes against their real three frames."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,math
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'build/casestudy2-active-analysis';data=json.loads((ROOT/'assets/casestudy2/inventory.json').read_text())
items=[(f,s) for f in data['flows'].values() if f['project']!='active' for s in f['scenes']]
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
for page in range(math.ceil(len(items)/16)):
 sheet=Image.new('RGB',(1920,4*220),'#eee');draw=ImageDraw.Draw(sheet)
 for i,(flow,s) in enumerate(items[page*16:(page+1)*16]):
  x=i%4*480;y=i//4*220;draw.text((x+5,y+4),f"{flow['id']} / {s['id']} / {s['key']}",font=font,fill='#222')
  for frame in range(3):
   im=Image.open(ROOT/f"assets/casestudy2/{flow['project']}/stills/{flow['device']}-{s['id']}-{frame}.jpg");im.thumbnail((158,180));sheet.paste(im,(x+frame*160+(158-im.width)//2,y+30+(180-im.height)//2))
 sheet.save(OUT/f'library-sheet-{page+1}.jpg',quality=94)
print('92 library scenes / 276 actual frames')
