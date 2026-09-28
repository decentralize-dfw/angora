from pathlib import Path
import json, shutil, numpy as np, cv2
from PIL import Image,ImageDraw
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');T=Path(r'C:\Users\yigit\angora-tur9');A=W/'adim09'
rows=[]
def sample(n,name,roi,white):
 p=next((R/'photogallery').glob(f'angora_{n:02}.*'));im=np.array(Image.open(p).convert('RGB'),float);h,w=im.shape[:2]
 def get(r):x,y,X,Y=r;return im[int(y*h):int(Y*h),int(x*w):int(X*w)]
 rgb=np.median(get(roi).reshape(-1,3),0);wb=np.median(get(white).reshape(-1,3),0);fixed=rgb*(wb.mean()/wb)**.35
 rows.append(dict(foto=n,malzeme=name,roi=roi,beyaz_roi=white,ham_rgb=rgb.tolist(),rgb=fixed.tolist()));return fixed
dark=sample(11,'koyu ceviz',(.07,.77,.14,.88),(.54,.03,.65,.08))
sample(32,'koyu ceviz boy dolabi',(.29,.31,.34,.42),(.35,.04,.55,.09))
wenge=sample(18,'wenge kapi',(.78,.40,.80,.63),(.58,.02,.65,.07))
cherry=sample(21,'kiraz kapak',(.535,.34,.55,.40),(.35,.04,.6,.09))
cream=sample(32,'krem duvar seramigi',(.47,.36,.55,.42),(.35,.04,.55,.09))
red=sample(11,'kirmizi damali karo',(.69,.92,.708,.94),(.54,.03,.65,.08));ivory=sample(11,'beyaz damali karo',(.625,.90,.65,.918),(.54,.03,.65,.08))
for label,tone,src in [('koyu_ceviz',dark*1.7,'A08_ceviz'),('wenge',wenge,'A08_wenge'),('kiraz',cherry,'A08_kiraz')]:
 folder=T/'malzeme-dokulari'/('A09_'+label);folder.mkdir(exist_ok=True)
 im=np.array(Image.open(T/'malzeme-dokulari'/src/'albedo.png'),float);gray=im.mean(2);detail=np.clip(gray/(np.median(gray)+1),.65,1.35);out=detail[:,:,None]*tone*.63
 Image.fromarray(np.uint8(np.clip(out,0,255))).save(folder/'albedo.png');Image.fromarray(np.uint8(np.clip(out,0,255))).save(folder/'albedo.jpg',quality=96)
 for f in ['normal.jpg','roughness.jpg','kaynak.json']:
  q=T/'malzeme-dokulari'/src/f
  if q.exists():shutil.copy2(q,folder/f)
spec=json.loads((T/'dokular.json').read_text(encoding='utf-8'));spec=[r for r in spec if r['no']<31]
for r in spec:
 if r['no'] in [5,12,15,16,18,20,22,23]:r['klasor']='A09_koyu_ceviz';r['palet']='Koyu ceviz'
 if r['no'] in [9,17,30]:r['klasor']='A09_wenge';r['palet']='Wenge'
 if r['no']==21:r['klasor']='A09_kiraz';r['palet']='Kiraz'
 if r['no']==28:r['malzemeler'].append('A09_Banyo_bordur')
 if r['no']==27:r['doku_olcusu_xy_m']=[2.4,2.4]
def rec(no,label,mats,boxes=None,**kw):
 r=dict(no=no,yuzey=label,malzemeler=mats,klasor='A09_'+label,doku_olcusu_m=1,doku_olcusu_xy_m=[1,1],purluluk=.5,normal_siddeti=.12,ahsap_uzun_kenar=True,renk_hex=None);r.update(kw)
 if boxes:r['kutular']=[dict(min=a,max=b) for a,b in boxes]
 spec.insert(0,r)
rec(31,'koyu_ceviz',['wood_honey','R31 | R33 antique nook walnut'],[([.2,-4.2,6.35],[4.4,-.5,9.0]),([.1,6.7,6.35],[1.2,9.3,9.0])])
# Cream stock relief, neutral photographic cream; 4 tiles = 2.4m, each 60cm square.
folder=T/'malzeme-dokulari/A08_seramik';im=np.array(Image.open(folder/'albedo.png'),float);detail=im.mean(2)/(np.median(im.mean(2))+1);out=(1+(detail-1)*.15)[:,:,None]*cream
for k in range(4):
 for sl in [slice(k*1024,k*1024+5),slice((k+1)*1024-5,(k+1)*1024)]:out[sl,:,:]=cream*.83;out[:,sl,:]=cream*.83
Image.fromarray(np.uint8(np.clip(out,0,255))).save(folder/'albedo.png');Image.fromarray(np.uint8(np.clip(out,0,255))).save(folder/'albedo.jpg',quality=96)
# 2x2 alternating red/ivory tile, then real metre UV rotates it by 45 degrees.
folder=T/'malzeme-dokulari/A09_dama';folder.mkdir(exist_ok=True);im=np.zeros((2048,2048,3),float);rng=np.random.default_rng(9)
for y in range(2):
 for x in range(2):
  tone=(red if (x+y)%2 else ivory)*.75;tile=np.ones((1024,1024,3))*tone;noise=cv2.GaussianBlur(rng.normal(0,.025,(1024,1024)),(0,0),2);tile*=1+noise[:,:,None];tile[:3]=tone*.8;tile[-3:]=tone*.8;tile[:,:3]=tone*.8;tile[:,-3:]=tone*.8;im[y*1024:(y+1)*1024,x*1024:(x+1)*1024]=tile
Image.fromarray(np.uint8(np.clip(im,0,255))).save(folder/'albedo.jpg',quality=96);Image.new('L',(2048,2048),115).save(folder/'roughness.jpg')
rec(32,'dama',['R31 | Shared bathroom red tile','R31 | Shared bathroom ivory tile','RR','WHT.001','terra_floor','stone_tile','R31 | R33 ivory wall ceramic'],[([1.5,-4.3,6.35],[4.5,-.4,6.40])],ahsap_uzun_kenar=False,doku_olcusu_xy_m=[.6,.6],uv_aci=45,normal_siddeti=0)
(T/'dokular.json').write_text(json.dumps(spec,ensure_ascii=False,indent=1),encoding='utf-8');(W/'dokular.json').write_bytes((T/'dokular.json').read_bytes())
for n in set(r['foto'] for r in rows):
 im=Image.open(next((R/'photogallery').glob(f'angora_{n:02}.*'))).convert('RGB');dr=ImageDraw.Draw(im);w,h=im.size
 for r in rows:
  if r['foto']!=n:continue
  x,y,X,Y=[int(v*s) for v,s in zip(r['roi'],[w,h,w,h])];dr.rectangle((x,y,X,Y),outline='red',width=5);dr.text((max(0,x-50),max(0,y-18)),r['malzeme']+' '+str([round(v) for v in r['rgb']]),fill='red',stroke_width=1)
 im.save(A/f'olcum_{n:02}.jpg',quality=96)
(A/'palet-olcumleri.json').write_text(json.dumps(rows,ensure_ascii=False,indent=1),encoding='utf-8');print('PALET',[(r['malzeme'],r['rgb']) for r in rows])
