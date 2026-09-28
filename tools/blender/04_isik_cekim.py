"""Pişmiş ışık kontrol çekimleri - GPU'lu bilgisayarda, canlı siteden.

    python tools/blender/04_isik_cekim.py <çıktı klasörü> [--gorunur] [--site URL]

Gerekenler: Python 3.9+, `pip install playwright pillow`, bilgisayarda Google
Chrome (Playwright'ın kendi tarayıcısı İNDİRİLMEZ, channel="chrome").

Her kamera ve saat için sitenin iki hâli çekilir - pişmiş ışık KAPALI
(?features=lightmaps:0) ve AÇIK (lightmaps:1) - ve yan yana tek JPEG'e
konur: <çıktı>/<kamera>_<saat>.jpg (sol: eski, sağ: pişmiş ışık).
<çıktı>/rapor.json: her karenin yüklenme süresi, GPU adı, pişmiş ışık durumu.

Kameralar sitenin kendi QA kameraları (viewer/src/qa-cameras.js):
  C03 villa önden   C04 havuz tarafı   C06 giriş katı kesit
  C10 salon (içeride)   C11 ebeveyn yatak odası   C12 bodrum mutfak
"""
import json, os, sys, time
sys.stdout.reconfigure(encoding='utf-8')  # Windows konsolu cp1252: ş, ı yazamıyor
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

args = [a for a in sys.argv[1:] if not a.startswith('--')]
OUT = os.path.abspath(args[0] if args else 'isik-kontrol')
SITE = sys.argv[sys.argv.index('--site') + 1] if '--site' in sys.argv else 'https://angora.mergvs.com/'
HEADED = '--gorunur' in sys.argv
SHOTS = [('C03', 13), ('C04', 17), ('C06', 13), ('C10', 13), ('C11', 9), ('C12', 13), ('C10', 21), ('C03', 21)]
W, H = 1280, 800
os.makedirs(OUT, exist_ok=True)

def shoot(page, camera, hour, lightmaps):
    url = f'{SITE}?profile=desktop&camera={camera}&hour={hour}&features=lightmaps:{lightmaps}'
    t0 = time.time()
    page.goto(url, wait_until='domcontentloaded')
    page.wait_for_function('() => document.querySelector("#viewport")?.dataset.qaReport', timeout=300000, polling=1000)
    page.evaluate('() => window.__angoraLightmaps ? window.__angoraLightmaps.ready : true')
    # site açılınca adresi sadeleştirir (?camera kaybolur) - kamerayı buradan ver
    page.evaluate('id => window.__angoraQA.applyCamera(id)', camera)
    page.wait_for_timeout(2500)
    png = os.path.join(OUT, f'_{camera}_{hour}_{lightmaps}.png')
    page.screenshot(path=png)
    info = page.evaluate('''() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
      return {gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null,
              lightmaps: window.__angoraLightmaps ? window.__angoraLightmaps.snapshot() : null};
    }''')
    return png, {'url': url, 'sure_sn': round(time.time() - t0, 1), **info}

def label(img, text):
    d = ImageDraw.Draw(img)
    try: font = ImageFont.truetype('arial.ttf', 26)
    except OSError: font = ImageFont.load_default()
    d.rectangle([0, 0, W, 44], fill=(0, 0, 0))
    d.text((14, 8), text, fill=(255, 255, 255), font=font)
    return img

report = []
with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=not HEADED,
                                args=['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'])
    page = browser.new_page(viewport={'width': W, 'height': H})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    for camera, hour in SHOTS:
        off, a = shoot(page, camera, hour, 0)
        on, b = shoot(page, camera, hour, 1)
        pair = Image.new('RGB', (W * 2, H))
        pair.paste(label(Image.open(off).convert('RGB'), f'{camera} {hour}:00  ESKİ'), (0, 0))
        pair.paste(label(Image.open(on).convert('RGB'), f'{camera} {hour}:00  PİŞMİŞ IŞIK'), (W, 0))
        name = f'{camera}_{hour:02d}.jpg'
        pair.save(os.path.join(OUT, name), quality=88)
        os.remove(off); os.remove(on)
        report.append({'kare': name, 'eski': a, 'pismis': b})
        print(name, 'eski', a['sure_sn'], 'sn | pişmiş', b['sure_sn'], 'sn |', b['gpu'], '|', b['lightmaps'], flush=True)
    browser.close()
json.dump({'site': SITE, 'hatalar': errors[:20], 'kareler': report}, open(os.path.join(OUT, 'rapor.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print('TAMAM', len(report), 'kare ->', OUT, '| sayfa hatası:', len(errors))
