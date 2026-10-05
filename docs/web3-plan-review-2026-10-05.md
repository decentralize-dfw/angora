# web3 planı — uygulama öncesi ayrıntılı denetim

İnceleme kaydı: **5 Ekim 2026 21:42:19 · Europe/Paris (UTC+02:00)**. İncelenen uygulama/kaynak commit'i: `7077771a8a048b48d2a00f61c19089f564d708f4`. Plan: [V2 kurgu ve uygulama sözleşmesi](web3-era-plan-2026-10-05.md).

**V1'i olduğu gibi uygulamak doğru olmazdı.** Görsel yönün bir mantığı var; fakat teknik rota, input sahipliği, hız, mobil alan ve medya eşleşmesinde yeni hatalar üretecek boşluklar vardı. V2 bunları açık kararlara çeviriyor. Bu belge web2'ye yeni puan vermez, runtime hatası düzelttiğimizi veya web3'ün 9 aldığını söylemez. `web3.html` henüz uygulanmadı.

Bu denetim mevcut plan/kod/manifest/medya metadata'sına dayanır. Kullanıcının eski kaydı, önceki canlı deneme ve bu kaynak incelemesi üç ayrı kanıttır. Bugün yeniden bir desktop/mobil gezinti yaptığımız veya fiziksel telefon gördüğümüz iddia edilmez.

## Etkili olabilecek taraflar

- ERA'nın ortak mimari odak, yüzey devri ve fotoğraf–caption bağını almak ev anlatısına uyuyor. Her yere aynı maskeyi yapıştırmak gerekmiyor.
- Fotoğrafı yerel seçim, katı teknik rota, menüyü açık navigation olarak ayırmak D28 türü hatayı önlemenin doğru mimari yönü. Mevcut yerel `showPhoto/commitPhoto` mantığı sırf eski kod diye atılmamalı; çevresindeki olay yolu ayrıştırılmalı.
- Modelden aynı kat planına geçmek mekânı anlamayı kolaylaştırır. Aktif bakış yönü, gerçek contour ve fotoğrafı birlikte göstermek dekoratif plan sunumundan daha faydalı.
- Ana galeri seçki olarak kalırken bütün 40 kamera plan üzerinden erişilebilir olabilir. Böylece malzeme kaybolmadan aynı fotoğraflar her bölümde tekrarlanmaz.

Bunların etkisi doğru state, kaynak, crop ve kontrol boyutuna bağlı. Easing eklemek bu dört koşulu tek başına sağlamaz.

## Kaynaktan doğrulanabilen sayılar

Hesap çıktısı: [web3-plan-evidence-2026-10-05.json](web3-plan-evidence-2026-10-05.json). Üretici: [tools/web3-plan-evidence.py](../tools/web3-plan-evidence.py). 28 ilk/son frame–still örneğinin Git verisi ve 7 videonun ffprobe metadata'sı okundu. Bu örnekleme kliplerin ortasındaki bütün karelerin görsel onayı değildir.

