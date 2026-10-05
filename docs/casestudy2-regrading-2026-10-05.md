# Angora web2 — bağımsız ara notlama, ikinci inceleme

Tarih/saat: **2026-10-05 19:25:09 Europe/Paris (UTC+02:00)**.

Durum: **Notlama tamamlandı. web3 ve web4 uygulanmadı.** Kaynak, kullanıcının Videos klasöründeki **2026-10-05 15-29-15.mp4** kaydıdır. Kayıtta web2 açılmıştır; bugünkü canlı sürümün veya fiziksel telefon performansının sertifikası değildir.

## Önceki notların düzeltmesi

İlk rapordaki sayılar geçiş türlerinin ortak şablonlarından geliyordu. Tek tek kesitlere özgü bağımsız notlar olarak sunulmaları doğru değildi. Bu notlar geri çekildi; tarihli eski rapor geçmiş kayıt olarak korundu. Yeni listede 109 kesitin her biri için dört gerekçe, iki kaynak karesi ve somut kabul koşulu yazıldı. Aynı kusur aynı notu alabilir; farklı puan dağılımı üretmek için rastgele ayrım yapılmadı.

Eski hesap üç boyutun ortalamasıydı. Yeni hesap dört boyutun en düşüğüdür. Eski ve yeni toplam arasındaki fark kalite değişimi veya puan düşürme miktarı olarak okunmamalıdır. Kayıt aynı kaldı; yöntem ve gerekçelendirme düzeltildi.

## Ölçek ve yöntem

- **Devamlılık:** mekânın, seçili katın, hareket yönünün ve geri dönüş durumunun korunması.
- **Hareket:** görüntü/yüzey/metin sırası, görünür kesme, çift görüntü ve hareket bağının anlaşılması.
- **Kadraj:** evin veya planın okunması; metin, fotoğraf ve viewport dengesi.
- **Okuma:** yazı kontrastı/boyutu, oda/pin/koni ilişkisi ve bilginin doğru zamanda gelmesi.
- **Geçiş notu = değerlendirilebilen en düşük boyut.** Sorunlu bir boyutun diğer yüksek notlarla gizlenmesini önleyen editoryal karar kuralıdır; istatistiksel ölçüm değildir.
- Yarım puanlar iki çıpa arasındaki ayrımdır; ölçülmüş FPS veya milisaniye hassasiyeti değildir.
- Kaydedilmeyen etkileşim **N/A**. Mobil kamera 3 kesitinde seçim zaten aktiftir; tıklama animasyonuna not verilmedi.
- 9 kabul koşulları gelecekteki uygulamanın hedefidir; kazanılmış not değildir.

| Çıpa | Anlam |
|---:|---|
| 4 | Mekân veya durum bağı ciddi biçimde kopuyor. |
| 5 | Belirgin yeniden kurulum gerekiyor. |
| 6 | İşlev okunuyor; belirgin kadraj/senkron sorunu var. |
| 7 | Kurgu çalışıyor; görünen düzeltmeler gerekiyor. |
| 8 | İyi ve tutarlı; küçük ama somut bir eksik var. |
| 9 | İncelenen kesitte belirgin kusur yok; hareket ve bilgi birlikte çözülmüş. |
| 10 | Örnek alınabilecek bütünlük; bu kayıtla kusursuzluk iddiası kurulmadı. |

## Kaynak incelemesi ve sınırlar

Desktop **65 kesit**, kaynak **00:04.00–01:50.00**. Mobil **44 kesit**, kaynak **02:02.00–03:27.00**. Tekrar ziyaretler, ters hareketler ve okuma durakları ayrı tutuldu; 109 farklı animasyon iddiası yoktur.

Her kesit için kaynak videodan 12 zaman örnekli inceleme sayfası çıkarıldı. Genel inceleme panoları bunların dört karesini yan yana gösterir; film çıkışı, bahçe bilgi senkronu ve lightbox gibi sorunlu kesitler daha geniş kare dizileriyle kontrol edildi. Her kesitin bütün 60 fps kareleri veya fiziksel mouse/touch tepkisi ölçülmedi. Oynatıcı doğrulaması aşağıda ayrı belirtilir.

- Mobil, Chrome emülasyonudur: 459 × 686 CSS px; yayımlanan crop 426 × 636. Gerçek telefon testi değildir.
- Desktop crop x0/y152, 2540 × 1388 → 1920 × 1050. Mobil crop x594/y254, 426 × 636.
- İlk siyah açılış örtüsü, tüm kamera seçimleri, menü açılışı, form gönderimi ve bütün mobil galeri fotoğrafları kayıtta yoktur.
- Bekleme süreleri kullanıcının duruşlarını içerir; animasyon süresi diye puanlanmadı.
- Analiz katmanları gözlenen okuma bölgeleridir; referansların izole DOM/compositor katmanları değildir.
- Aşağıdaki zamanlar orijinal video saatidir; oynatıcı ofseti çıkararak bu karelere gider.

## Düzeltilen teşhisler

1. Desktop galeri kartları bir kesit geç etiketlenmişti. Sınırlar 84.55 / 85.45 / 86.35 / 87.35 saniyeye düzeltildi. Lightbox açılışı 90.20, kapanışı 92.10 saniyeden başlar; hareket artık kesitin içinde.
2. Mobil mutfak→plan dönüşünde aynı mutfak fotoğrafı geri geliyor. Önceki “kesin kamera reset'i” teşhisi bu kesit için geri çekildi. Dar yerleşim ve başlığın üst arayüze yaklaşması değerlendirildi.
3. Angora Journal'ın iki fotoğrafı desktop ve mobilde mevcut. Eksik görsel teşhisi konmadı; farklı bağlamlar değerlendirildi.
4. Film çıkışında görüntü birlikte küçülmek yerine yukarı kırpılıyor. Mobil çıkışın yönü düşeydir; yan yana kareler yatay hareket kanıtı sayılmadı.
5. Attic modelinden Garden planına geçerken kat kimliği değişiyor. Referanslarda birebir kat→plan dönüşümü yok; öneri referans bilgi hiyerarşisinden çıkarılan tasarım kararıdır.
6. Tam siyah kare gözlenmeyen kesitlere “black flash” kusuru yazılmadı. Gece→gündüz devrindeki çift perspektif ve ışık farkı ayrıca puanlandı.

## Sonuç dağılımı

Bu özet notları hesaplar; notlar ayrı yazılmış gözlemlerden gelir. Mevcut duruma 9 kazanıldı denmiyor.

| Kayıt | Kesit | En düşük | En yüksek | <6 | 6–<8 | ≥8 | ≥9 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Desktop | 65 | 4.5 | 8.0 | 6 | 49 | 10 | 0 |
| Mobil emülasyon | 44 | 5.0 | 8.0 | 7 | 30 | 7 | 0 |

## Uygulama sırası

1. Film çıkışı: evin tamamını ortak odakta tutan pencere+görüntü küçülmesi ve sıralı bilgi.
2. Model↔plan: aynı kat kimliği; geri dönüşte doğru kat ve fotoğraf.
3. Mobil plan: küçük pasif pin, aktif bakış konisi, okunur oda adı ve fotoğraf alanı.
4. Bahçe: başlık ve fotoğrafın aynı mekânı aynı anda göstermesi.
5. Viewing ve map: cepheyi kapatmayan bilgi; ev/boundary işaretlerinin dar ekran içinde kalması.
6. İyi fotoğraf akışlarını koruyarak caption/kontrast sorunlarını düzeltme.

8 altındaki her kesitin 9 kabul koşulu ayrıntılarda yazılıdır. Hedefe ulaşıldığı ancak yeni uygulamanın aynı cihaz ve ters yönde yeniden görülmesi sonrasında söylenebilir. web3 ERA, web4 Likova için ileriki iki ayrı uygulamadır; bu rapor bunları olmuş gibi göstermez.

## Referans kullanımı

92 gerçek ERA/Likova sahnesi kütüphanede erişilebilir. **58 farklı sahne** bağlamı açıklanan öneri olarak seçildi. Aynı cihaz kayıtları eşleştirildi; cookie, çoklu konut listesi veya ajans ekip bağlamları villaya zorlanmadı. Klipler bağımsız oynar; scroll hızları yapay olarak eşitlenmez.

## Doğrulama

- 17 veri testi: 201 sahnenin aralıkları, ofsetleri, medya/still dosyaları, cihaz eşleşmesi, 109 açık not girdisi, kaynak kare zamanları, tekrar bağları ve export/player eşitliği.
- Önceki tur tarayıcı kontrolleri eski JSON'da korunur; yeni notların gerekçesi yerine geçmez.
- Bu tur [tarayıcı kontrol kaydı](casestudy2-regrading-browser-checks-2026-10-05.json): 2026-10-05 19:24:47 Europe/Paris.
- 65 desktop kesit 1280 × 720 görünümde seçildi: dört ölçüt, iki kaynak bağlantısı ve kabul koşulu bulundu; kadraj sığdı, yatay taşma ve seçim sonrası scrollY kayması yoktu.
- 44 mobil kesit 320 × 568 görünümde seçildi; aynı veri ve kadraj kontrolleri geçti.
- 320 × 568 ve 390 × 844 not kartları tek kolon; 844 × 390 kayıt kadrajı sığdı. Kaydedilmeyen mobil kamera seçimi Hareket N/A olarak göründü.
- Desktop Arrival ve film çıkışı 0.5× oynatıldı; son yerel karelerde durdu. Lightbox açılışı 0.5× oynatılarak 88.083333 yerel saniyede duruş doğrulandı.
- Lightbox kaynak kanıtı 90.333333 kaynak saniyesinden 86.333333 yerel saniyeye gitti; hash korundu, ekran yukarı döndü.
- Mobil film çıkışı 0.5× oynatıldı; klip sonundaki duruş aşağıdaki gözlemde kayıtlı. Bu kontrol fiziksel mouse/touch veya web2 performans testi değildir.

## Kesit envanteri

D/H/K/O = devamlılık / hareket / kadraj / okuma. Kaynak aralığı tümüyle animasyon süresi değildir.

### Desktop

| No | Kaynak | Kesit | D/H/K/O | Geçiş notu | Karar | Referanslar |
|---:|---|---|---|---:|---|---|
| 1 | 00:04.00–00:08.60 | Aerial: gündüz → gece | 8.5 / 8.5 / 8.0 / 8.0 | 8.0 | Koru | likova-desktop/2, era-desktop/5 |
| 2 | 00:08.60–00:10.10 | 01 / Arrival kamera durağı | 6.0 / 6.5 / 8.0 / 7.5 | 6.0 | İncelt | likova-desktop/7, era-desktop/5 |
| 3 | 00:10.10–00:11.70 | 02 / Perspective kamera durağı | 8.0 / 8.5 / 8.0 / 7.5 | 7.5 | İncelt | likova-desktop/7, era-desktop/5 |
| 4 | 00:11.70–00:13.65 | 03 / Garden kamera durağı | 8.5 / 8.5 / 8.5 / 8.0 | 8.0 | Koru | likova-desktop/7, era-desktop/5 |
| 5 | 00:13.65–00:14.65 | Film → kâğıt / ilk eşik | 5.0 / 5.5 / 5.0 / 7.0 | 5.0 | Yeniden ele al | era-desktop/20, likova-desktop/9 |
| 6 | 00:14.65–00:16.70 | Ev özeti ve alanlar | 8.0 / 8.0 / 8.5 / 7.5 | 7.5 | İncelt | era-desktop/13 |
| 7 | 00:16.70–00:18.85 | Sokak cephesine geliş | 8.0 / 8.0 / 8.5 / 8.0 | 8.0 | Koru | era-desktop/16, likova-desktop/6 |
| 8 | 00:18.85–00:20.70 | Oda sütununa giriş | 8.0 / 8.0 / 8.0 / 8.0 | 8.0 | Koru | era-desktop/16, era-desktop/17 |
| 9 | 00:20.70–00:22.05 | Yatak odası 1 → 2 | 8.5 / 8.0 / 8.0 / 7.5 | 7.5 | İncelt | era-desktop/26, era-desktop/16 |
| 10 | 00:22.05–00:23.90 | Yatak odası 2 → 3 | 8.0 / 8.0 / 8.0 / 7.5 | 7.5 | İncelt | era-desktop/26, era-desktop/16 |
| 11 | 00:23.90–00:26.35 | Odalardan tam ekran havuza | 7.5 / 8.0 / 8.0 / 6.5 | 6.5 | İncelt | era-desktop/21, likova-desktop/14 |
| 12 | 00:26.35–00:27.50 | Havuz → kapalı teras | 7.5 / 8.0 / 8.5 / 6.5 | 6.5 | İncelt | era-desktop/14, likova-desktop/12 |
| 13 | 00:27.50–00:28.60 | Teras → bahçe yolu | 7.5 / 7.5 / 8.0 / 7.0 | 7.0 | İncelt | era-desktop/14, likova-desktop/12 |
| 14 | 00:28.60–00:30.20 | Bahçeden salon anlatısına | 8.0 / 7.5 / 8.0 / 8.0 | 7.5 | İncelt | era-desktop/15, likova-desktop/15 |
| 15 | 00:30.20–00:32.70 | Salon ve ikinci açı | 8.5 / 8.5 / 8.5 / 8.0 | 8.0 | Koru | era-desktop/16, likova-desktop/17 |
| 16 | 00:32.70–00:36.40 | Salondan özel yatak odasına | 7.5 / 8.0 / 8.0 / 8.0 | 7.5 | İncelt | era-desktop/16 |
| 17 | 00:36.40–00:38.65 | Kâğıttan yeşil mutfak sahnesine | 8.0 / 8.0 / 8.5 / 8.0 | 8.0 | Koru | likova-desktop/18, era-desktop/15 |
| 18 | 00:38.65–00:40.15 | Ana mutfak → bahçe mutfağı | 8.5 / 8.0 / 8.0 / 7.5 | 7.5 | İncelt | era-desktop/26, likova-desktop/20 |
| 19 | 00:40.15–00:42.15 | Bahçe mutfağı → çatı mutfağı | 8.0 / 8.0 / 7.5 / 7.5 | 7.5 | İncelt | era-desktop/26, likova-desktop/20 |
| 20 | 00:42.15–00:44.45 | Fotoğraftan isometrik bahçe katına | 7.5 / 7.5 / 6.0 / 7.5 | 6.0 | İncelt | likova-desktop/13, era-desktop/13 |
| 21 | 00:44.45–00:45.35 | Iso / Garden → Entrance | 7.5 / 8.0 / 6.5 / 7.0 | 6.5 | İncelt | likova-desktop/7, era-desktop/14 |
| 22 | 00:45.35–00:46.35 | Iso / Entrance → First | 8.0 / 8.5 / 7.5 / 7.0 | 7.0 | İncelt | likova-desktop/7, era-desktop/14 |
| 23 | 00:46.35–00:48.05 | Iso / First → Attic | 8.0 / 8.0 / 7.5 / 7.0 | 7.0 | İncelt | likova-desktop/7, era-desktop/14 |
| 24 | 00:48.05–00:50.25 | Attic iso → Garden plan / kimlik kopuşu | 5.0 / 7.5 / 8.0 / 6.5 | 5.0 | Yeniden ele al | era-desktop/25, likova-desktop/13 |
| 25 | 00:50.25–00:52.25 | Plan / Garden → Entrance | 8.0 / 8.0 / 7.5 / 6.5 | 6.5 | İncelt | era-desktop/10, era-desktop/25 |
| 26 | 00:52.25–00:54.25 | Plan / Entrance → First | 8.0 / 8.0 / 7.5 / 6.0 | 6.0 | İncelt | era-desktop/10, era-desktop/25 |
| 27 | 00:54.25–00:55.55 | Plan / First → Attic | 8.0 / 8.0 / 8.0 / 6.5 | 6.5 | İncelt | era-desktop/10, era-desktop/25 |
| 28 | 00:55.55–00:56.35 | Plan → Garden iso / ilk geri ziyaret | 4.5 / 5.5 / 7.0 / 6.0 | 4.5 | Yeniden ele al | era-desktop/23, likova-desktop/9 |
| 29 | 00:56.35–00:56.95 | Iso / Garden → Entrance · tekrar | 7.5 / 8.0 / 6.5 / 7.0 | 6.5 | İncelt | likova-desktop/7, era-desktop/14 |
| 30 | 00:56.95–00:57.55 | Iso / Entrance → First · tekrar | 8.0 / 8.5 / 7.5 / 7.0 | 7.0 | İncelt | likova-desktop/7, era-desktop/14 |
| 31 | 00:57.55–00:58.45 | Iso / First → Attic · tekrar | 8.0 / 8.0 / 7.5 / 7.0 | 7.0 | İncelt | likova-desktop/7, era-desktop/14 |
| 32 | 00:58.45–00:59.60 | Attic iso → Garden plan · tekrar | 5.0 / 7.5 / 8.0 / 6.5 | 5.0 | Yeniden ele al | era-desktop/25, likova-desktop/13 |
| 33 | 00:59.60–01:01.20 | Plan / Garden → Entrance · tekrar | 7.5 / 8.0 / 7.5 / 6.5 | 6.5 | İncelt | era-desktop/10, era-desktop/25 |
| 34 | 01:01.20–01:02.10 | Plan → Garden iso / ikinci geri ziyaret | 5.0 / 5.5 / 7.0 / 6.0 | 5.0 | Yeniden ele al | era-desktop/23, likova-desktop/9 |
| 35 | 01:02.10–01:02.80 | Iso / Garden → Entrance · 3. ziyaret | 7.5 / 8.0 / 6.5 / 7.0 | 6.5 | İncelt | likova-desktop/7, era-desktop/14 |
| 36 | 01:02.80–01:03.60 | Iso / Entrance → First · 3. ziyaret | 8.0 / 8.5 / 7.5 / 7.0 | 7.0 | İncelt | likova-desktop/7, era-desktop/14 |
| 37 | 01:03.60–01:04.60 | Iso / First → Attic · 3. ziyaret | 7.5 / 7.5 / 7.5 / 7.0 | 7.0 | İncelt | likova-desktop/7, era-desktop/14 |
| 38 | 01:04.60–01:05.55 | Attic iso → Garden plan · 3. ziyaret | 5.0 / 7.5 / 8.0 / 6.5 | 5.0 | Yeniden ele al | era-desktop/25, likova-desktop/13 |
| 39 | 01:05.55–01:06.50 | Plan / Garden → Entrance · 3. ziyaret | 8.0 / 8.0 / 7.5 / 6.5 | 6.5 | İncelt | era-desktop/10, era-desktop/25 |
| 40 | 01:06.50–01:07.70 | Plan / Entrance → First · tekrar | 8.0 / 8.0 / 7.5 / 6.0 | 6.0 | İncelt | era-desktop/10, era-desktop/25 |
| 41 | 01:07.70–01:08.60 | Plan / First → Attic · tekrar | 8.0 / 8.0 / 8.0 / 6.5 | 6.5 | İncelt | era-desktop/10, era-desktop/25 |
| 42 | 01:08.60–01:10.40 | Plandan evin pratik ayrıntılarına | 8.0 / 7.5 / 8.0 / 7.5 | 7.5 | İncelt | likova-desktop/19, era-desktop/20 |
| 43 | 01:10.40–01:12.65 | Dört özellik → merdiven fotoğrafı | 8.5 / 8.0 / 8.5 / 8.0 | 8.0 | Koru | likova-desktop/19, era-desktop/20 |
| 44 | 01:12.65–01:15.10 | Ev içinden villa mahallesine | 8.0 / 8.0 / 8.0 / 8.0 | 8.0 | Koru | era-desktop/12, likova-desktop/8 |
| 45 | 01:15.10–01:18.55 | Mahalle → geniş harita + yaşam kartı | 8.0 / 8.0 / 8.0 / 6.5 | 6.5 | İncelt | likova-desktop/10, era-desktop/11 |
| 46 | 01:18.55–01:20.15 | Harita → Angora Journal / iki fotoğraf | 8.0 / 7.5 / 8.5 / 8.0 | 7.5 | İncelt | era-desktop/16, likova-desktop/12 |
| 47 | 01:20.15–01:22.10 | Mahalle ve spor: fotoğraf → caption | 8.5 / 8.0 / 8.5 / 7.5 | 7.5 | İncelt | likova-desktop/20, era-desktop/16 |
| 48 | 01:22.10–01:23.25 | Journal → Ankara kültür linkleri | 8.0 / 7.5 / 8.0 / 7.5 | 7.5 | İncelt | likova-desktop/20, era-desktop/16 |
| 49 | 01:23.25–01:24.55 | Journal’dan seçilmiş ev fotoğraflarına | 8.5 / 8.0 / 8.0 / 7.5 | 7.5 | İncelt | likova-desktop/17, era-desktop/17 |
| 50 | 01:24.55–01:25.45 | Galeri / living room → kitchen | 8.5 / 8.5 / 8.5 / 7.5 | 7.5 | İncelt | era-desktop/10, likova-desktop/17 |
| 51 | 01:25.45–01:26.35 | Galeri / kitchen → entry hall | 8.5 / 8.5 / 8.5 / 7.5 | 7.5 | İncelt | era-desktop/10, likova-desktop/17 |
| 52 | 01:26.35–01:27.35 | Galeri / hall → primary bedroom | 8.5 / 8.5 / 8.0 / 7.0 | 7.0 | İncelt | era-desktop/10, likova-desktop/17 |
| 53 | 01:27.35–01:30.20 | Galeri / bedroom → sitting area | 8.5 / 8.5 / 8.5 / 7.5 | 7.5 | İncelt | era-desktop/10, likova-desktop/17 |
| 54 | 01:30.20–01:32.10 | Fotoğraf büyütme / sitting area | 8.0 / 7.5 / 9.0 / 7.5 | 7.5 | İncelt | era-desktop/27 |
| 55 | 01:32.10–01:33.10 | Büyük fotoğraftan aynı raya dönüş | 8.5 / 7.5 / 8.5 / 8.0 | 7.5 | İncelt | era-desktop/27 |
| 56 | 01:33.10–01:34.05 | Galeri / sitting area → bathroom | 8.5 / 8.5 / 8.5 / 7.5 | 7.5 | İncelt | era-desktop/10, likova-desktop/17 |
| 57 | 01:34.05–01:34.65 | Galeri / bathroom → attic bedroom | 8.5 / 8.5 / 8.5 / 7.5 | 7.5 | İncelt | era-desktop/10, likova-desktop/17 |
| 58 | 01:34.65–01:35.65 | Galeri / attic bedroom → attic living | 8.0 / 8.0 / 8.0 / 7.5 | 7.5 | İncelt | era-desktop/10, likova-desktop/17 |
| 59 | 01:35.65–01:37.40 | Galeri bitişi → viewing fotoğrafı | 8.0 / 8.0 / 6.5 / 8.0 | 6.5 | İncelt | era-desktop/21, likova-desktop/10 |
| 60 | 01:37.40–01:41.30 | Fiyat, ev özeti ve viewing kartı | 8.0 / 8.0 / 6.5 / 8.0 | 6.5 | İncelt | era-desktop/21, likova-desktop/10 |
| 61 | 01:41.30–01:42.60 | Fotoğraftan çizgisel ev kapanışına | 8.0 / 8.0 / 8.5 / 8.0 | 8.0 | Koru | era-desktop/22, likova-desktop/13 |
| 62 | 01:42.60–01:46.55 | Wireframe orbit / sabit eylemler | 8.5 / 8.5 / 8.5 / 8.0 | 8.0 | Koru | likova-desktop/7 |
| 63 | 01:46.55–01:47.75 | Wireframe → viewing → galeri / geri | 6.5 / 6.5 / 7.0 / 7.5 | 6.5 | İncelt | era-desktop/23, likova-desktop/9 |
| 64 | 01:47.75–01:48.60 | Galeri / bathroom → sitting area · geri | 8.5 / 8.5 / 8.0 / 7.5 | 7.5 | İncelt | era-desktop/23, likova-desktop/9 |
| 65 | 01:48.60–01:50.00 | Yatay galeri geriye okunur | 8.5 / 8.5 / 8.5 / 7.5 | 7.5 | İncelt | era-desktop/23, likova-desktop/9 |

### Mobil emülasyon

