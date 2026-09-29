from pathlib import Path
import shutil,json
from PIL import Image,ImageDraw,ImageFont
W=Path(r'C:\Users\yigit\angora-tur10');R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');D=Path(r'C:\Users\yigit\angora-git\teslim-tur10');A=W/'adim10';O=D/'adim10/asama1';O.mkdir(parents=True,exist_ok=True);font=ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf',25)
for f in [2,16,18,21,29,34,42]:
 photo=Image.open(R/f'photogallery/angora_{f:02d}.jpg').convert('RGB');render=Image.open(A/f'asama1/render_{f:02d}.png').convert('RGB');photo=photo.resize(render.size);im=Image.new('RGB',(render.width*2,render.height+45),'#222222');im.paste(photo,(0,45));im.paste(render,(render.width,45));dr=ImageDraw.Draw(im);dr.text((15,8),f'FOTO {f:02d}',font=font,fill='white');dr.text((render.width+15,8),'ADIM 10 / ASAMA 1 / SONRA',font=font,fill='white');im.save(O/f'foto_{f:02d}.jpg',quality=95)
for f in ['olcum_02.jpg','renk-olculeri.json','duzeltme-raporu.json','kutu-iptal.json']:shutil.copy2(A/f,O/f)
shutil.copy2(A/'sahne.blend',O/'sahne.blend')
for f in ['silme-kutulari.json','dokular.json']:shutil.copy2(W/f,D/f)
for f in Path(__file__).parent.glob('adim10-*.py'):shutil.copy2(f,O/f.name)
note='''\n## Adım10 Aşama1\nYAPILDI: 153 yeni/DWG korkuluk ve küpeşte parçası kaldırıldı. Özgün BUILDING-opt-v4 / INTERIOR-opt-v2 GLB kaynaklarından eski maskelerin sildiği 17483 metal + 5723 pirinç + 1284 ahşap yüz; özgün konum, geometri, UV ve shader ile geri yüklendi. Korkuluk maskeleri iptal, basamak maskesi ayrı tutuldu. Foto42 dahil kaynak korkuluklar korunur.\nYAPILDI: Foto16 A08_ceviz, foto21 A08_kiraz görüntü düğümleri geri bağlandı; mevcut metre UV kaybolmamıştı, Adım09 düz renk ağırlıklı albedo damar kaybının nedeniydi.\nYAPILDI: Foto02 terrakota ROI kırmızı çerçeveyle gösterildi; WB RGB [180,133,108], 45 derece gerçek UV korundu.\nYAPILDI: 02,16,18,21,29,34,42 FOTO|SONRA.\nKALDI: Önceki aşamadaki bordür/tavan/eşik ayrıntıları bu aşamanın kapsamı dışında korunur.\n'''
p=D/'notlar.md';p.write_text(p.read_text(encoding='utf-8')+note,encoding='utf-8');p=D/'ilerleme/README.md';text=p.read_text(encoding='utf-8')+'\n## Adım10 · Aşama1 · Özgün korkuluk ve malzemeler\n'
for f in [2,16,18,21,29,34,42]:text+=f'\n![Foto {f:02d}](../adim10/asama1/foto_{f:02d}.jpg)\n'
text+='\n[Terrakota ölçümü](../adim10/asama1/olcum_02.jpg) · [Düzeltme raporu](../adim10/asama1/duzeltme-raporu.json)\n';p.write_text(text,encoding='utf-8');print('[A10] AŞAMA1 TESLIM')
