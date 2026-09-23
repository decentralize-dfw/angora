# angora-blender36-full.glb — Blender 3.6 çalışma dosyası

Tek dosya, **Draco yok**, **KTX2 yok**, **171 malzemenin hepsi içinde**.

## Üretmek (tek komut, ~40 sn)

Dosya depoya konmuyor: 258,8 MB, GitHub'ın 100 MB dosya sınırının üstünde ve
bu konteynerden LFS yüklemesi ağ politikasıyla kapalı. Gerek de yok —
**kaynağın tamamı (`build/web/native-current/`, 161 MB, 275 dosya) zaten
depoda izleniyor**, dosya kendi makinenizde üretiliyor:

```
git pull
cd tools/batch-delivery && npm install
node --max-old-space-size=8192 make-blender-glb.mjs
```

Çıktı: `build/blender/angora-blender36-full.glb` (gitignore'da).
Başka bir yere yazmak için yola argüman verin.

| | |
|---|---|
| Boyut | 258,8 MB |
| Malzeme | 171 (hepsi benzersiz ad) |
| Mesh / nesne | 240 |
| Doku | 108, hepsi PNG, gömülü |
| Vertex / üçgen | 7.721.607 / 4.948.742 |
| Sınır kutusu | X −139,3→173,2 · Y −15,9→30,5 · Z −328,6→167,5 m |
| glTF uzantıları | clearcoat, ior, specular, transmission, texture_transform |

## Neden bu dosya üretildi

Web teslimatı (`build/web/native-current/`) Blender'a doğrudan girmez, iki
sebepten:

1. **KHR_draco_mesh_compression** — 3.6 açabilir ama istenmedi.
2. **KHR_texture_basisu (KTX2)** — asıl engel bu: **Blender 3.6 KTX2
   okuyamaz.** Dokular sessizce boş gelir.

Teslimattaki her dokunun zaten bir PNG `source` yedeği var (basisu yalnızca
`extensionsUsed` içinde, `extensionsRequired` içinde DEĞİL). Dönüştürücü
basisu uzantısını kaydetmeyerek PNG'lerin kalmasını sağlıyor; 113 KTX2
görüntü düşüyor, 108 PNG kalıyor.

Batched teslimat (`build/web/batched/`) bu iş için **yanlış kaynak**: orada
malzemeler 37 atlasa birleştirilmiş durumda, orijinal 171 malzeme grafiği
yok.

## Blender 3.6'da açmak

`File > Import > glTF 2.0 (.glb/.gltf)`, varsayılan ayarlar yeterli:

- **+Y Up** açık kalsın — glTF Y-up, Blender Z-up; içe aktarıcı çevirir.
- Malzemeler Principled BSDF olarak gelir. `transmission`, `clearcoat`,
  `ior` ve `specular` uzantıları Principled girdilerine bağlanır.
- `KHR_texture_transform` taşıyan dokular Mapping + Texture Coordinate
  düğümleriyle gelir.
- Dokular dosyaya gömülü; Blender onları `.blend` içine paketler.

Sahne büyük (4,9 M üçgen). İçe aktarma birkaç dakika sürebilir; viewport'ta
Material Preview yerine önce Solid'de çalışmak rahat eder.

## Betik ne yapıyor

Kaynak `build/web/native-current/` içindeki 12 parça `.gpu.gltf`. Betik
Draco'yu çözer, basisu'yu düşürür, 12 parçayı tek sahnede birleştirir,
`dedup` ile parçalar arası aynı doku/accessor'ları teke indirir (171 doku +
174 accessor elendi), VRM eklentisinin malzeme `extras`'ına bıraktığı artığı
siler (222 malzemede), `unpartition` ile tek buffer'a toplar.

## Doğrulandı

Dosya bağımsız bir ayrıştırıcıyla geri okundu: 0 Draco primitifi, 0 basisu
dokusu, 108/108 görüntü `image/png`, tek sahne, 240 kök düğüm. Viewer'ın
kural tablolarının dayandığı adlar dosyada mevcut: `Clay tile`, `roof.004`,
`roof-7`, `Neighbor 20 green tiles`, `Entrance coursed limestone.001`,
`R31 | R39 continuous grass ground`, `R31 | R37 fine asphalt aggregate`,
`STONE-TILE`, `WHT`, `canopy.001`, `STRUCCO`, `water`, `glass`,
`Retaining wall rough limestone (1)`.
