from pathlib import Path
import numpy as np,cv2,json
from PIL import Image
W=Path(r'C:\Users\yigit\angora-tur10');A=W/'adim08';T=Path(r'C:\Users\yigit\angora-tur9')
ms=json.loads((A/'renk-olculeri.json').read_text(encoding='utf-8'))
def sample(n,roi,white):return np.array(next(r['foto_rgb'] for r in ms if r['foto']==n and r['roi']==list(roi)))
src=np.array(Image.open(A/'stok/terracotta_floor_tiles/albedo.jpg').convert('RGB'),np.float32);patch=src[64:360,64:360];g=cv2.cvtColor(patch,cv2.COLOR_RGB2GRAY);g=cv2.resize(g,(1024,1024));g=g/(cv2.GaussianBlur(g,(0,0),70)+1);g=np.clip(g,.85,1.15)
terr=sample(1,(.09,.85,.20,.94),(.55,.05,.70,.12))*.72;cream=sample(32,(.70,.86,.79,.93),(.35,.01,.50,.04))*.72
for label,tone,roughness in [('terrakota',terr,.5),('seramik',cream,.4)]:
 folder=T/'malzeme-dokulari'/('A08_'+label);folder.mkdir(exist_ok=True)
 # 4x4 individually reflected/rolled stock patches, periodic grout at all four edges.
 atlas=np.zeros((4096,4096,3),np.float32);rng=np.random.default_rng(808)
 for y in range(4):
  for x in range(4):
   det=np.roll(g,(y*133,x*179),(0,1));tile=det[:,:,None]*tone*(1+rng.uniform(-.035,.035));tile[:5]=tone*.66;tile[-5:]=tone*.66;tile[:,:5]=tone*.66;tile[:,-5:]=tone*.66;atlas[y*1024:(y+1)*1024,x*1024:(x+1)*1024]=tile
 Image.fromarray(np.uint8(np.clip(atlas,0,255))).save(folder/'albedo.png');Image.fromarray(np.uint8(np.clip(atlas,0,255))).save(folder/'albedo.jpg',quality=96)
 h=cv2.cvtColor(atlas,cv2.COLOR_RGB2GRAY);dx=(np.roll(h,-1,1)-np.roll(h,1,1))*.0005;dy=(np.roll(h,-1,0)-np.roll(h,1,0))*.0005;nm=np.stack([-dx,-dy,np.ones_like(h)],2);nm/=np.linalg.norm(nm,axis=2,keepdims=True);Image.fromarray(np.uint8((nm*.5+.5)*255)).save(folder/'normal.jpg',quality=97);Image.new('L',(4096,4096),round(roughness*255)).save(folder/'roughness.jpg')
