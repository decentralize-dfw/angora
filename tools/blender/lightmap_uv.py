"""Lightmap UV atlasları - web geometrisinin KENDİSİ üzerinde (xatlas).

    python tools/blender/lightmap_uv.py      (numpy + xatlas gerekir)

Girdi : build/bake/<ad>.decoded.glb  (tools/batch-delivery/decode-for-bake.mjs)
Çıktı : build/bake/lightmap-uv.bin + lightmap-uv.json
        - her pişen düğüm için: vmapping (uint32, yeni köşe -> eski köşe),
          indices (uint32), uv (float32, 0..1) ve atlası
        - tools/batch-delivery/apply-lightmap-uv.mjs bunları GLB'ye yazar

UV'ler Blender'da DEĞİL burada açılır: böylece Blender'daki pişirme ile
web'deki model aynı UV'yi taşır; Blender içe aktarırken yüz atsa bile
(dejenere üçgenler) harita koordinatı geometriyle birlikte gider.

Atlaslar (alan: web modelinden, m²):
  duvar  - iç duvarlar (interior.002, ~1995 m²)                    4096²
  zemin  - tavan, döşemeler, ıslak hacim seramikleri, kapılar (~2350) 4096²
  cephe  - dış sıva, koyu ahşap kaplama, çatı altı, çakıl (~1700)   2048²
  bahce  - çim, istinat duvarları, teras/havuz taşı (~3200)         2048²
Pişmeyenler: metal, doğrama (wood_dark), cam, kiremit, mobilya, ağaç, su.
"""
import json, os, struct
import numpy as np
import xatlas

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAKE = os.path.join(ROOT, 'build', 'bake')

ATLASES = {
    'duvar': {'size': 4096, 'file': 'BUILDING-opt-v4', 'nodes': ['interior.002']},
    'zemin': {'size': 4096, 'file': 'BUILDING-opt-v4', 'nodes': [
        'ceiling [imported].001', 'wood_floor.001', 'terra_floor', 'wood_floor', 'stone_tile', 'Cube',
        'Lift | Photographed walnut door finish (4).001',
        'R31 | R33 entrance WC ochre tile', 'R31 | R33 master pale cream tile',
        'R44 joined | fixed | R31 | Shared bathroom ivory wall tile', 'R31 | R33 entrance navy mosaic band',
        'R31 | R33 ivory wall ceramic', 'R31 | R33 master fine mosaic band', 'R31 | R33 attic cream tile',
        'R31 | R33 attic tan mosaic band']},
    'cephe': {'size': 2048, 'file': 'BUILDING-opt-v4', 'nodes': [
        'stucco [imported]', 'Cube.001', 'roof.003', 'gravel [imported].001']},
    'bahce': {'size': 2048, 'file': 'GARDEN-opt-v2', 'nodes': [
        'plot-grass.001', 'Retaining wall rough limestone (1).001', 'Retaining wall rough limestone.002',
        'stone_tile (4).002', 'pool_tile.001', 'white_trim (5).001', 'canopy.001',
        'Garden | Dark stained canopy timber.001']},
}
PADDING = 6          # px, atlas çözünürlüğünde (pişirmede +8 px taşma payı)

COMPONENTS = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
WIDTH = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}

def read_glb(path):
    data = open(path, 'rb').read()
    jlen = struct.unpack_from('<I', data, 12)[0]
    gltf = json.loads(data[20:20 + jlen])
    boff = 20 + jlen
    blen = struct.unpack_from('<I', data, boff)[0]
    return gltf, data[boff + 8:boff + 8 + blen]

def accessor(gltf, binary, index):
    a = gltf['accessors'][index]
    view = gltf['bufferViews'][a['bufferView']]
    dtype = np.dtype(COMPONENTS[a['componentType']])
    width = WIDTH[a['type']]
    start = view.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = view.get('byteStride', 0) or dtype.itemsize * width
    raw = np.frombuffer(binary, dtype=np.uint8, count=stride * (a['count'] - 1) + dtype.itemsize * width, offset=start)
    rows = np.lib.stride_tricks.as_strided(raw, shape=(a['count'], dtype.itemsize * width), strides=(stride, 1))
    return np.ascontiguousarray(rows).view(dtype).reshape(a['count'], width) if width > 1 else \
        np.ascontiguousarray(rows).view(dtype).reshape(a['count'])

def quat_matrix(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])

def main():
    cache, out_json, blob = {}, {'uretim': 'tools/blender/lightmap_uv.py', 'dolgu_px': PADDING, 'atlaslar': {}}, bytearray()
    for atlas_name, spec in ATLASES.items():
        gltf, binary = cache.setdefault(spec['file'], read_glb(os.path.join(BAKE, spec['file'] + '.decoded.glb')))
        by_name = {n['name']: n for n in gltf['nodes'] if 'mesh' in n}
        atlas = xatlas.Atlas()
        members, area = [], 0.0
        for name in spec['nodes']:
            node = by_name[name]
            mesh = gltf['meshes'][node['mesh']]
            assert len(mesh['primitives']) == 1, name
            prim = mesh['primitives'][0]
            pos = accessor(gltf, binary, prim['attributes']['POSITION']).astype(np.float64)
            # dünya ölçeği: yalnız düzgün ölçek + dönüş + öteleme (düğümler düz)
            m = quat_matrix(node.get('rotation', [0, 0, 0, 1])) * np.array(node.get('scale', [1, 1, 1]))
            world = pos @ m.T + np.array(node.get('translation', [0, 0, 0]))
            idx = accessor(gltf, binary, prim['indices']).astype(np.uint32).reshape(-1, 3)
            tri = world[idx]
            area += 0.5 * np.linalg.norm(np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]), axis=1).sum()
            atlas.add_mesh(world.astype(np.float32), idx)
            members.append((name, len(pos), len(idx)))
        chart = xatlas.ChartOptions()
        chart.max_iterations = 2
        pack = xatlas.PackOptions()
        pack.resolution = spec['size']
        pack.padding = PADDING
        pack.bilinear = True
        pack.bruteForce = False
        pack.create_image = False
        atlas.generate(chart_options=chart, pack_options=pack)
        assert atlas.atlas_count == 1, f'{atlas_name}: {atlas.atlas_count} atlas çıktı'
        util = float(atlas.get_utilization(0))
        entry = {'boyut': spec['size'], 'dosya': spec['file'], 'alan_m2': round(area, 1),
                 'doluluk': round(util, 3), 'px_per_m': round(float(atlas.texels_per_unit), 1), 'dugumler': {}}
        for i, (name, nverts, ntris) in enumerate(members):
            vmap, indices, uvs = atlas.get_mesh(i)
            parts = {}
            for key, arr in (('vmapping', vmap.astype(np.uint32)), ('indices', indices.astype(np.uint32).reshape(-1)),
                             ('uv', uvs.astype(np.float32).reshape(-1))):
                parts[key] = [len(blob), arr.size]
                blob += arr.tobytes()
            entry['dugumler'][name] = {'eski_kose': nverts, 'yeni_kose': int(len(vmap)), 'ucgen': ntris, **parts}
        out_json['atlaslar'][atlas_name] = entry
        print(f"{atlas_name}: {len(members)} düğüm, {area:.0f} m², doluluk %{util * 100:.0f}, {atlas.texels_per_unit:.0f} px/m")
    open(os.path.join(BAKE, 'lightmap-uv.bin'), 'wb').write(blob)
    json.dump(out_json, open(os.path.join(BAKE, 'lightmap-uv.json'), 'w'), ensure_ascii=False, indent=1)

if __name__ == '__main__':
    main()
