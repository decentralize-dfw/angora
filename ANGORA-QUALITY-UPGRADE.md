# ANGORA 21 VIEWER — REAL-TIME ARCHVIZ QUALITY UPGRADE
## MASTER IMPLEMENTATION PROMPT (v3, code-verified)

> **Bu doküman doğrudan bir coding agent'a verilir.**
> İçindeki her sayı canlı repodan ölçülerek doğrulanmıştır — tahmin yoktur.
> Her `dosya:satır` referansı bu commit'te geçerlidir.
> **Bölüm 0.5'i okumadan hiçbir şey yapma:** elinde daha önce yazılmış iki
> prompt varsa, onların üç maddesi yanlıştır ve seni ölü koda yönlendirir.

---

# 0. ROL VE HEDEF

Sen senior Three.js/WebGL rendering engineer + technical artist +
real-time architectural visualization specialist olarak çalışıyorsun.

**Ürün:** `angora.mergvs.com` — MERGVS Angora 21 villası için emlak sunum viewer'ı.
**Kod:** custom Three.js r180 viewer, `viewer/` altında, renderer profili
`edetri-production-baseline-agx`, malzeme patch'i `angora-r27`, batched GLB teslimi.

**Hedef:** Kullanıcıda oluşan *"SketchUp export / karton maket / düz CAD massing"*
algısını yok etmek.

**Hedef DEĞİL:** Gerçek offline V-Ray path tracing. Hedef, web'de V-Ray *algısı*:
doğru albedo, köşe karanlığı, temas gölgesi, alçak kamera, altın saat, malzeme tepkisi.

**Motor değiştirme yok.** Babylon/Unity/PlayCanvas rewrite yok. Three.js r180 kalır.
Draco kalır. AgX kalır.

## ⛔ BİRİNCİ KISIT — HIZ VE MOBİL PERFORMANS PAZARLIK KONUSU DEĞİL

> **Bu proje iki hedefli değil, bir hedefli: "mevcut hızı koruyarak V-Ray algısı".**
> "Koruyarak" kelimesi bir temenni değil, bir **kabul kapısı**dır.
>
> **Referans: iPhone 13 / Safari. Ürün sahibi mevcut hızı "yeterli" kabul etti.**
> Yani hedef **iyileştirme değil, korunma**. Elde edilen hız kazançları
> kaliteyi finanse etmek içindir, daha yüksek FPS göstermek için değil.
>
> **Hiçbir faz, iPhone 13'te FPS'i veya ilk-interaktif süresini baseline'ın altına
> düşürerek kapanamaz.** Görsel kazanç ne kadar büyük olursa olsun.
> Bütçe aşılırsa **kalite kısılır, performans kısılmaz.**

Bunu mümkün kılan ölçülmüş gerçek şu: **mevcut build zaten hızlı değil.**

```
masaüstü 1422×1120 : 20,2 FPS · p95 54,6 ms · ilk hazır 16.711 ms
mobil GPU belleği  : ~314 MiB (iOS Safari sınırında — context-loss handler'ı bu yüzden var)
masaüstü GPU belleği: ~486 MiB
ilk yük            : 27,9 MiB
```

Ve bu sayılar **hiç gölge, hiç AO, hiç postfx yokken** alındı. Yani mevcut
maliyetin büyük kısmı kaliteye değil, **israfa** gidiyor:
çift taraflı 37 malzeme, sıkıştırılmamış 256 MiB doku, culling'siz 1,85 M üçgenlik
çevre, anizotropiyi öldüren `textureLod`, bahçede boşa hesaplanan 10 spot ışığı.

**Strateji: önce israfı kes, sonra kaliteyi o parayla satın al.**
Her faz kendi bütçesini kendi içinde denkleştirir — Bölüm 0.6.

---

# 0.5. ÖNCEKİ PROMPT'LARDAKİ ÜÇ KRİTİK HATA — ÖNCE BUNLARI OKU

Bu projeye daha önce iki quality-upgrade prompt'u yazıldı. İkisi de web üzerinden
build'e bakılarak hazırlandı, repo erişimi yoktu. Doğru teşhislerin yanında
**üç tane iş kaybettiren hata** var:

### HATA 1 — "emissive sıva hack'ini kaldır" görevi ölü kodu hedefliyor

Önceki prompt şunu söylüyor:

> *"In the material patch currently doing: plaster: envMapIntensity=0, normalMap=null,
> color=0.94^3, emissive=0.22^3, emissiveIntensity=1 → Change to emissive=0..."*

Bu kod gerçekten var — `viewer/src/material-response.js:95-120`. **Ama üretimde
asla çalışmıyor.** Fonksiyonun ilk satırı:

```js
// viewer/src/material-response.js:35
export function prepareMaterialResponse(material, {context=false}={}) {
  if(material?.userData?.angoraAuthoredPBR) return;   // <-- HER ZAMAN BURADA ÇIKIYOR
```

`tools/batch-delivery/build.mjs:96` yayına giden **37 malzemenin 37'sine de**
`angoraAuthoredPBR:true` yazıyor. Doğrulandı:

```
architecture-plaster-0 ... authoredPBR=True
architecture-tile-1    ... authoredPBR=True
(… 37/37 True)
```

Aynı guard `setMaterialScale` (`:146`) ve `setInteriorMode` (`:156`) için de geçerli.
Yani **`material-response.js`'in tamamı (192 satır) üretimde ölü.**

**Düz görünümün gerçek kaynağı başka yerde** — Bölüm 1.2'ye bak. O dosyayı
düzeltirsen hiçbir piksel değişmez.

### HATA 2 — `Cache-Control: immutable` bu hosting'de imkânsız

Önceki prompt: *"Hashed glb/ktx2/hdr: Cache-Control public, max-age=31536000, immutable"*

Site **GitHub Pages**'te yayınlanıyor:
- `CNAME` → `angora.mergvs.com`
- `.github/workflows/` içinde **deploy workflow yok** — Pages doğrudan `main`
  dalının kök `index.html`'ini servis ediyor (`README.md` bunu açıkça söylüyor)
- GitHub Pages **özel `Cache-Control` header'ı kabul etmez**; tüm asset'lere
  sabit `max-age=600` gönderir ve bu override edilemez

Bu bir kod görevi değil, **hosting kararı**. Task 4.3'e bak.

### HATA 3 — İki prompt da malzemeyi Phase 3'e koyuyor. Malzeme Phase 1'dir.

İki prompt da sırayı şöyle kuruyor: flags → gölge → kamera → *sonra* malzeme.
Ama ölçüm şunu söylüyor: **sahnedeki 177 yüzey renginden 158'i tek düz RGB.**
Gölge ve postfx bunu kurtaramaz — düz renkli bir duvar mükemmel gölgeyle de düz görünür.

Üstelik malzeme için **yeni asset üretmeden** yapılabilecek bir adım var
(`exterior-grade.js` dirilmesi, Task 1.3) ve o, tek başına Faz 1'in en büyük
görsel kazancı. Bu doküman sırayı ona göre kurdu.

---

# 0.6. PERFORMANS BÜTÇE DEFTERİ — kalite kendi parasını ödemek zorunda

**Kural:** Her kalite özelliği bir **maliyet kalemi**dir ve **aynı faz içinde**
ölçülmüş bir **tasarruf kalemi** ile finanse edilmelidir.
Faz sonunda net frame-time değişimi **≤ 0** olmalı.

Bu yüzden Faz 1'de ucuz perf kazançları (Task 1.4, 1.6) ile pahalı kalite
kazançları (Task 1.2, 1.3) **birlikte** teslim edilir — ayrı ayrı değil.
Task 1.2'yi tek başına merge etme.

## 0.6.1 — Faz 1 bütçesi (tahminî; FAZ 0 baseline'ıyla doğrulanacak)

| # | Kalem | Yön | Tahminî etki (desktop villa) | Tahminî etki (mobile-high) |
|---|---|---|---|---|
| 1.4a | `doubleSided` → seçici | **KAZANÇ** | fragment işi −25…45 % | −25…45 % |
| 1.4b | Görünüm bazlı görünürlük + plants chunk'lama | **KAZANÇ** | walk'ta −1,85 M üçgen | −1,4 M üçgen |
| 1.6a | Bahçede 10 spot döngüsü silme | **KAZANÇ** | bahçe fragment'i −%30 | aynı |
| 1.6b | Atlas dokularında anisotropy 16 → 1 | **KAZANÇ** | filtre bant genişliği ↓ | ↓ |
| 1.5 | FOV + fog | ~nötr | fog sadece region/neigh., +1 ucuz mul | aynı |
| 1.3 | exterior-grade detail map (3 doku, grid=1) | ~nötr / hafif kazanç | `atlasSample` bypass → **−8 dFdx/dFdy** o malzemelerde; +3 doku bant genişliği | aynı |
| 1.2 | **Güneş gölgesi (proxy, 2048/1024)** | **MALİYET** | +1 depth pass × ≤80 k üçgen ≈ mevcut beauty'nin **%2,5'i**; shader'da +PCF örnekleme | +1 depth pass × ≤80 k, 1024² |
| 1.1 | **GTAO @0.5 + SMAA + bloom + grade** | **MALİYET** | +4 tam ekran pass | **mobilde AÇILMAZ — 0** |

**Net beklenti:**
- **mobile-high:** kalemlerin tamamı kazanç, tek maliyet 1024² proxy depth pass →
  **FPS artmalı.** Artmazsa Task 1.2 mobile-high'ta da kapatılır (`mobile-low`'a düşer).
- **mobile-low:** hiçbir maliyet kalemi yok, tüm kazançlar var → **belirgin hızlanma.**
- **desktop:** 1.4a + 1.4b + 1.6 kazancı, 1.1 + 1.2 maliyetini karşılamalı.
  Karşılamazsa **GTAO `desktop-high`'a kilitlenir**, `desktop-balanced` postfx'siz kalır.

## 0.6.2 — Mobil mandalı (ratchet) — geri dönülemez kural

### ⭐ Referans cihaz ve kabul edilmiş durum — ÜRÜN SAHİBİ KARARI

> **Cihaz: iPhone 13 / Safari.**
> **Mevcut hız ürün sahibi tarafından "yeterli / kâfi" olarak kabul edilmiştir.**
>
> Bu, projenin hız hedefini kesinleştirir: **iyileştirme aranmıyor, korunma aranıyor.**
> Mandal bu cihazda ölçülen mevcut değerlerdir. Hedef, o değerlerin altına inmemektir.

Pratik sonuçları:
- **Faz 0'ın tek zorunlu cihazı iPhone 13'tür.** Android ölçümü faydalıdır ama
  kapı değildir — iOS Safari zaten en sıkı WebGL bellek bütçesine sahip olan.
- **"Daha hızlı yap" bir görev değildir.** Faz 2'nin (progressive loader, LOD)
  ve Faz 4.1'in (KTX2) kazançları hızı artırmak için değil, **Faz 1 ve Faz 3'ün
  kalite maliyetini finanse etmek** için vardır.
- Bir kalite kalemi iPhone 13'te mandalı kırıyorsa, o kalem **iPhone'da kapatılır**
  (`mobile-high` profilinden düşürülür) — masaüstünde açık kalabilir.
  Kalite profillerinin tamamen ayrı olmasının sebebi budur.
- Ölçümde `iPhone 13 → mobile-high` tier'ına düşmelidir
  (`deviceMemory` 4 GB, `hardwareConcurrency` 6) — `detectTier()` bunu
  **doğrulamalı**, yanlışlıkla `mobile-low`'a düşürmemelidir. Faz 0'da test et.

### Mandal dosyası

`build/qa/ratchet.json` dosyası tutulur. Her faz sonunda **gerçek telefonda**
ölçülen değerler buraya yazılır ve **asla kötüleşemez**:

```json
{
  "baseline": { "commit": "<faz0>", "device": "iPhone 13 / Safari",
                "acceptedByOwner": true,
                "villaFps": 0, "p95FrameMs": 0, "firstInteractiveMs": 0,
                "firstInteractiveBytes": 0, "gpuTextureMiB": 0, "contextLost": false },
  "current":  { "...": "aynı şema" },
  "gate": {
    "villaFps":              ">= baseline.villaFps",
    "p95FrameMs":            "<= baseline.p95FrameMs * 1.05",
    "firstInteractiveMs":    "<= baseline.firstInteractiveMs",
    "firstInteractiveBytes": "<= baseline.firstInteractiveBytes",
    "gpuTextureMiB":         "<= baseline.gpuTextureMiB",
    "contextLost":           "=== false"
  }
}
```

