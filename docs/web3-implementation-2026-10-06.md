# Web3 — uygulama ve doğrulama kaydı

6 Ekim 2026 · Europe/Paris. ERA yönündeki V2 planı `web3.html` olarak uygulandı. Web2 ve case study kaynak notları değiştirilmedi. Web4 bu teslimin kapsamında değil.

## Uygulama

- İngilizce anlatı, Cormorant Garamond / Manrope, paper–forest–ice–brown paleti ve bölüm başına seçilmiş hareketler.
- T01–T49 eşleştirmeleri `web3-scenes.js` içinde. Açılış örtüsü, üç kamera rotası, evle birlikte küçülen pencere, karşılıklı fotoğraf kolonları, tek havuz eşiği, paralaks, isometrik kat rotası, aynı katı koruyan plan bağlantısı, yatay plan birimleri, yerel kamera seçimi, filtreli galeri, native dialog dönüşü ve çizgisel kapanış.
- Tek teknik cursor: Garden → Entrance → First → Attic isometri; Attic → First → Entrance → Garden plan. Mod değiştirmek katı veya son kamerayı sıfırlamaz.
- 40 kayıtlı kamera: Garden 9, Entrance 10, First 13, Attic 8. Kullanıcıya her kat içinde 1…N gösterilir. Gerçek ankrajlar, seçili bakış yönü, küçük işaretler ve ayrı 44 px kamera seçicisi vardır. Grafik yalnız gerçek konturları kullanır; triangulation veya duvar çizilme animasyonu yoktur.
- Fotoğraf seçimi başka bölüme veya modele navigation yapamaz. Request token, history restore nesli, dialog origin ve tek busy sahibi geç gelen işlemleri engeller.
- Model zemini, klip ve duruş görselleri saf beyaz / aynı contain hesabındadır. Scroll delta playback hızını değiştirmez. Mouse momentum kuyruğu aynı hareket içinde ikinci adım veya native kayma üretmez.
- Üç hero klibi ve üç isometrik rota için desktop / mobil, ileri / geri 24 MP4. Mevcut runtime’ın literal 3× hedefi: hero 14/60 ≈ 0.233 sn, iso 11/60 ≈ 0.183 sn. Bir kaynak klibin ilk ve son karesi dahil edilerek örneklenir; `setpts+fps` ile son karelerin kaybolması önlenmiştir. Son kare posterleri lossless WebP, isometrik duruşlar aynı encoded endpoint dosyalarının birebir kopyasıdır. Garden-return kaynağının kayıtlı ters yönü korunur.
- Tüm kayıtlı fotoğraflar photogallery-v2’deki aynı basename’lerden üretilir; kaynak SHA-256, EXIF yönü, responsive boyut ve kaynak türü manifestte bulunur. Eski drone görselleri anlatıya alınmadı. Yeni AI görseli üretilmedi. Mevcut iki sezonluk community görseli açıklamalı olarak kullanıldı.
- Harita viewer GIS verisinin iki ayrı north-up düz ihracıdır; villa ve Angora Evleri sınırı işaretlenir. POI isimleri/site kapıları yoktur, altı kategori açık ve legend görüntünün altındadır. Mobil extent dışında kalan noktalar taşınmaz veya uydurulmaz.
- Kapanış yalnız `GL_LINES` çizer: mesh, texture, görünmez depth yüzeyi, pan, zoom ve auto-rotation yoktur. Orbit yatay input ile yapılır; viewport kenarının son %10’unda alfa azalır. WebGL sağlanamazsa çizgisel SVG duruşu kalır.
- Fiyat ve ilan özeti, viewing / ilan / 3D / satın alma görüşmesi eylemleri ve MERGVS · Luxembourg kredisi bulunur. WhatsApp düğmesi taslak açar; otomatik mesaj veya rezervasyon göndermez.
- JS/medya hatasında hazır görüntü ve doğal devam korunur; 40 fotoğrafın doğrudan fallback bağlantıları vardır. Küçük yükseklikte metni küçültmek yerine aynı durumla native düşey düzen kullanılır.

## Tamamlanan kontroller

Kanıt dosyaları `docs/web3-qa/` altında; viewport kayıtları browser emülasyonu ve gerçek pointer/wheel işlemleridir.

