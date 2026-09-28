"""TUR 1 - Envanter. Salt okunur: render yok, bake yok, dosya KAYDEDİLMEZ.

    blender -b <villa>.blend --python tools/blender/01_envanter.py -- <repo_kökü>

Çıktı: <repo_kökü>/angora-bake/rapor/01_envanter.json ve ekrana özet.
Özet satırlarını olduğu gibi rapora yapıştır.

Ne ölçer:
  - Blender sürümü, GPU aygıtları (Cycles)
  - her nesne: tür, üçgen, malzemeler, UV kanalları, dünya sınır kutusu,
    görünürlük, modifier'lar
  - ışıklar (tür, güç, renk, boyut, konum, yön) ve ışık yayan malzemeler
  - dünya (World) düğümleri
  - malzeme başına üçgen + sınır kutusu, web modelleriyle
    (tools/blender/web-referans.json) karşılaştırma
"""
import bpy, json, re, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ROOT = os.path.abspath(argv[0] if argv else os.getcwd())
OUT = os.path.join(ROOT, 'angora-bake', 'rapor')
os.makedirs(OUT, exist_ok=True)
REF = json.load(open(os.path.join(ROOT, 'tools', 'blender', 'web-referans.json'), encoding='utf-8'))

def r(v, n=3): return round(float(v), n)
def base(name): return re.sub(r'\.\d{3}$', '', name).strip()

# ---- sistem
prefs = bpy.context.preferences.addons['cycles'].preferences
devices = []
for kind in ('OPTIX', 'CUDA', 'HIP', 'METAL', 'ONEAPI'):
    try:
        prefs.compute_device_type = kind
        prefs.get_devices()
        found = [d.name for d in prefs.devices if d.type == kind]
        if found: devices.append({'tur': kind, 'aygitlar': found})
    except Exception:
        pass
scene = bpy.context.scene
info = {'blender': bpy.app.version_string, 'dosya': bpy.data.filepath, 'gpu': devices,
        'birim': scene.unit_settings.system, 'olcek': scene.unit_settings.scale_length,
        'motor': scene.render.engine, 'sahneler': [s.name for s in bpy.data.scenes]}

# ---- nesneler
depsgraph = bpy.context.evaluated_depsgraph_get()
objects, by_mat = [], {}
for obj in scene.objects:
    rec = {'ad': obj.name, 'tur': obj.type, 'koleksiyon': [c.name for c in obj.users_collection],
           'render_gizli': obj.hide_render, 'gorunum_gizli': obj.hide_get(),
           'konum': [r(v) for v in obj.matrix_world.translation]}
    if obj.type == 'MESH':
        me = obj.data
        tris = sum(len(p.vertices) - 2 for p in me.polygons)
        corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
        rec.update({'veri': me.name, 'ucgen': tris, 'uv': [u.name for u in me.uv_layers],
                    'malzeme': [s.material.name if s.material else None for s in obj.material_slots],
                    'modifier': [f'{m.type}:{m.name}' for m in obj.modifiers],
                    'min': [r(min(c[i] for c in corners)) for i in range(3)],
                    'max': [r(max(c[i] for c in corners)) for i in range(3)]})
        # malzeme başına üçgen (değerlendirilmiş mesh: modifier'lar dahil)
        try:
            ev = obj.evaluated_get(depsgraph).to_mesh()
            mats = [s.material.name if s.material else '(yok)' for s in obj.material_slots] or ['(yok)']
            counts = {}
            for p in ev.polygons:
                name = mats[p.material_index] if p.material_index < len(mats) else '(yok)'
                counts[name] = counts.get(name, 0) + len(p.vertices) - 2
            rec['ucgen_modifierli'] = sum(counts.values())
            if not obj.hide_render:
                for name, t in counts.items():
                    m = by_mat.setdefault(name, {'ucgen': 0, 'min': [1e9] * 3, 'max': [-1e9] * 3, 'nesneler': 0})
                    m['ucgen'] += t; m['nesneler'] += 1
                    for i in range(3):
                        m['min'][i] = min(m['min'][i], rec['min'][i]); m['max'][i] = max(m['max'][i], rec['max'][i])
            obj.evaluated_get(depsgraph).to_mesh_clear()
        except Exception as e:
            rec['hata'] = str(e)
    elif obj.type == 'LIGHT':
        L = obj.data
        rec.update({'isik_turu': L.type, 'guc_W': r(L.energy), 'renk': [r(c) for c in L.color],
                    'yon': [r(v) for v in (obj.matrix_world.to_3x3() @ Vector((0, 0, -1))).normalized()],
                    'boyut': r(getattr(L, 'shadow_soft_size', 0)),
                    'spot_aci_derece': r(L.spot_size * 57.2958) if L.type == 'SPOT' else None,
                    'alan_boyut': [r(L.size), r(getattr(L, 'size_y', L.size))] if L.type == 'AREA' else None,
                    'aci_derece': r(L.angle * 57.2958) if L.type == 'SUN' else None})
    objects.append(rec)

