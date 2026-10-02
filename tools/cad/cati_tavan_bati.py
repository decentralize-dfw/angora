"""Çatı oturma alanı + hol birleşimi tavanı (x < 0,05): model-d1'in değiştirdiği tavan üçgenleri ile ürün sahibinin
özgün modelindeki (BUILDING-opt-v6-ust.glb) karşılıkları -> viewer/src/tur10-cati-tavan-bati.js.

02.10 ürün sahibi (çatı oturma alanı, 6 işaret): model-d1 bu bölgede mahyayı 20 cm indirip (12,23 -> 12,025) düz bir
mahya şeridi eklemiş, oturma alanının doğu ucundaki kırma çatıyı (özgünde x -1,4'ten x -0,47'deki tepeye yükselen
yüzler) dik yüzlere ve düz bir şeride çevirmiş; dikiş yerlerinde çatlak (arkadaki çatı kahve çizgi gibi görünüyor),
büyük üçgen yüz ve kenar şeritleri kalmış. Merdiven boşluğundaki gibi (cati_tavan_ozgun.py) özgün tavan geri gelir.

Çıktı: EKLE = özgünde olup d1'de olmayan üçgenler (yüzü aşağı / içe), AT = d1'de olup özgünde olmayan üçgenlerin
ağırlık merkezleri (çalışma anında bu merkezlerdeki ceiling.001 üçgenleri atılır).

    python cati_tavan_bati.py <ozgun_dokum> <d1_dokum> viewer/src/tur10-cati-tavan-bati.js
"""
import json, sys
import numpy as np

KUTU = ((-6.3, 0.05), (-3.65, -0.45))   # batı pencere nişi (x -6..-5) dahil: yarısı d1 kalırsa arada boşluk
DUGUM = 'EK_ceiling [imported].001_cati'


def tavan(ad):
    P = np.fromfile(ad + '.bin', np.float32).reshape(-1, 3, 3).astype(float)
    meta = json.load(open(ad + '.json')); o = 0; out = []
    for n, m, c in meta:
        if n.startswith(DUGUM): out.append(P[o:o + c])
        o += c
    return np.concatenate(out)


def secim(T):
    c = T.mean(1)
    return T[(c[:, 0] > KUTU[0][0]) & (c[:, 0] < KUTU[0][1]) & (c[:, 2] > KUTU[1][0]) & (c[:, 2] < KUTU[1][1])]


def main(ozgun, d1, hedef):
    O, D = secim(tavan(ozgun)), secim(tavan(d1))
    key = lambda t: tuple(sorted(tuple(np.round(v, 3)) for v in t))
    ko, kd = {key(t) for t in O}, {key(t) for t in D}
    ekle = []
    for t in O:
        if key(t) in kd: continue
        n = np.cross(t[1] - t[0], t[2] - t[0]); L = np.linalg.norm(n)
        if L < 1e-10: continue
        n /= L
        # tavan aşağı baksın; dik şeritler odanın ortasına (x -2,5, z -2,03)
        if abs(n[1]) > 0.3: flip = n[1] > 0
        else:
            c = t.mean(0); flip = n[0] * (-2.5 - c[0]) + n[2] * (-2.03 - c[2]) < 0
        ekle.append(t[[0, 2, 1]] if flip else t)
    at = [t.mean(0) for t in D if key(t) not in ko]
    fmt = lambda v: f'{v:.4f}'.rstrip('0').rstrip('.') if v != 0 else '0'
    with open(hedef, 'w') as f:
        f.write("// Üretildi: tools/cad/cati_tavan_bati.py. Çatı oturma alanı + hol birleşimi (x < 0,05): EKLE ürün sahibinin\n"
                "// özgün tavan üçgenleri (dünya, m; yüzü aşağı/içe), AT model-d1'in yerlerine koyduğu üçgenlerin ağırlık\n"
                "// merkezleri. villa-model-v3 regableTur10AtticWest kullanır. Elle düzenlemeyin.\n")
        f.write('export const EKLE = new Float32Array([' + ','.join(fmt(v) for v in np.array(ekle).reshape(-1)) + ']);\n')
        f.write('export const AT = new Float32Array([' + ','.join(fmt(v) for v in np.array(at).reshape(-1)) + ']);\n')
    print(len(ekle), 'eklenecek,', len(at), 'atılacak')


if __name__ == '__main__':
    main(*sys.argv[1:])
