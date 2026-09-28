# Blender ajanı iş emri: Angora 21 ışık pişirme

28.09.2026 · Hazırlayan: görüntüleyici tarafı (web) · Uygulayan: Blender'lı bilgisayardaki ajan

## 0. Amaç (tek cümle)

Web'deki villa modellerine, Blender Cycles'ta hesaplanmış **dolaylı ışık
haritaları** (lightmap) eklemek: üç gündüz saati + bir gece. Web tarafı bu
haritaları okuyup V-Ray'e yakın iç mekân ışığını tarayıcıda maliyetsiz
gösterecek.

Ajan **render almaz**, ışık dokusu **pişirir** (bake). Ürün: ikinci UV'li
modeller + EXR ışık haritaları + bir tanım dosyası.

---

## 1. Girdiler

| Girdi | Nerede |
|---|---|
| Villa .blend (optimize edilmemiş, web'le aynı UV ve malzemeler) | ürün sahibinin bilgisayarı |
| Web'de kullanılan modeller (referans) | repo: `build/web/26092026/BUILDING-opt-v4.glb`, `INTERIOR-opt-v2.glb`, `GARDEN-opt-v2.glb` |
| Gerçek fotoğraflar (kalibrasyon) | repo: `photogallery/angora_01.jpg` … `angora_56.jpg` |
| Fotoğrafların kamera konumları | `docs/blender-ajan/foto-kameralari.csv` (Blender koordinatında) |

Repo: `https://github.com/decentralize-dfw/angora` (main dalı).

---

## 2. Kesin kurallar

1. **Asıl .blend dosyasını değiştirme.** `angora-bake.blend` adıyla kopyasını
   aç ve onunla çalış.
2. **Birinci UV kanalına dokunma.** Yeni bir UV kanalı ekle, adı tam olarak
   `Lightmap`.
3. **Geometri web'dekiyle aynı olmalı.** Başlamadan önce kontrol et: .blend'deki
   villa nesnelerinin toplam üçgen sayısını, repodaki `BUILDING-opt-v4.glb`,
   `INTERIOR-opt-v2.glb` ve `GARDEN-opt-v2.glb` ile karşılaştır.
   - **Aynıysa (±%1):** .blend içinde çalış.
   - **Farklıysa:** Pişirmeyi repodaki GLB'lerin kendisi üzerinde yap. Bu GLB'leri
     Blender'a aktar (glTF import, Draco destekli). Işıkları ve dünya ayarlarını
     .blend'den *Append* ile al. UV2 hangi geometriye açılırsa web'e o geometri
     gidecek; ikisi uyuşmazsa haritalar yanlış yere düşer.
4. **Mobilya pişmez** (`INTERIOR` içindeki mobilya ve aksesuar). Mobilyalar
   yalnız engel ve gölge verici olarak sahnede kalır. Pişen yüzeyler:
   - duvarlar
   - döşemeler
   - tavanlar
   - merdivenler
   - kapı ve pencere doğramaları
   - dış cephe
   - bahçe zemini, teras ve havuz çevresi
5. **Bitki, cam, su pişmez.** Bunlar yalnız sahnede kalır (cam ışığı geçirsin).
6. Birim metre, ölçek 1. **Nesneleri taşıma, döndürme, "Apply transform" yapma.**
   Konumlar web'le birebir kalmalı.

---

## 3. Adımlar

### 3.1 UV2 (Lightmap UV)
- Pişecek her mesh'e ikinci UV kanalı: `Lightmap`.
- *Smart UV Project* (açı 66°, ada payı 0.02) ya da *Lightmap Pack*, ardından
  *Pack Islands*. **Adalar birbiriyle çakışmamalı.**
- **Atlas gruplaması:**
  - `bodrum`, `giris`, `kat1`, `cati`: her katın iç duvar, döşeme ve tavanı.
  - `cephe`: dış kabuk ve çatı.
  - `bahce`: zemin, teras ve istinat duvarları.
  - Aynı atlastaki nesneler **tek UV alanını paylaşır**: pack işlemini atlas başına, o
    nesneleri birlikte seçip yap.
- **Doku yoğunluğu:** iç mekân ~40 px/m, cephe ve bahçe ~16 px/m. Atlas boyutu
  4096², ada kenar payı 8 px.
- Rapor: atlas başına doluluk oranı (hedef ≥ %60).

### 3.2 Güneş, gök, gerçek kuzey
Model gerçek kuzeye göre **164,25° dönük** (web tarafında ölçüldü). Güneş
yönlerini aşağıdaki vektörlerden kur. Bunlar Blender koordinatında (Z yukarı),
güneşe **doğru** bakan birim vektörler; 21 Haziran, Ankara, yerel saat.

| Saat | Güneş yönü (x, y, z) | Yükseklik |
|---|---|---|
| 09:00 | (-0.7481, -0.2008, 0.6324) | 39,2° |
| 13:00 | (-0.0397, 0.2821, 0.9586) | 73,4° |
| 17:00 | (0.7913, 0.1891, 0.5815) | 35,6° |

- Işık tipi *Sun*. Açısal boyut 0,53°.
- Dünya ışığı: *Nishita Sky*; güneş diski kapalı, sun ışığıyla aynı yön.
- Güneş şiddeti 3,5 ile başlar; kalibrasyonla (3.5) ayarlanır.

### 3.3 Cycles ayarları (hepsinde aynı)
- Cihaz GPU. Örnek sayısı 1024, gürültü eşiği 0,01. Işık sekmesi *Max Bounces*:
  toplam 8, diffuse 6.
- *Color Management*: görünüm **Standard**, bakış 0. Filmic/AgX olmaz; harita
  doğrusal kalmalı.

### 3.4 Gündüz haritaları (09, 13, 17): YALNIZ DOLAYLI
- *Bake Type*: **Diffuse**.
  - *Contributions*: **Direct KAPALI, Indirect AÇIK, Color KAPALI**.
  - Doğrudan güneşi web canlı çiziyor, rengi (albedo) web ekliyor. Haritada
    yalnız seken ışık olmalı.
- Hedef görüntü: atlas başına 4096², **32 bit float**, *non-color*.
- Her saat için ayrı dosya.

### 3.5 Kalibrasyon (pişirmeden önce, bir kez)
- `foto-kameralari.csv`'den 5 kamera kur: 2 bodrum, 2 giriş katı, 1 bahçe.
  Konum: `blender_x/y/z`. Bakış yönü: `bakis_x/y/z`. Odak 24 mm eşdeğeri.
- Saat 13:00 ile bu 5 kareyi Cycles'ta render et (düşük örnek yeterli).
- Aynı fotoğrafla yan yana koy. Karşılaştır:
  - duvar/tavan parlaklığı
  - pencere önündeki ışık düşüşü
  - köşe kararmaları
- Güneş şiddetini, gök yoğunluğunu ve gerekirse malzeme albedolarını (**yalnız
  aşırı parlak beyazlar, en çok 0,85**) fotoğrafa yaklaşana kadar ayarla. Ayarları
  rapora yaz.

### 3.6 Gece haritası
- Güneş ve gök kapalı. Dünya: çok koyu mavi, şiddet 0,02.
- Bütün iç fikstürler (avize, spot, aplik) açık, gerçekçi güçlerde. Sıcak beyaz,
  2700–3000 K.
- *Bake Type*: Diffuse. Contributions: **Direct AÇIK + Indirect AÇIK**, Color
  kapalı. Gece lamba ışığını web canlı çizemiyor; ikisi de haritada olmalı.

### 3.7 Gürültü temizleme
- Her EXR'yi Compositor'da **Denoise** düğümünden geçir (OIDN, HDR açık). Albedo
  ve normal geçişleri varsa bağla.
- Ada kenarlarında siyah sızıntı olmamalı: kenar payı 8 px *extend*.

---

## 4. Teslim edilecekler

Hepsini `angora-bake/` klasörüne koy:

```
angora-bake/
  modeller/
    BUILDING-lm.glb     # UV2 (TEXCOORD_1) içeren, sıkıştırmasız, malzeme/doku aynen
    GARDEN-lm.glb
  isik/
    bodrum_09.exr bodrum_13.exr bodrum_17.exr bodrum_gece.exr
    giris_09.exr  ...  (her atlas × 4 dosya)
  atlaslar.json         # hangi mesh/malzeme hangi atlasta
  kalibrasyon/
    kamera_01_render.png  kamera_01_foto.jpg  ...   # yan yana 5 çift
  RAPOR.md              # ayarlar, süreler, doluluk oranları, sorunlar
```

GLB dışa aktarımı:
- *Include*: Selected / Visible.
- *UVs* açık; iki UV kanalı da gitmeli.
- *Materials*: Export. *Compression*: **kapalı** (sıkıştırmayı web tarafı yapar).
- +Y Up açık (varsayılan).

`atlaslar.json` biçimi:
```json
{ "gunes_yonleri": { "09": [-0.7481,-0.2008,0.6324], "13": [...], "17": [...] },
  "gunes_siddeti": 3.5, "gok": "nishita", "kalibrasyon_notu": "...",
  "atlaslar": { "giris": { "boyut": 4096, "nesneler": ["Wall_F1_...", "..."] }, "...": {} } }
```

---

## 5. Kabul kontrolü (ajan kendi yapar, rapora yazar)

- [ ] Her pişen nesnede `Lightmap` UV var, adalar çakışmıyor (UV Editor → Select Overlap boş).
- [ ] GLB'lerin üçgen sayısı web'deki modellerle aynı (±%1).
- [ ] EXR'ler 32 bit float, doğrusal; gündüzlerde doğrudan güneş lekesi YOK.
- [ ] Gece haritalarında lamba altları aydınlık, pencere önleri karanlık.
- [ ] 5 kalibrasyon çiftinde render ile fotoğraf gözle benzer parlaklıkta.
- [ ] Toplam süre ve her atlasın pişme süresi raporda.

Takıldığın yerde durma. Sorunu `RAPOR.md`'ye yaz ve devam edilebilen
adımlarla sür.
