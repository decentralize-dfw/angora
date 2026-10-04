# web-gpt.html — referans kıyası ve uygulanabilir iyileştirme listesi

Tarih: 4 Ekim 2026 · Sayfa: `web-gpt.html` · Referanslar: era-residence.com, likova.space · Ekran görüntüleri: `docs/web-gpt-audit-2026-10-04/`

## 1. Özet

Sayfanın malzemesi (gerçek drone fotoğrafları, kat kesit filmleri, kayıtlı kamera noktaları, plan atlası, tel kafes model) referanslardan daha zengin. "Dandik" hissinin kaynağı malzeme değil, üç yapısal karar:

1. **Kaydırma modeli.** Sayfa "bir hareket = bir film" mantığıyla kaydırmayı ele geçiriyor (wheel/touch `preventDefault`, Lenis `stop`). Her film 5 saniyelik klibi 0,55 saniyede, 9,2× hızda oynatıyor; kullanıcı o sırada kilitli. ERA ve Likova'da hareket her zaman kaydırma ilerlemesine bağlı (scrub), kilit yok, okuma durakları snap ile çözülüyor.
2. **Bölüm geçişleri.** 16 bölüm, 9 sabitlenmiş (sticky/pinned) sahne ve beş farklı zemin rengi; en az altı sınır sert renk kesimi. Referanslarda her sınırda ya bir maske açılıyor, ya yeni bölüm öncekinin altından çıkıyor, ya da tek bir ilerleme iki katmanı birlikte sürüyor.
3. **Medya ağırlığı ve kırılganlık.** Açılış filmleri 1280×720 için 18 Mbps H.264 (klip başına 10–12 MB, altı klip 68 MB), kat filmleri 40 Mbps (altı klip 40 MB), fotoğraflar 1920×1080 JPEG tek boy (0,6–1,9 MB), harita SVG 1,8 MB, fontlar TTF 1,16 MB. Yavaş ağda film 5 saniyede hazır olmazsa hareket hata veriyor ve sayfa açılış sahnesinden çıkamıyor.

Mobilde bunların üstüne bir dördüncüsü var: mobil, küçültülmüş masaüstü. Yatay fotoğraflar dikey kutulara kırpılıyor, dokunma hedefleri 31–40 px, etiketler 7–9 px, üst menü dinlenme hâlinde hiç yok.

Öncelik sırası: önce kaydırma modeli ve medya (P0), sonra geçişler (P1), sonra mobil yerleşim (P2). Bunlar yapılmadan tipografi ve renk cilası fark yaratmaz.

## 2. Nasıl ölçüldü

- Yerel sunucu + Playwright/Chromium 1440×900 ve iPhone 13 (390×664, DPR 3, gerçek dokunma olayları CDP ile).
- Playwright'ın Chromium'u H.264 çözemediği için 13 MP4 film VP8 WebM'e çevrilip aynı URL'lerden sunuldu. Dosya boyutları gerçek MP4'lerden alındı; süre ölçümleri bu ikame ile yapıldı.
- Ağ kısıtlama testi CDP ile (10 / 4 / 1,6 Mbps). İkame filmler gerçek dosyaların yedide biri olduğu için bu profiller gerçek dünyada kabaca 70 / 28 / 11 Mbps'ye karşılık gelir.
- FPS ölçülmedi (SwiftShader yazılım rasterizer). Gerçek iOS Safari ve Android Chrome testi yapılmadı.
- era-residence.com bu ortamın ağ politikasında engelli; ERA bilgisi `motion-catalog.js` (62 kayıt), Awwwards / Communication Arts / agency kaynakları ve `casestudy.html` üzerinden alındı. likova.space canlı incelendi.

## 3. Referanslar ne yapıyor

### ERA Residence (The First The Last, Webflow + GSAP, Awwwards SOTD Ağu 2026)

