"""Zemin dokularının normal + pürüzlülük haritaları (make-tur10-web.mjs kullanır).

    python tools/batch-delivery/tur10-dokular/pbr.py

Her <ad>.jpg için <ad>_normal.png (glTF, OpenGL +Y) ve <ad>_mr.png (glTF
metallicRoughness: G = pürüzlülük, B = metal = 0) yazar. Haritalar dokunun
KENDİSİNDEN çıkar, desenle birebir çakışır:
  * derz / tahta aralığı: yerel ortancadan belirgin sapan ince çizgiler
    (karoda açık, parkede koyu). Yükseklikte çukur, pürüzlülükte mat.
  * yüzey: parlaklığın yüksek frekanslı kısmı hafif kabartma (damar, taş dokusu).
Bütün süzgeçler sarmalı (np.roll / wrap): doku tekrar ederken kenarda iz olmaz.

Ürün sahibinin verdiği haritalar ÖNCE gelir (hesaplanan yalnız eksik olanı doldurur):
  <ad>_roughness.jpg      pürüzlülük (gri)
  <ad>_normal_kaynak.jpg  normal (OpenGL +Y, glTF ile aynı - derz satırında doğrulandı)
  <ad>_derz.jpg           derz maskesi (beyaz = derz): derzde pürüzlülük en az 0,85.
                          Metal haritası olarak KULLANILMAZ - derzler metal parlardı; metal 0.
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
# ad: (derz rengi 'acik'|'koyu', taban pürüzlülük, derz pürüzlülük, damar genliği, normal gücü)
SPEC = {
    'giris-karo':  ('acik', 0.42, 0.85, 0.35, 3.0),
    'bodrum-karo': ('acik', 0.45, 0.85, 0.35, 3.0),
    'giris-karo-v2':  ('acik', 0.42, 0.85, 0.35, 3.0),
    'bodrum-karo-v2': ('acik', 0.45, 0.85, 0.35, 3.0),
    'parke':       ('koyu', 0.48, 0.80, 0.55, 2.5),
    'cam-lambri':  ('koyu', 0.55, 0.80, 0.55, 2.5),
    'banyo-duvar': ('acik', 0.30, 0.80, 0.20, 2.0),
}

def main():
    for name, (grout_tone, r_base, r_grout, detail, strength) in SPEC.items():
        rgb = np.asarray(Image.open(os.path.join(HERE, name + '.jpg')).convert('RGB'), dtype=np.float32) / 255
        lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
        med = ndimage.median_filter(lum, size=15, mode='wrap')
        dev = (lum - med) if grout_tone == 'acik' else (med - lum)
        thr = np.percentile(dev, 97)
        grout = ndimage.gaussian_filter(np.clip((dev - thr * 0.5) / max(thr, 1e-4), 0, 1), 0.8, mode='wrap')
        hp = lum - ndimage.gaussian_filter(lum, 6, mode='wrap')
        height = -grout + detail * hp / max(np.abs(hp).max(), 1e-4) * 0.3
        height = ndimage.gaussian_filter(height, 0.7, mode='wrap')
        dx = (np.roll(height, -1, 1) - np.roll(height, 1, 1)) * 0.5
        dy = (np.roll(height, -1, 0) - np.roll(height, 1, 0)) * 0.5
        n = np.stack([-dx * strength, dy * strength, np.ones_like(dx)], -1)   # +Y yukarı (glTF)
        n /= np.linalg.norm(n, axis=-1, keepdims=True)
        given = os.path.join(HERE, name + '_normal_kaynak.jpg')
        if os.path.exists(given): Image.open(given).convert('RGB').save(os.path.join(HERE, name + '_normal.png'))
        else: Image.fromarray(((n * 0.5 + 0.5) * 255 + 0.5).astype(np.uint8)).save(os.path.join(HERE, name + '_normal.png'))
        rough = r_base + (r_grout - r_base) * grout + 0.06 * (hp / max(np.abs(hp).max(), 1e-4))
        given = os.path.join(HERE, name + '_roughness.jpg')
        if os.path.exists(given): rough = np.asarray(Image.open(given).convert('L').resize(lum.shape[::-1]), dtype=np.float32) / 255
        given = os.path.join(HERE, name + '_derz.jpg')
        if os.path.exists(given):
            mask = np.asarray(Image.open(given).convert('L').resize(lum.shape[::-1]), dtype=np.float32) / 255
            rough = np.maximum(rough, 0.85 * mask)
        mr = np.zeros(rgb.shape, np.uint8)
        mr[..., 0] = 255
        mr[..., 1] = (np.clip(rough, 0.05, 1) * 255 + 0.5).astype(np.uint8)
        Image.fromarray(mr).save(os.path.join(HERE, name + '_mr.png'))
        print(f'{name}: derz payı %{(grout > 0.5).mean() * 100:.1f}, pürüzlülük {rough.min():.2f}..{rough.max():.2f}')

if __name__ == '__main__':
    main()
