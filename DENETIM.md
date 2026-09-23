# FAZ 0–5 DENETİM RAPORU

Her iddia, kaynağına (üretim GLB'leri, capture JSON'ları, emitted kod,
built bundle) karşı tek tek açılıp ölçüldü. Ajanın raporu kanıt sayılmadı.

Denetlenen dal: `claude/magical-pascal-bxvzbc` (81 commit, main'in üstünde).
Denetim tarihi: 23 Eylül 2026.

---

## ÖZET

| Kategori | Sayı |
|---|---|
| Gerçek, ölçüldü, çalışıyor | 9 iş |
| Kod doğru ama ekrana ulaşmıyor (tier kapalı) | 5 iş |
| Ölü kod — koşul asla sağlanmıyor | 3 yol |
| Aşırı beyan edilmiş | 1 iş |
| Kanıtı geçersiz | A/B kompozitleri |
| **Canlı sitede olan** | **hiçbiri** |

---

## 1. GERÇEK VE ÇALIŞIYOR

Bunlar ölçüldü, artefaktla uyuştu, üretim yolunda canlı.

| İş | İddia | Ölçüm | Durum |
|---|---|---|---|
| 4.2 bundle split | 780 → 308,6 KB gzip | 708,5 → **300,9 KB** (gzip -9) | ✅ |
| Culling (2.2+plants) | C03 üçgen −%23,8 | 2 695 936 → **2 053 171** | ✅ |
| Doku belleği | 277,7 → 151,3 MiB | birebir uyuştu | ✅ |
| 2.3 plantVariation | ±6° hue / ±%12 value | `0.2094 rad`, `0.24` — birebir | ✅ |
| 0.x ratchet | dürüst-null | tüm alanlar `null`, `acceptedByOwner:false` | ✅ |
| 2.1 progressive loader | interior kritik yoldan çıktı | kod canlı, gzip JSON yolu aktif | ✅ |
| 3.3 atlasArrayV2 | maxLod kelepçesi bitti | `texture(atlasArray_…)` yolu canlı, mobil dahil | ✅ |
| 3.4f probeMassing | yerleşim kütlesi probe'da | canlı, tier kapısı yok | ✅ |
| 3.5 poolWaterV2 | analitik dalga havuz | canlı, `garden`+`water` koşulu sağlanıyor | ✅ |

**Performans ve yükleme tarafı dürüst.** Sayılar tutuyor, abartı yok.

---

## 2. KOD DOĞRU AMA SENİN EKRANINA ULAŞMIYOR

Referans cihaz **iPhone 13**. Bu işlerin hiçbiri o cihazda çalışmıyor.

| İş | Masaüstü | iPhone 13 | Neden |
|---|---|---|---|
| 1.2 hybridSunShadow | ✅ | ❌ | `mobileSunShadow:false` — H1 ölçümü hiç yapılmadı |
| 1.1b postfx (SMAA/bloom/grade/dither) | ✅ | ❌ | mobil matris satırı `postProcessing:false` |
| 1.1b GTAO | kısmi | ❌ | aşağıya bak |
| 3.4d bakedAoRevival | ✅ | ❌ | `main.js:1381` desktop-only |
| FAZ 5 cinemaStill | desktop-high | ❌ | `main.js:326` |

### 2.1 GTAO dış cephede HİÇBİR cihazda açık değil

Capture JSON'larından, 12 kameranın hepsi:

| Kamera | Görünüm | gtao |
|---|---|---|
| C01 | region | **false** |
| C02, C03, C04 | neighborhood | **false** |
| C05–C12 | kat görünümleri | true |

`quality-profile.js` matrisi `region` ve `neighborhood` satırlarında GTAO'yu
kapatıyor. Yani **çatlak/köşe/temas kararması dış cephede masaüstünde bile
hiç çalışmıyor.** Villa çimin üstünde yüzüyor; bu, render'da gözle görülüyor.

Bu, "hâlâ SketchUp" şikâyetinin en büyük tek teknik sebebi ve hiçbir raporda
geçmiyor.

---

## 3. ÖLÜ KOD — koşul asla sağlanmıyor

### 3.1 `glassTiersV2` (Task 3.5 — "dış cam probe siluetini yansıtsın")

`lighting.js:427` koşulu: `!material.userData.angoraAuthoredPBR`
`build.mjs:96` bu bayrağı **istisnasız her materyale** `true` yazıyor.
Üretim GLB'leri açıldı: **37/37 materyalde `true`.**
→ `!true` = false. Kod hiç çalışmadı. `lighting.js:419`'daki
`metalness=0` / `depthWrite` kolu da aynı guard'da, o da ölü.

### 3.2 Yaprak normalleri (`smoothSurfaceNormals`)

`lighting.js:396` iki sebepten ölü: aynı `angoraAuthoredPBR` guard'ı, **ve**
regex `foliage` arıyor ama batched materyal adı `context-plants-other-0`.
Kaynak adlar `userData.angoraBatch.materials` içinde.

### 3.3 `TABLE` / `applyGradeValues` / `bindGradeTextures`

`main.js:1492` `if (asset.exterior_grade)` ile kapılı, `manifest.assets`
üzerinde dönüyor. Üretim manifesti `assets` içermiyor — `parts` içeriyor ve
hiçbirinde `exterior_grade` yok. → 10 grade girdisinin **10'u** ölü
(iron rengi, gravel, canopy, grass, asphalt, terrace, entrance-court,
stucco, clay-tile, villa-roof).

---

## 4. AŞIRI BEYAN

### 1.3 `exteriorGradeRevival` — "dış cephe dirilişi"

Üretimde çalışan tek grade yolu `reviveBatchedGrade`, ve iki filtreyle
daralıyor: `grid !== 1` 37 materyalin 23'ünü yapısal olarak dışarıda
bırakıyor, tablo 4 satır.

**Fiilen: 25 dış yüzeyin 2'si gerçek doku aldı** (villa çatısı, havuz
terası). 2'si sadece normal map aldı, albedo düz kaldı (villa cephesi,
komşu sıva). **21'i hiçbir şey almadı** — çim, asfalt, çakıl, sundurma,
komşu duvarları, komşu çatıları, bitkiler, havuz karosu, bahçe metali,
istinat duvarları, giriş avlusu, beyaz denizlik, villa metali.

