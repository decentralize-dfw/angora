# FAZ 7 — MASAÜSTÜ V-RAY: render motoru, ışık, malzeme

**Öncelik değişti.** Mobil artık masaüstü kararlarını kısıtlamıyor.
Hedef: web'de V-Ray kalitesi. Mobil optimizasyonu sonraya kalıyor.

**Yeni kısıt, tek cümle:** Mobil tier satırları (`mobile-low`,
`mobile-high`) **bugünkü halinde kalır** — bozulmaz, ama yeni hiçbir iş
oraya inmek zorunda değil. Bütün FAZ 7 işleri `desktop-balanced` ve
`desktop-high` satırlarına iner.

**Bütçe kuralı değişti:** masaüstünde ALU/maliyet **tavanı yok**.
Kural artık "ölç ve yaz" — maliyeti raporla, kesme. Kırmızı çizgi sadece
ikisi: konsol hatası 0, context loss 0.

**Önce FAZ 6'yı kapat.** B3 doğrulaması ve `KAPANIS.md` bitsin, sonra bu.

---

## BÖLÜM 0 — V-RAY İLE ARADAKİ GERÇEK FARK

Şu an masaüstü-high'da olan: güneş gölgesi (2048, tek harita, PCF),
GTAO (0.65 ölçek), SMAA, bloom, grade, dither, probe yansıması,
prosedürel roughness/albedo (2 oktav), vertex AO, cinemaStill.

Eksik olan, etki sırasına göre:

| # | Eksik | Neden V-Ray gibi durmuyor |
|---|---|---|
| 1 | **Sıçrama ışığı (GI)** | İç mekân lightmap doluluğu %4,1 — pratikte yok. İç mekân sadece IBL ile aydınlanıyor, düz okuyor. V-Ray'in imzası renkli sıçramadır: kırmızı zemine düşen ışık tavanı kızıllaştırır. Burada hiç yok. |
| 2 | **Yansıma** | Sadece probe. Zemin, cam, havuz, cilalı yüzeyler mat smear. "Şıkır şıkır" hissinin birinci kaynağı ekran-uzayı yansımadır. |
| 3 | **Gölge yumuşaklığı** | Tek 2048 harita, sabit PCF. V-Ray'de penumbra engelden uzaklaştıkça genişler (contact hardening). Sabit yumuşaklık "CG gölge" diye okunur. |
| 4 | **Pencere ışığı** | İç mekânda 4 spot + IBL. V-Ray iç mekânı pencereden gelen alan ışığıyla aydınlatır; yönlü, yumuşak, pencere şeklinde. |
| 5 | **Malzeme cevabı** | Prosedürel detay mobille paylaşılan kodda 2 oktav, genlikler temkinli. Masaüstü bunun çok üstünü kaldırır. Clearcoat/sheen hiç yok. |

---

## BÖLÜM 1 — İŞLER, ETKİ SIRASINA GÖRE

Her iş kendi bayrağıyla, varsayılan `false`. Kod bitince hepsi açılır,
doğrulama FAZ 6'daki gibi sonda tek oturumda.

### İŞ 1 — SSR: ekran-uzayı yansıma ⭐ en görünür

**Bayrak:** `screenSpaceReflection` · **Tier:** desktop-balanced + high

`postfx-chain.js`'e SSR geçişi ekle. Three r180'in kendi `SSRPass`'i
örneklerde var; ya onu uyarla ya kendi geçişini yaz (depth + normal
zaten GTAO için üretiliyor, yeniden kullan).

Hedef yüzeyler: travertin teras, iç mekân ahşap/taş zeminler, havuz
suyu, villa dış camı, banyo/mutfak yüzeyleri. Roughness'a göre bulanıklaş
(rough > ~0.6 ise yansıma zaten görünmez, orada erken çık).

**Dikkat:** `poolWaterV2` havuzu kendi analitik shader'ıyla sürüyor —
SSR onun üstüne binerse çift yansıma olur. Havuzu SSR'dan **çıkar** ya da
su shader'ının fresnel'iyle birleştir, ikisini birden uygulama.

