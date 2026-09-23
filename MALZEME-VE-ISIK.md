# MALZEME VE IŞIK — ürün sahibinin teşhisinden devam

Ürün sahibi canlı sitede baktı ve SketchUp imzasını kendisi tarif etti:

> *"Ana binanın çatısı diğerlerinden farklı. Malzeme çok düz, shape mesh
> duruyor cephe malzemesi. Çevre yeşil alan textürü dümdüz bir texture.
> Binaların gölgeleri var ayrıca ama, malzemelerin dandikliğinden, ışık
> ile birlikte o gerçekçi atmosfer sağlanamıyor."*

Üçü de doğru ve üçünün de teknik karşılığı ölçüldü. **Üçü de Blender
gerektirmiyor, kaynak dizin de gerektirmiyor.** Hepsi bu turda yapılabilir.

---

## BÖLÜM 0 — ÖLÇÜLEN DURUM

### 0.1 Gölgeler donmuş

`build/web/batched/lighting/ground-light.json`:
```json
{"size":512, "boundsXZ":[-105,-125,110,110], "hour":12.5, "day":172,
 "sunDirection":[0.0816, 0.9564, 0.2805], "receiverPixels":230013}
```

- Komşuların yere düşen gölgesi **pişmiş** ve **21 Haziran 12:30'a sabit**
- 512 piksel, 215×235 m alan → **texel başına 42 cm**
- Villanın kendi gölgesi dinamik, saat kaydırıcısını takip ediyor

**Sonuç:** Saat 14:20'ye geldiğinde villanın gölgesi döner, mahallenin
gölgeleri 12:30'da donmuş kalır. Işık bir yeri, gölgeler başka yeri
gösterir. Ürün sahibinin "ışıkla birlikte atmosfer sağlanamıyor" dediği
şey budur — göz tutarsızlığı yakalar, sebebini söyleyemez.

Üstüne 42 cm/texel: gölge kenarı keskin değil, 42 santimlik bulanık leke.

### 0.2 Neden villanın çatısı farklı

`exterior-grade.js:193`:
```js
if (!batch || batch.grid !== 1 || batch.materials.length !== 1) return;
```

| Yüzey | Batch | grid | Doku aldı mı |
|---|---|---|---|
| Villa çatısı (`Clay tile`) | `architecture-tile-1` | **1** | ✅ gerçek kiremit |
| Komşu çatıları (`roof.004`, `Neighbor 20 green tiles`) | `context-buildings-tile-2` | **2** | ❌ |
| Villa ikinci çatı (`roof-7`) | `architecture-tile-7` | **4** | ❌ |

Tutarsızlık teknik bir sınırın doğrudan sonucu: villa tek başına bir
batch'te olduğu için erişilebildi, komşular olmadığı için erişilemedi.

### 0.3 Cephe neden shape gibi

`STRUCCO` (`architecture-other-9`, grid=1) **yalnız `normalMap`** aldı.
Albedo düz kaldı; atlas hücresinin RGB aralığı **14/255**.

Kabartma var, renk varyasyonu yok. Tek renk bir yüzeye kabartma koymak onu
"dokulu" yapmaz — plastik kabartma yapar. Shape gibi durmasının sebebi bu.

### 0.4 Çim neden dümdüz

`R31 | R39 continuous grass ground`, `context-ground-other-0`, grid=2.
Atlas hücresi **248 piksel**, kapladığı alan **310 metre** → **1,25 m/texel.**

Ne konursa konsun düz görünür. Bu bir doku kalitesi sorunu değil, UV
ölçeği sorunu.

### 0.5 ⚠️ Doku zaten elimizde ve çöpe gidiyor

`viewer/public/textures/` içinde hazır duruyor ve `loadGradeTextures`
(`exterior-grade.js:120-123`) **her açılışta indiriyor**:

- `grass-basecolor.png` ← **hiçbir yere bağlanmıyor**
- `asphalt-basecolor.png` ← **hiçbir yere bağlanmıyor**
- `clay-tile-basecolor.png` + `clay-tile-normal.png` ← yalnız villa çatısı
- `travertine-*` ← yalnız havuz terası
- `stucco-normal.png` ← yalnız STRUCCO, albedo yok

Onları kullanacak tek yol (`TABLE` + `bindGradeTextures`) ölü — üretim
manifesti `exterior_grade` bayrağı taşımıyor. Batched yol da `grid=1`
şartında takılı.

**Yani site her açılışta bir çim dokusu indirip atıyor.**

---

## İŞ 1 — GÖLGELERİ DİNAMİKLEŞTİR ⭐ önce bu

**Bayrak:** yok, doğrudan düzeltme. Masaüstü tier'ları.

Komşu binaların yere düşen gölgesi saat kaydırıcısını takip etmeli.

