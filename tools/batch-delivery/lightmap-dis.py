"""İç atlaslardaki (duvar, zemin) DIŞ yüzeylerin ışığını dış cephe ölçeğine çevirir.

Pencere/kapı söveleri (WHT.001), saçak/balkon altları, veranda döşemeleri iç mekân
atlaslarında pişti. Sitede iç atlas iç mekân kazancıyla (x11 x atlas, sıcak ton, gündüz
lamba payı) çarpılıyor: dışarıda bu yüzeyler güneşte parlıyordu ("beyazlar öz-ışımalı gibi").
Ayrıca iç atlasın ölçeği dış ışığı kırpıyor (v=1 tavanı).

Her dış üçgen (görünen yüzünden ışınların >%12'si göğe kaçıyor) için tekseller yeniden hesaplanır:
  gök tahmini = kosinüs ağırlıklı 48 ışının yukarı kaçan payı + 0,25 x aşağı kaçan payı (yer sekmesi)
  bu tahmin cephe atlasının doğru pişmiş tekselleriyle (aynı tahmin) doğrusal oturtulur -> gök ışınımı
  kodlama, iç atlas kazancı sitede tam geri alınacak biçimde: v = sqrt(E / (ölçek x uyum)) / ton
  güneş sekmesi 0 (doğrudan güneşi canlı ışık çizer), gece haritası / lambaGündüz.

    python lightmap-dis.py <lmtris.json> <tumtris öneki> <durum_dir> <kaynak_dir> <hedef_dir>
(durum_dir: lightmap-yon.py çıktısı, <atlas>_durum.npy)
"""
import json, os, sys, shutil
import numpy as np
from PIL import Image
from scipy import ndimage
import trimesh
from trimesh.ray.ray_pyembree import RayMeshIntersector
import importlib.util

_here = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('dunya', os.path.join(_here, 'lightmap-dunya.py'))
dunya = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(dunya)
MAPS = dunya.MAPS

# viewer/src/villa-lightmaps.js LIGHTMAP_GAINS ile aynı olmalı
INTERIOR = 11; ATLAS = {'duvar': 4, 'zemin': 2.6}; TINT = np.array([1.0, 0.86, 0.70]); LAMP_DAY = 2.5
NRAY = 48; ESIK = 0.12


def rays(rx, pos, nrm, rng):
    m = len(pos); out = np.zeros(m)
    for s in range(0, m, 20000):
        p = pos[s:s + 20000]; n = nrm[s:s + 20000]; k = len(p)
        u1 = rng.random((k, NRAY)); u2 = rng.random((k, NRAY))
        r = np.sqrt(u1); th = 2 * np.pi * u2
        a = np.where(np.abs(n[:, :1]) < 0.9, np.array([[1., 0, 0]]), np.array([[0., 1, 0]]))
        t1 = np.cross(n, a); t1 /= np.linalg.norm(t1, axis=1, keepdims=True); t2 = np.cross(n, t1)
        d = (r * np.cos(th))[..., None] * t1[:, None] + (r * np.sin(th))[..., None] * t2[:, None] + np.sqrt(np.maximum(0, 1 - u1))[..., None] * n[:, None]
        O = np.repeat(p + n * 0.006, NRAY, 0); D = d.reshape(-1, 3)
        hit = rx.intersects_first(O, D) >= 0
        esc = ~hit.reshape(k, NRAY); up = d[..., 1] > 0
        out[s:s + k] = (esc & up).mean(1) + 0.25 * (esc & ~up).mean(1)
    return out


