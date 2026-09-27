# Görüntüleme motoru: V-Ray etkisi için uygulama planı

28.09.2026 · Angora 21 web görüntüleyicisi (three.js r180, WebGL2)

Bu belge "V-Ray gibi görünsün, ama telefonda da akıcı kalsın" hedefi için
motor tarafında neyin yapılabileceğini, hangi sırayla ve hangi maliyetle
yapılacağını toplar. Her madde bir özellik bayrağının arkasında gelir,
eskisi silinmez, tek bayrakla geri alınır (mevcut `?features=` düzeni).

---

## 1. "V-Ray etkisi" neyden oluşur

Bir V-Ray karesini ekrandaki gerçek zamanlı kareden ayıran şey tek bir efekt
değil; göz şu yedi şeye aynı anda bakıyor:

| # | Bileşen | V-Ray'de | Bizde şu an |
|---|---|---|---|
| 1 | **Dolaylı ışık (GI)**: ışığın duvardan duvara sekmesi, renk taşıması | Brute force + light cache | Yeni villa modellerinde **yok**. Yalnız ortam (HDRI) ışığı ve yarım küre dolgu ışığı var |
| 2 | **Temas gölgesi / AO**: köşelerin, eşiklerin, dip noktalarının kararması | GI'nin doğal sonucu | GTAO (yarım çözünürlük, 0,28 m yarıçap). Modelin kendi AO dokuları yalnız 3 malzemede var |
| 3 | **Yumuşak güneş gölgesi**: yakında keskin, uzakta yayvan | Alan ışığı + çok örnek | PCSS (4096, villaya yakın tek harita). Mahallede kaba |
| 4 | **Doğru yansıma**: parlak zeminde, camda, havuzda çevrenin yansıması | Işın izleme | Kat başına 4 küp prob (paralaks düzeltmesiz). SSR kapalı |
| 5 | **Malzeme yanıtı**: pürüzlülük, Fresnel, mikro detay | Fiziksel BRDF | Aynı BRDF (three PBR). Malzeme ayarları kalibre değil |
| 6 | **Kamera ve renk**: pozlama, ton eğrisi, beyaz dengesi | Fiziksel kamera + VFB | ACES (0,8) + nötr grade. Otomatik pozlama yok |
| 7 | **Görüntü temizliği**: kenar yumuşatma, gürültüsüz gölge ve AO | Yüzlerce örnek/piksel | SMAA, tek örnek. Boşta birikim (`cinemaStill`) kapalı |

**En büyük tek eksik 1 numara.** Eski (batched) teslimatta Blender'da pişirilmiş
sekme ışığı vardı (`baked-lighting.js`, `electric-light.js`, `ground-light.js`),
ama bu haritalar eski modelin UV'lerine ve malzeme adlarına bağlı. Ürün sahibinin
yeni modellerine (`BUILDING-opt-v4`, `INTERIOR-opt-v2`, `GARDEN-opt-v2`) hiç
uygulanmıyor. Yeni modeller daha doğru malzemelerle geldi, ama içeride "düz,
bayat, sahte" görünmelerinin ana sebebi dolaylı ışığın kaybolması.

---

## 2. Strateji: pişir, sonra gerçek zamanlıyı cilala

Hem gerçekçi hem hafif olmanın tek yolu, pahalı ışığı **bir kez, çevrimdışı**
hesaplayıp dokuya yazmak. Gerçek zamanlı katman yalnız değişen şeyleri çizer:
güneşin yönü, kameranın yeri, gece/gündüz.

```
 Blender/Cycles (çevrimdışı)          Tarayıcı (her kare)
 ─────────────────────────           ─────────────────────────────
 dolaylı ışık haritaları  ──KTX2──►  lightMap (1 doku okuma)
 gece fikstür ışığı       ──KTX2──►  gece haritası (gece seviyesiyle karışır)
 oda yansıma probları     ──KTX2──►  kutu izdüşümlü env (paralaks doğru)
                                     + canlı güneş + PCSS gölge
                                     + GTAO (yalnız ince temas)
                                     + boşta birikim (TAA benzeri temizlik)
                                     + ton eğrisi / pozlama
```

