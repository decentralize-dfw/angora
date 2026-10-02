"""Işık haritasında TAMAMEN kara kalmış üçgenleri dünya uzayında, aynı düzlemdeki doğru pişmiş komşularından doldurur.

lightmap-dolgu.py yalnız aynı UV adasının içinde doldurabiliyordu. Tur 10 pişirmesinde
içe çevrilen üçgenler xatlas'ta ayrı adaya düştü (normali ters): adanın tamamı kara,
dolgu ona dokunmadı. Sitede dış cephede pencere köşelerinden inen kara kamalar, iç
duvarlarda kahve/kara üçgenler, tavanda kara şeritler bunlar.

Her atlas için:
  1. üçgen başına 7 örnekle "kara" (5 haritanın hepsinde ~0) olanlar bulunur
  2. kara üçgenin aynı düzlemdeki (normal |cos| > 0.95, düzlem uzaklığı < 3 cm) ve en
     fazla YARICAP uzaktaki aydınlık üçgenleri aday olur
  3. kara üçgenin her tekseli, adayların gök haritasında aydınlık tekselleri arasından
     dünya uzayında en yakın K tanesinin ağırlıklı ortalamasını alır (doğrusal uzayda),
     beş haritanın her biri kendi çözünürlüğünde
  4. doldurulan adanın taşma payı (gutter) yeniden yayılır (çift doğrusal örnekleme kenarda kara çekmesin)
Aday bulunamayan kara üçgenler (iki yanı da kapalı, görünmeyen yüzler) olduğu gibi kalır.

    python lightmap-dunya.py <lmtris.json> <kaynak_dir> <hedef_dir>
"""
import json, os, sys, shutil
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.spatial import cKDTree

MAPS = ['gok', 'gunes_09', 'gunes_13', 'gunes_17', 'gece']
KARA = 2.5 / 255
YARICAP = 1.2      # m - kara üçgenden en fazla bu uzaklıktaki komşulardan beslenir
K = 6
BARY = np.array([[1/3, 1/3, 1/3], [.6, .2, .2], [.2, .6, .2], [.2, .2, .6], [.45, .45, .1], [.1, .45, .45], [.45, .1, .45]])


def raster(UV, W):
    """üçgen kimliği (t+1) rasteri, W x W"""
    lab = Image.new('I', (W, W), 0); dr = ImageDraw.Draw(lab)
    for t in range(len(UV)):
        dr.polygon([(UV[t, j, 0] * W, UV[t, j, 1] * W) for j in range(3)], fill=t + 1)
    return np.asarray(lab).astype(np.int64)


