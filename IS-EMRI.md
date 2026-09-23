# ANGORA — İŞ EMRİ (FAZ-6 + süreç onarımı)

Bu dosya `FAZ-6-DUZ-RENK.md`'nin yerine geçer. Ondan farkı: 26 task'ın
tam denetiminden (`DENETIM.md`) çıkan **süreç hatalarını** da kapatıyor.
Önceki fazların "yeşil" kapanıp gerçekte kapanmamasının sebebi kodun kendisi
kadar gate yönteminin kendisiydi.

**Hedef:** V-Ray görünümü, mobilde hafif.
**Referans cihaz:** iPhone 13 / Safari. Mevcut hız "kâfi" — **koru**, iyileştirme.
**Dal:** mevcut çalışma dalında devam. `main`'e merge **İZİN BEKLER**.
**Okuma sırası:** bu dosya → `DENETIM.md` (kanıt) → `ANGORA-QUALITY-UPGRADE.md`
Bölüm 0.7 (çalışma sözleşmesi) → `BLOCKED.md`.

---

## BÖLÜM 0 — ÖNCE BUNU OKU: neden önceki fazlar yanlış kapandı

Beş faz "tamamlandı" ilan edildi. Denetim şunları buldu. Bunlar suçlama
değil, **tekrarlamaman gereken hatalar**:

1. **Dört tier'ın üçü hiç render edilmedi.** Her capture `desktop-balanced`.
   "mobile" klasörleri de dahil — onlar 393×852 viewport'ta koşmuş
   desktop-balanced. `mobile-high`, `mobile-low`, `desktop-high` **hiç**
   yakalanmadı. Mobil hakkındaki her iddia sadece birim testine dayandı.
2. **Mandal `null` iken faz kapatıldı.** Planın kendi cümlesi: *"Mandal null
   kaldığı sürece hiçbir faz 'tamamlandı' ilan edilemez."* FAZ 1 çıkış
   kapısının 9 performans maddesinin 9'u da `baseline`'a bakıyor.
3. **Kameralar dondurulmuş olmalıydı, Task 1.5'te fov değişti.**
   `qa-cameras.js:3` bunu kendisi yasaklıyor. Sonuç: C03'te kamera 44 m,
   C04'te 50,7 m kaydı; A/B kompozitleri kalite kanıtı taşıyamaz hale geldi.
4. **Gate'ler 12 kamera yerine 7–8 ile koştu.** C11, C12 ve FAZ 1 boyunca
   C04 hiçbir gate'ten geçmedi.
5. **`build/qa/baseline-<commit>/` hiç oluşturulmadı.**

Bölüm 5 bu beşini kapatıyor. **Bölüm 5'i uygulamadan hiçbir işe başlama.**

---

## BÖLÜM 1 — ÖLÇÜLMÜŞ TEŞHİS (kanıt `DENETIM.md`'de)

### 1.1 Neden hâlâ SketchUp — sıralı sebep

| # | Sebep | Ölçüm | Kod işi mi |
|---|---|---|---|
| 1 | **Roughness düz** | 177 kaynak materyalin **164'ünde** hücre-içi varyasyon ≤6/255 | ✅ evet |
| 2 | **Dış cephede ortam kapanması yok** | C01–C04 capture'larının hepsinde `gtao:false` | ✅ evet |
| 3 | **Dış yüzeyler düz renk** | 25 dış yüzeyin 21'i hiçbir doku almadı | ✅ evet |
| 4 | İç mekân lightmap doluluğu | **%4,1** (plan hedefi ≥%65) | ❌ H2, Blender |
| 5 | iPhone 13'te gölge + postfx kapalı | tier matrisi | ⚠️ H1 ölçümüne bağlı |

**1, 2 ve 3 kod işi.** Blender gerekmiyor, ortam engeli yok, kapsam dışı
kesilmiş işlerden de değil. Bu iş emri onları hedefliyor.

Not: tek tip roughness, tek tip albedo'dan **daha güçlü** bir "CG" sinyalidir.
Yüzeylerin hepsinin aynı parlaklıkta parlaması gözün anında yakaladığı şeydir.
Bu yüzden 1. sırada.

### 1.2 Üretimde çalışan / çalışmayan