| Kontrol | Sonuç |
|---|---|
| Desktop: dört katta 40 kamera seçimi | 40/40 doğru kaynak, aynı kat/mod, Y farkı 0 px |
| Desktop: her kamerada büyük fotoğraf aç/kapat | 40/40 aynı kat/kamera, kapanış Y farkı 0 px |
| Mobil 390×844: 40 kamera seçimi | 40/40 doğru kaynak, aynı kat/mod, Y farkı 0 px |
| Mobil 390×844: 40 büyük fotoğraf aç/kapat | 40/40 aynı kat/kamera, kapanış Y farkı 0 px |
| Üç hero scroll hareketi | Üç ayrı duruş; oynatım sırasında Y farkı 0 px |
| Isometrik adımlar | Tek wheel ile komşu kat; ölçülen sıcak desktop örnekleri yaklaşık 191–206 ms; Y farkı 0 px |
| 10 viewport / menü | 320×568, 360×740, 390×844, 430×932, 768×1024, 844×390, 1280×720, 1440×900, 1920×1080, 2560×1440. Menüler viewport içinde; gerektiğinde kendi içinde scroll. Aktif pin yaklaşık 20 CSS px. |
| 430 px ilk ölçüm | Reveal transformundan 3 px yatay taşma bulundu; bölüm clipping’iyle düzeltildi. |
| Fonksiyon testleri | State, local selection, memory, stale request, history ID, overlay freeze/close, invalid route, source hash, endpoint ve yalnız çizgisel renderer için 18 test. |

Test komutu: `node tests/web3-state.test.mjs`. Testler UI görüntüsünden çıkarılmış tasarım puanı değildir.

## Testte yakalanıp düzeltilenler

1. Kat selector’ünün plan birimine/kamera barına da uygulanması: scope yalnız tab listesine daraltıldı.
2. İptal edilen kat işleminin busy işaretini bırakması: busy doğrudan tek state sahibinden türetilir.
3. Modal açılırken scrollbar genişliğinin değişmesi: desktop stable gutter, mobil overlay scrollbar; dönüş ankrajı korunur.
4. Kamera görseliyle state’in farklı anda commit olması: decode sonrası fotoğraf, koni, caption ve selection birlikte commit edilir.
5. Menü kapanışı ve yeni navigation’ın yarışması: restore generation ve kapanış sonrası navigation sırası ayrıldı.
6. Son klibin wheel kuyruğunun sayfayı sürüklemesi: kabul edilmiş gesture cluster’ın kuyruğu tüketilir.
7. Çok kısa viewport’un görünmeyen kontrolleri tutması: native düşey fallback; gesture sahibi yalnız gerçekten sabitlenmiş sahnedir.
8. Retiming’in son kaynak kareyi dışarıda bırakması: endpoint-inclusive selection, encoded endpoint’ten duruş ve lossless poster.
9. Wireframe alfa compositing’i: premultiplied output ile ayrı RGB/alfa blend; yalnız ince beyaz çizgiler.
10. Açılışın geç callback’inin yeni film karesini geri yazması: aynı request guard uygulanır.

## Doğrulama sınırı

Fiziksel iOS Safari / Android Chrome, gerçek trackpad/touch momentum, ekran okuyucu, OS text scaling ve GPU peak-memory ölçümü yapılmadı. Viewport emülasyonu bunların yerine geçmez. Ağ bozulması ve lifecycle durumları için fallback kodu vardır; bu kayıtta tüm cihazlarda kusursuzluk veya keyfî 9/10 puanı verilmez. Önceki case-study notları yeniden yazılmadı.


## Kullanıcı geri bildirimi sonrası tempo ve sınır düzeltmesi — 2026-10-06 11:10 CEST

Yayın etiketi: `20261006-pacing-1`. Önceki hız ölçümleri yukarıdaki ilk teslimin tarihsel kaydıdır; bu sürümün hızları aşağıdadır. Bu kayıt tasarım puanı veya tüm fiziksel cihazlarda kusursuzluk iddiası değildir.