def texel_world(ids, UV, P, W):
    """her dolu tekselin dünya konumu (barisentrik, kenar dışına taşanlar kırpılır)"""
    ys, xs = np.nonzero(ids)
    t = ids[ys, xs] - 1
    u = (xs + .5) / W; v = (ys + .5) / W
    a, b, c = UV[t, 0], UV[t, 1], UV[t, 2]
    v0 = b - a; v1 = c - a; v2 = np.stack([u - a[:, 0], v - a[:, 1]], 1)
    d00 = (v0 * v0).sum(1); d01 = (v0 * v1).sum(1); d11 = (v1 * v1).sum(1)
    d20 = (v2 * v0).sum(1); d21 = (v2 * v1).sum(1)
    den = d00 * d11 - d01 * d01; den[np.abs(den) < 1e-18] = 1e-18
    l1 = (d11 * d20 - d01 * d21) / den; l2 = (d00 * d21 - d01 * d20) / den
    l1r, l2r = l1.copy(), l2.copy()
    l1 = np.clip(l1, 0, 1); l2 = np.clip(l2, 0, 1); s = l1 + l2; over = s > 1
    l1[over] /= s[over]; l2[over] /= s[over]; l0 = 1 - l1 - l2
    pos = l0[:, None] * P[t, 0] + l1[:, None] * P[t, 1] + l2[:, None] * P[t, 2]
    # Teksel merkezi üçgenin dışında kalan (raster kenarı taşan) teksel: kırpılıp yeniden ölçeklenen barisentrik
    # onu bir köşeye atabiliyordu (ince/kıl üçgende 2 m ötedeki köşeye); kıl üçgen doldurulurken o köşenin ışığı
    # alınıp komşu geniş yüzün içinde kesik kesik koyu noktalar kalıyordu (çatı diz duvarı, 02.10). Bunlar UV'de
    # üçgenin en yakın kenar noktasına izdüşürülür.
    # Yalnız atlasta ince üçgenlerde (UV'de yüksekliği < 3 teksel: dünyada 4 cm'lik ama atlasta 1 teksellik kat holü
    # tavan şeridi de); öbürlerinde kırpma zaten komşu kenarda kalıyor, bütün atlası değiştirmemek için eski davranış.
    EU = np.stack([np.linalg.norm(UV[:, (i + 1) % 3] - UV[:, i], axis=1) for i in range(3)], 1).max(1)
    cu = np.abs((UV[:, 1, 0] - UV[:, 0, 0]) * (UV[:, 2, 1] - UV[:, 0, 1]) - (UV[:, 1, 1] - UV[:, 0, 1]) * (UV[:, 2, 0] - UV[:, 0, 0]))
    ince = cu / np.maximum(EU, 1e-12) * W < 3
    out = ((l1r < 0) | (l2r < 0) | (l1r + l2r > 1)) & ince[t]
    if out.any():
        k = np.nonzero(out)[0]; tk = t[k]; q = np.stack([u[k], v[k]], 1)
        best = np.full(len(k), np.inf); bp = pos[k].copy()
        for i0, i1 in ((0, 1), (1, 2), (2, 0)):
            A = UV[tk, i0]; B = UV[tk, i1]; dd = B - A
            sp = np.clip(((q - A) * dd).sum(1) / np.maximum((dd * dd).sum(1), 1e-18), 0, 1)
            dist = np.linalg.norm(A + dd * sp[:, None] - q, axis=1); w = dist < best
            best[w] = dist[w]; bp[w] = (P[tk, i0] + (P[tk, i1] - P[tk, i0]) * sp[:, None])[w]
        pos[k] = bp
    return ys, xs, t, pos


