"""Fotoğrafla AYNI KADRAJDAN, AYDINLIK kontrol görüntüsü (Cycles) - modelleme turları için.

    blender -b --factory-startup --python tools/blender/08_kontrol_render.py -- <REPO> <çıktı klasörü> <foto,foto,...> [seçenekler]

Seçenekler:
  --ekler <yol.glb|yol.blend>  ajanın modellediği nesneler (glb içe aktarılır; .blend'den 'EKLER'
                                koleksiyonu eklenir). Varsayılan: build/web/26092026/EKLER.glb varsa o.
  --sil <silme-kutulari.json>   eski parçaları gizle (aynı kutular web modelinden de silinecek):
                                [{"ad": "..", "katman": "mobilya" | "mimari", "min": [x,y,z], "max": [x,y,z],
                                  "malzemeler": ["Simple wood", ...]  (isteğe bağlı: yalnız bu malzemeler)}]
                                mobilya = INTERIOR, mimari = BUILDING (eski kapı/armatür/merdiven parçası)
  --dokular <dokular.json>      Tur 9 dokularını malzeme adına göre giydir (kutu izdüşümü, doku_olcusu_m ile;
                                UV gerekmez). renk_hex, purluluk, normal_siddeti de uygulanır.
                                Doku klasörü: dokular.json'un yanındaki malzeme-dokulari\
  --kamera <kamera-duzeltme.json>  fotoğraf başına kamera düzeltmesi (aşağıda)
  --ornek N                     Cycles örnek sayısı (varsayılan 96; OIDN gürültü temizler)
  --gece                        armatürler açık, gök kapalı (gece fotoğrafları için)

Sahne: build/bake/BUILDING-opt-v4-lm.glb + INTERIOR-opt-v2.decoded.glb (web ile aynı geometri ve
malzemeler) + tools/blender/isiklar.json'daki 28 armatür (gündüz de AÇIK: fotoğraflarda yanıyor) +
güneş + açık gök. Renk yönetimi AgX, pozlama otomatik: sahnenin ortanca parlaklığı fotoğrafınkine
eşitlenir (fotoğraf gibi aydınlık; karanlık görüntüyle karşılaştırma yapılmaz).

Kamera: docs/blender-ajan/foto-kameralari.csv konumu (çizimden, YAKLAŞIK). Önce bu betikle
kamerayı fotoğrafa oturt: kamera-duzeltme.json
  {"19": {"dx": 0.2, "dy": -0.1, "dz": 0.0, "yaw": -4, "pitch": 2, "hfov": 78}, ...}
  dx/dy/dz metre (Blender ekseni), yaw/pitch derece, hfov yatay açı derece (varsayılan 80).
Çıktı: <çıktı>/render_XX.png (fotoğrafın en-boy oranında, 1200 px en)
       Yan yana birleştirme için: python tools/blender/09_yan_yana.py <REPO> <çıktı>
"""
import bpy, csv, json, math, os, sys
from mathutils import Vector, Matrix, Euler

argv = sys.argv[sys.argv.index('--') + 1:]
ROOT, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1])
FOTOS = [int(x) for x in argv[2].split(',') if x]
def opt(name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default
SAMPLES = int(opt('--ornek', 96)); NIGHT = '--gece' in argv
EKLER = opt('--ekler', os.path.join(ROOT, 'build', 'web', '26092026', 'EKLER.glb'))
FIX = json.load(open(opt('--kamera'), encoding='utf-8')) if opt('--kamera') else {}
BOXES = json.load(open(opt('--sil'), encoding='utf-8')) if opt('--sil') else []
CAMS = {int(r['id']): r for r in csv.DictReader(open(os.path.join(ROOT, 'docs', 'blender-ajan', 'foto-kameralari.csv'), encoding='utf-8'))}
os.makedirs(OUT, exist_ok=True)
log = lambda *a: print('[kontrol]', *a, flush=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, 'build', 'bake', 'BUILDING-opt-v4-lm.glb'))
before = set(scene.objects)
arch_objects = set(before)
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, 'build', 'bake', 'INTERIOR-opt-v2.decoded.glb'))
base_objects = set(scene.objects) - before   # mobilya (INTERIOR)
if EKLER and os.path.exists(EKLER):
    if EKLER.endswith('.blend'):
        with bpy.data.libraries.load(EKLER, link=False) as (src, dst): dst.collections = [c for c in src.collections if c == 'EKLER']
        for c in dst.collections: scene.collection.children.link(c)
    else:
        bpy.ops.import_scene.gltf(filepath=EKLER)
    log('ekler yüklendi:', EKLER)

