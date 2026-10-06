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
