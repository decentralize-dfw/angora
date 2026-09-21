# Angora 21 — MERGVS villa

19 Eylül 2026 model teslimi: güncel web paketi [`build/web/native-current/`](build/web/native-current/), düzenlenebilir bake/malzeme sahnesi [`build/blender/angora-material-lighting.blend`](build/blender/angora-material-lighting.blend) (Git LFS). Bu sürüm sahibinin `MERGERS - Copy.blend` geometrisini korur; kat bazlı yükleme, 2K/4K AO, dolaylı gün ışığı ve önceden hazırlanmış kesit katmanları içerir. [Teslim ve açık doğrulamalar](NATIVE-DELIVERY.md). Aşağıdaki R44 ve önceki kaynak notları tarihsel teslimlere aittir.

Güncel düzenlenebilir Blender sahnesi: [`build/blender/angora-rooms-open-doors.blend`](build/blender/angora-rooms-open-doors.blend) (Blender 5.2.1, Git LFS). Klonladıktan sonra `git lfs pull` çalıştırın; GitHub ZIP indirmesindeki LFS işaretçisi modelin kendisi değildir. İç mekân, açık kapılar ve arka bahçe düzeltmeleri bu dosyadadır. Eski `angora21-working.blend` katmanlı sahnesi önceki sürümdür.

Bu native kayıt henüz web GLB ve yürüyüş verilerine aktarılmadı. [Bahçe kontrolü ve kalan işler](build/qa/garden-native/GARDEN-PASS-TR.md), [iç mekân kontrolü](build/qa/rooms-native/INTERIOR-FINAL-QA.json). Ön giriş hattı, çevre yolları ve web doğrulaması sürüyor.

Kaynak: `ANGORA-.dwg` ve bu depodaki oda / drone fotoğrafları. Hedef, master plandaki **21 numaralı bina**; bu numara tapu ada/parsel numarası değildir.

## 3D inceleme arayüzü

