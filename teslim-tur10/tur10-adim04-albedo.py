from pathlib import Path
import cv2,numpy as np,json,hashlib
from PIL import Image,ImageDraw
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');T=Path(r'C:\Users\yigit\angora-tur9')
spec=json.loads((T/'dokular.json').read_text(encoding='utf-8'));by={r['no']:r for r in spec}
before={n:hashlib.sha256((T/'malzeme-dokulari'/by[n]['klasor']/'albedo.jpg').read_bytes()).hexdigest() for n in [1,2,4]}
cuts={3:(34,[(59,924),(350,1010),(184,1195),(0,1129)],(.60,.65),[62,45,34]),9:(34,[(1360,506),(1374,508),(1374,650),(1360,655)],(.045,.42),[24,22,20]),10:(18,[(166,683),(471,645),(475,677),(158,718)],(1.0,.155),[70,51,37])}
for no,(photo,quad,size,tone) in cuts.items():
 im=np.array(Image.open(R/'photogallery'/f'angora_{photo:02}.jpg').convert('RGB'))
 a=cv2.warpPerspective(im,cv2.getPerspectiveTransform(np.float32(quad),np.float32([(0,0),(1023,0),(1023,1023),(0,1023)])),(1024,1024)).astype(np.float32)
 blur=cv2.GaussianBlur(a.mean(2),(0,0),80);a*=np.clip(np.median(blur)/np.maximum(blur,5),.5,2)[:,:,None]
 white=np.median(im[110:180,850:960].reshape(-1,3),axis=0);gain=white.mean()/np.maximum(white,1);a*=gain
 # Foto 34 koyu ceviz/wenge algısına göre nötr ton kalibrasyonu; sıcak ışık ikinci kez eklenmez.
 a*=np.array(tone)/np.maximum(a.mean((0,1)),1)
 for axis in [0,1]:
  v=np.swapaxes(a,0,axis)
  for k in range(64):
   t=(1-k/64)**2;avg=(v[k]+v[-1-k])/2;v[k]=v[k]*(1-t)+avg*t;v[-1-k]=v[-1-k]*(1-t)+avg*t
 rec=by[no];folder=T/'malzeme-dokulari'/rec['klasor'];Image.fromarray(np.uint8(np.clip(a,0,255))).save(folder/'albedo.jpg',quality=95)
 rec.update(kaynak=f'foto_{photo:02}',renk_hex=None,doku_olcusu_m=size[0],doku_olcusu_xy_m=list(size),emin_degil=True)
 rec['perspektif']={'piksel_koseleri':quad,'olcu_m':list(size),'olcum':'Fotoğraftan yaklaşık; saha ölçümü değil.'}
 rec['adim04']={'ton_hedef_rgb':tone,'beyaz_referans':[850,110,960,180],'yontem':'Perspektif, Gauss gradyan giderme, nötr beyaz dengesi, fotoğraf referansına göre koyu ton kalibrasyonu, kenar eşleme.'}
 rec['purluluk']=.52 if no==9 else .43
 rr=np.full((512,512),int(rec['purluluk']*255),np.uint8);Image.fromarray(rr).save(folder/'roughness.jpg',quality=95)
 marked=Image.fromarray(im);ImageDraw.Draw(marked).line(quad+[quad[0]],fill='red',width=4);marked.thumbnail((800,800));marked.save(W/'doku-inceleme'/f'adim04_{no:02}_kaynak.jpg')
 print('[adim04-doku]',no,rec['kaynak'],np.uint8(a.mean((0,1))).tolist())
for n,h in before.items():assert hashlib.sha256((T/'malzeme-dokulari'/by[n]['klasor']/'albedo.jpg').read_bytes()).hexdigest()==h
(W/'adim04-korunan-yuzeyler.json').write_text(json.dumps(before,indent=1),encoding='utf-8')
(T/'dokular.json').write_text(json.dumps(spec,ensure_ascii=False,indent=1),encoding='utf-8');(W/'dokular.json').write_bytes((T/'dokular.json').read_bytes())
p=W/'kamera-duzeltme.json';d=json.loads(p.read_text(encoding='utf-8'));d['40']={'dx':.06,'dy':-.504,'dz':0,'yaw':-2.2,'pitch':-3,'hfov':78};p.write_text(json.dumps(d,ensure_ascii=False,indent=1),encoding='utf-8')
