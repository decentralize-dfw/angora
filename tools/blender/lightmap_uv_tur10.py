"""Tur 10 lightmap UV'leri (xatlas) - make-tur10-web.mjs çağırır, elle çalıştırılmaz.

    python tools/blender/lightmap_uv_tur10.py <giris.json>

Girdi (make-tur10-web.mjs yazar): giris.json + giris.bin
    atlaslar: {ad: {boyut, parcalar: [{dugum, konum: [ofset, adet], indeks: [ofset, adet]}]}}
    konum dünya koordinatında float32 (x, y, z), indeks uint32.
Çıktı: cikis.json + cikis.bin (aynı klasöre)
    her parça için vmapping (yeni köşe -> eski köşe), indices, uv (0..1).

Her atlas TEK sayfa olmak zorunda: sığmazsa metre başına texel düşürülür,
sayfa eklenmez. Çakışan ada yok (xatlas paketleyicisi), dolgu 6 px.
"""
import json, os, sys
import numpy as np
import xatlas

PADDING = 6

def main():
    src = sys.argv[1]
    base = os.path.dirname(src)
    spec = json.load(open(src, encoding='utf-8'))
    blob = open(src[:-5] + '.bin', 'rb').read()
    view = lambda rng, t: np.frombuffer(blob, dtype=t, count=rng[1], offset=rng[0])
    out, outblob = {'dolgu_px': PADDING, 'atlaslar': {}}, bytearray()
    for name, atlas_spec in spec['atlaslar'].items():
        size = atlas_spec['boyut']
        meshes, area = [], 0.0
        for part in atlas_spec['parcalar']:
            pos = view(part['konum'], np.float32).reshape(-1, 3).astype(np.float32)
            idx = view(part['indeks'], np.uint32).reshape(-1, 3)
            tri = pos[idx].astype(np.float64)
            area += 0.5 * np.linalg.norm(np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]), axis=1).sum()
            meshes.append((part['dugum'], pos, idx))
        # tek sayfaya sığan en yüksek texel yoğunluğu: tahminle başla, sığmazsa %8 düşür
        tpu = float(np.sqrt(0.62 * size * size / max(area, 1e-6)))
        for attempt in range(40):
            atlas = xatlas.Atlas()
            for _, pos, idx in meshes: atlas.add_mesh(pos, idx)
            chart = xatlas.ChartOptions(); chart.max_iterations = 2
            pack = xatlas.PackOptions()
            pack.resolution = size; pack.padding = PADDING; pack.bilinear = True
            pack.bruteForce = False; pack.create_image = False; pack.texels_per_unit = tpu
            atlas.generate(chart_options=chart, pack_options=pack)
            if atlas.atlas_count == 1: break
            tpu *= 0.92
        else:
            raise SystemExit(f'{name}: tek sayfaya sığmadı')
        entry = {'boyut': size, 'alan_m2': round(area, 1), 'px_per_m': round(tpu, 1),
                 'doluluk': round(float(atlas.get_utilization(0)), 3), 'parca': len(meshes),
                 'ada': int(atlas.chart_count), 'parcalar': {}}
        for i, (node, pos, idx) in enumerate(meshes):
            vmap, indices, uvs = atlas.get_mesh(i)
            rec = {'eski_kose': len(pos), 'yeni_kose': int(len(vmap))}
            for key, arr in (('vmapping', vmap.astype(np.uint32)), ('indices', indices.astype(np.uint32).reshape(-1)),
                             ('uv', uvs.astype(np.float32).reshape(-1))):
                rec[key] = [len(outblob), int(arr.size)]
                outblob += arr.tobytes()
            entry['parcalar'][node] = rec
        out['atlaslar'][name] = entry
        print(f"{name}: {len(meshes)} parça, {area:.0f} m², {atlas.chart_count} ada, "
              f"%{entry['doluluk'] * 100:.0f} dolu, {tpu:.0f} px/m, deneme {attempt + 1}", flush=True)
    open(os.path.join(base, 'cikis.bin'), 'wb').write(outblob)
    json.dump(out, open(os.path.join(base, 'cikis.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

if __name__ == '__main__':
    main()
