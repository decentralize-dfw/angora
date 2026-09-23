# FAZ 6 — DÜZ RENK KATLİAMI

**Amaç:** SketchUp görüntüsünü bitirmek. V-Ray kalitesi, mobil hız korunarak.
**Referans cihaz:** iPhone 13 / Safari. Mevcut hız "kâfi" — hedef **korumak**, iyileştirmek değil.
**Branch:** `claude/clever-tesla-ataxcq` üzerinden devam. `main`'e izinsiz merge yok.

---

## BÖLÜM 0 — NEDEN BU FAZ VAR: ÖLÇÜLMÜŞ GERÇEK

Faz 1 Task 1.3 "dış cephe canlandırma" olarak kapatıldı. **Kapatılmamıştı.**
Aşağıdaki tablo `build/web/batched/desktop/*.glb` dosyalarının JSON chunk'ı ve
atlas görüntüleri doğrudan okunarak ölçüldü (materyal başına atlas hücresi
kırpılıp RGB aralığı alındı; `range` = hücredeki en geniş kanal aralığı,
`range ≤ 6` = gözle düz tek renk).

### 0.1 Üretimde ne çalışıyor, ne çalışmıyor

`viewer/src/exterior-grade.js` iki ayrı yol içeriyor:

| Yol | Tablo | Girdi sayısı | Üretimde çalışıyor mu? |
|---|---|---|---|
| `applyGradeValues` + `bindGradeTextures` | `TABLE` | 10 | **HAYIR** |
| `reviveBatchedGrade` | `BATCHED_TABLE` | 4 | Evet |

`TABLE` yolu `main.js:1492`'de `if (asset.exterior_grade)` ile kapılı ve
`manifest.assets` üzerinde dönüyor. Ama üretim manifesti
(`build/web/batched/desktop/manifest.json`) `assets` dizisi **içermiyor** —
`parts` içeriyor, ve hiçbir part'ta `exterior_grade` bayrağı **yok**.
Yani `iron` rengi, `gravel`, `canopy`, `grass`, `asphalt`, `terrace`,
`entrance-court` grade'lerinin tamamı — 10 girdinin 10'u — **hiç çalışmadı.**
Bu ölü kod, silinmeyecek (klasik teslimat hâlâ kullanıyor) ama üretim
görüntüsüne katkısı sıfır. Bunu hesaba katmadan hiçbir kapsama iddiası kurma.

Üretimde çalışan tek şey `reviveBatchedGrade`. O da iki filtreyle daralıyor
(`exterior-grade.js:193`):

```js
if (!batch || batch.grid !== 1 || batch.materials.length !== 1) return;
const entry = BATCHED_TABLE.find(e => e.name === batch.materials[0]);
```

- `grid !== 1` → 37 batched materyalin **23'ü** yapısal olarak erişilemez.
- `BATCHED_TABLE`'da 4 satır var → kalan 14 grid=1 materyalin **10'u** boşta.

### 0.2 Dış cephede fiilen ne oldu