**Bir gate kırılırsa faz kapanmaz.** Çözüm sırası, bu sırayla:
1. Maliyet kalemini **o tier'da kapat** (kalite profilinde `false`)
2. Maliyet kalemini **o görünümde kapat** (örn. gölgeyi sadece `villa`/`floor`'da bırak)
3. Kalite kalemini **düşür** (shadow 1024 → 512, GTAO 0.5 → 0.35)
4. **Asla:** "mobilde biraz yavaşladı ama çok güzel oldu" diyerek geçme

`?debug=quality` overlay'i bu gate'lerin canlı durumunu göstersin
(yeşil/kırmızı), böylece geliştirme sırasında fark edilsin.

## 0.6.3 — "Ucuz" ve "pahalı" kalitenin ayrımı

Aynı görsel etkiyi veren iki yoldan **her zaman ucuz olanı seç**:

| İstenen etki | ❌ Pahalı yol | ✅ Bu projede seçilecek yol |
|---|---|---|
| Villa zemine otursun | tüm sahne shadow map 4096 | villa-local 2048 proxy, olay bazlı güncelleme |
| Köşeler kararsın | her yerde GTAO | repack'li baked AO (her tier) + GTAO yalnız desktop villa/iç |
| Cephe dokulu olsun | 2K basecolor her yüzeye | tileable normal + grade map, `grid=1` malzemelerde atlas bypass |
| Cam çevreyi yansıtsın | SSR / planar reflection | PMREM probe'a basit çevre kütlesi ekle (Task 3.4f) — **tek seferlik maliyet** |
| Havuz gerçek görünsün | SSR | 2 kayan normal + fresnel + derinlik absorpsiyonu |
| Uzak mahalle iyi görünsün | yüksek poly + gölge | instance + LOD2 + impostor + baked |
| Yumuşak gölge kenarı | yüksek PCF sample | kamera durunca birikim (Faz 5, sadece desktop-high) |
| Mobilya ışık alsın | 10 realtime spot | vertex fixture (mevcut) + repack'li electric bake |
| Derinlik hissi | SSAO + DOF | alçak FOV + altın saat + horizon-renkli fog (region/neigh.) |

## 0.6.4 — Mobil için kırmızı çizgiler

`mobile-low` ve `mobile-high`'da **asla** açılmayacaklar:
GTAO · bloom · grade pass · dither pass · SMAA composer · planar reflection ·
`MeshPhysicalMaterial` transmission · path tracing / birikim · fog (interior/floor'da) ·
çoklu shadow cascade · 2048+ shadow map · 2K HDRI · 512 probe

`mobile-high`'da **koşullu** (sadece ratchet gate yeşilse):
villa-local 1024 shadow map · exterior-grade detail map · TANGENT attribute

**Her mobil eklemesi tek tek ölçülür ve tek tek geri alınabilir olmalı.**
Toplu merge yok.

---

# 0.7. ÇALIŞMA SÖZLEŞMESİ — ENGELLER, YETKİLER, YASAKLAR

> **Bu bölüm dokümanın en önemli kısmıdır.** Ajan olarak yapabileceklerin ve
> yapamayacakların burada yazılı. Bunu okumadan bir göreve başlarsan,
> yapamayacağın bir işi "yaptım" diye raporlama riskin var.

## 0.7.1 — Ortamda NE VAR, NE YOK (doğrulandı)

| Araç | Durum | Sonuç |
|---|---|---|
| `node` v22 + `npm` | ✅ var | `cd viewer && npm ci` çalışır |
| **Chromium + Playwright** | ✅ var (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`) | **Masaüstü ölçüm ve screenshot YAPABİLİRSİN** |
| Python 3 + Pillow | ✅ var | GLB/doku analizi, atlas dilimleme yapabilirsin |
| `sharp` (npm) | ⚠️ kurulabilir | `tools/batch-delivery` için `pnpm install` gerekir |
| **`../model-finalization/web`** | ❌ **YOK** | **`build.mjs` ÇALIŞTIRILAMAZ** — Bölüm 0.7.2 |
| **`build/blender/*.blend`** | ❌ **LFS pointer** (134 B; gerçeği 217 MB) | Blender işi yapılamaz |
| **`git lfs`** | ❌ **kurulu değil** | `.blend` indirilemez |
| **Blender** | ❌ **kurulu değil** | Bake/UV repack yapılamaz |
| **iPhone 13** | ❌ (fiziksel cihaz) | **Mobil mandal ölçümü YAPAMAZSIN** |
| `playwright` npm paketi | ⚠️ kurulu değil | `npm i -D playwright` ile kur; **tarayıcı indirme, `executablePath` kullan** |

`npm i -D playwright` sonrası **asla `playwright install` çalıştırma** —
tarayıcı zaten `/opt/pw-browsers/chromium` altında.

## 0.7.2 — ⚠️ `build.mjs` çalıştırılamaz — ama buna İHTİYACIN YOK

`tools/batch-delivery/build.mjs:15` kaynağı şurada arıyor:
```js
const source = path.resolve(process.argv[2] ?? path.join(repo,'../model-finalization/web'));
```
Bu dizin **repoda yok** ve sağlanmayacak. Yani:

> **Yayındaki GLB'leri yeniden ÜRETEMEZSİN. Ama YERİNDE YAMALAYABİLİRSİN.**

`tools/batch-delivery/refresh-detail.mjs` bu tekniği zaten kullanıyor:
GLB'yi oku → JSON chunk'ı değiştir → offsetleri yeniden hesapla → yaz →
**Draco stream'lerinin byte-byte aynı kaldığını doğrula.**

### Test edilmiş yama fonksiyonu — bunu kullan

`tools/batch-delivery/patch-glb.mjs` olarak oluştur:

```js
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sha = b => createHash('sha256').update(b).digest('hex');

/** GLB'nin JSON chunk'ını değiştirir; BIN chunk'a HİÇ dokunmaz.
 *  BIN bir bayt değişirse fırlatır — Draco geometrisi kutsaldır. */
export async function patchGlbJson(file, mutate){
  const input  = await fs.readFile(file);
  if(input.readUInt32LE(0)!==0x46546C67) throw Error('glTF değil: '+file);
  const jsonLen  = input.readUInt32LE(12);
  const doc      = JSON.parse(input.subarray(20, 20+jsonLen).toString('utf8'));
  const binStart = 20 + jsonLen;
  const binLen   = input.readUInt32LE(binStart);
  const bin      = input.subarray(binStart+8, binStart+8+binLen);
  const before   = sha(bin);

  mutate(doc);                                  // <-- senin değişikliğin

  const json   = Buffer.from(JSON.stringify(doc),'utf8');
  const padded = Buffer.concat([json, Buffer.alloc((4-json.length%4)%4, 0x20)]);
  const out    = Buffer.alloc(12 + 8 + padded.length + 8 + bin.length);
  out.write('glTF',0,'ascii'); out.writeUInt32LE(2,4); out.writeUInt32LE(out.length,8);
  out.writeUInt32LE(padded.length,12); out.writeUInt32LE(0x4E4F534A,16); padded.copy(out,20);
  const bo = 20 + padded.length;
  out.writeUInt32LE(bin.length,bo); out.writeUInt32LE(0x004E4942,bo+4); bin.copy(out,bo+8);

  if(sha(out.subarray(bo+8, bo+8+bin.length)) !== before)
    throw Error('BIN chunk değişti — iptal: '+file);
  return out;
}
```

**Bu fonksiyon test edildi:** `architecture.glb` üzerinde 11 malzemenin 10'u
tek-taraflıya çevrildi, dosya 5.856.884 → 5.856.896 B oldu,
**Draco BIN chunk'ı byte-byte aynı kaldı**, `extensionsRequired` korundu.

### Bu teknikle yapılabilecekler (kaynak gerekmez)

| Görev | Yöntem | Kaynak gerekir mi |
|---|---|---|
| **Task 1.4 `doubleSided`** | JSON chunk: `material.doubleSided=false` | ❌ gerekmez |
| Malzeme `extras` ekleme/değiştirme | JSON chunk | ❌ |
| `alphaMode`, `alphaCutoff` düzeltme | JSON chunk | ❌ |
| `KHR_materials_*` uzantısı ekleme | JSON chunk | ❌ |
| **Task 4.1 KTX2** | bufferView içeriğini değiştir (`refresh-detail.mjs` modeli) | ❌ — mevcut WebP'yi decode edip KTX2'ye çevir |
| **Task 3.3 texture2DArray** | Mevcut atlası Pillow/sharp ile dilimle, katman dizisi üret | ❌ |
| Shadow proxy üretimi | `@gltf-transform` ile mevcut `architecture.glb`'den simplify | ❌ |
| `interior.glb`'yi kata bölme | primitive bazlı ayırma + Draco stream'leri taşıma | ❌ (zor ama mümkün) |
| Yeni UV kanalı, yeni geometri, bevel | — | ✅ **Blender gerekir → YAPAMAZSIN** |
| Lightmap/AO yeniden pişirme | — | ✅ **Blender gerekir → YAPAMAZSIN** |
| Yeni basecolor/normal doku yazarlığı | — | ✅ **YAPAMAZSIN** |

**Kural:** `build.mjs`'i **yine de düzelt** (gelecekte kaynakla çalıştırılacak),
ama **teslim ettiğin sonuç yama script'i + yamalanmış GLB olmalı.**
`build.mjs`'i değiştirip "yeniden build edilince düzelecek" deme — bu teslim değildir.

## 0.7.3 — Yapamayacağın işler: İNSAN GÖREV LİSTESİ

Bu işler **sende değil.** Karşılaştığında Bölüm 0.7.4'teki protokolü uygula.

| # | İş | Neden sende değil | Hangi task |
|---|---|---|---|
| H1 | **iPhone 13 ölçümü** (baseline + her faz) | Fiziksel cihaz | Faz 0.4, tüm mandal kapıları |
| H2 | **Blender bake** (lightmap/AO/probe/HDRI) | Blender + 217 MB LFS yok | 3.4 |
| H3 | **Malzeme yazarlığı** (fotoğraf kalibreli doku) | Blender + sanatçı kararı | 3.1 |
| H4 | **Bevel + weighted normals + mesh temizliği** | Blender | 3.2 |
| H5 | **Hosting kararı** (Cloudflare / Netlify / R2) | Hesap + DNS erişimi | 4.3 |
| H6 | **`../model-finalization/web` kaynağının sağlanması** | Sahipte | build.mjs |
| H7 | **Gerçek telefonda gece modu ölçümü** | Fiziksel cihaz | 3.4g |

## 0.7.4 — 🚦 ENGEL PROTOKOLÜ — bir iş sende değilse

Bir göreve geldin ve yapamıyorsun. **Üç seçeneğin var ve sırası bu:**

**1. ETRAFINDAN DOLAŞ.** Gerçekten imkânsız mı, yoksa alışılmış yol mu kapalı?
   `build.mjs` çalışmıyor → GLB'yi yamala (0.7.2). Blender yok → atlası
   Pillow ile dilimle. **Önce bunu dene ve denediğini raporla.**

**2. KISMİ TESLİM ET + AÇIKÇA İŞARETLE.** Görevi ikiye böl:
   senin yapabildiğin kod tarafı + insana kalan içerik tarafı.
   Kod tarafını **tam** bitir, insan tarafını `BLOCKED.md`'ye yaz:

```markdown
## H1 — iPhone 13 baseline ölçümü
**Durum:** BLOCKED — fiziksel cihaz gerekli
**Hazırladığım:** viewer/src/qa-harness.js + ?stats=1 + 12 kamera URL'i
**İnsandan istenen:**
  1. iPhone 13 Safari'de şu URL'i aç: <URL>
  2. Sayfadaki "Ölçümü başlat" düğmesine bas, 15 s bekleme
  3. Çıkan JSON'u kopyala, build/qa/ratchet.json içine `baseline` olarak yapıştır
**Bloke ettiği:** Faz 0 kapanışı, tüm mandal kapıları
**Bloke ETMEDİĞİ:** Faz 1'in kod görevleri (masaüstü ölçümüyle ilerlenebilir)
```

**3. DURMA, DEVAM ET.** Bloke iş **sadece kendisini** bloke eder.
   Faz 1'in kod görevleri iPhone ölçümü olmadan da yazılabilir ve
   masaüstü Chromium'da ölçülebilir. **Bekleme, ilerle, sonunda raporla.**

### ⛔ MUTLAK YASAKLAR

- **Sayı uydurma.** Ölçemediğin hiçbir metriği yazma. Tahmin ediyorsan
  `"estimated": true` ve nasıl tahmin ettiğini yaz. `ratchet.json`'da
  ölçülmemiş alan `null` kalır, `0` değil.
- **`BLOCKED` işi `done` işaretleme.** Kısmi teslim kısmi raporlanır.
- **"Yeniden build edilince düzelecek" deme.** Teslim = çalışan çıktı.
- **Faz kapatma yetkisi sende değil** — mandal tablosunda ölçülmemiş satır
  varsa faz "kod tarafı bitti, ölçüm bekliyor" durumundadır, "bitti" değil.
- **Testi silme/skip etme.** Kırmızı test kırmızı kalır ve raporlanır.
- **Emülasyonu gerçek cihaz diye sunma.** Chromium'un mobil emülasyonu
  masaüstü GPU'da çalışır; FPS'i mobil FPS değildir. Emülasyon ölçümlerini
  `"emulated": true` ile işaretle ve mandala **yazma**.

## 0.7.5 — ANTİ-TEMBELLİK SÖZLEŞMESİ

Bu doküman uzun. Her görevin sonunda bir kabul listesi var. Sözleşme:

1. **Bir task'ı, kabul listesinin HER maddesi ✅ olmadan kapatma.**
   Bir madde ölçülemiyorsa (insan işi), `BLOCKED` yaz — atlamak yok.
2. **`TODO`, `FIXME`, stub fonksiyon, boş `catch`, `// implement later`
   bırakma.** Bırakacaksan `BLOCKED.md`'ye taşı.
3. **"Büyük ölçüde", "çoğunlukla", "temelde tamamlandı" yasak.** Sayı ver.
4. **Her shader değişikliğinin gerçekten derlendiğini kanıtla.**
   `onBeforeCompile` içinde yaptığın `replace()` eşleşmezse sessizce hiçbir
   şey olmaz. Her enjeksiyon için assertion testi yaz:
   ```js
   // tests/shader-injection.test.mjs
   const src = captureFragmentShader(material);
   assert.ok(src.includes('groundVisibility'), 'ground-light enjekte edilmedi');
   assert.ok(!src.includes('#include <lights_fragment_begin>'), 'chunk değişmedi');
   ```
   **Bu testler olmadan "shader'ı değiştirdim" demek kanıtlanmamış iddiadır.**
5. **Her task için en az bir yeni test.** `viewer/tests/` altına,
   mevcut 67 testin yanına. Task listesi → test listesi eşlemesi
   final raporda olmalı.
6. **Kod yazdıktan sonra çalıştır.** `npm test` + Playwright ile en az bir
   gerçek sayfa yüklemesi. Tarayıcı konsolunda hata = task kapanmaz.
7. **Her faz sonunda `git diff --stat` ver.** Değişmediğini söylediğin bir
   dosya diff'te görünüyorsa açıkla.

## 0.7.6 — Masaüstü ölçüm ve screenshot harness'i (BUNU SEN YAPACAKSIN)

Chromium var, yani **masaüstü tarafının tamamını sen ölçebilirsin.**
Mazeret yok. `viewer/scripts/qa-capture.mjs` oluştur:

```js
// npm i -D playwright   (playwright install ÇALIŞTIRMA)
import {chromium} from 'playwright';
import {CAMERAS} from '../src/qa-cameras.js';

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH
    ? '/opt/pw-browsers/chromium/chrome-linux/chrome' : undefined,
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
});
// ⚠️ SwiftShader yazılım rasterizer'dır: FPS'i GERÇEK GPU FPS'i DEĞİLDİR.
// Screenshot ve draw-call/triangle/program sayımı için GEÇERLİ,
// FPS/p95 için ölçümü "softwareRaster": true ile işaretle.
for (const cam of CAMERAS) {
  const page = await browser.newPage({viewport: cam.viewport});
  await page.goto(`http://localhost:4173/${cam.url}`, {waitUntil:'networkidle'});
  await page.waitForFunction(() => document.querySelector('#viewport')?.dataset.deliveryStats);
  await page.screenshot({path:`build/qa/${tag}/${cam.id}.png`});
  const stats = await page.evaluate(() => JSON.parse(
    document.querySelector('#viewport').dataset.qaReport));
  ...
}
```

**Ölçebileceklerin (yazılım rasterizer'da bile geçerli):**
draw calls · triangles · programs · geometries · textures ·
`estimatedTextureMiB` · `estimatedGeometryMiB` · ilk-interaktif byte ·
istek sayısı ve sırası · shader enjeksiyon doğrulaması · görsel diff

**Ölçemeyeceklerin:** gerçek FPS, gerçek p95, gerçek GPU bellek basıncı,
context loss davranışı. Bunlar `"softwareRaster": true` ile işaretlenir ve
**mandala yazılmaz.**

> Yani: **geometri/draw-call/bellek/byte tarafında mazeretin yok, sen ölçersin.
> Sadece FPS tarafı insana kalır.**

---

# 1. DOĞRULANMIŞ MEVCUT DURUM (ölçüldü, tahmin değil)

## 1.0 — Ana anahtar: tek bir bayrak tüm kalite hattını kapatıyor

```js
// viewer/src/main.js:577
lighting = createLighting(renderer, scene, camera, clip,
  {baked: modelRoot.pathname.includes('/batched/')});
```

`main.js:61` → Pages build'inde model kökü her zaman `build/web/batched/{desktop|mobile}/`.
Yani **`baked === true`, her zaman.** Minified bundle'da da doğrulandı:
`web-assets/index-BvKdm6wH.js` → `{baked:n3.pathname.includes("/batched/")}`.

Sonuçlar (`viewer/src/lighting.js`):

| Satır | Kod | Üretimdeki değer |
|---|---|---|
| `:123` | `renderer.shadowMap.enabled = !baked` | **false** |
| `:131` | `sun.castShadow = !baked` | **false** |
| `:196` | `light.castShadow = !compact && !baked` | **false** (10 spot) |
| `:165` | `compactOutput = baked && !compact ? new CompactOutput() : null` | desktop'ta FXAA benzeri tek geçiş |
| `:167` | `if(!compact && !baked){ composer = ... }` | **composer hiç kurulmuyor** |

**Üretimde çalışmayan, ama bundle'da taşınan kalite kodu:**

| Modül | Satır | Neden ölü |
|---|---|---|
| `GTAOPass` / `SectionGTAOPass` | `lighting.js:23-82` | composer yok |
| `SMAAPass` | `lighting.js:171` | composer yok |
| `LinearBloomPass` | `linear-bloom.js` (78) | composer yok |
| `GradeShader` (AgX+lift/gain/sat/vignette) | `grade-pass.js` (118) | composer yok |
| `DisplayDitherShader` | `display-dither.js` (24) | composer yok |
| `section-normal-materials.js` | (31) | sadece GTAO kullanıyor |
| `postprocessing.js` | (5) | composer yok |
| **`exterior-grade.js`** | **(194)** | `manifest.assets.some(a=>a.exterior_grade)` gerekiyor; batched manifest'te `assets` yok, `parts` var. **Hiçbir manifest'te `exterior_grade` yok (grep: 0)** |
| **`viewer/public/textures/*.png`** | **1,2 MB** | yukarıdakine bağlı → **hiç indirilmiyor** |
| `material-response.js` — 3 fonksiyon | (192) | `angoraAuthoredPBR` guard'ı |
| `baked-lighting.js` — `prepareBakedLighting` | (18) | `angoraLightMapTexture` extras'ı batched GLB'lerde yok |
| `context-massing.js` — `createContextMassing` | `main.js:1470` | `groups.get('context')` batched'de yok → `massing === null` |
| `context-batch.js` — 48 m chunk culling | (59) | sadece legacy yol |
| basis transcoder (585 KB, `web-assets/`) | — | batched GLB'ler WebP kullanıyor, KTX2 yok |

**Bundle: 2,132,046 B ham / 746,860 B gzip.** Önemli kısmı hiç çalışmayan shader.

## 1.1 — Gölge: sitede gerçek gölge yok

Gerçek zamanlı gölge kapalı. Yerine iki statik harita var:

| | `ground-light.webp` | `floor-light.webp` |
|---|---|---|
| Çözünürlük | 512×512 (VP8L) | 512×512, 4 kata bölünmüş (kat başına 256²) |
| Kapsadığı alan | 215 m × 235 m | 30 m × 33 m |
| **Texel başına** | **0,42 m** | **0,117 m** |
| Gölge bilgisi taşıyan texel | **%14,3** | **%11,3** |
| Kanallar | R = direct sun, G = local ambient | aynı |
| Pişirildiği güneş | 21 Haziran 12:30, **tek yön** | aynı |

Fade fonksiyonu (`viewer/src/ground-light.js`):

```js
setSun(sun){ strength = clamp((direction·sun - 0.985) / 0.014, 0, 1); }
```

Gerçek güneş denklemleriyle (`daylight.js`, Ankara 39.88/32.73) hesaplandı.
Arayüzdeki slider 06:00–21:00:

```
21 Haziran : gölge YALNIZCA 11:50 – 13:10 arası görünür
             tam güçte 25 dakika · 15 saatin 13,7 saatinde HİÇ GÖLGE YOK
21 Mart    : hiçbir saatte gölge YOK
21 Aralık  : hiçbir saatte gölge YOK
```

**Ve villa bu haritayı hiç almıyor:**

```js
// viewer/src/lighting.js:296
if(name==='context-ground' || (name==='garden' && !/metal|glass|wood/.test(material.name)))
  groundLight?.apply(material);
```

Sadece çevre zemini ve bahçe. **Villanın cephesi, çatısı, saçağı, balkonu
hiçbir güneş-görünürlük terimi almıyor.** Ev zemine gölge düşürüyor (pişmiş),
ama kendisi hiçbir şeyden gölge almıyor.

`floorLight` (`:297`) sadece iç zeminlere uygulanıyor.

## 1.2 — Malzeme: asıl "SketchUp" sebebi

Yayına giden tüm GLB atlasları açılıp **hücre hücre** ölçüldü (padding hariç,
hücre içi standart sapma):

```
Düz renk olan base-color hücresi: 158 / 177   (%89,3)
```

| Malzeme | Hücre px | sd | Sonuç | Renk |
|---|---|---|---|---|
| **STRUCCO** (ana cephe) | 1008 | 2.03 | **DÜZ RENK** | `#cdd1d5` |
| **Clay tile** (çatı) | 1008 | 1.92 | **DÜZ RENK** | `#a86a49` |
| **INTERIOR** (iç duvar) | 1008 | 2.32 | **DÜZ RENK** | `#eaeae8` |
| ceiling | 496 | 0.03 | **DÜZ RENK** | `#eaeae8` |
| metal | 1008 | 0.00 | **DÜZ RENK** | `#282a2c` |
| stone_tile | 1008 | 3.17 | **DÜZ RENK** | `#bab6ab` |
| foliage | 248 | 0.06 | **DÜZ RENK** | `#3d582f` |
| water (havuz) | 504 | 0.02 | **DÜZ RENK** | `#b8e3e6` |
| neighbor_wall | 504 | 1.91 | **DÜZ RENK** | `#dddad4` |
| grass | 248 | 5.35 | zayıf | `#63773e` |
| WOOD-FL (parke) | 1008 | 7.25 | zayıf | `#7e4527` |

`interior.glb`'deki ~120 mobilya/tefriş malzemesinin **neredeyse hepsi sd = 0.00–0.3.**
Normal haritaların çoğu **birebir sd = 0.00** → saf `(128,128,255)`, sıfır kabartma.

### Kaynağın kendisi zaten düz

`assets/pbr/pbr-maps.zip` (9,6 MB, 78 malzeme, 390 PNG) açıldı ve ölçüldü:

```
basecolor : 63/78 harita  4×4 PİKSEL   (sabit renk)
roughness : 78/78 harita  4×4 PİKSEL   (sabit)
metallic  : 78/78 harita  4×4 PİKSEL   (sabit)
orm       : 78/78 harita  4×4 PİKSEL   (sabit)
normal    : 46/78 harita  4×4 PİKSEL   (düz)
```

Gerçek dokusu olan sadece 15 base-color (salon tablosu, yorgan, banyo karosu,
çatı kiremidi, limestone, terra_floor, birkaç ahşap).

`assets/pbr/README.md` bunu zaten itiraf ediyor:
*"Revision 14 corrects linear-to-sRGB encoding in **62 constant base-color maps**."*

**Bu bir render problemi değil, malzeme kütüphanesi problemi.**

### Atlas mimarisi kaliteyi ayrıca tavanlıyor

```js
// tools/batch-delivery/build.mjs:26
const size=512, pad=4;
// :63
const grid = mats.length<=1 ? 1 : mats.length<=4 ? 2 : 4;   // max 16 malzeme/atlas
```

- Desktop atlas 1024² → grid 4'te **hücre başına 248×248 px** (tekrarlı UV dahil)
- Mobile 512² → **120×120 px**
- Atlasların **%26'sı boş beyaz padding** (177/238 hücre kullanılıyor)
- `architecture-plaster-0`: 1024×1024 atlas, içinde **2 düz renk** → 4 MB GPU / 2 RGB
- `interior-metal-11`, `interior-other-10`, `architecture-metal-6`: 1024² atlas, **tek düz renk**

## 1.3 — Dolaylı ışık (GI) fiilen sıfır

37 malzemenin **4'ünde** dolaylı gün ışığı lightmap'i, **5'inde** AO var.
`interior.glb`'nin **14 malzemesinin hiçbirinde ikisi de yok.**

Lightmap'lerin UV doluluk ve değer ölçümü:

| Lightmap | Dolu texel | Dolu bölge ortalaması | Lineer katkı (×π) |
|---|---|---|---|
| INTERIOR (iç duvarlar) | **%4,1** | 17,5/255 | **0,018** |
| WOOD-FL (parke) | **%3,5** | 16,1/255 | **0,016** |
| STRUCCO (cephe) | %28,3 | 49,8/255 | 0,100 |

> **Bunu yeniden pişirmek tek başına para kaybıdır.** %4 doluluk demek, lightmap
> UV paketlemesinin bozuk olduğu demek. Önce UV repack, sonra bake.

AO doluluk: Clay tile %50,8 · INTERIOR %21,6 · STRUCCO %42,7 · stone_tile %30,0 · WOOD-FL %34,1.
Görsel inceleme: Clay tile AO'su, 1024² içine sıkıştırılmış binlerce ayrı kiremit adası →
**kiremit başına ~8×8 texel**, yani tek düz değer.

**Sahnedeki toplam ışık:**
- 1 × `DirectionalLight` (yoğunluk 1.8 "soft" / 2.4 "sun") — `lighting.js:130`
- 1 × `HemisphereLight` (0.06–0.40) — `lighting.js:129`
- 10 × `SpotLight` — ama `batched-material.js:33` mimari+iç mekân shader'larından
  spot döngülerini tamamen siliyor (`replaceAll('NUM_SPOT_LIGHTS','0')`).
  Yerine `fixture-vertices.js` **vertex başına** difüz hesaplıyor →
  mobilyadaki lamba ışığının düşüş eğrisi, sıcak noktası, yumuşak kenarı yok.
- Cycles'tan pişmiş `electric-*.webp` (yalnız INTERIOR/ceiling/WOOD-FL, 1024²)

**Bug:** `batched-material.js:33` koşulu `exterior || vertexFixtures`.
`garden` ikisine de girmiyor → **bahçe yüzeyleri fragment başına, hiç
göremeyecekleri 10 iç mekân spotunu hesaplıyor.**

## 1.4 — Çevre haritası (yansımalar)

`assets/lighting/kloofendal_48d_partly_cloudy_puresky_1k.hdr` — 1024×512, CC0,
**saf gökyüzü, yerde hiçbir şey yok.** `lighting.js:100-106` alt yarımküreyi
doldurmak için PMREM probe'una **düz `#6f7a60` zemin düzlemi** ekliyor.

Sonuç: camlar düz mavi gradyan + düz zeytin yeşili yansıtıyor. Komşu binalar,
ağaçlar, teras — hiçbiri yansımada yok. Oda probe'ları **512×256 px**
(mobilde 256×128), kat başına tek konum, parallaks yok.

`loadEnvironment` HDR'ı `THREE.FloatType` ile yüklüyor → yükleme anında ~8 MB.

## 1.5 — Performans: neden yavaş *bu haliyle bile*

Repo'nun kendi QA çıktıları (emüle tarayıcı, gerçek GPU zamanlaması değil —
repo bunu kendi de yazıyor):

```
build/web/batched/lighting/render-check.json   → 1280×720  masaüstü: 24,5 FPS
build/web/batched/lighting/quality-check.json  → 1422×1120 masaüstü: 20,2 FPS
                                                  p95 54,6 ms · ilk hazır 16.711 ms
tools/batch-delivery/README.md                 → 1422×1120: 15,6 FPS
```

Hiç gölge, hiç postfx, 41 draw call ile bu sayılar. Yapısal sebepler:

**a) 37/37 malzeme çift taraflı.**
```js
// tools/batch-delivery/build.mjs:84
output.createMaterial(...).setDoubleSided(true)   // KOŞULSUZ
```
3,14 M üçgenin hiçbirinde backface culling yok → kapalı hacimlerde ~2× fragment işi.
**Tek satır. En yüksek getiri/maliyet oranı olan perf düzeltmesi.**

**b) GPU belleği devasa, çünkü doku sıkıştırması yok.**
GLB'ler `image/webp` taşıyor. `extensionsUsed: ["KHR_draco_mesh_compression"]` —
**`KHR_texture_basisu` YOK.** WebP GPU formatı değil, RGBA8'e açılıyor:

| | Doku (RGBA8 + mip ×4/3) | Geometri (5,32 M vertex × ~36 B + index) | **Toplam** |
|---|---|---|---|
| Desktop | **256 MiB** (93 görsel: 33×1024² + 60×512²) | ~230 MiB | **~486 MiB** |
| Mobile | **124 MiB** (93×512²) | ~190 MiB | **~314 MiB** |

Mobilde ~314 MiB, iOS Safari WebGL bütçesinin tam sınırında.
`main.js:600` `webglcontextlost` handler'ının varlığı bu sınıra çarpıldığının kanıtı.
**İroni: bu 256 MiB'ın içeriği 177 düz renk.**

`KTX2Loader` kuruluyor (`texture-loader.js`), basis transcoder (585 KB) sunucuda
duruyor, batched yolda hiç kullanılmıyor — `main.js:1108` yüklemeden hemen sonra
`loader.ktx2Loader?.dispose()`.

**c) Atlas örneklemesi donanım filtrelemesini öldürüyor.**
```js
// viewer/src/batched-material.js:22
vec4 atlasSample(sampler2D tex, vec2 uv, float width, float maxLod){
  vec2 dx=dFdx(uv)*width*inner, dy=dFdy(uv)*width*inner;
  float lod=clamp(log2(max(max(length(dx),length(dy)),1.0)),0.0,maxLod);
  return textureLod(tex, atlasUV(uv), lod);
}
```
Bu `map`/`normalMap`/`roughnessMap`/`metalnessMap`'in dördünde birden yapılıyor:
- fragment başına **8 ekstra dFdx/dFdy**
- `textureLod` **anizotropik filtrelemeyi tamamen yok sayar** — ama
  `lighting.js:304` yine de her dokuya `anisotropy = 16` atıyor.
  **Bellek/filtre state harcanıyor, sıfır etki.**
- `maxLod = log2(width × pad)` (`batched-material.js:25`) → 1024² renkte **maks. mip 3**,
  512² normal/roughness'ta **maks. mip 2**. 8 texel'den fazla küçültmede mip yok →
  **uzaktaki kiremit, korkuluk, denizlik, yaprak titriyor.** Kullanıcının
  "crispy/pixelated" dediği şey budur. Desktop'ta FXAA gizlemeye çalışıyor,
  mobilde hiçbir şey gizlemiyor.

**d) TANGENT attribute yok.** Vertex attribute'ları:
`['NORMAL','POSITION','TEXCOORD_0','_BATCHID']` (+ bazılarında `TEXCOORD_1/2`).
Normal haritalar three'nin türev tabanlı `getTangentFrame()` yolunu kullanıyor —
çift taraflı yüzeylerle birleşince hem pahalı hem hatalı.

**e) Culling neredeyse yok.**
```
context-plants.glb   : 514.039 üçgen, TEK MESH, TEK DRAW  → frustum culling imkânsız
context-ground.glb   : 311.432 üçgen, TEK MESH
context-buildings.glb: 1.023.766 üçgen, 5 mesh → draw başına ~200k
```
```js
// viewer/src/native-delivery.js:90
for(const [name,model] of loaded)
  model.visible = name!=='interior' || /^f[0-3]$/.test(view);
```
**2. kattaki yatak odasında yürürken bile tüm mahallenin 1,85 M üçgeni
her karede GPU'ya gönderiliyor.** LOD sistemi yok; `createContextMassing`
üretimde `null`.

**f) İlk açılış yükü (desktop):**
```
JS bundle          2,13 MB ham / 747 KB gzip
6 × GLB           22,44 MB
ışık haritaları    1,79 MB
gökyüzü HDR        1,44 MB   (FloatType → yüklemede ~8 MB RAM)
sahne JSON         1,40 MB   (SIKIŞTIRILMAMIŞ)
────────────────────────────
İlk kareden önce  ~27,9 MiB      · ölçülen ilk-hazır: 16.711 ms
```

## 1.6 — Repoda zaten duran, kullanılmayan kalite

Bu en önemli yapısal gerçek. **Yüksek kaliteli paket zaten üretilmiş ve
bütçe uğruna atılmış:**

`build/web/native-current/` — **160 MB, 269 dosya**
- **113 adet KTX2 / 41,9 MB** — UASTC + ZSTD, **tam mip zinciri** (gerçek GPU sıkıştırması)
- İçinde **2 × 4096²** ve **7 × 2048²** AO bake, 39 × 1024², 37 × 512²
- 5 dolaylı gün ışığı haritası, 175 malzeme grafiği
- `NATIVE-DELIVERY.md`: *"64 Cycles sample ile 2K/4K'da 8 AO grubu yeniden pişirildi"*

Yayındaki `build/web/batched/` ise **22,4 MB'a** indirilmiş:
```js
// tools/batch-delivery/refresh-detail.mjs:81
manifest.texture_limits = {materialMax: profile==='desktop'?1024:512,
                           packageMaxMiB: profile==='desktop'?24:17};
// :90
if (bytes + electricBytes + reflectionBytes > packageMaxMiB*1024**2)
  throw Error('Delivery byte budget exceeded');
```
4096² AO → tek 1024² WebP (**16× daha az texel**). KTX2 → WebP
(**GPU sıkıştırması kayboldu, bellek 4× arttı**).

> **Kalite render motorunda kaybedilmedi. `build.mjs` içinde, 24 MiB paket
> bütçesini tutturmak için atıldı. Ve o bütçe bile mobilde 314 MiB GPU'ya
> dönüşüyor — yani takas hiç işe yaramamış.**

## 1.7 — Geliştirme ortamı gerçekleri

```bash
cd viewer && npm ci          # node_modules YOK; bu olmadan 30/67 test ERR_MODULE_NOT_FOUND verir
npm test                     # node --test tests/*.test.mjs  → 67 test
npm run dev                  # predev: scripts/prepare-native.mjs, vite :4173
npm run build:pages          # vite build --mode pages + scripts/stage-pages.mjs
                             # → kök index.html + web-assets/ üretir, commit edilir
```
- `viewer/vite.config.js`: `base:'./'`, pages modunda `assetsDir:'web-assets'`, `copyPublicDir:false`
- Yayın: GitHub Pages, `main` dalının kökü. `CNAME = angora.mergvs.com`. Deploy workflow yok.
- `?profile=desktop|mobile` ve `?model=lite|full|classic` debug override'ları zaten var
  (`main.js:59`, `main.js:80`).

---

# 2. MİMARİ YASA

Bu dört kavram **birbirinden tamamen bağımsız** olmalıdır. Hiçbiri diğerinden türetilemez,
hiçbiri URL string'inden okunamaz:

```
batchedGeometry   = mesh'ler nasıl paketlendi
bakedLighting     = GI / lightmap / probe var mı
dynamicSunShadow  = güneş shadow map'i açık mı
postProcessing    = GTAO / SMAA / bloom / grade açık mı
```

## 2.1 — Tek kalite nesnesi

```ts
// viewer/src/quality-profile.js  (YENİ DOSYA)

export type QualityTier =
  | "mobile-low" | "mobile-high" | "desktop-balanced" | "desktop-high";

export type ViewId =
  | "region" | "neighborhood" | "villa" | "floor" | "interior" | "plan";

export interface RenderQualityProfile {
  tier: QualityTier;
  view: ViewId;

  // geometri / teslim
  batchedGeometry: boolean;
  textureProfile: "mobile" | "desktop";
  maxPixelRatio: number;
  pixelBudget: number;              // drawing-buffer piksel tavanı

  // ışık
  bakedIndirectLighting: boolean;   // lightmap + probe + electric
  bakedReceiverVisibility: boolean; // ground-light / floor-light
  dynamicSunShadow: boolean;
  shadowMapSize: 0 | 1024 | 2048 | 3072;
  shadowCameraMode: "villa-local" | "floor-local" | "wide-proxy" | "disabled";
  shadowType: "pcfsoft" | "vsm";

  // post
  postProcessing: boolean;
  gtao: boolean;
  gtaoResolutionScale: number;      // 0.5 – 1.0
  antialiasing: "canvas-msaa" | "smaa" | "fxaa" | "none";
  msaaSamples: 0 | 2 | 4;
  bloom: boolean;
  grade: boolean;                   // GradeShader + vignette
  dither: boolean;

  // malzeme
  physicalGlass: "none" | "hero-only" | "all";
  planarPoolReflection: false | 0.25 | 0.5;
  anisotropy: number;
}
```

**Kural:** `lighting.js`, `main.js` veya başka hiçbir dosyada
`matchMedia('(pointer: coarse)')` ya da `pathname.includes('/batched/')`
doğrudan kalite kararı vermeyecek. Bu iki ifade sadece
`quality-profile.js` içinde, **tier seçimi** için kullanılabilir.

## 2.2 — Tier seçimi

`pointer: coarse` tek başına yeterli değil. Sinyaller:

```js
function detectTier() {
  const forced = new URLSearchParams(location.search).get('quality');
  if (forced) return forced;                       // debug override
  const stored = safeLocalStorage.get('angora-quality');
  if (stored && stored !== 'auto') return stored;  // kullanıcı tercihi

  const coarse = matchMedia('(pointer: coarse)').matches;
  const mem    = navigator.deviceMemory ?? (coarse ? 4 : 8);
  const cores  = navigator.hardwareConcurrency ?? 4;
  const gl     = probeWebGL();   // MAX_TEXTURE_SIZE, MAX_SAMPLES, ASTC/BC7 desteği
  const px     = screen.width * screen.height * devicePixelRatio ** 2;

  if (coarse && (mem <= 4 || cores <= 4 || gl.maxSamples < 4)) return 'mobile-low';
  if (coarse)                                                  return 'mobile-high';
  if (mem <= 8 || cores <= 4 || gl.maxTextureSize < 8192)      return 'desktop-balanced';
  return 'desktop-high';
}
```

UI'a **Otomatik / Performans / Dengeli / Yüksek** seçici ekle,
`localStorage['angora-quality']` içine yaz, private-mode için try/catch.

## 2.3 — Kalite matrisi (başlangıç değerleri; ölçümle ayarlanacak)

| | mobile-low | mobile-high | desktop-balanced | desktop-high |
|---|---|---|---|---|
| bakedIndirectLighting | ✅ | ✅ | ✅ | ✅ |
| bakedReceiverVisibility | ✅ | ✅ | ✅ | ✅ |
| **dynamicSunShadow** (villa/floor) | ❌ | ✅ | ✅ | ✅ |
| shadowMapSize | 0 | 1024 | 2048 | 2048 *(3072 sadece ölçümle)* |
| shadowCameraMode | disabled | villa-local | villa/floor-local | villa/floor-local |
| shadowType | — | pcfsoft | pcfsoft | pcfsoft *(VSM A/B)* |
| postProcessing | ❌ | ❌ | ✅ | ✅ |
| gtao | ❌ | ❌ | ✅ @0.5 (villa/interior) | ✅ @0.65–0.75 |
| antialiasing | canvas-msaa | canvas-msaa | smaa | smaa |
| msaaSamples | 0 | 0 | 0 *(SMAA ile birlikte MSAA kullanma)* | 0 |
| bloom | ❌ | ❌ | ✅ subtle | ✅ subtle |
| grade + dither | ❌ | ❌ | ✅ | ✅ |
| physicalGlass | none | hero-only | hero-only | hero-only |
| planarPoolReflection | ❌ | ❌ | 0.25 | 0.5 |
| maxPixelRatio | 1.5 | 2.0 | 2.0 | 2.0 |
| pixelBudget | 1.0 M | 1.5 M | 3.5 M | 5.0 M |
| anisotropy | 4 | 8 | 16 | 16 |
| textureProfile | mobile | mobile | desktop | desktop |

**Görünüm bazlı override'lar (her tier'ın üstüne):**

| view | dynamicSunShadow | shadowCameraMode | gtao | bloom |
|---|---|---|---|---|
| `region` | ❌ | disabled | ❌ | ❌ |
| `neighborhood` | ✅ (sadece desktop) | wide-proxy | ❌ | ❌ |
| `villa` | ✅ | villa-local | ✅ | ✅ |
| `floor` | ✅ | floor-local | ✅ | ✅ |
| `interior` | ✅ (sadece açıklıklardan) | floor-local | ✅ | ✅ |
| `plan` | ❌ | disabled | ❌ | ❌ |

---

# 3. DEĞİŞTİRİLEMEZ ÜRÜN GEREKSİNİMLERİ

Aşağıdakilerin **hiçbirinde regression olamaz.** Her sprint sonunda test edilecek:

Bölge görünümü · Yakın çevre · Villa · Bodrum/Giriş/1.kat/Çatı seçimi ·
1.60 m kat kesiti · Çatı katına özel düşük kesit · Plan modu · Plan modunda rotation kilidi ·
Isometric↔plan animasyonu · Mobilya toggle · Oda adları toggle · Ölçüler toggle ·
Fotoğraf pinleri ve viewer · İç mekân ışıkları toggle · Gün ışığı saat slider'ı ·
Mevsim seçimi (172/80/355) · Kat ve oda navigasyonu · 360 oda turu · Merdivenle kat değiştirme ·
Asansör navigasyonu (`lift.js`) · Mobil dokunma kontrolleri (1 parmak rotate, 2 parmak dolly/pan) ·
WebXR (`immersive-vr`) · TR/EN i18n · Rehberli sesli tur (`audio/angora21-tur.mp3`, `tour-script.js`) ·
Clipping plane geçişleri · Kesit yüzeyleri ve cap/hatch sistemi (`section.js`, `sections-current.json`) ·
Bölge haritası (`region-map.js`) · Paylaşım linki state'i (`share-state.js`) ·
**Gece dış cephesi: pencere parıltısı (`lighting.js:303 setWindowGlow`) ve
fixture boost'u (`lighting.js:272 interior(…,boost)`)** ·
Mevcut doğrulanmış ölçüler ve oda m² değerleri

> ⚠️ **`main` aktif bir daldır — bu doküman yazıldıktan sonra da özellik eklendi.**
> Faz 1'e başlamadan `git log --oneline <bu-commit>..origin/main -- viewer/src/`
> çalıştır ve yeni eklenen her özelliği bu korunacaklar listesine ekle.
> Rebase et, çakışmayı kendi lehine çözme. Yeni özellik = yeni regression testi.

**Geometri ve ölçü doğruluğu kutsaldır.** Topografya kot farkları (havuz tarafı sol
zemin ~2 m yüksek, sağ ~5-6 m alçak) korunacak. Triangle azaltma topografyayı düzleştirerek
yapılmayacak.

---

# 4. UYGULAMA — FAZ FAZ

> **Her değişiklik feature flag arkasında.** `viewer/src/features.js`:
> ```js
> export const FEATURES = {
>   qualityProfileV2:     true,
>   hybridSunShadow:      true,
>   exteriorGradeRevival: true,
>   authoredMaterialsV2:  false,
>   progressiveLoaderV2:  false,
>   ktx2Delivery:         false,
>   contextLodV2:         false,
>   cinemaStill:          false,
> };
> ```
> `?features=hybridSunShadow:0,ktx2Delivery:1` ile override edilebilsin.
> Her flag kapalıyken **eski davranış birebir korunmalı.**

---

## FAZ 0 — Baseline ve ölçüm altyapısı (0,5–1 gün)

**Tek satır render kodu değiştirmeden bitirilecek. Bu olmadan hiçbir iddia kabul edilmez.**

### Task 0.1 — Ortamı ayağa kaldır

```bash
cd viewer && npm ci && npm test       # 67/67 geçmeli
```
30 test şu anda `ERR_MODULE_NOT_FOUND: three` veriyor çünkü `node_modules` yok.
`npm ci` bunu çözüyor. **Kırmızı testle başlama.**

### Task 0.2 — Deterministik test kameraları

`viewer/src/qa-cameras.js` oluştur. 12 sabit görünüm, hepsi `share-state.js`
formatında serialize edilebilir olsun (böylece URL ile tekrar açılabilir):

```
C01 region                      C07 floor-f2 (1. kat kesiti)
C02 neighborhood                C08 floor-f3 (çatı katı kesiti)
C03 villa-front (ön cephe)      C09 plan-f1
C04 villa-pool (havuz tarafı)   C10 interior-salon (walk)
C05 floor-f0 (bodrum kesiti)    C11 interior-master-bedroom
C06 floor-f1 (giriş kesiti)     C12 interior-basement-kitchen
```

Her kamera için sabitle: `position`, `target`, `fov`, `zoom`, `hour=16.5`,
`season=172`, `style='sun'`, `quality`, `viewport` (desktop 1600×900, mobile 393×852).

### Task 0.3 — Ölçüm harness'i

`device-qa.js` ve `host.dataset.deliveryStats` zaten var — genişlet. Her kamera için
JSON üret:

```json
{
  "camera": "C03", "tier": "desktop-high", "commit": "abc1234",
  "timing":   { "firstMeaningfulPaint": 0, "firstInteractiveOrbit": 0,
                "villaReady": 0, "interiorReady": 0, "allReady": 0 },
  "frame":    { "fps": 0, "p50FrameMs": 0, "p95FrameMs": 0, "p99FrameMs": 0,
                "longestFrameMs": 0, "sampleSeconds": 15 },
  "renderer": { "drawCalls": 0, "triangles": 0, "programs": 0,
                "geometries": 0, "textures": 0,
                "drawingBuffer": [0,0], "pixelRatio": 0 },
  "memory":   { "estimatedTextureMiB": 0, "estimatedGeometryMiB": 0,
                "jsHeapMiB": 0 },
  "network":  { "firstInteractiveBytes": 0, "totalBytes": 0, "requests": 0 },
  "flags":    { "dynamicSunShadow": false, "gtao": false, "postProcessing": false },
  "contextLost": false
}
```

`estimatedTextureMiB` hesabı: her `texture.source.data` için
`w*h*4*(generateMipmaps?4/3:1)` (sıkıştırılmamış), KTX2 için gerçek format bpp.

### Task 0.4 — Baseline raporu ve **performans mandalının kurulması**

`build/qa/baseline-<commit>/` altına yaz:
- 12 kamera × {desktop-high, mobile-high} × {cold cache, warm cache} screenshot + JSON
- Ağ: Fast 4G / Slow 4G / yüksek gecikme profillerinde cold-cache timing
- `renderer.info` dökümleri

**⛔ GERÇEK CİHAZ ZORUNLU.** Emülasyon mandal için geçersizdir.
**Zorunlu cihaz: iPhone 13 / Safari** (ürün sahibinin referansı — Bölüm 0.6.2).
Android Chrome ölçümü faydalıdır, zorunlu değildir.

Repo'nun mevcut QA çıktıları (`quality-check.json`, `render-check.json`)
*"Codex in-app browser"* ile alınmış ve kendi içinde
*"No physical-phone or production-network claim"* diyor — **onları baseline sayma.**

Ölçüm protokolü (her cihaz için):
1. Cold cache, uçak modundan çık, Fast 4G
2. Siteyi aç → `firstInteractiveMs` ve `firstInteractiveBytes` kaydet
3. C03 (villa ön cephe) kamerasına git, **15 s sürekli orbit**, FPS/p95 kaydet
4. C06 → C07 → C08 kat geçişi, transition frame gap kaydet
5. C10 walk moduna gir, 30 s dolaş
6. **3 dakika kesintisiz kullanım** — context loss var mı?
7. `?stats=1` JSON'unu dışa aktar

Sonucu `build/qa/ratchet.json` → `baseline` alanına yaz (Bölüm 0.6.2 şeması).
**Bu dosya bundan sonra her fazın kabul kapısıdır ve asla kötüleşemez.**

### Task 0.5 — 📱 Mobil ölçüm sayfası (BLOKE İŞİ İNSANA DEVREDİLEBİLİR HALE GETİR)

iPhone 13'e erişimin yok (Bölüm 0.7.1) ama **ölçümü insanın 2 dakikada
yapabileceği hale getirebilirsin.** Bu senin işin, bloke değil.

`viewer/qa-mobile.html` oluştur — tek dosya, bağımlılıksız:
- Büyük "Ölçümü başlat" düğmesi
- Viewer'ı iframe'de veya aynı sayfada `?camera=C03&quality=mobile-high&stats=1` ile açar
- Protokolü **otomatik** yürütür: 15 s orbit → kat geçişleri → 30 s walk →
  3 dk bekleme, context-loss dinleyicisi açık
- Sonunda JSON'u ekranda gösterir + **"Kopyala" düğmesi** + QR/paylaş
- Ekranda adım adım Türkçe talimat: *"1. Bu sayfayı iPhone 13 Safari'de aç…"*

Bu sayfa `BLOCKED.md`'deki H1 maddesinin teslimatıdır.
**İnsanın yapması gereken tek şey: aç, bas, JSON'u yapıştır.**

### Kabul — AJAN TARAFI (mazeret yok, hepsi sende)
- [ ] `cd viewer && npm ci && npm test` → **67/67 yeşil**
- [ ] `viewer/src/qa-cameras.js` — 12 kamera, `share-state.js` formatında
- [ ] 12 kamera `?camera=C0x` ile açılıyor, iki kez açılışta piksel farkı **= 0**
- [ ] `viewer/scripts/qa-capture.mjs` çalışıyor, 12×2 screenshot üretiyor
- [ ] `?stats=1` → `host.dataset.qaReport` tam JSON şemasıyla dolu
- [ ] `estimatedTextureMiB` doğrulaması: masaüstü ≈ **256 MiB**, mobil ≈ **124 MiB**
      çıkmalı (bu dokümandaki ölçümle ±%10 uyuşmazsa harness hatalıdır, düzelt)
- [ ] `build/qa/baseline-<commit>/` commit edildi
- [ ] `viewer/qa-mobile.html` çalışıyor (masaüstü tarayıcıda da test edilebilir)
- [ ] `detectTier()` yazıldı ve **iPhone 13 profiliyle** (`deviceMemory` yok,
      `hardwareConcurrency` 6, `screen.min` 390, `pointer:coarse`)
      **`mobile-high`** döndürüyor — birim testi yaz.
      ⚠️ Mevcut `LITE` mantığı (`main.js:83`) iPhone 13'ü `lite` sayıyor
      (`min(screen) 390 ≤ 820`). Yeni tier bunu tekrarlamamalı.
- [ ] Hiçbir render davranışı değişmedi — 12 kamerada görsel diff **= 0**
- [ ] `BLOCKED.md` oluşturuldu, H1 maddesi yazıldı

### Kabul — İNSAN TARAFI (sen yapamazsın, ama hazırlarsın)
- [ ] `build/qa/ratchet.json` → `baseline` iPhone 13 ölçümüyle dolu,
      `"acceptedByOwner": true`

> **Faz 0 "kod tarafı bitti" olarak kapanabilir ve Faz 1'e geçilebilir.**
> Mandal `null` kaldığı sürece **hiçbir faz "tamamlandı" ilan edilemez** —
> ama kod işi durmaz. İnsan ölçümü geldiğinde mandal geriye dönük doldurulur
> ve o ana kadarki fazlar yeniden değerlendirilir.

---

## FAZ 1 — "Maket öldü" (3–5 gün) · En yüksek getiri/maliyet

> Bu fazın sonunda **aynı GLB'lerle, yeni asset üretmeden** sahne belirgin şekilde
> daha fotoğrafik olacak.

### Task 1.1 — Bayrak cerrahisi

**Dosyalar:** `viewer/src/quality-profile.js` (yeni), `main.js:577`, `lighting.js:120-200`

```js
// SİL — main.js:577
lighting = createLighting(renderer, scene, camera, clip,
  {baked: modelRoot.pathname.includes('/batched/')});

// YAZ
const quality = createQualityProfile({
  batchedGeometry: true,              // manifest.batched'den, görünümden değil
  forcedTier: new URLSearchParams(location.search).get('quality'),
});
lighting = createLighting(renderer, scene, camera, clip, {quality});
```

`lighting.js` içinde `baked` ve `compact` değişkenlerini **tamamen kaldır**.
Yerine `quality.*` alanlarını oku:

```js
// lighting.js:123
renderer.shadowMap.enabled   = quality.dynamicSunShadow;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.type      = quality.shadowType==='vsm' ? VSMShadowMap : PCFSoftShadowMap;
// :131
sun.castShadow = quality.dynamicSunShadow;
sun.shadow.mapSize.setScalar(quality.shadowMapSize || 1024);
// :165-172
const useComposer = quality.postProcessing;
const compactOutput = (!useComposer && quality.antialiasing!=='canvas-msaa')
  ? new CompactOutput() : null;
if (useComposer) { /* mevcut composer kurulumu — silme, canlandır */ }
```

**Composer'ı yeniden hayata döndür ama pass'leri koşullu ekle:**
```js
// postprocessing.js — imzayı genişlet
export function configurePostprocessing(composer, passes, quality){
  composer.addPass(passes.beauty);
  if (quality.gtao)   composer.addPass(passes.ao);
  if (quality.antialiasing==='smaa') composer.addPass(passes.smaa);
  if (quality.bloom)  composer.addPass(passes.bloom);
  composer.addPass(quality.grade ? passes.grade : passes.output);  // tone map TAM BİR KEZ
  if (quality.dither) composer.addPass(passes.dither);
}
```

> **Çift tone-mapping tuzağı:** `GradeShader` kendi AgX'ini uyguluyor
> (`grade-pass.js:agxToneMap`) ve `renderer.toneMapping` de AgX.
> Composer aktifken `renderer.toneMapping = NoToneMapping` olmalı,
> composer kapalıyken `AgXToneMapping`. Bunu `applyRenderProfile`'a parametre yap
> (`render-profile.js:30`). Regresyon testi ekle: ekran ortası pikselinin
> luminance'ı composer açık/kapalı arasında %2'den fazla sapmasın.

**Görünüm değişiminde profili güncelle:** `main.js:selectView` ve
`lighting.frame(view, contextBounds)` içinde `quality.applyView(view)` çağır,
sonra `composer` pass'lerini `pass.enabled` ile aç/kapat (yeniden kurma).

### Kabul 1.1
- [ ] `?model=` veya model yolu değiştirmek gölgeyi/postfx'i **etkilemiyor**
- [ ] Debug overlay (`?debug=quality`) dört bayrağı ve tier'ı ekranda gösteriyor
- [ ] Tüm flag'ler eski değerlerine zorlandığında görsel diff = 0 (piksel testi)
- [ ] `npm test` yeşil + yeni `quality-profile.test.mjs`

---

### Task 1.2 — Hibrit güneş gölgesi

**Prensip:** Baked GI / electric lightmap / room probe **kalır**.
Üzerine **tek bir dinamik güneş** eklenir.

#### 1.2-a — Shadow camera'yı villaya kilitle

Mevcut `lighting.js:frame()` `extent` değerlerini görünüme göre seçiyor ama
`shadowDistance=340` region'da tüm yerleşimi kapsıyor. Yeni kural:

```js
function fitSunShadow(view, buildingBox, gardenBox, quality) {
  if (!quality.dynamicSunShadow) return;
  let target;
  switch (quality.shadowCameraMode) {
    case 'floor-local':  target = buildingBox.clone().expandByScalar(3);  break;
    case 'villa-local':  target = buildingBox.clone().union(gardenBox).expandByScalar(8); break;
    case 'wide-proxy':   target = buildingBox.clone().union(gardenBox).expandByScalar(25); break;
    default: return;
  }
  // Işık uzayında sıkı AABB — ekstent'i sabit sayıdan değil kutudan türet
  const centre = target.getCenter(new THREE.Vector3());
  const radius = target.getBoundingSphere(new THREE.Sphere()).radius;
  sun.target.position.copy(centre);
  sun.position.copy(centre).addScaledVector(direction, radius * 2.2);
  Object.assign(sun.shadow.camera,
    {left:-radius, right:radius, top:radius, bottom:-radius,
     near: radius*0.2, far: radius*4.4});
  sun.shadow.camera.updateProjectionMatrix();
  // texel/metre hedefi: villa-local'de ≥ 60 texel/m (2048 / ~34 m)
}
```

**Texel yoğunluğu hedefi:** `villa-local` + 2048 → villa+bahçe yarıçapı ~17 m ise
2048/34 ≈ **60 texel/m ≈ 1,7 cm/texel**. Mevcut baked haritanın 0,42 m/texel'inden
**25× daha keskin.** Bu sayıyı QA raporuna yaz.

**Shadow acne/peter-panning:** `sun.shadow.bias=-0.000025`, `normalBias=0.018`
mevcut değerler 4096 için ayarlanmış. 2048'e inerken `normalBias`'ı
`0.018 * (4096/mapSize)` ile ölçekle, sonra görsel olarak kalibre et.

#### 1.2-b — Shadow proxy üret

**Yeni asset:** `build/web/batched/{desktop,mobile}/shadow-proxy.glb`

Üretim aracı: `tools/batch-delivery/build-shadow-proxy.mjs`
- Kaynak: `architecture.glb` + `garden.glb` + yakın `context-buildings` (≤25 m)
- `@gltf-transform/functions` `weld()` + `simplify({ratio:0.06, error:0.01})`
- Hedef: **30k–80k üçgen**
- Cam, korkuluk detayı, küçük süs, mobilya **yok**
- Kat kesiti ile uyumlu: `clippingPlanes` aynı `clip` düzlemini alır, `clipShadows=true`
- Sahnede: `visible=false` değil — `layers` kullan
  ```js
  const SHADOW_LAYER = 3;
  proxy.traverse(o=>{ o.layers.set(SHADOW_LAYER); o.castShadow=true; o.receiveShadow=false; });
  sun.shadow.camera.layers.set(SHADOW_LAYER);   // depth pass yalnız proxy'yi görür
  camera.layers.disable(SHADOW_LAYER);          // beauty pass proxy'yi görmez
  ```
  > `visible=false` shadow map'ten de çıkarır — **layer kullan, visible değil.**
- Yüksek detay mimari: `castShadow=false`, `receiveShadow=true`

**Bütçe kontrolü:** proxy Draco ile ~150–400 KB olmalı. Bu, `packageMaxMiB`
bütçesine eklenir — Task 4.1'de (KTX2) bütçe yeniden tanımlanacak.

#### 1.2-c — Gölge güncelleme politikası

```js
renderer.shadowMap.autoUpdate = false;

// SADECE bu olaylarda:
function requestShadowUpdate(reason) {
  pendingShadowReason = reason;
  renderer.shadowMap.needsUpdate = true;
  invalidate();
}
```
Tetikleyiciler:
- `#daylight-hour` **`change`** (pointerup/keyup) — **`input` DEĞİL**
- `#daylight-season` `change`
- Kat değişimi (`selectView`) — clipping transition **bittikten sonra**
  (`main.js:228` `if (t >= 1)` bloğu)
- Görünüm değişimi
- Mobilya toggle (`setFurnitureVisible`)
- Walk'a giriş/çıkış

`#daylight-hour` `input` olayında **sadece** `sun.color`, `sun.intensity`,
`sun.position`, `hemisphere`, `scene.environmentIntensity`, `horizon`,
`skyCamera.update` güncellenecek — shadow map **render edilmeyecek**.

Mevcut `setTime()` (`lighting.js:210-240`) sonunda koşulsuz
`renderer.shadowMap.needsUpdate=true` var — **kaldır**, `requestShadowUpdate`'e taşı.

#### 1.2-d — Baked ve dinamik direkt ışığı ayır

Şu anda `ground-light` R kanalı (direct sun visibility) dinamik güneşle **çakışır**:
ikisi de aynı gölgeyi çizer, çift karartma olur.

**Yeni kural:**
```js
// ground-light.js — setSun
setSun(sun, quality){
  // Dinamik gölge varsa R kanalı (direkt güneş) devre dışı; G (ambient) her zaman açık
  strength.value = quality.dynamicSunShadow ? 0 : clamp((direction·sun-0.985)/0.014, 0, 1);
}
```
Shader'da:
```glsl
// direkt güneş: dinamik gölge varsa dokunma
directLight.color *= mix(1.0, groundVisibility.r, groundSunStrength);
// local ambient: HER ZAMAN uygula — bu "V-Ray dirt", sun'a bağlı değil
reflectedLight.indirectDiffuse *= mix(.65, 1.0, groundVisibility.g);
```
`mobile-low`'da `dynamicSunShadow=false` → eski davranış aynen korunur.

#### 1.2-e — İç mekân

- Tavan armatürleri **asla gölge atmaz** (`lighting.js:196` zaten `castShadow=false`
  bırakılacak — `keepSlotsVisible` yolunda da `:263` aynı).
- İç mekânda güneş gölgesi **sadece açıklıklardan**: cam yüzeyler
  `castShadow=false` (zaten `lighting.js:294` `object.castShadow=!glass`),
  pencere kasası ve denizlik proxy'de temsil edilsin ki iç zemine güneş lekesi düşsün.
- Gerisini GTAO + baked AO taşır.

### Kabul 1.2
- [ ] Villa zemine oturuyor; saçak, balkon ve baca cepheye gölge düşürüyor
- [ ] Saat slider'ı **sürüklenirken** `renderer.info.render.frame` başına shadow
      render **0**; bırakınca **1**
- [ ] `neighborhood` FPS'i baseline'dan %10'dan fazla düşmüyor
- [ ] `mobile-low`'da `renderer.shadowMap.enabled === false`, shadow map sayısı 0
- [ ] Kat kesiti geçişi sırasında gölge bozulmuyor, geçiş sonunda 1 kez yenileniyor
- [ ] `shadow-proxy.glb` ≤ 80k üçgen, beauty pass'te görünmüyor
- [ ] Dinamik gölge açıkken çift karartma yok (aynı kamerada A/B histogram)

---

### Task 1.3 — `exterior-grade.js` dirilişi ⭐ EN YÜKSEK GETİRİ/MALİYET

**Repoda zaten duran 1,2 MB gerçek doku kullanılmıyor.** Yeni asset üretmeden,
aynı gün, cephe + çatı + zemin + teras dokusu kazanılır.

`viewer/public/textures/` (ve `assets/textures/`):
```
clay-tile-basecolor.png   141.868 B   travertine-basecolor.png  290.234 B
clay-tile-normal.png        6.840 B   travertine-normal.png       2.333 B
stucco-normal.png         180.331 B   asphalt-basecolor.png     211.093 B
grass-basecolor.png       354.717 B
```

`exterior-grade.js` bunları `TABLE` içinde isim bazlı eşleştiriyor
(clay-tile, villa-roof, stucco, iron, gravel, canopy, grass, asphalt, terrace,
entrance-court) — **doğru UV tekrarları ve normalScale değerleriyle birlikte**,
zaten yazılmış:

```js
{key:'clay-tile', match:/^clay tile/i, set:{map:'clayTileMap', normalMap:'clayTileNormal'},
 repeat:[1.5625/0.8, 1.5625/1.0], normalScale:1.2}
{key:'stucco', match:/^st?rucco( \[imported\])?$/i,
 set:{normalMap:'stuccoNormal'}, repeat:[1,1], normalScale:0.55}
{key:'grass', match:/^grass( \(\d+\))?$/i, set:{map:'grassMap'}, groundUV:{module:2}}
```

#### Neden şu an çalışmıyor
1. `main.js:1325` `const wantsGrade = manifest.assets.some(a => a.exterior_grade)` —
   batched manifest'te `assets` yok
2. `main.js:1173` batched yol `loadNativeModel()` ile **erken return** ediyor,
   1325. satıra hiç ulaşmıyor
3. `vite.config.js` pages modunda `copyPublicDir:false` — ama `main.js:1326`
   `pages ? 'assets/textures/' : 'textures/'` yolunu kullanıyor,
   ve `assets/textures/` repo kökünde **var** ✅

#### Uygulama

**Adım 1 — Batched malzeme isimlerine eriş.**
Batched malzemeler `architecture-other-9` gibi adlandırılmış; gerçek isimler
`material.userData.angoraBatch.materials` içinde. `exterior-grade.js`'i
batch farkında yap:

```js
// exterior-grade.js — YENİ
export function gradeBatchedMaterial(material, assetName, textures) {
  const batch = material.userData.angoraBatch;
  if (!batch) return applyGradeValues(material, assetName, textures);  // legacy
  // Bir batch'teki HER kaynak malzeme için ayrı grade gerekir → atlas hücresi bazlı
  const entries = batch.materials.map(n => entryFor(n, assetName));
  if (entries.every(e => !e)) return;
  // grid=1 ise tek malzeme: doğrudan map/normalMap bağla
  if (batch.grid === 1 && entries[0]) return bindSingle(material, entries[0], textures);
  // grid>1 ise: per-batchid detail-map seçimi (aşağıda)
  return bindPerCell(material, entries, textures);
}
```

**Adım 2 — `grid === 1` hızlı kazanç (aynı gün).**
Bu üç hero malzeme zaten `grid:1`, yani **tek malzemelik atlas** — doğrudan
`map`/`normalMap` bağlanabilir, shader değişikliği gerekmez:

| batch | kaynak malzeme | kazanılan |
|---|---|---|
| `architecture-tile-1` | `Clay tile` | `clayTileMap` + `clayTileNormal`, repeat 1.95×1.56 |
| `architecture-other-9` | `STRUCCO` | `stuccoNormal`, normalScale 0.55 |
| `architecture-tile-8` | `stone_tile` | `travertineMap` + `travertineNormal` |
| `architecture-wood-10` | `WOOD-FL` | (mevcut kalsın, iç mekân) |
| `context-buildings-plaster-0` | `ceiling.004` | `stuccoNormal` (düşük normalScale) |

⚠️ Bu malzemeler `atlasSample()` ile örnekleniyor (`batched-material.js:25`).
`grid===1` ve `pad` küçük olduğu için `atlasUV()` neredeyse kimlik dönüşümü,
**ama `maxLod` hâlâ 3.** Detail map bağlarken bu malzemelerde atlas yolunu
**bypass et**:
```js
// batched-material.js — YENİ koşul
const bypassAtlas = batch.grid === 1 && material.userData.exteriorGradeDetail;
if (!bypassAtlas) { /* mevcut atlasSample enjeksiyonu */ }
// bypass edildiğinde three'nin normal texture2D + hardware mip + anisotropy yolu çalışır
```
`grid===1` atlasında UV zaten `fract()` gerektirmiyor (tek hücre tüm dokuyu kaplıyor,
sadece `pad` kadar içeride) — `wrapS/T=RepeatWrapping` ve `repeat` ayarıyla
doğrudan çalışır. **Tek gereken: doku atlas değil, gerçek tileable PNG olmalı** —
`exterior-grade.js` zaten dışarıdan PNG yüklüyor, atlas'tan değil. ✅

**Adım 3 — `grid > 1` için per-cell detail (Faz 3'e ertelenebilir).**
`grass`, `asphalt`, `terrace` `context-ground-other-0` (grid 2) içinde.
Bunlar için `groundUV` projeksiyonu gerekiyor — `exterior-grade.js` bunu
zaten yapıyor (`groundUV:{module:2}` world-space XZ projeksiyonu).
Vertex shader'da `_batchid`'e göre detail map seçimi:
```glsl
// batchId'ye göre detail map uv ve şiddeti
vec2 detailUV = worldPos.xz / detailModule[opticalIndex];
vec3 detail = texture2D(detailAtlas, detailUV).rgb;   // 3 doku → 1 atlas veya texture2DArray
diffuseColor.rgb *= mix(vec3(1.0), detail * 2.0, detailStrength[opticalIndex]);
```

**Adım 4 — Yükleme.**
`loadNativeModel()` içinde (`main.js:1051`), `lightingReady` ile paralel:
```js
const gradeReady = FEATURES.exteriorGradeRevival
  ? loadGradeTextures(new URL(pages?'assets/textures/':'textures/', publicRoot))
      .catch(e => { console.warn('Exterior detail maps unavailable', e); return null; })
  : Promise.resolve(null);
```
`prepare()` callback'inden **sonra**, `prepareBatchedMaterial()`'dan **önce**
bağla — program kimliği derlemeden önce yerleşsin.

**Bütçe:** 1,2 MB PNG → KTX2'ye çevrilince ~350 KB (Task 4.1). İlk etapta PNG kalsın,
`requestIdleCallback` ile yükle, gelene kadar düz renk görünsün.

### Kabul 1.3
- [ ] Çatı yakın çekimde kiremit dokusu ve normal kabartması okunuyor
- [ ] Cephe sıvasında ince kum dokusu var, düz plastik değil
- [ ] Çim tek renk yeşil platform değil
- [ ] Teras travertine deseni ve derz yönü doğru ölçekte
- [ ] Bu dokular `grid===1` yolunda **hardware mipmap + anisotropy** kullanıyor
      (`textureLod` bypass edildi) → uzakta shimmer yok
- [ ] +transfer ≤ 1,3 MB, ilk interaktif yolu **bloklamıyor**

---

### Task 1.4 — `doubleSided` katliamı + culling

**En yüksek perf getirisi. `build.mjs` çalışmıyor (Bölüm 0.7.2) — GLB'yi yamala.**

### İKİ YERE BİRDEN yaz

**(a) `build.mjs:84` — gelecek için düzelt** (kaynak sağlandığında doğru üretsin):
```js
// ESKİ
output.createMaterial(...).setDoubleSided(true)
// YENİ
const needsDoubleSided =
  first.m.doubleSided === true ||                              // kaynakta öyleyse
  mats.some(m => /foliage|leaf|leaves|needle|hedge|curtain|sheer|fabric|blind|grass/i.test(m.name)) ||
  first.glass ||                                                // ince cam panel
  first.m.alphaMode === 'MASK';                                 // cutout yaprak
output.createMaterial(...).setDoubleSided(needsDoubleSided)
```

**(b) `tools/batch-delivery/patch-single-sided.mjs` — ŞİMDİ teslim edilecek olan.**
Bölüm 0.7.2'deki `patchGlbJson()` ile, 12 GLB'yi (2 profil × 6 parça) yerinde yamala:

```js
import {patchGlbJson} from './patch-glb.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const PRESERVE = /foliage|leaf|leaves|needle|hedge|curtain|sheer|fabric|blind|grass/i;
const base = 'build/web/batched';
const report = [];

for (const profile of ['desktop','mobile']) {
  const manifest = JSON.parse(await fs.readFile(path.join(base,profile,'manifest.json')));
  for (const part of manifest.parts) {
    const file = path.join(base, profile, part.file);
    let flipped = [], kept = [];
    const out = await patchGlbJson(file, doc => {
      for (const m of doc.materials) {
        const names = m.extras?.angoraBatch?.materials ?? [];
        const needs = m.alphaMode === 'BLEND' || m.alphaMode === 'MASK'
                   || names.some(n => PRESERVE.test(n));
        if (m.doubleSided && !needs) { m.doubleSided = false; flipped.push(m.name); }
        else kept.push(m.name + (needs ? ' (gerekli)' : ' (zaten tek taraflı)'));
      }
    });
    await fs.writeFile(file, out);
    part.gpu_sha256 = createHash('sha256').update(out).digest('hex');  // ← ŞART
    report.push({profile, part: part.name, flipped, kept});
  }
  await fs.writeFile(path.join(base,profile,'manifest.json'), JSON.stringify(manifest));
}
await fs.writeFile(path.join(base,'single-sided-report.json'), JSON.stringify(report,null,2));
```

> ⚠️ **`gpu_sha256`'yı manifest'te güncellemeyi UNUTMA.** `native-delivery.js:36`
> onu `?v=` cache-buster olarak kullanıyor; güncellemezsen tarayıcı eski GLB'yi
> servis eder ve "değişmedi" sanırsın. Bu tam olarak bir sahte-negatif tuzağıdır.

**Doğrulanmış beklenti** (bu doküman yazılırken `architecture.glb` üzerinde test edildi):
```
11 malzemenin 10'u tek-taraflıya çevrildi, 1'i (BLEND cam) korundu
dosya 5.856.884 → 5.856.896 B   ·   Draco BIN chunk byte-byte AYNI
```

### Risk yönetimi — ters normal'li yüzeyler kaybolabilir

Bu bir **bug açığa çıkarma** işlemidir. Prosedür:
1. `single-sided-report.json` — hangi malzeme çevrildi, hangisi neden korundu
2. 12 QA kamerasında A/B screenshot + **piksel diff yüzdesi** (sadece göz değil)
3. Bir yüzey kayboluyorsa: o malzemeyi `PRESERVE` listesine **isimle** ekle,
   sebebini rapora yaz (*"context-buildings-other-1: komşu çit tek yüzey modellenmiş"*).
   **Toplu geri alma yok** — tek tek, gerekçeli.
4. Blender'da normal düzeltme **senin işin değil** (H4) → `BLOCKED.md`'ye yaz
5. Güvenlik valfi: `?features=singleSided:0` runtime'da eski davranışa döner
   (`native-delivery.js`'de malzeme hazırlanırken `material.side=DoubleSide`)

**Beklenen kazanç:** kapalı hacimlerde fragment işi ~%25–45 azalır.
`renderer.info.render.triangles` **değişmez** — frame time düşer.
Yazılım rasterizer'da FPS güvenilmez; bunun yerine **`?debug=timing` ile
GPU-agnostik bir proxy ölç:** aynı kamerada 200 kare çiz, toplam JS+submit
süresini karşılaştır, ve `EXT_disjoint_timer_query_webgl2` varsa gerçek GPU
zamanı al (Chromium'da `--enable-webgl-draft-extensions` ile).

**Ek: frustum culling.**
```js
// native-delivery.js:90 — ESKİ
for(const [name,model] of loaded)
  model.visible = name!=='interior' || /^f[0-3]$/.test(view);

// YENİ — görünüme göre gerçek görünürlük
const SHOW = {
  region:       new Set(['context-ground','context-buildings','context-plants','architecture','garden']),
  neighborhood: new Set(['context-ground','context-buildings','context-plants','architecture','garden']),
  villa:        new Set(['architecture','garden','context-ground','context-buildings','context-plants']),
  floor:        new Set(['architecture','garden','interior','context-ground','context-buildings','context-plants']),
  interior:     new Set(['architecture','interior','garden']),   // walk: mahalle kapalı
};
```
> ⚠️ `interior` (walk) modunda pencereden dışarı bakılabiliyor. Mahalleyi tamamen
> kapatma — **LOD2/impostor'a düşür** (Faz 3). İlk adımda sadece
> `context-plants`'ı walk'ta kapat ve A/B bak: pencereden görünüyorsa geri aç.

**Ve:** `context-plants.glb` tek mesh olduğu için culling yapılamıyor.
Faz 3'e kadar geçici çözüm: `build.mjs`'de `context-plants` için
`CHUNK_M=48` grid bucket'lama uygula (`context-batch.js`'deki mantığın
build-time karşılığı) → 514k üçgen ~12–20 mesh'e bölünsün.
**Draw call +15, ama culling kazancı çok daha büyük.**

### Kabul 1.4
- [ ] `build.mjs` raporu: kaç batch tek taraflı oldu
- [ ] 12 kamerada kaybolan yüzey yok (A/B piksel diff)
- [ ] Desktop villa frame time baseline'a göre ≥ %25 iyileşti
- [ ] `context-plants` ≥ 10 ayrı mesh; kamera çevrildiğinde
      `renderer.info.render.calls` değişiyor (culling çalışıyor kanıtı)
- [ ] Walk modunda `renderer.info.render.triangles` baseline'ın yarısından az

---

### Task 1.5 — Kamera ve kompozisyon

**16° tüm görünümler için.** Bu maket/isometric hissinin doğrudan sebebi.

⚠️ **İki ayrı yerde hardcoded** — ikisini birden düzelt, yoksa plan modundan
çıkınca FOV geri 16'ya döner:
```js
main.js:556   camera = new THREE.PerspectiveCamera(16, 1, 1, 2000);          // ana kamera
main.js:335   ... : new THREE.PerspectiveCamera(16, camera.aspect, ...)      // plan/iso geçişi
```

```js
// viewer/src/camera-rigs.js (YENİ)
export const VIEW_CAMERA = {
  region:       {fov: 20, polar: 0.42, minPolar: 0.15, maxPolar: 1.15},
  neighborhood: {fov: 26, polar: 0.72, minPolar: 0.25, maxPolar: 1.35},
  villa:        {fov: 33, polar: 1.05, minPolar: 0.35, maxPolar: 1.48},
  garden:       {fov: 40, polar: 1.15, minPolar: 0.40, maxPolar: 1.50},
  floor:        {fov: 28, polar: 0.85, minPolar: 0.30, maxPolar: 1.40},
  interior:     {fov: 60, min: 50, max: 75},     // walk; ASLA < 45
  plan:         {orthographic: true},
};
```

`fitContextBounds(box, aspect, polar, azimuth, fov)` (`material-response.js:180`)
zaten `fov` parametresi alıyor ama her yerden `16` ile çağrılıyor — görünüm
bazlı değeri geçir. `frame()` fonksiyonundaki (`main.js:340-370`) tüm
`fov=16` varsayımlarını temizle.

**Villa kahraman karesi:**
- Kamera yüksekliği düşürülsün — 3–4 m üç-çeyrek görüş
- Villa görsel hiyerarşinin merkezinde, komşular destekleyici
- Çatı karenin çoğunu kaplamasın
- Havuz ve bahçe okunur olsun

**Varsayılan zaman:** `index.html:67` şu an `value="12.5"` (tepe öğle, en düz ışık).
**`16.5` (16:30) yap** ve `#lighting-style` varsayılanını `"sun"` yap
(`index.html:66` ilk `<option>` sırasını değiştir veya `main.js` bind'inde set et).
Paylaşım linki state'i bunu override edebilmeye devam etsin (`share-state.js`).

**Atmosferik perspektif (ucuz derinlik):**
`lighting.js:158` şu an `scene.fog=null` ve yorumda *"grey cast okundu"* deniyor.
Doğru yaklaşım: `FogExp2` **değil**, mesafeye bağlı **çevre-rengine** karışım,
ve sadece `region`/`neighborhood`'da:
```js
scene.fog = (view==='region'||view==='neighborhood')
  ? new THREE.FogExp2(horizon.getHex(), 0.0018)   // horizon rengi = gökyüzü ufku
  : null;
```
`horizon` zaten saate göre güncelleniyor (`lighting.js:227`) — fog rengini ona bağla.
`villa`/`floor`/`interior`/`plan`'da fog **kapalı**.
Yoğunluğu 0.0018'den başlat, 12 kamerada A/B bak, gri perde oluşuyorsa düşür.

### Kabul 1.5
- [ ] İlk villa karesi izometrik SketchUp gibi görünmüyor
- [ ] Interior walk teleskopik hissettirmiyor (FOV ≥ 55)
- [ ] Varsayılan açılış 16:30 / "sun" — ama paylaşım linki override ediyor
- [ ] Plan modu ve kat kesiti kompozisyonu bozulmadı
- [ ] Yan yana screenshot: derinlik algısı belirgin şekilde arttı

---

### Task 1.6 — Bahçenin spot ışığı israfı + anisotropy ölü kodu

**Bug 1** — `batched-material.js:33`:
```js
// ESKİ
if(exterior || material.userData.vertexFixtures){ /* spot döngülerini sil */ }
// YENİ — garden da dışarısı
if(exterior || material.userData.vertexFixtures || assetName==='garden'){ ... }
```
`prepareBatchedMaterial` çağrısına asset adını geçir (`native-delivery.js:104`).

**Bug 2** — `lighting.js:304`:
```js
for(const value of Object.values(material))
  if(value?.isTexture) value.anisotropy = Math.min(compact?8:16, maxAniso);
```
`atlasSample` → `textureLod` anizotropiyi **yok sayar**. Bu satır atlas dokularında
sıfır etki, sadece filtre state'i harcıyor. Kural:
```js
const usesAtlas = Boolean(material.userData.angoraBatch) && !material.userData.exteriorGradeDetail;
for(const value of Object.values(material))
  if(value?.isTexture) value.anisotropy = usesAtlas ? 1 : quality.anisotropy;
```
Yani anisotropy **yalnız gerçek texture2D yolundaki dokulara** verilsin
(exterior-grade detail map'leri, AO, lightmap).

**Not:** `maxLod` sınırının kalıcı çözümü Task 3.3'te (`texture2DArray`).

### Kabul 1.6
- [ ] Bahçe shader'ında `NUM_SPOT_LIGHTS === 0` (shader source assertion testi)
- [ ] Atlas dokularında `anisotropy === 1`, detail/AO/lightmap'te tier değeri
- [ ] GPU filtre state raporu: `renderer.info.memory.textures` değişmedi

---

## FAZ 1 MERGE SIRASI — bu tek bir merge'dür, altı ayrı merge değil

Task 1.4 (doubleSided + culling) ve 1.6 (spot + anisotropy) **kazanç** kalemleri,
Task 1.2 (gölge) ve 1.1 (postfx) **maliyet** kalemleridir (Bölüm 0.6.1).

**Tek başına Task 1.2'yi merge etme.** Sıra:

```
1.1  bayrak cerrahisi          → merge (davranış değişikliği yok, flag'ler kapalı)
1.4  doubleSided + culling     → merge + ÖLÇ   ← kazancı bankaya yatır
1.6  spot + anisotropy         → merge + ÖLÇ   ← kazancı bankaya yatır
     ── ARA ÖLÇÜM: elimizde ne kadar bütçe var? ──
1.3  exterior-grade            → merge + ÖLÇ   (~nötr)
1.5  kamera + altın saat       → merge + ÖLÇ   (~nötr)
1.2  güneş gölgesi             → merge + ÖLÇ   ← parayı harca
1.1b postfx pass'lerini aç     → merge + ÖLÇ   ← kalan parayı harca (desktop only)
```

Ara ölçümde kazanç beklenenin altındaysa, 1.2'nin kapsamını **daralt**:
önce `mobile-high`'tan düşür, sonra `neighborhood` görünümünden düşür,
sonra 2048 → 1024'e in. Bütçeyi aşma.

## FAZ 1 ÇIKIŞ KAPISI — buradan geçmeden Faz 2'ye geçme

12 kamera × {desktop-high, mobile-high}, aynı saat/mevsim/viewport,
**baseline vs yeni** yan yana:

### Görsel
- [ ] Beyaz duvarlar emissive maket gibi görünmüyor
- [ ] Villa zemine temas ediyor; saçak/balkon/baca gölgeleri okunuyor
- [ ] Çatı düz turuncu plastik değil; sıva düz gri değil; çim tek renk platform değil
- [ ] İlk villa karesi izometrik değil, derinlik okunuyor

### ⛔ Performans mandalı (`build/qa/ratchet.json` — **iPhone 13 / Safari**)
- [ ] `mobile-high` villa FPS **≥ baseline** (gölge eklendiği halde)
- [ ] `mobile-high` p95 frame ms **≤ baseline × 1,05**
- [ ] `mobile-low` FPS **> baseline** (sadece kazanç kalemleri var, artmalı)
- [ ] İlk-interaktif süre **≤ baseline** (Faz 1'de yeni asset yok, artmamalı)
- [ ] İlk-interaktif byte **≤ baseline + 1,3 MB** (exterior-grade PNG'leri;
      ve bunlar **idle'da** yüklenmeli, kritik yolda değil → tercihen +0)
- [ ] Tahmini GPU doku MiB **≤ baseline**
- [ ] WebGL context loss: **0** (en az 3 dk sürekli kullanım + 2 tam kat turu)
- [ ] Desktop villa FPS ≥ baseline; p95 ≤ baseline
- [ ] Saat slider'ı **sürüklenirken** shadow render sayısı **0**, bırakınca **1**

> Bir mandal kırılırsa: Bölüm 0.6.2'deki 1→2→3 sırasını uygula.
> **"Biraz yavaşladı ama çok güzel oldu" ile geçme.**

### Regression
- [ ] Kat kesiti, clipping, cap/hatch, plan modu, walk, asansör, VR, i18n,
      sesli tur, fotoğraf pinleri, ölçüler, paylaşım linki — **hepsi çalışıyor**
- [ ] `npm test` 67/67 + yeni testler yeşil
- [ ] Her feature flag kapatıldığında eski davranış birebir geri geliyor

---

## FAZ 2 — Yük ve geometri (5–7 gün)

### Task 2.1 — Progressive loader

Mevcut `native-delivery.activate()` (`native-delivery.js:88`) batched yolda
**altı parçanın hepsini** kullanıcı bir şey görmeden yüklüyor.

Yeni sıra:

```
0. HTML shell + poster/hero still            (boyanmış)
1. architecture-lod1 + garden
   + context-ground-lite + context-buildings-lod2
   + 1K HDRI + navigation/rooms JSON (gzip)   →  HEDEF 3–5 MB
2. INTERAKTİF ORBIT AÇIK  ← burada FPS ölçümü başlar
3. requestIdleCallback: context-buildings-lod1, context-plants-lod1 (yakın chunk)
4. Kat seçimi / "İçeride gez": interior-f<N> + o katın room probe'u
                               + shadow-proxy + electric lightmap
5. requestIdleCallback (desktop): architecture-lod0, plants-lod0,
                                  2K HDRI, ek probe'lar
```

**Alt görevler:**

a) **`interior.glb`'yi kata böl.** `build.mjs` şu an `interior` için tek dosya
   üretiyor. `node.getExtras().category` ve oda/kat bilgisi
   `native-rooms.json`'da var. Çıktı:
   `interior-common.glb`, `interior-f0..f3.glb`.
   *(Legacy manifest'te bu bölünme zaten vardı — `native-delivery.js:110`
   `'interior-'+view` yoluna bak, mantık hazır.)*

b) **Sahne JSON'larını gzip'le.** Şu an sıkıştırılmamış 1,4 MB:
   `sections-current.json` 544 KB, `native-navigation.json` 234 KB,
   `native-soil-section.json` 272 KB, `native-rooms.json` 122 KB.
   `transition-sections.json.gz` zaten gzip ve `gunzipSync` ile okunuyor
   (`main.js:1120`) — **aynı yolu diğerlerine de uygula.**
   Beklenen: 1,4 MB → ~250 KB.

c) **Room probe'ları geciktir.** `main.js:1060` şu an dört probe'u da
   boot'ta yüklüyor (desktop 4×~390 KB = 1,57 MB). Kat seçildiğinde
   o katınkini yükle, komşu katı prefetch et.

d) **HDR'ı `HalfFloatType` yükle.** `lighting.js:245`
   `new HDRLoader().setDataType(THREE.FloatType)` → `HalfFloatType`.
   PMREM sonucu yarım-float zaten; tam float yükleme boşuna 2× bellek.
   *(Dikkat: `loadEnvironment` içindeki luminance clamp döngüsü
   `pixels[i]` üzerinde çalışıyor — `Float32Array` yerine `Uint16Array`
   gelecek. Clamp'i PMREM öncesi bir shader pass'ine taşı veya
   half-float decode/encode helper'ı yaz.)*

e) **Unload disiplini.** `native-delivery.release()` zaten geometry/material/
   texture/ImageBitmap dispose ediyor — kat değişiminde ve görünüm
   değişiminde gerçekten çağrıldığını doğrula. `renderer.info.memory`
   bir turdan sonra başlangıç değerine dönmeli (±%5).

### Kabul 2.1
- [ ] İlk interaktif 3D payload ≤ **5 MB** (desktop), ≤ **4 MB** (mobile)
- [ ] Mobile warm-cache ilk orbit < **3 s**; cold-cache Fast 4G < **6 s**
- [ ] Ağ waterfall yukarıdaki sırayla eşleşiyor (ekran görüntüsü delil)
- [ ] Interior byte'ları `neighborhood` görünümünün kritik yolunda değil
- [ ] Bir tam tur (region→villa→f0→f1→f2→f3→walk→region) sonrası
      `renderer.info.memory` başlangıca dönüyor

---

### Task 2.2 — Context HLOD ve instancing

**Mevcut:** `context-buildings.glb` 1.023.766 üçgen / 5 mesh (desktop).

a) **Tekrarlanan villa tiplerini bul.** `build/web/batched/context-placement.json`
   ve `tools/batch-delivery/context-additions.json` zaten
   *"Each addition copies all 46 authored B4 objects (45,806 triangles)"* diyor —
   yani **tekrar zaten var, instance edilmemiş.** Geometri hash'iyle grupla.

b) **`InstancedMesh`'e çevir.** 2–4 cephe/malzeme varyasyonu, per-instance
   renk jitter'ı (`instanceColor`).

c) **LOD kademeleri:**
   ```
   LOD0  : en yakın 2–3 komşu           (mevcut detay)
   LOD1  : orta mesafe, sade kütle      (ratio 0.25)
   LOD2  : uzak, kütle veya impostor    (ratio 0.06 veya billboard atlas)
   ```
   `THREE.LOD` yerine **mesafe bazlı grup görünürlüğü** kullan — `LOD` her
   frame `update()` gerektirir, `invalidate()` tabanlı render döngüsüyle
   çakışır. Görünüm/kamera değişiminde bir kez hesapla.

