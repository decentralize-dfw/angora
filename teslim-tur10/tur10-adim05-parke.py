from pathlib import Path
import numpy as np,cv2,json,random,copy
from PIL import Image,ImageDraw
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');T=Path(r'C:\Users\yigit\angora-tur9');out=W/'adim05';out.mkdir(exist_ok=True)
spec=json.loads((T/'dokular.json').read_text(encoding='utf-8'));by={r['no']:r for r in spec}
old=np.array(Image.open(T/'malzeme-dokulari/03_parke/albedo.jpg'));Image.fromarray(old).save(out/'parke_eski_albedo_kanit.jpg')
quads=[(29,[(192,910),(220,915),(61,1048),(34,1041)]),(29,[(280,938),(304,943),(111,1139),(82,1131)]),(29,[(343,963),(363,970),(235,1148),(211,1142)]),(29,[(423,1039),(446,1040),(377,1179),(348,1179)]),(29,[(530,1069),(554,1074),(511,1184),(486,1181)]),(29,[(668,1013),(690,1016),(677,1167),(651,1165)]),(18,[(1180,1000),(1203,1008),(1075,1115),(1050,1106)]),(18,[(1310,1010),(1335,1020),(1170,1180),(1140,1168)])]
sources=[];meta=[]
for i,(n,q) in enumerate(quads):
 im=np.array(Image.open(R/'photogallery'/f'angora_{n:02}.jpg').convert('RGB'))
 # Tahtanın kısa kenarı 128, uzun kenarı 1024 piksel: lif boyunca tek tahta.
 a=cv2.warpPerspective(im,cv2.getPerspectiveTransform(np.float32(q),np.float32([(0,0),(127,0),(127,1023),(0,1023)])),(128,1024)).astype(np.float32)
 rois=[(.26,.035,.39,.085),(.12,.30,.23,.40)] if n==29 else [(.39,.10,.45,.15),(.65,.20,.72,.27)]
 vals=[]
 for x0,y0,x1,y1 in rois:
  h,w=im.shape[:2];vals.append(np.median(im[int(y0*h):int(y1*h),int(x0*w):int(x1*w)].reshape(-1,3),axis=0))
 white=np.mean(vals,axis=0);gain=white.mean()/np.maximum(white,1);a*=gain
 blur=cv2.GaussianBlur(a.mean(2),(0,0),45);a*=np.clip(np.median(blur)/np.maximum(blur,5),.65,1.55)[:,:,None]
 # Parlama pikseli bırakılmaz; çok açık düşük kromalı bölgeler yerel renk ile inpaint.
 lum=a.mean(2);mask=((lum>np.percentile(lum,98.5)) & ((a.max(2)-a.min(2))<12)).astype(np.uint8)*255
 if mask.any():a=cv2.inpaint(np.uint8(np.clip(a,0,255)),mask,3,cv2.INPAINT_TELEA).astype(np.float32)
 a=cv2.resize(a[600:850,12:116],(128,1024),interpolation=cv2.INTER_CUBIC)
 a=np.clip(a,0,255);sources.append(a.transpose(1,0,2))
 Image.fromarray(a.astype('uint8')).save(out/f'tahta_{i+1:02}.jpg',quality=97)
 meta.append({'no':i+1,'foto':n,'koseler':q,'duvar_tavan_roi':rois,'beyaz_rgb':white.tolist(),'gain':gain.tolist()})
# 32 sıra x 12.5 cm = 4m. Boylar .50/.75/1/1.25m; fiziksel ölçüler kapı ölçeğine göre yaklaşık.
rng=random.Random(20260928);N=4096;rowh=128;unit=256
atlas=np.zeros((N,N,3),np.float32);height=np.zeros((N,N),np.float32);layout=[]
for row in range(32):
 remain=16;lengths=[]
 while remain:
  choices=[v for v in [2,3,4,5] if v<=remain and remain-v!=1]
  v=rng.choice(choices or [remain]);lengths.append(v);remain-=v
 x=0
 for units in lengths:
  width=units*unit;idx=rng.randrange(8);shift=rng.randrange(1024);src=np.roll(sources[idx],shift,axis=1)
  if rng.random()<.5:src=src[:,::-1]
  tile=cv2.resize(src,(width,rowh),interpolation=cv2.INTER_CUBIC)
  # Kenarda başka tahta/parlama yok; ince koyu derz, aynı yerleşimde yükseklik ve pürüz.
  atlas[row*rowh:(row+1)*rowh,x:x+width]=tile
  grey=tile.mean(2);height[row*rowh:(row+1)*rowh,x:x+width]=.005*(grey-grey.mean())/max(grey.std(),1)
  atlas[row*rowh:row*rowh+2,x:x+width]=[32,21,15];atlas[row*rowh:(row+1)*rowh,x:x+2]=[32,21,15]
  height[row*rowh:row*rowh+2,x:x+width]=-.015;height[row*rowh:(row+1)*rowh,x:x+2]=-.015
  layout.append({'sira':row,'x_px':x,'boy_px':width,'kaynak':idx+1,'kaydir_px':shift});x+=width
