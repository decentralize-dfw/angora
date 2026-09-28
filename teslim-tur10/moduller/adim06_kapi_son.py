import sys,math,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import ortak as o
from mathutils import Vector,Matrix
o.basla('A06B_')
transform=Matrix.Translation(Vector((2.525,-1.775,3.1116)))@Matrix.Rotation(math.pi,4,'Z')@Matrix.Translation(-Vector((1.295,-1.775,3.1116)))
for ob in o.C.objects:
 if ob.name.startswith(('M3G_Kanat','M3G_Floral','M3G_Cam_ara','M3G_Kol','M3G_Mentese')) and not ob.get('adim06_kapi_son'):
  ob.matrix_world=transform@ob.matrix_world;ob['adim06_kapi_son']=True
p=o.W/'kamera-duzeltme.json';a=json.loads(p.read_text(encoding='utf-8'));a['40']={'dx':.46,'dy':-.104,'dz':0,'yaw':-2,'pitch':-3,'hfov':80};p.write_text(json.dumps(a,ensure_ascii=False,indent=1),encoding='utf-8')
o.bitir('A06B',{'foto':40,'not':'Fotoğraftaki sol görünen menteşe tarafı, kanat 55 derece; kamera tavan armatürünü de kapsayacak kadar geri.'})
