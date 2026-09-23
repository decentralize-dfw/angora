# KAPANIŞ EMRİ — mobil + kalan bütün fazlar

Hedef: **render motoru olarak V-Ray kalitesine ulaşmak için açık kalem
bırakmamak.** Ne yapılabiliyorsa yapılacak; yapılamayan her kalem, neden
yapılamadığı ölçülmüş ve insanın tek komutla açabileceği bir teslimat
paketiyle kapanacak.

**Kural:** Test/capture koşumu YOK. `npm test` (3 sn) → build → `main`'e
push. Her iş bitiminde doğrudan pushla, sorma. Ürün sahibi tarayıcıdan
bakıyor. Tur sonu tek satır. Ön cümle yok.

---

## BÖLÜM 0 — ŞU ANKİ GERÇEK DURUM

### 0.1 FAZ 7 yazıldı ve KAPALI duruyor

Altı bayrak `false`. Kod var, çalışmıyor, kimse karar vermedi:

| Bayrak | Ne yapar | Durum |
|---|---|---|
| `screenSpaceReflection` | SSR — teras, zemin, cam yansıması | ❌ kapalı |
| `softShadowsV2` | PCSS — temas sertleşen gölge | ❌ kapalı |
| `windowPortalLight` | Pencere alan ışığı (iç mekân) | ❌ kapalı |
| `proceduralDetailHigh` | 4 oktav detay | ❌ kapalı |
| `gtaoFullRes` | Tam çözünürlük GTAO | ❌ kapalı |
| `materialResponseV2` | Clearcoat + sheen | ❌ kapalı |
| `cinemaDof` / `cinemaStill` | Sinema karesi + DOF | ❌ kapalı (bug) |

Bunlar optimizasyon turunda toptan kapatıldı. **İŞ 1 tek tek geri açacak
ve her birinin maliyetini ölçecek.** "Kasıyor" diye hepsini birden kapatmak
karar değil, kaçıştır.

### 0.2 Mobil

`mobile-low` ve `mobile-high` satırları: `postProcessing: false`,
`pixelBudget: 1.5M`, `maxPixelRatio: 2.0`.
`mobileSunShadow: false` — H1 ölçümü hiç alınmadı.

Telefonda bugün çalışan görsel iş: exterior-grade (8 materyal),
`runtimeVertexAO`, `cameraRigsV2`, `poolWaterV2`, `atlasArrayV2`,
`plantVariation`, `warmGradeV1`. Gölge yok, postfx yok, GTAO yok.

### 0.3 Dış cephe PBR geri alındı — ve NEDEN

Tam PBR seti yazıldı, sonra geri alındı. Sebep teknik ve kaydı burada:

`context-ground-other-0` dört hücre taşıyor (asfalt, giriş taşı, çim,
istinat duvarı). Her hücreye renk + normal + ORM bağlanınca, materyalin
kendi atlas dokuları + lightmap + AO + ortam haritasıyla birlikte liste
**`MAX_TEXTURE_IMAGE_UNITS(16)`**'yı aştı. Program doğrulanmadı, zemin
bozuk programla çizildi, çim hiç görünmedi.

**Ders: hücre başına üç sampler harcanamaz.** İŞ 4 bunu doğru yoldan
yapacak.

### 0.4 Engelli olanlar

| Kalem | Ölçüm | Engel |
|---|---|---|
| İç mekân lightmap | doluluk **%4,1**, hedef ≥%65 | **H2** Blender |
| Arazi | 311 432 → 85 782 üçgen, kanıtlı | **H10** Blender |
| Komşu binalar | **1,02 M üçgen**, tek parça, LOD yok | **H6** kaynak dizin |
| iPhone 13 mandalı | tüm alanlar `null` | **H1** cihaz |

---

## İŞ 1 — FAZ 7'yi ölçerek geri aç

Yedi bayrağı **tek tek** aç, her biri için ölç, `PROGRESS.md`'ye yaz:

| Ölçüm | Nasıl |
|---|---|
| Program sayısı | `renderer.info.programs.length` önce/sonra |
| Draw call, üçgen | `renderer.info.render` |
| Tahmini VRAM | mevcut hesap |
| Fragment ALU | emitted GLSL'den **say** |
| Konsol hatası / context loss | 0 olmalı, yoksa geri al |

Sıra (ucuzdan pahalıya):
1. `materialResponseV2` — malzeme alanları, geçiş yok
2. `proceduralDetailHigh` — sadece ALU
3. `windowPortalLight` — iç mekânın en büyük görsel kazancı
4. `softShadowsV2` — gölge kalitesi
5. `gtaoFullRes` — 4× GTAO pikseli; **muhtemelen değmez**, ölç ve karar ver
6. `screenSpaceReflection` — en pahalı, en görünür

**SSR için özel not:** ilk denemede ekranı siyahlattı, ama o turda
`cinemaStill` de açıktı ve asıl suçlu oydu. SSR'ı **cinemaStill kapalıyken**
yeniden ölç. Pahalıysa kesme, ucuzlat: yarı çözünürlüklü tampon, adım 28→12
+ isabette ikili arama, `MAX_DISTANCE` 32→10 m, `roughness > 0.4`'te erken
çıkış. Çarpımları 10–20 kat.

**Masaüstünde ALU tavanı yok** — ölç ve yaz, kesme. Kırmızı çizgi ikisi:
konsol hatası 0, context loss 0.

---

## İŞ 2 — MOBİL: ölçülebilir olandan başla

H1 (cihaz FPS ölçümü) alınmadı ve alınmayabilir. **FPS'siz de karar
verilebilir** — mobilin gerçek darboğazı kare süresi değil, bellek ve
geometri. Bunlar ölçülebiliyor.

### 2.1 Mobilin bugünkü yükü — ÖNCE ÖLÇ

`?quality=mobile-high` ile tek sayfa yüklemesi, konsola yaz:
- Tahmini GPU doku MiB
- Tahmini GPU geometri MiB
- Görünür üçgen (C03 benzeri dış kare)
- Draw call
- İlk interaktif byte
- Program sayısı

Bu altı sayı `PROGRESS.md`'ye yazılmadan aşağıdaki hiçbir işe başlama.

### 2.2 Doku belleği — KTX2'yi mobil için yeniden değerlendir

Task 4.1 ertelenmişti ve gerekçesi doğruydu: webp→UASTC **tel maliyeti**
ters (normal 67 KB → 264 KB). Ama o karar **indirme boyutuna** bakıyordu.
Mobilde asıl sorun **VRAM**: WebP GPU'da RGBA8 olarak açılır, KTX2/ASTC
sıkıştırılmış kalır — **4–6 kat az VRAM**.

Yap: mobil profil için **yalnız en büyük 10 dokuyu** KTX2'ye çevir.
Tel maliyetini ve VRAM kazancını ikisini birden ölç, tabloyu yaz, kararı
sayıyla ver. Tel maliyeti VRAM kazancını gölgeliyorsa yapma ve neden
yapmadığını yaz.

### 2.3 Geometri — mobilde agresif ol

Masaüstünde riskli olan şeyler mobilde bedava:
- `viewCulling` (bugün `false`): walk sırasında camdan görünen bitkiler
  gizleniyor. Mobilde **aç** — 514k üçgen, pencereden görünen birkaç ağaç
  için ödeniyor.
- `context-plants` ve `context-buildings` için mobilde daha agresif culling
  mesafesi.
- Mobil `pixelBudget` 1.5M: iPhone 13 ekranı 390×844 @3 = 3,0 M piksel,
  yani bütçe zaten yarıya kırpıyor. **Doğru.** Dokunma.

### 2.4 `mobileSunShadow` — H1 olmadan da karar verilebilir

Gölge bir depth pass demek: **ölçülebilir** (draw call + üçgen, olay
bazlı). Kare başına sabit maliyet değil — slider bırakılınca 1 kare.

