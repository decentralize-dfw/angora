# PROGRESS — ANGORA-QUALITY-UPGRADE yürütme durumu

> Yeni bir oturum bu dosyayı okuyup HİÇBİR ŞEY SORMADAN devam edebilmeli.
> Daimi emir: bütün fazlar bitene kadar durma; sıra ve kurallar en altta.
> Dal: `claude/magical-pascal-bxvzbc`. Ana plan: `ANGORA-QUALITY-UPGRADE.md`
> (önce Bölüm 0.5 + 0.7 oku). İnsan işleri: `BLOCKED.md`. Bütçe defteri:
> `build/qa/faz1-ledger.md`.

## Şu an neredeyiz

- **FAZ:** 1 (kapanışa yakın)
- **Aktif task:** 1.6 — bayraklar açık, commit'li (1c67205); 16 karelik
  gate-1.6 capture'ı koşuyor/az önce bitti. Sıradaki adım: gate-1.6 diff
  (referans `build/qa/gate-1.2`) → verdict → kareleri commit → 1.1b.
- **Sonraki:** 1.1b postfxV2 (YALNIZ desktop-balanced/high) → FAZ 1 çıkış
  raporu + `build/qa/faz1-ab/` C03/C04/C07 ÖNCE/SONRA kompozitleri
  (`tools/qa/compose-ab.py`; ÖNCE = `build/qa/gate-visual-ref`).

## Bayrak durumu (viewer/src/features.js)

Açık: `hybridSunShadow`, `exteriorGradeRevival`, `cameraRigsV2`,
`plantsChunking`, `gardenSpotStrip`, `atlasAnisotropyFix`,
`singleSided` (valf inert — GLB'ler çift yüzlü geri alınmış durumda).
Kapalı: `mobileSunShadow` (H1'e kadar KAPALI, pazarlık yok), `postfxV2`
(1.1b açacak), `pixelBudgetV2`, `viewCulling`, gerisi.

## Biten işler (kanıt = commit + build/qa/gate-*)

- FAZ 0: 0.1–0.4 bitti. 0.5'in sayfası (`qa-mobile.html`) yazıldı,
  uçtan uca masaüstü provası hâlâ borç; H1 cihaz ölçümü BLOCKED.
- 1.1 bayrak cerrahisi — gate piksel-birebir YEŞİL.
- 1.5 cameraRigsV2 (FOV/altın saat/fog) — YEŞİL (gate-1.5).
- 1.3 exteriorGradeRevival — YEŞİL (gate-1.3; call/üçgen birebir, doku −9 MiB).
- 1.4 doubleSided — RAFA (BLOCKED H8); GLB'ler geri alınmış halde doğru.
- 1.2 hybridSunShadow — YEŞİL (gate-1.2, commit 1cd76b7). Önemli karar:
  gölge-proxy'si GERİ ÇEKİLDİ — three r180 `WebGLShadowMap.renderObject`
  caster'ları BEAUTY kamerasının layers'ıyla cull ediyor; layer-3 proxy
  map'e hiç giremez. Sahnenin kendi mesh'leri cast ediyor (olay-bazlı,
  cached map; güncelleme karesinde +25 draw/+2,69 M üçgen, sabit durumda 0).
  normalBias artık texel-ölçekli (2 texel). `build-shadow-proxy.mjs` +
  manifest.shadow_proxy PARK (H1 mobil gölge isterse dönülür). Ayrıntı:
  faz1-ledger.md "1.2 karar kaydı".
- 1.6 kod+testler+bayrak açma commit'li; gate koşuyor (yukarıya bak).

## Gate yöntemi (değiştirme)

`cd viewer && node scripts/qa-capture.mjs --tag gate-<task> --gate`
(önce `npm test` 240/240 ve `npm run build:pages`). Diff:
`python3 tools/qa/diff-captures.py build/qa/<önceki-yeşil> build/qa/gate-<task> --visual`.
KIRMIZI = yalnız: kesit C05–C08'de duvar/yüzey KAYBI (göz + piksel),
konsol hatası >0, draw call > referans+%20, görünür üçgen artışı, ürün
özelliği bozulması. Piksel değişimi kırmızı DEĞİL. SwiftShader FPS geçersiz
("H1'de ölçülecek" yaz). "mobile" capture profili gerçekte desktop-balanced
tier'dır (SwiftShader UA mobil değil) — mobil tier korumaları birim
testlerde. Hata avı bütçesi: 3 deneme, sonra BLOCKED.md + bayrak kapat + geç.

## Sıra (daimi emir, 2025-09-22)

FAZ 1 kalan: 1.6 gate → 1.1b → çıkış raporu + faz1-ab.
FAZ 3 ajan yarısı: 3.4f (probe'a context LOD2 kütlesi) → 3.5 (cam+havuz
shader; planar reflection yalnız desktop-high) → 3.4d (hazır KTX2 AO'ları
batched GLB'lere bağla — teslim işi) → 3.3 (atlas → texture2DArray) →
3.4g (gece modu ölçümü). 3.1/3.2/3.4a-b-c BLOCKED (Blender yok).
FAZ 4: 4.1 KTX2 (3.3'ten SONRA) → 4.2 bundle splitting → 4.4 debug yüzeyi.
4.3 BLOCKED (Pages Cache-Control).
FAZ 2: 2.1 → 2.2 → 2.3 → 2.4 (kot farkları ≤5 cm sapma testi).
FAZ 5 (opsiyonel, her şey yeşilse): idle birikim, yalnız desktop-high.

## Final teslim (tek paket)

1. `build/qa/final-ab/` — C03, C04, C07, C10 İLK hal vs SON hal yan yana
   (masaüstü + mobil; İLK = `build/qa/baseline-496c674` / gate-visual-ref).
2. `FINAL-REPORT.md` — faz faz özet, gate sonuçları, draw call/üçgen/byte/
   GPU bellek tablosu (başlangıç vs son), BLOCKED kalemleri.
3. Dal merge'e hazır; MAIN'E DOKUNMA, izinsiz merge yok.
4. Bu dosyanın son hali.

## Mobil kırmızı çizgiler (her task'ta kontrol)

mobileSunShadow=false kalır; mobile-low/high'ta postfx/GTAO/bloom/grade/
dither/planar reflection ASLA; mobil ilk-interaktif byte artmaz
(1.3 dokuları idle yükleniyor; proxy artık kimseye inmiyor).
