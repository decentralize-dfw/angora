# Angora 21 — kullanıcı geri bildirimi sonrası düzeltmeler

Kayıt: 4 Ekim 2026, 10:57 Europe/Paris (UTC+02:00). Sayfa: `web-gpt.html`.

Önceki raporun 8–9 bandındaki puanları geri çekildi. Bu kayıt sayısal tasarım puanı veya kusursuzluk iddiası içermez; gözlenen davranışları ve test kapsamını bildirir.

## Değişiklikler

- Üst menü hızlı kaydırmada iki yönde de görünür; hareket bitince kapanır. Açık menü ve klavye odağı için erişilebilirlik istisnası vardır. Bir bölüme gidildiğinde odak hedefe taşınır.
- Film başlamadan yumuşak kaydırıcının ivmesi iptal edilir ve sayfa konumu tutulur. Son kareden sonra kilit çözülür. Menü film sırasında açılırsa eski sahne ankrajı sonraki gezintiye taşınmaz. Kaydırma ve film hareketi ayrı zamanlarda yürür.
- Planlar kontur morph yerine tam kat paneli olarak yatay kayar. Plan, gerçek oda sınırları, kamera yönleri, fotoğraf ve açıklama birlikte taşınır. Bir kaydırma bir kat değiştirir. Expand plan kaldırıldı.
- Mahalle fotoğrafı aşağı yönlü paralaks ve hafif büyüme kazanır.
- Harita sağ kenara kadar uzanır; resmin içinde letterbox payı yoktur. Villa konumu işaretli, Angora Evleri kesik sınırı okla gösterilir. Diğer noktaların yarıçapı eski çıktının iki katı; mekân adları kaldırıldı. Altı renkli katman anahtarı resmin altındadır. Mobilde iki ana konum yazısı daha büyük SVG çıktısıyla okunur.
- İki Angora topluluk fotoğrafı karşılıklı yönlerden girer. Fotoğraf ölçeği ve yazı girişi aynı hareket dizisinde düzenlenir.
- Fırsat bölümünde `photogallery-v2/angora_25.jpg` kullanılır: villa, teras ve havuz tam fotoğraf oranında gösterilir; iç mekân fotoğrafı ve kesen portre kadrajı kaldırıldı.
- Menü boşluk ve yazı boyutları ekran yüksekliğiyle ölçeklenir. Kısa ekranda içeriği yukarı kesen merkezleme kaldırıldı. Uzun galeri bağlantısı kısaltıldı.

## Doğrulama

- Menü: 1382×1084, 1280×600, 390×844, 320×568, 844×390 ve 768×1024. Beş explicit boyutun her birinde `scrollHeight − clientHeight = 0`; ilk ve son bağlantı ile alt adres ekranın içinde. Bağlantı metinleri yatay taşmıyor.
- Giriş, izometrik ve plan geçişleri gerçek tarayıcı wheel girdileriyle ileri/geri denendi. Film ve plan animasyonu sırasında sayfanın `scrollY` konumu aralıklarla örneklendi; tamamlanan ölçümlerde değişim 0 px. Sahne üstünün kesirli piksel farkı sabit, 1 px'den küçük.
- 390×844 mobilde üç giriş filmi, üç izometrik geçiş ve üç plan geçişinin tamamı iki yönde ölçüldü. 1382×1084 masaüstünde izometrik ve plan akışı iki yönde ölçüldü.
- Menü film oynarken açılıp Life in Angora'ya geçildi; sonraki normal wheel eski giriş ankrajına dönmedi.
- Harita 320×568, 390×844, 844×390 ve 1280×600'de kontrol edildi. Metin, harita ve alt anahtar birbiriyle çakışmıyor. 320×568'de metin altı 244,5 px; harita üstü 267,2 px, anahtarın altı 513 px.
- Mahalle fotoğrafında aşağı hareket sırasında ölçek 1,1588 → 1,1711, dikey öteleme −0,995 → 9,46 px olarak gözlendi.
- Kat panelleri yatay hareket ederken yinelenen DOM id yok; eski panel etkileşimsiz. Expand plan ve morph katmanı yok.
- `node --test --test-isolation=none tests/residence-motion.test.mjs`: 8 test geçti. JavaScript sözdizimi ve `git diff --check` kontrol edildi.

Yerel görsel ve hareket kanıtları `corrections-2026-10-04` klasöründe saklandı. Kontroller in-app Chromium üzerinde viewport değiştirerek yapıldı; gerçek iOS/Safari cihaz testi yapılmış sayılmaz.
