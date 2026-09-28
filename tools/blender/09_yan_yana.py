"""Gerçek fotoğraf | kontrol render'ı yan yana (08_kontrol_render.py çıktısı için).

    python -X utf8 tools/blender/09_yan_yana.py <REPO> <klasör>
    -> <klasör>/yan_yana_XX.jpg  (sol: FOTO, sağ: MODEL)
"""
import glob, os, re, sys
from PIL import Image, ImageDraw
REPO, DIR = sys.argv[1], sys.argv[2]
for path in sorted(glob.glob(os.path.join(DIR, 'render_*.png'))):
    n = int(re.search(r'render_(\d+)', path).group(1))
    render = Image.open(path).convert('RGB')
    photo = Image.open(os.path.join(REPO, 'photogallery', f'angora_{n:02d}.jpg')).convert('RGB').resize(render.size)
    out = Image.new('RGB', (render.width * 2, render.height))
    out.paste(photo, (0, 0)); out.paste(render, (render.width, 0))
    d = ImageDraw.Draw(out); d.rectangle([0, 0, out.width, 28], fill=(0, 0, 0))
    d.text((10, 7), f'FOTO {n:02d}', fill=(255, 255, 255)); d.text((render.width + 10, 7), f'MODEL {n:02d}', fill=(255, 255, 255))
    out.save(os.path.join(DIR, f'yan_yana_{n:02d}.jpg'), quality=88); print('yan_yana', n)
