import sys,json,math,bmesh
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import ortak as o
import bpy
from mathutils import Vector,Matrix
o.basla('A06_')
boxes=json.loads((o.W/'silme-kutulari.json').read_text(encoding='utf-8'));boxes=[b for b in boxes if not b['ad'].startswith('A06_')]
for i,y in enumerate([1.901063,2.159]):
 boxes.append({'ad':f'A06_bodrum_eski_merdiven_yanagi_{i}','katman':'mimari','min':[.43,y-.012,.01],'max':[3.19,y+.012,3.10],'malzemeler':['Simple White Wall'],'normal_axes':[1],'not':'Foto47 ray testinde doğrulanan eski beyaz merdiven yan düzlemi; büyük tavan ve farklı duvar düzlemleri hariç.'})
(o.W/'silme-kutulari.json').write_text(json.dumps(boxes,ensure_ascii=False,indent=1),encoding='utf-8')
# Close the known narrow floor cracks with concealed overlapping slabs underneath existing thresholds.
tile=o.malzeme('M3_Krem_karo_esik',(.55,.49,.39),.48)
wood=o.malzeme('M3_Koyu_ceviz_kapi',(.06,.035,.018),.45)
for ob in list(o.C.objects):
 if ob.name.startswith('A04_K') and 'esik_kapagi' in ob.name:
  pts=[ob.matrix_world@v.co for v in ob.data.vertices];lo=Vector(tuple(min(p[i] for p in pts) for i in range(3)));hi=Vector(tuple(max(p[i] for p in pts) for i in range(3)));c=(lo+hi)/2
  q=o.kutu('A06_'+ob.name+'_alt_doseme',(c.x,c.y,lo.z-.025),(hi.x-lo.x+.08,hi.y-lo.y+.08,.08),tile if c.z<3.2 else wood,.001)
# Joined crown: weld nearly coincident end vertices, without moving wall reference geometry.
for ob in o.C.objects:
 if ob.name=='A05_kartonpiyer_birlesik':
  bm=bmesh.new();bm.from_mesh(ob.data);before=len(bm.verts);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.008);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free();print('[A06] kartonpiyer kaynak',before,len(ob.data.vertices))
# Foto40 glass leaf: hinge on photographed left jamb, opened 55 degrees into the next room.
oldhinge=Vector((2.57-.045,-1.775,3.1116));newhinge=Vector((2.57-.045,-1.775,3.1116));oldang=math.atan2(-math.sin(math.radians(65)),-math.cos(math.radians(65)));newang=math.radians(125)
transform=Matrix.Translation(newhinge)@Matrix.Rotation(newang-oldang,4,'Z')@Matrix.Translation(-oldhinge)
for ob in o.C.objects:
 if ob.name.startswith(('M3G_Kanat','M3G_Floral','M3G_Cam_ara','M3G_Kol','M3G_Mentese')) and not ob.get('adim06_kapi'):
  ob.matrix_world=transform@ob.matrix_world;ob['adim06_kapi']=True
cam=json.loads((o.W/'kamera-duzeltme.json').read_text(encoding='utf-8'));cam['40']={'dx':.46,'dy':-.104,'dz':0,'yaw':-2,'pitch':-3,'hfov':80};(o.W/'kamera-duzeltme.json').write_text(json.dumps(cam,ensure_ascii=False,indent=1),encoding='utf-8')
o.bitir('A06',{'foto':[18,29,34,40,42,47],'beyaz_kalinti':'Işınla belirlenen iki eski yan yüz düzlemi','camli_kapi_acisi':55,'tahta':'stok damar/fotoğraf rengi; basamak derzsiz'})
