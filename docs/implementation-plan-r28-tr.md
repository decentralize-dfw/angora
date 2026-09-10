# Angora 21 — uygulama ve kabul planı (R28)

9 Eylül 2026. Bu plan erişilebilen talep geçmişini, R24–R27 denetimlerini ve
paylaşılan dört mobil ekran görüntüsünü birleştirir. Erişilemeyen eski sohbetler
için eksiksizlik iddiası yoktur. Aşağıdaki bütün açık işler bu sürümün kapsamındadır;
yalnızca kod yazılması, bir işin görsel olarak kabul edildiği anlamına gelmez.

## Çalışma ve yayın kuralları

- Mevcut `decentralize-dfw/angora`, `main` ve `https://xrweb.studio/angora/` korunur.
- Başlangıç: canlı R26 `3018617`; yerelde R27 `fdaeb79`. R27 hazırlanmış fakat
  yayımlanmamıştır. Önceki dosya aktarımı izin denetimince reddedilmiştir; bu
  sınırlama başka bir yoldan aşılmaz. Aynı genel onay tekrar tekrar istenmez.
- Kaynak mimari, kullanıcı değişiklikleri ve kaynak/fotoğraf izleri korunur.
  Görünüş düzeltmesi için ölçü, oda sınırı, komşu bina veya hizmet noktası uydurulmaz.
- Statüler: **açık**, **uygulanıyor**, **otomatik doğrulandı**, **görsel kabul**,
  **engelli**. Son ikisi birbirinin yerine kullanılamaz.
- Bitirilen paketler kaynak kodu + test + durum kaydı olarak sürümlenir.
  Yayın izni geçerli olduğunda mevcut main güncellenir. Bir geliştirme yayını,
  aşağıdaki bütün kabul kapıları geçmeden “son kalite/yayına hazır” diye sunulmaz.

## Sıra ve bağımlılıklar

1. **P0 / Render ve kararlılık:** erişilebilir referans → renk/AA sırası →
   derinlik/yüzey kanıtı → kontrollü ışık/malzeme karşılaştırması.
2. **P1 / Mobil etkileşim:** kamera geçişleri → etiket/ölçü yerleşimi → dokunma,
   panel, yürüyüş ve hata durumları. P0 ile bağımsız kısımları yürütülebilir.
3. **P2 / Kaynak doğruluğu:** mimari ve asansör → oda alanları → 17 fotoğraf grubu.
4. **P3 / Peyzaj ve bölge:** kot ve yol kanıtı → komşu/parsel detayları → gerçek
   coğrafi veri ve hizmet kategorileri → ölçek/kuzey/yakınlık arayüzü.
5. **P4 / Kabul ve teslim:** gerçek GPU görüntüleri → gerçek telefon hareket ve
   performans testi → fiziksel XR → main/canlı dosya eşliği ve son kontrol.

P0/P1'de aşağıda belirtilen işler ilk uygulama paketidir. P2/P3'ün kaynak veya
ölçüm bekleyen maddeleri, tahmini uygulama yapılarak kapatılmaz.

## P0 — referans, render, ışık ve yüzeyler

| ID | İş | Bitiş ölçütü / kanıt | Başlangıç durumu |
|---|---|---|---|
| R01 | `virtuallyeverafter/edetri/web/index.html` ve verilen `.work/edetri/web/` referansı | Erişilen gerçek kaynak; Three sürümü, renderer, AA, ton eşleme, HDR, güneş, gölge, doku ve malzeme karşılaştırma tablosu | Erişim çözüldü; doğru yol `decentralize-dfw/virtuallyeverafter/edetri/web/`; kaynak karşılaştırması `docs/edetri-render-comparison-r28.md`; görsel eşlik açık |
| R02 | Three r180 işlem zinciri | Sahne → isteğe bağlı AO → lineer-sRGB SMAA → lineer bloom → tek ACES/sRGB çıkış; çalışma sırasını test eden regresyon | Uygulandı; referansta AO varsayılan kapalı |
| R03 | Sabit çizim çözünürlüğü | Döndürme/yürümede çözünürlük düşmez; gerçek telefonda CSS boyutu, DPR ve buffer boyutu kaydedilir | R27 kodu var; cihaz kabulü açık |
| R04 | Derinlik ve z-fighting | Yakın/çevre/bölge kadrajlarında derinlik testi; 224 eski kaplama çakışması ve kapsama raporu geçerli; gerçek hareket videosunda titreşim yok | R27 sayısal kanıt var; görsel kabul açık |
| R05 | Çatı, cephe, zemin ve kesit piksellenmesi | Mipmap/anizotropi, normal haritası, kesit taraması ve kaynak normalleri; yakın/uzak ve eğik açıda moiré kontrolü | R27 kodu var; GPU kabulü açık |
| R06 | Tek güneş ve dengeli pozlama | HDR ikinci güneş üretmez; 09:00/12:30/18:00, üç mevsim, iki ışık seçeneğinde koyu yüzey ezilmez / beyazlar patlamaz | Açık |
| R07 | Malzemelerin ayrı tepkisi | Kiremit, sıva, ahşap, taş, metal, kumaş, cam, su için referans kadraj; roughness/normal/renk haritaları doğru renk uzayında | Açık; genel bir matlık değeri fotoğraf kabulü değildir |
| R08 | İç ışıklar ve cam gölgeleri | Armatür kaynak konumları korunur; cam opak gölge oluşturmaz; oda değişiminde ışık sıçraması yok | Temel sistem var; geçiş/görsel kabul açık |
| R09 | Katı/mobilya çakışmaları | Kaplama denetiminden ayrı kapı, duvar, mobilya, baş yüksekliği ve geçiş açıklığı kontrolleri | Kısmi; bütün katılar temiz denemez |

