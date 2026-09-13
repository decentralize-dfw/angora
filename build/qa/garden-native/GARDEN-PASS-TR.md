# Yerel Blender bahçe düzenlemesi

Çalışılan düzenlenebilir dosya: `build/blender/angora-rooms-open-doors.blend`.
İç mekân sonundan alınan bağımsız yedek: `build/blender/angora-before-garden-review.blend`.
Kaynak: yerel `kat_1_bahce` fotoğrafları, mevcut kayıtlı CAD kotları ve model geometrisi. GitHub'dan yeni model alınmadı.

## Tamamlanan düzeltmeler

- İki yan merdivene taşan toprak geri çekildi. Basamak ölçüleri ve sahanlık kotları korundu; aşırı kalın yan duvarlar yerine fotoğraflara uygun taş kenarlar, burunlar ve teras duvar başlıkları işlendi.
- Batı alt teraslarındaki açık renk sıva ile taş üst teras ve doğu taş teras yüzeyleri ayrıldı.
- Merdivene taşan iki ağaç tacı daraltıldı; büyük opak yaprak diskleri arşivlendi, ince iğne yaprak geometrisi işlendi. Yan yataklara çim eklendi.
- Batı üst merdivenine taşan iki pencere kepengi cepheye doğru katlandı.
- Toprak yüzeyinin ters yönlü üçgenleri düzeltildi. Görünen üst yüzeyler korunarak kapalı toprak hücreleri oluşturuldu. Hücreler arasındaki gömülü ortak yüzler bilerek korunmuştur; dışa aktarımda körlemesine kaynak yapılmamalıdır.
- Veranda tavanı, koyu ahşap kirişleri, kare direkleri, yağmur boruları, oluk, tavan aydınlatması ve iki duvar feneri işlendi.
- Küçük pencere önüne çıtalı ahşap masa eklendi. Cephe girintisinde eksik olan yaklaşık 1,25–1,65 m derinliğindeki döşeme, doğrudan mevcut duvar sınırlarından ölçülerek tamamlandı.
- Havuz üst mavi seramik bandı, açık renk oluklu kenar taşı malzemesi ve dairesel duvar parçaları işlendi.

## Kontrol kapsamı

`garden-walk-qa.json`: iki merdivende 228 basamak destek örneği ve 2.736 kısa gövde ışını; 318 teras/çim destek örneği. Sonuç: eksik basamak desteği, basamağın üzerinde toprak, gövde çarpması ve eksik teras/çim desteği yok.

`garden-access-qa.json`: ön yaklaşım, araç yolu ve veranda boyunca 113 örnek. Araç yolu ve veranda örneklerinde gövde çarpması yok. Cephe girintisinin 20 döşeme örneği destekli.

**Ön giriş yaklaşımı henüz onaylanmış değildir:** düz merkez çizgisi testi, gerçek sundurma ayağı/duvarına 30 kez çarpıyor. Bu test duvarların kaldırılmasını gerektirmez; bir sonraki ön cephe çalışmasında gerçek dönüşlü yürüyüş hattı ve geçiş genişliği fotoğrafla kontrol edilmelidir. Ham sonuç gizlenmedi.

İç mekân regresyonu: `../rooms-native/garden-final-regression-passages.json`. 13 açık kapıda 455 ışın ve 273 eşik/döşeme örneği; çarpma ve eksik destek yok.

Yeni `Garden` katı detaylarında açık kenar, sıfır alanlı yüz ve gizlenmiş nesne bulunmadı. Kaynak kepenk ve eski bitki geometrisindeki açık/bozuk yüzler bu iddiaya dahil değildir; ayrıntıları ham geometri raporundadır. Yaprak kartlarının açık yüz olması beklenir.

Altı bakıştan son yerel Cycles kontrol görselleri aynı klasördedir. Fotoğraflarla oransal uyum sağlandı; ölçülmemiş ayrıntılar için birebir rölöve doğruluğu iddia edilmez.

## Kalan dış alan çalışmaları

- Ön sundurma çevresinde yürüyüş hattı; ön cephede dışarıda görünüyor olan radyatörün duvar/pencere ilişkisi.
- Sınır çitinin bitki türü, yüksekliği ve sürekliliği; genel bitki geometrisi halen yaklaşık temsildir.
- Bazı dış çatı/cephe birleşimleri, çevre yolları ve komşu yapılar.
- Web aşamasında bitki LOD/bake, malzeme dışa aktarımı, dosya boyutu ve gerçek yürüyüş/collision testi. Bu turda web dosyaları değiştirilmedi ve tarayıcı testi yapılmadı.

Uygulama: `tools/native_garden_review.py`, açık Blender uygulamasının Python konsolunda çalıştırıldı. Kaynak nesne ve meshlerin eski sürümleri geri alınabilir şekilde korundu.
