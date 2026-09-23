# H2 teslimat paketi (DAİMİ EMİR A8) - Blender'da ÇALIŞTIRILACAK script.
#
#   blender --background --factory-startup --python tools/blender/rebake-interior-lightmaps.py -- \
#       [--source build/web/batched/desktop] [--out build/blender/out] [--resolution 2048] [--samples 256]
#
# Ne yapar (denetim bulgusu: iç mekân lightmap UV doluluğu %4,1; hedef >=%65):
#   1. interior.glb + architecture.glb'yi içeri alır (Draco+WebP - Blender >=3.6).
#   2. Her interior mesh'e 'Lightmap' UV kanalı açar: Smart UV Project
#      (66°, island_margin 0.003) + pack_islands -> doluluğu ÖLÇER ve yazar.
#      %65'in altında kalırsa çıkış kodu 1 - "iyi görünüyor" yok, sayı var.
#   3. Cycles ile kat başına (f0..f3, isim önekinden) 2048x2048 bake:
#      AO (interior-ao-f*.png) + DIFFUSE indirect+direct, güneş 21 Haziran
#      16:30'a sabit (viewer/src/daylight.js ile aynı NOAA açıları).
#   4. build/blender/out/ altına yazar + occupancy-report.json üretir
#      (mesh başına doluluk, toplam, dosya sha256'ları).
#
# Bake'ten sonra repoda koşulacaklar (Blender istemez):
#   node tools/batch-delivery/prepare-visibility.mjs   # attestation yenile
#   cd viewer && npm test                              # 292 test yeşil
#
# İNSANIN YAPMASI GEREKEN TEK ŞEY: Blender'lı bir makinede yukarıdaki tek
# komutu koşup build/blender/out/ klasörünü bu repoya commit'lemek.
import bpy
import json
import hashlib
import math
import sys
from pathlib import Path

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(name, fallback):
    return argv[argv.index(name) + 1] if name in argv else fallback

repo = Path(__file__).resolve().parents[2]
source = repo / arg('--source', 'build/web/batched/desktop')
out = repo / arg('--out', 'build/blender/out')
resolution = int(arg('--resolution', '2048'))
samples = int(arg('--samples', '256'))
out.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
for part in ('architecture.glb', 'interior.glb'):
    bpy.ops.import_scene.gltf(filepath=str(source / part))

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = samples
scene.cycles.use_denoising = True

# Sun pinned to the QA daylight state (viewer/src/daylight.js, hour 16.5,
# day 172, lat 39.88 lon 32.73 UTC+3) so the bake matches every capture.
def solar_direction(hour=16.5, day=172, lat=39.88, lon=32.73):
    g = 2 * math.pi / 365 * (day - 1 + (hour - 12) / 24)
    eq = 229.18 * (.000075 + .001868 * math.cos(g) - .032077 * math.sin(g)
                   - .014615 * math.cos(2 * g) - .040849 * math.sin(2 * g))
    dec = (.006918 - .399912 * math.cos(g) + .070257 * math.sin(g)
           - .006758 * math.cos(2 * g) + .000907 * math.sin(2 * g)
           - .002697 * math.cos(3 * g) + .00148 * math.sin(3 * g))
    ha = (hour * 60 + eq + 4 * lon - 180) / 4 * math.pi / 180 - math.pi
    lat_r = math.radians(lat)
    east = -math.cos(dec) * math.sin(ha)
    north = math.cos(lat_r) * math.sin(dec) - math.sin(lat_r) * math.cos(dec) * math.cos(ha)
    up = math.sin(lat_r) * math.sin(dec) + math.cos(lat_r) * math.cos(dec) * math.cos(ha)
    return east, up, north

sun = bpy.data.objects.new('QA-sun', bpy.data.lights.new('QA-sun', 'SUN'))
scene.collection.objects.link(sun)
east, up, north = solar_direction()
# glTF Y-up arrives Z-up in Blender; aim the sun along -direction.
sun.rotation_euler = (math.atan2(math.hypot(east, north), up), 0, math.atan2(-east, -north))
sun.data.energy = 4.0

interior_meshes = [obj for obj in scene.objects
                   if obj.type == 'MESH' and 'interior' in (obj.name.lower())]
if not interior_meshes:  # importer may keep part names on parents only
    interior_meshes = [obj for obj in scene.objects if obj.type == 'MESH'
                       and obj.users_collection and any('interior' in c.name.lower()
                                                        for c in obj.users_collection)]
assert interior_meshes, 'interior meshes not found - importer naming changed?'

def uv_occupancy(mesh, layer_name):
    layer = mesh.data.uv_layers[layer_name]
    area = 0.0
    for poly in mesh.data.polygons:
        pts = [layer.data[i].uv for i in poly.loop_indices]
        for i in range(1, len(pts) - 1):
            area += abs((pts[i].x - pts[0].x) * (pts[i + 1].y - pts[0].y)
                        - (pts[i + 1].x - pts[0].x) * (pts[i].y - pts[0].y)) / 2
    return area

report = {'resolution': resolution, 'samples': samples, 'meshes': [], 'floors': {}}
for obj in interior_meshes:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    uv = obj.data.uv_layers.new(name='Lightmap')
    obj.data.uv_layers.active = uv
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.003)
    bpy.ops.uv.pack_islands(margin=0.003)
    bpy.ops.object.mode_set(mode='OBJECT')
    occupancy = uv_occupancy(obj, 'Lightmap')
    report['meshes'].append({'name': obj.name, 'occupancy': round(occupancy, 4)})
    obj.select_set(False)

total = sum(m['occupancy'] for m in report['meshes']) / max(1, len(report['meshes']))
report['mean_occupancy'] = round(total, 4)
print(f"Lightmap UV doluluğu (ortalama): {total * 100:.1f}%  (hedef >= 65%)")

def floor_of(obj):
    name = obj.name.lower()
    for f in ('f0', 'f1', 'f2', 'f3'):
        if f in name:
            return f
    return 'f1'

for f in ('f0', 'f1', 'f2', 'f3'):
    members = [o for o in interior_meshes if floor_of(o) == f]
    if not members:
        continue
    image = bpy.data.images.new(f'interior-light-{f}', resolution, resolution, float_buffer=True)
    for obj in members:
        for slot in obj.material_slots:
            mat = slot.material
            if not mat or not mat.use_nodes:
                continue
            node = mat.node_tree.nodes.new('ShaderNodeTexImage')
            node.image = image
            mat.node_tree.nodes.active = node
    bpy.ops.object.select_all(action='DESELECT')
    for obj in members:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = members[0]
    for bake_type, suffix in (('AO', 'ao'), ('DIFFUSE', 'light')):
        if bake_type == 'DIFFUSE':
            scene.render.bake.use_pass_direct = True
            scene.render.bake.use_pass_indirect = True
            scene.render.bake.use_pass_color = False
        bpy.ops.object.bake(type=bake_type, uv_layer='Lightmap', use_selected_to_active=False)
        path = out / f'interior-{suffix}-{f}.png'
        image.filepath_raw = str(path)
        image.file_format = 'PNG'
        image.save()
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        report['floors'].setdefault(f, {})[suffix] = {'file': path.name, 'sha256': digest}
        print(f'{f} {bake_type} -> {path.name}  sha256={digest[:12]}')

(out / 'occupancy-report.json').write_text(json.dumps(report, indent=1))
print('Wrote', out / 'occupancy-report.json')
sys.exit(0 if total >= 0.65 else 1)