def main(trisf, tum, durum, src, dst):
    if os.path.abspath(src) != os.path.abspath(dst):
        os.makedirs(dst, exist_ok=True)
        for f in os.listdir(src): shutil.copy(os.path.join(src, f), os.path.join(dst, f))
    meta = json.load(open(os.path.join(src, 'lightmaps.json')))['atlaslar']
    allP = np.fromfile(tum + '.bin', np.float32).reshape(-1, 3, 3).astype(np.float64)
    rx = RayMeshIntersector(trimesh.Trimesh(vertices=allP.reshape(-1, 3), faces=np.arange(len(allP) * 3).reshape(-1, 3), process=False))
    T = json.load(open(trisf)); rng = np.random.default_rng(11); rapor = {}

    def texels(atlas, W, tri_mask):
        P = np.array(T[atlas]['p'], float).reshape(-1, 3, 3); UV = np.array(T[atlas]['uv'], float).reshape(-1, 3, 2)
        ids = dunya.raster(UV, W)
        ys, xs, tt, pos = dunya.texel_world(ids, UV, P, W)
        k = tri_mask[tt]
        return ids, ys[k], xs[k], tt[k], pos[k], P

    # 1. ayar: cephe atlasında doğru pişmiş tekseller (gök ışınımı) ~ a * tahmin + b
    dc = np.load(os.path.join(durum, 'cephe_durum.npy')); ters_c, kara_c = dc[0] > 0, dc[1] > 0
    gc = np.asarray(Image.open(os.path.join(src, 'cephe_gok.png')).convert('RGB')).astype(float) / 255
    Wc = gc.shape[0]
    _, ys, xs, tt, pos, Pc = texels('cephe', Wc, ~ters_c & ~kara_c)
    nc = np.cross(Pc[:, 1] - Pc[:, 0], Pc[:, 2] - Pc[:, 0]); nc /= np.maximum(np.linalg.norm(nc, axis=1, keepdims=True), 1e-12)
    pick = rng.choice(len(ys), min(30000, len(ys)), replace=False)
    est = rays(rx, pos[pick], nc[tt[pick]], rng)
    E = (gc[ys[pick], xs[pick]] ** 2).mean(1) * meta['cephe']['haritalar']['gok']['olcek']
    ok = (E > 1e-3) & (est > 0.02)
    a, b = np.polyfit(est[ok], E[ok], 1)
    r = np.corrcoef(est[ok], E[ok])[0, 1]
    print(f'ayar: E = {a:.3f} * tahmin + {b:.3f}  (r={r:.2f}, n={ok.sum()})', flush=True)
    rapor['ayar'] = {'a': round(a, 4), 'b': round(b, 4), 'r': round(r, 3)}

    for atlas in ['duvar', 'zemin']:
        d = np.load(os.path.join(durum, f'{atlas}_durum.npy')); ters, e_p, e_m = d[0] > 0, d[3], d[4]
        ev = np.where(ters, e_m, e_p); dis = ev > ESIK
        imgs = {m: np.asarray(Image.open(os.path.join(src, f'{atlas}_{m}.png')).convert('RGB')).astype(float) / 255 for m in MAPS}
        out = {m: im.copy() for m, im in imgs.items()}
        adapt = INTERIOR * ATLAS[atlas]
        by_res = {}
        for m, im in imgs.items(): by_res.setdefault(im.shape[0], []).append(m)
        say = 0
        for W, maps in sorted(by_res.items(), reverse=True):
            ids, ys, xs, tt, pos, P = texels(atlas, W, dis)
            n = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
            vis = np.where(ters[:, None], -n, n)
            filled = np.zeros((W, W), bool); filled[ys, xs] = True
            if 'gok' in maps:
                Eg = np.maximum(a * rays(rx, pos, vis[tt], rng) + b, 0.02)
                sc = meta[atlas]['haritalar']['gok']['olcek'] * adapt
                v = np.sqrt(Eg[:, None] / sc / TINT[None])          # sitede x ölçek x uyum x ton = E
                out['gok'][ys, xs] = np.clip(v, 0, 1); say = len(ys)
            for m in maps:
                if m.startswith('gunes'): out[m][ys, xs] = 0
                if m == 'gece': out[m][ys, xs] = imgs[m][ys, xs] / np.sqrt(LAMP_DAY)
            empty = ids == 0
            ring = ndimage.binary_dilation(filled, iterations=4) & empty
            _, (iy, ix) = ndimage.distance_transform_edt(empty, return_indices=True)
            ry, rx_ = np.nonzero(ring)
            for m in maps: out[m][ry, rx_] = out[m][iy[ry, rx_], ix[ry, rx_]]
        for m in MAPS:
            Image.fromarray(np.clip(out[m] * 255, 0, 255).round().astype(np.uint8)).save(os.path.join(dst, f'{atlas}_{m}.png'))
        rapor[atlas] = {'dis_ucgen': int(dis.sum()), 'teksel': say}
        print(atlas, rapor[atlas], flush=True)
    json.dump(rapor, open(os.path.join(dst, 'dis-raporu.json'), 'w'), indent=1)


if __name__ == '__main__':
    main(*sys.argv[1:6])
