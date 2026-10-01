"""Işık haritasında, aydınlık bir yüzeyin İÇİNDE sıfır kalmış (kapkara) bölgeleri doldurur.

Tur 10 pişirmesinde bazı yüzeylerin bir kısmı, üst üste binen başka bir yüzeyin
arkasında kaldığı için hiç ışık almadan (bütün haritalarda 0) pişti: dış cephede
pencere köşelerinden inen siyah kamalar, iç duvarlarda koyu üçgenler. Her UV adası
(aynı düzlemdeki komşu üçgenler) ayrı ele alınır; adanın bütün haritalarda sıfır
kalan pikselleri, aynı adanın en yakın aydınlık pikseliyle doldurulur ve geçiş
yumuşatılır. Tamamen kara adalara (görünmeyen arka yüzler) dokunulmaz.

Ardından iki onarım daha (yalnız iç atlaslar):
  * leke: gök ve güneş-sekmesi haritalarında 512 örnek + OIDN'den kalan 10-40 cm'lik
    koyu lekeler (az ışık alan merdiven boşluğu, merdiven altı, hol). Her adada kenar
    korumalı (iki yanlı) yumuşatma; ada kenarına / gizli bölgeye yakın pikseller (temas
    gölgesi, köşe kararması) neredeyse dokunulmadan kalır. Gece haritası (armatürlerin
    doğrudan ışığı, keskin korkuluk gölgeleri) yumuşatılmaz.
  * plaka: ön duvar yüzündeki delikten 3 cm arkadaki ikinci duvar yüzü görünüyor; iki
    ayrı pişmiş yüzün ortak kenarında ışık sıçraması "duvara yapışık plaka" gibi
    görünür. Arka yüzün ışığı ortak kenarda ön yüze eşitlenir, içeride kendine döner.

    python lightmap-dolgu.py <lmtris.json> <kaynak_dir> <hedef_dir>
"""
import json, os, sys, shutil
from collections import defaultdict, deque
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

MAPS = ['gok', 'gunes_09', 'gunes_13', 'gunes_17', 'gece']
KARA = 2.5 / 255   # kodlanmış değer eşiği
LUMW = np.array([0.2126, 0.7152, 0.0722])
# leke yumuşatma: uzamsal sigma, haritanın KENDİ çözünürlüğünde piksel (duvar 2048: 29,8 px/m, 1024: 14,9 px/m)
LEKE_SIGMA = {'gok': 5.0, 'gunes_09': 3.0, 'gunes_13': 3.0, 'gunes_17': 3.0}
LEKE_ATLAS = ('duvar', 'zemin')
LEKE_ARALIK = 0.6  # aralık sigması (ln parlaklık): bundan güçlü kontrast (temas gölgesi) karışmaz
# (atlas, duvar ekseni, normal işareti, ön ve arka yüz koordinatı, kutu (diğer iki eksen, m), geçiş genişliği, gölge dudağı)
PLAKALAR = [
    # bodrum-giriş merdiveni boşluğunun doğu duvarı (sahanlık y 1,55 üstü): ön yüz LM_duvar_001 x 4,088'de
    # delik (z -3,085..-1,935, y 0..3,10 + z -2,115..-1,935 y 3,295'e kadar); delikten LM_duvar_002 x 4,118 görünüyor
    dict(atlas='duvar', eksen=0, isaret=-1, on=4.088, arka=4.118, kutu=((-3.13, -1.90), (1.50, 3.32)), genislik=0.30, dudak=0.05),
]


def components(P):
    n = len(P)
    e1, e2 = P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]
    cr = np.cross(e1, e2); nrm = cr / np.maximum(np.linalg.norm(cr, axis=1, keepdims=True), 1e-12)
    dist = np.einsum('ij,ij->i', nrm, P[:, 0])
    edges = defaultdict(list)
    for t in range(n):
        for a, b in ((0, 1), (1, 2), (2, 0)):
            edges[tuple(sorted((tuple(np.round(P[t, a], 3)), tuple(np.round(P[t, b], 3)))))].append(t)
    adj = defaultdict(set)
    for ts in edges.values():
        for i in ts:
            for j in ts:
                if i != j and abs(nrm[i] @ nrm[j]) > 0.98 and abs(abs(dist[i]) - abs(dist[j])) < 0.02:
                    adj[i].add(j)
    comp = -np.ones(n, int); c = 0
    for s in range(n):
        if comp[s] >= 0: continue
        q = deque([s]); comp[s] = c
        while q:
            u = q.popleft()
            for v in adj[u]:
                if comp[v] < 0: comp[v] = c; q.append(v)
        c += 1
    return comp


