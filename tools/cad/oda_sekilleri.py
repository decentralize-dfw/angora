"""Oda adı etiketleri için oda poligonları ve etiket noktaları (viewer/src/room-shapes.js).

rooms.json 'spaces' sınırları (R39 kaplama izdüşümü) kullanılır. Birden çok odayı kapsayan açık alan (ör. giriş
salon + yemek alanı + antre) üyelerin kayıtlı konumlarına göre Voronoi ile bölünür. Etiket noktası poligonun
erişilmezlik kutbu (duvarlardan en uzak iç nokta, shapely polylabel): ad odanın içinde ve ortasında durur, kıyıya
/ köşeye düşmez. Space'i olmayan odalar (balkonlar, bodrum WC) için rooms.json ölçülerinin kutusu ya da konumun
çevresinde 1,2 m'lik kare.

    python tools/cad/oda_sekilleri.py viewer/public/models/full/rooms.json viewer/src/room-shapes.js build/web/native-current/native-rooms.json

Üçüncü dosya (sitenin yüklediği oda listesi) verilirse yalnız oradaki odalar bölünür: bodrumda rooms.json'daki B04
sitede Salon'a katılmış; ayrı oda sayılınca Salon'un hücresi yarıya iniyor, ad salonun kıyısına düşüyordu.
"""
import json, sys
from shapely.geometry import Polygon, Point, box, MultiPoint
from shapely.ops import voronoi_diagram, polylabel


# Balkonlar: rooms.json'da space yok; giriş balkonunun kayıtlı konumu (3,3, -9,8) yanlış. Ürün sahibinin DXF ölçü
# çiziminin balkon ölçülerinin uçlarından (dxf-dimensions.js: 2,0 m ve 1,8 m).
SABIT = {'f1-Z10': (-1.97, -10.08, 0.0, -8.28), 'f2-110': (-1.95, -10.07, -0.14, -8.34)}

# Merdiven boşluğu (x 0,788..4,088, z -3,096..-0,957): rooms.json sınırında giriş antresi ve 1. kat holünün içinde.
# Ad merdivenin üstüne düşüyordu (02.10 ürün sahibi: "antre alakasız yerde", "kat holü zeminin üzerinde değil");
# bu odaların poligonundan çıkarılır, ad zeminde kalır.
# 1. katta boşluk ara sahanlığın üstüne de açık (planda koyu kahve kare, x 0,15..2,97, z -0,96..0,45; asılı aplik
# de buradaydı): kat holünden o da çıkarılır.
CIKAR = {'f1-Z02': [(0.788, -3.096, 4.088, -0.957)], 'f2-101': [(0.788, -3.096, 4.088, -0.957), (0.15, -0.96, 2.97, 0.45)]}


def merkez(g):
    """Etiket noktası: duvara uzaklığı en büyüğün %85'inden az olmayan iç noktalar içinden oda ağırlık merkezine en
    yakını. Yalın polylabel uzun odada (bodrum salonu 8 x 4 m) uzun eksen boyunca herhangi bir noktayı seçip adı
    kıyıya yakın bırakabiliyordu."""
    import numpy as np
    import shapely
    best = polylabel(g, tolerance=0.01); top = g.exterior.distance(best)
    x0, z0, x1, z1 = g.bounds
    xs, zs = np.meshgrid(np.arange(x0, x1, 0.05), np.arange(z0, z1, 0.05))
    xs, zs = xs.ravel(), zs.ravel(); ins = shapely.contains_xy(g, xs, zs)
    xs, zs = xs[ins], zs[ins]
    if not len(xs): return best
    d = np.array([g.exterior.distance(Point(x, z)) for x, z in zip(xs, zs)])
    k = d >= 0.85 * top
    c = g.centroid; j = np.argmin((xs[k] - c.x) ** 2 + (zs[k] - c.y) ** 2)
    return Point(xs[k][j], zs[k][j])


def main(src, dst, runtime=None):
    d = json.load(open(src)); rooms = {r['id']: r for r in d['rooms']}; dims = {x['id']: x for x in d['dimensions']}
    if runtime:
        rt = json.load(open(runtime)); rooms = {r['id']: r for r in rt['rooms']}
        dims.update({x['id']: x for x in rt.get('dimensions', [])})
    out = {}
    for s in d['spaces']:
        poly = Polygon(s['boundary_xz'], [h for h in s.get('holes_xz', [])]).buffer(0)
        members = [m for m in s['members'] if m in rooms]
        if len(members) == 1:
            cells = {members[0]: poly}
        else:
            pts = MultiPoint([(rooms[m]['position'][0], rooms[m]['position'][2]) for m in members])
            vor = voronoi_diagram(pts, envelope=poly.envelope.buffer(5))
            cells = {}
            for m in members:
                p = Point(rooms[m]['position'][0], rooms[m]['position'][2])
                cell = next(c for c in vor.geoms if c.contains(p) or c.distance(p) < 1e-9)
                g = cell.intersection(poly)
                if g.geom_type != 'Polygon': g = max(getattr(g, 'geoms', [g]), key=lambda q: q.area)
                cells[m] = g
        for m, g in cells.items(): out[m] = g
    for rid, b in SABIT.items():
        if rid in rooms: out[rid] = box(*b)
    for rid, r in rooms.items():
        if rid in out: continue
        xs, zs = [], []
        for did in r.get('dimensions', []):
            dd = dims.get(did)
            if dd: xs += [dd['a'][0], dd['b'][0]]; zs += [dd['a'][2], dd['b'][2]]
        if xs and max(xs) - min(xs) > 0.3 and max(zs) - min(zs) > 0.3: out[rid] = box(min(xs), min(zs), max(xs), max(zs))
        else: x, z = r['position'][0], r['position'][2]; out[rid] = box(x - 0.6, z - 0.6, x + 0.6, z + 0.6)
    for rid, boxes in CIKAR.items():
        if rid in out:
            g = out[rid]
            for b in boxes: g = g.difference(box(*b))
            if g.geom_type != 'Polygon': g = max(g.geoms, key=lambda q: q.area)
            out[rid] = g
    res = {}
    for rid, g in out.items():
        g = g.simplify(0.005)
        a = merkez(g)
        res[rid] = {'poly': [[round(x, 3), round(z, 3)] for x, z in list(g.exterior.coords)[:-1]], 'anchor': [round(a.x, 3), round(a.y, 3)],
                    'clearance': round(g.exterior.distance(a), 3)}
    with open(dst, 'w') as f:
        f.write('// Üretildi: tools/cad/oda_sekilleri.py (rooms.json spaces). Oda adı etiketi bu poligonun içinde, anchor noktasında\n'
                '// (duvarlardan en uzak iç nokta) durur. Elle düzenlemeyin.\n')
        f.write('export default ' + json.dumps(res, ensure_ascii=False) + ';\n')
    for rid in sorted(res): print(rid, rooms[rid]['name'], res[rid]['anchor'], res[rid]['clearance'], len(res[rid]['poly']))


if __name__ == '__main__':
    main(*sys.argv[1:])
