# FAZ 1 — DOSYA BAZLI UYGULAMA PLANI

Kaynak: `ANGORA-QUALITY-UPGRADE.md` Bölüm 4 / FAZ 1. Merge sırası sabit:
**1.1 → 1.4 → 1.6 → [ARA ÖLÇÜM] → 1.3 → 1.5 → 1.2 → 1.1b.**
Her satırda: değişen dosyalar, yeni test, tahminî bütçe etkisi.
Ölçüm aracı: `viewer/scripts/qa-capture.mjs` (12 kamera × 2 profil,
SwiftShader — FPS mandala yazılmaz; draw call / üçgen / bayt / doku-MiB geçerli).

## 1.1 — Bayrak cerrahisi (nötr)
- `viewer/src/quality-profile.js` — `effectiveQuality()` legacy-uyum haritası;
  tek kalite nesnesi. `viewer/src/features.js` (YENİ) — FAZ 1 bayrakları +
  `?features=` çözümleyici.
- `viewer/src/lighting.js` — `baked`/`compact` okumaları silindi; her yetki
  `quality.value.*`. `viewer/src/main.js` — quality kurulumu, renderer
  antialias/pixel-ratio quality'den, `applyView` kancaları, `?debug=quality`.
- `viewer/src/render-quality.js` — `renderPixelRatio` bütçe nesnesi kabul eder.
- Test: `tests/features.test.mjs` (legacy eşdeğerlik: batched/classic × 4 tier).
- Kabul: 12 kamerada baseline'a karşı piksel farkı = 0 (bayraklar kapalıyken).
- Bütçe: 0.

## 1.4 — doubleSided + culling (KAZANÇ)
- `tools/batch-delivery/patch-glb.mjs` (YENİ) — BIN-korumalı JSON yaması.
- `tools/batch-delivery/patch-single-sided.mjs` (YENİ) — 12 GLB yerinde;
  BLEND/MASK + foliage/perde korunur; manifest `gpu_sha256` + `bytes` tazelenir;
  `build/web/batched/single-sided-report.json`.
