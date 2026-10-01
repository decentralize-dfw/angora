"""Işık haritasında, aydınlık bir yüzeyin İÇİNDE sıfır kalmış (kapkara) bölgeleri doldurur.

Tur 10 pişirmesinde bazı yüzeylerin bir kısmı, üst üste binen başka bir yüzeyin
arkasında kaldığı için hiç ışık almadan (bütün haritalarda 0) pişti: dış cephede
pencere köşelerinden inen siyah kamalar, iç duvarlarda koyu üçgenler. Her UV adası
(aynı düzlemdeki komşu üçgenler) ayrı ele alınır; adanın bütün haritalarda sıfır
kalan pikselleri, aynı adanın en yakın aydınlık pikseliyle doldurulur ve geçiş
yumuşatılır. Tamamen kara adalara (görünmeyen arka yüzler) dokunulmaz.

    python lightmap-dolgu.py <lmtris.json> <kaynak_dir> <hedef_dir>
"""
import json, os, sys, shutil
from collections import defaultdict, deque
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

MAPS = ['gok', 'gunes_09', 'gunes_13', 'gunes_17', 'gece']
KARA = 2.5 / 255   # kodlanmış değer eşiği


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
        for m, im in imgs.items():
            h, w = im.shape[:2]; s = H // h
            fy, fx = np.nonzero(filled[::s, ::s][:h, :w])
            if not len(fy): continue
            out = im.copy()
            ny = np.clip(nearest_y[fy * s, fx * s] // s, 0, h - 1); nx = np.clip(nearest_x[fy * s, fx * s] // s, 0, w - 1)
            out[fy, fx] = im[ny, nx]
            # dolgu bölgesini ada içinde hafifçe yumuşat (doğrusal uzayda)
            lin = out ** 2; mreg = (region[::s, ::s][:h, :w] > 0).astype(float)
            rad = max(1, 3 // s)
            den = ndimage.uniform_filter(mreg, 2 * rad + 1)
            sm = np.stack([ndimage.uniform_filter(lin[..., c] * mreg, 2 * rad + 1) for c in range(3)], -1) / np.maximum(den, 1e-6)[..., None]
            msk = ndimage.binary_dilation(filled[::s, ::s][:h, :w], iterations=rad) & (mreg > 0)
            lin[msk] = sm[msk]
            Image.fromarray(np.clip(np.sqrt(lin) * 255, 0, 255).round().astype(np.uint8)).save(os.path.join(dst, f'{atlas}_{m}.png'))
        rapor[atlas] = {'doldurulan_px': fixed_px, 'cozunurluk': H}
        print(atlas, rapor[atlas], flush=True)
    json.dump(rapor, open(os.path.join(dst, 'dolgu-raporu.json'), 'w'), indent=1)


if __name__ == '__main__':
    main(*sys.argv[1:4])
