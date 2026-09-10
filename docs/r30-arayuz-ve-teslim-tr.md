# Angora — R30 arayüz, render ve teslim paketi

10 Eylül 2026. Taban: R29 (`53b0cd0`). Bu paket **ihtiyaç raporundaki 3B model
dışı** maddeleri ele alır. Blender, GLB, navigasyon ve mimari kaynakları
değişmedi; `build/` altındaki hiçbir model dosyasına dokunulmadı.

`Kodda uygulanmış`, `otomatik kontrolden geçmiş` ve `görsel olarak kabul
edilmiş` ayrı durumlardır. Aşağıda hangisinin geçerli olduğu ayrıca yazılmıştır.

## Bu pakette değişenler

| # | Konu | Dosyalar |
|---|---|---|
| 1 | Tek sıcak pikselin bloom ile bloğa yayılması | `linear-bloom.js`, `render-profile.js` |
| 2 | Damgasız iki model isteğinin doğrulanması | `main.js` |
| 3 | Ölü bundle'ların birikmesi | `scripts/stage-pages.mjs` |
| 4 | Gerçek indirme ilerlemesi | `main.js`, `index.html`, `style.css` |
| 5 | Görünümün bağlantı olarak paylaşılması | `share-state.js` (yeni), `main.js` |
| 6 | Sekme simgesi ve bağlantı önizlemesi | `public/favicon.svg`, `public/apple-touch-icon.png`, `index.html`, `scripts/stage-pages.mjs` |
| 7 | Işık motorunun EDETRI referansıyla eşitlenmesi | `lighting.js`, `render-profile.js`, `display-dither.js` (yeni), `postprocessing.js` |
| 8 | Oda etiketlerinin boyutu, konumu ve gösterdiği ölçü | `annotations.js`, `room-areas.js` (yeni), `style.css`, `property-info.js`, `main.js` |
| 9 | Gökyüzünün arka plan olarak gösterilmesi | `lighting.js`, `main.js` |
| 10 | Atmosferik derinlik | `lighting.js` |
| 11 | Grade aşaması | `grade-pass.js` (yeni), `lighting.js` |

**Model tarafına dokunulmadı.** Bu paketin tamamı `viewer/src` içindedir; hiçbir
GLB, manifest, `build/` çıktısı, `.blend` veya `.dwg` değişmemiştir. Model ayrıca
geliştirildiğinde bu işlerin hiçbiri tekrarlanmaz.

### 1. Bloom bloğu (I55 / I60)

1280×900 yakın çevre görünümünde arazinin üzerinde 89×93 px **dolu siyah
dikdörtgen** çiziliyordu. Geometri, HTML katmanı veya model değil: bloom pass'i
kapatılınca kayboluyor, SMAA kapatılınca duruyor, 640×460'ta hiç oluşmuyor.

Sahne half-float tampona çiziliyor, bu yüzden çok sıcak tek örnek `Inf` olarak
saklanıyor. Bloom extract'ındaki soft-knee ağırlığı parlaklığa bölüyor, `Inf/Inf`
`NaN` oluyor ve bulanıklaştırma **ayrılabilir** olduğu için o tek örnek önce bir
satır, sonra bir sütun boyunca yayılıyor — eksen hizalı bir blok.

Pass'teki her tampon okuması artık `finiteRgb()` üzerinden geçiyor: `equal(c,c)`
yalnızca `NaN` için yanlış olduğundan o örnekler sıfırlanıyor, `bloomClamp` ise
`Inf` ve aşırı örnekleri sonlu bir düzeyde tutuyor. Sınır **64**; 0,75 pozlama
sonrası olağan parlamaların çok üzerinde, dolayısıyla gerçek parlama değişmiyor,
ama tek bozuk örneğin kareyi doldurmasına yetmeyecek kadar düşük.

**Açık kalan:** bloom kapalıyken aynı noktada **~2 px'lik parlak bir örnek**
duruyor. Bu sahnenin kendi kaynak değeri, render yolu değil; I55/I56 yüzey ve
malzeme çalışmasına aittir.

### 2–3. Teslim bütünlüğü (I65)

