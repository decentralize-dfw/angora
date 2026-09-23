# AYDINLIK — kasveti kaldır, villa'yı aç

Ürün sahibi: *"gözle görülür fark var ama hâlâ V-Ray değil. Çok puslu,
fazla gotik ve dramatik. Biz burada bir hayat satıyoruz, bu kadar
kasvetli olmamalı."*

Doğru teşhis. Sahne sinematik-karanlık yöne kaymış; emlak görselinin
istediği şey **yüksek anahtar**: aydınlık, açık, sıcak, gölgeler
bastırılmış değil kaldırılmış.

---

## İŞ 1 — SİS: yakın çevreden kaldır ⭐ en büyük tek etki

`lighting.js:543`:
```js
scene.fog=atmosphericFog&&(view==='region'||view==='neighborhood')?atmosphericFog:null;
```

`neighborhood` **ana dış görünüm** — ekran görüntülerindeki kare bu. Orada
`FogExp2` yoğunluk **0.0018** ile her şeyi griye boğuyor. Sis, kilometrelerce
derinlik olan yerde hava hissi verir; 70 metrelik bir mahalle karesinde
sadece pus yapar.

**Yap:** sisi `region`'da bırak, `neighborhood`'dan **çıkar**.
İstersen `neighborhood` için ayrı ve çok düşük bir yoğunluk (≤0.0004)
dene, ama varsayılan **kapalı** olsun.

Bayrak: `warmGradeV1` (aşağıdaki hepsi bu bayrağın altında, tek anahtar).

## İŞ 2 — GÖKYÜZÜ: %55'ten çıkar

`lighting.js:116`: `scene.backgroundIntensity=.55`

Gökyüzü yarı kısık. Parlak bir gök, sahneyi hem aydınlatır hem "güzel gün"
hissi verir. **0.55 → 0.85.** Beyaza patlarsa 0.75'e çek, ama 0.55'te
kalmasın.

## İŞ 3 — ÜST ÜSTE BİNEN KARARMA

Şu an üç ayrı kapanma terimi aynı piksele çarpıyor:

| Terim | Yer | Şu an |
|---|---|---|
| Contact vertex AO | `vertex-ao.js:91` | `strength 0.55` |
| Pişmiş AO haritası | `main.js:1346` | `aoMapIntensity 0.7` |
| GTAO | `exteriorGtao` ile yakın çevrede **yeni açıldı** | tam |

Üçü çarpılınca köşeler ve saçak altları siyaha yakın oluyor. V-Ray'de
kapanma **var ama yumuşak** — mavi gökten gelen dolaylı ışık o kararmayı
doldurur; burada o dolgu yok, o yüzden delik gibi duruyor.

**Yap:**
- Contact AO `strength` **0.55 → 0.35**
- `aoMapIntensity` **0.7 → 0.55**
- GTAO'nun yoğunluğunu yakın çevrede ayrı ayarlanabilir yap, yarıya indir
- Kapanma terimlerini **çarpma, en koyusunu al** (`min`) — üç terim
  çarpınca üsteleniyor

## İŞ 4 — SICAK VE YÜKSEK ANAHTAR GRADE

`grade-pass.js`'te:
- **Gölgeleri kaldır** (lift): siyah noktayı biraz yukarı al, dipler
  siyaha yapışmasın
- **Sıcaklık**: hafif amber kayması (gölgelerde değil, orta tonlarda)
- Kontrastı **artırma** — düşür. Dramatik değil davetkâr olacak.

Hedef referans: emlak fotoğrafçılığı. Parlak, açık, gölgeler okunur ama
yumuşak. Gotik değil.

## İŞ 5 — VARSAYILAN SAAT

`main.js:1976`: `$('#daylight-hour').value = 16.5`

16:30 altın saat — uzun gölgeler, düşük güneş, dramatik. İstenen bu değil.

**Yap:** varsayılanı **12:30–14:00** arasına al. Altın saat slider'da
kalsın, isteyen oraya gitsin; açılışta karşılayan kare parlak öğleden
sonra olsun.

---

## İŞ 6 — VİLLA AÇILMIYOR (ayrı bug, bloke edici)

