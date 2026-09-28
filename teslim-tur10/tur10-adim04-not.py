from pathlib import Path
import json
W=Path(r'C:\Users\yigit\angora-tur10')
log=(W/'adim04-kontrol.log').read_text(encoding='utf-16') if (W/'adim04-kontrol.log').read_bytes().startswith(b'\xff\xfe') else (W/'adim04-kontrol.log').read_text(encoding='utf-8',errors='replace')
assert '[kontrol] TAMAM 13' in log,'Kontrol tamamlanmadı'
s='''

## Adım 04 · albedo + armatürler

Başlangıç 28.09.2026 19:25 (bilgisayar saati). Tek modelleme/kontrol turu; yeni kusur bulunduktan sonra ek modelleme yapılmadan kontrol noktası pushlanır. Adım 03 görselleri kontrol-once içinde korunmuştur.

- Kapı/kasa: foto 34 düz panel kesitinden neredeyse siyah wenge. Parke foto 34, basamak foto 18; koyu ceviz tonuna nötr kalibrasyon. Kaynak dört köşe, yaklaşık metre ölçeği ve ton kalibrasyonu dokular.json/adim04 alanlarında. Tonlar fotoğrafla görsel eşlemedir, fiziksel renk ölçümü değildir.
- Duvar, tavan ve zemin karosu albedo dosyaları değiştirilmedi; SHA256 karşılaştırması adim04-korunan-yuzeyler.json içinde.
- Parametrik armatürler: 18 plafonyer ve iki aplik; 40 plafonyer; 42 üçlü spot; 29 iki opal spot ve orta armatür; 18/34 için aynı fiziksel boşlukta 78 halkalı tek zincirli sarkıt. Mevcut isiklar.json armatür renkleri değiştirilmedi; yeni opal yüzeylerde sıcak emisyon kullanıldı.
- Foto 40 kamerası korkuluğun ön tarafa girmediği konuma alındı. Radyatör aynı sol duvar yüzeyinde 30 cm kaydırıldı; 42 açısından da yeniden görüntülendi.
- Foto 29 eski yan dönüşler de maskelenerek kapı üstü iki pahlı geçiş uzatıldı; soldaki kiriş eklendi. Ray ölçümünde WOODY-DARK.001 olarak bulunan dolap mimari GLB içinde olsa da mobilya olduğu için gizlendi.
- Bodrumdaki eski beyaz merdiven maskesi BUILDING katmanına düzeltildi. Kasa iç kaplamaları/eşik kapakları ve 453 kartonpiyer ucunda gönye birleşimi uygulandı.

### Adım 05 ilk işleri — KALDI

- **KALDI / yeni:** Bodrum eski basamak beyazı kalktı, fakat silme kutusu merdivenin sağındaki duvarın bir bölümünü de kaldırdı (47); 34'te tavan/merdiven birleşiminde siyah üçgen açıklık da görünüyor. Önce yan duvar/tavanı geri getirip maskeyi yüz/konum düzeyinde daralt; etkilenen tüm katları kontrol et.
- **KALDI / yeni:** Parke ve bazı ahşap yüzeylerde tekrarlayan açık/parlak izler var (özellikle 29,18,34). Kaynak kesit, dikiş ve normal/roughness birlikte incelenecek; koyu ton korunacak.
- **KALDI / yeni:** Foto 40 plafonyeri üst kenarda kesiliyor; kamera/armatürün fotoğraftaki oranı yeniden ayarlanacak. Öndeki korkuluk artık kadrajda yok.
- **KALDI / yeni:** Foto 42 üçlü spotun tamamı kadraja girmiyor; radyatör kaydırıldığında kapı pervazına fazla yaklaştı. 40 ve 42 birlikte düzeltilmeli.
- **KALDI:** Armatürlerin fotoğraftaki ince formu, zincir konumu ve emisyon şiddeti tam eşleşmedi; 29 opal yüzeyler fazla parlak.
- **KALDI:** Foto 29 iki pahın görünüşü, açıklık/koridor derinliği ve kiriş oranı birebir değil; yeni duvar parçaları kontrol noktasıdır.
- **KALDI:** Kapı/eşik çevresindeki kalan açık renk çizgiler ve bazı kartonpiyer/tavan birleşimleri; bini/gönye uygulanması hepsinin çözüldüğü anlamına gelmez.
- Önceki M4 perde, diğer oda radyatörleri ve mobilya/aksesuar farkları devam eder; bu adımda yeni mobilya yapılmadı.

### Yerleşim — kendi fotoğrafıyla kontrol

| Yer/nesne | Foto | Durum |
|---|---|---|
| Birinci kat iki aplik + plafonyer | 18 | Eklendi; form/konum ince eşleşmesi KALDI |
| Antre plafonyeri | 40 | Eklendi; üst kadraj kesilmesi KALDI |
| Giriş üçlü spot | 42 | Eklendi; fotoğraf oranı/konumu KALDI |
| Çatı spotları | 29 | Eklendi; parlaklık/form KALDI |
| Merdiven zincirli sarkıt | 18,34 | Aynı fiziksel nesne iki açı; konum ince eşleşmesi KALDI |
| Antre radyatörü | 40,42 | 30 cm kaydırıldı; iki açıdan tekrar kontrol |
| Çatı kapı başı/kiriş | 29 | İki pah/kiriş var; oran eşleşmesi KALDI |
| Diğer eski modül yerleşimleri | Adım 03 tablosu | Fotoğrafsız yerler doğrulanmış sayılmaz |

### Fotoğraf bazında öz denetim
'''
specific={
4:('Mevcut avizeler ve mobilya bu adımda yeniden yapılmadı.','Ortak koyu parke yeniden görüntülendi.','Mevcut mobilya oranları kapsam dışı.'),
13:('Perde ve doğru üçlü armatür hâlâ yok; M4/M5 kalan işleri.','Yatak/arşiv dışarıda tutuldu.','Eski pencere ve kartonpiyer ayrıntıları.'),
15:('Mevcut banyo aksesuarları aynı.','Pozlama 9 kontrol görünürlüğü; fiziksel ışık tamamlandı sayılmaz.','Duş/seramik eşleşmesi henüz yok.'),
17:('Beyaz yatak dışarıda; mevcut sarkıt bu oda için yanlış.','Kasa/eşik kapakları eklendi; kalan çizgiler Adım05.','Kartonpiyer uçları düzenlendi; tüm köşeler kusursuz değil.'),
18:('İki aplik, plafonyer ve zincirli sarkıt eklendi.','Zincir fotoğrafa göre yatay konumunda fark var.','Aplik kol/cam formu ve alt konum ince eşleşmesi.'),
19:('Mevcut mobilya ve perde aynı.','Ortak koyu parke yeniden kontrol edildi.','Mevcut mobilya oranları kapsam dışı.'),
21:('Armatür/mutfak mobilyası bu adımda değişmedi.','Duvar ve karo albedosu korundu.','Kartonpiyer köşe düzenlemesi; mevcut dolap oranları aynı.'),
29:('Dolap gizlendi; üç armatür ve sol kiriş eklendi.','Parkedeki tekrarlayan parlak izler yeni kusur.','Pahlı geçiş ve kiriş oranları tam eşleşmedi.'),
34:('18 ile aynı zincirli sarkıt eklendi.','Koyu wenge kapılar ve kasa kapamaları; kalan açık çizgiler.','Zincir yerleşimi ve tavan birleşimi ince kontrol.'),
40:('Plafonyer eklendi, radyatör sol duvarda kaydırıldı.','Öndeki korkuluk kameradan çıktı; plafonyer üstten kesiliyor.','Camlı kapı ve armatürün fotoğraf oranı tam aynı değil.'),
42:('Üçlü spot ve mevcut radyatör bu açıdan kontrol edildi.','Radyatörün 40 ile ortak yerleşimi yeniden görüldü.','Spotların konum/ölçek ince eşleşmesi.'),
44:('Mevcut garaj eşyaları aynı.','Kapı bini/eşik kapağı eklendi; kalan ışık çizgileri Adım05.','Garaj mobilyası yeniden modellenmedi.'),
47:('Beyaz eski basamak kalıntısı kaldırıldı.','Yeni yan duvar açıklığı oluştu; Adım05 öncelik 1.','Eski basamak maskesi daraltılmalı; koyu basamak tonu korunsun.')}
for n,(obj,place,geo) in specific.items():
 s+=f'\n#### Foto {n:02}\n\n- **Malzeme tonu:** DÜZELTİLDİ: Ortak kapı/parke/basamak koyulaştırması; duvar/karo korundu. KALDI: Fotoğrafla son ton/yansıma eşleşmesi.\n- **Fazla/eksik nesne:** {obj} KALDI: Yukarıda belirtilen eksik/ince ayrıntılar.\n- **Kalıntı/yerleşim:** {place} KALDI: Kaydedilen farklar Adım05.\n- **Geometri/oran:** KALDI: {geo}\n'
p=W/'notlar.md';p.write_text(p.read_text(encoding='utf-8')+s,encoding='utf-8')
print('[adim04-notlar] 13 fotoğraf; yeni kusurlar Adım05 listesine kaydedildi')