**Yap:**
- `neighborhood` görünümünün gölge kamerasını **görünen mahalleyi**
  kapsayacak şekilde genişlet. Sınırı `contextBox`'tan türet
  (`main.js`'te zaten hesaplanıyor), sabit sayı yazma.
- Texel yoğunluğunu koru: `shadowMapSize` masaüstünde **4096**.
  200 m / 4096 ≈ 20 texel/m — bugünkü villa-local'in 80 m / 2048 = 25
  texel/m'siyle aynı sınıf.
- Tek harita yetmezse **kademeli (cascade)**: yakın kademe villa + bahçe,
  uzak kademe mahalle.
- Pişmiş `ground-light` maskesi **kalsın** ama dinamik gölge varken
  **yalnız ortam kapanması (G kanalı)** olarak kullanılsın; doğrudan
  güneş görünürlüğü (R kanalı) dinamik gölgeye bırakılsın. İkisi üst üste
  binerse çift karartma olur.
- Güncelleme politikası bugünkü gibi kalsın: olay bazlı, sürüklerken 0,
  bırakınca 1 kare.

**Kabul:** Saat kaydırıcısı 09:00 → 18:00 sürüklendiğinde **mahalledeki
bütün gölgeler** villanınkiyle birlikte dönüyor. Donmuş gölge kalmıyor.

---

## İŞ 2 — GERÇEK DOKULARI ERİŞİLEMEYEN YÜZEYLERE BAĞLA ⭐ merkez iş

**Bayrak:** `gradeAnyGridV1`, varsayılan `false`.

`reviveBatchedGrade`'in `grid === 1` şartı kalkacak. Mekanizmanın iki
parçası **zaten kodda var, sadece birleştirilmemiş**:

1. **`batchId` ile hücre ayrımı** — `procedural-detail.js` bunu yapıyor
   (`uDetail[16]`, `int id = int(floor(batchId + 0.5))`). Aynı desen
   doku bağlamak için de kullanılabilir.
2. **Dünya uzayında UV üretimi** — `exterior-grade.js:139`
   `projectGroundUV(mesh, {module, diagonal})` zaten var ve havuz terasında
   kullanılıyor. Bozuk UV'yi tamamen atlar.

### 2.1 Shader tarafı

`batched-material.js`'te, bugün `exteriorGradeDetail` slotları için
`atlasSample`'ı atlayan mekanizmanın (satır 40) **hücre bazlı** hâli:

```glsl
uniform sampler2D detailMap[N];     // ya da tek atlas + hücre indeksi
uniform vec4 detailParams[16];      // x: aktif, y: tekrar, z: karışım, w: normalScale
```

`batchId`'ye göre: hücre aktifse `detailMap`'ten **kendi UV'siyle** oku
(atlas yolu değil — tam mip zinciri ve anizotropi geri gelir), değilse
bugünkü atlas yolundan devam et.

Sekiz cell birden aktif olacaksa sampler sayısı sorun olur — o durumda
detay dokularını **tek bir doku dizisine (texture array)** topla,
`atlasArrayV2`'nin yaptığı gibi. Hangi yolu seçtiğini `PROGRESS.md`'ye yaz.

### 2.2 Bağlanacaklar

| Yüzey | Kaynak materyal | Batch | Doku | UV |
|---|---|---|---|---|
| **Çim** | `R31 \| R39 continuous grass ground` | grid=2 | `grass-basecolor.png` | **dünya uzayı**, modül ~2 m |
| **Asfalt** | `R31 \| R37 fine asphalt aggregate` | grid=2 | `asphalt-basecolor.png` | dünya uzayı, modül ~4 m |
| **Komşu çatıları** | `roof.004`, `Neighbor 20 green tiles` | grid=2 | `clayTileMap` + `clayTileNormal` | authored UV, villa çatısıyla **aynı ölçek** (`1/0.8`, `1/1.0`) |
| **Villa ikinci çatı** | `roof-7` | grid=4 | aynı | aynı |
| **Giriş avlusu** | `Entrance coursed limestone.001` | grid=2 | `travertineMap` + normal | dünya uzayı, modül 0,8 m |
| **Villa cephesi** | `STRUCCO` | grid=1 | **`stuccoNormal` VAR, albedo YOK** | aşağıya bak |
| **Komşu duvarları** | `neighbor_wall`, `ceiling.004` | grid=1 | aynı, sönük | aşağıya bak |

### 2.3 Cephe albedo'su — doku yok, üretilecek

`stucco-basecolor.png` diye bir dosya yok. İki seçenek, **ilkini seç**:

**A (tercih):** `stucco-normal.png`'den türetilmiş, düşük kontrastlı,
tileable bir albedo üret (normal'in yükseklik bileşeninden + hafif renk
gürültüsü). 512×512, sRGB, seamless. Dosyayı repoya koy. Mevcut düz rengi
**değiştirme, modüle et** — atlas hücresinin ortalama rengi korunsun,
üstüne ±%8 değer varyasyonu binsin. Villa cephesinin rengi değişmemeli,
sadece düzlüğü kırılmalı.

**B:** `proceduralDetailV1`'in genliğini STRUCCO için yükselt (0.05 → 0.12).
Ucuz ama kum dokusu hissi vermez.

Komşu duvarlarında aynı doku, genlik **yarısı** — fon, konu değil.

### 2.4 Kurallar

- **Villa çatısı ile komşu çatıları aynı dokuyu ve aynı ölçeği kullanacak.**
  Ürün sahibinin ilk şikâyeti bu tutarsızlıktı.
- Çim ve asfalt **dünya uzayı UV** kullanacak — authored UV bozuk
  (1,25 m/texel), onu kurtarmaya çalışma, `projectGroundUV` ile geç.
  `horizontalShare > 0.5` kontrolü korunsun (duvara çim serilmesin).
- Doku bağlanan slot `atlasSample`'ı **atlayacak** — tam mip zinciri ve
  tier anizotropisi geri gelsin. `atlasAnisotropyFix`'in dışlama listesine
  bu slotları da ekle.
- `poolWaterV2`'nin sürdüğü `water` ve `glassTiersV2`'nin dokunduğu cam
  hücrelerine **dokunma**.

**Kabul:**
- `reviveBatchedGrade` applied sayısı **8 → en az 14**, logda
- Çim yakın çekimde tek renk değil
- Komşu çatıları villanınkiyle **aynı** okunuyor
- Cephe düz plastik değil
- İndirilip atılan doku kalmadı (`grass`, `asphalt` artık bağlı)

---

## İŞ 3 — OPTİMİZASYON: özellik silmeden

Ürün sahibi: *"kasıyor diye var olan özellikleri silmek yerine optimize
edemiyor muyuz?"* Evet. Sırayla:

| # | İş | Beklenen | Görsel bedel |
|---|---|---|---|
| 1 | **Render ölçeği 0,8×** + iyi upscale | ~1,5× | bu boyutlarda görünmez |
| 2 | **GTAO 1,0 → 0,5** + iyi upsample | ~1,3× | yok denecek kadar |
| 3 | **`pixelBudgetV2` AÇ** (mevcut, kapalı) | dpr'a göre | yok |
| 4 | **bloom + grade + dither tek geçişte** | 3 tam ekran → 1 | yok |
| 5 | İç mekânda fixture spot'larını **oda başına** derle | shader derleme | yok |

**Not:** GTAO'yu 1,0'a ben çıkarttırdım (FAZ 7 İŞ 5). Yanlıştı — dört kat
maliyet, neredeyse görünmeyen fark. Geri al.

Her kalem için **önce/sonra kare süresi** ölç, `PROGRESS.md`'ye yaz.
Tahmin etme. Ölçemiyorsan o kalemi yapma ve neden ölçemediğini yaz.

---

## BÖLÜM 4 — BU TURDA YAPILAMAYACAKLAR

Ürün sahibi kalan fazların işe yarayıp yaramadığını sordu. Yarıyor,
ama ikisi dışarıdan bir şey bekliyor:

| Kalem | Ne getirir | Engel |
|---|---|---|
| 2.2 instancing + LOD | Komşular şu an **1,02 M üçgen**, tek parça. En büyük performans kalemi | **H6** — `../model-finalization/web` kaynak dizini |
| 2.4 arazi sadeleştirme | Kanıtlı **311k → 85,8k** üçgen | **H10** — görünürlük rebake (Blender) |
| H2 iç mekân lightmap | Doluluk **%4,1** → hedef ≥%65. İçerideki V-Ray hissi tam olarak bu | **H2** — Blender |
| 4.1 KTX2 | GPU doku belleği | ölçüldü, ertelendi |

İŞ 1–3 bittiğinde **runtime tarafında yapılabileceklerin sonuna gelinmiş
olacak.** Bunu kapanışta açıkça yaz; ürün sahibi neyin neden kaldığını
görsün.

---

## KURALLAR

- **Test yok.** Capture yok, gate yok, QA oturumu yok. `npm test` (3 sn) →
  build → `main`'e push. Kırmızıysa pushlama.
- Her iş bitiminde doğrudan pushla, sorma. İzin verildi.
- İŞ 1 ve İŞ 3 bayraksız, doğrudan varsayılan — ikisi de düzeltme.
  İŞ 2 `gradeAnyGridV1` altında, bitince aç.
- Mobil tier satırlarına dokunma, bugünkü haliyle kalsın.
- Her sayısal değeri `PROGRESS.md`'ye eski → yeni yaz.
- Tur sonu tek satır: ne bitti, sırada ne var. Ön cümle yok.
- Sıra: **İŞ 1 → İŞ 2 → İŞ 3.**
