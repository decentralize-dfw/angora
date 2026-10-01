"""Kara pişmiş üçgenleri ışık haritasında onarır (yeniden pişirmeden).

Tur 10 pişirmesinde bazı yüzler pişirmeden önce yanlış yana çevrilmişti ve
duvarın içinden, kapkara pişti (dış cephede siyah kamalar, iç duvarlarda koyu
üçgenler). Her atlasta üçgenler, aynı düzlemde komşu oldukları bölgelere
ayrılır; bölgenin aydınlık düzeyinin (alan ağırlıklı %75'lik) belirgin
altında kalan üçgen kara sayılır ve dokuları aynı bölgedeki en yakın sağlam
üçgenlerin ortalamasıyla (her harita için ayrı) boyanır.

    python lightmap-onarim.py <lmtris.json> <kaynak_dir> <hedef_dir>
lmtris.json: _lmtris (atlas -> dünya konumu + UV1, düğüm sırası make-tur10 ile aynı)
"""
import json, os, sys, shutil
from collections import defaultdict, deque
import numpy as np
from PIL import Image, ImageDraw

MAPS = ['gok', 'gunes_09', 'gunes_13', 'gunes_17', 'gece']
ESIK = 0.30
YUMUSAT = float(os.environ.get('YUMUSAT', '0'))   # 2048 px haritada yarıçap (px)