# eski mobilya: silme kutularının İÇİNDE kalan yüzler gizlenir (INTERIOR mesh'leri malzeme başına birleşik)
if BOXES:
    import bmesh
    for obj in [o for o in (base_objects | arch_objects) if o.type == 'MESH']:
        layer = 'mobilya' if obj in base_objects else 'mimari'
        boxes = [b for b in BOXES if b.get('katman', 'mobilya') == layer]
        if not boxes: continue
        mats = [s.material.name if s.material else '' for s in obj.material_slots]
        bm = bmesh.new(); bm.from_mesh(obj.data); mw = obj.matrix_world
        # Yerel duvar kutuları: büyük üçgenleri önce kutu düzlemlerinde böl.
        for box in boxes:
            if not box.get('kes'): continue
            selected = [f for f in bm.faces if not box.get('malzemeler') or mats[f.material_index] in box['malzemeler']]
            if not selected: continue
            inv = mw.inverted()
            for axis in range(3):
                for boundary in (box['min'][axis], box['max'][axis]):
                    point = Vector((0,0,0)); point[axis] = boundary
                    normal = Vector((0,0,0)); normal[axis] = 1
                    bmesh.ops.bisect_plane(bm, geom=list(bm.verts)+list(bm.edges)+list(bm.faces), dist=0.00001,
                        plane_co=inv @ point, plane_no=mw.to_3x3().transposed() @ normal,
                        clear_inner=False, clear_outer=False)
        def inside(face, b):
            if b.get('malzemeler') and (mats[face.material_index] if face.material_index < len(mats) else '') not in b['malzemeler']: return False
            c = mw @ face.calc_center_median()
            return all(b['min'][i] <= c[i] <= b['max'][i] for i in range(3))
        gone = [face for face in bm.faces if any(inside(face, b) for b in boxes)]
        if gone:
            bmesh.ops.delete(bm, geom=gone, context='FACES'); bm.to_mesh(obj.data)
            log('silindi', layer, obj.name, len(gone), 'yüz')
        bm.free()

# Fotoğraf albedoları: ortak kutu/UV uygulayıcısı; ışık ayarları korunur.
if opt('--dokular'):
    import importlib.util
    helper = os.path.join(os.path.dirname(__file__), 'foto_doku_uygula.py')
    module_spec = importlib.util.spec_from_file_location('foto_doku_uygula', helper)
    module = importlib.util.module_from_spec(module_spec); module_spec.loader.exec_module(module)
    module.uygula(list(scene.objects), opt('--dokular'))

# ışıklar: 28 armatür + güneş + gök
data = json.load(open(os.path.join(ROOT, 'tools', 'blender', 'isiklar.json'), encoding='utf-8'))
for rec in data['isiklar']:
    if rec['ad'].startswith(('Interior fill', 'Sun')) or rec['tur'] != 'AREA': continue
    L = bpy.data.lights.new(rec['ad'], 'AREA'); L.shape, L.size, L.size_y = rec['sekil'], rec['boyut'], rec['boyut_y']
    L.energy, L.color = rec['guc_W'] * (1.0 if NIGHT else .6), rec['renk']
    o = bpy.data.objects.new(rec['ad'], L); o.matrix_world = Matrix(rec['matris']); scene.collection.objects.link(o)
