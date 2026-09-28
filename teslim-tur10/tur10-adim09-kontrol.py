from pathlib import Path
import sys,json,math
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');T=Path(r'C:\Users\yigit\angora-tur9');s=R/'tools/blender/08_kontrol_render.py'
sys.argv=['blender','--',str(R),str(W/'adim09/kontrol'),'1,2,11,16,18,21,29,32,34,40,42,47','--ekler',str(R/'build/web/26092026/EKLER.glb'),'--kamera',str(W/'kamera-duzeltme.json'),'--sil',str(W/'silme-kutulari.json'),'--dokular',str(T/'dokular.json'),'--ornek','64']
ns={'__file__':str(s),'__name__':'__main__'};exec(compile(s.read_text(encoding='utf-8'),str(s),'exec'),ns);globals().update(ns)
for ob in scene.objects:
 ob['angora_role']='BUILDING' if ob in arch_objects else ('INTERIOR' if ob in base_objects else ('EKLER' if ob.type=='MESH' else ob.type))
bpy.ops.wm.save_as_mainfile(filepath=str(W/'adim09/kontrol-sahne.blend'))
target=Vector((.85,.9627,6.94));cam.location=(1.95,-1.45,7.72);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam_data.angle=math.radians(44);scene.render.resolution_x=1400;scene.render.resolution_y=1000;scene.view_settings.exposure=2.4;scene.render.filepath=str(W/'adim09/detay_korkuluk.png');bpy.ops.render.render(write_still=True)
print('[A09] SON ve yakin korkuluk tamam',flush=True)
