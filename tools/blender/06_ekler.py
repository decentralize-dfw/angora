"""EKLER - modelde olmayan detaylar (perde, korniş, aplik, tablo, halı).

    blender -b --factory-startup --python tools/blender/06_ekler.py -- <REPO> <plan.json> [--kontrol]

Plan (ajan yazar, örnek: tools/blender/ekler-plan-ornek.json):
  "foto_yatay_aci": 80                      fotoğrafların yatay görüş açısı (derece)
  "perdeler": [{"pencere": "P01", "tur": "tul" | "fon" | "ikisi",
                "renk_tul": "#f3efe6", "renk_fon": "#b99b7a", "kornis": true}]
      pencere kimlikleri: tools/blender/pencereler.json (oda, kat, ölçü)
  "aplikler": [{"foto": 19, "u": 0.10, "v": 0.42, "renk": "#efe2c8"}]
      u, v: GERÇEK fotoğrafta aplikin göründüğü nokta (0..1, sol üstten).
      Betik o fotoğrafın kamerasından (docs/blender-ajan/foto-kameralari.csv)
      modele ışın atar, duvardaki noktaya yerleştirir. Ya da doğrudan:
      {"konum": [x, y, z], "normal": [nx, ny, 0]} (Blender koordinatı)
  "tablolar": [{"foto": 4, "u": 0.24, "v": 0.43, "en": 0.6, "boy": 0.8,
                "kirp": [x0, y0, x1, y1]}]
      kirp: gerçek fotoğrafta tablonun resmi (piksel, sol üst - sağ alt);
      tuvale o parça basılır.
  "halilar": [{"merkez": [x, y], "kat": 1, "en": 2.0, "boy": 3.0, "aci": 0, "renk": "#8a3b2a"}]

Çıktı: <REPO>/build/web/26092026/EKLER.glb  (+ --kontrol ile angora-bake/ekler-kontrol/foto_XX.png:
       plandaki her fotoğrafın kamerasından EEVEE ile hızlı görüntü, 960x720)
Sahne: build/bake/BUILDING-opt-v4-lm.glb + INTERIOR-opt-v2.decoded.glb (yalnız ışın
hedefi ve kontrol görüntüsü için; dışa aktarılmaz).
"""
import bpy, bmesh, csv, json, math, os, sys
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
ROOT = os.path.abspath(argv[0]); PLAN = json.load(open(argv[1], encoding='utf-8'))
CHECK = '--kontrol' in argv
FLOORS = [0, 3.0996, 6.3714, 9.4705]
WINDOWS = {w['id']: w for w in json.load(open(os.path.join(ROOT, 'tools', 'blender', 'pencereler.json'), encoding='utf-8'))['pencereler']}
CAMS = {int(r['id']): r for r in csv.DictReader(open(os.path.join(ROOT, 'docs', 'blender-ajan', 'foto-kameralari.csv'), encoding='utf-8'))}
HFOV = math.radians(float(PLAN.get('foto_yatay_aci', 80)))
log = lambda *a: print('[ekler]', *a, flush=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
for f in ('BUILDING-opt-v4-lm.glb', 'INTERIOR-opt-v2.decoded.glb'):
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, 'build', 'bake', f))
context_objects = set(scene.objects)
# cam ışını durdurmasın (ışın testinden çıkar; kontrol görüntüsünde görünür kalır)
glass = [o for o in context_objects if o.type == 'MESH' and any(
    s.material and any(k in s.material.name.lower() for k in ('glass', 'glazing')) for s in o.material_slots)]
for o in glass: o.hide_viewport = True
coll = bpy.data.collections.new('EKLER'); scene.collection.children.link(coll)
depsgraph = bpy.context.evaluated_depsgraph_get()

def cast(origin, direction, dist=30.0):
    hit, loc, normal, _i, obj, _m = scene.ray_cast(depsgraph, Vector(origin), Vector(direction).normalized(), distance=dist)
    return (loc, normal, obj) if hit else (None, None, None)

