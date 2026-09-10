# Angora 21 — R30–R39 model düzeltmeleri

10 Eylül 2026. Taban: `decentralize-dfw/angora`, R29 main, `53b0cd0a8749263a0e99ad115df8625440ebff9e`.

Bu kayıt **düzenlenebilir 3D modelde yapılan işleri** anlatır. Ana dosya `build/blender/angora21-working.blend`; bağlı geometri ve paketli dokular `build/blender/layers/` içindedir. Arayüz, plan kamerası, ölçü etiketleri, Three.js render zinciri, web GLB/navigasyon çıktısı, main aktarımı ve yayın bu çalışmanın kapsamı değildir. Eski web modelleri R39 diye etiketlenmemiştir.

## Kullanıcının işaretlediği model hataları

| Konu | Modelde uygulanan düzeltme | Somut kontrol / sınır |
|---|---|---|
| Holde önde duran aynalı dolap | 49 parça birlikte 59,6 cm geriye, mevcut nişin içine taşındı; dolabın gerçek gövde ölçüsü korundu. | Arka taç–duvar açıklığı yaklaşık 7 mm; dolabın ön yüzü niş dönüşünden yaklaşık 5,3 cm içeride. `model-r32/cabinet-placement.json`, R39 kontrolü ve karşılaştırma görüntüsü. |
| Asansörün koridoru tıkaması | Üç kattaki şaftın ön yüzü 35 cm geriye alındı. Açılan eski alanlarda döşeme tamamlandı, eski duvar izleri temizlendi; kabin ve kapılar aynı şaftla hizalandı. | Üç kat açıklık, geri kazanılan döşeme ve eski duvar izi probları geçti. Kompakt kabin fotoğraf yorumudur; montaj/proje ölçüsü değildir. |
| Çatıda asansör izi | Asansör başı 8,991 m'de biter; çatı bitmiş döşemesi 9,4705 m'dir. Çatıda durak veya şaft duvarı yoktur. | Çatı döşemesi probları delik/yükselti göstermedi. |
| Üç duraklı kabin ayrıntısı | Paslanmaz kontrol paneli, 0/1/2 düğmeleri, alarm düğmesi, dört fiziksel spot, kabin kılavuzları ve sığ metal dokusu modellendi. Tek kabin üç durak arasında hareket eder; ışıkları kabinle taşınır. | Native Blender animasyonu; 1, 288, 576. karelerde 0 / 3,0996 / 6,3714 m konumu doğrulandı. Web hareket entegrasyonu yapılmadı. |
| Kapalı kapılar | 14 iç açıklık onarıldı; üç asansör kanadı açık tutuldu. Yedi dış kapı, bahçe yaya ve araç kapıları açık konuma getirildi. Garajın seksiyonel kapısı tavana çekildi. | 14 iç + 7 dış açıklıkta dokuzar ışınla geçiş kontrolü. Garajda araç bilerek park halindedir. Dolap kapakları mekân geçiş kapısı olarak değerlendirilmez. |
| Kapanmış çatı pencereleri | Sağ/sol çatı odalarının iki dormer boşluğu ve ön cam açıklıkları geri açıldı. Ana çatı çift yüzeyler yerine gerçek kalınlığı olan kapalı kabuk haline getirildi. | 18 pencere ışınında engel yok; ana çatı gövdesinde açık/manifold dışı kenar yok. |
| Çatıda iki yüzey arasındaki boşluk | Çatı kalınlığının kesildiği hem 1. kat hem çatı katında gerçek kesit yüzeyi üretildi. Dört katta duvar ve şaft kesitleri de güncellendi. | 7 alternatif kesit gövdesi: 4 duvar, 2 çatı, 1 toprak. Tam modelde gizlidir; ilgili native kesit görünümünde taralıdır. |
| 1. kat banyosunun ters düzeni | Lavabo/tezgâh kapının karşısındaki doğu duvarına, WC giriş yanına taşındı; açık duş ve detaylı vitrifiye oluşturuldu. | Oda sınırı, kapı açıklığı, katı geometri ve yakın görüntü kontrol edildi. |
| Banyo yanındaki yatak yönü | Güney yatak odasının başlığı, kapıdan girildiğinde sağdaki batı duvarına alındı. | Şilte yaklaşık 1,97 × 1,47 × 0,25 m; başlık ve oda sınırı kontrolü geçti. |
| Gerçekçi mobilya ölçüsü/kalitesi | Holde iki kumaş berjer, sehpa ve dolap; salon masa/sandalyeleri; yatak örtüleri ve yastıklar; komodin, dolap, aydınlatma ve çatı koltuğu ayrıntılandırıldı. Dolu kutu dolaplar iç hacimli gövdelere, köşeli borular yuvarlak profillere dönüştürüldü. | 884 mobilya parçası, 57 ayrı mobilya grubu arasında örneklenmiş kesit denetimi; son sonuçta bağımsız mobilya çakışması yok. Fotoğraftan üretilen ölçüler saha ölçümü değildir. |
| Antre/hol ve mutfak geçişleri | Kaynakta açık olan geçişlerdeki gereksiz dolgular kaldırıldı; kapı/kasa ve camlı ahşap detaylar korunup açıklıklar temizlendi. Mutfak gövdeleri gerçek duvar dönüşlerine oturtuldu. | Güncel duvar yüzeyleriyle kesişme ve kapı probları; mutfak iç görüntüsü. |
| Antre–yemek alanı döşemesi | Merdiven hattından sonraki yükseltilmiş bölümde parke alanı düzeltildi; kaplama üst üste bindirilmedi. | Dört malzeme probu ve döşeme sahipliği kaydı. |
| Yemek/salon basamaklarının plane görünmesi | İki basamak gövdesi ve aradaki kolon kapalı katı geometri olarak korundu; komşu gereksiz kaplama yüzeyleri temizlendi. | Basamak yüzeyleri 2,9496 m kotunda ve normalleri yukarı; kapalı gövde kontrolü. |
| Eksik yükseltilmiş yemek/oturma köşesi | Fotoğraftaki iki klasik sandalye, küçük masa, konsol ve ayna eklendi. | Oturma yüksekliği yaklaşık 48,6 cm, masa üstü 67,9 cm; genel/yerleşim görüntüsü. |
| Bodrumda boş görünen toprak | Yerel arazinin altı kapalı toprak hacmiyle tamamlandı. Bodrum kesitinde toprağın kesilen kısmı gri ve taralıdır; oda, açık arka bahçe ve havuz doldurulmadı. | Son hacim yaklaşık 4.109,07 m³; açık/manifold dışı kenar yok. −6 m taban kesit sunumu içindir, jeolojik ölçüm değildir. |
| Garaj | Gerçek ölçekte örnek otomobil, açık seksiyonel kapı, kıvrımlı raylar, motor, makaralar, dolap, raf/kutular, dondurucu ve tesisat eklendi. | Araç yaklaşık 4,45 × 2,03 m; kapı ve dolap yan açıklıkları kontrol edildi. Otomobil ev sahibinin aracı olarak sunulmaz. |
| Bahçe ve havuz | Kopuk yan bahçe basamakları her yanda 18 rıhtlı kesintisiz gövdeye dönüştü. Havuz tek kapalı tekne, teras tek birleşik döşeme oldu; su derinliği ve merdiveni modellendi. | 17,22 cm rıht, 32 cm basamak; sahanlıkta boşluk yok. Mevcut yaklaşık 8 × 4 m havuz korunur; kesin ölçü iddiası yok. |
| Ön bahçe/yol kotları | Giriş yolu, garaj yaklaşımı, açık kapılar, taş kaide ve demir çit mevcut kaldırım eğimine bağlandı. Ön bitkiler aynı kot değişimini izler. | Kayıtlı kaldırım uçlarıyla bağlantı; kotları değiştirmeden ters asfalt/zemin yüzeyleri ve parçalı normal yönleri düzeltildi. Eski bordürler 40 cm örnek aralıklarıyla mevcut yol kotuna oturtuldu; kaldırıma 24 cm aşağı doğru gövde eklendi. |
| Bitkilerin kaba görünmesi | 32 çokgen çiçek kütlesi ve eski basit başlıklar kaldırıldı; kıvrılan çim yaprakları, katlı küçük yapraklar, sap ve taç yapraklar üretildi. Görünen kalın gövdeler yuvarlatıldı. | 68.878 çim yaprağı; havuz/teras/yol yüzeyleri çimden ayrıldı. Tür, mevsim ve her yaprağın konumu birebir ölçülmüş değildir. |
| Çevre yapılar ve sınırlar | Mevcut 42 yapının proje yerleşimi ve ölçeği korundu. Var olan çevre sınır çizgilerinden 12 kapalı istinat/sınır gövdesi oluşturuldu; yeni duvarlar yol ve bina alanlarından çıkarıldı. | Sınırların XY konumu mevcut proje verisinden; yükseklik ve görülmeyen cepheler yorumdur. 42 binanın tüm cephelerinin fotoğraf kabulü tamamlanmış sayılmaz. |
| Üst üste gelen mesh/kaplamalar | Güncel yerel mimari için UV/malzeme korunarak görünür yüzey sahipliği düzeltildi. Kapalı çatı ve basamak gövdeleri kesilmeden korundu. Tezgâh, kasa, pervaz, buzdolabı ve dolapların duvar içine giren kısımları düzeltildi. | R36+R39 kaydı yaklaşık 1.964,97 m² tekrar eden yüzey alanı temizliğini belgeler. Korkuluk ankrajı ve şaft–yapı birleşimi bilinçli montaj teması olarak ayrıdır. |