d) **Hedef:** context-buildings toplam **100k–250k üçgen**.

### Task 2.3 — Bitkiler

**Mevcut:** `context-plants.glb` 514.039 üçgen, **tek mesh**.

- Tür ve boyuta göre `InstancedMesh`
- 20–40 m spatial chunk → chunk bazlı frustum culling
- LOD0 yakın (villa bahçesi) / LOD1 düşük poly / LOD2 cross-card veya billboard
- Mobilde uzak ağaçlar billboard/impostor
- **Varyasyon:** aynı yeşil + aynı ölçek = plastik. Per-instance
  `hue ±6°`, `value ±12%`, `rotation.y` rastgele, `scale ±15%`
- Vertex wind sadece LOD0'da, sadece desktop

**Hedef:** bitkiler **≤ 200k üçgen görünür** (desktop villa), **≤ 80k** (mobile).

### Task 2.4 — Topografya

**Mevcut:** `context-ground.glb` 311.432 üçgen.

⚠️ **Topografyayı düzleştirme.** Korunacak gerçek kotlar:
havuz tarafı sol zemin ~2 m yüksek, sağ ~5–6 m alçak, ön/arka kot farkı,
alt bahçe görünürlüğü, yol/istinat ilişkileri.

Sadece gereksiz tessellation'ı azalt:
- `@gltf-transform` `simplify({ratio:0.15, error:0.0005, lockBorder:true})`
- Sonra **kot doğrulama testi**: `plot-boundary.json` ve
  `context-placement.json`'daki örnekleme noktalarında yükseklik farkı **≤ 5 cm**
