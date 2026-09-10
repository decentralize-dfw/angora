# R28 — ilk uygulama paketi ve doğrulama sonucu

9 Eylül 2026. **Hazırlandı; son görsel kabul ve canlı yayın tamamlanmadı.**
Ana plan: `implementation-plan-r28-tr.md` (58 ID, 17 ayrı fotoğraf grubu).
Referans karşılaştırması: `edetri-render-comparison-r28.md`.

## Bu pakette gerçekten değişenler

- Doğru EDETRI referansına erişildi; etkin üretim yolu ile kapalı deneysel
  iyileştirmeler ayrıldı. Referans deposunda değişiklik yapılmadı.
- R28 render profili: half-float lineer sahne → SMAA → soft-knee lineer bloom
  → tek ACES 0,75 / sRGB çıkış. Bloom güç 0,1, eşik 0,06, knee 0,036.
  Referanstaki gibi AO/MSAA ve durunca ayrı render yoluna geçiş kapalı.
- Cam transmission buffer tam çözünürlükte; PCFSoft gölge filtresi.
  Kaynak güneş ve iç armatür konumları korunuyor. GPU görünümü kabul edilmedi.
- Kamera geçişinin kesirli saatlerde bitmemesine yol açan yuvarlama hatası
  düzeltildi; deadline, anında geçiş ve azaltılmış hareket sınanıyor.
- Oda, ölçü ve çevre etiketleri gerçek görünür UI sınırlarını hesaba katıyor;
  etiketler alt kenarda üst üste yığılmıyor veya başka odaya sürüklenmiyor.
  Yer kalmazsa etiket gizleniyor; yakınlaşınca geri geliyor. Tur oda seçicisi
  bütün istasyonları erişilebilir tutuyor.
- Ana butonlar en az 44×44 CSS px; mobil ana yazılar 14 px, form girişi 16 px.
  Dar ekranda ölçek düğmelerinin metin payı, hata düğmesinin sıkışması ve
  yatay yerleşim düzeltildi. Başlıkların altında okunabilir yüzey var.
- Escape tek işlem yapıyor: önce paneli kapatıyor, aynı basışla turdan da
  çıkmıyor. Panel açıkken yürüme duruyor; kapanırken odak geri geliyor.
- Tarayıcı testi, uzun ayar panelindeki bir kontrole odaklanmanın sabit uygulama
  kabını 140 px kaydırabildiğini ortaya çıkardı. Panel kendi içinde kaydırılırken
  uygulama/viewport `overflow: clip` ile sabit kalacak şekilde düzeltildi.
- WebGL başlatılamazsa model eylemleri devre dışı, Bilgi/Ayar erişilebilir.
  Çalışırken WebGL bağlamı kaybolursa ölçüm kesiliyor ve açık hata gösteriliyor.
- Ayar içinde açık rızayla çalışan yerel cihaz kanıtı araçları var:
  15 saniye kare ölçümü, PNG sahne kaydı, aynı karenin ayar kaydı ve JSON rapor.
  Otomatik dış gönderim yok. Raporlar fiziksel cihaz veya görsel kaliteyi
  kendiliğinden “doğrulandı” olarak işaretlemiyor.

## Geçen kontroller

| Kontrol | Sonuç / kapsam |
|---|---|
| `npm test` | **30/30 geçti.** Render sıra/profil, bloom buffer akışı ve hata sonrası hedef iadesi, kamera, etiket, Escape, ölçüm istatistiği; eski model/rota/hash testleri dahil |
| Zamanlama regresyonu | `explore.test.mjs` + `r28.test.mjs` **30 ardışık çalıştırmada geçti** |
| Üretim derlemesi | Vite üretim build ve mevcut GitHub Pages için `build:pages` geçti |
| Tarayıcı UI | Gerçek uygulama iframe'inde 320×568, 390×700, 430×850, 844×390 CSS boyutları; görünür ana butonlarda 44 px altı hedef, yatay metin taşması veya viewport dışına çıkma kalmadı |
| Panel etkileşimi | Ayar/Bilgi açılıyor; Escape kapatıyor ve odağı Ayar düğmesine döndürüyor; cihaz kontrolü bölümü açılabiliyor. Açık uzun panel dört boyutta ekran içinde; uygulama scrollTop 0; panel yatay taşması yok |
| Mimari korunumu | Bu pakette Blender/GLB/navigasyon/mimari kaynakları değiştirilmedi; mevcut hash testleri geçti |

Tarayıcı UI ölçümü, **cihaz emülasyonu veya iPhone testi değildir**. Safe-area
CSS'i uygulandı fakat gerçek Safari çubuğu/çentik ve dokunma ile kabul edilmedi.
Yeni GLSL'nin GPU derlemesi ve görünüşü de WebGL olmadan sınanamadı; Vite build
geçmesi shader'ın GPU'da doğrulandığı anlamına gelmez.

## Açık kabul ve sonraki paket

1. R03–R09: gerçek çatı/cephe/zemin/bodrum hareket videosu; malzeme ve ışık
   kabulü, shader ve HDR/fallback kontrolü, ışık geçiş sürekliliği.
2. U02–U11: model yüklüyken bütün oda/ölçü, yürüme, mobil panel ve kayıt
   etkileşimlerinin gerçek cihaz kontrolü. Üretilen istatistikler henüz yok.
3. A03/A05/A06: asansör hareket/fotoğraf oranları; güvenilir oda sınırlarıyla
   m²; kesin saha ve havuz ölçüleri.
4. F01–F17: fotoğrafla son kabul. Bu pakette bu gruplardan hiçbiri kapatılmadı.
5. S01–S06: kot/yol/komşu detayları, gerçek coğrafi bölge ve kaynaklı hizmet verisi.
6. Q03–Q08: gerçek iPhone hareket/performans, uzun süreli ısınma, fiziksel XR,
   yetkili yayın, canlı dosya eşliği ve bütün projenin son kabulü.

## Gerçek telefondan kanıt toplama sırası

Bu araçlar **R28 paketinde**; eski canlı R26'da henüz görünmez.

1. Paket yetkili biçimde erişilebilir olduğunda gerçek telefonda aç; cihaz
   modeli ve sistem sürümünü Ayar → Cihaz ve görüntü kontrolü alanına yaz.
2. Yakın çevre/çatı, bodrum kesiti, bölge ve oda turunu ayrı koşullarda sınayarak
   her biri için 15 sn ölçümü başlat; kayıt boyunca gerçek sürükleme/yürüme yap.
3. Raporu indir. Sahneyi indir düğmesi yalnızca PNG indirir; aynı karenin kamera,
   kesit, ışık, DPR/buffer, bundle ve model hash bilgisi Raporu indir içindedir.
   Tarayıcı arayüzü için ayrıca cihazın ekran görüntüsü/video işlevini kullan.
4. 09:00 / 12:30 / 18:00 ve üç mevsimden karşılaştırma yap. Tek bir güzel kare,
   hareket sırasında z-fighting veya ışık sıçramasını kapatmaz.
5. En az 5 dakika sonra aynı turu tekrarla. Arka plana alınan ölçüm “kesildi”
   olarak kalır; emülasyon veya masaüstü ölçümü gerçek iPhone diye etiketlenmez.

## Yayın durumu

Önceki R27 geometri dosyası dış aktarımı izin denetiminde durdurulmuştu. Yeni
GitHub izni referansın okunmasını çözdü; bu, o ayrı yayın engelinin kalktığını
kanıtlamaz. R28 bu engeli aşacak alternatif yolla gönderilmedi. Kaynak/build
hazırlanması, `main` push veya canlı Pages yayını olarak raporlanmaz.