Mobilde aynı pişmiş haritalar daha küçük çözünürlükle gider; post-processing
olmadan da iç mekân GI'li görünür. Telefonda V-Ray görünümüne giden tek gerçekçi
yol budur.

---

## 3. Fazlar

Her fazın sonunda: testler geçer, sayfa açılır, ürün sahibi ölçer ve bakar.
Performans ölçümünü ürün sahibi yapar; kabul "gözle daha iyi + akıcılık
bozulmadı".

### Faz A · Pişmiş dolaylı ışık (en büyük görsel kazanç)

**Hedef:** Yeni villa modellerine V-Ray kalitesinde sekme ışığı ve temas
kararması. İç mekân pencereden gelen ışıkla aydınlanıyor gibi okunmalı.

1. **UV2 (lightmap UV) üretimi** · `tools/bake/uv2.py` (Blender 3.6, başsız)
   - Üç modelin her mesh'ine çakışmasız ikinci UV: Smart UV Project +
     "Lightmap Pack", ya da xatlas. Doluluk hedefi %65 ve üstü.
   - GLB'ye `TEXCOORD_1` olarak yazılır. Geometri ve malzeme değişmez.
2. **Bake** · `tools/bake/bake-indirect.py`
   - Cycles, "Diffuse → Indirect" (+ Color kapalı), 512–1024 örnek, OIDN gürültü
     giderme.
   - Aynı sahne, **üç güneş saati** için ayrı ayrı pişirilir: 09:00, 13:00, 17:00.
   - Doğrudan güneş haritaya **yazılmaz**. Onu canlı güneş ve PCSS çizer, saat
     kaydırıcısı çalışmaya devam eder.
   - **Gece haritası** ayrıca pişirilir: yalnız iç fikstürler (avize, spot)
     yanık. Akşam modundaki "ışık havuzu" V-Ray gece renderı gibi görünür.
3. **Paketleme** · `tools/bake/pack-lightmaps.mjs`
   - EXR → RGBM 8-bit → KTX2 (UASTC masaüstü, ETC1S mobil).
   - Masaüstü: kat başına 2048², mobil: 1024².
   - Tahmini boyut: masaüstü toplam 8–14 MB (4 harita seti), mobil 2–4 MB
     (yalnız 13:00 ve gece).
4. **Çalışma zamanı** · yeni `viewer/src/owner-lightmaps.js`
   - `material.lightMap` + `lightMap.channel = 1`.
   - Saat kaydırıcısı iki komşu haritayı karıştırır (09→13→17). Tek bir
     `onBeforeCompile` enjeksiyonu: iki doku okuma + mix.
   - Gece haritası `nightLevel()` ile karışır (mevcut `applyNightHouse` akışı).
   - Pişmiş harita gelince ortam dolgusu (`hemisphere`) ve `interior-lighting`
     spotları kısılır; ışık iki kez sayılmaz.
   - Bayrak: `ownerLightmapsV1`. Kapalıyken bugünkü görünüm bire bir.
5. **Kabul ölçütü:** Galerideki 55 gerçek fotoğraf, çekildikleri kamera
   noktalarından (`photo-points.js` zaten var) render ile yan yana konur. Duvar
   ve tavan parlaklığı, köşe kararmaları, pencere önü ışık düşüşü fotoğrafa
   yaklaşmalı. Bu, "gerçekçi mi?" sorusunu göze değil ölçüme bağlar.

**Riskler**
- UV2 üretimi ince detaylı mobilyada (INTERIOR 385 bin üçgen) harita israf
  eder. Çözüm: mobilya pişmez, AO dokusu + GTAO ile kalır. Yalnız mimari ve
  sabit yüzeyler pişer.
- Blender ve pişirme işlem gücü bu ortamda yok. Betikler repoda hazırlanır,
  pişirmeyi ürün sahibi kendi makinesinde tek komutla çalıştırır. Bir kat
  için yaklaşık 20–40 dk (GPU).

