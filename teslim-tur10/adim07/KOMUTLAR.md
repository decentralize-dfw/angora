# Adım 07 komut kaydı

PowerShell; tüm Blender işlemleri arka planda. Kullanıcı uygulamaları kapatılmadı.

```powershell
$R = "C:\Users\yigit\Downloads\angora-main (2)\angora-main"
$W = "C:\Users\yigit\angora-tur10"
$B = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
python -X utf8 .\tur10-adim07-doku.py
& $B -b --factory-startup --python-exit-code 1 --python .\tur10-adim07-wire.py
& $B -b --factory-startup --python-exit-code 1 --python "$W\moduller\adim07.py"
$ids = "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,21,22,23,29,30,31,32,33,34,35,39,40,41,42,43,44,45,46,47,48,49"
& $B -b --factory-startup --python-exit-code 1 --python "$R\tools\blender\08_kontrol_render.py" -- $R "$W\kontrol" $ids --ekler "$R\build\web\26092026\EKLER.glb" --kamera "$W\kamera-duzeltme.json" --sil "$W\silme-kutulari.json" --dokular "C:\Users\yigit\angora-tur9\dokular.json" --ornek 64
& $B -b --factory-startup --python-exit-code 1 --python .\tur10-adim07-yakin.py
python -X utf8 .\tur10-adim07-karsilastir.py
```

Genel kontroller: 1200 px genişlik, fotoğraf oranı, 64 örnek. Yakın kontroller: 1000×800, 64 örnek; yaklaşık 1.5 m kamera mesafesi. Wireframe: 1000×800, 8 örnek. Log: `../adim07-kontrol.log`; son satır `[kontrol] TAMAM 40`.

Bu komut listesi kayıt amaçlıdır; modül değişikliklerini yeniden uygularken başlangıç modeli Adım06 yedeğidir. Asıl villa .blend dosyası yazılmadı.