| No | Kaynak | Kesit | D/H/K/O | Geçiş notu | Karar | Referanslar |
|---:|---|---|---|---:|---|---|
| 1 | 02:02.00–02:08.20 | Mobil aerial / ışık değişimi | 8.0 / 7.5 / 7.5 / 7.0 | 7.0 | İncelt | likova-mobile/2, era-mobile/1 |
| 2 | 02:08.20–02:09.70 | Mobil / 01 Arrival | 8.0 / 8.0 / 7.5 / 7.5 | 7.5 | İncelt | likova-mobile/7, era-mobile/1 |
| 3 | 02:09.70–02:11.30 | Mobil / 02 Perspective | 8.0 / 8.5 / 7.5 / 7.5 | 7.5 | İncelt | likova-mobile/7, era-mobile/1 |
| 4 | 02:11.30–02:12.75 | Mobil / 03 Garden | 8.5 / 8.5 / 8.0 / 7.5 | 7.5 | İncelt | likova-mobile/7, era-mobile/1 |
| 5 | 02:12.75–02:14.00 | Mobil film → kâğıt eşik | 5.0 / 5.5 / 5.0 / 7.0 | 5.0 | Yeniden ele al | era-mobile/17, likova-mobile/9 |
| 6 | 02:14.00–02:16.50 | Mobil ev özeti ve ölçüler | 8.0 / 8.0 / 8.5 / 8.0 | 8.0 | Koru | era-mobile/10 |
| 7 | 02:16.50–02:19.85 | Mobil sokak cephesi → açıklama | 8.0 / 8.0 / 8.0 / 8.0 | 8.0 | Koru | era-mobile/13, likova-mobile/6 |
| 8 | 02:19.85–02:22.40 | Mobil yatak odası penceresi | 8.0 / 8.0 / 8.0 / 7.0 | 7.0 | İncelt | era-mobile/13, era-mobile/15 |
| 9 | 02:22.40–02:24.35 | Mobil odadan havuz sahnesine | 7.5 / 8.0 / 6.5 / 6.5 | 6.5 | İncelt | era-mobile/18, likova-mobile/14 |
| 10 | 02:24.35–02:25.60 | Mobil / havuz → teras | 7.5 / 8.0 / 7.5 / 6.5 | 6.5 | İncelt | era-mobile/11, likova-mobile/12 |
| 11 | 02:25.60–02:27.55 | Mobil / teras → bahçe | 7.5 / 8.0 / 7.5 / 6.5 | 6.5 | İncelt | era-mobile/11, likova-mobile/12 |
| 12 | 02:27.55–02:28.50 | Mobil / bahçe → teras · geri | 8.0 / 8.0 / 7.5 / 7.0 | 7.0 | İncelt | era-mobile/20, likova-mobile/9 |
| 13 | 02:28.50–02:29.55 | Mobil / teras → havuz · geri | 8.0 / 8.0 / 6.5 / 7.5 | 6.5 | İncelt | era-mobile/20, likova-mobile/9 |
| 14 | 02:29.55–02:30.65 | Mobil / havuz → yatak odası · geri | 8.0 / 8.0 / 8.0 / 7.5 | 7.5 | İncelt | era-mobile/20, likova-mobile/9 |
| 15 | 02:30.65–02:32.40 | Mobil / odadan havuza · tekrar | 7.5 / 8.0 / 6.5 / 6.5 | 6.5 | İncelt | era-mobile/18, likova-mobile/14 |
| 16 | 02:32.40–02:33.45 | Mobil / havuz → teras · tekrar | 7.5 / 8.0 / 7.5 / 6.5 | 6.5 | İncelt | era-mobile/11, likova-mobile/12 |
| 17 | 02:33.45–02:34.45 | Mobil / teras → bahçe · tekrar | 7.5 / 8.0 / 7.5 / 7.0 | 7.0 | İncelt | era-mobile/11, likova-mobile/12 |
| 18 | 02:34.45–02:35.45 | Mobil bahçe → iç mekân | 8.0 / 7.5 / 8.0 / 7.5 | 7.5 | İncelt | era-mobile/12, likova-mobile/15 |
| 19 | 02:35.45–02:38.65 | Mobil salon → ikinci açı | 8.5 / 8.0 / 7.5 / 8.0 | 7.5 | İncelt | era-mobile/13, likova-mobile/17 |
| 20 | 02:38.65–02:42.35 | Mobil salon → özel oda | 8.0 / 8.0 / 7.5 / 8.0 | 7.5 | İncelt | era-mobile/13 |
| 21 | 02:42.35–02:44.65 | Mobil yeşil mutfak sahnesine giriş | 7.0 / 8.0 / 8.0 / 7.5 | 7.0 | İncelt | likova-mobile/18, era-mobile/12 |
| 22 | 02:44.65–02:45.55 | Mobil / model eşiğinden mutfağa geri | 8.0 / 8.0 / 8.0 / 7.0 | 7.0 | İncelt | era-mobile/20, likova-mobile/9 |
| 23 | 02:45.55–02:46.40 | Mobil / ana mutfak → bahçe mutfağı | 8.5 / 8.5 / 8.5 / 7.5 | 7.5 | İncelt | era-mobile/15, likova-mobile/20 |
| 24 | 02:46.40–02:48.50 | Mobil / bahçe mutfağı → çatı mutfağı | 8.5 / 8.5 / 8.5 / 7.5 | 7.5 | İncelt | era-mobile/15, likova-mobile/20 |
| 25 | 02:48.50–02:51.15 | Mobil fotoğraftan isometrik Garden’a | 8.0 / 8.0 / 6.5 / 7.5 | 6.5 | İncelt | likova-mobile/13, era-mobile/10 |
| 26 | 02:51.15–02:52.35 | Mobil iso / Garden → Entrance | 7.5 / 8.0 / 6.5 / 7.0 | 6.5 | İncelt | likova-mobile/7, era-mobile/11 |
| 27 | 02:52.35–02:53.35 | Mobil iso / Entrance → First | 8.0 / 8.5 / 7.0 / 7.0 | 7.0 | İncelt | likova-mobile/7, era-mobile/11 |
| 28 | 02:53.35–02:54.65 | Mobil iso / First → Attic | 8.0 / 8.5 / 7.0 / 7.0 | 7.0 | İncelt | likova-mobile/7, era-mobile/11 |
| 29 | 02:54.65–02:56.50 | Mobil Attic iso → Garden plan | 5.0 / 7.5 / 6.0 / 5.5 | 5.0 | Yeniden ele al | era-mobile/10, likova-mobile/13 |
| 30 | 02:56.50–02:57.40 | Mobil Garden / kamera 3 ve bakış yönü | 8.0 / N/A / 6.0 / 5.5 | 5.5 | Yeniden ele al | era-mobile/11, likova-mobile/11 |
| 31 | 02:57.40–02:58.75 | Mobil plan / Garden → Entrance | 8.0 / 8.0 / 6.0 / 5.5 | 5.5 | Yeniden ele al | era-mobile/15, era-mobile/10 |
| 32 | 02:58.75–03:00.15 | Mobil plan / Entrance → First | 8.0 / 8.0 / 5.5 / 5.0 | 5.0 | Yeniden ele al | era-mobile/15, era-mobile/10 |
| 33 | 03:00.15–03:01.45 | Mobil plan / First → Attic | 8.0 / 8.0 / 6.0 / 5.5 | 5.5 | Yeniden ele al | era-mobile/15, era-mobile/10 |
| 34 | 03:01.45–03:04.80 | Mobil plan → pratik ayrıntılar | 8.0 / 7.5 / 8.0 / 7.5 | 7.5 | İncelt | likova-mobile/19, era-mobile/17 |
| 35 | 03:04.80–03:05.55 | Mobil özellikler → merdiven | 8.5 / 8.0 / 8.5 / 8.0 | 8.0 | Koru | likova-mobile/19, era-mobile/17 |
| 36 | 03:05.55–03:08.45 | Mobil merdiven → mahalle | 8.0 / 8.0 / 8.0 / 8.0 | 8.0 | Koru | era-mobile/9, likova-mobile/8 |
| 37 | 03:08.45–03:12.55 | Mobil çevre haritası → yaşam kartı | 8.0 / 8.0 / 6.5 / 6.0 | 6.0 | İncelt | likova-mobile/10, era-mobile/8 |
| 38 | 03:12.55–03:14.40 | Mobil Journal / ilk sonbahar fotoğrafı | 8.5 / 8.0 / 8.5 / 7.5 | 7.5 | İncelt | era-mobile/13, likova-mobile/12 |
| 39 | 03:14.40–03:16.05 | Mobil / ikinci fotoğraf: spor alanı | 8.5 / 8.0 / 8.5 / 8.0 | 8.0 | Koru | likova-mobile/20, era-mobile/13 |
| 40 | 03:16.05–03:17.40 | Mobil yaşam → Ankara kültür linkleri | 8.0 / 8.0 / 8.0 / 7.5 | 7.5 | İncelt | likova-mobile/20, era-mobile/13 |
| 41 | 03:17.40–03:19.00 | Mobil seçilmiş fotoğraf galerisi | 8.0 / 8.0 / 8.0 / 7.5 | 7.5 | İncelt | likova-mobile/17, era-mobile/15 |
| 42 | 03:19.00–03:21.65 | Mobil galeri → fiyat/viewing kartı | 8.0 / 7.5 / 5.5 / 7.5 | 5.5 | Yeniden ele al | era-mobile/18, likova-mobile/10 |
| 43 | 03:21.65–03:23.25 | Mobil fotoğraftan wireframe’e | 8.0 / 8.0 / 8.0 / 8.0 | 8.0 | Koru | era-mobile/19, likova-mobile/13 |
| 44 | 03:23.25–03:27.00 | Mobil eylemler ve credits | 8.5 / 8.0 / 8.5 / 8.0 | 8.0 | Koru | likova-mobile/22, era-mobile/19 |

## Her kesitin gerekçesi, kanıtı ve 9 kabul koşulu

### Desktop / ayrıntılar

#### D01 · Aerial: gündüz → gece

