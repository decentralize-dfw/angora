# FAZ 6 KAPANIŞ LİSTESİ — DAİMİ EMİR Bölüm D (24 madde)

Durum sözlüğü: ✅ sayıyla kapandı · 🟡 kısmen (sayı yazılı) · H# BLOKE +
teslimat paketi. Boş hücre = henüz ölçülmedi. Kaynak koşumlar:
`baseline-full` (bayraklar KAPALI) ↔ `faz6-final` (hepsi AÇIK), aynı kod.

## Süreç

| # | Madde | Durum | Sayı / kanıt |
|---|---|---|---|
| 1 | Kapanış 12 kamera × 4 tier (+ gece kareleri) | | |
| 2 | baseline-full + faz6-final aynı koddan, tek fark bayraklar | | |
| 3 | Lens değişikliği yok / varsa ayrı kompozit | | qa-cameras.js FROZEN, bu turda lens değişmedi |
| 4 | features.js tier kapsamı yazılı, ölçülmemiş "ACTIVE" yok | | |

## Ölçüm — sayıyla

| # | Madde | Durum | Sayı / kanıt |
|---|---|---|---|
| 5 | Düz roughness 164/177 → ≤60/177 (G kanalı, hi-lo ≤6) | | araç: tools/qa/roughness-cells.py |
| 6 | Doygunluk C03 72,4→58,8 / C04 60,7→52,4 — geri kazanım | | araç: tools/qa/saturation.py |
| 7 | reviveBatchedGrade applied ≥ 8 | | console.info logda |
| 8 | uDetail ≥20 dış, ≥6 iç hücre ≠0 | | test: procedural-detail kabul 6.2 |
| 9 | glassTiersV2 applied > 0; gül+buzlu cam değişmemiş (C10 diff) | | |
| 10 | poolWaterV2 applied loglu (beklenen 1, garden-glass-4) | | console.info logda (A2) |
| 11 | İlk interaktif: kapanan kapandı, kalan sayıyla H6'da | | network.firstInteractiveBytes; A7 commit e4abdbb |
| 12 | ALU mobil ≤80 / masaüstü ≤160, emitted bloktan sayılmış | | 69 / 116 (procedural-detail.js sayım bloğu) |
| 13 | Draw call / üçgen / byte / VRAM deltası | | diff-captures numericMismatches |
| 14 | Flag-off GLSL diff boş, program sayısı değişmemiş | | build/qa/glsl-off-diff-faz6b.txt + kapanışta tekrar |

## Görsel

| # | Madde | Durum | Sayı / kanıt |
|---|---|---|---|
| 15 | C03/C04/C07/C10 kompozitleri (sabit kamera, önce/sonra) | | compose-ab.py, baseline-full ↔ faz6-final |
| 16 | Gerçek gece karesi (C04-night, C10-night) kompozitte | | qa-capture gece varyantı (A1) |
| 17 | Kesit kareleri yeşil (kayıp yüzey ≤%1) | | CUT_FRAMES kuralı diff aracında |
| 18 | desktop-high İLK KEZ render + cinemaStill görsel doğrulama | | faz6-final/desktop-high/ |

## Regresyon

| # | Madde | Durum | Sayı / kanıt |
|---|---|---|---|
| 19 | Testler yeşil (sayıyla) | | |
| 20 | i18n testi var | ✅ | viewer/tests/i18n.test.mjs (94488be) |
| 21 | "Ölçüler" ve "VR" cevabı | ✅ | İKİSİ DE VAR: annotations.js boyut katmanı + WebXR walk; testler annotations.test.mjs, walk-xr.test.mjs (94c3e10) |
| 22 | Asansör, sesli tur, foto pinleri, paylaşım linki testli | | mevcut suite + kapanışta sayım |

## Engeller

| # | Madde | Durum | Sayı / kanıt |
|---|---|---|---|
| 23 | H2/H6/H8/H10 teslimat paketleri | ✅ | BLOCKED.md güncellendi; H8 tespiti ÇALIŞTIRILDI: 5/8 addition aynalı; H2 script'i tools/blender/rebake-interior-lightmaps.py |
| 24 | H1 açık — mobil bayraklar kapalı, belgeli | | features.js + PROGRESS.md |

---
Kapanış cümlesi şablonu (EK Bölüm 5): **"kod tarafı bitti, mandal bekliyor."**
ratchet.json baseline null + acceptedByOwner:false sürdükçe "TAMAMLANDI" yazılmaz.