Bundle adı içerik hash'i taşıyor, model dosyaları taşımıyor. Yükleyicinin büyük
kısmı bunu zaten doğru çözüyordu: manifest `cache:'no-cache'` ile alınıyor ve
manifest'in listelediği her dosya kendi sha256'sından `?v=` ile isteniyor. İki
istek dışarıda kalmıştı:

- `site-context.json` manifest'te yer almadığı için düz isteniyordu. R27'de
  gelen yeni bir dosya olduğundan dönen ziyaretçi yeni bundle'ı eski yerleşimle
  eşleştirebilirdi.
- WebGL hata yolundaki `rooms.json` isteği, render hiç başlamadığı için
  damgalanacak bir manifest hash'ine sahip değil.

İkisi de artık doğrulanıyor. `stage-pages.mjs` ise `web-assets/` içine
temizlemeden kopyalıyordu; 2 dosya sunulurken **19 dosya** birikmişti, en
eskileri R26 öncesinden. Dizin artık birleştirilmiyor, değiştiriliyor.

### 4. Yükleme ilerlemesi (I11)

Sahne yedi dosyada ~38 MB. Durum satırı yalnızca biten dosyayı sayıyordu, bu
yüzden 9 MB'lık bir indirme boyunca "1/7"de duruyordu. Manifest'teki `bytes`
alanı artık payda: GLTFLoader ilerleme olayları varlık başına toplanıyor, oran
ince bir çubuk ve yanındaki yüzde olarak çiziliyor. Sıkıştırılmış yanıt
manifest'ten az bayt bildirdiği için manifest boyutu her parçayı ayrıca
sınırlıyor.

Yüzde ve çubuk `aria-hidden`; canlı bölgeye giden metin kaba dosya sayımında
kalıyor, aksi hâlde ekran okuyucu her tikte yüzdeyi okurdu.

### 5. Paylaşılabilir bağlantı (I09 / U10)

Görünüm, saat, mevsim ve ışık stili sorgu dizesinde tutuluyor; bağlantı bu
durumu ilk kare çizilmeden önce geri yüklüyor. `bindInterface()` `setup()`'tan
önce çalıştığı için paylaşılan değerleri kontroller taşıyor ve ışık açılış
durumunu onlardan okuyor.

Yalnızca açılış görünümünden **farklı** olanlar yazılıyor, dolayısıyla olağan
durumda adres temiz kalıyor (`?view=f2`) ve varsayılana dönüldüğünde sorgu
siliniyor. Her değer kendi kontrolünün sunduğu kümeye karşı doğrulanıyor: elle
düzenlenmiş bir bağlantı, arayüzün kendi başına ulaşamayacağı bir duruma
sokamaz.

### 6. Simge ve önizleme

Sayfanın simgesi yoktu; her ziyaret `/favicon.ico` için 404 ile bitiyordu.
`favicon.svg` 16 px'e kadar okunur, `apple-touch-icon.png` aynı işin 180'lik
hâli. İkisi de `viewer/public` altında tek kaynak; pages derlemesi public
dizinini atladığı için `stage-pages` bunları site köküne taşıyor.

Bağlantı kartı için 1200×630'luk kapak görüntüleyicinin kendisinden alınıyor
(arayüz gizli, villa kadrajı, 132 KB JPEG) ve ikonlarla aynı yerden köke
taşınıyor. `og:image` **göreli** verildi: kartın mutlak URL istediği doğru, ama
bu dağıtımın kanonik alan adı depoda tanımlı değil ve yanlış bir mutlak adres
göreliden kötüdür. Başlıca tarayıcı/uygulama önizlemeleri göreliyi çözer; alan
adı netleştiğinde tek satırlık değişiklik.

### 7. Işık motoru (I54–I59)

Referans: `decentralize-dfw/virtuallyeverafter`, `edetri/web`. Sahnenin çiğ
durmasının motor tarafındaki üç sebebi bulundu ve üçü de referansın kendi
gerekçesiyle giderildi.