- `build.mjs` zaten `terrain_duplicate_faces_removed: 17457` raporluyor —
  bu temizliği genişlet

**Hedef:** 20k–50k üçgen.

**Zemin malzemesi:** grass/soil/asphalt blend, splat mask veya vertex color,
normal map, roughness varyasyonu. **Villa arsası ile çevre arasında dikiş olmamalı** —
şu an `plot-material-mask.js` parsel içini kesiyor, sınırda renk sıçraması var mı kontrol et.

### Kabul 2.2–2.4
- [ ] Wireframe debug: komşular instance, bitkiler çok sayıda frustum
- [ ] Kamera çevrildiğinde draw cost düşüyor (culling kanıtı)
- [ ] Topografya kot testi: tüm örnekleme noktalarında ≤ 5 cm sapma
- [ ] Görünür üçgen: mobile **300k–600k**, desktop villa **700k–1,2 M**
- [ ] Villa arsası ile çevre arasında görünür dikiş yok
- [ ] Ağaçlar tek renk geometrik oyuncak gibi görünmüyor

---

## FAZ 3 — Malzeme ve ışık (8–12 gün) · Asıl V-Ray hissi

> ⛔ **Bu faz bütçeyi en çok zorlayan fazdır.** 2K doku, TANGENT attribute,
> `texture2DArray`, ek probe'lar — hepsi bellek ve bant genişliği harcar.
>
> **Ön koşul:** Task 4.1 (KTX2) bu fazdan **önce** bitmiş olmalı.
> Aşağıdaki "BÜTÇE ACİL DURUMU" kuralına bak.

