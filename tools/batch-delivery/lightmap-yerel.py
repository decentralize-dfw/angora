"""Işık haritasında yerel onarımlar (dünya uzayında, tek düzlem):

  sil:    kutunun İÇİNDEKİ tekseller, aynı düzlemde kutunun DIŞINDAKİ en yakın tekseller ile doldurulur.
          (sitede kaldırılan bir parçanın pişmiş gölgesi: merdiven duvarı ucundaki kartonpiyer başlığının
          tavana düşen koyu lekesi)
  yumusat: kutudaki tekseller dünya uzayında r yarıçaplı ortalama ile yumuşatılır (aynı düzlem).
          (merdivenin duvara değdiği basamaklı temas gölgesi: duvar yatık açıdan görülünce noktalı şerit)
  koyu:   kutudaki tekseller içinden yalnız çevresinin (r yarıçap, aynı düzlem) ortancasının `oran` katından
          koyu olanlar, çevredeki koyu olmayan tekselların ortalamasıyla değiştirilir; genel ışık değişimi kalır.
          (çatı diz duvarındaki parça kenarı boyunca kesik kesik koyu noktalar)

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
    # 02.10 çatı oturma alanı (ürün sahibi ekran görüntüsü, "duvarda noktalar"): kuzey diz duvarı (z -0,507, -z'ye
    # bakar) üçgen kenarı (x -2,50 y 9,47 -> x -1,99 y 11,48) boyunca 5-8 cm arayla koyu noktalar
    {'ad': 'cati-diz-noktalar', 'tur': 'koyu', 'atlas': 'duvar', 'normal': [0, 0, -1], 'duzlem': -0.507,
     'kutu': [[-2.65, 9.47, -0.51], [-1.90, 11.60, -0.50]], 'r': 0.12, 'oran': 0.85},
    # 02.10 1. kat ebeveyn yatak odası tavanı (y 8,991, aşağı bakar): x -0,95 boyunca iki parça arasında ışık
    # sıçraması, tavanda düz bir kırım/katlanma gibi görünüyordu (ürün sahibi ekran görüntüsü). Oda tavanı yumuşatılır.
    {'ad': 'ebeveyn-tavan', 'tur': 'yumusat', 'atlas': 'zemin', 'normal': [0, -1, 0], 'duzlem': 8.991,
     'kutu': [[-2.75, 8.98, -8.10], [0.20, 9.00, -3.95]], 'r': 0.45},
    # 02.10 1. kat kat holü tavanı (y 8,991): uzun ince yelpaze üçgenleri arasında gri dikiş çizgisi
    {'ad': 'kathol-tavan', 'tur': 'yumusat', 'atlas': 'zemin', 'normal': [0, -1, 0], 'duzlem': 8.991,
     'kutu': [[-1.40, 8.98, -4.00], [1.80, 9.00, 1.55]], 'r': 0.30},
    # 02.10 bodrum merdiven sahanlığı (ürün sahibi: "göçük"): sahanlığın kuzey duvarında (z -0,957, -z'ye bakar)
    # giriş döşemesi hizasında (y 2,62..3,31) yatay şerit; doğu uç duvarındaki (x 4,088) aynı hizadaki bant
    {'ad': 'bodrum-sahanlik-bant', 'tur': 'sil', 'atlas': 'duvar', 'normal': [0, 0, -1], 'duzlem': -0.957,
     'kutu': [[0.90, 2.45, -0.96], [4.10, 3.35, -0.95]], 'yaricap': 0.5},
    {'ad': 'bodrum-uc-bant', 'tur': 'sil', 'atlas': 'duvar', 'normal': [-1, 0, 0], 'duzlem': 4.088,
     'kutu': [[4.08, 3.05, -3.10], [4.10, 3.40, -0.95]], 'yaricap': 0.5},
    # 02.10 garaj tavanı (y 5,891): tavan lambasının gövdesi tavanı örttüğü için hemen üstünde koyu halka;
    # tavanda toplanmış garaj kapısı ışığını tavandan okuduğu için kapının ortasında koyu leke olarak görünüyordu
    {'ad': 'garaj-lamba-halkasi', 'tur': 'koyu', 'atlas': 'zemin', 'normal': [0, -1, 0], 'duzlem': 5.891,
     'kutu': [[5.25, 5.88, -1.20], [6.20, 5.90, -0.20]], 'r': 0.30, 'oran': 0.85},
    # 02.10 çatı oturma alanı tavanı (eğik, ürün sahibi: "eski kirişin gölgesi kalmış"): model-d1'in eklediği ve
    # sitede kaldırılan enine kirişin (x -2,64..-2,44) pişmiş gölgesi tavanda koyu bant; iki yanındaki tavanla
    # doldurulur. Kirişin kendi alt yüzü (yatay, ny -1) seçilmez.
    {'ad': 'cati-kiris-golgesi', 'tur': 'sil', 'atlas': 'zemin', 'ny': [-0.95, -0.5],
     'kutu': [[-3.05, 11.0, -3.6], [-2.33, 12.4, -0.45]], 'yaricap': 0.4},
    # aynı odanın batı ucundaki pilastr yüzü (x -5,032, +x'e bakar): düşey gri şeritler
    {'ad': 'cati-pilastr', 'tur': 'koyu', 'atlas': 'duvar', 'normal': [1, 0, 0], 'duzlem': -5.032,
     'kutu': [[-5.04, 9.47, -3.60], [-5.02, 11.20, -3.10]], 'r': 0.12, 'oran': 0.85},
]


def main(trisf, src, dst):
    if os.path.abspath(src) != os.path.abspath(dst):
        os.makedirs(dst, exist_ok=True)
        for f in os.listdir(src): shutil.copy(os.path.join(src, f), os.path.join(dst, f))
    T = json.load(open(trisf)); rapor = {}
    for r in KURALLAR:
        P = np.array(T[r['atlas']]['p'], float).reshape(-1, 3, 3); UV = np.array(T[r['atlas']]['uv'], float).reshape(-1, 3, 2)
        n = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
        if 'ny' in r:   # eğik yüzeyler (çatı tavanı): normalin y bileşeni aralıkta olan bütün üçgenler
            duz = (n[:, 1] >= r['ny'][0]) & (n[:, 1] <= r['ny'][1])
        else:
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
            elif r['tur'] == 'koyu':
                tree = cKDTree(pos); tgt = np.nonzero(ic)[0]; L = lin[ys, xs].max(1)
                for s in range(0, len(tgt), 4000):
                    part = tgt[s:s + 4000]
                    for i, nb in zip(part, tree.query_ball_point(pos[part], r['r'])):
                        nb = np.asarray(nb); med = np.median(L[nb])
                        if L[i] >= r['oran'] ** 2 * med: continue   # lin = karesi: oran da karesiyle
                        iyi = nb[L[nb] >= r['oran'] ** 2 * med]
                        if len(iyi): out[ys[i], xs[i]] = lin[ys[iyi], xs[iyi]].mean(0)
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
