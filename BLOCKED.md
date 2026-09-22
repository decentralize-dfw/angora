# BLOCKED — insan görev listesi (ANGORA-QUALITY-UPGRADE, Bölüm 0.7.3)

Bu dosya, quality-upgrade planında **ajanın yapamayacağı** işleri taşır.
Her madde: durum, ajanın hazırladığı zemin, insandan istenen adımlar,
ve neyi bloke edip etmediği. Bir madde kapanınca buradan silinmez;
durumu `DONE` yapılır ve kanıt linklenir.

---

## H1 — iPhone 13 / Safari baseline ölçümü
**Durum:** BLOCKED — fiziksel cihaz gerekli
**Hazırlanan:**
- `qa-mobile.html` (repo kökünde; yayında `https://angora.mergvs.com/qa-mobile.html`).
  Tek sayfa, bağımlılıksız: "Ölçümü başlat" → 15 sn villa orbiti → kat
  geçişleri (C05→C07→C08) → 30 sn salon yürüyüşü → 3 dk context-loss nöbeti →
  JSON + Kopyala düğmesi. Sayfa `?stats=1` harness'ini (viewer/src/qa-harness.js)
  iframe içinde sürer; çıktının `ratchetCandidate` alanı ratchet şemasıyla birebir.
- `build/qa/ratchet.json` iskeleti — ölçülmemiş her alan `null` (0 değil).

**İnsandan istenen:**
1. `main`'e merge + Pages yayını sonrası iPhone 13 Safari'de
   `https://angora.mergvs.com/qa-mobile.html` aç.
2. "Ölçümü başlat"a bas; ~5 dk sayfayı açık tut (kilitleme, şarj aleti takma,
   düşük güç modu kapalı).
3. Çıkan JSON'u kopyala ve ekibe/depoya ilet; `ratchetCandidate` içeriği
   `build/qa/ratchet.json → baseline`'a yapıştırılır, `device` alanı elle
   doldurulur, ürün sahibi onayıyla `acceptedByOwner: true` yapılır.

**Bloke ettiği:** FAZ 0'ın "tamamlandı" ilanı; tüm fazların mandal kapıları.
**Bloke ETMEDİĞİ:** FAZ 1'in kod görevleri (masaüstü Chromium ölçümüyle ilerliyor).

**Not (dürüstlük):** Bu ortamdaki tüm ölçümler SwiftShader yazılım
rasterizer'ında alınmıştır ve her kayıt `softwareRaster: true` taşır.
FPS/p95 alanları mandala YAZILMAZ; sadece draw call / üçgen / bayt /
doku-bellek tahminleri karşılaştırma için geçerlidir.

---

## H2 — Blender bake işleri (lightmap/AO UV repack + rebake, probe panoramaları)
**Durum:** BLOCKED — Blender yok; `build/blender/*.blend` LFS pointer'ı (134 B),
`git lfs` kurulu değil.
**Bloke ettiği:** Task 3.4a-c/e içerik tarafı.
**Bloke ETMEDİĞİ:** Task 3.4d (native-current'taki hazır 4K/2K KTX2 AO'ların
yeniden teslimi — ajan işi), 3.4f (probe'a çevre kütlesi — kod işi), 3.4g.
**İnsandan istenen:** Faz 3 başlarken ayrıntılı brief bu dosyaya eklenecek
(ölçülmüş doluluk raporlarıyla). Şimdilik aksiyon yok.

## H3 — Malzeme yazarlığı (fotoğraf kalibreli doku kütüphanesi)
**Durum:** BLOCKED — Blender + sanatçı kararı gerekli.
**Bloke ettiği:** Task 3.1.
**Not:** Faz 1'in `exterior-grade` dirilişi (Task 1.3) bu işin *runtime*
tarafını repodaki mevcut 1,2 MB gerçek dokuyla karşılıyor; 3.1 bunun
kaynak-tarafı devamıdır.

## H4 — Bevel + weighted normals + mesh temizliği
**Durum:** BLOCKED — Blender gerekli.
**Bloke ettiği:** Task 3.2 içerik tarafı. Ajan tarafı (GLB üzerinde
coplanar/duplicate/ters-normal taraması) Faz 3'te üretilecek.
**Task 1.4 A/B bulgusu (gate-1.4, desktop C03/C10):** teslimatın büyük kısmı
tek-yüzey yazarlıklı ve `doubleSided` kapatılınca kaybolyor —
(1) context-buildings "additions" B4 objelerinin AYNALI kopyaları: aynalama
winding'i ters çeviriyor, duvarlar toptan yok oluyor; (2) interior
astar/tavan tek düzlem: salon tavanı alttan bakınca kayboldu; (3) garden
istinat duvarları/havuz çevresi parçalanıyor. Bu yüzden Task 1.4 yalnız
`architecture.glb`'yi tek-yüzlüye çevirdi (10/11 malzeme); kalan parçalar
Blender'da kaynak onarımı yapılana dek çift yüzlü kalıyor
(`build/web/batched/single-sided-report.json` gerekçeleri taşıyor).
Onarım listesi: aynalı kopyalarda winding düzeltme, astar/tavanlara
kalınlık veya tutarlı normal, istinat duvarlarını kapalı hacme çevirme.

## H5 — Hosting kararı (Cloudflare / Netlify / R2)
**Durum:** BLOCKED — hesap + DNS erişimi gerekli; ürün sahibi kararı.
**Bağlam:** GitHub Pages `Cache-Control` override'ına izin vermiyor
(sabit `max-age=600`) — Bölüm 0.5 HATA 2, Task 4.3. Üç seçenek planda
fiyatlandırıldı; öneri: Cloudflare'i önüne koy (A).
**Bloke ettiği:** Task 4.3. **Bloke ETMEDİĞİ:** diğer tüm fazlar.

## H6 — `../model-finalization/web` kaynağının sağlanması
**Durum:** BLOCKED — kaynak dizin sahibinde; repoda yok.
**Sonuç:** `tools/batch-delivery/build.mjs` çalıştırılamaz. Faz 1'de GLB'ler
yerinde yamalanıyor (`tools/batch-delivery/patch-glb.mjs` tekniği, Bölüm 0.7.2);
`build.mjs` gelecek için ayrıca düzeltiliyor ama teslim yamalı GLB'lerdir.
**Bloke ettiği:** batched paketin sıfırdan yeniden üretimi (ör. atlas yeniden
dizilimi, Task 3.3'ün build tarafı).

## H7 — Gerçek telefonda gece modu ölçümü
**Durum:** BLOCKED — fiziksel cihaz gerekli (H1 ile aynı yol).
**Bloke ettiği:** Task 3.4g'nin kabulü. `qa-mobile.html` protokolüne gece
modu adımı Faz 3'te eklenecek (C04 kamera + gece modu).
