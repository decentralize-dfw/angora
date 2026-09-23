# B3 DÜZELTMESİ — 6 saat → ~1,5 saat

**Koşan `bwq1jnlf1` çift koşumunu DURDUR.** 49+49 = 98 kare gereksiz.

Sebep: kapanış listesinin 24 maddesinin çoğu capture istemiyor.
Roughness GLB'den ölçülüyor, ALU emitted shader'dan sayılıyor, `applied`
sayıları tek sayfa yüklemesinden, GLSL flag-off diff tek yüklemeden,
testler 3 saniyede. Capture gerektiren maddeler için 98 kare değil,
**29 kare** yetiyor.

## Yeni B3 — 29 kare

### Çift koşum (bayraklar KAPALI + AÇIK) = 12 kamera-tier × 2 = 24 kare

| Tier | Kameralar | Neyi kanıtlıyor |
|---|---|---|
| `desktop-balanced` | C03, C04, C05, C06, C07, C08, C10, C11, C12 | Dış hero + **dört kesitin hepsi** + üç iç mekân. C11/C12 bu projede ilk kez gate'e giriyor. |
| `mobile-high` | C03, C07, C10 | **Mobil bozulmadı** — korunan asıl şey bu |

### Tek koşum (yalnız bayraklar AÇIK) = 5 kare

| Tier | Kamera | Neyi kanıtlıyor |
|---|---|---|
| `desktop-high` | C03, C10 | Bu tier **ilk kez** render ediliyor; FAZ 5 cinemaStill ilk kez görülüyor |
| `mobile-low` | C03 | En zayıf tier çiziyor mu |
| gece (hour=21) | C04, C10 | A1'in gerçek gece karesi |

**Toplam 29 kare ≈ 1,5 saat.**

## Vazgeçilen — ve neden sorun değil

C01 (region, 400 m kuş bakışı), C02 (geniş neighborhood), C09 (plan
modu) çift koşumda yok. Üçünde de FAZ 6 işlerinin hiçbiri görünmüyor:
`exteriorGtao` region'da zaten kapalı, prosedürel detay o mesafede
sub-piksel, plan modu ortografik. `mobile-low` tek kareyle sınırlı.

Bir şüphe doğarsa o kareyi tek tek eklemek 3 dakika.

## Kapanış listesi — hangi madde nereden ölçülür

**Capture GEREKMEYEN (18 madde) — capture'ı beklemeden şimdi yap:**
5 roughness (GLB, `roughness-cells.py`) · 6 doygunluk (kompozitten,
capture sonrası) · 7 `reviveBatchedGrade` applied · 8 `uDetail` hücre
sayısı · 9 `glassTiersV2` applied · 10 `poolWaterV2` applied ·
11 payload ölçümü · 12 ALU · 14 GLSL diff + program sayısı ·
19 testler · 20 i18n testi · 21 ölçüler/VR cevabı · 4 features.js tier
yazımı · 23 H paketleri · 24 H1 belgelemesi · 1–3 süreç maddeleri

**Capture gerektiren (6 madde):** 13 draw/üçgen/byte/VRAM ·
15 kompozitler · 16 gece karesi · 17 kesit kareleri · 18 desktop-high ·
6 doygunluk

## Sıra

1. Koşan çift koşumu durdur
2. **Capture gerekmeyen 18 maddeyi şimdi ölç ve `KAPANIS.md`'ye yaz** —
   capture'ı beklemeye gerek yok
3. 29 karelik B3'ü başlat
4. Bitince kalan 6 maddeyi doldur, kompozitleri üret
5. Kırmızı çıkarsa bisect: 4 kamera × 1 tier = 4 kare, ~12 dk

Kapanış dili değişmedi: **"kod tarafı bitti, mandal bekliyor."**
