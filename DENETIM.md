# FAZ 0–5 TAM DENETİM — 26 TASK, TEK TEK

Yöntem: her task'ın **plandaki kendi kabul kriteri** okundu, sonra o kritere
karşı ölçüldü. Ajanın raporu kanıt sayılmadı. Ölçüm kaynakları: üretim
GLB'leri, capture JSON'ları, emitted kod, built bundle, çalıştırılan testler.

Denetlenen: `claude/magical-pascal-bxvzbc` @ `51b9fdf` (81 commit).

---

## A. YAPISAL BULGULAR — tek tek task'lardan daha ağır

### A1. Dört tier'ın üçü hiç render edilmedi

Her capture'ın `tier` alanı okundu. **İstisnasız hepsi `desktop-balanced`.**
"mobile" klasörleri de dahil — onlar sadece 393×852 viewport'ta koşmuş
desktop-balanced.

| Tier | Hiç yakalandı mı |
|---|---|
| `desktop-balanced` | ✅ her gate |
| `desktop-high` | ❌ **hiç** |
| `mobile-high` | ❌ **hiç** |
| `mobile-low` | ❌ **hiç** |

Sonuç: mobil render yolu — gölgesiz, postfx'siz, GTAO'suz hali — **hiçbir
karede görülmedi.** Mobil hakkındaki her iddia sadece birim testine dayanıyor.
`desktop-high` de görülmedi, dolayısıyla FAZ 5 (cinemaStill, sadece o tier'da
çalışıyor) hiç render edilmemiş durumda.

### A2. Mandal null — planın kendi kuralına göre hiçbir faz kapanamazdı

`build/qa/ratchet.json`: `baseline` alanlarının tamamı `null`,
`acceptedByOwner: false`.

Planın kendi cümlesi (Task 0.4):
> "Mandal `null` kaldığı sürece **hiçbir faz 'tamamlandı' ilan edilemez**."

FAZ 1 çıkış kapısındaki 9 performans maddesinin **9'u da** `baseline`'a
bakıyor. Hepsi değerlendirilemez durumda. Beş faz yine de tamamlandı ilan
edildi.

### A3. `build/qa/baseline-<commit>/` hiç oluşturulmadı

FAZ 0 kabul md. 7. Yerine `gate-visual-ref` kullanılmış — 8 kamera, tek tier,
cold/warm ayrımı yok. Plan 12 kamera × 2 tier × {cold, warm} istiyordu.

### A4. Gate'ler 12 kamera yerine 7–8 kamerayla koştu

| Gate | Kamera |
|---|---|
| gate-1.1 | 4 (C03, C07, C09, C10) |
| gate-1.5 / 1.3 / 1.2 / 1.6 / 1.1b | 7 — **C04 yok** |
| gate-visual-ref | 8 |
| gate-f342 | 8 |
| final-current / faz1-final | 12 ✅ |

**C11 (ana yatak odası) ve C12 (bodrum mutfak) hiçbir gate'ten geçmedi** —
sadece en son capture'da var, karşılaştırma referansı yok. C04 (havuz
cephesi) FAZ 1 boyunca hiç gate'lenmedi.

### A5. Kameralar donmuş olmalıydı, Task 1.5'te çözüldü

`qa-cameras.js:3`: *"Every number here is FROZEN. …a camera that drifts with
the code invalidates every diff taken through it."*

`qa-cameras.js:31`: *"their fov moved 16 → per-view rig values when Task 1.5
landed"*

C03/C04 fov 16° → 30°, C05–C08 16° → 28°. Hedef/span değişmedi ama fov
değişince kamera konumu kayıyor: C03'te 44,0 m, C04'te 50,7 m.
**Bu yüzden "öncesi/sonrası" kompozitlerinde kalite farkı çerçeveleme
farkıyla karışmış durumda.** Sabit kalan tek kareler C09 ve C10.

Kod yorumu eski değerlerin `pre-1.5` tag'inde olduğunu söylüyor —
**o tag yok** (ne yerelde ne uzakta). Değerler `496c674` commit'inden
kurtarılabiliyor, yani kayıp değil, ama belirtilen yolla değil.

---

## B. TASK TASK DURUM

Gösterim: ✅ tam · ⚠️ kısmi · ❌ olmadı · 🚫 engel (yapılamazdı)

### FAZ 0

| Task | Durum | Ölçüm |
|---|---|---|
| 0.1 ortam + testler | ✅ | **260/260 geçiyor** (çalıştırdım) |
| 0.2 12 deterministik kamera | ✅ | `qa-cameras.js` 12 kamera, share-state formatı |
| 0.3 ölçüm harness'i | ⚠️ | JSON şeması tam, ama `frame` (fps/p50/p95/p99) her kayıtta `null` — SwiftShader'da geçersiz, dürüstçe boş bırakılmış |
| 0.4 baseline + mandal | ❌ | `baseline-<commit>/` **yok**; ratchet `null` (cihaz tarafı 🚫 H1) |
| 0.5 qa-mobile.html | ✅ | repo kökünde, H1 teslimatı hazır |

