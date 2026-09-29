from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json
W=Path(r'C:\Users\yigit\angora-tur10');D=Path(r'C:\Users\yigit\angora-git\teslim-tur10/web');metrics=[]
font=ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf',25)
for f in [2,16,18,21,34,42]:
 a=Image.open(W/f'adim10/asama1/render_{f:02d}.png').convert('RGB');b=Image.open(W/f'adim10/web-calisma/reload/render_{f:02d}.png').convert('RGB');out=Image.new('RGB',(a.width*2,a.height+50),'#202020');out.paste(a,(0,50));out.paste(b,(a.width,50));d=ImageDraw.Draw(out);d.text((16,12),f'{f:02d} | .BLEND / AYNI KAMERA + IŞIK + POZLAMA',font=font,fill='white');d.text((a.width+16,12),'GLB / BOŞ SAHNEYE GERİ YÜKLEME',font=font,fill='white');out.save(D/f'web_dogrulama_{f:02d}.jpg',quality=96)
 diff=np.abs(np.array(a).astype(float)-np.array(b).astype(float));metrics.append(dict(foto=f,ortalama_mutlak_rgb_farki=float(diff.mean()),yuzde95_rgb_farki=float(np.percentile(diff,95)),rgb20_ustu_piksel_orani=float((diff.max(2)>20).mean()),aciklama='Denoise, 2048px yeniden örnekleme ve GLTF shader dönüşümü nedeniyle bit eşitliği beklenmez; kamera/ışık/pozlama aynıdır.'))
p=D/'web-kontrol.json';r=json.loads(p.read_text(encoding='utf-8'));r['gorsel_karsilastirma']=metrics;p.write_text(json.dumps(r,ensure_ascii=False,indent=1),encoding='utf-8');print(json.dumps(metrics,ensure_ascii=False))


