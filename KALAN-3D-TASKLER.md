# Angora 21 R39 — kalan 3D işler

Bu paket kullanıcının durdurma talebindeki son R39 durumudur. İşaretlenen dolap, kapılar, asansör konumu, çatı pencereleri, katı çatı/toprak, mobilya yerleşimleri, banyo ve yatak yönleri, garaj, havuz, bahçe merdivenleri, yol normalleri ve temel çevre düzeltmeleri modelde işlenmiştir.

## Kalan işler

1. **17 fotoğraf grubunun son kabulü:** Model ve malzemeler işlendi; her oda ve dış görünüş için yan yana nihai fotoğraf kabulü yapılmadı. Renk, parlaklık, kumaş deseni, dekor ve cihaz ayrıntıları oda oda onaylanmalı.
2. **42 çevre yapının ayrıntılı doğrulanması:** Vaziyet, ölçek ve temel kütleler mevcut. Fotoğrafta görünmeyen cepheler, çatı ayrıntıları, bahçeler, çitler, istinatlar ve bitki konumları için yeterli kaynak bulunmuyor.
3. **Topoğrafya, yol ve bordür saha doğrulaması:** Ön cephe bağlantıları ve yüzey yönleri düzeltildi. Yol alanı dışında kalan 10.966 bordür örneği eski yorum kotunu kullanıyor; tüm yol genişlikleri ve görünmeyen kotlar ölçüyle doğrulanmadı.
4. **Havuz ve arazi ölçüleri:** Havuz yaklaşık 8 × 4 m yorumuyla modellenmiştir. Kesin havuz derinliği, parsel kotları ve bahçe sınırları saha ölçüsüyle kapatılmalı.
5. **Bitki eşlemesi:** Kaba bitki kütleleri ayrıntılandırıldı. Tür, mevsim, boy ve her bitkinin kesin konumu fotoğraf/saha verisiyle birebir kabul edilmedi.
6. **Ek bodrum mutfağının kaynak eşlemesi:** Dolap, buzdolabı ve tezgâh fiziksel ölçekte mevcut; bu alanı doğrulayacak açık fotoğraf kimliği bulunmadığı için birebir kabul açık.
7. **Oda sınırları, m² ve ölçüler:** 27 oda etiketi var. Güncel katı geometriye karşı sıkı doğrulamadan yalnız bir ölçü geçti; bütün odaların güvenilir poligonu, ayrı m² değeri ve iki yönlü ölçüsü tamamlanmış sayılmaz.
8. **Web malzeme kabulü:** 33 yeni prosedürel malzeme GLB için 1K tekrarlı PBR haritalarına aktarıldı. Tarayıcı görüntüsü native Blender ile aynı ışıkta yan yana kabul edilmedi.
9. **Kesitlerin web bağlantısı:** Duvar ve çatı kesit verisi `sections.json` içindedir; kesit gövdeleri `section-caps.glb` içindedir. R44: toprak taraması bodrum kesitine bağlandı, kazı boşluğu `R44 F0 excavation fill` ile kapatıldı; kalan iş, üst katlarda duvar/çatı kapaklarının atlasla karşılaştırmalı görsel kabulü.
10. **Asansör animasyonu:** Üç duraklı kabin hareketi `level-0.glb` içinde bulunur. Web oynatımı ve açık kat kapılarıyla hareket senkronu uygulanmadı.
11. **Bütün sahne kesişme kapanışı:** 884 mobilya parçasının örneklenmiş kesişme ve baş mesafesi taramaları geçti; 23 seçili gövde kapalıdır. Her üçgen çiftini kapsayan bütün sahne denetimi yapılmadığı için matematiksel olarak sıfır kesişme iddiası yoktur.
12. **Gerçek cihaz model bütçesi:** R44 üçüncü turda telefonlar için türetilmiş hafif set eklendi (`manifest-mobile.json`: üç parça 1,82 M üçgen / 11,9 MB; ≤512 px webp dokular, normal haritasız, çim yaprağı alanı ve CAD bordürleri hariç) ve viewer cihaza göre seçiyor. Masaüstü tam teslim üç parça ~27 MB olarak durur. Kalan iş: hafif setin gerçek telefonlarda FPS/bellek/ısınma ölçümü ve gerekirse ikinci bir daha-hafif kademe.
13. **Bölge haritası yer imleri:** Çevre verisi kök dizindeki `uzakolcek.html` atlasından okunur (OSM + Google/Yandex, 10.09.2026, 1.580 nokta); çipler atlasın kendi ölçülmüş metreleriyle üretilir (`tools/extract_region_places_r44.mjs`). Kalan iş: atlas güncellenirse aracı yeniden çalıştırmak ve seçilen 16 "günlük ihtiyaç" çipinin ticari tercihe göre onayı (hangi market/banka/okul öne çıkarılacak).
14. **Ön bahçe kotları saha kontrolü:** R44 ikinci turda ön avlu fotoğraflara göre bağlandı (mazı hattı, sahanlık bandı, kama taşlaması, cephe terası). Diyagonal garaj yolu ile giriş kotları CAD yorumudur; gerçek bordür/kapı eşiği kotlarıyla saha doğrulaması yapılmadı.