**Kabul:** C03/C04'te teras ve havuz çevresi, C10'da salon zemini —
öncesi/sonrası kompozit. Zeminde villa siluetinin yansıması okunuyor.

### İŞ 2 — PCSS: temas sertleşen gölge

**Bayrak:** `softShadowsV2` · **Tier:** desktop-balanced + high

`lighting.js`'in gölge kurulumunda `shadowType`'ı PCSS'e çevir —
three'nin `shadowmap_pars_fragment` chunk'ını override ederek blocker
search + değişken yarıçaplı PCF. Penumbra engelden uzaklık ile genişlesin.

Saçak-duvar birleşiminde gölge keskin, bahçeye düşen uzun gölgede yumuşak
olmalı. Bugün ikisi de aynı.

Birlikte: `desktop-high` satırında `shadowMapSize` **2048 → 4096**.
Mobil satırlara dokunma.

**Kabul:** C03'te saçak gölgesi duvara yakın keskin, uzakta yumuşak.
Aynı karede iki farklı penumbra genişliği ölçülebilir olmalı.

### İŞ 3 — Pencere ışığı: iç mekânın asıl sorunu

**Bayrak:** `windowPortalLight` · **Tier:** desktop-balanced + high

İç mekân bugün IBL + 4 spot ile aydınlanıyor ve düz okuyor. H2 (Blender
lightmap rebake) gerçek çözüm ama Blender yok. **Çalışma zamanı ikamesi:**

Her pencere açıklığı için bir **alan ışığı yaklaşımı** — `RectAreaLight`
(three destekliyor, LTC ile) ya da pencere düzleminden yönlü + yumuşak
bir katkı. Pencere geometrisi zaten `glazing` set'inde toplanıyor
(`lighting.js:435`), konum ve normal oradan çıkarılabilir.