def leke(lin, M, sig, sr=LEKE_ARALIK):
    """Bir adanın doğrusal kırpıntısını (h,w,3) M maskesi içinde kenar korumalı yumuşatır."""
    g = lambda a, s: ndimage.gaussian_filter(a, s, mode='constant')
    Mf = M.astype(float); den1 = np.maximum(g(Mf, 1.0), 1e-6)
    small = np.stack([g(lin[..., c] * Mf, 1.0) for c in range(3)], -1) / den1[..., None]
    guide = np.log(np.maximum(small @ LUMW, 1e-7))           # aralık ağırlığı gürültüsüz kılavuzdan
    lo, hi = np.percentile(guide[M], 0.5), np.percentile(guide[M], 99.5); hi = max(hi, lo + 1e-3)
    levels = np.linspace(lo, hi, int(np.clip(np.ceil((hi - lo) / sr) + 1, 2, 14))); step = levels[1] - levels[0]
    gc = np.clip(guide, lo, hi); out = np.zeros_like(lin); wsum = np.zeros(M.shape)
    for L in levels:                                          # parçalı doğrusal iki yanlı süzgeç
        W = Mf * np.exp(-0.5 * ((guide - L) / sr) ** 2)
        J = np.stack([g(W * lin[..., c], sig) for c in range(3)], -1) / np.maximum(g(W, sig), 1e-9)[..., None]
        a = np.clip(1 - np.abs(gc - L) / step, 0, 1); out += a[..., None] * J; wsum += a
    out /= np.maximum(wsum, 1e-9)[..., None]
    # ada kenarından / gizli bölgeden 2 sigma içinde yalnız 1 px yumuşatma: temas gölgeleri yerinde kalır
    t = np.clip(ndimage.distance_transform_edt(M) / (2 * sig), 0, 1); t = t * t * (3 - 2 * t)
    return small + t[..., None] * (out - small)


def _bary(T, q):
    a, b, c = T[:, 0], T[:, 1], T[:, 2]
    v0, v1, v2 = b - a, c - a, q - a
    d00 = (v0 * v0).sum(1); d01 = (v0 * v1).sum(1); d11 = (v1 * v1).sum(1); d20 = (v2 * v0).sum(1); d21 = (v2 * v1).sum(1)
    den = d00 * d11 - d01 * d01; den[den == 0] = 1
    bv = (d11 * d20 - d01 * d21) / den; bw = (d00 * d21 - d01 * d20) / den
    return np.stack([1 - bv - bw, bv, bw], -1)


def _izgara(P2, UV, lo, hi, cell):
    """2B dünya koordinatındaki üçgenleri ızgaraya çizer: (üçgen no, UV) ızgaraları."""
    W = int(np.ceil((hi[0] - lo[0]) / cell)); H = int(np.ceil((hi[1] - lo[1]) / cell))
    lab = Image.new('I', (W, H), 0); dr = ImageDraw.Draw(lab)
    for t in range(len(P2)):
        dr.polygon([((p[0] - lo[0]) / cell, (p[1] - lo[1]) / cell) for p in P2[t]], fill=t + 1)
    L = np.asarray(lab).astype(np.int64) - 1; uv = np.zeros((H, W, 2))
    yy, xx = np.nonzero(L >= 0); t = L[yy, xx]
    q = np.stack([lo[0] + (xx + 0.5) * cell, lo[1] + (yy + 0.5) * cell], -1)
    uv[yy, xx] = np.einsum('nk,nkj->nj', _bary(P2[t], q), UV[t])
    return L, uv


def _ornekle(img, uv):
    H, W = img.shape[:2]; x = uv[..., 0] * W - 0.5; y = uv[..., 1] * H - 0.5
    x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int); fx = (x - x0)[..., None]; fy = (y - y0)[..., None]
    g = lambda yy, xx: img[np.clip(yy, 0, H - 1), np.clip(xx, 0, W - 1)]
    return g(y0, x0) * (1 - fx) * (1 - fy) + g(y0, x0 + 1) * fx * (1 - fy) + g(y0 + 1, x0) * (1 - fx) * fy + g(y0 + 1, x0 + 1) * fx * fy


