# SIRA DEĞİŞTİ — FAZ 6 capture'ını atla, FAZ 7'ye geç

Öncelik değişti: **masaüstünde V-Ray kalitesi.** FAZ 7 (`FAZ-7-MASAUSTU.md`)
render motorunu, ışığı ve malzemeyi baştan ele alıyor — SSR, PCSS, pencere
alan ışığı, 4 oktav prosedürel detay, tam çözünürlük GTAO, clearcoat/sheen,
DOF. Yani FAZ 6'yı ayrı doğrulamak boşa iş: kareler FAZ 7 ile zaten
geçersizleşecek.

## Yap

### 1. FAZ 6 capture'ını DURDUR / BAŞLATMA
`bwq1jnlf1` ya da başka bir capture koşuyorsa durdur. FAZ 6 için **tek
kare çekilmeyecek.**

### 2. `KAPANIS.md`'nin capture GEREKTİRMEYEN 18 maddesini ŞİMDİ doldur

Bunlar dakikalar sürer ve FAZ 7'den etkilenmez — asıl kayıt bunlar:

- Düz roughness sayısı (`roughness-cells.py`, GLB'den) — **not:** İŞ B
  çalışma zamanında modüle ediyor, dokuya dokunmuyor; bu metrik değişmez.
  **İki sayıyı ayrı yaz:** doku düzlüğü (164/177 kalır) **ve** `uDetail`'de
  aktif hücre sayısı (asıl kapsama ölçüsü).
- `reviveBatchedGrade` applied · `glassTiersV2` applied ·
  `poolWaterV2` applied · `uDetail` aktif hücre — hepsi `console.info`,
  tek sayfa yüklemesi
- ALU sayımları (emitted bloktan)
- Bayrak-kapalı GLSL diff (her yeni bayrak için) + program sayısı
- İlk interaktif payload — A7 sonrası gerçek sayı
- Testler (sayıyla) · i18n testi · Ölçüler/VR cevabı
- `features.js` tier kapsamları · H1/H2/H6/H8/H10 paketleri

Görsel maddeleri (kompozit, kesit kareleri, gece karesi, doygunluk,
draw/üçgen/VRAM) **boş bırak** — FAZ 7 kapanışında dolacak, notunu düş.

### 3. FAZ 7 koduna geç
`FAZ-7-MASAUSTU.md`. Kod bitene kadar **sıfır capture**, aynı kural.

### 4. Tek doğrulama — FAZ 6 + FAZ 7 birlikte, en sonda

13 bayrak birden açık, tek oturum. Kare seti `FAZ-7-MASAUSTU.md`
Bölüm 3: **25 kare ≈ 1,5 saat.**

`KAPANIS.md`'nin boş bırakılan görsel maddeleri burada dolar.

## Kabul edilen risk

13 bayrak birden açıkken kapanış kırmızı gelirse hangisinin bozduğu
belirsiz. Karşılığı: bisect koşumu 4 kamera × 1 tier = **4 kare, ~12 dk**;
13 bayrakta ikili arama ~4 koşum, en kötü 1 saat. Bir tam doğrulama
turundan (1,5 sa) ucuz.

Kırmızı çizgi ikisi aynen: konsol hatası 0, context loss 0.
Bunlardan biri kırılırsa bisect'i beklemeden geri al.
