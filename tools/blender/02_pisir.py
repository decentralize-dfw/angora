"""Angora ışık pişirme - sahneyi KURAR ve PİŞİRİR. Ajan yalnız bunu çalıştırır.

    blender -b --factory-startup --python tools/blender/02_pisir.py -- <REPO> [seçenekler]

Seçenekler:
    --test            her atlas 1/8 çözünürlük, 16 örnek; çıktı angora-bake/test/
    --isik A,B        yalnız bu ışık durumları   (gok,gunes_09,gunes_13,gunes_17,gece)
    --atlas A,B       yalnız bu atlaslar         (duvar,zemin,cephe,bahce)
    --ornek N         örnek sayısı (varsayılan 512)
    --cihaz GPU|CPU   varsayılan GPU (OPTIX, yoksa CUDA)
    --yeniden         var olan çıktıların üstüne yaz (varsayılan: atla -> kaldığı yerden sürer)
    --tur10           Tur 10 sahnesi: build/bake/tur10/lightmap-uv.json (dosya listesi ve
                      ışıklar oradan: BUILDING-opt-v6-lm + GARDEN-opt-v2-lm + INTERIOR-opt-v3,
                      tools/blender/isiklar-v2.json); çıktı angora-bake/tur10/

Sahne (web tarafının hazırladığı dosyalardan, repoda build/bake/):
    BUILDING-opt-v4-lm.glb, GARDEN-opt-v2-lm.glb  - pişen yüzeyler, lightmap UV'li
    INTERIOR-opt-v2.decoded.glb                   - mobilya: yalnız gölge/sekme verir
    tools/blender/isiklar.json                    - .blend'deki 29 armatür ışığı

Işık durumları (değerler NORMALİZE; parlaklık ayarı web tarafında yapılır):
    gok       gök ışığı: yukarı yarıküre parlaklığı 1, aşağı 0.3; güneş yok.
              doğrudan + dolaylı (pencereden giren gök ışığı ve sekmesi).
    gunes_HH  yalnız güneş (şiddet 1, 21 Haziran HH:00, gerçek kuzey), gök kara.
              YALNIZ DOLAYLI - doğrudan güneşi web canlı çiziyor.
    gece      yalnız armatürler (gerçek güçler), gök kara. doğrudan + dolaylı.
Hepsi Diffuse bake, Color KAPALI (albedo'yu web ekler).

Çıktılar (<REPO>/angora-bake/ ya da --test ile angora-bake/test/):
    isik/<atlas>_<isik>.exr         32 bit float, doğrusal
    onizleme/<atlas>_<isik>.png     1024 px, göz kontrolü için
    sureler.json                    her pişirmenin süresi ve ayarları
"""
import bpy, json, math, os, sys, time
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ROOT = os.path.abspath(argv[0]) if argv and not argv[0].startswith('--') else os.getcwd()
def opt(name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default
TEST = '--test' in argv
REDO = '--yeniden' in argv
SAMPLES = 16 if TEST else int(opt('--ornek', 512))
DEVICE = opt('--cihaz', 'GPU').upper()
LIGHTS_ALL = ['gok', 'gunes_09', 'gunes_13', 'gunes_17', 'gece']
LIGHTS = opt('--isik', ','.join(LIGHTS_ALL)).split(',')
TUR10 = '--tur10' in argv
BAKE_DIR = os.path.join(ROOT, 'build', 'bake')
OUT = os.path.join(ROOT, 'angora-bake', *(['tur10'] if TUR10 else []), 'test' if TEST else '')
SPEC = json.load(open(os.path.join(BAKE_DIR, 'tur10' if TUR10 else '', 'lightmap-uv.json'), encoding='utf-8'))
SCENE_FILES = SPEC.get('sahne', ['BUILDING-opt-v4-lm.glb', 'GARDEN-opt-v2-lm.glb', 'INTERIOR-opt-v2.decoded.glb'])
LIGHTS_FILE = os.path.join(ROOT, SPEC.get('isiklar', 'tools/blender/isiklar.json'))
ATLASES = opt('--atlas', ','.join(SPEC['atlaslar'])).split(',')
for name in LIGHTS: assert name in LIGHTS_ALL, f'bilinmeyen ışık durumu: {name}'
for name in ATLASES: assert name in SPEC['atlaslar'], f'bilinmeyen atlas: {name}'

# 21 Haziran, Ankara, yerel saat; Blender koordinatında güneşe DOĞRU birim
# vektör, model gerçek kuzeye göre 164,25° dönük (web: daylight.js TRUE_NORTH_ROTATION)
SUN = {'gunes_09': (-0.7481, -0.2008, 0.6324), 'gunes_13': (-0.0397, 0.2821, 0.9586),
       'gunes_17': (0.7913, 0.1891, 0.5815)}
SKIP_LIGHTS = ('Interior fill', 'Sun')      # .blend'deki sahte dolgu ışıkları ve boş güneş

def log(*a): print('[angora]', *a, flush=True)

# ---------------------------------------------------------------- sahne
def build_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    for f in SCENE_FILES:
        path = os.path.join(BAKE_DIR, f)
        assert os.path.exists(path), f'eksik dosya: {path}'
        bpy.ops.import_scene.gltf(filepath=path)
    # pişen nesneler: node extras -> nesne özelliği "lightmap"
    targets = {}
    by_node = {n: (a, d['texcoord']) for a, e in SPEC['atlaslar'].items() for n, d in e['dugumler'].items()}
    for obj in scene.objects:
        if obj.type != 'MESH': continue
        info = obj.get('lightmap')
        atlas, channel = (info['atlas'], int(info['texcoord'])) if info else by_node.get(obj.name, (None, None))
        if atlas is None: continue
        me = obj.data
        assert len(me.uv_layers) > channel, f'{obj.name}: UV kanalı {channel} yok'
        render_uv = me.uv_layers[0].name
        me.uv_layers[channel].name = 'Lightmap'
        me.uv_layers.active = me.uv_layers['Lightmap']          # pişirme bu kanala
        me.uv_layers[render_uv].active_render = True            # dokular eski kanaldan
        targets.setdefault(atlas, []).append(obj)
    missing = {a: len(e['dugumler']) - len(targets.get(a, [])) for a, e in SPEC['atlaslar'].items()}
    assert not any(missing.values()), f'eşlenemeyen pişirme nesneleri: {missing}'
    # malzemeler: cam/su ışığı geçirsin (gizle), ışık yayan yüzey kapalı (armatürler ayrı)
    hidden = []
    for obj in scene.objects:
        if obj.type != 'MESH': continue
        for slot in obj.material_slots:
            mat = slot.material
            if not mat or not mat.node_tree: continue
            for n in mat.node_tree.nodes:
                if n.type != 'BSDF_PRINCIPLED': continue
                t = n.inputs.get('Transmission Weight') or n.inputs.get('Transmission')
                if t and not t.is_linked and t.default_value > 0.5 and obj.name not in hidden:
                    hidden.append(obj.name)
                e = n.inputs.get('Emission Strength')
                if e: e.default_value = 0.0
    for name in hidden: scene.objects[name].hide_render = True
    # her pişen nesneye kendi malzeme kopyası + hedef doku düğümü
    for atlas, objs in targets.items():
        for obj in objs:
            for slot in obj.material_slots:
                if slot.material and slot.material.users > 1: slot.material = slot.material.copy()
    # ışıklar
    coll = bpy.data.collections.new('ARMATURLER'); scene.collection.children.link(coll)
    data = json.load(open(LIGHTS_FILE, encoding='utf-8'))
    lamps = []
    from mathutils import Matrix
    # iki biçim: isiklar.json (guc_W, matris) ve Tur 10 isiklar-v2.json (guc, matris_blender; AREA + POINT)
    for rec in data['isiklar']:
        if rec['ad'].startswith(SKIP_LIGHTS) or rec['tur'] not in ('AREA', 'POINT'): continue
        L = bpy.data.lights.new(rec['ad'], rec['tur'])
        if rec['tur'] == 'AREA':
            L.shape, L.size, L.size_y = rec.get('sekil', 'DISK'), rec.get('boyut', 0.3), rec.get('boyut_y', rec.get('boyut', 0.3))
            if 'yayilma' in rec: L.spread = rec['yayilma']
        else:
            L.shadow_soft_size = rec.get('yaricap', 0.05)
        L.energy, L.color = rec.get('guc_W', rec.get('guc')), rec['renk']
        o = bpy.data.objects.new(rec['ad'], L); coll.objects.link(o)
        o.matrix_world = Matrix(rec.get('matris') or rec['matris_blender'])
        lamps.append(o)
    sun_data = bpy.data.lights.new('Gunes', 'SUN'); sun_data.energy = 1.0; sun_data.angle = math.radians(0.53)
    sun = bpy.data.objects.new('Gunes', sun_data); scene.collection.objects.link(sun)
    # dünya: yukarı yarıküre 1, aşağı 0.3 (zemin yerine), ufukta yumuşak geçiş
    world = bpy.data.worlds.new('Gok'); scene.world = world
    world.use_nodes = True
    nt = world.node_tree; nt.nodes.clear()
    coord = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    ramp = nt.nodes.new('ShaderNodeMapRange'); bg = nt.nodes.new('ShaderNodeBackground'); out = nt.nodes.new('ShaderNodeOutputWorld')
    ramp.inputs['From Min'].default_value, ramp.inputs['From Max'].default_value = -0.05, 0.05
    ramp.inputs['To Min'].default_value, ramp.inputs['To Max'].default_value = 0.3, 1.0
    nt.links.new(coord.outputs['Generated'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], ramp.inputs['Value'])
    nt.links.new(ramp.outputs['Result'], bg.inputs['Strength']); nt.links.new(bg.outputs[0], out.inputs[0])
    bg.inputs['Color'].default_value = (1, 1, 1, 1)
    # Cycles
    scene.render.engine = 'CYCLES'
    cy = scene.cycles
    cy.samples = SAMPLES
    cy.max_bounces, cy.diffuse_bounces, cy.glossy_bounces, cy.transmission_bounces = 8, 6, 2, 4
    cy.caustics_reflective = cy.caustics_refractive = False
    cy.use_denoising = False
    if DEVICE == 'GPU':
        prefs = bpy.context.preferences.addons['cycles'].preferences
        chosen = None
        for kind in ('OPTIX', 'CUDA'):
            try:
                prefs.compute_device_type = kind; prefs.get_devices()
                gpus = [d for d in prefs.devices if d.type == kind]
                if gpus:
                    for d in prefs.devices: d.use = d.type == kind
                    chosen = kind; break
            except Exception:
                pass
        assert chosen, 'GPU bulunamadı (--cihaz CPU ile çalıştırılabilir)'
        cy.device = 'GPU'
        log('cihaz', chosen, [d.name for d in prefs.devices if d.use])
    else:
        cy.device = 'CPU'
    log('sahne hazır:', {a: len(o) for a, o in targets.items()}, 'gizlenen cam/su:', hidden, 'armatür:', len(lamps))
    return scene, targets, lamps, sun, bg

def set_lighting(state, lamps, sun, bg):
    is_sun = state.startswith('gunes_')
    for o in lamps: o.hide_render = state != 'gece'
    sun.hide_render = not is_sun
    if is_sun:
        d = Vector(SUN[state]).normalized()
        sun.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()    # ışık -Z yönünde gider
    bg.inputs['Strength'].default_value = 1.0
    ramp_on = state == 'gok'
    # gök yalnız "gok" durumunda; diğerlerinde kara (Strength girişi bağlı: bağlantıyı kopar/bağla)
    nt = bpy.context.scene.world.node_tree
    link = next((l for l in nt.links if l.to_socket == bg.inputs['Strength']), None)
    if ramp_on and not link:
        nt.links.new(nt.nodes['Map Range'].outputs['Result'], bg.inputs['Strength'])
    elif not ramp_on and link:
        nt.links.remove(link)
    if not ramp_on: bg.inputs['Strength'].default_value = 0.0
    return {'DIRECT', 'INDIRECT'} if state in ('gok', 'gece') else {'INDIRECT'}

def preview(img, path):
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)[:, :, :3]
    step = max(1, w // 1024)
    small = px[::step, ::step]
    lum = np.percentile(small[small.sum(axis=2) > 0].mean(axis=1), 99) if (small.sum(axis=2) > 0).any() else 1.0
    tone = np.clip(small / max(lum, 1e-6), 0, 1) ** (1 / 2.2)
    rgba = np.concatenate([tone, np.ones(tone.shape[:2] + (1,), np.float32)], axis=2)
    p = bpy.data.images.new('onizleme', tone.shape[1], tone.shape[0], alpha=False)
    p.pixels.foreach_set(rgba.reshape(-1)); p.filepath_raw = path; p.file_format = 'PNG'; p.save()
    bpy.data.images.remove(p)
    nonzero = float((px.sum(axis=2) > 0).mean())
    return {'dolu_piksel': round(nonzero, 3), 'ortalama': round(float(px.mean()), 4), 'p99': round(float(lum), 4)}

def bake(scene, atlas, objs, state, pass_filter):
    size = SPEC['atlaslar'][atlas]['boyut'] // (8 if TEST else 1)
    exr = os.path.join(OUT, 'isik', f'{atlas}_{state}.exr')
    if os.path.exists(exr) and not REDO:
        log('var, atlanıyor:', exr); return None
    img = bpy.data.images.new(f'{atlas}_{state}', size, size, alpha=False, float_buffer=True)
    img.colorspace_settings.name = 'Non-Color'
    for obj in objs:
        for slot in obj.material_slots:
            nt = slot.material.node_tree
            node = nt.nodes.get('LM_TARGET') or nt.nodes.new('ShaderNodeTexImage')
            node.name = 'LM_TARGET'; node.image = img
            nt.nodes.active = node
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objs: obj.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    b = scene.render.bake
    b.margin = max(2, 8 * size // 4096); b.margin_type = 'EXTEND'; b.use_clear = True
    b.use_selected_to_active = False; b.target = 'IMAGE_TEXTURES'
    t0 = time.time()
    bpy.ops.object.bake(type='DIFFUSE', pass_filter=pass_filter, margin=b.margin, use_clear=True)
    dt = time.time() - t0
    os.makedirs(os.path.dirname(exr), exist_ok=True)
    img.filepath_raw = exr; img.file_format = 'OPEN_EXR'
    scene.render.image_settings.file_format = 'OPEN_EXR'
    scene.render.image_settings.color_depth = '32'
    scene.render.image_settings.exr_codec = 'ZIP'
    img.save_render(exr, scene=scene)
    os.makedirs(os.path.join(OUT, 'onizleme'), exist_ok=True)
    stats = preview(img, os.path.join(OUT, 'onizleme', f'{atlas}_{state}.png'))
    bpy.data.images.remove(img)
    rec = {'atlas': atlas, 'isik': state, 'boyut': size, 'ornek': SAMPLES, 'gecis': sorted(pass_filter),
           'sure_sn': round(dt, 1), **stats}
    log('bitti', json.dumps(rec, ensure_ascii=False))
    return rec

def main():
    t0 = time.time()
    scene, targets, lamps, sun, bg = build_scene()
    os.makedirs(OUT, exist_ok=True)
    report_path = os.path.join(OUT, 'sureler.json')
    report = json.load(open(report_path, encoding='utf-8')) if os.path.exists(report_path) else []
    for state in LIGHTS:
        pass_filter = set_lighting(state, lamps, sun, bg)
        for atlas in ATLASES:
            rec = bake(scene, atlas, targets[atlas], state, pass_filter)
            if rec:
                report.append(rec)
                json.dump(report, open(report_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    log(f'TAMAM: {len(LIGHTS)} ışık x {len(ATLASES)} atlas, toplam {time.time() - t0:.0f} sn, çıktı {OUT}')

main()
