"""Compact inspection index. Individual twelve-frame sheets remain available."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'build/casestudy2-grading-2026-10-05'
inventory = json.loads((ROOT/'assets/casestudy2/inventory.json').read_text(encoding='utf-8'))
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 17)
for device in ['desktop', 'mobile']:
    flow = inventory['flows']['active-'+device]
    for first in range(0, len(flow['scenes']), 6):
        scenes = flow['scenes'][first:first+6]
        w,h = (384,211) if device == 'desktop' else (213,318)
        board = Image.new('RGB', (w*4, (h+48)*len(scenes)), '#141718')
        draw = ImageDraw.Draw(board)
        for row,scene in enumerate(scenes):
            sheet = Image.open(OUT/f'{device}-{scene["id"]:02d}.jpg')
            sw,sh = (480,263) if device == 'desktop' else (213,318)
            # Original sheet: 42px title; 4 columns, 3 rows; 27px frame header.
            draw.text((8,row*(h+48)), f'{scene["id"]:02d} {scene["key"]} / {scene["sourceStart"]:.2f}-{scene["sourceEnd"]:.2f}s', fill='white', font=font)
            for col,i in enumerate([0,3,7,11]):
                x=(i%4)*sw; y=42+(i//4)*(sh+27)
                tile=sheet.crop((x,y,x+sw,y+sh+27)).resize((w,h+24))
                board.paste(tile,(col*w,row*(h+48)+24))
        board.save(OUT/f'board-{device}-{first+1:02d}.jpg',quality=92)