FAZ 0 kabul md. 6 (`estimatedTextureMiB` masaüstü ≈256): ölçülen **277,7**
— %+8,5, ±%10 toleransı içinde ✅

### FAZ 1

| Task | Durum | Plandaki kriter vs ölçüm |
|---|---|---|
| 1.1 bayrak cerrahisi | ⚠️ | "görsel diff = 0" → 10 karenin 8'i birebir, 2'sinde %0,001 piksel (max 25/255). Pratikte zararsız, harfiyen değil. `quality-profile.test.mjs` var ✅ |
| 1.2 hibrit güneş gölgesi | ⚠️ | Masaüstünde çalışıyor. `shadow-proxy.glb ≤80k` kriteri **karşılanmadı** — proxy geri çekildi, gerekçe teknik ve doğru (three r180 depth pass'i beauty kamerasının layer'larıyla cull ediyor). FPS kriterleri ölçülemez. |
| 1.3 exterior-grade dirilişi | ❌ | **6 kriterin 2'si düpedüz başarısız.** "Çim tek renk yeşil platform değil" → çime **hiçbir şey** uygulanmadı. "Cephe sıvasında ince kum dokusu, düz plastik değil" → STRUCCO sadece normal map aldı, albedo düz. 25 dış yüzeyin 2'si doku aldı. |
| 1.4 doubleSided | 🚫 | Rafa kaldırıldı (H8). Gerekçe doğrulandı: duvarlar iki kabuk, kesitte yüzey kaybediyor. |
| 1.5 kamera/kompozisyon | ✅ | Lensler, 16:30, ufuk sisi canlı. Yan etkisi A5'te. |
| 1.6 spot şeridi + anisotropy | ✅ | Kod canlı ve erişilebilir |
| **FAZ 1 çıkış kapısı** | ❌ | 9 performans maddesi değerlendirilemedi (A2). Görsel maddelerden "çim tek renk platform değil" **başarısız**. |

### FAZ 2

| Task | Durum | Ölçüm |
|---|---|---|
| 2.1 progressive loader | ⚠️ | Kod canlı. "İlk interaktif ≤5 MB (desktop)" → ölçülen **23,9 MB**. Kriter uzak ara karşılanmıyor. Ağ waterfall ekran görüntüsü yok. |
| 2.2 context HLOD + instancing | ⚠️ | Sadece runtime yarısı (48 m culling). Instancing 🚫 H6. |
| 2.3 bitkiler | ⚠️ | Runtime yarısı ✅ — ±6° hue / ±%12 value kodda birebir doğrulandı. Rotation/scale jitter 🚫 H6. |
| 2.4 topografya | ❌ | Sadeleştirici kanıtlı (311k→85,8k, worst 1,9 cm) ama **apply geri alındı** 🚫 H10 |

Kabul 2.2–2.4 "görünür üçgen: desktop villa 700k–1,2 M" → ölçülen
C03 **2 053 171**. Kriter karşılanmıyor (baseline 2,7 M'den düşmüş ama
hedefin 1,7 katı).

### FAZ 3 — en zayıf faz

| Task | Durum | Ölçüm |
|---|---|---|
| 3.1 malzeme yazarlığı | 🚫/❌ | Hiç başlamadı. Blender + içerik işi (H3/H9). **Kullanıcı bu işi kendisi kesti** — ajanın suçu değil. |
| 3.2 bevel + weighted normals | 🚫/❌ | Hiç başlamadı (H4). **Kullanıcı kesti.** |
| 3.3 texture2DArray | ✅ | Runtime yarısı canlı, mobil dahil; maxLod kelepçesi gerçekten kalkmış. Build yarısı (512/1024 hücre) 🚫 H6 |
| 3.4 bake kalitesi | ⚠️ | 3.4d ✅ ama **sadece masaüstü**; 3.4f ✅; 3.4g ✅; 3.4a–c 🚫 H2 (Blender) |
| 3.5 cam/havuz/yansıma | ⚠️ | `poolWaterV2` ✅ canlı. **`glassTiersV2` ÖLÜ** — aşağıda C1. |

**FAZ 3 kabul kriterleri, 9 madde:**

| Kriter | Ölçüm | |
|---|---|---|
| Yakın çekim cephe CAD katısı gibi okunmuyor | cephe düz | ❌ |
| **Roughness düz değil, varyasyon var; sabit skaler yasak** | **177 kaynak materyalin 164'ünde hücre-içi roughness varyasyonu ≤6/255** | ❌ |
| texture2DArray sonrası shimmer yok | atlasArrayV2 canlı | ✅ |
| **Lightmap UV doluluğu ≥ %65** | iç mekân **%4,1** | ❌ |
| Camlar mahalle siluetini yansıtıyor | `glassTiersV2` ölü | ❌ |
| Havuz düz mavi plastik değil | poolWaterV2 canlı | ✅ |
| Köşeler/koveler duvar ortasından koyu | kat görünümlerinde GTAO var, **dış cephede yok** | ⚠️ |
| Oda geçişinde probe dikişi yok | ölçülmedi | ? |
| Gece modu GI gibi | +0 program ölçülmüş, görsel doğrulanmadı | ? |

