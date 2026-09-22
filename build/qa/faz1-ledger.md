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
| 1.2 | hibrit güneş gölgesi | MALİYET | +1 depth pass, olay-bazlı (aşağıya bak); slider'da 0 shadow render | — |
| 1.1b | postfx (desktop) | MALİYET | +4 pass yalnız desktop; luminance testi | — |

**Mandal:** iPhone 13 ölçümü gelmeden hiçbir satır mandala yazılmaz;
`build/qa/ratchet.json` baseline `null` durumda (H1).

## 1.2 karar kaydı: gölge-proxy'si geri çekildi (onaylı)

three r180 `WebGLShadowMap.renderObject` depth pass'i **beauty kamerasının**
layer'larıyla cull ediyor (`object.layers.test(camera.layers)`;
`shadowCamera.layers` hiç okunmuyor). Ana kameranın hiç çizmediği bir
layer'daki caster depth map'e de giremez: plandaki layer-3 proxy (103 k
üçgen) tasarım gereği ulaşılamazdı. `material.visible=false` yolu da kapalı
(shadow pass da aynı bayrağı test ediyor, WebGLShadowMap.js:380).

Karar: sahnenin kendi mesh'leri cast ediyor. Ölçüm (C03 desktop): shadow
güncelleme karesinde +25 draw / +2 691 978 üçgen — proxy planındaki 103 k
yerine ~2,7 M; `autoUpdate=false` sayesinde bu TEK karelik bir sıçrama
(slider bırakma / görünüm değişimi), sabit durumda kare başına ek maliyet 0
(26 call, baseline paritesi). normalBias artık kamera açıklığının texel
boyutundan türetiliyor (2 texel); sabit 0.036 genişproxy modunda yaygın
akne karartması üretiyordu (A/B kanıtı: scratchpad probe12j).

`tools/batch-delivery/build-shadow-proxy.mjs` ve manifest'teki
`shadow_proxy` girdisi PARK edildi (silinmedi): H1 mobil gölgeyi açarsa
depth pass'teki tam-sahne üçgen sayısı telefona fazla gelebilir; o gün
proxy'yi "beauty'ye görünür ama colorWrite=false" yoluyla geri getirme
seçeneği değerlendirilir. Viewer artık shadow-proxy.glb'yi indirmiyor
(desktop ilk-interaktif −315 708 bayt; mobil zaten indirmiyordu).
