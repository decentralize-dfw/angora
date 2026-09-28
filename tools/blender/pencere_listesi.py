"""Villanın pencereleri (cam mesh'inden) - perde/stor yerleşimi için.

    python tools/blender/pencere_listesi.py   ->  tools/blender/pencereler.json

'glass' mesh'i (BUILDING) bağlı parçalara ayrılır, aynı düzlemde ve 40 cm
içindeki camlar tek pencere sayılır. Koordinatlar BLENDER'da (x, y, z yukarı;
glTF (x, y, z) -> Blender (x, -z, y)). Her pencere: merkez, genişlik,
alt/üst kotu, düzlem normali (yatay), kat, en yakın oda (yürüme istasyonu).
"""
import json, os, sys, gzip
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lightmap_uv import read_glb, accessor

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
FLOORS = [0, 3.0996, 6.3714, 9.4705]
g, b = read_glb(os.path.join(ROOT, 'build', 'bake', 'BUILDING-opt-v4.decoded.glb'))
node = next(n for n in g['nodes'] if n['name'] == 'glass')
prim = g['meshes'][node['mesh']]['primitives'][0]
P = accessor(g, b, prim['attributes']['POSITION']).astype(np.float64)
I = accessor(g, b, prim['indices']).reshape(-1, 3)
P = np.stack([P[:, 0], -P[:, 2], P[:, 1]], axis=1)          # Blender koordinatı
# köşeleri 1 mm'de kaynak, üçgenleri bağlı parçalara ayır
key = np.round(P * 1000).astype(np.int64)
_, weld = np.unique(key, axis=0, return_inverse=True)
weld = weld.reshape(-1)
parent = list(range(weld.max() + 1))
def find(a):
    while parent[a] != a: parent[a] = parent[parent[a]]; a = parent[a]
    return a
for t in I:
    a, b1, c = (find(weld[v]) for v in t)
    parent[b1] = a; parent[c] = a
comp = {}
for ti, t in enumerate(I): comp.setdefault(find(weld[t[0]]), []).append(ti)
panes = []
for tris in comp.values():
    v = P[I[tris].reshape(-1)]
    tri = P[I[tris]]
    n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]).sum(0)
    if np.linalg.norm(n[:2]) < 1e-6: continue                 # yatay cam (çatı penceresi değil) atla
    n = n / np.linalg.norm(n); n[2] = 0; n /= np.linalg.norm(n)
    panes.append({'min': v.min(0), 'max': v.max(0), 'n': n})
# aynı düzlem + 40 cm yakın camları birleştir
windows = []
for p in sorted(panes, key=lambda p: tuple(p['min'])):
    for w in windows:
        near = np.all(p['min'] < w['max'] + .4) and np.all(p['max'] > w['min'] - .4)
        if near and abs(np.dot(p['n'], w['n'])) > .95 and abs(np.dot((p['min'] + p['max']) / 2 - (w['min'] + w['max']) / 2, w['n'])) < .15:
            w['min'] = np.minimum(w['min'], p['min']); w['max'] = np.maximum(w['max'], p['max']); break
    else:
        windows.append(dict(p))
nav = json.load(gzip.open(os.path.join(ROOT, 'build', 'web', 'native-current', 'native-navigation.json.gz')))
stations = [(s['room_id'], s['floor_index'], np.array([s['position'][0], -s['position'][2]])) for s in nav['stations']]
out = []
for w in windows:
    c = (w['min'] + w['max']) / 2
    size = w['max'] - w['min']
    width = float(np.hypot(size[0], size[1]))
    height = float(size[2])
    if width < .25 or height < .3: continue
    floor = max(i for i, z in enumerate(FLOORS) if c[2] >= z - .2) if c[2] >= -.2 else 0
    cands = [s for s in stations if s[1] == floor] or stations
    room = min(cands, key=lambda s: np.linalg.norm(s[2] - c[:2]))[0]
    out.append({'id': f'P{len(out) + 1:02d}', 'kat': floor, 'oda': room,
                'merkez': [round(float(x), 3) for x in c], 'genislik': round(width, 3),
                'alt_z': round(float(w['min'][2]), 3), 'ust_z': round(float(w['max'][2]), 3),
                'normal': [round(float(x), 3) for x in w['n']]})
json.dump({'aciklama': __doc__.strip().splitlines()[0], 'koordinat': 'Blender (z yukarı), metre',
           'kat_kotlari': FLOORS, 'pencereler': out},
          open(os.path.join(ROOT, 'tools', 'blender', 'pencereler.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(panes), 'cam parçası ->', len(out), 'pencere')
for w in out: print(w['id'], w['kat'], w['oda'], w['genislik'], w['alt_z'], w['ust_z'])