def material(name, hex_colour, rough=.8, metal=0., alpha=1., emit=0.):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    h = hex_colour.lstrip('#'); srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in srgb]
    b.inputs['Base Color'].default_value = (*lin, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
        try: m.surface_render_method = 'BLENDED'
        except AttributeError: m.blend_method = 'BLEND'
    if emit:
        (b.inputs.get('Emission Color') or b.inputs['Emission']).default_value = (*lin, 1)
        b.inputs['Emission Strength'].default_value = emit
    return m

def link(obj, mat=None):
    if mat: obj.data.materials.append(mat)
    coll.objects.link(obj); return obj

def mesh_from(name, verts, faces):
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in verts], [], faces); me.update()
    for p in me.polygons: p.use_smooth = True
    return bpy.data.objects.new(name, me)

def cylinder(name, a, b, r, seg=16):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=(b - a).length)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me)
    o.matrix_world = Matrix.Translation((a + b) / 2) @ (b - a).to_track_quat('Z', 'Y').to_matrix().to_4x4()
    return o

# ------------------------------------------------------------------ perdeler
def room_side(w):
    """Pencerenin odaya bakan yönü: iki yana 1,5 m ışın, uzak düşen yok; merkezden odaya kısa olan değil
    açık olan taraf dışarısıdır."""
    c = Vector(w['merkez']); n = Vector(w['normal'])
    front = cast(c + n * .05, n, 40)[0]; back = cast(c - n * .05, -n, 40)[0]
    df = (front - c).length if front else 99; db = (back - c).length if back else 99
    return -n if df > db else n          # dışarısı (uzak/açık) taraf değil, oda tarafı

def curtain_panel(name, base, t, n, width, z0, z1, folds_per_m, depth):
    cols = max(8, int(width * folds_per_m * 4))
    verts, faces = [], []
    for i in range(cols + 1):
        s = i / cols
        off = math.sin(s * width * folds_per_m * 2 * math.pi) * depth
        p = base + t * (s * width) + n * off
        verts += [(p.x, p.y, z0), (p.x, p.y, z1)]
        if i: faces.append((2 * i - 2, 2 * i, 2 * i + 1, 2 * i - 1))
    return mesh_from(name, verts, faces)

def add_curtain(spec):
    w = WINDOWS[spec['pencere']]; kind = spec.get('tur', 'ikisi')
    c = Vector(w['merkez']); n = room_side(w); t = Vector((-n.y, n.x, 0))
    floor_z = FLOORS[w['kat']]
    probe = c + n * .35
    ceil = cast(Vector((probe.x, probe.y, w['ust_z'] - .1)), (0, 0, 1), 4)[0]
    top = (ceil.z - .04) if ceil else w['ust_z'] + .3
    flo = cast(Vector((probe.x, probe.y, floor_z + 1.0)), (0, 0, -1), 3)[0]
    bottom = (flo.z + .015) if flo else floor_z + .015
    width = w['genislik']
    made = []
    if kind in ('tul', 'ikisi'):
        m = material(f'Tul {w["id"]}', spec.get('renk_tul', '#f3efe6'), rough=.9, alpha=.55)
        base = c + n * .10 - t * (width / 2 + .15)
        made.append(link(curtain_panel(f'Tul perde {w["id"]}', base, t, n, width + .3, bottom, top, 6, .018), m))
    if kind in ('fon', 'ikisi'):
        m = material(f'Fon {w["id"]}', spec.get('renk_fon', '#b99b7a'), rough=.95)
        pw = max(.35, width * .3)
        for side, start in (('sol', c + n * .16 - t * (width / 2 + .12)), ('sag', c + n * .16 + t * (width / 2 + .12 - pw))):
            made.append(link(curtain_panel(f'Fon perde {w["id"]} {side}', start, t, n, pw, bottom, top - .02, 4, .045), m))
    if spec.get('kornis', True):
        m = material('Korniş', spec.get('renk_kornis', '#8c7a63'), rough=.4, metal=.6)
        a = c + n * .14 - t * (width / 2 + .3); b = c + n * .14 + t * (width / 2 + .3)
        a.z = b.z = top + .01
        made.append(link(cylinder(f'Korniş {w["id"]}', a, b, .012), m))
    log('perde', w['id'], w['oda'], kind, f'{bottom:.2f}-{top:.2f} m')
    return made

