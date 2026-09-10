# Angora — güncel durum ve devam sırası (R29)

10 Eylül 2026. Dayanak: kullanıcının paylaştığı R27 logu, iki R28 belgesi ve
yereldeki `f6ba179d720efed3c4218066a5058fc6c7250441` kaynak kaydı. Bu dosya
R28 planındaki 58 ID'nin güncel devam kaydıdır; önceki belgeler tarihsel kayıt
olarak korunmuştur.

## Eski logda artık geçerli olmayan noktalar

| R27 logundaki ifade | R28'de doğrulanan durum |
|---|---|
| EDETRI referans dosyası bulunamadı | Doğru dosyaya erişilmiş; karşılaştırma `edetri-render-comparison-r28.md` içinde. Görsel eşdeğerlik doğrulanmış değil. |
| SMAA sırası yanlış | `postprocessing.js` içinde SMAA, lineer bloom ve OutputPass'ten önce. Regresyon testi geçiyor. |
| Kamera testi kararsız | Mutlak bitiş zamanı düzeltmesi mevcut. R28'de 30 tekrar kaydı var; R29'un tek tam test çalıştırmasında da geçti. |
| Mobil arayüz düzeltmeleri yapılmalı | Etiket yerleşimi, okunabilirlik, panel/odak/Escape ve ekran taşması onarımları uygulanmış. R28 UI ölçümleri gerçek iPhone kabulü değil. |
| Cihazdan kanıt alınamıyor | R28'de 15 saniye ölçüm, PNG ve aynı karenin ayarlarını içeren JSON kaydı var. Fiziksel cihaz sonuçları henüz teslim edilmedi. |

**Kodda uygulanmış**, **otomatik kontrolden geçmiş** ve **görsel olarak kabul
edilmiş** ayrı durumlardır. Birbirlerinin yerine kullanılmazlar.

## Bu devam paketinde uygulananlar

- **R08:** En yakın dört armatürü anında değiştiren yol kaldırıldı. Etkin
  armatürler yerlerini korur; seçim sınırında 0,6 m mesafe payı küçük hareketlerde
  gereksiz değişimi engeller. Değişmesi gereken ışık 300 ms ölçeğinde sıfıra
  iner, yeni kaynak ardından 300 ms ölçeğinde yükselir. Bir geçiş tersine
  çevrildiğinde mevcut parlaklıktan devam eder. Bu süre ve seçim payı render
  ayarıdır; fiziksel armatür ölçümü değildir.
- Kaynak konum, yön, renk, kat ve ışık şiddeti kayıtları değiştirilmez. Aynı anda
  en fazla dört spot ışık kullanılır; kamera sabitken de geçiş sonuna kadar
  çizim sürer. Yalnızca parlaklık değişince gölge haritası yeniden hesaplanmaz;
  kaynak veya görünürlük değişince yenilenir.
- Mutlak zaman sınırları kullanılır; uzun bekleme ilk geçişi anında bitirmez,
  kesirli kare adımları geçişi sonsuza kadar açık bırakmaz.
- **R06/U11:** Cihaz JSON kaydı, kullanılan çevre ışığının HDR mı yoksa
  prosedürel gökyüzü mü olduğunu ve o karedeki armatürlerin konum/şiddetlerini
  de içerir. Böylece farklı ışık koşulları aynı koşul sanılarak karşılaştırılmaz.
- **U09:** Aynı WebGL bağlam kaybını iki kez işleyen dinleyici teke indirildi;
  ölçümün kesilmesi, hata mesajı ve yeniden açma işlemi aynı yerde tutulur.

Bu paket **R08'in geçiş mantığını** onarır. Cam gölgelerinin, tüm ışıkların ve
oda görüntülerinin gerçek cihaz kabulünü kapatmaz. Model, Blender, GLB,
navigasyon ve mimari kaynakları değişmedi.

## Kontroller

- `npm test`: **35/35 geçti**. Mevcut 30 kontrole beş armatür geçiş kontrolü
  eklendi; kamera, AA sırası, model hashleri, ölçüler ve rota kontrolleri dahil.
