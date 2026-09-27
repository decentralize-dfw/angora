# MOBİL İŞ EMRİ — yeni modeller telefona, 256 px KTX2, açılıştaki kilit

Depo: `decentralize-dfw/angora` · dal: `main` (doğrudan push yetkin var)
Site: https://angora.mergvs.com · viewer: Three.js r180, `viewer/` altında

Üç iş var. Üçü de **ölçümle** kapanacak, iddiayla değil.

---

## ÖNCE OKU — bu oturumda öğrenilmiş, tekrar keşfetme

**1. Ölçüm aracın yalan söyleyebilir.**
- `renderer.info.render.drawCalls` bir KAREDEKİ BÜTÜN ÇİZİMLERİ toplar (ana geçiş +
  gölge haritası + GTAO + SSR + postfx). 58 mesh dört geçişte ~230 okunur. Modelin
  çizim sayısı DEĞİLDİR. Bu yüzden ürün sahibine "draw call 141→395" diye yanlış
  bilgi verildi; gerçek 30→58'di. Dosyadan ölç: `node tools/batch-delivery/inspect-model.mjs <glb>`
- `preserveDrawingBuffer` kapalı olduğu için WebGL canvas'ından `drawImage`/`toDataURL`
  HER ZAMAN siyah döner. Piksel ölçmek istiyorsan Playwright'ın `page.screenshot()`'ını
  kullan (compositor üzerinden), canvas okuma değil.
- SwiftShader yazılım rasterizer: draw call / üçgen / bayt / bellek için geçerli,
  **FPS ve kare süresi için GEÇERSİZ**. "Telefon akıcı oldu" diye rapor etme.

**2. Ürün sahibinin malzeme yazarlığına DOKUNMA.**
`build/web/26092026/` altındaki üç model (BUILDING-opt-v3, GARDEN-opt-v2,
INTERIOR-opt-v2) onun kendi yazdığı malzemeleri taşıyor. Bunlar batched DEĞİL
(`angoraBatch` verisi yok) ve boru hattı (atlas / hücre-grade / dış-cephe-grade /
`restoreBatchSurface`) batch verisi olmayan malzemeyi atlıyor — kasıtlı. Doku
küçültmek serbest, malzeme grafiğini değiştirmek yasak.

**3. Her değişiklik bayrak arkasında ve geri alınabilir olsun.**
`viewer/src/features.js`. `?features=ad:0` ile kapanabilmeli. Bu oturumda iki kez
canlı site bozuldu ve bayrak sayesinde tek komutla geri alındı.

**4. Testler:** `cd viewer && npm test` (şu an 340 yeşil). Build:
`npm run build:pages`. Sayfa üreticileri: `node tools/seo/build-seo-pages.mjs`.
Yeşil olmadan push etme.

---

## İŞ 1 — Yeni modeller telefonda da açılsın

**Şu anki durum:** `viewer/src/main.js:1637`

```js
if(FEATURES.villaModelV3 && deliveryProfile === 'desktop'){
```

Bu `desktop` şartını ben koydum, keyfi değil — ölçümle:

| | mevcut mobil teslimat | yeni üç model |
|---|---|---|
| doku VRAM | **53 MiB** | **369 MiB** |
| ana geçiş çizimi | 30 | 58 |
| villa üçgeni | 1,29 M | 1,41 M |

Telefon bu oturumda JS heap 505 → 241 MiB'a indirilerek ancak ayakta tutuldu
(`viewer/src/geometry-release.js`). Üstüne 369 MiB doku koymak ölçülmüş bir crash.

**Yapılacak:** İŞ 2'yi (256 px KTX2) bitirdikten SONRA bu şartı kaldır ve
yerine mobil için küçültülmüş doku setini bağla. Şartı İŞ 2 olmadan kaldırma.

### Dosya dosya ölçüm — disk ve BELLEK ayrı şeyler

Diskteki MB indirilen bayttır; doku-VRAM ise dokunun açıldıktan sonra
bellekte tuttuğu yerdir. 1024×1024 bir doku, dosyada 50 KB olsa bile
bellekte ~5,6 MiB tutar (4 bayt/piksel + mipmap). Karıştırma.

**A) Mobilin ŞU AN indirdiği (eski teslimat, mobil profil):**

| dosya | disk | doku-VRAM | doku | üçgen |
|---|---|---|---|---|
| architecture | 4,38 MB | 41 MiB | 31 | 841.848 |
| interior | 1,86 MB | 40 MiB | 30 | 446.285 |
| garden | 0,05 MB | 16 MiB | 12 | 4.838 |
| context-ground | 0,38 MB | 4 MiB | 3 | 169.872 |
| context-buildings | 6,85 MB | 19 MiB | 14 | 939.253 |
| context-plants | 2,03 MB | 4 MiB | 3 | 188.909 |
| **TOPLAM** | **15,55 MB** | **124 MiB** | | **2.591.005** |

