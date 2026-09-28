# Tur 9 teslimi

A1/A3 önceki turda tamamlandığı için tekrar edilmedi. A2 dosya güncellemesi uygulandı.

14 yüzey için 14 CC0 doku seti (54 JPG) ve kaynak/ölçü/renk tabloları `dokular.json` içindedir. Dokular henüz ana model malzemelerine uygulanmadı. `doku-dogrulama.json` boyutları ve SHA256 değerlerini içerir. Kaynaklarda belirtilmeyen fiziksel ölçüler null; tahminler işaretlidir.

`ekler-plan.json`: 8 pencere için fon perde/korniş, 8 aplik, 19 tablo, 0 halı. EKLER toplam 94 mesh içerir. Kaynak betik değiştirilmeden ilk üretim + izin verilen iki düzeltme turu yapıldı. İlk/ara/son görüntüler ve terminal kayıtları teslimdedir.

**Kontrol tamamen başarılı değildir.** Perde yön/boy sorunları, 107 odasının pencere kaydının bulunmaması ve foto14 apliğinin yanlış yüzeye düşmesi çözülmedi. Tüm 12 son kontrolün tek tek gözlemi ve diğer kısıtlar `kontrol-raporu.json` dosyasındadır. Bu teslim ana modele otomatik entegrasyon veya tam fotoğraf eşleşmesi onayı değildir.

Çalıştırılan C3 komutu (ilk + 2 düzeltme, plan güncellenerek):
```powershell
$R = "C:\Users\yigit\Downloads\angora-main (2)\angora-main"
$T = "C:\Users\yigit\angora-tur9"
$env:PYTHONIOENCODING = "utf-8"
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python "$R\tools\blender\06_ekler.py" -- $R "$T\ekler-plan.json" --kontrol
```

Ortam düzenlemeleri `ortam-notlari.txt` içindedir. 06/07 kaynak betik SHA256 eşitliği `teslim-dogrulama.json` ile doğrulanmıştır.
