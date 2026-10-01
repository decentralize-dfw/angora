"""Malzemesi sitede değiştirilen yüzlerin ışık haritasını, aynı düzlemdeki başka atlas yüzünden aktarır.

01.10 antre (ekran görüntüsü 115): girişteki WC'nin "ivory wall ceramic" seramiği duvarın
antre yüzüne de basılmış (x 2,94, -x'e bakan panel). Sitede o yüz antrenin beyaz duvar
boyasına çevriliyor (viewer/src/villa-model-v3.js TUR10_RETILE); pişmiş ışığı da seramik
olarak 16 kat koyu pişmişti. Panel tekselleri, aynı düzlemdeki beyaz duvarın (duvar
atlası) en yakın tekselleriyle doldurulur; atlaslar arası ölçek farkı (ölçek x uyum) çevrilir.

    python lightmap-aktar.py <lmtris.json (node'lu)> <kaynak_dir> <hedef_dir>
"""
import json, os, sys, shutil
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.spatial import cKDTree
import importlib.util

_here = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('dunya', os.path.join(_here, 'lightmap-dunya.py'))
dunya = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(dunya)
MAPS = dunya.MAPS
ADAPT = {'duvar': 44, 'zemin': 28.6, 'cephe': 1}   # villa-lightmaps.js: iç 11 x atlas kazancı
K = 6

# hedef: atlas, düğüm, kutu, görünen normal; kaynak: atlas, düzlem (aynı kutu ekseninde)
KURALLAR = [
    {'ad': 'antre-seramik', 'atlas': 'zemin', 'node': 'LM_zemin_017', 'min': [2.92, 3.2, 0.25], 'max': [2.95, 6.0, 1.6],
     'normal': [-1, 0, 0], 'kaynak': 'duvar', 'yaricap': 2.5},
    # aynı sızıntının iki görünen yüzü daha (viewer TUR10_RETILE `away`): radyatör duvarının ucundaki pah
    # (üst üçgen 683 seramik, alt üçgen beyaz) ve WC kapısının hol tarafındaki üstü. Kutular yalnız öndeki
    # katmanı alır (3 cm arkadaki ikiz katman gizli; kaynak düzlemi 1 cm içinde aranıyor).
    {'ad': 'antre-pah', 'atlas': 'zemin', 'node': 'LM_zemin_017', 'min': [2.64, 3.2, 1.50], 'max': [2.945, 6.0, 1.80],
     'normal': [-0.7071, 0, -0.7071], 'kaynak': 'duvar', 'yaricap': 1.5},
    {'ad': 'wc-kapi-ustu', 'atlas': 'zemin', 'node': 'LM_zemin_017', 'min': [2.68, 5.15, 1.94], 'max': [3.29, 5.95, 2.56],
     'normal': [-0.7071, 0, 0.7071], 'kaynak': 'duvar', 'yaricap': 1.5},
]


def main(trisf, src, dst):
    if os.path.abspath(src) != os.path.abspath(dst):
        os.makedirs(dst, exist_ok=True)
        for f in os.listdir(src): shutil.copy(os.path.join(src, f), os.path.join(dst, f))
    T = json.load(open(trisf)); meta = json.load(open(os.path.join(src, 'lightmaps.json')))['atlaslar']
    rapor = {}
    for r in KURALLAR:
        def tris(atlas):
            P = np.array(T[atlas]['p'], float).reshape(-1, 3, 3); UV = np.array(T[atlas]['uv'], float).reshape(-1, 3, 2)
            n = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
            return P, UV, n
        P, UV, n = tris(r['atlas']); want = np.array(r['normal'], float)
        lo, hi = np.array(r['min']), np.array(r['max'])
        hedef = np.array([nd == r['node'] for nd in T[r['atlas']]['node']]) & np.all((P >= lo - 1e-4) & (P <= hi + 1e-4), axis=(1, 2)) & (n @ want > 0.98)
        Ps, UVs, ns = tris(r['kaynak'])
        d0 = (P[hedef].reshape(-1, 3) @ want).mean()
        kay = (ns @ want > 0.98) & (np.abs(Ps.mean(1) @ want - d0) < 0.01)
        cen = P[hedef].reshape(-1, 3).mean(0)
        kay &= np.linalg.norm(Ps.mean(1) - cen, axis=1) < r['yaricap']
        print(r['ad'], 'hedef üçgen', int(hedef.sum()), 'kaynak üçgen', int(kay.sum()), flush=True)
        himg = {m: np.asarray(Image.open(os.path.join(dst, f"{r['atlas']}_{m}.png")).convert('RGB')).astype(float) / 255 for m in MAPS}
        kimg = {m: np.asarray(Image.open(os.path.join(dst, f"{r['kaynak']}_{m}.png")).convert('RGB')).astype(float) / 255 for m in MAPS}
        px = 0
        for m in MAPS:
            Wh = himg[m].shape[0]; Wk = kimg[m].shape[0]
            ids = dunya.raster(UV, Wh); ys, xs, tt, pos = dunya.texel_world(ids, UV, P, Wh)
            sel = hedef[tt]; ys, xs, pos = ys[sel], xs[sel], pos[sel]
            kids = dunya.raster(UVs, Wk); ky, kx, kt, kpos = dunya.texel_world(kids, UVs, Ps, Wk)
            ks = kay[kt] & (kimg['gok'][np.clip(ky * kimg['gok'].shape[0] // Wk, 0, kimg['gok'].shape[0] - 1), np.clip(kx * kimg['gok'].shape[0] // Wk, 0, kimg['gok'].shape[0] - 1)].max(1) > dunya.KARA)
            ky, kx, kpos = ky[ks], kx[ks], kpos[ks]
            tree = cKDTree(kpos); kk = min(K, len(kpos))
            dist, j = tree.query(pos, k=kk)
            if kk == 1: dist = dist[:, None]; j = j[:, None]
            w = 1 / (dist + 0.05) ** 2; w /= w.sum(1, keepdims=True)
            # ölçek çevirisi: E = v² x ölçek x uyum (gece: uyum yok, iki iç atlasta aynı lamba payı)
            ua = 1 if m == 'gece' else ADAPT[r['kaynak']]; ub = 1 if m == 'gece' else ADAPT[r['atlas']]
            f = (meta[r['kaynak']]['haritalar'][m]['olcek'] * ua) / (meta[r['atlas']]['haritalar'][m]['olcek'] * ub)
            lin = (kimg[m][ky[j], kx[j]] ** 2 * w[..., None]).sum(1) * f
            himg[m][ys, xs] = np.clip(np.sqrt(lin), 0, 1)
            filled = np.zeros((Wh, Wh), bool); filled[ys, xs] = True
            empty = ids == 0; ring = ndimage.binary_dilation(filled, iterations=4) & empty
            _, (iy, ix) = ndimage.distance_transform_edt(empty, return_indices=True)
            ry, rx = np.nonzero(ring); himg[m][ry, rx] = himg[m][iy[ry, rx], ix[ry, rx]]
            Image.fromarray(np.clip(himg[m] * 255, 0, 255).round().astype(np.uint8)).save(os.path.join(dst, f"{r['atlas']}_{m}.png"))
            if m == 'gok': px = len(ys)
        rapor[r['ad']] = {'hedef_ucgen': int(hedef.sum()), 'kaynak_ucgen': int(kay.sum()), 'teksel': px}
    json.dump(rapor, open(os.path.join(dst, 'aktar-raporu.json'), 'w'), indent=1)
    print(rapor)


if __name__ == '__main__':
    main(*sys.argv[1:4])