## Mekân bazındaki ek işleme

| Fotoğraf grubu | Bu model çalışmasındaki karşılığı |
|---|---|
| Cephe/mahalle | Kapı açıklıkları, çatı kabuğu, gölgeyi bozan yüzeyler, çevre sınırları ve yerleştirilmiş mevcut yapılar. Görülmeyen komşu cepheleri doğrulanmadı. |
| Asansör | Gerideki ortak şaft, açık üç kapı, kontrol paneli, spotlar, metal kabin ve native hareket. |
| Bahçe/havuz | Tekne, derinlikli su, tek teras, havuz merdiveni, kesintisiz bahçe merdivenleri, ön kapılar ve daha ayrıntılı bitkiler. |
| Bodrum mutfak | Yeşil camlı çerçeveler, iç raflar, içi boş dolap gövdeleri, kapalı evye, gerçek buzdolabı yüzeyi ve duvara uygun tezgâh uçları. |
| Bodrum salon | Mevcut fotoğraf yerleşimi korundu; kat kaplaması üzerindeki yinelenen kenar desenleri temizlendi, mobilya/duvar kontrolüne dahil edildi ve güncel genel görüntü alındı. |
| Bodrum WC | Lacivert iç hacimli dolap, ahşap tezgâh, lavabo/ayna, raf ve küçük donatılar; duvarı delen bitki geri alındı. |
| Garaj | Araç, kapı mekanizması, raflar/dolap/dondurucu ve seramik zemin. |
| Giriş/hol | Açık geçişler, kapı açıklıkları, gerideki asansör, doğru döşeme ve basamaklar. |
| Giriş WC | Kaideli lavabo, doğru yönde WC, armatür/ayna; sarı/ivori yüzey ve koyu bordür düzeni. |
| Ön giriş | Eğimli taş yol, garaj yaklaşımı, kaide/çit, açık kapılar ve yeni kota oturan bitkiler. |
| Giriş mutfak | Duvar sınırına oturan dolap/tezgâh/kasa ve pervazlar; mevcut fotoğraf temelli ahşap, cam ve cihaz ayrıntıları. |
| Giriş salon | Eksik yükseltilmiş köşe donatısı, parke sınırı, gerçek basamak; klasik mobilya profil ve yüzey temizliği. |
| Ortak banyo | Kullanıcının tarifine uygun lavabo/WC yönü, detaylı açık duş ve vitrifiye. |
| Yatak katı holü | Ölçekli iki berjer ve sehpa, niş içindeki dolap, korkuluk ve pervaz temas temizliği. |
| Ebeveyn/banyo/giyinme | Düşen yatak örtüsü ve yumuşak yastıklar, bronz lambalar, aynalı dolap çerçeveleri/iç hacimler, lavabo deliği olan tezgâh, WC ve açık duş. Örtü–komodin kesişmeleri son taramada giderildi. |
| Diğer yatak odaları | Doğru güney yatak yönü, ölçüsü korunan şilteler, dolap iç hacimleri, dökümlü örtüler, baş yüksekliği kontrolü. |
| Çatı hacimleri | Açık iki pencere, kapalı çatı kabuğu ve tarama, mavi kapitoneli koltuk, çekmeceli mavi dolap/TV, yatak örtüleri, eğime sığan duş ve raf. |

