# BLOCKED — insan işleri

## TEK SAYFA: dört engel, dört komut (KAPANIŞ İŞ 5)

Script'lerin hepsi bu repoda ve söz dizimi doğrulanmış durumda
(py_compile / node --check, 2026-09-23). Ayrıntılar aşağıdaki H
bölümlerinde; burada her engelin TEK komutu:

| Engel | İNSANIN YAPMASI GEREKEN TEK ŞEY | Doğrulama | Kazanç |
|---|---|---|---|
| **H2** iç lightmap (%4,1 → ≥%65) | Blender ≥3.6 makinede: `blender --background --factory-startup --python tools/blender/rebake-interior-lightmaps.py` → `build/blender/out/` klasörünü commit | script kendi doluluk sayısını basar (<%65 ise exit 1); sonra `node tools/batch-delivery/prepare-visibility.mjs && cd viewer && npm test` | İç mekân V-Ray hissinin ta kendisi: gerçek GI sıçraması |
| **H10** arazi (311 432 → 85 782 üçgen) | Aynı Blender oturumunda sırayla: `node tools/batch-delivery/simplify-terrain.mjs --apply` → `blender --background --factory-startup --python tools/batch-delivery/bake-ground-light.py` (+ `--interior`) → `node tools/batch-delivery/prepare-visibility.mjs` → `cd viewer && npm test` | "Rebake visibility when source geometry changes" testi yeşile döner | −225k üçgen (kanıt: build/qa/terrain-trial*, worst 1,9 cm / 590 tanık) |
| **H6** kaynak dizin | `model-finalization/web` klasörünü repo kökünün YANINA koymak (manifest `source_native_sha256` = `a8413904…33ce6` ile eşleşmeli) — sonra `node tools/batch-delivery/build.mjs` | `cd viewer && npm test` + tam doğrulama koşumu | Komşular 1,02 M üçgen → instancing + LOD; atlas yeniden dizilimi; kat bölmesiyle ilk-interaktif ≤5 MB |
| **H1** iPhone 13 mandalı | Telefonda `https://angora.mergvs.com/qa-mobile.html` açıp 2 dakikalık protokolü koşmak, çıkan JSON'u yapıştırmak | `build/qa/ratchet.json` doldurulur | Mobil kararlar (gölge, ileride postfx) sayıya bağlanır; "mandal null" kapanır |

