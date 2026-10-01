"""Ürün sahibinin kesit görselinde YEŞİLE boyadığı boş alanları duvar taramasına ekler.

    python3 tools/cad/fill_section_marks.py <işaretli.png> <KAT>
    KAT: BODRUM | GIRIS | KAT1 | CATI

Görsel, kat kat kesit PNG'leriyle (70 px/m, kenar 70 px, x -8,5..7,5, z -11,5..8,5)
aynı ölçekte olmalı. Yeşil pikseller 4-komşu bileşenlere ayrılır, her bileşen
satır satır dikdörtgenlere bölünür (aynı x aralığındaki ardışık satırlar tek
dikdörtgen), dikdörtgenler o katın kesit diliminin duvar üçgenlerine (p/i)
eklenir. Eklenen dikdörtgenler build/cad/kesit-dolgu-ekleri.json'a da yazılır
(tekrar üretilebilir, DXF dışa aktarımı onları da içerir).
Yazılanlar: build/web/native-current/sections-current.json ve .json.gz
"""
import gzip, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SEC = os.path.join(ROOT, 'build', 'web', 'native-current', 'sections-current.json')
LOG = os.path.join(ROOT, 'build', 'cad', 'kesit-dolgu-ekleri.json')
FLOORS = ['BODRUM', 'GIRIS', 'KAT1', 'CATI']
X0, Z0, PX, M = -8.5, -11.5, 70, 70


def rects(mask):
    out = []
    lab, n = ndimage.label(mask)
    for k in range(1, n + 1):
        ys, xs = np.nonzero(lab == k)
        open_ = {}  # (c0,c1) -> başlangıç satırı
        for r in range(ys.min(), ys.max() + 2):
            row = (lab[r] == k) if r < lab.shape[0] else np.zeros(lab.shape[1], bool)
            runs, c = set(), 0
            idx = np.nonzero(row)[0]
            if len(idx):
                starts = [idx[0]] + [b for a, b in zip(idx, idx[1:]) if b != a + 1]
                ends = [a for a, b in zip(idx, idx[1:]) if b != a + 1] + [idx[-1]]
                runs = set(zip(starts, ends))
            for span in list(open_):
                if span not in runs:
                    out.append((span[0], span[1], open_.pop(span), r - 1))
            for span in runs:
                open_.setdefault(span, r)
    return out


def main(png, floor):
    f = FLOORS.index(floor)
    img = np.asarray(Image.open(png).convert('RGB')).astype(int)
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    mask = (g > 150) & (r < 120) & (b < 170) & (g - r > 80)
    mask = ndimage.binary_dilation(mask, iterations=1)  # kenar yumuşatmasını kapat, siyaha değsin
    boxes = [((c0 - M) / PX + X0, (r0 - M) / PX + Z0, (c1 + 1 - M) / PX + X0, (r1 + 1 - M) / PX + Z0)
             for c0, c1, r0, r1 in rects(mask)]
    data = json.load(open(SEC, encoding='utf-8'))
    sl = data['slices'][f]
    p, i = sl['p'], sl['i']
    area = 0.0
    for x0, z0, x1, z1 in boxes:
        base = len(p) // 2
        p += [round(x0, 4), round(z0, 4), round(x1, 4), round(z0, 4), round(x1, 4), round(z1, 4), round(x0, 4), round(z1, 4)]
        i += [base, base + 1, base + 2, base, base + 2, base + 3]
        area += (x1 - x0) * (z1 - z0)
    sl['wall_area_m2'] = round(sl.get('wall_area_m2', 0) + area, 4)
    sl.setdefault('owner_marked_fills', []).append({'source': os.path.basename(png), 'rectangles': len(boxes), 'area_m2': round(area, 4)})
    txt = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    open(SEC, 'w', encoding='utf-8').write(txt)
    with gzip.open(SEC + '.gz', 'wt', encoding='utf-8', compresslevel=9) as fh:
        fh.write(txt)
    log = json.load(open(LOG)) if os.path.exists(LOG) else {'aciklama': 'Ürün sahibinin yeşil işaretlediği, kesit taramasına eklenen dikdörtgenler (model x,z; metre)', 'katlar': {}}
    log['katlar'].setdefault(floor, []).extend([[round(v, 4) for v in bx] for bx in boxes])
    json.dump(log, open(LOG, 'w'), ensure_ascii=False, indent=1)
    print(f'{floor}: {len(boxes)} dikdörtgen, {area:.3f} m² eklendi')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