Gökyüzü rengini taşısın (mevcut `sky` shader'ı ve `horizon` rengi var),
güneş yönüne göre şiddetlensin. Oda başına 1–2 ışık; `room-probes.json`
oda sınırlarını veriyor.

**Kabul:** C10/C11/C12'de pencereden içeri yönlü ışık okunuyor, pencere
yakını parlak, oda derinliği karanlık. Bugün her yer eşit aydınlıkta.

### İŞ 4 — Prosedürel detayı masaüstünde aç

**Bayrak:** `proceduralDetailHigh` · **Tier:** desktop-high

`procedural-detail.js` 2 oktav ve genlikler mobil paylaşımlı kodda
temkinli seçilmişti. Masaüstü-high'da:
- **4 oktav** (mikro detaye kadar, 5–10 cm)
- Genlikler **1,5–2×** — `uDetail` tablosuna desktop-high çarpanı
- Roughness varyasyonu özellikle artsın: V-Ray farkının 1 numaralı
  malzeme bileşeni bu

`proceduralDetailV1` açıkken bu ek katman biner; kapalıysa hiç derlenmez.

**Kabul:** C03 yakın çekimde cephe sıvasında kum dokusu, C10'da ahşap
zeminde damar varyasyonu gözle okunuyor.

### İŞ 5 — GTAO'yu tam çözünürlüğe çıkar

**Bayrak:** `gtaoFullRes` · **Tier:** desktop-high

`gtaoResolutionScale` 0.65 → **1.0**, yarıçap ve kalınlık parametrelerini
iç mekân için ayrıca ayarla. GTAO şu an yarı çözünürlükte, köşe
kararmaları bulanık.

**Kabul:** C10'da tavan kovesi ve mobilya-zemin temasları keskin.

### İŞ 6 — Clearcoat ve sheen

**Bayrak:** `materialResponseV2` · **Tier:** desktop-balanced + high

`MeshPhysicalMaterial` alanları: cilalı taş/ahşap/seramikte `clearcoat`,
kumaş/halı/perdede `sheen`. `angoraBatch.materials` adlarından aile
çıkar — `batched-material.js` zaten aynı yöntemi kullanıyor.

Az sayıda materyalde, abartmadan. Amaç parlatmak değil, **yüzeylerin
birbirinden farklı cevap vermesi**.

**Kabul:** C10'da kumaş koltuk ile cilalı masa aynı ışıkta farklı
parlıyor.

### İŞ 7 — Alan derinliği (cinema still)

**Bayrak:** `cinemaDof` · **Tier:** desktop-high, yalnız cinemaStill içinde

`cinemaStill` zaten 24 Halton örneği biriktiriyor. Her örnekte kamerayı
apertür yarıçapı kadar kaydır ve odak düzlemine nişan al — **bedava
gerçek DOF**, ayrı geçiş gerekmez. Odak: tıklanan/merkezdeki yüzeyin
derinliği.

**Kabul:** C03 sinema karesinde ön plandaki bitki ve arka plandaki
komşular yumuşak, villa net.

---

## BÖLÜM 2 — KURALLAR

- **Mobil satırlara dokunma.** `mobile-low` / `mobile-high` matris
  satırları bugünkü haliyle kalır. Yeni bayraklar o tier'larda `false`
  ya da etkisiz olsun; testle kanıtla.
- **Bütçe tavanı yok, ölçüm zorunlu.** Her iş için: draw call, üçgen,
  program sayısı, tahmini VRAM, ALU — **sayıyla** gate dosyasına.
  Kesme, raporla.
- **Kırmızı çizgi ikisi:** konsol hatası 0, context loss 0. Bir iş
  bunlardan birini kırıyorsa geri al ve sebebini yaz.
- **Bayrak kapalıyken sıfır iz** — FAZ 6'daki kural aynen: emitted GLSL
  diff boş, program sayısı değişmez, cache key sabit.
- **Kesit kuralı aynen:** kayıp yüzey >%1 KIRMIZI.
- Geometri/normal yazan her iş **kendi birim testini kodla yazar**.
- `main`'e merge **izin bekler**.
- **Token disiplini aynen** (DAİMİ EMİR C0): anlatma, yap. Ön cümle yok.
  Tur sonu tek satır.

---

## BÖLÜM 3 — DOĞRULAMA

FAZ 6'daki gibi: kod bitene kadar **sıfır capture**. Hepsi bitince
bayraklar açık, tek oturumda çift koşum.

**Kare seti (FAZ 6'nın 29'u yerine masaüstü ağırlıklı):**

| Koşum | Tier | Kameralar |
|---|---|---|
| Çift (kapalı+açık) | `desktop-high` | C03, C04, C05, C06, C07, C08, C10, C11, C12 |
| Çift (kapalı+açık) | `desktop-balanced` | C03, C07, C10 |
| Tek (açık) | `mobile-high` | C03, C07, C10 — **bozulmadığının kanıtı** |
| Tek (açık) | gece, `desktop-high` | C04, C10 |

24 + 6 + 3 + 2 = **35 kare ≈ 2 saat.**

Ayrıca `desktop-high` + `cinemaStill` + `cinemaDof` ile **C03 ve C10
sinema karesi** — bunlar ürünün vitrin kareleri, kompozitte ayrı göster.

---

## BÖLÜM 4 — KAPANIŞ LİSTESİ

1. Yedi bayrak açık, her birinin tier kapsamı `features.js`'te yazılı
2. Mobil matris satırları değişmemiş — diff ile kanıt
3. `mobile-high` C03/C07/C10 kareleri FAZ 6 kapanışıyla **birebir**
   (bozulmadı)
4. Her iş için maliyet sayıları gate dosyasında (draw/üçgen/program/VRAM/ALU)
5. Konsol hatası 0, context loss 0
6. Bayrak-kapalı GLSL diff boş, program sayısı değişmemiş
7. Kesit kareleri yeşil (≤%1)
8. Testler yeşil (sayıyla)
9. SSR: teras/zemin/havuz yansıması kompozitte görünür
10. PCSS: aynı karede iki farklı penumbra genişliği
11. Pencere ışığı: iç mekânda yön ve derinlik okunuyor
12. Prosedürel detay: yakın çekimde doku okunuyor
13. Sinema kareleri (C03, C10) ayrı kompozitte
14. H2 hâlâ açık — gerçek GI için Blender gerekiyor, ikame edildi ama
    yerine geçmedi; bunu açıkça yaz

Kapanış dili: **"masaüstü kod tarafı bitti; mobil FAZ 8'e kaldı."**
