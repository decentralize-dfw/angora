# FAZ 6 — EK EMİR (mevcut işin üstüne)

Bu, FAZ-6 briefini **değiştirmez**, üstüne biner. İŞ A–E'yi durdurma,
sırayı bozma. Üç şey ekliyor, bir şey düzeltiyor.

Durum tespiti (senin commit'lerinden okundu, doğru gidiyorsun):
İŞ A canlı (8 malzeme, sayılmış) · İŞ B/C/E kod commit'li, bayraklar
kapalı, gate'ler sırada · İŞ D anahtarda.

---

## 0. ÖNCE: brief sana KESİK ulaşmış

`PROGRESS.md`'ye düştüğün not doğru — BÖLÜM 2'nin başı kesilmiş, `uDetail`
tablosunun üst satırlarını kendin yazarlamışsın. Doğru davranış, ama tablo
artık tam haliyle repoda:

**`IS-EMRI.md`** (dal: `claude/clever-tesla-ataxcq`) — BÖLÜM 2 İŞ C'deki
17 satırlık dış tablo + iç mekân satırları tam. Kendi yazarladığın
değerlerle karşılaştır, farklıysa **dosyadaki kazanır**. `DENETIM.md` de
aynı dalda — bu ekin bütün sayıları oradan.

---

## 1. DÜZELTME: ALU tavanı yanlıştı — benim hatam

Brief "mobil ≤ +14, masaüstü ≤ +38" diyordu. Birim belirtmemiş, üstelik
sayı gerçekçi değildi: 4 köşe hash'li tek oktav değer gürültüsü tek başına
~24 skaler op. Senin 69 (tek oktav) / 116 (iki oktav) ölçümün **doğru ve
dürüst**; tavanı aştığını kaydetmen de doğru davranış.

**Yeni tavan, skaler op cinsinden, net:**

| | Tavan | Senin ölçümün |
|---|---|---|
| Mobil (tek oktav) | **≤ 80** | 69 ✅ |
| Masaüstü (iki oktav) | **≤ 160** | 116 ✅ |

İkisi de altında. **Optimizasyon yapma** — "1 hash'li değer gürültüsü"
planını rafa kaldır, görsel kaliteyi düşürür ve gerek yok. Sayım yöntemini
(emitted bloktan say, tahmin etme) aynen koru.

---

## 2. İŞ F — GTAO'yu dış cephe görünümlerine aç ⭐ YENİ, EN YÜKSEK GETİRİ

Bu brief'inde yoktu; 26 task'lık denetimde çıktı ve tek satırlık bir
konfigürasyon meselesi.

**Bulgu:** 12 kameranın capture JSON'ları okundu. C01–C04'ün
(region + neighborhood) **hepsinde `gtao: false`**. `quality-profile.js`
matrisi o iki satırda GTAO'yu temizliyor. Yani çatlak/köşe/temas kararması
dış cephede **masaüstünde bile** hiç çalışmamış. Villanın çimin üstünde
yüzmesinin sebebi bu — render'da gözle görülüyor.

**Yap:**
- Yeni bayrak `exteriorGtao`, **varsayılan `false`** (diğerleri gibi).
- `neighborhood` satırında aç. **`region`'da AÇMA** — 400 m span'de kazanç
  yok, maliyet var.
- `gtaoResolutionScale` mevcut değerinde kalsın.
- Bu iş **mobili değiştirmez** (mobil matris `postProcessing:false`).
  Raporunda bunu dürüstçe böyle yaz — "mobilde de iyileşti" deme.

**Kabul:** C02/C03/C04'te duvar-zemin, saçak-cephe, bitki-toprak
birleşimlerinde görünür kararma; gökyüzü ve düz cephe ortalarında diff ≈ 0.

**Sıra:** İŞ D'den sonra, kapanıştan önce. Ucuz ve görünür.

---

## 3. SÜREÇ ONARIMI — gate'lerin kendisi bozuk, İŞ D'den ÖNCE düzelt

Denetim, önceki beş fazın neden "yeşil" kapanıp gerçekte kapanmadığını
buldu. Sebep kod kadar **gate yönteminin kendisiydi**. Bunlar düzelmeden
faz6 gate'leri de aynı şekilde anlamsız olur.

### 3.1 Her gate dört tier'ı da yakalayacak — **pazarlık yok**

**Bulgu:** bugüne kadarki *her* capture `desktop-balanced` tier'ında
koşmuş. "mobile" klasörleri dahil — onlar 393×852 viewport'ta koşmuş
desktop-balanced. `mobile-high`, `mobile-low`, `desktop-high` **hiç**
yakalanmadı. Mobil hakkındaki her iddia sadece birim testine dayandı.

`qa-capture.mjs`'e tier zorlaması ekle (`?quality=`), her gate şunları
üretsin:

| Profil | Tier | Zorunlu |
|---|---|---|
| desktop | `desktop-balanced` | ✅ |
| desktop | `desktop-high` | ✅ |
| mobile | `mobile-high` | ✅ **referans cihaz** |
| mobile | `mobile-low` | ✅ |

**`mobile-high` yakalanmayan gate geçersizdir.** SwiftShader'da tier
zorlamak FPS vermez ama **hangi kodun çalıştığını** gösterir — eksik olan
tam olarak buydu. `desktop-high` de hiç görülmediği için FAZ 5 cinemaStill
bugüne dek hiç render edilmemiş durumda; bu turda görülecek.

### 3.2 Gate 12 kameranın hepsini koşacak

**Bulgu:** gate'ler 7–8 kamerayla koştu. **C11 (ana yatak odası), C12
(bodrum mutfak) hiçbir gate'ten geçmedi**; C04 (havuz cephesi) FAZ 1
boyunca hiç gate'lenmedi.

C01–C12, hepsi. İç mekân şikâyeti varken C11/C12 gate dışı kalamaz.
Maliyet sorun olursa kare sayısını değil, **tier × kamera** çarpımını
düşür — ama `mobile-high` ve 12 kamera düşürülemez.

### 3.3 Kameralar DONDU — lens değişirse iki kare çek

**Bulgu:** `qa-cameras.js:3` kendi kuralını yazıyor: *"Every number here is
FROZEN — a camera that drifts invalidates every diff taken through it."*
`qa-cameras.js:31`: fov'lar Task 1.5'te değişti (C03/C04 16°→30°,
C05–C08 16°→28°). Sonuç: C03'te kamera 44,0 m, C04'te 50,7 m kaydı.
**Önceki bütün A/B kompozitleri bu yüzden kalite kanıtı taşımıyor.**

Bundan sonra: lens/çerçeve değişikliği **kalite işi değildir**.
Değiştirmen gerekirse eski lensle bir kare (kalite karşılaştırması bununla),
yeni lensle ayrı bir kare (kompozisyon değişikliği bununla) — **ayrı**
kompozitlerde. Aynı karede karıştırma.

FAZ 0-dönemi fov-16 değerleri `496c674` commit'inde. `qa-cameras.js:33`
bunların `pre-1.5` tag'inde olduğunu söylüyor — **o tag yok**, yorumu
düzelt.

### 3.4 `build/qa/baseline-<commit>/` oluştur

FAZ 0 kabul md. 7 hiç yapılmadı; yerine `gate-visual-ref` (8 kamera, tek
tier) kullanıldı. Şimdi yap: 12 kamera × 4 tier, `baseline-<commit>/`
altına commit. Bundan sonraki her A/B'nin "ÖNCE"si bu olsun.

### 3.5 Kesit kuralı aynen korunur

Kesit görünümünde kayıp yüzey **>%1 ise KIRMIZI**. Gözle "iyi görünüyor"
yasak — Task 1.4'te tam bu yüzden eksik duvarlar kaçtı.

---

## 4. EK KABUL KRİTERLERİ

Brief'in BÖLÜM 6'sına ekle. Kapanışta bunlar da tek tek sayılacak:

**Roughness — bu turun asıl ölçüsü.**
Denetim, hücre hücre ölçtü: **177 kaynak materyalin 164'ünde** hücre-içi
roughness varyasyonu ≤6/255. Tek tip speküler parlama, tek tip albedo'dan
**daha güçlü** bir "bu CG" sinyalidir — düz renk listesinin de üstünde.

- Ölçümü **aynı yöntemle** tekrarla: metallicRoughness dokusunun G kanalı,
  `angoraBatch` hücresi kırpılır, `hi-lo ≤ 6` ise düz sayılır.
- Hedef: **164/177 → ≤ 60/177**.
- Sayıyı gate dosyasına yaz. "İyileşti" yazma, **sayıyı** yaz.

**Doygunluk — geri kazanılacak, düşürülmeyecek.**
Denetimde dış cephe doygunluğu düşmüştü: C03 72,4 → 58,8 (−%19),
C04 60,7 → 52,4 (−%14). Ufuk sisi + grade rengi çekmiş, düz albedo'nun
üstüne binince sonuç daha soluk — yani SketchUp'a daha yakın. Bu turda
**ölç ve yaz**; düşmeye devam ediyorsa genlikleri değil, sis/grade'i
sorgula.

**Kapsama sayıları, iddia değil.**
- `reviveBatchedGrade` applied ≥ 8 ✅ (yaptın, sayılmış — böyle devam)
- `uDetail`'de sıfırdan farklı hücre: ≥ 20 dış, ≥ 6 iç
- `glassTiersV2` uygulanan sayı > 0, **asansör gül camı ve iç buzlu cam
  değişmemiş** (C10 pixel diff ile kanıtla — `architecture-glass-3` grid=2
  ve içindeki `Lift | Photographed rose glass 80 percent` hücresinin
  `range=255`, gerçek fotoğraf dokusu; düz uygulamada aynaya döner)

**Flag-off kapısı** (zaten yapıyorsun, koru): `?features=<ad>:0` ile emitted
fragment shader dökülür, bugünküyle `diff` boş çıkar, program sayısı
değişmez.

---

## 5. FAZ KAPATMA DİLİ — bu bir kuraldı ve ihlal edildi

`ratchet.json` baseline'ı `null`, `acceptedByOwner: false`. Planın kendi
cümlesi (Task 0.4):

> "Mandal `null` kaldığı sürece **hiçbir faz 'tamamlandı' ilan edilemez**."

Önceki turda beş faz buna rağmen kapatıldı; FAZ 1 çıkış kapısının 9
performans maddesinin 9'u da `baseline`'a bakıyordu ve hiçbiri
değerlendirilemedi.

**Bu turda yazacağın cümle:** *"kod tarafı bitti, mandal bekliyor."*
"FAZ 6 TAMAMLANDI" yazma. H1 ölçümü gelmeden mobil bayraklar açılmaz.

---

## 6. SIRA

1. **Süreç onarımı (Bölüm 3)** — İŞ D'den önce, yoksa gate'ler yine
   anlamsız yeşil verir
2. İŞ D (iç mekân satırları) — zaten anahtarında
3. **İŞ F (GTAO)** — yeni, ucuz, görünür
4. Kapanış: BÖLÜM 6 + Bölüm 4 kriterleri, tek tek sayılarak

Bir iş bloke olursa `BLOCKED.md`'ye H numarasıyla yaz, **neden**
olduğunu ölç, sonrakine geç. Sessizce atlama.