def main(trisf, src, dst):
    os.makedirs(dst, exist_ok=True)
    if os.path.abspath(src) != os.path.abspath(dst):
        for f in os.listdir(src):
            shutil.copy(os.path.join(src, f), os.path.join(dst, f))
    T = json.load(open(trisf)); rapor = {}
    for atlas, d in T.items():
        P = np.array(d['p'], float).reshape(-1, 3, 3)
        if not len(P): continue
        UV = np.array(d['uv'], float).reshape(-1, 3, 2)
        imgs = {m: np.asarray(Image.open(os.path.join(src, f'{atlas}_{m}.png')).convert('RGB')).astype(float) / 255 for m in MAPS}
        n = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); area = np.linalg.norm(n, axis=1) / 2
        n = n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
        cen = P.mean(1); rad = np.linalg.norm(P - cen[:, None], axis=2).max(1)
        # 1. kara üçgenler
        dk_n = np.zeros(len(P))
        for b in BARY:
            uv = np.einsum('j,tjk->tk', b, UV); dk = np.ones(len(P), bool)
            for im in imgs.values():
                h = im.shape[0]; x = np.clip((uv[:, 0] * h).astype(int), 0, h - 1); y = np.clip((uv[:, 1] * h).astype(int), 0, h - 1)
                dk &= im[y, x].max(1) < KARA
            dk_n += dk
        kara = dk_n / len(BARY) >= 0.5
        iyi = ~kara & (area > 1e-6)
        # 2. aday üçgenler (aynı düzlem, yakın)
        tree = cKDTree(cen[iyi]); iyi_idx = np.nonzero(iyi)[0]
        aday = {}
        for t in np.nonzero(kara & (area > 1e-6))[0]:
            near = iyi_idx[tree.query_ball_point(cen[t], YARICAP + rad[t] + rad.max())]
            if not len(near): continue
            ok = (np.abs(n[near] @ n[t]) > 0.95) & (np.abs(np.einsum('ij,j->i', cen[near] - cen[t], n[t])) < 0.03)
            near = near[ok]
            if len(near): aday[t] = near
        # 3. her çözünürlükte doldur
        doldu = np.zeros(len(P), bool); px_say = 0
        by_res = {}
        for m, im in imgs.items(): by_res.setdefault(im.shape[0], []).append(m)
        out = {m: im.copy() for m, im in imgs.items()}
        for W, maps in sorted(by_res.items(), reverse=True):
            ids = raster(UV, W)
            ys, xs, tt, pos = texel_world(ids, UV, P, W)
            order = np.argsort(tt, kind='stable'); tt_s = tt[order]
            starts = np.searchsorted(tt_s, np.arange(len(P))); ends = np.searchsorted(tt_s, np.arange(len(P)), 'right')
            gref = imgs['gok']; gh = gref.shape[0]
            gok_iyi = gref[np.clip((ys + .5) * gh // W, 0, gh - 1).astype(int), np.clip((xs + .5) * gh // W, 0, gh - 1).astype(int)].max(1) >= KARA
            filled = np.zeros((W, W), bool)
            for t, near in aday.items():
                tex = order[starts[t]:ends[t]]
                if not len(tex): continue
                src_tex = np.concatenate([order[starts[s]:ends[s]] for s in near])
                src_tex = src_tex[gok_iyi[src_tex]]
                if not len(src_tex): continue
                # kara üçgenin kutusu + YARICAP içindeki kaynaklar
                lo = pos[tex].min(0) - YARICAP; hi = pos[tex].max(0) + YARICAP
                q = src_tex[np.all((pos[src_tex] >= lo) & (pos[src_tex] <= hi), axis=1)]
                if not len(q): continue
                kt = cKDTree(pos[q]); kk = min(K, len(q))
                dist, j = kt.query(pos[tex], k=kk)
                if kk == 1: dist = dist[:, None]; j = j[:, None]
                w = 1 / (dist + 0.03) ** 2; w /= w.sum(1, keepdims=True)
                sy, sx = ys[q[j]], xs[q[j]]
                for m in maps:
                    lin = imgs[m][sy, sx] ** 2                       # (ntex, kk, 3)
                    out[m][ys[tex], xs[tex]] = np.sqrt((lin * w[..., None]).sum(1))
                filled[ys[tex], xs[tex]] = True; doldu[t] = True
                if W == max(by_res): px_say += len(tex)
            # 4. taşma payı: doldurulan adaların çevresindeki boş tekseller en yakın dolu tekselden
            if filled.any():
                empty = ids == 0
                ring = ndimage.binary_dilation(filled, iterations=4) & empty
                _, (iy, ix) = ndimage.distance_transform_edt(empty, return_indices=True)
                ry, rx = np.nonzero(ring)
                for m in maps:
                    out[m][ry, rx] = out[m][iy[ry, rx], ix[ry, rx]]
        for m in MAPS:
            Image.fromarray(np.clip(out[m] * 255, 0, 255).round().astype(np.uint8)).save(os.path.join(dst, f'{atlas}_{m}.png'))
        kalan = kara & ~doldu
        rapor[atlas] = {'kara_ucgen': int(kara.sum()), 'kara_m2': round(float(area[kara].sum()), 1),
                        'doldurulan_ucgen': int(doldu.sum()), 'doldurulan_m2': round(float(area[doldu].sum()), 1),
                        'kalan_m2': round(float(area[kalan].sum()), 1), 'doldurulan_px': px_say}
        print(atlas, rapor[atlas], flush=True)
    json.dump(rapor, open(os.path.join(dst, 'dunya-dolgu-raporu.json'), 'w'), indent=1)


if __name__ == '__main__':
    main(*sys.argv[1:4])