## Kanıtın sınırı

Bu çalışma **“bütün ev ve 42 komşu her ayrıntısıyla birebir ölçüldü/fotoğrafla kabul edildi”** iddiası taşımaz. Kaynak fotoğraflarda görünmeyen ek mutfak, komşu arka cepheleri, kesin havuz/saha ölçüleri ve bitkilerin tüm konumları için böyle bir kanıt bulunmuyor. Bu alanlarda mevcut proje modeli ve makul fiziksel detay kullanıldı; nesnelerin kaynak durumu yorum olarak kaydedildi. Kesin oda m² ve görünür ölçü etiketleri de bu geometri düzeltmeleriyle kendiliğinden doğrulanmış olmaz.

Taramalar, açıklık ışınları ve seçili kapalı-gövde kontrolleri belirli hataları yakalar; bütün sahnede her tür kesişmenin matematiksel ispatı değildir. Bilinçli mobilya montajları, yumuşak malzeme temasları, korkuluk ankrajı ve şaftın taşıyıcı yapıyla birleşimi ile yanlış çakışma birbirinden ayrılır.

Native Cycles görüntüleri gerçek güncel modelden alınır. Bunlar mobil GPU, web gölge/AA, FPS veya fiziksel XR testi değildir. Webe aktarımda yeni prosedürel malzemelerin dokulaştırılması, model/sekme kesitlerinin ve navigasyonun birlikte yenilenmesi gerekir; eski web dosyalarına yalnız yeni sürüm numarası yazılmaz.

