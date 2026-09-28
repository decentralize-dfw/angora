from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
import json,datetime
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');A=W/'adim05'
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',24)
detail={'parke':(29,(0,900,760,1200)),'merdiven':(18,(120,590,475,920)),'kapi':(34,(1290,410,1450,970)),'kupeste':(34,(670,705,1040,850)),'mutfak_dolabi':(21,(825,355,895,515)),'karo':(42,(350,950,850,1170))}
for name,(n,box) in detail.items():
 photo=Image.open(R/'photogallery'/f'angora_{n:02}.jpg').convert('RGB').crop(box);render=Image.open(A/('detay_'+name+'.png')).convert('RGB')
 im=Image.new('RGB',(1600,680),'#eee9df');im.paste(ImageOps.contain(photo,(790,620)),(0,55));im.paste(ImageOps.contain(render,(790,620)),(805,55));d=ImageDraw.Draw(im);d.text((15,12),f'FOTO {n:02} | {name}',fill='black',font=font);d.text((815,12),'YAKIN RENDER | 1.5 m | 64 örnek',fill='black',font=font);im.save(A/('yakin_'+name+'.jpg'),quality=95)
rows=json.loads((A/'renk-sonra.json').read_text(encoding='utf-8'));before=json.loads((A/'renk-once.json').read_text(encoding='utf-8'))
s='''

## Adım 05 · ahşaplar + parke dokusu + düzeltmeler

### Üretim ve sınırlar

- 8 ayrı fotoğraf kesiti; homografi, duvar/tavan beyaz dengesi, geniş Gauss ile ışık alanı düzeltmesi, parlama inpaint. Kaynak uçlarındaki komşu tahta izleri kırpıldı. Fotoğraf ayrıntısı sınırlı: 4096 çıktı yeni optik ayrıntı üretmez.
- 4 × 4 m, 32 sıra, yaklaşık 12.5 cm en; .50/.75/1/1.25 m rastgele şaşırtmalı 162 tahta. Ölçüler kapı oranlarından yaklaşık, yerinde ölçüm değildir. Sekiz kaynak ve kaydırma/tohum parke-uretim.json içinde.
- Albedo/roughness/normal aynı yerleşimden. Roughness .413–.443, normal Non-Color ve güç .15. Aktif PNG kenar piksel farkı 0; JPG yalnız inceleme kopyasıdır.
- Mavi-beyaz şerit: eski albedoda fotoğraftan kalan parlama vardı (parke_eski_albedo_kanit.jpg). Normal zaten Non-Color idi. Stok normalin tahta ekleri albedoyla örtüşmüyordu. Yeni aynı-yerleşim haritaları bu kaynakları kaldırır.
- Üst kat wenge ve duvar/karo albedosu talimatla korundu. Giriş ceviz ve küpeşte ayrı kayıt; mutfak roughness .65, clearcoat 0.
- Mimari maske geniş yüzleri ve yan duvar normallerini koruyor. Kartonpiyerde ortak uç kapaklar silinip yakın köşe noktaları birleştirildi. 42 için üç duvar lambası, 29 orta apliksiz; 21 tavan spotları çıkarıldı. Foto40 kamera değişti, radyatör pervazdan uzaklaştırıldı.

### Renk ölçümü

Yöntem: işaretli ROI içindeki sRGB ortancası; her fotoğraf ve render için duvar/tavan referansından kanal beyaz dengesi; OpenCV Lab D65 ve Öklid ΔE76. Pozlama farkı ölçümde korunur. Bu bir spektral albedo ölçümü değildir. ROI, beyaz medyanı ve renkler renk-once/sonra.json dosyalarında. Üst wenge ve karo koruma talimatı nedeniyle bu iki malzemenin yüksek farkı albedo değiştirerek kapatılmadı.

| Foto | Malzeme | Foto RGB (WB) | Son render RGB (WB) | ΔE önce | ΔE sonra | Durum |
|---|---|---|---|---|---|---|
'''
for i,r in enumerate(rows):
 s+=f"| {r['foto']} | {r['malzeme']} | {tuple(round(v) for v in r['foto_rgb'])} | {tuple(round(v) for v in r['render_rgb'])} | {before[i]['deltaE76'] if r['malzeme']!='kupeste' else 'ROI yenilendi'} | {r['deltaE76']} | {r['durum']} |\n"
