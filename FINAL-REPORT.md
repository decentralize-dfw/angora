# ANGORA-QUALITY-UPGRADE — FİNAL RAPORU

Dal: `claude/magical-pascal-bxvzbc` (merge'e hazır; **main'e dokunulmadı**).
Hedef: **V-Ray görünümü, mobilde hafif.** Ölçüm ortamı: SwiftShader yazılım
rasterizer — FPS/p95 bu ortamda GEÇERSİZ, her kayıt `softwareRaster: true`
taşır; cihaz ölçümü H1'de. Geçerli kanıtlar: draw call, üçgen, bayt,
tahmini GPU MiB, piksel/diff, konsol.

Görsel karşılaştırma: `build/qa/final-ab/` — C03, C04, C07, C10 için
EN BAŞTAKİ hal (baseline-496c674) vs SON hal (final-current), masaüstü +
mobil. FAZ 1 ara karşılaştırması: `build/qa/faz1-ab/`.

## Faz faz ne yapıldı

**FAZ 0** — 12 deterministik kamera, `?stats=1` harness'i, qa-capture +
diff altyapısı, dürüst-null ratchet, `qa-mobile.html` cihaz protokolü
(6 adım; gece modu dahil). H1 cihaz ölçümü bekliyor.

**FAZ 1** (hepsi 16 karelik gate'le YEŞİL; `build/qa/faz1-exit.md`):
- 1.1 bayrak cerrahisi — piksel-birebir.
- 1.5 görünüm başına lens (20/26/28), altın saat 16:30, ufuk sisi.
- 1.3 exterior-grade dirilişi — kil çatı ~30 cm modül, sıva/travertin
  normal'leri; doku −9 MiB, byte'lar idle.
- 1.2 hibrit güneş gölgesi (desktop) — olay-bazlı cached map, texel-ölçekli
  normalBias. KARAR: gölge-proxy geri çekildi (r180 depth pass'i beauty
  kamerasının layer'ları ile cull eder; ledger "1.2 karar kaydı").
- 1.6 bahçe spot şeridi + atlas anisotropy düzeltmesi.
- 1.1b postfx (yalnız desktop): GTAO+SMAA+bloom+grade+dither; çift
  tone-map yapısal olarak dışlandı (testli).
- 1.4 doubleSided RAFTA (H8) — kesitte duvar kaybı; GLB'ler çift yüzlü.

**FAZ 3 (ajan yarısı)**:
- 3.4f: PMREM probe'a yerleşimin kendi kütlesi — cam mahalle siluetini
  yansıtır (tek seferlik yeniden kurulum).
- 3.5: havuz shader'ı (iki analitik dalga katmanı + Fresnel + probe
  yansıması + kenar→merkez absorpsiyon; faz gün ışığı saatine bağlı,
  gate'ler deterministik) + villa dış camında roughness ≤.12 (siluet
  yansır). Hero transmission NO-OP (teslimde işaretli yüzey yok);
  planar reflection ertelendi (probe karşılıyor; H1 sonrası).
- 3.4d: kaynağın hazır KTX2 AO bake'leri (2×4096² + 5×2048²) idle'da
  desktop malzemelerine bağlandı — GLB ameliyatsız, telefon indirmez.
- 3.3 (runtime): atlas hücreleri texture-array katmanlarına — maxLod
  kelepçesi ve uzak yüzey shimmer'ı bitti; 512/1024 hücre H6'da.
- 3.4g: gece varyant ölçümü — geceye geçişte **+0 program** (patlama yok).
- 3.1/3.2/3.4a-b-c: Blender gerektirir — H9.

**FAZ 4**:
- 4.2 bundle splitting: ilk JS **780 → 308,6 KB gzip** (postfx 50,6 KB /
  region-map+OSM 427,5 KB / tur / foto ayrı tembel chunk'lar).
- 4.4 debug yüzeyi: ?quality/?features/?camera/?stats + overlay'e p95 ve
  GPU MiB.
- 4.1 KTX2 teslimi: **ERTELENDİ (bayrak kapalı)** — doku GPU'su 3.4d +
  atlas küçültme + tembel probe'larla zaten −117 MiB; webp→UASTC tel
  maliyeti ters (normal 67 KB→264 KB); atlas dörtlüsü 3.3'ün canvas
  yolunu beslediği için webp kalmalı. H1 mobil GPU'yu yetersiz bulursa
  yeniden değerlendirilecek (toktx kurulum reçetesi bu repoda değil,
  H10 notunda ortam bilgisi var).
- 4.3 hosting: H5 (ürün sahibi kararı).

**FAZ 2**:
- 2.1 progressive loader: interior kritik yoldan çıktı (idle prefetch,
  kat/walk anında bekletir); kat probe'ları tembel + komşu prefetch;
  sahne JSON'ları gzip (1,17 MB→291 KB, düşüşlü fallback); HDR half-float.
  2.1-a kat bölmesi (f0..f3) Draco re-encode ister — H6.
- 2.2 (runtime): komşu bloklara 48 m culling hücreleri; instancing+LOD H6.
- 2.3 (runtime): bitki başına ±6° hue / ±%12 value (bağlı-bileşen seed'i);
  rotation/scale jitter H6.
- 2.4: kot-tanıklı sadeleştirici hazır ve KANITLI (311k→85,8k, worst
  1,9 cm ≤ 5 cm, 590 tanık) ama apply GERİ ALINDI: görünürlük bake'i
  Blender rebake ister; hash'i kanıtsız güncellemek reddedildi — H10.

**FAZ 5**: idle birikim (cinema still) — desktop-high, 400 ms sükunet,
24 Halton-jitter'lı örnek + örnek başına ±0,2° güneş salınımı; her giriş
anında iptal. Telefonda/walk'ta asla; gate'lerde inert (profil balanced).

## Sayılar: başlangıç vs son (C03; kaynaklar gate-visual-ref → gate-f342)

| Metrik | Desktop | Mobil profil* |
|---|---|---|
| İlk-interaktif bayt | 29 756 902 → **23 855 578 (−%19,8)** | 22 322 201 → **19 892 858 (−%10,9)** |
| İlk JS (gzip) | 780 KB → **308,6 KB** | aynı bundle |
| Görünür üçgen (C03) | 2 695 936 → **2 053 171 (−%23,8)** | 2 144 733 → **1 607 672 (−%25,0)** |
| Draw call (C03) | 25 → 54 (chunk culling + postfx takası; üçgen düşüşü karşılığı) | 25 → 51 |
| Tahmini GPU doku | 277,7 → **151,3 MiB (−%45,5)** | 133,7 → **111,3 MiB** |
| Tahmini GPU geometri | 226,1 → 206,4 MiB | 183,6 → 160,8 MiB |
| Konsol hatası / context loss | 0 / 0 | 0 / 0 |
| Kat turu sonrası bellek | textures 114→114, geometries 93→93 (birebir) | — |
| Gece modu program farkı | **+0** | — |
| FPS / p95 | **H1'de ölçülecek** (SwiftShader geçersiz) | H1'de ölçülecek |

*Capture'ın "mobile" kolonu desktop-balanced tier'dır (SwiftShader UA
mobil değil); gerçek telefon tier'larında postfx/composer yok,
mobileSunShadow=false (birim testli).

Kat görünümlerinde (C05–C09) postfx açıkken sahne GTAO ön-geçişiyle iki
kez çizilir (planın bütçelediği maliyet); buna RAĞMEN üçgenler
referansın %15–23 altında.

## Gate zinciri (hepsi repoda, kareler + JSON'larla)

baseline-496c674 → gate-1.1 → gate-1.5 → gate-1.3 → gate-1.2 → gate-1.6 →
gate-1.1b → **gate-f342** (combined; final-probes.json: @2x yeniden koşum
491 sn, gece +0 program, bellek birebir) → final-current (final-ab kaynağı).

## BLOCKED kalanlar (BLOCKED.md ayrıntılı)

H1 iPhone 13 ölçümü (mandal boş — performans İLAN EDİLMEDİ) ·
H2/H3/H4/H9 Blender kalemleri (3.1, 3.2, 3.4a-c, lightmap/AO rebake) ·
H5 hosting (4.3, Pages Cache-Control) · H6 kaynak dizin (build.mjs;
3.3 build yarısı, 2.1-a, 2.2 instancing/LOD, 2.3 LOD/billboard) ·
H7 gece modu cihaz ölçümü · H8 1.4 ön koşulları · H10 2.4 apply
(sadeleştirici kanıtıyla hazır, görünürlük rebake'i bekliyor).

## Merge notu

Dal push'lu ve yeşil; **main'e merge İZİN BEKLİYOR** (talimat gereği
dokunulmadı). Merge sonrası ilk iş: H1 protokolü
(`qa-mobile.html`) — mandal dolmadan hiçbir performans iddiası kabul
edilmiş sayılmaz.
