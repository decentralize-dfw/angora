"""Gerçek fotoğraf | (önceki model) | model — kontrol görüntüleri yan yana.

    python -X utf8 tools/blender/09_yan_yana.py <REPO> <klasör> [--onceki <önceki render klasörü>]
                                                 [--adim "<adım adı>" --ilerleme <ilerleme klasörü>]

  <klasör>/yan_yana_XX.jpg : FOTO | MODEL             (--onceki yoksa)
                             FOTO | ÖNCE | SONRA      (--onceki varsa, aynı numaralı render_XX.png)
  --adim + --ilerleme: üçlüler <ilerleme>/<NN>_<adım>_foto_XX.jpg olarak da kopyalanır ve
  <ilerleme>/README.md'ye adım başlığı + görseller eklenir (GitHub'da sayfa olarak görünür).
"""
import glob, os, re, sys
from PIL import Image, ImageDraw, ImageFont

args = sys.argv[1:]
def opt(name):
    return args[args.index(name) + 1] if name in args else None
REPO, DIR = args[0], args[1]
PREV, STEP, PROG = opt('--onceki'), opt('--adim'), opt('--ilerleme')
try: FONT = ImageFont.truetype('arial.ttf', 22)
except OSError: FONT = ImageFont.load_default()

made = []
for path in sorted(glob.glob(os.path.join(DIR, 'render_*.png'))):
    n = int(re.search(r'render_(\d+)', path).group(1))
    render = Image.open(path).convert('RGB')
    photo = Image.open(next(p for ext in ['jpg','png','jpeg'] if os.path.exists(p:=os.path.join(REPO,'photogallery',f'angora_{n:02d}.{ext}')))).convert('RGB').resize(render.size)
    panels = [('FOTO', photo)]
    prev = os.path.join(PREV, f'render_{n:02d}.png') if PREV else None
    if prev and os.path.exists(prev):
        panels += [('ÖNCE', Image.open(prev).convert('RGB').resize(render.size)), ('SONRA', render)]
    else:
        panels += [('SONRA', render)]
    out = Image.new('RGB', (render.width * len(panels), render.height + 34), (0, 0, 0))
    d = ImageDraw.Draw(out)
    for i, (title, img) in enumerate(panels):
        out.paste(img, (i * render.width, 34))
        d.text((i * render.width + 12, 6), f'{title}  {n:02d}' + (f'  ·  {STEP}' if STEP and i == len(panels) - 1 else ''), fill=(255, 255, 255), font=FONT)
    name = f'yan_yana_{n:02d}.jpg'
    out.save(os.path.join(DIR, name), quality=86); made.append((n, name)); print('yan_yana', n, len(panels), 'panel')

if STEP and PROG:
    os.makedirs(PROG, exist_ok=True)
    existing = sorted(glob.glob(os.path.join(PROG, '[0-9][0-9]_*')))
    index = 1 + max([int(os.path.basename(p)[:2]) for p in existing] or [0])
    slug = re.sub(r'[^a-z0-9]+', '-', STEP.lower().translate(str.maketrans('çğıöşü', 'cgiosu'))).strip('-')[:40]
    lines = [f'\n## {index:02d} · {STEP}\n']
    for n, name in made:
        target = f'{index:02d}_{slug}_foto_{n:02d}.jpg'
        Image.open(os.path.join(DIR, name)).save(os.path.join(PROG, target), quality=82)
        lines.append(f'![{STEP} foto {n:02d}]({target})\n')
    readme = os.path.join(PROG, 'README.md')
    if not os.path.exists(readme):
        open(readme, 'w', encoding='utf-8').write('# Modelleme ilerlemesi\n\nHer adım: FOTO | ÖNCE | SONRA\n')
    open(readme, 'a', encoding='utf-8').writelines(lines)
    print('ilerleme', index, STEP, len(made), 'görsel ->', PROG)