[Gerçek klibi aç](../casestudy2.html#active-desktop-1) · 00:04.00–00:08.60 · **8.0/10** · Koru.

- **Devamlılık 8.5:** Aynı aerial ve ev odağı ışık değişiminde korunuyor.
- **Hareket 8.5:** Gündüzden geceye kademeli dönüşümde görünür tam siyah kesme yok.
- **Kadraj 8.0:** Villa sağda bütünüyle seçiliyor; büyük kimlik komşu çatıları örtüyor.
- **Okuma 8.0:** Ana kimlik güçlü; alt keşif etiketleri çok küçük.

Kaynak kareleri: **00:04.00** — Gündüz ve sabit kimlik; **00:07.75** — Gece ve havuz ışıkları.

**9 kabul koşulu:** Alt yönlendirmeler okunur kalmalı; sonraki gündüz kadrajına devirde bu ışık bağlamı açıklanmalı.

Referans seçkisi:

- [likova-desktop/2 · Basamaklı yüzey hero’yu açar](../casestudy2.html#likova-desktop-2): Beyaz kimlik yüzeyi ayrılırken bina alttan görünür: kimliği kamera girişinden önce bitirme sırasını al; basamak biçimini kopyalama.
- [era-desktop/5 · Havuza kamera yaklaşması](../casestudy2.html#era-desktop-5): Başlığın kameradan farklı hızla çıkması, görüntü hedefi ile kimliği ayırıyor. Angora’da aynı ritmi daha küçük bir mesafeyle kullan.

**Sınır:** Kayıt hero açıkken başlar. Yükleme ekranı veya ilk siyah örtünün davranışı bu kesitten puanlanamaz.

#### D02 · 01 / Arrival kamera durağı

[Gerçek klibi aç](../casestudy2.html#active-desktop-2) · 00:08.60–00:10.10 · **6.0/10** · İncelt.

- **Devamlılık 6.0:** Gece aerial’ından farklı gündüz açısına çift görüntüyle dönülüyor.
- **Hareket 6.5:** İlk dissolve iki ayrı ev perspektifini kısa süre üst üste bindiriyor.
- **Kadraj 8.0:** Varışta villa ve havuz sığıyor; ilk yakın kare sonradan dengeleniyor.
- **Okuma 7.5:** Arrival metni varış sonrasında açılıyor; gece kimliği önce tam ayrılamıyor.

Kaynak kareleri: **00:08.87** — İki kamera ve ışık durumu üst üste; **00:09.82** — Arrival bilgisi ve dengeli villa.

**9 kabul koşulu:** Tek ışık durumu ve eşleşen ev odağıyla devir; kimlik kapanmadan yeni kamera başlamamalı.

Referans seçkisi:

- [likova-desktop/7 · Model etrafında açı ve sayısal bilgi](../casestudy2.html#likova-desktop-7): Kamera durumuyla bilgi değişimi birlikte yönetiliyor. Alınacak şey model estetiği değil, bir açı = bir bilgi ilişkisi.
- [era-desktop/5 · Havuza kamera yaklaşması](../casestudy2.html#era-desktop-5): Yaklaşmanın belirli bir mimari hedefi var. Angora’daki her kamera parçasının da ev/havuz odağı sabit kalmalı.

**Sınır:** Klip süresi kullanıcı beklemesini içerir; bu kayıttan tek wheel hareketi sayısı veya input gecikmesi ölçülmez.

#### D03 · 02 / Perspective kamera durağı

[Gerçek klibi aç](../casestudy2.html#active-desktop-3) · 00:10.10–00:11.70 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Villa ve havuz yükselen açıda aynı mekân olarak izleniyor.
- **Hareket 8.5:** Yükseliş ve dönme tek rotada; ara karelerde siyah kesme görünmüyor.
- **Kadraj 8.0:** Çatı ve havuz birlikte okunuyor; sağ komşu bina odağı hafif dağıtıyor.
- **Okuma 7.5:** Eski Arrival metni hareket başında duruyor; Perspective bilgisi daha sonra açılıyor.

Kaynak kareleri: **00:10.38** — Kamera hareketli, Arrival yazısı hâlâ görünür; **00:11.25** — Perspective yazısı yeni açıya yerleşir.

**9 kabul koşulu:** Eski yazı hareketten önce kapanmalı; yeni bilgi varışta tek seferde açılmalı.

Referans seçkisi:

- [likova-desktop/7 · Model etrafında açı ve sayısal bilgi](../casestudy2.html#likova-desktop-7): Kamera durumuyla bilgi değişimi birlikte yönetiliyor. Alınacak şey model estetiği değil, bir açı = bir bilgi ilişkisi.
- [era-desktop/5 · Havuza kamera yaklaşması](../casestudy2.html#era-desktop-5): Yaklaşmanın belirli bir mimari hedefi var. Angora’daki her kamera parçasının da ev/havuz odağı sabit kalmalı.

**Sınır:** Klip süresi kullanıcı beklemesini içerir; bu kayıttan tek wheel hareketi sayısı veya input gecikmesi ölçülmez.

#### D04 · 03 / Garden kamera durağı

[Gerçek klibi aç](../casestudy2.html#active-desktop-4) · 00:11.70–00:13.65 · **8.0/10** · Koru.

- **Devamlılık 8.5:** Üst açıdan bahçe seviyesine villa kimliği korunarak iniliyor.
- **Hareket 8.5:** Rota alt cepheye anlaşılır biçimde yaklaşır; durakta ek solma görünmüyor.
- **Kadraj 8.5:** Bina, havuz ve sol metin alanı bu üç kameranın en dengeli kadrajı.
- **Okuma 8.0:** Garden cümlesi varıştan sonra açılır; küçük açıklama çim üzerinde hâlâ zayıf.

Kaynak kareleri: **00:12.23** — Bahçe cephesine varış; **00:12.93** — Garden bilgisi tam görünür.

**9 kabul koşulu:** Sol açıklama için sabit kontrast ve yeterli boyut; bu son kadraj çıkışta kesilmemeli.

Referans seçkisi:

- [likova-desktop/7 · Model etrafında açı ve sayısal bilgi](../casestudy2.html#likova-desktop-7): Kamera durumuyla bilgi değişimi birlikte yönetiliyor. Alınacak şey model estetiği değil, bir açı = bir bilgi ilişkisi.
- [era-desktop/5 · Havuza kamera yaklaşması](../casestudy2.html#era-desktop-5): Yaklaşmanın belirli bir mimari hedefi var. Angora’daki her kamera parçasının da ev/havuz odağı sabit kalmalı.

**Sınır:** Klip süresi kullanıcı beklemesini içerir; bu kayıttan tek wheel hareketi sayısı veya input gecikmesi ölçülmez.

#### D05 · Film → kâğıt / ilk eşik

[Gerçek klibi aç](../casestudy2.html#active-desktop-5) · 00:13.65–00:14.65 · **5.0/10** · Yeniden ele al.

- **Devamlılık 5.0:** Bahçe durağı çok hızlı biçimde üst şeride indirgeniyor.
- **Hareket 5.5:** Pencere ve villa birlikte küçülmüyor; görüntü yukarı taşınarak kesiliyor.
- **Kadraj 5.0:** 13.83 civarında çatı kayboluyor; kısa süre sonra evin kendisi de görünmez.
- **Okuma 7.0:** Paragraf, ana başlığın satır maskeleri tamamlanmadan beliriyor.

Kaynak kareleri: **00:13.83** — Çatı kesilmiş; havuz ve alt cephe kalmış; **00:14.28** — Yeni başlığın son satırı hâlâ kırpılmış.

**9 kabul koşulu:** Evin tamamını ortak odakta küçülterek koru; ardından başlık, paragraf ve ölçüler sıralanmalı.

Referans seçkisi:

- [era-desktop/20 · Fotoğraf geri çekilir, bilgi açılır](../casestudy2.html#era-desktop-20): Fotoğrafın geri çekilmesi bilgi yüzeyiyle aynı kurgu içinde. Pencere ile içindeki evin oranını birlikte yönetme ilkesini al.
- [likova-desktop/9 · Tam video ve ileri–geri katmanlar](../casestudy2.html#likova-desktop-9): Video akarken yeni metin yüzeyi görüntüyü devralıyor. Ani bölüm değişimi yerine önce gelen yüzeyi tanıtma sırası uygun. Odak: 02:33.30–02:35.50.

**Sınır:** ERA’nın kemerini veya Likova’nın basamağını Angora’ya doğrudan taşıma. Bu eşiğin sorunu dekor eksikliği değil, son kadrajın erken kaybolması.

#### D06 · Ev özeti ve alanlar

[Gerçek klibi aç](../casestudy2.html#active-desktop-6) · 00:14.65–00:16.70 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Ev anlatısı ve dört ölçü aynı kâğıt sahnesinde kalıyor.
- **Hareket 8.0:** Düşey ilerleyiş temiz; ölçü satırı başlığın ardından yukarı taşınıyor.
- **Kadraj 8.5:** İki kolon ve dört alan değeri dengeli, taşma görünmüyor.
- **Okuma 7.5:** 500/400/900/5+4 okunur; küçük açıklamalar ve ölçü dipnotu fazla soluk.

Kaynak kareleri: **00:14.83** — Başlık, açıklama ve dört değer; **00:16.13** — Ölçüler kalır; ana başlık yukarı çıkar.

**9 kabul koşulu:** Ölçü adları ve dipnot büyütülmeli; başlık çıkarken değerlerin anlamı tek başına anlaşılmalı.

Referans seçkisi:

- [era-desktop/13 · Konut tipi: görsel ve ölçü](../casestudy2.html#era-desktop-13): Görsel, kat adı ve ölçüler aynı bilgi grubunda. Angora’da da 500/400/900 bilgisini kendi açıklamasıyla birlikte tut.

**Sınır:** Sayı saydırma, dönen metin veya ek maske gerekmiyor; bu bölümün görevi evin ölçeğini açıklamak.

#### D07 · Sokak cephesine geliş

[Gerçek klibi aç](../casestudy2.html#active-desktop-7) · 00:16.70–00:18.85 · **8.0/10** · Koru.

- **Devamlılık 8.0:** Cadde cephesi ve street/garden cümlesi aynı giriş yönünü anlatıyor.
- **Hareket 8.0:** Fotoğraf ve yazı farklı hızla yükselir; iki blok arasında sert kesme yok.
- **Kadraj 8.5:** Villa çatısı, giriş yolu ve cephe bu küçük fotoğrafta birlikte sığıyor.
- **Okuma 8.0:** A quieter arrival net; bağlantı ve fotoğraf altyazısı başlığa göre çok küçük.

Kaynak kareleri: **00:17.28** — Cadde fotoğrafı ve açıklama birlikte; **00:18.05** — Ev bütünü korunmuş.

**9 kabul koşulu:** Fotoğrafa bağlı caption daha okunur olmalı; oda girişine kalan boşluk bu çiftin ritmiyle ayarlanmalı.

Referans seçkisi:

- [era-desktop/16 · Zıt kolonlar ve ön plan bitkisi](../casestudy2.html#era-desktop-16): Fotoğraf ve açıklama aynı bloktayken kolonlar farklı hızda ilerliyor. Bağımsız caption yerine bağlı bir fotoğraf–metin çifti kullan.
- [likova-desktop/6 · İki mimari detay yan yana](../casestudy2.html#likova-desktop-6): Cephe detaylarının kendi kadrajları korunuyor. Angora’da tek güçlü sokak görünümü yeterli; ikinci fotoğraf sırf efekt için eklenmemeli.

**Sınır:** Aerial ile sokak kapısı fotoğrafını aynı gelişigüzel kadrajda değiştirerek giriş yönünü belirsizleştirme.

#### D08 · Oda sütununa giriş

[Gerçek klibi aç](../casestudy2.html#active-desktop-8) · 00:18.85–00:20.70 · **8.0/10** · Koru.

- **Devamlılık 8.0:** Sokak fotoğrafı çıkarken ilk yatak odası alttan haber veriliyor.
- **Hareket 8.0:** Tek düşey yön ve ölçülü kolon farkı korunuyor.
- **Kadraj 8.0:** Birinci oda büyük; ikinci fotoğrafın kenarı sonraki mekânı duyuruyor.
- **Okuma 8.0:** Room to grow cümlesi ilk oda ile birlikte okunur; kat caption’ı küçük.

Kaynak kareleri: **00:19.35** — Sokak üstte, ilk oda altta; **00:20.68** — Oda başlığı ve ilk fotoğraf.

**9 kabul koşulu:** Kat altyazısı netleşmeli; ilk fotoğraf tam okunmadan sonraki oda baskınlaşmamalı.

Referans seçkisi:

- [era-desktop/16 · Zıt kolonlar ve ön plan bitkisi](../casestudy2.html#era-desktop-16): İç mekân fotoğraflarının farklı hizalarda ilerlemesi Angora’nın oda sırasına uygun. Görsel/caption bağı korunmalı.
- [era-desktop/17 · İç galeri → mimari eşik](../casestudy2.html#era-desktop-17): Son fotoğrafın çıkışında sonraki mimari sahnenin ilk durumu görünüyor. Bahçe girişini bu devamlılıkla kur.

**Sınır:** Üç ayrı oda resmini ERA’daki birleşme gibi tek kesintisiz görüntüymüşçesine birleştirme.

#### D09 · Yatak odası 1 → 2

[Gerçek klibi aç](../casestudy2.html#active-desktop-9) · 00:20.70–00:22.05 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** İkinci yatak odası birinciyle aynı sütunda gelir; bölüm başlığı korunur.
- **Hareket 8.0:** Düşey fotoğraf akışı düzgün; ek maske veya kararma görünmez.
- **Kadraj 8.0:** İkinci fotoğrafın daha küçük genişliği karşıt hizayı kurar, ilkten kopmaz.
- **Okuma 7.5:** Fotoğrafın kat bilgisi küçük; iki odanın farkı başlıktan anlaşılmıyor.

Kaynak kareleri: **00:21.07** — İki oda aynı sütunda; **00:21.55** — İkinci oda merkezde.

**9 kabul koşulu:** Her oda için kat ve kullanım adı net olmalı; caption fotoğrafıyla aynı hızda ilerlemeli.

Referans seçkisi:

- [era-desktop/26 · Fotoğraf sütunu ve sabit bilgiler](../casestudy2.html#era-desktop-26): Fotoğraf sütunu ilerlerken konut bilgisi sabit okunuyor. Angora’nın oda sırasına doğrudan uyan hiyerarşi.
- [era-desktop/16 · Zıt kolonlar ve ön plan bitkisi](../casestudy2.html#era-desktop-16): Fotoğraf ve caption aynı birim olarak ilerlemeli. Hareket farkı okuma ilişkisini bozmamalı.

**Sınır:** Her oda için tam ekran kamera efekti gerekmiyor; mevcut sütun hareketi bu içerik için yeterli.

#### D10 · Yatak odası 2 → 3

[Gerçek klibi aç](../casestudy2.html#active-desktop-10) · 00:22.05–00:23.90 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** İkinci odadan çatı odasına aynı düşey sıra sürer.
- **Hareket 8.0:** Üçüncü oda girerken havuz bölümünün ilk kenarı görünür; sert kesme yok.
- **Kadraj 8.0:** Eğimli tavan ve çalışma alanı üçüncü fotoğrafta seçilir.
- **Okuma 7.5:** Çatı katı caption’ı küçük; genel başlık üçüncü odanın özel bilgisini taşımıyor.

Kaynak kareleri: **00:22.55** — Çatı odası ikinci odanın altında; **00:23.17** — Çatı odası ve yaklaşan havuz.

**9 kabul koşulu:** Çatı odasının kullanımını okunur caption açıklamalı; bahçe başlığı fotoğrafın kenarıyla yarışmamalı.

Referans seçkisi:

- [era-desktop/26 · Fotoğraf sütunu ve sabit bilgiler](../casestudy2.html#era-desktop-26): Fotoğraf sütunu ilerlerken konut bilgisi sabit okunuyor. Angora’nın oda sırasına doğrudan uyan hiyerarşi.
- [era-desktop/16 · Zıt kolonlar ve ön plan bitkisi](../casestudy2.html#era-desktop-16): Fotoğraf ve caption aynı birim olarak ilerlemeli. Hareket farkı okuma ilişkisini bozmamalı.

**Sınır:** Her oda için tam ekran kamera efekti gerekmiyor; mevcut sütun hareketi bu içerik için yeterli.

#### D11 · Odalardan tam ekran havuza

[Gerçek klibi aç](../casestudy2.html#active-desktop-11) · 00:23.90–00:26.35 · **6.5/10** · İncelt.

- **Devamlılık 7.5:** Oda fotoğrafından havuz aerial’ına düşey bağ var; mekân değişimi anlaşılır.
- **Hareket 8.0:** Yeni fotoğraf alttan tam genişliğe yükseliyor; görünür siyah kesme yok.
- **Kadraj 8.0:** Bina ve havuz tam sahnede dengeli, başlık çatı üzerine geliyor.
- **Okuma 6.5:** Stay a little longer bilgisi henüz havuz aerial’ı dururken açılıyor.

Kaynak kareleri: **00:24.57** — Havuz bilgisi ve aerial; **00:26.33** — Teras metni; fotoğraf hâlâ ilk aerial.

**9 kabul koşulu:** Havuz durumu çıkmadan teras açıklaması açılmamalı; görüntü, seçili etiket ve metin birlikte değişmeli.

Referans seçkisi:

- [era-desktop/21 · Teras ve büyük kapanış başlığı](../casestudy2.html#era-desktop-21): Geniş teras ve büyük başlık tek sahne olarak alttan yerleşiyor. Angora’nın havuz girişinde aynı görüntü-önce/metin-sonra sırası uygun.
- [likova-desktop/14 · Cephe, koyu kart ve açılan görüntü](../casestudy2.html#likova-desktop-14): Görsel büyürken bilgi yüzeyi kendi eşiğini koruyor. Önceki odadan bahçeye geçişin ölçek farkını bu ilkeyle yönet. Odak: 03:21.40–03:24.00.

**Sınır:** İki fotoğrafın birleşme efekti bu geçişe uygun değil; oda ile aerial aynı kamera sahnesi değil.

#### D12 · Havuz → kapalı teras

[Gerçek klibi aç](../casestudy2.html#active-desktop-12) · 00:26.35–00:27.50 · **6.5/10** · İncelt.

- **Devamlılık 7.5:** Aynı bahçe anlatısı korunuyor, yeni açı ayrı bir yaşam durağı veriyor.
- **Hareket 8.0:** Yeni fotoğraf alttan düz bir kenarla açılır; geçiş sırasında başlık sabit.
- **Kadraj 8.5:** Teras, cephe ve havuz ikinci açıda bütünüyle görünür.
- **Okuma 6.5:** Bahçe metni 27.48’de gelirken teras fotoğrafı hâlâ tam ekrandır.

Kaynak kareleri: **00:26.55** — Teras açısı devralır; **00:27.48** — Bahçe yazısı teras resmi üzerinde.

**9 kabul koşulu:** Fotoğraf değişimi tamamlanırken ilgili etiket ve metin eşzamanlı olmalı; sonraki durak erken görünmemeli.

Referans seçkisi:

- [era-desktop/14 · Amenity: yönlü görsel değişimi](../casestudy2.html#era-desktop-14): Seçili öğe, açıklama ve fotoğraf aynı durum değişimini taşıyor. Angora’da bu senkronu koru; ERA’daki eğimli maskeyi alma.
- [likova-desktop/12 · Yaşam kolajı: kart içindeki sporcu](../casestudy2.html#likova-desktop-12): Yaşam resmi değişimi yeni bir bilgi getiriyor. Fotoğrafı aynı pencerede değiştirmek burada yeterli bir hareket.

**Sınır:** Diyagonal kesim, dekoratif çizgi veya tekrar kamera dalışı ekleme; mekân değişimini fotoğraf ve bilgi birlikte anlatıyor.

#### D13 · Teras → bahçe yolu

[Gerçek klibi aç](../casestudy2.html#active-desktop-13) · 00:27.50–00:28.60 · **7.0/10** · İncelt.

- **Devamlılık 7.5:** Terasın ardından yan bahçe yolu gelir; konu bağlantısı doğru.
- **Hareket 7.5:** Fotoğraf alttan kenar reveal’iyle girer; farklı açılar kısa süre bölünmüş görünür.
- **Kadraj 8.0:** Bahçe yolu ve cephe net; başlığın arkasındaki yapraklar kontrastı azaltır.
- **Okuma 7.0:** Bahçe cümlesi resimden önce hazırdır; finalde resim ve konu eşleşir.

Kaynak kareleri: **00:27.80** — Teras üstte, bahçe yolu altta; **00:28.18** — Bahçe yolu tam görünür.

**9 kabul koşulu:** Yeni bahçe yazısını erken açma; iki yarım açıyı okuma durağı olarak bırakma.

Referans seçkisi:

- [era-desktop/14 · Amenity: yönlü görsel değişimi](../casestudy2.html#era-desktop-14): Seçili öğe, açıklama ve fotoğraf aynı durum değişimini taşıyor. Angora’da bu senkronu koru; ERA’daki eğimli maskeyi alma.
- [likova-desktop/12 · Yaşam kolajı: kart içindeki sporcu](../casestudy2.html#likova-desktop-12): Yaşam resmi değişimi yeni bir bilgi getiriyor. Fotoğrafı aynı pencerede değiştirmek burada yeterli bir hareket.

**Sınır:** Diyagonal kesim, dekoratif çizgi veya tekrar kamera dalışı ekleme; mekân değişimini fotoğraf ve bilgi birlikte anlatıyor.

#### D14 · Bahçeden salon anlatısına

[Gerçek klibi aç](../casestudy2.html#active-desktop-14) · 00:28.60–00:30.20 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Bahçe görüntüsü kâğıt salon bölümünün üstünde devam eder.
- **Hareket 7.5:** Düşey yüzey devri temiz; gelişte uzun boş kâğıt bandı oluşur.
- **Kadraj 8.0:** Bahçe kapanırken salonun geniş fotoğrafı yeni oda ölçeğini kuruyor.
- **Okuma 8.0:** Come together ve salon açıklaması anlaşılır sırada açılır.

Kaynak kareleri: **00:29.03** — Bahçe üstte, kâğıt yüzey altta; **00:29.60** — Salon başlığı ve ilk fotoğraf.

**9 kabul koşulu:** Boş kâğıt aralığı kısaltılmalı; salon fotoğrafının ilk kenarı bahçenin sonuyla daha yakın bağlanmalı.

Referans seçkisi:

- [era-desktop/15 · İkinci kavis: iç mekâna giriş](../casestudy2.html#era-desktop-15): Önceki amenity fotoğrafının üstünde yeni iç mekân yüzeyi görünür. Kavis şeklinden önce bu yüzey devralma sırasını al.
- [likova-desktop/15 · Mimar kartı → lobi](../casestudy2.html#likova-desktop-15): Bilgi kartı dış cephe ile lobi arasında anlatım köprüsü oluyor. Bahçe → salon bağlantısında küçük bir bilgi eşiği işe yarar.

**Sınır:** Son dış fotoğrafı gereksiz bir boş kutuya küçültme. Yeni iç mekân yüzeyi yeterli anlatı eşiği sağlar.

#### D15 · Salon ve ikinci açı

[Gerçek klibi aç](../casestudy2.html#active-desktop-15) · 00:30.20–00:32.70 · **8.0/10** · Koru.

- **Devamlılık 8.5:** Büyük salon ve küçük ikinci açı aynı mekânı tamamlıyor.
- **Hareket 8.5:** Fotoğraf, paragraf ve ikinci açı farklı hizalarda tutarlı ilerliyor.
- **Kadraj 8.5:** Büyük fotoğraf oda ölçeğini, küçük fotoğraf bağlantıyı gösteriyor.
- **Okuma 8.0:** Salon kullanım paragrafı okunur; ikinci açının caption’ı küçük.

Kaynak kareleri: **00:30.88** — Salon ve kullanım açıklaması; **00:31.78** — İkinci açı alttan tamamlar.

**9 kabul koşulu:** İkinci açının kısa bilgisi büyütülmeli; fotoğraf–metin çifti birlikte okunur bir durak bırakmalı.

Referans seçkisi:

- [era-desktop/16 · Zıt kolonlar ve ön plan bitkisi](../casestudy2.html#era-desktop-16): Büyük ve küçük fotoğrafların farklı hizalarda okunması bu bölümün ölçeğine uygun.
- [likova-desktop/17 · Lobi görseli, sayılar ve galeri](../casestudy2.html#likova-desktop-17): Ana mekân fotoğrafı ve ardından gelen ayrıntılar aynı bilgi sırasını koruyor. Salon → ikinci açı sırasını bu sadelikle sürdür. Odak: 03:44.75–03:49.35.

**Sınır:** Büyük salon görüntüsünün üzerine sırf malzeme referansı için kayan küre, panel veya yapay 3D parçalar ekleme.

#### D16 · Salondan özel yatak odasına

[Gerçek klibi aç](../casestudy2.html#active-desktop-16) · 00:32.70–00:36.40 · **7.5/10** · İncelt.

- **Devamlılık 7.5:** Salonun küçük açısı ile yeni özel oda arasında geniş kâğıt boşluğu var.
- **Hareket 8.0:** Düşey yön sürer; küçük ve büyük resimler belirgin hız sıçraması yapmaz.
- **Kadraj 8.0:** Yatak odası ve giyinme resmi doğru konuları taşır; üstte önceki oda uzun kalır.
- **Okuma 8.0:** Privacy açıklaması yerleşince nettir; giyinme bilgisi çok küçük.

Kaynak kareleri: **00:33.70** — İki mekân arasında geniş kâğıt alan; **00:35.05** — Yatak odası ve giyinme detayı.

**9 kabul koşulu:** Yeni başlık ilk yatak odasına yakınlaşmalı; salonun son detayı boşluğu gereksiz uzatmamalı.

Referans seçkisi:

- [era-desktop/16 · Zıt kolonlar ve ön plan bitkisi](../casestudy2.html#era-desktop-16): Farklı fotoğraf büyüklükleri ve açıklamalar tek akışta kalabiliyor. Boşlukları bu fotoğraf ilişkisi belirlesin.

**Sınır:** Salon ile yatak odasının görüntülerini aynı mimari sahneymiş gibi eritme; iki odanın kimliği ayrı kalmalı.

#### D17 · Kâğıttan yeşil mutfak sahnesine

[Gerçek klibi aç](../casestudy2.html#active-desktop-17) · 00:36.40–00:38.65 · **8.0/10** · Koru.

- **Devamlılık 8.0:** Özel odadan mutfağa kâğıt–yeşil yüzey sınırı anlaşılır.
- **Hareket 8.0:** Yeşil yüzey, ilk mutfak ve başlık aynı düşey yönle yerleşir.
- **Kadraj 8.5:** İlk mutfak geniş ve tam; başlık fotoğrafı örtmez.
- **Okuma 8.0:** Üç farklı mutfak bilgisi ilk resimle doğru bağlanır; caption küçük.

Kaynak kareleri: **00:37.02** — Yeşil yüzey ilk mutfağı getirir; **00:37.82** — Gather ve mutfak birlikte.

**9 kabul koşulu:** İlk mutfağın kat caption’ı güçlenmeli; başlık ve resim aynı okunur durakta buluşmalı.

Referans seçkisi:

- [likova-desktop/18 · İnsan videosu → çalışma alanı](../casestudy2.html#likova-desktop-18): Video/önceki içerik, koyu çalışma alanı yüzeyi ve mekân fotoğrafı sırayla açılıyor. Alınacak şey bu net sıra. Odak: 03:52.50–03:54.90.
- [era-desktop/15 · İkinci kavis: iç mekâna giriş](../casestudy2.html#era-desktop-15): Yeni bölümün rengi başlığa zemin oluşturuyor. Angora’da bunu düz ve sade bir eşikle yap.

**Sınır:** Her renk değişiminde aynı dev maske şakasını tekrarlama. Bu ara geçiş sakin bir yüzey değişimi olarak kalabilir.

#### D18 · Ana mutfak → bahçe mutfağı

[Gerçek klibi aç](../casestudy2.html#active-desktop-18) · 00:38.65–00:40.15 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Ana mutfaktan bahçe mutfağına aynı fotoğraf sütunu sürer.
- **Hareket 8.0:** Düşey hareket temiz; eski ve yeni fotoğraf düzenli aralıkla gelir.
- **Kadraj 8.0:** İkinci mutfak daha dar fotoğrafla ayrışır; tezgâh ilişkisi seçilebilir.
- **Okuma 7.5:** Caption kullanım farkını söyler ama boyutu zayıf.

Kaynak kareleri: **00:39.05** — İlk ve ikinci mutfak birlikte; **00:39.60** — Bahçe mutfağı merkezde.

**9 kabul koşulu:** Bahçe mutfağının bağımsız kullanım bilgisi fotoğraf kadar kolay okunmalı.

Referans seçkisi:

- [era-desktop/26 · Fotoğraf sütunu ve sabit bilgiler](../casestudy2.html#era-desktop-26): Bir fotoğraf sütununda mekân bilgisi korunuyor. Mutfakların farklılığını okutan bir ritim.
- [likova-desktop/20 · Altyapı: çok görüntülü basamaklı akış](../casestudy2.html#likova-desktop-20): Her yeni görüntünün kendi kullanım açıklaması var. Çok görüntü kullanmayı haklı çıkaran şey içerik değişimi; şekilli maskeler değil.

**Sınır:** Üç mutfağı tek resimmiş gibi morph etme. Ortak genişlik ve düzenli aralık bu sahneyi zaten birleştiriyor.

#### D19 · Bahçe mutfağı → çatı mutfağı

[Gerçek klibi aç](../casestudy2.html#active-desktop-19) · 00:40.15–00:42.15 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Bahçe mutfağından üst kat kitchenette’e sıra bozulmadan geçer.
- **Hareket 8.0:** Son fotoğraf çıkarken beyaz model bölümü önceden görünür.
- **Kadraj 7.5:** Üçüncü görüntü daha küçük; tezgâh ve giriş bütünlüğü yine seçilir.
- **Okuma 7.5:** Üst kat caption’ı okunması zor bir alt satır olarak kalır.

Kaynak kareleri: **00:40.68** — Üst mutfak gelir; **00:41.42** — Kitchenette ve model eşiği.

**9 kabul koşulu:** Üst mutfağın kat bilgisi büyümeli; model ancak bu son fotoğrafın duruşu okununca devralmalı.

Referans seçkisi:

- [era-desktop/26 · Fotoğraf sütunu ve sabit bilgiler](../casestudy2.html#era-desktop-26): Bir fotoğraf sütununda mekân bilgisi korunuyor. Mutfakların farklılığını okutan bir ritim.
- [likova-desktop/20 · Altyapı: çok görüntülü basamaklı akış](../casestudy2.html#likova-desktop-20): Her yeni görüntünün kendi kullanım açıklaması var. Çok görüntü kullanmayı haklı çıkaran şey içerik değişimi; şekilli maskeler değil.

**Sınır:** Üç mutfağı tek resimmiş gibi morph etme. Ortak genişlik ve düzenli aralık bu sahneyi zaten birleştiriyor.

#### D20 · Fotoğraftan isometrik bahçe katına

[Gerçek klibi aç](../casestudy2.html#active-desktop-20) · 00:42.15–00:44.45 · **6.0/10** · İncelt.

- **Devamlılık 7.5:** Fotoğraf anlatısından teknik beyaz sahneye konu değişimi açık.
- **Hareket 7.5:** Model alttan gelir; metin ve model yeni sahnede aynı anda sabitlenmez.
- **Kadraj 6.0:** Garden modeli sağda ve aşağıda arsa sınırlarından kırpılmıştır.
- **Okuma 7.5:** Garden adı okunur; detay metni ve dört kat seçimi küçük.

Kaynak kareleri: **00:43.60** — Beyaz sahne modeli devralır; **00:44.43** — Garden arsa kenarları pencereye dayanır.

**9 kabul koşulu:** Bütün arsa, havuz ve yapı sabit contain kadrajına sığmalı; tüm katlar aynı merkez ve ölçekte kalmalı.

Referans seçkisi:

- [likova-desktop/13 · Yaşamdan master plan’a](../casestudy2.html#likova-desktop-13): Beyaz teknik yüzey, bütün model ve 3D çağrısını tek sahnede topluyor. Angora’da modelin sınırlarını önce, kat açıklamasını ardından okutmak bu ilişkiden bir uyarlama. Odak: 03:17.50–03:20.90.
- [era-desktop/13 · Konut tipi: görsel ve ölçü](../casestudy2.html#era-desktop-13): Kat adı ve ölçü, modeli açıklayan bir grup olarak yerleşiyor; bağımsız süs animasyonu değil.

**Sınır:** İsometriyi fotoğraf gibi cover ile kırpma. Evin tabanını, havuzu ve sınırı model sunumunun bütününde koru.

#### D21 · Iso / Garden → Entrance

[Gerçek klibi aç](../casestudy2.html#active-desktop-21) · 00:44.45–00:45.35 · **6.5/10** · İncelt.

- **Devamlılık 7.5:** Katlar aynı izometrik yönde bağlıdır; başlangıç Garden ölçeği büyük.
- **Hareket 8.0:** Kat yükselmesi düzgün; model ilerlerken eski metin solar.
- **Kadraj 6.5:** Entrance sonunda arsa sığar; Garden başlangıcındaki kırpım ölçek farkı yaratır.
- **Okuma 7.0:** Model değişimi, kat adı ve açıklamanın görünmesi aynı anda bitmez.

Kaynak kareleri: **00:44.68** — Model yükselir, Garden metni solar; **00:45.02** — Entrance ve yeni açıklama.

**9 kabul koşulu:** Garden ve Entrance konturu aynı kadrajda sığmalı; yeni metin son model durumuna tek tetikle bağlanmalı.

Referans seçkisi:

- [likova-desktop/7 · Model etrafında açı ve sayısal bilgi](../casestudy2.html#likova-desktop-7): Kamera durumu ile sayısal bilgi birlikte değişiyor. Angora’da aynı senkron ilkesi kat/model metnine uygulanmalı.
- [era-desktop/14 · Amenity: yönlü görsel değişimi](../casestudy2.html#era-desktop-14): Görsel ve seçili bilgi tek durumdan yönetiliyor. Kat metnini modelden ayrı timer’larla geciktirme.

**Sınır:** Likova’daki orbit hareketini kat kesiti değişimine aynen uygulama. Burada yönü sabit tutmak katların ilişkisini anlatıyor.

#### D22 · Iso / Entrance → First

[Gerçek klibi aç](../casestudy2.html#active-desktop-22) · 00:45.35–00:46.35 · **7.0/10** · İncelt.

- **Devamlılık 8.0:** Entrance’tan bedroom katına aynı bina ekseni sürer.
- **Hareket 8.5:** Kat eklenmesi anlaşılır ve temiz; metin ayrıca opasite değiştirir.
- **Kadraj 7.5:** Başlangıç ve final model merkezleri yakın, teknik detay ölçeği küçük.
- **Okuma 7.0:** First bilgisi eski metnin solmasından sonra gelir; arada okuma boşluğu vardır.

Kaynak kareleri: **00:45.62** — Yeni kat geometrisi oluşur; **00:45.98** — First adı ve yeni metin.

**9 kabul koşulu:** First duruşunda seçili tab, alt etiket ve paragraf tek seferde görünmeli; ekstra solma tekrarlanmamalı.

Referans seçkisi:

- [likova-desktop/7 · Model etrafında açı ve sayısal bilgi](../casestudy2.html#likova-desktop-7): Kamera durumu ile sayısal bilgi birlikte değişiyor. Angora’da aynı senkron ilkesi kat/model metnine uygulanmalı.
- [era-desktop/14 · Amenity: yönlü görsel değişimi](../casestudy2.html#era-desktop-14): Görsel ve seçili bilgi tek durumdan yönetiliyor. Kat metnini modelden ayrı timer’larla geciktirme.

**Sınır:** Likova’daki orbit hareketini kat kesiti değişimine aynen uygulama. Burada yönü sabit tutmak katların ilişkisini anlatıyor.

#### D23 · Iso / First → Attic

[Gerçek klibi aç](../casestudy2.html#active-desktop-23) · 00:46.35–00:48.05 · **7.0/10** · İncelt.

- **Devamlılık 8.0:** First’tan Attic’e aynı yönde devam eder; ardından plan yaklaşır.
- **Hareket 8.0:** Attic katı oluşurken metin ayrıca kapanıp açılır.
- **Kadraj 7.5:** Attic odaları seçilir; finalde düşey çıkış modelin altını hızla kesmeye başlar.
- **Okuma 7.0:** Room for another rhythm ancak model varışından sonra tam belirir.

Kaynak kareleri: **00:46.82** — Attic oluşurken yazı boşluğu; **00:47.42** — Attic ve yeni metin tamamlanır.

**9 kabul koşulu:** Attic için tam bir bilgi durağı bırakılmalı; plan eşiği bu duruşun sonunu erken kesmemeli.

Referans seçkisi:

- [likova-desktop/7 · Model etrafında açı ve sayısal bilgi](../casestudy2.html#likova-desktop-7): Kamera durumu ile sayısal bilgi birlikte değişiyor. Angora’da aynı senkron ilkesi kat/model metnine uygulanmalı.
- [era-desktop/14 · Amenity: yönlü görsel değişimi](../casestudy2.html#era-desktop-14): Görsel ve seçili bilgi tek durumdan yönetiliyor. Kat metnini modelden ayrı timer’larla geciktirme.

**Sınır:** Likova’daki orbit hareketini kat kesiti değişimine aynen uygulama. Burada yönü sabit tutmak katların ilişkisini anlatıyor.

#### D24 · Attic iso → Garden plan / kimlik kopuşu

[Gerçek klibi aç](../casestudy2.html#active-desktop-24) · 00:48.05–00:50.25 · **5.0/10** · Yeniden ele al.

- **Devamlılık 5.0:** Attic iso biterken Garden planı gelir; seçili kat açıklanmadan sıfırlanır.
- **Hareket 7.5:** Düşey devir akıcıdır fakat ortak bina konturundan plan ilişkisi kurulmaz.
- **Kadraj 8.0:** Plan ve fotoğraf geniş iki alana yerleşir; evin dış sınırı seçilir.
- **Okuma 6.5:** Büyük kamera pinleri oda adlarını ve bakış konilerini bastırır.

Kaynak kareleri: **00:48.05** — Attic iso hâlâ seçili; **00:48.65** — Garden planı ve living room.

**9 kabul koşulu:** Önce Attic’in kendi planına bağlanmalı; kat değişimi ayrıca açık bir seçim veya anlatı sırası olmalı.

Referans seçkisi:

- [era-desktop/25 · Plan kartı → daire detayı](../casestudy2.html#era-desktop-25): Seçilen plan, aynı konutun bilgisine bağlanıyor; seçim kimliği değişmiyor. Angora’da seçili kat korunmalı.
- [likova-desktop/13 · Yaşamdan master plan’a](../casestudy2.html#likova-desktop-13): Bütün modeli okunur tutan teknik eşik, plan geçişinin ön koşulu. Buradan rastgele kamera uçuşu alma. Odak: 03:17.50–03:20.90.

**Sınır:** Referanslarda birebir floor-to-plan morph yok. Bu öneri Likova’nın bütün model mantığı ile ERA’nın plan-bilgi hiyerarşisinden yapılan tasarım çıkarımıdır.

#### D25 · Plan / Garden → Entrance

[Gerçek klibi aç](../casestudy2.html#active-desktop-25) · 00:50.25–00:52.25 · **6.5/10** · İncelt.

- **Devamlılık 8.0:** Garden ve Entrance plan–fotoğraf çiftleri aynı yatay sırada ilerler.
- **Hareket 8.0:** Ray yönü tutarlı; ara durumda eski fotoğraf ve yeni plan yan yana görünür.
- **Kadraj 7.5:** Entrance planı sığar; beyaz pinler kontura göre fazla baskındır.
- **Okuma 6.5:** Living room fotoğrafı konuya uyar; aktif bakış yönü pin numarası kadar seçilemez.

Kaynak kareleri: **00:50.78** — Entrance planı ve kendi fotoğrafı; **00:51.52** — Plan ve living-room bilgisi sabit.

**9 kabul koşulu:** Plan+fotoğraf tek bir kat birimi gibi taşınmalı; aktif kamera konisi ve oda adları numaralardan daha açık okunmalı.

Referans seçkisi:

- [era-desktop/10 · Düşey scroll, yatay konum akışı](../casestudy2.html#era-desktop-10): Fotoğraf ile başlık aynı gerçek yatay rayda ilerliyor. Plan+fotoğraf çifti bu rayın tek birimi olmalı.
- [era-desktop/25 · Plan kartı → daire detayı](../casestudy2.html#era-desktop-25): Plan ve oda/alan bilgisi birlikte okunuyor. Angora’nın teknik planını hareket süsünden daha fazla önemse.

**Sınır:** Konturları yeniden çizerek oluşturma, diyagonal bölme veya her pin için ayrı pop efekti ekleme. Öncelik teknik okunurluk.

#### D26 · Plan / Entrance → First

[Gerçek klibi aç](../casestudy2.html#active-desktop-26) · 00:52.25–00:54.25 · **6.0/10** · İncelt.

- **Devamlılık 8.0:** Salon katından bedroom katına yön ve fotoğraf ilişkisi korunur.
- **Hareket 8.0:** Tek yatay geçiş vardır; konturlar çizilerek yeniden oluşturulmaz.
- **Kadraj 7.5:** First planındaki yoğun pinler dar koridor alanını doldurur.
- **Okuma 6.0:** Oda isimleri ve koniler çok sayıdaki beyaz noktalar arasında kaybolur.

Kaynak kareleri: **00:52.78** — First planı ve bedroom fotoğrafı; **00:53.52** — Yoğun pinli First durağı.

**9 kabul koşulu:** Pasif pinler küçülmeli; seçili oda adı ve bakış yönü çakışmadan okunmalı. First fotoğrafı aktif pinle aynı anda sabitlenmeli.

Referans seçkisi:

- [era-desktop/10 · Düşey scroll, yatay konum akışı](../casestudy2.html#era-desktop-10): Fotoğraf ile başlık aynı gerçek yatay rayda ilerliyor. Plan+fotoğraf çifti bu rayın tek birimi olmalı.
- [era-desktop/25 · Plan kartı → daire detayı](../casestudy2.html#era-desktop-25): Plan ve oda/alan bilgisi birlikte okunuyor. Angora’nın teknik planını hareket süsünden daha fazla önemse.

**Sınır:** Konturları yeniden çizerek oluşturma, diyagonal bölme veya her pin için ayrı pop efekti ekleme. Öncelik teknik okunurluk.

#### D27 · Plan / First → Attic

[Gerçek klibi aç](../casestudy2.html#active-desktop-27) · 00:54.25–00:55.55 · **6.5/10** · İncelt.

- **Devamlılık 8.0:** Bedroom fotoğrafından Attic sitting-area’ya kat sırası korunur.
- **Hareket 8.0:** İki kat aynı yatay rayda ve aynı yönde değişir.
- **Kadraj 8.0:** Attic planı First’a göre daha az kalabalık; fotoğrafla dengeli yerleşir.
- **Okuma 6.5:** Kat adı ve oda fotoğrafı net; küçük oda yazısı ile koniler yine zayıf.

Kaynak kareleri: **00:54.60** — Attic planı devralır; **00:55.07** — Attic ve sitting-area durağı.

**9 kabul koşulu:** Attic planında da koni okunmalı; fotoğraf ve kat etiketi değişimi rayın tamamlanmasına bağlanmalı.

Referans seçkisi:

- [era-desktop/10 · Düşey scroll, yatay konum akışı](../casestudy2.html#era-desktop-10): Fotoğraf ile başlık aynı gerçek yatay rayda ilerliyor. Plan+fotoğraf çifti bu rayın tek birimi olmalı.
- [era-desktop/25 · Plan kartı → daire detayı](../casestudy2.html#era-desktop-25): Plan ve oda/alan bilgisi birlikte okunuyor. Angora’nın teknik planını hareket süsünden daha fazla önemse.

**Sınır:** Konturları yeniden çizerek oluşturma, diyagonal bölme veya her pin için ayrı pop efekti ekleme. Öncelik teknik okunurluk.

#### D28 · Plan → Garden iso / ilk geri ziyaret

[Gerçek klibi aç](../casestudy2.html#active-desktop-28) · 00:55.55–00:56.35 · **4.5/10** · Yeniden ele al.

- **Devamlılık 4.5:** Attic planından Garden iso’ya geri dönülür; aynı kat kimliği korunmaz.
- **Hareket 5.5:** Çok kısa düşey dönüşte plan fotoğrafı ve model parçaları aynı anda görünür.
- **Kadraj 7.0:** Model yeniden büyük Garden kadrajını alır; önceki plan odağı kaybolur.
- **Okuma 6.0:** Sitting-area bilgisi ile yeni Garden açıklaması arasında anlam bağı yok.

Kaynak kareleri: **00:55.55** — Attic plan ve fotoğrafı; **00:56.05** — Garden iso yeniden görünür.

**9 kabul koşulu:** Geri dönüş aynı katın iso’suna ve aynı ölçeğe yapılmalı; plan seçimi geri gelindiğinde korunmalı.

Referans seçkisi:

- [era-desktop/23 · Aynı geçişin geri okunması](../casestudy2.html#era-desktop-23): Geri dönüş aynı kompozisyonu yeniden kuruyor. Angora’nın kat kimliği de geriye giderken resetlenmemeli.
- [likova-desktop/9 · Tam video ve ileri–geri katmanlar](../casestudy2.html#likova-desktop-9): Desktop kaydında ileri–geri yüzeyler aynı film bağlamına dönüyor. Kat kimliğinin de geri dönüşte resetlenmemesi uygun bir çıkarım. Odak: 02:33.30–02:35.50.

**Sınır:** Kayıt hangi input yolunun tetiklediğini her seferinde göstermiyor. Bunu kanıtlanmış wheel kilidi diye değil, görülen durum sıçraması olarak değerlendir.

#### D29 · Iso / Garden → Entrance · tekrar

[Gerçek klibi aç](../casestudy2.html#active-desktop-29) · 00:56.35–00:56.95 · **6.5/10** · İncelt.

- **Devamlılık 7.5:** İkinci ziyaret Garden’dan Entrance’a aynı bina ekseninde ilerler.
- **Hareket 8.0:** Kat yükselmesi yine düzgün; paragraf hareket sırasında belirgin solar.
- **Kadraj 6.5:** Garden başlangıcı büyük, Entrance sonunda arsa daha iyi sığar.
- **Okuma 7.0:** Kat bilgisi model hareketinin ardından değişir; okuma boşluğu tekrar eder.

Kaynak kareleri: **00:56.35** — İkinci ziyaret Garden başlangıcı; **00:56.72** — Entrance oluşmuş; bilgi geçişi.

**9 kabul koşulu:** İlk ziyaretle aynı sorun: Garden ve Entrance aynı contain ölçeğinde ve tek bilgi senkronunda olmalı.

Tekrar ziyaret: Iso / Garden → Entrance. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [likova-desktop/7 · Model etrafında açı ve sayısal bilgi](../casestudy2.html#likova-desktop-7): Kamera durumu ile sayısal bilgi birlikte değişiyor. Angora’da aynı senkron ilkesi kat/model metnine uygulanmalı.
- [era-desktop/14 · Amenity: yönlü görsel değişimi](../casestudy2.html#era-desktop-14): Görsel ve seçili bilgi tek durumdan yönetiliyor. Kat metnini modelden ayrı timer’larla geciktirme.

**Sınır:** Likova’daki orbit hareketini kat kesiti değişimine aynen uygulama. Burada yönü sabit tutmak katların ilişkisini anlatıyor.

#### D30 · Iso / Entrance → First · tekrar

[Gerçek klibi aç](../casestudy2.html#active-desktop-30) · 00:56.95–00:57.55 · **7.0/10** · İncelt.

- **Devamlılık 8.0:** İkinci Entrance→First aynı merkez ve kat sırasını korur.
- **Hareket 8.5:** Kısa kesitte geometri temiz yükselir; metin yine ayrı fade yapar.
- **Kadraj 7.5:** First bina bütünü sığar; küçük teknik detaylar sınırlı kalır.
- **Okuma 7.0:** First adı okunur, açıklama modelden sonra tam opaklığa gelir.

Kaynak kareleri: **00:57.12** — Kat dönüşümü ve solan açıklama; **00:57.32** — First adı görünür.

**9 kabul koşulu:** Model, aktif kat ve First paragrafı birlikte tamamlanmalı; ziyaret tekrarında bilgi yeniden gereksiz solmamalı.

Tekrar ziyaret: Iso / Entrance → First. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [likova-desktop/7 · Model etrafında açı ve sayısal bilgi](../casestudy2.html#likova-desktop-7): Kamera durumu ile sayısal bilgi birlikte değişiyor. Angora’da aynı senkron ilkesi kat/model metnine uygulanmalı.
- [era-desktop/14 · Amenity: yönlü görsel değişimi](../casestudy2.html#era-desktop-14): Görsel ve seçili bilgi tek durumdan yönetiliyor. Kat metnini modelden ayrı timer’larla geciktirme.

**Sınır:** Likova’daki orbit hareketini kat kesiti değişimine aynen uygulama. Burada yönü sabit tutmak katların ilişkisini anlatıyor.

#### D31 · Iso / First → Attic · tekrar

[Gerçek klibi aç](../casestudy2.html#active-desktop-31) · 00:57.55–00:58.45 · **7.0/10** · İncelt.

- **Devamlılık 8.0:** İkinci Attic varışı aynı kat devamlılığını korur.
- **Hareket 8.0:** Attic oluştuktan hemen sonra sayfa çıkışı başlar; yeni durak kısa kalır.
- **Kadraj 7.5:** Bina ve havuz birlikte görünür; kesit sonunda model yukarı çıkar.
- **Okuma 7.0:** Attic açıklaması kısa süre okunur, ardından plan bölümü yaklaşır.

Kaynak kareleri: **00:57.78** — Attic katı oluşur; **00:58.12** — Attic açıklaması görünür.

**9 kabul koşulu:** Attic metni tamamlanmadan bölüm çıkışı başlamamalı; hızlı inputta dahi tam varış karesi korunmalı.

Tekrar ziyaret: Iso / First → Attic. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [likova-desktop/7 · Model etrafında açı ve sayısal bilgi](../casestudy2.html#likova-desktop-7): Kamera durumu ile sayısal bilgi birlikte değişiyor. Angora’da aynı senkron ilkesi kat/model metnine uygulanmalı.
- [era-desktop/14 · Amenity: yönlü görsel değişimi](../casestudy2.html#era-desktop-14): Görsel ve seçili bilgi tek durumdan yönetiliyor. Kat metnini modelden ayrı timer’larla geciktirme.

**Sınır:** Likova’daki orbit hareketini kat kesiti değişimine aynen uygulama. Burada yönü sabit tutmak katların ilişkisini anlatıyor.

#### D32 · Attic iso → Garden plan · tekrar

[Gerçek klibi aç](../casestudy2.html#active-desktop-32) · 00:58.45–00:59.60 · **5.0/10** · Yeniden ele al.

- **Devamlılık 5.0:** İkinci devir de Attic’ten Garden plana sıfırlanır.
- **Hareket 7.5:** Kâğıt yüzey aynı yönde gelir; kat kimliğini bağlayan ara durum yoktur.
- **Kadraj 8.0:** Garden plan ve living-room fotoğrafı sığar.
- **Okuma 6.5:** Aynı büyük pinler, düşük kontrastlı oda adları ve koniler tekrar görülür.

Kaynak kareleri: **00:58.45** — Attic iso çıkışı; **00:59.17** — Garden plan yeniden seçili.

**9 kabul koşulu:** İkinci ziyaret de aynı katı korumalı; plan girişinin başlangıç durumu Garden’a zorlanmamalı.

Tekrar ziyaret: Attic iso → Garden plan / kimlik kopuşu. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [era-desktop/25 · Plan kartı → daire detayı](../casestudy2.html#era-desktop-25): Seçilen plan, aynı konutun bilgisine bağlanıyor; seçim kimliği değişmiyor. Angora’da seçili kat korunmalı.
- [likova-desktop/13 · Yaşamdan master plan’a](../casestudy2.html#likova-desktop-13): Bütün modeli okunur tutan teknik eşik, plan geçişinin ön koşulu. Buradan rastgele kamera uçuşu alma. Odak: 03:17.50–03:20.90.

**Sınır:** Referanslarda birebir floor-to-plan morph yok. Bu öneri Likova’nın bütün model mantığı ile ERA’nın plan-bilgi hiyerarşisinden yapılan tasarım çıkarımıdır.

#### D33 · Plan / Garden → Entrance · tekrar

[Gerçek klibi aç](../casestudy2.html#active-desktop-33) · 00:59.60–01:01.20 · **6.5/10** · İncelt.

- **Devamlılık 7.5:** İkinci plan rayı Entrance’a gider; sonda oda fotoğrafı da değişmeye başlar.
- **Hareket 8.0:** Yatay kat değişimi düzgün; son fotoğraf dissolve’i ayrı hareket getirir.
- **Kadraj 7.5:** Plan–fotoğraf dengesi korunur; pinler hâlâ baskın.
- **Okuma 6.5:** Son karede Storage adı ve yeni fotoğraf görünmeye başlar; kayıt bütün kamera seçimini açıklamaz.

Kaynak kareleri: **01:00.03** — Entrance planı ve salon; **01:01.18** — Storage bilgisi ve fotoğraf dissolve’i.

**9 kabul koşulu:** Kat geçişi ve kamera fotoğrafı seçimi ayrı, açık durumlar olmalı; birinin bitişi diğerini belirsiz başlatmamalı.

Tekrar ziyaret: Plan / Garden → Entrance. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [era-desktop/10 · Düşey scroll, yatay konum akışı](../casestudy2.html#era-desktop-10): Fotoğraf ile başlık aynı gerçek yatay rayda ilerliyor. Plan+fotoğraf çifti bu rayın tek birimi olmalı.
- [era-desktop/25 · Plan kartı → daire detayı](../casestudy2.html#era-desktop-25): Plan ve oda/alan bilgisi birlikte okunuyor. Angora’nın teknik planını hareket süsünden daha fazla önemse.

**Sınır:** Konturları yeniden çizerek oluşturma, diyagonal bölme veya her pin için ayrı pop efekti ekleme. Öncelik teknik okunurluk.

#### D34 · Plan → Garden iso / ikinci geri ziyaret

[Gerçek klibi aç](../casestudy2.html#active-desktop-34) · 01:01.20–01:02.10 · **5.0/10** · Yeniden ele al.

- **Devamlılık 5.0:** Entrance planından Garden iso’ya dönülür; seçilen kat bir geriye düşer.
- **Hareket 5.5:** Düşey geri devir çok kısa; iki teknik bölüm yarım halde aynı anda görünür.
- **Kadraj 7.0:** Garden modelinin ilk büyük kadrajı tekrar gelir.
- **Okuma 6.0:** Storage/salon bilgisi çıkarken Garden açıklaması bağ kurmadan belirir.

Kaynak kareleri: **01:01.20** — Entrance planı ve değişen fotoğraf; **01:01.77** — Garden modeline dönülmüş.

**9 kabul koşulu:** Entrance planından Entrance iso’ya dön; seçili kamera ve kat geri gelişte saklanmalı.

Tekrar ziyaret: Plan → Garden iso / ilk geri ziyaret. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [era-desktop/23 · Aynı geçişin geri okunması](../casestudy2.html#era-desktop-23): Geri dönüş aynı kompozisyonu yeniden kuruyor. Angora’nın kat kimliği de geriye giderken resetlenmemeli.
- [likova-desktop/9 · Tam video ve ileri–geri katmanlar](../casestudy2.html#likova-desktop-9): Desktop kaydında ileri–geri yüzeyler aynı film bağlamına dönüyor. Kat kimliğinin de geri dönüşte resetlenmemesi uygun bir çıkarım. Odak: 02:33.30–02:35.50.

**Sınır:** Kayıt hangi input yolunun tetiklediğini her seferinde göstermiyor. Bunu kanıtlanmış wheel kilidi diye değil, görülen durum sıçraması olarak değerlendir.

#### D35 · Iso / Garden → Entrance · 3. ziyaret

[Gerçek klibi aç](../casestudy2.html#active-desktop-35) · 01:02.10–01:02.80 · **6.5/10** · İncelt.

- **Devamlılık 7.5:** Üçüncü Garden→Entrance ziyaretinde aynı mekân ekseni sürer.
- **Hareket 8.0:** Kat yükselmesi düzgün, bilgi opasitesi yine ayrı değişir.
- **Kadraj 6.5:** Garden ilk karede geniş ve kırpılmış; Entrance daha derli toplu.
- **Okuma 7.0:** Yeni kat adı görünürken eski açıklama kısa süre zayıflar.

Kaynak kareleri: **01:02.10** — Üçüncü Garden başlangıcı; **01:02.53** — Entrance ve yeni açıklama.

**9 kabul koşulu:** Üç ziyaretin model kadrajı aynı olmalı; Garden başlangıç kırpığı ve bağımsız bilgi fade’i giderilmeli.

Tekrar ziyaret: Iso / Garden → Entrance. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [likova-desktop/7 · Model etrafında açı ve sayısal bilgi](../casestudy2.html#likova-desktop-7): Kamera durumu ile sayısal bilgi birlikte değişiyor. Angora’da aynı senkron ilkesi kat/model metnine uygulanmalı.
- [era-desktop/14 · Amenity: yönlü görsel değişimi](../casestudy2.html#era-desktop-14): Görsel ve seçili bilgi tek durumdan yönetiliyor. Kat metnini modelden ayrı timer’larla geciktirme.

**Sınır:** Likova’daki orbit hareketini kat kesiti değişimine aynen uygulama. Burada yönü sabit tutmak katların ilişkisini anlatıyor.

#### D36 · Iso / Entrance → First · 3. ziyaret

[Gerçek klibi aç](../casestudy2.html#active-desktop-36) · 01:02.80–01:03.60 · **7.0/10** · İncelt.

- **Devamlılık 8.0:** Üçüncü Entrance→First kat sırasını ve bina yönünü korur.
- **Hareket 8.5:** Geometri akıcı yükselir; kamera ayrıca dönmez.
- **Kadraj 7.5:** Finalde model aynı bölgede, arsa sınırları büyük ölçüde sığmış halde.
- **Okuma 7.0:** First metni yine geometri varışından sonra belirginleşir.

Kaynak kareleri: **01:03.02** — Kat yükselmesi sürer; **01:03.30** — First bilgisi belirir.

**9 kabul koşulu:** First’ın geometri varışı ve bilgi varışı tek durum olmalı; arada boş açıklama bırakılmamalı.

Tekrar ziyaret: Iso / Entrance → First. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [likova-desktop/7 · Model etrafında açı ve sayısal bilgi](../casestudy2.html#likova-desktop-7): Kamera durumu ile sayısal bilgi birlikte değişiyor. Angora’da aynı senkron ilkesi kat/model metnine uygulanmalı.
- [era-desktop/14 · Amenity: yönlü görsel değişimi](../casestudy2.html#era-desktop-14): Görsel ve seçili bilgi tek durumdan yönetiliyor. Kat metnini modelden ayrı timer’larla geciktirme.

**Sınır:** Likova’daki orbit hareketini kat kesiti değişimine aynen uygulama. Burada yönü sabit tutmak katların ilişkisini anlatıyor.

#### D37 · Iso / First → Attic · 3. ziyaret

[Gerçek klibi aç](../casestudy2.html#active-desktop-37) · 01:03.60–01:04.60 · **7.0/10** · İncelt.

- **Devamlılık 7.5:** Üçüncü Attic varışı plan girişinin başlamasıyla kısalır.
- **Hareket 7.5:** Kat dönüşümü temizdir; sonda düşey çıkış daha erken devreye girer.
- **Kadraj 7.5:** Attic sığar fakat finalde üstten çıkıp yarım kalır.
- **Okuma 7.0:** Yeni Attic açıklaması okunurken plan başlığı alttan görünür.

Kaynak kareleri: **01:04.23** — Attic açıklaması görünür; **01:04.58** — Attic çıkmış, plan yüzeyi altta.

**9 kabul koşulu:** Attic duruşunu bölüm devrinden ayır; hızlı gezintide iki bölümün açıklamaları yarışmamalı.

Tekrar ziyaret: Iso / First → Attic. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [likova-desktop/7 · Model etrafında açı ve sayısal bilgi](../casestudy2.html#likova-desktop-7): Kamera durumu ile sayısal bilgi birlikte değişiyor. Angora’da aynı senkron ilkesi kat/model metnine uygulanmalı.
- [era-desktop/14 · Amenity: yönlü görsel değişimi](../casestudy2.html#era-desktop-14): Görsel ve seçili bilgi tek durumdan yönetiliyor. Kat metnini modelden ayrı timer’larla geciktirme.

**Sınır:** Likova’daki orbit hareketini kat kesiti değişimine aynen uygulama. Burada yönü sabit tutmak katların ilişkisini anlatıyor.

#### D38 · Attic iso → Garden plan · 3. ziyaret

[Gerçek klibi aç](../casestudy2.html#active-desktop-38) · 01:04.60–01:05.55 · **5.0/10** · Yeniden ele al.

- **Devamlılık 5.0:** Üçüncü Attic→Garden plan reset’i aynı anlam kopuşunu tekrar eder.
- **Hareket 7.5:** Düşey yüzey devri görünür; üstten-plan bağlantısı kurulmaz.
- **Kadraj 8.0:** Plan ve fotoğraf tam görünür; bir sonraki kat kenarı erken yaklaşır.
- **Okuma 6.5:** Garden’ın seçilme nedeni yok; pinler oda ve koni bilgisini bastırır.

Kaynak kareleri: **01:04.60** — Attic modeli üstte çıkıyor; **01:05.20** — Garden planı görünür.

**9 kabul koşulu:** Üçüncü ziyaret aynı kat durumunu korumalı; gelen plan ile çıkan model ortak kontur veya açık başlıkla bağlanmalı.

Tekrar ziyaret: Attic iso → Garden plan / kimlik kopuşu. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [era-desktop/25 · Plan kartı → daire detayı](../casestudy2.html#era-desktop-25): Seçilen plan, aynı konutun bilgisine bağlanıyor; seçim kimliği değişmiyor. Angora’da seçili kat korunmalı.
- [likova-desktop/13 · Yaşamdan master plan’a](../casestudy2.html#likova-desktop-13): Bütün modeli okunur tutan teknik eşik, plan geçişinin ön koşulu. Buradan rastgele kamera uçuşu alma. Odak: 03:17.50–03:20.90.

**Sınır:** Referanslarda birebir floor-to-plan morph yok. Bu öneri Likova’nın bütün model mantığı ile ERA’nın plan-bilgi hiyerarşisinden yapılan tasarım çıkarımıdır.

#### D39 · Plan / Garden → Entrance · 3. ziyaret

[Gerçek klibi aç](../casestudy2.html#active-desktop-39) · 01:05.55–01:06.50 · **6.5/10** · İncelt.

- **Devamlılık 8.0:** Üçüncü yatay ray Garden’dan Entrance’a doğru ilerler.
- **Hareket 8.0:** Geçiş tek yönde, model çizilmesi veya kararma yoktur.
- **Kadraj 7.5:** Entrance planı tam; fotoğraf ve pinler ortak düzeni korur.
- **Okuma 6.5:** Salon fotoğrafı doğru eşleşir; bakış konisi küçük pin alanında zayıftır.

Kaynak kareleri: **01:05.80** — Entrance planı ve fotoğrafı yerleşir; **01:06.15** — Entrance durağı.

**9 kabul koşulu:** Her katın plan–fotoğraf çifti ortak durakta tamamlanmalı; aktif kamera yönü açık okunmalı.

Tekrar ziyaret: Plan / Garden → Entrance. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [era-desktop/10 · Düşey scroll, yatay konum akışı](../casestudy2.html#era-desktop-10): Fotoğraf ile başlık aynı gerçek yatay rayda ilerliyor. Plan+fotoğraf çifti bu rayın tek birimi olmalı.
- [era-desktop/25 · Plan kartı → daire detayı](../casestudy2.html#era-desktop-25): Plan ve oda/alan bilgisi birlikte okunuyor. Angora’nın teknik planını hareket süsünden daha fazla önemse.

**Sınır:** Konturları yeniden çizerek oluşturma, diyagonal bölme veya her pin için ayrı pop efekti ekleme. Öncelik teknik okunurluk.

#### D40 · Plan / Entrance → First · tekrar

[Gerçek klibi aç](../casestudy2.html#active-desktop-40) · 01:06.50–01:07.70 · **6.0/10** · İncelt.

- **Devamlılık 8.0:** İkinci Entrance→First plan geçişi aynı yatay sırayı korur.
- **Hareket 8.0:** Ray akıcı ilerler; iki katın parçaları geçişte birlikte görünür.
- **Kadraj 7.5:** First’ın çok sayıda pin’i yine koridorları doldurur.
- **Okuma 6.0:** Oda etiketleri ve yön konileri beyaz pin yoğunluğunda kaybolur.

Kaynak kareleri: **01:06.82** — İki katın ara durumu; **01:07.25** — First ve bedroom fotoğrafı.

**9 kabul koşulu:** First’a özel pin kalabalığı azaltılmalı; oda ve yön bilgisi fotoğrafa bakmadan anlaşılmalı.

Tekrar ziyaret: Plan / Entrance → First. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [era-desktop/10 · Düşey scroll, yatay konum akışı](../casestudy2.html#era-desktop-10): Fotoğraf ile başlık aynı gerçek yatay rayda ilerliyor. Plan+fotoğraf çifti bu rayın tek birimi olmalı.
- [era-desktop/25 · Plan kartı → daire detayı](../casestudy2.html#era-desktop-25): Plan ve oda/alan bilgisi birlikte okunuyor. Angora’nın teknik planını hareket süsünden daha fazla önemse.

**Sınır:** Konturları yeniden çizerek oluşturma, diyagonal bölme veya her pin için ayrı pop efekti ekleme. Öncelik teknik okunurluk.

#### D41 · Plan / First → Attic · tekrar

[Gerçek klibi aç](../casestudy2.html#active-desktop-41) · 01:07.70–01:08.60 · **6.5/10** · İncelt.

- **Devamlılık 8.0:** İkinci First→Attic geçişi sitting-area fotoğrafını doğru katta getirir.
- **Hareket 8.0:** Tek yatay ray korunur; sonraki bilgi bölümü ancak sonda yaklaşır.
- **Kadraj 8.0:** Attic daha az kalabalık ve fotoğrafla dengeli görünür.
- **Okuma 6.5:** Kat adı okunur; oda isimleri ve aktif bakış yönü hâlâ küçüktür.

Kaynak kareleri: **01:07.93** — First ve Attic birlikte; **01:08.27** — Attic yerleşmiş.

**9 kabul koşulu:** Attic oda adları ve aktif kamera konisi büyütülmeli; pratik ayrıntılara devir bu kat okununca başlamalı.

Tekrar ziyaret: Plan / First → Attic. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [era-desktop/10 · Düşey scroll, yatay konum akışı](../casestudy2.html#era-desktop-10): Fotoğraf ile başlık aynı gerçek yatay rayda ilerliyor. Plan+fotoğraf çifti bu rayın tek birimi olmalı.
- [era-desktop/25 · Plan kartı → daire detayı](../casestudy2.html#era-desktop-25): Plan ve oda/alan bilgisi birlikte okunuyor. Angora’nın teknik planını hareket süsünden daha fazla önemse.

**Sınır:** Konturları yeniden çizerek oluşturma, diyagonal bölme veya her pin için ayrı pop efekti ekleme. Öncelik teknik okunurluk.

#### D42 · Plandan evin pratik ayrıntılarına

[Gerçek klibi aç](../casestudy2.html#active-desktop-42) · 01:08.60–01:10.40 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Attic planından evin dört kullanım özelliğine konu bağı var.
- **Hareket 7.5:** Yeni başlık satır maskesiyle geç belirir; alt metin önce soluk gelir.
- **Kadraj 8.0:** Dört kolon dengelidir; merdiven resmi alttan bağ kurar.
- **Okuma 7.5:** Özellik yazıları çok küçük; büyük başlığın oluşmasıyla aynı anda yarışır.

Kaynak kareleri: **01:09.08** — Başlık henüz maskeli; **01:09.73** — Başlık ve dört özellik.

**9 kabul koşulu:** Dört özellik daha okunur olmalı; başlık tamamlandıktan sonra metin, ardından gerçek merdiven fotoğrafı gelmeli.

Referans seçkisi:

- [likova-desktop/19 · Servis kartları → teknoloji](../casestudy2.html#likova-desktop-19): Teknik bilgi ile onu açıklayan görüntünün eşleşmesi yararlı. Angora’da bunu gerçek merdiven/lift bilgisine indir.
- [era-desktop/20 · Fotoğraf geri çekilir, bilgi açılır](../casestudy2.html#era-desktop-20): Görüntüden bilgi alanına geçişte ortak bir yüzey korunuyor. Plan çıkışını aynı okunur teknik ritimle kur.

**Sınır:** Teknik altyapı görüntüsü veya dekoratif çizgi eklemek gerekmiyor; mevcut merdiven bu evin gerçek bağlantısını anlatıyor.

#### D43 · Dört özellik → merdiven fotoğrafı

[Gerçek klibi aç](../casestudy2.html#active-desktop-43) · 01:10.40–01:12.65 · **8.0/10** · Koru.

- **Devamlılık 8.5:** Dört katı anlatan özellikler gerçek merdiven fotoğrafına bağlanır.
- **Hareket 8.0:** Geniş fotoğraf düşey akışta temiz yükselir.
- **Kadraj 8.5:** Merdiven ve korkuluk detayları güçlü; caption resmin içine dengeli yerleşir.
- **Okuma 8.0:** Four floors cümlesi okunur; üst özellikler fotoğraf gelmeden okunmuş olur.

Kaynak kareleri: **01:11.02** — Merdiven ve caption; **01:11.82** — Fotoğrafın sonu ve mahalle eşiği.

**9 kabul koşulu:** Merdiven caption’ı bütün çıkış boyunca kontrastını korumalı; mahalleye boşluk fotoğrafın final kadrajını erken kesmemeli.

Referans seçkisi:

- [likova-desktop/19 · Servis kartları → teknoloji](../casestudy2.html#likova-desktop-19): Teknik bilgi ile onu açıklayan görüntünün eşleşmesi yararlı. Angora’da bunu gerçek merdiven/lift bilgisine indir.
- [era-desktop/20 · Fotoğraf geri çekilir, bilgi açılır](../casestudy2.html#era-desktop-20): Görüntüden bilgi alanına geçişte ortak bir yüzey korunuyor. Plan çıkışını aynı okunur teknik ritimle kur.

**Sınır:** Teknik altyapı görüntüsü veya dekoratif çizgi eklemek gerekmiyor; mevcut merdiven bu evin gerçek bağlantısını anlatıyor.

#### D44 · Ev içinden villa mahallesine

[Gerçek klibi aç](../casestudy2.html#active-desktop-44) · 01:12.65–01:15.10 · **8.0/10** · Koru.

- **Devamlılık 8.0:** Merdivenden mahalle aerial’ına evden çevreye açık konu genişlemesi var.
- **Hareket 8.0:** Fotoğraf ve metin birlikte yükselir; parallax farkı ölçülüdür.
- **Kadraj 8.0:** Aerial ev, havuz ve komşu yapıları gösterir; kadraj alt yapıyı kesmez.
- **Okuma 8.0:** A quieter side başlığı güçlü; küçük adres ve keşif bağlantısı zayıftır.

Kaynak kareleri: **01:13.32** — Mahalle fotoğrafı ve metin; **01:14.20** — Mahalle çıkarken harita yaklaşır.

**9 kabul koşulu:** Fotoğraftaki ev odağı büyüme/paralaks boyunca korunmalı; adres bağlantısı daha okunur olmalı.

Referans seçkisi:

- [era-desktop/12 · Bulutlardan geniş aerial’a](../casestudy2.html#era-desktop-12): Geniş çevre görüntüsü bir ölçek açılımı sağlıyor. Bulut efekti yerine Angora’nın mevcut aerial kadrajını kullan.
- [likova-desktop/8 · Modelden ulaşım kolajına](../casestudy2.html#likova-desktop-8): Modelden gerçek çevreye geçerken görüntü ile konum metni eşleşiyor. Ev → mahalle bağı bu şekilde kurulmalı.

**Sınır:** Buradaki aerial, evin sokak girişini gösteren fotoğrafın yerine geçmez. Konum bilgisi ayrı kalmalı.

#### D45 · Mahalle → geniş harita + yaşam kartı

[Gerçek klibi aç](../casestudy2.html#active-desktop-45) · 01:15.10–01:18.55 · **6.5/10** · İncelt.

- **Devamlılık 8.0:** Mahalle fotoğrafı yerini aynı çevrenin düz haritasına bırakır.
- **Hareket 8.0:** Harita alttan gelir; yaşam kartı yeşil bölümden önce okunur.
- **Kadraj 8.0:** Harita tüm genişliği kullanır; villa işareti ve sınır kartın sağında görünür.
- **Okuma 6.5:** Kategori noktaları ve legend çok küçük; ev/sınır vurgusu çevre yoğunluğunda zayıftır.

Kaynak kareleri: **01:16.03** — Harita ve villa işareti; **01:17.28** — Yaşam kartı, sınır ve çevre noktaları.

**9 kabul koşulu:** Ev ve dashed sınır belirgin işaretlenmeli; kategori noktaları büyümeli, legend haritanın doğrudan altında okunmalı.

Referans seçkisi:

- [likova-desktop/10 · Video → harita ve sayaç kartı](../casestudy2.html#likova-desktop-10): Harita ve açıklama kartı iki ayrı okunur yüzey. Angora’nın haritasında da bilgi katmanlarını bu hiyerarşiyle kur.
- [era-desktop/11 · Rota çizgisi ve bulut eşiği](../casestudy2.html#era-desktop-11): Rota/yer bilgisi grafiğe bağlı kalıyor. Angora’daki dashed sınırın açıklaması da haritadan kopmamalı.

**Sınır:** Yeni uçan pin veya bütün noktalar için etiket gerekmiyor. Görüntü statik harita; kayıt interaktif harita yeteneğini kanıtlamaz.

#### D46 · Harita → Angora Journal / iki fotoğraf

[Gerçek klibi aç](../casestudy2.html#active-desktop-46) · 01:18.55–01:20.15 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Haritanın yeşil yaşam kartı iki yerel yaşam fotoğrafına bağlanır.
- **Hareket 7.5:** İki fotoğraf farklı düşey hizalarla gelir; yana geliş etkisi belirgin değildir.
- **Kadraj 8.5:** Mahalle ve spor fotoğrafları ayrı içerikleri doğru kadrajlarla taşır.
- **Okuma 8.0:** Journal başlığı iki fotoğraftan önce kurulur; paragraf küçük kalır.

Kaynak kareleri: **01:18.98** — İki fotoğrafın ilk kenarları; **01:19.55** — Mahalle ve spor resmi birlikte.

**9 kabul koşulu:** İki resim kendi konusu ve caption’ıyla kontrollü geliş almalı; görsel hareketleri birbirleriyle yarışmamalı.

Referans seçkisi:

- [era-desktop/16 · Zıt kolonlar ve ön plan bitkisi](../casestudy2.html#era-desktop-16): İki fotoğraf farklı hizalarla derinlik kuruyor ama açıklamalar kendi fotoğraflarıyla kalıyor. Journal için uygun hareket seçkisi.
- [likova-desktop/12 · Yaşam kolajı: kart içindeki sporcu](../casestudy2.html#likova-desktop-12): Yaşam görseli, kendisine ait açıklamayı taşıyor. Fotoğraf seçiminin gerekçesi hareketten daha önemli.

**Sınır:** İki görüntü aynı panorama değil; ERA’nın iki pencere birleşmesi burada yanıltıcı olur. Görselleri birleştirme.

#### D47 · Mahalle ve spor: fotoğraf → caption

[Gerçek klibi aç](../casestudy2.html#active-desktop-47) · 01:20.15–01:22.10 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Mahalle ve spor resimleri kendi caption’larını taşır; ikinci resim gerçekten vardır.
- **Hareket 8.0:** Farklı hizalar tek düşey akışta sürer; birleştirme veya dissolve zorlanmaz.
- **Kadraj 8.5:** İki fotoğraf ve metin dengeli kolonlarda; resim içerikleri kesilmez.
- **Okuma 7.5:** Begin ve shared sense cümleleri net; açıklama ve bağlantılar çok küçük.

Kaynak kareleri: **01:20.68** — İki fotoğraf ve bağlı caption; **01:21.38** — Caption’lar ve kültür satırı.

**9 kabul koşulu:** İki caption’ın paragrafı büyümeli; Ankara kültür satırı yeni konu olarak daha net ayrılmalı.

Referans seçkisi:

- [likova-desktop/20 · Altyapı: çok görüntülü basamaklı akış](../casestudy2.html#likova-desktop-20): Farklı yaşam olanaklarının her birine kendi fotoğrafı ve açıklaması bağlanıyor. Angora’daki iki başlık bu ilkeyle zaten doğru yönde.
- [era-desktop/16 · Zıt kolonlar ve ön plan bitkisi](../casestudy2.html#era-desktop-16): Fotoğraf ve açıklama aynı blokta kaldığında farklı hızlar okumayı bölmez. Mevcut journal düzenini bu sınırda tut.

**Sınır:** Bilkent/CerModern için bu kayıtta olmayan bir görsel veya kamera geçişi varmış gibi puanlama; görülen kısım metin ve linklerden oluşuyor.

#### D48 · Journal → Ankara kültür linkleri

[Gerçek klibi aç](../casestudy2.html#active-desktop-48) · 01:22.10–01:23.25 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Mahalle/spor anlatısı şehir kültürüne bağlanır; aynı yeşil yüzey devam eder.
- **Hareket 7.5:** Kültür satırı sade düşey akışla geçer; galeri alttan haber verilir.
- **Kadraj 8.0:** Solda geniş boşluk, sağda kültür metni; denge fotoğraflar çıktıktan sonra zayıflar.
- **Okuma 7.5:** Bilkent/CerModern bağlantıları bulunur; kaynak dipnotu çok küçüktür.

Kaynak kareleri: **01:22.42** — Kültür bağlantıları ve boş sol kolon; **01:22.82** — Galeri başlığı alttan gelir.

**9 kabul koşulu:** Kültür metni ayrı küçük bir durak oluşturmalı; kaynağı okunur tutup galeriyle aralığı azaltmalı.

Referans seçkisi:

- [likova-desktop/20 · Altyapı: çok görüntülü basamaklı akış](../casestudy2.html#likova-desktop-20): Farklı yaşam olanaklarının her birine kendi fotoğrafı ve açıklaması bağlanıyor. Angora’daki iki başlık bu ilkeyle zaten doğru yönde.
- [era-desktop/16 · Zıt kolonlar ve ön plan bitkisi](../casestudy2.html#era-desktop-16): Fotoğraf ve açıklama aynı blokta kaldığında farklı hızlar okumayı bölmez. Mevcut journal düzenini bu sınırda tut.

**Sınır:** Bilkent/CerModern için bu kayıtta olmayan bir görsel veya kamera geçişi varmış gibi puanlama; görülen kısım metin ve linklerden oluşuyor.

#### D49 · Journal’dan seçilmiş ev fotoğraflarına

[Gerçek klibi aç](../casestudy2.html#active-desktop-49) · 01:23.25–01:24.55 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Journal ve ev galerisi aynı yeşil zeminle bağlanır.
- **Hareket 8.0:** Galeri alttan gelir; ilk fotoğraf yerleşince yatay hareket başlayacaktır.
- **Kadraj 8.0:** İlk salon resmi ve sonraki mutfak kenarı uygun büyüklükte görünür.
- **Okuma 7.5:** Filtreler ve sayaç çok küçük; yatay devam ipucu fotoğraf kenarıyla verilir.

Kaynak kareleri: **01:23.85** — Başlık ve ilk iki fotoğraf; **01:24.50** — İlk salon kadrajı.

**9 kabul koşulu:** İlk salon fotoğrafı tam durmalı; filtreler, sayaç ve yatay devam tek bakışta anlaşılmalı.

Referans seçkisi:

- [likova-desktop/17 · Lobi görseli, sayılar ve galeri](../casestudy2.html#likova-desktop-17): Ana mekân bilgisi galerinin ilk karesine bağlanıyor. Angora’da journal çıkışı ile ilk ev fotoğrafı arasında aynı kısa eşik uygun. Odak: 03:44.75–03:49.35.
- [era-desktop/17 · İç galeri → mimari eşik](../casestudy2.html#era-desktop-17): Galerinin başlığı ve kontrolleri fotoğrafla aynı sahneye ait. Girişte ayrı ayrı uçan öğeler kullanma.

**Sınır:** Kütüphaneyi kullanmak için bütün fotoğrafları dökme; seçilmiş sekiz görüntü bir ikinci özet turu olmalı.

#### D50 · Galeri / living room → kitchen

[Gerçek klibi aç](../casestudy2.html#active-desktop-50) · 01:24.55–01:25.45 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Salon fotoğrafından mutfağa ortak rayda geçilir.
- **Hareket 8.5:** Başlık sabit; resimler aynı yatay hızla kayar.
- **Kadraj 8.5:** Her iki resim kendi oranını korur; kenar kırpığı sonraki fotoğrafı duyurur.
- **Okuma 7.5:** Küçük alt caption dışında odanın kat bilgisi zayıftır.

Kaynak kareleri: **01:24.65** — Salon ve mutfak ara durumu; **01:25.40** — Mutfak devralır.

**9 kabul koşulu:** Mutfak varışında caption ve sayaç net olmalı; yatay ray bitmeden düşey sayfa ilerlememeli.

Referans seçkisi:

- [era-desktop/10 · Düşey scroll, yatay konum akışı](../casestudy2.html#era-desktop-10): Düşey kaydırmanın gerçek yatay rayı ilerletmesi bu galeri için uygun. Son hedefin mesafesi içerik genişliğiyle belirlenmeli.
- [likova-desktop/17 · Lobi görseli, sayılar ve galeri](../casestudy2.html#likova-desktop-17): Galeride resim sırası ile küçük kontrol bilgileri aynı sahnede kalıyor. Angora için daha sade bir eşleşme. Odak: 03:44.75–03:49.35.

**Sınır:** ERA’nın konum hikâyesindeki metin ölçeğini buraya taşıma. Bu sahne ayrıntılı fotoğraf incelemesi; başlık geri planda kalmalı.

#### D51 · Galeri / kitchen → entry hall

[Gerçek klibi aç](../casestudy2.html#active-desktop-51) · 01:25.45–01:26.35 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Mutfaktan giriş holüne aynı sıra devam eder.
- **Hareket 8.5:** Ray yönü ve başlık kilidi korunur; görünür kararma yoktur.
- **Kadraj 8.5:** Holün kapısı, radyatörü ve oda ölçeği fotoğrafta tam okunur.
- **Okuma 7.5:** Hall adı küçük; mutfak→hol ilişkisini fotoğraftan çıkarmak gerekir.

Kaynak kareleri: **01:25.68** — Mutfak ve hol aynı rayda; **01:26.33** — Hol fotoğrafı varışta duruyor.

**9 kabul koşulu:** Hol caption’ı okunur kat/oda bilgisi vermeli; varışta sayaç bu fotoğrafla aynı anda güncellenmeli.

Referans seçkisi:

- [era-desktop/10 · Düşey scroll, yatay konum akışı](../casestudy2.html#era-desktop-10): Düşey kaydırmanın gerçek yatay rayı ilerletmesi bu galeri için uygun. Son hedefin mesafesi içerik genişliğiyle belirlenmeli.
- [likova-desktop/17 · Lobi görseli, sayılar ve galeri](../casestudy2.html#likova-desktop-17): Galeride resim sırası ile küçük kontrol bilgileri aynı sahnede kalıyor. Angora için daha sade bir eşleşme. Odak: 03:44.75–03:49.35.

**Sınır:** ERA’nın konum hikâyesindeki metin ölçeğini buraya taşıma. Bu sahne ayrıntılı fotoğraf incelemesi; başlık geri planda kalmalı.

#### D52 · Galeri / hall → primary bedroom

[Gerçek klibi aç](../casestudy2.html#active-desktop-52) · 01:26.35–01:27.35 · **7.0/10** · İncelt.

- **Devamlılık 8.5:** Holden boş primary-bedroom fotoğrafına doğru sıra sürer.
- **Hareket 8.5:** Yatay hareket sabit; önceki ve sonraki fotoğrafların aralığı değişmez.
- **Kadraj 8.0:** Boş oda kadrajı yapıyı gösterir ama önceki dolu bedroom anlatısıyla farkı belirgindir.
- **Okuma 7.0:** Primary-bedroom etiketi küçüktür; boş/dolu fotoğraf farkı açıklanmaz.

Kaynak kareleri: **01:26.68** — Hol ve bedroom ara durumu; **01:27.33** — Boş bedroom kadrajı.

**9 kabul koşulu:** Bu boş oda fotoğrafının inceleme amacı ve katı açık caption’da belirtilmeli; önceki dolu fotoğrafla çelişki bırakılmamalı.

Referans seçkisi:

- [era-desktop/10 · Düşey scroll, yatay konum akışı](../casestudy2.html#era-desktop-10): Düşey kaydırmanın gerçek yatay rayı ilerletmesi bu galeri için uygun. Son hedefin mesafesi içerik genişliğiyle belirlenmeli.
- [likova-desktop/17 · Lobi görseli, sayılar ve galeri](../casestudy2.html#likova-desktop-17): Galeride resim sırası ile küçük kontrol bilgileri aynı sahnede kalıyor. Angora için daha sade bir eşleşme. Odak: 03:44.75–03:49.35.

**Sınır:** ERA’nın konum hikâyesindeki metin ölçeğini buraya taşıma. Bu sahne ayrıntılı fotoğraf incelemesi; başlık geri planda kalmalı.

#### D53 · Galeri / bedroom → sitting area

[Gerçek klibi aç](../casestudy2.html#active-desktop-53) · 01:27.35–01:30.20 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Bedroom’dan sitting-area’ya aynı rayın beşinci fotoğrafı gelir.
- **Hareket 8.5:** Yatay hareket oturur; lightbox açılışı bu kesitten ayrıldı.
- **Kadraj 8.5:** Ahşap tavan, pencere ve oturma alanı iyi sığar.
- **Okuma 7.5:** Sitting-area caption’ı küçük; büyütme erişimi fotoğraf üzerindeki ince işarete dayanır.

Kaynak kareleri: **01:27.67** — Bedroom ve sitting-area birlikte; **01:29.52** — Sitting-area durağı.

**9 kabul koşulu:** Sitting-area varış caption’ı ve büyütme ipucu okunur olmalı; lightbox ayrı ve açık bir etkileşim kalmalı.

Referans seçkisi:

- [era-desktop/10 · Düşey scroll, yatay konum akışı](../casestudy2.html#era-desktop-10): Düşey kaydırmanın gerçek yatay rayı ilerletmesi bu galeri için uygun. Son hedefin mesafesi içerik genişliğiyle belirlenmeli.
- [likova-desktop/17 · Lobi görseli, sayılar ve galeri](../casestudy2.html#likova-desktop-17): Galeride resim sırası ile küçük kontrol bilgileri aynı sahnede kalıyor. Angora için daha sade bir eşleşme. Odak: 03:44.75–03:49.35.

**Sınır:** ERA’nın konum hikâyesindeki metin ölçeğini buraya taşıma. Bu sahne ayrıntılı fotoğraf incelemesi; başlık geri planda kalmalı.

#### D54 · Fotoğraf büyütme / sitting area

[Gerçek klibi aç](../casestudy2.html#active-desktop-54) · 01:30.20–01:32.10 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Aynı sitting-area büyük açılır; içerik kimliği korunur.
- **Hareket 7.5:** Büyütme, kaynaktan ortak kenarla açılmak yerine üst üste dissolve yapar.
- **Kadraj 9.0:** Tam fotoğraf geniş ve net; mobilya ve tavan kesilmez.
- **Okuma 7.5:** Close düğmesi ve caption gereğinden küçüktür; ana fotoğraf çok iyi okunur.

Kaynak kareleri: **01:30.33** — Büyük fotoğraf dissolve’i; **01:31.18** — Tam fotoğraf ve küçük Close.

**9 kabul koşulu:** Kaynak fotoğraf ile büyük görünüm ortak odaktan açılmalı; Close ve caption rahat bulunmalı.

Referans seçkisi:

- [era-desktop/27 · Lightbox açılır, yana geçer, kapanır](../casestudy2.html#era-desktop-27): Büyütülen fotoğraf kapanınca aynı detay sütununa dönüyor. Kaynak konumunu koruma ilkesi doğrudan uygun.

**Sınır:** Lightbox’a kamera uçuşu ekleme. Kayıtta görünen amaç bir fotoğrafı incelemek; form veya yeni sayfa değil.

#### D55 · Büyük fotoğraftan aynı raya dönüş

[Gerçek klibi aç](../casestudy2.html#active-desktop-55) · 01:32.10–01:33.10 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Lightbox kapanınca aynı sitting-area ve komşu bathroom geri gelir.
- **Hareket 7.5:** Kapanışta büyütülmüş ve raydaki resim kısa süre üst üste görünür.
- **Kadraj 8.5:** Aynı galeri konumu korunur; büyütmeden sonra fotoğraf kaybolmaz.
- **Okuma 8.0:** Fotoğraf bağlamı anlaşılır; küçük caption öncekiyle aynı zayıflığı taşır.

Kaynak kareleri: **01:32.18** — Lightbox ve ray dissolve’i; **01:32.55** — Aynı sitting-area raya dönmüş.

**9 kabul koşulu:** Kapanış aynı fotoğraf odağına dönmeli; ray konumu ve aktif sayaç değişmeden korunmalı.

Referans seçkisi:

- [era-desktop/27 · Lightbox açılır, yana geçer, kapanır](../casestudy2.html#era-desktop-27): Büyütülen fotoğraf kapanınca aynı detay sütununa dönüyor. Kaynak konumunu koruma ilkesi doğrudan uygun.

**Sınır:** Lightbox’a kamera uçuşu ekleme. Kayıtta görünen amaç bir fotoğrafı incelemek; form veya yeni sayfa değil.

#### D56 · Galeri / sitting area → bathroom

[Gerçek klibi aç](../casestudy2.html#active-desktop-56) · 01:33.10–01:34.05 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Sitting-area’dan ensuite bathroom’a oda sırası sürer.
- **Hareket 8.5:** Yatay hareket ve sabit başlık önceki rayla aynı karakterdedir.
- **Kadraj 8.5:** Banyo lavabosu ve duş birlikte görünür; dar kenar sonraki odayı duyurur.
- **Okuma 7.5:** Bathroom caption’ı küçüktür; model/plan ile bağlantısı görünür değildir.

Kaynak kareleri: **01:33.35** — Sitting-area ve bathroom birlikte; **01:33.70** — Bathroom merkeze gelir.

**9 kabul koşulu:** Bathroom’un kat ve kamera kaynağı okunur caption’da yer almalı; resim varışında sayaç eşleşmeli.

Referans seçkisi:

- [era-desktop/10 · Düşey scroll, yatay konum akışı](../casestudy2.html#era-desktop-10): Düşey kaydırmanın gerçek yatay rayı ilerletmesi bu galeri için uygun. Son hedefin mesafesi içerik genişliğiyle belirlenmeli.
- [likova-desktop/17 · Lobi görseli, sayılar ve galeri](../casestudy2.html#likova-desktop-17): Galeride resim sırası ile küçük kontrol bilgileri aynı sahnede kalıyor. Angora için daha sade bir eşleşme. Odak: 03:44.75–03:49.35.

**Sınır:** ERA’nın konum hikâyesindeki metin ölçeğini buraya taşıma. Bu sahne ayrıntılı fotoğraf incelemesi; başlık geri planda kalmalı.

#### D57 · Galeri / bathroom → attic bedroom

[Gerçek klibi aç](../casestudy2.html#active-desktop-57) · 01:34.05–01:34.65 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Bathroom’dan Attic-bedroom’a ray devam eder.
- **Hareket 8.5:** Kısa geçiş temiz; varış sonrası sarsıntı karelerde görünmez.
- **Kadraj 8.5:** Eğimli tavan ve yatak kadrajda; oda ölçeği kaybolmaz.
- **Okuma 7.5:** Attic bilgisi yalnız küçük caption’dan çıkarılır.

Kaynak kareleri: **01:34.22** — Bathroom ve attic-bedroom birlikte; **01:34.42** — Attic-bedroom varışı.

**9 kabul koşulu:** Attic katı küçük alt satıra bırakılmamalı; fotoğraf ve kat bilgisi aynı okunur durakta kalmalı.

Referans seçkisi:

- [era-desktop/10 · Düşey scroll, yatay konum akışı](../casestudy2.html#era-desktop-10): Düşey kaydırmanın gerçek yatay rayı ilerletmesi bu galeri için uygun. Son hedefin mesafesi içerik genişliğiyle belirlenmeli.
- [likova-desktop/17 · Lobi görseli, sayılar ve galeri](../casestudy2.html#likova-desktop-17): Galeride resim sırası ile küçük kontrol bilgileri aynı sahnede kalıyor. Angora için daha sade bir eşleşme. Odak: 03:44.75–03:49.35.

**Sınır:** ERA’nın konum hikâyesindeki metin ölçeğini buraya taşıma. Bu sahne ayrıntılı fotoğraf incelemesi; başlık geri planda kalmalı.

#### D58 · Galeri / attic bedroom → attic living

[Gerçek klibi aç](../casestudy2.html#active-desktop-58) · 01:34.65–01:35.65 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Son Attic living fotoğrafından viewing bölümüne düşey devir başlar.
- **Hareket 8.0:** Yatay sonlanma ile düşey çıkış kesitin sonunda birbirine yaklaşır.
- **Kadraj 8.0:** Son fotoğraf tam okunur; ardından üstten kırpılarak viewing resmi gelir.
- **Okuma 7.5:** Final fotoğraf caption’ı küçüktür; galeri sonunun işareti zayıftır.

Kaynak kareleri: **01:34.92** — İki Attic fotoğrafı; **01:35.28** — Yatay son ve viewing ilk kenarı.

**9 kabul koşulu:** Son fotoğrafın tam durağı korunmalı; yatay ray bitince belirgin ama sakin düşey devir yapılmalı.

Referans seçkisi:

- [era-desktop/10 · Düşey scroll, yatay konum akışı](../casestudy2.html#era-desktop-10): Düşey kaydırmanın gerçek yatay rayı ilerletmesi bu galeri için uygun. Son hedefin mesafesi içerik genişliğiyle belirlenmeli.
- [likova-desktop/17 · Lobi görseli, sayılar ve galeri](../casestudy2.html#likova-desktop-17): Galeride resim sırası ile küçük kontrol bilgileri aynı sahnede kalıyor. Angora için daha sade bir eşleşme. Odak: 03:44.75–03:49.35.

**Sınır:** ERA’nın konum hikâyesindeki metin ölçeğini buraya taşıma. Bu sahne ayrıntılı fotoğraf incelemesi; başlık geri planda kalmalı.

#### D59 · Galeri bitişi → viewing fotoğrafı

[Gerçek klibi aç](../casestudy2.html#active-desktop-59) · 01:35.65–01:37.40 · **6.5/10** · İncelt.

- **Devamlılık 8.0:** Galeri altından villa/havuz fotoğrafı ve satış kartı gelir.
- **Hareket 8.0:** Kart ve arka fotoğraf beraber yükselir; görünür tam siyah kesme yoktur.
- **Kadraj 6.5:** Kart villa gövdesinin çoğunu örter; havuz altı ve çatı kenarı kalır.
- **Okuma 8.0:** Başlık, fiyat ve form ayrı kolonlarda okunur.

Kaynak kareleri: **01:36.17** — Kart cepheyi örter; **01:36.75** — Fiyat ve form varışı.

**9 kabul koşulu:** Cepheyi gösteren kadraj ve satış kartı ayrı okunur alanlar almalı; fotoğrafın hedef evi kart altında kaybolmamalı.

Referans seçkisi:

- [era-desktop/21 · Teras ve büyük kapanış başlığı](../casestudy2.html#era-desktop-21): Kapanışta bir güçlü görsel ve net çağrı yeterli. Angora’da görselin mimari odağını karta feda etme.
- [likova-desktop/10 · Video → harita ve sayaç kartı](../casestudy2.html#likova-desktop-10): Bilgi kartı ile arka görselin ayrı okunur alanları var. Bunu contact kadrajına aktar; harita estetiğini kopyalama.

**Sınır:** Form gönderimi kayıtta yapılmıyor; görsel değerlendirmeyi formun çalıştığına dair işlev notu gibi sunma.

#### D60 · Fiyat, ev özeti ve viewing kartı

[Gerçek klibi aç](../casestudy2.html#active-desktop-60) · 01:37.40–01:41.30 · **6.5/10** · İncelt.

- **Devamlılık 8.0:** Kart aynı villa resmi üzerinde sabit bilgi durağı kurar.
- **Hareket 8.0:** Duruş sakin; wireframe’e çıkış kesitin sonunda başlar.
- **Kadraj 6.5:** Büyük kart binayı örtmeye devam eder; fotoğraf mimari bilgi veremez.
- **Okuma 8.0:** 99 milyon fiyat, kısa özet ve form bulunur; küçük ilan satırı zayıftır.

Kaynak kareleri: **01:38.47** — Özet, fiyat ve form durağı; **01:39.87** — Cephe hâlâ kart arkasında.

**9 kabul koşulu:** Fiyat/özet okunurluğunu koruyarak cepheyi serbest bırak; form ile üç son eylemin rolleri açık ayrılmalı.

Referans seçkisi:

- [era-desktop/21 · Teras ve büyük kapanış başlığı](../casestudy2.html#era-desktop-21): Kapanışta bir güçlü görsel ve net çağrı yeterli. Angora’da görselin mimari odağını karta feda etme.
- [likova-desktop/10 · Video → harita ve sayaç kartı](../casestudy2.html#likova-desktop-10): Bilgi kartı ile arka görselin ayrı okunur alanları var. Bunu contact kadrajına aktar; harita estetiğini kopyalama.

**Sınır:** Form gönderimi kayıtta yapılmıyor; görsel değerlendirmeyi formun çalıştığına dair işlev notu gibi sunma.

#### D61 · Fotoğraftan çizgisel ev kapanışına

[Gerçek klibi aç](../casestudy2.html#active-desktop-61) · 01:41.30–01:42.60 · **8.0/10** · Koru.

- **Devamlılık 8.0:** Fotoğraflı viewing sahnesi aynı yeşil wireframe yüzeyine bağlanır.
- **Hareket 8.0:** Fotoğraf çıkar, çizgisel ev alttan gelir; düz düşey devir tutarlıdır.
- **Kadraj 8.5:** Model solda ve eylemler sağda; kenar çizgileri yumuşayarak biter.
- **Okuma 8.0:** Üç link ve Make it your own nettir; credit bölümü çok küçüktür.

Kaynak kareleri: **01:41.65** — Fotoğraftan wireframe’e devir; **01:42.12** — Model ve üç link.

**9 kabul koşulu:** Fotoğraf ve wireframe’de ev odağı bağlanmalı; modelin ilk varışı ile link grubu aynı sakin durakta tamamlanmalı.

Referans seçkisi:

- [era-desktop/22 · Footer: daralan görüntü, büyüyen içerik](../casestudy2.html#era-desktop-22): Görüntü daralırken gerçek footer bilgisi onun etrafında kuruluyor. Alınacak şey bilgiyle birlikte kurulan kapanış; kutu biçimi değil.
- [likova-desktop/13 · Yaşamdan master plan’a](../casestudy2.html#likova-desktop-13): Teknik model ve çağrı aynı sahnede okunuyor. Angora’nın çizgisel modeline uygun bir sade kapanış ilkesi. Odak: 03:17.50–03:20.90.

**Sınır:** ERA’nın daralan teras penceresini burada tekrarlamak gerekmiyor. Bu kapanışın özgün malzemesi çizgisel ev.

#### D62 · Wireframe orbit / sabit eylemler

[Gerçek klibi aç](../casestudy2.html#active-desktop-62) · 01:42.60–01:46.55 · **8.0/10** · Koru.

- **Devamlılık 8.5:** Orbit boyunca kendi ev daha parlak çizgilerle çevreden ayrılır.
- **Hareket 8.5:** Açı değişimi tutarlı; eylem kolonu orbitten bağımsız kalır.
- **Kadraj 8.5:** Villa ve komşu konturlar sığar; kenar çizgileri azalır.
- **Okuma 8.0:** Üç ana eylem nettir; küçük kaynak/credit metni ikincil ama çok yoğundur.

Kaynak kareleri: **01:43.67** — Orbitin ikinci açısı; **01:45.10** — Evin başka açısı, sabit linkler.

**9 kabul koşulu:** Ev merkezi ve çizgi parlaklığı orbitte sabit kalmalı; credit kolay okunacak kısa bir satırla ayrılmalı.

Referans seçkisi:

- [likova-desktop/7 · Model etrafında açı ve sayısal bilgi](../casestudy2.html#likova-desktop-7): Model açısı ile bilgi alanının ayrı rolleri var. Angora’da eylemler sabit kalırken evin çevresinde dönmek bu ayrımı iyi kullanıyor.

**Sınır:** Likova’nın dolu modelini veya otomatik orbitini ekleme. Angora’da kontrol edilen çizgisel ev kendi kimliğini taşıyor.

#### D63 · Wireframe → viewing → galeri / geri

[Gerçek klibi aç](../casestudy2.html#active-desktop-63) · 01:46.55–01:47.75 · **6.5/10** · İncelt.

- **Devamlılık 6.5:** Geri akış wireframe’den viewing’e, ardından galeriye aynı kesitte geçer.
- **Hareket 6.5:** Viewing kısa bir şerit olarak aradan geçer; tek bir sakin geri varış yoktur.
- **Kadraj 7.0:** Kartın altı ve havuz parçası görülür; viewing bütünü okunmadan galeri gelir.
- **Okuma 7.5:** Geri gelişte bölüm bilgileri hızlı değişir; rayın önceki fotoğrafları sonra okunur.

Kaynak kareleri: **01:46.87** — Viewing yalnız kısmi görünür; **01:47.30** — Galeri geri gelmiş.

**9 kabul koşulu:** Her bölüm için tamamlanmış geri varış korunmalı; viewing tek karelik ara şerit gibi atlanmamalı.

Referans seçkisi:

- [era-desktop/23 · Aynı geçişin geri okunması](../casestudy2.html#era-desktop-23): Kapanışın geri okunması aynı sahneye dönüyor. Angora’nın son bölümlerinde aynı kimlik ve ray konumu korunmalı.
- [likova-desktop/9 · Tam video ve ileri–geri katmanlar](../casestudy2.html#likova-desktop-9): İleri ve geri katmanların aynı görüntü bağlamında kalması, kapanıştan dönüş için uygun kontrol ilkesi. Odak: 02:33.30–02:35.50.

**Sınır:** Kayıt hangi gesture/section link yolunun kullanıldığını tamamen göstermiyor; teşhis input motoru değil, görülen yön ve konum sürekliliğidir.

#### D64 · Galeri / bathroom → sitting area · geri

[Gerçek klibi aç](../casestudy2.html#active-desktop-64) · 01:47.75–01:48.60 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Kesit artık galerinin içindedir; önceki viewing→galeri adı yanlıştı.
- **Hareket 8.5:** Ray sola ilerlemenin tersini temiz biçimde oynar.
- **Kadraj 8.0:** Bathroom, sitting-area ve bedroom kendi oranlarında geri gelir.
- **Okuma 7.5:** Caption’lar fotoğraflarla bağlı; küçük kat bilgisi hâlâ zayıftır.

Kaynak kareleri: **01:47.75** — Galeri zaten görünür; **01:48.28** — Bathroom ve sitting-area geriye okunur.

**9 kabul koşulu:** Ters ray aynı fotoğraf ve sayaç durumlarını korumalı; caption boyutu ileri–geri iki yönde de okunur olmalı.

Referans seçkisi:

- [era-desktop/23 · Aynı geçişin geri okunması](../casestudy2.html#era-desktop-23): Kapanışın geri okunması aynı sahneye dönüyor. Angora’nın son bölümlerinde aynı kimlik ve ray konumu korunmalı.
- [likova-desktop/9 · Tam video ve ileri–geri katmanlar](../casestudy2.html#likova-desktop-9): İleri ve geri katmanların aynı görüntü bağlamında kalması, kapanıştan dönüş için uygun kontrol ilkesi. Odak: 02:33.30–02:35.50.

**Sınır:** Kayıt hangi gesture/section link yolunun kullanıldığını tamamen göstermiyor; teşhis input motoru değil, görülen yön ve konum sürekliliğidir.

#### D65 · Yatay galeri geriye okunur

[Gerçek klibi aç](../casestudy2.html#active-desktop-65) · 01:48.60–01:50.00 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Bedroom’dan hol ve mutfağa önceki rayın sırası ters okunur.
- **Hareket 8.5:** Başlık sabit; geri yatay hareket ileriyle aynı mesafeleri izler.
- **Kadraj 8.5:** Hol ve mutfak oranları korunur; evin önceki odaları tanınır.
- **Okuma 7.5:** Oda caption’ları doğru konumda fakat küçük kalır.

Kaynak kareleri: **01:48.98** — Hol tekrar merkeze gelir; **01:49.48** — Hol ve mutfak geri sırası.

**9 kabul koşulu:** Geri ray için yeni giriş efekti üretme; aynı caption, sayaç ve fotoğraf konumuna tam geri dön.

Referans seçkisi:

- [era-desktop/23 · Aynı geçişin geri okunması](../casestudy2.html#era-desktop-23): Kapanışın geri okunması aynı sahneye dönüyor. Angora’nın son bölümlerinde aynı kimlik ve ray konumu korunmalı.
- [likova-desktop/9 · Tam video ve ileri–geri katmanlar](../casestudy2.html#likova-desktop-9): İleri ve geri katmanların aynı görüntü bağlamında kalması, kapanıştan dönüş için uygun kontrol ilkesi. Odak: 02:33.30–02:35.50.

**Sınır:** Kayıt hangi gesture/section link yolunun kullanıldığını tamamen göstermiyor; teşhis input motoru değil, görülen yön ve konum sürekliliğidir.

### Mobil emülasyon / ayrıntılar

#### M01 · Mobil aerial / ışık değişimi

[Gerçek klibi aç](../casestudy2.html#active-mobile-1) · 02:02.00–02:08.20 · **7.0/10** · İncelt.

- **Devamlılık 8.0:** Dikey aerial ev/havuz odağını korur; son karede ilk gündüz kamera açısı başlar.
- **Hareket 7.5:** Işık kademeli değişir; orta kararmada kimliğin kontrastı da azalır.
- **Kadraj 7.5:** Dar kadrajda çevre az; kimlik alt bölümün büyük kısmını kaplar.
- **Okuma 7.0:** Ana marka okunur, ancak kararma sırasında küçük slogan ve CTA zayıflar.

Kaynak kareleri: **02:03.68** — Kararma ve düşük yazı kontrastı; **02:05.93** — Gece ışıkları ve kimlik.

**9 kabul koşulu:** Kararma yazıyı etkilememeli; dikey ev odağı ve sonraki gündüz devri ayrı okunmalı.

Referans seçkisi:

- [likova-mobile/2 · Mobil basamaklı hero](../casestudy2.html#likova-mobile-2): Beyaz kimlik yüzeyi ayrılırken bina alttan görünür: kimliği kamera girişinden önce bitirme sırasını al; basamak biçimini kopyalama.
- [era-mobile/1 · Mobil hero ve yaklaşma](../casestudy2.html#era-mobile-1): Başlığın kameradan farklı hızla çıkması, görüntü hedefi ile kimliği ayırıyor. Angora’da aynı ritmi daha küçük bir mesafeyle kullan.

**Sınır:** Kayıt hero açıkken başlar. Yükleme ekranı veya ilk siyah örtünün davranışı bu kesitten puanlanamaz.

#### M02 · Mobil / 01 Arrival

[Gerçek klibi aç](../casestudy2.html#active-mobile-2) · 02:08.20–02:09.70 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Gündüz cephesi ve havuz aynı evin varışını sürdürür.
- **Hareket 8.0:** Yakın cepheden dengeli açıya hareket okunur; tam siyah kesme görünmez.
- **Kadraj 7.5:** Dar pencerede ev belirgin; havuz alt kenarı ve çevre kırpılır.
- **Okuma 7.5:** Arrival kartı balkon/havuz üzerinde; açıklama için sakin alan sınırlıdır.

Kaynak kareleri: **02:08.60** — Dikey villa varışı; **02:09.15** — Arrival bilgisi.

**9 kabul koşulu:** Dikey kameranın odak noktası sabit olmalı; açıklama cephe ve havuzu örtmeden sakin bir alanda okunmalı.

Referans seçkisi:

- [likova-mobile/7 · Mobil model ve büyük sayılar](../casestudy2.html#likova-mobile-7): Mobil model kadrajı değişirken büyük bilgi altta ayrı bir bölgede kalıyor. Angora’da da kamera varışı ile caption’ı eşleştir; model stilini kopyalama.
- [era-mobile/1 · Mobil hero ve yaklaşma](../casestudy2.html#era-mobile-1): Yaklaşmanın belirli bir mimari hedefi var. Angora’daki her kamera parçasının da ev/havuz odağı sabit kalmalı.

**Sınır:** Klip süresi kullanıcı beklemesini içerir; bu kayıttan tek wheel hareketi sayısı veya input gecikmesi ölçülmez.

#### M03 · Mobil / 02 Perspective

[Gerçek klibi aç](../casestudy2.html#active-mobile-3) · 02:09.70–02:11.30 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Yükselen açı villayı ve havuzu aynı mekânda tutar.
- **Hareket 8.5:** Kamera hareketi akıcı; metin hareketten sonra ayrı fade ile değişir.
- **Kadraj 7.5:** Çatı ve havuz seçilir; havuz köşesi dar kadrajın sınırına dayanır.
- **Okuma 7.5:** Eski Arrival kısa süre kalır; yeni Perspective açıklaması cephe üstünde yoğundur.

Kaynak kareleri: **02:10.13** — Yükselen açı ve eski metin; **02:10.70** — Yeni Perspective bilgisi.

**9 kabul koşulu:** Arrival hareketten önce kapanmalı; Perspective duruşunda havuz ve metin birbirini örtmemeli.

Referans seçkisi:

- [likova-mobile/7 · Mobil model ve büyük sayılar](../casestudy2.html#likova-mobile-7): Mobil model kadrajı değişirken büyük bilgi altta ayrı bir bölgede kalıyor. Angora’da da kamera varışı ile caption’ı eşleştir; model stilini kopyalama.
- [era-mobile/1 · Mobil hero ve yaklaşma](../casestudy2.html#era-mobile-1): Yaklaşmanın belirli bir mimari hedefi var. Angora’daki her kamera parçasının da ev/havuz odağı sabit kalmalı.

**Sınır:** Klip süresi kullanıcı beklemesini içerir; bu kayıttan tek wheel hareketi sayısı veya input gecikmesi ölçülmez.

#### M04 · Mobil / 03 Garden

[Gerçek klibi aç](../casestudy2.html#active-mobile-4) · 02:11.30–02:12.75 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Cepheye iniş önceki villa odağını korur.
- **Hareket 8.5:** Alçalan rota temiz; Garden varışında fazladan pulse görünmez.
- **Kadraj 8.0:** Villa dikey sahneye iyi oturur; sağ havuz kenarı kadrajdan çıkar.
- **Okuma 7.5:** Life opens outside açıya uyar; küçük açıklama aydınlık havuz üzerinde zayıftır.

Kaynak kareleri: **02:11.68** — Bahçe cephesine iniş; **02:12.22** — Garden yazısı ve son açı.

**9 kabul koşulu:** Açıklama için sabit kontrast kurulmalı; son villa duruşu kâğıt devrinde bütünüyle korunmalı.

Referans seçkisi:

- [likova-mobile/7 · Mobil model ve büyük sayılar](../casestudy2.html#likova-mobile-7): Mobil model kadrajı değişirken büyük bilgi altta ayrı bir bölgede kalıyor. Angora’da da kamera varışı ile caption’ı eşleştir; model stilini kopyalama.
- [era-mobile/1 · Mobil hero ve yaklaşma](../casestudy2.html#era-mobile-1): Yaklaşmanın belirli bir mimari hedefi var. Angora’daki her kamera parçasının da ev/havuz odağı sabit kalmalı.

**Sınır:** Klip süresi kullanıcı beklemesini içerir; bu kayıttan tek wheel hareketi sayısı veya input gecikmesi ölçülmez.

#### M05 · Mobil film → kâğıt eşik

[Gerçek klibi aç](../casestudy2.html#active-mobile-5) · 02:12.75–02:14.00 · **5.0/10** · Yeniden ele al.

- **Devamlılık 5.0:** Villa çok kısa sürede üst şeride çıkar; kâğıt bölüme odak bağı kurulmaz.
- **Hareket 5.5:** Düşey çıkış evin ölçeğini birlikte küçültmek yerine üst kısmını keser.
- **Kadraj 5.0:** 132.97’de binanın çoğu kaybolur; yalnız çim şeridi kalır.
- **Okuma 7.0:** Paragraf soluk açılırken başlık satırları maskelenmiş halde tamamlanır.

Kaynak kareleri: **02:12.97** — Ev yerine çim şeridi kalır; **02:13.20** — Başlık satırları henüz tamamlanmamış.

**9 kabul koşulu:** Dikey ev bütünü ortak odakta küçülmeli veya gelen yüzeyle kontrollü devredilmeli; başlık ardından açılmalı.

Referans seçkisi:

- [era-mobile/17 · Mimari → proje bilgisi](../casestudy2.html#era-mobile-17): Mobil mimari görüntü üstten ayrılırken beyaz bilgi yüzeyi görünür. Angora’da yeni kâğıt zemini görüntünün son duruşuyla birlikte okut.
- [likova-mobile/9 · Araç içi video ve beyaz metin](../casestudy2.html#likova-mobile-9): Video akarken yeni metin yüzeyi görüntüyü devralıyor. Ani bölüm değişimi yerine önce gelen yüzeyi tanıtma sırası uygun.

**Sınır:** ERA’nın kemerini veya Likova’nın basamağını Angora’ya doğrudan taşıma. Bu eşiğin sorunu dekor eksikliği değil, son kadrajın erken kaybolması.

#### M06 · Mobil ev özeti ve ölçüler

[Gerçek klibi aç](../casestudy2.html#active-mobile-6) · 02:14.00–02:16.50 · **8.0/10** · Koru.

- **Devamlılık 8.0:** Tek kolon ev anlatısını iki kolon ölçüler takip eder.
- **Hareket 8.0:** Düşey okuma düzeni temiz; girişte paragraf henüz düşük opasitelidir.
- **Kadraj 8.5:** Başlık ve paragraf dar ekrana sığar; dört ölçü düzenli iki kolondadır.
- **Okuma 8.0:** Uzun metin okunur; ölçü isimleri ve dipnot küçük kalır.

Kaynak kareleri: **02:14.00** — Tek kolon ev açıklaması; **02:15.58** — İki kolon ölçüler.

**9 kabul koşulu:** Paragraf okunacak konuma geldiğinde tam opak olmalı; ölçü isimleri dar ekranda rahat okunmalı.

Referans seçkisi:

- [era-mobile/10 · Konut tipi ve ölçüler](../casestudy2.html#era-mobile-10): Görsel, kat adı ve ölçüler aynı bilgi grubunda. Angora’da da 500/400/900 bilgisini kendi açıklamasıyla birlikte tut.

**Sınır:** Sayı saydırma, dönen metin veya ek maske gerekmiyor; bu bölümün görevi evin ölçeğini açıklamak.

#### M07 · Mobil sokak cephesi → açıklama

[Gerçek klibi aç](../casestudy2.html#active-mobile-7) · 02:16.50–02:19.85 · **8.0/10** · Koru.

- **Devamlılık 8.0:** Cadde resmi önce, giriş açıklaması sonra gelir; yön bilgisi doğru.
- **Hareket 8.0:** Fotoğraf hafif büyür ve yukarı çıkar; metin aynı düşey sırayı takip eder.
- **Kadraj 8.0:** Cephe ve giriş yolu ilk durakta görünür; parallax sonunda üst çatı kırpılır.
- **Okuma 8.0:** Street/garden açıklaması açık; keşif linki ve caption küçük.

Kaynak kareleri: **02:17.42** — Cadde fotoğrafı duruşu; **02:18.62** — Fotoğraf ve giriş açıklaması.

**9 kabul koşulu:** Parallax sırasında bina başı erken kesilmemeli; fotoğraf–caption ilişkisi ve giriş linki okunur kalmalı.

Referans seçkisi:

- [era-mobile/13 · İç mekân: kolonlar tek akışa dönüşür](../casestudy2.html#era-mobile-13): Fotoğraf ve açıklama aynı bloktayken kolonlar farklı hızda ilerliyor. Bağımsız caption yerine bağlı bir fotoğraf–metin çifti kullan.
- [likova-mobile/6 · Metin ve cephe detayı](../casestudy2.html#likova-mobile-6): Cephe detaylarının kendi kadrajları korunuyor. Angora’da tek güçlü sokak görünümü yeterli; ikinci fotoğraf sırf efekt için eklenmemeli.

**Sınır:** Aerial ile sokak kapısı fotoğrafını aynı gelişigüzel kadrajda değiştirerek giriş yönünü belirsizleştirme.

#### M08 · Mobil yatak odası penceresi

[Gerçek klibi aç](../casestudy2.html#active-mobile-8) · 02:19.85–02:22.40 · **7.0/10** · İncelt.

- **Devamlılık 8.0:** İlk yatak odası başlık ve açıklamadan sonra gelir.
- **Hareket 8.0:** Tek kolon düzeni, minyatür desktop sütunu oluşturmadan ilerler.
- **Kadraj 8.0:** İlk oda geniş ve doğru oranlı; altından havuz sahnesi yaklaşır.
- **Okuma 7.0:** Diğer iki odaya erişim bu kayıtta açıklanmıyor; swipe yapılmadı.

Kaynak kareleri: **02:20.53** — Başlık ve ilk oda; **02:21.47** — İlk oda ve bahçe eşiği.

**9 kabul koşulu:** Diğer oda fotoğraflarına erişim görünür sayaç veya swipe ipucuyla anlaşılmalı; ilk fotoğrafın tam durağı korunmalı.

Referans seçkisi:

- [era-mobile/13 · İç mekân: kolonlar tek akışa dönüşür](../casestudy2.html#era-mobile-13): İç mekân fotoğraflarının farklı hizalarda ilerlemesi Angora’nın oda sırasına uygun. Görsel/caption bağı korunmalı.
- [era-mobile/15 · İç galerinin mobil kontrolü](../casestudy2.html#era-mobile-15): Son fotoğrafın çıkışında sonraki mimari sahnenin ilk durumu görünüyor. Bahçe girişini bu devamlılıkla kur.

**Sınır:** Kayıtta mobil oda galerisi swipe edilmedi; diğer fotoğrafların çalıştığına dair not verilmedi.

#### M09 · Mobil odadan havuz sahnesine

[Gerçek klibi aç](../casestudy2.html#active-mobile-9) · 02:22.40–02:24.35 · **6.5/10** · İncelt.

- **Devamlılık 7.5:** Yatak odasından dış sahneye aynı düşey yönle geçilir.
- **Hareket 8.0:** Aerial alttan yükselir; video karesinde siyah kesme görünmez.
- **Kadraj 6.5:** Yeşil kart villa tabanını ve havuzun büyük kısmını örter.
- **Okuma 6.5:** Stay a little longer yazısı ilk havuz aerial’ı hâlâ dururken gelir.

Kaynak kareleri: **02:22.93** — Havuz aerial’ı ve büyük bilgi kartı; **02:24.33** — Teras yazısı, ilk fotoğraf üzerinde.

**9 kabul koşulu:** Havuz ve bina ayrı okunur alan bulmalı; teras bilgisi kendi fotoğrafından önce gelmemeli.

Referans seçkisi:

- [era-mobile/18 · Teras ve mobil kapanış](../casestudy2.html#era-mobile-18): Geniş teras ve büyük başlık tek sahne olarak alttan yerleşiyor. Angora’nın havuz girişinde aynı görüntü-önce/metin-sonra sırası uygun.
- [likova-mobile/14 · Mimari fotoğraf ve koyu kart](../casestudy2.html#likova-mobile-14): Görsel büyürken bilgi yüzeyi kendi eşiğini koruyor. Önceki odadan bahçeye geçişin ölçek farkını bu ilkeyle yönet.

**Sınır:** İki fotoğrafın birleşme efekti bu geçişe uygun değil; oda ile aerial aynı kamera sahnesi değil.

#### M10 · Mobil / havuz → teras

[Gerçek klibi aç](../casestudy2.html#active-mobile-10) · 02:24.35–02:25.60 · **6.5/10** · İncelt.

- **Devamlılık 7.5:** Havuzdan teras görünümüne dış mekân sırası sürer.
- **Hareket 8.0:** Teras fotoğrafı düz kenar reveal’iyle alttan devralır.
- **Kadraj 7.5:** Cephe üstü görünür; kart alt teras ve havuz ilişkisini kapatır.
- **Okuma 6.5:** Bahçe metni teras fotoğrafı bitmeden değişir.

Kaynak kareleri: **02:24.68** — Teras görüntüsü devralır; **02:25.58** — Bahçe bilgisi teras üzerinde.

**9 kabul koşulu:** Yeni fotoğraf, aktif tab ve açıklama tek durum olmalı; kart alt cepheyi kapatmamalı.

Referans seçkisi:

- [era-mobile/11 · Amenity: aynı seçim, dikey kadraj](../casestudy2.html#era-mobile-11): Seçili öğe, açıklama ve fotoğraf aynı durum değişimini taşıyor. Angora’da bu senkronu koru; ERA’daki eğimli maskeyi alma.
- [likova-mobile/12 · Mobil yaşam: koşu ve kayak](../casestudy2.html#likova-mobile-12): Yaşam resmi değişimi yeni bir bilgi getiriyor. Fotoğrafı aynı pencerede değiştirmek burada yeterli bir hareket.

**Sınır:** Diyagonal kesim, dekoratif çizgi veya tekrar kamera dalışı ekleme; mekân değişimini fotoğraf ve bilgi birlikte anlatıyor.

#### M11 · Mobil / teras → bahçe

[Gerçek klibi aç](../casestudy2.html#active-mobile-11) · 02:25.60–02:27.55 · **6.5/10** · İncelt.

- **Devamlılık 7.5:** Terasın ardından bahçe yolu gelir; kesit sonunda geri dönüş başlar.
- **Hareket 8.0:** Aynı alttan reveal yönü korunur; yeni kenar görüntüyü ikiye böler.
- **Kadraj 7.5:** Bahçe yolu okunur; ana başlık yaprakların üzerinde kontrast kaybeder.
- **Okuma 6.5:** Garden bilgisi önce gelir; finalde önceki teras metni yeniden yaklaşır.

Kaynak kareleri: **02:26.13** — Bahçe yolu devralır; **02:26.83** — Bahçe fotoğrafı durakta.

**9 kabul koşulu:** Bahçe durumu tam ve okunur kalmalı; ters yönde bilgi fotoğraftan erken değişmemeli.

Referans seçkisi:

- [era-mobile/11 · Amenity: aynı seçim, dikey kadraj](../casestudy2.html#era-mobile-11): Seçili öğe, açıklama ve fotoğraf aynı durum değişimini taşıyor. Angora’da bu senkronu koru; ERA’daki eğimli maskeyi alma.
- [likova-mobile/12 · Mobil yaşam: koşu ve kayak](../casestudy2.html#likova-mobile-12): Yaşam resmi değişimi yeni bir bilgi getiriyor. Fotoğrafı aynı pencerede değiştirmek burada yeterli bir hareket.

**Sınır:** Diyagonal kesim, dekoratif çizgi veya tekrar kamera dalışı ekleme; mekân değişimini fotoğraf ve bilgi birlikte anlatıyor.

#### M12 · Mobil / bahçe → teras · geri

[Gerçek klibi aç](../casestudy2.html#active-mobile-12) · 02:27.55–02:28.50 · **7.0/10** · İncelt.

- **Devamlılık 8.0:** Geri akış aynı teras fotoğrafına döner; yeni giriş kararması görülmez.
- **Hareket 8.0:** Ters hareket temiz; fotoğraf bilgiden önce tam yerleşmez.
- **Kadraj 7.5:** Teras binası görünür, yeşil kart yine alt cepheyi örter.
- **Okuma 7.0:** Teras yazısı doğru konuya döner; sonda pool seçimi erken belirir.

Kaynak kareleri: **02:27.80** — Teras fotoğrafı geri gelir; **02:28.15** — Teras kartı ve fotoğrafı.

**9 kabul koşulu:** Geri dönüşte de fotoğraf ve tab aynı anda tamamlanmalı; havuz seçimi bir sonraki harekete kadar beklemeli.

Referans seçkisi:

- [era-mobile/20 · Footer → teras geri dönüşü](../casestudy2.html#era-mobile-20): Geri harekette önceki görüntü, aynı kurgu ters okunarak geri geliyor. Angora’da da reset yerine durum sürekliliği uygun.
- [likova-mobile/9 · Araç içi video ve beyaz metin](../casestudy2.html#likova-mobile-9): İleri ve geri katmanlar aynı film bağlamına dönüyor. Fotoğraf geri ziyaretinde yeni bir kararma ekleme.

**Sınır:** Kayıttaki geri dönüş, wheel kilidinin her cihazda kusursuz olduğunu kanıtlamaz. Bu not yalnız görünen geri akış içindir.

#### M13 · Mobil / teras → havuz · geri

[Gerçek klibi aç](../casestudy2.html#active-mobile-13) · 02:28.50–02:29.55 · **6.5/10** · İncelt.

- **Devamlılık 8.0:** İlk aerial ve pool bilgisine aynı dış mekân durumuyla dönülür.
- **Hareket 8.0:** Geri fotoğraf reveal’i kesintisiz; full siyah reset yoktur.
- **Kadraj 6.5:** Dar aerial ve kart havuzun büyük kısmını tekrar kapatır.
- **Okuma 7.5:** Pool kartı doğru fotoğrafla eşleşir; küçük tablar zayıftır.

Kaynak kareleri: **02:28.78** — İlk havuz aerial’ı dönmüş; **02:29.15** — Pool bilgisi görünür.

**9 kabul koşulu:** İlk havuz kadrajı ileri ve geri gelişte aynı açık alanı korumalı; kart havuzu göstermeye engel olmamalı.

Referans seçkisi:

- [era-mobile/20 · Footer → teras geri dönüşü](../casestudy2.html#era-mobile-20): Geri harekette önceki görüntü, aynı kurgu ters okunarak geri geliyor. Angora’da da reset yerine durum sürekliliği uygun.
- [likova-mobile/9 · Araç içi video ve beyaz metin](../casestudy2.html#likova-mobile-9): İleri ve geri katmanlar aynı film bağlamına dönüyor. Fotoğraf geri ziyaretinde yeni bir kararma ekleme.

**Sınır:** Kayıttaki geri dönüş, wheel kilidinin her cihazda kusursuz olduğunu kanıtlamaz. Bu not yalnız görünen geri akış içindir.

#### M14 · Mobil / havuz → yatak odası · geri

[Gerçek klibi aç](../casestudy2.html#active-mobile-14) · 02:29.55–02:30.65 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Pool sahnesinden önceki yatak odasına aynı düşey sıra ile dönülür.
- **Hareket 8.0:** Kâğıt yüzey geri gelir; son karelerde yeniden ileri çıkış başlar.
- **Kadraj 8.0:** Oda fotoğrafı yeniden tam genişlikte görünür; bahçe kenarı altta kalır.
- **Okuma 7.5:** Oda caption’ı doğru döner; hızlı yeniden ileri hareket okuma süresini kısaltır.

Kaynak kareleri: **02:29.85** — Yatak odasına geri varış; **02:30.23** — Oda ve aynı bahçe kenarı.

**9 kabul koşulu:** İleri ve geri geliş aynı oda konumunu korumalı; bahçe tekrar girmeden oda caption’ı okunur kalmalı.

Referans seçkisi:

- [era-mobile/20 · Footer → teras geri dönüşü](../casestudy2.html#era-mobile-20): Geri harekette önceki görüntü, aynı kurgu ters okunarak geri geliyor. Angora’da da reset yerine durum sürekliliği uygun.
- [likova-mobile/9 · Araç içi video ve beyaz metin](../casestudy2.html#likova-mobile-9): İleri ve geri katmanlar aynı film bağlamına dönüyor. Fotoğraf geri ziyaretinde yeni bir kararma ekleme.

**Sınır:** Kayıttaki geri dönüş, wheel kilidinin her cihazda kusursuz olduğunu kanıtlamaz. Bu not yalnız görünen geri akış içindir.

#### M15 · Mobil / odadan havuza · tekrar

[Gerçek klibi aç](../casestudy2.html#active-mobile-15) · 02:30.65–02:32.40 · **6.5/10** · İncelt.

- **Devamlılık 7.5:** İkinci giriş aynı pool durumundan başlar; resetle farklı fotoğraf açılmaz.
- **Hareket 8.0:** Düşey devir ilk ziyaretle aynı temiz yönü izler.
- **Kadraj 6.5:** Kart yine bina tabanını ve havuzu örter.
- **Okuma 6.5:** İkinci ziyarette de teras metni ilk aerial bitmeden görünür.

Kaynak kareleri: **02:31.12** — Pool durağı tekrar; **02:32.38** — Teras yazısı, ilk aerial üzerinde.

**9 kabul koşulu:** İlk ziyaretteki iki sorun tekrar çözülmeli: açık havuz kadrajı ve aynı anda değişen fotoğraf/tab/metin.

Tekrar ziyaret: Mobil odadan havuz sahnesine. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [era-mobile/18 · Teras ve mobil kapanış](../casestudy2.html#era-mobile-18): Geniş teras ve büyük başlık tek sahne olarak alttan yerleşiyor. Angora’nın havuz girişinde aynı görüntü-önce/metin-sonra sırası uygun.
- [likova-mobile/14 · Mimari fotoğraf ve koyu kart](../casestudy2.html#likova-mobile-14): Görsel büyürken bilgi yüzeyi kendi eşiğini koruyor. Önceki odadan bahçeye geçişin ölçek farkını bu ilkeyle yönet.

**Sınır:** İki fotoğrafın birleşme efekti bu geçişe uygun değil; oda ile aerial aynı kamera sahnesi değil.

#### M16 · Mobil / havuz → teras · tekrar

[Gerçek klibi aç](../casestudy2.html#active-mobile-16) · 02:32.40–02:33.45 · **6.5/10** · İncelt.

- **Devamlılık 7.5:** İkinci pool→teras aynı yaşam sırasını sürdürür.
- **Hareket 8.0:** Alttan reveal aynı yönde; kesintili yükleme görünmez.
- **Kadraj 7.5:** Teras cephesi sığar; alt mekânı büyük kart kapatır.
- **Okuma 6.5:** Garden metni teras fotoğrafı hâlâ ekrandayken erken açılır.

Kaynak kareleri: **02:32.68** — Teras reveal’i tekrar; **02:33.43** — Garden metni, teras resmi üzerinde.

**9 kabul koşulu:** Teras fotoğrafı tamamlanınca kendi bilgisi kalmalı; Garden yazısı yalnız sonraki fotoğrafla açılmalı.

Tekrar ziyaret: Mobil / havuz → teras. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [era-mobile/11 · Amenity: aynı seçim, dikey kadraj](../casestudy2.html#era-mobile-11): Seçili öğe, açıklama ve fotoğraf aynı durum değişimini taşıyor. Angora’da bu senkronu koru; ERA’daki eğimli maskeyi alma.
- [likova-mobile/12 · Mobil yaşam: koşu ve kayak](../casestudy2.html#likova-mobile-12): Yaşam resmi değişimi yeni bir bilgi getiriyor. Fotoğrafı aynı pencerede değiştirmek burada yeterli bir hareket.

**Sınır:** Diyagonal kesim, dekoratif çizgi veya tekrar kamera dalışı ekleme; mekân değişimini fotoğraf ve bilgi birlikte anlatıyor.

#### M17 · Mobil / teras → bahçe · tekrar

[Gerçek klibi aç](../casestudy2.html#active-mobile-17) · 02:33.45–02:34.45 · **7.0/10** · İncelt.

- **Devamlılık 7.5:** İkinci teras→bahçe yolu aynı fotoğrafa ve bilgiye ulaşır.
- **Hareket 8.0:** Reveal temiz; bahçe duruşunda ilave solma görünmez.
- **Kadraj 7.5:** Yol ve yan cephe görünür; başlık yaprakların üstünde kalır.
- **Okuma 7.0:** Garden kartı konuya uyar; küçük metin ve tab yoğunluğu sürer.

Kaynak kareleri: **02:33.72** — Bahçe yolu yeniden gelir; **02:34.08** — Bahçe durağı tekrar.

**9 kabul koşulu:** Bahçe yolunun başlık alanına sabit kontrast ver; kart boyutu ve tabların okunurluğu diğer iki durakla eşit olmalı.

Tekrar ziyaret: Mobil / teras → bahçe. Bu kesit ayrıca incelendi; aynı görünen kusur aynı notu alabilir.

Referans seçkisi:

- [era-mobile/11 · Amenity: aynı seçim, dikey kadraj](../casestudy2.html#era-mobile-11): Seçili öğe, açıklama ve fotoğraf aynı durum değişimini taşıyor. Angora’da bu senkronu koru; ERA’daki eğimli maskeyi alma.
- [likova-mobile/12 · Mobil yaşam: koşu ve kayak](../casestudy2.html#likova-mobile-12): Yaşam resmi değişimi yeni bir bilgi getiriyor. Fotoğrafı aynı pencerede değiştirmek burada yeterli bir hareket.

**Sınır:** Diyagonal kesim, dekoratif çizgi veya tekrar kamera dalışı ekleme; mekân değişimini fotoğraf ve bilgi birlikte anlatıyor.

#### M18 · Mobil bahçe → iç mekân

[Gerçek klibi aç](../casestudy2.html#active-mobile-18) · 02:34.45–02:35.45 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Bahçe altından salonun kâğıt sahnesi gelir; konu bağlantısı açıktır.
- **Hareket 7.5:** Yüzey devri tek yönde; başlık ayrı satır maskesiyle geç tamamlanır.
- **Kadraj 8.0:** Salon fotoğrafının ilk kenarı yeni yüzeyin içinde görünür.
- **Okuma 7.5:** Paragraf başlıktan önce soluk belirir; kısa bir okuma belirsizliği oluşur.

Kaynak kareleri: **02:34.72** — Kâğıt yüzey devralır; **02:35.08** — Salon başlığı ve ilk resim.

**9 kabul koşulu:** Başlık tam oluşunca açıklama açılmalı; ilk salon fotoğrafı bahçenin sonuyla daha yakın bağlanmalı.

Referans seçkisi:

- [era-mobile/12 · İç mekânın kavisli girişi](../casestudy2.html#era-mobile-12): Önceki amenity fotoğrafının üstünde yeni iç mekân yüzeyi görünür. Kavis şeklinden önce bu yüzey devralma sırasını al.
- [likova-mobile/15 · Mimarın beyaz kartı](../casestudy2.html#likova-mobile-15): Bilgi kartı dış cephe ile lobi arasında anlatım köprüsü oluyor. Bahçe → salon bağlantısında küçük bir bilgi eşiği işe yarar.

**Sınır:** Son dış fotoğrafı gereksiz bir boş kutuya küçültme. Yeni iç mekân yüzeyi yeterli anlatı eşiği sağlar.

#### M19 · Mobil salon → ikinci açı

[Gerçek klibi aç](../casestudy2.html#active-mobile-19) · 02:35.45–02:38.65 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Salon ana fotoğrafı, kullanım metni ve ikinci açı aynı sıradadır.
- **Hareket 8.0:** Tek kolon akışı düzenli; fotoğrafla paragraf arasında ek maske yoktur.
- **Kadraj 7.5:** Büyük resim dar dikey kırpımla ağırlıkla yemek alanını gösterir.
- **Okuma 8.0:** Salon paragrafı okunur; ikinci açının altyazısı küçük.

Kaynak kareleri: **02:36.32** — Salonun dikey kırpımı; **02:37.48** — Salon açıklaması ve ikinci açı.

**9 kabul koşulu:** Ana fotoğraf oda ölçeğini daha fazla göstermeli; ikinci açı caption’ı aynı okunur genişliği korumalı.

Referans seçkisi:

- [era-mobile/13 · İç mekân: kolonlar tek akışa dönüşür](../casestudy2.html#era-mobile-13): Büyük ve küçük fotoğrafların farklı hizalarda okunması bu bölümün ölçeğine uygun.
- [likova-mobile/17 · Lobi bilgisi ve mobil galeri](../casestudy2.html#likova-mobile-17): Ana mekân fotoğrafı ve ardından gelen ayrıntılar aynı bilgi sırasını koruyor. Salon → ikinci açı sırasını bu sadelikle sürdür.

**Sınır:** Büyük salon görüntüsünün üzerine sırf malzeme referansı için kayan küre, panel veya yapay 3D parçalar ekleme.

#### M20 · Mobil salon → özel oda

[Gerçek klibi aç](../casestudy2.html#active-mobile-20) · 02:38.65–02:42.35 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** İkinci salon açısından privacy metnine ve yatak odasına doğru sıra sürer.
- **Hareket 8.0:** Düşey akış tutarlı; açıklama ilk fotoğraftan uzun süre ayrı kalır.
- **Kadraj 7.5:** Bed fotoğrafı dar ve yakın; giyinme resmi sonra daha geniş görünür.
- **Okuma 8.0:** Privacy ve iki kullanım paragrafı okunur; fotoğraf altyazısı küçüktür.

Kaynak kareleri: **02:39.65** — Privacy açıklaması; **02:41.00** — Yatak odası ve giyinme resmi.

**9 kabul koşulu:** Başlık ilk fotoğrafa yaklaşmalı; ana odanın dar kırpımı ile giyinme detayının ölçeği dengelenmeli.

Referans seçkisi:

- [era-mobile/13 · İç mekân: kolonlar tek akışa dönüşür](../casestudy2.html#era-mobile-13): Farklı fotoğraf büyüklükleri ve açıklamalar tek akışta kalabiliyor. Boşlukları bu fotoğraf ilişkisi belirlesin.

**Sınır:** Salon ile yatak odasının görüntülerini aynı mimari sahneymiş gibi eritme; iki odanın kimliği ayrı kalmalı.

#### M21 · Mobil yeşil mutfak sahnesine giriş

[Gerçek klibi aç](../casestudy2.html#active-mobile-21) · 02:42.35–02:44.65 · **7.0/10** · İncelt.

- **Devamlılık 7.0:** İlk mutfaktan sonra model eşiği görünür; diğer iki mutfak henüz gezilmemiştir.
- **Hareket 8.0:** Yeşil yüzey ve ilk fotoğraf düzenli yükselir.
- **Kadraj 8.0:** İlk mutfak tam oranlı ve yeterince büyüktür.
- **Okuma 7.5:** Gather üst menüye yaklaşır; yatay devam ile düşey çıkış birlikte görünür.

Kaynak kareleri: **02:42.97** — İlk mutfak ve Gather; **02:43.80** — Model, ilk mutfağın altında erken görünür.

**9 kabul koşulu:** Üç mutfağın yatay devamı açık anlaşılmalı; model devri son mutfaktan sonra bilinçli biçimde yapılmalı.

Referans seçkisi:

- [likova-mobile/18 · Ofis videosu ve hizmet kartları](../casestudy2.html#likova-mobile-18): Video/önceki içerik, koyu çalışma alanı yüzeyi ve mekân fotoğrafı sırayla açılıyor. Alınacak şey bu net sıra. Odak: 01:29.30–01:32.60.
- [era-mobile/12 · İç mekânın kavisli girişi](../casestudy2.html#era-mobile-12): Yeni bölümün rengi başlığa zemin oluşturuyor. Angora’da bunu düz ve sade bir eşikle yap.

**Sınır:** Her renk değişiminde aynı dev maske şakasını tekrarlama. Bu ara geçiş sakin bir yüzey değişimi olarak kalabilir.

#### M22 · Mobil / model eşiğinden mutfağa geri

[Gerçek klibi aç](../casestudy2.html#active-mobile-22) · 02:44.65–02:45.55 · **7.0/10** · İncelt.

- **Devamlılık 8.0:** Geri geliş aynı ilk mutfağı korur; önceki düşük reset teşhisi kayıtta doğrulanmaz.
- **Hareket 8.0:** Model kenarı geri çekilir, ardından fotoğraf rayı yana ilerlemeye başlar.
- **Kadraj 8.0:** Mutfak resmi tam; model eşiğinin küçük parçası altta kalır.
- **Okuma 7.0:** Gather satırları sabit menünün altına sıkışır; ray ipucu zayıftır.

Kaynak kareleri: **02:44.88** — Aynı ilk mutfak geri gelmiş; **02:45.22** — İlk mutfak durağı.

**9 kabul koşulu:** İlk mutfak konumunu koru; sabit menü başlığı örtmemeli ve yatay devam ipucu açık olmalı.

Referans seçkisi:

- [era-mobile/20 · Footer → teras geri dönüşü](../casestudy2.html#era-mobile-20): Geri harekette önceki görüntü, aynı kurgu ters okunarak geri geliyor. Angora’da da reset yerine durum sürekliliği uygun.
- [likova-mobile/9 · Araç içi video ve beyaz metin](../casestudy2.html#likova-mobile-9): İleri ve geri katmanlar aynı film bağlamına dönüyor. Fotoğraf geri ziyaretinde yeni bir kararma ekleme.

**Sınır:** Kayıttaki geri dönüş, wheel kilidinin her cihazda kusursuz olduğunu kanıtlamaz. Bu not yalnız görünen geri akış içindir.

#### M23 · Mobil / ana mutfak → bahçe mutfağı

[Gerçek klibi aç](../casestudy2.html#active-mobile-23) · 02:45.55–02:46.40 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Ana mutfaktan bağımsız Garden mutfağına kendi caption’ıyla geçilir.
- **Hareket 8.5:** Tek yatay hareket temiz; iki resim aynı rayda ilerler.
- **Kadraj 8.5:** Bahçe mutfağının tezgâh ve pencereleri tam oranlı görünür.
- **Okuma 7.5:** Caption doğru kullanım farkını söyler; küçük başlık menüye yaklaşır.

Kaynak kareleri: **02:45.78** — Bahçe mutfağı yana yerleşir; **02:46.08** — Garden mutfak durağı.

**9 kabul koşulu:** Fotoğraf rayı boyunca başlık ve aktif caption okunur kalmalı; model eşiği yatay harekete karışmamalı.

Referans seçkisi:

- [era-mobile/15 · İç galerinin mobil kontrolü](../casestudy2.html#era-mobile-15): Mobilde fotoğraf tek bir galeri penceresinde değişiyor. Angora’nın fotoğraf/caption eşleşmesi için uygun; desktop fotoğraf sütunu burada örnek alınmıyor.
- [likova-mobile/20 · Aerial → market → ekip](../casestudy2.html#likova-mobile-20): Her yeni görüntünün kendi kullanım açıklaması var. Çok görüntü kullanmayı haklı çıkaran şey içerik değişimi; şekilli maskeler değil.

**Sınır:** Üç mutfağı tek resimmiş gibi morph etme. Ortak genişlik ve düzenli aralık bu sahneyi zaten birleştiriyor.

#### M24 · Mobil / bahçe mutfağı → çatı mutfağı

[Gerçek klibi aç](../casestudy2.html#active-mobile-24) · 02:46.40–02:48.50 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Garden mutfağından üst kitchenette’e doğru kullanım sırası devam eder.
- **Hareket 8.5:** Tek yatay yön korunur; son fotoğrafın ardından düşey devir yaklaşır.
- **Kadraj 8.5:** Son mutfak doğru oranlı; giriş ve tezgâh birlikte görünür.
- **Okuma 7.5:** Üst kat caption’ı doğru ama küçük; Gather menü altında sıkışır.

Kaynak kareleri: **02:46.97** — Üst kitchenette yerleşir; **02:47.73** — Son mutfak durağı.

**9 kabul koşulu:** Son mutfak caption’ı netleşmeli; düşey model geçişi bu durağın sonundan başlamalı.

Referans seçkisi:

- [era-mobile/15 · İç galerinin mobil kontrolü](../casestudy2.html#era-mobile-15): Mobilde fotoğraf tek bir galeri penceresinde değişiyor. Angora’nın fotoğraf/caption eşleşmesi için uygun; desktop fotoğraf sütunu burada örnek alınmıyor.
- [likova-mobile/20 · Aerial → market → ekip](../casestudy2.html#likova-mobile-20): Her yeni görüntünün kendi kullanım açıklaması var. Çok görüntü kullanmayı haklı çıkaran şey içerik değişimi; şekilli maskeler değil.

**Sınır:** Üç mutfağı tek resimmiş gibi morph etme. Ortak genişlik ve düzenli aralık bu sahneyi zaten birleştiriyor.

#### M25 · Mobil fotoğraftan isometrik Garden’a

[Gerçek klibi aç](../casestudy2.html#active-mobile-25) · 02:48.50–02:51.15 · **6.5/10** · İncelt.

- **Devamlılık 8.0:** Son mutfaktan beyaz Garden teknik sahnesine açık bir devir var.
- **Hareket 8.0:** Model ve alt bilgi aynı düşey sırada gelir.
- **Kadraj 6.5:** Model çok sığ bir üst pencereye sıkışır; arsanın sağ kenarı kesilir.
- **Okuma 7.5:** Garden adı ve açıklama okunur; büyük açıklama alanına göre model küçüktür.

Kaynak kareleri: **02:49.22** — Model ve bilgi yerleşir; **02:50.18** — Sığ model penceresi ve geniş alt alan.

**9 kabul koşulu:** Model daha yüksek contain alanında bütün arsa ile görünmeli; açıklama alanıyla ölçek dengesi kurulmalı.

Referans seçkisi:

- [likova-mobile/13 · Bütün bina ve 3D çağrısı](../casestudy2.html#likova-mobile-13): Beyaz teknik yüzey, bütün model ve 3D çağrısını tek sahnede topluyor. Angora’da modelin sınırlarını önce, kat açıklamasını ardından okutmak bu ilişkiden bir uyarlama.
- [era-mobile/10 · Konut tipi ve ölçüler](../casestudy2.html#era-mobile-10): Kat adı ve ölçü, modeli açıklayan bir grup olarak yerleşiyor; bağımsız süs animasyonu değil.

**Sınır:** İsometriyi fotoğraf gibi cover ile kırpma. Evin tabanını, havuzu ve sınırı model sunumunun bütününde koru.

#### M26 · Mobil iso / Garden → Entrance

[Gerçek klibi aç](../casestudy2.html#active-mobile-26) · 02:51.15–02:52.35 · **6.5/10** · İncelt.

- **Devamlılık 7.5:** Garden→Entrance aynı yönde yükselir; ilk model kadrajı daha büyüktür.
- **Hareket 8.0:** Kat yükselmesi akıcı; geometri ve açıklama ayrı zamanlarda tamamlanır.
- **Kadraj 6.5:** Başlangıçtaki arsa kırpığı model küçülünce azalır.
- **Okuma 7.0:** Garden yazısı model değişirken kalır; Entrance yazısı sonra gelir.

Kaynak kareleri: **02:51.47** — Entrance oluşurken Garden bilgisi; **02:51.90** — Entrance bilgisi görünür.

**9 kabul koşulu:** Aynı model ölçeği ve arsa konturu korunmalı; kat adı, tab ve açıklama geometriyle birlikte değişmeli.

Referans seçkisi:

- [likova-mobile/7 · Mobil model ve büyük sayılar](../casestudy2.html#likova-mobile-7): Kamera durumu ile sayısal bilgi birlikte değişiyor. Angora’da aynı senkron ilkesi kat/model metnine uygulanmalı.
- [era-mobile/11 · Amenity: aynı seçim, dikey kadraj](../casestudy2.html#era-mobile-11): Görsel ve seçili bilgi tek durumdan yönetiliyor. Kat metnini modelden ayrı timer’larla geciktirme.

**Sınır:** Likova’daki orbit hareketini kat kesiti değişimine aynen uygulama. Burada yönü sabit tutmak katların ilişkisini anlatıyor.

#### M27 · Mobil iso / Entrance → First

[Gerçek klibi aç](../casestudy2.html#active-mobile-27) · 02:52.35–02:53.35 · **7.0/10** · İncelt.

- **Devamlılık 8.0:** Entrance’tan First’a aynı bina yönünde devam eder.
- **Hareket 8.5:** Geometri temiz yükselir; paragraf ayrıca düşük opasiteye iner.
- **Kadraj 7.0:** First bütünü sığar; odaların iç ayrıntıları küçük pencerede zor seçilir.
- **Okuma 7.0:** Kat adı görünür, eski açıklama bir süre kalır ve sonra solar.

Kaynak kareleri: **02:52.62** — Kat oluşur, eski açıklama kalır; **02:52.98** — First bilgisi.

**9 kabul koşulu:** Tek kat durumu model, etiket ve paragrafı yönetmeli; model okunacak yüksekliği korumalı.

Referans seçkisi:

- [likova-mobile/7 · Mobil model ve büyük sayılar](../casestudy2.html#likova-mobile-7): Kamera durumu ile sayısal bilgi birlikte değişiyor. Angora’da aynı senkron ilkesi kat/model metnine uygulanmalı.
- [era-mobile/11 · Amenity: aynı seçim, dikey kadraj](../casestudy2.html#era-mobile-11): Görsel ve seçili bilgi tek durumdan yönetiliyor. Kat metnini modelden ayrı timer’larla geciktirme.

**Sınır:** Likova’daki orbit hareketini kat kesiti değişimine aynen uygulama. Burada yönü sabit tutmak katların ilişkisini anlatıyor.

#### M28 · Mobil iso / First → Attic

[Gerçek klibi aç](../casestudy2.html#active-mobile-28) · 02:53.35–02:54.65 · **7.0/10** · İncelt.

- **Devamlılık 8.0:** First→Attic bina yönü ve kat sırasını korur.
- **Hareket 8.5:** Dönüşüm akıcı; Attic yazısı geometri varışının ardından açılır.
- **Kadraj 7.0:** Attic bina sığar fakat teknik odalar küçüktür.
- **Okuma 7.0:** Metnin ayrı fade’i kısa okuma boşluğu oluşturur.

Kaynak kareleri: **02:53.70** — Attic oluşurken solan metin; **02:54.17** — Attic etiketi ve yeni açıklama.

**9 kabul koşulu:** Attic duruşunda bütün açıklama tam opak olmalı; aynı son model karesine bağlanmalı.

Referans seçkisi:

- [likova-mobile/7 · Mobil model ve büyük sayılar](../casestudy2.html#likova-mobile-7): Kamera durumu ile sayısal bilgi birlikte değişiyor. Angora’da aynı senkron ilkesi kat/model metnine uygulanmalı.
- [era-mobile/11 · Amenity: aynı seçim, dikey kadraj](../casestudy2.html#era-mobile-11): Görsel ve seçili bilgi tek durumdan yönetiliyor. Kat metnini modelden ayrı timer’larla geciktirme.

**Sınır:** Likova’daki orbit hareketini kat kesiti değişimine aynen uygulama. Burada yönü sabit tutmak katların ilişkisini anlatıyor.

#### M29 · Mobil Attic iso → Garden plan

[Gerçek klibi aç](../casestudy2.html#active-mobile-29) · 02:54.65–02:56.50 · **5.0/10** · Yeniden ele al.

- **Devamlılık 5.0:** Attic iso’dan Garden plana seçili kat korunmadan geçilir.
- **Hareket 7.5:** Düşey devir vardır; aynı katın üstten görünüm bağlantısı kurulmaz.
- **Kadraj 6.0:** Plan alanını dev pinler kaplar; alt fotoğraf çok küçük kalır.
- **Okuma 5.5:** Oda isimleri, bakış konileri ve numaralar çakışan yoğun bir yüzeydedir.

Kaynak kareleri: **02:54.65** — Attic iso seçili; **02:55.82** — Garden planı ve dev pinler.

**9 kabul koşulu:** Attic’in planına bağlan; plan/pin/fotoğraf oranlarını yeniden kur ve aktif yönü ayrı okunur hale getir.

Referans seçkisi:

- [era-mobile/10 · Konut tipi ve ölçüler](../casestudy2.html#era-mobile-10): ERA’nın mobil kaydında plan detayına gidilmiyor. Kat adı ve ölçünün modelle birlikte okunması referans alınır; aynı kat iso → plan önerisi bir tasarım çıkarımıdır.
- [likova-mobile/13 · Bütün bina ve 3D çağrısı](../casestudy2.html#likova-mobile-13): Bütün modeli okunur tutan teknik eşik, plan geçişinin ön koşulu. Buradan rastgele kamera uçuşu alma.

**Sınır:** Referanslarda birebir floor-to-plan morph yok. Bu öneri Likova’nın bütün model mantığı ile ERA’nın plan-bilgi hiyerarşisinden yapılan tasarım çıkarımıdır.

#### M30 · Mobil Garden / kamera 3 ve bakış yönü

[Gerçek klibi aç](../casestudy2.html#active-mobile-30) · 02:56.50–02:57.40 · **5.5/10** · Yeniden ele al.

- **Devamlılık 8.0:** Garden kamera 3 ve living-room fotoğrafı aynı durumu gösterir.
- **Hareket N/A:** Pin seçimi değişimi kaydedilmedi; hareket başarısı puanlanmadı.
- **Kadraj 6.0:** Plan baskın, fotoğraf küçük; kamera numaraları oda konturlarını örter.
- **Okuma 5.5:** Aktif kahverengi 3 seçilir fakat baktığı yön yeterince ayırt edilmez.

Kaynak kareleri: **02:56.73** — Seçili kamera 3 ve küçük fotoğraf; **02:57.07** — Aynı kamera durumu.

**9 kabul koşulu:** Aktif pin, yüksek kontrastlı koni ve fotoğraf dengeli büyüklükte olmalı; seçim değişimi yeni test kaydında gösterilmeli.

Kesit türü: Durum okuma / seçim kaydedilmedi.

Referans seçkisi:

- [era-mobile/11 · Amenity: aynı seçim, dikey kadraj](../casestudy2.html#era-mobile-11): ERA mobil kaydında hero pinleri gösterilmiyor. Amenity seçiminin vurgusu, fotoğrafı ve açıklaması birlikte değişiyor; Angora kamera pinlerinde aynı durum senkronu kullanılabilir.
- [likova-mobile/11 · 8 → 5 → 18 ulaşım kartı](../casestudy2.html#likova-mobile-11): Seçili vurgu ile bilgi aynı zeminde birlikte değişiyor; planın kendisi gereksiz yere oynamıyor.

**Sınır:** Kayıtta kamera 3’ün seçili hali görülür; pinler arasında seçim değişimi gösterilmez. Diğer tüm noktaların çalıştığı varsayılmadı.

#### M31 · Mobil plan / Garden → Entrance

[Gerçek klibi aç](../casestudy2.html#active-mobile-31) · 02:57.40–02:58.75 · **5.5/10** · Yeniden ele al.

- **Devamlılık 8.0:** Garden ve Entrance plan–fotoğraf çiftleri tek rayda ilerler.
- **Hareket 8.0:** Tek yatay yön çalışır; plan ayrıca çizilerek oluşmaz.
- **Kadraj 6.0:** Entrance planındaki dev pinler, küçük fotoğraf ve bilgi şeridi dengesizdir.
- **Okuma 5.5:** Living room seçili kalır; oda adları ve bakış konisi çok zor okunur.

Kaynak kareleri: **02:57.77** — Entrance planı yerleşir; **02:58.20** — Pin yoğunluğu ve küçük salon fotoğrafı.

**9 kabul koşulu:** Katlar iki tam grup olarak kaymalı; aktif koni, oda adı ve büyük fotoğraf aynı varışta rahat okunmalı.

Referans seçkisi:

- [era-mobile/15 · İç galerinin mobil kontrolü](../casestudy2.html#era-mobile-15): Mobilde görsel aynı galeri penceresinde değişiyor. Angora’da plan+fotoğraf tek grup olarak yatay ilerleyebilir; ERA desktop yatay rayı mobilde birebir kopyalanmaz.
- [era-mobile/10 · Konut tipi ve ölçüler](../casestudy2.html#era-mobile-10): ERA’nın mobil kaydında plan detayına gidilmiyor. Kat adı ve ölçünün modelle birlikte okunması referans alınır; aynı kat iso → plan önerisi bir tasarım çıkarımıdır.

**Sınır:** Konturları yeniden çizerek oluşturma, diyagonal bölme veya her pin için ayrı pop efekti ekleme. Öncelik teknik okunurluk.

#### M32 · Mobil plan / Entrance → First

[Gerçek klibi aç](../casestudy2.html#active-mobile-32) · 02:58.75–03:00.15 · **5.0/10** · Yeniden ele al.

- **Devamlılık 8.0:** Entrance→First kat sırası ve bedroom fotoğrafı eşleşir.
- **Hareket 8.0:** Yatay hareket düzgün; First planı yan taraftan devralır.
- **Kadraj 5.5:** First’taki çok sayıdaki büyük pin koridor ve odaları örter.
- **Okuma 5.0:** Primary-bedroom etiketi görülebilir; plan oda isimleri birbirine girer.

Kaynak kareleri: **02:59.13** — First planı ve bedroom fotoğrafı; **02:59.63** — First pin kalabalığı.

**9 kabul koşulu:** First’a özel yoğunluk azaltılmalı; oda isimleri, pasif pinler ve aktif yön hiçbir noktada çakışmamalı.

Referans seçkisi:

- [era-mobile/15 · İç galerinin mobil kontrolü](../casestudy2.html#era-mobile-15): Mobilde görsel aynı galeri penceresinde değişiyor. Angora’da plan+fotoğraf tek grup olarak yatay ilerleyebilir; ERA desktop yatay rayı mobilde birebir kopyalanmaz.
- [era-mobile/10 · Konut tipi ve ölçüler](../casestudy2.html#era-mobile-10): ERA’nın mobil kaydında plan detayına gidilmiyor. Kat adı ve ölçünün modelle birlikte okunması referans alınır; aynı kat iso → plan önerisi bir tasarım çıkarımıdır.

**Sınır:** Konturları yeniden çizerek oluşturma, diyagonal bölme veya her pin için ayrı pop efekti ekleme. Öncelik teknik okunurluk.

#### M33 · Mobil plan / First → Attic

[Gerçek klibi aç](../casestudy2.html#active-mobile-33) · 03:00.15–03:01.45 · **5.5/10** · Yeniden ele al.

- **Devamlılık 8.0:** First→Attic sitting-area fotoğrafına aynı kat sırasıyla bağlanır.
- **Hareket 8.0:** Yatay geçiş tutarlı; pratik bilgi bölümü kesitin sonunda yaklaşır.
- **Kadraj 6.0:** Attic daha az pinlidir fakat fotoğrafa göre hâlâ baskın bir plandır.
- **Okuma 5.5:** Oda adları dev numaraların arasında zor seçilir; aktif yön zayıftır.

Kaynak kareleri: **03:00.50** — Attic planı devralır; **03:00.97** — Attic ve küçük sitting-area fotoğrafı.

**9 kabul koşulu:** Attic plan/fotoğraf dengesi kurulmalı; pratik bilgiye çıkıştan önce aktif kamera ve oda adı tam okunmalı.

Referans seçkisi:

- [era-mobile/15 · İç galerinin mobil kontrolü](../casestudy2.html#era-mobile-15): Mobilde görsel aynı galeri penceresinde değişiyor. Angora’da plan+fotoğraf tek grup olarak yatay ilerleyebilir; ERA desktop yatay rayı mobilde birebir kopyalanmaz.
- [era-mobile/10 · Konut tipi ve ölçüler](../casestudy2.html#era-mobile-10): ERA’nın mobil kaydında plan detayına gidilmiyor. Kat adı ve ölçünün modelle birlikte okunması referans alınır; aynı kat iso → plan önerisi bir tasarım çıkarımıdır.

**Sınır:** Konturları yeniden çizerek oluşturma, diyagonal bölme veya her pin için ayrı pop efekti ekleme. Öncelik teknik okunurluk.

#### M34 · Mobil plan → pratik ayrıntılar

[Gerçek klibi aç](../casestudy2.html#active-mobile-34) · 03:01.45–03:04.80 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Attic planının ardından dört kullanım özelliği tek kolonda gelir.
- **Hareket 7.5:** Başlık ve özellikler düşük opasiteyle geç belirir; sonra düzenli akar.
- **Kadraj 8.0:** Dar ekrana uygun tek kolon vardır; merdiven fotoğrafı uzun metnin sonunda gelir.
- **Okuma 7.5:** Özellikler okunur ama ilk girişlerinde zayıf kontrastlıdır.

Kaynak kareleri: **03:02.37** — Başlık ve ilk özellik; **03:03.57** — Son özellikler ve merdiven kenarı.

**9 kabul koşulu:** Özellikler okunacak konuma geldiğinde tam opak olmalı; merdiven anlatısı uzun bilgi dizisine daha yakın bağlanmalı.

Referans seçkisi:

- [likova-mobile/19 · Teknoloji ve enerji kartı](../casestudy2.html#likova-mobile-19): Teknik bilgi ile onu açıklayan görüntünün eşleşmesi yararlı. Angora’da bunu gerçek merdiven/lift bilgisine indir.
- [era-mobile/17 · Mimari → proje bilgisi](../casestudy2.html#era-mobile-17): Görüntüden bilgi alanına geçişte ortak bir yüzey korunuyor. Plan çıkışını aynı okunur teknik ritimle kur.

**Sınır:** Teknik altyapı görüntüsü veya dekoratif çizgi eklemek gerekmiyor; mevcut merdiven bu evin gerçek bağlantısını anlatıyor.

#### M35 · Mobil özellikler → merdiven

[Gerçek klibi aç](../casestudy2.html#active-mobile-35) · 03:04.80–03:05.55 · **8.0/10** · Koru.

- **Devamlılık 8.5:** Dört kat özelliği gerçek merdiven ve korkulukla tamamlanır.
- **Hareket 8.0:** Fotoğraf tek düşey yönde çıkar; mahalle resmi alttan duyurulur.
- **Kadraj 8.5:** Merdiven ana çizgisi ve korkuluk detayları dikey kadraja iyi sığar.
- **Okuma 8.0:** Four floors caption’ı kontrastlı ve konuya uygundur.

Kaynak kareleri: **03:05.00** — Merdiven ve caption; **03:05.27** — Merdiven çıkışı ve mahalle girişi.

**9 kabul koşulu:** Caption son kadraja kadar okunur kalmalı; mahalleye devirde merdiven görseli gereksiz dar şeride dönüşmemeli.

Referans seçkisi:

- [likova-mobile/19 · Teknoloji ve enerji kartı](../casestudy2.html#likova-mobile-19): Teknik bilgi ile onu açıklayan görüntünün eşleşmesi yararlı. Angora’da bunu gerçek merdiven/lift bilgisine indir.
- [era-mobile/17 · Mimari → proje bilgisi](../casestudy2.html#era-mobile-17): Görüntüden bilgi alanına geçişte ortak bir yüzey korunuyor. Plan çıkışını aynı okunur teknik ritimle kur.

**Sınır:** Teknik altyapı görüntüsü veya dekoratif çizgi eklemek gerekmiyor; mevcut merdiven bu evin gerçek bağlantısını anlatıyor.

#### M36 · Mobil merdiven → mahalle

[Gerçek klibi aç](../casestudy2.html#active-mobile-36) · 03:05.55–03:08.45 · **8.0/10** · Koru.

- **Devamlılık 8.0:** Merdivenden mahalle fotoğrafına, sonra şehir açıklamasına açık sıra var.
- **Hareket 8.0:** Fotoğraf hafif büyür ve yükselir; açıklama tek kolonda takip eder.
- **Kadraj 8.0:** Villa ve komşuları kareye yakın kadrajda birlikte seçilir.
- **Okuma 8.0:** A quieter side ve açıklama okunur; küçük adres/bağlantı zayıftır.

Kaynak kareleri: **03:06.33** — Mahalle fotoğrafı; **03:07.83** — Mahalle açıklaması.

**9 kabul koşulu:** Mahalle fotoğrafının ev odağı büyüme boyunca korunmalı; adres/keşif bilgisi rahat okunmalı.

Referans seçkisi:

- [era-mobile/9 · Aerial → konutlar](../casestudy2.html#era-mobile-9): Geniş çevre görüntüsü bir ölçek açılımı sağlıyor. Bulut efekti yerine Angora’nın mevcut aerial kadrajını kullan.
- [likova-mobile/8 · Model → location → insan](../casestudy2.html#likova-mobile-8): Modelden gerçek çevreye geçerken görüntü ile konum metni eşleşiyor. Ev → mahalle bağı bu şekilde kurulmalı.

**Sınır:** Buradaki aerial, evin sokak girişini gösteren fotoğrafın yerine geçmez. Konum bilgisi ayrı kalmalı.

#### M37 · Mobil çevre haritası → yaşam kartı

[Gerçek klibi aç](../casestudy2.html#active-mobile-37) · 03:08.45–03:12.55 · **6.0/10** · İncelt.

- **Devamlılık 8.0:** Mahalle açıklamasından aynı çevre haritasına, ardından yaşam metnine geçilir.
- **Hareket 8.0:** Harita ve yeşil yaşam alanı temiz düşey devredilir.
- **Kadraj 6.5:** Dikey harita çevreyi kırpar; villa işareti sağ kenara fazla yakındır.
- **Okuma 6.0:** Kategori noktaları çok küçük; legend harita çıktıktan sonra yaşam metninin altında gelir.

Kaynak kareleri: **03:09.57** — Villa işareti haritanın sağ kenarında; **03:11.00** — Legend yaşam başlığının altında.

**9 kabul koşulu:** Ev/sınır merkezli mobil harita kadrajı ve hemen altında okunur legend gerekli; nokta yoğunluğu küçültülmüş desktop gibi kalmamalı.

Referans seçkisi:

- [likova-mobile/10 · Harita ve süre kartı](../casestudy2.html#likova-mobile-10): Harita ve açıklama kartı iki ayrı okunur yüzey. Angora’nın haritasında da bilgi katmanlarını bu hiyerarşiyle kur.
- [era-mobile/8 · Mobil rota ve yatay kadraj](../casestudy2.html#era-mobile-8): Rota/yer bilgisi grafiğe bağlı kalıyor. Angora’daki dashed sınırın açıklaması da haritadan kopmamalı.

**Sınır:** Yeni uçan pin veya bütün noktalar için etiket gerekmiyor. Görüntü statik harita; kayıt interaktif harita yeteneğini kanıtlamaz.

#### M38 · Mobil Journal / ilk sonbahar fotoğrafı

[Gerçek klibi aç](../casestudy2.html#active-mobile-38) · 03:12.55–03:14.40 · **7.5/10** · İncelt.

- **Devamlılık 8.5:** Yaşam metninden Journal başlığı ve mahalle fotoğrafına doğru sıra sürer.
- **Hareket 8.0:** Fotoğraf aşağıdan gelir; caption metni uzun fade ile geriden yetişir.
- **Kadraj 8.5:** Mahalle resmi tek kolonda tam oranla ve yeterince büyük görünür.
- **Okuma 7.5:** Başlık net; Begin açıklaması fotoğraf okuma bölgesinde hâlâ soluktur.

Kaynak kareleri: **03:13.00** — Journal başlığı ve ilk fotoğraf; **03:13.72** — İlk fotoğraf, soluk caption.

**9 kabul koşulu:** Caption fotoğraf görünür olduğunda tam okunur olmalı; ikinci resimden önce kendi bilgi durağını tamamlamalı.

Referans seçkisi:

- [era-mobile/13 · İç mekân: kolonlar tek akışa dönüşür](../casestudy2.html#era-mobile-13): ERA mobilde iki kolon, tek dikey fotoğraf/açıklama sırasına dönüşüyor. Angora’nın Journal’ında bu uyarlama; karşıt yatay uçuşlardan daha uygun.
- [likova-mobile/12 · Mobil yaşam: koşu ve kayak](../casestudy2.html#likova-mobile-12): Yaşam görseli, kendisine ait açıklamayı taşıyor. Fotoğraf seçiminin gerekçesi hareketten daha önemli.

**Sınır:** İki görüntü aynı panorama değil; ERA’nın iki pencere birleşmesi burada yanıltıcı olur. Görselleri birleştirme.

#### M39 · Mobil / ikinci fotoğraf: spor alanı

[Gerçek klibi aç](../casestudy2.html#active-mobile-39) · 03:14.40–03:16.05 · **8.0/10** · Koru.

- **Devamlılık 8.5:** İkinci spor fotoğrafı vardır; mahalle fotoğrafının ardından kendi konusu gelir.
- **Hareket 8.0:** Tek kolon sırası korunur; resim bir öncekiyle birleştirilmez.
- **Kadraj 8.5:** Spor alanı ve ağaçlar tam kadrajda seçilir.
- **Okuma 8.0:** Shared sense of place fotoğrafıyla eşleşir; kültür metni sonra yaklaşır.

Kaynak kareleri: **03:14.85** — İkinci spor fotoğrafı; **03:15.43** — İkinci resmin bağlı caption’ı.

**9 kabul koşulu:** Spor caption’ı tam kontrastla ve kendi fotoğrafının altında kalmalı; kültür bilgisi ayrı bir küçük eşikle başlamalı.

Referans seçkisi:

- [likova-mobile/20 · Aerial → market → ekip](../casestudy2.html#likova-mobile-20): Farklı yaşam olanaklarının her birine kendi fotoğrafı ve açıklaması bağlanıyor. Angora’daki iki başlık bu ilkeyle zaten doğru yönde.
- [era-mobile/13 · İç mekân: kolonlar tek akışa dönüşür](../casestudy2.html#era-mobile-13): Fotoğraf ve açıklama aynı blokta kaldığında farklı hızlar okumayı bölmez. Mevcut journal düzenini bu sınırda tut.

**Sınır:** Bilkent/CerModern için bu kayıtta olmayan bir görsel veya kamera geçişi varmış gibi puanlama; görülen kısım metin ve linklerden oluşuyor.

#### M40 · Mobil yaşam → Ankara kültür linkleri

[Gerçek klibi aç](../casestudy2.html#active-mobile-40) · 03:16.05–03:17.40 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Spor anlatısı Bilkent/CerModern metnine, sonra galeriye bağlanır.
- **Hareket 8.0:** Sade düşey geçiş vardır; aynı yeşil zemin korunur.
- **Kadraj 8.0:** Metin dar ekranda sığar; uzun boş kolon oluşmaz.
- **Okuma 7.5:** İki kültür bağlantısı okunur, kaynak tarihi çok küçük ve soluktur.

Kaynak kareleri: **03:16.42** — Kültür metni ve iki bağlantı; **03:16.90** — Kaynak notu ve galeri girişi.

**9 kabul koşulu:** Kaynak satırı okunur kalmalı; kültür→galeri sınırı metinlerin tek paragraf gibi algılanmasını önlemeli.

Referans seçkisi:

- [likova-mobile/20 · Aerial → market → ekip](../casestudy2.html#likova-mobile-20): Farklı yaşam olanaklarının her birine kendi fotoğrafı ve açıklaması bağlanıyor. Angora’daki iki başlık bu ilkeyle zaten doğru yönde.
- [era-mobile/13 · İç mekân: kolonlar tek akışa dönüşür](../casestudy2.html#era-mobile-13): Fotoğraf ve açıklama aynı blokta kaldığında farklı hızlar okumayı bölmez. Mevcut journal düzenini bu sınırda tut.

**Sınır:** Bilkent/CerModern için bu kayıtta olmayan bir görsel veya kamera geçişi varmış gibi puanlama; görülen kısım metin ve linklerden oluşuyor.

#### M41 · Mobil seçilmiş fotoğraf galerisi

[Gerçek klibi aç](../casestudy2.html#active-mobile-41) · 03:17.40–03:19.00 · **7.5/10** · İncelt.

- **Devamlılık 8.0:** Kültür metninden ilk ev fotoğrafına aynı yeşil sahnede geçilir.
- **Hareket 8.0:** Fotoğraf alttan yerleşir; bu kayıtta yatay swipe gösterilmez.
- **Kadraj 8.0:** İlk living-room resmi iyi büyüklükte; sonraki fotoğrafın kenarı ipucu verir.
- **Okuma 7.5:** Filtreler ve sayaç küçük; viewing resmi ilk galeri durağından hemen sonra görünür.

Kaynak kareleri: **03:17.83** — İlk salon fotoğrafı; **03:18.40** — Galeri çıkışı ve viewing kenarı.

**9 kabul koşulu:** Galeri devamı ve aktif filtre okunmalı; ilk fotoğraf için net durak sağlanıp swipe ayrı kayıtta doğrulanmalı.

Referans seçkisi:

- [likova-mobile/17 · Lobi bilgisi ve mobil galeri](../casestudy2.html#likova-mobile-17): Ana mekân bilgisi galerinin ilk karesine bağlanıyor. Angora’da journal çıkışı ile ilk ev fotoğrafı arasında aynı kısa eşik uygun.
- [era-mobile/15 · İç galerinin mobil kontrolü](../casestudy2.html#era-mobile-15): Galerinin başlığı ve kontrolleri fotoğrafla aynı sahneye ait. Girişte ayrı ayrı uçan öğeler kullanma.

**Sınır:** Mobilde sekiz resmin tamamı ve lightbox gezilmedi. Desktop yatay pin davranışını mobilde doğrulanmış sayma.

#### M42 · Mobil galeri → fiyat/viewing kartı

[Gerçek klibi aç](../casestudy2.html#active-mobile-42) · 03:19.00–03:21.65 · **5.5/10** · Yeniden ele al.

- **Devamlılık 8.0:** Galeri altından satış kartı ve villa fotoğrafı gelir.
- **Hareket 7.5:** Kart başlığı satır maskesiyle oluşur; metin henüz solukken form yaklaşır.
- **Kadraj 5.5:** Kâğıt kart dar ekranda binanın neredeyse tamamını örter.
- **Okuma 7.5:** Fiyat, özet ve form bulunur; uzun metin ve başlık üst menüye girer.

Kaynak kareleri: **03:19.72** — Kart binanın çoğunu örter; **03:20.68** — Fiyat, form ve üstte sıkışan başlık.

**9 kabul koşulu:** Mobil fotoğraf ve satış bilgisi ayrı alanlarda okunmalı; sabit menü başlığı örtmeden fiyat/özet/form hiyerarşisi kurulmalı.

Referans seçkisi:

- [era-mobile/18 · Teras ve mobil kapanış](../casestudy2.html#era-mobile-18): Kapanışta bir güçlü görsel ve net çağrı yeterli. Angora’da görselin mimari odağını karta feda etme.
- [likova-mobile/10 · Harita ve süre kartı](../casestudy2.html#likova-mobile-10): Bilgi kartı ile arka görselin ayrı okunur alanları var. Bunu contact kadrajına aktar; harita estetiğini kopyalama.

**Sınır:** Form gönderimi kayıtta yapılmıyor; görsel değerlendirmeyi formun çalıştığına dair işlev notu gibi sunma.

#### M43 · Mobil fotoğraftan wireframe’e

[Gerçek klibi aç](../casestudy2.html#active-mobile-43) · 03:21.65–03:23.25 · **8.0/10** · Koru.

- **Devamlılık 8.0:** Satış kartından wireframe ve eylem listesine aynı yeşil zeminle geçilir.
- **Hareket 8.0:** Tek düşey sıra temiz; kesitte hafif geri geliş de aynı düzeni korur.
- **Kadraj 8.0:** Model üstte, linkler altta; dar ekranda küçük ama bütünü seçilebilir.
- **Okuma 8.0:** Üç eylem rahat okunur; credit daha aşağıda ve küçüktür.

Kaynak kareleri: **03:22.08** — Wireframe ve eylemler; **03:22.65** — Linkler ve kaynak satırları.

**9 kabul koşulu:** Model için okunur ilk durak korunmalı; link grubuna geçerken aynı arka plan ve ev odağı sürmeli.

Referans seçkisi:

- [era-mobile/19 · Mobil footer: ince pencereye dönüşme](../casestudy2.html#era-mobile-19): Görüntü daralırken gerçek footer bilgisi onun etrafında kuruluyor. Alınacak şey bilgiyle birlikte kurulan kapanış; kutu biçimi değil.
- [likova-mobile/13 · Bütün bina ve 3D çağrısı](../casestudy2.html#likova-mobile-13): Teknik model ve çağrı aynı sahnede okunuyor. Angora’nın çizgisel modeline uygun bir sade kapanış ilkesi.

**Sınır:** ERA’nın daralan teras penceresini burada tekrarlamak gerekmiyor. Bu kapanışın özgün malzemesi çizgisel ev.

#### M44 · Mobil eylemler ve credits

[Gerçek klibi aç](../casestudy2.html#active-mobile-44) · 03:23.25–03:27.00 · **8.0/10** · Koru.

- **Devamlılık 8.5:** Aynı kapanışın üç eylemi ve credit satırları tamamlanır.
- **Hareket 8.0:** Düşey gezinme görülür; mobil orbit hareketi kayıtta yoktur.
- **Kadraj 8.5:** Linkler dar ekrana sığar; alt kaynak paragrafı yoğun kalır.
- **Okuma 8.0:** Arrange, 3D ve listing ayrılır; MERGVS/Luxembourg satırı küçüktür.

Kaynak kareleri: **03:24.27** — Üç link ve konum; **03:25.63** — Kaynak ve geliştirici credit’i.

**9 kabul koşulu:** Credit daha okunur kısa bir satıra ayrılmalı; mobil orbit ve link hedefleri ayrı uygulama testinde doğrulanmalı.

Kesit türü: Kapanış okuma / orbit kaydedilmedi.

Referans seçkisi:

- [likova-mobile/22 · Mobil footer ve kapanış](../casestudy2.html#likova-mobile-22): Mobil kapanış eylem ve alt bilgiyi tek dikey hiyerarşide tutuyor. Angora’nın üç linkini bu netlikte bırak.
- [era-mobile/19 · Mobil footer: ince pencereye dönüşme](../casestudy2.html#era-mobile-19): Fotoğraf penceresi ile kapanış bilgisi ayrı alanlarda okunuyor. Angora’da model ile CTA aynı sınırı korumalı.

**Sınır:** Mobil kayıtta orbit hareketi gösterilmiyor. Desktop etkileşim başarısı mobilde doğrulanmış sayılmaz.

## Tekrar üretim

1. `node tools/casestudy2-manifest.mjs`
2. `python tools/casestudy2-stills.py --project active`
3. `python tools/casestudy2-grading-frames.py` ve `python tools/casestudy2-grading-boards.py` (yerel inceleme)
4. `node --test tests/casestudy2-data.test.mjs`
5. `node tools/casestudy2-regrading-audit.mjs`

Puan kaynağı `casestudy2-grades.js`: her anahtar ayrı yazılıdır; ortak tariflerden sayısal not türetilmez. Rapor üreticisi yalnız envanter ve metin ihracıdır; yeni gözlem yapmaz.
