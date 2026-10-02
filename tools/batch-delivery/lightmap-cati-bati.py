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
KK = 24


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
        ks = np.isin(stt, kaynak)
        # pişmede kara kalmış (duvara gömülü / görünmeyen) kaynak tekseller dışarıda: aktarılınca köşede koyu leke
        g = imgs['gok']; gh = g.shape[0]
        ks &= g[np.clip((sys_ + .5) * gh // W, 0, gh - 1).astype(int), np.clip((sxs + .5) * gh // W, 0, gh - 1).astype(int)].max(1) >= dunya.KARA
        sys_, sxs, stt, spos = sys_[ks], sxs[ks], stt[ks], spos[ks]
        tid = dunya.raster(UV1, W)
        ys, xs, tt, pos = dunya.texel_world(tid, UV1, P, W)
        # Kaynak her teksel için ortak havuzdan: kıl üçgenler hariç (duvar dibindeki d1 şeritleri temas gölgesinde koyu),
        # en yakın KK teksel, ağırlık = yön benzerliği^2 / uzaklık^2. Eskiden düzlem kümesi başına ayrı kaynak seçiliyordu:
        # neredeyse eş düzlemli iki komşu küme farklı kaynak bulunca aralarında testere dişli ton dikişi kalıyordu.
        genis = sa[stt] > 0.02
        if genis.sum() >= KK: sys_, sxs, stt, spos = sys_[genis], sxs[genis], stt[genis], spos[genis]
        d, j = cKDTree(spos).query(pos, k=KK)
        cosw = np.clip(np.einsum('tkc,tc->tk', sn[stt[j]], n[tt]), 0, 1) ** 2
        w = cosw / (d + 0.05) ** 2
        zayif = w.sum(1) < 1e-6
        w[zayif] = 1 / (d[zayif] + 0.05) ** 2
        w /= w.sum(1, keepdims=True)
        qy, qx = sys_[j], sxs[j]
        for m in maps:
            out[m][ys, xs] = np.sqrt((imgs[m][qy, qx] ** 2 * w[..., None]).sum(1))
        # aykırı teksel: kaynakta d1 mahyasının kiriş/lamba izi (özgün mahyada koyu üçgen). Her haritada 40 cm içindeki
        # aynı yönlü yeni teksellerin ortancasının 0,7 katından koyu ya da 1,6 katından parlak teksel, ortancaya yakın
        # komşularının ortalamasını alır (güneş lekesi gibi geniş geçişlere dokunmaz).
        tr = cKDTree(pos); nb = tr.query_ball_point(pos, 0.4)
        nb = [np.array(lst)[n[tt[np.array(lst)]] @ n[tt[i]] > 0.9] for i, lst in enumerate(nb)]
        for m in maps:   # her harita kendi ölçütüyle (gece haritasında lamba gövdesinin koyu izi, gökte parlak leke)
            lg = out[m][ys, xs].mean(1); yeni = out[m][ys, xs].copy()
            for i, lst in enumerate(nb):
                if len(lst) < 8: continue
                med = np.median(lg[lst])
                if lg[i] < 0.7 * med or lg[i] > 1.6 * med:
                    iyi = lst[(lg[lst] >= 0.9 * med) & (lg[lst] <= 1.15 * med)]
                    if len(iyi): yeni[i] = np.sqrt((out[m][ys[iyi], xs[iyi]] ** 2).mean(0))
            out[m][ys, xs] = yeni
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
    duvar_doldur(json.load(open(trisf))['duvar'], SP[kaynak], src, dst, P)


def duvar_doldur(T, SPc, src, dst, Pnew=None):
    """Özgün tavan d1'inkinden yüksek: kuzey/güney diz duvarlarının (ve kutudaki öbür dik duvarların) d1 tavanının
    ÜSTÜNDE kalan kısmı pişirmede görünmüyordu, kara/koyu gri pişti; özgün tavan gelince açığa çıktı (yan yüzler koyu
    gri). Böyle tekseller aynı duvar düzleminde d1 tavanının en az 25 cm altındaki aydınlık tekselleriyle doldurulur.
    SPc: d1 tavan üçgenleri (dünya)."""
    P = np.array(T['p'], float).reshape(-1, 3, 3); UV = np.array(T['uv'], float).reshape(-1, 3, 2)
    c = P.mean(1); n = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); A = np.linalg.norm(n, axis=1) / 2
    n /= np.maximum(2 * A[:, None], 1e-12)
    lo, hi = np.array(KUTU[0]), np.array(KUTU[1])
    duvar = np.nonzero(np.all((c > lo - [0, 1.0, 0]) & (c < hi), axis=1) & (np.abs(n[:, 1]) < 0.2) & (A > 1e-5))[0]
    # d1 tavanı: xz izdüşümünde nokta-üçgen, en alçak tavan
    cn = np.cross(SPc[:, 1] - SPc[:, 0], SPc[:, 2] - SPc[:, 0]); tav = SPc[cn[:, 1] < -1e-9]
    def tavan_y(q, tav=tav):
        y = np.full(len(q), np.inf)
        for t in tav:
            a, b, cc = t[:, [0, 2]]; v0, v1, v2 = b - a, cc - a, q - a
            den = v0[0] * v1[1] - v1[0] * v0[1]
            if abs(den) < 1e-12: continue
            l1 = (v2[:, 0] * v1[1] - v1[0] * v2[:, 1]) / den; l2 = (v0[0] * v2[:, 1] - v2[:, 0] * v0[1]) / den
            ic = (l1 >= -1e-6) & (l2 >= -1e-6) & (l1 + l2 <= 1 + 1e-6)
            yy = t[0, 1] + l1 * (t[1, 1] - t[0, 1]) + l2 * (t[2, 1] - t[0, 1])
            y = np.where(ic, np.minimum(y, yy), y)
        return y
    imgs = {m: np.asarray(Image.open(os.path.join(src, f'duvar_{m}.png')).convert('RGB')).astype(float) / 255 for m in MAPS}
    out = {m: np.asarray(Image.open(os.path.join(dst, f'duvar_{m}.png')).convert('RGB')).astype(float) / 255 for m in MAPS}
    by_res = {}
    for m, im in imgs.items(): by_res.setdefault(im.shape[0], []).append(m)
    say = 0
    for W, maps in sorted(by_res.items(), reverse=True):
        ids = dunya.raster(UV[duvar], W)
        ys, xs, tt, pos = dunya.texel_world(ids, UV[duvar], P[duvar], W)
        tn = n[duvar][tt]
        ty = tavan_y((pos + tn * 0.06)[:, [0, 2]])
        g = imgs['gok']; gh = g.shape[0]
        isik = g[np.clip((ys + .5) * gh // W, 0, gh - 1).astype(int), np.clip((xs + .5) * gh // W, 0, gh - 1).astype(int)].max(1) >= dunya.KARA
        # d1 tavanının üstü + özgün tavanın daha yüksek olduğu yerde eski köşe birleşiminin gölge bandı (22 cm; duvarda
        # eski tavan çizgisi boyunca kesik kesik koyu çizgi kalıyordu)
        ny = tavan_y((pos + tn * 0.06)[:, [0, 2]], Pnew) if Pnew is not None else np.full(len(pos), np.inf)
        yuksek = np.isfinite(ny) & (ny > ty + 0.05)
        gizli = np.isfinite(ty) & ((pos[:, 1] > ty - 0.02) | (yuksek & (pos[:, 1] > ty - 0.22)))
        kaynak = np.isfinite(ty) & (pos[:, 1] < ty - 0.30) & isik
        degisen = np.zeros((W, W), bool)
        # düzlem düzlem (normal + düzlem uzaklığı)
        anah = np.round(np.c_[tn * 20, (tn * pos).sum(1, keepdims=True) * 50]).astype(int)
        for k in np.unique(anah[gizli], axis=0):
            ayni = np.all(anah == k, axis=1)
            g_i, k_i = np.nonzero(ayni & gizli)[0], np.nonzero(ayni & kaynak)[0]
            if len(k_i) < K: continue
            d, j = cKDTree(pos[k_i]).query(pos[g_i], k=min(16, len(k_i)))
            w = 1 / (d + 0.05) ** 2; w /= w.sum(1, keepdims=True)
            qy, qx = ys[k_i][j], xs[k_i][j]
            for m in maps: out[m][ys[g_i], xs[g_i]] = np.sqrt((imgs[m][qy, qx] ** 2 * w[..., None]).sum(1))
            degisen[ys[g_i], xs[g_i]] = True; say += len(g_i)
        # değişen adaların taşma payı
        tum = dunya.raster(UV, W) > 0
        pay = ndimage.binary_dilation(degisen, iterations=3) & ~tum
        _, (iy, ix) = ndimage.distance_transform_edt(~tum, return_indices=True)
        for m in maps: out[m][pay] = out[m][iy[pay], ix[pay]]
    for m in MAPS:
        Image.fromarray(np.clip(out[m] * 255 + .5, 0, 255).astype(np.uint8)).save(os.path.join(dst, f'duvar_{m}.png'))
    print(f'duvar: {len(duvar)} üçgen, {say} gizli teksel dolduruldu')


if __name__ == '__main__':
    main(*sys.argv[1:])