## 🚦 FAZ 3 ENGEL HARİTASI — neyi sen yapacaksın, neyi yapamazsın

Bu fazın **içerik** tarafı Blender gerektirir ve Blender yok (Bölüm 0.7.1).
`build/blender/angora-material-lighting.blend` **134 baytlık bir LFS pointer'ı**
(gerçeği 217 MB) ve `git lfs` kurulu değil. Göreve başlamadan bu tabloyu oku:

| Task | Ajan yapar | İnsan yapar | Ajanın teslimi |
|---|---|---|---|
| **3.1 Malzeme yazarlığı** | ❌ | ✅ H3 | Her hero malzeme için **ölçülmüş eksik raporu**: mevcut sd, hücre px, texel/m, hedef; `assets/pbr/manifest.json` için doldurulacak şablon; ekran-alanı texel yoğunluğu ölçüm aracı |
| **3.2 Bevel + mesh temizliği** | ❌ | ✅ H4 | **Kusur listesi**: coplanar/duplicate/ters normal taraması (GLB üzerinde Python ile yapılabilir), `polygonOffset` hack'inin tetiklendiği yüzeyler, öncelik sırası |
| **3.3 texture2DArray** | ✅ **TAM** | — | Atlası Pillow ile dilimle, `DataArrayTexture` üret, `batched-material.js`'i dönüştür, `atlasSample`/`maxLod`/`pad`/`grid` kavramlarını sil |
| **3.4a/b UV repack** | ❌ | ✅ H2 | **Doluluk ölçüm aracı** (%4,1 / %3,5 sayılarını üreten script) + hedef %65 doğrulayıcısı |
| **3.4c/d Rebake / native-current yeniden teslim** | ⚠️ **kısmen** | ✅ H2 | `native-current/ktx2/`'deki 4096²/2048² AO'ları **KTX2 olarak doğrudan bağlama** hattı — bu **bake değil, teslim** işidir ve sende |
| **3.4e Probe'lar** | ⚠️ kısmen | ✅ H2 | Probe seçim/interpolasyon kodu sende; panorama üretimi insanda |
| **3.4f HDRI + çevre kütleli probe** | ✅ **TAM** | — | `buildEnvironment()`'a düz zemin yerine context LOD2 mesh'i koy — **kod işi, yeni asset yok** |
| **3.4g Gece modu / shadow_flag** | ✅ **TAM** | — | `room-lighting.json` düzenlemesi + shader varyant ölçümü |
| **3.5 Cam / havuz** | ✅ **TAM** | — | Üç kademeli cam, havuz shader'ı, planar reflection — hepsi kod |