| Durum | Kalem |
|---|---|
| **ÖLÜ** — `glassTiersV2` | `lighting.js:427` `!angoraAuthoredPBR` bekliyor; `build.mjs:96` bunu 37/37 materyale `true` basıyor |
| **ÖLÜ** — yaprak normalleri | `lighting.js:396` aynı guard **+** regex `foliage` arıyor, batched ad `context-plants-other-0` |
| **ÖLÜ** — `TABLE` grade yolu | `main.js:1492` `manifest.assets`+`exterior_grade` bekliyor; üretim manifesti `parts` kullanıyor, bayrak yok. 10 girdinin 10'u |
| Kısmi — `exteriorGradeRevival` | `grid!==1` 37 materyalin 23'ünü dışarıda bırakıyor; tablo 4 satır → 25 dış yüzeyin 2'si |

### 1.3 Atlas'ı yeniden boyamak çözüm DEĞİL

Çim hücresi 248 px, 310 m araziyi kaplıyor: ~1,25 m/texel. Giriş avlusu tek
texel'e çökmüş. `build.mjs`'in kaynağı (`../model-finalization/web`) bu
ortamda **yok** (H6). Ayrıca `atlasSample()` `maxLod`'u `log2(width×pad)` ile
mip 2–3'e kırpıyor. **Dünya uzayında prosedürel varyasyon, bu teslimatta
alt-metre detay katabilecek tek mekanizma.**

---

## BÖLÜM 2 — İŞLER, SIRAYLA

Her iş kendi gate'i ile kapanır. Bir iş BLOKE olursa **atla, sonrakine geç** —
sırayı bekletme. Hepsi mobilde çalışır; bu bilinçli.

### İŞ 0 — süreç onarımı (Bölüm 5) — **ÖNCE BU**

### İŞ A — GTAO'yu dış cephe görünümlerine aç

**En yüksek getiri/maliyet. Kod zaten var, yeni mekanizma yok.**

`quality-profile.js` `region` ve `neighborhood` satırları `gtao:false`
taşıyor. Villa'nın çimin üstünde yüzmesinin sebebi bu.

- Yeni flag: `exteriorGtao`, **varsayılan `false`**.
- `neighborhood` için aç. `region` (kuş bakışı, 400 m span) için **açma** —
  o mesafede kazanç yok, maliyet var.
- Masaüstünde `gtaoResolutionScale` mevcut değerinde kalsın; mobilde
  `postProcessing:false` olduğu için zaten devreye girmez — bu iş **mobili
  değiştirmez**, dürüstçe böyle raporla.
- Kabul: C02/C03/C04'te duvar-zemin, saçak-cephe ve bitki-toprak
  birleşimlerinde görünür kararma. Gökyüzü ve düz cephe ortalarında diff ≈ 0.

### İŞ B — `BATCHED_TABLE`'ın grid=1 boşlukları

Tablo satırı, yeni mekanizma yok. Bu yol üretimde çalışıyor, mip zinciri ve
anizotropi doğru (`batched-material.js:40` bu slotlarda `atlasSample`'ı
atlıyor).

| Materyal | Ne | Not |
|---|---|---|
| `metal` | renk + roughness + metalness | Hücre `range=0`. Ölü `TABLE`'daki `iron` değerlerini taşı (`#212326`, r .58, m .22). 4×4 placeholder `map`'i **null'la** (`exterior-grade.js:84`'teki koruma) |
| `neighbor_wall` | `stuccoNormal` @0.35 | Villa'dan sönük kalsın |
| `Retaining wall rough limestone.001` | `travertineNormal` @0.8 | Renk verme |
| `wood_dark.002` | roughness yükselt | Doku değil |
| `water` | **DOKUNMA** | `poolWaterV2` bunu sürüyor |

`STRUCCO` ve `ceiling.004`'e **albedo dokunma** — İŞ C onları kapsıyor,
üst üste binerse lekeli görünür.

Kabul: `reviveBatchedGrade` `applied` 4 → 8, logda ve gate çıktısında.
Yeni byte 0, yeni draw call 0.

### İŞ C — `batchId` kapılı prosedürel varyasyon ⭐ merkez iş

`batchId` her batched fragment shader'ında zaten varying
(`batched-material.js:18–19`), yani grid=1/2/4 fark etmeksizin **37
materyalin hepsine** erişir.

