"""Ürün sahibinin kesit görselinde YEŞİLE boyadığı boş alanları duvar taramasına ekler.

    python3 tools/cad/fill_section_marks.py <işaretli.png> <KAT> [--haric x0,y0,x1,y1]... [--sil x0,y0,x1,y1]...
    KAT: BODRUM | GIRIS | KAT1 | CATI
    --haric: bu CAD kutusundaki yeşil işaret dolgu değildir (ör. çarpı / ok işareti)
    --sil:   ağırlık merkezi bu CAD kutusunda kalan duvar üçgenleri silinir ("çarpılan" çizgi)
    (CAD kutusu: x ve y = -model z, metre; görseldeki ızgara değerleri)

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


def main(png, floor, haric=(), sil=()):
    f = FLOORS.index(floor)
    img = np.asarray(Image.open(png).convert('RGB')).astype(int)
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    mask = (g > 150) & (r < 120) & (b < 170) & (g - r > 80)
    for x0, y0, x1, y1 in haric:  # CAD kutusu -> piksel
        c0, c1 = int((x0 - X0) * PX + M), int((x1 - X0) * PX + M) + 1
        r0, r1 = int((-y1 - Z0) * PX + M), int((-y0 - Z0) * PX + M) + 1
        mask[max(r0, 0):r1, max(c0, 0):c1] = False
    mask = ndimage.binary_dilation(mask, iterations=1)  # kenar yumuşatmasını kapat, siyaha değsin
    boxes = [((c0 - M) / PX + X0, (r0 - M) / PX + Z0, (c1 + 1 - M) / PX + X0, (r1 + 1 - M) / PX + Z0)
             for c0, c1, r0, r1 in rects(mask)]
    data = json.load(open(SEC, encoding='utf-8'))
    sl = data['slices'][f]
    p, i = sl['p'], sl['i']
    removed = 0
    if sil:
        keep = []
        for t in range(0, len(i), 3):
            cx = sum(p[2 * i[t + j]] for j in range(3)) / 3
            cy = -sum(p[2 * i[t + j] + 1] for j in range(3)) / 3
            if any(x0 <= cx <= x1 and y0 <= cy <= y1 for x0, y0, x1, y1 in sil):
                removed += 1
                continue
            keep += i[t:t + 3]
        i[:] = keep
    area = 0.0
    for x0, z0, x1, z1 in boxes:
        base = len(p) // 2
        p += [round(x0, 4), round(z0, 4), round(x1, 4), round(z0, 4), round(x1, 4), round(z1, 4), round(x0, 4), round(z1, 4)]
        i += [base, base + 1, base + 2, base, base + 2, base + 3]
        area += (x1 - x0) * (z1 - z0)
    sl['wall_area_m2'] = round(sl.get('wall_area_m2', 0) + area, 4)
    sl.setdefault('owner_marked_fills', []).append({'source': os.path.basename(png), 'rectangles': len(boxes), 'area_m2': round(area, 4),
                                                   'removed_triangles': removed, 'removed_boxes_cad': [list(b) for b in sil]})
    txt = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    open(SEC, 'w', encoding='utf-8').write(txt)
    with gzip.open(SEC + '.gz', 'wt', encoding='utf-8', compresslevel=9) as fh:
        fh.write(txt)
    log = json.load(open(LOG)) if os.path.exists(LOG) else {'aciklama': 'Ürün sahibinin yeşil işaretlediği, kesit taramasına eklenen dikdörtgenler (model x,z; metre)', 'katlar': {}}
    log['katlar'].setdefault(floor, []).extend([[round(v, 4) for v in bx] for bx in boxes])
    json.dump(log, open(LOG, 'w'), ensure_ascii=False, indent=1)
    if sil:
        log.setdefault('silinen', {}).setdefault(floor, []).extend([list(b) for b in sil])
        json.dump(log, open(LOG, 'w'), ensure_ascii=False, indent=1)
    print(f'{floor}: {len(boxes)} dikdörtgen, {area:.3f} m² eklendi; {removed} üçgen silindi')


if __name__ == '__main__':
    args, haric, sil = sys.argv[1:], [], []
    while '--haric' in args:
        k = args.index('--haric'); haric.append(tuple(map(float, args[k + 1].split(',')))); del args[k:k + 2]
    while '--sil' in args:
        k = args.index('--sil'); sil.append(tuple(map(float, args[k + 1].split(',')))); del args[k:k + 2]
    main(args[0], args[1], haric, sil)
