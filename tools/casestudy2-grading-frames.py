"""Twelve exact source frames per active cut for individual visual grading.

These are evidence sheets, not reconstructed animations or calculated ratings.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, math, shutil, subprocess, concurrent.futures

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'build/casestudy2-grading-2026-10-05'
OUT.mkdir(parents=True, exist_ok=True)
flows = json.loads((ROOT / 'assets/casestudy2/inventory.json').read_text(encoding='utf-8'))['flows']
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 19)

def tree(numbers):
    if len(numbers) == 1:
        return f'eq(n,{numbers[0]})'
    mid = len(numbers) // 2
    return f'({tree(numbers[:mid])})+({tree(numbers[mid:])})'

def inspect(flow):
    folder = OUT / flow['device']
    folder.mkdir(exist_ok=True)
    jobs = {}
    for scene in flow['scenes']:
        start = math.ceil(scene['start'] * 60 - 1e-6)
        end = math.ceil(scene['end'] * 60 - 1e-6) - 1
        jobs[scene['id']] = [round(start + (end-start) * i / 11) for i in range(12)]
    numbers = sorted({n for frames in jobs.values() for n in frames})
    w,h = (480,263) if flow['device'] == 'desktop' else (213,318)
    subprocess.run([shutil.which('ffmpeg'),'-hide_banner','-loglevel','error','-y','-threads','2','-i',str(ROOT / flow['video']),'-vf',f"select='{tree(numbers)}',scale={w}:{h}:flags=lanczos",'-fps_mode','vfr','-q:v','2',str(folder/'%04d.jpg')],check=True)
    files = sorted(folder.glob('[0-9][0-9][0-9][0-9].jpg'))
    if len(files) != len(numbers):
        raise RuntimeError((flow['id'],len(files),len(numbers)))
    frames = dict(zip(numbers,files))
    log = {}
    for scene in flow['scenes']:
        sheet = Image.new('RGB',(w*4,(h+27)*3+42),'#eeece5')
        draw = ImageDraw.Draw(sheet)
        draw.text((8,10),f"{flow['id']} / {scene['id']:02} / {scene['key']}",font=font,fill='#24362f')
        times = []
        for i,n in enumerate(jobs[scene['id']]):
            x,y = i%4*w,42+i//4*(h+27)
            time = n/60 + flow['offset'];times.append(time)
            draw.text((x+6,y+3),f'{time:.3f}s / frame {n}',font=font,fill='#24362f')
            sheet.paste(Image.open(frames[n]),(x,y+27))
        sheet.save(OUT/f"{flow['device']}-{scene['id']:02}.jpg",quality=94)
        log[scene['key']] = times
    (OUT/f"{flow['device']}-frames.json").write_text(json.dumps(log,indent=2),encoding='utf-8')
    print(flow['id'],len(jobs),'individual evidence sheets',flush=True)

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    list(pool.map(inspect,[f for f in flows.values() if f['project']=='active']))