Yap: mobil için `shadowMapSize: 512` (masaüstü 4096, mobil-high bugün
1024) ve `shadowCameraMode: 'villa-local'` ile aç. Depth pass'in draw/üçgen
maliyetini ölç ve yaz. Sonra **ürün sahibi kendi telefonunda bakar** —
akıcıysa kalır, değilse tek bayrakla kapanır.

Bu, mandalın boş kalmasına rağmen ilerlemenin yolu: ölçülebileni ölç,
ölçülemeyeni ürün sahibinin gözüne bırak, kararı tek bayrağa bağla.

### 2.5 Mobil postfx — AÇMA

`postProcessing: false` mobil matriste kalsın. GTAO + SMAA + bloom + grade
beş tam ekran geçiş demek; telefonun kare bütçesi bu değil. `runtimeVertexAO`
zaten mobilde temas kararması veriyor ve kare başı maliyeti sıfır.

**Bunu dürüstçe raporla:** "mobilde de iyileşti" deme, iyileşmiyor.

---

## İŞ 3 — FAZ 5: cinemaStill'i düzelt

Bug: boşta birikim **siyahtan** başlıyor ve her girdide sıfırlanıyor.
Fareyi bırakınca kare siyaha düşüyor. Ürün sahibi bunu defalarca bildirdi.

Düzeltme, ilerlemeli rafinasyonun kuralı: **çözülmüş kareden başla,
sıfırdan değil.**
- Tek örneklik normal kare zaten hazır; birikim onun üstüne biner
- Görünür tampon tamamlanana kadar asla siyaha düşmez
- Girdide sıfırlama değil **iptal** — mevcut kare kalır

Düzelince `cinemaStill` + `cinemaDof` açılır (desktop-high).

---

## İŞ 4 — DIŞ CEPHE PBR, DOĞRU YOLDAN

Geri alınan iş yeniden yapılacak — ama sampler taşması olmadan.

### 4.1 Mekanizma: tek doku dizisi

Hücre başına üç sampler yerine **bütün aileleri tek `sampler2DArray`'e**
topla, hücre numarasıyla indeksle. Bütün set **bir** birim tutar.

`atlasArrayV2` bu mekanizmayı zaten kullanıyor (`upgradeAtlasToArrays`) —
örneği kodda var, desen oradan alınır. Üç dizi yeter:
`uFamilyColor`, `uFamilyNormal`, `uFamilyOrm` — **3 birim**, 12 değil.

Katman sırası JS'te sabit bir tabloyla tanımlanır; hücre → katman eşlemesi
`uCellP`'de taşınır.

### 4.2 Dokular

`tools/textures/generate.py` geri alındı. Yeniden yaz; çalışan reçeteler
commit `47945ce` ve `53f5a6c`'de duruyor, oradan al. Öğrenilenler:

- **Eleman başına varyasyon** asıl sır: her blok/karo/levha kendi rengini
  taşımalı. Hepsi aynıysa duvar değil, ağ.
- **Düşük frekans YOK** — tekrar eden sayfada büyük şekil, zemin tekrar
  ettiğinde karo desenine dönüşür. Geniş varyasyon shader'ın dünya-uzayı
  gürültüsünden gelir, o hiç tekrar etmez.
- **Yön önemli:** travertinin yatağı yatay, ahşabın greni tahta boyunca
  düz — kıvrımı budak yapar, dalga değil.
- **WebP:** aynı 24 harita PNG 4,8 MB, WebP 0,6 MB.
- **Ölçekler metre cinsinden hesaplanacak.** Kiremit 2,4 m sayfa → 34 cm
  karo; travertine 2,0 m → 50 cm levha; limestone 2,5 m → 50 cm blok;
  çim 4,5 m → 3,5–9 cm bıçak.
- **Villa çatısının repeat'i yeniden hesaplanacak.** 1 UV birimi = 0,64 m;
  sayfa 63 karo taşıyorsa repeat `0.64/2.4`. Eski değer villada 4,7 cm
  karo çiziyordu, komşularda 34 cm — ürün sahibinin ilk şikâyeti buydu.
