# PROGRESS — ANGORA-QUALITY-UPGRADE yürütme durumu

> Yeni bir oturum bu dosyayı okuyup HİÇBİR ŞEY SORMADAN devam edebilmeli.
> Daimi emir: bütün fazlar bitene kadar durma; sıra ve kurallar en altta.
> Dal: `claude/magical-pascal-bxvzbc`. Ana plan: `ANGORA-QUALITY-UPGRADE.md`
> (önce Bölüm 0.5 + 0.7 oku). İnsan işleri: `BLOCKED.md`. Bütçe defteri:
> `build/qa/faz1-ledger.md`.

## Şu an neredeyiz (GÜNCEL: FAZ 7 kod bitti, TEK doğrulama oturumu koşuyor)

Emir zinciri: FAZ-6-DUZ-RENK + IS-EMRI + FAZ-6-EK + DENETIM + DAİMİ EMİR
(A1-A9 + B yöntemi) + B3-DÜZELTME + ŞİMDİ-YAP + FAZ-7-MASAUSTU. Ara gate
YOK; kod bitti, 13 bayrak açık, doğrulama tek oturumda (koşuyor).

**FAZ 6 (kod tarafı bitti, mandal bekliyor):** İŞ A-F + süreç onarımı +
A1-A9 kuyruğu tamam. Sayılmış: uDetail 26 dış / 10 iç (coverage-count),
glass polish 3 hücre (gül cam maskede 0), roughness DOKU metriği 164/177
değişmez (byte-0 mimari; efektif 41/177 runtime - kapanışta H11), ALU
69/116 (tavan 80/160). KAPANIS.md iskeleti build/qa/'da.

**FAZ 7 (masaüstü V-Ray, 7 iş kodlandı, 302/302):**
- İŞ 1 SSR (ssr-pass.js): AO depth+normal yeniden kullanılır; yalnız
  yukarı bakan yüzeyler; havuz dikdörtgeni dünya-uzayında hariç;
  roughness G-buffer yok -> fresnel+fade sabit yansıtıcılık (yazılı sınır).
- İŞ 2 PCSS (pcss.js): global chunk TEK SEFER, bayrak+masaüstü çözünce;
  blocker search 17 + Poisson PCF 25; kapalıyken chunk byte-özdeş (test).
  shadowMapSize iki masaüstü satırında 4096.
- İŞ 3 windowPortalLight (window-portals.js): glazing mesh'lerinden açıklık
  kümeleme (1.2 m hücre + birleşme + 2.5 m dedupe), RectAreaLight içeri
  bakar, güneş/gök takipli, YALNIZ floor/interior görünümlerinde görünür.
- İŞ 4 proceduralDetailHigh: 4 oktav (13.9x/51.7x) + boost albedo 1.5x /
  roughness 2x (uniform katı, tablo pristine).
- İŞ 5 gtaoFullRes: iki masaüstü satırında scale 1.0.
- İŞ 6 materialResponseV2 (material-response-v2.js - DİKKAT: material-
  response.js R27 modülü AYRI ve DOKUNULMAZ; bir kez yanlışlıkla ezildi,
  d5b183b ile geri geldi): Standard->Physical, hücre-kapılı clearcoat/
  sheen, aileler üye adından; masaüstü SADECE.
- İŞ 7 cinemaDof: idle-refine apertür yürüyüşü, odak düzlemi piksel-sabit
  (testte 1e-6); cinemaStill artık balanced'da da; __angoraCinemaRefine(24)
  QA kancası + qa-capture @cinema modu.
- Mobil satırlar: 2 tier x 5 görünüm deepEqual ile FAZ 6'ya eşit (test).

**KOŞAN (görev b1d0gadty):** faz7-baseline (desktop-high x C03-C12 arası
9 kare, 13+1 bayrak :0) + faz7-final (dh 9 + db C03,C10 + mh C03,C07,C10
+ dh@night C04,C10 + dh@cinema C03,C10 = 18 kare). Bitince: diff (kesit
>%1 kırmızı; konsol hatası 0; context loss 0), kompozitler (sinema ayrı),
KAPANIS.md 24 + FAZ-7 Bölüm 4'ün 14 maddesi SAYIYLA, roughness/saturation/
coverage/payload ölçümleri, PROGRESS güncelle. Kapanış dili:
"masaüstü kod tarafı bitti; mobil FAZ 8'e kaldı." Merge İZİN BEKLER.