# ---- ışık yayan malzemeler
emissive = []
for mat in bpy.data.materials:
    if not mat.use_nodes: continue
    for n in mat.node_tree.nodes:
        s = None
        if n.type == 'BSDF_PRINCIPLED':
            inp = n.inputs.get('Emission Strength')
            col = n.inputs.get('Emission Color') or n.inputs.get('Emission')
            if inp and inp.default_value > 0 and col and max(col.default_value[:3]) > 0: s = inp.default_value
        elif n.type == 'EMISSION':
            s = n.inputs['Strength'].default_value
        if s: emissive.append({'malzeme': mat.name, 'dugum': n.type, 'guc': r(s), 'kullanici': mat.users})

# ---- dünya
world = {}
if scene.world and scene.world.use_nodes:
    for n in scene.world.node_tree.nodes:
        world[n.name] = {'tur': n.type, **{i.name: (r(i.default_value) if isinstance(i.default_value, float)
                          else [r(v) for v in i.default_value] if hasattr(i.default_value, '__len__') else None)
                          for i in n.inputs if hasattr(i, 'default_value')}}
        if n.type == 'TEX_SKY': world[n.name]['sky_type'] = n.sky_type
        if n.type == 'TEX_ENVIRONMENT' and n.image: world[n.name]['hdri'] = n.image.filepath

# ---- web ile karşılaştırma (malzeme adı .001 ekleri atılarak eşlenir)
blend_by_base = {}
for name, m in by_mat.items():
    b = blend_by_base.setdefault(base(name), {'ucgen': 0, 'min': [1e9] * 3, 'max': [-1e9] * 3, 'adlar': []})
    b['ucgen'] += m['ucgen']; b['adlar'].append(name)
    for i in range(3): b['min'][i] = min(b['min'][i], m['min'][i]); b['max'][i] = max(b['max'][i], m['max'][i])
compare = []
for fname, f in REF['dosyalar'].items():
    for name, w in f['malzemeler'].items():
        b = blend_by_base.get(base(name))
        row = {'web_dosya': fname, 'malzeme': name, 'web_ucgen': int(w['ucgen'])}
        if b:
            row['blend_ucgen'] = b['ucgen']
            row['oran'] = r(b['ucgen'] / max(w['ucgen'], 1), 3)
            row['kutu_sapma_m'] = r(max(max(abs(b['min'][i] - w['min'][i]), abs(b['max'][i] - w['max'][i])) for i in range(3)), 3)
        else:
            row['blend_ucgen'] = None
        compare.append(row)

mesh_objs = [o for o in objects if o['tur'] == 'MESH']
lights = [o for o in objects if o['tur'] == 'LIGHT']
summary = {
    'nesne': len(objects), 'mesh': len(mesh_objs), 'isik': len(lights), 'isik_yayan_malzeme': len(emissive),
    'toplam_ucgen_render': sum(o.get('ucgen_modifierli', o.get('ucgen', 0)) for o in mesh_objs if not o['render_gizli']),
    'web_toplam_ucgen': sum(int(f['toplam_ucgen']) for f in REF['dosyalar'].values()),
    'eslesen_malzeme': sum(1 for c in compare if c['blend_ucgen'] is not None),
    'web_malzeme': len(compare),
    'ucgeni_tutan_malzeme_(±%1)': sum(1 for c in compare if c.get('oran') and abs(c['oran'] - 1) <= 0.01),
    'konumu_tutan_malzeme_(<2cm)': sum(1 for c in compare if c.get('kutu_sapma_m') is not None and c['kutu_sapma_m'] < 0.02),
}
report = {'sistem': info, 'ozet': summary, 'web_karsilastirma': compare, 'isiklar': lights,
          'isik_yayan_malzemeler': emissive, 'dunya': world, 'nesneler': objects,
          'malzeme_ucgen': {k: {**v, 'min': [r(x) for x in v['min']], 'max': [r(x) for x in v['max']]} for k, v in by_mat.items()}}
path = os.path.join(OUT, '01_envanter.json')
json.dump(report, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

print('\n===== ANGORA TUR 1 ÖZET =====')
print('blender', info['blender'], '| gpu', devices or 'YOK')
for k, v in summary.items(): print(f'{k}: {v}')
print('\n-- web karşılaştırma (malzeme | web üçgen | blend üçgen | oran | kutu sapması m)')
for c in compare:
    print(f"{c['web_dosya'][:8]} | {c['malzeme'][:48]:48} | {c['web_ucgen']:>7} | {c['blend_ucgen'] if c['blend_ucgen'] is not None else 'YOK':>7} | {c.get('oran', '-')} | {c.get('kutu_sapma_m', '-')}")
print('\n-- ışıklar (ilk 60)')
for l in lights[:60]:
    print(f"{l['ad'][:40]:40} {l['isik_turu']:5} {l['guc_W']:>8}W renk{l['renk']} konum{l['konum']} gizli={l['render_gizli']}")
print('\n-- ışık yayan malzemeler')
for e in emissive: print(e)
print('\n-- dünya', json.dumps(world, ensure_ascii=False)[:1500])
print('\nJSON:', path)
print('===== SON =====')
