# SIRADAKİ — gölge kapsamı, optimizasyon, kalan fazlar

Ürün sahibi canlı sitede test etti. Üç şey istiyor: context pop'u gitsin,
SketchUp görüntüsü bitsin, takılma bitsin — **özellik silerek değil.**

---

## İŞ 1 — Context 5 saniye sonra geliyor: KALDIR

Sahne açılıyor, komşu binalar 5 saniye sonra üstüne düşüyor. Ürün sahibi
net: *"bu saçma bir bug, istemiyorum böyle bir şey."*

`progressiveContextV1` **varsayılan KAPALI.** 13,6 MB kazanç, açılışta
mahallenin gözünün önünde belirmesine değmez. Bayrak kalsın, kapalı dursun.

`progressiveLoaderV2` (iç mekân ertelemesi) **açık kalsın** — o pop
yapmıyor, iç mekân zaten görünmüyor.

---

## İŞ 2 — GÖLGE KAPSAMI ⭐ "hâlâ SketchUp"un asıl sebebi

`quality-profile.js:105`: `neighborhood` görünümü `shadowCameraMode:
'wide-proxy'`.
`lighting.js:237`: `wide-proxy` = villa+bahçe sınırı **+25 m**.

Villa parseli ~30×40 m. +25 m ile gölge kamerası ~80×90 m kaplıyor.
Ekrandaki mahalle **200 m'den geniş, on iki bina var.**

**Sonuç: villadan ~40 m öteki hiçbir bina gölge düşürmüyor, gölge de
almıyor.** Saat 14:20'de, güneş tepedeyken, düz çimde duran on iki bina.
Gözün "maket" diye okuduğu şey tam olarak budur — dokudan önce, renkten
önce, gölgenin yokluğu.

**Yap:**
- `neighborhood` için gölge kamerasını **görünür mahalleyi kapsayacak**
  şekilde genişlet (context sınırından türet, sabit sayı yazma)
- Texel yoğunluğunu korumak için `shadowMapSize` **2048 → 4096** (yalnız
  masaüstü; 200 m / 4096 ≈ 20 texel/m, bugünkü 80 m / 2048 = 25 texel/m
  ile aynı sınıf)
- Tek harita yetmezse **kademeli (cascade)**: yakın kademe villaya sıkı,
  uzak kademe mahalleye geniş

**Kabul:** C03 benzeri yakın çevre karesinde **her bina** çime gölge
düşürüyor. Bu tek değişiklik, bugüne kadarki bütün doku işinden daha çok
fark yaratacak.

---

## İŞ 3 — OPTİMİZASYON: özellik silmeden hızlandır

Ürün sahibi haklı — çözüm özellik silmek değil. Sırayla, kazanç/risk:

| # | İş | Beklenen kazanç | Görsel bedel |
|---|---|---|---|
| 1 | **Render ölçeği 0,8×** + iyi upscale | **~1,5×** | bu boyutlarda görünmez |
| 2 | **GTAO 1,0 → 0,5** + iyi upsample | ~1,3× | yok denecek kadar az |
| 3 | **`pixelBudgetV2` AÇ** (mevcut, kapalı!) | dpr'a göre değişir | yok |
| 4 | **bloom+grade+dither tek geçişte** | 3 tam ekran geçiş → 1 | yok |
| 5 | İç mekânda 4 fixture spot'u ışık başına değil **oda başına** derle | shader derleme yükü | yok |

**Not:** GTAO'yu 1,0'a ben çıkarttım (FAZ 7 İŞ 5). Yanlıştı — yarı
çözünürlükte iyi bir upsample ile görsel fark neredeyse yok, maliyet
dört kat. Geri al.

Her biri için **önce/sonra kare süresi** ölç ve yaz. Tahmin etme.

---

## İŞ 4 — KALAN FAZLAR: espri değil, asıl iş orada

Ürün sahibi sordu: *"uygulanmayan fazlar espri olsun diye mi eklendi?"*
Hayır. **Kalan performans ve V-Ray işinin tamamı orada.**

| Faz | Ne yapar | Sayı | Engel |
|---|---|---|---|
| **2.2 instancing + LOD** | Komşu binalar tek parça hâlinde **1,02 M üçgen**. Aynı bina tipi defalarca tekrarlıyor — instance edilse bir kez çizilir | En büyük tek performans kalemi | **H6** kaynak dizin |
| **2.4 arazi sadeleştirme** | Kanıtlanmış: **311k → 85,8k üçgen**, en kötü sapma 1,9 cm | −225k üçgen | **H10** görünürlük rebake |
| **3.4a-c / H2 lightmap** | İç mekân GI. Doluluk **%4,1**, hedef ≥%65. İçerideki "V-Ray hissi" tam olarak bu | İç mekânın tamamı | **H2** Blender |
| **4.1 KTX2** | Doku belleği | GPU doku ~%40 | ölçüldü, ertelendi |

**Yani:** takılmanın ve iç mekânın SketchUp kalmasının çözümü bu dörtte.
Runtime tarafında yapılabileceklerin sonuna geldik — İŞ 2 ve İŞ 3 son
büyük runtime kalemleri.

### Engelleri açan iki şey, ikisi de ürün sahibinde

1. **`../model-finalization/web` kaynak dizini** → H6'yı açar, 2.2
   instancing + LOD gelir. `BLOCKED.md`'de tam manifest var (6 gltf + bin +
   images, `source_native_sha256 a8413904...`).
2. **Blender kurulu bir makine** → H2 ve H10'u açar. Script hazır:
   `tools/blender/rebake-interior-lightmaps.py`, %65 doluluk kapısı ve
   `exit 1` dahil.

Bu ikisi gelmeden iç mekân %4,1 lightmap'le kalır ve komşular 1,02 M üçgen
çizilmeye devam eder.

---

## KURALLAR

- **Test yok.** Capture yok, gate yok. `npm test` + build + `main`'e push.
- Her iş bitiminde doğrudan pushla, sorma.
- İŞ 2 ve İŞ 3 bayrak **gerektirmez** — doğrudan varsayılan olsun; ikisi de
  düzeltme, deney değil.
- İŞ 3'te her kalem için önce/sonra kare süresini `PROGRESS.md`'ye yaz.
- Sıra: **İŞ 1 → İŞ 2 → İŞ 3.** İŞ 4 ürün sahibinin kararını bekler.