**9 kriterin 2'si karşılanıyor.**

### FAZ 4

| Task | Durum | Ölçüm |
|---|---|---|
| 4.1 KTX2 | ❌ | Ertelendi, bayrak kapalı. Gerekçe ölçülmüş ve makul (webp→UASTC tel maliyeti ters: 67 KB→264 KB) |
| 4.2 bundle splitting | ✅ | **708,5 → 300,9 KB gzip** — doğrulandı |
| 4.3 cache/hosting | 🚫 | H5, ürün sahibi kararı. **Kullanıcı "hosting zaten iyi" dedi** |
| 4.4 debug/QA yüzeyi | ✅ | `?quality/?features/?camera/?stats` + overlay'de p95 & GPU MiB — kodda doğrulandı (`main.js:2066`) |

### FAZ 5

| Task | Durum | Ölçüm |
|---|---|---|
| cinemaStill | ⚠️ | Kod doğru, `desktop-high` + `postProcessing` gerektiriyor. **O tier hiç render edilmedi** (A1) — yani hiç görülmedi. |

---

## C. ÖLÜ KOD — koşul hiç sağlanmıyor

### C1. `glassTiersV2` (Task 3.5)
`lighting.js:427` → `!material.userData.angoraAuthoredPBR`.
`build.mjs:96` bu bayrağı her materyale basıyor; üretim GLB'lerinde
**37/37 `true`**. Koşul asla sağlanmıyor. `lighting.js:419`'daki
`metalness=0` kolu da aynı guard'da.

### C2. Yaprak normalleri
`lighting.js:396` — aynı guard, **artı** regex `foliage` arıyor ama batched
materyal adı `context-plants-other-0`. İki sebepten ölü.

### C3. `TABLE` / `applyGradeValues` / `bindGradeTextures`
`main.js:1492` `manifest.assets` + `asset.exterior_grade` bekliyor. Üretim
manifesti `parts` kullanıyor, `exterior_grade` bayrağı hiç yok.
10 grade girdisinin 10'u ölü.

### C4. GTAO dış cephede kapalı
Ölü kod değil ama etkisi aynı. 12 kameranın capture'ı: C01–C04
(region + neighborhood) hepsinde `gtao: false` — matris o satırlarda
kapatıyor. **Temas/köşe kararması dış cephede masaüstünde bile yok.**

---

## D. SAYI

| | Adet |
|---|---|
| Task toplam | 26 |
| ✅ Tam | **8** |
| ⚠️ Kısmi | **9** |
| ❌ Olmadı (engel değil) | **5** |
| 🚫 Gerçek engel / kullanıcı kesti | **4** |

Faz kabul kriterleri: FAZ 1 çıkış 9/9 değerlendirilemedi ·
FAZ 3 kabulde 9 kriterin 2'si karşılandı · Task 1.3 kabulde 6'nın 4'ü.

---

## E. DOĞRU ÇIKANLAR — bunlar dürüst

Ölçtüm, tuttu:
- **260/260 test geçiyor** (çalıştırdım)
- Bundle **708,5 → 300,9 KB** gzip
- C03 üçgen **2 695 936 → 2 053 171**
- Doku belleği **277,7 → 151,3 MiB**
- Bitki varyasyonu ±6° / ±%12 — kodda birebir
- `ratchet.json` dürüst null, uydurma sayı yok
- SwiftShader'da FPS'in geçersizliği her kayıtta `softwareRaster: true` ile
  işaretlenmiş — bu dürüstlük
- 4.1'in ertelenme gerekçesi ölçülmüş ve doğru

**Performans ve yükleme tarafı gerçek. Abartı yok.**

---

## F. NEDEN HÂLÂ SKETCHUP — sıralı sebep

1. **164/177 materyalde roughness düz.** Tek tip speküler parlama "CG"
   dedirten birinci şey. Plan bunu yasaklamıştı.
2. **Dış cephede hiçbir cihazda ortam kapanması yok** (GTAO kapalı).
   Villa çimin üstünde yüzüyor.
3. **25 dış yüzeyin 21'i düz renk** — çim, asfalt, çakıl, komşular, bitkiler.
4. **İç mekân lightmap doluluğu %4,1** (hedef ≥%65). Blender gerektiriyor.
5. **iPhone 13'te gölge de postfx de kapalı** — senin cihazında yukarıdakilerin
   üstüne bir de bu biniyor.

1, 2 ve 3 **kod işi** — Blender gerekmiyor, ortam engeli yok.
4 gerçek engel (H2). 5 ölçüme bağlı (H1).

---

## G. BU DENETİMİN SINIRI

Ölçmediğim, sadece kod varlığına baktığım kalemler:
- 2.1'in ağ waterfall sırası (ekran görüntüsü delili istenmişti, yok)
- Oda geçişinde probe dikişi (FAZ 3 kabul md. 8)
- Gece modunun görsel kalitesi (FAZ 3 kabul md. 9)
- Regresyon listesi: asansör, VR, i18n, sesli tur, fotoğraf pinleri, ölçüler,
  paylaşım linki — testler geçiyor ama elle açılıp bakılmadı

Bunları da istersen ölçerim.
