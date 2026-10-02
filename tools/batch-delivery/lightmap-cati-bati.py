"""Çatı oturma alanı özgün tavanı (tools/cad/cati_tavan_bati.py EKLE üçgenleri) için zemin atlasında kendi ışık adası.

Sitede model-d1'in çatı tavanı üçgenleri kaldırılıp ürün sahibinin özgün üçgenleri konuyor (regableTur10AtticWest).
Yeni üçgenlerin pişmiş ışığı yok; köşe köşe d1 üçgenlerinin ışık UV'sinden ödünç alınca (02.10) bir üçgen atlasın
birbirinden uzak adalarını karıştırdı (krom gibi çizgili tavan), tek kaynak üçgene kıstırınca da üçgen üçgen
farklı ton (kırık kırık yüzler). Burada:

  1. EKLE üçgenleri eş düzlemli ve kenar paylaşan kümelere (harita parçası) ayrılır; her parça kendi düzlemine
     açılır, atlastaki çatı tavanının teksel yoğunluğunda ölçeklenir
  2. parçalar zemin atlasının boş yerine (kullanılan teksellerden en az PAY teksel uzak) yerleştirilir
  3. her tekselin dünya konumu, d1'in pişmiş çatı tavanı tekselleri (aynı yöne bakan, en yakın K tanesi,
     doğrusal uzayda ağırlıklı ortalama) ile doldurulur, beş haritanın her biri kendi çözünürlüğünde;
     d1 yüzeyi özgün yüzeye birkaç cm uzak olduğundan ışık sürekli ve yumuşak gelir
  4. taşma payı en yakın parça tekseliyle doldurulur (512'ye küçültülünce kenarda kara çekmesin)
  5. viewer/src/tur10-cati-tavan-bati-isik.js: EKLE sırasıyla üçgen köşesi başına ışık UV'si (uv1)

    python lightmap-cati-bati.py <lmtris.json> <kaynak_dir> <hedef_dir> <tur10-cati-tavan-bati.js> <cikis.js>
"""
import json, os, re, sys, shutil
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.spatial import cKDTree
import importlib.util

_here = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('dunya', os.path.join(_here, 'lightmap-dunya.py'))
dunya = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(dunya)
MAPS = dunya.MAPS

KUTU = ((-6.4, 10.2, -3.7), (0.3, 13.5, -0.4))   # regableTur10AtticWest ile aynı çatı kutusu
REF = 2048          # yerleşim bu çözünürlükte (gok/gece); güneş haritaları 1024
PAY = 10            # parçalar arası ve doluya uzaklık (REF teksel; 512'de 2,5)
K = 8


def oku(js):
    t = open(js).read()
    arr = lambda ad: np.array([float(x) for x in re.search(r'export const ' + ad + r' = new Float32Array\(\[([^\]]*)\]\)', t).group(1).split(',')])
    return arr('EKLE').reshape(-1, 3, 3), arr('AT').reshape(-1, 3)


def kumeler(P):
    n = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); n /= np.linalg.norm(n, axis=1, keepdims=True)
    key = lambda p: tuple(np.round(p, 3))
    kenar = {}
    for t in range(len(P)):
        for i in range(3):
            e = tuple(sorted((key(P[t, i]), key(P[t, (i + 1) % 3]))))
            kenar.setdefault(e, []).append(t)
    par = list(range(len(P)))
    def f(a):
        while par[a] != a: par[a] = par[par[a]]; a = par[a]
        return a
    for ts in kenar.values():
        for a in ts:
            for b in ts:
                if a < b and n[a] @ n[b] > 0.995: par[f(a)] = f(b)
    g = {}
    for t in range(len(P)): g.setdefault(f(t), []).append(t)
    return list(g.values()), n