- Kaynaktaki **20 armatür ve 27 tur istasyonu** ile dört ışık sınırı, kat
  seçimi, kaynak konumları, geçişin bitmesi ve kaynak verinin değişmemesi sınandı.
- Beş yeni kontrol: uzun bekleme/aç-kapa; sıfır şiddette kaynak değiştirme;
  seçim sınırındaki küçük hareketler; geçişin tersine çevrilmesi; gerçek kaynak
  istasyonlarının tamamı. Bunlar hesap ve durum kontrolleridir, GPU ölçümü değil.
- `npm run build:pages`: **başarılı**. Hazır `index.html` ile JS/CSS dosyaları
  üretim çıktısıyla birebir eşleşiyor; göreli dosya bağlantıları mevcut.
  Kaynak farkında model/GLB/navigasyon değişikliği yok; `git diff --check` geçti.
- Bu çalışmada yeni tarayıcı görüntüsü, fiziksel telefon FPS kaydı veya XR
  kabulü üretilmedi. Önceki oturumun WebGL kısıtı bugünün cihaz testi sayılmaz.

## 58 işin güncel kaydı

### Render ve yüzeyler

| ID | Mevcut durum | Kalan iş |
|---|---|---|
| R01 | Referans kaynak karşılaştırması mevcut | Aynı koşullarda gerçek GPU görüntüsüyle farkların incelenmesi |
| R02 | İşlem sırası uygulandı; regresyon geçti | Shader'ın hedef GPU'da çalışması ve görünüşü |
| R03 | Sabit çözünürlük kodu/testi mevcut | Gerçek telefonda hareket boyunca çizim boyutu ve görüntü |
| R04 | 224 kaplama çifti için sayısal onarım kanıtı mevcut | Yakın/çevre/bölge hareket görüntüsü; diğer kesişmeler ayrı |
| R05 | Mipmap/anizotropi/normal ve kesit önlemleri mevcut | Çatı, cephe ve zeminde eğik açı ve hareket kabulü |
| R06 | Güneş ve pozlama kodu mevcut; çevre ışığı türü raporlanıyor | 09:00/12:30/18:00 ve üç mevsimde HDR, gölge ve pozlama karşılaştırması |
| R07 | Malzeme ailelerine teknik ayarlar uygulanmış | Kiremit, sıva, ahşap, taş, metal, kumaş, cam, su için fotoğraf eşlemesi |
| R08 | R29 armatür geçişi otomatik doğrulandı | İç mekânda geçiş görüntüsü, ışık dağılımı ve cam gölgelerinin cihaz kabulü |
| R09 | Bazı katı/mobilya kontrolleri mevcut | Bütün parçalarda kapı/duvar/mobilya/baş yüksekliği ve açıklık denetimi |

### Mobil arayüz ve dolaşma

| ID | Mevcut durum | Kalan iş |
|---|---|---|
| U01 | Kamera bitiş ve iptal mantığı/testleri mevcut | Diğer kamera hareketleriyle gerçek cihaz kullanımı |
| U02 | Etiket çakışma/ekran sınırı mantığı/testleri mevcut | Model yüklüyken gerçek telefonda oda ve ölçü okunabilirliği |
| U03 | Mobil boyut ve hedef onarımları uygulanmış | Gerçek dokunma, Safari çubuğu ve safe-area kabulü |
| U04 | Başlık yüzeyi ve odak stilleri mevcut | Açık/koyu yüzeyler üzerinde son kontrast kontrolü |
| U05 | Panel/Escape/odak onarımları uygulanmış | Model ve tur açıkken gerçek cihaz etkileşimi |
| U06 | Sabit yükseklik/zoom/plan mantığı testli | Gerçek tek/iki parmak, yatay/dikey kullanım |
| U07 | 27 istasyon ve rota mantığı testli | Gerçek cihazda oda/kapı/merdiven geçişleri ve izometriye dönüş |
| U08 | Oda/kat ve kaynaklı ölçü bilgisi mevcut | Güvenilir oda m² değerleri; A05'e bağlı |
| U09 | Hata durumları kısmi; R29 bağlam dinleyicisi düzeltildi | Ağ/GLB/HDR hataları ve yeniden denemenin uçtan uca kabulü |
| U10 | Bölge kontrolleri ve Villa 21'e dönüş uygulanmış | Bölge/çevre/villa geçişlerinde son UI kontrolü |
| U11 | Cihaz kaydı uygulanmış, R29 ışık bilgileri eklenmiş | Gerçek cihazdan görüntü, hareket videosu ve JSON ölçümünün alınması |

