"""Çatı merdiven boşluğu tavanı: ürün sahibinin özgün modelinden (BUILDING-opt-v6-ust.glb) model-d1'de
(BUILDING-opt-v6-ust-d1.glb) bulunmayan tavan üçgenlerini viewer/src/tur10-cati-tavan.js'e yazar.

Girdi: iki GLB'nin dünya koordinatlı üçgen dökümleri (<ad>.bin float32 Nx3x3, <ad>.json [[düğüm, malzeme, sayı]...]);
döküm: node tools/batch-delivery/ucgen-dokum.mjs <ad> <glb> (gltf-transform; düğüm dünya matrisi uygulanır).

    python cati_tavan_ozgun.py <ozgun_dokum> <d1_dokum> viewer/src/tur10-cati-tavan.js
"""
import json, sys
import numpy as np

KUTU = ((-0.05, 4.2), (-3.65, -0.45))   # ağırlık merkezi x, z
DUGUM = 'EK_ceiling [imported].001_cati'


def tavan(ad):
    P = np.fromfile(ad + '.bin', np.float32).reshape(-1, 3, 3).astype(float)
    meta = json.load(open(ad + '.json')); o = 0; out = []
    for n, m, c in meta:
        if n.startswith(DUGUM): out.append(P[o:o + c])
        o += c
    return np.concatenate(out)


def main(ozgun, d1, hedef):
    O, D = tavan(ozgun), tavan(d1)
    key = lambda t: tuple(sorted(tuple(np.round(v, 3)) for v in t))
    var = {key(t) for t in D}
    c = O.mean(1)
    sec = (c[:, 0] > KUTU[0][0]) & (c[:, 0] < KUTU[0][1]) & (c[:, 2] > KUTU[1][0]) & (c[:, 2] < KUTU[1][1])
    out = []
    for t in O[sec]:
        if key(t) in var: continue
        n = np.cross(t[1] - t[0], t[2] - t[0]); L = np.linalg.norm(n)
        if L < 1e-10: continue
        n /= L
        # tavan aşağı, alın duvarı şeritleri içeri (-x), yan şeritler boşluğun ortasına (z -2,0) baksın
        if abs(n[1]) > 0.3: flip = n[1] > 0
        elif abs(n[0]) >= abs(n[2]): flip = n[0] > 0
        else: flip = (n[2] > 0) == (t[:, 2].mean() > -2.0)
        out.append(t[[0, 2, 1]] if flip else t)
    A = np.array(out).reshape(-1)
    fmt = lambda v: (f'{v:.4f}'.rstrip('0').rstrip('.') or '0').replace('-0.', '-.').replace('0.', '.', 1) if abs(v) < 1 and v != 0 else f'{v:.4f}'.rstrip('0').rstrip('.')
    with open(hedef, 'w') as f:
        f.write("// Üretildi: ürün sahibinin özgün çatı tavanı (BUILDING-opt-v6-ust.glb, EK_ceiling [imported].001_cati) içinden\n"
                "// merdiven boşluğu üstündeki parça (x -0,05..4,2, z -3,65..-0,45), model-d1'de olmayan üçgenler (dünya, m; yüzü\n"
                "// aşağı / iç tarafa bakacak sırada). villa-model-v3 regableTur10Attic kullanır. Elle düzenlemeyin.\n"
                "// Kaynak: tools/cad/cati_tavan_ozgun.py\n")
        f.write('export default new Float32Array([' + ','.join(fmt(v) for v in A) + ']);\n')
    print(len(out), 'üçgen')


if __name__ == '__main__':
    main(*sys.argv[1:])
