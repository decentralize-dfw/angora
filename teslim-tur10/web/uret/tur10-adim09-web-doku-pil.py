from pathlib import Path
from PIL import Image
import numpy as np,json
C=Path(r'C:\Users\yigit\angora-tur10\adim09/web-calisma');a=json.loads((C/'ham-dokular.json').read_text(encoding='utf-8'))
for rec in a:
 if rec['ham_tur']=='resim':im=Image.open(rec['ham']).convert('RGB')
 else:
  x=np.load(rec['ham']+'.npy')[::-1,:,:3]
  if rec['srgb']:x=np.where(x<=.0031308,12.92*x,1.055*np.power(np.maximum(x,0),1/2.4)-.055)
  im=Image.fromarray(np.uint8(np.clip(x*255,0,255)))
 im=im.resize((2048,2048),Image.Resampling.LANCZOS)
 if rec['world_to_tangent']:
  x=np.array(im);x[:,:,[0,1]]=x[:,:,[1,0]];im=Image.fromarray(x)
 p=C/'dokular2048'/rec['dosya'];im.save(p,quality=95) if p.suffix=='.jpg' else im.save(p)
 rec['boyut']=[2048,2048];rec['ortalama_rgb']=np.array(im.resize((64,64))).mean((0,1)).round(2).tolist()
(C/'doku-dogrulama.json').write_text(json.dumps(a,ensure_ascii=False,indent=1),encoding='utf-8');print('[web] DOKU 2048',len(a))