- **Açılış kimlikle:** kemer maskesi 24vw → 36vw → 125 büyür ve arka görüntünün içine dalar; tekrar ziyarette kısa sürüm.
- **Hero scrub:** başlık ve zemin farklı mesafe ilerler, görüntü 1 → 2 ölçekte havuza dalar (`scrub:true`). Gündüz/gece 0,8 s crossfade.
- **Bölüm sınırı = mimari örtüşme:** kavisli bölüm tepesi negatif marjinle önceki görüntünün üstüne biner; JS ile küçülen kutu yok.
- **Yatay konum rayı:** düşey kaydırma sabit ekranda yatay seyahate dönüşür; yükseklik rayın gerçek genişliğinden hesaplanır (`scrub .25`). Mobilde düşey sıraya döner.
- **Hizalan → birleş → dal:** iki clip-path penceresi önce ortak banda gelir (0,5), sonra orta sınır açılır (0,1), sonra maske 1,84× büyürken arkadaki sahne .75 → 1 gelir.
- **Footer tek ilerleme:** önceki görüntü `inset 0 → 8% 22%` daralırken footer `.75 → 1` büyür; ikisi aynı scrub'a bağlı.
- **Ortak dil:** başlıklar karakter bazlı rotateY 1,2 s stagger .05; paragraflar satır maskesi `yPercent 110 → 0`; sabit süre ailesi 0,8 / 1,2 s; bölgeye göre tema değiştiren, hiç kaybolmayan header; kenarda yüzde çubuğu.
- **Mobil:** tek kırılım 992 px; tooltip → alt sheet; clip maskeleri, mıknatıs buton ve snap sadece masaüstü.

### Likova (VIDE INFRA, özel motor + three.js)

- **Beş durumlu yükleyici** bina kütlesinden; yükleyici bloğu hero'ya şekil aktarır.
- **Katmanlı cephe:** gökyüzü, bina ve ışık katmanları ayrı hızda; metin binadan önce çekilir.
- **Satır maskesi:** `word-wrap` Y 110%, 1,2 s, `cubic-bezier(.7,0,.3,1)`; bütün sitede tek reveal.
- **Önceki sahnenin altında bekleme:** `sticky--under-next`; yeni bölüm yukarı taşınmaz, maske açıldıkça arkadan görünür.
- **Gerçek kamera yolu:** GLB içindeki CatmullRom eğrisi scroll ilerlemesine bağlı, FOV 20; ışık ve üç bilgi kartı aynı ilerlemeyle değişir.
- **Okuma durakları:** `data-scroll-snap-point` ile 100/200/350/450/550/650 viewport birimine snap. Kilit yok, snap var.
- **Fotoğraf devri:** crossfade yerine yeni kare alttan açılır (`clip top 100% → 0%`); ön fotoğraf çıkarken arkadaki açılır.
- **Panel dönüşümü:** geniş yazı alanı daralarak sağ/sol karta döner, açılan alanı fotoğraf doldurur.
- **Mobil ayrı:** `@md` görsel varyantları, paralaks ±5 svh'ye iner, scroll sahneleri `mobile-carousel`'a dönüşür, kat planı tam ekran mobil panel.

### Ortak ilkeler

| İlke | ERA | Likova | web-gpt bugün |
|---|---|---|---|
| Hareket kaydırmaya bağlı (scrub) | evet | evet | hayır, hareket başına film, kilitli |
| Okuma durağı | snap (masaüstü) | snap noktaları | kilit + 220 ms "gate" |
| Bölüm sınırı | kavis örtüşme, maske | altta bekleme, clip | sert kesim, zemin rengi değişimi |
| Tek ilerleme → çok katman | footer, dalış | kamera + ışık + bilgi | her bölüm ayrı tetikleyici |
| Header | kalıcı, tema değiştirir | kalıcı | gizli, hızlı kaydırmada 1,1 s görünür |
| Reveal dili | 2 aile, sabit süreler | 1 aile | 4–5 farklı (y-fade, clip, word-window, opacity, slide) |
| Mobil | ayrı davranış | ayrı görsel ve carousel | aynı DOM, küçültülmüş |
| Medya | gerçek fotoğraf, el çekimi alpha video, Webflow CDN varyantları | gerçek GLB, `@md` görseller | AI üretimi filmler, tek boy JPEG |

## 4. Teşhis: ölçülen sorunlar

### 4.1 Kaydırma modeli (masaüstü + mobil)

- `residence-steps.js` wheel/keydown/touchmove olaylarını `capture:true` ile yakalıyor; sahne aktifken her hareket `preventDefault`. Film oynarken `AngoraScroll.hold` Lenis'i durduruyor.
- Film hızı: `play(film, …, .55)` → `playbackRate = 5.04 / 0.55 = 9.2`. 121 karelik klip 0,55 saniyede, yani 60 fps'de ~33 kare gösterilerek geçiyor. Göz bunu kamera hareketi değil, bulanık bir atlama olarak okuyor. Kat filmleri 1,43 s klibi 0,47 s'de (3×) oynatıyor.
- Ölçülen hareket süreleri (kilitli süre): masaüstü 0,68–0,80 s / hareket, mobil 1,25–1,41 s / kaydırma. Zorunlu hareket sayısı: açılış 3 + katlar 3 + planlar 3 = serbest kaydırmaya geçmeden önce 9 kilitli hareket.
- "Wheel momentum" yeni film başlatmasın diye 220 ms sessizlik şartı var (`GestureGate.accept`); meşgulken gelen her olay sayacı sıfırlıyor. Trackpad'de film bittikten sonra parmak durmadan yeni hareket kabul edilmiyor.
- Planlar, izometrik çatıda bittikten sonra Attic → First → Entrance → Garden sırasıyla **aşağı** iniyor; sekmelerde son durum "1 Garden". Kullanıcı aşağı kaydırırken ev yukarı, sonra aşağı gidiyor.

