from pathlib import Path
import json
W=Path(r'C:\Users\yigit\angora-tur10');A=W/'adim06';rows=json.loads((A/'renk-sonra.json').read_text(encoding='utf-8'))
s='''

## Adım 06 · parke yakın kalite + küpeşte + kalanlar

### Doku, renk ve ölçü kanıtları

- DÜZELTİLDİ: Renkler Foto29'dan 30, Foto34'ten 14 ayrı tahtanın ortalamasıyla örneklendi. 44 işaretli örnek `adim06/renk_ornekleri_29.jpg`, `renk_ornekleri_34.jpg` ve `parke-uretim.json` içinde. Duvar/tavan beyaz dengesi ve geniş ölçekli aydınlık düzeltmesi uygulandı; soğuk yansıma kalıntıları sınırlandı. Önceki kabul edilen uzak görünümün ortanca rengi korundu.
- DÜZELTİLDİ: Damar kaynağı [Poly Haven Walnut Veneer 02](https://polyhaven.com/a/walnut_veneer_02), 4K, CC0. Resmi indirme MD5 `9294085775080be7c3467837bc2f60d2` doğrulandı. Stoktan renk alınmadı: her tahta farklı stok kesitinin parlaklık sıralaması ve fotoğraf paletinden bir renk ile histogram/kuantil eşlemesi aldı.
- DÜZELTİLDİ: 4096px atlas, 48 sıra, 409 tahta; bağımsız sıra kaydırması ve sağdan sola devam eden tahta. Aynı x'te derz en fazla 2/48 sıra; bütün yüksekliği kat eden ortak dikey atlas çizgisi yok. Yatay sınır normal sıra derzine denk gelir. Albedo, roughness (.36–.49) ve Non-Color normal (.22 güç) aynı yerleşimden.
- Ölçüm: Foto29 iki tahta dörtgeni kamera/döşeme izdüşümünde 5.87/5.81 cm en ve 35.55/26.64 cm boy verdi. Foto34 dörtgeni 9.39cm en, 75.98cm boy verdi. Çatı yaklaşık 6cm, diğer parke 9cm; boy dağılımı sırasıyla .20–.50m ve .32–.80m. `tahta-olculeri.json` piksel köşelerini içerir. Kamera kalibrasyonu/model ölçeğine dayalı yaklaşık değerlerdir; saha ölçümü değildir.
- DÜZELTİLDİ: Basamak ve rıht parke derzli atlasından ayrıldı; sürekli ceviz damarı ve mevcut yuvarlak burun kullanıldı. KALDI: yakın kontrolde stok damar kontrastı fazla ve UV sarımında ek görülüyor; Adım07.
- DÜZELTİLDİ: Küpeşte sıcak kahve, fotoğraf referanslı kanal düzeltmesi; ΔE76 2.04 < 5.
- Eş ölçek: Foto29 zemin pikselleri kat düzlemine, oradan 1.5m yakın kameraya homografiyle taşındı; iki panel aynı ortak piksel alanından kırpıldı. `es-olcek-homografi.json` ve `yakin-olcek.json` dönüşümü belgeler. Mutlak ölçek gerçek lens bilinmediği için yaklaşık; iki panelin görüntü alanı ortaktır.

### Sayısal renk kontrolü

İşaretli alanların beyaz dengeli sRGB ortancası → OpenCV Lab D65, ΔE76. Pozlama farkı korunur. Kamera değişen Foto40 eski ROI ile karşılaştırılmadı.

| Foto | Yüzey | Foto RGB | Render RGB | ΔE76 | Durum |
|---|---|---|---|---|---|
'''
for r in rows:
 status='DÜZELTİLDİ' if r['deltaE76']<(5 if r['malzeme']=='kupeste' else 8) else 'KALDI: ışık/ton ince eşleşmesi'
 s+=f"| {r['foto']} | {r['malzeme']} | {tuple(round(x,1) for x in r['foto_rgb'])} | {tuple(round(x,1) for x in r['render_rgb'])} | {r['deltaE76']} | {status} |\n"
