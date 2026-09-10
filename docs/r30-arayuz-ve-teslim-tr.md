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

`og:image` bilerek eklenmedi: mutlak URL gerektiriyor ve bu dağıtımın kanonik
alan adı depoda tanımlı değil.

## Kontroller

| Kontrol | Sonuç |
|---|---|
| `npm test` | **41/41 geçti.** R29'daki 35 kontrole 6 yeni kontrol eklendi: bloom koruması, varlık tazeliği (2), paylaşım durumu (3) |
| Bloom bloğu | Headless Chromium 1280×900: blok **8277 pikselden sıfıra** indi; bloom hâlâ çalışıyor (bloom kapalı render'la fark önceki paketle aynı düzeyde) |
| Yayın yerleşimi | Kök dizin sunulduğunda **0 başarısız istek, 0 konsol hatası**; her GLB ve manifest dosyası `?v=` taşıyor; `web-assets` tam olarak `index.html`'in çağırdığı 2 dosyayı içeriyor |
| Yükleme çubuğu | 20 Mbit kısıtlamada %1 → %11 → %26 → %41 → %56 → %70 → %85 → %100; canlı bölge yedi adımda kalıyor |
| Paylaşım bağlantısı | `?view=f3&hour=9&season=355&light=sun` çatı katını 09:00'da kış mevsimi ve doğrudan güneşle açıyor; kat değişince adres güncelleniyor; varsayılana dönünce sorgu siliniyor |

Bu kontroller **yazılımsal WebGL (SwiftShader)** üzerinde yapılmıştır. Gerçek
GPU görünümü, fiziksel telefon performansı ve XR kabulü bu pakette **alınmadı**;
I60, I62 ve I63 açık kalmaya devam ediyor.

## Bu pakette kapanmayanlar

- Yukarıdaki ~2 px'lik sahne örneği (I55/I56).
- I03: plan modunda dönüş kilidi hâlâ yok — `enableRotate` kod tabanında hiç
  kullanılmıyor, `planMode` yalnızca kamera polar açısını `.12`'ye çekiyor.
  Ayrıca `frame()` `collectUIObstacles()` çağırmıyor, yani kamera kadrajı açık
  panelleri hesaba katmıyor (etiketler katıyor).
- I05: sığmayan etiketin gizlenmesi hâlâ geçerli. Bu bir hata değil, R28'de
  bilerek eklenmiş davranış; I05 tersini istiyor ve uygulamadan önce karar
  gerekiyor (kenara taşıma + kılavuz çizgi mi, gizleme mi).
