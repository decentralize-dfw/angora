# Angora 21 — iyileştirme sonrası ara değerlendirme

- Kayıt: 4 Ekim 2026, 03:11 Europe/Paris (UTC+02:00).
- Önceki kayıt: [01:19 ara notlama](web-gpt-interim-review-2026-10-04.md), önce ve ayrı commit olarak main'e pushlandı: `2263c25b`.
- Sayfa: `web-gpt.html`. Tasarım niyeti 10/10; bu turdaki aktif kalemlerin öz değerlendirmesi en az 8/10.
- Genel öz değerlendirme: desktop 8,5/10; mobil 8,3/10. Resmî jüri puanı değildir.
- 19 ve 20 kaldırılmış davranışlar; mobil hover uygulanmıyor. Bunlara yapay bir başarı notu verilmedi.

## Bu turda değişenler

Giriş, izometrik ve plan akışları tek wheel hareketiyle bir durak tamamlar. Film oynarken sabit kadraj korunur, sonra exact decoded kare tutulur. Büyük wheel sahneyi atlamadan önce ona yerleşir. Son açık sekme seçimi kuyruklanır; doğal wheel momentumu yeni film başlatmaz.

İzometrik filmlerin özgün dosyaları korundu. 2560×1440 finished kopyaları, yalnız sınırla bağlantılı gri arka alan beyazlaştırılarak üretildi; foreground renklerine global key uygulanmadı. İlk/son still aynı filmlerden. Teknik bölümün tamamı beyaz; eski buz mavisi/bant ayrımı kaldırıldı.

İzometrikten plana aynı kat devrediliyor; doğal aşağı gezintide planlar Attic → First → Entrance → Garden şeklinde dönüşüyor. Dış contour eşlenmiş çevre noktalarıyla morph eder; iç oda sınırları fade olur. Kamera ankrajları ve yönler kayıtlı çizimden gelir. Dar ekran için Expand plan ve fotoğraf lightboxı var.

Yatay serilerde büyük ortak kadraj, caption ve terminal durak kullanıldı. Dar kutu maskeleri kaldırıldı. Galeri sekiz farklı iç mekân açısıyla yeniden seçildi; tüm fotoğraflar plan kameralarında kalıyor. Bahçe durağına gerçek bahçe yolu/bitki fotoğrafı alındı.

Header, menü, uzak bağlantılar, typographic reveal, lightbox, bölüm boşlukları ve son wireframe sahnesi aynı ritme düzenlendi. Wireframe gerçek model kenarlarını gösterir, pan/zoom kapalı; bitki çizgi yoğunluğu azaltıldı.

## Doğrulama

- Ana profiller: 1440×900 desktop, 390×844 mobil viewport; bölüm bölüm ileri/geri gezinti.
- Ek profiller: 320×568, 844×390 ve 1024×600 kritik video/izometrik/plan/menü sahneleri.
- Kamera dosyası ve seçili koni: desktop 40/40, mobil 40/40.
- Üç giriş klibi, üç izometrik klibi, üç plan adımı; ileri, geri ve tekrar giriş.
- Büyük wheel girişinde sahne atlama regresyonu canlı arayüzde ve otomatik testte doğrulandı.
- Dokuz menü hedefi; altı galeri filtresi; 08/8 terminal; lightbox aç/kapa; expanded plan aç/kapa; wireframe orbit ve viewer üzerindeki page wheel.
- Yedi anlamlı regresyon testi geçti: `node --test --test-isolation=none tests/residence-motion.test.mjs`.
- Değişen JavaScript kaynaklarının sözdizimi ve `git diff --check` geçti; 70 statik/dinamik yerel dosya referansı mevcut.
- Hata konsolunda test turunda JavaScript hatası görülmedi.
- Kanıtlar yerel `refinement-2026-10-04` klasöründe: ekran görüntüleri, iki 40-kamera sonucu, menu/filter kayıtları ve native scroll yol kaydı. İlk 140 kanıtlı baseline klasörü değiştirilmedi.

## Sınırlar ve 10 hedefi