**Yani Faz 3'ün yaklaşık yarısı senin.** "Blender yok" demek Faz 3'ü atlamak
değildir — 3.3, 3.4f, 3.4g, 3.5 tamamen sende ve bunlar tek başına büyük
görsel kazanç. Önce onları bitir, sonra 3.1/3.2/3.4a-b için `BLOCKED.md`'ye
**ölçülmüş, öncelik sıralı, insanın doğrudan çalışabileceği** brief yaz.

### 3.4d için özel not — bu "bake" değil, "teslim"

`build/web/native-current/ktx2/` içinde **113 KTX2, 41,9 MB**, içinde
**2 × 4096²** ve **7 × 2048²** AO bake'i **zaten UASTC+ZSTD olarak duruyor.**
Bunları kullanmak için Blender gerekmiyor — sadece:
1. Hangi KTX2'nin hangi malzemeye ait olduğunu `*.gpu.gltf` dosyalarından çöz
2. Bütçeye sığdır (4096² → 2048² KTX2 downscale, `toktx`/`basisu` yoksa
   decode→resize→re-encode; yoksa mevcut mip seviyesini kırp)
3. `patchGlbJson` + bufferView değişimiyle batched GLB'lere bağla

**Bu tamamen sende ve mevcut 1024² WebP AO'ya göre 4× texel kazandırır.**

### ⚡ BÜTÇE ACİL DURUMU — KTX2'yi öne çek

Faz 1 veya Faz 2 sonunda mobil mandalı **GPU bellek** kaleminden kırılıyorsa,
ya da Faz 3'ün doku bütçesi sığmıyorsa: **Task 4.1'i (KTX2) hemen buraya çek.**

Tek başına en büyük mobil kazanç:
```
mobile  GPU doku:  124 MiB → ~24 MiB   (−%80)
desktop GPU doku:  256 MiB → ~48 MiB   (−%81)
```
Bu, Faz 3'ün tüm doku artışını **peşinen finanse eder** ve mobil context-loss
riskini kökünden kaldırır. `texture-loader.js` zaten hazır, transcoder zaten
sunucuda — sadece `build.mjs` çıktısının `KHR_texture_basisu` olması gerekiyor.

**Öneri: KTX2'yi Faz 2'nin sonuna al, Faz 3'e bütçeli gir.**


### Task 3.1 — Malzeme yazarlığı (içerik işi, runtime değil)

**Bu Blender/export işidir. Runtime regex ile yapılmaz.**

`assets/pbr/pbr-maps.zip` yeniden üretilecek. `tools/bake_pbr.py` mevcut.
Her **hero** malzeme için (öncelik sırasıyla):

```
ÖNCELİK 1 (dış kabuk — ilk kare buradan okunur)
  STRUCCO / dış cephe sıvası     Clay tile / turuncu kiremit
  roof-7 / yeşil kiremit         Entrance coursed limestone
  Retaining wall rough limestone stone_tile / STONE-TILE teras
  R31|R37 fine asphalt           R31|R39 continuous grass
  foliage / foliage_light        metal / demir doğrama
  glass / dış cam                water + pool_tile

ÖNCELİK 2 (iç mekân hero)
  INTERIOR / iç duvar boyası     ceiling
  WOOD-FL / parke                terra_floor
  bath_tile / seramik            Lift speckled granite
  wood_dark / antique_wood / wood_honey / inlay_wood
  chrome / brass / Polished bathroom chrome

ÖNCELİK 3 (mobilya/tefriş)
  kumaşlar, deri, perde, döşeme — en az normal + roughness varyasyonu
```

Her malzeme için zorunlu kontrol listesi:
- [ ] Base color **fotoğraf kalibreli** (repo'daki `photogallery/` 55 kare + drone
      fotoğrafları referans). **`0.94` gri duvar yasak.**
- [ ] Normal map **doğru UV ölçeğinde** — kiremit ~30–35 cm tekrar,
      sıva ince grain, taş duvar derz aralığı gerçek
- [ ] **Roughness varyasyonu** — sabit skaler yasak. En az bir grunge/varyasyon katmanı
- [ ] Metalness **sadece gerçek metalde**. Ahşap/sıva/taş = 0
- [ ] AO: lightmap'e veya `aoMap`'e pişmiş
- [ ] Doğru color space: basecolor sRGB, normal/ORM/AO linear
- [ ] Tiling/stretching/rotation kontrol edildi
- [ ] `repeat_m` manifest'e yazıldı

⚠️ **Doğrulanmış şüpheli:** `architecture-wood-2` batch'inin `wood_dark (3)`
hücresinde metalness histogramı **çift tepeli** (23.618 texel = 0, 13.121 texel = 255).
Ahşabın yaklaşık üçte biri **tam metal** olarak render ediliyor. Kaynakta doğrula ve düzelt.

**Texel density — kör 2K yapma:**
| yüzey | desktop | mobile |
|---|---|---|
| Hero villa yakın yüzeyleri (sıva, kiremit, parke) | seçici **2048** | 1024 |
| Büyük tekrar eden tileable | 1024 (2048 sadece cephe) | 512 |
| Küçük dekor | 256/512 atlas | 256 |
| Context yapıları | 512/1024 atlas | 512 |