**ÜRÜN SAHİBİ KARARI (2026-09-23, doğrulama oturumu yerine):** FAZ 7'nin
7 bayrağı varsayılan KAPALI ship edildi; kod dalda hazır, herhangi biri
`?features=screenSpaceReflection:1,...` ile tarayıcıda açılır. FAZ 6
bayrakları AÇIK. Dal main'e push'landı (açık izinle). Capture/koşum YOK -
değerlendirme ürün sahibinin gerçek tarayıcısında. Doğrulama oturumunun
ölçülmüş durumu: faz7-baseline (dh, 13+1 bayrak kapalı) 9/9 YEŞİL, 0
konsol hatası, C03 274 sn; bayrak-açık kareler SwiftShader'da 480 sn
tavanını aşıyordu (konsol 0) - duvar saati meselesi, tavan 1500 sn'ye
alındı ama koşum ürün sahibi emriyle durduruldu. KAPANIS.md maddeleri
sayılmış hâlleriyle duruyor; kapanış dili geçerli: FAZ 6 "kod tarafı
bitti, mandal bekliyor", FAZ 7 "masaüstü kod tarafı bitti (bayraklar
kapalı, gerçek tarayıcı değerlendirmesi bekliyor); mobil FAZ 8'e kaldı."

**Bilinen sinyal:** bayrak-açık desktop-balanced C01 probe yüklemesi bir
kez 480 sn'de rapor verememişti (contact-AO bake + portal + context idle
zinciri şüphesi). faz7-final'in ilk karesi bunu ya doğrular ya aklar -
check-in 45 dk'da bakacak; kırmızıysa bisect 4 kamera x 1 tier.

## Önceki durum (final paket, tarihçe)

- Combined gate **gate-f342 YEŞİL** (commit 700c210; kanıtlar
  final-probes.json dahil). FAZ 5 cinemaStill AKTİF (85cca7f).
- FINAL-REPORT.md yazıldı. `final-current` 24 karelik SON-hal capture'ı
  koşuyor; bitince: `build/qa/final-ab/` kompozitleri (İLK =
  baseline-496c674, SON = final-current; C03/C04/C07/C10 × 2 profil) +
  final build commit + push. Sonra İŞ BİTTİ — merge İZİN BEKLER.
- 4.1 ktx2Delivery KAPALI bırakıldı (karar 700c210 mesajında).

## Eski durum notları (tarihçe)

- **FAZ 1 bitti** (hepsi YEŞİL gate'li commit'lerde; faz1-exit.md yazıldı).
  `faz1-final` 12-kamera capture'ı HÂLÂ koşuyor (yavaş: postfx'li
  SwiftShader; ÖLDÜRME) — bitince: (1) faz1-ab + final-ab kompozitleri
  (ÖNCE=gate-visual-ref, SONRA=faz1-final), (2) `npm run build:pages`,
  (3) COMBINED gate "gate-f3f4f2" (aşağıdaki bekleyen işler tek gate,
  kırmızıda ?features= ile bayrak-bisect), (4) nightProbe SwiftShader
  ölçümü, (5) 2.1-e bellek dönüş probe'u, (6) 4.1 için sayfa-içi en-büyük-10
  doku raporu → karar.
- **Kod tarafı BİTMİŞ, gate BEKLEYEN işler** (hepsi commit'li, bayrak açık):
  3.4f probeMassing · 3.5 poolWaterV2+glassTiersV2 · 3.4d bakedAoRevival ·
  3.3 atlasArrayV2 (runtime; 512/1024 hücre H6'da) · 3.4g nightProbe+
  qa-mobile gece adımı · 4.2 bundle split (ilk JS 780→308,6 KB gzip;
  postfx/region-map/tour/foto dinamik; scratch dist-trial ile doğrulandı) ·
  4.4 overlay p95+GPU MiB · 2.1 progressive (interior defer + lazy probes
  + gzip JSON + HDR half).
- **Sonraki kod işi:** 2.2 runtime yarısı (context-buildings'e plants tarzı
  chunk culling; instancing/LOD H6'ya kayıt) → 2.3 runtime yarısı
  (bitki hue/scale jitter shader'ı) → 2.4 (toktx İNDİRİLDİ:
  scratchpad/ktxsw/usr/bin/toktx, LD_LIBRARY_PATH=scratchpad/ktxsw/usr/lib;
  gltf-transform simplify + ≤5cm kot testi — teslim GLB'sini değiştirir,
  capture bitmeden YAZMA) → FAZ 5 idle birikim (opsiyonel).
- **4.1 ara bulgular:** tel boyutu ters (normal webp 67KB→UASTC 264KB);
  atlas dörtlüsü webp KALMALI (3.3 canvas'la okuyor, compressed okunamaz);
  AO desktop'ta 3.4d ile zaten KTX2; karar sayfa-içi doku raporuna kaldı.
  Mobil ilk-interaktif kırmızı çizgisi 4.2+2.1 ile fazlasıyla korunuyor.

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