- `tools/batch-delivery/build.mjs` — gelecek için koşullu `setDoubleSided`.
- `viewer/src/context-plants-chunks.js` (YENİ) — tek mesh bitkiyi 48 m
  hücrelere üçgen-bazlı böler (attribute paylaşımlı, chunk başına kendi bound'u).
- `viewer/src/native-delivery.js` — chunker çağrısı (`plantsChunking` bayrağı),
  walk'ta context-plants kapatma (`viewCulling`), `singleSided:0` emniyet valfi.
- Test: chunker birim testi (bound'lar alt kümeden, üçgen sayısı korunur);
  A/B piksel diff 12 kamera (kaybolan yüzey taraması).
- Bütçe: fragment işi −%25..45 (kapalı hacimler); walk'ta görünür üçgen ↓.

## 1.6 — Bahçe spot israfı + anizotropi (KAZANÇ)
- `viewer/src/batched-material.js` — `garden` da spot/point döngülerini
  düşürür (`gardenSpotStrip`); cache key'e işlenir.
- `viewer/src/native-delivery.js` — `prepareBatchedMaterial`'a asset adı.
- `viewer/src/lighting.js` — anisotropy yalnız gerçek `texture2D` yolundaki
  dokulara (`atlasAnisotropyFix`); atlas map/normal/rough/metal → 1.
- Test: shader kaynak assertion'ı (garden fragman shader'ında
  `NUM_SPOT_LIGHTS 0`); anisotropy ataması birim testi.
- Bütçe: bahçe fragment maliyeti ↓; doku filtre state'i ↓.

## [ARA ÖLÇÜM]
- qa-capture 12×2; draw call / üçgen / JS-submit süresi (200 kare proxy)
  baseline'la karşılaştırılır; kazanç `build/qa/faz1-ledger.md`'ye yazılır.

## 1.3 — exterior-grade dirilişi (~nötr)
- `viewer/src/exterior-grade.js` — batch-farkında eşleme
  (`userData.angoraBatch.materials` → TABLE), `grid===1` hero'lara doğrudan
  map/normalMap; `exteriorGradeDetail` işareti.
- `viewer/src/batched-material.js` — `grid===1` + detail işaretli malzemede
  atlas enjeksiyonu bypass (donanım mip + aniso geri gelir).
- `viewer/src/main.js` — `loadNativeModel` içinde idle yükleme
  (`exteriorGradeRevival`), kritik yolu bloklamaz.
- Hedef malzemeler: `architecture-tile-1` (Clay tile), `architecture-other-9`
  (STRUCCO normal), `architecture-tile-8` (stone_tile), `context-buildings-plaster-0`.
- Test: bypass'lı shader'da `atlasSample(` yok + `texture2D( map` var;
  eşleme birim testi.
- Bütçe: ~nötr (−8 dFdx/dFdy o malzemelerde; +≤1,3 MB idle transfer).

## 1.5 — Kamera + altın saat (~nötr)
- `viewer/src/camera-rigs.js` (YENİ) — görünüm başına FOV/polar sınırları.
- `viewer/src/main.js` — iki `PerspectiveCamera(16,…)` noktası (ana + plan/iso
  geçişi) rig'den okur (`cameraRigsV2`); `frame()` fov varsayımları temizlenir.
- `viewer/index.html` — `#daylight-hour` varsayılan 16.5; `#lighting-style`
  varsayılan `sun` (paylaşım linki override etmeye devam eder →
  `share-state.js` DEFAULTS güncellenir, testi de).
- `viewer/src/lighting.js` — `region`/`neighborhood`'da horizon-renkli
  `FogExp2` (0.0018'den başla, A/B ile kalibre); diğer görünümlerde `null`.
- Test: share-state round-trip yeni varsayılanlarla; rig tablosu birim testi.
- Bütçe: ~nötr (+1 ucuz mul fog'lu görünümlerde).
- ⚠ QA kameraları fov=16 sabitli — 1.5 sonrası karşılaştırma çifti:
  eski-fov (regresyon) + yeni-varsayılan (kompozisyon kanıtı).

## 1.2 — Hibrit güneş gölgesi (MALİYET — kazançla finanse)
- `tools/batch-delivery/build-shadow-proxy.mjs` (YENİ) — architecture+garden
  (+≤25 m context) `weld+simplify(ratio .06)` → `shadow-proxy.glb` (≤80 k üçgen,
  Draco, ~150–400 KB), manifest'e `shadow_proxy` girişi.
- `viewer/src/lighting.js` — `fitSunShadow(view, boxes, quality)`; layer-3
  proxy; `requestShadowUpdate(reason)` olay listesi (saat `change`, kat geçişi
  sonu, görünüm, mobilya, walk); `setTime()` sonundaki koşulsuz
  `needsUpdate` kaldırılır; ground-light R kanalı dinamik gölge açıkken 0.
- `viewer/src/ground-light.js` — `setSun(sun, dynamicShadowActive)`.
- `viewer/src/main.js` — proxy yükleme, clip düzlemi bağlanması.
- Test: slider `input` sırasında shadow render 0 / `change`'de 1 (sayaç);
  proxy üçgen bütçesi; çift karartma A/B histogram.
- Bütçe: +1 depth pass (≤80 k üçgen ≈ beauty'nin ~%2,5'i) — 1.4+1.6
  kazancından ödenir. `mobile-high`'ta yalnız mandal yeşilse (H1 ölçümü
  gelmeden mobil bayrağı açılmaz).

## 1.1b — Postfx (yalnız desktop) (MALİYET)
- `viewer/src/features.js` — `postfxV2:true`; matris devralır
  (desktop-balanced GTAO @0.5, desktop-high @0.65).
- `viewer/src/postprocessing.js` — koşullu pass ekleme (grade yoksa output).
- Test: composer açık/kapalı ekran-ortası luminance farkı ≤ %2 (tek tone-map
  kanıtı — r180'de RT render'a tone map uygulanmadığı için yapısal, testle
  kilitlenir); pass listesi birim testi.
- Bütçe: +4 tam ekran pass yalnız desktop; mobile değişmez.

## Çıkış kapısı
- 12×2 önce/sonra ekran görüntüsü seti + `build/qa/faz1-ledger.md`
  (bütçe defteri) + mandal tablosu (iPhone satırları `null` — H1 bekliyor)
  + `npm test` + BLOCKED.md güncel.
