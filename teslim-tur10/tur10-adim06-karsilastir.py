from pathlib import Path
import json,cv2,numpy as np,math,csv
from PIL import Image,ImageDraw,ImageFont,ImageOps
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');A=W/'adim06'
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',22)
# Recompute from saved camera/target explicitly; independent of Blender lazy transform updates.
kr=next(r for r in json.loads((A/'yakin-kameralar.json').read_text(encoding='utf-8')) if r['malzeme']=='parke');near_eye=np.array(kr['kamera']);forward=np.array(kr['hedef'])-near_eye;forward/=np.linalg.norm(forward);right=np.cross(forward,[0,0,1]);right/=np.linalg.norm(right);up=np.cross(right,forward)
pc=next(c for c in csv.DictReader(open(R/'docs/blender-ajan/foto-kameralari.csv',encoding='utf-8')) if c['id']=='29');fix=json.loads((W/'kamera-duzeltme.json').read_text(encoding='utf-8'))['29'];eye=np.array([float(pc[k])+fix.get(d,0) for k,d in [('blender_x','dx'),('blender_y','dy'),('blender_z','dz')]]);yaw=math.atan2(float(pc['bakis_y']),float(pc['bakis_x']))+math.radians(fix.get('yaw',0))-math.pi/2;a=math.pi/2+math.radians(fix.get('pitch',0));rot=np.array([[math.cos(yaw),-math.sin(yaw),0],[math.sin(yaw),math.cos(yaw),0],[0,0,1]])@np.array([[1,0,0],[0,math.cos(a),-math.sin(a)],[0,math.sin(a),math.cos(a)]]);t=math.tan(math.radians(fix['hfov'])/2);tn=math.tan(math.radians(42)/2);c=[]
for px,py in [(40,950),(750,950),(750,1190),(40,1190)]:
 ray=rot@np.array([(2*px/1600-1)*t,(1-2*py/1200)*t*.75,-1]);ground=eye+ray*(9.4705-eye[2])/ray[2];v=ground-near_eye;z=v@forward;dest=[(1+(v@right)/z/tn)*500,(1-(v@up)/z/tn/.8)*400];c.append({'foto_px':[px,py],'render_px':dest,'world':ground.tolist()})
(A/'es-olcek-homografi.json').write_text(json.dumps(c,indent=1),encoding='utf-8')
src=np.float32([r['foto_px'] for r in c]);dst=np.float32([r['render_px'] for r in c]);H=cv2.getPerspectiveTransform(src,dst)
photo=np.array(Image.open(R/'photogallery/angora_29.jpg').convert('RGB'));render=np.array(Image.open(A/'detay_parke.png').convert('RGB'));h,w=render.shape[:2];warped=cv2.warpPerspective(photo,H,(w,h));mask=np.zeros(photo.shape[:2],np.uint8);mask[950:1199,0:800]=255;mask=cv2.warpPerspective(mask,H,(w,h),flags=cv2.INTER_NEAREST)>254
# Largest shared rectangle, so both panels cover exactly the same projected floor footprint.
heights=np.zeros(w,int);best=(0,0,0,0,0)
for y in range(h):
 heights=np.where(mask[y],heights+1,0);stack=[]
 for x in range(w+1):
  cur=heights[x] if x<w else 0;start=x
  while stack and stack[-1][1]>cur:
   left,hh=stack.pop();area=(x-left)*hh
   if area>best[0]:best=(area,left,y-hh+1,x,y+1)
   start=left
  if not stack or stack[-1][1]<cur:stack.append((start,cur))
_,x,y,X,Y=best;assert (X-x)>100 and (Y-y)>80,best
panels=[Image.fromarray(a[y:Y,x:X]) for a in [warped,render]];pw=900;ph=round(pw*(Y-y)/(X-x));out=Image.new('RGB',(pw*2+12,ph+85),'#eee9df');d=ImageDraw.Draw(out)
for i,p in enumerate(panels):out.paste(p.resize((pw,ph),Image.Resampling.LANCZOS),(i*(pw+12),70))
d.text((10,10),'FOTO 29 | aynı zemin izdüşümü',font=font,fill='black');d.text((pw+22,10),'YAKIN RENDER | aynı alan / aynı ölçek',font=font,fill='black');d.text((10,38),'Tahta eni yaklaşık 6 cm; fotoğraf kamera kalibrasyonuna bağlı',font=font,fill='black');out.save(A/'yakin_parke.jpg',quality=96)
(A/'yakin-olcek.json').write_text(json.dumps({'ortak_kirpim':[int(x),int(y),int(X),int(Y)],'foto_to_render_homografi':H.tolist(),'iki_panel_ayni_piksel_alani':True,'tahta_en_m':.06,'emin_degil':'Gerçek kamera/lens bilinmiyor; fotoğraf-model kalibrasyonu yaklaşık.'},indent=1,ensure_ascii=False),encoding='utf-8')
for name,n,box in [('merdiven',18,(120,590,475,920)),('kupeste',34,(670,705,1040,850))]:
 p=Image.open(R/'photogallery'/f'angora_{n:02}.jpg').convert('RGB').crop(box);r=Image.open(A/('detay_'+name+'.png')).convert('RGB');out=Image.new('RGB',(1600,680),'#eee9df');out.paste(ImageOps.contain(p,(790,620)),(0,55));out.paste(ImageOps.contain(r,(790,620)),(805,55));d=ImageDraw.Draw(out);d.text((15,12),f'FOTO {n:02} | {name}',font=font,fill='black');d.text((815,12),'YAKIN RENDER | 1.5 m',font=font,fill='black');out.save(A/('yakin_'+name+'.jpg'),quality=95)
print('[yakin] eş ölçek ortak zemin',best)