s+='''
### Yakın plan ve tekrar denetimi

Altı yakın kontrol 1.5 m kamera-hedef mesafesiyle, aynı sahnenin ilgili malzemesine ışın testiyle yerleştirildi. Kamera/hedef ve vurulan malzeme yakin-kameralar.json dosyasındadır. Her karşılaştırmanın solunda gerçek fotoğraf kırpımı bulunur.

KALDI: düşük çözünürlüklü kaynak kesitlerinin ayrıntı sınırı ve bazı tahtaların ton farkı. Yarım kaydırmada ortak dikey derz çizgisi ve 2×2 testinde atlas tekrarı seçilebiliyor; görünmez tekrar şartı henüz geçmedi. 2×2 ve yarım kaydırma testleri teslimdedir; piksel sürekliliği sağlansa da görsel tekrarın tamamen kaybolduğu iddia edilmiyor. Yakın planların tamamı kusursuz kabul edilmiş değildir; Adım05 süre sınırında incelemeye teslimdir.

### Fotoğraf bazında öz denetim
'''
issues={
4:('Ortak parke yeniden renderlandı.','KALDI: mevcut mobilya/armatürlerin fotoğraf eşleşmesi bu ahşap adımında tamamlanmadı.','KALDI: eski modül birleşimleri kapsamlı yeniden modellenmedi.','KALDI: eski mobilya oranları.'),
13:('Ortak parke yeniden renderlandı.','KALDI: perde/armatür eksikleri.','KALDI: pencere-kartonpiyer ince birleşimleri.','KALDI: fotoğrafla bütün mimari oranlar aynı değil.'),
15:('Korunan banyo yüzeyleri yeniden renderlandı.','KALDI: banyo aksesuarlarının ayrıntıları.','KALDI: banyo pozlama/ışık eşleşmesi.','KALDI: duş ve seramik geometri eşleşmesi.'),
17:('Üst wenge korundu; parke yenilendi.','DÜZELTİLDİ: ARSIV beyaz yatak dışa aktarım ve render dışında.','KALDI: kapı/eşik ince ışık çizgileri.','KALDI: mevcut armatür formu ve kartonpiyer köşe oranı.'),
18:('Parke/basamak/küpeşte ayrı ahşap kayıtlarına geçti; sayısal sonuç tabloda.','KALDI: zincir ve aplik tam fotoğraf konumunda değil.','KALDI: basamak burunlarında parlak ince çizgiler.','KALDI: basamakta tahta derzinin yüzey boyunca bölünmesi gerçek masif basamakla aynı değil.'),
19:('Ortak parke yeniden renderlandı.','KALDI: mevcut mobilya/perde ayrıntıları.','KALDI: eski yerleşimlerin ince farkları.','KALDI: tüm oda oranları birebir değil.'),
21:('DÜZELTİLDİ: dolap matlık .65, bej karo korunuyor; renk sonucu tabloda.','DÜZELTİLDİ: fotoğrafta olmayan tavan spotu çıkarıldı. KALDI: eski mutfak modelindeki eksik/farklı cihazlar.','KALDI: dolap köşe/damar sürekliliği.','KALDI: dolap ve davlumbaz fotoğraf oranları.'),
29:('Parke sıcak ceviz atlası, küpeşte kahve; renk sonucu tabloda.','DÜZELTİLDİ: orta duvar apliği kaldırıldı, iki üst spot kaldı; dolap gizli.','DÜZELTİLDİ: geçiş üstünde iki pah görünür.','KALDI: pahlı açıklık/kiriş ölçüsünün ince fotoğraf eşleşmesi.'),
34:('Üst wenge korundu, ahşaplar yeniden renderlandı.','KALDI: sarkıt zincir konumu ve alt armatür farkı.','DÜZELTİLDİ: geniş tavan/yan duvar yüzleri maske dışında, siyah delikler kapalı. KALDI: uzaktaki kapı altında ışık çizgisi.','KALDI: korkuluk/basamak ince oranları.'),
40:('Giriş orta ceviz; üst wengeye dokunulmadı.','DÜZELTİLDİ: radyatör pervazdan uzaklaştırıldı.','KALDI: kamera solda radyatör/sağda camlı kapı koşulunu sağlıyor fakat fotoğraf bakış noktası tam aynı değil.','KALDI: camlı kapı kanat açısı ve yakın kadraj oranları.'),
42:('Giriş ceviz ve korunan bej karo.','DÜZELTİLDİ: sarkan üçlü yerine duvarda üç yuvarlak lamba.','DÜZELTİLDİ: radyatör-kasa aralığı artırıldı. KALDI: eşik seviyesinin fotoğrafla ince farkı.','KALDI: duvar lambalarının merkez yüksekliği/arası tam ölçülmüş değil.'),
44:('Korunan garaj yüzeyleri yeniden renderlandı.','KALDI: eski garaj nesneleri.','KALDI: kapı/eşik ışık çizgileri.','KALDI: garaj modelinin eski oranları.'),
47:('Basamak ve küpeşte sıcak ahşap oldu.','KALDI: sağda eski beyaz merdiven kenarı/kalıntısı.','DÜZELTİLDİ: büyük yan duvar deliği kapandı; KALDI: yeni ve eski merdivenin birleşimi.','KALDI: bodrum maske sınırı basamak yanaklarını tamamen ayırmıyor.')}
for n,(tone,obj,place,geo) in issues.items():
 s+=f'\n#### Foto {n:02}\n\n- **Malzeme tonu:** {tone} KALDI: fotoğrafla birebir ton/ışık eşleşmesi; sayısal ölçülenler tabloda.\n- **Fazla/eksik nesne:** {obj}\n- **Kalıntı/yerleşim:** {place}\n- **Geometri/oran:** {geo}\n'
s+='\nYeni görülen ayrıntılar Adım06 listesine alındı; bu adımda yeni geometri düzeltme döngüsü açılmadı. 30 dakika sınırı nedeniyle KALDI maddeleri tamamlandı sayılmıyor.\n'
p=W/'notlar.md';p.write_text(p.read_text(encoding='utf-8')+s,encoding='utf-8')
print('6 yakin karsilastirma ve renk tablosu kaydedildi')
