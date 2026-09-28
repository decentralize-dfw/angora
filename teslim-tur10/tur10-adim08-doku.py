from pathlib import Path
import json,cv2,numpy as np,shutil
from PIL import Image,ImageDraw
R=Path(r"C:\Users\yigit\Downloads\angora-main (2)\angora-main");W=Path(r"C:\Users\yigit\angora-tur10");T=Path(r"C:\Users\yigit\angora-tur9");A=W/'adim08';spec=json.loads((T/'dokular.json').read_text(encoding='utf-8'));spec=[r for r in spec if r['no']<20];measure=[]
def sample(n,roi,white):
 p=next((R/'photogallery').glob(f'angora_{n:02}.*'));im=np.array(Image.open(p).convert('RGB'),float);h,w=im.shape[:2]
 def crop(r):x,y,X,Y=r;return im[int(y*h):int(Y*h),int(x*w):int(X*w)]
 wb=np.median(crop(white).reshape(-1,3),0);rgb=np.median(crop(roi).reshape(-1,3),0)*wb.mean()/wb;measure.append(dict(foto=n,roi=roi,beyaz_roi=white,foto_rgb=rgb.tolist()));return rgb
# Regions on photographed wood, separate white ceiling references.
colors={'ceviz':sample(16,(.06,.28,.09,.67),(.44,.01,.55,.04)), 'kiraz':sample(21,(.47,.24,.52,.36),(.35,.04,.6,.09)), 'mese':sample(1,(.74,.72,.77,.89),(.55,.05,.70,.12)), 'wenge':sample(18,(.78,.40,.80,.63),(.58,.02,.65,.07))}
assets={'ceviz':'european_walnut_veneer_05','kiraz':'cherry_veneer','mese':'oak_veneer_01','wenge':'black_oak_veneer'}
for label,asset in assets.items():
 src=A/'stok'/asset;folder=T/'malzeme-dokulari'/('A08_'+label);folder.mkdir(exist_ok=True)
 im=np.array(Image.open(src/'albedo.jpg').convert('RGB'),np.float32);gray=cv2.cvtColor(im,cv2.COLOR_RGB2GRAY);detail=np.clip(gray/(cv2.GaussianBlur(gray,(0,0),45)+1),.65,1.35)
 tone=np.clip(colors[label]*.60,12,190);out=detail[:,:,None]*tone
 if label=='mese':out=np.rot90(out)
 Image.fromarray(np.uint8(np.clip(out,0,255))).save(folder/'albedo.png');Image.fromarray(np.uint8(np.clip(out,0,255))).save(folder/'albedo.jpg',quality=96)
 normal=np.array(Image.open(next(src.glob('normal.*'))).convert('RGB'))
 if label=='mese':normal=np.rot90(normal).copy();r=normal[:,:,0].copy();normal[:,:,0]=255-normal[:,:,1];normal[:,:,1]=r
 Image.fromarray(normal).save(folder/'normal.jpg',quality=97)
 rough=np.array(Image.open(next(src.glob('roughness.*'))).convert('L'),float)/255;rough=np.clip(.52+(rough-np.median(rough))*.12,.42,.64)
 Image.fromarray(np.uint8(rough*255)).save(folder/'roughness.jpg',quality=97)
 shutil.copy2(src/'kaynak.json',folder/'kaynak.json')
def rec(no,label,mats,boxes=None,**kw):
 r=dict(no=no,yuzey=label,malzemeler=mats,klasor='A08_'+label,doku_olcusu_xy_m=[1,1],doku_olcusu_m=1,purluluk=.52,normal_siddeti=.16,clearcoat=0,renk_hex=None,ahsap_uzun_kenar=True,kaynak='Fotoğraf WB ölçümü + Poly Haven 4K',lisans='CC0');r.update(kw)
 if boxes:r['kutular']=[dict(min=a,max=b) for a,b in boxes]
 spec.insert(0,r);return r
