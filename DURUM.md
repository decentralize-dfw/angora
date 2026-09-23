# DURUM — 23 Eylül

## 1. İKİ BUG — ürün sahibi tarayıcıda bisect etti, ikisi de KESİN

### Bug A — `cinemaStill` siyah basıyor ⭐ ASIL SUÇLU

Ürün sahibi tarayıcıda bisect etti. `cinemaStill:0,cinemaDof:0` →
**hiç siyahlık yok.** SSR, `gtaoFullRes`, `softShadowsV2` tek tek
denendi, hepsinde siyah vardı; hepsinde `cinemaStill` de açıktı.
Kapatılınca hepsi temizlendi.

Semptom: döndürürken görüntü var, bırakınca siyah, dokununca geri geliyor.
Bu performans değil — **boşta kalma davranışı.**

Mekanizma: 400 ms sükunet sonrası 24 Halton örneği biriktiriliyor.
Birikim **sıfırdan (siyahtan) başlıyor** ve her girdide yeniden başlıyor.
Pahalı FAZ 7 geçişleriyle her örnek uzun sürdüğü için kullanıcı yarı-birikmiş
(karanlık) tamponu saniyelerce görüyor.

**Not:** Denetim bunu öngörmüştü — `desktop-high` tier'ı hiçbir gate'te
render edilmedi, yani `cinemaStill` bu projede **hiç görülmeden** ship
edildi. Görülmemiş özellik bozuk çıktı.

**Acil:** `cinemaStill` ve `cinemaDof` varsayılan KAPALI, build, push.

**Kalıcı düzeltme:** Birikim siyahtan başlamayacak. İlerlemeli
rafinasyonun kuralı: **çözülmüş kareden başla, sıfırdan değil.** Tek
örneklik normal kare zaten hazır; birikim onun üstüne biner ve tamamlanana
kadar görünür tamponu asla siyaha düşürmez. Ayrıca her girdide sıfırlamak
yerine iptal edip mevcut kareyi bırak.

**SSR yeniden denenecek:** SSR'ın "siyah" verdiği testlerde `cinemaStill`
de açıktı. Asıl suçlu bulunduğuna göre SSR temiz çıkabilir — kesmeden önce
`cinemaStill:0` ile tekrar ölç.

### Bug B — `progressiveContextV1` komşu binaları yok ediyor

`progressiveContextV1:0` ile binalar geliyor, `1` ile **hiç gelmiyorlar**.

Sebep: A7 komşu binaları + bitkileri boşta kuyruğuna aldı, ama yükleme
sonrası geçişler onları beklemiyor. `main.js:1320`'deki kanca geç gelen
parça için **tek bir şey** yapıyor:

```js
onAcquired:(name,model)=>{if(contactBake?.bakeLate&&contactBake.bakeLate(model))invalidate();}
```

Kanıt: konsolda `Exterior grade revived on 5 materials` — **8 olmalıydı**.
Eksik üçü tam olarak komşu binalarınki: `ceiling.004`, `neighbor_wall`,
`wood_dark.002`.

`onAcquired` geç gelen parça için bütün parça-sonrası geçişleri tekrar
koşmalı: `reviveBatchedGrade`, atlas dizisi yükseltmesi, plot maskesi,
clipping düzlemleri, ışık bağlama. Sayı 8'e çıkmalı.

**Düzelene kadar `progressiveContextV1` varsayılan KAPALI.** 13,6 MB
kazanç, kaybolan komşulara değmez.

## 2. FAZLAR — ne bitti, ne bitmedi

| Faz | Durum | Not |
|---|---|---|
| **FAZ 0** ölçüm altyapısı | ⚠️ %90 | `baseline-<commit>/` hiç oluşturulmadı; mandal `null` (H1) |
| **FAZ 1** "maket öldü" | ⚠️ %70 | 1.1/1.5/1.6 tam · 1.2/1.1b masaüstü · 1.3 kısmi (FAZ 6 tamamladı) · 1.4 rafta (H8) |
| **FAZ 2** yük ve geometri | ⚠️ %60 | 2.1 kısmi (payload 23,8→10,2 MB, hedef 5) · 2.2/2.3 runtime yarısı · 2.4 geri alındı (H10) |
| **FAZ 3** malzeme ve ışık | ❌ %30 | 3.3/3.4f/3.4g tam · 3.4d masaüstü · 3.5 yarısı ölüydü (FAZ 6 onardı) · **3.1/3.2/3.4a-c hiç başlamadı** (H2/H9, malzeme+mesh sen kestin) |
| **FAZ 4** teslim ve cila | ⚠️ %50 | 4.2/4.4 tam · 4.1 ertelendi (gerekçe ölçülü) · 4.3 sen "iyi" dedin |
| **FAZ 5** sinematik kare | ⚠️ kod var | `desktop-high` hiç render edilmedi, **hiç görülmedi** |
| **FAZ 6** düz renk katliamı | ✅ kod bitti | 7 iş + süreç onarımı · doğrulama FAZ 7'ye devredildi |
| **FAZ 7** masaüstü V-Ray | 🔴 kod bitti, doğrulama KIRMIZI | 7 iş kodlandı, 302/302 test · kareler çizilemedi |

---

## 3. YAPILAN — doğrulanmış

- FAZ 6: exterior-grade 4→8 materyal · prosedürel roughness+albedo ·
  vertex AO · 3 ölü kod yolu onarıldı · dış cephe GTAO · iç mekân
- FAZ 7: SSR · PCSS · pencere portal ışıkları · 4 oktav detay ·
  tam çözünürlük GTAO · clearcoat/sheen · DOF
- Süreç: gate 4 tier × 12 kamera, tier uyuşmazsa FAILED · kameralar
  donduruldu · lens kuralı yazıldı
- A7: ilk interaktif **−13,6 MB** (komşular+bitkiler boşta)
- A6: "Ölçüler" ve VR ürün özellikleri **var**, ikisine test yazıldı
- A1: gece probe'u saati hiç değiştirmiyormuş — bug bulundu, düzeltildi
- H2/H6/H8/H10 teslimat paketleri yazıldı (H8 tespiti çalıştırıldı:
  8 context eklemesinin 5'i aynalı)
- 302/302 test

## 4. YAPILMAYAN

| Kalem | Neden | Kimde |
|---|---|---|
| İç mekân lightmap **%4,1** (hedef ≥%65) | Blender yok | **H2** — script hazır |
| iPhone 13 ölçümü | cihaz yok | **H1 — sende**, `qa-mobile.html` |
| Payload 10,2 MB (hedef 5) | kat bölmesi + LOD | **H6** — kaynak dizin yok |
| Üçgen 2,05 M (hedef 700k–1,2 M) | instancing/LOD | **H6 + H10** |
| Task 1.4 doubleSided | Draco re-encode | **H8** — 5/8 aynalı mesh tespitli |
| Malzeme yazarlığı, mesh temizliği | — | **sen kestin** |
| `desktop-high` hiç render edilmedi | FAZ 7 kırmızı | doğrulama bekliyor |
| FAZ 6 + FAZ 7 görsel doğrulama | kareler çizilemedi | **şu anki blokaj** |

---

## 5. SIRADAKİ TEK HAMLE

Bayraklar açık build'i gerçek tarayıcıda aç. Cevap oradan gelecek.
Bisect ondan sonra, gerekirse.