### Faz B · Yansımalar

1. **Kutu izdüşümlü oda probları** (`room-reflections.js` genişletmesi)
   - Bugünkü 4 küp prob sonsuz uzaktaymış gibi örneklenir; parlak zeminde
     yansıma "kayar". Oda kutusuna göre paralaks düzeltmesi (box projection)
     eklenir: tek `onBeforeCompile`, döngü yok.
   - Problar Blender'da pişirilir (Faz A betiği, 256² HDR küp, oda başına).
2. **Maskeli SSR** (`ssr-pass.js` yeniden açılır)
   - Önceki kapatma sebebi: mat sıvaya da koyu yansıma basıyordu. Yeni kural:
     yalnız pürüzlülüğü 0,25'in altında ve bayrağı olan malzemeler (parke,
     seramik, havuz, cam). Pürüzlülükle yayılan örnekleme ve kenarda probe'a
     yumuşak geçiş.
   - Yalnız masaüstü ve villa görünümü.
3. **Cam**: ince cam (alfa) korunur. Fresnel'e bağlı yansıma oranı ve hafif
   yeşil kenar tonu eklenir. Kalınlık ve kırılma hesaplanmaz; transmission
   geçişi geri gelmez.

### Faz C · Görüntü temizliği ve kamera

1. **Boşta birikim (`cinemaStill`) yeniden**
   - Kamera durunca 16–24 kare alt-piksel titreşimle birikir: kenarlar
     V-Ray kadar temiz, PCSS ve GTAO gürültüsüz olur.
   - Önceki siyah ekran hatası gerçek GPU'da çıktı, yazılım rasterizerde
     üretilemedi. Kök neden adayları: birikim hedefinin ilk karede temizlenmemesi
     ve half-float `NaN` yayılması.
   - Plan: `NaN` bekçisi, ilk örneğin kopya ile yazılması ve hata sayacı. Açık
     kalırsa 3 siyah karede kendini kapatır.
   - Ürün sahibinin ekran kartı ve tarayıcı bilgisiyle doğrulanır.
2. **Ton eğrisi seçeneği:** ACES (şimdiki) ile Khronos PBR Neutral
   (`THREE.NeutralToneMapping`) A/B'si. Neutral, malzeme renklerini
   katalogdaki gibi tutar; mimari görselleştirmede doygunluk ve kontrast
   şikâyetine iyi gelir. Karar ürün sahibinde.
3. **Otomatik pozlama (göz uyumu):** iç mekâna girince kare kararıyor, dışarı
   bakınca patlıyor. Ortalama parlaklık küçük bir mip'ten okunur ve pozlama
   0,6 sn'de yavaşça uyarlanır. Dar sınırlar içinde (±1 EV) kalır, "oyun
   efekti" gibi pompalamaz.
4. **Hafif lens karakteri:** vinyet (var, 0,08), çok hafif bloom (var). Kromatik
   sapma ve film greni yok; emlak görseli temiz kalmalı.

### Faz D · Mahalle ölçeği

1. **Kademeli gölge (CSM):** villa yakınında 4096 PCSS, mahallede ikinci bir
   kademe. Komşu evlerin gölgesi mahalle görünümünde düzgün ve keskin olur.
2. **Komşu evlere pişmiş AO:** KOMSULAR-opt-v2 için tepe noktası AO'su bir kez
   Blender'da pişirilir. Saçak altları ve pencere girintileri derinleşir,
   dokusuz beyaz cephe "maket" gibi değil "gerçek bina" gibi okunur. Maliyet
   0 doku, 0 draw call.
3. **Arazi:** yumuşatılmış normal (yapıldı) ve arazinin gölge atmaması
   (bu turda yapıldı). Sonraki adım: CEVRE-YOL'da araziye Blender'da 1 seviye
   Subdivision + yol kenarlarında kırılma koruması. Çimde yakın plan için
   dünya-uzayı detay dokusu (asfaltta zaten var).
