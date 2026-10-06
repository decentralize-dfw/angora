> **Geri çekilen ilk notlama:** Aşağıdaki puanlar ortak geçiş tariflerinden üretilmişti; bağımsız kesit notları olarak geçerli değildir. Bu dosya tarihli geçmiş kayıt olarak korunur. Güncel değerlendirme: [ikinci ara notlama](casestudy2-regrading-2026-10-05.md).

# 03 / Aktif inceleme — Angora web2

Rapor: 2026-10-05 17:01:37 Europe/Paris (UTC+02:00).

Kaynak: kullanıcının Videos klasörüne eklediği **2026-10-05 15-29-15.mp4**. Kayıtta açılan sayfa angora.mergvs.com/web2. Baseline bu kayıt; daha sonraki canlı sürüm değil. web2 dosyaları bu çalışmada değiştirilmedi.

## Teslim

- casestudy2.html içinde üçüncü proje: **03 / Aktif inceleme**.
- Desktop: 65 kesit, kaynak 00:04.00–01:50.00; 106 saniye.
- Mobil: 44 kesit, kaynak 02:02.00–03:27.00; 85 saniye.
- 109 kesit **109 farklı animasyon demek değildir**. Tekrar ziyaretler, geri dönüşler ve bilgi okuma durakları ayrı tutuldu.
- ERA + Likova'nın 92 gerçek sahnesinin tamamı kütüphane listesinde. 58 farklı sahne bu akışta gerekçeli referans olarak seçildi; diğerleri için bağlam/uygunluk notu var.
- 327 gerçek kare; play/pause, klip içi scrub, 1/60 saniye kare adımı, referans hızı, iki bağımsız gerçek kayıtla karşılaştırma.

## Notlama

Üç ölçüt eşit ağırlıklı: **devamlılık / kadraj / okuma**. Ortalama bir ondalığa yuvarlanır. Görsel editoryal değerlendirmedir; Awwwards sonucu, FPS benchmark'ı veya input gecikmesi ölçümü değildir.

- Devamlılık: önceki/sonraki sahnenin yönü, seçili katın korunması, geri dönüşün anlamı.
- Kadraj: evin bütünlüğü, görüntü/metin dengesi, dar ekranın oranı.
- Okuma: yazı/görsel ilişkisi, pin/oda adı yoğunluğu, bilgi sırası.
- Koru: mevcut kurgu görevine uygun; ufak senkron/okuma düzeltmeleri kalabilir.
- İncelt: fikir uygun, kadraj/sıra/yerleşim düzeltilmeli.
- Yeniden ele al: bölüm bağlantısı veya seçili mekân kimliği kopuyor.

## En önemli bulgular

1. Filmden ilk kâğıt bölüme çıkış, tam villa kadrajını üstte ince şeride indirgiyor. Son karesini okutacak görüntü+pencere birlikte küçülmesi veya gelen yüzeyin kontrollü devri önerildi.
2. Attic iso → Garden plan bağlantısı seçili katı değiştiriyor. Önce aynı katın planına bağlanmalı. Referanslarda birebir floor-to-plan morph olmadığı açıkça belirtildi; öneri, model/plan bilgi hiyerarşilerinden bir tasarım çıkarımı.
3. Desktop plan → iso geri ziyaretleri Garden'a dönüyor. Geri navigasyonda kat kimliği korunmalı. Kayıt her seferinde input yolunu göstermediği için bunu kanıtlanmış wheel kilidi diye adlandırmadık.
4. Mobil planda pinler çok büyük, oda isimleri ve fotoğraf penceresi çok küçük. Aktif koni ve fotoğraf noktası daha belirgin; pasif pinler daha küçük olmalı.
5. Mobil Garden kamera 3 başlangıçtan beri seçili. **1→3 kamera tıklaması kaydedilmedi.** Bu kesit durumun okunurluğunu değerlendirir.
6. Angora Journal'ın iki fotoğrafı hem desktop hem mobil kayıtta görünüyor. “Görsel yok” teşhisi konmadı. Fotoğrafların görevleri farklı olduğundan birleşme animasyonu önerilmedi.
7. Bahçe fotoğraf değişimleri, salon/ikinci açı ve wireframe orbit kurgu olarak korunabilir. Bunlara sırf kütüphane kullanmak için yeni maske/kamera eklenmedi.
8. Contact kartı özellikle mobilde cepheyi fazla örtüyor. Fotoğraf ile bilgiye dengeli ayrı alan önerildi; form gönderim işlevi puanlanmadı.