**Örtüşme (occlusion).** Referansın `post.js` başlığı bunu doğrudan yazıyor:
görüntü tabanlı ışık her yönden aynı anda geldiği için, örtüşme olmadan her
kırışık, iki yüzeyin birleştiği her yer ve her çıkıntının altı, yanındaki açık
zeminle **tam olarak aynı** ışığı alır; hiçbir şeyin çukuru olmaz. Dosya bunu
"ucuz 3B"nin en büyük ele vereni sayıyor ve hiçbir yeniden ışıklandırmanın
düzeltmeyeceğini söylüyor.

Angora `aoEnabled:false` değerini bu referanstan almış, ama **gerekçesini
almamış**. EDETRI GTAO'yu kapatıyor çünkü kendi beyaz siklorama odasında
ekran-uzayı örtüşmesi kir gibi okunuyordu — hiç çukuru olmayan bir oda. Villa
ise baştan aşağı çukur: saçaklar, pencere nişleri, balkonlar, merdiven basamağı,
her duvar-döşeme birleşimi. Referansın kapatma gerekçesi burada geçerli değil;
"en büyük ele veren" demesinin gerekçesi geçerli.

Pass zaten yazılmıştı (kesit düzlemi, cam ve sprite hariç tutma, mobil çözünürlük
ölçeği) — yalnızca kapalıydı ve şiddeti 0,2'ye kısılmıştı. Artık referansın kendi
sayılarıyla çalışıyor: yarıçap 0,28 m, distanceExponent 1, thickness 1,
scale 1,05, 12 örnek, distanceFallOff 1, karışım 0,8. Yarıçap dünya metresidir ve
referans önemine dikkat çekiyor: fazla büyük olursa örtüşme çukurları
tanımlamayı bırakıp bütün nesneyi gölgeler ve kir gibi görünür. Önceki 0,55 m bir
pencere nişinin ölçeği değildi. Bölge görünümünde kapalı kalır.

**Ortamın zemini.** Probe'un zemini yoktu. Hem prosedürel gökyüzü hem onun
yerine geçen puresky HDR yalnızca gökyüzüdür, dolayısıyla ortamın **alt
yarıküresi de gökyüzüydü**: her saçak altı, balkon altı ve pencere nişi üstten
ve alttan ikinci bir gökyüzüyle aydınlanıyordu, cam da onu yansıtıyordu. Stüdyo
probe'una tam bu yüzden bir zemin konur — üstünde duran her şeyin altını dolduran
şey odur. Probe artık bir zemin taşıyor ve HDR de doğrudan sahneye değil aynı
probe'dan geçiyor: kubbeyi HDR, altındaki zemini probe veriyor.

Seviye göze göre seçilmedi: L ışıması olan bir gökyüzü için düz zemine ulaşan
ışınım PI·L'dir ve zeminden albedo·L olarak ayrılır, dolayısıyla panel sahanın
kendi albedosunun gökyüzünün kendi seviyesinde ışıksız çizilmiş hâlidir. Alt
yüzeyler bir miktar **koyulaşır** ve gökyüzünün değil zeminin renginde olur; bu
doğru yöndür — %20 albedolu bir yüzey ikinci bir gökyüzü değildir.

**Dither.** Çıkış dither'sızdı. Zemin ve gökyüzü, karenin neredeyse tamamına
yayılan ve yalnızca birkaç 8-bit seviyeye sığan birer gradyandır; bantlanan durum
tam olarak budur. Ölçüldü: bir çim satırı 140 pikselde **dört düz basamağa**
düşüyordu. Referans zincirini bunun için bir seviye düzenli gürültüyle bitiriyor
ve bu gürültü **yalnızca çıkarır**, çünkü simetrik bir dither o noktada bir kanalı
255'e itebilecek tek şeydir ve önündeki eğri bilerek sınırlıdır. Aynı shader artık
son pass olarak, referansın koyduğu yerde — eğriden sonra, görüntü uzayında —
çalışıyor.

### 8. Oda etiketleri (I05 / I07 / I09)

Etiketler tanıttıkları şeyin üzerini örtüyordu: 19 px'e kadar çıkan iki satırlık
kart, 38 px taban, 360 rozetine ayrılmış oluk ve her oda adının altında
**"Alan doğrulanıyor"**.