rec(20,'ceviz',['wood_honey'],[([.2,3.3,6.35],[2.6,5.9,8.85])])
rec(21,'kiraz',['wood_honey'],[([-6.5,-4.4,3.1],[-1.8,.1,5.8])])
rec(22,'mese',['Simple wood','wood_honey','R31 | R33 antique nook walnut'],[([-6,-.2,.02],[-2,4.2,2.5])])
rec(23,'ceviz',['wood_honey'],[([3.2,-4.2,3.09],[3.7,-2.4,6.0])])
# Generic mirror material and measured front panel boxes, preserving timber margins.
rec(24,'ayna',['FINISH | Silver mirror','A08_Ayna'],None,purluluk=.025,normal_siddeti=0,mirror=True,ahsap_uzun_kenar=False)
rec(25,'ayna',['wood_honey'],[([3.325,y+.04,3.22],[3.37,Y-.04,5.76]) for y,Y in [(-3.965,-3.559),(-3.485,-3.079),(-3.005,-2.599)]],purluluk=.025,normal_siddeti=0,mirror=True,ahsap_uzun_kenar=False)
# One seamless tile surface; photographic colors, stock fine clay relief.
src=np.array(Image.open(A/'stok/terracotta_floor_tiles/albedo.jpg').convert('RGB'),np.float32);patch=src[120:680,120:680];g=cv2.cvtColor(patch,cv2.COLOR_RGB2GRAY);g=cv2.resize(g,(1024,1024));g=g/(cv2.GaussianBlur(g,(0,0),70)+1);g=np.clip(g,.85,1.15)
terr=sample(1,(.09,.85,.20,.94),(.55,.05,.70,.12))*.72;cream=sample(32,(.62,.90,.69,.96),(.35,.01,.50,.04))*.72
for label,tone,roughness in [('terrakota',terr,.5),('seramik',cream,.4)]:
 folder=T/'malzeme-dokulari'/('A08_'+label);folder.mkdir(exist_ok=True)
 # 4x4 individually reflected/rolled stock patches, periodic grout at all four edges.
 atlas=np.zeros((4096,4096,3),np.float32);rng=np.random.default_rng(808)
 for y in range(4):
  for x in range(4):
   det=np.roll(g,(y*133,x*179),(0,1));tile=det[:,:,None]*tone*(1+rng.uniform(-.035,.035));tile[:5]=tone*.66;tile[-5:]=tone*.66;tile[:,:5]=tone*.66;tile[:,-5:]=tone*.66;atlas[y*1024:(y+1)*1024,x*1024:(x+1)*1024]=tile
 Image.fromarray(np.uint8(np.clip(atlas,0,255))).save(folder/'albedo.png');Image.fromarray(np.uint8(np.clip(atlas,0,255))).save(folder/'albedo.jpg',quality=96)
 h=cv2.cvtColor(atlas,cv2.COLOR_RGB2GRAY);dx=(np.roll(h,-1,1)-np.roll(h,1,1))*.0005;dy=(np.roll(h,-1,0)-np.roll(h,1,0))*.0005;nm=np.stack([-dx,-dy,np.ones_like(h)],2);nm/=np.linalg.norm(nm,axis=2,keepdims=True);Image.fromarray(np.uint8((nm*.5+.5)*255)).save(folder/'normal.jpg',quality=97);Image.new('L',(4096,4096),round(roughness*255)).save(folder/'roughness.jpg')
rec(26,'terrakota',['terra_floor','A08_Terrakota'],[([-100,-100,-.1],[100,100,.15])],ahsap_uzun_kenar=False,doku_olcusu_xy_m=[1.32,1.32],uv_aci=45,normal_siddeti=.12)
rec(27,'seramik',['R31 | R33 master pale cream tile','A08_Krem_bordur'],None,ahsap_uzun_kenar=False,doku_olcusu_xy_m=[1.2,1.2],normal_siddeti=.08,purluluk=.4)
# Small patterned bathroom border, photographed beige/brown mosaic color family.
folder=T/'malzeme-dokulari/A08_bordur';folder.mkdir(exist_ok=True);im=Image.new('RGB',(1024,128),(152,134,107));d=ImageDraw.Draw(im)
for x in range(0,1024,64):
 d.rectangle((x,0,x+63,127),outline=(205,189,163),width=3);d.polygon([(x+32,20),(x+52,64),(x+32,108),(x+12,64)],fill=(112,94,70));d.ellipse((x+26,51,x+38,77),fill=(205,189,163))
im.resize((4096,512)).save(folder/'albedo.jpg',quality=96)
rec(28,'bordur',['R31 | R33 master fine mosaic band'],None,ahsap_uzun_kenar=False,doku_olcusu_xy_m=[.64,.08],normal_siddeti=0,purluluk=.4)
(T/'dokular.json').write_text(json.dumps(spec,ensure_ascii=False,indent=1),encoding='utf-8');(W/'dokular.json').write_bytes((T/'dokular.json').read_bytes());(A/'renk-olculeri.json').write_text(json.dumps(measure,ensure_ascii=False,indent=1),encoding='utf-8');print('[A08-doku]',len(measure),'fotoğraf ölçümü; 4 ahşap, 2 karo, 1 bordür')
