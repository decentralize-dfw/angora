# FAZ 1 BÜTÇE DEFTERİ (Bölüm 0.6.1)

Ölçüm aracı: `viewer/scripts/qa-capture.mjs` — SwiftShader (yazılım
rasterizer). **FPS/frame-time sütunları bu ortamda ölçülemez** ve boş (null)
bırakılır; gerçek cihaz ölçümü H1 (BLOCKED.md). Geçerli kanıtlar: draw call,
üçgen, istek/bayt, tahmini GPU doku/geometri MiB, piksel diff.

Baseline etiketi: `build/qa/baseline-496c674/` (FAZ 0 kodu, 12 kamera × 2 profil).

| Adım | Kalem | Yön | Kanıt (ölçülen) | Durum |
|---|---|---|---|---|
| 1.1 | Bayrak cerrahisi | nötr | 12×2 piksel diff baseline'a karşı: _bekliyor_ | — |
| 1.4a | doubleSided → seçici | KAZANÇ | fragment işi (SwiftShader'da FPS ölçülmez; kanıt: patch raporu + görsel diff + gerçek cihaz H1) | — |
| 1.4b | plants chunk + walk culling | KAZANÇ | draw call Δ kamera dönüşünde; walk görünür üçgen | — |
| 1.6a | garden spot strip | KAZANÇ | shader kaynak assertion; program sayısı | — |
| 1.6b | atlas anisotropy → 1 | KAZANÇ | doku filtre state; görsel diff = 0 beklenir | — |
| 1.3 | exterior-grade | ~nötr | +transfer ≤ 1,3 MB idle; atlas bypass shader kanıtı | — |
| 1.5 | FOV + altın saat + fog | ~nötr | kompozisyon ekran görüntüleri | — |
| 1.2 | hibrit güneş gölgesi | MALİYET | +1 depth pass ≤80 k üçgen; slider'da 0 shadow render | — |
| 1.1b | postfx (desktop) | MALİYET | +4 pass yalnız desktop; luminance testi | — |

**Mandal:** iPhone 13 ölçümü gelmeden hiçbir satır mandala yazılmaz;
`build/qa/ratchet.json` baseline `null` durumda (H1).
