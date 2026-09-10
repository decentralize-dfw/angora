# EDETRI → Angora: gerçek kaynak karşılaştırması

9 Eylül 2026. Kullanıcı GitHub erişimini açtıktan sonra doğru kaynak okundu:
`decentralize-dfw/virtuallyeverafter/edetri/web/index.html`.
İncelenen main: `c9cade13dbdef14fd6e40c33e5a75195f1bdf771`.
Referans deposunda değişiklik yapılmadı; özel kaynak dosyaları bu depoya kopyalanmadı.

İndeksin bağladığı `js/app.js`, `post.js`, `studio.js`, `hdr.js`, `rigs.js`,
`pieces.js`, `glass.js`, `refine.js`, `pt.js` içindeki ilgili yollar incelendi.
Yorumlarda kalan eski ayar ile gerçekten etkin üretim ayarı ayrıldı.

| Konu | Referansın etkin yolu | Angora R28 |
|---|---|---|
| Ara render | Half-float lineer HDR | Aynı veri türü / renk sırası |
| Kenar yumuşatma | Lineer-sRGB SMAA, composer MSAA yok | SMAA çıkıştan önce; MSAA 0 |
| AO | Kod var, varsayılan kapalı | Varsayılan kapalı; kesit uyumlu AO uygulaması korunuyor |
| Bloom | Lineer; güç 0,1; eşik 0,06; soft-knee 0,036; yarım/çeyrek boyutlu blur | Ayrı lineer geçiş; aynı eşik/güç/knee ve boyut ilkesi; tek final çıktı |
| Ton eşleme | ACES, temel exposure 0,75 | Three'nin ACES işlevi; 0,75; yalnızca OutputPass'te ekran dönüşümü |
| Çıktı | Tek sRGB dönüşümü | Tek OutputPass sRGB dönüşümü |
| Grain / vignette | Varsayılan kapalı | Eklenmedi |
| Son dither | Referansa özgü tek yönlü 8-bit dither | Henüz yok; bantlaşma GPU kabulünde açık kontrol |
| HDR parlak uçları | Luminans 8 üstünde renk oranını koruyarak sınırla, sonra PMREM | R27'deki aynı ilke korunuyor; açık hava HDR'si stüdyo HDR'siyle değiştirilmedi |
| Fiziksel cam | Tam boyutlu transmission buffer; yazılmış fiziksel malzemeyi koru | Tam boyut; camın opak gölge üretmemesi korunuyor; fotoğraf ayrıntısı açık |
| Gölge filtresi | PCFSoft | PCFSoft |
| Çözünürlük | DPR en fazla 2; harekette farklı kalite yolu yok | Sabit buffer; mobil DPR en fazla 3 / 3,2 MP, masaüstü en fazla 2 / 5 MP; gerçek telefon ölçümü açık |
| Durunca örnek biriktirme | `refine` deneysel, varsayılan kapalı | Eklenmedi; durma/hareket arasında render yolu değişmez |
| Path tracing | `pt` deneysel; varsayılan üretim yolu değil | Eklenmedi; fiziksel XR doğrudan render yolu ayrıca doğrulanacak |
| Işık yerleşimi | Fotoğraf stüdyosu HDR'si / stüdyo ışık setleri | Villanın saat/mevsim güneşi ve kaynak iç armatürleri korunuyor |
| Malzemeler | Yazılmış PBR ile yalnızca renk haritası olan modelleri ayırır | Kaynak GLB/PBR korunuyor; R27 aile ayarları var; her malzemenin fotoğraf kabulü hâlâ açık |
| Three sürümü | İlgili kaynakta r185 davranışına atıf var; paket sürümü bağımsız doğrulanmadı | Sabit bağımlılık 0.180.0; sürüm tahminiyle yükseltilmedi |

Bu tablo **motor temeline uyarlama** kanıtıdır, piksel eşliği veya “en az aynı
görsel kalite” kabulü değildir. Aynı yöntem farklı sahne, malzeme, ışık ve kamera
ile aynı görüntüyü üretmez. Özellikle R27'nin roughness/normal sınırlamalarını
referans stüdyonun sayılarıyla topluca değiştirmek, fotoğrafa uygunluk kanıtı
olmaz. Karşılaştırmalı gerçek GPU kareleri, hareket videosu ve cihaz ölçümleri
olmadan bu kalemler kapatılmaz.

Kaynaklar: [indeks](https://github.com/decentralize-dfw/virtuallyeverafter/blob/c9cade13dbdef14fd6e40c33e5a75195f1bdf771/edetri/web/index.html),
[render zinciri](https://github.com/decentralize-dfw/virtuallyeverafter/blob/c9cade13dbdef14fd6e40c33e5a75195f1bdf771/edetri/web/js/post.js),
[deneysel iyileştirme durumu](https://github.com/decentralize-dfw/virtuallyeverafter/blob/c9cade13dbdef14fd6e40c33e5a75195f1bdf771/edetri/web/js/refine.js).