4. **Gökyüzü:** tek puresky HDRI yerine üç saatlik HDRI seti (sabah, öğle,
   akşamüstü) ve saat kaydırıcısıyla karışım. Ortam ışığının rengi güneşle
   birlikte döner.

### Faz E · WebGPU denemesi (uzun vade, bayrakla)

three r180'de `WebGPURenderer` ve TSL düğüm tabanlı post-processing var:
SSGI, TRAA, SSR, GTAO. Chrome ve Safari 26 WebGPU destekliyor.

- Masaüstünde ayrı bir giriş (`?renderer=webgpu`) ile ekran-uzayı GI (SSGI) ve
  zamansal kenar yumuşatma (TRAA) denenir.
- WebGL2 yolu varsayılan kalır. WebGPU yalnız ölçülüp beğenilirse varsayılan
  olur.
- Uyarı: mevcut `onBeforeCompile` enjeksiyonlarının hepsi (≈20 modül) TSL'e
  taşınmadan WebGPU'da çalışmaz. Bu büyük bir port. Önce yalnız villa dış
  görünümü için prototip yapılır.

---

## 4. Takılmayı geri getirmemek için kurallar

Önceki turlarda takılmanın ana kaynakları shader derleme fırtınaları ve kare
başı döngülerdi. Plan boyunca şu kurallar geçerli:

1. **Yeni ışık döngüsü yok.** Pişmiş harita tek doku okumadır. Alan ışığı ve
   spot sayısı artmaz (`windowPortalLight` kapalı kalır).
2. **Derleme yükleme ekranının arkasında.** Her yeni malzeme varyantı
   `compileAsync` ile yükleme sırasında ısıtılır, kata girişte yeni program
   derlenmez.
3. **Doku bütçesi:** masaüstü GPU dokusu ≤ 600 MB, mobil ≤ 120 MB. KTX2
   zorunlu.
4. **Her özellik kendi bayrağıyla:** kapatınca bire bir eski kare.
5. **Mobilde post-processing yok;** kalite pişmiş haritadan gelir.

---

## 5. Sıra, süre, kazanç

| Faz | İş | Süre (yaklaşık) | Görsel kazanç | Kare maliyeti |
|---|---|---|---|---|
| **A** | Pişmiş dolaylı ışık + gece haritası | 1,5–2 hafta (+ ürün sahibinin bake süresi) | **Çok büyük** | ~0 (1–2 doku okuma) |
| **C1** | Boşta birikim (temiz kenar/gölge) | 3–4 gün | Büyük (durağan kare) | Yalnız boştayken |
| **B** | Kutu izdüşümlü prob + maskeli SSR | 1 hafta | Orta-büyük (zeminler, havuz) | SSR: masaüstü ~1–2 ms |
| **C2-3** | Neutral ton eğrisi + otomatik pozlama | 2 gün | Orta | ~0 |
| **D** | CSM, komşu AO, arazi, HDRI seti | 1 hafta | Orta (mahalle) | CSM: +1 gölge geçişi |
| **E** | WebGPU prototipi | 2–3 hafta | Belirsiz, denenecek | Ölçülecek |

**Önerilen sıra:** A → C1 → B → C2-3 → D → E.

A olmadan diğerleri cila olarak kalır; A'dan sonra her adım gözle görülür fark
yapar.

---

## 6. Ürün sahibinden gerekenler

1. **V-Ray referans kareleri:** mimardan kalan V-Ray renderları varsa (dış
   cephe, salon, yatak odası). Renk ve parlaklık kalibrasyonu onlara göre
   yapılır.
2. **Blender sahnesi:** modellerin ışıklı son hâli (.blend), özellikle
   fikstürlerin yerleri ve güçleri. Gece haritası buradan pişer.
3. **Bake makinesi:** Faz A'nın pişirme adımı GPU'lu bir bilgisayarda tek komut.
   Betik ve talimat repoda hazırlanacak.
4. **Siyah ekran bilgisi (Faz C1 için):** tarayıcı ve ekran kartı adı
   (`chrome://gpu` ilk satırları).
