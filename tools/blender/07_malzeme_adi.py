"""Fotoğraftaki bir noktanın modeldeki MALZEME ADI (yerel siteden, GPU'lu bilgisayarda).

    python -X utf8 tools/blender/07_malzeme_adi.py <site> <foto>:<u>,<v> [<foto>:<u>,<v> ...]
    örnek: python -X utf8 tools/blender/07_malzeme_adi.py http://127.0.0.1:8911/ 21:0.30,0.60 21:0.50,0.85 4:0.55,0.80

u, v: 0..1, sol üstten (fotoğraf-model çiftinde MODEL yarısındaki konum). Her nokta
için malzeme adı yazılır; ayrıca her fotoğrafta en çok görünen 12 malzeme listelenir.
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

site = sys.argv[1]
asks = {}
for a in sys.argv[2:]:
    foto, uv = a.split(':'); u, v = (float(x) for x in uv.split(','))
    asks.setdefault(int(foto), []).append((u, v))
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True, args=['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'])
    page = b.new_page(viewport={'width': 960, 'height': 720})
    page.goto(f'{site}?profile=desktop&stats=1&view=f1&hour=13', wait_until='domcontentloaded')
    page.wait_for_function('() => document.querySelector("#viewport")?.dataset.qaReport', timeout=600000, polling=1000)
    grid = [((i + .5) / 24, (j + .5) / 18) for j in range(18) for i in range(24)]
    for foto, points in asks.items():
        page.evaluate('([id, fov]) => window.__angoraQA.photoView(id, fov)', [foto, 72])
        page.wait_for_timeout(1500)
        hits = page.evaluate('pts => window.__angoraQA.pickMaterials(pts)', points + grid)
        for (u, v), h in zip(points, hits):
            print(f'foto {foto} ({u:.2f},{v:.2f}) -> {h["m"] if h else "(boşluk)"}')
        counts = {}
        for h in hits[len(points):]:
            if h: counts[h['m']] = counts.get(h['m'], 0) + 1
        print(f'foto {foto} en çok görünen:', ', '.join(f'{k} ({n})' for k, n in sorted(counts.items(), key=lambda kv: -kv[1])[:12]))
    b.close()