Doğrulama: her malzeme için **ekran-alanı texel yoğunluğu** raporu üret
(QA kamerasında yüzeyin kapladığı piksel / kullandığı texel). Hedef 1,0–2,0 texel/piksel.

### Task 3.2 — Geometri: bevel ve weighted normals

842k üçgenlik mimari **rafine görünmüyor** çünkü kenarlar keskin — ışık yakalamıyor.

**1–3 cm bevel + weighted normals** uygula:
pencere kasaları · kapı kasaları · denizlik · balkon kenarları · merdiven basamakları
(nosing) · dolap kapakları · tezgâh · kolon · saçak · süpürgelik · sabit mobilya ·
havuz kenarı · parapet · istinat duvarı üst kenarı

Aynı zamanda şunları tara ve düzelt:
duplicate faces · coplanar faces (z-fighting) · ters normals · açık mesh sınırları ·
bozuk smoothing · gereksiz subdivision · görünmeyen iç yüzeyler · duvar içinde kalan
objeler · çatı üst üste binmeleri · mobilya/duvar kesişmeleri

> `material-response.js:66` şu an roof için `polygonOffset` hack'i kullanıyor
> (*"eaves trim and roof plane cross at a very shallow angle → white shards"*).
> Bu, coplanar geometri probleminin belirtisi. **Geometriyi düzelt, hack'i kaldır.**

**Bütçe:**
| | desktop | mobile |
|---|---|---|
| Villa exterior kabuk | 150k–300k | 100k–180k |
| Interior aktif kat | 150k–350k | 80k–150k |
| Context buildings toplam | 100k–250k | 80k–150k |
| Context ground | 20k–50k | 15k–30k |
| Bitkiler görünür | ≤ 200k | ≤ 80k |
| **Görünür sahne toplamı** | **700k–1,2 M** | **300k–600k** |

**TANGENT attribute ekle** — normal map kullanan tüm hero malzemelerde.
`build.mjs` `@gltf-transform`'un `tangents()` transform'unu çalıştırsın.
Bu hem doğruluk hem hız kazancı.

### Task 3.3 — Atlas'tan `texture2DArray`'e (shimmer'ın kalıcı çözümü)

`atlasSample()` + `maxLod 2–3` sınırı, tüm titremenin kaynağı.
**Doğru çözüm atlas değil, texture array:**

```js
// batched-material.js — YENİ yol
// 16 malzemelik atlas yerine: DataArrayTexture, her katman bir malzeme
// → fract(uv) gerekmez, hücre sızması yok, TAM mip zinciri, TAM anisotropy
sampler2DArray mapArray;
vec4 c = texture(mapArray, vec3(vUv, batchId));   // donanım mip + aniso
```

**Neden bu doğru:**
- Atlas'ın var olma sebebi: draw call azaltmak. `texture2DArray` aynı şeyi yapar,
  **ama mip ve aniso'yu kaybetmeden.**
- WebGL2 zorunlu — `renderer.capabilities.isWebGL2` zaten true (three r180 WebGL2-only)
- KTX2/Basis **array texture destekler** (`KHR_texture_basisu` + `layerCount`)
- Katman sayısı ≤ 16, boyut tekdüze (hepsi 1024² veya 512²) → uyumlu

**Geçiş planı:**
1. `build.mjs`'de atlas compositing yerine katman dizisi üret (her malzeme kendi
   tam çözünürlüklü tile'ı — **248×248 değil, 512² veya 1024²**)
2. KTX2 array olarak paketle
3. `batched-material.js`'de `atlasSample` → `texture(mapArray, vec3(uv, batchId))`
4. `atlasUV`/`maxLod`/`pad`/`inner`/`grid` kavramlarının tamamı **silinir**
5. Anisotropy geri gelir → `lighting.js:304` tier değerini kullanır

**Yan kazanç:** hücre başına 248² yerine 512²/1024² → **4–16× texel yoğunluğu**,
ve `%26 blank padding` kaybı sıfırlanır.

### Task 3.4 — Bake kalitesi

**Önce UV repack, sonra bake.** Mevcut lightmap doluluğu %3,5–%4,1 —
bu bozuk paketleme demek, düşük sample demek değil.

a) **Lightmap UV repack.** Blender `Smart UV Project` / `Lightmap Pack` ile
   ada boyutlarını yüzey alanına orantılı yap. **Hedef doluluk ≥ %65.**
   Ada arası margin: 1024² için 4 px, 2048² için 8 px.

b) **AO repack + rebake.** Aynı şey `occlusionTexture` için. Clay tile AO'su
   şu an kiremit başına 8×8 texel — repack sonrası hedef **≥ 32×32**.

c) **Rebake.** `build/blender/angora-material-lighting.blend` (Git LFS).
   - İç mekân electric: mevcut 128 sample / 6 bounce **korunur**, ama repack'li UV ile
   - Dış cephe: **sun-independent ambient occlusion** + neutral sky GI
     (dinamik güneş sert gölgeyi verir, bake girinti kirini verir)
   - İç mekân daylight GI: renkli bounce (terracotta, ahşap) okunmalı

d) **`build/web/native-current/`'daki 4K/2K AO'ları YENİDEN KULLAN.**
   113 KTX2 / 41,9 MB zaten var: 2×4096², 7×2048². **Yeniden pişirme —
   yeniden teslim et.** Task 4.1 KTX2 hattı bunları doğrudan taşıyabilir.
   Bütçe için: 4096² AO'yu 2048² KTX2 UASTC'ye indir (~1,2 MB) — hâlâ
   mevcut 1024² WebP'den **4× texel.**

e) **Probe'lar.**
   - Kat başına 1 ana probe (mevcut) + büyük hacimlerde (salon, mutfak) local probe
   - Toplam **6–8**, ağırlıklı interpolasyon; oda geçişinde yansıma patlaması olmasın
   - Çözünürlük: mobile 128/256, desktop 256/512. Hero metal/cam sahnesi dışında yükseltme.

f) **HDRI.** Desktop **2K**, mobile 1K kalır. Ve `buildEnvironment`'a
   düz `#6f7a60` zemin yerine **basitleştirilmiş çevre kütlesi** koy
   (context-buildings LOD2 + terrain, tek seferlik PMREM render'ı).
   Camlar artık mahalle siluetini yansıtır — bu tek başına büyük bir "gerçeklik" sıçramasıdır.

g) **`room-lighting.json`:** üretimde tüm tavan armatürlerinde
   `shadow_flag = false`. Gece modunda en fazla 1–2 gölgesiz local ışık.

   ⚠️ **Gece dış cephesi modu mevcut.** `lighting.js:267` `interior('all', ...)`
   ile tüm ev aydınlatılabiliyor ve `setFixtures(data,{allRooms:true})`
   (`lighting.js:255-264`) slot havuzunu kat başına maksimum fixture sayısına
   (**10**) büyütüp hepsini `visible=true` yapıyor.

   Bu, gece dışarıdan bakıldığında en pahalı ışık durumudur. Kontrol et:
   - Dış cephe (`context-*`, `garden`) shader'larında spot döngüleri
     silinmiş olmalı — Task 1.6'dan sonra `garden` de dahil
   - `architecture`/`interior` `vertexFixtures` yolunda → fragment maliyeti yok
   - **Kalan risk:** 10 spot ışığı hâlâ `scene` içinde ve `visible=true`;
     three bunları her `onBeforeCompile` cache anahtarına yazıyor.
     Gece modunda shader varyantı patlaması olup olmadığını
     `renderer.info.programs` ile ölç.
   - iPhone 13'te gece modu mandalın bir parçası olmalı: **C04 (havuz tarafı)
     kamerasını gece moduyla da ölç.**

### Task 3.5 — Cam, havuz, yansıma

**Cam — üç kademe:**

| kademe | uygulama | nerede |
|---|---|---|
| Context glass | basit transparent, environment reflection, transmission yok | komşu binalar |
| Villa exterior glass | Fresnel + env reflection + hafif tint + kontrollü opacity | dış cepheler |
| Hero interior glass | `MeshPhysicalMaterial` transmission, IOR 1.5, thickness, `transmissionResolutionScale` düşük | sadece yakın/kahraman yüzeyler, sadece desktop-high |

`material-response.js:neutraliseTransmission()` şu an **tüm** transmission'ı
alfa'ya çeviriyor (`:130-148`) — doğru karar, çünkü transmission tüm opak sahneyi
her frame ikinci kez render ettiriyor. **Koru**, ama `hero-only` istisnası ekle:
adı `hero`/`showcase` ile işaretli ≤ 6 yüzeyde gerçek transmission.

**Cam gölge bloklamamalı:** `lighting.js:294` `object.castShadow=!glass` zaten doğru. ✅

**Havuz — SSR kullanma.** Ucuz ve ikna edici:
```glsl
// iki hareketli normal doku (farklı scale/hız) + fresnel + env reflection
// + derinliğe bağlı absorpsiyon (kenarda açık, derinde koyu)
vec3 n = normalize(texture(waterNormal, uv*3.0 + t*0.02).xyz*2.0-1.0
                 + texture(waterNormal, uv*7.0 - t*0.013).xyz*2.0-1.0);
float f = pow(1.0 - max(dot(n, V), 0.0), 5.0);
vec3 refl = textureCube(envMap, reflect(-V, n)).rgb;
vec3 deep = mix(shallowTint, deepTint, saturate(depth/2.4));
color = mix(deep, refl, mix(0.04, 1.0, f));
```
Desktop-high'ta opsiyonel **planar reflection @0.25–0.5 resolution scale**,
ve **her frame değil** — kamera veya su görünümü değiştiğinde güncelle.

Parlak parke için SSR yerine doğru roughness + room probe kullan.

### Kabul FAZ 3
- [ ] Yakın çekim cephe ve çatı CAD katısı gibi okunmuyor
- [ ] ORM debug görünümünde roughness düz 1.0 değil, varyasyon var
- [ ] `texture2DArray` geçişi sonrası uzak yüzeylerde shimmer yok
- [ ] Lightmap UV doluluğu ≥ %65; AO texel/kiremit ≥ 32×32
- [ ] Camlar mahalle siluetini yansıtıyor, düz gradyan değil
- [ ] Havuz düz mavi plastik değil; kenar/derin renk farkı var
- [ ] Köşeler ve tavan koveleri duvar ortasından koyu
- [ ] Oda geçişinde probe dikişi görünmüyor
- [ ] Gece modu: GI sahnesindeki lambalar gibi, 20 OpenGL point light gibi değil

---

## FAZ 4 — Teslim ve cila (3–5 gün)

### Task 4.1 — KTX2 (mobil çökme düzeltmesi)

**Bu bir optimizasyon değil, `314 MiB` GPU belleğinin kök çözümüdür.**

`texture-loader.js` zaten KTX2Loader kuruyor ve ASTC/BC7 desteği yoksa `null`
döndürüyor. `build.mjs` çıktısını `KHR_texture_basisu`'ya çevir:

| harita | format | gerekçe |
|---|---|---|
| basecolor / albedo | ETC1S (kalite yetmezse UASTC) | en büyük hacim |
| normal | **UASTC** | ETC1S normal'i mahveder |
| ORM | **UASTC** | kanal ayrımı korunmalı |
| lightmap | UASTC veya HDR-dual-U8 | bant oluşmamalı |
| AO | ETC1S yeterli | tek kanal |
| alpha/cutout | test et | yaprak kenarı |
| UI görselleri | **KTX2'ye çevirme** | DOM'da kullanılıyor |

**Beklenen GPU bellek:**
```
desktop:  256 MiB → ~48 MiB   (ASTC 4x4 / BC7 ≈ 1 B/texel + mip)
mobile:   124 MiB → ~24 MiB
```

`main.js:1108` `loader.ktx2Loader?.dispose()` satırını **kaldır** —
artık gerçekten kullanılıyor.

Her export sonrası otomatik rapor: texture sayısı · transfer boyutu ·
tahmini GPU MiB · en büyük 10 doku · eksik mipmap · yanlış color space · NPOT.

### Task 4.2 — Bundle splitting

