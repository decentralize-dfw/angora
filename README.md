# Angora 21 — MERGVS villa

Kaynak: `ANGORA-.dwg` ve bu depodaki oda / drone fotoğrafları. Hedef, master plandaki **21 numaralı bina**; bu numara tapu ada/parsel numarası değildir.

## 3D inceleme arayüzü

[Angora 21 — çevre, bina ve kat görünümü](https://angora-21-viewer.x-8d31.chatgpt.site)

Çevre, bina/bahçe, bodrum, giriş, birinci ve çatı katı seçilebilir. Katlar kendi
döşeme kotundan **+1,60 m** kesilir. Sabit yükseklikte döndürme, yatay kaydırma,
yakınlaştırma ve ortalama vardır. Tek parmak döndürür; iki parmak kaydırır ve
yakınlaştırır. `Kaydır` düğmesi tek parmakla kaydırmayı da açar.

Kaynak kod `viewer/`, türetilmiş modeller `build/web/` altındadır. Uygulama
başlangıçta GitHub main model listesini kontrol eder; bağlantı kesilirse
paketlenmiş modelleri kullanır. Model dosyaları ve kesit yükseklikleri, gerçek
OrbitControls üzerinde dokunma olayları ve sabit kamera yüksekliği kontrol
edildi. Bu oturumda tarayıcı önizleme hizmeti açılamadığı için gerçek cihaz
görsel/performance testi henüz tamamlanmadı.

Giriş mutfağındaki son model düzeltmesini uygulayıp bağlı dosyaları ve kat
görünümünü yenilemek için: `python tools/apply_kitchen_review_to_delivery.py`.
Cloud Blender dizini `ANGORA_BLENDER_DIR` ile seçilir. Yalnızca web modellerini
yenilemek için Blender içinde `tools/export_web_viewer.py` çalıştırılır;
`--views floor-1` yalnız giriş katını günceller. Ardından
`python tools/sync_web_viewer.py` ile uygulamadaki model kopyaları eşitlenir.

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

Son fotoğraf kontrolünde havuz döşemesinin suya taşması ve köşe açıklıkları düzeltildi. Bodrum mutfağına küçük kare karolar ve üç kollu siyah avize eklendi. Eski WC placeholderları asansörle çakıştığı için bodrum WC'si CAD B03 hacmine, giriş WC'si CAD Z03 hacmine alındı. Bodrumdaki sabit donatılar beş fotoğrafa göre yeniden kuruldu. `check_lift_fixture_clearance.py`, dört durakta kabin hacmine taşan başka donatı / mobilya bulunmadığını denetler.

`build/room-review-register.json`, 202 fotoğrafın 17 kaynak grubu üzerinden kontrol sırasını ve açık işleri kaydeder. Bazı gruplar birden fazla oda içerir; grup sayısı tamamlanmış oda sayısı değildir. Henüz hiçbir hacim fotoğraf eşleşmesi açısından nihai onaylı sayılmaz.
