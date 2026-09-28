# Blender ajanı: tur tur ilerleme

İş emrinin (`ISEMRI.md`) uygulaması turlara bölündü. Ajana her turda **yalnız
o turun promptu** verilir. Tur raporu gelince görüntüleyici tarafı (Claude)
denetler, bir sonraki turun promptunu yazar. Ağır iş (UV2 açma, web geometrisini
Blender'ın okuyacağı hale getirme) mümkün olduğunca web tarafında, betikle
yapılır. Ajan hazır betikleri çalıştırır ve çıktıyı kanıtıyla getirir.

| Tur | İş | Render / bake | Tahmini süre |
|---|---|---|---|
| 1 | Envanter: sistem, GPU, .blend içeriği, ışıklar, web ile karşılaştırma | YOK | 10 dk |
| 2 | Pişirme sahnesi: web tarafının hazırladığı UV2'li GLB'ler + .blend'deki ışıklar | YOK | 20 dk |
| 3 | Kalibrasyon: 5 kamera, küçük çözünürlük, fotoğrafla yan yana (en çok 2 deneme) | 5-10 küçük render | 30 dk |
| 4 | Deneme pişirme: tek atlas, 1024², düşük örnek; dikiş ve süre kontrolü | 1 bake | 20 dk |
| 5 | Gündüz pişirme: 09 / 13 / 17 | tam | saatler (GPU) |
| 6 | Gece pişirme | tam | saatler (GPU) |
| 7 | Gürültü temizleme, paketleme, teslim | YOK | 20 dk |

## Her turun ortak kuralları (her prompta eklenir)

```
KURALLAR (her turda geçerli):
1. Yalnız bu turun işini yap. Sonraki turlara geçme, "ilerisi için hazırlık" yapma.
2. Bu turda izin verilmeyen hiçbir render ya da bake alma. Render/bake izni
   turun metninde açıkça sayı ve çözünürlükle yazıyorsa vardır; yoksa yoktur.
3. "Çalışıyorum", "devam ediyorum", "birazdan" deme. Tur ya bu yanıtta biter
   ya da neyin, hangi hata mesajıyla takıldığını yazarsın. Yarım iş "bitti" diye
   raporlanmaz.
4. Her iddianın kanıtı olacak: çalıştırdığın komut, betik yolu, çıktı dosyasının
   yolu, çıktıdan ilgili satırlar (kopyala-yapıştır, özetleme yok).
5. Hazır verilen betiği DEĞİŞTİRME. Hata verirse hatayı tam metniyle yaz. Çözüm
   önerin varsa ayrıca yaz ama betiği kendi başına düzeltme.
6. Asıl .blend dosyasına asla yazma (Ctrl+S yok). Bir şey kaydetmen gerekirse
   turun metni söyler, adıyla söyler.
7. Yanıtının sonu her zaman şu başlıklarla biter:
   YAPILDI: (madde madde)
   ÇIKTILAR: (dosya yolları)
   SORUNLAR: (yoksa "yok")
   BEKLENEN ONAY: (bir sonraki tur için benden ne bekliyorsun)
```

---

## TUR 1: Envanter (render yok, bake yok, kayıt yok)

```
Angora villa projesinde Blender ışık pişirme işinin ilk turundayız. Bu tur
YALNIZ envanter: bilgisayarı ve .blend dosyasını ölçüyoruz. Hiçbir şey
render etme, bake etme, kaydetme.

ADIM 1 - Repo
  Repoyu indir (zaten varsa güncelle):
    git clone https://github.com/decentralize-dfw/angora
    (varsa: cd angora && git pull)
  Git yoksa GitHub'dan ZIP indir, aç.
  Kanıt: repo klasörünün tam yolu ve şu iki dosyanın var olduğu:
    tools/blender/01_envanter.py
    tools/blender/web-referans.json

ADIM 2 - Blender ve .blend
  a) Blender'ın çalıştırılabilir dosyasının tam yolunu bul ve sürümünü yaz:
       "<blender yolu>" --version
  b) Villa .blend dosyasının tam yolunu ve boyutunu (MB) yaz. Birden çok aday
     varsa hepsini listele (yol, boyut, değiştirilme tarihi), en yenisini seç ve
     nedenini bir cümleyle yaz.

ADIM 3 - Envanter betiği (arka planda, arayüzsüz)
  Şu komutu AYNEN çalıştır (yolları kendi yollarınla değiştir):
    "<blender yolu>" -b "<villa.blend yolu>" --python "<repo>/tools/blender/01_envanter.py" -- "<repo>"
  Betik salt okunurdur: dosyayı kaydetmez, render almaz.
  Çıktı: <repo>/angora-bake/rapor/01_envanter.json

ADIM 4 - Rapor
  a) Terminal çıktısında "===== ANGORA TUR 1 ÖZET =====" ile "===== SON ====="
     arasındaki HER SATIRI olduğu gibi yanıtına yapıştır. Kısaltma, yorumla
     değiştirme.
  b) 01_envanter.json dosyasını bana ek olarak ver.
  c) Bilgisayarın ekran kartı modeli ve VRAM miktarı (Görev Yöneticisi >
     Performans > GPU ya da nvidia-smi). Sistem RAM miktarı.
  d) Villa fotoğraflarının orijinalleri (repodaki photogallery/ dışında) bu
     bilgisayarda var mı? Varsa klasör yolu ve dosya sayısı. Açma, işleme.

Bu kadar. Sonuç ne olursa olsun yorumlama, düzeltme, "şunu da yaptım" deme;
kararları ben vereceğim.

KURALLAR (her turda geçerli):
1. Yalnız bu turun işini yap. Sonraki turlara geçme, "ilerisi için hazırlık" yapma.
2. Bu turda izin verilmeyen hiçbir render ya da bake alma. Render/bake izni
   turun metninde açıkça sayı ve çözünürlükle yazıyorsa vardır; yoksa yoktur.
3. "Çalışıyorum", "devam ediyorum", "birazdan" deme. Tur ya bu yanıtta biter
   ya da neyin, hangi hata mesajıyla takıldığını yazarsın. Yarım iş "bitti" diye
   raporlanmaz.
4. Her iddianın kanıtı olacak: çalıştırdığın komut, betik yolu, çıktı dosyasının
   yolu, çıktıdan ilgili satırlar (kopyala-yapıştır, özetleme yok).
5. Hazır verilen betiği DEĞİŞTİRME. Hata verirse hatayı tam metniyle yaz. Çözüm
   önerin varsa ayrıca yaz ama betiği kendi başına düzeltme.
6. Asıl .blend dosyasına asla yazma (Ctrl+S yok). Bir şey kaydetmen gerekirse
   turun metni söyler, adıyla söyler.
7. Yanıtının sonu her zaman şu başlıklarla biter:
   YAPILDI: (madde madde)
   ÇIKTILAR: (dosya yolları)
   SORUNLAR: (yoksa "yok")
   BEKLENEN ONAY: (bir sonraki tur için benden ne bekliyorsun)
```

Tur 1 sonucunda web tarafı şunlara karar verir:
- **Geometri yolu:** .blend ile web modelleri üçgen ve konumca tutuyor mu? Tutmuyorsa pişirme, web tarafının hazırlayacağı GLB'ler üzerinde yapılır.
- **Gece ışığı:** Işıklar .blend'de gerçek ışık nesnesi mi, ışık yayan malzeme mi?
- **Pişirme örnek sayısı ve atlas boyutu:** GPU ve VRAM'e göre.