if not NIGHT:
    sun = bpy.data.objects.new('Gunes', bpy.data.lights.new('Gunes', 'SUN')); sun.data.energy = 1.0; sun.data.angle = math.radians(5)
    sun.rotation_euler = Vector((-0.0397, 0.2821, 0.9586)).to_track_quat('Z', 'Y').to_euler(); scene.collection.objects.link(sun)
world = bpy.data.worlds.new('Gok'); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']
if NIGHT: bg.inputs['Strength'].default_value = .02
else:
    sky = world.node_tree.nodes.new('ShaderNodeTexSky')
    try: sky.sky_type = 'NISHITA'; sky.sun_disc = False
    except Exception: pass
    world.node_tree.links.new(sky.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = .65

scene.render.engine = 'CYCLES'; cy = scene.cycles
cy.samples = SAMPLES; cy.use_denoising = True; cy.max_bounces = 8; cy.diffuse_bounces = 4
try: cy.denoiser = 'OPENIMAGEDENOISE'
except Exception: pass
prefs = bpy.context.preferences.addons['cycles'].preferences
for kind in ('OPTIX', 'CUDA'):
    try:
        prefs.compute_device_type = kind; prefs.get_devices()
        if any(d.type == kind for d in prefs.devices):
            for d in prefs.devices: d.use = d.type == kind
            cy.device = 'GPU'; break
    except Exception: pass
try: scene.view_settings.view_transform = 'AgX'
except TypeError: scene.view_settings.view_transform = 'Filmic'
scene.view_settings.look = 'None'

cam_data = bpy.data.cameras.new('Foto'); cam = bpy.data.objects.new('Foto', cam_data); scene.collection.objects.link(cam); scene.camera = cam
cam_data.sensor_fit = 'HORIZONTAL'; cam_data.clip_start = .05

def luma(path):
    import numpy as np
    img = bpy.data.images.load(path)
    px = np.empty(img.size[0] * img.size[1] * 4, np.float32); img.pixels.foreach_get(px)
    value, size = float(np.median(px.reshape(-1, 4)[::97, :3] @ np.array([.2126, .7152, .0722]))), tuple(img.size)
    bpy.data.images.remove(img)
    return value, size

for f in FOTOS:
    c = CAMS[f]; fx = FIX.get(str(f), {})
    eye = Vector((float(c['blender_x']) + fx.get('dx', 0), float(c['blender_y']) + fx.get('dy', 0), float(c['blender_z']) + fx.get('dz', 0)))
    look = Vector((float(c['bakis_x']), float(c['bakis_y']), 0)).normalized()
    yaw = math.atan2(look.y, look.x) + math.radians(fx.get('yaw', 0))
    pitch = math.radians(fx.get('pitch', 0))
    cam.location = eye
    cam.rotation_euler = Euler((math.pi / 2 + pitch, 0, yaw - math.pi / 2), 'XYZ')
    cam_data.angle = math.radians(fx.get('hfov', 80))
    target, (pw, ph) = luma(os.path.join(ROOT, c['dosya']))
    scene.render.resolution_x, scene.render.resolution_y = 1200, int(1200 * ph / pw)
    # 1) hızlı ölçüm karesi -> pozlama; 2) asıl kare
    scene.view_settings.exposure = 0; cy.samples = 8
    scene.render.resolution_percentage = 25
    probe = os.path.join(OUT, f'_olcum_{f:02d}.png'); scene.render.filepath = probe; bpy.ops.render.render(write_still=True)
    got, _ = luma(probe); os.remove(probe)
    scene.view_settings.exposure = max(-3, min(fx.get("max_exposure", 5), math.log2(max(target, .02) / max(got, .005)) * 1.6))
    cy.samples = SAMPLES; scene.render.resolution_percentage = 100
    scene.render.filepath = os.path.join(OUT, f'render_{f:02d}.png')
    bpy.ops.render.render(write_still=True)
    log('render', f, 'pozlama', round(scene.view_settings.exposure, 2), '->', scene.render.filepath)
log('TAMAM', len(FOTOS))