**Yeni flag:** `proceduralDetailV1`, varsayılan `false`.

`map_fragment`'tan sonra, `diffuseColor` çözüldükten sonra üçünü modüle et:

1. **Roughness varyasyonu — ÖNCE BU.** 164/177 materyalde varyasyon yok;
   bu listedeki birinci sebep. Aynı gürültü örneği, ayrı remap. Neredeyse
   bedava ve en çok işi bu görür.
2. **Albedo makro varyasyonu** — 2–8 m dünya uzayı gürültüsü, ±%N **value**
   kayması. Hue **kaydırma** — lekeli ve ucuz görünür.
3. **Mikro detay** — yalnız masaüstü, ikinci oktav 0,2–0,6 m.

**Dünya uzayı, UV değil** (sebep 1.3). `vWorldPosition` bu projede yok —
vertex shader'da türet, varying geçir: **+1 vec3**, fazlası yok.

**Triplanar YASAK** (3 gürültü örneği, mobil kaldırmaz). Baskın normal
eksenine göre tek düzlem:
```glsl
vec3 an = abs(worldNormal);
vec2 pp = (an.y > max(an.x, an.z)) ? wp.xz : (an.x > an.z ? wp.zy : wp.xy);
```
Eksen değişiminde dikiş olur; makro frekansta ve düşük genlikte görünmez.
**Doğrula:** C03/C07'de duvar-zemin birleşimi. Çizgi varsa genliği düşür,
triplanar'a kaçma.

**Hücre başına parametre** (`grid=4` → en çok 16 hücre):
```glsl
uniform vec4 uDetail[16];  // x albedo, y roughness, z frekans(1/m), w mikro
```
`int id = int(floor(batchId + 0.5));` ile indeksle.
**Kapalı hücre `vec4(0.0)`** → o materyal birebir aynı kalır.

JS tablosu **yeni modülde**: `viewer/src/procedural-detail.js`.
`exterior-grade.js` teslimat onarımı, bu render katmanı — karıştırma.

