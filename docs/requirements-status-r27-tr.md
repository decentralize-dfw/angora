# Angora 21 — talep ve durum denetimi, 9 Eylül 2026

Proje, talep edilen son görsel kalite ve gerçek cihaz doğrulaması bakımından
tamamlanmış değildir. Bu döküm erişilebilen geçmiş mesajlar, güncel kaynak kodu,
R24–R27 raporları ve oda inceleme kaydına dayanır. İki sohbetin tam metni
erişilebilir olmadığından, geçmişteki her talebi eksiksiz kapsadığı iddia edilmez.
Bir özelliğin kodda bulunması, fotoğrafla veya gerçek cihazda kabulünün
tamamlandığı anlamına gelmez.

R27 düzeltmeleri hazırlanmış ve 22 otomatik kontrolden geçmiştir; henüz canlı
siteye aktarılmamıştır. Otomatik onay denetimi, geometri düzeltme dosyasının
herkese açık GitHub deposuna aktarımı için doğrulanabilir kullanıcı izni
bulamadığını söyleyerek işlemi iki kez reddetti. Kaynakların zaten aynı depoda
açık olduğu doğrulandıktan sonraki ikinci değerlendirme de reddedildi. Canlı
sürüm R26 olarak kaldı; aktarım başka yoldan denenmedi.

| Talep / iş | Durum | Kanıt ve kalan iş |
|---|---|---|
| Aynı GitHub deposunda ve main üzerinde çalışma | Tamamlandı | Mevcut depo ve site korunuyor; doğrudan main yayını için kullanıcı izni kayıtlı. |
| Kaynak CAD, katlar ve ayrı model katmanları | Uygulandı | Bağlı Blender modeli, mimari/donatı/mobilya/peyzaj ayrımı ve GLB çıktıları mevcut. Fotoğraf doğruluğunun tamamlandığı anlamına gelmez. |
| Bodrum, giriş, 1. kat ve çatı kesitleri | Uygulandı ve geometri kontrolü geçti | Alt katları kaldırmadan üst kesit; gerçek duvar kesit dolguları; çatı kesiti 1,30 m. |
| Merdiveni ve galeriyi örten yanlış yüzeyler | Tamamlandı | Giriş döşemesinde 7,15 m² açıklık, galeri görüş ve katlar arası rota kontrolleri geçti. |
| Çatıda asansör olmaması | Tamamlandı | Çatı asansörü kaldırıldı; yalnızca bodrum, giriş ve 1. kat hizmet kapsamındadır. |
| Asansörün tüm fotoğraf ayrıntıları ve hareketi | Başlandı, eksik | Kabin ve duraklar var; kapı/kabin oranları, üç durakta kapı hareketi ve hol bağlantısı son kontrolde açık. |
| Sabit yükseklikte döndürme, kaydırma ve yakınlaştırma | Uygulandı, otomatik kontrol geçti | Tek/iki parmak davranışı ve perspektif yakınlaştırmada yükseklik korunuyor. Gerçek iPhone testi eksik. |
| Plan–izometrik geçiş, merkezleme, oda/mobilya/ölçü kontrolleri | Uygulandı | Animasyonlu kamera, etiketler, aç/kapat kontrolleri mevcut. Son mobil yerleşim ve okunabilirlik kabulü eksik. |
| Oda içi 360° ve dolaşma | Uygulandı, rota kontrolleri geçti | Model tabanlı oda konumları, kapı/duvar/mobilya engelleri ve merdiven rotaları mevcut. Gerçek cihaz deneyimi doğrulanmadı. |
| Fiziksel WebXR | Uygulama tarafında başlandı; cihaz testi yapılmadı | Başlıkla gerçek doğrulama kaydı yok. |
| Kaynak plan ölçüleri | Uygulandı | 35 doğrulanmış ölçü aralığı mevcut. Bunlar oda alanı hesabı değildir. |
| Kat, bahçe ve havuz alan bilgisi | Kısmen tamamlandı | Kat kaplama izdüşümleri ve tahmini arazi/su yüzeyleri gösteriliyor. Net/tapu alanı değildir; havuzun 8×4 m kabulü ölçülmüş veri değildir. |
| Her odanın doğru m² değeri | Başlandı, eksik | Kaynak kaplama bileşenleri bazı odaları birleştiriyor. Güvenilir oda sınırı ayrımı tamamlanmadı; bireysel oda alanları yayımlanmadı. |
| Ön–arka bahçe kotları ve teraslar | Geometri düzeltmesi tamamlandı | Dört teras ve geçiş yüzeyleri uygulanıp denetlendi. Yan kırık hatları ve görünmeyen kotlar ölçme doğruluğunda kabul edilmedi. |
| Yolun binalardan geçmemesi, yol/zemin ilişkisi | Düzeltildi; tüm saha doğrulaması eksik | Bilinen bina kesişmeleri kaldırıldı. Tüm yol genişlikleri ve topografya için fotoğraf/ek kot doğrulaması açık. |
| Komşu villalar, parseller ve bölge ölçeği | Başlandı, eksik | CAD tabanlı çevre ve 42 yapı mevcut; R27 kadraj, kaynak etiketleri, arazi sınırı ve ağaç taçlarını iyileştiriyor. Komşu bahçe/çit/istinat ve cephe ayrıntıları bitmedi. |
| Bölgede 3–4 kategoride gerçek hizmet noktaları ve yakınlık bilgisi | Uygulama başlamadı | Veri araştırması/izin süreci yapıldı; koordinatlı hizmet verisi, kategori filtresi ve yakınlık arayüzü yok. |
| Hareket sırasında pikselleşme / aşırı keskinlik | Düzeltme uygulandı; gerçek cihaz kabulü eksik | R27 sabit çözünürlük, MSAA/SMAA, daha iyi derinlik hassasiyeti, sakin normal haritaları ve tarama filtresi getiriyor. iPhone hareketi/FPS ölçülmedi. |
| Üst üste binen yüzeyler | Tespit edilen kaplama çakışmaları temizlendi | 158 kaynak nesne için 224 çakışan nesne çifti, tanımlı toleranslarda sıfıra indi. 1,75 milyon kapsama noktası geçti. Her tür katı kesişimi için evrensel sıfır çakışma iddiası yok. |
| HDRI, güneş, gölgeler ve iç ışıklar | Başlandı, son görsel kabul eksik | Saat/mevsim ve iç armatürler mevcut; R27 HDR parlak nokta, ışık dengesi, AO ve malzeme tepkisini düzeltir. Tarayıcı GPU görüntüsüyle doğrulanmadı. |
| Mobil dosya/çizim optimizasyonu | Uygulandı ve veri kontrolleri geçti | Bölge 11,7 MB → 3,0 MB; tüm canlı modeller 38,1 MB; 15 çevre malzeme grubu. Gerçek telefon performans ölçümü hâlâ yok. |
| Tüm odaların fotoğrafa sadık modellenmesi | Başlandı, tamamlanmadı | 184 benzersiz fotoğraf ve 17 inceleme grubu kayıtlı; son fotoğraf kabulü kapanan grup yok. Ayrıntılar aşağıdadır. |
| Son kaliteyle yayına hazır UI ve bütün proje | Tamamlanmadı | Mevcut site çalışması ve otomatik kontroller var; görsel/fotoğraf/gerçek cihaz kabulü açık. |