## P1 — mobil UI, kamera ve dolaşma

| ID | İş | Bitiş ölçütü / kanıt | Başlangıç durumu |
|---|---|---|---|
| U01 | Kamera animasyonu uç değerleri | Kesirli zaman damgalarında tam bitiş, kontrolün geri verilmesi, anında/azaltılmış hareket, iptal/yeni hedef regresyonları | İlk paket; aralıklı test hatası tekrarlandı |
| U02 | Oda ve ölçü etiketleri | Etiketler birbirini ve açık panelleri kapatmaz; ekran dışına taşmaz; yer yoksa yanlış odaya kaydırılmaz; yakınlaşınca tekrar görünür | İlk paket |
| U03 | Dokunma ve okunabilirlik | Ana mobil yazı 14–16 px; etkileşim hedefleri en az 44×44 CSS px; 320–430 px dikey, yatay ve safe-area kontrolü | İlk paket; gerçek cihaz kabulü ayrıca |
| U04 | Arka plan üzerinde kontrast | Açık/koyu çatı ve zemin üzerinde başlık/yardım metni okunur; odak halkası, seçili durumlar ve devre dışı kontroller belirgin | Açık |
| U05 | Panel ve klavye davranışı | Escape önce açık paneli kapatır; aynı tuş oda turunu da kapatmaz; odak geri gelir; görünmeyen kontrole odak kaçmaz | İlk paket |
| U06 | Döndürme/kaydırma/zoom ve plan | Sabit yükseklik, optik zoom, kat geçişinde kadrajın korunması; gerçek tek/iki parmak testi | Temel kod/test var; cihaz kabulü açık |
| U07 | Oda içi 360° ve yer noktaları | 27 istasyon; komşu oda/merdiven/kapı/duvar/mobilya davranışı; çıkışla izometri; eski bekleyen hedef iptali | Temel rota testi var; cihaz kabulü açık |
| U08 | Tur bilgisi ve ölçüler | Yürürken güncel oda/kat, doğrulanmış alan ve ölçüler; oda seçicisinde her mekâna erişim | Kısmi; alanlar P2'ye bağlı |
| U09 | Yükleme ve hatadan kurtarma | Ağ/GLB/HDR/WebGL hata durumları, tekrar deneme, arayüzün kullanılabilir kalması; bağlam kaybında anlaşılır uyarı | Kısmi |
| U10 | Bölgeye özel kontroller | Bölge/çevre/villa seçimi tutarlı; bölge görünümünde kat butonları yok; Villa 21'e dönüş, ölçek ve kaynak açıklaması | R27 var; UI kabulü açık |
| U11 | Gerçek cihaz kanıtı toplama | Kullanıcının cihazından gerçek çizim boyutu, kare süreleri ve sahne görüntüsü alınabilir; sahte emülasyon “iPhone testi” sayılmaz | İlk paket |

## P2 — mimari, ölçü ve mekanik

