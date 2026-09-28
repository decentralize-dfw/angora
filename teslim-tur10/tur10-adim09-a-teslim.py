from pathlib import Path
import json,shutil,hashlib
from PIL import Image,ImageOps,ImageDraw
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');T=Path(r'C:\Users\yigit\angora-tur9');D=Path(r'C:\Users\yigit\angora-git\teslim-tur10');A=W/'adim09'
cad=Image.open(A/'cad/korkuluk-blok.png').convert('RGB');bounds=ImageOps.invert(cad).getbbox();cad=cad.crop(bounds)
photo=Image.open(R/'photogallery/angora_18.jpg').convert('RGB');w,h=photo.size;photo=photo.crop((int(w*.58),int(h*.46),int(w*.89),int(h*.92)))
render=Image.open(A/'detay_korkuluk.png').convert('RGB');out=Image.new('RGB',(2400,950),'#242424');d=ImageDraw.Draw(out)
for k,(im,label) in enumerate([(cad,'DWG / KORKULUK 1 / 507 LINE+ARC'),(photo,'FOTO 18'),(render,'SONRA / 12mm kare kesit')]):
 im=ImageOps.contain(im,(780,885));out.paste(im,(k*800+(780-im.width)//2,50+(885-im.height)//2));d.text((k*800+15,15),label,fill='white')
out.save(A/'yakin_korkuluk.jpg',quality=96)
note='''
## Adım 09 A — DWG korkuluk, sabit ahşap paleti, seramik ve foto47

### Kaynak ve birim

YAPILDI: ODA File Converter 27.1, ACAD2018 DXF; ANGORA-.dwg yalnız sparse checkout'a eklendi. Arama ilk 6 dakika içinde sonuçlandı. `KORKULUK 1` bloğu `2D$FER` üzerinde 283 LINE + 224 ARC içeriyor; 507 entity panel-ham.json ve bağımsız KORKULUK-1-orijinal-panel.dxf içinde korunuyor. Kontrol edilen katmanlar: KORKULUK (52394), 2D$FER (8070), 2D$FERFORJE (1197), 2D$KTR (308). Tüm katman/blok adları cad/envanter.json içinde.

KALDI / birim yorumu: `$INSUNITS=6` (metre), fakat 2D detay bloğu yerel 100×80 birim ve paftadaki INSERT ölçeği 2.5. Detay 1.00×0.80m panel olarak yorumlandı (yerel .01 katsayısı); bu nominal ölçü saha/ölçü çizgisiyle ayrıca doğrulanmadı. Çizgi/yayların göreli koordinatları değişmedi; yay tessellation sapması en çok yaklaşık 1.2mm. Pafta INSERT koordinatları villa dünya koordinatı olarak kullanılmadı.

YAPILDI: DWG çizgileri Blender eğrileri olarak saklandı (ARSIV_DWG), 12mm kare profil; dışa aktarım için aynı prototip mesh kopyaları. Her segmentte 1m tekrar, son panel sınırda kesilir; merdiven eğimi affine shear ile verilir. Ahşap küpeşte profili korunur ve panel üstüne bağlanır. 2D$KTR içindeki pafta detayı güvenilir plan merkez hattı olarak kullanılamadığından izin verilen döşeme boşluğu kenarı yöntemi kullanıldı; foto18 galeri L şeklindedir. Yerleşim koordinatları korkuluk-yerlesim.json içinde.

### Sabit ahşap atamaları

| Palet | Atanan yüzeyler | Ölçüm kanıtı |
|---|---|---|
| Koyu ceviz | 11/32 alt ve boy banyo dolapları; giriş katı kapı/kasaları; 16 sürgülü gömme dolap; 01 çerçeveler; alt kat süpürgelik/küpeşte | olcum_11.jpg; dolap altı gölge telafisi 1.7, ortak ton; 32 ölçümü ayrıca kaydedildi fakat turuncu örnek palete alınmadı |
| Wenge | Üst kat kapı, kasa ve süpürgelikler | olcum_18.jpg |
| Kiraz | 21 mutfak dolapları | olcum_21.jpg |
| Parke | Parke ve merdiven | Önceki kilitli parke/tek parça merdiven dokuları korundu |

YAPILDI: foto11 zemin kırmızı-beyaz, 30cm nominal karo, 45° gerçek UV. Kırmızı ölçüm ilk kontrolde beyaz karoya düştüğü için uygulanmadan düzeltildi; son kırmızı ROI RGB yaklaşık117,78,68. Ahşaplar siyah/gri yüzeyden ölçülmedi.
YAPILDI: foto32 seramik krem, yaklaşık60cm büyük format; alt bordür döşemeden .95m, üst mevcut bant korunur. Koyu boy dolabı aynı ceviz paletinde. KALDI: bordürün desen ayrıntısı fotoğrafla tam birebir değil.
YAPILDI: foto02 turuncu-kahve terrakota, 45° UV; krem bordür/dikdörtgen geometri korunur.
YAPILDI: foto47 için eski beyaz rıht yüzleri hem mimari hem mobilya katmanındaki ölçülen kutulardan çıkarılır; eğik iç yüzler kaldırılır, yeni duvar Y=2.1271 düzleminde tek dikey yüzeydir. Son görsel sonuç aşağıdaki kontrol günlüğüyle birlikte değerlendirilir.

### Kontrol

01,02,11,16,18,21,29,32,34,40,42,47 için SON kontrolü ve yakın korkuluk DWG | FOTO | SONRA üretildi. Yeni mobilya modellenmedi. Eski kapsam dışı kamera/aksesuar farkları bu A tesliminin çözüldü iddiasına dahil değildir.
'''
p=W/'notlar.md';s=p.read_text(encoding='utf-8').split('\n## Adım 09 A —')[0];p.write_text(s+note,encoding='utf-8')
for name in ['ekler-calisma.blend','kamera-duzeltme.json','silme-kutulari.json','dokular.json','notlar.md']:shutil.copy2(W/name,D/name)
shutil.copy2(R/'build/web/26092026/EKLER.glb',D/'EKLER.glb')
for name in ['moduller','modul-raporlari']:shutil.copytree(W/name,D/name,dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__'))
shutil.copytree(A,D/'adim09',dirs_exist_ok=True,ignore=shutil.ignore_patterns('ANGORA-.dxf','kontrol-sahne.blend','*.blend1','kontrol-once'))
for r in json.loads((T/'dokular.json').read_text(encoding='utf-8')):
 f=T/'malzeme-dokulari'/r['klasor']
 if f.exists():shutil.copytree(f,D/'malzeme-dokulari'/r['klasor'],dirs_exist_ok=True,ignore=shutil.ignore_patterns('*-stok-once*','ao.jpg'))
for p in W.glob('adim09*.log'):shutil.copy2(p,D/p.name)
for p in Path(__file__).parent.glob('tur10-adim09-*.py'):shutil.copy2(p,D/p.name)
print('[A09 teslim] kaynak, model, palet, 12 kontrol ve yakin')