O metin bir ölçü değil, bir durumdu ve 27 odanın hepsinde görünüyordu çünkü
**hiçbirinin alanı yok**. `rooms.json` sebebini kendi notunda yazıyor: oda
bölmeleri doğrulanmamıştır ve bileşenden odaya otomatik alan ataması yapılmaz;
kat değerleri de net kullanım alanı değil, kaplama izdüşümüdür. Sınırlayıcı
kutudan alan türetip m² diye yazmak ölçü uydurmak olurdu — kaynağın özellikle
kaçındığı tek şey budur.

Etiket artık **kayıtlı olanı** taşıyor: odanın DWG açıklığı, ölçü tutamağı,
tanık noktaları ve çizimdeki ölçülmüş uzunluğuyla izlenebilir hâlde. 27 odanın
22'sinde var; kalanlar dolgu metin yerine hiçbir şey göstermiyor. m² dalı yerinde
duruyor: gerçek oda sınırları geldiği anda her etiket kendiliğinden ona geçer.

Boyutta 44 px'lik dikdörtgen **korundu**. Etiket yerleşimi çakışmayı önlemek için
gerçek ekran kutusunu ayırır; küçültmek iki dokunma hedefinin üst üste binmesine
ve dokunuşun yanlış odaya gitmesine yol açardı. Küçülen şey mürekkep: düğme artık
boş bir 44 px yuva, boyalı kart onun ortasında ve kendi metni kadar. Rozet adın
peşi yerine ölçünün satırını paylaşıyor, böylece uzun ad kırpılmadan önce tam
genişliği kullanıyor. Yazı 14–19 px yerine 12–14 px.

## Kontroller