## Mekân bazında açık işler

| Mekân grubu | Kalan iş |
|---|---|
| Cepheler ve mahalle | Panjur konumları, kiremit tonu, cephe ışığı; komşu çit/istinat/bitki ayrıntıları; yol genişlikleri ve topografya doğrulaması. |
| Asansör | Fotoğraf oranları; kapı hareketi ve üç duraktaki hol bağlantıları. |
| Bahçe ve havuz | Bitkiler, çitler, taş derzleri; su ve döşeme renkleri; kesin havuz ölçüsü. |
| Bodrum mutfak | Yeşil cam ve raflar; ahşap çerçeve, buzdolabı, kulplar; ışık ve renk. |
| Bodrum salon | Güncel modelin oda fotoğraflarıyla karşılaştırılması. |
| Bodrum WC | Dekorasyon, raf içeriği, armatürler ve kapı açılımı. |
| Garaj | Özel inceleme kadrajı; iç donatı, tesisat, zemin ve kapı mekanizması. |
| Giriş ve hol | Giriş mobilyaları, hol ayrıntıları, kapı ve oda geçişleri. Merdiven açıklığı düzeltildi. |
| Giriş WC | Fotoğrafa özgü lavabo, ayna, klozet ve malzemeler. |
| Ön giriş ve yaklaşım | Taş deseni, bahçe kapıları, bitki yerleşimi. |
| Giriş katı mutfak | Dolap/tezgâh ve cihaz ayrıntıları işlendi; seramik/ahşap rengi, panjur, tavan/avize, vitrin/vitray ve küçük kumanda işaretleri açık. |
| Giriş katı salon | Avize, perde/kumaş, parke, dekorasyon, vitrin ve mobilya eşlemesi; geçiş ve kot basamağı yakın kontrolü. |
| Ortak banyo | Güncel modelin fotoğrafla karşılaştırılması. |
| Yatak katı holü | Bazı galeri/korkuluk ve berjer düzeltmeleri yapıldı; diğer korkuluklar, sarkıt, ahşap tavan, dolap profilleri ve kapılar açık. |
| Ebeveyn odası, banyo, giyinme | Fotoğrafların üç hacme ayrılması ve her hacmin ayrı kontrolü. Bazı mobilya çakışmaları düzeltildi. |
| Diğer yatak odaları | Fotoğrafların tek tek odalara eşlenmesi, oda bazlı kadraj ve son kontrol. |
| Çatı hacimleri | Asansör kaldırıldı, yerleşim/başlık gibi düzeltmeler yapıldı; kumaş/profil eşlemesi, banyo, güney oda ve çatı yakın kontrolü açık. |

## Henüz yapılmamış olanı, eksik olandan ayırma

Kesin olarak uygulanmamış: hizmet noktaları veri/arayüzü, gerçek iPhone hareket
ve performans testi, fiziksel XR testi. Oda alanları üzerinde çalışma var;
"hiç başlanmadı" sınıfına girmez. Temel mekân modelleri bulunduğundan açık
fotoğraf incelemesi, o mekânın hiç modellenmediği anlamına gelmez. Erişilemeyen
sohbetlerdeki başka talepler için durum uydurulmamıştır.

Kaynaklar: `docs/r26-resumed-delivery.md`, `build/review-r24.json`,
`build/review-r25.json`, `build/review-r26.json`,
`build/room-review-register.json`, `build/area-info-qa.json`,
`docs/r27-render-and-surface-repair.md` ve güncel viewer kaynakları.