Başlangıç bundle'ından çıkar (dynamic import):
`GTAOPass` · `SMAAPass` · `LinearBloomPass` · `GradeShader` · `DisplayDitherShader` ·
WebXR yolu · `device-qa.js` · `region-map.js` (+ `region-*.json`, 3 dosya) ·
`photo-gallery.js` + `photo-points.js` · `guided-tour.js` + `tour-script.js` ·
`lift.js` · `context-massing.js` (legacy) · `exterior-grade.js` (idle'da)

```js
// örnek
const postfx = quality.postProcessing
  ? await import('./postprocessing-chain.js')
  : null;
```

**Hedef ilk JS:** ideal **300–450 KB gzip**, üst sınır **500 KB gzip**
(şu an 747 KB).

`vite.config.js`'e `build.rollupOptions.output.manualChunks` ekle.

### Task 4.3 — Cache — HOSTING KARARI GEREKİYOR ⚠️

**GitHub Pages `Cache-Control` override'a izin vermez.** Sabit `max-age=600`.
Hash'li dosya adı kullanmak tek başına yeterli değil — tarayıcı 10 dakikada bir
revalidate eder, 21 MB yeniden indirilmese de RTT maliyeti kalır.

Üç seçenek — **karar kullanıcıya ait, sen üçünü de fiyatla:**

| seçenek | iş | sonuç |
|---|---|---|
| **A — Cloudflare önüne koy** (ücretsiz plan yeterli) | DNS'i CF'ye taşı, Page Rule / Transform Rule ile `/build/web/**`, `/web-assets/**` → `Cache-Control: public, max-age=31536000, immutable` | En az kod değişikliği. Pages arkada kalır. **Önerilen.** |
| **B — Netlify / Vercel'e taşı** | `_headers` veya `vercel.json`, build komutu `npm run build:pages` | Tam kontrol + CDN + preview deploy. Orta iş. |
| **C — Model asset'lerini R2/S3+CloudFront'a taşı** | `VITE_MODEL_ROOT` env değişkeni zaten var (`main.js:61`) | Repo küçülür (160 MB `native-current` git'ten çıkar). En temiz, en çok iş. |

Hangisi seçilirse:
- Hash'li dosya adları: `architecture-lod1.<content-hash>.glb`
- `index.html` ve `manifest.json` kısa cache
- İkinci ziyarette **21 MB yeniden indirilmemeli** — WebPageTest ile kanıtla

### Task 4.4 — Debug ve QA yüzeyi

- `?quality=mobile-low|mobile-high|desktop-balanced|desktop-high`
- `?features=<flag>:0|1,...`
- `?debug=quality` → ekranda tier, dört bayrak, draw calls, triangles,
  p95 frame ms, tahmini GPU MiB
- `?camera=C01..C12` → QA kamerası
- `?stats=1` → JSON'u `host.dataset.qaReport`'a yaz (mevcut `deliveryStats` genişletmesi)

---

## FAZ 5 — "Sinematik kare" (opsiyonel, 2–3 gün, sadece desktop-high)

`render-profile.js:30` `pathTracing:false, refinement:false` — **bunlar sadece
profil alanı.** Bundle'da gerçek path tracer, BVH veya temporal refinement
implementasyonu **yok**. `true` yapmak hiçbir şey başlatmaz.

Gerçek uygulama: **kamera durunca biriken kare.**

```js
// idle-refine.js
// 400 ms hareketsizlik sonrası: jitter'lı projeksiyon matrisiyle 8–32 kare
// biriktir (accumulation buffer), her kare shadow map'i hafifçe farklı
// güneş açısıyla render et (soft shadow), GTAO sample pattern'ini döndür.
// Herhangi bir pointer/orbit/tuş olayı → anında iptal, raster'a dön.
```

Kazanç: yumuşak gölge kenarı, temiz AO, daha az speckle — **tam olarak
V-Ray still'i hissi.**

**Asla** `mobile-low` / `mobile-high`'da çalışmaz. Walk modunda çalışmaz.
İlk biriken kareyi loader poster'ı olarak kaydet (Task 2.1).

---

# 5. PERFORMANS KABUL KRİTERLERİ

> **İki katmanlı kabul:**
> **(A) Mandal** — her fazda, her metrik baseline'dan kötü olamaz. Bu **zorunlu**.
> **(B) Hedef** — projenin sonunda ulaşılmak istenen mutlak değerler.
>
> Bir faz, (B)'ye ulaşamadığı için değil, **(A)'yı kırdığı için** reddedilir.

## Mobile — referans cihaz **iPhone 13 / Safari** (emülasyon sayılmaz)

> Ürün sahibi mevcut hızı "yeterli" olarak kabul etti (Bölüm 0.6.2).
> Bu yüzden **(A) sütunu bağlayıcı, (B) sütunu isteğe bağlıdır.**
> (B)'ye ulaşılamaması bir faz reddi sebebi değildir; (A)'nın kırılması öyledir.

| metrik | (A) MANDAL — zorunlu | (B) HEDEF — proje sonu |
|---|---|---|
| İlk interaktif 3D payload | ≤ baseline | ≤ **4 MB** |
| Warm-cache ilk orbit | ≤ baseline | < **3 s** |
| Cold-cache Fast 4G ilk orbit | ≤ baseline | < **6 s** |
| FPS (villa, 15 s orbit) | **≥ baseline** | min **40**, ideal 50–60 |
| p95 frame time | ≤ baseline × 1,05 | ≤ **25–30 ms** |
| Draw calls | ≤ baseline × 1,15 | 100–150 |
| Görünür üçgen | ≤ baseline | 300k–600k |
| Tahmini GPU doku belleği | **≤ baseline** | ≤ **40 MiB** (KTX2 sonrası) |
| WebGL context loss (3 dk kullanım) | **0** | **0** |
| Kat geçişinde UI donması | ≤ baseline | **yok** |

**Mobil kırmızı çizgiler:** Bölüm 0.6.4.

## Desktop

| metrik | (A) MANDAL | (B) HEDEF |
|---|---|---|
| FPS | ≥ baseline | **60** |
| p95 frame time | ≤ baseline | 16–20 ms |
| Draw calls | ≤ baseline × 1,2 | 150–250 |
| Görünür üçgen | ≤ baseline | 700k–1,2 M |
| İlk hazır | ≤ baseline | ≤ **5 s** (şu an 16.711 ms) |
| Tahmini GPU doku belleği | ≤ baseline | ≤ **64 MiB** |
| Shadow update | — | tek frame spike kabul; **sürekli render kabul edilmez** |
| Orbit sırasında shader compile stutter | — | **yok** |

## Ağ testleri
Cold cache · Warm cache · Fast 4G · Slow 4G · Yüksek gecikme · Tekrar ziyaret.
İkinci ziyarette immutable cache **açıkça** avantaj göstermeli.

## Her faz sonunda zorunlu tablo

```
                     baseline    faz sonu    Δ       mandal
mobile villa FPS       ––          ––       ––      ✅/❌
mobile p95 ms          ––          ––       ––      ✅/❌
mobile ilk-interaktif  ––          ––       ––      ✅/❌
mobile GPU doku MiB    ––          ––       ––      ✅/❌
mobile context loss    ––          ––       ––      ✅/❌
desktop villa FPS      ––          ––       ––      ✅/❌
desktop p95 ms         ––          ––       ––      ✅/❌
desktop ilk hazır ms   ––          ––       ––      ✅/❌
görünür üçgen          ––          ––       ––      ✅/❌
draw calls             ––          ––       ––      ✅/❌
```

**Tek bir ❌ varsa faz kapanmaz.**

---

# 6. GÖRSEL KABUL KRİTERLERİ

Aşağıdakiler sağlanmadan **"görsel kalite tamamlandı" deme:**

- [ ] Villa zemine oturuyor gibi görünüyor
- [ ] Saçak, balkon ve pencere altında temas gölgesi okunuyor
- [ ] Beyaz duvarlar kendi kendine ışık yayıyor gibi görünmüyor
- [ ] Duvarların ışığa göre yönü ve derinliği okunuyor
- [ ] Saat slider'ı cephe parlaklığını değiştiriyor — sadece gökyüzü rengini değil
- [ ] Çatı kiremitleri düz turuncu plastik değil
- [ ] Taş duvar doku ölçeği gerçekçi (derz aralığı doğru metrede)
- [ ] Çim tek renk yeşil platform değil
- [ ] Context ile villa arazisi arasında dikiş yok
- [ ] Komşu villalar aynı kopyanın plastik tekrarı gibi görünmüyor
- [ ] Ağaçlar tek renk geometrik oyuncak değil
- [ ] Cam tamamen siyah veya tamamen görünmez değil; çevreyi yansıtıyor
- [ ] Havuz düz mavi plastik yüzey değil
- [ ] İç duvarlarda triangulation/smoothing artefaktı yok
- [ ] Mobilyalar duvarlarla kesişmiyor
- [ ] Hareket sırasında z-fighting ve shimmer yok
- [ ] Kat kesiti sırasında gölge ve AO bozulmuyor
- [ ] Plan modunda görüntü temiz ve okunaklı
- [ ] Oda isimleri ve ölçüler her kalite profilinde okunuyor
- [ ] Hiçbir malzemede `emissiveIntensity > 0` — **üç istisna dışında:**
      (1) gerçek lamba/armatür mesh'i,
      (2) `setWindowGlow()` ile aydınlatılan villa camları (`lighting.js:303`) —
          gece dış cephesi özelliğidir, **kaldırma**,
      (3) `interior(…, boost)` gece modu fixture takviyesi (`lighting.js:272`)
- [ ] Bloom tüm beyaz duvarı parlatmıyor, sadece armatür/highlight

---

# 7. ASLA YAPMA

- **Mobil FPS'i veya ilk-interaktif süreyi düşürerek bir faz kapatma** —
  görsel kazanç ne olursa olsun (Bölüm 0.6.2)
- **Maliyet kalemini kazanç kalemi olmadan merge etme** (Faz 1 merge sırası)
- **Emülasyon ölçümüyle mandal doldurma** — gerçek telefon zorunlu
- Shadow map'i 4096 yaparak problemi çözmeye çalışma
- Tüm dokuları kör şekilde 2K/4K yapma
- Tüm lambalara realtime shadow verme
- Tüm camlarda transmission açma
- Mobile'da GTAO + bloom + transmission + planar reflection'ı aynı anda açma
- Region görünümünde high-quality dynamic shadow çalıştırma
- CSM'yi ölçmeden zorunlu sayma
- VSM export edilmiş diye kullanıma hazır varsayma (A/B ölç, PCFSoft baseline)
- `pathTracing: true` yazıp path tracing'in çalıştığını iddia etme — **implementasyon yok**
- Görsel problemi yalnızca post-processing ile gizleme
- Topografyayı düzleştirerek üçgen azaltma
- Mevcut ölçü ve mimari doğruluğu bozma
- Clipping plane / cap / hatch sistemini regression'a uğratma
- Mevcut UI özelliklerini kaldırma
- Test etmeden "mobile optimized" veya "V-Ray quality" deme
- Tek desktop screenshot üzerinden kalite kabulü yapma
- **`material-response.js`'i düzelterek bir şey değiştiğini sanma** — o dosya ölü (Bölüm 0.5)
- **Lightmap'i UV repack yapmadan yeniden pişirme** — %4 dolulukta sample artışı boşa gider
- Tek seferde tüm renderer'ı yeniden yazma

---

# 8. "V-RAY AYARI" NE, NE DEĞİL

| V-Ray'de pahalı olan | Burada ucuz karşılığı |
|---|---|
| Brute force GI | Lightmap + 6–8 probe |
| Raytraced sun | 1 tight shadow map (villa-local, 60 texel/m) + baked AO |
| UHD cache / ambient | GTAO yalnız villa + iç mekân, yarım çözünürlük |
| Displacement | Normal map + 1–3 cm gerçek bevel |
| V-Ray dirt | Repack'li baked AO + roughness varyasyonu |
| Glass GI / caustics | Transmission (hero-only) + probe; caustic yok |
| 4K raw textures | KTX2 UASTC 1K–2K |
| Full scene subdiv | Instance + LOD + weighted normals |
| Progressive sampling | Kamera durunca 8–32 kare birikim (Faz 5) |

**V-Ray görünümü burada shader mucizesi değil:** doğru albedo, köşe karanlığı,
temas gölgesi, alçak kamera, altın saat, durunca biriken kare.

---

# 9. TESLİM PROTOKOLÜ

Her faz sonunda **zorunlu** teslim:

1. Değiştirilen dosyaların listesi (`git diff --stat`)
2. Teknik değişiklik özeti — her madde bir `dosya:satır` referansıyla
3. **12 QA kamerası × {desktop-high, mobile-high} önce/sonra screenshot**
   — aynı kamera, aynı saat, aynı mevsim, aynı viewport
4. **⛔ MANDAL TABLOSU** (Bölüm 5 sonundaki şablon) — güncellenmiş
   `build/qa/ratchet.json` ile birlikte. **Bu madde olmadan faz kapanmaz.**
5. **Bütçe defteri** — bu fazda hangi kalem ne kazandırdı, ne harcattı,
   net bakiye ne (Bölüm 0.6.1 formatı)
6. **Gerçek telefon** ölçümü (en az 1 iOS Safari + 1 Android Chrome) —
   emülasyon kabul edilmez
7. Desktop performans raporu (Task 0.3 JSON şeması)
8. İlk yük transfer raporu (cold/warm, Fast/Slow 4G)
9. Triangle / draw call / GPU bellek karşılaştırma tablosu
10. `npm test` çıktısı — **67/67 + yeni testler**
11. Bölüm 3'teki değiştirilemez gereksinimler için regression checklist
12. Bilinen eksikler + hangi kalite kalemleri bütçe yüzünden kısıldı
13. Bir sonraki faz için net task listesi

**Kabul kuralı:** "tamamlandı" yalnızca **kod + screenshot + sayı** üçlüsüyle
kanıtlanabilir. Tek biri eksikse faz kapanmaz.
**Mandal tablosunda tek bir ❌ varsa, diğer 12 madde mükemmel olsa bile
faz kapanmaz.**

---

# 10. UYGULAMA SIRASI — BU SIRAYI DEĞİŞTİRME

```
FAZ 0  (0,5–1 gün)  Baseline + ölçüm + MANDAL           → hiçbir görsel değişiklik
                    ⛔ gerçek telefon ölçümü zorunlu

FAZ 1  (3–5 gün)    "Maket öldü"                        → en yüksek getiri/maliyet
       merge sırası: 1.1 → 1.4 → 1.6 → [ARA ÖLÇÜM] → 1.3 → 1.5 → 1.2 → 1.1b
       1.1 bayrak cerrahisi                  (nötr)
       1.4 doubleSided + culling     ⭐ KAZANÇ — bedava perf
       1.6 bahçe spot + anisotropy   ⭐ KAZANÇ — bedava perf
       1.3 exterior-grade dirilişi   ⭐ BEDAVA DOKU (asset üretmeden)
       1.5 kamera + altın saat       ⭐ BEDAVA KOMPOZİSYON
       1.2 hibrit güneş gölgesi      💰 MALİYET — kazançla finanse et
       1.1b postfx (yalnız desktop)  💰 MALİYET
       ── ÇIKIŞ KAPISI + MANDAL ──

FAZ 2  (5–7 gün)    Yük ve geometri                     → hız + netlik (net KAZANÇ)
       + Task 4.1 (KTX2) buraya çekilmesi ŞİDDETLE ÖNERİLİR
       ── MANDAL ──

FAZ 3  (8–12 gün)   Malzeme ve ışık                     → asıl V-Ray hissi
       💰 en pahalı faz — Faz 2'de biriktirilen bütçeyle girilir
       ── MANDAL ──

FAZ 4  (3–5 gün)    Teslim ve cila                      → cache + bundle split
       ── MANDAL ──

FAZ 5  (2–3 gün)    Sinematik kare (opsiyonel, desktop-high)
```

**Faz 1 çıkış kapısından geçmeden Faz 2'ye geçme.
Faz 2 bitmeden Faz 3'e geçme.
Her fazın sonunda mandal tablosu tam yeşil olmadan bir sonraki faza geçme.**

**Kalite ve hız çatışırsa:** kalite kısılır, mandal korunur, kısılan kalem
rapora yazılır ve sonraki fazda bütçe açıldığında geri açılır.

---

# 11. İLK SOMUT ADIM — ŞİMDİ BUNU YAP

```
0. Bölüm 0.5 (önceki prompt hataları) ve Bölüm 0.7 (çalışma sözleşmesi) OKU
1. cd viewer && npm ci && npm test        → 67/67 yeşil olmalı
2. BLOCKED.md oluştur, H1–H7'yi (Bölüm 0.7.3) içine yaz
3. FAZ 0'ı tamamla — AJAN TARAFI:
   12 QA kamerası · qa-capture.mjs (Playwright) · ?stats=1 harness ·
   qa-mobile.html · detectTier() + testi · baseline screenshot seti
   → iPhone ölçümü BLOCKED kalır, DURMA
4. FAZ 1 için DOSYA BAZLI plan yaz:
   her task → değişecek dosyalar, satırlar, yeni dosyalar, yeni testler
   + TAHMİNÎ BÜTÇE ETKİSİ (kazanç mı maliyet mi, ne kadar)
5. Onay bekleme, uygula — FAZ 1 MERGE SIRASINA uy:
   1.1 → 1.4 → 1.6 → [ARA ÖLÇÜM] → 1.3 → 1.5 → 1.2 → 1.1b
6. Her merge'den sonra ölç ve mandal tablosunu güncelle
   (ölçemediğin satır null kalır, 0 değil)
7. Faz 1 çıkış kapısı raporunu üret + BLOCKED.md'yi güncelle
```

## Ne zaman SORMA, ne zaman SOR

**SORMA — kendin karar ver ve gerekçeni raporla:**
- İki teknik yaklaşım arasında seçim (VSM mi PCFSoft mu, hangi LOD eşiği)
- Bir sayının tam değeri (shadow bias, fog yoğunluğu, FOV derecesi)
- Bir kalite kaleminin bütçe yüzünden kısılması
- Bir dosyanın nereye konacağı, bir fonksiyonun nasıl adlandırılacağı
- Bir testin nasıl yazılacağı
- Bölüm 0.7.2'deki yama tekniğine geçmek

**SOR / `BLOCKED.md`'ye yaz ve devam et:**
- Fiziksel cihaz gerektiren her şey (H1, H7)
- Blender gerektiren her şey (H2, H3, H4)
- Hesap/DNS/para gerektiren her şey (H5)
- Repoda olmayan kaynak dosya (H6)
- **Mevcut bir ürün özelliğini kaldırmak zorunda kalman** (Bölüm 3 listesi) —
  bu asla tek taraflı verilecek bir karar değil

**DUR ve sor (nadir):**
- Bölüm 3'teki değiştirilemez bir gereksinimi korumanın tek yolu,
  bu dokümandaki bir talimatı çiğnemekse
- Ölçüm, bu dokümandaki bir temel sayıyı çürütüyorsa
  (örn. atlaslar düz değilse, gölge aslında çalışıyorsa) —
  **teşhis yanlışsa plan da yanlıştır, devam etme, raporla**

**Kalite ile hız çatıştığında hız kazanır.** Kaliteyi kıs, ölç, raporla —
ve hangi kalite kaleminin hangi bütçe yüzünden kısıldığını yaz ki
sonraki fazda (KTX2 ve LOD bütçe açtığında) geri açılabilsin.

## Bitirdiğini nasıl söylersin

Şu üç cümleden **hangisi doğruysa onu** söyle, karıştırma:

> **"Faz N tamamlandı."**
> → Kabul listesinin her maddesi ✅, mandal tablosunda hiç `null` yok,
>   `npm test` yeşil, screenshot'lar üretildi. **Başka hiçbir durumda deme.**

> **"Faz N kod tarafı tamamlandı, ölçüm bekliyor."**
> → Kod maddeleri ✅, mandalda insan ölçümü eksik.
>   `BLOCKED.md`'de tam olarak ne beklendiği yazılı.

> **"Faz N kısmen tamamlandı: X, Y bitti; Z bloke."**
> → Z'nin neden bloke olduğu ve etrafından dolaşmayı **denediğin**
>   yazılı (Bölüm 0.7.4 adım 1).

Tamamlandığını yalnızca **kod + screenshot + ölçüm + mandal tablosu +
güncel `BLOCKED.md`** ile kanıtlayabildiğinde bildir.
**Bu beşinden biri eksikse "tamamlandı" kelimesini kullanma.**

---

## EK A — Hızlı referans: dosya:satır haritası

> **Referans commit: `561b87c` (main).**
> `main` aktif bir daldır ve satır numaraları kayar. **Kod değişmedi, yer değişti** —
> bir satır tutmuyorsa yanındaki kod parçasını `grep` ile ara.
>
> Bu dokümandaki bulguların üretildiği tarihten bu yana
> `material-response.js`, `batched-material.js`, `render-profile.js`,
> `exterior-grade.js`, `native-delivery.js`, `ground-light.js` ve
> `tools/batch-delivery/*` **hiç değişmedi.** `lighting.js`'e yalnızca
> `interior(floor|'all')` gece modu eklendi (satır 267) — teşhisi etkilemez.

```
main.js:60    deliveryProfile — pointer:coarse
main.js:61    modelRoot — build/web/batched/{profile}/
main.js:83    LITE seçimi
main.js:335   PerspectiveCamera(16, ...) — plan/iso geçişi   ← Task 1.5 (İKİNCİ NOKTA)
main.js:354   compact — aspect<0.9 dahil
main.js:556   PerspectiveCamera(16, ...) — ana kamera        ← Task 1.5
main.js:560   coarse
main.js:562   WebGLRenderer({antialias:coarse})
main.js:570   renderPixelRatio
main.js:580   createLighting({baked: ...})      ← Task 1.1 ANA HEDEF
main.js:1080  loadNativeModel (batched yolu)
main.js:1089  room probe yüklemesi              ← Task 2.1-c
main.js:1130  aoMapIntensity = .7
main.js:1137  ktx2Loader.dispose()              ← Task 4.1
main.js:1149  gunzipSync örneği                 ← Task 2.1-b modeli
main.js:1154  setFixtures(allRooms:true)
main.js:1202  batched erken return              ← Task 1.3 engeli
main.js:1354  wantsGrade (ÖLÜ)                  ← Task 1.3
main.js:1357  loadGradeTextures çağrısı (ÖLÜ)   ← Task 1.3
main.js:1499  createContextMassing (ÖLÜ)

lighting.js:122   compact
lighting.js:123   shadowMap.enabled = !baked    ← Task 1.1 ANA HEDEF
lighting.js:129   HemisphereLight
lighting.js:130   DirectionalLight
lighting.js:131   sun.castShadow / mapSize      ← Task 1.2
lighting.js:165   compactOutput
lighting.js:167   if(!compact && !baked)        ← Task 1.1
lighting.js:198   spot castShadow
lighting.js:232   setTime() sonu — koşulsuz shadow needsUpdate ← Task 1.2-c
lighting.js:240   HDRLoader FloatType           ← Task 2.1-d
lighting.js:265   keepSlotsVisible
lighting.js:272   interior(floor|'all', …, boost) — gece modu ← Task 3.4-g
lighting.js:303   setWindowGlow() — pencere parıltısı ⚠️ KORUNACAK (Bölüm 3)
lighting.js:321   object.castShadow = !glass
lighting.js:328   groundLight.apply (villa DIŞINDA) ← Task 1.2-d
lighting.js:329   floorLight.apply
lighting.js:330   prepareMaterialResponse (ÖLÜ)
lighting.js:342   glazing.add — gece parıltısı malzeme seti
lighting.js:343   anisotropy (ÖLÜ)              ← Task 1.6

material-response.js:35/146/156  angoraAuthoredPBR guard  ← ÖLÜ KOD (Bölüm 0.5)
material-response.js:66          roof polygonOffset hack  ← Task 3.2
material-response.js:130         neutraliseTransmission   ← Task 3.5

batched-material.js:14  neutralInterior
batched-material.js:22  atlasSample               ← Task 3.3
batched-material.js:25  maxLod = log2(width*pad)  ← Task 3.3 / shimmer kaynağı
batched-material.js:33  spot strip (garden hariç) ← Task 1.6

native-delivery.js:90   model.visible             ← Task 1.4
ground-light.js         setSun fade penceresi     ← Task 1.2-d
exterior-grade.js       TÜM DOSYA ÖLÜ             ← Task 1.3

tools/batch-delivery/build.mjs:26        size=512, pad=4
tools/batch-delivery/build.mjs:63        grid seçimi
tools/batch-delivery/build.mjs:84        setDoubleSided(true)   ← Task 1.4
tools/batch-delivery/build.mjs:96        angoraAuthoredPBR:true
tools/batch-delivery/refresh-detail.mjs:81  texture_limits
tools/batch-delivery/refresh-detail.mjs:90  byte budget throw   ← Task 3.4-d
```

## EK B — Kullanılmayan, hazır duran varlıklar

```
viewer/public/textures/*.png        1,2 MB  gerçek tileable doku      → Task 1.3
assets/textures/*.png               1,2 MB  (pages kopyası)           → Task 1.3
build/web/native-current/ktx2/      41,9 MB 113 KTX2, 2×4096², 7×2048² → Task 3.4-d
build/web/native-current/shared/    118 MB  orijinal PNG/bin           → Task 3.1 referansı
assets/review-textures/*.png        8,5 MB  fotoğraf referansları      → Task 3.1
photogallery/                       34 MB   55 mülk fotoğrafı          → Task 3.1 kalibrasyon
build/blender/angora-material-lighting.blend  (LFS)  bake sahnesi      → Task 3.4
build/web/full/, kanka/, sansi/             legacy teslimler           → silinebilir
web-assets/basis_transcoder*        585 KB  kullanılmıyor              → Task 4.1'de aktifleşir
```
