# Recorded Motion — kaynak ve kapsam

Ara kontrol: **5 Ekim 2026, 14:06 CEST (Europe/Paris)**.

`casestudy2.html`, kullanıcının Videos klasöründe sağladığı iki ekran kaydını inceler. Önceki CSS demolarından bağımsızdır. Sahne seçimleri gerçek kayıt içindeki zaman aralıklarını oynatır; animasyonlar yeniden üretilmez.

| Akış | Kaynak | Orijinal aralık | Kadraj x / y / w / h | Yayın çözünürlüğü | Sahne |
|---|---|---|---|---|---|
| ERA desktop | 2026-10-05 13-16-27.mp4 | 00:03.00–02:31.00 | 0 / 152 / 2540 / 1388 | 1920 × 1050 | 29 |
| ERA mobil | aynı dosya | 02:40.00–03:58.00 | 594 / 254 / 426 / 636 | 426 × 636 | 20 |
| Likova desktop | 2026-10-05 13-20-35.mp4 | 01:53.50–04:24.80 | 0 / 152 / 2540 / 1388 | 1920 × 1050 | 21 |
| Likova mobil | aynı dosya | 00:03.00–01:50.00 | 594 / 254 / 426 / 636 | 426 × 636 | 22 |

Mobil akışlar Chrome responsive emülasyonudur: **459 × 686 CSS px**, fiziksel telefon kaydı değildir. Ekran kaydındaki ölçek sebebiyle yayınlanan piksel kadrajı 426 × 636’dır. Görüntü büyütülüp sahte ayrıntı üretilmedi.

Kaynak HEVC dosyalar, tarayıcı uyumluluğu için H.264’e dönüştürüldü. Orijinal 60 fps ve zamanlama korunur, ses çıkarılır. Browser çubukları, geliştirici araçları, OBS ve diğer uygulamaların göründüğü başlangıç/son aralıklar yayına alınmaz. Windows aktivasyon izi gibi kaynak görüntünün içindeki öğeler yeniden çizilmez.

## Breakdown yöntemi

- Dört akış içinde toplam **92 numaralı sahne**, sahneye özel derin bağlantı ve arama.
- Play/pause, ±1 kare, 0.25× / 0.5× / 1× / 2×, sahne döngüsü ve kesintisiz tam akış.
- Her sahne için başlangıç / orta / son gerçek kare: toplam **276 JPEG**.
- Görsel/kamera, maske/zemin, yazı/içerik ve arayüz için renk kodlu zaman şeritleri, gözlenen ilişki açıklamaları ve isteğe bağlı okuma bölgeleri.
- Bölgeler kaynak DOM’dan ayrıştırılmış katmanlar veya milimetrik maskeler değildir. Videonun üstündeki **analiz işaretleri** olarak açıkça belirtilir.
- Aralıklar kullanıcının kaydırma, durma ve tıklama zamanlarını içerir. Bunlar orijinal animasyonun kodlanmış duration/easing değerleri olarak sunulmaz.
- Desktop/mobil karşılığı yalnız aynı olay gerçekten kaydedilmişse bağlanır. Yoksa eksik kapsam belirtilir.
- Dört yayın akışı, kaynak/kadraj JSON’ları ve bütün zaman kodlu envanter indirilebilir.

## Kaydın sınırları

ERA desktop kaydı açılış, pinler, ana akış, footer ve ters akışın yanında apartments listesi, detay ve lightbox’ı içerir. Gündüz/gece, Book a call formu ve accordion etkileşimi gösterilmez.

ERA mobil kaydı açık hero ile başlar. Mobil preloader, menü, pin sheet ve sayfalar arası gezinme kaydedilmemiştir. İki pencerenin birleşmesi desktop’ta görünür; mobilde aynı birleşme iddia edilmez.

Likova desktop, ekip bölümünde biter. Footer ve master plan/ofis seçiminin ayrı 3D arayüzü kayıtta açılmaz. Mobil footer vardır; uzun altyapı dizisinin bazı alt görüntüleri kayıtta atlanır.

## Kontrol kaydı

Veri testleri dört akışta bütün sahnelerin kesintisizliğini, sınırlarını, orijinal zamanla hizalanmasını, counterpart eşleşmesini, 60 fps medya bilgisini ve 276 kare dosyasının varlığını doğrular.

Tarayıcıda ERA birleşme sahnesinde ±1 kare, oynatma, 2× hız ve son karede durma kontrol edildi. Masaüstü 1280 × 720; mobil 390 × 844, 320 × 568 ve yatay 844 × 390 boyutlarında ilk ekranın sığması ve kaydın oranının korunması incelendi. Mobil sahne listesi açılıp kapatılarak cihaz değişimi kontrol edildi.

Tamamlama kontrolü: **5 Ekim 2026, 14:24 CEST**.

- 1280 × 720 arayüzde **92/92 sahne** seçildi; seek tamamlandıktan sonra her videonun gerçek karesi çözülmüş durumdaydı. Medya hatası, sahne seçimine bağlı sayfa kayması ve ilk ekranın boyunu aşması bulunmadı.
- 320 × 568 arayüzde aynı **92/92 sahne** menüden tek tek açıldı. Decode, yatay taşma, ekran yüksekliği ve scroll konumu kontrolü geçti. En uzun başlıkta bile video sahnesinin yüksekliği en az 176 px kaldı; okunacak büyük görüntü için tam ekran kontrolü mevcuttur.
- Son karede durma, döngü, tam akışta sonraki sahneye geçme, arama, desktop/mobil counterpart, gerçek orta kareye dönme, analiz bölgelerinin açılması ve tam ekran oranı kontrol edildi.
- Dört akışın JSON envanteri statik dosya olarak indirildi. **9 veri/medya testi** ve JavaScript sözdizimi kontrolü geçti. Tarayıcı konsolunda hata görülmedi.
- Sahne bazında ölçümler `casestudy2-browser-checks-2026-10-05.json` içinde saklandı. Bu işlev/yerleşim kontrolüdür; özgün animasyonlara uydurma Awwwards notları verilmez.

## Yeniden üretim

1. `python tools/prepare-casestudy2.py` — sahibinin orijinal Videos dosyalarından dört güvenli kadrajı oluşturur.
2. `node tools/casestudy2-manifest.mjs` — editoryal sahne manifestini oluşturur.
3. `python tools/casestudy2-stills.py` — yayına alınmış kadrajların gerçek karelerini çıkarır.
4. `node tests/casestudy2-data.test.mjs` — medya ve envanter kontrolleri.
5. `node tools/serve-residence.mjs` — `http://localhost:4180/casestudy2.html`.

Özgün tasarım ve görüntü hakları ERA Residence / The First The Last ve Likova / VIDE INFRA’ya aittir.