Bu notlar incelenen viewport ve örneklenen hareketlere aittir. Her video karesi/FPS, düşük hızlı ağ, gerçek iPhone/Android touch ve iOS Safari doğrulanmadı. Tüm olası ekran boyutları için kusursuzluk garantisi verilmez. 1280×720 giriş kaynağı ve küçük plandaki ayrıntı ölçeği 10 puan hedefinin kalan sınırlarıdır. Portreye özel kaynak kurgu ve gerçek cihaz turu sonraki kalite kazanımlarıdır. Bölüm devirlerinde kamera morphu gereken her yerde üretilmiş gibi gösterilmedi; bazıları bilinçli editoryal renk/boşluk devridir.

## 109 kalemin yeniden değerlendirmesi

Önce sütunu desktop/mobil. İlk raporun numaraları korunur; galeri fotoğraf adları yeni seçkiye göre güncellendi.

| No | Kalem | Önce D/M | Desktop | Mobil | Uygulama ve değerlendirme |
| ---: | --- | --- | ---: | ---: | --- |
| 1 | Açılış / Siyah örtünün açılması | 7/6 | 8.7 | 8.4 | Film önce okunur oluyor; marka ve slogan ayrı, kısa bir açılışta geliyor. |
| 2 | Açılış / Gündüzden geceye başlangıç filmi | 6/3 | 8.4 | 8.2 | Portrede yatay kaynak için büyük, sabit kadraj; kısa yatay ekranda film headerın altına sığıyor. Ayrı bir dikey film hâlâ 10 hedefini güçlendirir. |
| 3 | Açılış / Marka başlığı, slogan ve alt arayüz | 7/5 | 8.5 | 8.4 | Marka, film, açıklama, üç durak ve alt ipucu ayrı alanlarda; 320 px kontrol edildi. |
| 4 | Açılış / 01 / Arrival kamera geçişi | 6/3 | 8.5 | 8.2 | Tek hareket bütün klibi oynatıyor; 0,55 s hedef, komşu film ön yüklemesi ve aynı decoded son kare. Kaynak 1280×720 olduğu için 10 verilmedi. |
| 5 | Açılış / 02 / Perspective kamera geçişi | 6/3 | 8.5 | 8.2 | Tek hareket bütün klibi oynatıyor; 0,55 s hedef, komşu film ön yüklemesi ve aynı decoded son kare. Kaynak 1280×720 olduğu için 10 verilmedi. |
| 6 | Açılış / 03 / Garden kamera geçişi | 6/3 | 8.5 | 8.2 | Tek hareket bütün klibi oynatıyor; 0,55 s hedef, komşu film ön yüklemesi ve aynı decoded son kare. Kaynak 1280×720 olduğu için 10 verilmedi. |
| 7 | Açılış / Üç film arasındaki duraklama ve açıklama | 7/6 | 8.6 | 8.6 | Metin kısa bir durak kompozisyonunda; hareket sonunda görüntüye yeni zoom/fade eklenmiyor. |
| 8 | Açılış / Geri film / Garden → Perspective | 5/4 | 8.6 | 8.6 | Üç geri klip çalışıyor; sıfırıncı durak tekrar gece açılışını kuruyor. |
| 9 | Açılış / Geri film / Perspective → Arrival | 5/4 | 8.6 | 8.6 | Üç geri klip çalışıyor; sıfırıncı durak tekrar gece açılışını kuruyor. |
| 10 | Açılış / Geri film / Arrival → Başlangıç | 5/4 | 8.6 | 8.6 | Üç geri klip çalışıyor; sıfırıncı durak tekrar gece açılışını kuruyor. |
| 11 | Açılış / Film bölüm düğmeleriyle atlama | 7/6 | 8.6 | 8.5 | Hareket sırasında son açık seçim kuyrukta; hareket durumu görünür. |
| 12 | Açılış / Son film → The residence | 4/3 | 8.3 | 8.2 | Çerçeve, zemin ve sayfa devri aynı 0,68 s içinde; ardışık iki ayrı bekleme kaldırıldı. |
| 13 | Açılış / Back to top / açılışa yeniden giriş | 5/4 | 8.8 | 8.7 | Home/başa dön başlangıç markasını ve gece durumunu kuruyor. |
| 14 | Residence / Başlık kelimelerinin açılması | 7/7 | 8.6 | 8.6 | Kelime açılışı 0,7 s + 0,025 s stagger; başlık ile genel reveal çift animasyon yapmıyor. |
| 15 | Residence / Bilgi rakamları ve genel reveal | 6/6 | 8.4 | 8.3 | Ana rakamlar sabit hiyerarşide; destek metni küçük lift ile açılıyor. |
| 16 | Arrival / Residence → tam ekran sokak fotoğrafı | 5/5 | 8.0 | 8.0 | Gerçek sokak cephesi, iki giriş anlatısının devamı olarak büyük kadrajda tanıtılıyor. Ortak kamera morphu yerine sakin editoryal devir seçildi. |
| 17 | Arrival / Tam ekran → küçük çerçeve | 7/6 | 8.5 | 8.4 | Çerçeve küçülürken ev bütün kalıyor; fotoğrafın kendisi aynı merkezde sığıyor. |
| 18 | Arrival / Çerçeve yanında açıklamanın girişi | 6/6 | 8.4 | 8.3 | Açılan alan giriş bilgisine ayrıldı; mobil metin fotoğrafla aynı kenar ekseninde. |
| 19 | Arrival / Uçan detay fotoğrafı | 1/1 | — | — | Kaldırıldı: gereksiz/dead fotoğraf uçuşu ve aynı cephenin ikinci büyümesi. Yeni aktif geçiş gibi puanlanmadı. |
| 20 | Arrival / Küçük çerçeve → yeniden tam ekran | 4/4 | — | — | Kaldırıldı: gereksiz/dead fotoğraf uçuşu ve aynı cephenin ikinci büyümesi. Yeni aktif geçiş gibi puanlanmadı. |
| 21 | Yatak odaları / Arrival → yatay oda galerisi | 4/4 | 8.0 | 8.0 | İkinci dış cephe büyümesi olmadan oda serisine kısa devir; oda anlatısı kesintisiz başlıyor. |
| 22 | Yatak odaları / Yatay oda galerisi maske açılışı | 5/3 | 8.5 | 8.4 | Orta kutu maskesi kaldırıldı; oda fotoğrafı kullanılabilir sahne alanını dolduruyor. |
| 23 | Yatak odaları / Oda 1 → Oda 2 | 6/4 | 8.5 | 8.4 | Büyük fotoğraf ve caption birlikte yatay ilerliyor; son kare güvenli kenarda, aynı kontrol ritminde. |
| 24 | Yatak odaları / Oda 2 → Oda 3 | 6/4 | 8.5 | 8.4 | Büyük fotoğraf ve caption birlikte yatay ilerliyor; son kare güvenli kenarda, aynı kontrol ritminde. |
| 25 | Yatak odaları / Son oda → Life outside | 4/4 | 8.1 | 8.1 | Son odada zemin yeşile hazırlanıyor; bahçe bu zemini devralıyor. |
| 26 | Bahçe / Tam ekran → inset bahçe çerçevesi | 5/4 | 8.3 | 8.2 | Büyük görüntü, tek bilgi kolonu ve ayrı sekme alanı; mobilde fotoğrafın ortası açık. |
| 27 | Bahçe / Pool → Terrace fotoğraf devri | 5/4 | 8.5 | 8.4 | Diagonal wipe kaldırıldı. Görüntü 0,5 s zaman bazlı fade ile tamamlanıyor; scroll durduğunda yarım blend kalmıyor. Garden için gerçek bahçe yolu fotoğrafı. |
| 28 | Bahçe / Terrace → Garden fotoğraf devri | 5/3 | 8.5 | 8.4 | Diagonal wipe kaldırıldı. Görüntü 0,5 s zaman bazlı fade ile tamamlanıyor; scroll durduğunda yarım blend kalmıyor. Garden için gerçek bahçe yolu fotoğrafı. |
| 29 | Bahçe / Pool / Terrace / Garden düğmeleri | 6/5 | 8.5 | 8.4 | Üç düğme doğru fotoğraf/metin durağına gidiyor; hold opacity değerleri 1/0/0, 0/1/0, 0/0/1 doğrulandı. |
| 30 | Bahçe / Life outside → Inside the home | 4/4 | 8.0 | 8.0 | Tek bir bölüm çıkışı ve kısa metin girişi; siyah ara örtü veya yeni video fit değişimi yok. |
| 31 | İç mekân / Come together / başlık girişi | 7/7 | 8.5 | 8.4 | Kısa tek başlık açılışı, sakin destek metni. |
| 32 | İç mekân / Yaşam odası fotoğrafı kenar maskesi | 7/6 | 8.3 | 8.1 | Kenar maskesi kısa ve dar; fotoğrafın ilk okunması öne alındı. Tam oda fotoğrafı lightboxta mevcut. |
| 33 | İç mekân / Yaşam odası detayının uçuşu / rotation | 5/5 | 8.4 | 8.3 | Eğim kaldırıldı; detay ana fotoğrafı destekleyen küçük y hareketiyle aynı eksende. |
| 34 | İç mekân / Yaşam odası → principal suite | 5/5 | 8.3 | 8.3 | Kat etiketi ve karşılıklı hizalama korunuyor; header tüm ara kadrajlarda kontrast zemini taşıyor. |
| 35 | İç mekân / Principal suite fotoğraf maskesi | 7/6 | 8.4 | 8.3 | Ana fotoğraf kısa açılışta tanınıyor; ikinci reveal tekrarı kaldırıldı. |
| 36 | İç mekân / Dressing room detay kartı | 5/5 | 8.3 | 8.3 | Dressing detayı eğik kart olmadan ikincil bilgi olarak yerleşiyor. |
| 37 | Mutfaklar / Suite → Gather / renk sınırı | 4/4 | 8.0 | 8.0 | Aynı kenar eksenleri ve okunur ilk mutfak kadrajı; bilinçli renk bölümü, ekstra orta maske yok. |
| 38 | Mutfaklar / Mutfak maskesinin açılması | 5/3 | 8.5 | 8.4 | Tekrar eden kutu maskesi kaldırıldı, mobil mutfak fotoğrafı büyütüldü. |
| 39 | Mutfaklar / Main kitchen → Garden kitchen | 6/4 | 8.5 | 8.4 | Fotoğraf/caption birlikte akıyor; son karede beyaz teknik bölümün zemini hazırlanıyor. |
| 40 | Mutfaklar / Garden kitchen → Attic kitchenette | 6/4 | 8.5 | 8.4 | Fotoğraf/caption birlikte akıyor; son karede beyaz teknik bölümün zemini hazırlanıyor. |
| 41 | Mutfaklar / Son mutfak → isometrik dört kat | 4/4 | 8.0 | 8.0 | Şerit sonu beyaza çözülüp kat anlatısı Garden başlangıcına oturuyor. Büyük wheel bölümü atlayamıyor; ilk hareket sahneye yerleşiyor. |
| 42 | İzometrik / Dört katın ilk Garden durağı | 5/3 | 8.5 | 8.4 | Garden ilk karesi aynı filmden; alt/üst bantlar sahneye göre azaltıldı, bütün teknik bölüm beyaz. |
| 43 | İzometrik / Garden → Entrance | 6/4 | 8.6 | 8.5 | 2560×1440 kaynaklardan altı ayrı finished film; ilk/son duraklar aynı kareden. Tek hareket ileri/geri tam kat filmi. |
| 44 | İzometrik / Entrance → First | 6/4 | 8.6 | 8.5 | 2560×1440 kaynaklardan altı ayrı finished film; ilk/son duraklar aynı kareden. Tek hareket ileri/geri tam kat filmi. |
| 45 | İzometrik / First → Attic | 6/4 | 8.6 | 8.5 | 2560×1440 kaynaklardan altı ayrı finished film; ilk/son duraklar aynı kareden. Tek hareket ileri/geri tam kat filmi. |
| 46 | İzometrik / Geri / Attic → First | 7/5 | 8.6 | 8.5 | 2560×1440 kaynaklardan altı ayrı finished film; ilk/son duraklar aynı kareden. Tek hareket ileri/geri tam kat filmi. |
| 47 | İzometrik / Geri / First → Entrance | 7/5 | 8.6 | 8.5 | 2560×1440 kaynaklardan altı ayrı finished film; ilk/son duraklar aynı kareden. Tek hareket ileri/geri tam kat filmi. |
| 48 | İzometrik / Geri / Entrance → Garden | 7/5 | 8.6 | 8.5 | 2560×1440 kaynaklardan altı ayrı finished film; ilk/son duraklar aynı kareden. Tek hareket ileri/geri tam kat filmi. |
| 49 | İzometrik / Kat açıklamasının fade/y girişi | 6/5 | 8.7 | 8.7 | Açıklama filmin ikinci yarısında 0,16 s'de tamamlanıyor; hold sonrası ek solma yok. |
| 50 | İzometrik / Kat sekmeleri / Home-End / hızlı ikinci seçim | 8/6 | 8.7 | 8.5 | Kat sekmeleri ve klavye çalışıyor; busy sırasında son açık hedef korunuyor. |
| 51 | Planlar / İzometrik → Inside every level | 4/4 | 8.6 | 8.5 | İzometrikten plana aynı kat; doğal gezintide Attic → First → Entrance → Garden. Yukarı dönüş aynı izometrik kata. |
| 52 | Planlar / İlk grafik planın kadrajı | 6/4 | 8.5 | 8.0 | Gerçek oda/kamera sınırlarına göre kadraj. Plan üstte, fotoğraf altta; Expand plan küçük ekranda ayrıntı alanı açıyor. |
| 53 | Planlar / Garden → Entrance plan geçişi | 6/6 | 8.7 | 8.6 | Dış contour eşlenmiş 128 perimeter noktasıyla 0,48 s dönüşüyor; iç duvarlar/raster 0,38 s fade. İleri ve geri yönler çalışıyor. |
| 54 | Planlar / Entrance → First plan geçişi | 6/6 | 8.7 | 8.6 | Dış contour eşlenmiş 128 perimeter noktasıyla 0,48 s dönüşüyor; iç duvarlar/raster 0,38 s fade. İleri ve geri yönler çalışıyor. |
| 55 | Planlar / First → Attic plan geçişi | 6/6 | 8.7 | 8.6 | Dış contour eşlenmiş 128 perimeter noktasıyla 0,48 s dönüşüyor; iç duvarlar/raster 0,38 s fade. İleri ve geri yönler çalışıyor. |
| 56 | Planlar / Geri / Attic → First | 6/6 | 8.7 | 8.6 | Dış contour eşlenmiş 128 perimeter noktasıyla 0,48 s dönüşüyor; iç duvarlar/raster 0,38 s fade. İleri ve geri yönler çalışıyor. |
| 57 | Planlar / Geri / First → Entrance | 6/6 | 8.7 | 8.6 | Dış contour eşlenmiş 128 perimeter noktasıyla 0,48 s dönüşüyor; iç duvarlar/raster 0,38 s fade. İleri ve geri yönler çalışıyor. |
| 58 | Planlar / Geri / Entrance → Garden | 6/6 | 8.7 | 8.6 | Dış contour eşlenmiş 128 perimeter noktasıyla 0,48 s dönüşüyor; iç duvarlar/raster 0,38 s fade. İleri ve geri yönler çalışıyor. |
| 59 | Planlar / Kamera seçimi → fotoğraf değişimi | 5/4 | 8.7 | 8.6 | Önce fotoğraf decode, sonra 0,28 s crossfade; 40/40 desktop ve 40/40 mobil dosya eşleşmesi geçti. |
| 60 | Planlar / Kamera konisi, yön oku ve seçili durum | 7/4 | 8.7 | 8.4 | Gerçek kamera ankrajı, yaw oku ve bir seçili koni. 34 px desktop / 40 px mobil nokta; yakın noktalar ayrılıyor, bağlantıları ortogonal. |
| 61 | Planlar / Oda adları / contour okunurluğu | 5/3 | 8.5 | 8.0 | Oda sınırları aynen korunuyor; label/pin çakışması için yerleşim. Kısa ekranlarda kısa adlar, Expand plan içinde tam adlar. |
| 62 | Planlar / Ölçü katmanının açılması / kapanması | 5/2 | 8.3 | 8.0 | 11 px ölçü yazısı, sınırlı ve çakışmayan ölçü seçkisi, kısa fade. Küçük ekranda ayrıntı görünümü gerekli. |
| 63 | Konfor / Plan → konfor bilgileri | 4/4 | 8.0 | 8.0 | Teknik anlatıdan erişim/merdiven bilgilerine düzenli boşluk; yeni bir film kilidi eklenmeden çıkış. |
| 64 | Konfor / Dört konfor maddesinin reveal girişi | 6/5 | 8.3 | 8.2 | Mobil kolonlar genişletildi; serif alt başlıklar ve okunur gövde metni. |
| 65 | Konfor / Merdiven fotoğrafı / üzerine yazı | 6/6 | 8.4 | 8.3 | Merdiven yazısının arkasında sakin gradient kontrastı. |
| 66 | Mahalle / Konfor → The neighbourhood | 5/5 | 8.0 | 8.0 | Ev içinden çevreye ölçek değişimi, aynı fotoğraf ekseni ve bölüm boşluğu ile okunuyor; fotogerçekçi kamera morphu üretilmedi. |
| 67 | Mahalle / Mahalle fotoğrafının ölçek çözülmesi | 7/6 | 8.4 | 8.1 | Mahalle fotoğrafında 1,045 → 1 küçük çözülme; geniş flat harita sonraki ölçekte karşılık veriyor. |
| 68 | Life in Angora / Mahalle → harita başlangıcı | 4/4 | 8.1 | 8.0 | Villa/mahalle adres anlatısı, Angora 21 işaretli haritaya geçiyor; sahne açıklaması sabit. |
| 69 | Life in Angora / Haritanın küçük ölçek hareketi | 5/4 | 8.5 | 8.2 | Flat harita çerçevede; altı katman ve Angora 21 odağı. Mobilde harita genel bölgeyi anlatır, tüm küçük POI yazıları ayrıntı ölçeğinde değildir. |
| 70 | Life in Angora / A place / metnin erken sönmesi | 3/2 | 8.8 | 8.7 | Metin bölüm bitene kadar kalıyor; erken fade ve boş yarım ekran kaldırıldı. |
| 71 | Life in Angora / Harita → Angora journal | 5/5 | 8.3 | 8.2 | Harita bölüm süresi azaltıldı; aynı yeşil zeminde journal başlığı devralıyor. |
| 72 | Life in Angora / Belong to the everyday / kelime açılışı | 7/7 | 8.6 | 8.6 | Başlık kısa kelime açılışında tamamlanıyor. |
| 73 | Life in Angora / Birinci sonbahar fotoğrafının maskesi/paralaksı | 7/7 | 8.6 | 8.5 | Her iki mevcut sonbahar fotoğrafı kullanılıyor; 5% dikey maskesi, küçük paralaks ve okunur kaynak captionı. |
| 74 | Life in Angora / İkinci sonbahar fotoğrafının maskesi/paralaksı | 7/7 | 8.6 | 8.5 | Her iki mevcut sonbahar fotoğrafı kullanılıyor; 5% dikey maskesi, küçük paralaks ve okunur kaynak captionı. |
| 75 | Life in Angora / Şehir bağlantıları ve kaynak dipnotları | 5/5 | 8.2 | 8.2 | Şehir bağlantıları kısa editoryal blokta; kaynak yazısı 11 px, kontrast ve ritim iyileştirildi. |
| 76 | Galeri / Life in Angora → galeri renk devri | 3/3 | 8.3 | 8.3 | Journal ve galeri aynı yeşil zemini paylaşıyor; yeni orta maske başlamıyor. |
| 77 | Galeri / Ortadaki dar maske → açık galeri | 3/2 | 8.6 | 8.6 | Dar dikey dilim maskesi kaldırıldı; galeri büyük fotoğrafla doğrudan açılıyor. |
| 78 | Galeri / Living room → Kitchen | 6/4 | 8.6 | 8.5 | Yeni sekiz fotoğraflık seçki: ana hikâyedeki aynı fotoğrafları tekrar etmeyen iç mekân açıları. Büyük ortak kadraj ve bağlı caption. |
| 79 | Galeri / Kitchen → Entry hall | 6/4 | 8.6 | 8.5 | Yeni sekiz fotoğraflık seçki: ana hikâyedeki aynı fotoğrafları tekrar etmeyen iç mekân açıları. Büyük ortak kadraj ve bağlı caption. |
| 80 | Galeri / Entry hall → Primary bedroom | 6/4 | 8.6 | 8.5 | Yeni sekiz fotoğraflık seçki: ana hikâyedeki aynı fotoğrafları tekrar etmeyen iç mekân açıları. Büyük ortak kadraj ve bağlı caption. |
| 81 | Galeri / Primary bedroom → Sitting area | 6/4 | 8.6 | 8.5 | Yeni sekiz fotoğraflık seçki: ana hikâyedeki aynı fotoğrafları tekrar etmeyen iç mekân açıları. Büyük ortak kadraj ve bağlı caption. |
| 82 | Galeri / Sitting area → En-suite bathroom | 6/4 | 8.6 | 8.5 | Yeni sekiz fotoğraflık seçki: ana hikâyedeki aynı fotoğrafları tekrar etmeyen iç mekân açıları. Büyük ortak kadraj ve bağlı caption. |
| 83 | Galeri / En-suite bathroom → Attic bedroom | 6/4 | 8.6 | 8.5 | Yeni sekiz fotoğraflık seçki: ana hikâyedeki aynı fotoğrafları tekrar etmeyen iç mekân açıları. Büyük ortak kadraj ve bağlı caption. |
| 84 | Galeri / Attic bedroom → Attic sitting area | 6/4 | 8.6 | 8.5 | Yeni sekiz fotoğraflık seçki: ana hikâyedeki aynı fotoğrafları tekrar etmeyen iç mekân açıları. Büyük ortak kadraj ve bağlı caption. |
| 85 | Galeri / Önceki / sonraki / yön tuşu hareketi | 6/7 | 9.0 | 9.0 | Pixel mesafesi ve terminal hesapları düzeltildi; iki ana profilde 08/8 ve Next disabled doğrulandı. |
| 86 | Galeri / Son durak ve çıkış durumu | 3/8 | 9.0 | 9.0 | Pixel mesafesi ve terminal hesapları düzeltildi; iki ana profilde 08/8 ve Next disabled doğrulandı. |
| 87 | Galeri / Altı filtre arasında içerik değişimi | 5/5 | 8.5 | 8.5 | Seçki kısa fade altında yeniden kuruluyor; sahne konumu sabit. Altı filtre 3/3/3/3/3/8 doğru. |
| 88 | İlan / Galeri → ilan özeti | 5/5 | 8.4 | 8.3 | Son galeri durağı kahverengiye çözülerek ilanın zeminini hazırlıyor. |
| 89 | İlan / İlan fotoğrafı paralaks/ölçek | 6/6 | 8.3 | 8.2 | Ölçek 1,04 → 1; odanın hacmi ön planda, mobil kenar boşluğu azaltıldı. |
| 90 | İlan / Özet ve fiyatın reveal girişi | 6/6 | 8.3 | 8.1 | Özet, fiyat ve listing bağı okunur ölçekte; dar ekranda normal akış, bilgi sıkıştırılmıyor. |
| 91 | Kapanış / İlan → ANGORA 21 fotoğrafı | 4/4 | 8.0 | 8.0 | İlan ile final fotoğrafı arasında daha geniş nefes; dışarıya bilinçli bir editoryal kapanış. |
| 92 | Kapanış / ANGORA 21 büyük marka kadrajı | 5/4 | 8.3 | 8.1 | Final markası ve gerçek villa fotoğrafı; mobil daha kısa sahne yüksekliği. Dikey cropta çevrenin tamamı gösterilmez. |
| 93 | Kapanış / Fotoğraf → wireframe tam sayfa | 5/5 | 8.4 | 8.3 | Final fotoğrafı wireframe'in aynı yeşil zeminine soluyor, bağlantılar kısa lift/fade ile geliyor; fotoğraftan modele birebir kamera eşlemesi değil. |
| 94 | Wireframe / Modelin yüklenmesi / ilk görünüm | 7/7 | 8.7 | 8.7 | Lazy yükleme + hazır olduğunda 0,65 s opacity girişi; durum mesajı mevcut. |
| 95 | Wireframe / Sürükleme ve ev çevresinde dönme | 7/6 | 8.4 | 8.2 | Mimari kenarlar beyaz, çevre daha sakin; bitki kenarları voxel seçkisiyle azaltıldı. Orbit çalışıyor; pan/zoom yok, wheel sayfayı kaydırıyor. |
| 96 | Wireframe / Viewer kenarlarında %10 gradient | 8/7 | 8.7 | 8.6 | İki eksende 10% gradient korunuyor; beyaz bitki kümeleri seyrekleştirildi. |
| 97 | Wireframe / Viewer → dipnot ve MERGVS kredisi | 6/6 | 8.4 | 8.4 | Dört eylem, mülk notu ve kısa MERGVS / Luxembourg kredisi okunur. |
| 98 | Ortak arayüz / Menü açılışı / kapanışı | 5/5 | 8.6 | 8.6 | 0,4 s menü açılışı / 0,22 s kapanış; ortak closing promise, Escape ve odak dönüşü. |
| 99 | Ortak arayüz / Dokuz menü hedefi | 5/5 | 8.7 | 8.5 | Dokuz hedef anlatı sırasına getirildi; desktop iki kolon, portre tek kolon, kısa yatay ekran iki kolon. |
| 100 | Ortak arayüz / Uzak anchor / anlatı içinde seyahat | 5/5 | 8.8 | 8.7 | Uzak bağlantı View Transition veya kısa fallback veil ile; uzun sayfa uçuşu ve eski sahne durumuna atlama kaldırıldı. |
| 101 | Ortak arayüz / Bölüm içi Explore level kısa yolları | 3/3 | 8.5 | 8.5 | Explore level ortak navigasyondan geçiyor, ardından ilgili kat filmi; ani konum kesmesi yok. |
| 102 | Ortak arayüz / Fotoğraf lightbox açılışı | 6/6 | 8.6 | 8.5 | 0,35 s kısa açılış, büyük contain fotoğraf, görünür close; boş bantların sert kâğıt zemini kaldırıldı. |
| 103 | Ortak arayüz / Lightbox kapama / scrolla dönüş | 7/7 | 8.7 | 8.6 | 0,18 s kapanış, Escape, focus dönüşü; expanded plan açıkken onun scroll kilidi korunuyor. |
| 104 | Ortak arayüz / Header renginin bölüm sınırında değişmesi | 5/4 | 8.6 | 8.5 | Header için ince kontrast zemini; 76/66 px güvenli alan ve bölüm renginin kısa değişimi. |
| 105 | Ortak arayüz / Hover zoom / alt çizgi | 6/— | 8.3 | — | Hover/underline korunuyor; focus görünür, büyüme sınırlı. Mobil hover uygulanmaz. |
| 106 | Ortak arayüz / Scroll göstergesi / progress çizgileri | 6/5 | 8.5 | 8.4 | Genel yüzde yerine chapter numarası; sahne ilerlemesi ayrı. Mobilde genel gösterge gizli. |
| 107 | Ortak arayüz / Tek hareket / busy / tekrar deneme | 7/6 | 8.7 | 8.6 | Hareket statusu, son açık hedef kuyruğu; momentum yeni adım üretmiyor. |
| 108 | Ortak arayüz / Filmlerden çıkış ve tekrar ileri/geri kaydırma | 8/7 | 8.7 | 8.5 | İleri/geri/yeniden girişte kalıcı kilit görülmedi; büyük wheel önce sahneye oturuyor. Gerçek touch/Safari doğrulanmadı. |
| 109 | Ortak arayüz / Oynayan video → durmuş kare ölçüsü | 8/7 | 9.0 | 8.8 | Video/canvas/still aynı object-fit ve pozisyonu paylaşıyor; sampled duraklarda fit sıçraması görülmedi. |
