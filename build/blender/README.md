# Blender çalışma sahnesi

Depoyu indirip `angora21-working.blend` dosyasını Blender 4.5 ile açın. Yanındaki `layers/` klasörü aynı yerde kalmalıdır; ana dosya tek başına sahneyi içermez.

27 bağlı Blender dosyası kaynak çizgilerini, mimariyi, mobilyaları, donatıları, bahçeyi ve mahalleyi taşır. Ortak malzemeler dosyasındaki bütün kullanılan görüntüler paketlidir; harici PNG indirmek sahneyi açmak için gerekli değildir. Ayrı PBR harita paketi `assets/pbr/pbr-maps.zip` konumundadır.

Katman dosyaları tek tek düzenlenebilir. Mobilyalar `30_FURNITURE_PLACEHOLDERS` grubunda bulunur. Ölçüsü yorumlanmış nesnelerde `dimension_label_allowed=false` bilgisi korunur.

`layer-manifest.json` dosya bütünlüğünü, `layer-qa.json` yeniden açılma kontrolünü kaydeder. Bu sürüm fotoğraf karşılaştırması içindir; nihai satış modeli değildir. Oda incelemeleri `build/room-review-register.json`, son mutfak kontrolü `build/review-r23.json` ile takip edilir. Her yeni GLB renderının yanında kaynak dosya hashlerini taşıyan bir JSON kaydı bulunur.