# Periyodik kenarlar aynı ince derze düşer; karşı uç pikseller birebir aynıdır.
atlas[-2:]=atlas[:2];atlas[:,-2:]=atlas[:,:2];height[-2:]=height[:2];height[:,-2:]=height[:,:2]
dx=(np.roll(height,-1,1)-np.roll(height,1,1))*.5;dy=(np.roll(height,-1,0)-np.roll(height,1,0))*.5
normal=np.stack([-dx*2,-dy*2,np.ones_like(dx)],2);normal/=np.linalg.norm(normal,axis=2,keepdims=True);normal=(normal*.5+.5)*255
rough=np.clip(.425+(height-height.mean())*.6,.35,.5)
for arr in [normal,rough]:arr[-1]=arr[0];arr[:,-1]=arr[:,0]
def write(folder,albedo,roughness=rough,norm=normal):
 folder.mkdir(parents=True,exist_ok=True)
 Image.fromarray(np.uint8(np.clip(albedo,0,255))).save(folder/'albedo.jpg',quality=98,subsampling=0)
 Image.fromarray(np.uint8(np.clip(albedo,0,255))).save(folder/'albedo.png')
 Image.fromarray(np.uint8(roughness*255)).save(folder/'roughness.jpg',quality=98)
 Image.fromarray(np.uint8(roughness*255)).save(folder/'roughness.png')
 Image.fromarray(np.uint8(norm)).save(folder/'normal.jpg',quality=98,subsampling=0)
 Image.fromarray(np.uint8(norm)).save(folder/'normal.png')
for no in [3,10]:
 rec=by[no];write(T/'malzeme-dokulari'/rec['klasor'],atlas)
 rec.update(kaynak='foto_29 + foto_18; 8 ayrı tahta',doku_olcusu_m=4.,doku_olcusu_xy_m=[4.,4.],normal_siddeti=.15,purluluk=.425,renk_hex=None)
 rec['adim05']={'tahta_en_m':.125,'boylar_m':[.5,.75,1.,1.25],'yaklasik_olcu':True,'tohum':20260928,'kaynaklar':meta,'yerlesim':layout}
for rec in spec:rec['malzemeler']=list(dict.fromkeys(rec['malzemeler']))
by[9]['malzemeler']=[m for m in by[9]['malzemeler'] if m!='M2_Koyu_ceviz_kupeşte']
by[10]['malzemeler']=[m for m in by[10]['malzemeler'] if m!='M1_Sicak_ceviz_supurgelik']
spec=[r for r in spec if r['no']<15]
def new(no,name,mats,bounds,tone):
 rec=copy.deepcopy(by[3]);rec.update(no=no,klasor=name,yuzey=name,malzemeler=mats,normal_siddeti=.10,doku_olcusu_xy_m=[4.,4.])
 if bounds:rec['kutular']=[{'min':bounds[0],'max':bounds[1]}]
 a=atlas.copy();a*=np.array(tone)/np.maximum(a.mean((0,1)),1)
 write(T/'malzeme-dokulari'/name,a);spec.append(rec)
new(15,'15_kupeste',['M2_Koyu_ceviz_kupeşte'],None,[92,57,33])
new(16,'16_giris_ceviz',by[9]['malzemeler']+['M1_Sicak_ceviz_supurgelik'],([-100,-100,2.95],[100,100,6.0]),[87,51,30])
new(17,'17_ust_supurgelik',['M1_Sicak_ceviz_supurgelik'],([-100,-100,6.0],[100,100,13]),[24,22,20])
new(18,'18_bodrum_supurgelik',['M1_Sicak_ceviz_supurgelik'],([-100,-100,-1],[100,100,2.95]),[87,51,30])
# Kiraz dolap: mevcut fotoğraf albedosu korunur, matlık yükselir.
by[5]['purluluk']=.65;by[5]['clearcoat']=0
Image.fromarray(np.full((512,512),166,np.uint8)).save(T/'malzeme-dokulari/05_dolap/roughness.jpg',quality=98)
Image.fromarray(np.uint8(np.clip(np.tile(atlas,(2,2,1)),0,255))).save(out/'parke_2x2.jpg',quality=92)
Image.fromarray(np.uint8(np.clip(np.roll(atlas,(N//2,N//2),(0,1)),0,255))).save(out/'parke_kaydir.jpg',quality=95)
report={'neden':'Eski albedo kenarında fotoğraftan kalan mavi-beyaz parlama doğrudan görünür. Normal zaten Non-Color idi; stok normalin derz düzeni ayrıca albedoyla uyuşmuyordu.','normal_renk_ayari':'Non-Color','normal_gucu':.15,'roughness_aralik':[float(rough.min()),float(rough.max())],'tahta_sayisi':len(layout),'farkli_kaynak':8,'kenar_max_fark':float(max(abs(atlas[0]-atlas[-1]).max(),abs(atlas[:,0]-atlas[:,-1]).max()))}
# İlk/son iki pikselin sırası aynı değilse gerçek sınır çiftini de eşitle.
for no in [3,10,15,16,17,18]:
 p=T/'malzeme-dokulari'/next(r for r in spec if r['no']==no)['klasor']/'albedo.jpg'
 # JPEG kayıplı olabilir: rapor örneklenmiş piksel farkını ayrıca kaydeder.
 a=np.array(Image.open(p));report[f'jpeg_kenar_farki_{no}']=int(max(abs(a[0].astype(int)-a[-1]).max(),abs(a[:,0].astype(int)-a[:,-1]).max()))
(out/'parke-uretim.json').write_text(json.dumps({'kontrol':report,'kaynaklar':meta,'yerlesim':layout},ensure_ascii=False,indent=1),encoding='utf-8')
(T/'dokular.json').write_text(json.dumps(spec,ensure_ascii=False,indent=1),encoding='utf-8');(W/'dokular.json').write_bytes((T/'dokular.json').read_bytes())
print(json.dumps(report,ensure_ascii=False))