- Gece posteri otomatik film oynatmaz ve kendiliğinden gündüze dönüşmez. İlk wheel ile 2 saniyelik üst görüntü fade'i başlar. Ölçülen ilk desktop adım 2018 ms, mobil 2030 ms; hareket sırasında Y farkı 0 px.
- Hero filmleri 90 kare / 1,50 s; isometrik filmler 70 kare / 1,167 s olarak yeniden kodlandı. Kaynak başlangıcı ve sonu korunur. Scroll miktarı oynatım hızını değiştirmez. ISO kaynağında yalnız 43 farklı kare olduğu için 60 fps teslimi bazı kaynak karelerini tekrarlar; yeni ara kare icat edilmez.
- Planlar birlikte 1,35 s yatay hareket eder; ISO–plan köprüsü 1,20 s, hero küçülmesi 1,30 s. Kamerada yalnız fotoğraf 0,60 s fade alır; planın çizgileri solmaz.
- Resim girişleri gerçek IntersectionObserver görünürlüğüne bağlandı: viewport altından %18 içeride, en az %12 görünürlük. Başlıklar 1,40 s, resimler 1,80 s hareket eder. İlk görünüşten sonra kararlı kalır. Kullanıcının hızlıca atladığı bir görüntüyü zorla tekrar oynatmaz.
- Galerinin GSAP pin/spacer sistemi kaldırıldı. Kendi fiziksel kapsayıcısında native sticky kullanır. İlerleme kapsayıcının o anki gerçek konumundan hesaplanır; Angora bitmeden sabitlenemez. Mobilde native yatay şerit korunur. Galeri focus ile klavyeden erişildiğinde ilgili karta gider.
- Son okuma konumunda hero/teknik dış boşluğu 1 px'e iner. Son plandan ilk sonraki wheel native sayfayı hareket ettirir. Geri girişte sınırda durulur; sonraki hareket ters kat geçişini başlatır.
- Mobil oda/mutfak şeritlerinin dikey iç taşması kapatıldı. Bu taşma resim animasyonları sürerken wheel'i yutuyordu. Fotoğrafların oranları ve responsive haritanın alanı yüklenmeden ayrılır; geç yükleme bölüm konumunu değiştirmez.
- Modal öncesinde mevcut history girdisine gerçek açılma Y'si kaydedilir. Galeri son kart bilgisinin eski Y'sine dönme hatası giderildi.
- Wireframe dış görünürlük offline 32 yön için bake edildi. Runtime yalnız çizgi vertex buffer + görünürlük maskesini alır; mesh, yüzey, doku, depth-occluder veya üçgen çizmez. Sabit pitch, orthographic projeksiyon ve önceki villa fit sınırları korunur. Komşu iki yönün maskeleri arasında yumuşak ağırlık değişir. Model sabit kalır; yalnız yatay orbit mümkündür. Model kenarındaki %10 fade korunur.
- Değişen modüller, CSS, manifest ve film/poster URL'leri sürüm parametresi alır; eski 11/14 karelik videonun tarayıcı cache'inden gelmesi önlenir.

### Bu turdaki doğrudan kanıt

`docs/web3-qa/pace-revision/desktop.json`, `mobile.json`, `viewport.json` gerçek IAB pointer/wheel + DOM ölçümleridir. Ham walkthrough kayıtları teşhis sırasında alınan ilk ölçümleri de korur: `mobileWalk` içindeki oda şeridi beklemesi ve `mobileLife` içindeki eski harita yükleme sıçraması düzeltme öncesidir. Sonraki `roomExit`, `reserveBefore/reserveAfter` ve final canlı kontroller düzeltme sonrasını gösterir.

| İnceleme | Sonuç / sınır |
|---|---|
| Desktop 1280×720, teknik 7 ileri + 7 geri | 14/14 doğru cursor; oynatım sırasında Y farkı 0 px; ISO yaklaşık 1170–1174 ms, plan 1359–1366 ms |
| Mobil viewport 390×844, aynı 14 adım | 14/14 doğru cursor; her geçişin kendi başlangıç/son Y farkı 0 px |
| Son plandan çıkış / ters giriş | Desktop sonraki wheel sayfayı 144 px; mobil 168,8 px ilerletti. Geri girişten sonra ilk ters adım doğru kata döndü. |
| Mobil gerçek pointer: kamera 2 → fotoğraf → kapat | Başlangıç, kamera sonrası, açılış ve kapanış Y = 8680 px; Garden plan/kamera 2 korunur |
| Mobil galeri yatay scroll ve modal | Ana sayfa Y = 14464 px; şerit ilerledi, aç/kapatta aynı Y korunur |
| Angora / galeri | Desktop ve mobilde galeri başlangıcı Angora bitimiyle aynı sınırda; desktop ilerleme başlangıç öncesi 0 |
| Responsive harita rezervi | 390 px'de 563,9 px ayrıldı. Yatay galeri mutlak başlangıcı yükleme öncesi/sonrası farkı <0,01 px |
| 320×568 menü | 296×544 px, viewport içinde; tüm bağlantılar kendi doğal scroll'u ile erişilebilir |
| Ek plan ölçüleri | 430×932, 768×1024, 1024×768, 1440×900, 844×390; yatay taşma yok. Kısa landscape planda okunabilir native düşey akış kullanılır; pin zorlanmaz. |
| Fonksiyon / veri kontrolleri | 20/20 test: state, kamera bağlamı, history, uç kareler, v2 kaynak hash, giriş sınırı ve exterior maske buffer bütünlüğü |

### Her geçiş için inceleme izi

Aşağıdaki maddeler ayrı tasarım notları değildir; kontrol edilen davranışın izidir. Fiziksel touch/trackpad ölçümü bunlardan çıkarılamaz.