### 4.2 Medya ağırlığı ve ağ kırılganlığı

| Varlık | Adet × boyut | Toplam | Not |
|---|---|---|---|
| Açılış filmleri `films/*/transition.mp4`, `reverse.mp4` | 6 × 9,8–12,1 MB | 68 MB | 1280×720, H.264 High, 17,8–18,3 Mbps, 24 fps, 5,04 s |
| Açılış `opening/source.mp4` | 4,0 MB | 4 MB | 6,1 Mbps + kullanılmayan AAC ses izi |
| Kat filmleri `chapters/finished/level-*.mp4` | 6 × 5,7–7,1 MB | 40 MB | 2560×1440, 39,8 Mbps, 1,43 s |
| Sayfadaki fotoğraflar `photogallery-v2/*.jpg` | 18 × 0,6–1,9 MB | ≈ 20 MB | 1920×1080, `srcset` yok, mobilde aynı dosya (DPR 3'te 390 px'e 1920 px) |
| `angora_32.png` (galeri) | 2,45 MB | | PNG fotoğraf |
| Harita `life/angora-map.svg` ve `-mobile.svg` | 2 × 1,8 MB | | mobil varyant aynı boyut |
| Fontlar | 6 TTF | 1,16 MB | WOFF2 alt küme ~0,15 MB olurdu |
| Tel kafes model | 3,0 MB gz + 0,5 MB three.js | | tembel, iyi |
| JS | 13 dosya | 0,74 MB | |
| CSS | 8 dosya | 0,12 MB | |

Tam masaüstü gezintisinde ölçülen aktarım (filmler WebM ikame, önbellek kapalı): 147 MB. Gerçek MP4'lerle ≈ 235 MB.

Ağ kısıtlama (WebM ikame; gerçek dosyalarla 7× daha kötü):

| Profil | Sonuç |
|---|---|
| 10 Mbps (≈ 70 Mbps gerçek) | İlk hareket 1,05 s'de tamamlandı |
| 4 Mbps (≈ 28 Mbps gerçek) | 9. saniyede manifest yüklenmemiş, durum metni boş; ilk wheel sahneyi atlayıp sayfayı kaydırdı (y=700). Filmler sonradan devreye giriyor: davranış ağ hızına göre değişiyor |
| 1,6 Mbps (≈ 11 Mbps gerçek) | DOMContentLoaded 15,8 s; 9. saniyede siyah örtü (`.cinema-veil`) hâlâ ekranda |

Video çözülemediğinde (ilk Chromium turu, H.264 yok): her wheel 5 s zaman aşımı bekleyip "Video could not prepare its next frame" hatası veriyor; kullanıcı kaydırarak açılıştan çıkamıyor. Aynı yol yavaş ağda, iOS düşük güç modunda veya codec sorununda açılıyor.

### 4.3 Gezinme

- Header dinlenme hâlinde `opacity:0; transform:translateY(-110%)`. Yalnız hız > 1,15 px/ms kaydırmada veya ≥ 70 px wheel'de görünüyor, 1,1 s sonra gizleniyor. Sayfa açıldığında marka, menü ve "Arrange a viewing" yok. Playwright bile menüyü tıklayamadı.
- Göründüğünde opak zeminli (76/66 px) ve içerik başlıklarının üstüne biniyor (mobil `m09`).
- Masaüstü nav bağlantıları 85×16 px tıklama alanı.

### 4.4 Mobil yerleşim (iPhone 13)

