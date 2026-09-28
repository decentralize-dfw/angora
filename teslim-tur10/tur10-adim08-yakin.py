from pathlib import Path
import sys,json,re
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');T=Path(r'C:\Users\yigit\angora-tur9')
script=R/'tools/blender/08_kontrol_render.py'
sys.argv=['blender','--',str(R),str(W/'adim08'),'18','--ekler',str(R/'build/web/26092026/EKLER.glb'),'--kamera',str(W/'kamera-duzeltme.json'),'--sil',str(W/'silme-kutulari.json'),'--dokular',str(T/'dokular.json'),'--ornek','64']
ns={'__file__':str(script),'__name__':'__main__'}
exec(compile(script.read_text(encoding='utf-8').split('for f in FOTOS:')[0],str(script),'exec'),ns)
globals().update(ns)
settings=[('ceviz',16,(.55,.45),'20'),('kiraz',21,(.70,.45),'21'),('mutfak_cerceve',1,(.62,.78),'22'),('terrakota',1,(.25,.88),'26'),('seramik',32,(.62,.92),'27')]
exp={int(a):float(b) for a,b in re.findall(r'\[kontrol\] render (\d+) pozlama ([\d.-]+)',(W/'adim08-kontrol.log').read_text(encoding='utf-8',errors='replace'))}
report=[]
for name,f,uv,matid in settings:
 c=CAMS[f];fx=FIX.get(str(f),{});eye=Vector(tuple(float(c[k])+fx.get(d,0) for k,d in [('blender_x','dx'),('blender_y','dy'),('blender_z','dz')]))
 look=Vector((float(c['bakis_x']),float(c['bakis_y']),0)).normalized();yaw=math.atan2(look.y,look.x)+math.radians(fx.get('yaw',0));pitch=math.radians(fx.get('pitch',0))
 rot=Euler((math.pi/2+pitch,0,yaw-math.pi/2),'XYZ').to_matrix();hf=math.radians(fx.get('hfov',80));_,(pw,ph)=luma(str(R/c['dosya']))
 bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();candidates=[]
 for iy in range(4,97,2):
  for ix in range(4,97,2):
   u,v=ix/100,iy/100;direc=(rot@Vector(((2*u-1)*math.tan(hf/2),(1-2*v)*math.tan(hf/2)*ph/pw,-1))).normalized()
   hit,pos,norm,idx,obj,matrix=scene.ray_cast(deps,eye,direc)
   if not hit or idx<0:continue
   mat=obj.data.materials[obj.data.polygons[idx].material_index] if obj.data.materials else None
   if mat and mat.name.startswith('FOTO_'+matid+'_'):
    candidates.append(((u-uv[0])**2+(v-uv[1])**2,pos.copy(),direc.copy(),mat.name,(u,v)))
 if not candidates:raise RuntimeError('Yakın plan malzemesi bulunamadı: '+name)
 _,target,direction,material,pixel=min(candidates,key=lambda a:a[0]);cam.location=target-direction*1.5;cam.rotation_euler=direction.to_track_quat('-Z','Y').to_euler();cam_data.angle=math.radians(42)
 scene.render.resolution_x=1000;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.view_settings.exposure=exp.get(f,3);cy.samples=64
 if name=='parke':
  from bpy_extras.object_utils import world_to_camera_view
  correspond=[]
  for px,py in [(40,950),(750,950),(750,1190),(40,1190)]:
   ray=(rot@Vector(((2*px/pw-1)*math.tan(hf/2),(1-2*py/ph)*math.tan(hf/2)*ph/pw,-1))).normalized()
   ground=eye+ray*((9.4705-eye.z)/ray.z)
   projected=world_to_camera_view(scene,cam,ground)
   correspond.append({'foto_px':[px,py],'render_px':[projected.x*1000,(1-projected.y)*800],'world':list(ground)})
  (W/'adim08/es-olcek-homografi.json').write_text(json.dumps(correspond,indent=1),encoding='utf-8')
 scene.render.filepath=str(W/'adim08'/('detay_'+name+'.png'));bpy.ops.render.render(write_still=True)
 rec={'malzeme':name,'foto':f,'kaynak_pixel':pixel,'kamera':list(cam.location),'hedef':list(target),'mesafe_m':1.5,'materyal':material,'pozlama':scene.view_settings.exposure};report.append(rec);print('[yakin]',rec,flush=True)
(W/'adim08/yakin-kameralar.json').write_text(json.dumps(report,ensure_ascii=False,indent=1),encoding='utf-8')