## Kaydın sınırları

- Mobil: Chrome responsive emülasyonu **459 × 686 CSS px**, kayıttaki görünür piksel alanı 426 × 636. Fiziksel telefon testi değildir.
- Desktop crop: x0/y152, 2540 × 1388 → 1920 × 1050. Mobil crop: x594/y254, 426 × 636.
- Başlangıç yüklenmesi, Incognito hazırlığı, DevTools ve OBS sonu yayınlanan kadrajlar dışında bırakıldı.
- Açılış kaydı hero zaten açıkken başlıyor; ilk siyah örtünün tam animasyonu değerlendirilmedi.
- Menünün açılışı, tüm kamera pinleri, dimensions, mobil odaların/8 fotoğrafın tamamı ve form gönderimi bu kayıtla doğrulanamaz.
- Katman kutuları **okuma bölgeleridir**; orijinal DOM maskesi veya izole compositor layer'ı değildir. Bantlar kesitte incelenen rollerin varlığını gösterir.
- Süreler kullanıcı beklemelerini içerir; kaynak zamanlama 60 fps olarak korunur, scroll hızı yeniden kurulmaz.

## Doğrulama

- Veri testi: tüm 201 sahne, kesintisiz aralıklar, kaynak ofsetleri, 60 fps provenance, tüm still dosyaları, export/player eşitliği, referansların gerçek ve aynı cihazda olması.
- Gerçek tarayıcı: 65 desktop klibi 1280 × 720; 44 mobil klibi 320 × 568. Tüm seçilen sahneler çözümlendi; taşma yok; sahne seçimi scrollY=0; ekran yüksekliği ve kayıt kadrajı sığıyor.
- Ek oranlar: 390 × 844, 844 × 390.
- 58 seçilmiş referansın tümü gerçek oynatıcıda çözümlendi; aktif Angora hash'i korundu.
- Karşılaştırmada Angora ve referans kendi son kaynak karesinde durdu; kare geri adımı 1/60 saniye.
- Altı yeni odak aralığı ayrıca oynatılıp duraklatıldı. Mobil ofis odağı 89.583333 yerel saniyede (son kaynak karesi) durdu; geri kare 89.566666.
- Detay bağlantısı ve referans seçimi aktif sahne URL'sini koruyor. Kayıt hatası/loading durumları ayrı.
- Ham tarayıcı gözlemleri: casestudy2-active-browser-checks-2026-10-05.json.

## Referans odak aralıkları

Seçkide altı uzun referans için gerçek geçişin odak aralığı açılır; 92 tam sahnenin sınırları değiştirilmez. Aşağıdaki zamanlar orijinal kaynak saatidir, hız değiştirilmez. Tam breakdown bağlantısı bütün sahneyi açar.

- likova-desktop:video-story: 02:33.30–02:35.50. İlk beyaz bilgi yüzeyinin girişi ve aynı film üzerinde geri çıkışı.
- likova-desktop:architecture: 03:21.40–03:24.00. Modelden cepheye devir ve koyu açıklama yüzeyinin ilk girişi.
- likova-desktop:lobby: 03:44.75–03:49.35. Sayı/bilgi alanından lobi galerisine devir ve iki sonraki fotoğraf.
- likova-desktop:offices: 03:52.50–03:54.90. Koyu ofis kartının ardından çalışma alanı görüntüsünün devralması.
- likova-desktop:master-plan: 03:17.50–03:20.90. Son ileri geçiş: beyaz teknik yüzeyin gelişi ve bütün modelin okunması.
- likova-mobile:offices: 01:29.30–01:32.60. Mobil ofis bilgi yüzeyi ve sonraki mekân fotoğrafının gelişi.

## Yeniden üretim