| Konu | Kaynak bulgusu | Sonuç / sınır |
|---|---|---|
| Kameralar | Garden 9, Entrance 10, First 13, Attic 8 | 40 doğru eşleştirme; 40 kontrolün test kapsamı. |
| Hero | Kaynak 1280×720, 24 fps, 121 kare, 5.056 sn; türev 41 kare | Dosya MB'si hareket kalitesini veya yeni detay seviyesini kanıtlamaz. |
| Hız başlangıcı | web2 hero parametresi 0.70 sn; iso 0.55 sn | Mevcut parametrenin 3×'ı 0.233/0.183 sn. Kaynağın 3×'ı 1.685/0.478 sn; aynı şey değil. Bunlar ayar/hesap, ölçülmüş gesture gecikmesi değil. |
| Iso master | 2560×1440, 30 fps, 43 kare, 1.433 sn | Desktop türev 1440×810, mobil 800×450, 22 kare; yükseltme ayrıntı üretmez. |
| Hero decoded alt sınır | Desktop 1152×648×41×4 =122,425,344 byte ≈116.8 MiB; mobil ≈36.0 MiB | Tek klip ham RGBA hesabı; gerçek peak/GPU/compressed cache/diğer resimler dahil değil. |
| Plan fit | Garden oda+kamera normalize yüksekliği 0.269; dış contour 0.393 | `roomBounds` dış mimari sınırı temsil etmiyor. Bu, olası crop riskidir; her canlı kırpılmanın kanıtlanmış nedeni değil. |
| Mobil bütçe | Eski %48 plan + %30 foto + varsayımsal 132 px kontrol, H=520'de 537.6 px | Eski öneri bu örnekte 17.6 px taşar. Hesap bir yerleşim örneğidir, canlı ekran ölçümü değil. |
| Harita | 6 grup, 387 nokta; 2400×1600 SVG, kaynak yarıçapı 8/10 px | 320 px genişlikte çap ≈2.13/2.67 px; kaynak boyutu ve ekrandaki boyut ayrılmalı. |
| Wireframe | 224,975 çizgi segmenti; ayrıca 895,515 index'li görünmez depth Mesh | Mevcut viewer literal “hiç Mesh yok” şartına uymuyor. Veri miktarı tek başına fiziksel cihaz performans sonucu değil. |

## Açıklar ve alınan kararlar

**P0:** işlev/çıkış/bağlam teslim engeli. **P1:** ilgili bölümün okunurluk, kadraj, kaynak veya tasarım şartını engeller. Buradaki R numaraları denetim bulgularıdır; D28/M32 gibi kaynak video kesitleri veya yeni puanlar değildir. “Sözleşme netleşti” kodun düzeldiği anlamına gelmez.

