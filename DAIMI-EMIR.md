# DAİMİ EMİR — durma, bitir

**Tek kural:** Turu asla boşta bitirme. Capture arka planda koşuyor diye
durmak yok — aşağıda capture'a dokunmadan yapılacak dokuz iş var, sonra
gate zinciri, sonra kapanış. Bir iş biterse **sıradakine geç**, sorma.

**Bitti demek:** Bölüm D'deki kapanış listesinin her maddesi ya ✅ ya
H-numaralı BLOKE + teslimat paketi. İkisinden biri olmadan hiçbir madde
kapanmaz.

---

## A. CAPTURE KOŞARKEN — sırayla, durmadan

`baseline-a36e184` SwiftShader'da CPU'yu yiyor. **İkinci bir capture veya
ağır render başlatma.** Bunun dışında her şey serbest: kod, test
(`npm test` 3 saniye), GLB okuma, ölçüm script'i, doküman.

### A1. Gece karesi GÜNDÜZ çıktı — düzelt

`build/qa/gate-f342/desktop/C04-night-probe.png` açıldı: parlak güneş,
yeşil çim, yanan pencere yok. **Bu bir gece karesi değil.**

`final-probes.json` `night` bloğu doğru ölçmüş (gündüz 80 program/62 çağrı,
gece 80/62, `addedPrograms: 0`) — o iddia geçerli. Ama probe **yalnız
program sayıyor**, FAZ 3 kabul md. 9 ise görsel bir kriterdi
("gece modu GI sahnesindeki lambalar gibi, 20 OpenGL point light gibi
değil") ve hiç değerlendirilmedi.

Yap:
1. Probe'un gece moduna gerçekten geçip geçmediğini koddan doğrula
   (saat/`style` parametresi capture'a ulaşıyor mu, `lightsEnabled`,
   `electricLight` devreye giriyor mu).
2. Geçmiyorsa **bug**: düzelt.
3. Geçiyorsa kare yanlış adlandırılmış: adı düzelt.
4. Kapanış gate'ine **gerçek bir gece karesi** ekle (C04 + C10, gece saati).
   Kabul: pencerelerden ışık okunuyor, sahne GI gibi, nokta ışık patlaması
   yok. Kompozitte göster.

### A2. Havuz suyu — `applied` sayısı hiç ölçülmedi

`final-probes.json`:
```json
"water": { "note": "scene walk unavailable without hooks", "applied": null }
```
Kod yolu erişilebilir (doğrulandı) ama **kaç materyale uygulandığı
bilinmiyor.** "Canlı" demek için yetmez.

`applyWaterSurface` çağrısını İŞ A'daki `reviveBatchedGrade` gibi say,
`console.info` ile logla, gate raporuna yaz. Beklenen: `garden-glass-4`
üzerinden 1. Farklı çıkarsa sebebini yaz.

### A3. İŞ D kodunu bitir
Anahtarında bekliyor (`proceduralDetailInterior`). Kodu tamamla, testini
yaz, bayrak kapalı commit'le. Gate sırasını bekle.

### A4. İŞ F testini tamamla
`exteriorGtao` için: `neighborhood` açık, `region` **asla**, mobil tier'da
`postProcessing:false` olduğu için etkisiz — üçü de testli olsun.

### A5. i18n testi yaz
`viewer/src/i18n.js` testsiz. Regresyon listesinde ve korunması gerekiyor.

### A6. "Ölçüler" ve "VR" — bu özellikler var mı?

Planın regresyon listesi ikisini sayıyor ama bu kod tabanında modül
bulunamadı. `frame-measurement.js` ölçü aracı değil, FPS toplayıcısı.

Cevapla: `main.js` içinde gömülü mü, başka adla mı, yoksa liste var olmayan
özellik mi sayıyor? **Bulduğunu `PROGRESS.md`'ye yaz.** Varsa test yaz;
yoksa "bu üründe yok" diye kaydet ki bir daha kimse aramasın.

### A7. İlk interaktif payload — 4,8 kat hedefin üstünde

Task 2.1 kabul: **≤5 MB desktop, ≤4 MB mobile**.
Ölçülen (final-current C01): **desktop 23,8 MB, mobil profili 18,2 MB**.
Bu hiçbir raporda geçmedi.

Progressive loader gerçekten çalışıyor (interior kritik yoldan çıktı,
bundle 708→301 KB) — sorun model payload'ı: hâlâ 22,4 MB.

Yap: **ölç ve yaz.** H6 (kaynak dizin) olmadan bu sayının ne kadarı
kapanabilir? Kat bölmesi ve LOD streaming H6'da, ama:
- neighborhood görünümü `interior.glb`'yi gerçekten beklemiyor mu — kanıtla
- `context-plants` / `context-buildings` ilk karede gerekli mi
- hangi parça ertelenirse ilk-interaktif kaç MB düşer

Kapanabilecek kısmı kapat, kalanı **sayıyla** H6'ya yaz. "Progressive
loader çalışıyor" demek bu kriteri karşılamaz.

### A8. BLOKE kalemler için teslimat paketi — H1'de yaptığının aynısı

H1'i `qa-mobile.html` ile insanın 2 dakikalık işine çevirdin. **Aynısını
diğer engeller için yap.** Sadece "BLOCKED" yazmak yetmez.

| Engel | Üretilecek paket |
|---|---|
| **H2** Blender lightmap/AO rebake (iç mekân doluluğu %4,1 → hedef ≥%65) | Blender'da çalıştırılacak **hazır script** + hangi mesh, hangi UV kanalı, hangi çözünürlük, beklenen çıktı dosya adları + doğrulama komutu |
| **H6** `../model-finalization/web` kaynağı | Kaynağın **tam manifesti**: hangi dosyalar, hangi hash'ler, ne işe yarıyor, geldiğinde hangi komut koşacak |
| **H8** aynalı sarım + Draco yeniden kodlama | Tespit script'i (hangi mesh'ler aynalı) + düzeltme reçetesi + doğrulama |
| **H10** görünürlük rebake | Aynı format |

