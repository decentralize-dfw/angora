# Blender 3.6 — ne yapman gerekiyor

**`layers/` klasörüne dokunma.** Onlar eski Blender katman dosyaları, bu işle
ilgisi yok. Tek tek açman gereken bir şey yok.

## 1. Şu üç dosyayı indir

| Dosya | Boyut | İçinde ne var |
|---|---|---|
| [`angora-kabuk.glb`](angora-kabuk.glb) | 74,7 MB | Bina kabuğu, bahçe, zemin, çim/asfalt — **43 malzeme** |
| [`angora-icmekan.glb`](angora-icmekan.glb) | 39,2 MB | Bütün iç mekân, 4 kat — **119 malzeme** |
| [`angora-komsular.glb`](angora-komsular.glb) | 71,9 MB | Komşu binalar, çatıları, duvarları — **9 malzeme** |

GitHub'da dosyaya tıkla → sağ üstteki **Download** düğmesi. Ya da doğrudan:

```
https://github.com/decentralize-dfw/angora/raw/main/build/blender/angora-kabuk.glb
https://github.com/decentralize-dfw/angora/raw/main/build/blender/angora-icmekan.glb
https://github.com/decentralize-dfw/angora/raw/main/build/blender/angora-komsular.glb
```

## 2. Blender 3.6'da aç

`File > Import > glTF 2.0 (.glb/.gltf)` → dosyayı seç → **Import glTF 2.0**.

Ayarlara dokunma, varsayılanlar doğru (**+Y Up** açık kalsın).

Üçünü de aynı sahneye üst üste import edebilirsin — hepsi aynı dünya
koordinatlarında duruyor, hizalama gerekmez. Yalnız cephe malzemesiyle
uğraşacaksan sadece `angora-kabuk.glb`'yi açman yeter; en hızlısı o.

## 3. Hepsi bu

Malzemeler Principled BSDF olarak gelir, dokular dosyanın içinde gömülü.
Kaydedince `.blend` içine paketlenir.

---

## Neden üç dosya, neden tek dosya değil

Tek dosya 185 MB çıkıyor; GitHub'ın dosya başına sınırı 100 MB. LFS denendi,
`lfs.github.com` bu ortamda ağ politikasıyla kapalı (403). Kayıpsız
sıkıştırma yetmedi (weld yalnız 6,6 MB kazandırdı — veri Draco'dan geldiği
için zaten sıkı). Nicemleme tek dosyayı kurtarırdı ama Blender 3.6'nın
`KHR_mesh_quantization` desteğini bu ortamdan doğrulayamadım, doğrulanmamış
varsayıma yatırmadım.

Üç grup her biri sınırın altında ve her biri kendi başına açılıyor.

## Neden web teslimatını doğrudan açamıyorsun

`build/web/native-current/` Blender'a doğrudan girmez. Asıl engel Draco
değil: dokular **KTX2** (`KHR_texture_basisu`) ve **Blender 3.6 bunu
okuyamaz** — dokular sessizce boş gelir. Her dokunun PNG yedeği zaten vardı,
dönüştürücü onu tutuyor.

`build/web/batched/` ise büsbütün yanlış kaynak: orada malzemeler 37 atlasa
birleşmiş, üzerinde çalışacağın 171 malzeme grafiği yok.

## Künye

- **168 malzeme** (171'in 168'i; dışarıda kalan 3'ü: uzaktaki beyaz kütleler
  tek malzeme + 2 yaprak kartı — geometrinin %72'si bunlardaydı ve üzerinde
  malzeme yazılacak şeyler değil)
- 2.840.086 üçgen, 224 mesh, 107 doku
- **Draco yok, KTX2 yok.** Dokular PNG; yalnız 8 adet pişmiş AO haritası
  JPEG'e indi (13,7 MB → 1,0 MB). base / normal / ORM **kayıpsız PNG** —
  asıl çalışılacak kanallar onlar.
- glTF uzantıları: clearcoat, ior, specular, transmission, texture_transform
  — hepsi Blender 3.6 içe aktarıcısında destekli
- Her dosya bağımsız ayrıştırıcıyla geri okunup doğrulandı: 0 Draco
  primitifi, 0 basisu dokusu, tek sahne.

## Yeniden üretmek / tam sürüm

```
cd tools/batch-delivery && npm install
node --max-old-space-size=8192 make-blender-glb.mjs --grup=kabuk
node --max-old-space-size=8192 make-blender-glb.mjs --tam    # 259 MB, her şey dahil
```