Mirror tespiti (H8'in girdisi) zaten KOŞULDU: 5/8 addition aynalı
(`node tools/batch-delivery/detect-mirrored-context.mjs`).

---

## H1 — iPhone 13 / Safari baseline ölçümü
**Durum:** BLOCKED — fiziksel cihaz gerekli
**Hazırlanan:**
- `qa-mobile.html` (repo kökünde; yayında `https://angora.mergvs.com/qa-mobile.html`).
  Tek sayfa, bağımlılıksız: "Ölçümü başlat" → 15 sn villa orbiti → kat
  geçişleri (C05→C07→C08) → 30 sn salon yürüyüşü → 3 dk context-loss nöbeti →
  JSON + Kopyala düğmesi. Sayfa `?stats=1` harness'ini (viewer/src/qa-harness.js)
  iframe içinde sürer; çıktının `ratchetCandidate` alanı ratchet şemasıyla birebir.
- `build/qa/ratchet.json` iskeleti — ölçülmemiş her alan `null` (0 değil).

**İnsandan istenen:**
1. `main`'e merge + Pages yayını sonrası iPhone 13 Safari'de
   `https://angora.mergvs.com/qa-mobile.html` aç.
2. "Ölçümü başlat"a bas; ~5 dk sayfayı açık tut (kilitleme, şarj aleti takma,
   düşük güç modu kapalı).
3. Çıkan JSON'u kopyala ve ekibe/depoya ilet; `ratchetCandidate` içeriği
   `build/qa/ratchet.json → baseline`'a yapıştırılır, `device` alanı elle
   doldurulur, ürün sahibi onayıyla `acceptedByOwner: true` yapılır.

**Bloke ettiği:** FAZ 0'ın "tamamlandı" ilanı; tüm fazların mandal kapıları.
**Bloke ETMEDİĞİ:** FAZ 1'in kod görevleri (masaüstü Chromium ölçümüyle ilerliyor).

**Not (dürüstlük):** Bu ortamdaki tüm ölçümler SwiftShader yazılım
rasterizer'ında alınmıştır ve her kayıt `softwareRaster: true` taşır.
FPS/p95 alanları mandala YAZILMAZ; sadece draw call / üçgen / bayt /
doku-bellek tahminleri karşılaştırma için geçerlidir.

---

## H2 — Blender bake işleri (lightmap/AO UV repack + rebake, probe panoramaları)
**Durum:** BLOCKED — Blender yok; `build/blender/*.blend` LFS pointer'ı (134 B),
`git lfs` kurulu değil.
**Bloke ettiği:** Task 3.4a-c/e içerik tarafı; FAZ 3 kabul "lightmap UV
doluluğu ≥%65" (denetim ölçümü: iç mekân **%4,1**).
**Bloke ETMEDİĞİ:** Task 3.4d (native-current'taki hazır 4K/2K KTX2 AO'ların
yeniden teslimi — ajan işi), 3.4f (probe'a çevre kütlesi — kod işi), 3.4g.

**TESLİMAT PAKETİ (A8):** `tools/blender/rebake-interior-lightmaps.py` —
hazır bpy script'i. Girdi: teslim edilen `build/web/batched/desktop/
{interior,architecture}.glb` (Blender ≥3.6, Draco+WebP importer; .blend
gerekmez, LFS engeli aşılmış olur). Yaptığı: her interior mesh'e 'Lightmap'
UV kanalı (Smart UV Project 66° + pack_islands 0.003), doluluğu ÖLÇER ve
%65 altında kalırsa exit 1; kat başına (f0–f3) 2048×2048 Cycles bake —
`interior-ao-f*.png` + `interior-light-f*.png` (AO + direct+indirect
DIFFUSE, güneş QA saatine sabit: 21 Haziran 16:30, daylight.js'in NOAA
açıları). Çıktı: `build/blender/out/` + `occupancy-report.json`
(mesh başına doluluk + sha256'lar). Doğrulama: script'in kendi doluluk
sayısı + repoda `node tools/batch-delivery/prepare-visibility.mjs` +
`cd viewer && npm test`.

**İNSANIN YAPMASI GEREKEN TEK ŞEY:** Blender'lı bir makinede
`blender --background --factory-startup --python tools/blender/rebake-interior-lightmaps.py`
koşup `build/blender/out/` klasörünü commit'lemek.

## H3 — Malzeme yazarlığı (fotoğraf kalibreli doku kütüphanesi)
**Durum:** BLOCKED — Blender + sanatçı kararı gerekli.
**Bloke ettiği:** Task 3.1.
**Not:** Faz 1'in `exterior-grade` dirilişi (Task 1.3) bu işin *runtime*
tarafını repodaki mevcut 1,2 MB gerçek dokuyla karşılıyor; 3.1 bunun
kaynak-tarafı devamıdır.

## H4 — Bevel + weighted normals + mesh temizliği
**Durum:** BLOCKED — Blender gerekli.
**Bloke ettiği:** Task 3.2 içerik tarafı. Ajan tarafı (GLB üzerinde
coplanar/duplicate/ters-normal taraması) Faz 3'te üretilecek.
**Task 1.4 A/B bulgusu (gate-1.4, desktop C03/C10):** teslimatın büyük kısmı
tek-yüzey yazarlıklı ve `doubleSided` kapatılınca kaybolyor —
(1) context-buildings "additions" B4 objelerinin AYNALI kopyaları: aynalama
winding'i ters çeviriyor, duvarlar toptan yok oluyor; (2) interior
astar/tavan tek düzlem: salon tavanı alttan bakınca kayboldu; (3) garden
istinat duvarları/havuz çevresi parçalanıyor. Bu yüzden Task 1.4 yalnız
`architecture.glb`'yi tek-yüzlüye çevirdi (10/11 malzeme); kalan parçalar
Blender'da kaynak onarımı yapılana dek çift yüzlü kalıyor
(`build/web/batched/single-sided-report.json` gerekçeleri taşıyor).
Onarım listesi: aynalı kopyalarda winding düzeltme, astar/tavanlara
kalınlık veya tutarlı normal, istinat duvarlarını kapalı hacme çevirme.

## H5 — Hosting kararı (Cloudflare / Netlify / R2)
**Durum:** BLOCKED — hesap + DNS erişimi gerekli; ürün sahibi kararı.
**Bağlam:** GitHub Pages `Cache-Control` override'ına izin vermiyor
(sabit `max-age=600`) — Bölüm 0.5 HATA 2, Task 4.3. Üç seçenek planda
fiyatlandırıldı; öneri: Cloudflare'i önüne koy (A).
**Bloke ettiği:** Task 4.3. **Bloke ETMEDİĞİ:** diğer tüm fazlar.

## H6 — `../model-finalization/web` kaynağının sağlanması
**Durum:** BLOCKED — kaynak dizin sahibinde; repoda yok.
**Sonuç:** `tools/batch-delivery/build.mjs` çalıştırılamaz. Faz 1'de GLB'ler
yerinde yamalanıyor (`tools/batch-delivery/patch-glb.mjs` tekniği, Bölüm 0.7.2);
`build.mjs` gelecek için ayrıca düzeltiliyor ama teslim yamalı GLB'lerdir.
**Bloke ettiği:** batched paketin sıfırdan yeniden üretimi (atlas yeniden
dizilimi / Task 3.3 build tarafı, kat bölmesi + LOD streaming) ve ilk
interaktif payload'ın kalan kısmı (A7): progressiveContextV1 sonrası ilk
interaktif ≈ villa çekirdeği; `architecture.glb` TEK BAŞINA desktop 5,86 MB /
mobil 4,59 MB — 5/4 MB hedefinin altına ancak kaynaktan kat bölmesi ya da
Draco+KTX2 yeniden teslimiyle inilir. Sayılar: desktop toplam 22,44 MB'ın
ertelenen kısmı 13,64 MB (buildings 8,08 + plants 5,56), boot'ta kalan
6,49 MB GLB + bundle/probe ~2 MB.

**TESLİMAT PAKETİ (A8) — kaynağın tam manifesti:** `build.mjs` şunları okur
(`node tools/batch-delivery/build.mjs [kaynak-yolu]`, varsayılan
`../model-finalization/web`):
- `manifest.json` — `source_native_sha256` alanı **`a841390433412f55db96916ca424a59aad312b8ba1bf8fbb0f144fc649833ce6`**
  ile eşleşmeli (yayındaki paketin kaynağı buydu; farklıysa kaynak başka
  bir ihracat demektir ve fark raporlanmalı).
- Altı parçanın kaynak glTF'leri: `architecture.gltf`, `interior.gltf`,
  `garden.gltf`, `context-ground.gltf`, `context-buildings.gltf`,
  `context-plants.gltf` + her birinin yanındaki `.bin` ve `images[].uri`
  dokuları (build.mjs `imageFile()` bunları aynı dizinden çözer).
**Geldiğinde koşulacak:** `node tools/batch-delivery/build.mjs <yol>` →
`build/web/batched/{desktop,mobile}` yenilenir → `cd viewer && npm test` →
tam format doğrulama koşumu (B3 çifti).

**İNSANIN YAPMASI GEREKEN TEK ŞEY:** `model-finalization/web` klasörünü
(yukarıdaki dosyalarla) repo kökünün YANINA koymak — gerisi tek komut.

## H8 — build.mjs aynalı kopya sarım düzeltmesi + Draco yeniden kodlama (Task 1.4'ün ön koşulu)
**Durum:** BLOCKED — Task 1.4 (doubleSided kapatma) RAFA KALDIRILDI.
**Ölçülen gerçekler (gate A/B, 4 tur):**
- `architecture.glb` duvarları iki kabuk (STRUCCO dışa / INTERIOR içe);
  kat kesiti İÇ kabuğun yüzüne bakar → tek taraf yapınca kesitte duvarlar
  kayboldu (ürün sahibi C07'de gördü; kapı gözle değerlendirildiği için
  ilk turda kaçtı — artık C05–C08 karelerinde >%1 piksel değişimi otomatik
  kırmızı).
- `context-buildings` "additions" B4 objelerinin AYNALI kopyaları:
  `add-context.mjs:82` ve `context-batch.js:47` negatif determinantta üçgen
  sarımını ters çevirir, **`build.mjs` çevirmez** → yayınlanan batched
  geometri aynalı kopyalarda ters sarımlı; tek taraf yapınca o binaların
  duvarları toptan kayboluyor (uçan çatılar, ilk gate koşusunda kanıtlandı).
- Sarımı yamayla düzeltmek Draco decode → index ters çevir → re-encode
  ister; "BIN byte-byte aynı" garantisi (patch-glb.mjs sözleşmesi) kaybolur.
**Yeniden açılma koşulu:** H1 iPhone ölçümü hız yetersizliği gösterirse VE
kaynak tarafında (H6/H4) sarım düzeltmesi yapılmış yeni bir teslim gelirse.
**Kalan miras:** `plantsChunking` açık (attribute-paylaşımlı 48 m hücre
culling'i — görsel riski yok); `viewCulling` kapalı (walk'ta camdan görünen
bitkiyi gizlemek ayrı bir kalite kararı); `tools/batch-delivery/patch-*.mjs`
araçları H8 çözülünce hazır.

**TESLİMAT PAKETİ (A8):**
- **Tespit (çalıştırıldı, ölçüldü):**
  `node tools/batch-delivery/detect-mirrored-context.mjs` →
  **5/8 addition aynalı** (det=-1): osm-region-4234, -2240, -4241, -4242,
  -2235. Diğer 3'ü (2232–2234) düz. İnsanın seçeceği bir şey yok.
- **Düzeltme reçetesi (Draco'lu makinede):** her AYNALI addition'ın
  `context-buildings.glb` içindeki primitive aralığı için: Draco decode →
  her üçgende `[i1,i2] = [i2,i1]` (add-context.mjs:82'nin runtime'da
  yaptığının aynısı) → Draco re-encode (`draco_encoder -cl 7`, aynı
  quantization bitleri: POSITION 14, NORMAL 10, TEX_COORD 12) →
  `gpu_sha256` alanlarını `manifest.json`'da güncelle.
- **Doğrulama:** `cd viewer && npm test` (batched-delivery.test.mjs
  gpu_sha256 eşleşmesini zaten zorlar) + `?features=singleSided:1` ile
  C05–C08 kesit kareleri (kayıp yüzey ≤%1 kuralı) + uçan çatı kontrolü
  C02'de.

**İNSANIN YAPMASI GEREKEN TEK ŞEY:** draco_encoder bulunan bir makinede
yukarıdaki reçeteyi 5 addition'a uygulamak (ya da H6 kaynağı gelirse
`build.mjs`'e determinant<0 sarım çevirisini ekletmek — tek satır,
add-context.mjs:82 kopyası — ve paketi yeniden üretmek).

## H9 — FAZ 3 Blender kalemleri (daimi emir 2025-09-22 ile sabitlendi)
**Durum:** BLOCKED — Blender yok (H2/H3/H4 ile aynı kök neden).
**Kapsam:** 3.1 (malzeme yazarlığı), 3.2 (bevel + weighted normals),
3.4a-b-c (lightmap/AO UV repack + rebake, probe panoramaları).
**Ajan yarısı ETKİLENMEZ:** 3.4f, 3.5, 3.4d (hazır KTX2 AO teslimi),
3.3, 3.4g bu dal üzerinde yürütülüyor (PROGRESS.md sırası).
**Ayrıca:** 4.3 hosting H5'te BLOCKED olarak kalır (Pages Cache-Control).

## H10 — Task 2.4 terrain apply: görünürlük bake'i yeniden pişirilmeli
**Durum:** BLOCKED — `tools/batch-delivery/bake-ground-light.py` Blender
(bpy) ister; bu ortamda yok (H2 kök nedeni).
**Hazır olan:** `tools/batch-delivery/simplify-terrain.mjs` kot-tanıklı
sadeleştirici: desktop 311 432→85 782 üçgen, mobil 169 872→58 313,
590 örnekte worst 1,9 cm (≤5 cm sınırı, 0 ihlal), lockBorder ile dikişler
kilitli. `--apply` bir komut; scratch kanıtları build/qa/terrain-trial*.
**Neden geri alındı:** manifest'teki `ground_light.sourceGeometryHashes`
sözleşmesi bake'in kaynak GLB'ye bağlılığını korur; context-ground hash'i
değişince testler doğru olarak kırmızıya düştü. 1,9 cm sapma 0,42 m/texel
bake'in iki kademe altında — bake fiilen geçerli — ama hash'i rebake'siz
güncellemek repo sözleşmesini kanıtsız bükmek olurdu.
**TESLİMAT PAKETİ (A8) — Blender'lı ortamda sırasıyla (H2 ile aynı oturum):**
1. `node tools/batch-delivery/simplify-terrain.mjs --apply`
   (kanıtları hazır: build/qa/terrain-trial*, worst 1,9 cm / 590 tanık)
2. `blender --background --factory-startup --python tools/batch-delivery/bake-ground-light.py`
   (ve `--interior` varyantı)
3. `node tools/batch-delivery/prepare-visibility.mjs` — sourceGeometryHashes
   attestasyonu YENİ context-ground hash'iyle, bake kanıtıyla birlikte yenilenir
4. `cd viewer && npm test` (292) + tam format doğrulama koşumu (B3)
**Doğrulama:** "Rebake visibility when source geometry changes" testi yeşile
döner (bugün bilerek kırmızıya düşen sözleşme buydu); C01/C02'de üçgen
sayısı ~225k düşer (311k→85,8k terrain).

**İNSANIN YAPMASI GEREKEN TEK ŞEY:** Blender'lı makinede yukarıdaki 4 komutu
sırayla koşup değişen dosyaları commit'lemek.

## H7 — Gerçek telefonda gece modu ölçümü
**Durum:** BLOCKED — fiziksel cihaz gerekli (H1 ile aynı yol).
**Bloke ettiği:** Task 3.4g'nin kabulü. `qa-mobile.html` protokolüne gece
modu adımı Faz 3'te eklenecek (C04 kamera + gece modu).
