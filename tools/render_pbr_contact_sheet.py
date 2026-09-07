"""Create a labelled preview from the actual exported texture maps."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
materials={r['material']:r for r in json.loads((ROOT/'assets/pbr/manifest.json').read_text())['materials']}
names=['stucco','roof','stone_tile','wood_floor','chrome','water']
channels=['basecolor','normal','roughness','metallic','orm']
canvas=Image.new('RGB',(1080,1010),'#f4f2ed');draw=ImageDraw.Draw(canvas)
try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
except OSError:font=ImageFont.load_default(size=17)
draw.text((20,15),'Actual exported PBR maps — 6 of 77 materials',fill='#222222',font=font)
for col,channel in enumerate(channels):draw.text((180+col*176,52),channel,fill='#222222',font=font)
for row,name in enumerate(names):
    y=82+row*151
    draw.text((20,y+50),name,fill='#222222',font=font)
    for col,channel in enumerate(channels):
        image=Image.open(ROOT/materials[name]['maps'][channel]).convert('RGB')
        image=image.resize((136,128),Image.Resampling.NEAREST)
        x=180+col*176;canvas.paste(image,(x,y));draw.rectangle((x,y,x+136,y+128),outline='#aaaaaa',width=1)
canvas.save(ROOT/'build/reference/pbr-map-review.jpg',quality=88)
print('PBR_CONTACT_SHEET',len(names)*len(channels),'map samples')
