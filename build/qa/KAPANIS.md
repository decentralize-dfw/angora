# FAZ 6 KAPANIŞ LİSTESİ — DAİMİ EMİR Bölüm D (24 madde)

Durum sözlüğü: ✅ sayıyla kapandı · 🟡 kısmen (sayı yazılı) · H# BLOKE +
teslimat paketi. Kaynak koşumlar (B3 DÜZELTMESİ, 29 kare):
`baseline-b3` (bayraklar KAPALI, ?features ile) ↔ `faz6-b3` (hepsi AÇIK),
aynı kod, aynı build — bu projedeki ilk gerçekten temiz A/B.

## Süreç

| # | Madde | Durum | Sayı / kanıt |
|---|---|---|---|
| 1 | Kapanış kamera×tier planı (B3 düzeltmesi: 29 kare, gece dahil) | | plan: db×9 + mh×3 çift; dh×2 + ml×1 + gece×2 tek |
| 2 | baseline-b3 + faz6-b3 aynı koddan, tek fark bayraklar | | aynı build, fark yalnız ?features — summary.json'da |
| 3 | Lens değişikliği yok / varsa ayrı kompozit | ✅ | qa-cameras.js FROZEN, bu turda lens değişmedi |
| 4 | features.js tier kapsamı yazılı, ölçülmemiş "ACTIVE" yok | ✅ | E.4 + bayrak açılışı (commit'ler 3a4bf9f, sonrası); "ACTIVE" kelimesi yok, her satırda tier |

## Ölçüm — sayıyla

| # | Madde | Durum | Sayı / kanıt |
|---|---|---|---|
| 5 | Düz roughness 164/177 → ≤60/177 (G kanalı, hi-lo ≤6) | 🟡 | DOKU metriği: **164/177 değişmedi** — İŞ B mimarisi byte-0 çalışma-zamanı gürültüsü (brief BÖLÜM 2: "Transfer byte +0, yeni doku yok"); doku hedefi bu mimariyle yapısal çelişkide → **H11**. Efektif (shader) roughness kapsaması SAYILDI: uDetail 26 dış + 10 iç + İŞ A skaler 2 (metal, wood_dark.002) + cam polish 3 = **41/177 hücre çalışma zamanında roughness varyasyonu taşıyor** (tools/qa/coverage-count.mjs) |
| 6 | Doygunluk C03 72,4→58,8 / C04 60,7→52,4 — geri kazanım | | araç: tools/qa/saturation.py; faz6-b3 sonrası |
| 7 | reviveBatchedGrade applied ≥ 8 | ✅ | 8 (exterior-grade-coverage testi; console.info kanıtı probe + faz6-b3 consoleInfo'da) |
| 8 | uDetail ≥20 dış, ≥6 iç hücre ≠0 | ✅ | **26 dış / 10 iç** — GLB'lerin kendi üye adlarına karşı sayıldı (coverage-count.mjs); çıplak `chrome` spec dışıydı, regexten çıkarıldı |
| 9 | glassTiersV2 applied > 0; gül+buzlu cam değişmemiş (C10 diff) | 🟡 | **3 hücre** (glass, R31\|R35 clear door glass, Context glazing); gül cam hücresi [1] MASKEDE 0 (test + sayım); C10 pixel diff faz6-b3'te |
| 10 | poolWaterV2 applied loglu (beklenen 1, garden-glass-4) | | probe koşumunda (A2 sayacı) |
| 11 | İlk interaktif: kapanan kapandı, kalan sayıyla H6'da | 🟡 | Kapanan: 13,64 MB (desktop) manzara boşta yüklemeye alındı (e4abdbb). Kalan: architecture.glb 5,86/4,59 MB tek parça → H6 paketi. Ölçüm probe'da (firstInteractiveBytes on/off) |
| 12 | ALU mobil ≤80 / masaüstü ≤160, emitted bloktan sayılmış | ✅ | **69 / 116** skaler op (procedural-detail.js sayım bloğu; EK Bölüm 1 tavanları) |
| 13 | Draw call / üçgen / byte / VRAM deltası | | diff-captures numericMismatches, baseline-b3 ↔ faz6-b3 |
| 14 | Flag-off GLSL diff boş, program sayısı değişmemiş | 🟡 | Birim testler: pdetail sıfır-iz, glass-cells hedefsiz dokunmaz, contact-ao yalnız attr'li; İŞ B tarihsel kanıt build/qa/glsl-off-diff-faz6b.txt; program sayısı on/off probe'da |

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