- Açılış: başlık üstte, 16:9 film 42 svh'lik bantta, slogan altta. Sinematik değil, uygulama ekranı gibi; film 1280×720'den 390 px'e, `object-fit: cover`.
- Yatay fotoğraf şeritleri (yatak odaları, mutfaklar): 16:9 iç mekân fotoğrafları 82 vw genişlik × tam yükseklik kutulara `cover` ile kırpılıyor, aynı anda iki yarım fotoğraf görünüyor, alt yazılar kesik ("…ıtside", "02 / Garden-level in").
- Plan atlası: sekme satırı "FIRST FLOOR" iki, "SHOW DIMENSIONS +" üç satıra kırılıyor; 40 px pinler oda adlarının üstüne biniyor ("Lounge" ok ve koniyle kesiliyor); fotoğraf önizleme 150×84 px; sahnenin üstünde ~100 px boş bant.
- Dokunma hedefleri: galeri filtreleri 31 px, kat sekmeleri 34 px, bahçe sekmeleri 40 px (hedef ≥ 44 px).
- Yazı: eyebrow 7 px, text-link 8 px, `cinema-status` 8 px, harita lejandı 8 px, menü numaraları 9 px, `hero-sides` 7 px.
- `body.scrollWidth` 417 > 390 (html `overflow-x: clip` ile gizleniyor; kaynak: bahçe görsellerinin 1,03 ölçeği ve 394 px poster).
- Life in Angora, konum, konfor bölümleri düz dikey akış; ağırlık problemi yok ama ritim yok.

### 4.5 Masaüstü yerleşim

- Açılış filmi 1280×720, 1440×900'de `contain` → üst/alt bant; 4K ekranda bulanık.
- Arrival: tam ekran fotoğraf sol çerçeveye küçülürken sağ yarı boş kalıyor; açıklama sonradan geliyor.
- Life in Angora harita sahnesi 125 svh sabitlenmiş; harita üst yarıda, alt %40 boş yeşil.
- Yatay şeritlerde başlığın sağı boş; şerit başlığı ile fotoğraflar arasında ilişki yok.
- Contact: küçük fotoğraf + büyük kahverengi alan; CTA'lar `tel:` bağlantısı (masaüstünde işe yaramaz).

### 4.6 Tipografi ve hareket dili

- Cormorant Garamond 500 + Manrope doğru seçim; ama 8–11 px arası 20'den fazla etiket var (masaüstünde 8 px `text-link`'ler Life bölümünde, 9 px `garden-foot`, 10 px nav).
- Reveal aileleri: `.reveal` y+opacity, `.word-window` yPercent 105, `.editorial-image` clip-path inset, Life fotoğrafları x+scale, kat metni opacity+y, galeri opacity. Süreler .12 / .16 / .2 / .22 / .26 / .28 / .35 / .5 / .65 / .7 / .75 / .95 s. Tek dil yok.
- Başlık `word-window` animasyonu bittiğinde kırpma yok (kontrol edildi); animasyon sırasında inen harfler kesiliyor (`line-height 1.13` + `overflow:hidden`).

### 4.7 Kod yapısı