def main(trisf, src, dst):
    os.makedirs(dst, exist_ok=True)
    for f in os.listdir(src):
        if not os.path.exists(os.path.join(dst, f)):
            shutil.copy(os.path.join(src, f), os.path.join(dst, f))
    T = json.load(open(trisf))
    rapor = {}
    for atlas, d in T.items():
        P = np.array(d['p'], float).reshape(-1, 3, 3)
        if not len(P):
            continue
        UV = np.array(d['uv'], float).reshape(-1, 3, 2)
        imgs = {m: np.asarray(Image.open(os.path.join(src, f'{atlas}_{m}.png')).convert('RGB')).astype(float) / 255 for m in MAPS}
        n = len(P)
        e1, e2 = P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]
        cr = np.cross(e1, e2); area = np.linalg.norm(cr, axis=1) / 2
        nrm = cr / np.maximum(np.linalg.norm(cr, axis=1, keepdims=True), 1e-12)
        dist = np.einsum('ij,ij->i', nrm, P[:, 0])
        cen = P.mean(1)
        # her harita için üçgen ortalaması (doğrusal = v^2), 7 örnek nokta
        B = np.array([[1/3, 1/3, 1/3], [.6, .2, .2], [.2, .6, .2], [.2, .2, .6], [.45, .45, .1], [.45, .1, .45], [.1, .45, .45]])
        mean = {}
        for m, im in imgs.items():
            h, w = im.shape[:2]
            uv = np.einsum('kj,njc->nkc', B, UV)
            x = np.clip((uv[..., 0] * w).astype(int), 0, w - 1); y = np.clip((uv[..., 1] * h).astype(int), 0, h - 1)
            mean[m] = (im[y, x] ** 2).mean(1)            # n x 3
        lum = mean['gok'].mean(1) + mean['gunes_13'].mean(1) * 0.2
        # düzlemsel komşuluk
        key = lambda v: tuple(np.round(v, 3))
        edges = defaultdict(list)
        for t in range(n):
            for a, b in ((0, 1), (1, 2), (2, 0)):
                k = tuple(sorted((key(P[t, a]), key(P[t, b]))))
                edges[k].append(t)
        adj = defaultdict(set)
        for ts in edges.values():
            for i in ts:
                for j in ts:
                    if i != j and abs(nrm[i] @ nrm[j]) > 0.98 and abs(abs(dist[i]) - abs(dist[j])) < 0.02 and area[i] > 1e-6 and area[j] > 1e-6:
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
        bad = np.zeros(n, bool)
        for k in range(c):
            idx = np.nonzero(comp == k)[0]
            if len(idx) < 3: continue
            o = idx[np.argsort(lum[idx])]; cw = np.cumsum(area[o]); ref = lum[o[np.searchsorted(cw, cw[-1] * 0.75)]]
            if ref <= 1e-5: continue
            bad[idx[lum[idx] < ref * ESIK]] = True
        # onarım değeri: aynı bölgede en yakın 6 sağlam üçgenin alan ağırlıklı ortalaması
        fill = {}
        for k in set(comp[bad]):
            idx = np.nonzero(comp == k)[0]; good = idx[~bad[idx]]
            if not len(good): continue
            for t in idx[bad[idx]]:
                dd = np.linalg.norm(cen[good] - cen[t], axis=1); near = good[np.argsort(dd)[:6]]; wgt = area[near]
                fill[t] = {m: (mean[m][near] * wgt[:, None]).sum(0) / wgt.sum() for m in MAPS}
        for m, im in imgs.items():
            h, w = im.shape[:2]
            out = (im * 255).round().astype(np.uint8).copy()
            for t, val in fill.items():
                mask = Image.new('L', (w, h), 0); dr = ImageDraw.Draw(mask)
                pts = [(UV[t, j, 0] * w, UV[t, j, 1] * h) for j in range(3)]
                x0, y0 = int(min(p[0] for p in pts)) - 2, int(min(p[1] for p in pts)) - 2
                x1, y1 = int(max(p[0] for p in pts)) + 3, int(max(p[1] for p in pts)) + 3
                dr.polygon(pts, fill=1, outline=1)
                sub = np.asarray(mask.crop((max(x0, 0), max(y0, 0), min(x1, w), min(y1, h))), bool)
                enc = np.clip(np.sqrt(np.maximum(val[m], 0)) * 255, 0, 255).astype(np.uint8)
                out[max(y0, 0):min(y1, h), max(x0, 0):min(x1, w)][sub] = enc
            Image.fromarray(out).save(os.path.join(dst, f'{atlas}_{m}.png'))
        # gürültü yumuşatma: her UV adasının KENDİ içinde normalize konvolüsyon (adalar karışmaz)
        if YUMUSAT and atlas in ('duvar', 'zemin', 'cephe'):
            from scipy import ndimage
            for m in MAPS:
                path = os.path.join(dst, f'{atlas}_{m}.png')
                im = np.asarray(Image.open(path).convert('RGB')).astype(float) / 255
                h, w = im.shape[:2]
                lab = Image.new('I', (w, h), 0); dr = ImageDraw.Draw(lab)
                # ada = düzlemsel bölge (comp); her üçgen kendi bölge kimliğiyle boyanır
                for t in range(n):
                    dr.polygon([(UV[t, j, 0] * w, UV[t, j, 1] * h) for j in range(3)], fill=int(comp[t]) + 1)
                L = np.asarray(lab)
                lin = im ** 2
                r = max(1, int(round(YUMUSAT * w / 2048)))
                out = lin.copy()
                objs = ndimage.find_objects(L)
                for k, sl in enumerate(objs, start=1):
                    if sl is None: continue
                    y0, y1 = max(sl[0].start - r, 0), min(sl[0].stop + r, h); x0, x1 = max(sl[1].start - r, 0), min(sl[1].stop + r, w)
                    msk = (L[y0:y1, x0:x1] == k).astype(float)
                    if msk.sum() < 4: continue
                    den = ndimage.uniform_filter(msk, 2 * r + 1)
                    for ch in range(3):
                        num = ndimage.uniform_filter(lin[y0:y1, x0:x1, ch] * msk, 2 * r + 1)
                        sm = np.where(den > 1e-3, num / np.maximum(den, 1e-6), lin[y0:y1, x0:x1, ch])
                        blk = out[y0:y1, x0:x1, ch]; blk[msk > 0] = sm[msk > 0]
                Image.fromarray(np.clip(np.sqrt(out) * 255, 0, 255).round().astype(np.uint8)).save(path)
        rapor[atlas] = {'ucgen': int(n), 'kara': int(bad.sum()), 'onarilan': len(fill), 'alan_m2': round(float(area[list(fill)].sum()) if fill else 0, 1)}
        print(atlas, rapor[atlas], flush=True)
    json.dump(rapor, open(os.path.join(dst, 'onarim-raporu.json'), 'w'), indent=1)


if __name__ == '__main__':
    main(*sys.argv[1:4])