Villa'ya tıklanınca **"Kat hazırlanıyor… %100"** yazıp orada kalıyor.
Yükleme bitmiş, geçiş tamamlanmamış — yani bir söz (promise) çözülmüyor.

Bu, komşu binalardaki hatanın aynı deseni: **ertelenen iş bekleniyor ama
bekleyen zincir eksik.** En güçlü aday `progressiveLoaderV2` (iç mekânı ve
kat probe'larını erteliyor).

**Yap:**
1. `progressiveLoaderV2:0` ile villa açılıyor mu, doğrula
2. Açılıyorsa: kat seçimi geç gelen `interior`'ı beklerken hangi sözün
   çözülmediğini bul. `onAcquired` kancası (`main.js:1320`) geç gelen parça
   için yalnız `contactBake.bakeLate` koşuyor — kat geçişinin ihtiyaç
   duyduğu ne varsa (probe'lar, kesit kapakları, clipping) orada da koşmalı
3. Açılmıyorsa konsoldaki ilk hatayı kök neden olarak al

**DOĞRULANDI:** `?features=progressiveLoaderV2:0` ile **villa açılıyor.**
Suçlu kesin.

Ve aynı anda ikinci teyit: `progressiveContextV1:0` ile komşu binalar
geliyor. **İki bayrak, tek bug.** İkisi de bir parçayı boşta kuyruğuna
alıyor, ikisinde de o parçayı devralacak zincir tamamlanmamış.

Konsol bunu sayıyla söylüyor:

| | Ertelenmiş | Boot yolunda |
|---|---|---|
| Atlas dizileri | 9 materyal | **20 materyal** |
| Contact AO | 503 598 vertex / 13 mesh | **1 072 135 vertex / 25 mesh** |
| Exterior grade | **5 materyal** | 8 olmalı |

**Yap:** `onAcquired` geç gelen her parça için parça-sonrası geçişlerin
**hepsini** koşsun — `reviveBatchedGrade`, atlas dizisi yükseltmesi,
contact AO, plot maskesi, clipping düzlemleri, ışık bağlama, kat
geçişinin ihtiyaç duyduğu probe'lar ve kesit kapakları.

Kabul: ertelenmiş ve ertelenmemiş halde **aynı sayılar** çıkacak —
exterior grade 8, atlas 20, contact AO 1 072 135. Sayılar eşitlenmeden
bu iş kapanmaz.

**Düzelene kadar ikisi de varsayılan KAPALI.** Payload kazancı, açılmayan
villaya ve kaybolan mahalleye değmez.

**Bu iş 1–5'ten ÖNCE.**

---

## KURALLAR

### TEST YOK — kod yaz, build al, main'e pushla

**Hiçbir doğrulama koşma.** Capture yok, gate yok, QA oturumu yok,
bisect yok, kare çekme yok. Ürün sahibi tarayıcıdan bakacak, testi
birlikte yapacağız.

Tek istisna: `npm test` (3 saniye). O bir QA koşumu değil, bozuk kodu
canlı siteye göndermeni engelleyen emniyet kemeri. Kırmızıysa **pushlama**.

Akış, her iş için:
```
kod yaz  →  npm test  →  build  →  main'e push  →  sıradaki iş
```

Ara rapor yok. Tur sonu tek satır: ne bitti, sırada ne var.

### Diğer

- İŞ 1–5 **tek bayrak** altında: `warmGradeV1`, varsayılan `false`.
  Ürün sahibi `?features=warmGradeV1:1` ile karşılaştıracak.
- İŞ 6 (iki erteleme bug'ı) bayrak altında **değil** — doğrudan düzelt.
  Düzelene kadar `progressiveLoaderV2` ve `progressiveContextV1`
  varsayılan **KAPALI** kalsın; düzelince ikisini de aç.
- Her değeri `PROGRESS.md`'ye yaz (eski → yeni), ayarlamak tek satır olsun.
- Bitince iki adresi ver: bayraklı ve bayraksız.
- `main`'e push için **izin verildi** — her iş bitiminde doğrudan pushla,
  sorma.