| Kontrol | Sonuç |
|---|---|
| `npm test` | **41/41 geçti.** R29'daki 35 kontrole 6 yeni kontrol eklendi: bloom koruması, varlık tazeliği (2), paylaşım durumu (3) |
| Bloom bloğu | Headless Chromium 1280×900: blok **8277 pikselden sıfıra** indi; bloom hâlâ çalışıyor (bloom kapalı render'la fark önceki paketle aynı düzeyde) |
| Yayın yerleşimi | Kök dizin sunulduğunda **0 başarısız istek, 0 konsol hatası**; her GLB ve manifest dosyası `?v=` taşıyor; `web-assets` tam olarak `index.html`'in çağırdığı 2 dosyayı içeriyor |
| Yükleme çubuğu | 20 Mbit kısıtlamada %1 → %11 → %26 → %41 → %56 → %70 → %85 → %100; canlı bölge yedi adımda kalıyor |
| Paylaşım bağlantısı | `?view=f3&hour=9&season=355&light=sun` çatı katını 09:00'da kış mevsimi ve doğrudan güneşle açıyor; kat değişince adres güncelleniyor; varsayılana dönünce sorgu siliniyor |
| Örtüşme | Villa görünümünde saçak altlarında, duvar-çatı birleşimlerinde, havuz kenarında ve çit/ağaç diplerinde temas gölgesi belirdi; aynı kare önceden düzdü |
| Dither | Ölçülen çim satırı 3 sert basamaktan 60 küçük geçişe çıktı; ortalama parlaklık 0,48/255 kaydı — tek yönlü yarım seviye, yani ikinci bir renk dönüşümü de olmadı |
| Oda etiketi | 1. katta sekiz odanın hepsi kendi odasının üstünde, cetveldeki m² ile, 10 px yazı ve 33 px kartla — 19 px'e kadar çıkan beş kartın planı kapattığı yerde |
| Gökyüzü | Bölge fonu (240,240,240) düz beyazdan (226,227,227)'ye indi; bölge, yakın çevre, villa ve iç mekân oda turu konsol hatasız |
| Grade | Villa karesi genelde 2 seviye kayıyor, renk bozulmuyor (ikinci bir kodlama yok); merkez +2,2 alırken köşeler tutuyor ya da 0,6 veriyor — vinyet tam da yapması gerekeni yapıyor |

Bu kontroller **yazılımsal WebGL (SwiftShader)** üzerinde yapılmıştır. Gerçek
GPU görünümü, fiziksel telefon performansı ve XR kabulü bu pakette **alınmadı**;
I60, I62 ve I63 açık kalmaya devam ediyor.

### 9–11. Çiğliğin motor tarafında kalan üç sebebi

Bunlar ihtiyaç raporunda ayrı madde değildi; motorun kendi katmanındadır.

**Gökyüzü gösterilmiyordu.** Prosedürel `Sky` kuruluyor, probe'a veriliyor ve
**atılıyordu**; arkasındaki arka plan düz bir dolguydu. Yani saatle birlikte
değişen tek şey — gökyüzü — hiç gösterilmeyen şeydi. Artık korunuyor ve güneş
her hareket ettiğinde küçük bir küpe yeniden çiziliyor (arkasında geometri
olmayan bir shader'ın 6 × 256 px yüzü), arka plan da o küp.

Ölçeklenmesi gerekti: Sky shader'ının ışıması bu hattın pozladığı aralığın çok
üstünde, dolayısıyla ölçeksiz hâlde eğriye zaten doymuş geliyor ve içinde mavi
kalmamış düz beyaz olarak iniyordu — bütün fon boyunca ölçülen değer
(240,240,240). `backgroundIntensity` 0,55'te fon (226,227,227) oluyor; elle
seçilmiş eski düz rengin bulunduğu yer. Üst gökyüzü kendi aralığını koruyor.

Ufuk rengi duruyor, çünkü zaten yalnızca arka plan değildi: zemin kenarında
dikişi gizlemek için o renge karışıyor ve o shader onu uniform olarak okuyor.
Artık mesafeyi de o besliyor.

**Mesafe yoktu.** Uzaktaki her bina, önündekiler kadar doygun ve kontrastlı
geliyordu; bir yerleşimi yer değil maket gibi gösteren şey budur. Aynı ufuk
rengine doğru üstel pus artık derinliği taşıyor. Bu bir sunum aracıdır ve kod
bunu yazar — gerçek hava 300 m'de neredeyse hiçbir şey almaz — bu yüzden
yoğunluk görüne göre ayarlanır: yakın çevrede yakını uzaktan ayıracak kadar,
bölgede yerleşim erimesin diye geri çekilmiş, iç mekânda ihmal edilebilir
(10 m'de %0,03).

**Şekillendirecek yer yoktu.** Zincir çıplak bir çıkış pass'i ile bitiyordu:
pozlama ve eğri, başka hiçbir şey. Referans bunun yerini açıkça söylüyor: grade
ve vinyet **eğriden önce ve hâlâ lineerde** olur. Referansın kendi eski derlemesi
bunları çıkış pass'inden sonra, ekran uzayında çalıştırmış ve sonuç kırpılmasın
diye arkasına ikinci bir yumuşak omuz eklemek zorunda kalmış. Eğrinin önünde
buna gerek yok — bu üçü değeri ne yaparsa yapsın, eğrinin hâlâ tepesi yoktur.
Sıra artık doğrudan shader gövdesine karşı test ediliyor.

Gönderilen değerler ölçülü ve referansın kendi altı ışık rig'inin kullandığı
aralığın içinde (doygunluk 0,94–1,06, gain 0,90–1,05, lift 0,014'e kadar):
gölgelerde açık gökyüzünün doldurduğu yere biraz serin, parlaklarda güneşin
olduğu yere biraz sıcak, ve render'ın yıkanmış görünmesini kesecek kadar
doygunluk. Grain kapalı. Vinyet referansın kendi geometrisiyle, aralığının onda
biri güçte ve yalnızca aşağı çarpabilir. Tek dosya, her değer ayrı: bu bir
kadran, hatta pişirilmiş bir bakış değil.

**Açık kalan:** bloom bloğunu doğuran ~2 px'lik sıcak örnek hâlâ sahnede
(bkz. bölüm 1). Malzemelerin dokusuz ve düz durması bu listeye dahil değildir:
o I56'dır, model tarafındadır ve ayrıca yürütülmektedir.

## Bu pakette kapanmayanlar

- Yukarıdaki ~2 px'lik sahne örneği (I55/I56).
- I03: plan modunda dönüş kilidi hâlâ yok — `enableRotate` kod tabanında hiç
  kullanılmıyor, `planMode` yalnızca kamera polar açısını `.12`'ye çekiyor.
  Ayrıca `frame()` `collectUIObstacles()` çağırmıyor, yani kamera kadrajı açık
  panelleri hesaba katmıyor (etiketler katıyor).
- I05: sığmayan etiketin gizlenmesi hâlâ geçerli. Bu bir hata değil, R28'de
  bilerek eklenmiş davranış; I05 tersini istiyor ve uygulamadan önce karar
  gerekiyor (kenara taşıma + kılavuz çizgi mi, gizleme mi).

## R39 · Çevre binaları, garaj aracı ve teslim boyutu

### Çevre binalarında iki okuma — tek geometri, tek indirme

İstenen: yakın çevrede binalar bugünkü gibi kalsın, yakın Villa görünümünde
bembeyaz olsun, aradaki geçiş yumuşak olsun.

İki ayrı GLB yerine **tek geometri, iki gölgelendirme** yapıldı. Sebebi ölçüm:
`context.glb` 14,3 MB'dir; ikinci bir kütle modeli indirmeyi büyütür, iki model
arasında geçiş de kaçınılmaz olarak bir sıçrama üretir. Bunun yerine komşu
bloklara ait malzemelere tek bir paylaşılan `massingBlend` uniform'u bağlandı:

- `0` — bugünkü fotoğrafik okuma (yakın çevre ve bölge).
- `1` — beyaz kütle modeli (Villa ve kat kesitleri).

Karışım gölgelendiricide, **ışıktan önce** albedo üzerinde yapılıyor
(`color_fragment`); pürüzlülük 0,86'ya, metallik 0'a, normal haritası da
geometrik normale doğru aynı uniform'la yumuşatılıyor. Böylece beyaz kütle düz
bir siluet değil, güneşin, gökyüzü probunun ve AO geçişinin okumaya devam ettiği
bir hacim olarak kalıyor. Geçiş 900 ms, `smoothstep`; tek uniform olduğu için
bütün bloklar bantlar hâlinde değil birlikte dönüyor. `prefers-reduced-motion`
açıkken anında geçiyor.

**Kaldırım tuzağı.** `stone_tile` hem komşu blokların kat döşemesi hem de yol
kaldırımlarıdır (`CAD curb edges`). Malzeme adına göre beyazlatmak kaldırımları
da beyaza çevirirdi. Bu yüzden geometri, batch'lemeden **önce**, düğüm adına göre
ikiye ayrılıyor (`B10 | KAT 0$ZEMİN` bina, `CAD curb edges` saha) ve yalnızca iki
tarafın da kullandığı malzemeler kopyalanıyor. `context.glb` için bu, 19 malzeme
kümesine tek bir kopya ekliyor.

**Yükleyicinin düğüm adlarını değiştirmesi.** İlk uygulama hiçbir binayı
yakalamadı ve Villa görünümü olduğu gibi kaldı: `GLTFLoader` düğüm adlarını
içeri alırken boşlukları `_` yapıyor, `[].:/`'yi atıyor ve tekrar eden adlara
`_2` ekliyor. Yani sahnede ad `B10 | KAT 0$DUVAR` değil `B10_|_KAT_0$DUVAR`
oluyor. Eşleşme artık adı geri çevirerek yapılıyor; teslim edilen dosyalara
karşı doğrulandı: `context.glb` içinde **2010 bina düğümü** (11 malzeme, 497
saha düğümü dışarıda), `level-1.glb` içinde **97 araç düğümü** (23 malzeme).
Testi `PropertyBinding.sanitizeNodeName` ile yazıldı, yoksa aynı hata sessizce
geri gelir.

### Eş malzemelerin birleştirilmesi — ölçülen sayı

"Aynı olanlar tek malzeme olsun" isteği, adı değil **değeri** karşılaştıran bir
imza ile motora alındı: renk, pürüzlülük, metallik, opaklık, taraf, normal
ölçeği ve sekiz doku yuvasının kimliği. Teslim edilen dosyalarda ölçülen sonuç:

| Dosya | Malzeme | Değer olarak eş grup |
|---|---|---|
| context.glb | 19 | yok |
| garden.glb | 27 | 3 (`cut limestone edge` ×2, `garden cream limestone` ×2, `black forged garden iron` ×3) |
| level-1.glb | 74 | 1 (`Paint 1 Carmine` = `Paint 2 Carmine`) |
| diğerleri | 47/68/33/15 | yok |

Yani `context.glb` içindeki 19 çevre malzemesi bugün zaten teklidir; çoğaltma
garden ve level-1 tarafındadır ve orada 4 grup birleşiyor. Birleştirme motorda
durduğu için, modelin bir sonraki dışa aktarımı kaç kopya getirirse getirsin
aynı geçiş onları da toplayacak — elle tekrar yapılacak bir iş kalmıyor.

### Garaj aracı — tek soyut baz

`R35 | Garage vehicle` 17 ayrı yüzeyle geliyordu (iki boya, jantlar, frenler,
lastikler, cam, iç döşeme). Sahnede bir sahne aracı olduğu için hepsi tek bir
nötr baz malzemeye indirildi (`#9ea3a8`, pürüzlülük 0,45, metallik 0,12).
Çevresindeki garaj kendi yüzeylerini koruyor.

### R39 yüzey adı değişikliğinin sessizce kapattığı ufuk geçişi

R39 saha yüzeylerini yeniden adlandırmış: `grass` → `R31 | R39 continuous grass
ground`, `asphalt` → `R31 | R37 fine asphalt aggregate`. `prepareContextSurfaces`
adları tam eşitlikle arıyordu, dolayısıyla zemin normali yumuşatması ve ufuk
karartması **tamamen devre dışı kalmıştı**. Eşleşme aileye göre yapıldı; testle
sabitlendi.

### "45 MB hâlâ çok" — ölçüm

Araba değil. Ölçülen dağılım:

| | Üçgen | Boyut |
|---|---|---|
| Garaj aracı (level-1 içinde) | 213 341 | ~0,9 MB (%2) |
| `context.glb` | 1 541 556 | 14,3 MB |
| `garden.glb` | 1 123 286 | 12,6 MB |
| Kalan altı dosya | 2 762 210 | 13,3 MB |

Teslimin **41 MB'ı geometri, 1,2 MB'ı doku**. Dokular WebP/1K'ya inmiş durumda;
mobil için 256 px'e indirmek toplamı yalnızca %2,4 küçültüyor, çünkü ağırlık
dokuda değil. Ağırlığın çoğu bitki örtüsü geometrisidir: `stone_tile` 536 842,
`foliage` 516 880, `needle_dark` 307 042, `grass deep blade` 221 905 üçgen.

Bu pakette **modele dokunmadan** yapılan iki ölçüm ve bir kazanç:

- Draco nicemlemesi sıkılaştırıldı: konum 14 bit korunarak normal 10→8 bit,
  UV 12 bit. **44,2 MB → 40,2 MB (%9)**, görüntüde fark yok, düğüm/malzeme/
  üçgen sayıları birebir aynı (parite testiyle doğrulandı). UV'yi 10 bite
  indirmek 1,6 MB daha kazandırıyor ama döşenmiş dokularda kayma riski taşıdığı
  için alınmadı.
- `weld` + `dedup`: kazanç %0,3. Geometri zaten kaynaşmış ve tekil.
- Komşu blokların iç döşemeleri (244 düğüm, görünmeyen) silinseydi kazanç
  yalnızca 0,42 MB olurdu; bu döşemeler örneklenmiş (12 mesh, 244 düğüm), yani
  dosyada yer kaplamıyorlar. Karşılığında camdan bakışta boşluk riski var,
  yapılmadı.

**Karar bekleyen tek gerçek kaldıraç:** bitki geometrisinin sadeleştirilmesi.
`garden.glb` + `context.glb` için %50 sadeleştirme teslimi ~40 MB'dan ~27 MB'a
indirir; bu modelin görünümünü değiştirir, o yüzden istenmeden yapılmadı.

## Ek: DWG doğrudan okundu — metrekare orada yok

`ANGORA-.dwg` (AC1021, AutoCAD 2007 binary) bu oturumda **doğrudan okundu**.
Ortamda dönüştürücü yoktu (apt depoları proxy tarafından engelli, PyPI'da DWG
okuyucu yok, metin bölümleri sıkıştırılmış olduğundan ham tarama da sonuç
vermiyor), bu yüzden LibreDWG 0.13.3 kaynaktan derlenip `dwgread` ile çizim
JSON'a çevrildi: 159.409 model-uzayı varlığı, 10.117 metin, 125 katman.

**Oda metrekaresi çizimde yok.** Arandı ve bulunamadı:

- `2D$M2` katmanında **hiç metin yok** (yalnızca 19 eğri).
- Mahal listesi / alan tablosu yok: "MAHAL", "METRAJ", "BRÜT", "NET" aramaları
  oda alanına ait hiçbir kayıt döndürmüyor.
- Alan biçiminde tek metin vaziyet planına ait ve yerleşim ölçeğinde:
  *"TOPLAM İLAVE İNŞAAT ALANI: 48.74 M2"* ve buna bağlı "… NOLU KONUTTA GİRİŞİN
  ÖNE ALINMASINDAN DOLAYI İLAVE İNŞAAT ALANI …" satırları.
- Çıplak ondalık metinlerin tamamı (948 adet) `2D$ROL_CEPHE` / `2D$ROL_DIK`
  katmanlarında, yani cephe/düşey rölöve kotları — alan değil.

Dolayısıyla mal sahibinin verdiği oda cetveli DWG metninden **üretilemez** ve
DWG'ye karşı doğrulanamaz. `viewer/src/room-areas.js` bu yüzden tek kaynak
olarak kalıyor.

**Ekrandaki 35 ölçünün tamamı DWG'de var.** Değer ve konum eşleşmesiyle 30'u
doğrudan bulundu; kalan 5'i (8,40 / 8,40 / 7,60 / 8,15 / 6,70 m) uzun açıklıklar
olduğu için konum eşiğini aşamadı ama değer olarak çizimde mevcut.

**Ancak `source_dimension_handle` çizime karşı çözülemiyor.** `rooms.json` her
ölçü için bir tutamak yazıyor (ör. `2C304` = 180.996), fakat DWG'nin ölçü
tutamakları ~14.000–54.000 aralığında. Bu numaralar DWG'nin değil, boru hattının
okuduğu **DXF dönüşümünün** tutamaklarıdır; dönüşüm yeniden numaralandırmış.
İzlenebilirlik iddiası göründüğünden zayıf: doğrulama değer ve konumla yapılabilir,
tutamakla yapılamaz.

**Etiket çapaları zaten kaynakla uyumlu.** `plan-registration.json` dönüşümü
(ölçek 0,01, kat başına öteleme) uygulandığında CAD'deki oda adı konumları ile
modeldeki konumlar 0,17–1,0 m içinde örtüşüyor (Z01 0,17 m, 103 ve 104 0,22 m).
Yani çapa tarafında çizimden alınacak bir kazanç yok; etiketlerin merkeze
oturtulması için yapılan değişiklik yeterli.

**Çizimdeki oda adları modelden farklı.** Karar gerektirir, bu pakette
değiştirilmedi:

| Kod | DWG | Modelde / ekranda |
|---|---|---|
| B02 | DEPO (ve ODA) | Oda |
| B05 | HOBİ ODASI | Mutfak |
| B06 | HOBİ ODASI | Bahçe salonu |
| B03 | BANYO | modelde bu kod yok (model B10 kullanıyor) |
| Z01 | RÜZGARLIK | Giriş |
| Z05 | YEMEK ODASI | Yemek alanı |
| 103 | SOYUNMA | Giyinme odası |
| C04 | ÇATI ARASI KULLANIMI | Yatak odası |
| B07, Z09 | TERAS | modelde yok |
| Z10, 109, 110 | BALKON | modelde yok |

Bu, mal sahibinin cetvelindeki iki belirsizliği de aydınlatıyor: çizimde **DEPO
bodrumdadır (B02)**, zemin kattaki Z08 ise gerçekten TESİSAT ODASI'dır; ve
bodrumda "müştemilat/misafir evi" diye adlandırılmış bir mahal yoktur — çizim
orada iki HOBİ ODASI ve bir ODA gösterir.