| ID | İş | Bitiş ölçütü / kanıt | Başlangıç durumu |
|---|---|---|---|
| A01 | Kat ve kesit doğruluğu | Bodrum/giriş/1. kat 1,60 m; çatı 1,30 m; alt katlar ve gerçek kesit dolguları korunur | Uygulandı; tekrar denetlenecek |
| A02 | Merdiven ve galeri | 7,15 m² kaynak açıklığı; yanlış döşeme/duvar yok; galeri görüşü ve katlar arası rota testi | Geometri kontrolü geçti |
| A03 | Üç duraklı asansör | Çatıda asansör yok; bodrum/giriş/1. kat kabin ve kapı hareketi; fotoğraf oranı ve hol bağlantısı | Çatı düzeltildi; mekanik/fotoğraf açık |
| A04 | Kaynak ölçülerin kökeni | 35 ölçü kaynak noktalarıyla eşleşir; model ölçüsü ve ölçülmüş fiziksel veri ayrılır | Uygulandı; tekrar denetlenecek |
| A05 | Her odanın m² değeri | Birleşik döşeme bileşenleri gerçek oda sınırlarıyla ayrılır; açıklıklar düşülür; yöntem ve tolerans kaydı; alan toplamları kontrol edilir | Açık; doğrulanmamış oda alanı gösterilmez |
| A06 | Kat/bahçe/havuz alanı | Kaplama izdüşümü, yaklaşık arazi ve net/tapu ayrımı; 8×4 m havuz kabulü ölçülmüş gibi sunulmaz | Etiket ayrımı var; kesin ölçüler açık |
| A07 | Kaynak katman ve dışa aktarım | Mimari/donatı/mobilya/peyzaj/çevre ayrı; kaynak hash, GLB round-trip, manifest ve navigasyon eşliği | Mevcut; her geometri paketinde yeniden |

## P2 — 17 fotoğraf kabul grubu

Her satır için: fotoğraflar doğru hacme bağlanacak → güncel model aynı açıyla
görüntülenecek → fark listesi uygulanacak → yakın ve genel kadraj tekrar
karşılaştırılacak → kabul kanıtı yazılacak. Blender görüntüsü geometri kanıtıdır;
tarayıcı ışık/malzeme kabulünün yerine geçmez. Başlangıçta 17 grubun hiçbiri
son fotoğraf kabulünü tamamlamamıştır.

| ID | Grup | Açık ayrıntılar |
|---|---|---|
| F01 | Cepheler / mahalle | Panjur pozları, kiremit rengi, cephe ışığı, komşu çit/istinat/bitki; yol genişliği ve kot kanıtı |
| F02 | Asansör | Kabin/kapı oranları, üç durak hareketi, hol birleşimleri; A03 ile birlikte |
| F03 | Bahçe / havuz | Bitki, çit, taş derzi, su ve havuz döşemesi rengi, kesin havuz ölçüsü |
| F04 | Bodrum mutfak | Yeşil cam/raflar, ahşap çerçeve, buzdolabı, kulp, ışık ve renk |
| F05 | Bodrum salon | Güncel sahnenin tüm fotoğraflarla karşılaştırılması ve farkların kapatılması |
| F06 | Bodrum WC | Dekor, raf içeriği, armatür, kapı açılımı |
| F07 | Garaj | Ayrı inceleme kamerası, tesisat/iç donatı, zemin, kapı mekanizması |
| F08 | Giriş / hol | Giriş mobilyaları, hol, kapılar, merdiven ve oda geçişleri |
| F09 | Giriş WC | Fotoğrafa özgü lavabo, ayna, klozet ve malzemeler |
| F10 | Ön giriş / yaklaşım | Taş deseni, bahçe kapıları, bitki konumları |
| F11 | Giriş mutfak | Seramik/ahşap rengi, panjur/çerçeve, tavan/avize, vitrin/vitray, cihaz ve kumanda ayrıntıları; yalnızca görünür kaynak bilgisi |
| F12 | Giriş salon | Avize kolları/ışığı, perde/kumaş, parke ton ve yansıması, dekor/vitrin/mobilya, geçiş basamağı |
| F13 | Ortak banyo | Güncel sahnenin fotoğraflarla karşılaştırılması |
| F14 | Yatak katı holü | Korkuluk motifleri, galeri sarkıtı, berjer, dolap profili, ahşap tavan, kapılar |
| F15 | Ebeveyn odası / banyo / giyinme | Fotoğrafları üç hacme ayırma ve her birinin ayrı kabulü |
| F16 | Diğer yatak odaları | Fotoğraf–oda eşleşmesi, oda başına kamera ve son kontrol |
| F17 | Çatı hacimleri | Kumaş ve dolap profilleri, banyo, güney oda, çatı yakın incelemesi |

## P3 — saha, çevre ve gerçek bölge