1. python tools/prepare-casestudy2.py --site active
2. node tools/casestudy2-manifest.mjs
3. python tools/casestudy2-stills.py --project active
4. python tools/casestudy2-focus-stills.py
5. node tests/casestudy2-data.test.mjs
6. node tools/casestudy2-active-audit.mjs

Ham Chrome/OBS analiz kareleri build altında yereldir; yayına alınmaz.

## Kesit envanteri

### Desktop

| No | Kaynak aralığı | Mevcut sahne | Karar | D/K/O | Not | Referanslar |
|---:|---|---|---|---|---:|---|
| 1 | 00:04.00–00:08.60 | Aerial: gündüz → gece | İncelt | 6/8/7 | 7.0 | likova-desktop/2, era-desktop/5 |
| 2 | 00:08.60–00:10.10 | 01 / Arrival kamera durağı | Koru | 8/8/7 | 7.7 | likova-desktop/7, era-desktop/5 |
| 3 | 00:10.10–00:11.70 | 02 / Perspective kamera durağı | Koru | 8/8/7 | 7.7 | likova-desktop/7, era-desktop/5 |
| 4 | 00:11.70–00:13.65 | 03 / Garden kamera durağı | Koru | 8/8/7 | 7.7 | likova-desktop/7, era-desktop/5 |
| 5 | 00:13.65–00:14.65 | Film → kâğıt / ilk eşik | Yeniden ele al | 4/6/6 | 5.3 | era-desktop/20, likova-desktop/9 |
| 6 | 00:14.65–00:16.70 | Ev özeti ve alanlar | Koru | 8/8/7 | 7.7 | era-desktop/13 |
| 7 | 00:16.70–00:18.85 | Sokak cephesine geliş | İncelt | 7/8/8 | 7.7 | era-desktop/16, likova-desktop/6 |
| 8 | 00:18.85–00:20.70 | Oda sütununa giriş | Koru | 8/8/8 | 8.0 | era-desktop/16, era-desktop/17 |
| 9 | 00:20.70–00:22.05 | Yatak odası 1 → 2 | Koru | 8/8/7 | 7.7 | era-desktop/26, era-desktop/16 |
| 10 | 00:22.05–00:23.90 | Yatak odası 2 → 3 | Koru | 8/8/7 | 7.7 | era-desktop/26, era-desktop/16 |
| 11 | 00:23.90–00:26.35 | Odalardan tam ekran havuza | İncelt | 7/8/8 | 7.7 | era-desktop/21, likova-desktop/14 |
| 12 | 00:26.35–00:27.50 | Havuz → kapalı teras | Koru | 8/8/8 | 8.0 | era-desktop/14, likova-desktop/12 |
| 13 | 00:27.50–00:28.60 | Teras → bahçe yolu | Koru | 8/8/8 | 8.0 | era-desktop/14, likova-desktop/12 |
| 14 | 00:28.60–00:30.20 | Bahçeden salon anlatısına | İncelt | 6/8/7 | 7.0 | era-desktop/15, likova-desktop/15 |
| 15 | 00:30.20–00:32.70 | Salon ve ikinci açı | Koru | 8/8/8 | 8.0 | era-desktop/16, likova-desktop/17 |
| 16 | 00:32.70–00:36.40 | Salondan özel yatak odasına | İncelt | 7/8/8 | 7.7 | era-desktop/16 |
| 17 | 00:36.40–00:38.65 | Kâğıttan yeşil mutfak sahnesine | İncelt | 7/8/8 | 7.7 | likova-desktop/18, era-desktop/15 |
| 18 | 00:38.65–00:40.15 | Ana mutfak → bahçe mutfağı | Koru | 8/8/7 | 7.7 | era-desktop/26, likova-desktop/20 |
| 19 | 00:40.15–00:42.15 | Bahçe mutfağı → çatı mutfağı | Koru | 8/8/7 | 7.7 | era-desktop/26, likova-desktop/20 |
| 20 | 00:42.15–00:44.45 | Fotoğraftan isometrik bahçe katına | İncelt | 7/7/7 | 7.0 | likova-desktop/13, era-desktop/13 |
| 21 | 00:44.45–00:45.35 | Iso / Garden → Entrance | İncelt | 8/7/7 | 7.3 | likova-desktop/7, era-desktop/14 |
| 22 | 00:45.35–00:46.35 | Iso / Entrance → First | İncelt | 8/7/7 | 7.3 | likova-desktop/7, era-desktop/14 |
| 23 | 00:46.35–00:48.05 | Iso / First → Attic | İncelt | 8/7/7 | 7.3 | likova-desktop/7, era-desktop/14 |
| 24 | 00:48.05–00:50.25 | Attic iso → Garden plan / kimlik kopuşu | Yeniden ele al | 4/6/7 | 5.7 | era-desktop/25, likova-desktop/13 |
| 25 | 00:50.25–00:52.25 | Plan / Garden → Entrance | İncelt | 6/7/7 | 6.7 | era-desktop/10, era-desktop/25 |
| 26 | 00:52.25–00:54.25 | Plan / Entrance → First | İncelt | 6/7/7 | 6.7 | era-desktop/10, era-desktop/25 |
| 27 | 00:54.25–00:55.55 | Plan / First → Attic | İncelt | 6/7/7 | 6.7 | era-desktop/10, era-desktop/25 |
| 28 | 00:55.55–00:56.35 | Plan → Garden iso / ilk geri ziyaret | Yeniden ele al | 4/7/6 | 5.7 | era-desktop/23, likova-desktop/9 |
| 29 | 00:56.35–00:56.95 | Iso / Garden → Entrance · tekrar | İncelt | 8/7/7 | 7.3 | likova-desktop/7, era-desktop/14 |
| 30 | 00:56.95–00:57.55 | Iso / Entrance → First · tekrar | İncelt | 8/7/7 | 7.3 | likova-desktop/7, era-desktop/14 |
| 31 | 00:57.55–00:58.45 | Iso / First → Attic · tekrar | İncelt | 8/7/7 | 7.3 | likova-desktop/7, era-desktop/14 |
| 32 | 00:58.45–00:59.60 | Attic iso → Garden plan · tekrar | Yeniden ele al | 4/6/7 | 5.7 | era-desktop/25, likova-desktop/13 |
| 33 | 00:59.60–01:01.20 | Plan / Garden → Entrance · tekrar | İncelt | 6/7/7 | 6.7 | era-desktop/10, era-desktop/25 |
| 34 | 01:01.20–01:02.10 | Plan → Garden iso / ikinci geri ziyaret | Yeniden ele al | 4/7/6 | 5.7 | era-desktop/23, likova-desktop/9 |
| 35 | 01:02.10–01:02.80 | Iso / Garden → Entrance · 3. ziyaret | İncelt | 8/7/7 | 7.3 | likova-desktop/7, era-desktop/14 |
| 36 | 01:02.80–01:03.60 | Iso / Entrance → First · 3. ziyaret | İncelt | 8/7/7 | 7.3 | likova-desktop/7, era-desktop/14 |
| 37 | 01:03.60–01:04.60 | Iso / First → Attic · 3. ziyaret | İncelt | 8/7/7 | 7.3 | likova-desktop/7, era-desktop/14 |
| 38 | 01:04.60–01:05.55 | Attic iso → Garden plan · 3. ziyaret | Yeniden ele al | 4/6/7 | 5.7 | era-desktop/25, likova-desktop/13 |
| 39 | 01:05.55–01:06.50 | Plan / Garden → Entrance · 3. ziyaret | İncelt | 6/7/7 | 6.7 | era-desktop/10, era-desktop/25 |
| 40 | 01:06.50–01:07.70 | Plan / Entrance → First · tekrar | İncelt | 6/7/7 | 6.7 | era-desktop/10, era-desktop/25 |
| 41 | 01:07.70–01:08.60 | Plan / First → Attic · tekrar | İncelt | 6/7/7 | 6.7 | era-desktop/10, era-desktop/25 |
| 42 | 01:08.60–01:10.40 | Plandan evin pratik ayrıntılarına | İncelt | 7/8/8 | 7.7 | likova-desktop/19, era-desktop/20 |
| 43 | 01:10.40–01:12.65 | Dört özellik → merdiven fotoğrafı | İncelt | 7/8/8 | 7.7 | likova-desktop/19, era-desktop/20 |
| 44 | 01:12.65–01:15.10 | Ev içinden villa mahallesine | İncelt | 7/8/8 | 7.7 | era-desktop/12, likova-desktop/8 |
| 45 | 01:15.10–01:18.55 | Mahalle → geniş harita + yaşam kartı | İncelt | 7/7/7 | 7.0 | likova-desktop/10, era-desktop/11 |
| 46 | 01:18.55–01:20.15 | Harita → Angora Journal / iki fotoğraf | İncelt | 7/8/8 | 7.7 | era-desktop/16, likova-desktop/12 |
| 47 | 01:20.15–01:22.10 | Mahalle ve spor: fotoğraf → caption | Koru | 8/8/7 | 7.7 | likova-desktop/20, era-desktop/16 |
| 48 | 01:22.10–01:23.25 | Journal → Ankara kültür linkleri | Koru | 8/8/7 | 7.7 | likova-desktop/20, era-desktop/16 |
| 49 | 01:23.25–01:25.45 | Journal’dan seçilmiş ev fotoğraflarına | İncelt | 7/8/8 | 7.7 | likova-desktop/17, era-desktop/17 |
| 50 | 01:25.45–01:26.35 | Galeri / living room → kitchen | Koru | 8/8/7 | 7.7 | era-desktop/10, likova-desktop/17 |
| 51 | 01:26.35–01:27.35 | Galeri / kitchen → entry hall | Koru | 8/8/7 | 7.7 | era-desktop/10, likova-desktop/17 |
| 52 | 01:27.35–01:28.50 | Galeri / hall → primary bedroom | Koru | 8/8/7 | 7.7 | era-desktop/10, likova-desktop/17 |
| 53 | 01:28.50–01:30.75 | Galeri / bedroom → sitting area | Koru | 8/8/7 | 7.7 | era-desktop/10, likova-desktop/17 |
| 54 | 01:30.75–01:32.35 | Fotoğraf büyütme / sitting area | Koru | 8/8/8 | 8.0 | era-desktop/27 |
| 55 | 01:32.35–01:33.10 | Büyük fotoğraftan aynı raya dönüş | Koru | 8/8/8 | 8.0 | era-desktop/27 |
| 56 | 01:33.10–01:34.05 | Galeri / sitting area → bathroom | Koru | 8/8/7 | 7.7 | era-desktop/10, likova-desktop/17 |
| 57 | 01:34.05–01:34.65 | Galeri / bathroom → attic bedroom | Koru | 8/8/7 | 7.7 | era-desktop/10, likova-desktop/17 |
| 58 | 01:34.65–01:35.65 | Galeri / attic bedroom → attic living | Koru | 8/8/7 | 7.7 | era-desktop/10, likova-desktop/17 |
| 59 | 01:35.65–01:37.40 | Galeri bitişi → viewing fotoğrafı | İncelt | 7/6/8 | 7.0 | era-desktop/21, likova-desktop/10 |
| 60 | 01:37.40–01:41.30 | Fiyat, ev özeti ve viewing kartı | İncelt | 7/6/8 | 7.0 | era-desktop/21, likova-desktop/10 |
| 61 | 01:41.30–01:42.60 | Fotoğraftan çizgisel ev kapanışına | İncelt | 6/8/8 | 7.3 | era-desktop/22, likova-desktop/13 |
| 62 | 01:42.60–01:46.55 | Wireframe orbit / sabit eylemler | Koru | 8/8/8 | 8.0 | likova-desktop/7 |
| 63 | 01:46.55–01:47.75 | Wireframe → viewing / geri dönüş | İncelt | 6/7/7 | 6.7 | era-desktop/23, likova-desktop/9 |
| 64 | 01:47.75–01:48.60 | Viewing → galeri / geri dönüş | İncelt | 6/7/7 | 6.7 | era-desktop/23, likova-desktop/9 |
| 65 | 01:48.60–01:50.00 | Yatay galeri geriye okunur | İncelt | 6/7/7 | 6.7 | era-desktop/23, likova-desktop/9 |

