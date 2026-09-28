from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
import json,sys
R=Path(r"C:\Users\yigit\Downloads\angora-main (2)\angora-main");W=Path(r"C:\Users\yigit\angora-tur10")
rows=json.loads(Path(r"C:\Users\yigit\angora-foto-eslesme-2\rapor.json").read_text(encoding='utf-8'))['kareler'];rows=[next(r for r in rows if r['id']==i) for i in [1,2,6,11,13,16,18,21,32,40,41,47,17]]
start=int(sys.argv[1]);part=rows[start:start+4]
out=Image.new('RGB',(1600,1200),'#222');d=ImageDraw.Draw(out)
for j,r in enumerate(part):
 n=r['id'];x=(j%2)*800;y=(j//2)*600
 p=next((R/'photogallery').glob(f'angora_{n:02}.*'));q=W/'adim08/kontrol'/f'render_{n:02}.png'
 for i,f in enumerate([p,q]):
  im=ImageOps.contain(Image.open(f).convert('RGB'),(398,565));out.paste(im,(x+i*400,y+30))
 d.text((x+5,y+5),f"{n:02} FOTO | SONRA - {r['yer']}",fill='white')
out.save(W/'adim08'/f'son-inceleme_{start:02}.jpg',quality=95)