Her paket `BLOCKED.md`'ye girsin ve **"insanın yapması gereken tek şey"**
satırıyla bitsin. Bu paketleri üretmek bloke iş değil, senin işin.

### A9. Kapanış raporu iskeleti
Bölüm D'deki listeyi boş tablo olarak şimdi kur; gate'ler geldikçe doldur.
Kapanışta sıfırdan yazma.

---

## B. CAPTURE BİTİNCE — gate zinciri, kesintisiz

`baseline-a36e184` → verdict → **durmadan**:

```
faz6-b (proceduralDetailV1)  →  faz6-c (runtimeVertexAO)
   →  faz6-d (proceduralDetailInterior)  →  faz6-e (glassTiersV2 + plantNormalsV1)
   →  faz6-f (exteriorGtao)  →  KAPANIŞ
```

Her gate: **12 kamera × 4 tier**, kompozit zorunlu, her gate'te farklı
kareler, en az bir C10. Kesit kaybı >%1 KIRMIZI. ALU/varying sayımı gate
dosyasına. Flag-off GLSL diff BOŞ.

Bir gate kırmızı gelirse: `?features=` ile bayrak-bisect yap, sebebi bul,
düzelt, **aynı gate'i tekrar koş**. Sırayı atlama, ama sonraki gate'in
kodunu bu arada hazırla — boşta bekleme.

---

## C. ASLA

- **Boşta tur bitirme.** Capture koşuyorsa A'daki sıradaki işe geç.
  Check-in'i her turda yeniden kur; kapanana kadar iptal etme.
- **"FAZ 6 TAMAMLANDI" yazma.** `ratchet.json` baseline'ı `null`,
  `acceptedByOwner: false`. Planın kendi kuralı (Task 0.4):
  *"Mandal null kaldığı sürece hiçbir faz 'tamamlandı' ilan edilemez."*
  Yazacağın cümle: **"kod tarafı bitti, mandal bekliyor."**
- **Sayı yerine sıfat yazma.** "İyileşti", "çok daha iyi", "büyük ölçüde"
  yasak. Kaç/kaçta — sayıyla.
- **Kapsama iddiasını saymadan yazma.** Task 1.3 "dış cephe dirilişi" diye
  kapatılmıştı, 25 yüzeyin 2'sine dokunmuştu. `applied` sayısı logda olacak.
- **Gözle "iyi görünüyor" ile gate geçme.** Sayısal kural varsa o geçerli.
- **`main`'e merge etme.** İzin bekler.
- İkinci capture / ağır render başlatma (A'nın başındaki CPU kuralı).

---

## D. KAPANIŞ LİSTESİ — her madde ✅ ya da H-numaralı BLOKE + paket

**Süreç**
1. Her gate 12 kamera × 4 tier üretti, `mobile-high` dahil
2. `baseline-a36e184` commit'li ve tüm A/B'lerin ÖNCE'si
3. Lens değişikliği varsa eski/yeni ayrı kompozitlerde
4. `features.js`'te her bayrağın tier kapsamı yazılı, ölçülmemiş "ACTIVE" yok

**Ölçüm — sayıyla**
5. Düz roughness: **164/177 → ≤60/177** (aynı yöntem: G kanalı, hücre içi,
   eşik 6/255). Sayıyı yaz.
6. Dış cephe doygunluğu: denetimde C03 72,4→58,8, C04 60,7→52,4 düşmüştü.
   Ölç; geri kazanıldı mı, yoksa daha mı düştü — sayıyla.
7. `reviveBatchedGrade` applied ≥ 8
8. `uDetail`: ≥20 dış, ≥6 iç hücre sıfırdan farklı
9. `glassTiersV2` applied > 0 **ve** asansör gül camı + iç buzlu cam
   değişmemiş (C10 pixel diff ile kanıt)
10. `poolWaterV2` applied sayısı loglu (A2)
11. İlk interaktif payload: kapanabilen kapatıldı, kalan sayıyla H6'da (A7)
12. ALU: mobil ≤80, masaüstü ≤160 skaler op — emitted bloktan **sayılmış**
13. Draw call / üçgen / byte / VRAM deltası sıfır
14. Flag-off GLSL diff boş, program sayısı değişmemiş

**Görsel**
15. C03, C04, C07, C10 kompozitleri — **sabit kamerayla** öncesi/sonrası
16. Gerçek gece karesi (A1) kompozitte
17. Kesit kareleri yeşil (kayıp yüzey ≤%1)
18. `desktop-high` tier'ı **ilk kez** render edildi — FAZ 5 cinemaStill
    görsel olarak doğrulandı

**Regresyon**
19. Testler yeşil (sayıyla)
20. i18n testi var (A5)
21. "Ölçüler" ve "VR" sorusu cevaplandı (A6)
22. Asansör, sesli tur, foto pinleri, paylaşım linki — testli, çalışıyor

**Engeller**
23. H2, H6, H8, H10 için teslimat paketi yazıldı (A8)
24. H1 hâlâ açık — mobil bayraklar kapalı ship edildi, açıkça belgelendi

---

Bu liste bitene kadar durma. Bir madde bloke olursa H numarası + teslimat
paketi yaz, **sonrakine geç**. Her turda `PROGRESS.md` güncel kalsın:
yeni bir oturum onu okuyup hiçbir şey sormadan devam edebilmeli.