### Mimari, ölçüler ve asansör

| ID | Mevcut durum | Kalan iş |
|---|---|---|
| A01 | 1,60 m kat / 1,30 m çatı kesiti ve dolgular mevcut | Gerçek görünümde kat, bahçe ve alt kat korunumu |
| A02 | Merdiven açıklığı, galeri ve kat rotaları testli | Fotoğraf/görsel son kontrol |
| A03 | Çatıya çıkmama ve üç durak düzeni mevcut | Kabin/kapı oranı, hareket ve hol bağlantıları |
| A04 | 35 kaynak ölçü eşlemesi testli | Yeni ölçülerde aynı kaynak doğrulamasının sürdürülmesi |
| A05 | Açık | Gerçek oda sınırları, açıklıkların düşülmesi, ayrı m² ve toplam kontrolü |
| A06 | Alan türleri ayrılmış | Kesin havuz ve saha ölçüleri; tahminler ölçülmüş gösterilmez |
| A07 | Katmanlar ve dışa aktarım/hash düzeni mevcut | Her yeni geometri paketinde yeniden doğrulama |

### Fotoğrafla son kabul: 17 grubun tamamı açık

| ID | Grup | Sıradaki kontrol |
|---|---|---|
| F01 | Cephe / mahalle | Panjur, kiremit/cephe tonu, çit/istinat ve komşu sınırları |
| F02 | Asansör | Üç durak kabin/kapı oranları ve hareket |
| F03 | Bahçe / havuz | Bitki, çit, taş derzi, su ve döşeme rengi |
| F04 | Bodrum mutfak | Yeşil cam, raf, ahşap çerçeve, buzdolabı ve kulp |
| F05 | Bodrum salon | Bütün fotoğrafları güncel sahneyle eşleştirip fark çıkarma |
| F06 | Bodrum WC | Dekor, raf, armatür ve kapı açılımı |
| F07 | Garaj | İnceleme kamerası, donatı/tesisat, zemin ve kapı mekanizması |
| F08 | Giriş / hol | Mobilyalar, kapılar, merdiven ve oda geçişleri |
| F09 | Giriş WC | Lavabo, ayna, klozet ve malzemeler |
| F10 | Ön giriş | Taş deseni, bahçe kapısı ve bitkiler |
| F11 | Giriş mutfak | Renkler, panjur, tavan/avize, vitrin/vitray ve cihazlar |
| F12 | Giriş salon | Avize, perde, parke, vitrin/dekorasyon ve kot geçişi |
| F13 | Ortak banyo | Bütün fotoğrafları güncel sahneyle eşleştirme |
| F14 | Yatak katı holü | Korkuluk, sarkıt, ahşap tavan, dolap ve kapılar |
| F15 | Ebeveyn bölümü | Yatak odası, banyo ve giyinmeyi ayrı ayrı doğrulama |
| F16 | Diğer yatak odaları | Fotoğraf–oda eşlemesi ve her odanın ayrı kontrolü |
| F17 | Çatı hacimleri | Kumaş/dolap, banyo, güney oda ve çatı yüzeyleri |

### Saha, peyzaj ve bölge

