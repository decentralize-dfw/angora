# Fotoğraf denetimi — foto-v3 (40 çift, GPU, 01.10.2026)

Kaynak: `qa-foto-v3` dalı, `qa/foto-v3/kNN.jpg` (solda fotoğraf, sağda model aynı kameradan).
Her fotoğraf tek tek incelendi. Etiketler: **G** geometri, **K** kapı/pencere, **D** doku/malzeme,
**R** renk/ışık, **C** kamera (model hatası değil, karşılaştırmayı bozuyor).
Durum: ✅ düzeltildi · 🔧 bu turda · ⏳ sırada · 📷 GPT (kamera/Blender)

## A. Bütün evde ortak hatalar (önce bunlar)

| # | Hata | Nerede | Sebep | Durum |
|---|---|---|---|---|
| A1 | Duvarlar krem yerine koyu kahve/taupe/gri; tavanlar bembeyaz | 40 fotoğrafın ~35'i; en kötü çatı katı (6,7,8,9,10,14,15), hol/antre (18,40,41,42), garaj (43,44) | Duvar ışık haritası tavana göre zayıf + duvar malzemesi bej-kahve + lambalar gündüz kapalı | 🔧 |
| A2 | Duvarlarda dikey/yatay koyu izler, dikiş çizgileri, lekeler | 4, 12, 13, 17, 34, 35, 43, 47 | Işık haritaları 2048→512'ye küçültülüyordu: dar yüzeyler komşu parçanın ışığını alıyor | 🔧 (masaüstüne tam çözünürlük) |
| A3 | Karo derzi görünmüyor, zemin düz renk gibi (45° çapraz doğru ama seçilmiyor) | 1, 2, 3, 5, 21, 22, 40, 42 | Karo dokusundaki derz çizgileri çok silik | 🔧 |
| A4 | Paslanmaz eşyalar siyah (buzdolabı, fırın, davlumbaz, bulaşık mak., evye, batarya, kulplar) | 1, 21, 22, 11, 15 | İç metaller oda yansıması alıyor, sonda karanlık | 🔧 |
| A5 | Parke morumsu bordo ve mat; merdiven basamakları halı gibi kırmızı | 4, 9, 12, 14, 18, 29, 31, 34, 47 | Parke dokusu/ton | ⏳ |
| A6 | Kamera fotoğrafçının yerinde değil (yakın, dönük, kapı arkasında, objenin içinde) | 1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 19, 21, 22, 23, 31, 32, 35, 39, 40, 41, 43, 44, 45, 46, 47, 49 | Yalnız 9 kamera Blender'da fotoğrafa oturtulmuştu | 📷 |
| A7 | Perdeler eksik | 2, 3, 4, 5, 13, 19, 23, 33 | Mobilya setinde yok | ⏳ |

## B. Geometri hataları

| # | Hata | Foto | Durum |
|---|---|---|---|
| B1 | Çatı katı eğik tavan kenarları testere dişi, duvarın önüne taşıyor, ortada sarkan üçgen | 9, 10, 14 | ⏳ |
| B2 | Çatı katında büyük siyah üçgen (kaplamasız yüzey) | 14 | ⏳ |
| B3 | Çatı pencerelerinin altında kırmızı-kahve pervaz bandı + katlanmış gri yüzeyler; 7'de sağda siyah boşluk | 7, 8 | ⏳ |
| B4 | Merdiven alt yüzünde yatay siyah yarık | 18, 34, 42 | ⏳ |
| B5 | Antrede boşlukta duran asma tavan plakası; kartonpiyerli kasetli tavan yok | 40, 41, 42 | ⏳ |
| B6 | Radyatör duvardan kopuk, dokusu akmış | 40, 42 | ⏳ |
| B7 | Kemer yanında siyah dikey yarık; kemer içinde siyah blok | 12 | ⏳ |
| B8 | Salon: kolonlar arasında koyu eğik panel, tavanda koyu çizgi, kolon başlığı yok | 4, 23 | ⏳ |
| B9 | Merdiven altı simsiyah üçgen boşluk | 2 | ⏳ |
| B10 | Çatı holü kemeri: fotoğrafta basık ve köşeleri pahlı, modelde fazla yüksek | 29 | ⏳ |
| B11 | Çatı: tavanı kesen beyaz kiriş eksik | 10, 29 | ⏳ |
| B12 | Lomboz (yuvarlak) pencere eksik | 10 | ⏳ |
| B13 | Bodrum mutfağı köşesinde fotoğrafta olmayan baca/kolon kutusu | 1 | ⏳ (doğrulanacak) |
| B14 | Zemindeki krem karo deseni yanlış yerde (merdiven önünde; olması gereken masa önü) | 2, 3, 5 | ⏳ |
| B15 | Mutfak kapısı çevresinde fazladan duvar kütlesi ve pah | 22 | ⏳ (doğrulanacak) |
| B16 | Metal karyola mesh'i kırık | 13, 17 | ⏳ (mobilya) |

## C. Kapı ve pencere

| # | Hata | Foto | Durum |
|---|---|---|---|
| C1 | Kapı kanadı kameranın önünü kapatıyor; fotoğrafta açık | 30 | 🔧 |
| C2 | Giyinme odası kapısı ters menteşeli; içeri sağa açılmalı | 16 | 🔧 |
| C3 | Antre vitray kapı: fotoğrafta tek kanat ve içe açık, modelde iki kanat ve dışa açık | 40 | ⏳ |
| C4 | Balkon kapıları: fotoğrafta çift kanat ve kapalı, modelde tek kanat ve içe açık | 3, 5 | ⏳ |
| C5 | Asansör kapısı: fotoğrafta dar camlı ahşap kapı ve paslanmaz kabin; modelde gül vitraylı kapı, kabin görünmüyor | 48, 49 | ⏳ |
| C6 | Sol duvarda camsız, içi siyah kapı açıklığı (fotoğrafta camlı kapı) | 2 | ⏳ |
| C7 | Ebeveyn yatak odası kapısı fotoğrafta kapalı, modelde açık | 31 | ⏳ (gezintide açık kalmalı mı?) |

## D. Doku ve malzeme (mobilya dahil, büyük olanlar)

- **1:** Tezgah arkası ocak tarafında bakır mozaik; olması gereken bej kare seramik. Dolap çerçeveleri neredeyse siyah, paneller fazla turkuaz.
- **11, 32:** Uzun dolabın buzlu cam kapakları yok. Bordür fazla kalın, yanlış yükseklikte; üstünde fotoğrafta olmayan gri silme var.
- **12, 16:** Gardırop rengi yanlış (12 siyah, 16 turuncu); aynalar düz panel.
- **15:** Çatı banyosunda duvar ve eğik tavan koyu çikolata; bordür rengi yanlış.
- **21:** Tezgah arası mozaik yerine kaba beyaz karo ve koyu derz; bej stor yerine koyu kırmızı jaluzi.
- **23:** Ayna kapkara; masa tablası bordo.
- **39:** WC seramiği: üst beyaz, alt bej olmalı; bordür mavi yaprak motifli olmalı.
- **Avizeler:** 2, 3, 4, 5, 13 ve 17'de yanlış.
- **Mobilya:** 7, 8, 10, 14 ve 29'da eksik ya da farklı.