def main(trisf, src, dst, ejs, cjs):
    os.makedirs(dst, exist_ok=True)
    if os.path.abspath(src) != os.path.abspath(dst):
        for fn in os.listdir(src): shutil.copy(os.path.join(src, fn), os.path.join(dst, fn))
    T = json.load(open(trisf))['zemin']
    SP = np.array(T['p'], float).reshape(-1, 3, 3); SUV = np.array(T['uv'], float).reshape(-1, 3, 2)
    P, _ = oku(ejs)
    gruplar, n = kumeler(P)
    # kaynak: çatı kutusundaki zemin atlası üçgenleri (d1 tavanı, kalanlar dahil)
    sc = SP.mean(1); lo, hi = np.array(KUTU[0]), np.array(KUTU[1])
    kaynak = np.nonzero(np.all((sc > lo) & (sc < hi), axis=1))[0]
    sn = np.cross(SP[:, 1] - SP[:, 0], SP[:, 2] - SP[:, 0]); sa = np.linalg.norm(sn, axis=1) / 2
    sn /= np.maximum(np.linalg.norm(sn, axis=1, keepdims=True), 1e-12)
    suva = np.abs(np.cross(SUV[:, 1] - SUV[:, 0], SUV[:, 2] - SUV[:, 0])) / 2
    kk = kaynak[sa[kaynak] > 1e-4]
    yog = np.sqrt(suva[kk].sum() * REF * REF / sa[kk].sum())       # teksel / m
    print(f'kaynak {len(kaynak)} üçgen, yoğunluk {yog:.1f} teksel/m, EKLE {len(P)} üçgen, {len(gruplar)} parça')

    # 1. parçaları düzlemlerine aç
    def ac(ts):
        nn = n[ts].mean(0); nn /= np.linalg.norm(nn)
        Q = P[ts].reshape(-1, 3); Q0 = Q - Q.mean(0)
        a = Q0 - np.outer(Q0 @ nn, nn); u, s, vt = np.linalg.svd(a, full_matrices=False)
        e1 = vt[0]; e2 = np.cross(nn, e1)
        uv = np.stack([Q0 @ e1, Q0 @ e2], 1) * yog
        uv -= uv.min(0)
        return (list(ts), uv.reshape(-1, 3, 2), np.ceil(uv.max(0)).astype(int) + 1)
    # 2. boş yere yerleştir (REF ızgarası, doluya PAY uzak). Sitede kaldırılan d1 üçgenlerinin yeri de dolu sayılır:
    # başka bir onarım (komşudan ışık UV'si ödünç alan üçgenler) oraya bakıyor olabilir.
    dolu = dunya.raster(SUV, REF) > 0
    dolu = ndimage.binary_dilation(dolu, iterations=PAY)
    UV1 = np.zeros((len(P), 3, 2))
    def yerlestir(w, h):
        W2, H2 = w + PAY, h + PAY
        ii = np.pad(dolu.astype(np.int32).cumsum(0).cumsum(1), ((1, 0), (1, 0)))
        s = ii[H2:, W2:] - ii[:-H2, W2:] - ii[H2:, :-W2] + ii[:-H2, :-W2]
        yx = np.argwhere(s == 0)
        if not len(yx): return None
        y0, x0 = yx[np.lexsort((yx[:, 1], yx[:, 0]))][0]
        dolu[y0:y0 + H2, x0:x0 + W2] = True
        return x0 + PAY // 2, y0 + PAY // 2
    bekleyen = sorted([ac(ts) for ts in gruplar], key=lambda x: -x[2].prod()); bolundu = 0; parca_say = 0; kucult = 0
    while bekleyen:
        ts, uv, (w, h) = bekleyen.pop(0)
        yer = yerlestir(w, h)
        if yer is None:
            if len(ts) == 1:
                # tek üçgen bile sığmıyor (uzun ince): ışık tavanda yavaş değişir, yoğunluk düşürülür
                if w < 8 and h < 8: raise SystemExit(f'atlasta yer yok ({w}x{h})')
                uv = uv * 0.75; bekleyen.append((ts, uv, np.ceil(uv.reshape(-1, 2).max(0)).astype(int) + 1))
                bekleyen.sort(key=lambda x: -x[2].prod()); kucult += 1; continue
            bolundu += 1; yarim = len(ts) // 2
            bekleyen += [ac(ts[:yarim]), ac(ts[yarim:])]; bekleyen.sort(key=lambda x: -x[2].prod()); continue
        UV1[ts] = (uv + list(yer)) / REF; parca_say += 1
    print(f'{parca_say} ada ({bolundu} bölme, {kucult} küçültme)')
    # doldurma kümeleri: düzlem grupları (ada bölünse de kaynak seçimi aynı)
    # 3. doldur
    imgs = {m: np.asarray(Image.open(os.path.join(src, f'zemin_{m}.png')).convert('RGB')).astype(float) / 255 for m in MAPS}
    by_res = {}
    for m, im in imgs.items(): by_res.setdefault(im.shape[0], []).append(m)
    out = {m: im.copy() for m, im in imgs.items()}
    for W, maps in sorted(by_res.items(), reverse=True):
        sid = dunya.raster(SUV, W)
        sys_, sxs, stt, spos = dunya.texel_world(sid, SUV, SP, W)
        ks = np.isin(stt, kaynak); sys_, sxs, stt, spos = sys_[ks], sxs[ks], stt[ks], spos[ks]
        tid = dunya.raster(UV1, W)
        ys, xs, tt, pos = dunya.texel_world(tid, UV1, P, W)
        for g in range(len(gruplar)):
            ts = np.array(gruplar[g]); nn = n[ts].mean(0); nn /= np.linalg.norm(nn)
            sel = np.isin(tt, ts)
            ok = sn[stt] @ nn > 0.7
            if ok.sum() < K: ok = np.ones(len(stt), bool)
            tree = cKDTree(spos[ok]); d, j = tree.query(pos[sel], k=K)
            w = 1 / (d + 0.03) ** 2; w /= w.sum(1, keepdims=True)
            qy, qx = sys_[ok][j], sxs[ok][j]
            for m in maps:
                lin = (imgs[m][qy, qx] ** 2 * w[..., None]).sum(1)
                out[m][ys[sel], xs[sel]] = np.sqrt(lin)
        # 4. taşma payı
        ic = tid > 0
        pay = ndimage.binary_dilation(ic, iterations=max(2, PAY * W // REF // 2)) & ~ic
        _, (iy, ix) = ndimage.distance_transform_edt(~ic, return_indices=True)
        for m in maps: out[m][pay] = out[m][iy[pay], ix[pay]]
    for m in MAPS:
        Image.fromarray(np.clip(out[m] * 255 + .5, 0, 255).astype(np.uint8)).save(os.path.join(dst, f'zemin_{m}.png'))
    with open(cjs, 'w') as f:
        f.write('// Üretildi: tools/batch-delivery/lightmap-cati-bati.py. tur10-cati-tavan-bati.js EKLE üçgenlerinin zemin\n'
                '// ışık atlasındaki kendi adaları (köşe başına uv1, EKLE sırası). Elle düzenlemeyin.\n')
        f.write('export const UV1 = new Float32Array([' + ','.join(f'{v:.6f}' for v in UV1.ravel()) + ']);\n')
    print('yerleşim', UV1.reshape(-1, 2).min(0), UV1.reshape(-1, 2).max(0))


if __name__ == '__main__':
    main(*sys.argv[1:])