[Angora 21 — çevre, bina ve kat görünümü](https://xrweb.studio/angora/)

GitHub Pages doğrudan `main` dalındaki kök `index.html` dosyasını yayınlar.
Arayüz kaynağını değiştirdikten sonra `viewer/` içinde `npm ci` ve
`npm run build:pages` çalıştırılır; kök `index.html` ve `web-assets/` çıktıları
aynı commit ile kaydedilir. Model ve Draco dosyaları mevcut repo yollarından
yüklenir. Model güncellemelerinde HTML'yi yeniden üretmek gerekmez.

Çevre, bina/bahçe, bodrum, giriş, birinci ve çatı katı seçilebilir. Katlar kendi
döşeme kotundan **+1,60 m** kesilir. Sabit yükseklikte döndürme, yatay kaydırma,
yakınlaştırma ve ortalama vardır. Tek parmak döndürür; iki parmak kaydırır ve
yakınlaştırır. `Kaydır` düğmesi tek parmakla kaydırmayı da açar.
`Mobilya` düğmesi ayrı mobilya katmanını bütün görünüm ve katlarda açıp kapatır;
kat değiştirmek bu tercihi sıfırlamaz.

R22: `İçeride gez` tam modeli göz hizasında açar. Masaüstünde W/A/S/D veya ok
tuşlarıyla yürünür, sürükleyerek etrafa bakılır. Telefonda aynı hareket için
ekrandaki yön düğmeleri vardır. `Odaya git` dört katta 27 başlangıç noktasına
ulaşır; `Kat planına dön` kesit görünümünü geri getirir. Başlangıç noktaları
kaynak döşeme, mobilya ve baş mesafesine göre seçilir. 12 cm yürüyüş ızgarası
gerçek merdiven basamaklarını korur; duvar, kapalı kapı/cam ve galeri boşluğu
geçilemez. Gizlenen mobilya yalnız kendi hareket engelini kaldırır. Referansta
kapalı duran kapılar bu sürümde açılmaz; ilgili odaya oda seçicisinden girilir.
`build/web/full/navigation.json` kaynak hashlerini, yüzeyleri ve ışıkları taşır.

HTTPS üzerinde `immersive-vr` destekleyen cihazlarda `VR’a gir` görünür.
Sol kumanda çubuğu yürütür; tetik, desteklenen döşemeye ışınlanır. VR normal
PBR/gölge yolunu kullanır; ekran uzayı GTAO iki göze uygulanmaz. Gerçek başlık
ve telefon testi tamamlanmadı; bu destek cihaz üzerinde doğrulama bekler.

R21: `Oda adları` ve `Ölçüler` düğmeleri seçilen katın bilgilerini zemine
yerleştirir. 27 mahal etiketi vardır. Ölçüler, orijinal DWG DIMENSION kaydı,
eşleşen karşılıklı duvar yüzeyleri ve kesintisiz kaynak döşemesi birlikte
doğrulanarak seçilir. Havuz ve komşu bina tahminleri ölçüye dahil edilmez.
`build/web/full/rooms.json` her ölçünün kaynak handle'ını ve uç noktalarını,
`build/room-annotation-qa.json` oda başına kontrolü içerir. Açık plan alanındaki
çizgi, gösterilen duvarlar arasındaki mesafedir; mahal alanı veya bağımsız oda
boyutu iddiası değildir.

Web ışığında depodaki lisanslı HDR günışığı, gerçek yumuşak güneş gölgeleri,
GTAO temas gölgelenmesi ve anizotropik doku süzme kullanılır. HDR yüklenemezse
atmosferik günışığı kalır. İçeride seçilen odanın yakınındaki iki kaynak armatür
gölge üretir. HDR ve armatür güçleri fotoğraf çekim anının ölçülmüş ışığı değildir;
renk/pozlama eşlemesi ve nihai iç mekân ışık bake'i hâlâ açık iştir.
Gölge haritası yalnız sahne/kesit değişiminde güncellenir. GTAO telefonda yarım
çözünürlüktedir ve mahalle görünümünde kapalıdır; komşulara villa kesiti uygulanmaz.
Tam model dışa aktarımı bevel ve weighted normal sonuçlarını korur. Bu düzeltme
webdeki gereksiz yüzey kırıklığını giderir; fotoğraf eşlemesinin tamamlandığı
anlamına gelmez. Gerçek telefon ve tarayıcı GPU görsel doğrulaması hâlâ açıktır.

Kaynak kod `viewer/`, güncel kesilmemiş web modelleri `build/web/full/` altındadır.
Dört kat, dış ayrıntılar, bahçe ve mahalle bir kez yüklenir. Kat değiştirmek
yeniden model indirmez; tek üst kesit düzlemi 1,05 saniyede hareket eder.
Alt kesit düzlemi yoktur: alt katlar, merdiven ve mevcut galeri boşluğu korunur.
Bina ve bodrum kadrajları bahçeyi içerir. Katlar arasında kamera konumu korunur;
`Ortala` seçilen kata yeniden kadraj yapar. Karşılıklı kaynak duvar yüzeylerinden
dolu ve taramalı kesit geometrisi üretilir; oda ve galeri boşlukları doldurulmaz.
Dört katın +1,60 m kesiti tam kotundadır. Geçiş sırasında düzlem sürekli hareket
eder; kesit profili 8 cm aralıklı ön hesaplanmış dilimlerden seçilir. Dolgu,
kaynak CAD yüzeylerinin tutarsız yönlerine veya kameranın bakışına bağlı değildir.
`build/wall-section-qa.json` geometri ve boşluk kontrollerini kaydeder.

Sayfa kendi yayımlandığı repo sürümünün model listesini kullanır. R44 ile dört
kat ve dış kabuk tek `villa.glb` içinde birleştirildi: üç parça (villa, bahçe,
mahalle) toplam yaklaşık 27,1 MB, kesit geometrisi ayrıca 1,1 MB; aynı anda en
fazla iki dosya çözülür ve durgun sahne sürekli yeniden çizilmez. Gerçek OrbitControls ile dokunma olayları ve sabit
kamera yüksekliği, gerçek GLB dosyalarının hash ve tam yükseklik sınırları
kontrol edildi. Gerçek kesit geometrisi ışın testleri ve Blender görüntüsüyle
denetlendi. Bulut tarayıcısında WebGL kapalı olduğu için web shader'ının görsel
testi ve gerçek telefon performansı henüz doğrulanmadı.

8 Eylül düzeltmesi: kullanıcı teyidiyle asansör yalnız bodrum, giriş ve birinci
katı hizmet eder. Çatıdaki 31 asansör parçası kaldırıldı; yalnız eski asansör
açıklığı döşeme ve parke ile kapatıldı. Merdiven açıklığı değiştirilmedi.
`build/attic-lift-correction.json` ve `build/renders/web-floor-3.png` kontrol kaydıdır.

Galeri kontrolünde, `KAT 2$DUVAR KAPLAMA` yüzeyinin 6,291 m kotunda kaynak
açıklığın üzerini yanlışlıkla kapattığı görüldü. Yalnız bu yatay kaplama
kaynak döşeme sınırlarından temizlendi; döşemeler ve merdivenler değiştirilmedi.
`build/gallery-visibility-qa.json`, galeriden giriş döşemesine ve aşağı inen
merdivene dört ayrı görüş ışınının ulaştığını doğrular.

R20'de galeriye fotoğraftaki siyah ferforje, pirinç renkli küçük bağlantılar
ve profilli ahşap küpeşte eklendi. Döşeme kenarındaki iki yatay kol, kısa dönüş
ve aşağı inen merdivene paralel eğimli kol gerçek döşeme/basamak temaslarına
yerleşir. Demir, ahşap ve metal ayrıntılar üç ayrı mesh olarak sabit donatı
katmanındadır; açıklığa döşeme veya duvar eklenmedi. Korkuluk dahil edilerek
tekrarlanan görüş testleri, galeri ve alt merdivenin açık kaldığını doğrular.
Motif oranları ve yükseklik fotoğraftan yorumdur. Diğer merdiven kolları,
galeri sarkıtı ve ahşap tavan hâlâ ayrı kontrol gerektirir.
`build/gallery-railing-report.json` kaynakları ve yerleşimi;
`build/renders/full-scene-gallery.png` web geometrisinin yakın görünümünü kaydeder.

R22 mobilya kontrolü: 467 ayrı mesh parçası, 50 eşya grubu halinde duvar ve
bağımsız eşyalara karşı tarandı. Giyinme dolabı ve güneybatı gardırop geri
çekildi; yatak örtüsünün komodine girmesi giderildi. Genel hol kanepesi,
fotoğraflardaki iki berjer, sehpa ve aynalı dolapla değiştirildi. Çatı koltuğu
ve TV konsolu yeniden yerleştirildi; fotoğrafta bulunmayan komodinler kaldırılıp
ayaklı fan ve ayna eklendi. Eğimli tavana giren başlık alçaltıldı ve koyu gövde/
açık çerçeve düzenine getirildi. Bunlar fotoğraftan yorumlanan modellerdir.

`build/furniture-collision-report.json` her parçayı ve grubunu listeler; mevcut
denetim toleranslarında duvar/eşya kesişmesi kalmadı. `build/furniture-headroom-report.json`
kaynak tavan/çatı üçgenleriyle ayrı BVH denetiminin temiz olduğunu kaydeder.
`build/furniture-opening-report.json` mevcut kapalı kapı ve cam düzlemlerine
karşı ek kontrolü içerir.
Duvar denetimi 8 cm yükseklik dilimleri, 8 mm pay ve 1,5 cm² alan eşiği kullanır;
aynı eşyanın kasıtlı birleşen parçaları kendi grubunda tutulur. Bu denetim
dinamik kapı açılımı veya bütün yüzeylerin fotoğraf eşleme onayı değildir.
Gerçek güncel GLB'lerden alınan `build/renders/full-scene-walk-hall-r22.png`
ve `full-scene-walk-attic-r22.png` Cycles iç mekân kontrolleridir; web ekran
görüntüsü veya nihai kalite onayı olarak sunulmaz.

Mobilya değişiminden sonra ana sahnede `tools/inspect_review_geometry.py` ve
`tools/check_furniture_headroom.py`, normal Python'da
`tools/audit_furniture_geometry.py` çalıştırılır. Tam web modelini dışa aktardıktan
sonra `tools/build_walk_navigation.py`, ardından `tools/sync_web_viewer.py`
çalıştırılır. Hareket verisi güncel mimari, sabit donatı ve mobilya hashleriyle
eşleşmek zorundadır; eski dolap yerleşimine ait hareket verisi kabul edilmez.

R23 mutfak kontrolü: giriş mutfağındaki ocak üstü kapaklar ahşap yapıldı;
pencere yanlarında dar mat camlı çift kapaklar, dış açık raflar, yuvarlak
kesitli kulplar ve ahşap jaluzi eklendi. 261 ahşap parçanın UV damar yönü
kapak/çerçeve doğrultusuna göre düzeltildi. Kapak birleşimlerinde aynı düzlemde
üst üste duran yüzeyler ayrıldı. Dolaplar kaynak duvar çıkıntılarına göre
yerleştirildi; tezgâhların arkası bu çıkıntılara göre oyuldu. Vitrin, mutfağın
kendi nişine sığacak şekilde düzeltildi. CAD mimarisi ve ayrı mobilya katmanı
bu revizyonda değişmedi; dolap imalat ölçüleri fotoğraftan yorumdur.

`build/kitchen-photo-r23-qa.json`, görünür 349 mutfak parçasının kaynak duvar
kesitleri ve 467 hareketli mobilya parçasıyla kontrolünü içerir; mevcut
toleranslarda kesişme yoktur. `build/kitchen-surfaces-r23-qa.json`, kaynak
kapı/cam/tavan yüzeyleriyle ayrı üçgen BVH kontrolüdür. PBR paketinde artık
78 malzemenin 390 PNG haritası bulunur; mat cam ayrı bir malzemedir.
`build/renders/full-scene-walk-kitchen-r23.png`, `full-scene-walk-kitchen-hob-r23.png`
ve `full-scene-walk-kitchen-vitrine-r23.png` güncel tam GLB'lerden alınan Cycles
kontrolleridir. Fayans deseni, ahşap rengi, pencere/panjur, tavan ve ışık eşlemesi
açık iştir; bu görüntüler nihai kalite veya web GPU doğrulaması sayılmaz.

R23, `20-fixed-fittings.blend` üzerinde `tools/refine_kitchen_joinery_r23.py`
ve ardından `tools/fit_kitchen_to_cad_r23.py` ile uygulanmıştır. Betikler
tekrarlı uygulamayı engeller. Yalnız sabit donatı değiştiğinde, tüm kaynak
duvar üçgenleri aynı kaldığı kanıtlanarak mevcut 192 kesit profili korunabilir:
`tools/refresh_unchanged_sections.py` eski üçgen önbelleğini güncel dışa
aktarımla karşılaştırır; duvar geometrisi değişirse durur ve atlasın yeniden
üretilmesini ister. Hareket ızgarası her durumda güncel donatıdan yeniden kurulur.

R24, fırın camı ile tezgâh arasındaki eksik kumanda panelini tamamlar.
Vitrinin kiler bölümü fotoğraftaki üst kapak, küçük çekmece ve alt kapak
düzenine getirildi; kulplar ve çerçeveler bu düzene göre yerleşti. Açık orta
bölmelerin arkası fotoğraftaki gibi boyalı yüzeydir. `build/kitchen-photo-r24.json`
bu yorumların kaynaklarını, `build/review-r24.json` güncel kontrolleri ve GLB
görüntülerini kaydeder. Cihaz marka/modeli ve imalat ölçüleri doğrulanmış değildir.

Yol/arazi kontrolünde iki binanın oturumundan geçen tahmini güzergâh kaldırıldı.
Kuzeybatı, güneydoğu ve doğu dış yolları CAD bordürlerinden; bağlantı yolları
plana göre yorumlanan merkez hatlarından üretildi. Sekiz yol bölgesinin bina
oturumlarıyla alan çakışması yok. Asfaltın altındaki arazi yüzeyleri temizlendi;
ara kot geçişleri yumuşatıldı. Bina çevresindeki sabit kotlar ve villanın bahçe
kotları korunur. Yol genişliklerinin bir bölümü ve arazi interpolasyonu hâlâ
yorumdur; ölçü etiketine açılmaz. `build/road-terrain-correction.json` ve
`build/road-terrain-native-qa.json` bunu kaydeder. Komşu bahçe ve istinat duvarı
ayrıntılarının fotoğraf eşlemesi devam eden işler arasındadır.

R18 yol/arazi geometrisi `build/cad/road-ground-r18.json.gz` içinde saklanır.
`tools/apply_ground_correction.py`, `50-neighborhood-03.blend` ve
`50-neighborhood-10.blend` dosyaları açılarak ayrı ayrı uygulanabilir.
Plan/kot üretiminin başlangıç sahnesi `259aab5` commitidir; güncel araziye
tekrar yumuşatma uygulanmaz. Kütüphane değişikliğinden sonra
`tools/refresh_linked_delivery.py -- REVISION` ana sahne ve bağlantıları denetler.

Cloud Blender dizini `ANGORA_BLENDER_DIR` ile seçilir. Yalnızca web modellerini
yenilemek için Blender içinde `tools/export_web_viewer.py` çalıştırılır;
`--full-scene` güncel tam modeli, `--full-scene --views level-1` yalnız giriş
katını günceller. Eski `--views floor-1` modu statik kontrol kesitleri içindir.
Bağlı dosyalar değiştiğinde önce `layer-manifest.json` hashleri yenilenir. Ardından
`python tools/sync_web_viewer.py` ile uygulamadaki model kopyaları eşitlenir.
Mimari veya asansör duvarları değiştiğinde, eşitlemeden önce kesitler yenilenir:

```bash
bash tools/run_blender.sh build/blender/angora21-working.blend --python tools/export_wall_sections.py
python tools/build_section_atlas.py
python tools/sync_web_viewer.py
npm --prefix viewer test
npm --prefix viewer run build:pages
```

Kesit üretimi normal Python ortamında NumPy, Shapely ve mapbox-earcut kullanır.

## R47 — çekim noktaları, sadeleşen arayüz, ilan metni ve yükleme ekranı

- **Fotoğraf pinleri.** `photogallery/FOTOLAR-KONUM.jpg`, 56 ilan fotoğrafının
  her birini dört kat planı üzerinde bir nokta (kamera) ve bir okla (bakış
  yönü) işaretler. Bu planlar arayüzün kendi ekran görüntüleri olduğu için
  plan→model dönüşümü her kat için o planın taşıdığı oda etiketlerinden en
  küçük karelerle çözüldü: artıklar 0,02–0,13 m, ve her iç mekân noktası kendi
  katının yürüme maskesine düşüyor (`viewer/src/photo-points.js`,
  `viewer/tests/photo-points.test.mjs`). Görünüm sayfasındaki `Fotoğraflar`
  düğmesi pinleri açar. Pin küçük resim taşımaz; numaralı nokta kameranın
  durduğu yer, koni objektifin baktığı yöndür ve koninin ekrandaki açısı her
  karede ölçülür, varsayılmaz. Bir pine basınca fotoğraf masaüstünde sağ
  ortada, telefonda ekranın %80'inde (kalan alan %60 beyaz + 8 px bulanıklık)
  açılır; altında hangi odadan çekildiği yazar. Başka bir pin aynı çerçeveyi
  değiştirir; sağ üstteki çarpı ya da `Fotoğraflar` düğmesini kapatmak
  çerçeveyi kaldırır. 20 ve 24–28 çizimde işaretli değildir, fotoğrafların
  kendisinden ve malikin plan üzerindeki işaretlerinden yerleştirilmiştir;
  veri dosyası bu altı girdiyi yaklaşık olarak işaretler.
- **Arayüz sadeleşmesi.** Sağ ray yalnız yakın çevre ölçeğindeki yavaş dönüş
  düğmesini taşır; `İçeride gez` ve `Ortala` arayüzden çekildi — düğmeler,
  bağlantıları ve klavye yolları yerinde durur, çizilmezler. `Ayar` sağ alta
  dişli simgesi olarak taşındı; model ölçeği, kaldırılan hareket açıklamasının
  yerine sol alta geçti. Görünüm sayfasında ışık türü ve tarih seçimleri, iki
  küçük not, arayüz sesi ve cihaz raporu gizlendi; hiçbiri kaldırılmadı, hepsi
  paylaşılan bağlantıdan ve QA raporundan aynı şekilde çalışır. Dil düğmesi iki
  bayrağa dönüştü, etkin olan renkli durur.
- **İlan metni.** Sahibinin ilan metni `viewer/src/listing.js` içinde tek
  kaynak olarak durur ve ait olduğu yerde görünür: kimlik, adres, fiyat ve öne
  çıkanlar mülk bilgisinde her görünümde; kat paragrafları yalnız o kat açıkken,
  katın kendi kaplama ölçüsü ve mahal listesiyle birlikte; konum paragrafı bölge
  panelinde. İlan sözü ile model ölçümü karışmaz: alıntılar ilanın kendi
  başlıkları altında, türetilen her sayı eski köken notuyla kalır. Bölge
  panelindeki park/okul/market/eczane mesafe listesi kaldırıldı — mesafeler
  zaten haritanın kendi çiplerinde ve ölçülmüş oldukları yerde duruyor.
- **Yükleme ekranı.** Toplu teslim yolunda ilerleme hiç bildirilmiyordu: yirmi
  küsur megabayt tek bir cümlenin arkasında iniyordu. Artık plan verisi, model
  baytları (manifestteki yeni `bytes` alanıyla ağırlıklı, böylece 8 MB'lık
  mahalle 60 KB'lık bahçe kadar adım atmaz), ışık, sahne kurulumu ve
  gölgelendirici derlemesi aynı çubuğa yazılır; `Model · Işık · Sahne ·
  Görünüm` adımları sırayla yanar. Çubuk dolduğunda ilk kare zaten çizilmiştir,
  ekran beklemeden kapanır.

### R47 ikinci tur — kamera işareti, basma hedefi, ayrık sayfalar ve oda plakaları

- **İşaret artık kamera.** Numaralı rozet kaldırıldı: nokta fotoğrafçının
  durduğu yer, iki ışın objektifin açısı, noktadan inen ince kesikli çizgi de
  o katın döşemesine iner — işaret kalabalıktan ötürü kenara çekildiğinde bile
  çizgi gerçek noktasına bağlı kalır. İki işaret arasında 36 px açıklık
  korunur; sıkışan işaret genişleyen bir halka üzerinde boş yer arar, bu
  yüzden hiçbir kamera konumu bir diğerinin altında kaybolmaz.
- **Basma.** İşaret `click` yerine `pointerdown` ile açılır. İşaret her
  çizilen karede yeniden konumlandığı için, kamera otururken parmağın
  kalktığı eleman bastığı eleman olmuyor, tarayıcı da click üretmiyordu —
  "bazen tek basışta açılıyor, bazen beş basış yetmiyor" bundandı. Basma
  hedefi de döndürülmüş kutu değil, kamera noktasındaki 34 px'lik daire;
  daireler korunan açıklıktan küçük olduğu için birbirinin basmasını
  çalamaz. Ölçülen açılma süresi 5–19 ms.
- **Hiçbir şey çakışmaz.** Görünüm sayfası kendi dişlisinin üstünde açılır;
  her sayfanın köşesi ve yükseklik sınırı sabittir; fotoğraf çerçevesi ise
  açık sayfalardan arta kalan banda yerleşir ve bant 300 px'in altına
  düşerse boş olan sol sütuna geçer. Çerçeve açıkken kat çizimi projeksiyon
  kaydırmasıyla çerçevenin altından çıkar (tuval yeniden boyutlanmaz, yalnız
  projeksiyon kayar), böylece altında kalan hiçbir işaret erişilmez olmaz.
  Plan ölçüleri de kamera işaretlerini engel sayar.
- **Oda etiketleri.** Beyaz hale okunurluk değil pusluluk üretiyordu; yerine
  %40 beyaz, yuvarlatılmış bir plaka geldi. Plaka, odanın kayıtlı x/z
  ölçülerinden kurulan dikdörtgenin ekrana düşen dörtgeninin içine sığacak
  şekilde ölçeklenir — dört kenarın her biri bir sınır verir, model hangi
  açıya çevrilirse çevrilsin etiket odanın dışına taşmaz — ve sığmıyorsa
  etiket hiç çizilmez.
- **Üç ayrı sayfa.** `Kat bilgisi` yalnız Villa ölçeğinde görünür ve yalnız
  açık katı anlatır (katın kendi metni, kaplama izdüşümü, mahal listesi).
  `Mülk bilgisi` yalnız ilandır. Bölge metni (Çayyolu, Angora Evleri,
  ulaşım) bölge paneline taşındı ve donatı çipleri, yerleşke panelinin
  altında kaybolmasınlar diye alt ortaya alındı.

### R47 üçüncü tur — bahçe işaretleri, sade işaret ve dişliden açılan görünüm sayfası

- **Bahçeye çıkan işaretler.** İkinci turda 24, 26 ve 27 kat çerçevesinin
  dışında kaldıkları için havuz terasına sıkıştırılmıştı. Malikin çizdiği
  gerçek duruş noktalarıyla hepsi bahçedeki kendi yerlerine döndü; bakış
  yükseklikleri 1,6 m insan gözü. 25 ve 27 havuz seviyesinde durur, yalnız
  bodrum katında çizilir. 24 ve 26 eve dışarıdan bakar: `follow` işaretiyle
  dört katta da çizilirler ve her kat açıldığında o katın kendi döşeme
  kotunda yeniden kurulurlar — göz de, ince çizginin indiği ayak da — yani
  bakış noktası ziyaretçiyle birlikte binada yükselir. Yeni `angora_28` ön
  cephe / otopark karesi aynı şekilde giriş katından yukarı her katta çizilir.
  Kat içi 21 numaralı mutfak karesi de malikin işaretlediği yere taşındı.
- **Çerçevenin tutamadığı işaret kenarda durur.** Kat görünümü kat izini
  çerçeveler, parseli değil; bahçede yirmi metre geriden çekilmiş bir kare
  ekranın dışına düşer ve fotoğrafı hiç açılamaz. Artık veri gerçek yerini
  tutar, çizim ise tutamadığı işareti çerçevenin ortasından gerçek yerine giden
  doğru üzerinde güvenli kenara çeker: yön birebir korunur, yalnız uzaklık
  kısalır, ince çizgi de dışarıyı gösteren kısa bir çizgiye döner ve yere
  inen nokta çizilmez. Kenar payı üst çubuğun, kat sırasının ve dişlinin
  kendi alanıdır, böylece tutulan işaret hiçbir denetimin altına girmez;
  kalabalıkta kenara çekilen işaretler de aynı payın dışına taşamaz. Kaba
  pay yetmediğinde arayüzün kendi ölçtüğü denetim dikdörtgenleri devreye
  girer: plan ölçülerinin kullandığı aynı liste artık işaretleri de iter,
  yani kat sırasının ya da dişlinin altına düşen — dolayısıyla hiç
  açılamayan — işaret kalmaz.
- **Sade işaret.** Kamera işaretinin altındaki beyaz hale kaldırıldı — elli
  altı halenin altında plan puslanıyordu; ayırmayı noktanın kendi beyaz
  konturu yapıyor. İki ışının arasındaki göz de kaldırıldı: bu boyutta
  ikinci bir basılacak şey gibi okunuyordu. Geriye tripodun noktası ve
  objektifin açısını veren iki çizgi kalır.
- **Görünüm sayfası dişlinin üstünde.** Sayfa artık dişlinin bir üstünde
  değil, dişlinin tam kendi köşesinde açılır: aynı sağ kenar, aynı alt
  kenar, köşeden büyüyen bir açılma. Dört düğme ve bir kaydıraç için 340
  px'lik cam sütun gereksizdi — sayfa 264 px'e, iç boşlukları, başlığı ve
  düğmeleri (34 px) kendi ölçeğine indi. 44 px'lik dokunma tabanı telefonda
  olduğu gibi durur; daraltma yalnız imleçli cihazlarda geçerlidir.

### R47 dördüncü tur — sabit işaretler, telefonda sığan arayüz

- **İşaretin yeri sabittir.** Kamera işaretleri artık ne birbirinden ne de bir
  düğmeden kaçıyor, kadrajın içine de çekilmiyor: her işaret kendi kamerasının
  modeldeki yerinde durur. Üçüncü turdaki kenarda tutma ve kalabalıkta kenara
  çekilme kaldırıldı — pan ile gezinirken işaretlerin yer değiştirmesi
  "kaçışan fareler" görüntüsü veriyordu. Kadrajın dışına çıkan işaret çizilmez,
  görüş oraya dönünce geri gelir. Üst üste binen iki işaretten öndeki basmayı
  alır; derinlik sırası bunu belirler. Plan ölçüleri işaretleri engel saymaya
  devam eder. Bunun bilinen bedeli: bahçedeki 24 ve 26 hâlâ dört katın da
  verisinde işaretlidir, ama kat görünümü kat izini çerçevelediği için çoğu
  zaman — özellikle telefonda — kadrajın dışında kalır ve çizilmez;
  uzaklaştırıldığında ya da plan görünümünde geri gelirler. Bu, üçüncü turdaki
  "her katta gözüksün" isteğinin, dördüncü turdaki "kadrajda olma zorunluluğu
  yok, yeri sabit" isteğiyle değiş tokuşudur.
- **Telefonda işaret küçüldü.** İşaret kendi noktası etrafında %66'ya çekildi —
  nokta yerinde kalır, yalnız ışınlar kısalır — ve basma hedefi 44 px yerine
  çizimin kendi ölçüsünde (34 px) durur, böylece komşu işaretler birbirinin
  basmasını daha az çalar.
- **Dişli telefonda sağ üstte.** Alt menünün yüz piksel üstünde boşlukta duran
  dişli, ölçek seçicinin karşısına, sağ üste taşındı; model ölçeği de
  havada kalmayıp alt menünün hemen üstüne indi. Masaüstünde hiçbir şey
  değişmedi — dişli sağ altta, sayfa da kendi köşesinden açılıyor.
- **Görünüm açıklaması kaldırıldı.** Ölçek seçicinin altında ölçeği ve katı
  bir daha yazan şerit hem masaüstünde hem telefonda çizilmiyor. Belgeden
  silinmedi, yazılmaya da devam ediyor (başlıklar paylaşılan bağlantıda ve QA
  raporunda duruyor); yalnız görünmüyor.
- **Donatı filtreleri telefonda ikon.** Altı adlı çip telefon genişliğine
  sığmıyor, sağ kenardan taşıyordu. Her aile artık kendi rengindeki tek bir
  ikonla gösteriliyor — mezuniyet kepi, sağlık artısı, çatal-bıçak, alışveriş
  çantası, ağaç ve sütunlu kamu binası — altısı ekran genişliğine sığar,
  kaydırma kalmaz. Ad düğmenin etiketinde durur, ekran okuyucu ve uzun basış
  aynı adı verir; masaüstünde adlı çipler aynen kalır. Satır da haritanın
  ortasından inip bölge panelinin hemen üstüne alındı.

### R47 beşinci tur — VR ve bahçeye çıkan yürüyüş

- **Yürüme yüzeyi artık bahçeyi de içeriyor.** Native teslimatın yürüme
  yüzeyi binanın kendi döşeme katmanlarından (`$ZEMİN`, `$ZEMİN KAPLAMA`,
  `$MERDİVEN`) tarandığı için duvarlarda bitiyordu: ızgarası evi ve bir iki
  metrelik terası kapsıyor, bahçe, havuz çevresi, ön yol ve balkonların
  altındaki zemin hiç yok. Ziyaretçi bodrum kapısını açıp olduğu yerde
  kalıyordu. R44'te bu sorunu çözen dış mekân taraması (`build/walk-outdoors-r44.json`)
  *full* teslimata uygulanmış, native'e hiç geçmemişti.
  `tools/extend_native_navigation_outdoors.py` iki teslimatı birleştirir.
  İkisi de aynı evi aynı dünya koordinatlarında, aynı 12 cm adımda anlatır ve
  paylaştıkları hücrelerde yükseklikleri milimetrede uyuşur (17.840 ortak
  yürünebilir hücrede medyan 0,000 m, p90 0,000 m). Kural: **native'in
  desteklediği her hücrede native kazanır** — kendi yükseklikleri, kendi
  blokları, kendi dar gövde yarıçapı (0,21 m) ve baş boşluğu (1,68 m). Native'in
  hiç desteği olmayan hücreye full zemin verebilir, ama yalnız o hücrenin
  **altındaki hiçbir katta da** native desteği yoksa. Bu son şart işin tüm
  güvenliğidir: galeri boşluğunun altında zaten bir döşeme vardır, o yüzden
  boşluk boşluk kalır ve yürünebilir köprüye dönüşmez; balkon altında ya da
  çimende altta bir şey yoktur, zemin oradan geçer. Araç, yazmadan önce
  native'in desteklediği her hücreyi yazdığıyla karşılaştırır ve biri oynamışsa
  dosyayı hiç yazmaz (30.208 hücre korundu, 0 değişti). Izgara 128×150'den
  193×361'e, dosya 94 KB'den 190 KB'ye çıktı.
- **Ne açıldı.** Bodrum salonundan yürüyerek ulaşılabilen alan 2.133 hücreden
  (tek kat, 7,5 × 7,5 m) 31.244 hücreye çıktı: havuz çevresi, arka çim, doğu ve
  batı yan bahçeleri, ön yol ve giriş katı yaklaşımı. Oda menüsüne de üç yeni
  durak eklendi — `Havuz`, `Bahçe`, `Ön bahçe` — her biri gerçekten
  basılabilecek en yakın hücreye oturtuldu ve eve bakar. İki balkonun durağı
  zaten vardı.
- **Merdiven kovası bütün olarak taşındı.** Native tarayıcıda iç merdivenden
  tek bir hücre bile yoktu — evin içinde iki kat kotu arasında hiçbir yükseklik
  yok — yani dört kat dört ayrı adaydı ve kat değiştirmenin tek yolu asansör ya
  da oda menüsüydü; başlıkta ise hiçbir yolu yoktu. Basamakları teker teker
  eklemek işe yaramaz: bir hücre katman başına tek yükseklik tutar ve kovada
  native o yüksekliği bodrum döşemesine harcamış, basamağa yer kalmıyor;
  sahanlıklar da tutmuyor. Bu yüzden kova, dört katmanıyla birlikte, `full`
  yüzeyinden olduğu gibi alınıyor.
  Kova kendini buluyor: **bir merdiven planda dar, kesitte yüksektir.** Basamak
  = yüksekliği iki kat kotunun tam arasında kalan hücre; değen basamaklar
  gruplanıyor; ve bir grup ancak üç ya da daha çok katta üst üste geliyorsa,
  planda her iki yönde 6 m'ye sığıyorsa ve en az bir kat yükseliyorsa merdiven
  sayılıyor. Ön bahçenin yamacı da üç kata yayılıyor ama 15 m genişliğinde, o
  yüzden merdiven değil. Bulunan tek kova: 339 hücre, dört katta, planda
  3,36 × 2,28 m, 10,6 m yükseliyor. Sahanlıklar gelsin diye yarım metre
  büyütülüyor (904 hücre). Kovanın dışında native'in desteklediği 28.329
  hücrenin hiçbiri değişmiyor.
- **Sonuç: ev yürüyerek tamamen bağlı.** Bodrum salonundan yürüyerek dört kata
  da çıkılıyor (19.036 / 12.826 / 3.821 / 1.916 hücre) — iki balkon dahil.
  Ulaşılamayan iki durak kalıyor (`f1-Z03 WC`, `f3-C05 Oturma alanı`): kaynak
  modelde kapıları kapalı, onlara uydurma yol açılmadı. `full` yüzeyinde de üç
  durak aynı sebeple ulaşılamıyor.
- **Bahçenin tamamı zemin oldu.** R44 dış mekân taraması ziyaretçinin
  kullanacağı yerlere zemin sermiş — havuz çevresi, yollar, ön yaklaşım, evin
  yanındaki şeritler — ve parselin batı, doğu ve arka kenarındaki dikim
  şeritlerini yüzeysiz bırakmıştı: ziyaretçinin yürüyüp önünde durduğu ~413 m².
  `tools/raster_plot_terrain.mjs` parselin kendi çimini, viewer'ın çizdiği
  teslimattan doğrudan tarar. `plot-grass.gpu.gltf` tek mesh, tek malzeme ve
  **çimin kendisidir**: duvar değil, havuz değil, çatı değil. Yalnız onu
  taramak işin dürüstlüğüdür — okunan meshte olmadığı için hiçbir hücre bahçe
  duvarının üstüne ya da suyun üzerine düşemez. Üç sınır: (1) yalnız yüzeyin
  hiçbir şey bilmediği hücreye — herhangi bir katta yüksekliği olan hücre
  olduğu gibi kalır, yani iç mekân, teraslar, yol ve merdiven kovası tanım
  gereği dokunulmaz; (2) yalnız teslimatın kendi kayıtlı parsel sınırı içine,
  komşunun arsası komşuda kalsın diye; (3) yalnız yamaç 40°'den dik değilse —
  daha diki bakılacak şevdir, yürünecek zemin değil. Hangi hücreye hangi
  yükseklik: çimin orada ulaştığı en üst kot; hangi kata: üstünde durduğu
  döşeme kotuna. Eklenen 16.812 hücre (13.005 bodrum kotunda, 3.807 giriş
  kotunda). 11.715 üçgenin 4.992'si dikliği yüzünden elendi.
- **Sonuç.** Dışarıda yürünebilen zemin 315 → **552 m²**, bodrum salonundan
  yürüyerek ulaşılan 290 → **480 m²** (dış zeminin %87'si). Parselin batı ve
  doğu kenarına, kuzeydoğu ve güneybatı köşelerine yürünüyor.
  Kalan cepler `tools/add_terrace_steps.mjs` ile bağlandı. **Bu araç geometri
  uyduruyor** ve bunu teslimata imzalıyor (`terrace_steps.invented: true` ve
  nereden geldiğini söyleyen bir not): kaynak modelde alt teraslara inen
  basamak yok, malik istedi, bu da modelin okunması değil ev hakkında bir
  karar. O yüzden yalan en küçüğüne indirildi — cep başına **tek** kol, iki
  kotun birbirine en çok yaklaştığı tek noktada, 1,20 m genişlikte, bahçe
  merdiveni eğiminde, başka hiçbir yerde. İstinat kenarı o tek kol dışında
  boyunca duvar olarak kalır. Bir cep bağlanamıyorsa bağlanmıyor ve raporda
  sebebiyle yazılıyor. Konan dokuz kolun yedisinin yükselişi ±0,2 m'nin
  altında: teraslar aslında duvarla değil, zemindeki boşlukla ayrılmışmış;
  yalnız biri gerçek bir 1,41 m'lik iniş. Sonuç: dış zeminin **%96,7'si**
  (558 m²'nin 539 m²'si) bodrum salonundan yürüyerek geziliyor.
- **Yanlar da bağlandı.** İç merdiven kovası tamamen kapatıldığında bile
  bodrum kotundan giriş katına **evin etrafından dolaşarak** çıkılıyor — giriş
  katı salonu ve ön yaklaşım dahil. Üst katlara dışarıdan yol yok, o da
  uydurulmadı; 1. kat ve çatı katı iç merdivenden.
- **VR.** WebXR yolu zaten kuruluydu; bu tur kullanılabilir hâle getirildi.
  Cihaz WebXR'a cevap veriyorsa açılıştaki karşılama kartı üçüncü bir seçenek
  kazanır: **`VR ile gez` / `Start immersive`**. Tıklanırsa kart kapanır,
  ziyaretçi eve sokulup ayağa kaldırılır ve oturum ondan **sonra** açılır —
  vizörde ilk görünen şey dışarıdan model değil, içinde durulan odadır.
  Tıklanmazsa ya da kart kapatılırsa hiçbir şey değişmez: ekrandaki mevcut
  web hâli aynen açılır. Destek yoksa düğme hiç çizilmez. Oturumu sonradan
  açmak için iki düğme daha var — modele bakarken alt çubukta `Plan`'ın
  yanında, tur içindeyken turun kendi üst satırında.
- **VR kumandası.** Sol çubuk bakış yönünde yürütür (vardı). Sağ çubuk sağa/sola
  **30°'lik kademeli dönüş** yapar — vizör altında sürekli kayan bir dönüş
  insanı en hızlı rahatsız eden şeydir — ve dönüş rig'in değil **başın**
  etrafındadır, yoksa ziyaretçi arkasındaki bir nokta çevresinde savrulur. Sağ
  çubuğu yukarı/aşağı itmek **kat değiştirir**: merdiven artık yürünüyor ama
  karşıdan karşıya bir kat atlamak isteyen için bu hâlâ en kısa yol, ve
  merdiveni bulamayan ziyaretçi kattan hiç çıkamamış olmaz. Ziyaretçi durduğu
  noktanın tam üstünde/altında, o katta gerçekten basılabilecek en yakın yerde
  çıkar; katın iç mekânı oda menüsündeki gibi önce yüklenir. Her itiş bir kez
  iş görür: çubuk bırakma eşiğine dönmeden ikinci kez dönmez ya da kat
  değiştirmez. Tetik, ışınla zemine ışınlanmayı korur; menzili 12 m'den 20 m'ye
  çıkarıldı, çünkü 12 m odalar için çizilmişti ve parsel kırk metre.
- **Ne test ediliyor.** `viewer/tests/walk-outdoors.test.mjs` teslim edilen
  yürüme yüzeyini gerçek `WalkSurface` ile dolaşır: ızgaranın parselin dört
  ucuna yettiğini, bodrum salonundan havuz çevresine, arka çime, doğu ve batı
  yanına ve ön yaklaşıma **yürüyerek** gidilebildiğini (25.000'den çok hücre),
  her durağın hâlâ yüzeyin üstünde durduğunu ve dosyanın taşıdığı
  "0 hücre değişti" kaydını doğrular. Hücre hücre kanıt aracın kendisindedir —
  eski ve yeni yüzeyin aynı anda elde olduğu tek yer orasıdır ve biri oynamışsa
  dosyayı yazmayı reddeder.

### R47 altıncı tur — açılış ölçeği, künye ve üst orta menü

Yürüme yüzeyi üç adımda, bu sırayla üretilir ve her adım kendi raporunu yazar:
`python3 tools/extend_native_navigation_outdoors.py` (dış mekân + merdiven
kovası) → `node tools/raster_plot_terrain.mjs` (parselin çimi) →
`node tools/add_terrace_steps.mjs` (alt teraslara kollar).

- **Açılış görünümü `Yakın çevre`.** Ziyaretçi Angora 21'in ne olduğunu
  görmeden önce nerede olduğunu görsün. `share-state.js` bunu zaten varsayılan
  sayıyordu (bağlantı bu görünüm için `view` parametresi taşımaz);
  `main.js` bu satırda onunla çelişiyordu, artık çelişmiyor. VR açılışta
  dayatılmaz: WebXR'a cevap veren cihazda karşılama kartındaki `Start
  immersive` bir seçenektir, alınmazsa ekrandaki hâl aynen açılır.
- **Ölçek menüsü üst ortada.** `Bölge · Yakın çevre · Villa`, markanın ve iki
  sayfa düğmesinin arasına, üst şeridin ortasına alındı: bütün hikâyede nerede
  durduğunuzu söyleyen tek denetim orası. Sol sütun modelin kendisine kaldı.
- **MERGVS künyesi.** Üst soldaki marka artık mergvs.com'a gider. Sol alta,
  ölçek çubuğunun altına tek satır künye kondu: Türkçe `Proje geliştiricisi ve
  sahibi: MERGVS`, İngilizce `Owner and developer: MERGVS`. Tur sırasında
  çizilmez.

## R44 — beyaz iç mekânlar, bodrum dolgusu, dış mekân yürüyüşü ve birleşik model

R44 dört isteği işler; araçlar `tools/*_r44.mjs` altındadır ve her biri kendi
`build/*-r44.json` kaydını yazar.

- **İç yüzler ve tavanlar beyaz.** R43'ün çatı için kurduğu yüz yargısı alt
  katlara uygulandı; oda içine bakan duvar yüzleri `interior`, dışa bakanlar
  cephe renginde kalır. Oda tavanı olarak okunan çatı/döşeme altları yeniden
  boyanmaz, 25 mm altına `ceiling` malzemesiyle astarlanır; dıştan görünüş
  değişmez (`build/white-interiors-r44.json`).
- **Bodrum kesiti.** Yol onarımının sessizce bozduğu arsa toprağı işareti
  onarıldı (mesh adı değişince `splitContextSoil` hiçbir şeyi işaretlemiyordu);
  toprak yine 1,60 m'de kesilir. Giriş kanadının altındaki kazı boşluğu
  taramalı zemin olarak kapatıldı; gömülü kolon ve duvar kütükleri bu yüzeyin
  altında kalır. Reddedilmiş R42 tüm-arsa taraması geri getirilmedi
  (`build/basement-void-fill-r44.json`). Mutfak cumbasındaki çukur saksı da
  dolduruldu (`build/west-planter-fill-r44.json`).
- **Dışarıda yürüyüş.** Yürüme ızgarası 192×360 hücreye genişletildi; havuz
  terası, çimler, yan merdiven, ön yaklaşım ve ana yatak balkonu bodrum
  salonundan yürüyerek ulaşılabilir ve ana balkon oda seçicisine eklendi.
  Açık dış kapılar kendi kasalarından ölçülür (`build/door-open-r44.json`).
  `f1-Z10` etiketi bir gölgelik üstüdür, `f2-109` balkonunun kaynak modelde
  kapısı yoktur; ikisi de bilerek etiket olarak bırakıldı
  (`build/walk-outdoors-r44.json`).
- **Birleşik model.** Dört kat + dış kabuk tek `villa.glb` oldu: dokular ve
  malzemeler bina genelinde tekilleştirildi (43 doku), statik parçalar
  malzeme×kategori başına birleştirildi. 3 568 mesh düğümü 874'e, beş dosyanın
  27,2 MB'ı 12,5 MB'a indi; geometri, UV ve dokular bit-eşdeğer geçer, Draco
  ayarları aynıdır. Asansör kabini/kapı kanatları, garaj aracı, büyük
  instanced meshler ve saydam yüzeyler ayrık kalır
  (`build/villa-merge-r44.json`). Kat başına dosya kalmadığından eski
  `level-*.glb`/`envelope.glb` teslimden çıkarıldı; viewer üç parça bekler.

### R44 üçüncü tur — çatı temizliği, mobil teslim, kesit bitkileri

- **Çatı enkazı.** İçe aktarımın kuzey eğiminde bıraktığı çerçeveli tablo
  takımı (dört kanvas + wood_dark çıtaları + white_trim parçası, z −3,52
  düzleminde kiremitlerin 4-15 cm üstünde) kaldırıldı. Araç kiremitleri
  katmanlı örtü olarak okur: bir duvar/doğrama üçgeni altındaki en yüksek
  katmanın 3,5 cm üstünde ve gökyüzüne ya da hava boşluğuna açıksa kırpılır;
  saçak/kalkan tahtaları, mahya ve baca korunur
  (`tools/trim_roof_protrusions_r44.mjs`, `build/roof-trim-r44.json`).
- **Mobil teslim.** Tam teslim 4,1 M üçgen + ~175 MB çözülmüş doku ile
  telefon belleğini aşıyordu (WebKit yükleme sırasında çöküyordu). Aynı üç
  dosyadan türetilen hafif set: malzeme sınıfına göre sınırlandırılmış
  sadeleştirme (mimari ~3-4 cm hata payı, yaprak/kumaş serbest), normal ve
  occlusion haritaları yok, dokular ≤512 px webp; bahçenin 144 k üçgenlik
  çim yaprağı alanı ve context'in 510 k üçgenlik bordür meshi mobilde yok.
  Sonuç üç parça 1,70 M üçgen / 11,3 MB (`tools/build_mobile_delivery_r44.mjs`,
  `manifest-mobile.json`). Viewer telefonda (coarse pointer + ≤820 px veya
  ≤4 GB bellek) mobil manifesti seçer; `?model=full` / `?model=lite` iki
  yönde de zorlar. Navigasyon, odalar, kesitler ortak. Telefon, toplamdan
  değil bellek TEPESİNDEN ölür: sıcak önbellek üç dosyayı aynı anda teslim
  edince üç paralel Draco çözümü WebKit'i düşürüyordu ("a problem
  repeatedly occurred"); lite modda indirme/çözme hattı tek sıraya iner
  (tek worker, tek Draco decoder) ve sahneleme biter bitmez Draco WASM
  yığınları serbest bırakılır.
- **Bodrum kesiti bitkileri.** Tabanı toprak kesim kotunun üstünde kalan
  bitkiler (ön bahçe ağacı, mazı sıraları) f0 görünümünde gizlenir — kesilen
  zeminin üstünde asılı durmazlar; yürüyüşe girince geri gelirler.

### R44 ikinci tur — arayüz, cephe, ön bahçe ve bölge haritası

- **Arayüz.** Tek cam dili: Jura (repo içinde woff2), beyaz 0,40 opaklık +
  8 px blur, hap geometrisi. Üst orta ölçek seçici, sağ orta kamera rayı,
  alt orta kat/keşif dock'u; mobilde dock iki satıra iner, paneller alt
  sayfa olur; yürüyüşte üst eylemler gizlenir. Ölçülendirme katmanı
  `interface-quality.css`'te kaldı.
- **Cephe beyazları.** R43 kalıntısı iki kural (parapet başlıkları ve 10 cm
  toleransın beyaza çevirdiği ince çatı katı duvar dışları) yön sondalı yüz
  yargısıyla değiştirildi: yüzeyin iki yanı katın oda sınırında sınanır,
  yalnız içeride kalan yüz `interior` olur; tek deri beyazlar 6 mm `stucco`
  dış deri kazanır. Çatı sırtındaki ince kaynak yarıkları iç dikiş kapaklarıyla
  kapatıldı (`build/roof-slit-caps-r44.json`). Komşular AO ve kesit
  düzlemlerinin tamamen dışında (`aoExcluded`).
- **Ön bahçe** (`tools/fix_front_garden_r44.mjs`, kayıt
  `build/front-garden-r44.json`): (1) doğu istinat duvarı boyunca mazı
  hattı 7 ekranla sürdürüldü, her ekran kendi teras kotunda; (2) garaj
  yolu ile doğu merdiven sahanlığı arasındaki 30 cm boşluk sahanlık
  kotunda taş bantla kapatıldı; (3) giriş yolu ile diyagonal garaj yolu
  arasındaki çukur çim kaması iki kenara mükemmel oturan regle yüzeyle
  taşlandı — sokak ucunda fotoğraftaki gibi bordürlü ağaç yatağı bırakıldı;
  (4) ön çit mazı sırası ile cephe arasındaki şerit, fotoğraflardaki gibi
  giriş kotunda (3,08) düz taş teras oldu ve giriş yoluna bağlandı. Yeni
  taşların altındaki 21.494 çim yaprağı üçgeni kaldırıldı; araç arşivden
  (`build/garden-pre-frontfix-r44.glb`) yeniden çalıştırılabilir.
- **Bölge haritası.** "Bölge" ölçeği artık kuzeyi yukarı bakan bir harita
  katmanı: plan verisi teslimin kendisinden çıkarılır
  (`tools/extract_region_plan_r44.mjs` → `viewer/src/region-plan.json`;
  yollar context'in CAD asfaltından rasterlenir, komşular B-aile
  zarflarıdır, villa kendi taban izidir). 1 km / 2 km yarıçap seçilebilir,
  geçişler bulut süpürmesiyle ve tek easing ile akar. Çevre bilgisi
  kök dizindeki `uzakolcek.html`'den gelir — "Hatırlı Sokak No:10
  Kentsel Donatı Atlası" (OSM + Google/Yandex, 1.580 nokta, 3.250 m):
  `tools/extract_region_places_r44.mjs` atlasın kendi merkezini harita
  orijini yapar, her günlük ihtiyaç için en yakın isimli yeri gerçek
  metre değeriyle çipe çevirir ve isimli donatıları sakin bir nokta
  alanına inceltir (`viewer/src/region-places.json`). Atlasın yalnız
  bilgisi kullanılır, tasarımı kullanılmaz.

## Çalışma durumu

DWG'den katmanlı Blender sahnesi yeniden kuruldu. **Çalışma / kontrol sürümüdür; bitmiş satış demosu veya birebir doğrulanmış nihai model değildir.** Kaynak çizgileri ve üretilen yüzeyler ayrı tutulur. Fotoğrafa göre eklenen parçalar kendi kanıt durumlarını taşır.

1. Kaynak geometriyi ve özgün katman adlarını koruyarak aktarım.
2. Mimari yüzeyler, açıklıklar, fotoğraf malzemeleri ve ayrı mobilya koleksiyonu.
3. Master plana oturan bahçe ve komşu kütleleri; fotoğraftan çıkarılan ayrıntılarda kaynak / tahmin kaydı.
4. Oda bazında görsel kontrol ve ölçü doğrulama; ardından web optimizasyonu ve satış arayüzü.

Ölçü etiketlerine yalnız doğrulanmış ölçüler girecek. Fotoğraftan çıkarılan havuz, peyzaj ve görünmeyen komşu cepheleri, model verisinde `inferred` olarak işaretlenecek.

`python tools/inventory.py` kaynak özetini ve fotoğraf inceleme sayfalarını `build/reference/` altında üretir.

## Çıktılar

- `build/blender/angora21-working.blend`: bütün sahneyi açan ana Blender dosyası. **Yanındaki `layers/` klasörüyle birlikte indirilmelidir.**
- `build/blender/layers/`: kaynak CAD katmanları, mimari, sabit donatılar, ayrı mobilyalar, bahçe ve mahalle için düzenlenebilir Blender dosyaları. Malzemeler ve tekrar kullanılan meshler ortak dosyalardan bağlanır.
- `build/blender/layer-manifest.json`: ana sahne ve bütün bağlı dosyaların boyutları, SHA-256 değerleri ve geometri sayımları. `layer-qa.json` dosyasında eksik bağlantı / doku denetimi bulunur.
- `build/renders/`: Blender Cycles kontrol görüntüleri.
- `build/renders/render-manifest.json`: her görüntünün üretildiği native sahne SHA-256 değerini ayrı kaydeder; listede bulunmayan görseller önceki kontrol aşamalarından kalmış olabilir. WC görüntüsü, kapı geçici gizlenerek alınan ve `mode` alanıyla açıkça belirtilen bir inceleme kesitidir.
- `build/glb/scene-manifest.json`: ortak başlangıç noktasını koruyan 20 GLB; dört kat, dış ayrıntılar, bahçe, zemin ve komşu binalar. Her malzemede normal ve roughness/metallic haritası vardır. Web aydınlatması ve mobil performans henüz doğrulanmadı.
- `assets/pbr/pbr-maps.zip`: 77 malzeme için 385 PNG; base color, OpenGL normal, roughness, metallic ve ORM. Haritalar fotoğraf yorumuyla kurulan malzemelerden bake edildi; renk kalibreli tarama değildir. ORM'nin AO kanalı nötrdür.

Malzeme kontrolünün 14. adımında 62 sabit renk haritasındaki linear → sRGB yazım hatası düzeltildi. Böylece sıva, çim, ahşap ve iç duvar renkleri dışa aktarımda gereksiz koyulaşmıyor. `assets/pbr/color-encoding-report.json` beklenen renk değerlerini kaydeder. Işık denemelerinin ardından mevcut HDRI düzeni korundu; fotoğraflara göre güneş, pozlama ve kadraj eşlemesi hâlâ açık bir iştir. Yeni render kayıtları, ana dosyayla birlikte 27 bağlı dosyanın tamamını `model_snapshot_sha256` ile tanımlar. Bu düzeltmeler fotoğrafa birebir eşleme onayı anlamına gelmez.
- `build/cad/`: kaynak özeti, master plan yerleşimi, açıklık kontrolü ve eşleştirilmemiş ölçü verileri.

Kaynak DWG'nin SHA-256 değeri `db8a25b05cd9f572f1de5825b62f38133678607f5dbc6cf4cf7bb621acdde229`.
202 fotoğraf, 159.409 model-space varlığı ve 1.308 ölçü varlığı envanterlendi. DWG, hazır kapalı mesh katıları yerine 3D çizgi / spline geometrisi içeriyor. Bu nedenle yüzeyler yeniden oluşturulur; tamamlanmışlık, çizgi sayısıyla ölçülmez.

Blender'da metre birimi kullanılır. Detay modeline uygulanan ölçek `0.01`; kaynak Z başlangıcı `54.37355489974468`. Ham DWG `INSUNITS` bilgisiyle fiziksel model ölçeği doğrudan eşitlenmemelidir. Master plan ayrı bir dönüşümle, `22E1A` handle'ına sahip 21 numaralı bina üzerinden kaydedildi; hedef oturum alanı yaklaşık 153,32 m². Bu, ilan net/gross alanı değildir.

Komşu planlarında bazı açık polylinelerin son kenarı kapatılarak kütle izi oluşturuldu; `closing_edge_inferred` bayrağı bunları gösterir. Bina 21'in bahçe döşemesi BK 1026,40 datumudur. Bina 22'nin BK kotu +2,50 m, bina 20'nin BK kotu −3,00 m olarak master plan yazılarından okunur. Ön TK +3,30 m ile bina 20'nin arka TK −3,10 m kotu arasında 6,40 m fark vardır. Yazıların yerleri ölçülmüş topoğrafya noktası sayılmaz; aradaki arazi ve komşuların görünmeyen cepheleri yorumlanmıştır. Havuzun 8 × 4 m kontrol boyutu da tahminidir. Doğrulanmamış değerler ölçü etiketine açılmaz.

## Yeniden üretim

Blender 4.5.13 LTS, LibreDWG commit `7eb90a9f933623729f82781cb1d68de2e50593f3`, Python / ezdxf 1.4.4, shapely 2.1.2, numpy ve mapbox-earcut 2.0.0 kullanıldı.

```bash
dwgread -v0 -O DXF -o build/intermediate/source.dxf ANGORA-.dwg
python tools/extract_cad.py build/intermediate/source.dxf
python tools/reconstruct_surfaces.py
python tools/prepare_ironwork.py
python tools/repair_openings.py
python tools/repair_floor_levels.py
python tools/prepare_site.py
python tools/prepare_site_refinement.py
python tools/prepare_terrain_mesh.py
export ANGORA_BLENDER_DIR=/absolute/path/to/blender-4.5.13-linux-x64
bash tools/run_blender.sh --python tools/build_blender.py -- --dress --detail --render
bash tools/run_blender.sh build/blender/angora21-working.blend --python tools/bake_pbr.py
bash tools/run_blender.sh build/blender/angora21-working.blend --python tools/apply_photo_review_patch.py
bash tools/run_blender.sh build/blender/angora21-working.blend --python tools/check_scene.py
bash tools/run_blender.sh build/blender/angora21-working.blend --python tools/check_lift_fixture_clearance.py
bash tools/run_blender.sh build/blender/angora21-working.blend --python tools/export_streams.py
bash tools/run_blender.sh --python tools/verify_glb_roundtrip.py
bash tools/run_blender.sh build/blender/angora21-working.blend --python tools/package_blender_layers.py
bash tools/run_blender.sh build/blender/angora21-working.blend --python tools/verify_layer_delivery.py
```

Kaynak çıkarımı normal Python ortamında, sahne betikleri Blender Python ortamında çalışır. `build/intermediate/` önce oluşturulmalıdır.

## Fotoğraf ayrıntı çalışması — 7 Eylül 2026

`--detail`, özgün CAD mimarisinin üstüne fotoğraf yönlendirmeli ayrıntıları ekler:

- Giriş salonu: koyu kahverengi deri oturma grubu, kıvrımlı ayaklı yemek/sehpa grubu, camlı vitrin, bordo perdeler, pencere iç pervazları ve iki avize.
- Ana yatak odası: kumaş başlıksız yatak tabanı, dökümlü örtü, yumuşak yastıklar, tül perdeler ve fotoğraftaki kumaş sarkıt. Örtü ve salon tablosu özgün fotoğraf bölgelerinden UV projeksiyonu kullanır; ışığı ayıklanmış ve renk kalibreli taramalar değildir.
- Mutfaklar: kat planı ve fotoğraflarla düzeltilmiş tezgâh yönleri, oyuk lavabo, musluk, ocak, fırın, davlumbaz, dolap iç panelleri; bahçe katında yarım ada.
- Ebeveyn ve ortak banyo: kavisli duşakabin, lavabo/dolap, ayna, radyatör, ortak banyoda çamaşır makinesi ve kırmızı-krem karo düzeni. Armatür ve donatı boyutları fotoğraftan yorumlanmıştır.
- Giyinme odası, yatak odaları ve çatı katında plandaki oda sınırlarına göre düzeltilen mobilyalar. Mobilyalar ayrı `30_FURNITURE_PLACEHOLDERS` koleksiyonunda kalır.
- Dışarıda kaynak çatı yüzeyine oturan kiremitler, bölümlü garaj kapısı, baca şapkası, yaprak/iğne ve çim geometrisi; yakın komşu çatılarında da yorumlanmış kiremitler. Bunlar tamamlanmış peyzaj veya komşu cephe rekonstrüksiyonu değildir.
- Fotoğraflarda görülen tiplerde oda armatürleri. Gün ışığı için [Poly Haven Kloofendal gökyüzü](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky) (CC0; Greg Zaal ve Jarod Guest), yer ve saat ölçümü olarak kullanılmadan eklendi. Kaynak/lisans/hash `assets/lighting/source.json` içinde.

İnceleme kameraları, kaydedilen sahneye dokunmadan seçilerek yeniden render edilebilir:

```bash
bash tools/run_blender.sh build/blender/angora21-working.blend --python tools/render_review.py -- --samples 32 --width 1200 01_front 06_master_bedroom 10_main_kitchen
```

Bulut ortamında uzun tek-process render dizisinde gözlenen Cycles beklemesini önlemek için `python tools/render_batch.py --samples 24 --width 1000 01_front 02_pool` her kamerayı ayrı Blender işlemiyle üretir. `ANGORA_BLENDER_DIR` aynı şekilde ayarlanmalıdır. `tools/probe_room_clearances.py` düzeltilmiş beş oda grubunun CAD sınırları dışına taşmasını denetler; bütün oda geometrisinin çarpışma kontrolü değildir. Blender dosyasında Python üretim betiklerinin bir kopyası Text blokları olarak da tutulur.

`docs/demo4-handoff.md`, sonraki web aşaması için okunan DOMVS demo4 kaynaklarını ve uygulanması gereken eşlemeleri kaydeder.

GLB dışa aktarımı fotoğraf dokularını, fiziksel tekrarlı UV'leri, normal ve ORM haritalarını korur. Native Cycles ışığı GLB'ye bake edilmedi. Kiremit ve bitki ayrıntıları mobil için LOD ve draw-call azaltımı gerektirir. Native sahnenin ayrıntı sayısı web performansının kanıtı değildir. `scene-manifest.json` dışındaki eski GLB'ler güncel teslimin parçası değildir.

Salonun yaklaşık 2,80 m ve girişin 3,10 m kotları ayrı korunur; ikisi de kaynak `KAT 1` giriş katı grubundadır. Kat grubu bulunan CAD katmanlarında yalnız yüksekliğe göre yeniden sınıflandırma yapılmaz. Kontroller salon döşemesinin üst bir kapak yüzeyiyle kapanmadığını, garaj kapısının görünürlüğünü ve CAD kat aidiyetini denetler. GLB geri aktarım kontrolü, sınır kutusundaki değişimin 2 cm altında kaldığını kontrol eder; bu, bütün mimari ölçülerin doğrulandığı anlamına gelmez.

## Tamamlanması gereken doğrulama

- Çatı birleşimleri, duvar açıklıkları ve eksik yüzeylerin bütün cephelerde kontrolü.
- Her odanın fotoğraf/plan eşleşmesi, sabit donatı ve mobilya konumlarının kontrolü.
- Bahçe kotları, garaj kapısı/yaklaşımı, havuz ve bitki yerleşiminin fotoğrafla son karşılaştırması.
- Ölçü varlıklarının ilgili odalara bağlanması; doğrulanmış ölçüler için etiket listesi.
- Fotoğrafa göre renk / yüzey ayarı, LOD, draw-call azaltma, mobil/masaüstü performans ölçümü.
- Mahalle → bina → kat → oda satış arayüzü; model doğrulaması tamamlandıktan sonra.

GitHub erişimi açıldı. İlk kod / CAD paketi `3731b873`, PBR haritaları ve kot / asansör / mutfak güncellemesi `b9a1a9d`, ilk tam Blender teslimi `1264289` ile `main` dalına gönderildi. Blender teslimi 27 bağlı kütüphaneyle yeniden açılıp render edilerek kontrol edilir. Kaynak ve bağlı sahnenin nokta sayıları ile düzenlenen nesnelerin konumları `layer-qa.json` içinde karşılaştırılır.

Üretim betikleri tek parça sahnede çalışır; en son `package_blender_layers.py` taşınabilir teslimi üretir. Paketleme öncesi kopya `build/intermediate/angora21-monolithic.blend` altında yerel çalışma ara dosyası olarak tutulur. Bağlı teslimden elle düzenleme için ilgili katman dosyasını açın; ana dosya geometriyi yeniden bağlar.

Son fotoğraf kontrolünde havuz döşemesinin suya taşması ve köşe açıklıkları düzeltildi. Bodrum mutfağına küçük kare karolar ve üç kollu siyah avize eklendi. Eski WC placeholderları asansörle çakıştığı için bodrum WC'si CAD B03 hacmine, giriş WC'si CAD Z03 hacmine alındı. Bodrumdaki sabit donatılar beş fotoğrafa göre yeniden kuruldu. `check_lift_fixture_clearance.py`, üç durakta kabin hacmine taşan başka donatı / mobilya bulunmadığını denetler.

`build/room-review-register.json`, 202 fotoğrafın 17 kaynak grubu üzerinden kontrol sırasını ve açık işleri kaydeder. Bazı gruplar birden fazla oda içerir; grup sayısı tamamlanmış oda sayısı değildir. Henüz hiçbir hacim fotoğraf eşleşmesi açısından nihai onaylı sayılmaz.