# ------------------------------------------------------------------ fotoğraftan ışın
def photo_ray(foto, u, v):
    cam = CAMS[int(foto)]
    eye = Vector((float(cam['blender_x']), float(cam['blender_y']), float(cam['blender_z'])))
    fwd = Vector((float(cam['bakis_x']), float(cam['bakis_y']), float(cam['bakis_z']))).normalized()
    right = fwd.cross(Vector((0, 0, 1))).normalized(); up = right.cross(fwd)
    img = bpy.data.images.load(os.path.join(ROOT, cam['dosya']), check_existing=True)
    aspect = img.size[0] / img.size[1]
    tx = math.tan(HFOV / 2); ty = tx / aspect
    d = fwd + right * ((u * 2 - 1) * tx) + up * ((1 - v * 2) * ty)
    return eye, d.normalized(), img

def wall_point(spec):
    if 'konum' in spec:
        return Vector(spec['konum']), Vector(spec.get('normal', (0, 1, 0))).normalized()
    eye, d, _img = photo_ray(spec['foto'], spec['u'], spec['v'])
    loc, normal, obj = cast(eye, d, 25)
    if loc is None: raise ValueError(f'ışın bir yüzeye çarpmadı: {spec}')
    normal = Vector((normal.x, normal.y, 0)).normalized()
    if normal.dot(d) > 0: normal = -normal
    return loc, normal

