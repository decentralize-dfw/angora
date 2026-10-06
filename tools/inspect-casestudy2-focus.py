"""Private exact-source-frame sheets for curated comparison intervals."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, math, shutil, subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'build/casestudy2-active-analysis/focus'
OUT.mkdir(parents=True, exist_ok=True)
flows = json.loads((ROOT / 'assets/casestudy2/inventory.json').read_text())['flows']
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 17)
targets = {
    'likova-desktop': ['video-story', 'master-plan', 'architecture', 'lobby', 'offices', 'technology'],
    'likova-mobile': ['master-plan', 'lobby', 'offices'],
}
for flow_id, keys in targets.items():
    flow = flows[flow_id]
    for key in keys:
        scene = next(s for s in flow['scenes'] if s['key'] == key)
        times = [scene['sourceStart'] + i * .5 for i in range(math.ceil(scene['duration'] * 2))]
        folder = OUT / f'{flow_id}-{key}'
        folder.mkdir(exist_ok=True)
        frames = [round((t - flow['offset']) * 60) for t in times]
        selection = '+'.join(f'eq(n,{n})' for n in frames)
        w, h = (384, 210) if flow['device'] == 'desktop' else (160, 300)
        subprocess.run([shutil.which('ffmpeg'), '-hide_banner', '-loglevel', 'error', '-y', '-threads', '2', '-i', str(ROOT / flow['video']), '-vf', f"select='{selection}',scale={w}:{h}", '-fps_mode', 'vfr', '-q:v', '3', str(folder / '%03d.jpg')], check=True)
        cols = 5 if flow['device'] == 'desktop' else 8
        rows = math.ceil(len(times) / cols)
        sheet = Image.new('RGB', (cols * w, rows * (h + 26)), '#eee')
        draw = ImageDraw.Draw(sheet)
        for i, t in enumerate(times):
            x, y = i % cols * w, i // cols * (h + 26)
            sheet.paste(Image.open(folder / f'{i+1:03}.jpg'), (x, y + 26))
            draw.text((x + 5, y + 3), f'SOURCE {t:.2f}s', font=font, fill='#222')
        sheet.save(OUT / f'{flow_id}-{key}.jpg', quality=93)
        print(flow_id, key, flush=True)