**B) Kapı kalksa mobilin indireceği (yeni üç model + eski çevre):**

| dosya | disk | doku-VRAM | doku | üçgen |
|---|---|---|---|---|
| BUILDING-opt-v3 | 5,54 MB | **184 MiB** | 45 | 673.006 |
| INTERIOR-opt-v2 | 4,55 MB | 84 MiB | 21 | 384.993 |
| GARDEN-opt-v2 | 6,74 MB | **101 MiB** | 32 | 355.921 |
| context-ground | 0,38 MB | 4 MiB | 3 | 169.872 |
| context-buildings | 6,85 MB | 19 MiB | 14 | 939.253 |
| context-plants | 2,03 MB | 4 MiB | 3 | 188.909 |
| **TOPLAM** | **26,08 MB** | **396 MiB** | | **2.711.954** |

**Fark: disk +10,54 MB · doku-VRAM +272 MiB · üçgen +120.949**

Kritik gözlem: en büyük sıçrama **bahçede**. Eski mobil garden 12 adet
küçük 512'lik doku taşıyordu (16 MiB); yenisi 18 adet 1024'lük (101 MiB).
Mobil profilin zaten küçültülmüş kendi doku seti var; yeni üç model ise
tek set ve masaüstü kalitesinde. İŞ 2 tam olarak bu farkı kapatmak için.

Hedefin: B tablosundaki 396 MiB'ı, 256 px KTX2 ile **A'nın 124 MiB'ının
altına** indirmek.

Model dosyalarının dağılımı (`inspect-model.mjs` çıktısı):

```
BUILDING-opt-v3.glb   25 malzeme · 673.006 üçgen · 45 doku · 184 MiB VRAM
                      boyutlar: 1024² × 31,  512² × 14
GARDEN-opt-v2.glb     12 malzeme · 355.921 üçgen · 32 doku · 101 MiB VRAM
                      boyutlar: 1024² × 18,  4² × 10,  512² × 4
INTERIOR-opt-v2.glb   21 malzeme · 384.993 üçgen · 21 doku ·  84 MiB VRAM
                      boyutlar: 1024² × 8, 768×1024 × 8, 1024×320 × 2, ...
```

---

## İŞ 2 — Mobil için 256 px KTX2 doku seti

Ürün sahibinin isteği: **mobil sürümde dokular 256 px ve KTX2.**

> **YALNIZCA MOBİL.** Masaüstü teslimatı HİÇ değişmeyecek: orada ürün
> sahibinin 1024'lük dokuları tam kalitesiyle kalacak. Bu iş mobil profil
> için AYRI bir dosya seti üretmektir, mevcut dosyaları küçültmek değil.
> `build/web/26092026/` altındaki üç kaynak dosyaya dokunma.

**Hedef aritmetiği** (bunu tutturmaya çalış, tutmazsa ölçtüğünü yaz):
98 doku, 256×256, ETC1S ≈ 0,5 bayt/piksel, mipmap ×1,33
→ doku başına ~43 KB, toplam **~4–8 MiB VRAM** (şu an 369 MiB).

**ENGEL — önce bunu çöz:** depoda **KTX2 encoder YOK.**
- `KTX2Loader` ve transcoder kurulu (`viewer/src/texture-loader.js`, transcoder
  yolu `angora-basis/`), yani OKUMA tarafı hazır.
- ÜRETİM tarafı yok: `toktx` / `ktx` ikilisi yok, `@gltf-transform/cli` kurulu değil.
- Seçenekler: (a) `npm i -D @gltf-transform/cli` + KTX-Software, (b) `basisu`,
  (c) doğrudan `@gltf-transform/functions`'ın `textureCompress`'i ile. Hangisini
  seçtiysen `tools/` altında **idempotent bir betik** olarak bırak ve
  README satırı ekle.

**Yol:** `tools/batch-delivery/` altında `@gltf-transform/core|extensions|functions`,
`draco3dgltf`, `meshoptimizer`, `sharp` zaten kurulu. Örnek okuma/yazma kalıbı:
`tools/batch-delivery/make-blender-glb.mjs` ve `inspect-model.mjs`.

**Dikkat — uzantılar:** BUILDING/GARDEN `KHR_draco_mesh_compression` +
`EXT_texture_webp`; INTERIOR `EXT_meshopt_compression` + `KHR_mesh_quantization` +
`EXT_texture_webp`. Yükleyicide üçü de kurulu (`main.js:706-710`:
`setDRACOLoader`, `setKTX2Loader`, `setMeshoptDecoder`). KTX2'ye çevirirken
`EXT_texture_webp` yerine `KHR_texture_basisu` gelecek — `extensionsRequired`
listesini bozma.

**ESKİ KARARA ALDANMA:** `build/qa/ktx2-karar.json` "KTX2 YAPMA" diyor. O karar
ESKİ teslimatın 512² WebP'leri içindi (tel 564 KB → 1956 KB karşılığı sadece
−10 MiB VRAM). Bu iş farklı: 369 MiB'lık 1024² doku setini 256 px'e indiriyoruz.
Karar geçerli değil, yeniden ölç.