s+='''
### Kontrol sonuçları ve Adım07

DÜZELTİLDİ: Atlasın eski ortak dikey çizgisi kaldırıldı, kaydırma ve 2×2 testleri üretildi. KALDI: yakın renderda atlas sınırı olmayan ayrı bir çapraz koyu çizgi var. Işın incelemesi `parke-cizgi-ray.json`; kaynağı kesinleşmeden mevcut modelde yeni düzeltme yapılmadı. Bu nedenle tüm yakın kalite koşulları kusursuz geçti denmiyor.

DÜZELTİLDİ: Foto47'de ray testiyle `Simple White Wall` eski merdiven yan yüzleri Y=1.901063 ve 2.159 olarak saptandı; yalnız bu düzlemler maskelendi. Beyaz testere dişi kalıntı çıktı. Tavan/duvar referansları geniş kutuyla silinmedi.

KALDI: Eşik altlarına bindirmeli döşeme eklendi, fakat tüm ışık çizgileri kapanmadı; bazı kapı önlerinde yeni taşan eşik şeridi görüldü (özellikle34). Yeni kusur kuralıyla Adım07'ye alındı. Kartonpiyer köşeleri kaynakla birleştirildi; tüm köşelerin fotoğraf oranı ve yüzey sürekliliği henüz tam değil. Foto40 radyatör solda, kapı sağda ve kanat fotoğraftaki görünen menteşe tarafında; tam perspektif/açıklık ve tavan plafonyeri kadrajı KALDI.

### Fotoğraf bazında öz denetim
'''
checks={
4:('DÜZELTİLDİ: yeni dar tahta/renk dağılımı; KALDI: fotoğraf ışık eşleşmesi.','KALDI: önceki mobilya/armatür ayrıntıları.','KALDI: eski modül birleşimleri.','KALDI: önceki mobilya oranları.'),
13:('DÜZELTİLDİ: yeni damar; KALDI: ışık/ton.','KALDI: perde/armatür eksikleri.','KALDI: pencere-kartonpiyer ayrıntıları.','KALDI: oda oranı.'),
15:('DÜZELTİLDİ: önceki yüzeyler korundu.','KALDI: banyo aksesuar ayrıntıları.','KALDI: banyo pozlama/ışık.','KALDI: duş/seramik eşleşmesi.'),
17:('DÜZELTİLDİ: yeni parke, wenge korundu.','DÜZELTİLDİ: ARSIV yatak hâlâ dışarıda.','KALDI: eşik/bini ince farkları.','KALDI: önceki armatür ve köşe oranı.'),
18:('DÜZELTİLDİ: basamak/küpeşte tonu; KALDI: basamak damar kontrastı.','KALDI: önceki zincir/aplik yerleşimi.','KALDI: basamak UV sarımı ekleri.','DÜZELTİLDİ: tek parça ahşap; KALDI: fotoğraftaki burun profili ince farkı.'),
19:('DÜZELTİLDİ: yeni parke damarı.','KALDI: önceki mobilya/perde.','KALDI: eski yerleşim ayrıntıları.','KALDI: oda oranları.'),
21:('DÜZELTİLDİ: önceki dolap/karo korundu.','KALDI: eski mutfak cihaz farkları.','KALDI: dolap taç doku yönü.','KALDI: dolap/davlumbaz oranı.'),
29:('DÜZELTİLDİ: 6cm dar/kısa tahta, güçlü damar; KALDI: ışık/ton farkı.','DÜZELTİLDİ: önceki dolap/aplik gizlemesi korundu.','KALDI: yakın renderdaki çapraz koyu çizgi.','DÜZELTİLDİ: tahta ölçeği fotoğraf izdüşümüne bağlı; KALDI: mutlak lens/ölçü belirsizliği.'),
34:('DÜZELTİLDİ: 9cm tahta, küpeşte ΔE2.04.','KALDI: önceki sarkıt/aplik ayrıntıları.','KALDI: uzak odadaki parlak çizgi ve yeni eşik taşması.','KALDI: korkuluk ince oranları; tavan delikleri kapalı kalıyor.'),
40:('DÜZELTİLDİ: giriş cevizi korundu.','DÜZELTİLDİ: radyatör sol, camlı kapı sağ.','DÜZELTİLDİ: kanat menteşe tarafı; KALDI: tam açı/kadraj.','KALDI: plafonyer üstten kesiliyor, fotoğraf perspektifi tam değil.'),
42:('DÜZELTİLDİ: sıcak küpeşte.','DÜZELTİLDİ: üç yuvarlak lamba korunuyor.','KALDI: eşik seviye ve taşma farkları.','KALDI: önceki lamba konum hassasiyeti.'),
44:('DÜZELTİLDİ: önceki yüzeyler korundu.','KALDI: eski garaj nesneleri.','KALDI: kapı ışık/bini ayrıntıları.','KALDI: eski geometri oranları.'),
47:('DÜZELTİLDİ: tek parça basamak/küpeşte; KALDI: damar kontrastı.','DÜZELTİLDİ: eski beyaz testere dişi yüzler çıktı.','KALDI: yeni ve eski merdivenin ince birleşimleri.','DÜZELTİLDİ: büyük duvar/tavan yüzleri korundu.')}
for n,values in checks.items():
 s+=f'\n#### Foto {n:02}\n\n'
 for title,value in zip(['Malzeme tonu','Fazla/eksik nesne','Kalıntı/yerleşim','Geometri/oran'],values):s+=f'- **{title}:** {value}\n'
s+='\nBaşlangıç 2026-09-28 20:35 +02. Yeni kusurlar için ek geometri döngüsü açılmadan, 30 dakika sınırı içinde mevcut teslim pushlanır. KALDI maddeleri tamamlandı sayılmaz.\n'
p=W/'notlar.md';p.write_text(p.read_text(encoding='utf-8')+s,encoding='utf-8')
print('[adim06] notlar: 13 fotoğraf, 5 renk ölçümü, yeni kusurlar Adım07')