## Son kontrol özeti

- 884 mobilya parçası / 57 bağımsız mobilya grubu: örneklenen kesitlerde bağımsız mobilya kesişmesi yok.
- 884 mobilya parçasının çatı/tavan temas kontrolünde kesişme yok.
- 23 seçili yapısal/çevre gövdesi kapalı; açık veya manifold dışı kenar yok.
- 21 iç/dış kapı açıklığında geçiş probları temiz; 18 dormer ışını engellenmiyor.
- 27 bağlı dosya ve ana sahne farklı bir klasöre taşınarak açıldı; eksik bağlı veri, paketlenmemiş doku ve yerleşim sapması yok.
- R29 ile karşılaştırmada `index.html`, `viewer`, `web-assets` ve `build/web` dosyaları değişmedi.

## Kontrol dosyaları

- `build/model-r39/final-geometry-qa.json`: dolap, kapalı hacimler, kesitler, kabin ve ışık hareketi, mobilya sonuçları.
- `build/model-r39/furniture-assembly-audit.json`: 884 parça / 57 grup; örneklenmiş bağımsız mobilya kesişmeleri.
- `build/model-r35/whole-room-wall-audit.json`: 2.912 iç/dış donatı parçasının duvar taraması; kalan iki bilinçli yapı/montaj birleşimi.
- `build/model-r35/room-audit.json`: 860 yeni parçanın duvar/geometri denetimi; 21 açık kapı.
- `build/model-r30/geometry-qa.json`, `build/model-r31/geometry-qa.json`: pencere, yatak yönü/ölçeği, asansör, boşalan döşeme, basamak ve malzeme regresyonları.
- `build/furniture-headroom-report.json`: 884 mobilya parçası / çatı-tavan temas kontrolü.
- `build/blender/layer-qa.json`: dosya bağı, paketli dokular ve kayıttan sonra yerleşim tutarlılığı.

Bordürlerin mevcut yol alanı dışında kalan örneklerinde önceki yorum kotu korundu; ön cephedeki bütün bordür örnekleri mevcut yol alanına oturur. Bu durum `build/model-r39/curb-grade-fit.json` içinde sayısal olarak kayıtlıdır.

Eski R30–R38 kayıtları kendi aşamalarını anlatır. Örneğin R32'deki “çatı bütünüyle kapalı değil” notu R34'teki kapalı çatı işlemiyle, R32'nin değişmeyen ön kot kaydı da R37'deki kaldırım bağlantısıyla güncellendi; eski sayılar son geometri yerine kullanılmamalıdır.

## Otomobilin kaynağı

Khronos glTF Sample Assets / CarConcept; Eric Chadwick, © 2024 Darmstadt Graphics Group GmbH, CC BY 4.0. İlk geometri kaynağı Unity Fan, CC0. Ayrıntılı lisans ve değişiklik kaydı `assets/third-party/car-concept/ATTRIBUTION.md` içindedir. İlgili birincil kaynak: https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/CarConcept/README.md