| ID / öncelik | V1'deki açık ve etkisi | V2 kararı | Uygulamada kalan kanıt |
|---|---|---|---|
| R01 / P1 · T24–27 | Iso Attic'te bitip plan Attic açılırsa aşağı scroll doğrudan ayrıntıya çıkıyordu; üç plan görünmeyebilirdi. | Model Garden→Attic, aynı kat devri, plan Attic→Garden. T25–27 çift yönlü. Tab teknik imleci değiştirir; normal tur dört planı gösterir. | F13 normal ileri/geri ve her kat tab/mode yolu. |
| R02 / P0 · T28–30/46 | “Yalnız model linki modele götürür” tüm navigation'a uygulanınca gerçek geri rota ve browser Back ile çelişiyordu. | Camera/photo hiçbir şekilde model navigation üretemez. Açık link, tanımlı geri eşik ve history ayrı yetkili olaylar. | F01–03, F14, F18; photo işlemi sırasında section/mode sabit. |
| R03 / P0 · T21–30 | `activeFloor` ve bağımsız `localStep` ayrışabilir; yeni başlıkla eski fotoğraf görünebilir. | Tek technicalCursor; committed/presentation/pending ayrımı, requestId ve tek atomik commit. | Hızlı tab 1→3→2, yükleme sırası ters; son yetkili seçim kazanmalı. |
| R04 / P0 · D28/D34 | Kullanıcının bildirdiği exact click→iso yolu önceki canlı denemede yeniden üretilmedi. Bunu kök neden çözülmüş gibi saymak yanlış. | Click/input/focus/scroll/URL/state olay izi eklenir. Doğru local fonksiyon ile hatalı navigation yolu ayrılır. | Gerçek click ve ayrı focus denemesi; yaklaşık 311 px kaymanın kaynağı ayrıca kanıtlanır. |
| R05 / P0 · T03–05/21–27 | “Bir wheel=bir scroll” hardware farklarını ve cancel edilemeyen event'i dışarıda bırakıyordu. | Gesture kümesi tanımı; deltaMode normalize, Ctrl-wheel/zoom ve yatay input ayrımı; aktif bölgede cancelable/passive sözleşmesi. | Fiziksel wheel ve trackpad; momentum aynı klibi iki kez tüketmemeli. |
| R06 / P0 · T06/20/31/49 | “İlk input'tan önce sabitle” istenen sonuçtu; native yaklaşma, bir miktar kayıp sonra hizalanma mekanizması açıklanmıyordu. | Zaten hizalı sticky alan owner olur. Giriş/çıkış ayrı geometri; sonradan scrollTo ile geri zıplatma yasak. Scrollbar/native restore ayrıca işlenir. | Baraj A/C: tek gesture, Y kaydı ve tam playback. **Anchor algoritması hâlâ prototip gerektirir.** |
| R07 / P0 · T28/39/44 | Touch'u wheel taklidiyle yönetmek; gesture ortasında touch-action değiştirmek ve OrbitControls'un bütün pan'i alması sayfayı kilitleyebilir. | Gesture başlamadan CSS sahipliği; yatay strip/orbit ile düşey sayfa ayrımı, pinch/cancel ve kısa ekran native fallback. | Fiziksel iOS/Android; pointercancel ve iki parmak; viewer'dan düşey çıkış. |
| R08 / P0 · T03–05/21–27 | Busy sırasında ters yön ve yeni tab için “bir kuyruk” kuralı tek başına yeterli değildi. Momentum yeni niyet sanılabilir. | Artık momentum atılır. Açık tab/nav eski request'i iptal eder. Yeni ters gesture güvenli duruş ardından tek ters adım. | Kaç intent/commit olduğunun izi; eski callback yeni durumu geri alamamalı. |
| R09 / P1 · T03–05/21–23 | V1'in 3× hesabı kaynak süresine dayanıyordu. web2'nin mevcut ritmine göre daha yavaş bir sonuca götürebilirdi. | Literal 3× mevcut parametre 0.233/0.183 sn prototip hedefi; alternatif kaynak hesabı ayrı etiketli. Tek build timing manifesti. | 60 Hz'de yaklaşık 14/11 yenilemede hareket anlaşılıyor mu? Gerçek karşılaştırma; sessiz 1.685 sn'ye dönüş veya 9 iddiası yok. |
| R10 / P1 · T03–05/21–23 | 41 hero frame'i V1'in 1.685 sn'sine yaymak yaklaşık 24.3 farklı kare/sn verir. Dosya büyütmek akıcılığı çözmez. | Native master'dan hedef süre/fps türevi veya final hızda yeniden kayıt; resampling yeni ayrıntı diye sunulmaz. | Frame cadence, gerçek görüntü kalitesi ve focal point; gerektiğinde yeniden source kayıt. |
| R11 / P1 · T49 | Ön/arka klipleri tüm karelerle decode etmek, sıkıştırılmış MB küçükken bile belleği büyütebilir. | Bir ana oynatıcı + sınırlı next hazırlık. Bounded bitmap alternatif; eski decode/observer/cache cleanup. | Gerçek peak ve iki ileri/geri tur sonrası kalıcı bellek. Ham hesabı performans ölçümü diye sunmama. |
| R12 / P1 · T01–06/21–24 | İlk frame hazır, play başladı, son frame poster'e eşleşti varsayımları siyah ara kare/renk/zoom atlamasını saklıyordu. | play promise ve ilk sunulmuş frame; aynı encode poster, aynı crop/renk/extent. Reverse ayrı encode; stall/ret güvenli poster. | Tam oynatım, cold media, background/return. Player seçimi video prototipi başarılı olmadan kesin değil. |
| R13 / P1 · T25–30/48 | %48 plan/%30 fotoğraf tab/seçici/caption alanını garanti etmiyordu. 2×2 tab kısa ekranda daha da taşar. | Controls-first ölçülen alan bütçesi; başlangıç 240/120 alt sınır; kısa/zoom ekran native düzen, landscape iki kolon. | 320×568 gerçek font/safe-area ile; yalnız matematik “sığıyor” onayı değil. |
| R14 / P1 · M32/T28 | Küçük numara tek başına 13 koni, oda adı ve büyük görünmez hit hedefleri çakışmasını çözmez. | Gerçek ankraj, pasif yön izi, yalnız aktif dolu koni; yakın seçimler açık chooser. Lens bilgisi yoksa çizilen koni fiziksel FOV değildir. | 13 kameranın hepsi seçilebilir, yanlış komşu seçilmez, duvar/oda okunur. |
| R15 / P1 · T24–28 | Oda+kamera bounds dış duvarı atlayabilir; model resim altlığı ile SVG ayrı crop edilirse pin yanlış yerde görünür. Poses'da revision yok. | Mimari bounds + ortak metre/UV transform; source/render/DXF revision manifesti ve landmark kontrolü. | Her katta en az üç mimari landmark; bütün 40 gerçek fotoğraf/bakış eşleştirmesi. |
| R16 / P1 · T06/20–24 | Parent/video çift scale, rota ortası geniş bounds veya kaynağa gömülü platform fit denklemini bozabilir. | Rota union extent'i, tek birleşik transform; gömülü source hatası export'ta çözülür. Kaynakta kesik ev CSS ile tamamlanmış sayılmaz. | İlk/orta/son ve reverse; bir frame cover, sonra contain sıçraması yok. |
| R17 / P1 · T03–05/35–36/42 | Dosya adı/“owner verdi” ifadesi gerçek çekim, doğru cephe, kullanıcı onayı ve camera eşleşmesi yerine kullanılıyordu. | hash/sourceKind/orientation/role/variant manifesti; tool kaynak adı ile gerçek fotoğraf ayrılır. İkinci Angora görseli onaylı ilan edilmez. | Gerçek source ve crop tek tek gözle kontrol. Aynı basename mekânın aynı olduğunu tek başına kanıtlamaz. |
| R18 / P0 · T29–30/41/47 | Modal origin'i değişebilir; menu/photo aynı boolean kilidi açabilir; geç image callback'i kapanmış overlay'a yazabilir. | Immutable origin, tek lock controller, overlay priority, idempotent close/focus restore. | Modal/menü yarışları, hızlı close+nav, yüklenmeyen fotoğraf; alttaki sahne ilerlememeli. |
| R19 / P1 · T46/48 | History kayıt sahipliği, direkt link, invalid id, BFCache ve modal Back belirli değildi. | Açık navigation push, scroll step replace; popstate restore; yalnız kendi modal history kaydını kapatır. | Reload/Back/Forward ve deep-linked modal close; yeni loop veya dış siteye dönüş olmamalı. |
| R20 / P1 · T39–41 | Filter rayın uzunluğunu değiştirirken hem ham Y hem aynı fotoğrafı koruma sözü tutarsız olabilir. 0/1 sonuç da belirsizdi. | Semantik photoId+progress anchor; bir geometry refresh ve yalnız gereken layout telafisi. Modalda koleksiyon sabit. | 0/1/N ve current dahil/hariç; arrow, caption, scroll progress aynı duruma bağlı. |
| R21 / P1 · T47 | Header yalnız scrollY'den hız okursa pinned sahnede görünmez; gizlenmiş nav tab hedefi/menü son linki dışarıda kalabilir. | Gerçek input + yön/hız hysteresis; focus-within/açık drawer önceliği; kompakt menu ve kendi scroll alanı. | Sabit video sırasında hızlı input; 320 px/short/200% zoom ve tam keyboard turu. |
| R22 / P1 · T34 | Kaynak noktayı 2× yapmak, küçülen map'te okunur olmasıyla aynı değil. 387 anonim nokta 320 px'te ayrı kalamaz. | Desktop/portrait export, gerçek CSS çapı karşılaştırması; ev/sınır/ok önceliği. Tüm gruplar açık, ad listesi yok, HTML legend/attribution. | Yoğunluk ve renk ayrımı; yakın koordinatlar yerinden itilmeden gerçek görünüm. “Her nokta ayrık” vaadi yok. |
| R23 / P1 · T44 | Mevcut viewer görünmez depth Mesh kullanıyor; yüzey görünmese de “hiç Mesh” şartını ihlal eder. | Scene yalnız LineSegments. Hidden-edge temizliği aynı kalır varsayımı kaldırılır. | Mesh inspection + yüzeysiz görünüm: arkadaki edge'ler ince beyaz çizgide anlaşılır mı? |
| R24 / P1 · T44 | 225 bin segment, otomatik orbit, sürekli visible rAF ve geniş context fit'i evin okunurluk/performance sorununu yaratabilir. | AutoRotate kapalı, idle render durur; primary house fit/context ayrımı, DPR ve cleanup, context-loss poster fallback. | Her azimuth/viewport, cihaz ölçümü ve %10 gradient; ev merkezde, yaklaşım ölçeği tutarlı. |
| R25 / P1 · T01–49 | Premium font/palet seçimi, gerçek kontrast/descender kesimi/OS font artışı/font-load kaymasını garanti etmiyor. | Ölçülen kontrast çiftleri, teknik yazıda Manrope, font rezervi ve native büyüyen açıklama düzeni. | D07; gerçek opacity/arka plan, 200% zoom ve son font. Tiny serif veya kesilmiş satırla “fit” yok. |
| R26 / P1 · T42–45 | Viewing/purchase/form eylemi belirsiz; WhatsApp taslağı booking gibi sunulabilir, eski fiyat güncel gösterilebilir. | Listing kaynak/kontrol tarihi; viewing talebi, listing, 3D, purchase enquiry ayrı hedef. Taslak olduğu açık; form keyboard/native alanı. | URL/para birimi/kaynak, validation ve popup fallback. Otomatik mesaj gönderilmez. |
| R27 / P0 · T49 | Motion/import/input/WebGL başarısızsa görünür içerik ve unlock için bağımsız baseline belirtilmemişti. | Önce semantic HTML/native links; hazır motor motion'u ekler. Başarısız enhancement sayfayı gizli veya kilitli bırakmaz. | JS/vendor/WebGL/decompress/decode hataları; güvenli çıkış ve temel içerik. |
| R28 / P1 · tümü | Görsel beş checkpoint, source regex veya mobil emülasyonu tam interaction/fiziksel phone onayı sayılabilirdi. | 25 davranış +11 tasarım kontrolü; playback bütünü, olay izi, hardware kanıtı ve doğrulanmadı durumu ayrı. | Uygulama commit'ine bağlı test kanıtı; P0/P1 ortalamaya sokulmaz, yeni skorlar gerekçeli olur. |
| R29 / P1 · T01–49 | 49 işlem “49 gösterişli efekt” sanılırsa kurgu aşırı uzar, ev yerine geçiş gösterisine dönüşür. | 49 numara kontrol/eşik/ters/hata sözleşmelerini de içerir. Ana yüzey devri az; yerel seçim kısa, editorial bölümler native; pause bilgi için. | Tam turda tekrar, bekleme ve gesture maliyeti değerlendirilir. Kütüphaneyi doldurmak için alakasız efekt eklenmez. |
| R30 / P0 · T03–06/20–31/39/47 | Global smooth-scroll motoru, native scroll, pin ve discrete gate birlikte sayfa konumunu yönetirse kilit/Y sıçraması geri gelebilir. Transform'lu global wrapper sticky/header ölçümünü de etkiler. | Global scroll native; tek owner. GSAP yalnız sahne transform/reveal; gallery tek native progress kaynağı. Sticky ölçüm parent'ı ve overlay/header hareketli global wrapper dışında. | Baraj A/C ve yatay galeri giriş/çıkışı; hiçbir yarışan scrollTo/smoothing sahibi kalmamalı. |