def plaka(P, UV, lins, p, cell=0.01):
    """Ön yüzdeki delikten görünen arka yüzün ışığını ortak kenarlarda ön yüze eşitler (lins yerinde değişir)."""
    ax = p['eksen']; o = {0: [2, 1], 1: [0, 2], 2: [0, 1]}[ax]
    cr = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); nrm = cr / np.maximum(np.linalg.norm(cr, axis=1, keepdims=True), 1e-12)
    duz = lambda c: (np.abs(P[:, :, ax] - c).max(1) < 0.003) & (nrm[:, ax] * p['isaret'] > 0.99)
    (a0, a1), (b0, b1) = p['kutu']; m = p['genislik'] + 0.1
    lo, hi = np.array([a0 - m, b0 - m]), np.array([a1 + m, b1 + m]); P2 = P[:, :, o]
    kutuda = (P2[:, :, 0].max(1) > lo[0]) & (P2[:, :, 0].min(1) < hi[0]) & (P2[:, :, 1].max(1) > lo[1]) & (P2[:, :, 1].min(1) < hi[1])
    ri = np.nonzero(duz(p['arka']) & kutuda)[0]; fi = np.nonzero(duz(p['on']) & kutuda)[0]
    if not len(ri) or not len(fi): return 0
    Lr, uvr = _izgara(P2[ri], UV[ri], lo, hi, cell); Lf, uvf = _izgara(P2[fi], UV[fi], lo, hi, cell)
    H, W = Lr.shape; AA, BB = np.meshgrid(lo[0] + (np.arange(W) + 0.5) * cell, lo[1] + (np.arange(H) + 0.5) * cell)
    front = Lf >= 0
    hole = (AA > a0) & (AA < a1) & (BB > b0) & (BB < b1) & (Lr >= 0) & ~front
    if hole.sum() < 50: return 0
    shared = hole & ndimage.binary_dilation(ndimage.binary_opening(front, iterations=3), iterations=2)  # köşe şeritleri sayılmaz
    d, (iy, ix) = ndimage.distance_transform_edt(~shared, return_indices=True); d = d * cell
    ic = ndimage.binary_erosion(hole, iterations=int(round(p['dudak'] / cell)))
    t = np.clip(1 - d / p['genislik'], 0, 1); t = t * t * (3 - 2 * t)
    g = lambda X, M: ndimage.gaussian_filter(X * M, 0.04 / cell) / np.maximum(ndimage.gaussian_filter(M * 1.0, 0.04 / cell), 1e-6)
    n = 0
    for lin in lins.values():
        F = np.where(front, _ornekle(lin, uvf) @ LUMW, 0.0); R = np.where(hole, _ornekle(lin, uvr) @ LUMW, 0.0)
        oran = np.where(shared, g(F, front * 1.0) / np.maximum(g(R, (ic & (d < 0.10)) * 1.0), 1e-9), 1.0)
        c = np.exp(g(np.log(np.clip(oran, 0.25, 4)), shared * 1.0)[iy, ix])
        hedef = np.where(ic, R, g(R, ic * 1.0)) * c ** t       # dudak (ön yüzün 3 cm gölgesi) içeriden doldurulur
        kazanc = np.where(hole, hedef / np.maximum(R, 1e-9), 1.0)
        h, w = lin.shape[:2]
        lab = Image.new('I', (w, h), 0); dr = ImageDraw.Draw(lab)
        for k, tt in enumerate(ri): dr.polygon([(UV[tt, j, 0] * w, UV[tt, j, 1] * h) for j in range(3)], fill=k + 1)
        Lt = np.asarray(lab).astype(np.int64) - 1; yy, xx = np.nonzero(Lt >= 0); k = Lt[yy, xx]
        wp = np.einsum('nk,nkj->nj', _bary(UV[ri][k], np.stack([(xx + 0.5) / w, (yy + 0.5) / h], -1)), P2[ri][k])
        gx = np.clip(((wp[:, 0] - lo[0]) / cell).astype(int), 0, W - 1); gy = np.clip(((wp[:, 1] - lo[1]) / cell).astype(int), 0, H - 1)
        sel = hole[gy, gx]; lin[yy[sel], xx[sel]] *= kazanc[gy[sel], gx[sel]][:, None]; n = max(n, int(sel.sum()))
    return n