def add_sconce(spec, i):
    p, n = wall_point(spec)
    if spec.get('yukseklik_m'): p.z = FLOORS[max(k for k, z in enumerate(FLOORS) if p.z >= z - .2)] + spec['yukseklik_m']
    metal = material('Aplik metal', spec.get('renk_metal', '#b08d57'), rough=.35, metal=.9)
    shade = material('Aplik abajur', spec.get('renk', '#efe2c8'), rough=.9, alpha=.85)
    bulb = material('Aplik ampul', '#ffd9a0', rough=.5, emit=6)
    made = [link(cylinder(f'Aplik {i} taban', p + n * .001, p + n * .02, .055), metal),
            link(cylinder(f'Aplik {i} kol', p + n * .02, p + n * .13 + Vector((0, 0, .06)), .008), metal)]
    centre = p + n * .15 + Vector((0, 0, .08))
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=24, radius1=.085, radius2=.055, depth=.15)
    me = bpy.data.meshes.new(f'Aplik {i} abajur'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(me.name, me); o.location = centre; made.append(link(o, shade))
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=.025)
    me = bpy.data.meshes.new(f'Aplik {i} ampul'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(me.name, me); o.location = centre - Vector((0, 0, .02)); made.append(link(o, bulb))
    log('aplik', i, [round(x, 2) for x in p])
    return made

def add_painting(spec, i):
    p, n = wall_point(spec)
    t = Vector((-n.y, n.x, 0)); w, h = spec.get('en', .6), spec.get('boy', .8)
    frame = material('Tablo çerçeve', spec.get('renk_cerceve', '#5a3f28'), rough=.5)
    canvas = bpy.data.materials.new(f'Tablo {i}'); canvas.use_nodes = True
    bsdf = canvas.node_tree.nodes['Principled BSDF']; bsdf.inputs['Roughness'].default_value = .7
    if spec.get('kirp') and spec.get('foto'):
        import numpy as np
        src = bpy.data.images.load(os.path.join(ROOT, CAMS[int(spec['foto'])]['dosya']), check_existing=True)
        W, H = src.size; px = np.empty(W * H * 4, np.float32); src.pixels.foreach_get(px)
        px = px.reshape(H, W, 4)[::-1]                              # üstten başlayan satırlar
        x0, y0, x1, y1 = (int(v) for v in spec['kirp'])
        part = np.ascontiguousarray(px[y0:y1, x0:x1][::-1])        # Blender alttan başlar
        img = bpy.data.images.new(f'Tablo {i}', part.shape[1], part.shape[0]); img.pixels.foreach_set(part.reshape(-1)); img.pack()
        tex = canvas.node_tree.nodes.new('ShaderNodeTexImage'); tex.image = img
        canvas.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    else:
        bsdf.inputs['Base Color'].default_value = (.4, .3, .25, 1)
    rot = Matrix((t, Vector((0, 0, 1)), n)).transposed().to_4x4()
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    me = bpy.data.meshes.new(f'Tablo {i} çerçeve'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(me.name, me); o.matrix_world = Matrix.Translation(p + n * .015) @ rot @ Matrix.Diagonal((w + .08, h + .08, .03, 1))
    made = [link(o, frame)]
    q = p + n * .031
    verts = [q - t * w / 2 - Vector((0, 0, h / 2)), q + t * w / 2 - Vector((0, 0, h / 2)), q + t * w / 2 + Vector((0, 0, h / 2)), q - t * w / 2 + Vector((0, 0, h / 2))]
    o = mesh_from(f'Tablo {i} tuval', verts, [(0, 1, 2, 3)])
    uv = o.data.uv_layers.new(name='UVMap')
    for li, (a, b) in zip(range(4), ((0, 0), (1, 0), (1, 1), (0, 1))): uv.data[li].uv = (a, b)
    made.append(link(o, canvas))
    log('tablo', i, [round(x, 2) for x in p])
    return made

def add_rug(spec, i):
    x, y = spec['merkez']; z0 = FLOORS[spec['kat']]
    hit = cast(Vector((x, y, z0 + 1.2)), (0, 0, -1), 3)[0]
    z = (hit.z if hit else z0) + .006
    a = math.radians(spec.get('aci', 0)); w, h = spec['en'] / 2, spec['boy'] / 2
    ca, sa = math.cos(a), math.sin(a)
    corners = [(x + ca * dx - sa * dy, y + sa * dx + ca * dy, z) for dx, dy in ((-w, -h), (w, -h), (w, h), (-w, h))]
    m = material(f'Halı {i}', spec.get('renk', '#8a3b2a'), rough=.95)
    log('halı', i, [x, y, round(z, 2)])
    return [link(mesh_from(f'Halı {i}', corners, [(0, 1, 2, 3)]), m)]

made = []
for s in PLAN.get('perdeler', []): made += add_curtain(s)
for i, s in enumerate(PLAN.get('aplikler', []), 1): made += add_sconce(s, i)
for i, s in enumerate(PLAN.get('tablolar', []), 1): made += add_painting(s, i)
for i, s in enumerate(PLAN.get('halilar', []), 1): made += add_rug(s, i)

out = os.path.join(ROOT, 'build', 'web', '26092026', 'EKLER.glb')
bpy.ops.object.select_all(action='DESELECT')
for o in made: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_apply=True)
log(f'EKLER.glb: {len(made)} nesne, {os.path.getsize(out) / 1e6:.2f} MB -> {out}')

if CHECK:
    # kontrol görüntüleri: plandaki fotoğrafların kameralarından, EEVEE, düşük örnek
    fotos = sorted({int(s['foto']) for key in ('aplikler', 'tablolar') for s in PLAN.get(key, []) if 'foto' in s}
                   | {int(f) for f in PLAN.get('kontrol_fotolari', [])})
    for o in glass: o.hide_render = True
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items} else 'BLENDER_EEVEE'
    scene.render.resolution_x, scene.render.resolution_y = 960, 720
    world = bpy.data.worlds.new('K'); scene.world = world; world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.5
    sun = bpy.data.objects.new('Gunes', bpy.data.lights.new('Gunes', 'SUN')); sun.data.energy = 3
    sun.rotation_euler = (math.radians(40), 0, math.radians(30)); scene.collection.objects.link(sun)
    cam_data = bpy.data.cameras.new('Foto'); cam_obj = bpy.data.objects.new('Foto', cam_data); scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    os.makedirs(os.path.join(ROOT, 'angora-bake', 'ekler-kontrol'), exist_ok=True)
    for f in fotos:
        eye, d, img = photo_ray(f, .5, .5)
        cam_data.sensor_fit = 'HORIZONTAL'; cam_data.angle = HFOV
        scene.render.resolution_y = int(960 * img.size[1] / img.size[0])
        cam_obj.location = eye; cam_obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = os.path.join(ROOT, 'angora-bake', 'ekler-kontrol', f'foto_{f:02d}.png')
        bpy.ops.render.render(write_still=True)
        log('kontrol', scene.render.filepath)
log('TAMAM')