| ID | Bu turdaki değerlendirme / kontrol |
|---|---|
| T01 | Açılış kararması 2 s; gece kendi kendine değişmez. |
| T02 | İlk scroll ile 2 s fade; desktop/mobil ölçüldü. |
| T03 | Arrival filmi 1,5 s, duruş ve sabit Y kontrolü. |
| T04 | Perspective filmi 1,5 s, ileri ve ters mobil kontrolü. |
| T05 | Garden filmi 1,5 s, bağımsız son duruş. |
| T06 | Shrink 1,3 s; terminal boşluğu ve geri açılma kontrolü. |
| T07 | Residence metni ve facts kendi görünürlüklerinde girer. |
| T08 | Street görüntüsü ve metin ayrı görünürlükleriyle girer. |
| T09 | Rooms başlığı offscreen tamamlanmaz. |
| T10 | Üç bedroom girişleri; mobil şerit ve dikey çıkış kontrolü. |
| T11 | Pool curved takeover 1,8 s; giriş viewport'a bağlı. |
| T12 | Terrace görüntüsü soldan 1,8 s giriş. |
| T13 | Garden path sağdan 1,8 s giriş. |
| T14 | Paper threshold native yerleşimde; erken pin bindirmesi yok. |
| T15 | Living ve dining farklı yönlerden, gerçek görünürlükte. |
| T16 | Suite metni, bedroom ve dressing ayrı girişler. |
| T17 | Kitchen başlığı ve ilk fotoğraf görünürlükte başlar. |
| T18 | Mobil yatay hareketle Garden kitchen girişinin kontrolü. |
| T19 | Mobil yatay hareketle Attic kitchenette girişinin kontrolü. |
| T20 | ISO ilk okuma, white yüzey ve contain ölçüleri. |
| T21 | Garden → Entrance ileri/ters, iki viewport, sabit Y. |
| T22 | Entrance → First ileri/ters, iki viewport, sabit Y. |
| T23 | First → Attic ileri/ters, iki viewport, sabit Y. |
| T24 | Aynı Attic katından plan köprüsü 1,2 s; ters yön de kontrol edildi. |
| T25 | Attic → First plan, yatay birlikte hareket, 1,35 s. |
| T26 | First → Entrance plan, aynı hareket ve Y kontrolü. |
| T27 | Entrance → Garden plan, aynı hareket; sonraki scroll çıkış. |
| T28 | Yerel kamera seçimi kat/mod değiştirmez; yalnız fotoğraf fade alır. |
| T29 | Büyük fotoğrafın gerçek pointer ile açılması. |
| T30 | Aynı kamera/plan/Y'ye dönüş; stale parent-history Y düzeltmesi. |
| T31 | Son plandan comfort'a ilk native wheel ile çıkış. |
| T32 | Staircase görüntüsü metinden bağımsız görünürlükte girer. |
| T33 | Neighbourhood parallax + hafif büyüme, gerçek rect'e bağlı. |
| T34 | Flat map oranı yüklemeden ayrılır, altı katman legend'i korunur. |
| T35 | İlk community image soldan; mobil görünürlük kaydı. |
| T36 | İkinci community image sağdan; birincinin altında kendi yeri. |
| T37 | Culture başlığı ve linkler native bölüm içinde. |
| T38 | Galeri sınırı fiziksel Angora bitiminde; z-index pin çakışması kaldırıldı. |
| T39 | Desktop sticky yatay ray; gerçek top ile progress. Mobil native yatay scroll. |
| T40 | Filtre layout hesapları native kapsayıcı içinde; final canlı kontrolde tekrar bakılır. |
| T41 | Mobil/desktop galeri modal bağlamı; final canlı filtre kontrolü de yapılır. |
| T42 | Opportunity görüntüsü ve fiyat ayrı giriş, kendi brown bölümünde. |
| T43 | Kapanış modeli 1,8 s görünürlük girişi; dış çizgiler. |
| T44 | Fixed pitch / orthographic / stabil fit; runtime line-only + view mask. |
| T45 | Footer native son bölüm, credits erişilebilir. |
| T46 | Direct chapter, plan, life, gallery rotaları; galeri wrapper'a navigasyon. |
| T47 | Header küçük ölçülerde compact; idle gizli, hızlı kaydırmada görünür. |
| T48 | Altı ek viewport ve continuity kontrolü; kısa ekran native fallback. |
| T49 | Last-ready-frame/state fallback korunur; fonksiyon testleri geçer. Bu tur tam ağ arızası/OS lifecycle matrisi tamamlandı denmez. |

Fiziksel iOS/Android, gerçek touch momentum ve ekran okuyucu kontrolü henüz yapılmadı. 32 açılı dış kenar bake'i midpoint görünürlüğüne dayanır; piksel bazlı sürekli surface renderer değildir. Runtime'ın yüzey içermemesi koşulu için bu tercih yapıldı.
