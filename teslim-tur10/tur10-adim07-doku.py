from pathlib import Path
import cv2,numpy as np,json,random,copy,hashlib
from PIL import Image,ImageDraw
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');T=Path(r'C:\Users\yigit\angora-tur9');A=W/'adim07';A.mkdir(exist_ok=True)
spec=json.loads((T/'dokular.json').read_text(encoding='utf-8'));by={r['no']:r for r in spec}
# Individually selected clear board centers, not a regular grid spanning joints.
points29=[(50,990),(90,1040),(145,1080),(195,1000),(225,1090),(270,950),(295,1060),(335,1130),(365,980),(390,1080),(428,1120),(455,990),(490,1100),(532,980),(550,1080),(589,1120),(610,970),(628,1045),(657,1145),(674,990),(700,1090),(720,965),(740,1040),(770,1140),(789,1000),(750,900),(710,930),(678,915),(628,895),(600,950)]
points34=[(75,1050),(115,980),(158,1100),(205,935),(245,1035),(290,1140),(335,1010),(365,1120),(415,1000),(455,1090),(505,1000),(545,1135),(590,1000),(625,1080)]
pal=[];meta=[]
for n,points,wb in [(29,points29,(.28,.04,.38,.09)),(34,points34,(.45,.05,.55,.10))]:
 im=np.array(Image.open(R/'photogallery'/f'angora_{n:02}.jpg').convert('RGB'),dtype=np.float32);h,w=im.shape[:2];x,y,X,Y=wb;white=np.median(im[int(y*h):int(Y*h),int(x*w):int(X*w)].reshape(-1,3),0);gain=white.mean()/white
 # Low frequency illumination removal on luminance only; keep individual board contrast.
 illum=cv2.GaussianBlur(im.mean(2),(0,0),100);ref=np.median([illum[y,x] for x,y in points]);overlay=Image.fromarray(im.astype('uint8'));d=ImageDraw.Draw(overlay)
 for x,y in points:
  p=im[y-5:y+6,x-5:x+6];rgb=p.mean((0,1))*gain*np.clip(ref/illum[y,x],.75,1.3);pal.append(rgb);meta.append({'foto':n,'merkez_px':[x,y],'roi_px':[x-5,y-5,x+6,y+6],'ortalama_rgb_wb':rgb.tolist(),'wb_rgb':white.tolist()});d.rectangle((x-5,y-5,x+5,y+5),outline='cyan',width=2);d.text((x+6,y-6),str(len(meta)),fill='cyan')
 overlay.save(A/f'renk_ornekleri_{n}.jpg',quality=95)
pal=np.array(pal);old=np.array(Image.open(T/'malzeme-dokulari/03_parke/albedo.png'),dtype=float);oldmedian=np.median(old.reshape(-1,3)[::17],0)
# Preserve the accepted distant median color; photographic board-to-board distribution remains.
pal*=oldmedian/np.median(pal,0)
# Remove residual cool specular contamination, preserve sampled luminance spread.
pal[:,1]=np.clip(pal[:,1],pal[:,0]*.43,pal[:,0]*.72)
pal[:,2]=np.minimum(pal[:,2],pal[:,1]*.82)
pal=pal[(pal[:,0]>=np.percentile(pal[:,0],20)) & (pal[:,1]/pal[:,0]>.46)]
stock=np.array(Image.open(A/'european_walnut_veneer_05_diff_4k.jpg').convert('RGB'),dtype=np.float32);gray=cv2.cvtColor(stock,cv2.COLOR_RGB2GRAY)
N=4096;rows=48;edges=np.round(np.linspace(0,N,rows+1)).astype(int);rng=random.Random(60260928);atlas=np.zeros((N,N,3),np.float32);height=np.zeros((N,N),np.float32);layout=[]
def grain(w,h,color):
 # Different high resolution source rectangle for every plank; source grain is horizontal.
 sw=rng.randint(650,1500);sh=rng.randint(120,240);x=rng.randrange(gray.shape[1]-sw);y=rng.randrange(gray.shape[0]-sh);g=cv2.resize(gray[y:y+sh,x:x+sw],(w,h),interpolation=cv2.INTER_AREA)
 if rng.random()<.5:g=g[:,::-1]
 # Histogram matching: empirical rank of stock luminance -> narrow photo-color distribution.
 vals,inv,count=np.unique(g,return_inverse=True,return_counts=True);cdf=(np.cumsum(count)-.5*count)/g.size
 quant=np.interp(cdf,[0,.02,.1,.25,.5,.75,.9,.98,1],[.82,.87,.92,.96,1,1.035,1.07,1.11,1.14]);detail=quant[inv].reshape(h,w);detail/=np.median(detail)
 return color[None,None,:]*detail[:,:,None],detail,(x,y,sw,sh)
