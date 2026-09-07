# Angora → DOMVS demo4 inceleme notları

7 Eylül 2026 tarihinde `decentralize-dfw/domvs` deposunun `main/demo4` kaynakları okundu. Bu not web entegrasyonunun yapıldığı anlamına gelmez; Angora model doğrulaması devam ediyor.

- [demo4-scene.html](https://github.com/decentralize-dfw/domvs/blob/main/demo4/demo4-scene.html), blob `a770db0c3f7fb105b34b4303faf23e0a618bcfb3`: Three.js 0.158.0, GLTFLoader, Draco 1.5.7 ve Meshopt çözümleme desteği var. Angora'nın mevcut Draco GLB'leri için format yolu mevcut; canlı yükleme/performance testi yapılmadı.
- [xlsx-loader-4.js](https://github.com/decentralize-dfw/domvs/blob/main/demo4/xlsx-loader-4.js), blob `03e61832d61f2ecaab06b54e8be90c8fa6e6b080`: `VEA Config` sayfası ve `link.txt` üzerinden veriyle sahne kuruluyor; orbit, cameras, walkthru, panoramic sahne tipleri var.
- Model girdisi konum, dönüş, ölçek, `id` ve `toggleKod` taşıyor. Angora metre ölçeğiyle dışa aktarılır; yeniden keyfî ölçek uygulanmamalı. Kat/oda kaydı, modeldeki `floor_index`, kaynak katman ve plan odalarıyla eşlenmeli.
- Kaynak yükleyici her mesh için gölgeyi açıyor. Angora'nın bitki ve kiremit ayrıntıları bu ayarla doğrudan satış demosuna alınmamalı; mesafe LOD'ları, gölge veren nesne seçimi, birleştirme ve bake çalışması gerekiyor.
- Renderer DPR sınırı 2, ACESFilmic tone mapping ve sRGB çıkış kullanıyor. Blender AgX renderlarıyla renk/ışık eşitliği otomatik değil; webte ayrıca görsel kontrol gerekli.
- Ölçü toggle'ı için önce 1.308 CAD ölçü varlığının oda/duvar eşlemesi yapılmalı. Modelin bütün bounding-box boyutlarını ölçülmüş oda bilgisi gibi sunmak uygun değildir.
- Kamera akışı: mahalle orbit → bina bilgisi → kat seçimi → oda/alan/malzeme → isteğe bağlı doğrulanmış ölçüler. Bu akış, kullanıcının hedefidir; henüz uygulanmadı.

Mevcut GLB'ler kontrol varlıklarıdır. Prosedürel malzeme bake'leri, fiziksel ölçek/oda QA, kapsamlı kaynak etiketi devri, çarpışma geometrisi ve telefon performans ölçümleri tamamlanmadan yayın sürümü sayılmazlar.
