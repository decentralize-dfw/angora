"""Işık haritasında yerel onarımlar (dünya uzayında, tek düzlem):

  sil:    kutunun İÇİNDEKİ tekseller, aynı düzlemde kutunun DIŞINDAKİ en yakın tekseller ile doldurulur.
          (sitede kaldırılan bir parçanın pişmiş gölgesi: merdiven duvarı ucundaki kartonpiyer başlığının
          tavana düşen koyu lekesi)
  yumusat: kutudaki tekseller dünya uzayında r yarıçaplı ortalama ile yumuşatılır (aynı düzlem).
          (merdivenin duvara değdiği basamaklı temas gölgesi: duvar yatık açıdan görülünce noktalı şerit)

    python lightmap-yerel.py <lmtris.json (node'lu)> <kaynak_dir> <hedef_dir>
"""
import json, os, sys, shutil
import numpy as np
from PIL import Image
from scipy.spatial import cKDTree
from scipy import ndimage
import importlib.util

_here = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('dunya', os.path.join(_here, 'lightmap-dunya.py'))
dunya = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(dunya)
MAPS = dunya.MAPS

KURALLAR = [
    # tavan altı y 5,891; başlık x 0,675..0,817, z -3,471..-3,097 idi
    {'ad': 'baslik-golgesi', 'tur': 'sil', 'atlas': 'zemin', 'normal': [0, -1, 0], 'duzlem': 5.891,
     'kutu': [[0.45, 5.88, -3.75], [1.05, 5.90, -2.95]], 'yaricap': 0.6},
    # merdiven boşluğunun güney duvarı (z -3,097, +z'ye bakar), K1_0 kolunun temas çizgisi boyunca
    {'ad': 'merdiven-temas', 'tur': 'yumusat', 'atlas': 'duvar', 'normal': [0, 0, 1], 'duzlem': -3.097,
     'kutu': [[0.78, 3.0, -3.10], [3.40, 5.10, -3.09]], 'r': 0.10},
    # aynı duvarın 1. kat döşeme hizası (y 5,89 tavan altı .. 6,37 döşeme üstü): pişirmede örnek noktaları
    # duvara gömülü döşeme plağının içine düşmüş, merdiven boşluğunda kalan görünen duvarda yatay kara
    # lekeler şeridi; merdivenden yatık bakınca kesik kesik çizgi (A, sol üst işaret). Şerit, üstündeki ve
    # altındaki duvarla doldurulur.
    {'ad': 'doseme-hizasi', 'tur': 'sil', 'atlas': 'duvar', 'normal': [0, 0, 1], 'duzlem': -3.097,
     'kutu': [[0.75, 5.80, -3.10], [4.10, 6.48, -3.09]], 'yaricap': 0.5},
]


def main(trisf, src, dst):
    if os.path.abspath(src) != os.path.abspath(dst):
        os.makedirs(dst, exist_ok=True)
        for f in os.listdir(src): shutil.copy(os.path.join(src, f), os.path.join(dst, f))
    T = json.load(open(trisf)); rapor = {}
    for r in KURALLAR:
        P = np.array(T[r['atlas']]['p'], float).reshape(-1, 3, 3); UV = np.array(T[r['atlas']]['uv'], float).reshape(-1, 3, 2)
        n = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
        want = np.array(r['normal'], float); ax = int(np.argmax(np.abs(want)))
        duz = (np.abs(n @ want) > 0.98) & (np.abs(P[:, :, ax] - r['duzlem']).max(1) < 0.004)
        lo, hi = np.array(r['kutu'][0]), np.array(r['kutu'][1])
        say = 0
        for m in MAPS:
            path = os.path.join(dst, f"{r['atlas']}_{m}.png")
            im = np.asarray(Image.open(path).convert('RGB')).astype(float) / 255; W = im.shape[0]
            ids = dunya.raster(UV, W); ys, xs, tt, pos = dunya.texel_world(ids, UV, P, W)
            k = duz[tt]; ys, xs, pos = ys[k], xs[k], pos[k]
            ic = np.all((pos >= lo) & (pos <= hi), axis=1)
            lin = im ** 2; out = lin.copy()
            if r['tur'] == 'sil':
                yak = np.linalg.norm(pos - (lo + hi) / 2, axis=1) < r['yaricap'] + np.linalg.norm(hi - lo) / 2
                kay = ~ic & yak & (im[ys, xs].max(1) > dunya.KARA)
                tree = cKDTree(pos[kay]); d, j = tree.query(pos[ic], k=8)
                w = 1 / (d + 0.02) ** 2; w /= w.sum(1, keepdims=True)
                out[ys[ic], xs[ic]] = (lin[ys[kay][j], xs[kay][j]] * w[..., None]).sum(1)
            else:
                tree = cKDTree(pos); tgt = np.nonzero(ic)[0]
                for s in range(0, len(tgt), 4000):
                    part = tgt[s:s + 4000]
                    for i, nb in zip(part, tree.query_ball_point(pos[part], r['r'])):
                        out[ys[i], xs[i]] = lin[ys[nb], xs[nb]].mean(0)
            # değişen tekseller çevresindeki boş oluk tekselleri en yakın dolu tekselden yeniden (çift doğrusal
            # örnekleme parça kenarında eski oluk değerini okuyup yatık bakışta kesik açık çizgi veriyordu)
            ch = np.zeros((W, W), bool)
            ch[ys[ic], xs[ic]] = True
            empty = ids == 0; ring = ndimage.binary_dilation(ch, iterations=3) & empty
            if ring.any():
                _, (iy, ix) = ndimage.distance_transform_edt(empty, return_indices=True)
                ry, rx = np.nonzero(ring); out[ry, rx] = out[iy[ry, rx], ix[ry, rx]]
            Image.fromarray(np.clip(np.sqrt(out) * 255, 0, 255).round().astype(np.uint8)).save(path)
            if m == 'gok': say = int(ic.sum())
        rapor[r['ad']] = say
        print(r['ad'], say, flush=True)
    json.dump(rapor, open(os.path.join(dst, 'yerel-raporu.json'), 'w'), indent=1)


if __name__ == '__main__':
    main(*sys.argv[1:4])