| ID | Mevcut durum | Kalan iş |
|---|---|---|
| S01 | Teraslar ve bazı kot onarımları mevcut | Sol ~2 m / sağ ~5–6 m tarifi ve dört yandaki kotların kaynakla kontrolü |
| S02 | Bilinen yol kesişmeleri onarılmış | Yol genişliği, kaldırım ve bahçe/giriş geçişleri |
| S03 | 42 kaynak çevre yapı mevcut | Kanıtlı cephe/çatı, bahçe, çit ve istinat detayları |
| S04 | Bitki LOD onarımı mevcut | Çim/taş geçişi, ağaç/çalı ve gölgelerin fotoğraf/GPU kabulü |
| S05 | Açık | Gerçek kuzey ve coğrafi kayıt; arazi sınırını soldurmak yeterli değil |
| S06 | Veri ve arayüz uygulanmamış | Kaynaklı 3–4 hizmet kategorisi, mesafe yöntemi ve güncellik; önceki dış veri engeli kayıtlı |

### Doğrulama ve yayın

| ID | Mevcut durum | Kalan iş |
|---|---|---|
| Q01 | R29'da 35/35 test geçti | Her değişiklik paketinde gerekli build/regresyon |
| Q02 | Mevcut model/hash/ölçü/rota testleri geçti | Yeni geometri için kapsam, kaplama ve katı denetimleri ayrı |
| Q03 | Gerçek iPhone kabulü açık | Cihaz/iOS bilgisi, dört kadraj, ekran görüntüsü ve hareket videosu |
| Q04 | Gerçek mobil performans kabulü açık | 15–30 saniye hareket ve en az 5 dakika sonra ikinci tur; sürdürülebilir 30 FPS hedefi |
| Q05 | Açık | Aynı kamera/saat/mevsim/ayarlarla önce–sonra karşılaştırma |
| Q06 | Fiziksel istemci/XR kabulü açık | Masaüstü, erişilebilir Android ve gerçek XR cihazı |
| Q07 | Kullanıcı R28'i elle yükleme aşamasında | Tam yükleme sonrasında main/Pages ve canlı HTML/bundle/model eşliği; R29 henüz yayımlanmadı |
| Q08 | Son kabul açık | Açık R/U/A/F/S maddeleri ve cihaz kabulü tamamlanmalı |

## Bir sonraki uygulama sırası

1. **R28 yüklemesinin tamamlanması ve sürüm doğrulaması (Q07).** Kısmen
   yüklenmiş sürümün görüntülerini R28'in sonucu diye değerlendirmemek gerekir.
   Bu devam paketindeki R29 değişiklikleri R28'in üzerine uygulanır.
2. **R03–R08 / Q03–Q05:** çatı, cephe/teras, bodrum ve bölgeden sabit kadrajlar
   ve hareket örnekleri. R29'daki armatür geçişi ayrıca oda turunda incelenir.
   Görüntüde kalan sorun, ilgili malzeme/ışık/yüzey kaynağına bağlanır.
3. **R07 / F01 / F03 / F04 / F11 / F12:** ışık koşulları karşılaştırılabilir
   hale geldikten sonra önce görünümü en çok etkileyen dış yüzeyler, bahçe,
   iki mutfak ve giriş salonu. Diğer fotoğraf grupları F05–F17 sırasıyla sürer;
   F02 asansör işi A03 ile birlikte ele alınır.
4. **A03/A05/R09:** asansör hareketi, kaynaklı oda m² ve kapsamlı katı/mobilya
   açıklıkları. Ölçü/veri eksikliği tahmini sonuçla kapatılmaz.
5. **S01–S06:** kot/yol/komşu detayları, coğrafi kayıt ve kaynaklı hizmetler.
6. **Q03–Q08:** gerçek cihazdaki son etkileşim/performans/XR ve yayın kabulü.

Görsel veya veri bağımlılığı olan işler açık tutulurken kaynakla
doğrulanabilen kod ve model işleri ilerleyebilir. Bu kayıt, yapılmamış bir
görsel testi geçmiş veya bütün projenin bitmiş olduğu anlamına gelmez.
