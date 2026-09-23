# ŞİMDİ: capture'ı durdur, FAZ 7'ye geç, kontroller EN SONDA

## 1. Koşan capture'ı DURDUR

29 karelik FAZ 6 doğrulaması dahil, **her türlü capture durur.**
Kısmi çıktıları sil. Bundan sonra kod bitene kadar **tek kare çekilmez.**

## 2. FAZ 7 koduna geç

`FAZ-7-MASAUSTU.md` — masaüstü V-Ray: SSR, PCSS, pencere alan ışığı,
4 oktav prosedürel detay, tam çözünürlük GTAO, clearcoat/sheen, DOF.
Yedi iş, hepsi her iki masaüstü tier'ına, hepsi bayrak varsayılan `false`.

Kod yazarken: `npm test` (3 sn) + commit + push + `PROGRESS.md`.
Capture yok. Ölçüm script'i yazmak serbest, **çalıştırıp kare çekmek yok.**

## 3. Kontroller — hepsi en sonda, tek oturum

FAZ 6 + FAZ 7 kodunun tamamı bitince, 13 bayrak birden açık, **tek
doğrulama oturumu.** Kare seti `FAZ-7-MASAUSTU.md` Bölüm 3: 25 kare.

`KAPANIS.md`'nin 24 maddesi **o oturumda** dolar — capture gerektirmeyenler
de dahil. Şimdi hiçbirini doldurma, ölçme, raporlama. Kod yaz.

## 4. Kırmızı gelirse

`?features=<ad>:0` ile bisect. Bisect koşumu 4 kamera × 1 tier = 4 kare,
~12 dk. 13 bayrakta ikili arama ~4 koşum.

Kırmızı çizgi ikisi: konsol hatası 0, context loss 0.

---

**Özet:** Kod → kod → kod → **tek kontrol oturumu**. Arada doğrulama yok,
ara rapor yok, ara capture yok.
