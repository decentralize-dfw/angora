from pathlib import Path
import sys,json
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');s=R/'tools/blender/08_kontrol_render.py'
sys.argv=['blender','--',str(R),str(W/'adim06'),'47','--ekler',str(R/'build/web/26092026/EKLER.glb'),'--kamera',str(W/'kamera-duzeltme.json'),'--sil',str(W/'silme-kutulari.json')]
ns={'__file__':str(s),'__name__':'__main__'};exec(compile(s.read_text(encoding='utf-8').split('for f in FOTOS:')[0],str(s),'exec'),ns);globals().update(ns)

import numpy as np
r=next(r for r in json.loads((W/'adim06/yakin-kameralar.json').read_text(encoding='utf-8')) if r['malzeme']=='parke');eye=Vector(r['kamera']);forward=(Vector(r['hedef'])-eye).normalized();right=forward.cross(Vector((0,0,1))).normalized();up=right.cross(forward);bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();out=[]
for x in [400,500,600,700,800]:
 for y in range(500,751,2):
  d=(forward+right*((2*x/1000-1)*math.tan(math.radians(42)/2))+up*((1-2*y/800)*math.tan(math.radians(42)/2)*.8)).normalized();hit,pos,n,idx,ob,matrix=scene.ray_cast(deps,eye,d)
  if hit:
   p=ob.data.polygons[idx];out.append({'pixel':[x,y],'object':ob.name,'z':pos.z,'pos':list(pos),'mat':ob.data.materials[p.material_index].name})
(W/'adim06/parke-cizgi-ray.json').write_text(json.dumps(out,indent=1),encoding='utf-8');print('[parke-ray]',len(out))