Açılacak hücreler (başlangıç; A/B'de ayarla):

| Materyal | albedo | rough | frekans | mikro |
|---|---|---|---|---|
| `R31 \| R39 continuous grass ground` | 0.10 | 0.08 | 1/6 m | 0.6 |
| `R31 \| R37 fine asphalt aggregate` | 0.06 | 0.12 | 1/4 m | 0.5 |
| `Entrance coursed limestone.001` | 0.07 | 0.10 | 1/2 m | 0.4 |
| `STRUCCO` | 0.05 | 0.06 | 1/3 m | 0.3 |
| `ceiling.004` | 0.06 | 0.06 | 1/3 m | 0.2 |
| `neighbor_wall` | 0.07 | 0.08 | 1/3 m | 0.2 |
| `gravel`, `gravel [imported]` | 0.12 | 0.10 | 1/1 m | 0.7 |
| `foliage`, `foliage_light` | 0.09 | 0.05 | 1/3 m | 0.3 |
| `roof.004`, `Neighbor 20 green tiles` | 0.08 | 0.08 | 1/2 m | 0.4 |
| `roof-7` | 0.06 | 0.08 | 1/1 m | 0.5 |
| `white_trim (5)` | 0.04 | 0.10 | 1/1 m | 0.3 |
| `chrome (5)`, `metal (5)`, `metal` | 0.02 | 0.14 | 1/0.5 m | 0.4 |
| `R31 \| R39 boundary limestone top` | 0.07 | 0.09 | 1/2 m | 0.4 |
| `Retaining wall rough limestone (1)` | 0.09 | 0.10 | 1/1.5 m | 0.5 |
| `pool_tile`, `STONE-TILE` | 0.04 | 0.06 | 1/1 m | 0.3 |
| `Garden \| Dark stained canopy timber` | 0.06 | 0.09 | 1/1 m | 0.4 |
| `canopy.001` | 0.06 | 0.08 | 1/1.5 m | 0.3 |

`Context glazing` ve `water`: **açma** (`vec4(0.0)`).

İç mekân (büyük yüzeyler, genlikler **yarısı**): `INTERIOR`, `WOOD-FL`,
`wood_floor.001`, `bath_tile`, `Basement | Ochre wall tile 0..4`,
`terra_floor`. Mobilyaya dokunma.
`neutralInterior` yolu (`batched-material.js:14,45–49`) IBL'i lumaya
düzleştiriyor; varyasyon onun **üstüne** binmeli — sırayı doğrula.

**Mobil bütçesi — pazarlık yok:**
- Mobilde tek oktav. İkinci oktav `#ifdef` ile GLSL'den **tamamen çıkar** —
  çarpan 0 değil, **kod yok**.
- Yeni texture fetch **0**. Gürültü hash tabanlı analitik. Gürültü dokusu
  bağlarsan işi reddet ve BLOCKED yaz.
- Yeni draw call 0, üçgen 0, byte 0. Yeni varying tam 1 (vec3).

**Flag kapalıyken sıfır iz:** `customProgramCacheKey`
(`batched-material.js:61`) flag kapalıyken **değişmemeli** — `proceduralDetailV1`
parçasını yalnız flag açıkken ekle. Aksi halde kapalı durumda bile her shader
yeniden derlenir ve `features.js:1–7`'deki sözleşme kırılır.

### İŞ D — çalışma zamanı vertex AO (temas kararması)

**Yeni flag:** `runtimeVertexAO`, varsayılan `false`.
İŞ A GTAO'yu açıyor ama sadece masaüstünde (mobilde `postProcessing:false`).
**Bu iş mobilde de çalışan tek AO.**

- Vertex başına, yükleme sonrası **bir kez, boşta**. `bakedAoRevival` ve
  `atlasArrayV2` zaten bu deseni kullanıyor (`main.js:1381`, `1394`) — aynı
  boşta kuyruğuna gir, önlerine geçme.
- **Mevcut bake'leri geçersiz kılma.** `ground-light`, `floor-light`,
  `room-probes` ve `sourceGeometryHashes` attestasyonu duruyor. Geometriye
  **dokunma**, yeni attribute ekle.
- Mesh üçgeni eşiği aşarsa (örn. >200k) **atla ve logla**.
- Mobilde yarım küre başına 8–12 ışın; masaüstünde artır.

Kabul: C03/C07/C10'da duvar-zemin, saçak-cephe, bitki-toprak birleşimlerinde
kararma. Pixel diff'te **o bölgeler** kırmızı, başka yer değil.

### İŞ E — ölü guard'ları düzelt

**E.1 `glassTiersV2`.** `angoraAuthoredPBR` batched yolda ayırt edici değil
(`build.mjs` ayrım yapmadan hepsine basıyor) — guard olarak kullanılamaz.
`material.userData.angoraBatch?.materials` içindeki kaynak adlarına bağla.
Hedef: `architecture-glass-3` (`glass`, `R31 | R35 clear door glass`) ve
`context-buildings-other-1` (`Context glazing`).

⚠️ **Tuzak:** `architecture-glass-3` grid=2 ve içinde
`Lift | Photographed rose glass 80 percent` var (hücre `range=255`, gerçek
fotoğraf dokusu). Düz uygulamada asansörün gül camı aynaya döner. `_batchid`
ile hücre bazında kapıla — İŞ C'nin `uDetail` mekanizması burada da kullanılır.
İç buzlu set (`interior-glass-9`) zaten `['architecture','garden']` filtresi
dışında; bunu bozma.

**E.2 Yaprak normalleri.** Eşleşmeyi `material.name` yerine
`angoraBatch.materials` üzerinden yap, `angoraAuthoredPBR` guard'ını kaldır.
**Önce doğrula:** bu mesh'ler `sourceGeometryHashes` attestasyonunda mı?
Normal yazımı hash'i değiştiriyorsa **yapma**, H aç — İŞ C yaprakları zaten
kapsıyor. Bake'i geçersiz kılmak bu işin kazancından pahalı.

**E.3 `TABLE` yolu.** Klasik teslimat (`viewer/public/models/`) hâlâ bir
yoldan servis ediliyor mu, **önce doğrula**. Ediliyorsa silme, dosya başına
üretimde çalışmadığını yazan yorum koy. Edilmiyorsa sil. Kararı
`PROGRESS.md`'ye yaz.

**E.4 `features.js` yorumları dürüstleşsin.** Her flag **hangi tier'da**
çalıştığını yazsın:
```js
postfxV2: true,    // T1.1b — masaüstü tier'ları SADECE; mobil matris postProcessing:false
glassTiersV2: ..., // T3.5 — E.1'e kadar ÖLÜ: angoraAuthoredPBR 37/37 true
```
**"ACTIVE" kelimesini, ölçülmüş bir kapsama sayısı olmadan bir daha yazma.**

---

## BÖLÜM 3 — BÜTÇE: ölçülebilir olan ve olmayan

Bu ortamda **FPS ölçülemez** (SwiftShader). FPS hedefi yazma, FPS kapısı
kurma. Kapı olacaklar:

| Metrik | Hedef | Nasıl |
|---|---|---|
| Draw call | **+0** | QA harness |
| Üçgen | **+0** | QA harness |
| Transfer byte | **+0** | yeni dosya yok |
| Tahmini VRAM | **+0** | yeni doku yok |
| Varying | **+1 vec3** | emitted GLSL'den say |
| Fragment ALU | mobil ≤ +14, masaüstü ≤ +38 | **emitted GLSL'den SAY** — tahmin etme |
| Flag-off GLSL diff | **boş** | aşağıda |
| Program sayısı | **+0** flag kapalı | cache key sabit |

**Flag-off kapısı:** `?features=proceduralDetailV1:0` ile emitted fragment
shader'ı dök, bugünküyle `diff` al. Çıktı **boş** olmalı. Diff'i gate
klasörüne koy.

---

## BÖLÜM 4 — MANDAL VE H1

`build/qa/ratchet.json` iPhone 13 temel çizgisi, hepsi `null`. Ölçülmemiş
alan `null` kalır — **doldurma, uydurma.**

H1 açık: `qa-mobile.html` ile gerçek cihaz ölçümü alınmadı.
İŞ C ve İŞ D mobilde **flag kapalı** ship edilecek. Masaüstünde ölçüm
yeşilse açabilirsin.

**Faz kapatma dili:** mandal null iken "FAZ TAMAMLANDI" yazma.
Yazacağın şey: **"kod tarafı bitti, mandal bekliyor"**. Bu, planın kendi
kuralı ve önceki turda ihlal edildi.

---

## BÖLÜM 5 — SÜREÇ ONARIMI — **İLK İŞ BU**

Bölüm 0'daki beş hatayı kapatır. Bunlar olmadan gate'in yeşili yine
anlamsız olur.

### 5.1 Her gate dört tier'ı da yakalayacak

`qa-capture.mjs` bugün yalnız `desktop-balanced` yakalıyor. Tier'ı
`?quality=` ile zorlayacak şekilde genişlet ve her gate şunları üretsin:

| Profil | Tier | Zorunlu |
|---|---|---|
| desktop | `desktop-balanced` | ✅ |
| desktop | `desktop-high` | ✅ |
| mobile | `mobile-high` | ✅ **pazarlık yok** |
| mobile | `mobile-low` | ✅ |

**`mobile-high` yakalanmayan bir gate geçersizdir.** Referans cihaz o.
SwiftShader'da tier'ı zorlamak FPS vermez ama **hangi kodun çalıştığını**
gösterir — asıl eksik olan buydu.

### 5.2 Kameralar DONDU — lens değişirse iki kare çek

`qa-cameras.js:3`'teki kural geçerli: numaralar donmuştur.
Bir lens/çerçeve değişikliği **kalite işi değildir** ve kalite karesiyle
karıştırılamaz. Lens değiştirmen gerekiyorsa:

- **Eski lensle** bir kare çek (kalite karşılaştırması bununla yapılır)
- **Yeni lensle** ayrı bir kare çek (kompozisyon değişikliği bununla gösterilir)
- İkisini **ayrı** kompozitlerde sun. Aynı karede karıştırma.

FAZ 0-dönemi fov-16 değerleri `496c674` commit'inde duruyor
(`pre-1.5` tag'i **yok**, kod yorumu yanlış — düzelt).

### 5.3 Gate 12 kameranın hepsini koşacak

C01–C12. Bugüne kadar 7–8 koşuldu; C11, C12 ve C04 hiç gate'lenmedi.
İç mekân şikâyeti varken C11 (ana yatak odası) ve C12 (bodrum mutfak)
gate dışı kalamaz.

Maliyet endişesi varsa: kare sayısı değil, **tier × kamera** çarpımını
düşür — ama `mobile-high` ve 12 kamera **düşürülemez**.

### 5.4 `build/qa/baseline-<commit>/` oluştur

FAZ 0 kabul md. 7 hiç yapılmadı. Şimdi yap: mevcut `main` halinden
12 kamera × 4 tier capture'ı al, `baseline-<commit>/` altına commit et.
Bundan sonraki her A/B'nin "ÖNCE"si bu olsun — `gate-visual-ref` değil.

### 5.5 Kesit karesi sayısal kuralı korunur

Kesit görünümünde kayıp yüzey oranı **>%1 ise KIRMIZI**. Gözle "iyi
görünüyor" demek yasak — Task 1.4'te tam bu yüzden eksik duvarlar kaçtı.

---

## BÖLÜM 6 — KABUL KRİTERLERİ

Bu iş emri ancak şunların **hepsi** sağlanınca kapanır:

**Süreç (Bölüm 5):**
1. Her gate 12 kamera × 4 tier üretiyor; `mobile-high` dahil.
2. `baseline-<commit>/` oluşturulmuş ve commit edilmiş.
3. Lens değişikliği varsa eski/yeni lens ayrı kompozitlerde.
4. `features.js`'te her flag'in tier kapsamı yazılı; ölçülmemiş "ACTIVE" yok.

**Kod:**
5. `exteriorGtao` açık; C02/C03/C04'te birleşim kararması görünür,
   gökyüzü/düz cephe diff ≈ 0.
6. `reviveBatchedGrade` `applied` ≥ 8, logda.
7. `uDetail` tablosunda ≥ 20 dış, ≥ 6 iç hücre sıfırdan farklı.
8. **Roughness varyasyonu ölçümü tekrarlanmış:** düz materyal sayısı
   164/177'den **≤ 60/177**'ye inmiş. Ölçümü `DENETIM.md`'dekiyle aynı
   yöntemle (hücre-içi G kanalı, eşik 6/255) yap ve sayıyı yaz.
9. `glassTiersV2` uygulanan sayı > 0; **asansör gül camı ve iç buzlu cam
   değişmemiş** — C10 pixel diff ile kanıtla.
10. Flag-off GLSL diff boş, program sayısı değişmemiş.
11. ALU sayımı Bölüm 3 tavanlarının altında, gate dosyasında **sayılmış**.
12. Draw call / üçgen / byte / VRAM deltası sıfır.
13. Kesit kareleri yeşil (kayıp yüzey ≤ %1).
14. 260/260 test yeşil, `main` el değmemiş.

**Görsel:**
15. C03, C04, C07, C10 kompozitleri — **sabit kamerayla**, öncesi–sonrası
    görünür fark. Kompoziti üretmeden iddia etme.
16. Dış cephe doygunluğu düşmemiş. Denetimde C03'te 72,4→58,8, C04'te
    60,7→52,4 düşmüştü; bu iş emri onu geri kazanmalı, daha da düşürmemeli.
    Ölç ve yaz.

---

## BÖLÜM 7 — ÇALIŞMA SÖZLEŞMESİ

- **Kapsam dışı, kullanıcı kesti:** malzeme yazarlığı (yeni PBR kütüphanesi),
  mesh temizliği/bevel, hosting değişikliği.
- **Kapalı kapılar:** atlas'ı yeniden serme, Draco yeniden kodlama,
  `build.mjs`'i kaynaksız çalıştırma (H6/H8). Kalkışma.
- **BLOCKED protokolü:** yapılamayan işi `BLOCKED.md`'ye H numarasıyla yaz,
  **neden** yapılamadığını ölç, sonrakine geç. Sessizce atlama.
- **Yapamadığın şeyi yaptım deme.** Bu iş emrinin var olma sebebi bu:
  Task 1.3 "dış cephe dirilişi" diye kapatıldı, 25 yüzeyin 2'sine dokunmuştu.
  Kapsama iddiası yazacaksan **saydır**.
- **Gözle doğrulama tek başına kanıt değil.** Sayısal kural varsa o geçerli.
- **Ara rapor yok.** Her iş bitiminde commit + push, `PROGRESS.md` güncelle.
  Kullanıcı sonda bakacak.
