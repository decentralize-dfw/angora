from pathlib import Path
import json
W=Path(r"C:\Users\yigit\angora-tur10")
notes="""
## Adım 08 — son kapanış denetimi

Ara push: bfaa3f9 (20. dakika). Son kontrol için 01,02,06,11,13,16,17,18,21,32,40,41,47 yeniden üretildi. Önce sütunu Adım07'dir; ara push ile karıştırılmamalıdır. Aşağıdaki durumlar önceki ara değerlendirmeyi günceller.

| İstek | Durum / kanıt |
|---|---|
| A — 4K ceviz/kiraz/meşe/wenge kütüphanesi | YAPILDI — Poly Haven CC0; wenge için black oak muadili, 4K albedo/normal/roughness, fiziksel UV; adim08/stok-kaynaklar.json. |
| A — Foto16 sürgülü ceviz + ayna | YAPILDI — iki L yüzün her birinde ceviz ve ayna sürgülü kanat, düşey damar; model ve son foto16. |
| A — Foto21 mat kiraz | YAPILDI — kapak ROI RGB 163,106,66; gri buzdolabı örneği iptal, roughness yaklaşık .52; olcum_21.jpg. |
| A — Foto01 ceviz çerçeve / yeşil-gri panel | YAPILDI — ayrı malzemeler: çerçeve RGB 109,67,46; mevcut mat panel RGB 96,101,92 ölçümüyle ayrı tutuldu; olcum_01.jpg. |
| A — Foto01 asansör kapısı | YAPILDI — dolap kutusu X<=-2.5; asansör X=-2.15 dışarıda, önceki ahşap eşlemesine döndü; yeşil bulaşması yok. |
| A — Foto41 ayna kapak / ahşap çerçeve | YAPILDI — kapaklara metalik 1 / roughness .025 ayna, ahşap sınırlar korunuyor. |
| B — Foto01 terrakota | YAPILDI — RGB 170,120,88 foto ölçümü; turuncu-kahve, 45° UV, yaklaşık 33cm karo; stok kesitindeki eski derz çıkarıldı. |
| B — Foto02 çapraz karo / krem bordür | YAPILDI — aynı 45° terrakota, ayrı krem malzemeli mevcut dikdörtgen/bordür geometri korundu. |
| B — Foto32 duvar/zemin seramiği | KALDI — krem karo ve bordür uygulandı; fotoğraftaki iki bordürün birebir deseni/kalınlığı ve duvar damar yönü tam eşleşmedi; 45 dakika sınırı. |
| C — Tek korkuluk tasarımı | YAPILDI — foto18/34 kaynaklı sık C/S prototip mesh, tüm merdiven/galeri yerleşimleri ortak veri kullanıyor. |
| C — Foto18 galeri korkuluğu | YAPILDI — yakın boşluk kenarı geri kondu; son foto18. |
| C — Foto02 ikinci kol altı | YAPILDI — basamak altı zemine kadar kapalı beyaz duvar. |
| C — Foto47 sağ duvar boşluğu | YAPILDI — kollar arasındaki .20m açıklık doğru taraftan kapatıldı; önce eklenen yanlış dış duvar kaldırıldı. |
| D — Foto11 tam açık kapı | YAPILDI — menteşe etrafında +55° dönüşle sol duvara paralel, banyo açık görünür. |
| D — Foto40 iki camlı kanat | YAPILDI — ayrı menteşe/kol/cam çerçeveli iki kanat; fotoğraftaki tam kamera/açıklık oranı halen birebir değil. |
| D — Foto13/17 siyah üç kollu spot | YAPILDI — aynı 48 segmentli düzgün armatür, eski düşük poligonlu abajur maskelendi; foto13 kadrajı açıldı. |
| D — Foto06 armatür / yanık ışık | KALDI — aplik ve 65W ışık eklendi, kamera duvar engelinden çıkarıldı; fotoğraftaki konum/başlık biçimi tam eşleşmiyor ve mevcut köşeli lamba görünümü sürüyor; süre sınırı. |
| Ölçüm kanıtı | YAPILDI — her renk ROI'si kırmızı kutuyla olcum_01/16/18/21/32.jpg üzerinde; malzeme adı ve RGB renk-olculeri.json içinde. |

### KALDI — konu kapanırken açıkça kayda geçirilen farklar

- Foto47 üst basamaklarda beyaz rıht/yüzey kalıntısı ve fotoğrafa göre basamak aydınlık farkı sürüyor; sağ duvar açıklığının kapanması bunları çözmedi.
- Foto32 bordür/desen ve foto06 armatür biçimi/yerleşimi birebir değil.
- Foto40 kamera/açıklık oranı; eski eşik ışık çizgileri ve bazı kartonpiyer birleşimleri tüm ev için kapanmış sayılmıyor.
- Foto16 ceviz tonu fotoğraftan daha açık; tüm ahşaplarda ışık altında birebir renk eşitliği iddia edilmiyor. Metre bazlı UV kullanıldı; fotoğraftan tahmin edilen karo ölçüsü saha ölçümü değildir.
- Önceki 40 fotoğraf denetimindeki bu adımın kapsamı dışındaki mobilya/perde/aksesuar farkları korunur; yeni bir adıma otomatik geçilmedi.

### Teknik doğrulama

- EKLER: 1734 sahne mesh nesnesi / 598699 örneklenmiş üçgen; GLB ortak mesh verisi 1662 mesh / 164395 üçgen, en büyük mesh 6032 üçgen. GLB yaklaşık 28.7 MB.
- Parke Adım07 kilidi korundu; bu adımda parke dokusu değiştirilmedi.
- Son renderlar temiz sabit dokularla yeniden alındı; önceki deneme sırasında dosya yenilenirken görülen PNG okuma uyarılı kareler son teslim olarak kullanılmadı.
- Ara committeki Python önbelleği/eski doku yedekleri son teslimden çıkarıldı.
"""
p=W/'notlar.md';s=p.read_text(encoding='utf-8');s=s.split('\n## Adım 08 — son kapanış denetimi')[0];p.write_text(s+notes,encoding='utf-8')