| Yüzey | Kaynak materyal | Batch | grid | Hücre `range` | Uygulanan |
|---|---|---|---|---|---|
| Villa çatı | `Clay tile` | architecture-tile-1 | 1 | — | ✅ map + normal |
| Havuz terası | `stone_tile` | architecture-tile-8 | 1 | — | ✅ map + normal + groundUV |
| Villa cephe | `STRUCCO` | architecture-other-9 | 1 | 14 | ⚠️ **sadece normal** |
| Komşu sıva | `ceiling.004` | context-buildings-plaster-0 | 1 | 14 | ⚠️ **sadece normal @0.3** |
| Villa metal | `metal` | architecture-metal-6 | 1 | **0** | ❌ |
| Havuz suyu | `water` | garden-glass-4 | 1 | 4 | ❌ |
| Komşu duvar | `neighbor_wall` | context-buildings-other-3 | 1 | 14 | ❌ |
| İstinat duvarı | `Retaining wall rough limestone.001` | garden-other-3 | 1 | 9 | ❌ |
| Komşu ahşap | `wood_dark.002` | context-buildings-wood-4 | 1 | 20 | ❌ |
| Çim | `R31 \| R39 continuous grass ground` | context-ground-other-0 | 2 | 46 | ❌ |
| Asfalt | `R31 \| R37 fine asphalt aggregate` | context-ground-other-0 | 2 | 7 | ❌ |
| Giriş avlusu | `Entrance coursed limestone.001` | context-ground-other-0 | 2 | 4 | ❌ |
| İstinat (context) | `Retaining wall rough limestone (1)` | context-ground-other-0 | 2 | 3 | ❌ |
| Sınır taşı | `R31 \| R39 boundary limestone top` | context-buildings-other-1 | 2 | 4 | ❌ |
| Çevre istinat | `R31 \| R39 surrounding retaining stone` | context-buildings-other-1 | 2 | 56 | ❌ |
| Komşu cam | `Context glazing` | context-buildings-other-1 | 2 | 4 | ❌ |
| Komşu çatı | `roof.004`, `Neighbor 20 green tiles` | context-buildings-tile-2 | 2 | — | ❌ |
| Bitki | `foliage`, `foliage_light` | context-plants-other-0 | 2 | 4 / 2 | ❌ |
| Havuz karo | `pool_tile`, `STONE-TILE` | garden-tile-2 | 2 | 8 / 13 | ❌ |
| Bahçe metal | `chrome (5)`, `metal (5)` | garden-metal-0 | 2 | 3 / 3 | ❌ |
| Beyaz denizlik | `white_trim (5)` | garden-other-1 | 2 | **0** | ❌ |
| Villa çatı ikinci | `roof-7` | architecture-tile-7 | 4 | 97 | ❌ |
| Çakıl | `gravel`, `gravel [imported]` | architecture-other-4 | 4 | 2 / 2 | ❌ |
| Sundurma | `canopy.001` | architecture-other-4 | 4 | 2 | ❌ |
| Sundurma kirişi | `Garden \| Dark stained canopy timber` | architecture-wood-2 | 2 | 2 | ❌ |

**Sonuç: 25 dış yüzeyin 2'si gerçek doku aldı. 2'si sadece normal map aldı
(albedo değişmedi — düz rengin üstüne normal koymak SketchUp görüntüsünü
bozmaz). 21'i hiçbir şey almadı.** Kullanıcının "hâlâ SketchUp" demesi doğru;
render'da sadece çatının değişmesi bu tablonun birebir karşılığı.

### 0.3 Atlas'ı yeniden boyamak neden çözüm DEĞİL

Çim hücresi 248 px ve 310 m'lik araziyi kaplıyor: **~1.25 m/texel**. Giriş
avlusu tek texel'e çökmüş. Bu UV'ler teslimatın kendisinde bozuk ve
`build.mjs`'in kaynağı (`../model-finalization/web`) bu ortamda **yok** —
atlas yeniden serilemiyor (H6). Ayrıca `atlasSample()` `maxLod`'u
`log2(width × pad)` ile mip 2–3'e kırpıyor; hücreye ne boyarsan boya uzakta
titreşim ve bulanıklık olarak geri geliyor.

Yani: **dünya uzayında prosedürel varyasyon, bu teslimatta yer altı dokusuna
alt-metre detay katabilecek tek mekanizma.** Atlas'a dokunmadan, byte
eklemeden, UV'yi yeniden sermeden.

### 0.4 SketchUp görüntüsünün asıl sebebi

Eksik doku değil. **Geniş yüzeyde tek tip albedo + tek tip roughness + temas
kararması yokluğu.** V-Ray'in imzası tam olarak bu üçünün tersi. Bu faz üçünü
de hedefler; doku ekleme (İŞ A) sadece en ucuz kısmı.

