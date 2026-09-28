"""Kesit taramalarını (her katın kesildiği yükseklikte) DXF'e aktarır.

    pip install ezdxf
    python3 tools/cad/export_section_hatches.py

Ürün sahibi (28.09): "bu hatchlerin olduğu dwg çizim dosyası gerekiyor. her
katın tam kesildiği yükseklikte, z de konumlanmış şekilde. tekrardan
çizeceğim."

Kaynak (görüntüleyicinin çizdiğinin aynısı):
  build/web/native-current/sections-current.json.gz   duvar / donatı / mobilya kesitleri
  build/web/native-current/native-soil-section.json.gz toprak kesiti (yalnız bodrum kotunda)

Koordinat: CAD X = model x, CAD Y = -model z, CAD Z = kesit yüksekliği
(model y). Birim metre. Görüntüleyici glTF'te Y yukarı, -Z "ileri";
CAD'de Y yukarı (plan), Z kot. Geri alırken aynı eşleme tersine uygulanır.

Çıktı: build/cad/angora-kesit-taramalari.dxf (AutoCAD doğrudan açar;
DWG gerekiyorsa AutoCAD'de Farklı Kaydet -> DWG).
Her kat için katmanlar: <KAT>_DUVAR, <KAT>_DONATI, <KAT>_MOBILYA, <KAT>_TOPRAK
ve <KAT>_NOT (kat adı + kesit kotu). Her kapalı sınır hem LWPOLYLINE (kotta)
hem HATCH (ANSI31 duvar, EARTH toprak) olarak yazılır.
"""
import gzip
import json
import os
from collections import defaultdict

import ezdxf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'build', 'web', 'native-current')
OUT_DIR = os.path.join(ROOT, 'build', 'cad')
FLOORS = ['BODRUM', 'GIRIS', 'KAT1', 'CATI']
LAYERS = [('p', 'i', 'DUVAR', 7), ('q', 'j', 'DONATI', 8), ('fq', 'fj', 'MOBILYA', 9)]


def load(name):
    path = os.path.join(SRC, name)
    if os.path.exists(path + '.gz'):
        with gzip.open(path + '.gz', 'rt', encoding='utf-8') as f:
            return json.load(f)
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def boundary_loops(p, idx):
    """Üçgen ağının sınır kenarlarını kapalı halkalara bağlar."""
    key = lambda k: (round(p[2 * k], 5), round(p[2 * k + 1], 5))
    count = defaultdict(int)
    for t in range(0, len(idx), 3):
        a, b, c = key(idx[t]), key(idx[t + 1]), key(idx[t + 2])
        for u, v in ((a, b), (b, c), (c, a)):
            if u == v:
                continue
            count[(u, v) if u < v else (v, u)] += 1
    adj = defaultdict(list)
    for (u, v), n in count.items():
        if n == 1:
            adj[u].append(v)
            adj[v].append(u)
    used, loops = set(), []
    for start in list(adj):
        for first in adj[start]:
            e = (start, first) if start < first else (first, start)
            if e in used:
                continue
            used.add(e)
            loop, prev, cur = [start], start, first
            while cur != start:
                loop.append(cur)
                nxt = None
                for cand in adj[cur]:
                    ce = (cur, cand) if cur < cand else (cand, cur)
                    if ce not in used and cand != prev:
                        nxt = cand
                        break
                if nxt is None:
                    for cand in adj[cur]:
                        ce = (cur, cand) if cur < cand else (cand, cur)
                        if ce not in used:
                            nxt = cand
                            break
                if nxt is None:
                    break
                used.add((cur, nxt) if cur < nxt else (nxt, cur))
                prev, cur = cur, nxt
            if len(loop) >= 3:
                loops.append(loop)
    return loops


def to_cad(loop):
    return [(x, -z) for x, z in loop]


def main():
    atlas = load('sections-current.json')
    soil = load('native-soil-section.json')
    heights = atlas.get('exact_floor_heights_m') or [0 + 1.6, 3.0996 + 1.6, 6.3714 + 1.6, 9.4705 + 1.3]
    doc = ezdxf.new('R2018', setup=True)
    doc.header['$INSUNITS'] = 6  # metre
    msp = doc.modelspace()
    summary = []
    for f, (floor, height) in enumerate(zip(FLOORS, heights)):
        slice_ = min(atlas['slices'], key=lambda s: abs(s['height'] - height))
        if abs(slice_['height'] - height) > 1e-3:
            raise SystemExit(f'{floor}: {height} kotunda kesit yok')
        for pk, ik, name, color in LAYERS:
            layer = f'{floor}_{name}'
            doc.layers.add(layer, color=color)
            p, idx = slice_.get(pk) or [], slice_.get(ik) or []
            loops = boundary_loops(p, idx) if p and idx else []
            hatch = msp.add_hatch(color=color, dxfattribs={'layer': layer, 'elevation': (0, 0, height)})
            hatch.set_pattern_fill('ANSI31', scale=0.02, angle=0 if name == 'DUVAR' else 90)
            for loop in loops:
                pts = to_cad(loop)
                msp.add_lwpolyline(pts, close=True, dxfattribs={'layer': layer, 'elevation': height})
                hatch.paths.add_polyline_path(pts, is_closed=True)
            if not loops:
                msp.delete_entity(hatch)
            summary.append((layer, len(loops)))
        # toprak: yerli kesit dilimlerinden bu kota denk gelen
        soil_slices = soil.get('slices') or [soil]
        s = min(soil_slices, key=lambda s: abs(s['height'] - height))
        layer = f'{floor}_TOPRAK'
        doc.layers.add(layer, color=33)
        loops = boundary_loops(s['p'], s['i']) if abs(s['height'] - height) < 0.051 and s.get('i') else []
        if loops:
            hatch = msp.add_hatch(color=33, dxfattribs={'layer': layer, 'elevation': (0, 0, height)})
            hatch.set_pattern_fill('EARTH', scale=0.05)
            for loop in loops:
                pts = to_cad(loop)
                msp.add_lwpolyline(pts, close=True, dxfattribs={'layer': layer, 'elevation': height})
                hatch.paths.add_polyline_path(pts, is_closed=True)
        summary.append((layer, len(loops)))
        note = f'{floor}_NOT'
        doc.layers.add(note, color=1)
        msp.add_text(f'{floor} - kesit kotu {height:.4f} m', height=0.35,
                     dxfattribs={'layer': note, 'insert': (-12.0, 14.0 - 0.0, height)})
    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, 'angora-kesit-taramalari.dxf')
    doc.saveas(out)
    for layer, n in summary:
        print(f'{layer:18s} {n:5d} kapalı sınır')
    print(out, os.path.getsize(out), 'B')


if __name__ == '__main__':
    main()
