from pathlib import Path
import sys,json
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');s=R/'tools/blender/08_kontrol_render.py'
sys.argv=['blender','--',str(R),str(W/'adim08'),'47','--ekler',str(R/'build/web/26092026/EKLER.glb'),'--kamera',str(W/'kamera-duzeltme.json'),'--sil',str(W/'silme-kutulari.json')]
ns={'__file__':str(s),'__name__':'__main__'};exec(compile(s.read_text(encoding='utf-8').split('for f in FOTOS:')[0],str(s),'exec'),ns);globals().update(ns)

out=[]
for f in [1,2,6,11,13,16,18,21,32,40,41,47]:
 c=CAMS[f];fx=FIX.get(str(f),{});eye=Vector(tuple(float(c[k])+fx.get(d,0) for k,d in [('blender_x','dx'),('blender_y','dy'),('blender_z','dz')]));look=Vector((float(c['bakis_x']),float(c['bakis_y']),0)).normalized();yaw=math.atan2(look.y,look.x)+math.radians(fx.get('yaw',0));rot=Euler((math.pi/2+math.radians(fx.get('pitch',0)),0,yaw-math.pi/2),'XYZ').to_matrix();hf=math.radians(fx.get('hfov',80));_,(pw,ph)=luma(str(R/c['dosya']));bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
 for u,v in [(x/10,y/10) for x in range(1,10) for y in range(1,10)]:
  d=(rot@Vector(((2*u-1)*math.tan(hf/2),(1-2*v)*math.tan(hf/2)*ph/pw,-1))).normalized();hit,pos,n,idx,ob,matrix=scene.ray_cast(deps,eye,d)
  if hit and idx>=0:
   p=ob.data.polygons[idx];out.append({'foto':f,'uv':[u,v],'object':ob.name,'pos':list(pos),'normal':list(n),'material':ob.data.materials[p.material_index].name})
(W/'adim08/ray.json').write_text(json.dumps(out,indent=1),encoding='utf-8');print('[ray]',len(out))