- **Dikey yüzeyler:** dünya projeksiyonu baskın eksene bakmalı, yoksa
  istinat duvarları şeritlenir. Yukarı-bakan kapısı YALNIZ zemin için.

### 4.3 Cephe rengine DOKUNMA

Ürün sahibi açıkça söyledi: **villa cephesinin rengi doğru.** İş
roughness'ın düzlüğünü kırmak, rengi değiştirmek değil. Renk kayarsa
telafiyi düzelt ya da o materyalde albedo bağlama.

### 4.4 Kabul

- Konsolda `Shader Error` **yok** — her materyal için doğrula
- `context-ground-other-0` sampler sayısı ≤ 16, **sayıyla yaz**
- Düz roughness sayısı: doku metriği ve runtime kapsama **ayrı ayrı** yaz
- Cephe rengi değişmemiş — önce/sonra piksel karşılaştırması

---

## İŞ 5 — ENGELLİ KALEMLER: paketleri kapat

Üçü de insanın tek komutuna indirilmiş durumda. Son hallerini doğrula ve
`BLOCKED.md`'yi tek sayfada toparla:

| Engel | İnsanın yapacağı | Kazanç |
|---|---|---|
| **H2** | Blender 3.6+ makinede `blender --background --factory-startup --python tools/blender/rebake-interior-lightmaps.py` → `build/blender/out/` commit | İç mekân lightmap %4,1 → ≥%65 |
| **H10** | Aynı oturumda 4 komut (simplify → bake → prepare-visibility → test) | −225k üçgen |
| **H6** | `model-finalization/web` klasörünü repo yanına koymak | Komşular 1,02 M üçgen → instancing + LOD |
| **H1** | iPhone 13'te `qa-mobile.html` | Mandal dolar, mobil kararları sayıya bağlanır |

Her biri için: komut satırı, beklenen çıktı, doğrulama komutu, ve
**"İNSANIN YAPMASI GEREKEN TEK ŞEY"** satırı. Script'ler çalışır durumda
mı, kontrol et.

---

## KAPANIŞ LİSTESİ

**FAZ 7**
1. Yedi bayrağın her biri için maliyet ölçülmüş, `PROGRESS.md`'de
2. Ucuz olanlar açık, pahalı olanlar ya ucuzlatılmış ya gerekçeli kapalı
3. SSR `cinemaStill` kapalıyken yeniden ölçülmüş

**Mobil**
4. 2.1'deki altı sayı yazılmış
5. KTX2 kararı sayıyla verilmiş (tel maliyeti vs VRAM)
6. `viewCulling` mobilde değerlendirilmiş
7. `mobileSunShadow` ölçülmüş, ürün sahibinin kararına hazır
8. Mobilde postfx açılmamış ve bu dürüstçe raporlanmış

**FAZ 5**
9. `cinemaStill` çözülmüş kareden başlıyor, siyah basmıyor, açık

**Dış cephe**
10. PBR seti doku dizisi üzerinden geri gelmiş, sampler ≤16
11. Cephe rengi değişmemiş
12. Konsolda shader hatası yok

**Engeller**
13. H2/H10/H6/H1 paketleri tek sayfada, komutları doğrulanmış

**Her zaman**
14. Testler yeşil (sayıyla), `main`'de, konsol hatası 0

---

## KAPANIŞ DİLİ

`ratchet.json` baseline'ı `null` olduğu sürece **"FAZ TAMAMLANDI" yazma.**
Yazacağın cümle: *"kod tarafı bitti; şunlar insanda: H1, H2, H6, H10."*

Ve son raporda şunu açıkça yaz: **runtime tarafında ne kaldı, ne kalmadı.**
Ürün sahibi V-Ray motoruna ulaşmak için elinde ne olduğunu ve neyin
dışarıdan geleceğini tek bakışta görsün.
