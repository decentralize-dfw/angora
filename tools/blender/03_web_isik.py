"""Pişmiş ışık haritalarını (Blender EXR) web'e hazırlar.

    <bpy'li python> tools/blender/03_web_isik.py <isik klasörü>
      (bpy + numpy + pillow; Blender'ın kendi python'u da olur)

Girdi : <isik>/<atlas>_<durum>.exr    (02_pisir.py çıktısı, 20 dosya)
        build/bake/*-lm.glb           (UV kapsama maskesi için)
Çıktı : build/bake/web-isik/<atlas>_<durum>.png  (8 bit, kodlanmış)
        build/bake/web-isik/lightmaps.json      (ölçekler)
        -> tools/batch-delivery/make-lightmaps-ktx2.mjs bunları KTX2'ye çevirir

Adımlar, her harita için:
  1. OIDN gürültü temizleme (Blender compositor, HDR)
  2. kapsama maskesi: lightmap UV üçgenleri harita çözünürlüğünde çizilir
  3. maske ağırlıklı alan ortalamasıyla web boyutuna küçültme
  4. push-pull doldurma: adaların DIŞI en yakın ada ışığıyla dolar - mipmap ve
     bilinear süzme ada kenarına kara sızdırmasın
  5. kodlama: v = sqrt(x / S), S = maskeli piksellerin %99,9'u; web x = v² · S
"""
import bpy, json, os, sys
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lightmap_uv import read_glb, accessor

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SRC = os.path.abspath(sys.argv[-1])
OUT = os.path.join(ROOT, 'build', 'bake', 'web-isik')
SPEC = json.load(open(os.path.join(ROOT, 'build', 'bake', 'lightmap-uv.json'), encoding='utf-8'))
STATES = ['gok', 'gunes_09', 'gunes_13', 'gunes_17', 'gece']
# web boyutu: iç mekân gök/gece 2048, güneş sekmesi (düşük frekans) 1024; dış 1024
WEB_SIZE = {('duvar', 'gok'): 2048, ('duvar', 'gece'): 2048, ('zemin', 'gok'): 2048, ('zemin', 'gece'): 2048}
DEFAULT_SIZE = 1024

def coverage(atlas, size):
    """Lightmap UV üçgenlerinin kapsama maskesi (glTF uv: v aşağı)."""
    entry = SPEC['atlaslar'][atlas]
    gltf, binary = read_glb(os.path.join(ROOT, 'build', 'bake', entry['dosya'] + '-lm.glb'))
    img = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(img)
    for node in gltf['nodes']:
        info = node.get('extras', {}).get('lightmap')
        if not info or info['atlas'] != atlas: continue
        prim = gltf['meshes'][node['mesh']]['primitives'][0]
        uv = accessor(gltf, binary, prim['attributes'][f"TEXCOORD_{info['texcoord']}"]) * size
        idx = accessor(gltf, binary, prim['indices']).reshape(-1, 3)
        for tri in uv[idx]:
            draw.polygon([tuple(p) for p in tri], fill=255, outline=255)
    return np.asarray(img, dtype=np.float32) / 255.0      # satır 0 = v 0 (üst)

def denoise(path):
    sc = bpy.context.scene
    img = bpy.data.images.load(path)
    w, h = img.size
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = w, h, 100
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.view_settings.view_transform = 'Standard'
    ng = bpy.data.node_groups.get('angora-denoise')
    if not ng:
        ng = bpy.data.node_groups.new('angora-denoise', 'CompositorNodeTree')
        ng.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
        src = ng.nodes.new('CompositorNodeImage'); src.name = 'src'
        dn = ng.nodes.new('CompositorNodeDenoise')
        out = ng.nodes.new('NodeGroupOutput')
        ng.links.new(src.outputs['Image'], dn.inputs['Image']); ng.links.new(dn.outputs['Image'], out.inputs[0])
    ng.nodes['src'].image = img
    sc.compositing_node_group = ng
    sc.render.image_settings.file_format = 'OPEN_EXR'; sc.render.image_settings.color_depth = '32'
    tmp = os.path.join(OUT, '_dn.exr')
    sc.render.filepath = tmp
    bpy.ops.render.render(write_still=True)
    res = bpy.data.images.load(tmp)
    px = np.empty(w * h * 4, np.float32); res.pixels.foreach_get(px)
    bpy.data.images.remove(res); bpy.data.images.remove(img); os.remove(tmp)
    return px.reshape(h, w, 4)[::-1, :, :3].copy()          # Blender alttan başlar -> üstten

def downsample(rgb, mask, size):
    f = rgb.shape[0] // size
    if f <= 1: return rgb, mask
    w = mask.reshape(size, f, size, f)
    s = (rgb * mask[..., None]).reshape(size, f, size, f, 3).sum(axis=(1, 3))
    m = w.sum(axis=(1, 3))
    out = np.where(m[..., None] > 0, s / np.maximum(m[..., None], 1e-8), 0)
    return out, np.clip(m / (f * f), 0, 1)

def push_pull(rgb, mask):
    """Maskesiz pikselleri çevredeki ada ışığıyla doldurur (piramit)."""
    levels = [(rgb * mask[..., None], mask)]
    while levels[-1][1].shape[0] > 1:
        c, m = levels[-1]
        n = c.shape[0] // 2
        levels.append((c.reshape(n, 2, n, 2, 3).sum(axis=(1, 3)), m.reshape(n, 2, n, 2).sum(axis=(1, 3))))
    filled = levels[-1][0] / np.maximum(levels[-1][1][..., None], 1e-8)
    for c, m in reversed(levels[:-1]):
        up = np.repeat(np.repeat(filled, 2, axis=0), 2, axis=1)
        own = c / np.maximum(m[..., None], 1e-8)
        a = np.clip(m, 0, 1)[..., None]
        filled = own * a + up * (1 - a)
    return filled

def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = {'kodlama': 'x = (v^2) * scale, v = png/255 (doğrusal, sRGB DEĞİL)', 'atlaslar': {}}
    for atlas, entry in SPEC['atlaslar'].items():
        masks = {}
        manifest['atlaslar'][atlas] = {'bake_boyut': entry['boyut'], 'haritalar': {}}
        for state in STATES:
            path = os.path.join(SRC, f'{atlas}_{state}.exr')
            rgb = denoise(path)
            full = rgb.shape[0]
            if full not in masks: masks[full] = coverage(atlas, full)
            size = WEB_SIZE.get((atlas, state), DEFAULT_SIZE)
            small, m = downsample(np.maximum(rgb, 0), masks[full], size)
            lit = small[m > 0.5]
            scale = float(np.percentile(lit.max(axis=1), 99.9)) if lit.size else 1.0
            scale = max(scale, 1e-4)
            filled = push_pull(small, (m > 0.02).astype(np.float32) * m)
            enc = np.sqrt(np.clip(filled / scale, 0, 1))
            png = os.path.join(OUT, f'{atlas}_{state}.png')
            Image.fromarray(np.round(enc * 255).astype(np.uint8), 'RGB').save(png, optimize=True)
            manifest['atlaslar'][atlas]['haritalar'][state] = {'boyut': size, 'olcek': round(scale, 6),
                'ortalama': round(float(lit.mean()) if lit.size else 0, 6)}
            print(f'{atlas}_{state}: {full}->{size}, ölçek {scale:.4f}', flush=True)
    json.dump(manifest, open(os.path.join(OUT, 'lightmaps.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

main()