- 6 stil dosyası üst üste (`residence.css` → `autumn` → `palette` → `cinema` → `direction` → `fit`), 119 `!important` (76'sı `residence-fit.css`). `.hero-title` 5 dosyada, `.header` 4, `.chapter-layout` 4, `.gallery-item` 4 kez tanımlı. Mobil ölçüler bu yüzden tutarsız: aynı eleman için 3 farklı kırılım tanımı.
- `residence-cinema.js` + `residence-film-runtime.js` içinde scroll-scrub'lı `FramePlayer` (webp kare dizisi, `stagedPosition` ile duraklar) hazır ama sayfaya bağlı değil; `films/*/frame-0000…0120.webp` (121 kare, ~155 KB/kare) ve `chapters/floors-frames` (221 kare, 27 MB) diskte duruyor.
- Testler: `node --test tests/residence-*.test.mjs` 18/18 geçiyor; davranış testleri kilit süresi, istek boyutu gibi kullanıcı metriklerini ölçmüyor.

### 4.8 İçerik ve güven

- Açılış filmleri `manifest.json`'a göre ElevenLabs Seedance üretimi. 03 / Garden karesindeki ev gerçek villadan farklı (pencere düzeni, cephe). 99 M ₺ ilanda ilk 10 saniyede sentetik bir ev göstermek güven maliyeti.
- `photogallery-v2` "AI restore" edilmiş sürümler; sokak cephesi (`angora_28.jpeg`) yapay görünüyor.
- Sayfa yalnız İngilizce; hedef kitle Ankara. Viewer'da TR/EN altyapısı var.

## 5. Uygulanabilir liste

Her madde: ne / neden / nasıl / efor (S ≤ 1 gün, M 2–4 gün, L ≥ 1 hafta) / kabul ölçütü.

### P0 — Temel (bunlar olmadan cila boşa gider)

1. **Kaydırma modelini "hareket başına film"den "scrub + snap"e çevir.**
   Neden: kilit, 9× hız ve 220 ms gate "dandik" hissinin ana kaynağı; referansların ikisi de scrub.
   Nasıl: `residence-steps.js` GestureGate'i kaldır; açılışı 300–400 svh sabitlenmiş sahne yap, `ScrollTrigger scrub: .3` ile mevcut `AngoraFilmRuntime.FramePlayer`'ı sür (`stagedPosition` zaten 0,32 / 0,48 / 0,80 duraklarını veriyor). Okuma durakları için `snap: {snapTo: [0, .33, .66, 1], duration: .6, ease: 'power2.inOut'}`. `AngoraScroll.hold/stop` çağrılarını sil; `touchmove preventDefault` tamamen kalksın. Efor L.
   Kabul: hiçbir anda `scrollY` kullanıcı girdisine 0 ms'den uzun kilitli değil; film ilerlemesi parmak/wheel ile ileri-geri; trackpad'de ardışık iki hareket yutulmuyor.

2. **Filmleri yeniden kodla ve küçült.**
   Neden: 18 Mbps 720p ve 40 Mbps 1440p gereksiz; 68 + 40 MB.
   Nasıl: (a) video yolu kalacaksa H.264 `-crf 23 -preset slow -g 12` (~3–4 Mbps, klip 2–2,5 MB), ek olarak AV1/WebM `<source>`; ses izi `-an`; (b) scrub için kare dizisi: masaüstü 1440 px WebP q=72 (~70 KB/kare, klip ≈ 8 MB → yalnız görünür klip, 18 kare ileri önyükleme), mobil 720 px (~25 KB/kare, klip ≈ 3 MB). Kat filmleri 1440 px'e indir (`-crf 20`, ≈ 1,5 MB). Efor M.
   Kabul: ilk klip için ilk 1 s içerik 10 Mbps'de ≤ 2 s'de hazır; tek klip ≤ 4 MB masaüstü, ≤ 1,5 MB mobil.

3. **Header'ı kalıcı yap.**
   Neden: dinlenme hâlinde gezinme yok; menü keşfedilemiyor.
   Nasıl: `residence-fit.css` 281–283 satırlarındaki gizleme kuralını ve `hideHeader` zamanlayıcısını kaldır. ERA modeli: ince (56–64 px), yarı saydam, `mix-blend` yok; bölüm rengine göre `data-theme` değiştir (mevcut `on-dark` mantığı yeterli). Masaüstü nav bağlantılarına 44 px dikey alan ver. Efor S.
   Kabul: sayfa açılışında marka + menü görünür; tüm viewport'larda `getComputedStyle(header).opacity === '1'`.

4. **Hata ve yavaş ağ yolu.**
   Neden: film hazır değilse kullanıcı açılıştan çıkamıyor; 4 Mbps'de sahne geç kaydoluyor, 1,6 Mbps'de siyah örtü 15 s.
   Nasıl: `manifest.json`'ı HTML'e gömülü JSON olarak ver (fetch yarışı biter). Örtüyü en geç 1,5 s'de kaldır. Film 1,5 s'de hazır değilse poster kareye (her klibin `poster.webp` var) geç ve kaydırmayı serbest bırak; 5 s zaman aşımı ve yeniden deneme kilidi kalksın. Efor S.
   Kabul: ağ 1,6 Mbps'de bile 2 s içinde içerik görünür ve kaydırma çalışır; video hatası konsolda hata bırakır ama akışı bozmaz.

5. **Duyarlı görseller.**
   Neden: 390 px telefona 1920 px JPEG; `srcset` yok; `angora_32.png` 2,45 MB.
   Nasıl: `tools/batch-delivery` içindeki `sharp` ile 480 / 800 / 1200 / 1600 px AVIF + WebP + JPEG üret; `<picture>` + `sizes`; `width/height` nitelikleri; LCP görseline `fetchpriority="high"`, diğerlerine `loading="lazy" decoding="async"`. Harita: SVG'yi `svgo` ile sadeleştir veya mobilde 2× raster WebP (hedef ≤ 250 KB). Efor M.
   Kabul: mobil ilk ekranda görsel aktarımı ≤ 600 KB; hiçbir `<img>` gösterildiği boyutun 2× üstünde doğal genişlik taşımaz.

6. **Fontlar WOFF2 alt küme.**
   Nasıl: `pyftsubset` ile Latin + Türkçe karakterler; 6 dosya → ~150 KB; iki kritik yüzü `<link rel="preload" as="font" crossorigin>`. Efor S.

### P1 — Geçişler ve devamlılık

7. **Her bölüm sınırı için bir devir kuralı.** Üç izinli kalıp: (a) ERA footer kalıbı: önceki görüntü `clip-path: inset()` ile daralırken yeni bölüm `.85 → 1` ölçek ve opacity ile gelir, ikisi tek scrub'da; (b) Likova "altta bekleme": yeni bölüm `position: sticky` + negatif marjinle öncekinin altında durur, üstteki maske açılır; (c) renk devamlılığı: sınırda zemin rengi değişmez, önceki bölümün son karesi yeni bölümün zemini olur. Sert kesim yasak. Efor L (tüm sınırlar).
   Önerilen eşleme: açılış 03 Garden → Residence (a: film karesi çerçeveye daralır, metin arkadan gelir); Residence → Arrival (b); Arrival → yatak odaları (c: paper); bahçe → iç mekân (a); mutfaklar → katlar (b: beyaz teknik bölüm altından çıkar); katlar → planlar (c: aynı kat izometrik stilinden plana crossfade); planlar → konfor (a); Life harita → journal (c); galeri → contact (a: son galeri fotoğrafı contact görseline daralır); contact → footer (a: ERA footer kalıbı).

8. **Sabitlenmiş sahne sayısını 9'dan 4'e indir.** Bugün sticky/pinned olanlar: açılış, arrival, yatak odası şeridi, bahçe, mutfak şeridi, katlar, planlar, Life opening, galeri. Kalacaklar: açılış (scrub), bahçe (scrub), "Dört kat" (izometrik + plan tek sahnede, 4 durak; plan kesit stilinde aynı yönde yükselir), galeri (yatay scrub). Arrival, yatak odası ve mutfak şeritleri, Life opening sabitlenmez: masaüstünde 2 kolon editoryal, mobilde snap carousel. Efor M.
   Kabul: masaüstü sayfa yüksekliği 30 067 → ≤ 18 000 px; zorunlu "hareket" sayısı 9 → 0.

9. **Film zamanlamasını kaydırma mesafesine bağla.** Klip başına 120–150 svh; klip 1× hızında okunur; `stagedPosition` ile başta ve sonda 15–20 % duraklar; `cinema-caption` durakta görünür, hareket sırasında 0,3 → 1 opacity. Efor S (1'in parçası).

10. **Tek hareket dili.** Tokenlar: `--ease-mask: cubic-bezier(.7,0,.3,1)`, `--ease-inout: cubic-bezier(.75,0,.25,1)`, süreler 0,8 / 1,2 s, scrub 0,25–0,35. Tek reveal: satır maskesi (`yPercent 110 → 0`, 1,2 s, stagger .08) bütün başlıklarda; paragraflar 0,8 s opacity+8 px; görseller clip-path inset 6 % → 0. Diğer varyantları sil. Efor M.

11. **Bahçe sekmeleri Likova "alttan açılan kare"ye.** Üç fotoğraf opacity ile karışmasın; yeni kare `clip-path: inset(100% 0 0 0) → inset(0)` scrub ile açılsın; ön fotoğraf hafif yukarı pan. Sekmeler ilerleme işareti olsun. Efor S.

12. **Kat sırası.** Katlar yukarı, planlar da yukarı (Garden → Attic). İzometrikte seçili kat plana devredilsin ve plan sahnesi aynı kattan başlasın; "aşağı iniş" kaldırılsın. Efor S.

13. **Yatay şeritler (masaüstü).** Sol sabit kolon: eyebrow + başlık + kısa paragraf + ilerleme; sağ ray kayar; alt yazılar fotoğrafın altında, ray penceresinin içinde (`padding-inline-start` = pencere girintisi). Efor S.

14. **Life in Angora sahnesi.** Haritayı tam ekran yap; sol panel Likova "panel-left" gibi daralsın; üç ölçek (Ankara → Angora → villa) scrub ile; lejand panelin içinde. Boş alt yarı kalmasın. Efor M.

### P2 — Mobil

15. **Mobil ayrı sahne seti, aynı içerik.** Açılış: 9:16 dikey kadraj (filmlerden dikey export veya poster'dan 4:5 kırpım), başlık altta, film bant değil tam ekran. Film mobilde opsiyonel: poster + 1 klip (garden) yeter. Efor M.
   Kabul: mobil ilk ekranda `object-fit: cover` tam yükseklik, header hariç letterbox yok.

16. **Dokunmada kilit yok.** Native scroll + CSS `scroll-snap-type: y proximity` ile açılış durakları; `touchmove`/`touchend` dinleyicileri silinir. Efor S (1'in parçası).

17. **Dokunma hedefleri ≥ 44 px.** Galeri filtreleri (31), kat sekmeleri (34), bahçe sekmeleri (40), plan sekmeleri, küçük resimler (40 → 56), lightbox kapat. Efor S.

18. **Yazı tabanı.** Mobilde en küçük etiket 11 px, gövde 15–16 px, büyük harf `letter-spacing` ≤ .12em; `--reading` 14 → 16 px. `residence-fit.css`'teki 7–9 px tanımlarını sil. Efor S.

19. **Fotoğraf kırpımları.** Yatay 16:9 iç mekânlar mobilde 4:5 kutuya zorlanmasın: ya tek fotoğraf 86 vw genişlikte 16:9 (altında yazı), ya fotoğraf başına `object-position` ile elle onaylanmış 4:5 kırpım. Alt yazı asla kesilmez. Efor S.

20. **Plan atlası mobil.** Sekmeler tek satır segment (1 2 3 4 + kat adı altta); ölçü düğmesi ikon; plan tam genişlik, üstte boş bant yok; pin 36 px + çakışmada etiket pin altına gizlenir veya leader ile dışarı alınır; fotoğraf önizleme planın altında tam genişlik; küçük resim şeridi 56 px, yatay kaydırılabilir. Masaüstünde iki kolon, mobilde dikey. Efor M.

21. **Header örtmesi.** İnce şeffaf bar (zemin blur yok, `backdrop-filter` isteğe bağlı), `scroll-padding-top` = bar yüksekliği, bölüm başlıklarında üst boşluk 24 px+. Efor S.

22. **Yatay taşma.** `body.scrollWidth` 417 → 390: bahçe görselleri `scale` yerine `inset` ile, poster `width:100%`. `overflow-x: clip` güvenlik ağı kalır ama kaynak düzeltilir. Efor S.

23. **Gerçek cihaz turu.** iOS Safari (düşük güç modu dahil) ve Android Chrome'da: autoplay, `requestVideoFrameCallback`, `DecompressionStream` (footer), `dialog`, 100svh, `clip-path` performansı. Bulgular bu dosyaya eklenir. Efor S.

24. **Lightbox mobil.** Aşağı kaydırarak kapatma, pinch-zoom, sağ/sol geçiş, 44 px kapat. Efor S.

### P3 — Masaüstü

25. **Açılış kaynağı çözünürlüğü.** 1280×720 → en az 1920×1080; tercihen gerçek drone çekimi veya native Blender render (kat filmleri bu boru hattının çalıştığını gösteriyor). Efor M (içerik).

26. **Arrival sahnesi.** Boş sağ yarı yerine ERA "hizalan → birleş" kalıbı: sokak cephesi ve bahçe cephesi iki pencerede hizalanır, birleşir, içine dalınır ve Residence metni gelir. Efor M.

27. **Dört kat sahnesi.** Sekme değişiminde izometrik still crossfade (film yoksa); sekme hover'da izometrikte kat vurgusu; model beyaz zemin yerine çok açık `--ice` ile ayrışsın. Efor S.

28. **Contact.** Tam ekran bahçe fotoğrafı üstünde fiyat kartı (ERA footer inset kalıbı), tek birincil CTA ("Arrange a viewing") + form (ad, telefon, tarih); `tel:` ikincil. Efor M.

29. **Footer tel kafes.** İyi; "sürükle" ipucu 2 s sonra kaybolsun; dört bağlantı ikiye insin (viewing, listing), 3D ve purchase ikincil. Efor S.

### P4 — Performans ve kod sağlığı

30. **CSS konsolidasyonu.** 6 dosya → 1 derlenmiş dosya; tokenlar (`--space-*`, `--type-*`, `--ease-*`, `--dur-*`); kırılımlar 480 / 800 / 1100 / 1440; `!important` 119 → 0; her seçici tek yerde. Efor M.

31. **Önyükleme stratejisi.** `preload`: ilk klip posteri + 2 font; `neighbourhood.webp` preload'u kaldır (LCP değil); kat filmleri `#floors` görünür olunca; tel kafes 150 px yaklaşınca (mevcut). Efor S.

32. **Bütçe ve CI testi.** Playwright testi: (a) hiçbir istek > 4 MB, (b) ilk ekran aktarımı mobil ≤ 2 MB, (c) kaydırma kilidi yok, (d) tüm `button/a` ≥ 44 px mobil, (e) en küçük yazı ≥ 11 px. Lighthouse mobil hedef: LCP ≤ 2,5 s, CLS ≤ 0,1, TBT ≤ 300 ms. Testlerde MP4 yerine WebM ikamesi için `page.route` hazır (`scratchpad/audit/audit2.mjs` kalıbı). Efor S.

33. **Erişilebilirlik.** Klavye ile header'a ulaşım (kalıcı header çözer), sekmelerde roving tabindex mevcut; azaltılmış hareket yolu çalışıyor (kontrol edildi), gece karesiyle açılıyor; `aria-live` metinleri korunur. Efor S.

### P5 — İçerik ve güven

34. **AI filmleri gerçek kaynakla değiştir** (drone videosu veya native model uçuşu). Kalacaksa ilk kare gerçek fotoğraf, köşede "illustrative" etiketi; farklı pencere düzeni gösteren Garden klibi mutlaka değişsin. Efor L (içerik).

35. **Türkçe sürüm.** Viewer'daki i18n ile aynı sayfa TR/EN; `lang` ve `hreflang`. Efor M.

36. **Güven sinyalleri.** Danışman adı/fotoğrafı, RE/MAX logosu, "son güncelleme" tarihi, gerçek ulaşım süreleri (Bilkent, Eskişehir yolu) haritada. Efor S.

### Kaldırılacaklar

- `GestureGate`, `AngoraScroll.hold/stop`, `touchmove preventDefault`, 5 s video zaman aşımı + yeniden deneme kilidi.
- Header gizleme, `hideHeader` zamanlayıcısı.
- 7–9 px yazı tanımları, 31–40 px dokunma hedefleri.
- Yatay şerit ve Life opening sabitlenmeleri.
- `preload` neighbourhood.webp, opening filmi ses izi, `angora_32.png`.
- 119 `!important`.

## 6. Sıra

1. **Hafta 1 — Temel:** 1, 2, 3, 4, 5, 6, 16, 17, 18, 22. Çıktı: kilitsiz kaydırma, 10 Mbps'de 2 s'de içerik, mobilde okunur ve tıklanır sayfa.
2. **Hafta 2 — Geçişler:** 7, 8, 9, 10, 11, 12, 13, 14, 20, 21. Çıktı: üç sabit sahne, her sınırda devir kalıbı, tek hareket dili.
3. **Hafta 3 — Cila ve içerik:** 15, 19, 23, 24, 25–29, 30–33, 34–36.

## 7. Kabul ölçütleri (ölçülebilir)

| Ölçüt | Bugün | Hedef |
|---|---|---|
| Kullanıcı girdisinin kilitli olduğu süre | 0,7–1,4 s / hareket, 9 zorunlu hareket | 0 |
| Film oynatma hızı | 9,2× / 3× | 1×, scrub |
| Açılış klibi boyutu | 10–12 MB | ≤ 4 MB masaüstü, ≤ 1,5 MB mobil |
| Tam gezinti aktarımı (masaüstü) | ≈ 235 MB | ≤ 40 MB |
| Mobil ilk ekran aktarımı | ≈ 7 MB (açılış filmi 4 MB + fontlar 1,2 MB + poster, harita, CSS/JS) + ilk klibin 11 MB önyüklemesi (`prime`) | ≤ 2 MB |
| Header görünürlüğü | 0 (dinlenmede) | her zaman |
| En küçük dokunma hedefi (mobil) | 31 px | 44 px |
| En küçük yazı (mobil) | 7 px | 11 px |
| Sayfa yüksekliği (masaüstü) | 30 067 px | ≤ 18 000 px |
| Sabitlenmiş sahne | 9 | 4 |
| `!important` | 119 | 0 |
| Sert renk kesimi sınırı | 6 (açılış→residence, bahçe→iç mekân, mutfak→katlar, katlar→planlar, konum→Life, contact→footer) | 0 |

## 8. Ekran görüntüsü dizini

Masaüstü (1440×900): `d01` açılış dinlenme hâli, header yok · `d02` 01 Arrival karesi · `d03` 03 Garden (AI klip, gerçek evden farklı) · `d04` Residence başlık animasyon ortası · `d05` Arrival çerçeve · `d06` yatak odası şeridi · `d07` bahçe · `d08` dört kat · `d09` plan atlası · `d10` Life haritası (alt yarı boş) · `d11` galeri · `d12` contact · `d13` footer tel kafes · `d14` menü · `d15` plan ölçüleri.

Mobil (390×664): `m01` açılış · `m02` Arrival bandı · `m03` Residence · `m04` Arrival tam ekran · `m05` yatak odası şeridi (kesik alt yazılar) · `m06` bahçe · `m07` dört kat · `m08` plan atlası (sekme kırılması, pin çakışması) · `m09` header başlığı örtüyor · `m10` galeri · `m11` footer · `m12` menü · `m13` plan ölçüleri.
