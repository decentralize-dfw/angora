"""İlan fotoğrafları ile modelin aynı açıdan karşılaştırması - GPU'lu bilgisayarda.

    python -X utf8 tools/blender/05_foto_eslesme.py <REPO> <çıktı> [--lens 58] [--pismis] [--gorunur] [--site URL]

Gerekenler: `pip install playwright pillow`, bilgisayarda Google Chrome.

Her iç mekân fotoğrafı için (photogallery/angora_XX.jpg, 40 kare) site o
fotoğrafın çekildiği noktadan, aynı yöne bakarak açılır (viewer/src/photo-points.js
- ürün sahibinin FOTOLAR-KONUM çiziminden) ve iki kare yan yana konur:
  <çıktı>/foto_XX.jpg   sol: gerçek fotoğraf, sağ: model (aynı en-boy oranı)
  <çıktı>/rapor.json    her karenin odası, katı, lensi, süresi, GPU adı
--lens: modelin dikey görüş açısı (derece). Fotoğraflar geniş açı; 58 başlangıç.
--pismis: pişmiş ışık açık (?features=lightmaps:1).
"""
import json, os, sys, time
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

args = [a for a in sys.argv[1:] if not a.startswith('--')]
def opt(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default
REPO = os.path.abspath(args[0]); OUT = os.path.abspath(args[1] if len(args) > 1 else 'foto-eslesme')
SITE = opt('--site', 'https://angora.mergvs.com/')
LENS = float(opt('--lens', 58))
LIGHTMAPS = 1 if '--pismis' in sys.argv else 0
H = 720
os.makedirs(OUT, exist_ok=True)

def points():
    """photo-points.js'ten iç mekân kareleri (id, dosya, yer)."""
    import re
    src = open(os.path.join(REPO, 'viewer', 'src', 'photo-points.js'), encoding='utf-8').read()
    out = []
    for m in re.finditer(r"\{id:(\d+),file:'([^']+)',floor:(\d),outdoor:(true|false)[^}]*tr:'([^']*)'", src):
        if m.group(4) == 'false': out.append((int(m.group(1)), m.group(2), int(m.group(3)), m.group(5)))
    return out

def label(img, text):
    d = ImageDraw.Draw(img)
    try: font = ImageFont.truetype('arial.ttf', 22)
    except OSError: font = ImageFont.load_default()
    d.rectangle([0, 0, img.width, 36], fill=(0, 0, 0)); d.text((12, 6), text, fill=(255, 255, 255), font=font)
    return img

report, errors = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless='--gorunur' not in sys.argv,
                                args=['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'])
    for pid, file, floor, place in points():
        photo = Image.open(os.path.join(REPO, 'photogallery', file)).convert('RGB')
        W = round(H * photo.width / photo.height)
        page = browser.new_page(viewport={'width': W, 'height': H})
        page.on('pageerror', lambda e: errors.append(str(e)))
        t0 = time.time()
        page.goto(f'{SITE}?profile=desktop&stats=1&view=f{floor}&hour=13&features=lightmaps:{LIGHTMAPS}', wait_until='domcontentloaded')
        page.wait_for_function('() => document.querySelector("#viewport")?.dataset.qaReport', timeout=300000, polling=1000)
        page.evaluate('() => window.__angoraLightmaps ? window.__angoraLightmaps.ready : true')
        try:
            info = page.evaluate('([id, fov]) => window.__angoraQA.photoView(id, fov)', [pid, LENS])
        except Exception as e:
            errors.append(f'{file}: {e}'); page.close(); continue
        # arayüz panelleri karşılaştırmayı örtmesin
        page.add_style_tag(content='body > *:not(#app) {visibility:hidden !important} '
                                   '#app > *:not(#viewport) {visibility:hidden !important}')
        page.wait_for_timeout(2500)
        shot = os.path.join(OUT, f'_m{pid}.png'); page.screenshot(path=shot)
        gpu = page.evaluate('''() => { const gl = document.createElement('canvas').getContext('webgl2');
          const x = gl && gl.getExtension('WEBGL_debug_renderer_info'); return x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : null; }''')
        page.close()
        model = Image.open(shot).convert('RGB'); os.remove(shot)
        pair = Image.new('RGB', (W * 2, H))
        pair.paste(label(photo.resize((W, H)), f'FOTO {pid:02d}  {place}'), (0, 0))
        pair.paste(label(model, f'MODEL {pid:02d}  lens {LENS:g}°  pişmiş ışık {"açık" if LIGHTMAPS else "kapalı"}'), (W, 0))
        name = f'foto_{pid:02d}.jpg'; pair.save(os.path.join(OUT, name), quality=86)
        report.append({'kare': name, 'foto': file, 'yer': place, **info, 'lens': LENS, 'sure_sn': round(time.time() - t0, 1), 'gpu': gpu})
        print(name, place, info.get('room'), round(time.time() - t0, 1), 'sn |', gpu, flush=True)
    browser.close()
json.dump({'site': SITE, 'lens': LENS, 'pismis': LIGHTMAPS, 'hatalar': errors[:30], 'kareler': report},
          open(os.path.join(OUT, 'rapor.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('TAMAM', len(report), 'kare ->', OUT, '| hata:', len(errors))
