"""Ters yüzünden pişmiş ışık haritası üçgenlerini bulur ve doğru pişmiş komşularından doldurur.

Tur 10 pişirmesinde (tur10-yon.mjs) bazı üçgenler pişirmeden önce görünen yüzünün tersine
çevrildi (oda poligonu duvarın dışına taşıyordu). Cycles onları duvarın / odanın içinden
pişirdi: dış cephede pencere köşelerinden inen koyu kamalar (gök ~0, gece odadaki lambadan
biraz ışık: tam kara değil, lightmap-dolgu/-dunya'nın "kara" ölçütüne takılmıyorlar),
iç duvarlarda kahve kamalar.

Yön testi (embree, bütün pişirme sahnesi engel):
  her üçgenin pişen yüzü (sarılma normali) ve ters yüzü için 3 noktadan 32'şer kosinüs ışını
  dış (cephe): ışınların gökyüzüne kaçma oranı; pişen yüz kapalı (<%5), ters yüz açık (>%12) -> ters;
              ya da gök koyu (<60) + gece lambası belirgin (>12) + ters yüz daha açık -> ters
  iç (duvar, zemin): ortalama çarpma uzaklığı; pişen yüz <0,6 m (duvar boşluğu), ters yüz >1 m ve >2,2 katı -> ters
Ters ve kara üçgenler, aynı düzlemdeki (|cos|>0.95, <3 cm), görünen yüzü aynı yöne bakan,
doğru pişmiş üçgenlerin dünya uzayında en yakın tekselleriyle doldurulur (lightmap-dunya.py).

    python lightmap-yon.py <lmtris.json> <tumtris (bin/json öneki)> <kaynak_dir> <hedef_dir>
"""
import json, os, sys, shutil
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.spatial import cKDTree
import trimesh
from trimesh.ray.ray_pyembree import RayMeshIntersector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import importlib.util
_spec = importlib.util.spec_from_file_location('dunya', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lightmap-dunya.py'))
dunya = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(dunya)

MAPS = dunya.MAPS; KARA = dunya.KARA
NRAY = 32
YARICAP = 1.5
K = 6
SAMPLE = np.array([[1/3, 1/3, 1/3], [.7, .15, .15], [.15, .7, .15], [.15, .15, .7]])


def hemi(nrm, rng):
    """nrm (m,3) etrafında kosinüs ağırlıklı NRAY yön -> (m, NRAY, 3)"""
    m = len(nrm)
    u1 = rng.random((m, NRAY)); u2 = rng.random((m, NRAY))
    r = np.sqrt(u1); th = 2 * np.pi * u2
    x = r * np.cos(th); y = r * np.sin(th); z = np.sqrt(np.maximum(0, 1 - u1))
    a = np.where(np.abs(nrm[:, :1]) < 0.9, np.array([[1, 0, 0]]), np.array([[0, 1, 0]]))
    t1 = np.cross(nrm, a); t1 /= np.linalg.norm(t1, axis=1, keepdims=True); t2 = np.cross(nrm, t1)
    return x[..., None] * t1[:, None] + y[..., None] * t2[:, None] + z[..., None] * nrm[:, None]


def side_stats(rx, P, n, rng):
    """her üçgen, her yüz için (kaçma oranı, ortalama çarpma uzaklığı [3 m kırpık])"""
    out = {}
    for sgn in (1, -1):
        esc = np.zeros(len(P)); dist = np.zeros(len(P))
        for b in SAMPLE:
            o = np.einsum('j,tjk->tk', b, P) + sgn * n * 0.004
            d = hemi(sgn * n, rng)
            O = np.repeat(o, NRAY, 0); D = d.reshape(-1, 3)
            loc, ri, _ = rx.intersects_location(O, D, multiple_hits=False)
            hd = np.full(len(O), np.inf)
            hd[ri] = np.linalg.norm(loc - O[ri], axis=1)
            hd = hd.reshape(len(P), NRAY)
            esc += (hd > 40).mean(1); dist += np.minimum(hd, 3).mean(1)
        out[sgn] = (esc / len(SAMPLE), dist / len(SAMPLE))
    return out


def main(trisf, tum, src, dst):
    if os.path.abspath(src) != os.path.abspath(dst):
        os.makedirs(dst, exist_ok=True)
        for f in os.listdir(src): shutil.copy(os.path.join(src, f), os.path.join(dst, f))
    allP = np.fromfile(tum + '.bin', np.float32).reshape(-1, 3, 3).astype(np.float64)
    mesh = trimesh.Trimesh(vertices=allP.reshape(-1, 3), faces=np.arange(len(allP) * 3).reshape(-1, 3), process=False)
    rx = RayMeshIntersector(mesh)
    T = json.load(open(trisf)); rapor = {}; rng = np.random.default_rng(7)
    for atlas, d in T.items():
        P = np.array(d['p'], float).reshape(-1, 3, 3)
        if not len(P): continue
        UV = np.array(d['uv'], float).reshape(-1, 3, 2)
        imgs = {m: np.asarray(Image.open(os.path.join(src, f'{atlas}_{m}.png')).convert('RGB')).astype(float) / 255 for m in MAPS}
        n = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); area = np.linalg.norm(n, axis=1) / 2
        ok = area > 1e-6
        n = n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12); n[~ok] = [0, 1, 0]   # NaN ışın embree'yi kilitler
        cen = P.mean(1)
        cache = os.path.join(dst, f'{atlas}_yuz.npy')
        if os.path.exists(cache):
            e_p, e_m, d_p, d_m = np.load(cache)
        else:
            st = side_stats(rx, P, n, rng)
            (e_p, d_p), (e_m, d_m) = st[1], st[-1]
            np.save(cache, np.stack([e_p, e_m, d_p, d_m]))
        print(atlas, 'yön testi tamam', flush=True)
        if atlas == 'cephe':
            # ölçülen ışık da tanık: içeriden pişen sıva gökten az, odadaki lambalardan çok ışık almış
            g7 = np.zeros(len(P)); n7 = np.zeros(len(P))
            for b in dunya.BARY:
                uv = np.einsum('j,tjk->tk', b, UV)
                for im, acc in ((imgs['gok'], g7), (imgs['gece'], n7)):
                    h = im.shape[0]; acc += im[np.clip((uv[:, 1] * h).astype(int), 0, h - 1), np.clip((uv[:, 0] * h).astype(int), 0, h - 1)].mean(1)
            g7 /= len(dunya.BARY); n7 /= len(dunya.BARY)
            ters = ok & (((e_p < 0.05) & (e_m > 0.12)) | ((g7 < 60 / 255) & (n7 > 12 / 255) & (e_m > e_p + 0.05)))
        else:
            ters = ok & (d_p < 0.6) & (d_m > 1.0) & (d_m > 2.2 * d_p) & (e_p < 0.02)
        # kara (5 haritada ~0)
        dk_n = np.zeros(len(P))
        for b in dunya.BARY:
            uv = np.einsum('j,tjk->tk', b, UV); dk = np.ones(len(P), bool)
            for im in imgs.values():
                h = im.shape[0]; x = np.clip((uv[:, 0] * h).astype(int), 0, h - 1); y = np.clip((uv[:, 1] * h).astype(int), 0, h - 1)
                dk &= im[y, x].max(1) < KARA
            dk_n += dk
        kara = ok & (dk_n / len(dunya.BARY) >= 0.5)
        bozuk = ters | kara
        # görünen yüz normali: ters olanın tersi; kara olanda daha açık yüz
        vis = n.copy(); vis[ters] *= -1
        km = kara & ~ters
        flip_k = km & ((e_m > e_p + 0.05) | ((np.abs(e_m - e_p) <= 0.05) & (d_m > d_p)))
        vis[flip_k] *= -1
        iyi = ok & ~bozuk
        iyi_idx = np.nonzero(iyi)[0]; lo3 = P.min(1); hi3 = P.max(1)
        # bozuk üçgenler düzlem gruplarına ayrılır (görünen normal + düzlem uzaklığı); her grup tek
        # KD ağacıyla doldurulur: aynı yöne bakan, aynı düzlemde, kutusu YARICAP içinde olan doğru pişmiş üçgenler
        bz = np.nonzero(bozuk)[0]
        key = np.concatenate([np.round(vis[bz] * 20), np.round((np.einsum('ij,ij->i', vis[bz], cen[bz]) / 0.02))[:, None]], 1).astype(np.int64)
        _, grp = np.unique(key, axis=0, return_inverse=True); grp = grp.ravel()
        aday = []
        for g in range(grp.max() + 1 if len(grp) else 0):
            ts = bz[grp == g]; v0 = vis[ts[0]]; d0 = (vis[ts] * cen[ts]).sum(1).mean()
            c = iyi_idx[n[iyi_idx] @ v0 > 0.95]
            c = c[np.abs(cen[c] @ v0 - d0) < 0.03]
            glo = lo3[ts].min(0) - YARICAP; ghi = hi3[ts].max(0) + YARICAP
            c = c[np.all((lo3[c] <= ghi) & (hi3[c] >= glo), axis=1)]
            if len(c): aday.append((ts, c))
        print(atlas, 'bozuk', len(bz), 'grup', grp.max() + 1 if len(grp) else 0, 'adaylı grup', len(aday), flush=True)
        doldu = np.zeros(len(P), bool); px_say = 0
        by_res = {}
        for m, im in imgs.items(): by_res.setdefault(im.shape[0], []).append(m)
        out = {m: im.copy() for m, im in imgs.items()}
        for W, maps in sorted(by_res.items(), reverse=True):
            ids = dunya.raster(UV, W)
            ys, xs, tt, pos = dunya.texel_world(ids, UV, P, W)
            order = np.argsort(tt, kind='stable'); tt_s = tt[order]
            starts = np.searchsorted(tt_s, np.arange(len(P))); ends = np.searchsorted(tt_s, np.arange(len(P)), 'right')
            gref = imgs['gok']; gh = gref.shape[0]
            gok_iyi = gref[np.clip((ys + .5) * gh // W, 0, gh - 1).astype(int), np.clip((xs + .5) * gh // W, 0, gh - 1).astype(int)].max(1) >= KARA
            filled = np.zeros((W, W), bool)
            for ts, near in aday:
                tex = np.concatenate([order[starts[t]:ends[t]] for t in ts])
                if not len(tex): continue
                src_tex = np.concatenate([order[starts[s]:ends[s]] for s in near])
                src_tex = src_tex[gok_iyi[src_tex]]
                if not len(src_tex): continue
                lo = pos[tex].min(0) - YARICAP; hi = pos[tex].max(0) + YARICAP
                q = src_tex[np.all((pos[src_tex] >= lo) & (pos[src_tex] <= hi), axis=1)]
                if not len(q): continue
                kt = cKDTree(pos[q]); kk = min(K, len(q))
                dist, j = kt.query(pos[tex], k=kk)
                if kk == 1: dist = dist[:, None]; j = j[:, None]
                yak = dist[:, 0] <= YARICAP; tex, dist, j = tex[yak], dist[yak], j[yak]
                if not len(tex): continue
                w = 1 / (dist + 0.03) ** 2; w /= w.sum(1, keepdims=True)
                sy, sx = ys[q[j]], xs[q[j]]
                for m in maps:
                    lin = imgs[m][sy, sx] ** 2
                    out[m][ys[tex], xs[tex]] = np.sqrt((lin * w[..., None]).sum(1))
                filled[ys[tex], xs[tex]] = True; doldu[np.unique(tt[tex])] = True
                if W == max(by_res): px_say += len(tex)
            if filled.any():
                empty = ids == 0
                ring = ndimage.binary_dilation(filled, iterations=4) & empty
                _, (iy, ix) = ndimage.distance_transform_edt(empty, return_indices=True)
                ry, rx_ = np.nonzero(ring)
                for m in maps:
                    out[m][ry, rx_] = out[m][iy[ry, rx_], ix[ry, rx_]]
        for m in MAPS:
            Image.fromarray(np.clip(out[m] * 255, 0, 255).round().astype(np.uint8)).save(os.path.join(dst, f'{atlas}_{m}.png'))
        kalan = bozuk & ~doldu
        rapor[atlas] = {'ters_ucgen': int(ters.sum()), 'ters_m2': round(float(area[ters].sum()), 1),
                        'kara_ucgen': int(kara.sum()), 'kara_m2': round(float(area[kara].sum()), 1),
                        'doldurulan_ucgen': int(doldu.sum()), 'doldurulan_m2': round(float(area[doldu].sum()), 1),
                        'kalan_m2': round(float(area[kalan].sum()), 1), 'doldurulan_px': px_say}
        np.save(os.path.join(dst, f'{atlas}_durum.npy'), np.stack([ters, kara, doldu, e_p, e_m, d_p, d_m]).astype(np.float32))
        print(atlas, rapor[atlas], flush=True)
    json.dump(rapor, open(os.path.join(dst, 'yon-dolgu-raporu.json'), 'w'), indent=1)


if __name__ == '__main__':
    main(*sys.argv[1:5])