| ID | İş | Bitiş ölçütü / kanıt | Başlangıç durumu |
|---|---|---|---|
| S01 | Ön/arka/yan kotlar | Dört teras korunur; havuzdan bakıştaki sol ~2 m yüksek, sağ ~5–6 m düşük tarifleri kaynakla kontrol edilir; görülmeyen kot ölçülmüş sayılmaz | Kısmi |
| S02 | Yol ve zemin | Bina kesişmesi yok; yol genişliği, kaldırım, yol–bahçe–giriş geçiş kotları kaynakla doğrulanır | Bilinen kesişmeler giderildi; tüm saha açık |
| S03 | 42 çevre yapı | CAD yerleşimi ve ölçeği korunur; çatı/cephe yükseklikleri, bahçeler, çitler ve istinatlar kanıtla detaylandırılır | Kısmi; varsayılan detay ayrıştırılacak |
| S04 | Peyzaj kalitesi | Çim/taş geçişi, ağaç tacı, çalı, gölge ve uzaktaki LOD; genel ve mobil yakın kadraj | R27 LOD var; fotoğraf/GPU kabulü açık |
| S05 | Coğrafi bölge bağlamı | Gerçek kuzey, yerleşimin çevreye kayıtlanması, okunabilir ölçek; dikdörtgen araziyi soldurmak tek başına çözüm sayılmaz | Açık; coğrafi veri gerekiyor |
| S06 | 3–4 gerçek hizmet kategorisi | Kaynaklı hizmet noktaları, kategori filtresi, güncellik, mesafe yöntemi; kuş uçuşu yolculuk süresi diye sunulmaz | Engelli: önceki koordinatlı dış veri isteği reddedildi; veri/arayüz uygulanmadı |

## P4 — test, performans ve yayın kapıları

| ID | İş | Kabul koşulu |
|---|---|---|
| Q01 | Otomatik regresyon | Bütün Node testleri; kesirli kamera bitiş testinin tekrarlı çalışması; üretim build |
| Q02 | Veri/geometri | Kaynak mimari hash korunur; kapsam/kaplama/katı/rota denetimleri ayrı sonuçlarla kaydedilir |
| Q03 | Gerçek iPhone Safari | Model + iOS/Safari sürümü, yön, CSS boyutu, DPR, çizim buffer'ı; çatı/cephe/bodrum/bölge ekran görüntüleri ve hareket videosu |
| Q04 | Mobil performans | Aynı sahnelerde 15–30 sn hareket örneği; FPS, p50/p95 kare süresi, çizim çağrısı/üçgen, yükleme süresi; ısınma için en az 5 dk ikinci tur. Hedef sürdürülebilir en az 30 FPS; ölçülmeden geçmez |
| Q05 | Görsel karşılaştırma | Aynı kamera/saat/mevsim/ışık, mobilya ve kesit durumuyla önce/sonra; referans motorla fark listesi; piksellenme ve titreşim için video |
| Q06 | Diğer istemciler / XR | Masaüstü, mevcut Android ve fiziksel XR desteği; bulunmayan cihaz için test yapılmış işareti konmaz |
| Q07 | Yayın bütünlüğü | Yetkili main aktarımı, Pages sonucu, canlı HTML/bundle/model hash eşliği, kırık bağlantı ve hata günlüğü |
| Q08 | Son kabul | R01–S06 açık işler ve 17 fotoğraf grubunda kanıtlar kapanır; gerçek cihaz kabulü geçer. Eksik varsa kalan ID'ler açıkça listelenir |

## Mevcut dış bağımlılıklar

1. **Çözüldü:** kullanıcı GitHub erişimini güncelledi. `virtuallyeverafter` hesap
   adı değil, `decentralize-dfw` altındaki özel depo adı. Doğru referans dosyası
   ve bağlı render modülleri okundu; referans deposuna yazılmadı.
2. Verilen <https://virtuallyeverafter.work/edetri/web/> bu oturumdaki web erişiminde
   açılamadı. Referansın bozuk veya hiç var olmadığı sonucu çıkarılamaz.
3. Kullanılabilir bulut tarayıcısında WebGL yok. Desteklenmeyen GPU ayarıyla bu
   engel aşılmaz; gerçek iPhone veya yetkili GPU tarayıcı kanıtı gerekir.
4. R27 mimari düzeltme dosyası yayını ve koordinatlı dış veri sorgusu önceki izin
   denetimlerinde durdurulmuştur. Yerel kod/test işlerinin ilerlemesine engel değiller.

## İlk paket kaydı

R02, U01, U02, U03, U05 ve U11 uygulanacak ve ayrı regresyonlarla sınanacak.
Sonuçlar `docs/r28-first-package-results.md` dosyasında tutulur. Bir sonraki
paket, sonuçlara göre açık R/U maddeleri ve kaynakla doğrulanabilen A/F/S işleriyle
devam eder; bu planın hazırlanması diğer maddelerin tamamlandığı anlamına gelmez.
