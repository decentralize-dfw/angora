"""Ürün sahibinin ölçü DXF'i -> görüntüleyicinin plan ölçüleri (yalnız bunlar).

    python3 tools/cad/dxf_dimensions.py <ölçüler.dxf> [viewer/src/dxf-dimensions.js]

02.10 ürün sahibi: "BURDAKİ ÖLÇÜLER KOY. SADECE BUNLAR OLSUN." DXF, export_section_hatches.py
çıktısının (CAD X = model x, CAD Y = -model z) dört katı yan yana taşınmış hali + DİMENSİONS
katmanında 77 doğrusal ölçü. Kat kaymaları DUVAR çokgenlerinin köşeleri birebir (<1 mm) oturacak
şekilde bulundu: x = -47,9353 / -78,9256 / -109,9159 / -140,9062 (30,9903 aralık), y = 9,922.
Ölçü çizgisi: defpoint'ten geçen, `angle` yönündeki doğru; uçları defpoint2/defpoint3'ün bu doğruya
izdüşümü (çizimdeki gibi ölçü çizgisi, ölçülen nokta değil). Etiket çizimin kendi yazısı (ör. "8.3").
"""
import json
import math
import os
import sys

import ezdxf

OFFSETS = [-47.9353, -78.9256, -109.9159, -140.9062]   # bodrum, giriş, 1. kat, çatı
OFFSET_Y = 9.922
DATUMS = [0, 3.0996, 6.3714, 9.4705]
LIFT = 0.03


def main(src, out):
    doc = ezdxf.readfile(src)
    rows = []
    for e in doc.modelspace().query('DIMENSION'):
        if e.dimtype & 7 not in (0, 1):
            raise SystemExit(f'beklenmeyen ölçü türü {e.dimtype} ({e.dxf.handle})')
        p = e.dxf.defpoint; q2 = e.dxf.defpoint2; q3 = e.dxf.defpoint3
        floor = min(range(4), key=lambda i: abs((p.x + q2.x) / 2 - (OFFSETS[i] + 0.8)))
        ang = math.radians(e.dxf.get('angle', 0.0)) if e.dimtype & 7 == 0 else math.atan2(q3.y - q2.y, q3.x - q2.x)
        ux, uy = math.cos(ang), math.sin(ang)
        ends = []
        for q in (q2, q3):
            t = (q.x - p.x) * ux + (q.y - p.y) * uy
            ends.append((p.x + t * ux, p.y + t * uy))
        y = round(DATUMS[floor] + LIFT, 4)
        a, b = ([round(x - OFFSETS[floor], 4), y, round(-(cy - OFFSET_Y), 4)] for x, cy in ends)
        text = (e.dxf.get('text') or '').strip()
        metres = float(text.replace(',', '.')) if text and text != '<>' else round(e.dxf.actual_measurement, 2)
        rows.append({'id': f'dxf-{e.dxf.handle}', 'floor_index': floor, 'a': a, 'b': b, 'metres': metres,
                     'measured_m': round(e.dxf.actual_measurement, 4)})
    rows.sort(key=lambda r: (r['floor_index'], r['id']))
    body = json.dumps({'source': os.path.basename(src), 'dimensions': rows}, ensure_ascii=False, indent=1)
    with open(out, 'w', encoding='utf-8') as f:   # JS modülü: node testleri JSON içe aktarmayı kabul etmiyor
        f.write('// Üretildi: tools/cad/dxf_dimensions.py - elle düzenlemeyin. Ürün sahibinin ölçü çizimi (02.10),\n'
                '// plan ölçüleri yalnız bunlar.\n')
        f.write('export default ' + body + ';\n')
    print(len(rows), 'ölçü ->', out, {i: sum(r['floor_index'] == i for r in rows) for i in range(4)})


if __name__ == '__main__':
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else os.path.join(root, 'viewer', 'src', 'dxf-dimensions.js'))