### Mobil emülasyon

| No | Kaynak aralığı | Mevcut sahne | Karar | D/K/O | Not | Referanslar |
|---:|---|---|---|---|---:|---|
| 1 | 02:02.00–02:08.20 | Mobil aerial / ışık değişimi | İncelt | 6/6/7 | 6.3 | likova-mobile/2, era-mobile/1 |
| 2 | 02:08.20–02:09.70 | Mobil / 01 Arrival | Koru | 8/7/7 | 7.3 | likova-mobile/7, era-mobile/1 |
| 3 | 02:09.70–02:11.30 | Mobil / 02 Perspective | Koru | 8/7/7 | 7.3 | likova-mobile/7, era-mobile/1 |
| 4 | 02:11.30–02:12.75 | Mobil / 03 Garden | Koru | 8/7/7 | 7.3 | likova-mobile/7, era-mobile/1 |
| 5 | 02:12.75–02:14.00 | Mobil film → kâğıt eşik | Yeniden ele al | 4/5/6 | 5.0 | era-mobile/17, likova-mobile/9 |
| 6 | 02:14.00–02:16.50 | Mobil ev özeti ve ölçüler | Koru | 7/8/7 | 7.3 | era-mobile/10 |
| 7 | 02:16.50–02:19.85 | Mobil sokak cephesi → açıklama | Koru | 8/8/8 | 8.0 | era-mobile/13, likova-mobile/6 |
| 8 | 02:19.85–02:22.40 | Mobil yatak odası penceresi | Koru | 7/8/7 | 7.3 | era-mobile/13, era-mobile/15 |
| 9 | 02:22.40–02:24.35 | Mobil odadan havuz sahnesine | İncelt | 7/7/7 | 7.0 | era-mobile/18, likova-mobile/14 |
| 10 | 02:24.35–02:25.60 | Mobil / havuz → teras | Koru | 8/7/8 | 7.7 | era-mobile/11, likova-mobile/12 |
| 11 | 02:25.60–02:27.55 | Mobil / teras → bahçe | Koru | 8/7/8 | 7.7 | era-mobile/11, likova-mobile/12 |
| 12 | 02:27.55–02:28.50 | Mobil / bahçe → teras · geri | İncelt | 7/8/7 | 7.3 | era-mobile/20, likova-mobile/9 |
| 13 | 02:28.50–02:29.55 | Mobil / teras → havuz · geri | İncelt | 7/8/7 | 7.3 | era-mobile/20, likova-mobile/9 |
| 14 | 02:29.55–02:30.65 | Mobil / havuz → yatak odası · geri | İncelt | 7/8/7 | 7.3 | era-mobile/20, likova-mobile/9 |
| 15 | 02:30.65–02:32.40 | Mobil / odadan havuza · tekrar | İncelt | 7/7/7 | 7.0 | era-mobile/18, likova-mobile/14 |
| 16 | 02:32.40–02:33.45 | Mobil / havuz → teras · tekrar | Koru | 8/7/8 | 7.7 | era-mobile/11, likova-mobile/12 |
| 17 | 02:33.45–02:34.45 | Mobil / teras → bahçe · tekrar | Koru | 8/7/8 | 7.7 | era-mobile/11, likova-mobile/12 |
| 18 | 02:34.45–02:35.45 | Mobil bahçe → iç mekân | İncelt | 6/7/7 | 6.7 | era-mobile/12, likova-mobile/15 |
| 19 | 02:35.45–02:38.65 | Mobil salon → ikinci açı | Koru | 8/8/8 | 8.0 | era-mobile/13, likova-mobile/17 |
| 20 | 02:38.65–02:42.35 | Mobil salon → özel oda | İncelt | 8/8/7 | 7.7 | era-mobile/13 |
| 21 | 02:42.35–02:44.65 | Mobil yeşil mutfak sahnesine giriş | İncelt | 7/8/7 | 7.3 | likova-mobile/18, era-mobile/12 |
| 22 | 02:44.65–02:45.55 | Mobil / model eşiğinden mutfağa geri | İncelt | 5/7/7 | 6.3 | era-mobile/20, likova-mobile/9 |
| 23 | 02:45.55–02:46.40 | Mobil / ana mutfak → bahçe mutfağı | Koru | 7/8/7 | 7.3 | era-mobile/15, likova-mobile/20 |
| 24 | 02:46.40–02:48.50 | Mobil / bahçe mutfağı → çatı mutfağı | Koru | 7/8/7 | 7.3 | era-mobile/15, likova-mobile/20 |
| 25 | 02:48.50–02:51.15 | Mobil fotoğraftan isometrik Garden’a | İncelt | 7/6/7 | 6.7 | likova-mobile/13, era-mobile/10 |
| 26 | 02:51.15–02:52.35 | Mobil iso / Garden → Entrance | İncelt | 8/6/7 | 7.0 | likova-mobile/7, era-mobile/11 |
| 27 | 02:52.35–02:53.35 | Mobil iso / Entrance → First | İncelt | 8/6/7 | 7.0 | likova-mobile/7, era-mobile/11 |
| 28 | 02:53.35–02:54.65 | Mobil iso / First → Attic | İncelt | 8/6/7 | 7.0 | likova-mobile/7, era-mobile/11 |
| 29 | 02:54.65–02:56.50 | Mobil Attic iso → Garden plan | Yeniden ele al | 4/5/6 | 5.0 | era-mobile/10, likova-mobile/13 |
| 30 | 02:56.50–02:57.40 | Mobil Garden / kamera 3 ve bakış yönü | İncelt | 7/5/6 | 6.0 | era-mobile/11, likova-mobile/11 |
| 31 | 02:57.40–02:58.75 | Mobil plan / Garden → Entrance | İncelt | 6/5/6 | 5.7 | era-mobile/15, era-mobile/10 |
| 32 | 02:58.75–03:00.15 | Mobil plan / Entrance → First | İncelt | 6/5/6 | 5.7 | era-mobile/15, era-mobile/10 |
| 33 | 03:00.15–03:01.45 | Mobil plan / First → Attic | İncelt | 6/5/6 | 5.7 | era-mobile/15, era-mobile/10 |
| 34 | 03:01.45–03:04.80 | Mobil plan → pratik ayrıntılar | İncelt | 7/8/7 | 7.3 | likova-mobile/19, era-mobile/17 |
| 35 | 03:04.80–03:05.55 | Mobil özellikler → merdiven | Koru | 8/8/8 | 8.0 | likova-mobile/19, era-mobile/17 |
| 36 | 03:05.55–03:08.45 | Mobil merdiven → mahalle | İncelt | 8/8/7 | 7.7 | era-mobile/9, likova-mobile/8 |
| 37 | 03:08.45–03:12.55 | Mobil çevre haritası → yaşam kartı | İncelt | 7/6/7 | 6.7 | likova-mobile/10, era-mobile/8 |
| 38 | 03:12.55–03:14.40 | Mobil Journal / ilk sonbahar fotoğrafı | Koru | 8/8/8 | 8.0 | era-mobile/13, likova-mobile/12 |
| 39 | 03:14.40–03:16.05 | Mobil / ikinci fotoğraf: spor alanı | Koru | 8/8/8 | 8.0 | likova-mobile/20, era-mobile/13 |
| 40 | 03:16.05–03:17.40 | Mobil yaşam → Ankara kültür linkleri | Koru | 7/8/7 | 7.3 | likova-mobile/20, era-mobile/13 |
| 41 | 03:17.40–03:19.00 | Mobil seçilmiş fotoğraf galerisi | İncelt | 7/8/7 | 7.3 | likova-mobile/17, era-mobile/15 |
| 42 | 03:19.00–03:21.65 | Mobil galeri → fiyat/viewing kartı | İncelt | 7/5/7 | 6.3 | era-mobile/18, likova-mobile/10 |
| 43 | 03:21.65–03:23.25 | Mobil fotoğraftan wireframe’e | İncelt | 6/7/7 | 6.7 | era-mobile/19, likova-mobile/13 |
| 44 | 03:23.25–03:27.00 | Mobil eylemler ve credits | İncelt | 7/7/8 | 7.3 | likova-mobile/22, era-mobile/19 |