---

## BÖLÜM 1 — İŞ A: `BATCHED_TABLE`'ın grid=1 boşluklarını kapat

**Flag:** `exteriorGradeRevival` (mevcut, açık). Yeni flag yok.
**Mekanizma:** Yeni mekanizma yok — sadece tablo satırı. Bu yol zaten üretimde
çalışıyor, mip zinciri ve anizotropi doğru (`batched-material.js:40` bu
slotlarda `atlasSample`'ı atlıyor).

Aşağıdaki 5 dış yüzey grid=1 ve bugün boşta. Ekle:

| Materyal | Ne verilecek | Not |
|---|---|---|
| `metal` | `color` + `roughness` + `metalness` | Hücre `range=0` — tam düz. Mevcut ölü `TABLE`'daki `iron` grade'i (`#212326`, r 0.58, m 0.22) buraya taşı. 4×4 placeholder `map`'i **null'la**, yoksa kendi stub pikselini renge çarpar (`exterior-grade.js:84`'teki aynı koruma). |
| `neighbor_wall` | `stuccoNormal` @ 0.35 + hafif renk kırılımı | Komşu duvarları. Villa'dan sönük kalmalı — konu değil, fon. |
| `Retaining wall rough limestone.001` | `travertineNormal` @ 0.8 | İstinat duvarı, kaba taş. Renk verme — hücre `range=9`, doku hue'yu taşıyor. |
| `wood_dark.002` | `roughness` yükselt | Komşu ahşap. Doku değil, sadece parlaklık kır. |
| `water` | **DOKUNMA** | `poolWaterV2` (Task 3.5) bu materyali zaten analitik dalga + fresnel ile sürüyor. Üstüne map bağlarsan o shader'ı bozarsın. Sadece doğrula, geç. |

**`STRUCCO` ve `ceiling.004` için:** bugün sadece `normalMap` alıyorlar,
albedo düz kalıyor. Bunlara **albedo dokunma** — İŞ B'nin makro varyasyonu bu
ikisini de kapsayacak ve iki mekanizmanın üst üste binmesi lekeli görünür.
İŞ B bittikten sonra A/B'de bak, gerekiyorsa `normalScale`'i ayarla.

**Kabul:** `reviveBatchedGrade` dönüş değeri (`applied`) 4 → 8. Bu sayıyı
`console.info` ile logla ve gate çıktısına yaz. Byte artışı: **0** (mevcut
PNG'ler yeniden kullanılıyor, yeni dosya yok). Yeni draw call: **0**.

---

## BÖLÜM 2 — İŞ B: `batchId` kapılı prosedürel makro varyasyon

**Bu fazın merkezi işi.** grid=1/2/4 fark etmeksizin 37 materyalin hepsine
erişir, çünkü `batchId` zaten her batched fragment shader'ında varying olarak
mevcut (`batched-material.js:18–19`).

**Yeni flag:** `proceduralDetailV1` — **varsayılan `false`**. Ölçüm yeşil
gelene kadar açma. Flag kapalıyken emitted GLSL, bugünküyle **birebir aynı**
olmalı (cache key'e de girmemeli — bkz. 2.5).

### 2.1 Ne yapacak

`map_fragment`'tan **sonra**, `diffuseColor` çözüldükten sonra üç şeyi
modüle et:

1. **Albedo makro varyasyonu** — düşük frekanslı (2–8 m) dünya uzayı gürültüsü,
   `diffuseColor.rgb` üzerinde ±%N değer kayması. Hue'yu **kaydırma**, sadece
   value/luma. Hue kaydırma lekeli ve ucuz görünür.
2. **Roughness varyasyonu** — aynı gürültü örneği, farklı remap. Bu neredeyse
   bedava ve CG parlaklığını kıran asıl şey. Tek tip speküler parlama
   "bilgisayar" diye bağırır.
3. **Mikro detay** — yalnızca masaüstünde, ikinci oktav (0.2–0.6 m).

### 2.2 Dünya uzayı, UV değil — ve triplanar YOK

Gürültü **dünya pozisyonundan** örneklenecek, UV'den değil. Sebep 0.3'te:
teslimatın UV'leri bozuk, çimin UV'si 310 m'yi 0..1'e sıkıştırıyor.

`vWorldPosition` bu projede **yok** (grep ile doğrulandı). Vertex shader'da
kendin türet ve varying olarak geçir: `+1 vec3 varying`. Bundan fazlası yok.

Tam triplanar (3 gürültü örneği) **yasak** — mobil bütçesi kaldırmaz. Bunun
yerine baskın normal eksenine göre **tek** düzlem seç:

```glsl
vec3 an = abs(worldNormal);
vec2 pp = (an.y > max(an.x, an.z)) ? wp.xz : (an.x > an.z ? wp.zy : wp.xy);
```

Eksen değişim çizgisinde dikiş oluşur; makro frekansta (2–8 m) ve düşük
genlikte (±%6) bu göze çarpmaz. **Doğrula:** C03 ve C07 kamerasında duvar–zemin
birleşimine bak, görünür çizgi varsa genliği düşür, triplanar'a kaçma.

### 2.3 Hücre başına parametre

`grid=4` → en fazla 16 hücre. Tek uniform dizi yeter:

```glsl
uniform vec4 uDetail[16];  // x: albedo genliği, y: roughness genliği,
                           // z: frekans (1/metre), w: mikro oktav ağırlığı
```

Fragment'ta `int id = int(floor(batchId + 0.5));` ile indeksle.
**Kapalı hücre `vec4(0.0)` olmalı** — o materyal bugünküyle birebir aynı kalır.
Bu, işi materyal materyal açmanı sağlar; hepsini birden açma.

JS tarafında tablo `exterior-grade.js`'de değil, **yeni bir modülde**
(`viewer/src/procedural-detail.js`) dursun — `exterior-grade.js` teslimat
onarımı, bu ise render katmanı; ikisini karıştırma.

Açılacak hücreler ve başlangıç değerleri (A/B'de ayarla, bunlar başlangıç):

| Materyal | albedo | roughness | frekans | mikro | Gerekçe |
|---|---|---|---|---|---|
| `R31 \| R39 continuous grass ground` | 0.10 | 0.08 | 1/6 m | 0.6 | En büyük düz alan, en büyük kazanç |
| `R31 \| R37 fine asphalt aggregate` | 0.06 | 0.12 | 1/4 m | 0.5 | Asfalt varyasyonu çoğunlukla roughness |
| `Entrance coursed limestone.001` | 0.07 | 0.10 | 1/2 m | 0.4 | UV'si tek texel'e çökmüş — tek çare bu |
| `STRUCCO` | 0.05 | 0.06 | 1/3 m | 0.3 | Villa cephesi. **Sönük tut** — konu bu |
| `ceiling.004` | 0.06 | 0.06 | 1/3 m | 0.2 | Komşu sıva |
| `neighbor_wall` | 0.07 | 0.08 | 1/3 m | 0.2 | Komşu duvar |
| `gravel`, `gravel [imported]` | 0.12 | 0.10 | 1/1 m | 0.7 | Çakıl zaten tanecikli olmalı |
| `foliage`, `foliage_light` | 0.09 | 0.05 | 1/3 m | 0.3 | `plantVariation` bileşen başına sürüyor; bu yaprak içi varyasyon, çakışmaz — **A/B'de ikisi birlikte bak** |
| `roof.004`, `Neighbor 20 green tiles` | 0.08 | 0.08 | 1/2 m | 0.4 | Komşu çatılar |
| `roof-7` | 0.06 | 0.08 | 1/1 m | 0.5 | grid=4, `Clay tile` yolu erişemiyor |
| `white_trim (5)` | 0.04 | 0.10 | 1/1 m | 0.3 | `range=0`. Düşük genlik — beyaz kirli görünmesin |
| `chrome (5)`, `metal (5)` | 0.02 | 0.14 | 1/0.5 m | 0.4 | Metalde albedo değil **roughness** varyasyonu iş görür |
| `R31 \| R39 boundary limestone top` | 0.07 | 0.09 | 1/2 m | 0.4 | |
| `Retaining wall rough limestone (1)` | 0.09 | 0.10 | 1/1.5 m | 0.5 | |
| `pool_tile`, `STONE-TILE` | 0.04 | 0.06 | 1/1 m | 0.3 | Havuz karosu — hafif, su altında zaten kırılıyor |
| `Garden \| Dark stained canopy timber` | 0.06 | 0.09 | 1/1 m | 0.4 | |
| `canopy.001` | 0.06 | 0.08 | 1/1.5 m | 0.3 | |

`Context glazing` ve `water`: **açma** (`vec4(0.0)`). Cam ve su ayrı
shader yollarında.

### 2.4 Mobil bütçesi — pazarlık yok

- **Mobil:** tek oktav. `uDetail[].w` mobilde uniform olarak 0'lanır, ikinci
  oktav GLSL'den `#ifdef` ile **tamamen çıkar** — çarpan 0 değil, kod yok.
- **Masaüstü:** iki oktav.
- **Yeni texture fetch: 0.** Gürültü hash tabanlı analitik olacak. Bir gürültü
  dokusu bağlarsan bu işi reddet ve BLOCKED yaz — fetch mobilde bant genişliği
  ve VRAM demek.
- **Yeni draw call: 0. Yeni üçgen: 0. Yeni byte: 0.**
- **Yeni varying: tam 1 (vec3 dünya pozisyonu).**

### 2.5 Flag kapalıyken sıfır iz

`material.customProgramCacheKey` (`batched-material.js:61`) flag kapalıyken
**değişmemeli**. Yani cache key'e `proceduralDetailV1` parçasını yalnızca flag
açıkken ekle. Aksi halde kapalı durumda bile tüm shader'lar yeniden derlenir
ve "flag off = byte-for-byte aynı" sözleşmesi (features.js:1–7) kırılır.

**Kapı:** `?features=proceduralDetailV1:0` ile emitted fragment shader'ı dök,
bugünkü ile `diff` al. Çıktı **boş** olmalı. Bu diff'i gate klasörüne koy.

---

## BÖLÜM 3 — İŞ C: çalışma zamanı vertex AO (temas kararması)

**Yeni flag:** `runtimeVertexAO` — varsayılan `false`.

V-Ray ile bunun arasındaki en büyük tek fark: **hiçbir yerde temas kararması
yok.** Duvar zeminle buluştuğu yerde, saçak duvarla buluştuğu yerde, bitki
toprakla buluştuğu yerde aynı parlaklık. Göz bunu anında "CG" diye okur.

Faz 1'in `hybridSunShadow`'u yalnızca güneşten gelen **yön gölgesi** veriyor ve
yalnızca masaüstünde. Ortam kararması bambaşka bir şey ve mobilde de gerekli.

**Yaklaşım:** vertex başına, yükleme sonrası bir kez, boşta hesapla; sonucu
vertex renk attribute'una (veya `aoMap`'in kullanmadığı bir attribute'a) yaz.
Fragment'ta bedava — sadece bir varying çarpımı.

**Kısıtlar:**
- Hesap **boşta (idle)** yapılacak, ilk kareyi geciktirmeyecek. `bakedAoRevival`
  ve `atlasArrayV2` zaten bu deseni kullanıyor (`main.js:1381`, `1394`) — aynı
  boşta kuyruğuna gir, onların önüne geçme.
- **Mevcut bake'leri geçersiz kılma.** `ground-light`, `floor-light`,
  `room-probes` bake'leri ve `sourceGeometryHashes` attestasyonu duruyor;
  geometriye **dokunma**, sadece yeni bir attribute ekle.
- Mesh başına üçgen sayısı bir eşiği aşarsa (örn. >200k) **atla** ve logla —
  arazi ve bitki chunk'larında boşta bütçeyi yakmasın.
- Mobilde de çalışacak, ama örnek sayısı düşük (yarım küre başına 8–12 ışın).
  Kaliteyi masaüstünde artır.

**Kabul:** C03/C07/C10'da duvar–zemin, saçak–cephe ve bitki–toprak
birleşimlerinde görünür kararma. Pixel diff gate'inde bu bölgeler kırmızı
olmalı — **başka yerler olmamalı.** Gökyüzü ve düz açık cephe orta
alanlarında diff ≈ 0.

---

## BÖLÜM 4 — İŞ D: iç mekân aynı muamele

İç mekân da şikâyet listesinde ve daha kötü durumda: lightmap doluluğu %4.1,
zeminde %3.5; `interior-other-1..5` hepsi grid=4, her biri 16 kaynak materyal.
Yani `reviveBatchedGrade` iç mekânın **hiçbirine** erişemiyor.

İŞ B ve İŞ C iç mekânı **otomatik kapsıyor** — `batchId` orada da var. Ek iş:

1. `uDetail` tablosuna iç mekân hücrelerini ekle. Başlangıçta **sadece büyük
   yüzeyler**: `INTERIOR` (sıva), `WOOD-FL` (zemin), `wood_floor.001`,
   `bath_tile`, `Basement | Ochre wall tile 0..4`, `terra_floor`. Mobilya ve
   ufak nesnelere dokunma — kazanç yok, risk var.
2. İç mekân genlikleri dış mekânın **yarısı** olsun. İç mekânda ışık zaten
   yumuşak; aynı genlik orada kirli görünür.
3. `neutralInterior` yolu (`batched-material.js:14, 45–49`) `ceiling` ve
   `INTERIOR` için IBL'i lumaya düzleştiriyor. Prosedürel varyasyon bu
   düzleştirmenin **üstüne** binmeli, altına değil — sırayı doğrula.

---

## BÖLÜM 5 — BÜTÇE, RATCHET, KAPILAR

### 5.1 Ölçülebilir olan ve olmayan

Bu ortamda **FPS ölçülemez** (SwiftShader). Bir daha FPS hedefi yazma, FPS
kapısı kurma. Ölçülebilen ve bu fazda kapı olacak olanlar:

| Metrik | Hedef | Nasıl |
|---|---|---|
| Draw call | **+0** | QA harness, mevcut |
| Üçgen | **+0** | QA harness, mevcut |
| Transfer byte | **+0** | Yeni dosya yok |
| Tahmini VRAM | **+0** | Yeni doku yok |
| Varying sayısı | **+1 vec3** | Emitted GLSL'den say |
| Fragment ALU | mobil ≤ +14, masaüstü ≤ +38 | **Emitted GLSL'den say** — statik, doğrulanabilir |
| Flag-off GLSL diff | **boş** | 2.5'teki diff |
| Program sayısı | **+0** flag kapalı | Cache key sabit |

ALU sayımını gerçekten yap: `?features=proceduralDetailV1:1` ile shader'ı dök,
enjekte edilen bloğun komut sayısını say, gate dosyasına yaz. Tahmin etme.

### 5.2 Ratchet

`build/qa/ratchet.json` iPhone 13 temel çizgisi. Hiçbir iş gevşetemez.
Ölçülmemiş alanlar `null` kalır — doldurma.
**H1 hâlâ açık:** `qa-mobile.html` ile gerçek iPhone 13 ölçümü alınmadı.
İŞ B ve İŞ C mobilde **flag kapalı** ship edilecek; mobilde açmak H1'e bağlı.
Masaüstünde ölçüm yeşilse açabilirsin.

### 5.3 Kapı sırası — görünür iş önce

Faz 1'de sırayı yanlış kurdum: görünmez perf işleri görünür işlerin önüne
geçti, Task 1.4 dört saat yakıp sıfır teslim etti. Bu fazda sıra:

1. **İŞ A** (en ucuz, en hızlı görünür kazanç — tablo satırı)
2. **İŞ B dış mekân** (merkez iş)
3. **İŞ C** (temas kararması)
4. **İŞ B iç mekân** (İŞ D)

Her adım kendi gate'i ile kapanır, bir sonraki başlamadan önce. Bir adım
BLOCKED olursa **atla ve sonrakine geç** — sırayı bekletme.

### 5.4 Her gate'te ne olacak

- **16 kare**, 2 profil (mobile-high, desktop-balanced), `@1x` ve `@2x`.
  `@2x` zorunlu: `@1x` 1600×900 dpr1'de pixel budget farkını maskeliyor (P3).
- **Kesit karesi sayısal kuralı** korunur: kesit görünümünde kayıp yüzey
  oranı **>%1 ise kırmızı**. Gözle "iyi görünüyor" demek yasak — Task 1.4'te
  tam olarak bu yüzden eksik duvarlar kaçtı.
- **Yan yana kompozit zorunlu** ve **her gate'te farklı kare göster**.
  En az bir **iç mekân** karesi (C10) her kompozitte olacak. Aynı
  karşılaştırmayı iki kez gösterme.
- Gate klasörü: `build/qa/faz6-<iş>/`.

---

## BÖLÜM 6 — KABUL KRİTERLERİ

Faz 6 ancak şunların **hepsi** sağlanınca kapanır:

1. `reviveBatchedGrade` applied sayısı ≥ 8, logda ve gate çıktısında.
2. `uDetail` tablosunda ≥ 20 dış, ≥ 6 iç hücre sıfırdan farklı.
3. Flag-off GLSL diff boş, program sayısı değişmemiş.
4. ALU sayımı 5.1'deki tavanların altında, gate dosyasında **sayılmış** halde.
5. Draw call / üçgen / byte / VRAM deltası sıfır.
6. C03, C07, C10 yan yana kompozitleri: öncesi–sonrası **görünür** fark.
   "Görünür" = sayısal değil gözle — ama kompoziti üretmeden iddia etme.
7. Kesit kareleri yeşil (kayıp yüzey ≤ %1).
8. 260/260 test yeşil, `main` el değmemiş.
9. Mobil tier'larda flag durumu açıkça belgelenmiş (H1 kapanmadıysa kapalı).

---

## BÖLÜM 7 — ÇALIŞMA SÖZLEŞMESİ

- **BLOCKED protokolü:** bir iş yapılamıyorsa `BLOCKED.md`'ye H-numarası ile
  yaz, **neden** yapılamadığını ölç, sonrakine geç. Sessizce atlama.
- **Yapamadığın şeyi yaptım deme.** Bu fazın var olma sebebi tam olarak bu:
  Task 1.3 "dış cephe canlandırma" olarak kapatıldı, gerçekte 25 yüzeyin 2'sine
  dokundu. Kapsama iddiası yazacaksan **saydır**.
- **Gözle doğrulama tek başına kanıt değil.** Sayısal kural varsa o geçerli.
- **Ara rapor yok, faz sonuna kadar devam.** Her iş bitiminde commit + push,
  `PROGRESS.md` güncelle. Kullanıcı sonda bakacak.
- Atlas'ı yeniden sermeye, Draco'yu yeniden kodlamaya, `build.mjs`'i kaynak
  olmadan çalıştırmaya **kalkışma** — H6/H8 kapalı.
- Malzeme yazarlığı (yeni PBR kütüphanesi) ve mesh temizliği **kapsam dışı**,
  kullanıcı kesti.
