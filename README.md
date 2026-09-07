# Angora 21 — MERGVS villa

Kaynak: `ANGORA-.dwg` ve bu depodaki oda / drone fotoğrafları. Hedef, master plandaki **21 numaralı bina**; bu numara tapu ada/parsel numarası değildir.

## Çalışma durumu

DWG'den katmanlı Blender sahnesi yeniden kuruldu. **Çalışma / kontrol sürümüdür; bitmiş satış demosu veya birebir doğrulanmış nihai model değildir.** Kaynak çizgileri ve üretilen yüzeyler ayrı tutulur. Fotoğrafa göre eklenen parçalar kendi kanıt durumlarını taşır.

1. Kaynak geometriyi ve özgün katman adlarını koruyarak aktarım.
2. Mimari yüzeyler, açıklıklar, fotoğraf malzemeleri ve ayrı mobilya koleksiyonu.
3. Master plana oturan bahçe ve komşu kütleleri; fotoğraftan çıkarılan ayrıntılarda kaynak / tahmin kaydı.
4. Oda bazında görsel kontrol ve ölçü doğrulama; ardından web optimizasyonu ve satış arayüzü.

Ölçü etiketlerine yalnız doğrulanmış ölçüler girecek. Fotoğraftan çıkarılan havuz, peyzaj ve görünmeyen komşu cepheleri, model verisinde `inferred` olarak işaretlenecek.

`python tools/inventory.py` kaynak özetini ve fotoğraf inceleme sayfalarını `build/reference/` altında üretir.

## Çıktılar

- `build/blender/angora21-source.blend`: kaynak katmanları ve yeniden oluşturulan mimari yüzeyler.
- `build/blender/angora21-working.blend`: mimari, PBR malzemeler, ayrı mobilya koleksiyonu, sabit donatılar, bahçe, havuz ve komşu kütleleri.
- `build/renders/`: Blender Cycles kontrol görüntüleri.
- `build/renders/render-manifest.json`: güncel görüntülerin hangi native sahne SHA-256 değerinden üretildiğini kaydeder; listede bulunmayan görseller önceki kontrol aşamalarından kalmış olabilir.
- `build/glb/`: varsa ayrı villa ve mahalle kontrol modelleri. Prosedürel Blender malzemeleri henüz dokulara bake edilmedi; GLB, Blender renderıyla aynı görsel kaliteyi temsil etmez.
- `build/cad/`: kaynak özeti, master plan yerleşimi, açıklık kontrolü ve eşleştirilmemiş ölçü verileri.

Kaynak DWG'nin SHA-256 değeri `db8a25b05cd9f572f1de5825b62f38133678607f5dbc6cf4cf7bb621acdde229`.
202 fotoğraf, 159.409 model-space varlığı ve 1.308 ölçü varlığı envanterlendi. DWG, hazır kapalı mesh katıları yerine 3D çizgi / spline geometrisi içeriyor. Bu nedenle yüzeyler yeniden oluşturulur; tamamlanmışlık, çizgi sayısıyla ölçülmez.

Blender'da metre birimi kullanılır. Detay modeline uygulanan ölçek `0.01`; kaynak Z başlangıcı `54.37355489974468`. Ham DWG `INSUNITS` bilgisiyle fiziksel model ölçeği doğrudan eşitlenmemelidir. Master plan ayrı bir dönüşümle, `22E1A` handle'ına sahip 21 numaralı bina üzerinden kaydedildi; hedef oturum alanı yaklaşık 153,32 m². Bu, ilan net/gross alanı değildir.

Komşu planlarında bazı açık polylinelerin son kenarı kapatılarak kütle izi oluşturuldu; `closing_edge_inferred` bayrağı bunları gösterir. Komşu yükseklikleri, görünmeyen cepheleri ve havuzun 8 × 4 m kontrol boyutu tahminidir. Bunlar ölçü etiketine açılmamıştır.

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
export ANGORA_BLENDER_DIR=/absolute/path/to/blender-4.5.13-linux-x64
bash tools/run_blender.sh --python tools/build_blender.py -- --dress --detail --render
bash tools/run_blender.sh build/blender/angora21-working.blend --python tools/check_scene.py
bash tools/run_blender.sh build/blender/angora21-working.blend --python tools/export_glb.py
bash tools/run_blender.sh --python tools/verify_glb_roundtrip.py
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

GLB dışa aktarımı doğrudan fotoğraf dokularını ve UV'lerini korur; desteklenmeyen prosedürel yüzeylerde temel PBR rengi kullanılır. Kiremit ve bitki ayrıntıları, mobil için LOD/bake gerektirir. Native sahnenin ayrıntı sayısı web performansının kanıtı değildir.

Salonun yaklaşık 2,80 m ve girişin 3,10 m kotları ayrı korunur; ikisi de kaynak `KAT 1` giriş katı grubundadır. Kat grubu bulunan CAD katmanlarında yalnız yüksekliğe göre yeniden sınıflandırma yapılmaz. Kontroller salon döşemesinin üst bir kapak yüzeyiyle kapanmadığını, garaj kapısının görünürlüğünü ve CAD kat aidiyetini denetler. GLB geri aktarım kontrolü, sınır kutusundaki değişimin 2 cm altında kaldığını kontrol eder; bu, bütün mimari ölçülerin doğrulandığı anlamına gelmez.

## Tamamlanması gereken doğrulama

- Çatı birleşimleri, duvar açıklıkları ve eksik yüzeylerin bütün cephelerde kontrolü.
- Her odanın fotoğraf/plan eşleşmesi, sabit donatı ve mobilya konumlarının kontrolü.
- Bahçe kotları, garaj kapısı/yaklaşımı, havuz ve bitki yerleşiminin fotoğrafla son karşılaştırması.
- Ölçü varlıklarının ilgili odalara bağlanması; doğrulanmış ölçüler için etiket listesi.
- Doku bake, LOD, draw-call azaltma, mobil/masaüstü performans ölçümü.
- Mahalle → bina → kat → oda satış arayüzü; model doğrulaması tamamlandıktan sonra.

GitHub erişimi açıldı. İlk kod, CAD raporu ve referans paketi `3731b8730b8d3f09a6cfffc99c1ce332098f645d` commit'iyle `main` dalına gönderildi. Yerel commit ile uzaktaki gönderim ayrı ayrı doğrulanır.

Büyük tek parça Blender dosyası bağlantının 16 MiB istek sınırını aşıyor. Ana sahneye bağlı daha küçük Blender katman dosyaları hazırlanıyor. Otomatik yazma yetkili bir GitHub Actions iş akışı etkinleştirilmedi.
