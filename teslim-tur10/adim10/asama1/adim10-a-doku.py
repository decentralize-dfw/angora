from pathlib import Path
import json,cv2,numpy as np,shutil
from PIL import Image,ImageDraw
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');T=Path(r'C:\Users\yigit\angora-tur9');A=W/'adim10';A.mkdir(exist_ok=True)
spec=json.loads((T/'dokular.json').read_text(encoding='utf-8'))
for r in spec:
 if r['no'] in [20,21]:r['klasor']='A08_ceviz' if r['no']==20 else 'A08_kiraz';r['kaynak']='Adım08 damarlı özgün doku';r['doku_olcusu_xy_m']=[1,1]
im=Image.open(R/'photogallery/angora_02.jpg').convert('RGB');a=np.array(im,float);h,w=a.shape[:2];roi=[.645,.765,.677,.798];white=[.36,.06,.44,.13]
def sample(r):x,y,X,Y=r;return np.median(a[int(y*h):int(Y*h),int(x*w):int(X*w)].reshape(-1,3),0)
wb=sample(white);raw=sample(roi);rgb=raw*(wb.mean()/wb)**.35
vis=im.copy();d=ImageDraw.Draw(vis);d.rectangle(tuple([roi[0]*w,roi[1]*h,roi[2]*w,roi[3]*h]),outline='red',width=5);d.text((20,20),'TERRAKOTA 02 / RGB '+str(np.round(rgb).astype(int).tolist()),fill='red');vis.save(A/'olcum_02.jpg',quality=96)
src=np.array(Image.open(W/'adim08/stok/terracotta_floor_tiles/albedo.jpg').convert('RGB'),np.float32);g=cv2.cvtColor(src,cv2.COLOR_RGB2GRAY);g=np.clip(g/(cv2.GaussianBlur(g,(0,0),45)+1),.72,1.35);tone=rgb*.72;out=np.clip(g[:,:,None]*tone,0,255).astype('uint8');folder=T/'malzeme-dokulari/A10_terrakota';folder.mkdir(exist_ok=True)
Image.fromarray(out).save(folder/'albedo.jpg',quality=97)
for name in ['normal.jpg','roughness.jpg']:shutil.copy2(T/'malzeme-dokulari/A08_terrakota'/name,folder/name)
for r in spec:
 if r['no']==26:r['klasor']='A10_terrakota';r['kaynak']='foto_02';r['uv_aci']=45;r['doku_olcusu_xy_m']=[1.32,1.32]
for p in [T/'dokular.json',W/'dokular.json']:p.write_text(json.dumps(spec,ensure_ascii=False,indent=1),encoding='utf-8')
(A/'renk-olculeri.json').write_text(json.dumps({'foto':2,'yuzey':'terrakota karo','roi':roi,'beyaz_roi':white,'ham_rgb':raw.tolist(),'wb_rgb':rgb.tolist()},ensure_ascii=False,indent=1),encoding='utf-8')
boxes=json.loads((W/'silme-kutulari.json').read_text(encoding='utf-8'));changes=[]
for b in boxes:
 if b['ad']=='M2_eski_basamak_ve_korkuluk':b['malzemeler']=['Simple wood'];changes.append(b['ad']+' metal kaldırıldı; basamak maskesi kaldı')
boxes=[b for b in boxes if b['ad']!='M2_eski_kupeşte_ve_pirinc'];changes.append('M2_eski_kupeşte_ve_pirinc iptal')
(W/'silme-kutulari.json').write_text(json.dumps(boxes,ensure_ascii=False,indent=1),encoding='utf-8');(A/'kutu-iptal.json').write_text(json.dumps(changes,ensure_ascii=False,indent=1),encoding='utf-8')
print('[A10] doku ve kutular hazır',rgb)
