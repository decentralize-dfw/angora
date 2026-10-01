"""Duvar taramasının içinde kalan küçük kapalı boşlukları doldurur (ürün sahibi:
"sadece solid hatch görmek istiyorum"). Her katın duvar üçgenleri 1 cm ızgarada
rasterleşir; tamamen taramayla çevrili ve alanı SINIR m²'den küçük beyaz adalar
satır dikdörtgenleriyle duvar taramasına eklenir.

    python3 tools/cad/fill_section_holes.py [SINIR_m2=0.1]
"""
import gzip, json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SEC = os.path.join(ROOT, 'build', 'web', 'native-current', 'sections-current.json')
LOG = os.path.join(ROOT, 'build', 'cad', 'kesit-dolgu-ekleri.json')
FLOORS = ['BODRUM', 'GIRIS', 'KAT1', 'CATI']
R = 100  # px/m
X0, Z0, X1, Z1 = -10.0, -13.0, 9.0, 11.0


def main(limit):
    data = json.load(open(SEC, encoding='utf-8'))
    log = json.load(open(LOG)) if os.path.exists(LOG) else {'katlar': {}}
    W, H = int((X1 - X0) * R), int((Z1 - Z0) * R)
    for floor, sl in zip(FLOORS, data['slices']):
        img = Image.new('1', (W, H), 0)
        d = ImageDraw.Draw(img)
        p, i = sl['p'], sl['i']
        for t in range(0, len(i), 3):
            d.polygon([((p[2 * i[t + j]] - X0) * R, (p[2 * i[t + j] + 1] - Z0) * R) for j in range(3)], fill=1)
        m = np.asarray(img, bool)
        holes = ndimage.binary_fill_holes(m) & ~m
        lab, n = ndimage.label(holes)
        sizes = ndimage.sum(holes, lab, range(1, n + 1)) / R / R
        small = np.isin(lab, [k + 1 for k, a in enumerate(sizes) if a < limit])
        added, area = [], 0.0
        for r in range(H):
            row = small[r]
            if not row.any():
                continue
            idx = np.nonzero(row)[0]
            starts = [idx[0]] + [b for a, b in zip(idx, idx[1:]) if b != a + 1]
            ends = [a for a, b in zip(idx, idx[1:]) if b != a + 1] + [idx[-1]]
            for c0, c1 in zip(starts, ends):
                x0, x1 = X0 + c0 / R - 0.003, X0 + (c1 + 1) / R + 0.003
                z0, z1 = Z0 + r / R - 0.003, Z0 + (r + 1) / R + 0.003
                b = len(p) // 2
                p += [round(x0, 4), round(z0, 4), round(x1, 4), round(z0, 4), round(x1, 4), round(z1, 4), round(x0, 4), round(z1, 4)]
                i += [b, b + 1, b + 2, b, b + 2, b + 3]
                added.append([round(x0, 4), round(z0, 4), round(x1, 4), round(z1, 4)])
                area += (x1 - x0) * (z1 - z0)
        nholes = int(sum(1 for a in sizes if a < limit))
        if added:
            sl['wall_area_m2'] = round(sl.get('wall_area_m2', 0) + area, 4)
            sl.setdefault('owner_marked_fills', []).append({'source': f'kapalı boşluk doldurma (< {limit} m²)', 'holes': nholes, 'rectangles': len(added), 'area_m2': round(area, 4)})
            log.setdefault('bosluk', {}).setdefault(floor, []).extend(added)
        print(f'{floor}: {nholes} boşluk, {len(added)} şerit, {area:.3f} m²')
    txt = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    open(SEC, 'w', encoding='utf-8').write(txt)
    with gzip.open(SEC + '.gz', 'wt', encoding='utf-8', compresslevel=9) as fh:
        fh.write(txt)
    json.dump(log, open(LOG, 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main(float(sys.argv[1]) if len(sys.argv) > 1 else 0.1)
