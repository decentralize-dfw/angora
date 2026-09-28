from pathlib import Path
from PIL import Image
import numpy as np,cv2,json,sys
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');T=Path(r'C:\Users\yigit\angora-tur9')
rows=[('parke',29,3,(.1,.80,.27,.93),(.1,.76,.29,.90)),('parke',18,3,(.80,.86,.96,.96),(.84,.82,.98,.95)),('parke',34,3,(.10,.83,.26,.95),(.13,.78,.28,.90)),('kapi_ust',34,9,(.85,.43,.865,.62),(.895,.43,.918,.61)),('kapi_giris',40,16,(.758,.37,.769,.70),(.620,.38,.637,.70)),('merdiven',18,10,(.145,.69,.255,.72),(.16,.63,.26,.66)),('kupeste',34,15,(.49,.637,.53,.65),(.535,.716,.55,.728)),('mutfak_dolabi',21,5,(.52,.33,.55,.43),(.56,.33,.58,.43)),('karo',42,4,(.50,.86,.66,.95),(.52,.86,.68,.95))]
wb={29:[(.27,.04,.38,.09),(.12,.30,.22,.40)],18:[(.39,.1,.45,.15),(.65,.2,.72,.27)],34:[(.45,.05,.55,.10),(.76,.29,.80,.38)],40:[(.48,.04,.60,.1),(.85,.3,.95,.4)],21:[(.4,.06,.5,.1),(.05,.20,.13,.30)],42:[(.35,.05,.45,.10),(.70,.22,.80,.30)]}
def crop(a,r):
 h,w=a.shape[:2];x,y,X,Y=r;return a[int(y*h):int(Y*h),int(x*w):int(X*w)]
def measure(p,r,whites):
 a=np.array(Image.open(p).convert('RGB'),dtype=np.float32);white=np.mean([np.median(crop(a,w).reshape(-1,3),axis=0) for w in whites],axis=0);gain=white.mean()/np.maximum(white,1)
 rgb=np.clip(np.median(crop(a,r).reshape(-1,3),axis=0)*gain,0,255);lab=cv2.cvtColor(np.float32([[rgb/255]]),cv2.COLOR_RGB2LAB)[0,0];return rgb,lab,white,gain
render_wb={21:[(.25,.03,.4,.08),(.47,.50,.50,.58)]}
rows=[r for r in rows if r[2] in [3,10,15]]
res=[]
for name,n,no,pr,rr in rows:
 a,al,aw,ag=measure(R/'photogallery'/f'angora_{n:02}.jpg',pr,wb[n]);b,bl,bw,bg=measure(W/'kontrol'/f'render_{n:02}.png',rr,render_wb.get(n,wb[n]));de=float(np.linalg.norm(al-bl))
 res.append(dict(malzeme=name,foto=n,no=no,foto_roi=pr,render_roi=rr,wb_roi=wb[n],foto_beyaz=aw.tolist(),render_beyaz=bw.tolist(),foto_rgb=a.round(1).tolist(),render_rgb=b.round(1).tolist(),deltaE76=round(de,2),durum='DÜZELTİLDİ' if de<=8 else 'KALDI'))
path=W/'adim06'/('renk-once.json' if '--duzelt' in sys.argv else 'renk-sonra.json');path.write_text(json.dumps(res,ensure_ascii=False,indent=1),encoding='utf-8')
if '--duzelt' in sys.argv:
 spec=json.loads((T/'dokular.json').read_text(encoding='utf-8'));gains={}
 for no in [3,10,15,16,5]:
  group=[r for r in res if r['no']==no and r['deltaE76']>8]
  if not group:continue
  gain=np.clip(np.median([np.array(r['foto_rgb'])/np.maximum(r['render_rgb'],1) for r in group],axis=0),.55,1.6);gains[no]=gain.tolist()
  rec=next(r for r in spec if r['no']==no);folder=T/'malzeme-dokulari'/rec['klasor'];p=folder/'albedo.png'
  if not p.exists():p=folder/'albedo.jpg'
  a=np.array(Image.open(p).convert('RGB'),dtype=np.float32)*gain;im=Image.fromarray(np.uint8(np.clip(a,0,255)));im.save(folder/'albedo.png');im.save(folder/'albedo.jpg',quality=98,subsampling=0)
 (W/'adim06/renk-duzeltme.json').write_text(json.dumps(gains,indent=1),encoding='utf-8')
 # Aynı son parke dokusundan tekrar testleri.
 a=np.array(Image.open(T/'malzeme-dokulari/03_parke/albedo.png'));Image.fromarray(np.tile(a,(2,2,1))).save(W/'adim06/parke_2x2.jpg',quality=92);Image.fromarray(np.roll(a,(2048,2048),(0,1))).save(W/'adim06/parke_kaydir.jpg',quality=95)
print(json.dumps(res,ensure_ascii=False))