**Çıktı düzeni:** mevcut yapıyı kullan. `viewer/src/villa-model-v3.js` manifest'te
üç parçanın dosya adını değiştiriyor; mobil profil için ikinci bir eşleme ekle
(ör. `build/web/26092026/mobile/*.ktx2.glb`). Eskiler silinmeyecek.

**Kabul:**
- `?stats=1` ile mobil taklitte `memory.estimatedTextureMiB` ölçülüp yazılacak
- JS heap ölçülecek (GC zorlanmış A/B — yöntem aşağıda)
- Konsol hatası 0, doku eksik/siyah yüzey yok (ekran görüntüsüyle)
- `npm test` yeşil

---

## İŞ 3 — Açılışta arayüz kilitli (ürün sahibinin bildirdiği asıl şikâyet)

**Belirti:** "mobilde açılıyor ya, bir süre kilitli açılıyor. yani açıldıktan
sonra çıkan pop-up'ın çarpısına ya da 'Evi keşfet' tuşuna basamıyorum bir süre."

**Önemli ipucu — yanlış yere bakma:** hoşgeldin kartının kapatma düğmesi
(`#welcome-close`, `viewer/index.html`) `data-needs-model` TAŞIMIYOR, yani
`disabled` değil. Basılamıyorsa sebep `disabled` niteliği değil, **ana iş
parçacığının bloke olması** — dokunma olayı kuyrukta bekliyor.

**En güçlü şüpheliler** (hepsi açılıştan hemen sonra, boşta çalışıyor):
1. `exteriorGradeRevival` — 30 materyalde `needsUpdate=true` → **30 shader
   yeniden derlemesi**. Safari'de `KHR_parallel_shader_compile` YOK, yani
   derleme senkron ve ana iş parçacığında.
2. `atlasArrayV2` — 12 + 11 materyal daha (`main.js` konsolunda görünür)
3. `buildCellFamilies` — canvas `drawImage` + `getImageData` ile 3 doku dizisi
   kurup ~19 MB yükler (`viewer/src/cell-grade.js`)
4. `runtimeVertexAO` — bu oturumda dilimlendi ve düzeldi
   (`viewer/src/vertex-ao.js`), ama payını yine ölç
5. `selectView`'a yeni eklenen `compileAsync` (`main.js:736`) — kat ilk
   açılışında derleme yapıyor; doğru yerde mi, kontrol et

**Ölçüm tarifi (bu oturumda çalıştığı doğrulandı):**

```js
// Playwright + mobil taklit + CPU kısma
const ctx = await browser.newContext({viewport:{width:390,height:844},
  deviceScaleFactor:3, isMobile:true, hasTouch:true, userAgent:'...iPhone...'});
const client = await ctx.newCDPSession(page);
await client.send('Emulation.setCPUThrottlingRate', {rate: 6});
await page.addInitScript(() => { window.__long=[];
  new PerformanceObserver(l => {for(const e of l.getEntries())
    window.__long.push({s:Math.round(e.startTime), d:Math.round(e.duration)});})
    .observe({entryTypes:['longtask']}); });
```

Chromium: `executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'`,
`args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']`.
Sunucu: `python3 -m http.server 8099` depo kökünde.

Referans ölçüm (vertex-AO düzeltmesinden sonra, 6× kısma): 15 uzun görev,
toplam 79,7 s blok. Hedef: **açılıştan sonraki ilk 10 saniyede 200 ms üstü
blok kalmasın.**

**Çözüm yönü (öneri, ölçümle doğrula):**
- Shader derlemelerini kareye yay: hepsini aynı anda `needsUpdate` yapma,
  boşta birkaç materyal işle (vertex-ao.js'teki dilimleme kalıbının aynısı:
  `performance.now()` bütçesi + `do/while` ile ilerleme garantisi)
- `buildCellFamilies`'i dilimle ya da `createImageBitmap` ile ana iş
  parçacığından çıkar
- Gerekirse bu yükseltmeleri mobilde ilk etkileşime kadar ERTELE
- Kullanıcıya dürüst ol: iş bitene kadar kartta "hazırlanıyor" göstergesi
  daha iyi mi, yoksa iş ertelenip kart hemen mi tıklanabilir olmalı — ikincisi
  tercih edilir

**Kabul:** yukarıdaki harness'la önce/sonra uzun-görev tablosu; dokunma
testinde kart `×` ve "Evi keşfet" **ilk saniyede** tepki vermeli.

---

## RAPORLAMA

Ürün sahibi ölçüm görmek istiyor, cümle değil. Her iş için:
- önce/sonra sayı tablosu
- neyi ölçemediğini açıkça yaz (FPS SwiftShader'da ölçülemez)
- üretemediğin hatayı "düzelttim" diye yazma
- commit mesajında sayılar dursun

Türkçe konuş.