## Uygulamadan önce üç gerçek baraj

1. **Bağlam ve input omurgası.** En yoğun First plan dahil 40 kamera; photo→modal→close; hızlı tab/nav; aynı kat iso/plan; native/sticky giriş çıkışı. D28 root cause kaydı. Yanlış bölüm, kayıp kat veya çıkılamayan lock varsa görsel cilaya geçilmez.
2. **Gerçek mobil bilgi alanı.** 320×568, landscape, büyük metin; duvar/oda/aktif bakış/fotoğraf ve seçici birlikte. Kontroller sığmadığında native fallback'in de kaliteli olması gerekir. “Desktop'u küçülttüm” çözüm sayılmaz.
3. **Oynatıcı, hız ve T06 kadrajı.** Üç kamera ve üç iso, literal 3× hedef, beklemeyen input, finalde duruş, reverse, cold/stall; ev/pencere birlikte küçülme. Native video ve sınırlı bitmap adayından ilk-frame/son-frame/bellek/fiziksel cihaz kanıtıyla seçim.

Harita ve yüzeysiz wireframe kendi bölümlerine girmeden ek prototip ister. Özellikle 387 noktanın küçük ekranda sınıf ayrımı ve depth mesh kalkınca çizgi yoğunluğu, MD yazısıyla görsel olarak çözülmüş sayılamaz.

