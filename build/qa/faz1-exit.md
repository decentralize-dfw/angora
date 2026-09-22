# FAZ 1 ÇIKIŞ RAPORU — tek sayfa

Dal: `claude/magical-pascal-bxvzbc` · Ölçüm: SwiftShader (FPS geçersiz,
"H1'de ölçülecek") · Referans zinciri: `gate-visual-ref` (ÖNCE, üçlü öncesi)
→ gate-1.5 → gate-1.3 → gate-1.2 → gate-1.6 → gate-1.1b (SON).
Kompozitler: `build/qa/faz1-ab/` (C03, C04, C07 ÖNCE/SONRA).

## Hangi task neyi değiştirdi

| Task | Değişiklik | Gate sonucu |
|---|---|---|
| 1.1 | Bayrak cerrahisi (quality-profile) | YEŞİL — piksel-birebir |
| 1.4 | doubleSided | RAFTA (H8) — GLB'ler geri alındı, `plantsChunking` açık kaldı |
| 1.5 | Görünüm başına FOV (20/26/28), altın saat 16:30 varsayılanı, ufuk FogExp2 | YEŞİL |
| 1.3 | exterior-grade dirilişi: kil çatı ~30 cm modül, sıva/travertin normal'leri (4 malzeme) | YEŞİL — call/üçgen birebir, doku −9 MiB, byte'lar idle |
| 1.2 | Hibrit güneş gölgesi (desktop): olay-bazlı cached map, texel-ölçekli normalBias | YEŞİL — sabit durumda call birebir. KARAR: gölge-proxy geri çekildi (r180 depth pass'i beauty kamera layer'ıyla cull ediyor; ledger "1.2 karar kaydı") |
| 1.6 | Bahçe spot şeridi + atlas anisotropy düzeltmesi | YEŞİL — call/üçgen birebir, bahçedeki fixture sızıntısı kalktı |
| 1.1b | postfxV2: GTAO+SMAA+bloom+grade+dither, YALNIZ desktop tier'ları | YEŞİL — kayıp yok; maliyet aşağıda |

## Sayılar (C03, ÖNCE = gate-visual-ref → SON = gate-1.1b)

| Metrik | Desktop | Mobil profil* |
|---|---|---|
| Draw call | 25 → 30 (+4 postfx quad; gtao C03 görünümünde kapalı) | 25 → 30 |
| Görünür üçgen | 2 695 936 → 2 535 120 (−%6) | 2 144 733 → 2 085 463 |
| İlk-interaktif byte | 29 756 902 → 29 769 993 (+13 091) | 22 322 201 → 22 335 292 (+13 091) |
| Tahmini doku MiB | 277,7 → 268,7 (−9) | 133,7 → 132,7 |
| Tahmini geometri MiB | 226,1 → 226,1 | 183,6 → 183,6 |

*Capture'ın "mobile" kolonu desktop-balanced tier'dır (SwiftShader UA mobil
pointer değil). Gerçek telefon tier'larında composer/postfx yok,
mobileSunShadow=false (birim testli); H1 cihaz ölçümü bekliyor.

Kat görünümlerinde (C05–C09) postfx açıkken desktop call 44→98, üçgen
2,98 M→5,96 M: SectionGTAOPass'in derinlik/normal ön-geçişi — Bölüm 0.6.1'in
"1.1b 💰 MALİYET (desktop only)" kalemi. Gölge güncelleme karesi (yalnız
slider bırakma/görünüm değişimi): +25 call / +2,69 M üçgen, sabit durumda 0.

+13 091 B = bundle büyümesi (gölge+postfx kodu, tek bundle). Mobil
kırmızı çizgisine borç olarak kayıtlı; 4.2 bundle splitting postfx'i
dynamic import'a alınca mobil bundle'dan çıkacak.

## Çift tone-map kontrolü (plan 1.1 kabulü)

C03 merkez luminance 0,10113 → 0,10583 (+%4,6 lineer) — grade'in bilinçli
lift/gain'i; çift AgX kırpıp KARARTIRDI. Yapısal garanti:
`tests/postfx-v2.test.mjs` (grade gövdesinde tam 1 agxToneMap + 1
linearToSRGB; dither'da tone map yok). Testler 245/245.

## BLOCKED durumu

H1 iPhone 13 ölçümü (mandal boş, FPS sütunları null) · H2–H4 Blender
kalemleri · H5 hosting (4.3) · H6 kaynak dizin (build.mjs) ·
H7 gece modu cihaz ölçümü · H8 1.4 ön koşulları ·
H9 FAZ 3'ün Blender yarısı (3.1/3.2/3.4a-b-c). Ayrıntı: `BLOCKED.md`.

## Görsel çıkış kapısı (plan Bölüm "FAZ 1 ÇIKIŞ KAPISI")

- Duvarlar emissive maket gibi değil: GTAO + gölge + sıva normal'i ✓ (C05/C07)
- Villa zemine temas ediyor; saçak/balkon/baca gölgeleri okunuyor ✓ (gate-1.2/1.1b kareleri)
- Çatı düz turuncu plastik değil (kil modül ✓), sıva düz gri değil ✓, çim tek renk platform değil ✓
- İlk villa karesi izometrik değil (FOV 28, altın saat) ✓
- ⛔ Performans mandalı: H1 cihaz ölçümü olmadan İLAN EDİLEMEZ — mandal null.
