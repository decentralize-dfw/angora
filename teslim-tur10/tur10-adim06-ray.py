from pathlib import Path
import sys,json
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');s=R/'tools/blender/08_kontrol_render.py'
sys.argv=['blender','--',str(R),str(W/'adim06'),'47','--ekler',str(R/'build/web/26092026/EKLER.glb'),'--kamera',str(W/'kamera-duzeltme.json'),'--sil',str(W/'silme-kutulari.json')]
ns={'__file__':str(s),'__name__':'__main__'};exec(compile(s.read_text(encoding='utf-8').split('for f in FOTOS:')[0],str(s),'exec'),ns);globals().update(ns)
f=47;c=CAMS[f];fx=FIX.get(str(f),{});eye=Vector(tuple(float(c[k])+fx.get(d,0) for k,d in [('blender_x','dx'),('blender_y','dy'),('blender_z','dz')]));look=Vector((float(c['bakis_x']),float(c['bakis_y']),0)).normalized();yaw=math.atan2(look.y,look.x)+math.radians(fx.get('yaw',0));rot=Euler((math.pi/2+math.radians(fx.get('pitch',0)),0,yaw-math.pi/2),'XYZ').to_matrix();hf=math.radians(fx.get('hfov',80));_,(pw,ph)=luma(str(R/c['dosya']));bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();out=[]
for u,v in [(x,y) for x in [.77,.80,.82,.85] for y in [.40,.50,.60,.70,.80]]:
 d=(rot@Vector(((2*u-1)*math.tan(hf/2),(1-2*v)*math.tan(hf/2)*ph/pw,-1))).normalized();hit,pos,n,idx,ob,matrix=scene.ray_cast(deps,eye,d)
 if hit:
  p=ob.data.polygons[idx];out.append({'uv':[u,v],'object':ob.name,'pos':list(pos),'normal':list(n),'material':ob.data.materials[p.material_index].name,'verts':[list(ob.matrix_world@ob.data.vertices[i].co) for i in p.vertices]})
(W/'adim06/ray47.json').write_text(json.dumps(out,indent=1),encoding='utf-8');print('[ray47]',json.dumps(out),flush=True)
