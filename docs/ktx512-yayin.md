# Tur 10 — 512 px KTX2 yayın

Ana bağlantı: https://xrweb.studio/angora/

Masaüstü ve mobil varsayılanı Tur 10: BUILDING v6, INTERIOR v3 ve lightmap UV'li GARDEN v3. Çevre modelleri de aynı 512 px KTX2 teslimini kullanır. Eski dosyalar korunur.

- 5 GLB, 164 gömülü KTX2 doku; en uzun kenar en fazla 512 px.
- 20 Tur 10 ışık haritası, 512 × 512 doğrusal UASTC KTX2. Küçültme sqrt kodlama çözülerek ışınım uzayında yapılır; ölçekler korunur.
- GLB geometri, düğüm, malzeme ve UV tanımları değişmez; 176 geometri bufferView içeriği kaynaklarla bayt düzeyinde aynıdır.
- `tools/batch-delivery/check-ktx512.mjs` dosya/UV/geometri korumasını ve boyutları doğrular.
- glTF Validator: beş dosyada sıfır hata. Kullanılan validator KHR_texture_basisu/Draco içeriğini doğrulamadığından uzantı uyarıları ayrıca tarayıcı yüklemesiyle kontrol edilir.

## Yeniden üretim

`TOKTX` ortam değişkeni Khronos toktx yürütülebilir dosyasını, `LIGHTMAP_SOURCE` ise isik-tur10 dalındaki `build/bake/web-isik-tur10` klasörünü göstermelidir.

```powershell
node tools/batch-delivery/make-ktx512.mjs
node tools/batch-delivery/check-ktx512.mjs
cd viewer
npm test
npm run build:pages
```

Model yolları ve gerçek bayt boyutları `viewer/src/villa-model-v3.js` içinde; ışık ölçekleri `viewer/src/villa-lightmaps-tur10.json` içindedir. Model başına doku ölçüleri `build/web/26092026/ktx512/conversion.json` içinde kayıtlıdır.

## Yerel yayın kontrolü

- Mevcut görüntüleyici testleri: 368/368 başarılı; yeni varsayılan teslim testi de başarılı.
- Chrome, NVIDIA GeForce RTX 4070 Laptop GPU: masaüstü ve mobil teslim profilleri. Gerçek telefon üzerinde ölçüm yapılmadı.
- desktop: 0 tarayıcı hatası, 25 yeni varlık isteği (tamamı HTTP 200), 32 lightmap malzemesi, 20 harita yüklendi.
- mobile: 0 tarayıcı hatası, 25 yeni varlık isteği (tamamı HTTP 200), 32 lightmap malzemesi, 20 harita yüklendi.