Villa metalinin (`metal`) ve beyaz denizliğin (`white_trim`) atlas hücresi
ölçüldü: **RGB aralığı = 0.** Tek piksel rengi.

Render'da sadece çatının değişmiş görünmesi bu tablonun birebir karşılığı.

---

## 5. KANITIN KENDİSİ GEÇERSİZ

`build/qa/final-ab/` ve `faz1-ab/` kompozitleri "ÖNCE vs SONRA" diye
sunuldu. Capture JSON'larındaki `cameraState` karşılaştırıldı:

| Kamera | Kamera oynadı mı | Lens |
|---|---|---|
| C03 | **44,0 m** | 16° → 30° |
| C04 | **50,7 m** | 16° → 30° |
| C05 | 26,2 m | 16° → 28° |
| C06 | 32,1 m | 16° → 28° |
| C07 | 32,1 m | 16° → 28° |
| C08 | 29,3 m | 16° → 28° |
| C09, C10 | sabit | sabit |

Dış cephe karelerinin hepsinde kamera başka yerde ve başka lenste.
**Piksel farkının büyük kısmı çerçevelemeden geliyor, kaliteden değil.**
Kalite değişimi bu kompozitlerden okunamaz. Sabit kalan tek kareler C09 ve
C10 (iç mekân) — orada fark zaten cılız.

Ayrıca ölçüldü: **dış cephe doygunluğu düşmüş.**

| Kare | Doygunluk ÖNCE → SONRA |
|---|---|
| C03 | 72,4 → **58,8** (−%19) |
| C04 | 60,7 → **52,4** (−%14) |

Ufuk sisi + grade rengi çekmiş. Düz albedo'nun üstüne binince sonuç daha
soluk — yani SketchUp'a daha yakın, uzak değil.

---

## 6. HİÇBİRİ YAYINDA DEĞİL

- `CNAME` = `angora.mergvs.com`, GitHub Pages **`main`**'den yayınlıyor.
- `main`'in servis ettiği bundle: `index-B01_GXus.js`, **21 Eylül** tarihli.
- `main`'de `features.js` **yok**, `quality-profile.js` **yok**,
  `postfx-chain.js` **yok**.
- Faz 1–5'in tamamı — 81 commit — `claude/magical-pascal-bxvzbc`'de duruyor,
  merge edilmemiş.

**Yani yukarıdaki her şey — çalışanı da, ölüsü de — canlı sitede yok.**
Şu an baktığın site, hiçbir işin yapılmadığı haliyle duruyor.

---

## 7. DENETİMİN KENDİ HATASI

Bu denetimi baştan yapmam gerekiyordu. Altı saat boyunca testlere, flag
durumlarına, ratchet'e ve sızıntı kontrollerine baktım — hepsi gerçekten
temizdi. **"Bu iş ekrana ulaşıyor mu"** ve **"bu yayında mı"** sorularını
hiç sormadım. İki soru da tek komutla cevaplanabilirdi.

"Dış cephe ~%70 çözüldü" dedim; gerçek sayı %8. O cümleyi doğrulamadan
yazdım.

---

## 8. SIRAYA GÖRE YAPILACAKLAR

1. **GTAO'yu dış cephe görünümlerine aç** (`region`/`neighborhood` matris
   satırı). En büyük tek görsel kazanç, kod zaten var, yeni mekanizma yok.
2. **Ölü guard'ları düzelt** — `glassTiersV2`, yaprak normalleri
   (`FAZ-6-DUZ-RENK.md` İŞ E).
3. **`exteriorGradeRevival`'ı 21 yüzeye genişlet** (İŞ A + İŞ B).
4. **Temas kararması** — vertex AO, mobilde de çalışan tek AO (İŞ C).
5. **A/B yöntemini düzelt** — kamera sabitlenmeden kalite karşılaştırması
   yapılmayacak. Lens değişimi ayrı bir kareyle gösterilecek.
6. **H1** — iPhone 13 ölçümü; mobilde gölge ve postfx bunun arkasında.
7. **Merge** — izin bekliyor.
