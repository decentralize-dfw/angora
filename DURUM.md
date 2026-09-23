# DURUM — 23 Eylül

## 1. NEDEN AÇILMIYOR

**Açılıyor. Ölçüm ortamı çizemiyor.** İkisi farklı şey.

- Bayraklar **kapalı**: 9/9 kare temiz, yeşil, saklı
- Bayraklar **açık**: hiçbir kare 480 saniyede rapor veremiyor

### Hesap

| Kalem | Maliyet |
|---|---|
| **SSR** | piksel başına **28 ray-march adımı** (`ssr-pass.js:49`), 1600×900 = **40 milyon doku okuması / kare** |
| **GTAO** | çözünürlük ölçeği 0,65 → **1,0** (İŞ 5). GTAO piksel sayısı **2,4 kat** arttı |
| **PCSS** | blocker search — gölge başına çok örnekli, sabit PCF'in katı |
| **Prosedürel detay** | 2 oktav → **4 oktav**, her fragment'te |

Dördü de **tam ekran, piksel başına**. Üst üste bindi.

### Kritik nokta

Ölçüm ortamı **SwiftShader** — GPU yok, yazılım rasterizer, tek CPU.
Gerçek bir ekran kartında 40 milyon doku okuması sıradan bir SSR
maliyetidir, milisaniyelerle ölçülür. SwiftShader'da aynı iş dakikalar
sürer.

**Yani bu kırmızı, sitenin tarayıcıda açılmadığını KANITLAMIYOR.**
Kanıtladığı tek şey: SwiftShader bu kareyi 8 dakikada çizemiyor.

Ama tersini de kanıtlamıyor. FPS bu ortamda ölçülemiyor — "masaüstünde
bütçe tavanı yok" derken açık bıraktığım delik tam burası.

### Gerçek cevabı veren tek şey

Bayraklar açık build'i **gerçek tarayıcıda açmak.** 2 dakikalık iş,
sadece sen yapabilirsin. O açılırsa mesele yok; açılmazsa hangi bayrağın
pahalı olduğu bisect ile bulunur.

### Ajanın teşhisi neden eksik

Ajan `requestIdleCallback` açlığı dedi ve her boşta halkasına timeout
ekledi (`6c65e47`). Doğru bir sertleştirme ama **sebep bu değil**:
zincirin ucundaki contact-AO bake ve portal ışıkları bayraklar kapalıyken
de koşuyordu ve o koşum 9/9 yeşildi. Değişen şey kare maliyeti.

Bisect de yanıltabilir: "suçlu SSR" diye çıkacak, oysa SSR gerçek GPU'da
muhtemelen sorunsuz. Kesmeden önce gerçek tarayıcı denemesi şart.

---

## 2. FAZLAR — ne bitti, ne bitmedi

| Faz | Durum | Not |
|---|---|---|
| **FAZ 0** ölçüm altyapısı | ⚠️ %90 | `baseline-<commit>/` hiç oluşturulmadı; mandal `null` (H1) |
| **FAZ 1** "maket öldü" | ⚠️ %70 | 1.1/1.5/1.6 tam · 1.2/1.1b masaüstü · 1.3 kısmi (FAZ 6 tamamladı) · 1.4 rafta (H8) |
| **FAZ 2** yük ve geometri | ⚠️ %60 | 2.1 kısmi (payload 23,8→10,2 MB, hedef 5) · 2.2/2.3 runtime yarısı · 2.4 geri alındı (H10) |
| **FAZ 3** malzeme ve ışık | ❌ %30 | 3.3/3.4f/3.4g tam · 3.4d masaüstü · 3.5 yarısı ölüydü (FAZ 6 onardı) · **3.1/3.2/3.4a-c hiç başlamadı** (H2/H9, malzeme+mesh sen kestin) |
| **FAZ 4** teslim ve cila | ⚠️ %50 | 4.2/4.4 tam · 4.1 ertelendi (gerekçe ölçülü) · 4.3 sen "iyi" dedin |
| **FAZ 5** sinematik kare | ⚠️ kod var | `desktop-high` hiç render edilmedi, **hiç görülmedi** |
| **FAZ 6** düz renk katliamı | ✅ kod bitti | 7 iş + süreç onarımı · doğrulama FAZ 7'ye devredildi |
| **FAZ 7** masaüstü V-Ray | 🔴 kod bitti, doğrulama KIRMIZI | 7 iş kodlandı, 302/302 test · kareler çizilemedi |

---

## 3. YAPILAN — doğrulanmış

- FAZ 6: exterior-grade 4→8 materyal · prosedürel roughness+albedo ·
  vertex AO · 3 ölü kod yolu onarıldı · dış cephe GTAO · iç mekân
- FAZ 7: SSR · PCSS · pencere portal ışıkları · 4 oktav detay ·
  tam çözünürlük GTAO · clearcoat/sheen · DOF
- Süreç: gate 4 tier × 12 kamera, tier uyuşmazsa FAILED · kameralar
  donduruldu · lens kuralı yazıldı
- A7: ilk interaktif **−13,6 MB** (komşular+bitkiler boşta)
- A6: "Ölçüler" ve VR ürün özellikleri **var**, ikisine test yazıldı
- A1: gece probe'u saati hiç değiştirmiyormuş — bug bulundu, düzeltildi
- H2/H6/H8/H10 teslimat paketleri yazıldı (H8 tespiti çalıştırıldı:
  8 context eklemesinin 5'i aynalı)
- 302/302 test

## 4. YAPILMAYAN

| Kalem | Neden | Kimde |
|---|---|---|
| İç mekân lightmap **%4,1** (hedef ≥%65) | Blender yok | **H2** — script hazır |
| iPhone 13 ölçümü | cihaz yok | **H1 — sende**, `qa-mobile.html` |
| Payload 10,2 MB (hedef 5) | kat bölmesi + LOD | **H6** — kaynak dizin yok |
| Üçgen 2,05 M (hedef 700k–1,2 M) | instancing/LOD | **H6 + H10** |
| Task 1.4 doubleSided | Draco re-encode | **H8** — 5/8 aynalı mesh tespitli |
| Malzeme yazarlığı, mesh temizliği | — | **sen kestin** |
| `desktop-high` hiç render edilmedi | FAZ 7 kırmızı | doğrulama bekliyor |
| FAZ 6 + FAZ 7 görsel doğrulama | kareler çizilemedi | **şu anki blokaj** |

---

## 5. SIRADAKİ TEK HAMLE

Bayraklar açık build'i gerçek tarayıcıda aç. Cevap oradan gelecek.
Bisect ondan sonra, gerekirse.