def main(trisf, src, dst):
    os.makedirs(dst, exist_ok=True)
    for f in os.listdir(src):
        shutil.copy(os.path.join(src, f), os.path.join(dst, f))
    T = json.load(open(trisf)); rapor = {}
    for atlas, d in T.items():
        P = np.array(d['p'], float).reshape(-1, 3, 3)
        if not len(P): continue
        UV = np.array(d['uv'], float).reshape(-1, 3, 2)
        comp = components(P)
        imgs = {m: np.asarray(Image.open(os.path.join(src, f'{atlas}_{m}.png')).convert('RGB')).astype(float) / 255 for m in MAPS}
        H = max(im.shape[0] for im in imgs.values()); W = H
        # ada etiketi (en yüksek çözünürlükte)
        lab = Image.new('I', (W, H), 0); dr = ImageDraw.Draw(lab)
        for t in range(len(P)):
            dr.polygon([(UV[t, j, 0] * W, UV[t, j, 1] * H) for j in range(3)], fill=int(comp[t]) + 1)
        L = np.asarray(lab)
        up = lambda im: np.asarray(Image.fromarray((im * 255).astype(np.uint8)).resize((W, H), Image.NEAREST)).astype(float) / 255
        dark = np.ones((H, W), bool)
        for m, im in imgs.items():
            dark &= up(im).max(2) < KARA
        dark &= L > 0
        fixed_px = 0; filled = np.zeros((H, W), bool); src_idx = None
        # her ada: bağlı UV bölgesi x düzlem bileşeni
        isl, ni = ndimage.label(L > 0)
        key = isl.astype(np.int64) * (L.max() + 1) + L
        uniq, inv = np.unique(key[L > 0], return_inverse=True)
        region = np.zeros((H, W), np.int64); region[L > 0] = inv + 1
        objs = ndimage.find_objects(region)
        nearest_y = np.zeros((H, W), np.int32); nearest_x = np.zeros((H, W), np.int32)
        for k, sl in enumerate(objs, start=1):
            if sl is None: continue
            r = region[sl] == k; dk = dark[sl] & r; good = r & ~dark[sl]
            if not dk.any() or not good.any(): continue
            _, (iy, ix) = ndimage.distance_transform_edt(~good, return_indices=True)
            yy, xx = np.nonzero(dk)
            nearest_y[sl][yy, xx] = iy[yy, xx] + sl[0].start; nearest_x[sl][yy, xx] = ix[yy, xx] + sl[1].start
            filled[sl] |= dk; fixed_px += int(dk.sum())
        lins, degisti, leke_n = {}, set(), 0
        for m, im in imgs.items():
            h, w = im.shape[:2]; s = H // h
            lin = im ** 2
            fy, fx = np.nonzero(filled[::s, ::s][:h, :w])
            if len(fy):
                out = im.copy()
                ny = np.clip(nearest_y[fy * s, fx * s] // s, 0, h - 1); nx = np.clip(nearest_x[fy * s, fx * s] // s, 0, w - 1)
                out[fy, fx] = im[ny, nx]
                # dolgu bölgesini ada içinde hafifçe yumuşat (doğrusal uzayda)
                lin = out ** 2; mreg = (region[::s, ::s][:h, :w] > 0).astype(float)
                rad = max(1, 3 // s)
                den = ndimage.uniform_filter(mreg, 2 * rad + 1)
                sm = np.stack([ndimage.uniform_filter(lin[..., c] * mreg, 2 * rad + 1) for c in range(3)], -1) / np.maximum(den, 1e-6)[..., None]
                msk = ndimage.binary_dilation(filled[::s, ::s][:h, :w], iterations=rad) & (mreg > 0)
                lin[msk] = sm[msk]; degisti.add(m)
            sig = LEKE_SIGMA.get(m, 0) if atlas in LEKE_ATLAS else 0
            if sig:
                # destek: ada pikselleri, gizli (bütün haritalarda kara, yukarıda doldurulan) pikseller hariç
                sup = np.where(dark[::s, ::s][:h, :w], 0, region[::s, ::s][:h, :w]); pad = int(3 * sig) + 2
                for k, sl in enumerate(ndimage.find_objects(sup), start=1):
                    if sl is None: continue
                    y0, y1 = max(sl[0].start - pad, 0), min(sl[0].stop + pad, h); x0, x1 = max(sl[1].start - pad, 0), min(sl[1].stop + pad, w)
                    M = sup[y0:y1, x0:x1] == k
                    if M.sum() < 12: continue
                    crop = lin[y0:y1, x0:x1]; crop[M] = leke(crop, M, sig)[M]; leke_n += 1
                degisti.add(m)
            lins[m] = lin
        plaka_px = 0
        for p in PLAKALAR:
            if p['atlas'] == atlas:
                plaka_px += plaka(P, UV, lins, p); degisti.update(lins)
        for m in degisti:
            Image.fromarray(np.clip(np.sqrt(np.maximum(lins[m], 0)) * 255, 0, 255).round().astype(np.uint8)).save(os.path.join(dst, f'{atlas}_{m}.png'))
        rapor[atlas] = {'doldurulan_px': fixed_px, 'cozunurluk': H, 'leke_ada': leke_n, 'plaka_px': plaka_px}
        print(atlas, rapor[atlas], flush=True)
    json.dump(rapor, open(os.path.join(dst, 'dolgu-raporu.json'), 'w'), indent=1)


if __name__ == '__main__':
    main(*sys.argv[1:4])