for row in range(rows):
 y0,y1=edges[row:row+2];h=y1-y0;off=rng.randrange(N);x=0
 while x<N:
  width=min(rng.randint(270,680),N-x)
  if N-x-width<200:width=N-x
  idx=rng.randrange(len(pal));tile,detail,source=grain(width,h,pal[idx]);xx=(np.arange(width)+x+off)%N
  # Joints differ by row. No shared vertical atlas boundary.
  tile[:1]*=.60;tile[:,:1]*=.60;atlas[y0:y1,xx]=tile
  ht=(detail-1)*.009;ht[:1]=-.018;ht[:,:1]=-.018;height[y0:y1,xx]=ht
  layout.append({'sira':row,'x':int((x+off)%N),'boy_px':width,'renk_ornegi':idx+1,'stok_kesiti':source});x+=width
# Only horizontal boundary is a normal row joint. Periodic derivative across both axes.
dx=(np.roll(height,-1,1)-np.roll(height,1,1))*.5;dy=(np.roll(height,-1,0)-np.roll(height,1,0))*.5
normal=np.stack([-dx*2,-dy*2,np.ones_like(dx)],2);normal/=np.linalg.norm(normal,axis=2,keepdims=True);normal=(normal*.5+.5)*255
rough=np.clip(.44-height*.7,.36,.49)
def save(folder,a,n,r):
 folder.mkdir(exist_ok=True,parents=True)
 for name,arr in [('albedo',a),('normal',n),('roughness',r*255)]:
  im=Image.fromarray(np.uint8(np.clip(arr,0,255)));im.save(folder/(name+'.png'));im.save(folder/(name+'.jpg'),quality=97)
save(T/'malzeme-dokulari/03_parke',atlas,normal,rough)
by[3].update(doku_olcusu_xy_m=[4.8,4.32],doku_olcusu_m=4.,normal_siddeti=.22,purluluk=.44,kaynak='Renk foto29/34, 44 tahta; damar Poly Haven european_walnut_veneer_05 4K',renk_hex=None)
# Continuous full-width walnut for tread/riser and handrail; no parquet joints.
for no,scale in [(10,[1.2,.30])]:
 folder=T/'malzeme-dokulari'/by[no]['klasor'];prev=np.array(Image.open(folder/'albedo.png'),dtype=float);tone=np.median(pal,0)
 if no==15:tone*=np.array([1.42,1.23,1.0]) # photo34 wood ROI 54.5,41.2,25.3 vs render38.8,34.9,27.5
 tile,det,source=grain(4096,1024,tone);tile=cv2.resize(tile,(4096,4096));det=cv2.resize(det,(4096,4096));gx=(np.roll(det,-1,1)-np.roll(det,1,1))*.008;gy=(np.roll(det,-1,0)-np.roll(det,1,0))*.008
 nm=np.stack([-gx,-gy,np.ones_like(gx)],2);nm/=np.linalg.norm(nm,axis=2,keepdims=True)
 save(folder,tile,(nm*.5+.5)*255,np.clip(.25+(1-det)*.015,.23,.28));by[no].update(doku_olcusu_xy_m=scale,normal_siddeti=.10,purluluk=.25,kaynak='Fotoğraf tonu + Poly Haven european_walnut_veneer_05 4K damar',ahsap_tek_parca=True)
Image.fromarray(np.uint8(np.clip(np.tile(atlas,(2,2,1)),0,255))).save(A/'parke_2x2.jpg',quality=95)
Image.fromarray(np.uint8(np.clip(np.roll(atlas,(2048,2048),(0,1)),0,255))).save(A/'parke_kaydir.jpg',quality=95)
report={'renk_ornekleri':meta,'yerlesim':layout,'doku_m':[4,3.84],'tahta_en_m':.08,'tahta_boy_m':[.264,.664],'olcu_yontemi':'Foto29/34 kapı yaklaşık .85m; perspektifli en/boy oranı, yerinde ölçüm yok; emin_degil=true','emin_degil':True,'stok':'https://polyhaven.com/a/european_walnut_veneer_05','stok_md5':hashlib.md5((A/'european_walnut_veneer_05_diff_4k.jpg').read_bytes()).hexdigest(),'lisans':'CC0','renk_medyan_koruma':oldmedian.tolist(),'ortak_dikey_derz':False}
spec=[r for r in spec if r['no']!=19]
c=copy.deepcopy(by[3]);c.update(no=19,yuzey='çatı katı dar kısa parke',doku_olcusu_xy_m=[3.,2.88],kutular=[{'min':[-100,-100,9.40],'max':[100,100,9.60]}]);spec.append(c)
report['kat_olcekleri']={'cati':{'doku_m':[3,2.88],'tahta_en_m':.06,'boy_m':[.20,.50]},'ust':{'doku_m':[4.8,4.32],'tahta_en_m':.09,'boy_m':[.32,.80]}}
(A/'parke-uretim.json').write_text(json.dumps(report,ensure_ascii=False,indent=1),encoding='utf-8');(T/'dokular.json').write_text(json.dumps(spec,ensure_ascii=False,indent=1),encoding='utf-8');(W/'dokular.json').write_bytes((T/'dokular.json').read_bytes());print('[adim07]',len(meta),'tahta rengi;',len(layout),'tahta; 4096px')