## Tarayıcı davranışı için dayanak

Wheel event ile sayfa scroll'u aynı olay değildir; cancelability ve input türü ayrı ele alınmalıdır. [MDN wheel event](https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event), [WheelEvent/deltaMode](https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent).

Native touch gesture sahipliği `touch-action` ve atalarından etkilenir; aynı gesture başladıktan sonra değişiklik yeni sahiplik sağlamaz. [MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action).

`play()` tamamlanmış bir başlangıç varsayımı değildir; promise reddedilebilir/gecikebilir. Fiziksel telefonda başarı yine ayrıca görülmelidir. [MDN play](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play).

Modalda arka içeriğin etkileşim dışı tutulması, focus'un modalda kalması ve kapatınca anlamlı iadesi gerekir. [W3C modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## Hazırlık durumu

**Kurgu ve kararlar:** V2'de çelişen maddeler yerinde düzeltildi; karşıt eski sözleşme ayrıca bırakılmadı. 109 kaynak kesit, 17 dar “Koru” ve 49 ERA sahnesinin izi korunur. Kaynak puanları bu denetimde değiştirilmedi.

**Hâlâ açık:** D28'in exact input yolu; gesture owner/anchor algoritmasının fiziksel başarısı; 0.233/0.183 sn'de hareket okunurluğu; player seçimi; 320 px plan/harita yoğunluğu; source revision/crop eşleştirmeleri; yüzeysiz wireframe görünümü ve cihaz bütçeleri. Bunlar gelecekte gerçek prototip/test üretir. “9 hedefi” diye üzerleri kapatılamaz.

Bu vizyon etkili olabilir; ancak bu barajlar geçmeden “uygulanınca kesin 9 olacak” demek için kanıt yok. Planın düzeltilmiş olması ile uygulamanın başarılı olması ayrı sonuçlardır.

## Bu turda yapılan doğrulama

İzlenebilirlik üreticisi 109 Angora kesiti, 17 dar “Koru” ve 49 ERA sahnesini tekrar doğruladı; skor değiştirmedi. Belgelerde T01–49, F01–25, D01–11 ve R01–30'un birer kez ve sıralı bulunması, yerel dosya linkleri, kaynak işaretleri ve UTF-8 kontrol edildi. Medya kanıtı 28 örnek/7 video/40 kamera içeriyor. `git diff --check` geçti. Bunlar belge/veri kontrolleridir; yeni runtime, visual veya fiziksel cihaz testinin geçtiği anlamına gelmez.
