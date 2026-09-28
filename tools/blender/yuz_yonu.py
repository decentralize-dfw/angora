"""Pişen yüzlerin yönü: odaya değil duvarın İÇİNE bakan üçgenleri bulur.

    <bpy'li python> tools/blender/yuz_yonu.py      (mathutils gerekir: bpy modülü ya da Blender)

Web modellerinde malzemeler çift yüzlü çizildiği için bazı yüzlerin normali
duvarın içine baktığı halde görüntüde fark edilmiyordu (28.09 ölçümü: iç
duvarların ~480 m²'si). Cycles ise pişirmeyi yalnız normal tarafında yapar;
bu yüzler kara çıkar. Burada her pişen üçgen için:
  - ön taraf (normal yönü): 60 cm içinde MİMARİ bir yüzeye çarpıyor
    (mobilya sayılmaz - halının altındaki döşeme ters çevrilmesin)
  - arka taraf: 1 m boyunca boş (oda)
koşulları, 5 ışından çoğunda sağlanıyorsa üçgen "ters" sayılır.
Çıktı: build/bake/yuz-cevir.json  {dosya: {düğüm: [üçgen sırası, ...]}}
tools/batch-delivery/apply-face-flips.mjs bunları -lm GLB'lere uygular.
"""
import json, os, sys
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

sys.path.insert(0, os.path.dirname(__file__))
from lightmap_uv import read_glb, accessor, quat_matrix

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAKE = os.path.join(ROOT, 'build', 'bake')
FILES = {'BUILDING-opt-v4': 'BUILDING-opt-v4-lm.glb', 'GARDEN-opt-v2': 'GARDEN-opt-v2-lm.glb',
         'INTERIOR-opt-v2': 'INTERIOR-opt-v2.decoded.glb'}
spec = json.load(open(os.path.join(BAKE, 'lightmap-uv.json'), encoding='utf-8'))
baked = {(e['dosya'], n) for e in spec['atlaslar'].values() for n in e['dugumler']}

def world_triangles(gltf, binary, node):
    prim = gltf['meshes'][node['mesh']]['primitives'][0]
    pos = accessor(gltf, binary, prim['attributes']['POSITION']).astype(np.float64)
    m = quat_matrix(node.get('rotation', [0, 0, 0, 1])) * np.array(node.get('scale', [1, 1, 1]))
    world = pos @ m.T + np.array(node.get('translation', [0, 0, 0]))
    idx = accessor(gltf, binary, prim['indices']).astype(np.int64).reshape(-1, 3)
    return world, idx, prim

def transmissive(gltf, prim):
    mat = gltf['materials'][prim['material']] if 'material' in prim else {}
    return mat.get('extensions', {}).get('KHR_materials_transmission', {}).get('transmissionFactor', 0) > 0.5

# ---- sahne: iki BVH (mimari = BUILDING+GARDEN, hepsi = + mobilya); cam/su hariç
arch_v, arch_f, all_v, all_f = [], [], [], []
docs, targets = {}, []
for key, fname in FILES.items():
    gltf, binary = read_glb(os.path.join(BAKE, fname))
    docs[key] = (gltf, binary)
    for node in gltf['nodes']:
        if 'mesh' not in node: continue
        world, idx, prim = world_triangles(gltf, binary, node)
        if transmissive(gltf, prim): continue
        for verts, faces, use in ((all_v, all_f, True), (arch_v, arch_f, key != 'INTERIOR-opt-v2')):
            if not use: continue
            base = sum(len(v) for v in verts)
            verts.append(world); faces.append(idx + base)
        if (key, node['name']) in baked: targets.append((key, node['name'], world, idx))
def bvh(verts, faces):
    v = np.concatenate(verts); f = np.concatenate(faces)
    return BVHTree.FromPolygons([Vector(p) for p in v], f.tolist(), all_triangles=True, epsilon=0.0)
arch, full = bvh(arch_v, arch_f), bvh(all_v, all_f)

# ışın demeti: normal etrafında 5 yön (merkez + 25° koni)
def cone(n):
    n = n / np.linalg.norm(n)
    a = np.array([1.0, 0, 0]) if abs(n[0]) < 0.9 else np.array([0, 1.0, 0])
    u = np.cross(n, a); u /= np.linalg.norm(u); v = np.cross(n, u)
    t = np.tan(np.radians(25))
    return [n] + [(n + t * (c * u + s * v)) / np.linalg.norm(n + t * (c * u + s * v))
                  for c, s in ((1, 0), (-1, 0), (0, 1), (0, -1))]

def hits(tree, origin, dirs, dist):
    out = 0
    for d in dirs:
        loc, *_ = tree.ray_cast(Vector(origin + d * 0.003), Vector(d), dist)
        out += loc is not None
    return out

result, report = {}, []
for key, name, world, idx in targets:
    tri = world[idx]
    fn = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    area = 0.5 * np.linalg.norm(fn, axis=1)
    flips = []
    for i in range(len(idx)):
        if area[i] < 1e-5: continue
        c = tri[i].mean(axis=0); n = fn[i] / (2 * area[i])
        front = cone(n)
        if hits(arch, c, front, 0.60) < 3: continue           # önü açık: doğru yönde (60 cm: 40 cm kalın ters istinat duvarı)
        if hits(full, c, [-d for d in front], 1.0) > 1: continue   # arkası da kapalı: gizli yüz
        flips.append(i)
    flipped_area = float(area[flips].sum()) if flips else 0.0
    report.append((key, name, len(idx), len(flips), round(flipped_area, 1), round(float(area.sum()), 1)))
    if flips: result.setdefault(key, {})[name] = flips
json.dump(result, open(os.path.join(BAKE, 'yuz-cevir.json'), 'w'), ensure_ascii=False)
for r in report: print(f'{r[1][:40]:40} üçgen {r[2]:>6}  ters {r[3]:>5}  ters alan {r[4]:>7} / {r[5]} m²')
