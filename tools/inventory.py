"""Inventory original sources and produce photo contact sheets for review."""
import hashlib, json
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'build' / 'reference'
OUT.mkdir(parents=True, exist_ok=True)
records = []
for p in sorted(ROOT.rglob('*')):
    if p.suffix.lower() not in {'.dwg', '.jpeg', '.jpg'} or 'build' in p.parts:
        continue
    records.append({'path': p.relative_to(ROOT).as_posix(), 'bytes': p.stat().st_size,
                    'sha256': hashlib.sha256(p.read_bytes()).hexdigest()})
photos = [r for r in records if not r['path'].endswith('.dwg')]
groups = sorted(set(str(Path(r['path']).parent) for r in photos))
for group in groups:
    selected = [r for r in photos if str(Path(r['path']).parent) == group]
    for page in range((len(selected)+15)//16):
        rows = selected[page*16:(page+1)*16]
        sheet = Image.new('RGB', (1280, ((len(rows)+3)//4)*262 + 50), '#eeeae2')
        draw = ImageDraw.Draw(sheet)
        draw.text((16,15), f'{group} | page {page+1}', fill='#181818')
        for i,r in enumerate(rows):
            im = ImageOps.contain(Image.open(ROOT/r['path']).convert('RGB'), (310,225))
            x=(i%4)*320; y=50+(i//4)*262
            sheet.paste(im,(x+(320-im.width)//2,y))
            label=f'{page*16+i+1:02d} '+Path(r['path']).name.replace('WhatsApp Image 2026-08-','').replace('.jpeg','')
            draw.text((x+5,y+231),label[:48],fill='#181818')
            r['contact_sheet']=f'{group.replace(".","exterior")}_{page+1}.jpg'
            r['contact_index']=page*16+i+1
        sheet.save(OUT/f'{group.replace(".","exterior")}_{page+1}.jpg',quality=88)
(OUT/'source-inventory.json').write_text(json.dumps({'files':records,'photos':len(photos),'unique_photos':len(set(r['sha256'] for r in photos))},ensure_ascii=False,indent=2))
print(json.dumps({'photos':len(photos),'groups':groups,'output':str(OUT)},ensure_ascii=False))

