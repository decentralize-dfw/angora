"""Çatlaktan görünen KARA arka yüzler (dünya uzayında, en yakın aydınlık tekselden doldurma).

01.10 merdiven (ekran görüntüsü A): merdiven boşluğu doğu duvarında çapraz ince çizgi, 1. kat döşeme
hizasında kara "çubuk", duvar köşelerinde noktalı çizgi. Kaynak geometri: duvar iki kabuk (x 4,088 önde,
x 4,118 3 cm arkada); öndeki kabuğun üçgenleri birbirine tam oturmuyor (ör. y 6,37'de z -3,097 / -3,079:
yukarı doğru incelen 2 cm'lik kıl çatlak). Arkadaki kabuk görünmediği için pişirmede kapkara (5 haritada
da ~0) çıktı; çatlaktan bakınca o kara yüz ince çizgi / köşelerde noktalı çizgi olarak görünüyor.

Beş haritanın hepsinde kara olan ya da önü örtülü (görünmeyen) üçgenlerin tekselleri, aynı atlasta en yakın kara olmayan
tekselin (R metre içinde, en yakın K tanesinin ters uzaklık ağırlıklı ortalaması) değerini alır: çatlaktan
bakınca hemen önündeki duvarın rengi görünür. Görünen üçgenlerin tekselleri değişmez. Doldurulan tekselin
çevresindeki boş oluk tekselleri en yakın dolu tekselden yeniden doldurulur (çift doğrusal örnekleme).

    python lightmap-kenar.py <lmtris.json> <kaynak_dir> <hedef_dir> [atlas ...]
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
K = 16
R = 0.10     # m
ORTU = 0.13  # m
KIL = 0.006  # m: üçgen yüksekliği bunun altındaysa (ve uzun kenarı > 15 cm) kıl üçgen
GENIS = 0.05  # m²
SONUK = (12 / 255, 24 / 255)   # örtülü VE sönük (gök, gece ortalaması): görünen duvar 25..55 / 50..60


def main(trisf, src, dst, *atlases):
    if os.path.abspath(src) != os.path.abspath(dst):
        os.makedirs(dst, exist_ok=True)
        for f in os.listdir(src): shutil.copy(os.path.join(src, f), os.path.join(dst, f))
    T = json.load(open(trisf)); rapor = {}
    for atlas in atlases or ['duvar', 'zemin', 'cephe']:
        P = np.array(T[atlas]['p'], float).reshape(-1, 3, 3); UV = np.array(T[atlas]['uv'], float).reshape(-1, 3, 2)
        N = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); N /= np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-12)
        imgs = {m: np.asarray(Image.open(os.path.join(dst, f'{atlas}_{m}.png')).convert('RGB')).astype(float) / 255 for m in MAPS}
        # üçgen başına en parlak teksel (bütün haritalarda) -> kara üçgen
        peaks = {}; means = {}; cache = {}
        for m, im in imgs.items():
            W = im.shape[0]
            if W not in cache:
                ids = dunya.raster(UV, W); cache[W] = (ids,) + dunya.texel_world(ids, UV, P, W)
            ids, ys, xs, tt, pos = cache[W]
            peaks[m] = np.zeros(len(P)); np.maximum.at(peaks[m], tt, im[ys, xs].max(1))
            # ortalama: kenar/oluk teksellerinin komşudan taşan değeri tepe değeri yanıltmasın
            means[m] = np.bincount(tt, im[ys, xs].max(1), len(P)) / np.maximum(np.bincount(tt, None, len(P)), 1)
        kara = np.max(list(peaks.values()), axis=0) <= dunya.KARA
        # görünen yüzünün önü ÖRTÜLÜ üçgenler (lightmap-yon.py ışın testi: görünen yandaki ortalama çarpma
        # uzaklığı < ORTU m; ör. arka kabuk 3 cm önündeki kabuğu görür, 0,05..0,12) de çatlaktan görünür:
        # pişirmede tam kara değil ama 1..11/255 (önündeki duvar 25..55)
        durum = os.path.join(src, f'{atlas}_durum.npy')
        if os.path.exists(durum):
            d = np.load(durum)
            if d.shape[1] == len(P): kara |= (np.where(d[0] > 0, d[6], d[5]) < ORTU) & (means['gok'] < SONUK[0]) & (means['gece'] < SONUK[1])
        # Kıl üçgenler: köşe pahları (ör. merdiven alt yüzü ile sahanlık altı arasında 3 mm'lik 3 dilimli pah) atlasta
        # yarım teksel genişliğinde şerit; örnekleme oluk/komşu parçayla karışıyor (gök 2..24), uzaktan bakınca
        # kenar boyunca kesik kesik koyu/açık noktalar. Onlar da en yakın geniş yüzün tekselleriyle (iki yanın ortalaması).
        e = np.stack([np.linalg.norm(P[:, (i + 1) % 3] - P[:, i], axis=1) for i in range(3)], 1)
        alt = 2 * np.linalg.norm(np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]), axis=1) / 2 / np.maximum(e.max(1), 1e-9)
        kil = (alt < KIL) & (e.max(1) > 0.15) & ~kara
        alan = np.linalg.norm(np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]), axis=1) / 2
        rapor[atlas] = {'kara_ucgen': int(kara.sum()), 'kil_ucgen': int(kil.sum())}
        kara = kara | kil
        for m, im in imgs.items():
            W = im.shape[0]; ids, ys, xs, tt, pos = cache[W]
            # kaynak: kara OLMAYAN üçgenlerin bütün tekselleri (güneş haritasında gölgedeki 0 da kaynak: önündeki
            # duvar gölgedeyse arkası da gölgede kalmalı)
            hedef = kara[tt]; kaynak = ~hedef
            if not hedef.any() or not kaynak.any(): continue
            tree = cKDTree(pos[kaynak]); dist, j = tree.query(pos[hedef], k=K, distance_upper_bound=R)
            # kıl üçgenler yalnız GENİŞ yüzlerden (> GENIS m²) ve 15 cm'ye kadar: hemen yanındaki öbür pah dilimleri /
            # köşedeki dar yüzler de kenar karanlığı taşıyor
            genis = kaynak & (alan[tt] > GENIS); kh = kil[tt[hedef]]
            if genis.any() and kh.any():
                t2 = cKDTree(pos[genis]); d2, j2 = t2.query(pos[hedef][kh], k=K, distance_upper_bound=0.15)
                remap = np.searchsorted(np.nonzero(kaynak)[0], np.nonzero(genis)[0])   # genis içindeki sıra -> kaynak sırası
                j2 = np.where(np.isfinite(d2), remap[np.minimum(j2, len(remap) - 1)], len(np.nonzero(kaynak)[0]))
                dist[kh] = d2; j[kh] = j2
            ok = np.isfinite(dist); has = ok.any(1)
            jj = np.where(ok, j, 0)
            # aynı yöne bakan (paralel kabuk) kaynak öncelikli: arka kabuk önündeki kabuğun rengini alsın,
            # köşedeki dik duvarın / merdivenin değil
            ks = np.nonzero(kaynak)[0]; same = (N[tt[hedef]][:, None, :] * N[tt[ks[jj]]]).sum(2) > 0.9
            same |= kil[tt[hedef]][:, None]   # kıl üçgen: iki yanın ortalaması (paralel kabuk önceliği yok)
            w = np.where(ok, np.where(same, 1.0, 0.03) / (dist + 0.005) ** 2, 0)[has]; w /= w.sum(1, keepdims=True)
            lin = im ** 2; ky, kx = ys[kaynak], xs[kaynak]
            val = (lin[ky[jj[has]], kx[jj[has]]] * w[..., None]).sum(1)
            hy, hx = ys[hedef][has], xs[hedef][has]
            out = im.copy(); out[hy, hx] = np.sqrt(val)
            fixed = np.zeros((W, W), bool); fixed[hy, hx] = True
            empty = ids == 0; ring = ndimage.binary_dilation(fixed, iterations=3) & empty
            _, (iy, ix) = ndimage.distance_transform_edt(empty, return_indices=True)
            ry, rx = np.nonzero(ring); out[ry, rx] = out[iy[ry, rx], ix[ry, rx]]
            Image.fromarray(np.clip(out * 255, 0, 255).round().astype(np.uint8)).save(os.path.join(dst, f'{atlas}_{m}.png'))
            rapor[atlas][m] = int(has.sum())
            print(atlas, m, 'kara üçgen', int(kara.sum()), 'doldurulan teksel', int(has.sum()), 'uzakta kalan', int((~has).sum()), flush=True)
    json.dump(rapor, open(os.path.join(dst, 'kenar-raporu.json'), 'w'), indent=1)


if __name__ == '__main__':
    main(*sys.argv[1:])
